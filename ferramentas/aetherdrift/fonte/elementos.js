/* =====================================================================
   ELEMENTOS — peças reutilizáveis que as fases combinam:
   GradeFluxo (prismas de luz que giram), Arcos (de brisa, para o carro,
   ou do céu, para o voo), Termica (corrente de ar que sobe), Elevador,
   PonteGiratoria, Pedestal, Farol (feixe que mostra onde ir), Portal,
   rampa de brisa e efeitos de brilho.
   Toda peça tem atualizar(dt, jogador, t).
   ===================================================================== */
const N_ = 1, L_ = 2, S_ = 4, O_ = 8;                       // norte, leste, sul, oeste (bits)
const DIRS = [[N_, 0, -1], [L_, 1, 0], [S_, 0, 1], [O_, -1, 0]];
const girarMask = (m, r) => { for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const oposto = d => ((d << 2) | (d >> 2)) & 15;

// material que acende: cor apagada → cor acesa com brilho próprio
function matAcende(apagada, acesa) {
  const m = new THREE.MeshLambertMaterial({ color: apagada, emissive: acesa, emissiveIntensity: 0, flatShading: true });
  m.userData = { apagada: new THREE.Color(apagada), acesa: new THREE.Color(acesa), nivel: 0, alvo: 0 };
  return m;
}
function animarAcende(m, dt, pulso = 0) {
  const u = m.userData; u.nivel += (u.alvo - u.nivel) * (1 - Math.exp(-6 * dt));
  m.color.copy(u.apagada).lerp(u.acesa, u.nivel); m.emissiveIntensity = u.nivel * (0.75 + pulso);
}

// ---------- Efeitos: faíscas que sobem e somem ----------
class Efeitos {
  constructor(cena) {
    this.N = 400; this.i = 0;
    const geo = new THREE.BufferGeometry(); this.pos = new Float32Array(this.N * 3).fill(-9999); this.cor = new Float32Array(this.N * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.cor, 3));
    this.v = new Float32Array(this.N * 3); this.vida = new Float32Array(this.N);
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d');
    const gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.7, map: new THREE.CanvasTexture(cv), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.pts.frustumCulled = false; cena.add(this.pts); this.geo = geo; this.c = new THREE.Color();
  }
  explodir(x, y, z, cor = '#ffd98a', n = 30, forca = 4) {
    this.c.set(cor);
    for (let k = 0; k < n; k++) {
      const i = this.i = (this.i + 1) % this.N, a = Math.random() * TAU, e = Math.random() * 0.9 + 0.1;
      this.pos.set([x, y, z], i * 3);
      this.v.set([Math.cos(a) * forca * e, Math.random() * forca * 0.9 + 1, Math.sin(a) * forca * e], i * 3);
      this.cor.set([this.c.r, this.c.g, this.c.b], i * 3); this.vida[i] = 1 + Math.random() * 0.6;
    }
  }
  atualizar(dt) {
    for (let i = 0; i < this.N; i++) {
      if (this.vida[i] <= 0) continue;
      this.vida[i] -= dt;
      if (this.vida[i] <= 0) { this.pos[i * 3 + 1] = -9999; continue; }
      for (let a = 0; a < 3; a++) this.pos[i * 3 + a] += this.v[i * 3 + a] * dt;
      this.v[i * 3] *= 0.97; this.v[i * 3 + 2] *= 0.97; this.v[i * 3 + 1] = this.v[i * 3 + 1] * 0.97 - 0.6 * dt;
      const f = 1 - dt * 0.9; this.cor[i * 3] *= f; this.cor[i * 3 + 1] *= f; this.cor[i * 3 + 2] *= f;   // apaga devagar
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}

// =====================================================================
// GRADE DE FLUXO — leve a luz do cristal-fonte até o cristal-receptor
// girando as peças (cada peça acesa toca uma nota mais alta)
// =====================================================================
class GradeFluxo {
  // o = { x, y, z, tam, pecas: [[máscara,...] por linha], entrada:[col,lin], saida:[col,lin], aoResolver,
  //       yaw (gira a grade inteira), corApagada, corAcesa, corFonte, corFaisca (tema: luz ou água) }
  constructor(raiz, o, efeitos) {
    this.o = o = Object.assign({ yaw: 0, corApagada: '#cfa984', corAcesa: '#ffc65e', corFonte: '#ffd27a', corFaisca: '#ffd98a' }, o);
    this.ef = efeitos; this.g = new THREE.Group(); this.g.position.set(o.x, o.y, o.z); this.g.rotation.y = o.yaw; raiz.add(this.g);
    this.lin = o.pecas.length; this.col = o.pecas[0].length; this.pecas = []; this.alvos = []; this.acesas = new Set(); this.resolvida = false;
    const T = o.tam, geoLaje = new THREE.BoxGeometry(T * 0.9, 0.36, T * 0.9), geoHub = new THREE.CylinderGeometry(0.34, 0.34, 0.16, 8);
    for (let r = 0; r < this.lin; r++) for (let c = 0; c < this.col; c++) {
      const base = o.pecas[r][c], grupo = new THREE.Group();
      grupo.position.set((c - (this.col - 1) / 2) * T, 0, (r - (this.lin - 1) / 2) * T); this.g.add(grupo);
      const laje = new THREE.Mesh(geoLaje, MAT((r + c) % 2 ? '#fbf3e4' : '#f5ead6')); laje.position.y = 0.18; laje.receiveShadow = true; grupo.add(laje);
      if (!base) continue;
      const mat = matAcende(o.corApagada, o.corAcesa), giro = new THREE.Group(); giro.position.y = 0.36; grupo.add(giro);
      const hub = new THREE.Mesh(geoHub, mat); hub.position.y = 0.08; giro.add(hub);
      for (const [d, dx, dz] of DIRS) if (base & d) {
        const braco = new THREE.Mesh(new THREE.BoxGeometry(dx ? T * 0.46 : 0.36, 0.15, dz ? T * 0.46 : 0.36), mat);
        braco.position.set(dx * T * 0.23, 0.075, dz * T * 0.23); giro.add(braco);
      }
      // embaralha: cada peça começa girada 1 a 3 vezes
      const rot = 1 + Math.floor(rnd() * 3), p = { c, r, base, rot, giro, mat, ang: -rot * Math.PI / 2, alvo: -rot * Math.PI / 2, laje };
      giro.rotation.y = p.ang;
      for (const m of [laje, hub, ...giro.children]) { m.userData.peca = p; m.userData.grade = this; this.alvos.push(m); }
      this.pecas.push(p);
    }
    // cristais nas bordas
    const borda = ([c, r], lado) => new THREE.Vector3((c - (this.col - 1) / 2 + lado * 0.95) * T, 0, (r - (this.lin - 1) / 2) * T);
    this.fonte = this.cristal(borda(o.entrada, -1), o.corFonte, true);
    this.receptor = this.cristal(borda(o.saida, 1), '#efe6d6', false);
    this.atualizarFluxo(true);
    if (this.resolvida) {   // se o embaralho resolveu por acaso, gira uma peça do caminho
      const p = this.pecas[0]; p.rot = (p.rot + 1) % 4; p.ang = p.alvo = -p.rot * Math.PI / 2; p.giro.rotation.y = p.ang; this.resolvida = false; this.atualizarFluxo(true);
    }
  }
  cristal(pos, cor, aceso) {
    const g = new THREE.Group(); g.position.copy(pos); this.g.add(g);
    const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 6), MAT('#fffaf1')); pe.position.y = 0.6; pe.castShadow = true;
    const mat = matAcende(cor, this.o.corAcesa); mat.userData.alvo = aceso ? 1 : 0;
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), mat); cr.position.y = 2.1; cr.castShadow = true;
    g.add(pe, cr); return { g, cr, mat };
  }
  peca(c, r) { return this.pecas.find(p => p.c === c && p.r === r); }
  mascara(p) { return girarMask(p.base, p.rot); }
  fluir() {
    const ordem = [], vis = new Set(), p0 = this.peca(...this.o.entrada);
    if (!p0 || !(this.mascara(p0) & O_)) return { ordem, ok: false };
    const fila = [p0]; vis.add(p0);
    while (fila.length) {
      const p = fila.shift(), m = this.mascara(p); ordem.push(p);
      for (const [d, dx, dz] of DIRS) if (m & d) {
        const n = this.peca(p.c + dx, p.r + dz);
        if (n && !vis.has(n) && (this.mascara(n) & oposto(d))) { vis.add(n); fila.push(n); }
      }
    }
    const ps = this.peca(...this.o.saida);
    return { ordem, ok: vis.has(ps) && !!(this.mascara(ps) & L_) };
  }
  atualizarFluxo(silencioso) {
    const { ordem, ok } = this.fluir();
    let novas = 0;
    ordem.forEach((p, i) => { if (!this.acesas.has(p) && !silencioso) Som.conectar(i, novas++ * 0.09); });
    this.acesas = new Set(ordem);
    for (const p of this.pecas) p.mat.userData.alvo = this.acesas.has(p) ? 1 : 0;
    if (ok && !this.resolvida) {
      this.resolvida = true;
      if (!silencioso) {
        this.receptor.mat.userData.alvo = 1;
        const w = this.receptor.cr.getWorldPosition(new THREE.Vector3());
        setTimeout(() => { this.ef.explodir(w.x, w.y, w.z, this.o.corFaisca, 60, 6); if (this.o.aoResolver) this.o.aoResolver(); }, novas * 90 + 250);
      }
    }
  }
  girar(p) {
    if (this.resolvida) return false;
    p.rot = (p.rot + 1) % 4; p.alvo -= Math.PI / 2;
    Som.girar(this.acesas.size);
    this.atualizarFluxo(false);
    return true;
  }
  // peça debaixo dos pés (tecla E)
  pecaEm(x, z) {
    const T = this.o.tam, dx = x - this.o.x, dz = z - this.o.z, co = Math.cos(this.o.yaw), si = Math.sin(this.o.yaw);
    const lx = dx * co - dz * si, lz = dx * si + dz * co;   // para as coordenadas da grade (que pode estar girada)
    const c =Math.round(lx / T + (this.col - 1) / 2), r = Math.round(lz / T + (this.lin - 1) / 2);
    return this.peca(c, r);
  }
  atualizar(dt, jog, t) {
    for (const p of this.pecas) {
      p.ang += (p.alvo - p.ang) * (1 - Math.exp(-16 * dt)); p.giro.rotation.y = p.ang;
      animarAcende(p.mat, dt, this.resolvida ? Math.sin(t * 2 + p.c + p.r) * 0.25 : 0);
    }
    for (const k of [this.fonte, this.receptor]) { k.cr.rotation.y += dt * 0.8; k.cr.position.y = 2.1 + Math.sin(t * 1.5) * 0.12; animarAcende(k.mat, dt, Math.sin(t * 3) * 0.15); }
  }
}

// =====================================================================
// ARCOS — anéis que acendem quando se passa por dentro
//   modo 'carro' (arcos de brisa na estrada) ou 'voo' (anéis do céu)
// =====================================================================
class Arcos {
  // lista: [{x,y,z,yaw}] (y = centro do anel) · o = { modo, raio, aoPassar(i,n), aoCompletar, aoErrarModo }
  constructor(raiz, lista, o) {
    this.o = Object.assign({ raio: 4.2, tubo: 0.34 }, o); this.itens = []; this.feitos = 0; this.completo = false;
    const geo = new THREE.TorusGeometry(this.o.raio, this.o.tubo, 8, 40);
    for (const a of lista) {
      const g = new THREE.Group(); g.position.set(a.x, a.y, a.z); g.rotation.y = a.yaw; raiz.add(g);
      const mat = matAcende(o.modo === 'voo' ? '#fff7ea' : '#fbf1de', '#ffc65e');
      const anel = new THREE.Mesh(geo, mat); anel.castShadow = true; g.add(anel);
      // véu interno: brilha um instante quando se passa
      const veu = new THREE.Mesh(new THREE.CircleGeometry(this.o.raio - 0.2, 32), new THREE.MeshBasicMaterial({ color: '#fff4d0', transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
      g.add(veu);
      if (o.modo === 'carro') for (const s of [-1, 1]) {   // pés de pedra para os arcos da estrada
        const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, a.y, 6), MAT('#f1e2c8')); pe.position.set(s * this.o.raio, -a.y / 2, 0); pe.castShadow = true; g.add(pe);
      }
      this.itens.push({ ...a, g, mat, veu, feito: false, flash: 0, avisado: 0 });
    }
  }
  atualizar(dt, jog, t) {
    const cx = jog.pos.x, cy = jog.pos.y + (jog.modo === 'carro' ? 0.9 : 1.0), cz = jog.pos.z;
    this.itens.forEach((a, i) => {
      animarAcende(a.mat, dt, a.feito ? Math.sin(t * 2 + i) * 0.2 : 0);
      a.flash = Math.max(0, a.flash - dt * 1.5); a.veu.material.opacity = 0.08 + a.flash * 0.5;
      if (!a.feito) a.g.children[0].rotation.z = Math.sin(t * 0.7 + i) * 0.05;
      if (a.feito) return;
      const dx = cx - a.x, dy = cy - a.y, dz = cz - a.z, s = Math.sin(a.yaw), c = Math.cos(a.yaw);
      const frente = dx * s + dz * c, lado = dx * c - dz * s, radial = Math.hypot(lado, dy);
      if (Math.abs(frente) < 1.8 && radial < this.o.raio - 0.2) {
        if (jog.modo !== this.o.modo) { if (t - a.avisado > 6) { a.avisado = t; if (this.o.aoErrarModo) this.o.aoErrarModo(); } return; }
        a.feito = true; a.flash = 1; a.mat.userData.alvo = 1; this.feitos++;
        Som.arco(this.feitos - 1);
        if (this.o.aoPassar) this.o.aoPassar(i, this.feitos, a);
        if (this.feitos === this.itens.length && !this.completo) { this.completo = true; if (this.o.aoCompletar) setTimeout(this.o.aoCompletar, 500); }
      }
    });
  }
}

// =====================================================================
// TÉRMICA — coluna de ar quente que levanta quem está planando
// =====================================================================
class Termica {
  constructor(raiz, { x, z, base, topo, raio = 6.5, forca = 7.5 }) {
    Object.assign(this, { x, z, base, topo, raio, forca });
    const alt = topo - base;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio * 1.15, alt, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: '#fff1d2', transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    col.position.set(x, base + alt / 2, z); raiz.add(col); this.col = col;
    // espiral de partículas subindo
    this.N = 260; this.dados = new Float32Array(this.N * 3); const pos = new Float32Array(this.N * 3);
    for (let i = 0; i < this.N; i++) { this.dados[i * 3] = rnd() * TAU; this.dados[i * 3 + 1] = rnd() * raio; this.dados[i * 3 + 2] = rnd() * alt; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.geo = geo;
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#fff3d0', size: 0.6, map: texturaBrilho(), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.position.set(x, base, z); pts.frustumCulled = false; raiz.add(pts);
  }
  atualizar(dt, jog, t) {
    const pos = this.geo.attributes.position.array, alt = this.topo - this.base;
    for (let i = 0; i < this.N; i++) {
      let a = this.dados[i * 3] + dt * 0.9, h = this.dados[i * 3 + 2] + dt * (5 + (i % 5));
      if (h > alt) h -= alt;
      this.dados[i * 3] = a; this.dados[i * 3 + 2] = h;
      const r = this.dados[i * 3 + 1];
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = h; pos[i * 3 + 2] = Math.sin(a) * r;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.col.material.opacity = 0.08 + Math.sin(t * 1.3) * 0.025;
    if (jog.modo === 'voo') {
      const d = Math.hypot(jog.pos.x - this.x, jog.pos.z - this.z);
      if (d < this.raio + 1 && jog.pos.y > this.base - 3 && jog.pos.y < this.topo + 3) {
        const f = this.forca * (1 - suave(this.topo - 8, this.topo + 2, jog.pos.y)) * (1 - suave(this.raio - 1, this.raio + 1, d));
        jog.termica = Math.max(jog.termica, f);
      }
    }
  }
  perto(jog, folga = 10) { return Math.hypot(jog.pos.x - this.x, jog.pos.z - this.z) < this.raio + folga; }
}

// =====================================================================
// ELEVADOR — sobe quando alguém pisa, desce sozinho depois
// =====================================================================
class Elevador {
  constructor(raiz, { x, z, yaw = 0, hx = 2, hz = 2, baixo, alto, vel = 4.5 }) {
    Object.assign(this, { baixo, alto, vel }); this.espera = 0;
    this.sup = new Superficie({ tipo: 'caixa', x, z, yaw, hx, hz, topo: baixo, movel: true });
    this.g = new THREE.Group(); this.g.position.set(x, baixo, z); this.g.rotation.y = yaw; raiz.add(this.g);
    const piso = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, 0.4, hz * 2), MAT('#fffaf1')); piso.position.y = -0.2; piso.castShadow = piso.receiveShadow = true;
    const borda = new THREE.Mesh(new THREE.BoxGeometry(hx * 2 + 0.2, 0.12, hz * 2 + 0.2), MAT('#9fd8c0')); borda.position.y = -0.42;
    this.luz = matAcende('#cfe9dc', '#ffd27a');
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), this.luz); gema.position.set(0, 0.5, 0);
    this.g.add(piso, borda, gema); this.gema = gema;
    // trilhos do elevador
    for (const s of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, alto - baixo + 3, 6), MAT('#f1e2c8'));
      const c = Math.cos(yaw), sn = Math.sin(yaw), lx = s * (hx + 0.35);
      t.position.set(x + lx * c, (alto + baixo) / 2 + 1, z - lx * sn); t.castShadow = true; raiz.add(t);
    }
  }
  atualizar(dt, jog, t) {
    const em = jog.noChao && jog.sup === this.sup && jog.modo !== 'voo';
    const s = this.sup; let alvo;
    if (em) { this.espera = 2.5; alvo = this.alto; } else if (this.espera > 0) { this.espera -= dt; alvo = s.topo; } else alvo = this.baixo;
    const passo = lim(alvo - s.topo, -this.vel * dt, this.vel * dt);
    s.dy = passo; s.topo += passo; this.g.position.y = s.topo;
    this.luz.userData.alvo = Math.abs(passo) > 1e-4 ? 1 : 0.3; animarAcende(this.luz, dt);
    this.gema.rotation.y += dt;
  }
}

// =====================================================================
// PONTE GIRATÓRIA — passarela branca que gira devagar até seu lugar
// =====================================================================
class PonteGiratoria {
  constructor(raiz, { x, z, y, comp, larg = 4, yaw0, yaw1 }) {
    Object.assign(this, { yaw1 }); this.girando = false;
    this.sup = new Superficie({ tipo: 'caixa', x, z, yaw: yaw0, hx: larg / 2, hz: comp / 2, topo: y });
    this.g = new THREE.Group(); this.g.position.set(x, y, z); this.g.rotation.y = yaw0; raiz.add(this.g);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(larg, 0.5, comp), MAT('#fffaf1')); deck.position.y = -0.25; deck.castShadow = deck.receiveShadow = true;
    const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, comp - 1), matAcende('#f1e2c8', '#ffd27a')); faixa.position.y = 0.02; this.faixa = faixa.material;
    this.g.add(deck, faixa);
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, comp), MAT('#f6c9a4')); c.position.set(s * (larg / 2 - 0.1), 0.3, 0); this.g.add(c); }
    const pivo = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, y + 3, 8), MAT('#f1e2c8')); pivo.position.set(x, (y - 3) / 2 - 0.5, z); raiz.add(pivo);
  }
  girar() { this.girando = true; this.faixa.userData.alvo = 1; Som.ponte(); }
  atualizar(dt) {
    animarAcende(this.faixa, dt);
    if (!this.girando) return;
    const d = this.yaw1 - this.sup.yaw, passo = lim(d, -0.45 * dt, 0.45 * dt);
    this.sup.yaw += passo; this.g.rotation.y = this.sup.yaw;
    if (Math.abs(d) < 1e-4) this.girando = false;
  }
}

// =====================================================================
// PEDESTAL — cristal que acende ao ser tocado
// =====================================================================
class Pedestal {
  constructor(raiz, { x, y, z, aoTocar }) {
    Object.assign(this, { x, y, z, aoTocar }); this.feito = false;
    this.g = new THREE.Group(); this.g.position.set(x, y, z); raiz.add(this.g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.1, 8), MAT('#fffaf1')); base.position.y = 0.55; base.castShadow = true;
    this.mat = matAcende('#e9f3ec', '#ffc65e');
    this.cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), this.mat); this.cr.position.y = 2.5; this.cr.castShadow = true;
    this.g.add(base, this.cr);
    new Superficie({ tipo: 'cil', x, z, r: 1.3, topo: y + 1.1, solido: true, baixo: y });
  }
  atualizar(dt, jog, t) {
    this.cr.rotation.y += dt * (this.feito ? 1.6 : 0.6); this.cr.position.y = 2.5 + Math.sin(t * 1.4) * 0.18;
    animarAcende(this.mat, dt, this.feito ? Math.sin(t * 3) * 0.2 : 0);
    if (this.feito) return;
    if (Math.hypot(jog.pos.x - this.x, jog.pos.z - this.z) < 2.9 && Math.abs(jog.pos.y - this.y) < 3) {
      this.feito = true; this.mat.userData.alvo = 1; if (this.aoTocar) this.aoTocar();
    }
  }
}

// =====================================================================
// FAROL — feixe de luz alto que mostra de longe onde há um elo apagado
// =====================================================================
class Farol {
  constructor(raiz, x, y, z) {
    this.mat = new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 170, 12, 1, true), this.mat); this.m.position.set(x, y + 85, z); raiz.add(this.m);
    this.aceso = false; this.fase = rnd() * TAU;
  }
  acender() { this.aceso = true; this.mat.color.set('#ffc861'); }
  atualizar(dt, jog, t) {
    this.mat.opacity = this.aceso ? 0.13 : 0.15 + Math.sin(t * 1.6 + this.fase) * 0.06;
    const s = this.aceso ? 0.55 : 1; this.m.scale.x = this.m.scale.z = s;
  }
}

// =====================================================================
// PORTAL — três pilares (um por elo) e o anel que abre a próxima fase
// =====================================================================
class Portal {
  constructor(raiz, { x, y, z, yaw = 0, elos }) {
    Object.assign(this, { x, y, z }); this.aberto = false; this.abrindo = 0; this.pilares = {};
    this.g = new THREE.Group(); this.g.position.set(x, y, z); raiz.add(this.g);
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.6, 0.6, 24), MAT('#fffaf1')); dais.position.y = 0.3; dais.receiveShadow = true;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(9.1, 0.14, 4, 48), MAT('#f6c9a4')); aro.rotation.x = Math.PI / 2; aro.position.y = 0.6;
    this.g.add(dais, aro);
    new Superficie({ tipo: 'cil', x, z, r: 9.4, topo: y + 0.6 });
    // anel do portal
    const quadro = new THREE.Group(); quadro.position.y = 0.6; quadro.rotation.y = yaw; this.g.add(quadro);
    this.anelMat = matAcende('#f7ecd8', '#ffc65e');
    const anel = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.42, 10, 48), this.anelMat); anel.position.y = 4.3; anel.castShadow = true;
    for (const s of [-1, 1]) { const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 6), MAT('#fffaf1')); pe.position.set(s * 2.4, 0.6, 0); quadro.add(pe); }
    // disco do portal: redemoinho suave de pêssego, menta e ouro
    this.disco = new THREE.Mesh(new THREE.CircleGeometry(3.25, 48), new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: { t: { value: 0 }, a: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float t, a; varying vec2 vUv;
        void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0, ang = atan(p.y, p.x);
          float w = sin(ang * 3.0 + t * 0.9 - r * 6.0) * 0.5 + 0.5;
          vec3 c = mix(vec3(1.0, 0.86, 0.72), vec3(0.72, 0.92, 0.84), w);
          c = mix(c, vec3(1.0, 0.95, 0.8), smoothstep(0.5, 0.0, r));
          gl_FragColor = vec4(c, a * smoothstep(1.0, 0.75, r) * 0.92); }`,
    }));
    this.disco.position.y = 4.3; this.disco.scale.setScalar(0.001); quadro.add(anel, this.disco);
    // pilares dos elos ao redor
    elos.forEach((nome, i) => {
      const a = Math.PI + (i - (elos.length - 1) / 2) * 1.3, px = Math.sin(a + yaw) * 7, pz = Math.cos(a + yaw) * 7;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 3.6, 6), MAT('#fbf1de')); pil.position.set(px, 2.4, pz); pil.castShadow = true;
      const mat = matAcende('#e6dccb', '#ffc65e');
      const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), mat); cr.position.set(px, 5, pz);
      this.g.add(pil, cr); this.pilares[nome] = { cr, mat };
      new Superficie({ tipo: 'cil', x: x + px, z: z + pz, r: 0.85, topo: y + 4.2, solido: true, baixo: y });
    });
  }
  acender(nome) { const p = this.pilares[nome]; if (p) p.mat.userData.alvo = 1; }
  abrir() { this.aberto = true; this.anelMat.userData.alvo = 1; }
  atualizar(dt, jog, t) {
    for (const k in this.pilares) { const p = this.pilares[k]; p.cr.rotation.y += dt; animarAcende(p.mat, dt, Math.sin(t * 2) * 0.15); }
    animarAcende(this.anelMat, dt, this.aberto ? Math.sin(t * 2) * 0.2 : 0);
    if (this.aberto) this.abrindo = Math.min(1, this.abrindo + dt * 0.5);
    const e = 1 - Math.pow(1 - this.abrindo, 3);
    this.disco.scale.setScalar(Math.max(0.001, e)); this.disco.material.uniforms.a.value = e; this.disco.material.uniforms.t.value = t;
  }
  dentro(jog) {
    return this.aberto && this.abrindo > 0.6 && Math.hypot(jog.pos.x - this.x, jog.pos.z - this.z) < 3 && Math.abs(jog.pos.y - (this.y + 0.6)) < 4;
  }
}

// rampa de brisa para o carro (cunha verde-menta que dá um pulo macio)
function rampaBrisa(raiz, { x, z, yaw, y0, comp = 7, larg = 5.2, alt = 1.3 }) {
  new Superficie({ tipo: 'rampa', x, z, yaw, hx: larg / 2, hz: comp / 2, h0: y0, h1: y0 + alt, brisa: true });
  const forma = new THREE.Shape(); forma.moveTo(-comp / 2, 0); forma.lineTo(comp / 2, 0); forma.lineTo(comp / 2, alt); forma.lineTo(-comp / 2, 0);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: larg, bevelEnabled: false }); geo.rotateY(-Math.PI / 2); geo.translate(larg / 2, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#a8e0c8', emissive: '#bff2dc', emissiveIntensity: 0.25, flatShading: true }));
  m.position.set(x, y0 - 0.02, z); m.rotation.y = yaw; m.castShadow = m.receiveShadow = true; raiz.add(m);
  // setas brancas pintadas na rampa
  for (let k = 0; k < 2; k++) for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 1.4), MAT('#ffffff')); const lz = -1.2 + k * 2.2, h = y0 + alt / 2 + 0.05;
    b.position.set(s * 0.45, 0, 0); b.rotation.y = s * 0.6;
    const g = new THREE.Group(); g.position.set(x, h, z); g.rotation.order = 'YXZ'; g.rotation.y = yaw; g.rotation.x = -Math.atan2(alt, comp);
    const off = new THREE.Group(); off.position.z = lz; off.add(b); g.add(off); raiz.add(g);
  }
}

// =====================================================================
// ÁGUA CORRENTE — textura que escorre, canais e cascatas
// =====================================================================
let _texAgua = null;
function texturaAgua() {
  if (_texAgua) return _texAgua;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const cx = cv.getContext('2d');
  cx.fillStyle = '#86d8d0'; cx.fillRect(0, 0, 64, 128);
  cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 2;
  for (let k = 0; k < 7; k++) {          // fios de espuma ondulando
    cx.beginPath(); const x0 = 6 + k * 9;
    for (let y = 0; y <= 128; y += 4) { const x = x0 + Math.sin(y / 128 * TAU * 2 + k) * 3; if (y) cx.lineTo(x, y); else cx.moveTo(x, y); }
    cx.globalAlpha = 0.35 + (k % 3) * 0.2; cx.stroke();
  }
  cx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (_texAgua = t);
}
class CanalAgua {
  // pts: [[x,y,z], ...] em ordem da correnteza · cheio: já começa com água
  constructor(raiz, pts, { largura = 1.8, cheio = false, calha = true, vel = 1 } = {}) {
    this.vel = vel; this.nivel = cheio ? 1 : 0; this.alvo = this.nivel;
    const pos = [], uv = [], idx = [], base = []; let s = 0, lado = [1, 0];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], tz = b[2] - a[2], l = Math.hypot(tx, tz);
      if (l > 0.01) lado = [-tz / l, tx / l];
      if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      for (const k of [-1, 1]) {
        pos.push(p[0] + lado[0] * k * largura / 2, p[1], p[2] + lado[1] * k * largura / 2); uv.push(k < 0 ? 0 : 1, s / 5);
        base.push(p[0] + lado[0] * k * (largura / 2 + 0.45), p[1] - 0.12, p[2] + lado[1] * k * (largura / 2 + 0.45));
      }
      if (i) { const q = (i - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    this.tex = texturaAgua().clone(); this.tex.needsUpdate = true;
    this.mat = new THREE.MeshLambertMaterial({ map: this.tex, transparent: true, opacity: this.nivel * 0.92, emissive: '#7fd6cf', emissiveIntensity: 0.25, side: THREE.DoubleSide, depthWrite: false });
    this.m = new THREE.Mesh(geo, this.mat); this.m.renderOrder = 2; raiz.add(this.m);
    if (calha) {
      const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(base, 3)); g2.setIndex(idx); g2.computeVertexNormals();
      const c = new THREE.Mesh(g2, new THREE.MeshLambertMaterial({ color: '#e9cfa8', side: THREE.DoubleSide })); c.receiveShadow = true; raiz.add(c);
    }
  }
  encher() { this.alvo = 1; }
  atualizar(dt) {
    this.tex.offset.y -= dt * 0.9 * this.vel;
    this.nivel += (this.alvo - this.nivel) * (1 - Math.exp(-1.5 * dt)); this.mat.opacity = this.nivel * 0.92;
    this.m.visible = this.nivel > 0.01;
  }
}

// =====================================================================
// CISTERNA — tanque de pedra com uma balsa: com água, a balsa sobe
// levando quem estiver em cima (elevador de água)
// =====================================================================
class Cisterna {
  constructor(raiz, { x, z, lado = 4.5, baixo, alto, vel = 3.4, aoSeca }) {
    Object.assign(this, { x, z, baixo, alto, vel, aoSeca }); this.ativa = false; this.espera = 0; this.avisou = -99;
    const L = lado, esp = 0.8, hParede = alto + 0.5 - baixo, cy = baixo + hParede / 2;
    const parede = (px, pz, hx, hz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, hParede, hz * 2), MAT('#f1d9b5')); m.position.set(px, cy, pz); m.castShadow = m.receiveShadow = true; raiz.add(m);
      new Superficie({ tipo: 'caixa', x: px, z: pz, hx, hz, topo: alto + 0.5, solido: true, baixo });
      const friso = new THREE.Mesh(new THREE.BoxGeometry(hx * 2 + 0.1, 0.18, hz * 2 + 0.1), MAT('#e9a77f')); friso.position.set(px, alto + 0.42, pz); raiz.add(friso);
    };
    parede(x, z - L - esp / 2, L + esp, esp / 2);                       // norte
    parede(x - L - esp / 2, z, esp / 2, L);                             // oeste
    parede(x + L + esp / 2, z, esp / 2, L);                             // leste
    const vao = 1.8, pedaco = (L - vao) / 2;                            // sul, com a porta no meio
    parede(x - vao - pedaco, z + L + esp / 2, pedaco, esp / 2);
    parede(x + vao + pedaco, z + L + esp / 2, pedaco, esp / 2);
    // comporta da porta: sobe quando a cisterna enche
    this.porta = new THREE.Mesh(new THREE.BoxGeometry(vao * 2, 3, esp * 0.6), MAT('#9fd8c0')); this.porta.position.set(x, baixo - 1.6, z + L + esp / 2); raiz.add(this.porta);
    this.supPorta = new Superficie({ tipo: 'caixa', x, z: z + L + esp / 2, hx: vao, hz: esp / 2, topo: baixo - 0.1, solido: true, baixo: baixo - 3 });
    // água e balsa
    this.agua = new THREE.Mesh(new THREE.BoxGeometry(L * 2, 1, L * 2), new THREE.MeshLambertMaterial({ map: texturaAgua(), color: '#ffffff', emissive: '#7fd6cf', emissiveIntensity: 0.25, transparent: true, opacity: 0.85 }));
    this.agua.position.set(x, baixo, z); raiz.add(this.agua);
    this.sup = new Superficie({ tipo: 'caixa', x, z, hx: L - 0.9, hz: L - 0.9, topo: baixo + 0.3, movel: true });
    this.balsa = new THREE.Group(); this.balsa.position.set(x, baixo + 0.3, z); raiz.add(this.balsa);
    const tabuas = new THREE.Mesh(new THREE.BoxGeometry((L - 0.9) * 2, 0.4, (L - 0.9) * 2), MAT('#f6e7cc')); tabuas.position.y = -0.2; tabuas.castShadow = tabuas.receiveShadow = true;
    const borda = new THREE.Mesh(new THREE.BoxGeometry((L - 0.9) * 2 + 0.2, 0.15, (L - 0.9) * 2 + 0.2), MAT('#9fd8c0')); borda.position.y = -0.38;
    this.balsa.add(tabuas, borda);
  }
  ativar() { this.ativa = true; }
  atualizar(dt, jog, t) {
    const s = this.sup, em = jog.noChao && jog.sup === s && jog.modo !== 'voo';
    let alvo;
    if (em && this.ativa) { this.espera = 3; alvo = this.alto; }
    else if (this.espera > 0) { this.espera -= dt; alvo = s.topo; }
    else alvo = this.baixo + 0.3;
    if (em && !this.ativa && t - this.avisou > 8) { this.avisou = t; if (this.aoSeca) this.aoSeca(); }
    const passo = lim(alvo - s.topo, -this.vel * dt, this.vel * dt);
    s.dy = passo; s.topo += passo; this.balsa.position.y = s.topo;
    const h = Math.max(0.05, s.topo - 0.25 - this.baixo + (this.ativa ? 0.6 : 0));
    this.agua.scale.y = h; this.agua.position.y = this.baixo + h / 2; this.agua.visible = this.ativa;
    const fechada = s.topo > this.baixo + 0.6;                            // porta sobe enquanto há água alta
    const py = fechada ? this.baixo + 1.5 : this.baixo - 1.6;
    this.porta.position.y += (py - this.porta.position.y) * (1 - Math.exp(-4 * dt));
    this.supPorta.topo = this.porta.position.y + 1.5;
  }
}

// =====================================================================
// COMPORTA — placa no chão que, pisada, abre o portão de pedra
// =====================================================================
class Comporta {
  constructor(raiz, { x, y, z, yaw = 0, aoAbrir }) {
    Object.assign(this, { x, y, z, aoAbrir }); this.aberta = false; this.sobe = 0;
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; raiz.add(g);
    this.matPlaca = matAcende('#bfe3d2', '#8fe3da');
    this.placa = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.25, 16), this.matPlaca); this.placa.position.y = 0.12; this.placa.receiveShadow = true;
    const anel = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.1, 4, 24), MAT('#fffaf1')); anel.rotation.x = Math.PI / 2; anel.position.y = 0.06;
    g.add(this.placa, anel);
    // portão: dois pilares e uma laje que sobe
    const portao = new THREE.Group(); portao.position.z = -4.5; g.add(portao);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.6, 0.9), MAT('#f6e3c4')); p.position.set(s * 2.2, 2.3, 0); p.castShadow = true; portao.add(p); }
    const verga = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.6, 1), MAT('#e9a77f')); verga.position.y = 4.9; portao.add(verga);
    this.laje = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.2, 0.5), MAT('#9fd8c0')); this.laje.position.y = 1.6; this.laje.castShadow = true; portao.add(this.laje);
  }
  atualizar(dt, jog, t) {
    animarAcende(this.matPlaca, dt, this.aberta ? Math.sin(t * 2.5) * 0.2 : 0);
    if (this.aberta) { this.sobe = Math.min(1, this.sobe + dt * 0.5); this.laje.position.y = 1.6 + this.sobe * 3.1; this.placa.position.y = 0.12 - this.sobe * 0.1; return; }
    if (Math.hypot(jog.pos.x - this.x, jog.pos.z - this.z) < 1.8 && Math.abs(jog.pos.y - this.y) < 1.4 && jog.modo !== 'voo') {
      this.aberta = true; this.matPlaca.userData.alvo = 1; Som.ponte(); if (this.aoAbrir) this.aoAbrir();
    }
  }
}

// =====================================================================
// ESPELHOS DE SOL — discos dourados no alto de colunas. Ao passar perto,
// o espelho acende e lança um feixe até o cristal da Torre do Sol.
// =====================================================================
class Espelhos {
  // lista: [{x, y, z}] (y = topo da coluna) · alvo: {x, y, z} · o = { aoAcender(i, n, e), aoCompletar }
  constructor(raiz, lista, alvo, o = {}) {
    this.o = o; this.alvo = alvo; this.feitos = 0; this.completo = false; this.itens = [];
    const cima = new THREE.Vector3(0, 1, 0);
    for (const e of lista) {
      const chaoY = alturaTerreno(e.x, e.z), alt = e.y - chaoY + 1;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.3, alt, 8), MAT('#f3dcb8')); col.position.set(e.x, chaoY + alt / 2 - 1, e.z); col.castShadow = col.receiveShadow = true; raiz.add(col);
      for (let k = 1; k < alt / 5; k++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.3, 8), MAT(k % 2 ? '#e9b18b' : '#fbefd9')); f.position.set(e.x, chaoY + k * 5 - 1, e.z); raiz.add(f); }
      new Superficie({ tipo: 'cil', x: e.x, z: e.z, r: 2.2, topo: e.y, solido: true, baixo: chaoY });
      const g = new THREE.Group(); g.position.set(e.x, e.y, e.z); raiz.add(g);
      const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 6), MAT('#fffaf1')); pe.position.y = 0.7;
      const mat = matAcende('#f2e6cf', '#ffc65e');
      const disco = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.16, 20), mat); disco.position.y = 2.2;
      const dir = new THREE.Vector3(alvo.x - e.x, alvo.y - e.y - 2.2, alvo.z - e.z), len = dir.length(); dir.normalize();
      disco.quaternion.setFromUnitVectors(cima, dir);                    // o disco "olha" para a torre
      const aro = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.09, 4, 24), MAT('#f0bd55')); aro.quaternion.copy(disco.quaternion); aro.rotateX(Math.PI / 2); aro.position.y = 2.2;
      g.add(pe, disco, aro);
      // feixe (escondido até acender): cresce do espelho até o cristal
      const geo = new THREE.CylinderGeometry(0.16, 0.16, 1, 6, 1, true); geo.translate(0, 0.5, 0);
      const fm = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
      const feixe = new THREE.Mesh(geo, fm); feixe.position.set(e.x, e.y + 2.2, e.z); feixe.quaternion.setFromUnitVectors(cima, dir); feixe.scale.set(1, 0.001, 1); feixe.visible = false; raiz.add(feixe);
      this.itens.push({ ...e, mat, disco, feixe, len, feito: false, cresce: 0 });
    }
  }
  atualizar(dt, jog, t) {
    this.itens.forEach((e, i) => {
      animarAcende(e.mat, dt, e.feito ? Math.sin(t * 2.4 + i) * 0.2 : 0);
      if (e.feito) {
        e.cresce = Math.min(1, e.cresce + dt * 0.8); const pul = 1 + Math.sin(t * 3 + i) * 0.15;
        e.feixe.scale.set(pul, e.len * (1 - Math.pow(1 - e.cresce, 3)), pul);
        return;
      }
      if (Math.hypot(jog.pos.x - e.x, jog.pos.y - (e.y + 1.5), jog.pos.z - e.z) < 6.5) {
        e.feito = true; e.mat.userData.alvo = 1; e.feixe.visible = true; this.feitos++;
        Som.arco(this.feitos + 1);
        if (this.o.aoAcender) this.o.aoAcender(i, this.feitos, e);
        if (this.feitos === this.itens.length && !this.completo) { this.completo = true; if (this.o.aoCompletar) setTimeout(this.o.aoCompletar, 1300); }
      }
    });
  }
}

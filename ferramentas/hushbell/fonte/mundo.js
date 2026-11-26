/* Mundo: transforma as pedras em caminhos, gira as peças e leva o sino até onde se toca.

   REGRA DA ILUSÃO: a câmera olha na direção (1,1,1), então um ponto P e o ponto P + k·(1,1,1)
   caem no mesmo lugar da tela. Cada casa onde se pisa tem "portas" no meio das bordas.
   Duas portas se ligam quando, na tela, estão no mesmo lugar e uma olha para a outra,
   mesmo que de verdade estejam longe (k diferente de zero). É assim que o impossível vira caminho. */
const PASSOS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const K3 = (x, y, z) => x + ',' + y + ',' + z;
const EIXOS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const QUARTO = Math.PI / 2, quarto = r => ((Math.round(r) % 4) + 4) % 4;

/* Peça que gira. obra: montada no lugar certo (rot 0); pivo: casa do centro do giro; rot: posição inicial (quartos de volta). */
function criarPeca({ obra, eixo = 'y', pivo, rot = 0, mat }) {
  const centro = new THREE.Vector3(pivo[0], pivo[1] + .5, pivo[2]), geo = obra.fechar(); geo.translate(-centro.x, -centro.y, -centro.z);
  const mesh = new THREE.Mesh(geo, pedra()), grupo = new THREE.Group();   // material próprio: a peça pode brilhar sozinha
  mesh.castShadow = mesh.receiveShadow = true; grupo.position.copy(centro); grupo.add(mesh);
  const p = { mat: mesh.material, realce: 0, eixo, ev: EIXOS[eixo], centro, rot, ang: rot * QUARTO, girando: false, soltando: false, vel: 0, alvo: 0, grupo, mesh,
    blocos: [...obra.blocos.values()].map(b => [b.x, b.y, b.z]), rampas: obra.rampas, ocupado: [...obra.ocupado].map(k => k.split(',').map(Number)) };
  mesh.userData = { tipo: 'peca', peca: p }; grupo.quaternion.setFromAxisAngle(p.ev, p.ang); return p;
}
// onde ficam os blocos da peça depois de r quartos de volta
function celulasPeca(p, r) {
  const q = new THREE.Quaternion().setFromAxisAngle(p.ev, r * QUARTO), v = new THREE.Vector3();
  const gira = (x, y, z) => { v.set(x, y + .5, z).sub(p.centro).applyQuaternion(q).add(p.centro); return [Math.round(v.x), Math.round(v.y - .5), Math.round(v.z)]; };
  const rampas = p.eixo !== 'y' ? [] : p.rampas.map(rp => { const c = gira(rp.x, rp.y, rp.z); v.set(rp.d[0], 0, rp.d[1]).applyQuaternion(q); return { x: c[0], y: c[1], z: c[2], d: [Math.round(v.x), Math.round(v.z)], peca: p }; });
  return { blocos: p.blocos.map(b => gira(...b)), ocup: p.ocupado.map(b => gira(...b)), rampas };
}

class Mundo {
  constructor({ grupo, estaticas, pecas = [], inicio, meta = null, sinos = [], vista = null }) {
    Object.assign(this, { grupo, estaticas, pecas, inicio, meta, sinos });
    for (const p of pecas) grupo.add(p.grupo);
    this.fixos = new Set(); this.fixosOcup = new Set(); this.fixasRampas = [];
    for (const o of estaticas) { for (const b of o.blocos.values()) this.fixos.add(K3(b.x, b.y, b.z)); for (const k of o.ocupado) this.fixosOcup.add(k); this.fixasRampas.push(...o.rampas); }
    this.vista = vista || this.medirVista(); this.montar();
  }
  // enquadramento: tudo o que está acima da névoa cabe na tela
  medirVista() {
    let a = [1e9, -1e9, 1e9, -1e9]; const ver = (x, y, z) => { const sx = (x - z) * Math.SQRT1_2, sy = (2 * y - x - z) * .4082; a = [Math.min(a[0], sx), Math.max(a[1], sx), Math.min(a[2], sy), Math.max(a[3], sy)]; };
    const cel = [...this.fixos].map(k => k.split(',').map(Number)); for (const p of this.pecas) cel.push(...celulasPeca(p, p.rot).blocos);
    for (const [x, y, z] of cel) if (y >= -2) for (const dx of [-.5, .5]) for (const dz of [-.5, .5]) { ver(x + dx, y + 1, z + dz); ver(x + dx, Math.max(y, -1.5), z + dz); }
    return { centro: naTela((a[0] + a[1]) / 2, (a[2] + a[3]) / 2 + .4), alt: (a[3] - a[2]) / 2 + 2.6, larg: (a[1] - a[0]) / 2 + 1.4 };
  }
  ocupadas(excluir) {   // casas cheias (para saber se uma peça cabe)
    const s = new Set(this.fixos); for (const r of this.fixasRampas) s.add(K3(r.x, r.y, r.z));
    for (const q of this.pecas) if (q !== excluir) { const c = celulasPeca(q, q.rot); for (const b of c.blocos) s.add(K3(...b)); for (const r of c.rampas) s.add(K3(r.x, r.y, r.z)); }
    return s;
  }
  cabe(p, r, livres = []) {
    const c = celulasPeca(p, r), s = this.ocupadas(p); for (const b of livres) s.add(K3(...b));
    return [...c.blocos, ...c.rampas.map(x => [x.x, x.y, x.z])].every(b => !s.has(K3(...b)));
  }
  // monta o mapa de casas e portas (refeito a cada peça que para de girar)
  montar() {
    const S = new Map(), ocup = new Set(this.fixosOcup), R = new Map(), nos = new Map();
    for (const k of this.fixos) S.set(k, null);
    for (const r of this.fixasRampas) R.set(K3(r.x, r.y, r.z), { ...r, peca: null });
    for (const p of this.pecas) { if (p.girando) continue; const c = celulasPeca(p, p.rot); for (const b of c.blocos) S.set(K3(...b), p); for (const o of c.ocup) ocup.add(K3(...o)); for (const r of c.rampas) R.set(K3(r.x, r.y, r.z), r); }
    const livre = (x, y, z) => { const k = K3(x, y, z); return !S.has(k) && !ocup.has(k) && !R.has(k); };
    for (const [k, p] of S) { const [x, y, z] = k.split(',').map(Number); if (livre(x, y + 1, z)) nos.set('c' + k, { id: 'c' + k, x, y, z, h: y + 1, rampa: false, peca: p, centro: new THREE.Vector3(x, y + 1, z), portas: PASSOS4.map(d => ({ d, h: y + 1 })) }); }
    for (const [k, r] of R) if (livre(r.x, r.y + 1, r.z)) nos.set('r' + k, { id: 'r' + k, x: r.x, y: r.y, z: r.z, h: r.y + .5, rampa: true, d: r.d, peca: r.peca, centro: new THREE.Vector3(r.x, r.y + .5, r.z), portas: [{ d: r.d, h: r.y + 1 }, { d: [-r.d[0], -r.d[1]], h: r.y }] });
    // portas iguais na tela têm a mesma chave: posição menos a altura (anda junto com (1,1,1))
    const chave = (P, d) => Math.round(2 * (P.x - P.y)) + ',' + Math.round(2 * (P.z - P.y)) + ',' + d[0] + ',' + d[1], mapa = new Map();
    for (const n of nos.values()) { n.viz = []; n.saidas = n.portas.map(pt => { const P = new THREE.Vector3(n.x + pt.d[0] * .5, pt.h, n.z + pt.d[1] * .5), c = chave(P, pt.d); if (!mapa.has(c)) mapa.set(c, []); mapa.get(c).push([n, P]); return [pt.d, P]; }); }
    this.grupo.updateMatrixWorld(true); const vistas = new Map();
    for (const n of nos.values()) for (const [d, P] of n.saidas) for (const [m, Q] of mapa.get(chave(P, [-d[0], -d[1]])) || []) {
      if (m === n) continue; const e = { de: n, para: m, P, Q, k: Math.round(Q.y - P.y) };
      if (e.k) { const c = [n.id, m.id].sort().join('|'); if (!vistas.has(c)) vistas.set(c, this.emendaVisivel(e, d)); if (!vistas.get(c)) continue; }
      n.viz.push(e);
    }
    // "levantar": se a mesma casa aparece mais à frente (outra casa igual na tela), o sino é desenhado lá, para não sumir atrás dela
    for (const n of nos.values()) { n.lift = 0; if (!n.rampa) for (let k = 1; k < 30; k++) if (nos.has('c' + K3(n.x + k, n.y + k, n.z + k))) n.lift = k; }
    this.nos = nos;
  }
  // uma ligação impossível só vale se, na tela, as duas casas aparecem mesmo encostadas (nada na frente da emenda; água também tampa)
  emendaVisivel(e, d) {
    const raio = this.raio || (this.raio = new THREE.Raycaster()), D = new THREE.Vector3(1, 1, 1).normalize(), dv = new THREE.Vector3(d[0], 0, d[1]), lat = new THREE.Vector3(-d[1], 0, d[0]);
    const lado = (no, porta, sinal) => {
      if (no.rampa) return true;
      return [-.25, .25].some(s => { const p = porta.clone().addScaledVector(dv, .15 * sinal).addScaledVector(lat, s); p.y += .02; raio.set(p.clone().addScaledVector(D, 60), D.clone().negate()); raio.far = 61; const h = raio.intersectObject(this.grupo, true)[0]; return !h || h.distance > 59.97; });
    };
    return lado(e.de, e.P, -1) && lado(e.para, e.Q, 1);
  }
  no(id) { return this.nos.get(id); }
  noPerto(p) { let m = null, d = .3; for (const n of this.nos.values()) { const e = n.centro.distanceTo(p); if (e < d) { d = e; m = n; } } return m; }
  caminho(a, b) {
    if (!a || !b) return null; if (a === b) return [];
    const veio = new Map([[a, null]]), fila = [a];
    while (fila.length) { const n = fila.shift(); if (n === b) break; for (const e of n.viz) if (!veio.has(e.para)) { veio.set(e.para, e); fila.push(e.para); } }
    if (!veio.has(b)) return null; const r = []; for (let n = b; veio.get(n); n = veio.get(n).de) r.unshift(veio.get(n)); return r;
  }
  // casa tocada: a que está sob o dedo na tela e não está escondida atrás do que foi tocado
  escolher(raio, acerto) {
    const o = raio.ray.origin, u = o.x - o.z, v = 2 * o.y - o.x - o.z, frente = acerto ? acerto.point.x + acerto.point.y + acerto.point.z : -1e9;
    let melhor = null, mp = -1e9;
    for (const n of this.nos.values()) {
      if (Math.abs(u - (n.x - n.z)) + Math.abs(v - (2 * n.h - n.x - n.z)) > 1.02) continue;
      const s = 3 * n.h - v; if (s < frente - (n.rampa ? 1.3 : .5)) continue; if (s > mp) { mp = s; melhor = n; }
    }
    return melhor;
  }
  // ligações entre a peça e o resto (para saber se o giro abriu caminho novo)
  ligacoes(p) { const s = new Set(); for (const n of this.nos.values()) if (n.peca === p) for (const e of n.viz) if (e.para.peca !== p) s.add(n.id + '>' + e.para.id); return s; }
}

/* O andar do sino: segue o caminho porta a porta; numa ligação impossível, salta (na tela não se vê o salto). */
function criarAndar(heroi) {
  return { mundo: null, no: null, pos: new THREE.Vector3(), lift: 0, fila: [], destino: null, montado: null, aoChegar: null, aoPasso: null, vel: 2.1,
    colocar(mundo, no) { this.mundo = mundo; this.no = no; this.pos.copy(no.centro); this.lift = no.lift; this.fila = []; this.destino = null; this.montado = null; this.desenhar(); },
    andando() { return this.fila.length > 0; },
    proximo() { const w = this.fila.find(w => w.no); return w ? w.no : this.no; },
    trechos(cam) {
      const w = [];
      for (const e of cam) {   // numa ligação impossível, anda as duas metades no lado que está mais à frente
        const a = Math.max(0, e.k), b = Math.max(0, -e.k);
        w.push({ p: e.P.clone(), lift: e.de.lift + a }, { p: e.Q.clone(), lift: e.para.lift + b, salto: true }, { p: e.para.centro.clone(), lift: e.para.lift + b, no: e.para });
      }
      return w;
    },
    ir(alvo) {
      if (!alvo || this.montado) return false;
      let de = this.no, base = [];
      if (this.fila.length) { const i = this.fila.findIndex(w => w.no); base = this.fila.slice(0, i + 1); de = this.fila[i].no; }
      const cam = this.mundo.caminho(de, alvo); if (!cam) return false;
      this.fila = base.concat(this.trechos(cam)); this.destino = alvo; return true;
    },
    // depois que o mapa muda: troca as casas velhas pelas novas e refaz o caminho se der
    remapear() {
      const M = this.mundo; this.no = M.no(this.no.id) || this.no; if (!this.fila.length) return;
      const i = this.fila.findIndex(w => w.no), prox = M.no(this.fila[i].no.id), dest = this.destino && M.no(this.destino.id);
      this.fila = this.fila.slice(0, i + 1);
      if (!prox) { this.fila = [{ p: this.no.centro.clone(), lift: this.no.lift, no: this.no }]; this.destino = this.no; return; }
      this.fila[i].no = prox; const c = dest && M.caminho(prox, dest); if (c) { this.fila.push(...this.trechos(c)); this.destino = dest; } else this.destino = prox;
    },
    quadro(dt) {
      if (this.montado) return;
      let resta = dt * this.vel;
      while (this.fila.length && resta > 0) {
        const w = this.fila[0];
        if (w.salto) { this.pos.copy(w.p); this.lift = w.lift; this.fila.shift(); continue; }
        this.lift = w.lift; const d = w.p.clone().sub(this.pos), L = d.length();
        if (Math.hypot(d.x, d.z) > .02) heroi.rumo = Math.atan2(d.x, d.z);
        if (L <= resta) { this.pos.copy(w.p); resta -= L; this.fila.shift(); if (w.no) { this.no = w.no; this.lift = w.no.lift; if (this.aoPasso) this.aoPasso(w.no); } }
        else { this.pos.addScaledVector(d, resta / L); resta = 0; }
      }
      heroi.andando += ((this.fila.length ? 1 : 0) - heroi.andando) * Math.min(1, dt * 10);
      if (!this.fila.length) { heroi.rumo = null; if (this.destino) { const d = this.destino; this.destino = null; if (this.aoChegar) this.aoChegar(d); } }
      this.desenhar();
    },
    desenhar() { heroi.grupo.position.copy(this.pos).addScalar(this.lift); if (this.mundo) heroi.grupo.position.add(this.mundo.grupo.position); }
  };
}

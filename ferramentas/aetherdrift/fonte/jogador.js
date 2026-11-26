/* =====================================================================
   JOGADOR — uma só pessoa com três formas, trocadas a qualquer momento:
     andar (Walker)  · carro (Cruiser)  · voo (Glider)
   Física simples e gentil: sem dano de queda, sem game over.
   Cair na água = véu claro e volta ao último chão seguro.
   ===================================================================== */
const LIMITE_MUNDO = 196;

function montarAndarilho() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 3, 8), MAT('#fbf4e8')); corpo.position.y = 0.98;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), MAT('#fde2cc')); cabeca.position.y = 1.62;
  const chapeu = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.26, 10), MAT('#f3cf7a')); chapeu.position.y = 1.86;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.1), MAT('#7cc8b2')); visor.position.set(0, 1.64, 0.25);
  const lenco = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 5, 12), MAT('#e69d7c')); lenco.rotation.x = Math.PI / 2; lenco.position.y = 1.37;
  const mochila = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.2), MAT('#f1c56a')); mochila.position.set(0, 1.06, -0.32);
  const perna = lado => { const p = new THREE.Group(); p.position.set(lado, 0.66, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 2, 6), MAT('#d8b49a')); m.position.y = -0.33; p.add(m); g.add(p); return p; };
  const braco = lado => { const p = new THREE.Group(); p.position.set(lado, 1.3, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 2, 6), MAT('#fbf4e8')); m.position.y = -0.27; p.add(m); g.add(p); return p; };
  g.add(corpo, cabeca, chapeu, visor, lenco, mochila);
  const pe = [perna(-0.15), perna(0.15)], br = [braco(-0.43), braco(0.43)];
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, pe, br };
}

function montarCarro() {
  const g = new THREE.Group();
  const chassi = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 3.3), MAT('#9fd8c0')); chassi.position.y = 0.62;
  const saia = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 3.4), MAT('#f6eedf')); saia.position.y = 0.4;
  const cabine = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.52, 1.5), MAT('#fffaf1')); cabine.position.set(0, 1.12, -0.25);
  const vidro = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.38, 0.06), new THREE.MeshLambertMaterial({ color: '#cdeef0', emissive: '#bfe9ee', emissiveIntensity: 0.2 }));
  vidro.position.set(0, 1.14, 0.52); vidro.rotation.x = -0.35;
  const aleta = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.5), MAT('#f1c56a')); aleta.position.set(0, 1.25, -1.55);
  const farol = new THREE.MeshLambertMaterial({ color: '#fff4c8', emissive: '#ffe08a', emissiveIntensity: 0.9 });
  for (const lx of [-0.62, 0.62]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), farol); f.position.set(lx, 0.68, 1.66); g.add(f); }
  // motorista (só a cabecinha com chapéu aparece)
  const cab = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), MAT('#fde2cc')); cab.position.set(0, 1.55, -0.2);
  const chap = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.22, 10), MAT('#f3cf7a')); chap.position.set(0, 1.76, -0.2);
  g.add(chassi, saia, cabine, vidro, aleta, cab, chap);
  const rodas = [];
  const geoR = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 12); geoR.rotateZ(Math.PI / 2);
  const geoC = new THREE.CylinderGeometry(0.2, 0.2, 0.36, 8); geoC.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-1, 1.1], [1, 1.1], [-1, -1.1], [1, -1.1]]) {
    const r = new THREE.Group(); r.position.set(x, 0.42, z);
    r.add(new THREE.Mesh(geoR, MAT('#7d6e63')), new THREE.Mesh(geoC, MAT('#f6eedf')));
    g.add(r); rodas.push(r);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, rodas };
}

function montarAsas() {
  const g = new THREE.Group();
  // cada asa: um quadrilátero leve (vela solar), mais larga na raiz
  const pos = [];
  for (const s of [-1, 1]) {
    const a = [0, 0, 0.75], b = [0, 0, -0.55], c = [s * 3.4, 0.4, -0.95], d = [s * 3.2, 0.42, -0.25];
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
  const vela = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#fff8ea', emissive: '#ffd99a', emissiveIntensity: 0.28, side: THREE.DoubleSide }));
  vela.castShadow = true;
  // bordas douradas no bordo de ataque
  for (const s of [-1, 1]) {
    const len = Math.hypot(3.2, 0.42, 1.0), b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), MAT('#f0bd55'));
    g.add(b); b.position.set(s * 1.6, 0.21, 0.25); b.lookAt(s * 3.2, 0.42, -0.25);   // do meio da borda, olhando para a ponta
  }
  // fitas na cauda
  const fita = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 1.4), MAT('#e69d7c')); fita.position.set(0, 0, -1.2);
  g.add(vela, fita);
  return g;
}

class Jogador {
  constructor(cena) {
    this.raiz = new THREE.Group(); this.pivo = new THREE.Group(); this.raiz.add(this.pivo); cena.add(this.raiz);
    this.andarilho = montarAndarilho(); this.carro = montarCarro(); this.asas = montarAsas();
    this.corpo = new THREE.Group(); this.corpo.add(this.andarilho.g); this.pivo.add(this.corpo, this.carro.g, this.asas);
    this.asas.position.y = 1.0;
    this.pos = this.raiz.position; this.vel = new THREE.Vector3();
    this.yaw = Math.PI; this.modo = 'andar'; this.noChao = false; this.sup = null;
    this.vCarro = 0; this.vVoo = 14; this.impulso = 0; this.termica = 0;
    this.seguro = new THREE.Vector3(); this.tSeguro = 0; this.respawn = 0; this.tAr = 0; this.tRampa = 0;
    this.passada = 0; this.inclina = 0; this.pitchC = 0; this.rollC = 0; this.pop = 1; this.deitado = 0;
    this.aoTrocar = null; this.aoMergulho = null; this.aoRampa = null;
    this.mostrar();
  }
  colocar(x, z, yaw) {
    this.pos.set(x, chao(x, z, 999, 0).y, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.noChao = true; this.seguro.copy(this.pos);
    if (this.modo !== 'andar') this.trocar('andar', true);
  }
  get velocidade() { return this.modo === 'voo' ? this.vVoo : this.modo === 'carro' ? this.vCarro : Math.hypot(this.vel.x, this.vel.z); }

  // troca de forma; devolve 'ok' ou o motivo de não trocar
  trocar(modo, silencioso) {
    if (modo === this.modo) return 'igual';
    if (this.respawn > 0) return 'ocupado';
    if (modo === 'carro' && !this.noChao) return 'semChao';
    const de = this.modo, vh = Math.hypot(this.vel.x, this.vel.z);
    this.modo = modo; this.pop = 0;
    if (modo === 'carro') { this.vCarro = vh * 0.8; this.vel.y = Math.min(this.vel.y, 0); }
    if (modo === 'voo') {
      this.vVoo = Math.max(12, vh);
      if (this.noChao) { this.impulso = 11; this.vel.y = 5; this.pos.y += 0.35; } else { this.impulso = 1.5; this.vel.y = Math.max(this.vel.y, -3); }
      this.noChao = false;
    }
    if (modo === 'andar' && de === 'carro') { this.vel.x *= 0.35; this.vel.z *= 0.35; }
    this.mostrar();
    if (!silencioso) Som.troca(modo);
    if (this.aoTrocar) this.aoTrocar(modo, de);
    return 'ok';
  }
  mostrar() {
    this.carro.g.visible = this.modo === 'carro';
    this.corpo.visible = this.modo !== 'carro';
    this.asas.visible = this.modo === 'voo';
  }

  atualizar(dt, e, camYaw) {
    if (this.respawn > 0) { this.voltarSeguro(dt); return; }
    const p = this.pos;
    if (this.noChao && this.sup && this.sup.dy) p.y += this.sup.dy;   // carregado pelo elevador
    const ox = p.x, oz = p.z, oy = p.y;
    if (this.modo === 'andar') this.andar(dt, e, camYaw);
    else if (this.modo === 'carro') this.dirigir(dt, e);
    else this.voar(dt, e);
    const raio = this.modo === 'carro' ? 1.3 : 0.5;
    for (const s of SUP) s.empurrar(p, raio);
    if (this.modo !== 'voo') this.limitarRampa(ox, oz, oy);
    const d = Math.hypot(p.x, p.z); if (d > LIMITE_MUNDO) { p.x *= LIMITE_MUNDO / d; p.z *= LIMITE_MUNDO / d; }
    if (this.modo === 'voo') this.pousar(); else this.resolverChao(dt);
    this.animar(dt, e);
  }

  // barranco íngreme demais (paredes de mesa, cânion) não se sobe a pé nem de carro: escorrega ao longo dele
  limitarRampa(ox, oz, oy) {
    const p = this.pos, max = this.modo === 'carro' ? 1.15 : 1.35, passo = this.modo === 'carro' ? 1.0 : 0.65;
    const antes = chao(ox, oz, oy, passo).y;
    const bloqueia = (x, z) => {
      const d = Math.hypot(x - ox, z - oz); if (d < 1e-5) return false;
      const g = chao(x, z, p.y, passo);
      return !g.sup && g.y > p.y + 0.02 && g.y - antes > d * max;
    };
    if (!bloqueia(p.x, p.z)) return;
    if (!bloqueia(p.x, oz)) { p.z = oz; this.vel.z = 0; }
    else if (!bloqueia(ox, p.z)) { p.x = ox; this.vel.x = 0; }
    else { p.x = ox; p.z = oz; this.vel.x = this.vel.z = 0; }
    if (this.modo === 'carro') this.vCarro *= 0.6;
  }

  andar(dt, e, camYaw) {
    const p = this.pos, v = this.vel;
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    let dx = rx * e.x + fx * e.y, dz = rz * e.x + fz * e.y; const m = Math.hypot(dx, dz);
    if (m > 1) { dx /= m; dz /= m; }
    const VEL = 7.2, k = 1 - Math.exp(-(this.noChao ? 12 : 3.5) * dt);
    v.x += (dx * VEL - v.x) * k; v.z += (dz * VEL - v.z) * k;
    if (m > 0.05) this.yaw = angLerp(this.yaw, Math.atan2(dx, dz), 1 - Math.exp(-12 * dt));
    if (e.pulo && this.noChao) { v.y = 8.6; this.noChao = false; Som.pulo(); }
    v.y -= 24 * dt; if (v.y < -40) v.y = -40;
    p.addScaledVector(v, dt);
  }

  dirigir(dt, e) {
    const p = this.pos, v = this.vel;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    if (this.noChao) {
      if (e.y > 0) this.vCarro += e.y * 15 * dt * (1 - Math.max(this.vCarro, 0) / 31);
      else if (e.y < 0) this.vCarro += e.y * (this.vCarro > 0 ? 24 : 8) * dt;
      else this.vCarro *= Math.exp(-0.45 * dt);
      this.vCarro = lim(this.vCarro, -7, 34);
      const giro = 2.1 / (1 + Math.abs(this.vCarro) / 26) * lim(Math.abs(this.vCarro) / 4, 0, 1) * Math.sign(this.vCarro);
      this.yaw -= e.x * giro * dt;
      const k = 1 - Math.exp(-6.5 * dt), nx = Math.sin(this.yaw), nz = Math.cos(this.yaw);
      v.x += (nx * this.vCarro - v.x) * k; v.z += (nz * this.vCarro - v.z) * k;
      // rampa de brisa: pulo macio e um empurrão
      if (this.sup && this.sup.brisa && this.vCarro > 5 && this.tRampa <= 0) {
        this.vCarro = Math.min(Math.max(this.vCarro, 16) + 5, 34); v.x = nx * this.vCarro; v.z = nz * this.vCarro;
        v.y = 10.5; this.noChao = false; this.tRampa = 1.2; Som.impulso(); if (this.aoRampa) this.aoRampa();
      }
    } else this.yaw -= e.x * 0.7 * dt;
    this.tRampa -= dt;
    v.y -= 21 * dt; if (v.y < -40) v.y = -40;
    p.addScaledVector(v, dt);
  }

  voar(dt, e) {
    const p = this.pos, v = this.vel;
    this.yaw -= e.x * 1.3 * dt;
    const mergulho = e.y;                                   // frente = descer e ganhar velocidade; trás = puxar para cima
    this.vVoo += (Math.max(mergulho, 0) * 8 - (this.vVoo - 14) * 0.45) * dt;
    let subida = 0;
    if (mergulho < 0) { subida = -mergulho * 4.5 * lim((this.vVoo - 8) / 6, 0, 1); this.vVoo += mergulho * 3 * dt; }
    this.vVoo = lim(this.vVoo, 7, 28);
    this.impulso *= Math.exp(-0.85 * dt);
    let alvo = -1.45 - Math.max(mergulho, 0) * 4.5 + subida + this.impulso + this.termica;
    if (p.y > 88) alvo = Math.min(alvo, -1);
    v.y += (alvo - v.y) * (1 - Math.exp(-2.6 * dt));
    v.x = Math.sin(this.yaw) * this.vVoo; v.z = Math.cos(this.yaw) * this.vVoo;
    p.addScaledVector(v, dt);
  }

  pousar() {
    const p = this.pos, g = chao(p.x, p.z, p.y, 0.4);
    this.noChao = false;
    if (p.y <= g.y + 0.05) {
      p.y = g.y; this.sup = g.sup; this.noChao = true;
      const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
      this.modo = 'andar'; this.pop = 0.4; this.mostrar(); this.vel.set(hx * 5, 0, hz * 5);
      Som.pouso(); if (this.aoTrocar) this.aoTrocar('andar', 'voo');
      if (g.agua) this.mergulhar();
    }
  }

  resolverChao(dt) {
    const p = this.pos, v = this.vel, carro = this.modo === 'carro';
    const g = chao(p.x, p.z, p.y, carro ? 1.0 : 0.65), estava = this.noChao;
    if (p.y <= g.y || (estava && v.y <= 0 && p.y - g.y < (carro ? 0.9 : 0.5))) {
      p.y = g.y; if (v.y < 0) v.y = 0;
      if (!estava && this.tAr > 0.45) Som.pouso();
      this.noChao = true; this.sup = g.sup; this.tAr = 0;
      if (g.agua) { this.mergulhar(); return; }
      this.tSeguro -= dt;
      if (this.tSeguro <= 0 && !(g.sup && g.sup.movel)) { this.seguro.copy(p); this.tSeguro = 0.3; }
    } else { this.noChao = false; this.sup = null; this.tAr += dt; }
  }

  mergulhar() { if (this.respawn > 0) return; this.respawn = 1.1; this.trocado = false; Som.agua(); if (this.aoMergulho) this.aoMergulho(true); }
  voltarSeguro(dt) {
    this.respawn -= dt;
    if (!this.trocado && this.respawn < 0.55) {   // no meio do véu, volta para o último chão firme
      this.trocado = true; this.pos.copy(this.seguro); this.vel.set(0, 0, 0); this.vCarro = 0;
      if (this.modo !== 'andar') { this.modo = 'andar'; this.mostrar(); if (this.aoTrocar) this.aoTrocar('andar', 'agua'); }
      this.noChao = true;
    }
    if (this.respawn <= 0 && this.aoMergulho) this.aoMergulho(false);
  }

  animar(dt, e) {
    const k = 1 - Math.exp(-10 * dt);
    this.raiz.rotation.y = this.yaw;
    // "pop" ao trocar de forma
    this.pop = Math.min(1, this.pop + dt * 3.2);
    const s = 1 + Math.sin(this.pop * Math.PI) * 0.18 * (1 - this.pop * 0.3);
    this.pivo.scale.setScalar(this.pop < 1 ? Math.max(0.55, s * (0.55 + 0.45 * Math.min(1, this.pop * 2))) : 1);
    const a = this.andarilho;
    if (this.modo === 'andar') {
      const vh = Math.hypot(this.vel.x, this.vel.z), f = Math.min(vh / 7, 1);
      this.passada += vh * dt * 1.6;
      const sw = this.noChao ? Math.sin(this.passada) * 0.8 * f : 0.5;
      a.pe[0].rotation.x = sw; a.pe[1].rotation.x = this.noChao ? -sw : -0.3; a.br[0].rotation.x = -sw * 0.8; a.br[1].rotation.x = sw * 0.8;
      a.g.position.y = this.noChao ? Math.abs(Math.sin(this.passada)) * 0.07 * f : 0;
    }
    // deitar o corpo no voo
    this.deitado += ((this.modo === 'voo' ? 1 : 0) - this.deitado) * k;
    this.corpo.rotation.x = this.deitado * 1.3; this.corpo.position.y = this.deitado * 0.55;
    if (this.modo === 'voo') { a.pe[0].rotation.x = a.pe[1].rotation.x = 0.15; a.br[0].rotation.x = a.br[1].rotation.x = -2.6; }
    // inclinação: asas inclinam na curva; carro acompanha o chão
    if (this.modo === 'voo') {
      this.inclina += (-e.x * 0.55 - this.inclina) * (1 - Math.exp(-4 * dt));
      this.pivo.rotation.set(-lim(this.vel.y / 18, -0.35, 0.35), 0, this.inclina);
    } else if (this.modo === 'carro') {
      const p = this.pos, c = Math.cos(this.yaw), sn = Math.sin(this.yaw), h = (lx, lz) => chao(p.x + lx * c + lz * sn, p.z - lx * sn + lz * c, p.y + 0.6, 1).y;
      if (this.noChao) {
        this.pitchC += (-Math.atan2(h(0, 1.4) - h(0, -1.4), 2.8) - this.pitchC) * k;
        this.rollC += (Math.atan2(h(0.9, 0) - h(-0.9, 0), 1.8) - this.rollC) * k;
      } else this.pitchC += (-lim(this.vel.y / 30, -0.3, 0.3) - this.pitchC) * k * 0.5;
      this.pivo.rotation.set(this.pitchC, 0, this.rollC);
      for (const r of this.carro.rodas) r.rotation.x += this.vCarro * dt / 0.42;
    } else { this.inclina *= 0.9; this.pivo.rotation.set(0, 0, 0); }
  }
}

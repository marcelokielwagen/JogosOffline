/* =====================================================================
   PLANADOR — uma asa-delta de verdade: vela com listras e varetas,
   tubos de alumínio, mastro com cabos, trapézio e o piloto deitado
   na cadeirinha, segurando a barra (de pé no cume antes de saltar).
   Voo calmo e sem queda: o chão e a água "empurram" o planador para
   cima (nunca bate), espirais de vento sobem sozinhas e o Espaço dá
   um sopro para subir quando quiser.
   ===================================================================== */
function montarPlanador() {
  const g = new THREE.Group();
  // ---------- vela: grade em envergadura (u) x corda (v), com barriga e bordo de fuga recortado ----------
  const NU = 48, NV = 10, SPAN = 4.7;
  const ataque = u => -1.65 + 2.05 * u, fuga = u => 1.35 - 0.62 * Math.pow(u, 1.2) - 0.07 * Math.abs(Math.sin(u * Math.PI * 5));
  const altura = (u, v) => 0.17 * Math.sin(Math.PI * Math.pow(v, 0.8)) * (1 - 0.55 * u) - 0.12 * u * u + 0.05 * v * u;
  const cores = { borda: new THREE.Color('#fbf6ee'), vela: new THREE.Color('#fff4e2'), faixa1: new THREE.Color('#f39a76'), faixa2: new THREE.Color('#f7c35f'), faixa3: new THREE.Color('#7fc6c0') };
  const P = [], C = [], I = [], pt = (lado, u, v) => { const zA = ataque(u), zF = fuga(u); return [lado * SPAN * u, altura(u, v), mix(zA, zF, v)]; };
  const corDe = (u, v) => {
    if (v < 0.14) return cores.borda;                      // bolsa de bordo de ataque, mais clara
    const w = u + v * 0.35;                                // listras em chevron
    if (w > 0.42 && w < 0.5) return cores.faixa1; if (w > 0.5 && w < 0.56) return cores.faixa2; if (w > 0.56 && w < 0.62) return cores.faixa3;
    return cores.vela;
  };
  for (const lado of [-1, 1]) {
    const base = P.length / 3;
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const u = i / NU, v = j / NV; P.push(...pt(lado, u, v)); const c = corDe(u, v); C.push(c.r, c.g, c.b); }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = base + i * (NV + 1) + j, b = a + NV + 1;
      if (lado > 0) I.push(a, a + 1, b, b, a + 1, b + 1); else I.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const gVela = new THREE.BufferGeometry(); gVela.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gVela.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); gVela.setIndex(I); gVela.computeVertexNormals();
  const vela = new THREE.Mesh(gVela, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); vela.castShadow = true; g.add(vela);
  // varetas (linhas finas sobre a vela)
  const varetas = [];
  for (const lado of [-1, 1]) for (let i = 3; i < NU; i += 6) for (let j = 1; j < NV; j++) { varetas.push(...pt(lado, i / NU, (j - 1) / NV), ...pt(lado, i / NU, j / NV)); }
  for (let k = 1; k < varetas.length; k += 3) varetas[k] += 0.012;
  const gVar = new THREE.BufferGeometry(); gVar.setAttribute('position', new THREE.Float32BufferAttribute(varetas, 3));
  g.add(new THREE.LineSegments(gVar, new THREE.LineBasicMaterial({ color: '#e3cfb2' })));
  // ---------- estrutura de alumínio ----------
  const metal = new THREE.MeshStandardMaterial({ color: '#c7ccd2', roughness: 0.35, metalness: 0.6 });
  const tubo = (a, b, r = 0.035, mat = metal) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; g.add(m); return m;
  };
  const nariz = [0, -0.03, -1.65], cauda = [0, -0.06, 1.3], topoMastro = [0, 0.95, 0.05], pendura = [0, -0.07, 0.05];
  tubo(nariz, cauda, 0.04);                                                     // quilha
  for (const s of [-1, 1]) for (let i = 0; i < NU; i += 12) tubo(pt(s, i / NU, 0.02), pt(s, (i + 12) / NU, 0.02), 0.04);   // bordo de ataque
  tubo([0, 0.0, 0.05], topoMastro, 0.03);                                       // mastro
  const bA = [-0.82, -1.5, -0.62], bB = [0.82, -1.5, -0.62];
  tubo(pendura, bA, 0.03); tubo(pendura, bB, 0.03); tubo(bA, bB, 0.033);         // trapézio e barra
  const pontaE = pt(-1, 1, 0.3), pontaD = pt(1, 1, 0.3);
  // cabos: de cima (mastro) e de baixo (barra)
  const cabos = [];
  for (const q of [nariz, cauda, pontaE, pontaD, pt(-1, 0.55, 0.05), pt(1, 0.55, 0.05)]) cabos.push(...topoMastro, ...q);
  for (const q of [nariz, cauda]) cabos.push(...bA, ...q, ...bB, ...q);
  cabos.push(...bA, ...pt(-1, 0.55, 0.05), ...bB, ...pt(1, 0.55, 0.05), ...bA, ...pontaE, ...bB, ...pontaD);
  const gCab = new THREE.BufferGeometry(); gCab.setAttribute('position', new THREE.Float32BufferAttribute(cabos, 3));
  g.add(new THREE.LineSegments(gCab, new THREE.LineBasicMaterial({ color: '#9aa1a8', transparent: true, opacity: 0.75 })));
  // ---------- piloto: pendurado pela fita, deitado na cadeirinha ----------
  const pele = new THREE.MeshLambertMaterial({ color: '#f1c9a5' }), roupa = new THREE.MeshLambertMaterial({ color: '#6fb0b4' }), cadeira = new THREE.MeshLambertMaterial({ color: '#f2a979' });
  const capacete = new THREE.MeshStandardMaterial({ color: '#fff3dc', roughness: 0.3 }), viseira = new THREE.MeshStandardMaterial({ color: '#cfe6ea', roughness: 0.1, metalness: 0.3 });
  const piloto = new THREE.Group(); piloto.position.set(0, -1.12, 0.05); g.add(piloto);   // pivô = onde a fita prende na cadeirinha
  const parte = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.x = rx; m.castShadow = true; piloto.add(m); return m; };
  const esfera = new THREE.SphereGeometry(1, 14, 10), cil = new THREE.CylinderGeometry(1, 1, 1, 10);
  parte(esfera, cadeira, 0, -0.04, 0.35, 0.27, 0.22, 0.85);          // casulo da cadeirinha (pernas dentro)
  parte(esfera, roupa, 0, 0.02, -0.25, 0.25, 0.2, 0.36);             // tronco e ombros
  parte(esfera, cadeira, 0, 0.17, 0.05, 0.2, 0.08, 0.5);             // paraquedas reserva nas costas
  parte(esfera, capacete, 0, 0.1, -0.75, 0.15, 0.15, 0.17);          // capacete
  parte(esfera, pele, 0, 0.03, -0.8, 0.11, 0.11, 0.11);              // rosto
  parte(esfera, viseira, 0, 0.07, -0.86, 0.12, 0.06, 0.08);          // viseira
  // braços: dos ombros até a barra
  const maoE = new THREE.Vector3(-0.34, -0.38, -0.67), maoD = new THREE.Vector3(0.34, -0.38, -0.67);
  for (const [om, mao] of [[new THREE.Vector3(-0.22, 0.02, -0.45), maoE], [new THREE.Vector3(0.22, 0.02, -0.45), maoD]]) {
    const d = mao.clone().sub(om), m = new THREE.Mesh(cil, roupa); m.scale.set(0.055, d.length(), 0.055);
    m.position.copy(om).add(mao).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); piloto.add(m);
    const luva = new THREE.Mesh(esfera, pele); luva.scale.setScalar(0.06); luva.position.copy(mao); piloto.add(luva);
  }
  // fita que liga a cadeirinha ao ponto de pendurar
  const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.05, 5), new THREE.MeshLambertMaterial({ color: '#e8dccb' }));
  fita.position.set(0, -0.59, 0.05); g.add(fita);
  // pontas das asas (onde nascem os rastros)
  const pontas = [new THREE.Vector3(...pt(-1, 1, 0.5)), new THREE.Vector3(...pt(1, 1, 0.5))];
  return { g, pontas, piloto };
}

// rastro: fita que some aos poucos, presa numa ponta da asa
class Rastro {
  constructor(cena, n = 28) {
    this.n = n; this.pts = []; this.vivo = 0;
    const pos = new Float32Array(n * 2 * 3), cor = new Float32Array(n * 2 * 4), ind = [];
    for (let i = 0; i < n - 1; i++) { const o = i * 2; ind.push(o, o + 1, o + 2, o + 2, o + 1, o + 3); }
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.geo.setAttribute('color', new THREE.BufferAttribute(cor, 4)); this.geo.setIndex(ind);
    this.m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.m.frustumCulled = false; this.m.renderOrder = 4; cena.add(this.m);
  }
  limpar() { this.pts.length = 0; }
  atualizar(p, lado, forca) {
    this.pts.unshift([p.x, p.y, p.z, lado.x, lado.y, lado.z]); if (this.pts.length > this.n) this.pts.pop();
    const pos = this.geo.attributes.position.array, cor = this.geo.attributes.color.array, L = this.pts.length;
    for (let i = 0; i < this.n; i++) {
      const q = this.pts[Math.min(i, L - 1)] || [p.x, p.y, p.z, 0, 0, 0], u = i / (this.n - 1), w = 0.09 * (1 - u);
      pos.set([q[0] - q[3] * w, q[1] - q[4] * w, q[2] - q[5] * w, q[0] + q[3] * w, q[1] + q[4] * w, q[2] + q[5] * w], i * 6);
      const a = i < L ? Math.pow(1 - u, 1.5) * 0.5 * forca : 0;
      cor.set([1, 0.97, 0.88, a, 1, 0.97, 0.88, a], i * 8);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}

class Planador {
  constructor(cena) {
    const m = montarPlanador(); this.g = m.g; this.pontasLocais = m.pontas; this.piloto = m.piloto; this.pose = 1; cena.add(this.g);
    this.rastros = [new Rastro(cena), new Rastro(cena)];
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.v = 20; this.yaw = 0; this.pitch = 0; this.roll = 0; this.taxaYaw = 0;
    this.estado = 'pousado';      // 'pousado' (no cume, antes de saltar) · 'voando'
    this.termica = null; this.sopro = 0; this.ajuda = 0; this.vy = 0; this.rasante = 0;
    this.aoSaltar = null;
  }
  get frente() { return new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)); }
  pousar(x, y, z, yaw) {
    this.pos.set(x, y, z); this.yaw = yaw; this.pitch = 0; this.roll = 0; this.v = 0; this.vy = 0; this.estado = 'pousado'; this.termica = null;
    this.rastros.forEach(r => r.limpar()); this.atualizarModelo(0, 0);
  }
  saltar() {
    if (this.estado !== 'pousado') return;
    this.estado = 'voando'; this.v = 17; this.pitch = -0.32; this.vy = 0; Som.salto();
    if (this.aoSaltar) this.aoSaltar();
  }

  // e: { x: curva (-1 esq · 1 dir), y: arfagem (1 = mergulha · -1 = sobe), sopro: bool, piloto: {yaw, pitch} ou null }
  atualizar(dt, e, t, mundo) {
    if (this.estado === 'pousado') { this.atualizarModelo(dt, t); return; }
    // --- comando: curva e arfagem (ou o piloto do vento, ou a espiral da térmica) ---
    let rollAlvo = -e.x * 0.78, pitchAlvo = -0.05 - e.y * 0.42;
    const T = this.termica, emTermica = T && !e.x && !e.y && !e.piloto;
    if (e.piloto) {
      const dy = angDif(this.yaw, e.piloto.yaw); rollAlvo = lim(dy * 1.6, -0.8, 0.8);
      pitchAlvo = lim(e.piloto.pitch, -0.7, 0.35);
    } else if (emTermica) {
      // circula em volta do centro da coluna, num raio confortável (giro para a direita)
      const dx = this.pos.x - T.x, dz = this.pos.z - T.z, d = Math.hypot(dx, dz) || 1, R0 = T.r * 0.5, rx = dx / d, rz = dz / d;
      const corr = lim((d - R0) / R0, -1, 1) * 0.7, Dx = -rz - corr * rx, Dz = rx - corr * rz;
      rollAlvo = lim(angDif(this.yaw, Math.atan2(-Dx, -Dz)) * 1.5 - (this.v / R0) / 0.95, -0.85, 0.85);
      pitchAlvo = 0.02;
    }
    if (e.sopro) pitchAlvo += 0.12;
    if (this.v < 14) pitchAlvo = Math.min(pitchAlvo, -0.12);          // devagar demais: abaixa o bico
    this.roll += (rollAlvo - this.roll) * Math.min(1, dt * 2.4);
    this.pitch += (pitchAlvo - this.pitch) * Math.min(1, dt * 1.8);
    this.taxaYaw = this.roll * 0.95;
    this.yaw += this.taxaYaw * dt;
    // --- energia: mergulhar acelera, subir freia ---
    this.v += (-9.8 * Math.sin(this.pitch) - 0.16 * (this.v - 19)) * dt;
    if (e.sopro) this.v -= 0.5 * dt;
    if (T) this.v += (18 - this.v) * dt * 0.6;
    this.v = lim(this.v, 12, 40);
    // --- sustentação: térmicas, encostas, sopro; afunda devagar ---
    let sobe = -1.15;
    if (T) sobe += T.forca;
    sobe += mundo.encosta(this.pos);
    if (e.sopro) { sobe += 5.2; this.sopro = Math.min(1, this.sopro + dt * 3); } else this.sopro = Math.max(0, this.sopro - dt * 2);
    if (this.pos.y > 560) sobe -= (this.pos.y - 560) * 0.25;
    // --- chão macio: o vento de baixo nunca deixa encostar ---
    const f = this.frente, chaoAqui = mundo.piso(this.pos.x, this.pos.z, this.pos.y);
    const adiante = Math.max(mundo.piso(this.pos.x + f.x * this.v * 1.2, this.pos.z + f.z * this.v * 1.2, this.pos.y + Math.min(this.vel.y, 0) * 1.2), mundo.piso(this.pos.x + f.x * this.v * 2.4, this.pos.z + f.z * this.v * 2.4, this.pos.y + Math.min(this.vel.y, 0) * 2.4));
    const folga = this.pos.y - chaoAqui, folgaAdiante = this.pos.y - adiante;
    this.ajuda = 0;
    if (folgaAdiante < 14) { const k = (14 - folgaAdiante) / 14; sobe += k * k * 16; this.pitch += (0.25 - this.pitch) * Math.min(1, dt * 2.5 * k); this.ajuda = k; }
    if (folga < 8) { sobe += (8 - folga) * 2.2; this.ajuda = Math.max(this.ajuda, (8 - folga) / 8); }
    this.rasante = 1 - suave(4, 30, folga);
    this.vy += (sobe - this.vy) * Math.min(1, dt * 3);
    this.vel.set(f.x * this.v, f.y * this.v + this.vy, f.z * this.v);
    this.pos.addScaledVector(this.vel, dt);
    const minimo = mundo.piso(this.pos.x, this.pos.z, this.pos.y) + 2.6;
    if (this.pos.y < minimo) { this.pos.y = minimo; if (this.vel.y < 0) this.vy = Math.max(this.vy, 0); }
    // --- borda do mundo: o vento traz de volta, sem parede ---
    const borda = Math.max(Math.abs(this.pos.x), Math.abs(this.pos.z));
    this.voltando = borda > 820;
    if (this.voltando) { const alvo = Math.atan2(this.pos.x, this.pos.z); this.yaw += angDif(this.yaw, alvo) * dt * 0.9 * suave(820, 900, borda); }
    this.atualizarModelo(dt, t);
  }

  atualizarModelo(dt, t) {
    const g = this.g; g.position.copy(this.pos);
    g.rotation.set(0, 0, 0); g.rotation.order = 'YXZ';
    const balanco = this.estado === 'pousado' ? Math.sin(t * 1.3) * 0.03 : Math.sin(t * 0.9) * 0.025 + this.sopro * Math.sin(t * 14) * 0.03;
    g.rotation.y = this.yaw; g.rotation.x = this.pitch + (this.estado === 'pousado' ? 0.04 : 0); g.rotation.z = this.roll + balanco;
    // piloto: de pé no cume, deitado em voo; o corpo pende um pouco para o lado da curva
    this.pose += ((this.estado === 'pousado' ? 1 : 0) - this.pose) * Math.min(1, (dt || 0.016) * 2.5);
    this.piloto.rotation.set(this.pose * Math.PI * 0.47, 0, -this.roll * 0.35 * (1 - this.pose));
    g.updateMatrixWorld();
    const lado = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
    const forca = this.estado === 'voando' ? 0.25 + 0.75 * suave(16, 34, this.v) : 0;
    this.pontasLocais.forEach((p, i) => this.rastros[i].atualizar(p.clone().applyMatrix4(g.matrixWorld), lado, forca));
  }
}

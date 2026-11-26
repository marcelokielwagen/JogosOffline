/* =====================================================================
   PLANADOR — a única forma do jogo: uma asa leve cor de creme, sem
   piloto à mostra, com rastros de luz nas pontas.
   Voo calmo e sem queda: o chão e a água "empurram" o planador para
   cima (nunca bate), espirais de vento sobem sozinhas e o Espaço dá
   um sopro para subir quando quiser.
   ===================================================================== */
function montarPlanador() {
  const g = new THREE.Group();
  // asa em flecha, com pontas que sobem de leve; feita à mão (dois lados)
  const P = [], C = [], creme = new THREE.Color('#fff8ec'), ouro = new THREE.Color('#f2c46e'), pessego = new THREE.Color('#f7d2b4');
  const perfil = [ // [x (envergadura), z bordo de ataque, z bordo de fuga, y]
    [0, -1.25, 1.1, 0], [0.9, -0.95, 1.05, 0.04], [1.9, -0.55, 0.95, 0.1], [2.9, -0.1, 0.8, 0.2], [3.7, 0.3, 0.72, 0.38], [4.15, 0.55, 0.7, 0.62],
  ];
  for (const lado of [-1, 1]) for (let i = 0; i < perfil.length - 1; i++) {
    const [x0, a0, f0, y0] = perfil[i], [x1, a1, f1, y1] = perfil[i + 1];
    const meio0 = mix(a0, f0, 0.5), meio1 = mix(a1, f1, 0.5);
    // duas faixas por trecho: frente (creme) e trás (pêssego), e um filete dourado no bordo
    const quad = (A, B, Cc, D, cor) => { P.push(...A, ...B, ...Cc, ...Cc, ...B, ...D); for (let k = 0; k < 6; k++) C.push(cor.r, cor.g, cor.b); };
    const v = (x, z, y, dy = 0) => [x * lado, y + dy, z];
    quad(v(x0, a0, y0, 0.03), v(x0, a0 + 0.12, y0, 0.05), v(x1, a1, y1, 0.03), v(x1, a1 + 0.12, y1, 0.05), ouro);
    quad(v(x0, a0 + 0.12, y0, 0.05), v(x0, meio0, y0, 0.07), v(x1, a1 + 0.12, y1, 0.05), v(x1, meio1, y1, 0.07), creme);
    quad(v(x0, meio0, y0, 0.07), v(x0, f0, y0), v(x1, meio1, y1, 0.07), v(x1, f1, y1), i % 2 ? creme : pessego);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  geo.computeVertexNormals();
  const asa = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  asa.castShadow = true; g.add(asa);
  // casulo: corpinho liso sob a asa, com anel dourado
  const casulo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12), new THREE.MeshStandardMaterial({ color: '#fffaf2', roughness: 0.45 }));
  casulo.scale.set(0.8, 0.7, 2.6); casulo.position.set(0, -0.32, 0.05); casulo.castShadow = true; g.add(casulo);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.05, 8, 24), new THREE.MeshStandardMaterial({ color: '#f0bd5e', roughness: 0.3, metalness: 0.3 }));
  anel.position.set(0, -0.32, -0.25); g.add(anel);
  const vidro = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), new THREE.MeshStandardMaterial({ color: '#cfe9ec', roughness: 0.1, metalness: 0.2 }));
  vidro.scale.set(0.9, 0.7, 1.4); vidro.position.set(0, -0.18, -0.55); g.add(vidro);
  // cauda em V
  const cauda = new THREE.BufferGeometry();
  cauda.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.2, 0.9, 0, -0.2, 1.9, -0.75, 0.25, 1.95, 0, -0.2, 0.9, 0, -0.2, 1.9, 0.75, 0.25, 1.95], 3)); cauda.computeVertexNormals();
  g.add(new THREE.Mesh(cauda, new THREE.MeshLambertMaterial({ color: '#f9e3c8', side: THREE.DoubleSide })));
  // pontas das asas (onde nascem os rastros)
  const pontas = [new THREE.Vector3(-4.15, 0.62, 0.66), new THREE.Vector3(4.15, 0.62, 0.66)];
  return { g, pontas };
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
    const m = montarPlanador(); this.g = m.g; this.pontasLocais = m.pontas; cena.add(this.g);
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
      pitchAlvo = lim(e.piloto.pitch, -0.5, 0.35);
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
    g.updateMatrixWorld();
    const lado = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
    const forca = this.estado === 'voando' ? 0.25 + 0.75 * suave(16, 34, this.v) : 0;
    this.pontasLocais.forEach((p, i) => this.rastros[i].atualizar(p.clone().applyMatrix4(g.matrixWorld), lado, forca));
  }
}

// Desenho 3D do Pinball Show (Three.js guardado em lib/three, funciona sem internet).
// Protótipo cinza: as formas e os andares de verdade, sem pintura nem neon (isso vem nas próximas fases).
// Mesa no plano XZ: x da mesa → X, y da mesa → Z (o fundo fica longe), altura → Y.
import * as THREE from 'three';
import { W, H, R, Z, CHAO, paredes, palhetas, ESTILINGUES, TECLADO, TECLAS, VINIL, BURACO, TRILHAS, LANCADOR } from './layout.js';

const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, y - H / 2);

export function criarCena(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0c0d12, 1);
  const cv = renderer.domElement;
  cv.className = 'tela3d';
  cv.setAttribute('aria-label', 'Mesa de pinball em 3D');
  container.appendChild(cv);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 10, 5000);

  // ---------- Luz ----------
  cena.add(new THREE.HemisphereLight(0xe8ecff, 0x30323c, 1.1));
  const sol = new THREE.DirectionalLight(0xffffff, 1.6);
  sol.position.set(-160, 520, 260);
  sol.target.position.set(0, 0, 0);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -260, right: 260, top: 480, bottom: -480, near: 100, far: 1400 });
  sol.shadow.bias = -.0008;
  cena.add(sol, sol.target);

  // ambiente refletido no metal (bola, trilhos)
  {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.45, '#9aa2b6'); gr.addColorStop(.55, '#3a3e4a'); gr.addColorStop(1, '#15161c');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#fff'; g.fillRect(30, 20, 60, 8); g.fillRect(160, 20, 60, 8);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer);
    cena.environment = pm.fromEquirectangular(t).texture;
    cena.environmentIntensity = .5;
    t.dispose(); pm.dispose();
  }

  // ---------- Materiais ----------
  const mat = (cor, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: .7, metalness: 0 }, o));
  const M = {
    andar: [mat(0x555a66), mat(0x6c717e), mat(0x878c99)],
    lateral: mat(0x3a3d46),
    parede: mat(0xb4b9c4, { roughness: .35, metalness: .6 }),
    borracha: mat(0xf2f2f2, { roughness: .5 }),
    palheta: mat(0xf4f4f4, { roughness: .4 }),
    pino: mat(0xcfd3dc, { roughness: .25, metalness: .8 }),
    rampa: mat(0xc9cfdb, { roughness: .3, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }),
    rampaLado: mat(0xdfe3ec, { roughness: .3, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false }),
    vidro: new THREE.MeshPhysicalMaterial({ color: 0xdfe8ff, roughness: .05, metalness: 0, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }),
    tecla: mat(0xf0f0f0, { roughness: .45 }),
    teclaAcesa: mat(0xffe27a, { roughness: .45, emissive: 0x6a5200 }),
    teclaPreta: mat(0x1c1d22, { roughness: .4 }),
    buraco: new THREE.MeshBasicMaterial({ color: 0x050507 }),
    bola: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .12, metalness: 1, envMapIntensity: 1.6 }),
  };

  const sombra = (m, faz = true, recebe = true) => { m.castShadow = faz; m.receiveShadow = recebe; return m; };
  const forma = poly => { const s = new THREE.Shape(); poly.forEach(([x, y], i) => i ? s.lineTo(x - W / 2, H / 2 - y) : s.moveTo(x - W / 2, H / 2 - y)); return s; };
  function extrudar(poly, zBaixo, zAlto, material) {
    const g = new THREE.ExtrudeGeometry(forma(poly), { depth: zAlto - zBaixo, bevelEnabled: false, curveSegments: 2 });
    g.rotateX(-Math.PI / 2); g.translate(0, zBaixo, 0);
    const m = sombra(new THREE.Mesh(g, material));
    cena.add(m); return m;
  }
  function caixa(w, h, d, material, x, y, z) {
    const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
    m.position.copy(P(x, y, z)); cena.add(m); return m;
  }

  // ---------- Os três andares (degraus) ----------
  CHAO.forEach((poly, i) => extrudar(poly, -14, Z[i], M.andar[i]));

  // ---------- Gabinete ----------
  caixa(14, 92, 470, M.lateral, 13, 235, 32);       // laterais altas no fundo
  caixa(14, 92, 470, M.lateral, 387, 235, 32);
  caixa(14, 40, 372, M.lateral, 13, 656, 6);         // laterais baixas na frente
  caixa(14, 40, 372, M.lateral, 387, 656, 6);
  caixa(W + 28, 110, 14, M.lateral, W / 2, 6, 40);   // parede do fundo

  // ---------- Paredes ----------
  for (const p of paredes) {
    if (p.tipo === 'degrau' || p.tipo === 'teclado' || p.tipo === 'borracha' || p.tipo === 'rampa') continue;
    const dx = p.bx - p.ax, dy = p.by - p.ay, L = Math.hypot(dx, dy);
    const alt = p.tipo === 'portao' ? 4 : 12;
    const m = caixa(L + p.r, alt, p.r * 1.6, M.parede, (p.ax + p.bx) / 2, (p.ay + p.by) / 2, Z[p.andar] + alt / 2);
    m.rotation.y = -Math.atan2(dy, dx);
  }
  // estilingues: triângulos de borracha
  const estilingues = ESTILINGUES.map(s => extrudar([s.a, s.b, s.c], 0, 12, M.borracha.clone()));

  // ---------- Rampas, lançador e elevador ----------
  function fita(bordaA, bordaB, material) {
    const pos = [];
    for (let i = 0; i < bordaA.length - 1; i++) {
      const a = bordaA[i], b = bordaA[i + 1], c = bordaB[i], d = bordaB[i + 1];
      pos.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material); m.receiveShadow = true; cena.add(m); return m;
  }
  function desenharRampa(T, largura, cor) {
    const esq = [], dir = [], esqA = [], dirA = [];
    T.pts.forEach((p, i) => {
      const a = T.pts[Math.max(0, i - 1)], b = T.pts[Math.min(T.pts.length - 1, i + 1)];
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, w = largura / 2;
      const zc = p.z - 1;
      esq.push(P(p.x + nx * w, p.y + ny * w, zc)); dir.push(P(p.x - nx * w, p.y - ny * w, zc));
      esqA.push(P(p.x + nx * w, p.y + ny * w, zc + 11)); dirA.push(P(p.x - nx * w, p.y - ny * w, zc + 11));
    });
    fita(esq, dir, cor || M.rampa);
    fita(esq, esqA, M.rampaLado); fita(dir, dirA, M.rampaLado);
    // trilhos de metal em cima das laterais
    for (const borda of [esqA, dirA]) {
      const tubo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(borda), borda.length * 2, 1.4, 6), M.parede);
      tubo.castShadow = true; cena.add(tubo);
    }
  }
  for (const nome of ['rampaE', 'rampaD', 'rampaC']) desenharRampa(TRILHAS[nome], TRILHAS[nome].largura - 2);
  desenharRampa(TRILHAS.lancador, 26, M.andar[0]);
  // lançador: pistão
  const pistao = caixa(10, 10, 24, M.pino, LANCADOR.x, LANCADOR.base + R + 12, 5);
  // elevador: torre e tubo de vidro
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 86, 24, 1, true), M.vidro);
  torre.position.copy(P(BURACO.x, BURACO.y, 43)); cena.add(torre);
  caixa(30, 3, 30, M.pino, BURACO.x, BURACO.y, 87.5);   // telhado da torre
  const elev = TRILHAS.elevador.pts.slice(1).map(p => P(p.x, p.y, p.z + R));
  cena.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(elev, false, 'catmullrom', .1), 60, 11, 16, false), M.vidro));
  const plataforma = sombra(new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 3, 24), M.pino));
  cena.add(plataforma);
  const buraco = new THREE.Mesh(new THREE.CircleGeometry(11, 32), M.buraco);
  buraco.rotation.x = -Math.PI / 2; buraco.position.copy(P(BURACO.x, BURACO.y, .3)); cena.add(buraco);

  // ---------- Palhetas ----------
  const malhaPalheta = palhetas.map(p => {
    const s = new THREE.Shape(), n = 14;
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + Math.PI * i / n; s.lineTo(p.rb * Math.cos(a), p.rb * Math.sin(a)); }
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; s.lineTo(p.len + p.rt * Math.cos(a), p.rt * Math.sin(a)); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 9, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    const m = sombra(new THREE.Mesh(g, M.palheta));
    m.position.copy(P(p.px, p.py, Z[p.andar] + 1));
    const pino = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 12, 12), M.pino);
    pino.position.set(0, 6, 0); m.add(pino);
    cena.add(m); return m;
  });

  // ---------- Teclado gigante ----------
  const zT = Z[2], wT = (TECLADO.x1 - TECLADO.x0) / TECLADO.n, dT = TECLADO.y1 - TECLADO.y0;
  const malhaTecla = TECLAS.map(t => caixa(wT - 1.6, 10, dT, M.tecla, (t.ax + t.bx) / 2, (TECLADO.y0 + TECLADO.y1) / 2, zT + 5));
  [0, 1, 3, 4, 5, 7, 8].forEach(i => caixa(wT * .55, 5, dT * .55, M.teclaPreta, TECLADO.x0 + (i + 1) * wT, TECLADO.y0 + dT * .275, zT + 12));
  caixa(TECLADO.x1 - TECLADO.x0 + 8, 18, 10, M.lateral, (TECLADO.x0 + TECLADO.x1) / 2, TECLADO.y0 - 5, zT + 9);

  // ---------- Vinil (andar do meio) ----------
  const discoTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#141418'; g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
    for (let r = 250; r > 90; r -= 5) { g.strokeStyle = r % 3 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.11)'; g.lineWidth = 1.5; g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#9a9ea8'; g.beginPath(); g.arc(256, 256, 80, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8dbe2'; g.fillRect(250, 186, 12, 40);
    g.fillStyle = '#141418'; g.beginPath(); g.arc(256, 256, 7, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  const vinil = new THREE.Mesh(new THREE.CylinderGeometry(VINIL.r, VINIL.r, 2, 64),
    [mat(0x111114), new THREE.MeshStandardMaterial({ map: discoTex, roughness: .35, metalness: .1 }), mat(0x111114)]);
  vinil.receiveShadow = true;
  vinil.position.copy(P(VINIL.x, VINIL.y, Z[1] + 1)); cena.add(vinil);

  // ---------- Bolas ----------
  const geoBola = new THREE.SphereGeometry(R, 32, 20);
  const malhaBolas = [];
  function bolaMalha(i) {
    while (malhaBolas.length <= i) { const m = new THREE.Mesh(geoBola, M.bola); m.castShadow = true; cena.add(m); malhaBolas.push(m); }
    return malhaBolas[i];
  }

  // ---------- Câmera: enquadra a mesa inteira na tela ----------
  const cantos = [];
  for (const x of [0, W]) for (const y of [0, H]) for (const z of [-10, 70]) cantos.push(P(x, y, z));
  let alvo = new THREE.Vector3(0, 20, 30);
  function enquadrar() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const el = (w / h < .8 ? 58 : 50) * Math.PI / 180;
    const dir = new THREE.Vector3(0, Math.sin(el), Math.cos(el));
    const v = new THREE.Vector3();
    const extremos = d => {
      camera.position.copy(alvo).addScaledVector(dir, d); camera.lookAt(alvo); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      let mx = 0, y0 = 9, y1 = -9;
      for (const c of cantos) {
        v.copy(c).applyMatrix4(camera.matrixWorldInverse);
        if (v.z > -camera.near) return { mx: 9, y0: -9, y1: 9 };   // canto atrás da câmera: longe demais de caber
        v.copy(c).project(camera); mx = Math.max(mx, Math.abs(v.x)); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      return { mx, y0, y1 };
    };
    for (let volta = 0; volta < 6; volta++) {
      let a = 200, b = 6000;
      for (let i = 0; i < 30; i++) { const m = (a + b) / 2, e = extremos(m); if (e.mx > .97 || e.y0 < -.97 || e.y1 > .97) a = m; else b = m; }
      const e = extremos(b);
      // centraliza na vertical: empurra o alvo para frente ou para trás
      alvo.z -= (e.y0 + e.y1) / 2 * 300;
    }
    let a = 200, b = 6000;
    for (let i = 0; i < 30; i++) { const m = (a + b) / 2, e = extremos(m); if (e.mx > .97 || e.y0 < -.97 || e.y1 > .97) a = m; else b = m; }
    extremos(b);
  }
  enquadrar();
  new ResizeObserver(enquadrar).observe(container);

  // ---------- Atualiza o desenho a cada quadro ----------
  function atualizar(F, tempo) {
    palhetas.forEach((p, i) => malhaPalheta[i].rotation.y = -p.ang);
    vinil.rotation.y = -VINIL.ang;
    TECLAS.forEach((t, i) => {
      const m = malhaTecla[i], afunda = F.relogio - t.toque < .18 ? -4 : 0;
      m.position.y = zT + 5 + afunda;
      m.material = t.acesa ? M.teclaAcesa : M.tecla;
    });
    ESTILINGUES.forEach((s, i) => estilingues[i].material.emissive.setHex(s.flash > 0 ? 0x666666 : 0));
    pistao.position.z = P(0, LANCADOR.base + R + 12 + LANCADOR.curso * F.puxar).z;
    // plataforma do elevador acompanha a bola que está subindo (ou fica embaixo)
    const sub = F.bolas.find(b => b.trilha && b.trilha.nome === 'elevador' && b.s < 78);
    plataforma.position.copy(P(BURACO.x, BURACO.y, sub ? sub.z - 1.5 : -1));
    F.bolas.forEach((b, i) => {
      const m = bolaMalha(i);
      m.visible = true;
      const y = b.naMola ? b.y + LANCADOR.curso * F.puxar : b.y;
      m.position.copy(P(b.x, y, b.z + R));
      m.rotation.x += (b.trilha ? b.v * .002 : b.vy * .0015) * .016;
      m.rotation.z -= (b.trilha ? 0 : b.vx * .0015) * .016;
    });
    for (let i = F.bolas.length; i < malhaBolas.length; i++) malhaBolas[i].visible = false;
    renderer.render(cena, camera);
  }

  // ponto da mesa → posição na tela (para mensagens que aparecem sobre a mesa)
  function naTela(x, y, z) {
    const v = P(x, y, z).project(camera);
    return { x: (v.x + 1) / 2 * container.clientWidth, y: (1 - v.y) / 2 * container.clientHeight };
  }

  return { atualizar, naTela, enquadrar };
}

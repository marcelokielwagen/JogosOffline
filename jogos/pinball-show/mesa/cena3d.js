// Desenho 3D do Pinball Show (Three.js guardado em lib/three, funciona sem internet).
// Visual disco neon: anime anos 80, plateia nas laterais, palco com teclado, vinil dourado, pista de dança,
// globo espelhado, lasers e brilho (bloom). Por enquanto as luzes pulsam num ritmo fixo (118 batidas por minuto);
// quando a música entrar, elas passam a seguir o som de verdade.
// Mesa no plano XZ: x da mesa → X, y da mesa → Z (o fundo fica longe), altura → Y.
import * as THREE from 'three';
import { EffectComposer } from '../../../lib/three/addons/EffectComposer.js';
import { RenderPass } from '../../../lib/three/addons/RenderPass.js';
import { UnrealBloomPass } from '../../../lib/three/addons/UnrealBloomPass.js';
import { OutputPass } from '../../../lib/three/addons/OutputPass.js';
import { W, H, R, Z, BORDA, CHAO, paredes, palhetas, ESTILINGUES, TECLADO, TECLAS, VINIL, BURACO, TRILHAS, LANCADOR, RAMPAS_INFO } from './layout.js';

const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, y - H / 2);
const BPM = 118;
const CORES = { rosa: 0xff2fb4, ciano: 0x22d8ff, ouro: 0xffc63a, verde: 0x3dff8c, laranja: 0xff7a2a, roxo: 0xa66bff };
const ARCO_IRIS = [CORES.rosa, CORES.ciano, CORES.ouro, CORES.verde, CORES.laranja, CORES.roxo];

function tela(w, h, desenho) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenho(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function criarCena(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  let pixel = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixel);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0a0318, 1);
  const cv = renderer.domElement;
  cv.className = 'tela3d';
  cv.setAttribute('aria-label', 'Mesa de pinball em 3D');
  container.appendChild(cv);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 10, 5000);

  // brilho dos neons
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(cena, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .35, 1.05);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  let comBrilho = true;

  // ---------- Luz ----------
  cena.add(new THREE.HemisphereLight(0x9a8cff, 0x2a0a3a, .9));
  const sol = new THREE.DirectionalLight(0xfff0f8, 1.1);
  sol.position.set(-160, 520, 260);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -260, right: 260, top: 480, bottom: -480, near: 100, far: 1400 });
  sol.shadow.bias = -.0008;
  cena.add(sol, sol.target);
  const luzRosa = new THREE.PointLight(CORES.rosa, 0, 700, 1.2); luzRosa.position.copy(P(40, 340, 300));
  const luzCiano = new THREE.PointLight(CORES.ciano, 0, 700, 1.2); luzCiano.position.copy(P(360, 560, 300));
  const luzOuro = new THREE.PointLight(CORES.ouro, 0, 500, 1.4); luzOuro.position.copy(P(190, 80, 130));
  cena.add(luzRosa, luzCiano, luzOuro);

  // ambiente refletido (bola e metais refletem as luzes coloridas do show)
  {
    const t = tela(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#2a0b55'); gr.addColorStop(.48, '#0d0322'); gr.addColorStop(.52, '#1a0738'); gr.addColorStop(1, '#3a0d4a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const faixa = (x, cor) => { g.fillStyle = cor; g.fillRect(x, 40, 60, 14); };
      faixa(30, '#ff2fb4'); faixa(140, '#ffffff'); faixa(250, '#22d8ff'); faixa(360, '#ffc63a'); faixa(450, '#ffffff');
      g.fillStyle = '#ff2fb4'; g.fillRect(0, 170, w, 6); g.fillStyle = '#22d8ff'; g.fillRect(0, 200, w, 4);
    });
    t.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    cena.environment = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose();
  }

  // ---------- Materiais ----------
  const mat = (cor, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: .6, metalness: 0 }, o));
  const neon = cor => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: cor, emissiveIntensity: 1.8, roughness: 1, toneMapped: true });
  const NEON = { rosa: neon(CORES.rosa), ciano: neon(CORES.ciano), ouro: neon(CORES.ouro), verde: neon(CORES.verde) };
  const M = {
    lateral: mat(0x150628, { roughness: .4, metalness: .3 }),
    base: mat(0x241a3e, { roughness: .25, metalness: .8 }),
    palheta: mat(0xffc94a, { roughness: .25, metalness: .85 }),
    pino: mat(0xe6e8f2, { roughness: .2, metalness: .9 }),
    rampa: new THREE.MeshPhysicalMaterial({ color: 0x7fe8ff, roughness: .1, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false }),
    rampaLado: new THREE.MeshPhysicalMaterial({ color: 0xff7ad6, roughness: .1, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }),
    vidro: new THREE.MeshPhysicalMaterial({ color: 0xa8f0ff, roughness: .05, transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false }),
    tecla: mat(0xf4f0ff, { roughness: .35 }),
    teclaPreta: mat(0x120a1e, { roughness: .3, metalness: .3 }),
    buraco: new THREE.MeshBasicMaterial({ color: 0x020005 }),
    bola: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .08, metalness: 1, envMapIntensity: 1.8 }),
    espelho: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .05, metalness: 1, flatShading: true, envMapIntensity: 2 }),
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
  // tubo de neon reto de (ax, ay, az) até (bx, by, bz)
  function tuboNeon(ax, ay, az, bx, by, bz, material, raio = 1.5) {
    const a = P(ax, ay, az), b = P(bx, by, bz), L = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, L, 8), material);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    cena.add(m); return m;
  }

  // ---------- Pintura do chão (uma pintura só para os 3 andares: eles não se sobrepõem) ----------
  const pintura = tela(800, 1640, (g, w, h) => {
    g.scale(w / W, h / H);
    // fundo roxo profundo
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#2a0a4a'); gr.addColorStop(.3, '#1a0638'); gr.addColorStop(.6, '#14042c'); gr.addColorStop(1, '#0c0220');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // estrelas
    let s = 11; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,${200 + rnd() * 55},255,${.2 + rnd() * .6})`; g.fillRect(rnd() * W, rnd() * H, rnd() < .9 ? .8 : 1.6, rnd() < .9 ? .8 : 1.6); }
    // ANDAR DE CIMA (palco): raios dourados saindo do teclado
    g.save(); g.beginPath(); g.rect(0, 0, W, BORDA[2]); g.clip();
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * (i / 24), cor = i % 2 ? 'rgba(255,198,58,.16)' : 'rgba(255,47,180,.12)';
      g.fillStyle = cor; g.beginPath(); g.moveTo(190, 110);
      g.lineTo(190 + 400 * Math.cos(a - .06), 110 + 400 * Math.sin(a - .06)); g.lineTo(190 + 400 * Math.cos(a + .06), 110 + 400 * Math.sin(a + .06)); g.fill();
    }
    g.restore();
    // ANDAR DO MEIO: ondas de som em volta do vinil e seta para a rampa do palco
    g.save(); g.beginPath(); g.rect(0, BORDA[2], W, BORDA[1] - BORDA[2]); g.clip();
    for (let r = 70; r < 200; r += 14) { g.strokeStyle = `rgba(34,216,255,${.28 - r / 900})`; g.lineWidth = 1.2; g.beginPath(); g.arc(VINIL.x, VINIL.y, r, 0, Math.PI * 2); g.stroke(); }
    g.restore();
    // ANDAR DE BAIXO: grade retrô anos 80 em perspectiva
    g.save(); g.beginPath(); g.rect(0, BORDA[1], W, H - BORDA[1]); g.clip();
    g.strokeStyle = 'rgba(255,47,180,.32)'; g.lineWidth = 1;
    for (let y = BORDA[1] + 10, k = 6; y < H; y += k, k *= 1.12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(185 + i * 12, BORDA[1]); g.lineTo(185 + i * 60, H); g.stroke(); }
    g.restore();
    // setas de neon nas bocas das rampas e no elevador
    const seta = (x, y, cor) => {
      g.fillStyle = cor; g.shadowColor = cor; g.shadowBlur = 6;
      for (let k = 0; k < 3; k++) { const yy = y + k * 13; g.beginPath(); g.moveTo(x, yy - 9); g.lineTo(x + 12, yy + 3); g.lineTo(x + 7, yy + 3); g.lineTo(x, yy - 4); g.lineTo(x - 7, yy + 3); g.lineTo(x - 12, yy + 3); g.closePath(); g.fill(); }
      g.shadowBlur = 0;
    };
    for (const r of RAMPAS_INFO) seta((r.x0 + r.x1) / 2, r.yBoca + 12, r.andarIni === 1 ? '#ffc63a' : r.x0 < 185 ? '#ff2fb4' : '#22d8ff');
    seta(BURACO.x, BURACO.y + 22, '#3dff8c');
    // estrelas nos corredores de retorno
    g.fillStyle = '#ffc63a';
    for (const [x, y] of [[33, 600], [59, 600], [311, 600], [337, 600]]) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.5 : 6; g.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); } g.fill(); }
  });
  pintura.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  pintura.repeat.set(1 / W, 1 / H); pintura.offset.set(.5, .5);
  const matChao = new THREE.MeshStandardMaterial({ map: pintura, emissiveMap: pintura, emissive: 0xffffff, emissiveIntensity: .45, roughness: .3, metalness: .1 });
  const matDegrau = [mat(0x1a0832, { roughness: .3, metalness: .5 }), mat(0x220a40, { roughness: .3, metalness: .5 })];

  // ---------- Os três andares (degraus) ----------
  CHAO.forEach((poly, i) => extrudar(poly, -14, Z[i], [matChao, matDegrau[i % 2]]));
  // faixas de neon na beirada de cada degrau
  tuboNeon(20, BORDA[1], Z[1], 350, BORDA[1], Z[1], NEON.rosa, 1.8);
  tuboNeon(20, BORDA[2], Z[2], 380, BORDA[2], Z[2], NEON.ouro, 1.8);
  tuboNeon(20, BORDA[1] + 1, Z[1] * .5, 350, BORDA[1] + 1, Z[1] * .5, NEON.ciano, 1);
  tuboNeon(20, BORDA[2] + 1, Z[1] + 15, 350, BORDA[2] + 1, Z[1] + 15, NEON.rosa, 1);

  // pista de dança (andar de baixo, entre os estilingues): ladrilhos que trocam de cor na batida
  const PISTA = { x0: 128, y0: 588, nx: 5, ny: 3, w: 23, h: 24 };
  const ladrilhos = new THREE.InstancedMesh(new THREE.BoxGeometry(PISTA.w - 2, 1, PISTA.h - 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff }), PISTA.nx * PISTA.ny);
  {
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < PISTA.nx * PISTA.ny; i++) {
      const cx = i % PISTA.nx, cy = Math.floor(i / PISTA.nx);
      m4.setPosition(P(PISTA.x0 + (cx + .5) * PISTA.w, PISTA.y0 + (cy + .5) * PISTA.h, .4));
      ladrilhos.setMatrixAt(i, m4);
    }
  }
  ladrilhos.receiveShadow = true;
  cena.add(ladrilhos);
  const corTmp = new THREE.Color();
  function sortearPista(forca) {
    for (let i = 0; i < PISTA.nx * PISTA.ny; i++) ladrilhos.setColorAt(i, corTmp.setHex(ARCO_IRIS[(Math.random() * 6) | 0]).multiplyScalar(Math.random() < .3 ? .12 : forca));
    ladrilhos.instanceColor.needsUpdate = true;
  }
  sortearPista(1);

  // ---------- Gabinete com a plateia ----------
  const plateia = tela(1024, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a0a50'); gr.addColorStop(1, '#0a0216');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    let s = 5; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    const cores = ['#ff2fb4', '#22d8ff', '#ffc63a', '#3dff8c', '#a66bff'];
    for (let fila = 0; fila < 3; fila++) {
      const yb = 70 + fila * 34, tom = ['#1c0a33', '#130624', '#0b0318'][fila];
      for (let x = rnd() * 20; x < w; x += 22 + rnd() * 10) {
        const y = yb + rnd() * 6;
        if (rnd() < .45) { const c = cores[(rnd() * 5) | 0]; g.strokeStyle = c; g.lineWidth = 3; g.shadowColor = c; g.shadowBlur = 8; g.beginPath(); g.moveTo(x + 4, y - 4); g.lineTo(x + 10 + rnd() * 6, y - 26 - rnd() * 10); g.stroke(); g.shadowBlur = 0; }
        g.fillStyle = tom; g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); g.fillRect(x - 12, y + 6, 24, 40);
        if (rnd() < .12) { g.fillStyle = '#fff'; g.fillRect(x - 2, y - 2, 3, 3); }
      }
    }
  });
  plateia.wrapS = THREE.RepeatWrapping;
  const matPlateia = new THREE.MeshStandardMaterial({ map: plateia, emissiveMap: plateia, emissive: 0xffffff, emissiveIntensity: .7, roughness: .8 });
  const lateral = (x, comprimento, y, alt, z, dentroPositivo) => {
    const tx = plateia.clone(); tx.repeat.set(comprimento / 180, 1); tx.needsUpdate = true;
    const mp = matPlateia.clone(); mp.map = tx; mp.emissiveMap = tx;
    const mats = [M.lateral, M.lateral, M.lateral, M.lateral, M.lateral, M.lateral];
    mats[dentroPositivo ? 0 : 1] = mp;
    const m = new THREE.Mesh(new THREE.BoxGeometry(14, alt, comprimento), mats);
    m.position.copy(P(x, y, z)); m.receiveShadow = true; cena.add(m); return m;
  };
  lateral(13, 470, 235, 100, 36, true); lateral(387, 470, 235, 100, 36, false);
  lateral(13, 372, 656, 40, 6, true); lateral(387, 372, 656, 40, 6, false);
  // neon no alto das laterais
  tuboNeon(20, 0, 86, 20, 470, 86, NEON.rosa); tuboNeon(380, 0, 86, 380, 470, 86, NEON.ciano);
  tuboNeon(20, 470, 26, 20, 840, 26, NEON.rosa); tuboNeon(380, 470, 26, 380, 840, 26, NEON.ciano);
  // painel do fundo com o letreiro
  const letreiro = tela(1024, 280, (g, w, h) => {
    g.fillStyle = '#0c0320'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? 'rgba(255,198,58,.10)' : 'rgba(255,47,180,.10)'; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2 + 900 * Math.cos(Math.PI + i * Math.PI / 18), h + 900 * Math.sin(Math.PI + i * Math.PI / 18)); g.lineTo(w / 2 + 900 * Math.cos(Math.PI + (i + 1) * Math.PI / 18), h + 900 * Math.sin(Math.PI + (i + 1) * Math.PI / 18)); g.fill(); }
    g.font = 'italic 900 120px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#22d8ff'; g.shadowColor = '#22d8ff'; g.shadowBlur = 30; g.strokeText('PINBALL SHOW', w / 2, h / 2);
    g.shadowColor = '#ff2fb4'; g.shadowBlur = 24; g.fillStyle = '#ffd6f2'; g.fillText('PINBALL SHOW', w / 2, h / 2);
  });
  const matsFundo = Array(6).fill(M.lateral);
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(W + 28, 120, 14), [...matsFundo.slice(0, 4), new THREE.MeshStandardMaterial({ map: letreiro, emissiveMap: letreiro, emissive: 0xffffff, emissiveIntensity: .85 }), M.lateral]);
  fundo.position.copy(P(W / 2, 6, 60)); cena.add(fundo);

  // ---------- Paredes: base cromada escura com tubo de neon em cima ----------
  for (const p of paredes) {
    if (p.tipo === 'degrau' || p.tipo === 'teclado' || p.tipo === 'borracha' || p.tipo === 'rampa') continue;
    const dx = p.bx - p.ax, dy = p.by - p.ay, L = Math.hypot(dx, dy);
    const alt = p.tipo === 'portao' ? 4 : 10, z0 = Z[p.andar];
    const m = caixa(L + p.r, alt, p.r * 1.6, M.base, (p.ax + p.bx) / 2, (p.ay + p.by) / 2, z0 + alt / 2);
    m.rotation.y = -Math.atan2(dy, dx);
    const cor = p.andar === 2 ? NEON.ouro : (p.ax + p.bx) / 2 < 185 ? NEON.rosa : NEON.ciano;
    tuboNeon(p.ax, p.ay, z0 + alt + 1, p.bx, p.by, z0 + alt + 1, cor, 1.3);
  }
  // estilingues: borracha que acende
  const matEst = [CORES.rosa, CORES.ciano].map(c => new THREE.MeshStandardMaterial({ color: 0x2a0a3a, emissive: c, emissiveIntensity: .8, roughness: .5 }));
  ESTILINGUES.forEach((s, i) => extrudar([s.a, s.b, s.c], 0, 12, matEst[i]));

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
  function desenharRampa(T, largura, piso, trilho) {
    const esq = [], dir = [], esqA = [], dirA = [];
    T.pts.forEach((p, i) => {
      const a = T.pts[Math.max(0, i - 1)], b = T.pts[Math.min(T.pts.length - 1, i + 1)];
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, w = largura / 2;
      const zc = p.z - 1;
      esq.push(P(p.x + nx * w, p.y + ny * w, zc)); dir.push(P(p.x - nx * w, p.y - ny * w, zc));
      esqA.push(P(p.x + nx * w, p.y + ny * w, zc + 11)); dirA.push(P(p.x - nx * w, p.y - ny * w, zc + 11));
    });
    fita(esq, dir, piso || M.rampa);
    fita(esq, esqA, M.rampaLado); fita(dir, dirA, M.rampaLado);
    for (const borda of [esqA, dirA]) cena.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(borda), borda.length * 2, 1.5, 6), trilho));
  }
  desenharRampa(TRILHAS.rampaE, TRILHAS.rampaE.largura - 2, null, NEON.rosa);
  desenharRampa(TRILHAS.rampaD, TRILHAS.rampaD.largura - 2, null, NEON.ciano);
  desenharRampa(TRILHAS.rampaC, TRILHAS.rampaC.largura - 2, null, NEON.ouro);
  desenharRampa(TRILHAS.lancador, 26, mat(0x1a0832, { roughness: .3, metalness: .5 }), NEON.ciano);
  const pistao = caixa(10, 10, 24, M.pino, LANCADOR.x, LANCADOR.base + R + 12, 5);
  // elevador: torre de vidro com anéis de neon e tubo até o palco
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 86, 24, 1, true), M.vidro);
  torre.position.copy(P(BURACO.x, BURACO.y, 43)); cena.add(torre);
  const aneis = [18, 44, 70].map((z, i) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(13.5, 1.2, 8, 32), [NEON.verde, NEON.ciano, NEON.rosa][i]);
    a.rotation.x = Math.PI / 2; a.position.copy(P(BURACO.x, BURACO.y, z)); cena.add(a); return a;
  });
  caixa(30, 3, 30, M.base, BURACO.x, BURACO.y, 87.5);
  tuboNeon(BURACO.x - 15, BURACO.y + 15, 89.5, BURACO.x + 15, BURACO.y + 15, 89.5, NEON.verde, 1);
  const elev = TRILHAS.elevador.pts.slice(1).map(p => P(p.x, p.y, p.z + R));
  cena.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(elev, false, 'catmullrom', .1), 60, 11, 16, false), M.vidro));
  const plataforma = sombra(new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 3, 24), NEON.verde));
  cena.add(plataforma);
  const buraco = new THREE.Mesh(new THREE.CircleGeometry(11, 32), M.buraco);
  buraco.rotation.x = -Math.PI / 2; buraco.position.copy(P(BURACO.x, BURACO.y, .3)); cena.add(buraco);

  // ---------- Palhetas douradas ----------
  const malhaPalheta = palhetas.map(p => {
    const s = new THREE.Shape(), n = 14;
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + Math.PI * i / n; s.lineTo(p.rb * Math.cos(a), p.rb * Math.sin(a)); }
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; s.lineTo(p.len + p.rt * Math.cos(a), p.rt * Math.sin(a)); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 9, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    const m = sombra(new THREE.Mesh(g, M.palheta));
    m.position.copy(P(p.px, p.py, Z[p.andar] + 1));
    const pino = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 12, 12), p.lado === 'E' ? NEON.rosa : NEON.ciano);
    pino.position.set(0, 6, 0); m.add(pino);
    cena.add(m); return m;
  });

  // ---------- Palco com o teclado gigante ----------
  const zT = Z[2], wT = (TECLADO.x1 - TECLADO.x0) / TECLADO.n, dT = TECLADO.y1 - TECLADO.y0;
  const matTeclaAcesa = TECLAS.map((t, i) => new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: ARCO_IRIS[i % 6], emissiveIntensity: 1.6, roughness: .3 }));
  const malhaTecla = TECLAS.map(t => caixa(wT - 1.6, 10, dT, M.tecla, (t.ax + t.bx) / 2, (TECLADO.y0 + TECLADO.y1) / 2, zT + 5));
  [0, 1, 3, 4, 5, 7, 8].forEach(i => caixa(wT * .55, 5, dT * .55, M.teclaPreta, TECLADO.x0 + (i + 1) * wT, TECLADO.y0 + dT * .275, zT + 12));
  caixa(TECLADO.x1 - TECLADO.x0 + 8, 18, 10, M.lateral, (TECLADO.x0 + TECLADO.x1) / 2, TECLADO.y0 - 5, zT + 9);
  tuboNeon(TECLADO.x0 - 4, TECLADO.y0 - 10, zT + 18.5, TECLADO.x1 + 4, TECLADO.y0 - 10, zT + 18.5, NEON.rosa, 1.4);
  tuboNeon(TECLADO.x0 - 4, TECLADO.y1 + 2, zT + .8, TECLADO.x1 + 4, TECLADO.y1 + 2, zT + .8, NEON.ciano, 1);

  // ---------- Vinil dourado (andar do meio) ----------
  const discoTex = tela(512, 512, (g) => {
    g.fillStyle = '#120c04'; g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
    for (let r = 250; r > 90; r -= 4) { g.strokeStyle = r % 3 ? 'rgba(255,210,120,.07)' : 'rgba(255,210,120,.16)'; g.lineWidth = 1.5; g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
    const gr = g.createRadialGradient(256, 256, 10, 256, 256, 86); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(.6, '#ffc63a'); gr.addColorStop(1, '#b07a10');
    g.fillStyle = gr; g.beginPath(); g.arc(256, 256, 86, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff2fb4'; g.beginPath(); g.moveTo(256, 190); g.lineTo(276, 236); g.lineTo(236, 236); g.fill();
    g.fillStyle = '#120c04'; g.beginPath(); g.arc(256, 256, 7, 0, Math.PI * 2); g.fill();
    // brilho de luz atravessando os sulcos
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 250, -.5, -.2); g.fill(); g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 250, 2.64, 2.94); g.fill();
  });
  const vinil = new THREE.Mesh(new THREE.CylinderGeometry(VINIL.r, VINIL.r, 2, 64),
    [mat(0x1a1206, { metalness: .6, roughness: .3 }), new THREE.MeshStandardMaterial({ map: discoTex, emissiveMap: discoTex, emissive: 0xffffff, emissiveIntensity: .35, roughness: .25, metalness: .3 }), mat(0x1a1206)]);
  vinil.receiveShadow = true;
  vinil.position.copy(P(VINIL.x, VINIL.y, Z[1] + 1)); cena.add(vinil);
  const aroVinil = new THREE.Mesh(new THREE.TorusGeometry(VINIL.r + 2, 1.4, 8, 64), NEON.ouro);
  aroVinil.rotation.x = Math.PI / 2; aroVinil.position.copy(P(VINIL.x, VINIL.y, Z[1] + 1)); cena.add(aroVinil);

  // ---------- Globo espelhado ----------
  const globo = new THREE.Mesh(new THREE.IcosahedronGeometry(13, 2), M.espelho);
  globo.position.copy(P(330, 205, 112)); cena.add(globo);
  tuboNeon(330, 205, 125, 330, 205, 160, M.pino, .4);

  // ---------- Lasers do palco ----------
  const lasers = [CORES.rosa, CORES.ciano, CORES.verde, CORES.ouro].map((c, i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 900, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.6), transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.geometry.translate(0, 450, 0);
    const pivo = new THREE.Group(); pivo.position.copy(P(i < 2 ? 40 + i * 30 : 340 - (i - 2) * 30, 30, 95)); pivo.add(m); cena.add(pivo);
    return { pivo, fase: i * 1.7, lado: i < 2 ? 1 : -1 };
  });

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
  const alvo = new THREE.Vector3(0, 20, 30);
  function enquadrar() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixel); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
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
    const ajustar = () => {
      let a = 200, b = 6000;
      for (let i = 0; i < 30; i++) { const m = (a + b) / 2, e = extremos(m); if (e.mx > .97 || e.y0 < -.97 || e.y1 > .97) a = m; else b = m; }
      return extremos(b);
    };
    for (let volta = 0; volta < 6; volta++) { const e = ajustar(); alvo.z -= (e.y0 + e.y1) / 2 * 300; }
    ajustar();
  }
  enquadrar();
  new ResizeObserver(enquadrar).observe(container);

  // ---------- Celular lento: desliga o brilho e reduz a resolução ----------
  let tempos = [], ultimoQuadro = performance.now();
  function vigiarVelocidade(agora) {
    tempos.push(agora - ultimoQuadro); ultimoQuadro = agora;
    if (tempos.length < 90) return;
    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    tempos = [];
    if (media > 34 && comBrilho) { comBrilho = false; }
    else if (media > 34 && pixel > 1) { pixel = Math.max(1, pixel - .5); renderer.setPixelRatio(pixel); enquadrar(); }
  }

  // ---------- Atualiza o desenho a cada quadro ----------
  let ultimaBatida = -1;
  function atualizar(F) {
    const agora = performance.now(), t = agora / 1000;
    vigiarVelocidade(agora);
    // ritmo: pulso forte no começo de cada batida
    const b = t * BPM / 60, nBatida = Math.floor(b), fase = b - nBatida, pulso = Math.exp(-fase * 5);
    if (nBatida !== ultimaBatida) { ultimaBatida = nBatida; sortearPista(1); }
    for (const n of Object.values(NEON)) n.emissiveIntensity = 1.6 + pulso * .8;
    luzRosa.intensity = 6e3 * (.5 + pulso * .8); luzCiano.intensity = 5e3 * (.5 + (1 - pulso) * .5); luzOuro.intensity = 3e3 * (.6 + pulso * .6);
    ladrilhos.material.color.setScalar(.75 + pulso * .9);
    aneis.forEach((a, i) => a.material.emissiveIntensity = (Math.floor(b * 2) % 3 === i ? 3.5 : 1.2));
    globo.rotation.y = t * .8;
    lasers.forEach(l => { l.pivo.rotation.set(-1.25 + Math.sin(t * .9 + l.fase) * .12, l.lado * (.15 + Math.sin(t * .6 + l.fase) * .45), 0, 'YXZ'); });

    palhetas.forEach((p, i) => malhaPalheta[i].rotation.y = -p.ang);
    vinil.rotation.y = -VINIL.ang;
    TECLAS.forEach((tc, i) => {
      const m = malhaTecla[i], afunda = F.relogio - tc.toque < .18 ? -4 : 0;
      m.position.y = zT + 5 + afunda;
      m.material = tc.acesa || afunda ? matTeclaAcesa[i] : M.tecla;
    });
    ESTILINGUES.forEach((s, i) => matEst[i].emissiveIntensity = s.flash > 0 ? 3 : .6 + pulso * .4);
    pistao.position.z = P(0, LANCADOR.base + R + 12 + LANCADOR.curso * F.puxar).z;
    const sub = F.bolas.find(bl => bl.trilha && bl.trilha.nome === 'elevador' && bl.s < 78);
    plataforma.position.copy(P(BURACO.x, BURACO.y, sub ? sub.z - 1.5 : -1));
    F.bolas.forEach((bl, i) => {
      const m = bolaMalha(i);
      m.visible = true;
      const y = bl.naMola ? bl.y + LANCADOR.curso * F.puxar : bl.y;
      m.position.copy(P(bl.x, y, bl.z + R));
      m.rotation.x += (bl.trilha ? bl.v * .002 : bl.vy * .0015) * .016;
      m.rotation.z -= (bl.trilha ? 0 : bl.vx * .0015) * .016;
    });
    for (let i = F.bolas.length; i < malhaBolas.length; i++) malhaBolas[i].visible = false;
    if (comBrilho) composer.render(); else renderer.render(cena, camera);
  }

  function naTela(x, y, z) {
    const v = P(x, y, z).project(camera);
    return { x: (v.x + 1) / 2 * container.clientWidth, y: (1 - v.y) / 2 * container.clientHeight };
  }

  return { atualizar, naTela, enquadrar };
}

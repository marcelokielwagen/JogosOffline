// Desenho 3D do Galatic Pinball (Three.js guardado em lib/three, funciona sem internet).
// Mesa realista com chão envernizado, guias de aço, canos de acrílico e loopings; duas plataformas no fundo, com um
// astronauta ligado por um cabo a um ônibus espacial (astronauta.js), planetas e cometa (espaco.js) e efeitos de show
// (efeitos.js). As luzes ficam firmes: só mudam quando a bola bate ou completa alguma coisa.
// Mesa no plano XZ: x da mesa → X, y da mesa → Z (o fundo fica longe), altura → Y.
import * as THREE from 'three';
import { EffectComposer } from '../../../lib/three/addons/EffectComposer.js';
import { RenderPass } from '../../../lib/three/addons/RenderPass.js';
import { UnrealBloomPass } from '../../../lib/three/addons/UnrealBloomPass.js';
import { OutputPass } from '../../../lib/three/addons/OutputPass.js';
import { W, H, R, Z, ZV, FRENTE, VARANDAS, LINHAS, palhetas, ESTILINGUES, BUMPERS, TECLAS, ALVOS, VINIL, ELEVADOR, TUNEL, PONTE, CANHAO, PORTAS, TRILHAS, LANCADOR, CATRACAS, LETRAS, ALTAS, COMETA, PLANETAS, PINOS } from './layout.js';
import { fundir } from './modelagem.js';
import { criarAstronauta, criarNave, criarCabo } from './astronauta.js';
import { criarEfeitos } from './efeitos.js';
import { criarPlaneta, criarCometa } from './espaco.js';

const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, y - H / 2);
const CORES = { rosa: 0xff2fa0, ciano: 0x1fd0ff, ouro: 0xffb52e, verde: 0x35ff9a, laranja: 0xff6a2a, roxo: 0x9a5cff };
const ARCO_IRIS = [CORES.rosa, CORES.ciano, CORES.ouro, CORES.verde, CORES.laranja, CORES.roxo];

function tela(w, h, desenho) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenho(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function criarCena(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  let pixel = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixel);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05030c, 1);
  const cv = renderer.domElement;
  cv.className = 'tela3d';
  cv.setAttribute('aria-label', 'Mesa de pinball em 3D');
  container.appendChild(cv);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(23, 1, 10, 5000);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(cena, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .34, .45, 1);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  let comBrilho = true, comSombra = true;

  // ---------- Ambiente refletido: um estúdio escuro com painéis de luz ----------
  {
    const env = new THREE.Scene(); env.background = new THREE.Color(0x2a2340);
    const painel = (x, y, z, w, h, cor, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    painel(0, 9, -3, 9, 1.4, 0xfff4e6, 9); painel(0, 9, 2.5, 7, 1, 0xfff4e6, 6);
    painel(-9, 4, 0, 1.2, 5, 0xff4fb8, 7); painel(9, 4, 0, 1.2, 5, 0x3fc8ff, 7);
    painel(0, 3.5, -9, 10, 1, 0xffc36a, 5); painel(-5, 6, 7, 2, 2, 0xb89cff, 3); painel(5, 6, 7, 2, 2, 0xffe0c0, 3);
    const pm = new THREE.PMREMGenerator(renderer);
    cena.environment = pm.fromScene(env, .02).texture; pm.dispose();
    cena.environmentIntensity = .72;
  }

  // ---------- Luz ----------
  cena.add(new THREE.HemisphereLight(0xb8b0ff, 0x4a2a58, .8));
  const sol = new THREE.DirectionalLight(0xfff0dc, 1.9);
  sol.position.set(-170, 560, 210); sol.castShadow = true;
  sol.shadow.mapSize.set(1536, 1536);
  Object.assign(sol.shadow.camera, { left: -260, right: 260, top: 540, bottom: -540, near: 80, far: 1400 });
  sol.shadow.bias = -.0005; sol.shadow.normalBias = 1.2; sol.shadow.radius = 3;
  cena.add(sol, sol.target);
  // luz de rosto: perto da banda, na frente de cada palco
  const rosto = (x, cor) => { const l = new THREE.PointLight(cor, 5200, 170, 1.5); l.position.copy(P(x, 128, ZV + 92)); cena.add(l); return l; };
  const rostoDJ = rosto(82, 0xd8f2ff), rostoCasal = rosto(310, 0xffe6cc);
  const luzE = new THREE.PointLight(CORES.rosa, 0, 420, 1.2); luzE.position.copy(P(60, 600, 130));
  const luzD = new THREE.PointLight(CORES.ciano, 0, 420, 1.2); luzD.position.copy(P(310, 600, 130));
  const luzB = new THREE.PointLight(0xffc27a, 0, 260, 1.2); luzB.position.copy(P(185, 240, 80));
  cena.add(luzE, luzD, luzB);

  // ---------- Materiais ----------
  const mat = (cor, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: .6, metalness: 0 }, o));
  const fisico = ({ clearcoat, clearcoatRoughness, sheen, sheenColor, ...o }) => new THREE.MeshStandardMaterial(clearcoat ? { ...o, roughness: Math.min(o.roughness ?? .5, .34), envMapIntensity: o.envMapIntensity ?? 1.25 } : o);
  const guardados = new Map(), umSo = (k, f) => { if (!guardados.has(k)) guardados.set(k, f()); return guardados.get(k); };
  const neon = (cor, k = 1.8) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: cor, emissiveIntensity: k, roughness: 1 });
  const NEON = { rosa: neon(CORES.rosa), ciano: neon(CORES.ciano), ouro: neon(CORES.ouro), verde: neon(CORES.verde), roxo: neon(CORES.roxo) };
  const acrilico = (cor, op = .2) => umSo('a' + cor + op, () => mat(cor, { roughness: .04, metalness: .1, transparent: true, opacity: op, depthWrite: false, envMapIntensity: 2 }));
  const M = {
    cromo: mat(0xc9cfdd, { metalness: 1, roughness: .14, envMapIntensity: 1.5 }),
    aco: mat(0xb4bccd, { metalness: .75, roughness: .38, envMapIntensity: 1.6 }),
    escuro: mat(0x14121c, { metalness: .5, roughness: .35 }),
    laca: fisico({ color: 0x0d0a16, roughness: .3, clearcoat: 1, clearcoatRoughness: .06 }),
    madeira: fisico({ roughness: .45, clearcoat: .7, clearcoatRoughness: .2, color: 0xffffff, map: (() => { const tx = tela(256, 256, g => { g.fillStyle = '#8a5428'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 150; i++) { g.strokeStyle = `rgba(${40 + Math.random() * 60 | 0},${20 + Math.random() * 30 | 0},8,${.08 + Math.random() * .2})`; g.lineWidth = .6 + Math.random() * 2; const y = Math.random() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(90, y + Math.random() * 14 - 7, 170, y + Math.random() * 14 - 7, 256, y); g.stroke(); } }); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx; })() }),
    borracha: mat(0x17151c, { roughness: .85 }),
    borrachaClara: mat(0xf1ece4, { roughness: .8 }),
    preto: new THREE.MeshBasicMaterial({ color: 0x020104 }),
    branco: fisico({ color: 0xf8f4ff, roughness: .3, clearcoat: .8 }),
    bolaOuro: mat(0xffc84a, { roughness: .12, metalness: 1, envMapIntensity: 2.6, emissive: 0xff9a20, emissiveIntensity: .35 }),
    bola: mat(0xffffff, { roughness: .1, metalness: .9, envMapIntensity: 3.4, emissive: 0x8a90a8, emissiveIntensity: .28 }),
  };
  const sombra = (m, faz = true, recebe = true) => { m.castShadow = faz; m.receiveShadow = recebe; return m; };
  const add = m => { cena.add(m); return m; };

  // fio de luz dos canos (brilho firme)
  const fluxos = [];
  function fluxo(cor, k = 1) {
    const m = new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(cor) }, k: { value: k }, t: { value: 0 } },
      vertexShader: 'varying vec2 u; void main(){ u = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 c; uniform float k; void main(){ gl_FragColor = vec4(c * .95 * k, 1.); }' });
    m.emissive = m.uniforms.c.value; Object.defineProperty(m, 'emissiveIntensity', { get: () => m.uniforms.k.value, set: v => { m.uniforms.k.value = v; } });
    fluxos.push(m); return m;
  }

  // ---------- Peças básicas ----------
  const forma = poly => { const s = new THREE.Shape(); poly.forEach(([x, y], i) => i ? s.lineTo(x - W / 2, H / 2 - y) : s.moveTo(x - W / 2, H / 2 - y)); return s; };
  function extrudar(poly, zBaixo, zAlto, material, quina = 0) {
    const g = new THREE.ExtrudeGeometry(forma(poly), { depth: zAlto - zBaixo, bevelEnabled: quina > 0, bevelSize: quina, bevelThickness: quina, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); g.translate(0, zBaixo, 0);
    return add(sombra(new THREE.Mesh(g, material)));
  }
  function caixa(w, h, d, material, x, y, z, pai = cena) {
    const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
    m.position.copy(P(x, y, z)); pai.add(m); return m;
  }
  function cilindro(r1, r2, h, material, x, y, z, n = 24) {
    const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, n), material));
    m.position.copy(P(x, y, z)); return add(m);
  }
  function tubo(pts, raio, material, n, fechado = false, lados = 8) {
    const c = new THREE.CatmullRomCurve3(pts, fechado, 'catmullrom', .5);
    return add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, n || pts.length * 4, raio, lados, fechado), material)));
  }
  function reto(a, b, raio, material) {
    const L = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, L, 8), material);
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return add(m);
  }
  const doisLados = new Map();
  // parede fina ao longo de uma linha (perfil retangular), em uma peça só
  function murete(pts, esp, z0, z1, material) {
    const n = pts.length, A = [], B = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / l * esp / 2, ny = (b[0] - a[0]) / l * esp / 2;
      A.push([pts[i][0] + nx, pts[i][1] + ny]); B.push([pts[i][0] - nx, pts[i][1] - ny]);
    }
    const pos = [], quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d), v = (p, z) => P(p[0], p[1], z).toArray();
    for (let i = 0; i < n - 1; i++) {
      quad(v(A[i], z0), v(A[i + 1], z0), v(A[i + 1], z1), v(A[i], z1));
      quad(v(B[i + 1], z0), v(B[i], z0), v(B[i], z1), v(B[i + 1], z1));
      quad(v(A[i], z1), v(A[i + 1], z1), v(B[i + 1], z1), v(B[i], z1));
    }
    quad(v(B[0], z0), v(A[0], z0), v(A[0], z1), v(B[0], z1)); quad(v(A[n - 1], z0), v(B[n - 1], z0), v(B[n - 1], z1), v(A[n - 1], z1));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    if (!doisLados.has(material)) { const c = material.clone(); c.side = THREE.DoubleSide; doisLados.set(material, c); }
    const mt = doisLados.get(material);
    return add(sombra(new THREE.Mesh(g, mt)));
  }
  // pino com anel de borracha (nas pontas das guias)
  function pino(x, y, alt = 15, cor = M.borrachaClara) {
    cilindro(2.2, 2.6, alt, M.cromo, x, y, alt / 2, 16);
    const b = new THREE.Mesh(new THREE.TorusGeometry(2.8, 1.2, 8, 20), cor); b.rotation.x = Math.PI / 2; b.position.copy(P(x, y, 7)); add(b);
    const t = new THREE.Mesh(new THREE.SphereGeometry(2.3, 12, 8, 0, 7, 0, Math.PI / 2), M.cromo); t.position.copy(P(x, y, alt)); add(t);
  }
  const anelNo = (x, y, z, r, esp, material) => { const a = new THREE.Mesh(new THREE.TorusGeometry(r, esp, 10, 40), material); a.rotation.x = Math.PI / 2; a.position.copy(P(x, y, z)); return add(a); };
  function furo(x, y, z, r = 11) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(r, 32), M.preto); f.rotation.x = -Math.PI / 2; f.position.copy(P(x, y, z + .3)); add(f);
    anelNo(x, y, z + .6, r + .6, 1.1, M.cromo);
  }

  // ---------- Arte impressa do chão ----------
  const arte = tela(1024, 2458, (g, w, h) => {
    g.scale(w / W, h / H);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#10104a'); gr.addColorStop(.3, '#1e1268'); gr.addColorStop(.55, '#2c1066'); gr.addColorStop(.78, '#4a1258'); gr.addColorStop(1, '#1e0828');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    let s = 77; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    // nebulosas
    for (let i = 0; i < 46; i++) { const x = rnd() * W, y = rnd() * 820, r = 30 + rnd() * 90, n = g.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, ['rgba(255,60,170,.10)', 'rgba(40,180,255,.10)', 'rgba(255,170,60,.07)', 'rgba(150,80,255,.12)'][i % 4]); n.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = n; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // raios saindo do planeta
    const cx = 185, cy = 668;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, rr = g.createRadialGradient(cx, cy, 70, cx, cy, 380); rr.addColorStop(0, i % 2 ? 'rgba(255,170,60,.22)' : 'rgba(255,60,160,.18)'); rr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rr; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 380, a, a + Math.PI / 44); g.fill(); }
    g.restore();
    // faixas anos 70 que correm das palhetas até os canos
    const faixa = (lado, desl, cor) => { const X = x => lado < 0 ? x : 370 - x; g.strokeStyle = cor; g.lineWidth = 4.4; g.beginPath(); g.moveTo(X(150 + desl), 884); g.bezierCurveTo(X(70 + desl), 800, X(128 + desl), 740, X(112 + desl), 660); g.bezierCurveTo(X(96 + desl), 656, X(78 + desl), 652, X(72 + desl), 642); g.stroke(); };
    [['#ffcf5c', 0], ['#ff8a3a', 5.4], ['#ff3f8e', 10.8], ['#8a46ff', 16.2], ['#22b8ff', 21.6]].forEach(([c, d]) => { faixa(-1, d, c); faixa(1, d, c); });
    // planeta-disco
    const pl = g.createRadialGradient(cx - 24, cy - 28, 6, cx, cy, 76); pl.addColorStop(0, '#ffe9a8'); pl.addColorStop(.3, '#ff9a4a'); pl.addColorStop(.65, '#d42a86'); pl.addColorStop(1, '#3a0f6a');
    g.save(); g.shadowColor = 'rgba(255,120,120,.8)'; g.shadowBlur = 60; g.fillStyle = pl; g.beginPath(); g.arc(cx, cy, 72, 0, 7); g.fill(); g.restore();
    g.save(); g.beginPath(); g.arc(cx, cy, 72, 0, 7); g.clip();
    for (let r = 70; r > 24; r -= 2.4) { g.strokeStyle = `rgba(30,0,50,${.10 + (r % 3) * .04})`; g.lineWidth = .7; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 72, -2.4, -2); g.fill(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 72, .74, 1.14); g.fill();
    g.restore();
    g.fillStyle = '#160a38'; g.beginPath(); g.arc(cx, cy, 24, 0, 7); g.fill();
    g.strokeStyle = '#ffcf5c'; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy, 24, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, 75, 0, 7); g.stroke();
    g.fillStyle = '#ffcf5c'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } g.fill();
    // anel do planeta
    g.save(); g.translate(cx, cy); g.rotate(-.28); g.scale(1, .24);
    [['#22d8ff', 108], ['#ff5cc0', 115], ['#ffcf5c', 121]].forEach(([c, r]) => { g.strokeStyle = c; g.lineWidth = 4.5; g.beginPath(); g.arc(0, 0, r, .42, Math.PI - .42); g.stroke(); g.globalAlpha = .55; g.beginPath(); g.arc(0, 0, r, Math.PI + .9, Math.PI * 2 - .9); g.stroke(); g.globalAlpha = 1; });
    g.restore();
    // estrelas
    for (let i = 0; i < 420; i++) { const x = rnd() * W, y = rnd() * H, r = rnd() < .92 ? .45 : 1.1; g.fillStyle = `rgba(255,${220 + rnd() * 35 | 0},255,${.35 + rnd() * .6})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    // sol atrás de cada para-choque
    for (const b of BUMPERS.filter(u => !u.andar)) { for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; g.fillStyle = i % 2 ? '#ffcf5c' : '#ff3f8e'; g.beginPath(); g.moveTo(b.x + 18 * Math.cos(a - .12), b.y + 18 * Math.sin(a - .12)); g.lineTo(b.x + 30 * Math.cos(a), b.y + 30 * Math.sin(a)); g.lineTo(b.x + 18 * Math.cos(a + .12), b.y + 18 * Math.sin(a + .12)); g.fill(); } g.fillStyle = '#12082e'; g.beginPath(); g.arc(b.x, b.y, 20, 0, 7); g.fill(); }
    // cidade ao longe entre as palhetas
    g.save(); g.globalAlpha = .9; for (let x = 70; x < 300; x += 7 + rnd() * 8) { const a = 12 + rnd() * 40 * (1 - Math.abs(x - 185) / 150); g.fillStyle = '#1d0a34'; g.fillRect(x, 936 - a, 8, a); g.fillStyle = 'rgba(255,210,110,.8)'; for (let k = 0; k < a / 7; k++) if (rnd() < .5) g.fillRect(x + 1.5 + rnd() * 4, 936 - a + 3 + k * 6, 1.4, 1.6); } g.restore();
    // corredores marcados
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = .8; for (const x of [39, 331]) { g.setLineDash([4, 5]); g.beginPath(); g.moveTo(x, 600); g.lineTo(x, 180); g.stroke(); } g.setLineDash([]);
    // órbita do cometa e moldura dos objetivos
    g.strokeStyle = 'rgba(120,220,255,.5)'; g.lineWidth = 1.2; g.setLineDash([3, 4]); g.beginPath(); g.ellipse(185, 448, 54, 20, 0, 0, 7); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(255,${150 + i * 10},90,${.5 - i * .05})`; g.lineWidth = 2; g.beginPath(); g.arc(185, 668, 80 + i * 3, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    // nome da mesa
    g.textAlign = 'center'; g.font = 'italic 900 20px system-ui, sans-serif'; g.lineJoin = 'round';
    g.strokeStyle = '#14062c'; g.lineWidth = 6; g.strokeText('GALATIC PINBALL', 185, 806); g.strokeStyle = '#22d8ff'; g.lineWidth = 2; g.strokeText('GALATIC PINBALL', 185, 806); g.fillStyle = '#fff0c0'; g.fillText('GALATIC PINBALL', 185, 806);
  });
  arte.repeat.set(1 / W, 1 / H); arte.offset.set(.5, .5);
  const matChao = new THREE.MeshPhysicalMaterial({ map: arte, emissiveMap: arte, emissive: 0xffffff, emissiveIntensity: .2, roughness: .55, clearcoat: .7, clearcoatRoughness: .09, envMapIntensity: .28 });
  extrudar([[14, 10], [386, 10], [386, 968], [14, 968]], -14, 0, [matChao, M.madeira]);

  // ---------- Gabinete ----------
  const faixaLateral = tela(1024, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b0d3c'); gr.addColorStop(1, '#07030f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    ['#ffcf5c', '#ff8a3a', '#ff3f8e', '#8a46ff', '#22b8ff'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, 44 + i * 8 + Math.sin(x / w * Math.PI * 4) * 16); g.stroke(); });
  });
  for (const [x, dentro] of [[12, 0], [388, 1]]) {
    const mats = Array(6).fill(M.laca); mats[dentro] = fisico({ map: faixaLateral, roughness: .35, clearcoat: 1, emissiveMap: faixaLateral, emissive: 0xffffff, emissiveIntensity: .12 });
    const g = new THREE.Mesh(new THREE.BoxGeometry(14, 52, 976), mats); g.position.copy(P(x, 488, 12)); add(sombra(g));
    caixa(17, 3, 978, M.cromo, x, 488, 39.5);
  }
  caixa(402, 46, 16, M.laca, 200, 976, 9); { const barra = cilindro(8, 8, 404, mat(0x8d93a3, { metalness: 1, roughness: .34 }), 200, 978, 31); barra.rotation.z = Math.PI / 2; barra.scale.x = .55; }
  caixa(402, 40, 12, M.laca, 200, 4, 6);
  // avental na frente, com os cartões
  const cartao = (linhas, cor) => tela(512, 200, (g, w, h) => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, w, h); g.strokeStyle = cor; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#1a0f2c'; g.textAlign = 'center'; linhas.forEach(([t, f], i) => { g.font = f; g.fillText(t, w / 2, 70 + i * 48); }); });
  const avental = extrudar([[20, 886], [146, 922], [224, 922], [348, 886], [348, 968], [20, 968]], 14, 19, fisico({ color: 0x0e0820, roughness: .55, envMapIntensity: .3 }));
  avental.castShadow = false;
  for (const [x, t] of [[84, cartao([['GALATIC PINBALL', '900 44px system-ui'], ['3 bolas por partida', '600 30px system-ui'], ['Boa sorte!', 'italic 700 30px system-ui']], '#ff3f8e')], [286, cartao([['6 MISSÕES', '900 44px system-ui'], ['Complete as fases e', '600 30px system-ui'], ['chegue à REENTRADA', '600 30px system-ui']], '#22b8ff')]]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(70, 27), mat(0xffffff, { map: t, roughness: .5 })); c.rotation.x = -Math.PI / 2; c.position.copy(P(x, 940, 19.4)); add(c);
  }
  // painel do fundo com o letreiro de neon
  const vista = tela(1024, 400, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#02030c'); gr.addColorStop(.7, '#060a24'); gr.addColorStop(1, '#0c1c4c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const x = Math.random() * w, y = Math.random() * h * .7, q = 40 + Math.random() * 150, n = g.createRadialGradient(x, y, 0, x, y, q); n.addColorStop(0, ['rgba(120,60,220,.14)', 'rgba(30,140,255,.13)', 'rgba(255,70,160,.10)'][i % 3]); n.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = n; g.fillRect(x - q, y - q, q * 2, q * 2); }
    for (let i = 0; i < 620; i++) { const q = Math.random(); g.fillStyle = 'rgba(255,255,255,' + (.25 + Math.random() * .75) + ')'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h * .9, q < .94 ? .9 : 2, 0, 7); g.fill(); }
    // borda da Terra com atmosfera
    const cx = w / 2, cy = h + 1500, R0 = 1580; for (let k = 0; k < 26; k++) { g.strokeStyle = 'rgba(90,190,255,' + (.34 * (1 - k / 26)) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R0 + k * 2.4, 0, 7); g.stroke(); }
    const e = g.createRadialGradient(cx, cy, R0 - 120, cx, cy, R0); e.addColorStop(0, '#123a78'); e.addColorStop(.75, '#2f7fd0'); e.addColorStop(1, '#d8f2ff'); g.fillStyle = e; g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R0 - 3, 0, 7); g.clip(); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + (.1 + Math.random() * .4) + ')'; const x = Math.random() * w, y = h - 78 + Math.random() * 90 + Math.abs(x - cx) * .07; g.beginPath(); g.ellipse(x, y, 12 + Math.random() * 50, 2 + Math.random() * 5, Math.random() * .3 - .15, 0, 7); g.fill(); } g.restore();
  });
  const letreiro = tela(1400, 190, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#1a0a3a'); gr.addColorStop(.5, '#0a0420'); gr.addColorStop(1, '#1a0a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'italic 900 128px system-ui, sans-serif'; g.lineJoin = 'round';
    g.lineWidth = 12; g.strokeStyle = '#22d8ff'; g.shadowColor = '#22d8ff'; g.shadowBlur = 24; g.strokeText('GALATIC PINBALL', w / 2, h / 2 + 4); g.shadowColor = '#ff2fa0'; g.shadowBlur = 14;
    const f = g.createLinearGradient(0, 30, 0, 160); f.addColorStop(0, '#fff6d8'); f.addColorStop(.5, '#ffcf5a'); f.addColorStop(1, '#ff5aa8'); g.fillStyle = f; g.fillText('GALATIC PINBALL', w / 2, h / 2 + 4);
  });
  const matLetreiro = mat(0x000000, { emissiveMap: letreiro, emissive: 0xffffff, emissiveIntensity: .9, roughness: .5 });
  { const f = new THREE.Mesh(new THREE.BoxGeometry(402, 124, 12), [M.laca, M.laca, M.laca, M.laca, mat(0x000000, { emissiveMap: vista, emissive: 0xffffff, emissiveIntensity: .9 }), M.laca]); f.position.copy(P(200, -8, 121)); add(f); caixa(402, 70, 12, M.laca, 200, -8, 24);
    const l = new THREE.Mesh(new THREE.BoxGeometry(330, 44, 14), [M.laca, M.laca, M.laca, M.laca, matLetreiro, M.laca]); l.position.copy(P(200, -8, 206)); add(l); for (const z of [183.4, 228.6]) caixa(336, 2.6, 17, M.cromo, 200, -8, z); }

  // ---------- Paredes e guias ----------
  for (const l of LINHAS) {
    const z0 = Z[l.andar], ini = l.pts[0], fim = l.pts[l.pts.length - 1];
    switch (l.tipo) {
      case 'contorno': murete(l.pts, 6, 0, 26, M.laca); tubo(l.pts.filter((_, i) => i % 3 === 0 || i < 2).map(p => P(p[0], p[1], 27)), 1.2, M.cromo, 120); break;
      case 'madeira': murete(l.pts, 6, 0, 20, M.laca); murete(l.pts, 2.4, 20, 22, M.cromo); break;
      case 'guia': murete(l.pts, 3.4, 0, 13, M.aco); murete(l.pts, 5, 13, 14.6, M.cromo); pino(...ini); pino(...fim); break;
      case 'guiaAlta': murete(l.pts, 3.4, z0, z0 + 11, M.aco); break;
      case 'rampa': murete(l.pts, 5, 0, 14, M.escuro); murete(l.pts, 3, 14, 15.4, M.cromo); break;
      case 'varanda': murete(l.pts, 3, z0, z0 + 8, acrilico(0xbfe8ff, .25)); tubo(l.pts.map(p => P(p[0], p[1], z0 + 12)), 1.1, M.cromo, 60); l.pts.forEach(p => reto(P(p[0], p[1], z0), P(p[0], p[1], z0 + 12), .9, M.cromo)); break;
      case 'desvio': {
        const t = extrudar([...l.pts], 0, 13, fisico({ color: ini[0] < 185 ? 0xc81f78 : 0x1686c8, roughness: .25, clearcoat: 1, transparent: true, opacity: .92 }), 0);
        t.castShadow = true; tubo(l.pts.map(p => P(p[0], p[1], 8)), 2, M.borrachaClara, 40); break;
      }
    }
  }
  // portão do lançador (chapinha de metal) e portinhola do arco
  murete([[380, 140], [352, 162]], 1.4, 6, 14, M.cromo);
  const portinhola = murete([[112, 80], [94, 52]], 2.2, 0, 15, mat(0xff3f6a, { metalness: .4, roughness: .3, emissive: 0xff1040, emissiveIntensity: .5 }));
  murete([[350, 160], [350, 176]], 5, 0, 24, M.cromo);

  // ---------- Estilingues ----------
  const matEst = ESTILINGUES.map((s, i) => {
    const arteP = tela(256, 256, g => { g.fillStyle = i ? '#0e5fa8' : '#a81468'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? 'rgba(255,220,120,.5)' : 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 260, k * .449, k * .449 + .22); g.fill(); } });
    arteP.wrapS = arteP.wrapT = THREE.RepeatWrapping; arteP.repeat.set(.02, .02);
    const m = fisico({ map: arteP, roughness: .2, clearcoat: 1, transparent: true, opacity: .9, emissiveMap: arteP, emissive: 0xffffff, emissiveIntensity: .25 });
    const c = [(s.a[0] + s.b[0] + s.c[0]) / 3, (s.a[1] + s.b[1] + s.c[1]) / 3], enc = p => [c[0] + (p[0] - c[0]) * .86, c[1] + (p[1] - c[1]) * .86];
    const t = extrudar([s.a, s.b, s.c].map(enc), 14, 16, m, .4); t.castShadow = true;
    for (const p of [s.a, s.b, s.c]) cilindro(2.4, 2.4, 15, M.branco, p[0], p[1], 7.5, 14);
    const borda = (a, b) => reto(P(...a, 8), P(...b, 8), 2, M.borrachaClara); borda(s.a, s.b); borda(s.b, s.c); borda(s.a, s.c);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), neon(i ? CORES.ciano : CORES.rosa, 1.6)); lamp.position.copy(P(c[0], c[1], 8)); add(lamp);
    return { m, lamp };
  });

  for (const s of [1, -1]) {
    const X = x => s > 0 ? x : 370 - x, pl = [[41, 754], [51, 754], [51, 800], [112, 833], [108, 842], [41, 806]].map(([x, y]) => [X(x), y]);
    const m = fisico({ color: s > 0 ? 0xff5aa8 : 0x4ab8ff, roughness: .15, clearcoat: 1, transparent: true, opacity: .55, side: THREE.DoubleSide });
    const t = extrudar(s > 0 ? pl : pl.reverse(), 16, 17.4, m); t.castShadow = false;
    for (const [x, y] of [[46, 760], [46, 800], [106, 836]]) cilindro(2.2, 2.2, 2, M.cromo, X(x), y, 18.2, 6);
  }
  // ---------- Para-choques ----------
  const bumpers = BUMPERS.map((b, i) => {
    const cor = [CORES.rosa, CORES.ciano, CORES.ouro, CORES.ciano, CORES.roxo, CORES.verde, CORES.ouro, CORES.laranja, CORES.rosa][i], z0 = Z[b.andar], k = b.r / 15;
    cilindro(b.r - 1 * k, b.r + 1 * k, 3, M.escuro, b.x, b.y, z0 + 1.5, 36);
    cilindro(b.r - 2 * k, b.r - .5 * k, 2, M.branco, b.x, b.y, z0 + 4.5 * k, 36);
    cilindro(b.r * .66, b.r * .66, 16 * k, M.branco, b.x, b.y, z0 + 9 * k, 30);
    const anel = anelNo(b.x, b.y, z0 + 13 * k, b.r - 2.6 * k, 1.5 * k, M.cromo); anel.userData.movel = true;
    const mc = fisico({ color: new THREE.Color(cor).multiplyScalar(.7), roughness: .12, clearcoat: 1, emissive: cor, emissiveIntensity: .4 });
    const tampa = new THREE.Mesh(new THREE.SphereGeometry(b.r, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), mc); tampa.scale.y = .38; tampa.position.copy(P(b.x, b.y, z0 + 18 * k)); add(sombra(tampa));
    cilindro(b.r, b.r, 2 * k, mc, b.x, b.y, z0 + 17.4 * k, 36);
    const est = new THREE.Shape(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, rr = (q % 2 ? 2.6 : 6) * k; est.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const e = new THREE.Mesh(new THREE.ExtrudeGeometry(est, { depth: 1, bevelEnabled: false }), M.cromo); e.rotation.x = -Math.PI / 2; e.position.copy(P(b.x, b.y, z0 + 23 * k)); add(e);
    return { anel, mc, za: z0 + 13 * k, k };
  });
  // pinos de borracha soltos
  for (const [x, y] of PINOS) pino(x, y, 16, M.borrachaClara);

  // ---------- Teclado que cai ----------
  const alvoTecla = TECLAS.map((t, i) => {
    const g = new THREE.Group(), mt = fisico({ color: 0xfbf7ff, roughness: .25, clearcoat: 1, emissive: ARCO_IRIS[i], emissiveIntensity: .12 });
    const c = sombra(new THREE.Mesh(new THREE.BoxGeometry(12.8, 20, 4), mt)); c.position.y = 10; g.add(c);
    const led = new THREE.Mesh(new THREE.BoxGeometry(9, 5, .6), neon(ARCO_IRIS[i], 1.5)); led.position.set(0, 14, 2.2); g.add(led);
    g.position.copy(P((t.ax + t.bx) / 2, (t.ay + t.by) / 2, 0)); g.rotation.y = -Math.atan2(t.by - t.ay, t.bx - t.ax); add(g);
    return { g, mt };
  });
  murete(TECLAS.flatMap((t, i) => i ? [[t.bx, t.by + 3]] : [[t.ax, t.ay + 3], [t.bx, t.by + 3]]), 1.5, 0, .8, M.cromo);

  // ---------- Catraca (spinner) ----------
  const catracas = CATRACAS.map(q => {
    const gr = new THREE.Group(), xm = (q.x0 + q.x1) / 2;
    const tx = tela(256, 96, g => { g.fillStyle = '#ffb52e'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#2a0838'; g.font = 'italic 900 62px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STAR', 128, 50); });
    const face = mat(0xffffff, { map: tx, metalness: .3, roughness: .3 });
    gr.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(27, 15, 1), [M.cromo, M.cromo, M.cromo, M.cromo, face, face])));
    gr.position.copy(P(xm, q.y, 18)); add(gr);
    reto(P(q.x0, q.y, 18), P(q.x1 + 1, q.y, 18), .8, M.cromo);
    for (const x of [q.x0 + 1, q.x1]) reto(P(x, q.y, 0), P(x, q.y, 19), 1, M.cromo);
    return gr;
  });

  // ---------- Canos de acrílico e trilhos cromados ----------
  const ponto = (p, alto = 0) => P(p.x, p.y, p.z + alto);
  function cano(T, material, led, de = 0) {
    const pts = T.pts.filter(p => p.d >= de).map(p => ponto(p, R));
    const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5), L = c.getLength();
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, Math.min(280, pts.length * 2), 10.5, 16, false), material); m.renderOrder = 3; add(m);
    const n = Math.max(2, Math.round(L / 84));
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = new THREE.Mesh(new THREE.TorusGeometry(10.8, .75, 6, 24), M.cromo);
      a.position.copy(c.getPointAt(t)); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.getTangentAt(t)); a.castShadow = true; add(a);
    }
    // fio de luz por fora do cano
    const fio = pts.map(p => p.clone().add(new THREE.Vector3(0, -10.4, 0)));
    const f = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fio), pts.length * 2, .9, 6), led); add(f);
  }
  // rampa aberta na boca do cano (chapa que vai estreitando)
  function bocaRampa(T, ate, led) {
    const pts = T.pts.filter(p => p.d <= ate + 8), meia = (T.boca.x1 - T.boca.x0) / 2 + 1, E = [], D = [], pos = [];
    pts.forEach(p => { const t = Math.min(1, p.d / ate), w = meia + (9.5 - meia) * t * t * (3 - 2 * t); E.push(P(p.x - w, p.y, p.z + .5)); D.push(P(p.x + w, p.y, p.z + .5)); });
    for (let i = 0; i < E.length - 1; i++) { const [a, b, c, d] = [E[i], E[i + 1], D[i], D[i + 1]]; pos.push(...a.toArray(), ...c.toArray(), ...b.toArray(), ...b.toArray(), ...c.toArray(), ...d.toArray()); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    add(sombra(new THREE.Mesh(g, umSo('boca', () => fisico({ color: 0x9aa4b8, metalness: .9, roughness: .22, side: THREE.DoubleSide })))));
    for (const b of [E, D]) { tubo(b.map(v => v.clone().add(new THREE.Vector3(0, 7, 0))), 1.3, M.cromo, 30); tubo(b, 1, led, 30); }
  }
  const ledCano = { canoE: fluxo(CORES.ciano), canoD: fluxo(CORES.rosa), loopE: fluxo(CORES.roxo), loopD: fluxo(CORES.laranja), miniE: fluxo(CORES.verde), miniD: fluxo(CORES.ouro), elevador: fluxo(CORES.verde), ponte: fluxo(CORES.ouro) };
  for (const [n, c] of [['canoE', 0x6fdcff], ['canoD', 0xff7acc], ['loopE', 0xb99cff], ['loopD', 0xffb070], ['miniE', 0x90ffc8], ['miniD', 0xffe08a]]) { bocaRampa(TRILHAS[n], 58, ledCano[n]); cano(TRILHAS[n], acrilico(c, .24), ledCano[n], 52); }
  cano(TRILHAS.elevE, acrilico(0xc8ffe6, .16), ledCano.elevador, 34); cano(TRILHAS.elevD, acrilico(0xc8ffe6, .16), ledCano.elevador, 84);
  cano(TRILHAS.ponte, acrilico(0xffe2a0, .22), ledCano.ponte, 12);
  // trilhos de arame: 4 fios e argolas, como nas mesas de verdade
  function arame(T) {
    const fios = [[-6.5, 1], [6.5, 1], [-9.2, 9], [9.2, 9]].map(() => []);
    const meia = (T.boca.x1 - T.boca.x0) / 2;
    T.pts.forEach((p, i) => {
      const a = T.pts[Math.max(0, i - 1)], b = T.pts[Math.min(T.pts.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l;
      const t = Math.max(0, 1 - p.d / 34), abre = 1 + (meia / 9.2 - 1) * t * t;
      [[-5.5, -.5], [5.5, -.5], [-9.4, 9], [9.4, 9]].forEach(([o, z], k) => fios[k].push(P(p.x + nx * o * abre, p.y + ny * o * abre, Math.max(.6, p.z + z))));
    });
    fios.forEach(f => tubo(f, 1, M.cromo, f.length));
    for (let i = 8; i < T.pts.length - 4; i += 11) {
      const c = fios[0][i].clone().add(fios[1][i]).multiplyScalar(.5); c.y -= 4;
      tubo([fios[2][i], fios[0][i].clone().add(new THREE.Vector3(0, -1, 0)), c, fios[1][i].clone().add(new THREE.Vector3(0, -1, 0)), fios[3][i]], .75, M.cromo, 16, false, 6);
    }
  }
  arame(TRILHAS.trilhoE); arame(TRILHAS.trilhoD);

  // ---------- Planetas (no meio dos loopings) e cometa ----------
  const planetas = PLANETAS.map(p => {
    const g = criarPlaneta(p.nome, p.r); g.position.copy(P(p.x, p.y, p.z + R)); add(g);
    for (const a of [.5, 2.6, 4.7]) { const d = new THREE.Vector3(Math.cos(a), Math.sin(a) * .82, Math.sin(a) * -.57); reto(g.position.clone().addScaledVector(d, p.r * .98), g.position.clone().addScaledVector(d, 28.5), .8, M.cromo); }
    return g;
  });
  const cometa = criarCometa(COMETA.r); cometa.g.position.copy(P(COMETA.x, COMETA.y, COMETA.r)); add(cometa.g); add(cometa.efeitos);

  // ---------- Buracos ----------
  furo(ELEVADOR.x, ELEVADOR.y, 0); furo(TUNEL.x, TUNEL.y, 0); furo(PONTE.x, PONTE.y, ZV, 9.5);
  const tampa = (x, y, z, r, cor) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 30), fisico({ color: cor, metalness: .8, roughness: .25, clearcoat: 1 })); m.position.copy(P(x, y, z + .6)); return add(m); };
  const tampaTunel = tampa(TUNEL.x, TUNEL.y, 0, 11, 0x3a2a5c), tampaPonte = tampa(PONTE.x, PONTE.y, ZV, 9.5, 0x5c4a1a);
  const aroTunel = neon(CORES.laranja), aroPonte = neon(CORES.ouro), aroElev = neon(CORES.verde);
  anelNo(TUNEL.x, TUNEL.y, 1, 14, 1.1, aroTunel); anelNo(PONTE.x, PONTE.y, ZV + 1, 12, 1, aroPonte); anelNo(ELEVADOR.x, ELEVADOR.y, 1, 14, 1.1, aroElev);
  { const c = tampa(CANHAO.x, CANHAO.y + 14, 0, 12, 0x262038); c.scale.z = 1.25; anelNo(CANHAO.x, CANHAO.y + 14, 1, 13, 1, M.cromo); }

  // ---------- Palhetas ----------
  const malhaPalheta = palhetas.map(p => {
    const contorno = (folga) => { const s = new THREE.Shape(), n = 16, rb = p.rb - folga, rt = p.rt - folga; for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + Math.PI * i / n; s.lineTo(rb * Math.cos(a), rb * Math.sin(a)); } for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; s.lineTo(p.len + rt * Math.cos(a), rt * Math.sin(a)); } return s; };
    const g = new THREE.Group();
    const peca = (folga, z0, alt, material, bisel) => { const ge = new THREE.ExtrudeGeometry(contorno(folga), { depth: alt, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3 }); ge.rotateX(-Math.PI / 2); const m = sombra(new THREE.Mesh(ge, material)); m.position.y = z0; g.add(m); };
    peca(1.6, 1, 12, M.branco, .8);
    peca(.6, 3.5, 6.5, fisico({ color: p.lado === 'E' ? 0xff2f86 : 0x18a8f0, roughness: .6, clearcoat: .3 }), .5);
    const cabeca = sombra(new THREE.Mesh(new THREE.CylinderGeometry(p.rb * .55, p.rb * .6, 3, 24), M.cromo)); cabeca.position.y = 15; g.add(cabeca);
    const par = new THREE.Mesh(new THREE.CylinderGeometry(p.rb * .3, p.rb * .3, 1, 6), M.escuro); par.position.y = 16.8; g.add(par);
    g.position.copy(P(p.px, p.py, Z[p.andar])); add(g); return g;
  });

  // ---------- Setas e luzes do chão ----------
  const setas = [];
  const geoSeta = new THREE.ShapeGeometry(new THREE.Shape([[0, 10], [9, -6], [0, -2], [-9, -6]].map(([x, y]) => new THREE.Vector2(x, y))));
  function seta(nome, x, y, z, cor, o = {}) {
    const m = new THREE.MeshBasicMaterial({ color: cor });
    const fundo = umSo('fundoSeta', () => new THREE.MeshBasicMaterial({ color: 0x06020e }));
    for (let k = 0; k < (o.n || 2); k++) for (const [mt, e, dz] of [[fundo, 1.22, .35], [m, 1, .6]]) {
      const g = new THREE.Mesh(geoSeta, mt); g.rotation.x = -Math.PI / 2; g.rotation.z = o.gira || 0; g.scale.setScalar((o.esc || 1) * e);
      const dx = Math.sin(o.gira || 0) * 17 * k, dy = Math.cos(o.gira || 0) * 17 * k; g.position.copy(P(x + dx, y + dy, z + dz)); add(g);
    }
    setas.push({ nome, m, cor: new THREE.Color(cor) });
  }
  seta('canoE', 83, 662, 0, CORES.ciano, { n: 2, esc: .9 }); seta('canoD', 287, 662, 0, CORES.rosa, { n: 2, esc: .9 });
  seta('loopE', 132, 580, 0, CORES.roxo, { n: 2, esc: .9 }); seta('loopD', 238, 580, 0, CORES.laranja, { n: 2, esc: .9 });
  seta('volta', 38, 662, 0, CORES.ouro, { n: 1 }); seta('volta', 331, 662, 0, CORES.ouro, { n: 1 });
  seta('tunel', 185, 384, 0, CORES.laranja, { n: 2, esc: .8 }); seta('elevador', 185, 208, 0, CORES.verde, { n: 1, esc: .7 });
  seta('ponte', 110, 164, ZV, CORES.ouro, { n: 1, esc: .5, gira: -.6 });
  seta('miniE', 125, 330, ZV, CORES.verde, { n: 1, esc: .8 }); seta('miniD', 249, 330, ZV, CORES.ouro, { n: 1, esc: .8 });
  const luzLetra = (l, r) => {
    const t = tela(96, 96, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(48, 48, 44, 0, 7); g.fill(); g.fillStyle = '#1a0a30'; g.font = '900 58px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l.letra || '★', 48, 52); });
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 30), new THREE.MeshBasicMaterial({ map: t })); m.rotation.x = -Math.PI / 2; m.position.copy(P(l.x, l.y, .5)); add(m); anelNo(l.x, l.y, .5, r, .5, M.cromo); return m;
  };
  const letras = LETRAS.map(l => luzLetra(l, 9)), altas = ALTAS.map(l => luzLetra(l, 8));

  // luzes do cometa (quantas batidas já levou) e dos 4 objetivos
  const luzCometa = Array.from({ length: COMETA.precisa }, (_, i) => { const a = Math.PI * (1.12 + .76 * i / (COMETA.precisa - 1)), m = new THREE.Mesh(new THREE.CircleGeometry(4.6, 20), new THREE.MeshBasicMaterial()); m.rotation.x = -Math.PI / 2; m.position.copy(P(185 + Math.cos(a) * 80, 674 + Math.sin(a) * 80, .5)); add(m); anelNo(185 + Math.cos(a) * 80, 674 + Math.sin(a) * 80, .5, 4.8, .5, M.cromo); return m; });
  const luzObj = Array.from({ length: 6 }, (_, i) => {
    const x = 122 + i * 25.2, y = 752 + Math.abs(i - 2.5) * -4, tx = tela(96, 96, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(48, 48, 45, 0, 7); g.fill(); g.fillStyle = '#14062c'; g.font = '900 60px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i + 1, 48, 52); });
    const m = new THREE.Mesh(new THREE.CircleGeometry(9.5, 30), new THREE.MeshBasicMaterial({ map: tx })); m.rotation.x = -Math.PI / 2; m.position.copy(P(x, y, .5)); add(m); anelNo(x, y, .5, 9.8, .6, M.cromo); return m;
  });

  // ---------- Varandas ----------
  const ledVaranda = { 1: neon(CORES.ciano, 1.8), 2: neon(CORES.rosa, 1.8) };
  const pisoArte = {
    1: tela(512, 1024, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#0a2a5c'); q.addColorStop(.6, '#0c1a48'); q.addColorStop(1, '#2a1060'); g.fillStyle = q; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(60,220,255,.35)'; g.lineWidth = 3; for (let i = 0; i <= 12; i++) { g.beginPath(); g.moveTo(i * w / 12, 0); g.lineTo(i * w / 12, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 12); g.lineTo(w, i * h / 12); g.stroke(); } }),
    2: tela(512, 512, (g, w, h) => { const r = g.createRadialGradient(w / 2, h * .25, 20, w / 2, h * .25, 420); r.addColorStop(0, '#7a1c4c'); r.addColorStop(1, '#22081e'); g.fillStyle = r; g.fillRect(0, 0, w, h); for (let i = 0; i < 24; i++) { g.fillStyle = i % 2 ? 'rgba(255,190,80,.22)' : 'rgba(255,80,170,.12)'; g.beginPath(); g.moveTo(w / 2, h * .22); g.arc(w / 2, h * .22, 600, i * Math.PI / 12, (i + .5) * Math.PI / 12); g.fill(); } }),
  };
  for (const k of [1, 2]) {
    const v = VARANDAS[k], esq = k === 1;
    const poly = esq ? [[24, 26], [142, 26], [142, 376], [114, FRENTE + 2], [52, FRENTE + 2], [24, 376]] : [[232, 26], [376, 26], [376, 376], [350, FRENTE + 2], [260, FRENTE + 2], [232, 376]];
    const tx = pisoArte[k]; tx.repeat.set(1 / (v.x1 - v.x0), 1 / (v.y1 - v.y0)); tx.offset.set(-(v.x0 - W / 2) / (v.x1 - v.x0), -(H / 2 - v.y1) / (v.y1 - v.y0));
    const piso = fisico({ map: tx, emissiveMap: tx, emissive: 0xffffff, emissiveIntensity: .25, roughness: .35, clearcoat: .5, clearcoatRoughness: .1, envMapIntensity: .35 });
    extrudar(poly, ZV - 5, ZV, [piso, acrilico(esq ? 0x66d8ff : 0xff7acc, .75)]);
    tubo([...poly, poly[0]].flatMap((p, i, a) => i < a.length - 1 ? [0, .33, .66].map(t => P(p[0] + (a[i + 1][0] - p[0]) * t, p[1] + (a[i + 1][1] - p[1]) * t, ZV - 2.5)) : []), 1.5, ledVaranda[k], 150, true);
    // colunas
    for (const [x, y] of esq ? [[30, 34], [130, 40], [72, 384], [112, 384]] : [[246, 40], [368, 34], [262, 384], [300, 384]]) { cilindro(2.6, 2.6, ZV - 5, M.cromo, x, y, (ZV - 5) / 2, 16); cilindro(4.4, 4.4, 2, M.aco, x, y, 1, 20); }
  }
  // ---------- Astronauta, ônibus espacial e o cabo ----------
  const astro = criarAstronauta(); astro.g.scale.setScalar(1.06); add(astro.g);
  for (const q of astro.bracos) q.r0 = q.h.rotation.clone();
  const nave = criarNave(); nave.g.scale.setScalar(.92); add(nave.g);
  const cabo = criarCabo(); add(cabo.m);
  const baseAstro = P(84, 82, 148), baseNave = P(284, 66, 146), pA = new THREE.Vector3(), pN = new THREE.Vector3();
  const E = criarEfeitos(cena, P, W, H);

  // alvos em pé das varandas
  const alvos = ALVOS.map(a => {
    const cor = a.grupo === 'djs' ? CORES.ciano : a.grupo === 'casal' ? CORES.ouro : CORES.verde, m = fisico({ color: new THREE.Color(cor).multiplyScalar(.5), roughness: .3, clearcoat: 1, emissive: cor, emissiveIntensity: .3 });
    const L = Math.hypot(a.bx - a.ax, a.by - a.ay), b = sombra(new THREE.Mesh(new THREE.BoxGeometry(L, 12, 3), m)); b.position.copy(P((a.ax + a.bx) / 2, (a.ay + a.by) / 2, Z[a.andar] + 7)); b.rotation.y = -Math.atan2(a.by - a.ay, a.bx - a.ax); add(b); b.userData.movel = true; return { b, m };
  });

  // vinil dos DJs
  const discoTex = tela(512, 512, g => {
    g.fillStyle = '#0d0a10'; g.beginPath(); g.arc(256, 256, 256, 0, 7); g.fill();
    for (let r = 250; r > 96; r -= 3) { g.strokeStyle = `rgba(255,255,255,${r % 2 ? .05 : .11})`; g.lineWidth = 1.2; g.beginPath(); g.arc(256, 256, r, 0, 7); g.stroke(); }
    const gr = g.createRadialGradient(256, 256, 10, 256, 256, 92); gr.addColorStop(0, '#ffe9a8'); gr.addColorStop(.6, '#ff8a3a'); gr.addColorStop(1, '#d0206a'); g.fillStyle = gr; g.beginPath(); g.arc(256, 256, 92, 0, 7); g.fill();
    g.fillStyle = '#2a0838'; g.font = '900 34px system-ui'; g.textAlign = 'center'; g.fillText('TURBO', 256, 226); g.beginPath(); g.arc(256, 256, 9, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 250, -.5, -.2); g.fill(); g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 250, 2.64, 2.94); g.fill();
  });
  const vinil = new THREE.Mesh(new THREE.CylinderGeometry(VINIL.r, VINIL.r, 1.4, 64), [M.laca, fisico({ map: discoTex, roughness: .25, clearcoat: 1, clearcoatRoughness: .15 }), M.laca]);
  vinil.position.copy(P(VINIL.x, VINIL.y, ZV + .8)); vinil.receiveShadow = true; add(vinil);
  const matAroVinil = neon(CORES.ouro); anelNo(VINIL.x, VINIL.y, ZV + 1, VINIL.r + 1.2, 1, matAroVinil);

  // globo espelhado entre as varandas
  const globo = new THREE.Mesh(new THREE.IcosahedronGeometry(12, 3), mat(0xffffff, { metalness: 1, roughness: .06, flatShading: true, envMapIntensity: 2.2 })); globo.position.copy(P(191, 30, 172)); add(globo);
  reto(P(191, 34, 187), P(191, 4, 200), .5, M.aco);
  // lampadinhas de iluminação geral nas beiradas
  const lampadas = [];
  for (const [x, y] of [[26, 600], [344, 600], [26, 766], [344, 766], [60, 836], [310, 836], [130, 420], [240, 420], [112, 660], [258, 660], [26, 470], [344, 470], [160, 520], [210, 520]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 8), umSo('lampada', () => neon(0xffd9a0, 1.8))); m.position.copy(P(x, y, 12)); add(m); lampadas.push(m); }

  // ---------- Lançador ----------
  const pistao = new THREE.Group();
  { const h = sombra(new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 44, 16), M.cromo)); h.rotation.x = Math.PI / 2; h.position.z = 22; pistao.add(h); const c = sombra(new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 5, 20), M.borracha)); c.rotation.x = Math.PI / 2; pistao.add(c); add(pistao); }
  const molas = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 90 }, (_, i) => new THREE.Vector3(Math.cos(i * .7) * 5.4, Math.sin(i * .7) * 5.4, i * .4))), 260, .7, 6), M.aco); add(molas);
  cilindro(8, 8, 10, M.cromo, LANCADOR.x, 992, 22).rotation.x = Math.PI / 2;

  for (const m of [pistao, molas, globo, vinil, portinhola, tampaTunel, tampaPonte]) m.userData.movel = true;
  fundir(cena);
  for (const m of cena.children) if (m.isMesh && !m.userData.movel) { m.updateMatrix(); m.matrixAutoUpdate = false; }
  for (const g of [pistao, ...catracas, ...alvoTecla.map(a => a.g), ...malhaPalheta]) fundir(g);

  // ---------- Faíscas: um cometa sai da peça acertada e voa até a que ela ligou ----------
  function lugar(nome) {
    const n = +nome.slice(-1);
    if (nome.startsWith('tecla')) { const t = TECLAS[n]; return P((t.ax + t.bx) / 2, t.ay, 14); }
    if (nome.startsWith('letra')) return P(LETRAS[n].x, LETRAS[n].y, 6);
    if (nome.startsWith('bumper')) return P(BUMPERS[n].x, BUMPERS[n].y, 24);
    if (nome.startsWith('alta')) return P(ALTAS[n].x, ALTAS[n].y, 6);
    if (TRILHAS[nome]) { const q = TRILHAS[nome].pts; return ponto(q[q.length - 1], 12); }
    return { cometa: P(COMETA.x, COMETA.y, 20), estrelas: P(185, 617, 10), vinil: P(VINIL.x, VINIL.y, ZV + 8), djs: P(84, 135, ZV + 20), casal: P(318, 135, ZV + 20), elevador: P(ELEVADOR.x, ELEVADOR.y, 10), tunel: P(TUNEL.x, TUNEL.y, 8), volta: P(331, 560, 10), palhetas: P(185, 850, 14) }[nome] || P(185, 500, 20);
  }
  const geoFaisca = new THREE.SphereGeometry(4, 10, 8), faiscas = [];
  function faisca(de, para) {
    const a = lugar(de), b = lugar(para), c = a.clone().add(b).multiplyScalar(.5); c.y = Math.max(a.y, b.y) + 40 + a.distanceTo(b) * .15;
    const cor = new THREE.Color(ARCO_IRIS[faiscas.length % 6]).multiplyScalar(2);
    const rastro = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(geoFaisca, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 1 - i / 9, blending: THREE.AdditiveBlending, depthWrite: false })); m.scale.setScalar(1 - i * .1); m.visible = false; m.renderOrder = 6; cena.add(m); return m; });
    faiscas.push({ curva: new THREE.QuadraticBezierCurve3(a, c, b), t0: performance.now() + faiscas.length * 90, rastro });
  }
  function moverFaiscas(agora) {
    for (let i = faiscas.length - 1; i >= 0; i--) {
      const f = faiscas[i], t = (agora - f.t0) / 800;
      f.rastro.forEach((m, k) => { const u = t - k * .03; m.visible = u > 0 && u < 1; if (m.visible) f.curva.getPoint(u, m.position); });
      if (t > 1.25) { f.rastro.forEach(m => { cena.remove(m); m.material.dispose(); }); faiscas.splice(i, 1); }
    }
  }

  // ---------- Bolas ----------
  const geoBola = new THREE.SphereGeometry(R, 36, 24), malhaBolas = [];
  function bolaMalha(i) {
    while (malhaBolas.length <= i) { const m = new THREE.Mesh(geoBola, M.bola); m.castShadow = m.receiveShadow = true; cena.add(m); malhaBolas.push(m); }
    return malhaBolas[i];
  }

  // ---------- Câmera ----------
  const cantos = [];
  for (const x of [4, W - 4]) { cantos.push(P(x, 980, 20), P(x, 980, 38), P(x, 0, 40), P(x, -8, 226)); }
  const alvo = new THREE.Vector3(0, 20, 30), jogoPos = new THREE.Vector3(), jogoAlvo = new THREE.Vector3();
  function enquadrar() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixel); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    const dir = new THREE.Vector3(), v = new THREE.Vector3(), inclinar = el => dir.set(0, Math.sin(el), Math.cos(el));
    const extremos = d => {
      camera.position.copy(alvo).addScaledVector(dir, d); camera.lookAt(alvo); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      let mx = 0, y0 = 9, y1 = -9;
      for (const c of cantos) {
        v.copy(c).applyMatrix4(camera.matrixWorldInverse);
        if (v.z > -camera.near) return { mx: 9, y0: -9, y1: 9 };
        v.copy(c).project(camera); mx = Math.max(mx, Math.abs(v.x)); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      return { mx, y0, y1 };
    };
    const ajustar = () => { let a = 200, b = 6000; for (let i = 0; i < 30; i++) { const m = (a + b) / 2, e = extremos(m); if (e.mx > .985 || e.y0 < -.985 || e.y1 > .985) a = m; else b = m; } return extremos(b); };
    // escolhe a inclinação que melhor preenche a tela: deita a câmera até a largura da mesa encostar nas bordas
    for (let g = 58; g >= 38; g -= 2) {
      inclinar(g * Math.PI / 180);
      for (let volta = 0; volta < 6; volta++) { const e = ajustar(); alvo.z -= (e.y0 + e.y1) / 2 * 300; }
      if (ajustar().mx > .96) break;
    }
    jogoPos.copy(camera.position); jogoAlvo.copy(alvo);
  }
  enquadrar();
  new ResizeObserver(enquadrar).observe(container);
  // vitrine: antes da partida a câmera passeia pela banda
  let modoCamera = 'vitrine', mistura = 1, aproxima = { 1: 0, 2: 0 };
  const modo = m => { modoCamera = m; };
  const olhar = new THREE.Vector3(), posV = new THREE.Vector3(), alvoV = new THREE.Vector3(), CLOSE = { 1: P(84, 230, ZV + 20), 2: P(304, 230, ZV + 20) };
  function moverCamera(t, F, dt) {
    mistura += ((modoCamera === 'vitrine' ? 1 : 0) - mistura) * Math.min(1, dt * 2.2);
    for (const k of [1, 2]) { const tem = modoCamera === 'jogo' && F.bolas.length > 0 && F.bolas.every(b => !b.naMola && !b.trilha && b.andar === k); aproxima[k] += ((tem ? 1 : 0) - aproxima[k]) * Math.min(1, dt * 2); }
    camera.position.copy(jogoPos); olhar.copy(jogoAlvo);
    // chega um pouquinho mais perto da varanda onde a bola está
    for (const k of [1, 2]) if (aproxima[k] > .01) { posV.copy(CLOSE[k]).sub(jogoPos).multiplyScalar(.045 * aproxima[k]); camera.position.add(posV); posV.copy(CLOSE[k]).sub(jogoAlvo).multiplyScalar(.045 * aproxima[k]); olhar.add(posV); }
    if (mistura > .002) {
      const fase = (t % 18) / 9, k = fase < 1 ? 1 : 2, u = fase % 1, ida = Math.min(1, u * 5) * Math.min(1, (1 - u) * 5), x = k === 1 ? 84 : 290;
      const perto = camera.aspect < .8 ? 600 : 400, sobe = camera.aspect < .8 ? 190 : 130;
      alvoV.copy(P(x * ida + 190 * (1 - ida), 74, 138 - (camera.aspect < .8 ? 20 : 10)));
      posV.copy(alvoV).add(new THREE.Vector3((u - .5) * 130 * ida, sobe + 90 * (1 - ida), perto * (k === 2 ? 1.3 : 1) * (1 + .4 * (1 - ida))));
      const m = mistura * mistura * (3 - 2 * mistura);
      camera.position.lerp(posV, m); olhar.lerp(alvoV, m);
    }
    camera.lookAt(olhar);
    if (tremor) { camera.position.x += (Math.random() - .5) * tremor; camera.position.y += (Math.random() - .5) * tremor; camera.position.z += (Math.random() - .5) * tremor; }
  }

  // ---------- Celular lento: desliga o brilho e reduz a resolução ----------
  const DEGRAUS = [() => {}, () => { pixel = Math.min(pixel, 1.25); }, () => { comBrilho = false; }, () => { pixel = 1; }, () => { comSombra = false; }, () => { pixel = .8; }];
  let degrau = 0, tempos = 0, soma = 0, ultimoQuadro = performance.now();
  function descer(ate) {
    while (degrau < ate && degrau < DEGRAUS.length - 1) DEGRAUS[++degrau]();
    renderer.setPixelRatio(pixel); enquadrar();
  }
  descer(Math.min(4, +(localStorage.getItem('galaticQualidade') || 0)));
  function vigiarVelocidade(agora) {
    const d = agora - ultimoQuadro; ultimoQuadro = agora;
    if (d > 250 || document.hidden) { tempos = soma = 0; return; }      // voltou de outra aba: não conta
    soma += d; if (++tempos < 70) return;
    const media = soma / tempos; tempos = soma = 0;
    if (media > 21 && degrau < DEGRAUS.length - 1) { descer(degrau + 1); try { localStorage.setItem('galaticQualidade', degrau); } catch { /* sem espaço */ } }
  }

  // ---------- Atualiza o desenho a cada quadro ----------
  let nQuadro = 0; renderer.shadowMap.autoUpdate = false;
  let anterior = performance.now(); const festa = { 1: 0, 2: 0 };
  let tremor = 0, energia = .3, relogioT = 0;
  function atualizar(F, X, batida) {
    const agora = performance.now(), t = agora / 1000, dt = Math.min(.1, (agora - anterior) / 1000); anterior = agora;
    vigiarVelocidade(agora);
    renderer.shadowMap.needsUpdate = comSombra && nQuadro++ % 3 === 0;
    relogioT = t;
    const b = batida === undefined ? t * 2.1 : batida, pulso = .35, pisca = 1, show = X.show > 0;
    for (const n of Object.values(NEON)) n.emissiveIntensity = 1.3 + pulso * .7;
    const cl = cometa.clarao(t); luzE.intensity = luzD.intensity = 1350 + cl * 1200;
    luzB.intensity = 1100 + BUMPERS.reduce((s, u) => s + Math.max(0, u.flash), 0) * 1500;
    matLetreiro.emissiveIntensity = .7 + pulso * .25;
    globo.rotation.y = t * (show ? 2.4 : .6);

    // energia do show: sobe com a ação e cai sozinha
    energia += ((show ? .85 : .28 + Math.min(.4, X.combo * .07)) - energia) * Math.min(1, dt * .9); energia = Math.min(1, energia);
    fluxos.forEach(m => m.uniforms.t.value = t);
    for (const k of [1, 2]) { const perto = show || F.bolas.some(u => u.andar === k || (u.trilha && u.trilha.andarFim === k && u.s > u.trilha.L * .5)); festa[k] += ((perto ? 1 : 0) - festa[k]) * Math.min(1, dt * 4); ledVaranda[k].emissive.copy(E.paleta[k]); ledVaranda[k].emissiveIntensity = 1 + pulso * .9 + festa[k] * 1.2; }
    rostoDJ.intensity = 620 + festa[1] * 350 + pulso * 120; rostoCasal.intensity = 800 + festa[2] * 400 + pulso * 120;
    luzE.color.copy(E.paleta[0]); luzD.color.copy(E.paleta[1]); luzB.color.copy(E.paleta[2]);
    // astronauta flutuando e fazendo "hang loose"
    const f1 = festa[1], f2 = festa[2], ag = astro.g;
    ag.position.copy(baseAstro); ag.position.x += Math.sin(t * .5) * 11; ag.position.y += Math.sin(t * .8) * 6 + f1 * Math.abs(Math.sin(b * Math.PI)) * 4; ag.position.z += Math.cos(t * .42) * 7;
    ag.rotation.set(-.32 + Math.sin(t * .6) * .13, .12 + Math.sin(t * .35) * .34, .1 + Math.sin(t * .45) * .2 + f1 * Math.sin(b * Math.PI) * .1);
    astro.cab.rotation.set(Math.sin(t * .7) * .1, Math.sin(t * .5) * .25, 0);
    for (const q of astro.bracos) { q.o.rotation.z = q.lado * (.05 + Math.sin(t * 1.1 + q.lado) * .13 + f1 * (.1 + Math.sin(b * Math.PI) * .18)); q.o.rotation.x = Math.sin(t * .9 + q.lado * 2) * .12; q.h.rotation.z = q.r0.z + Math.sin(t * 6.5 + q.lado) * (.12 + f1 * .2); q.h.rotation.y = q.r0.y + Math.sin(t * 6.5 + q.lado) * (.1 + f1 * .18); }
    for (const q of astro.pernas) q.o.rotation.x = Math.sin(t * .9 + q.lado * 1.4) * .14;
    // ônibus espacial
    const ng = nave.g, motor = Math.max(f2, X.fase === 0 || show ? .75 : .18);
    ng.position.copy(baseNave); ng.position.y += Math.sin(t * .6 + 1) * 4 + f2 * 3; ng.position.x += Math.sin(t * .4) * 5;
    ng.rotation.set(.5 + Math.sin(t * .5) * .06, .34 + Math.sin(t * .3) * .08, .1 + Math.sin(t * .7) * .04 + f2 * .05);
    nave.chamas.forEach((c, i) => { c.scale.set(motor * (.85 + Math.sin(t * 5 + i * 2) * .06) + .02, .7 + motor * .5, .7 + motor * .5); c.material.opacity = .35 + motor * .6; });
    nave.brilhoMotor.emissiveIntensity = 1.2 + motor * 3; nave.nav.forEach((m, i) => m.emissiveIntensity = 2);
    ag.updateMatrixWorld(); ng.updateMatrixWorld(); cabo.atualizar(ag.localToWorld(pA.set(0, -8, -18)), ng.localToWorld(pN.copy(nave.escotilha)), t);

    // peças que conversam
    for (const s of setas) { const l = X.luz(s.nome); s.m.color.copy(s.cor).multiplyScalar(l === 0 ? .07 : l === 1 ? .55 : 1.15); }
    for (const n of ['canoE', 'canoD', 'loopE', 'loopD', 'miniE', 'miniD']) ledCano[n].emissiveIntensity = X.luz(n) === 2 ? 1.5 : .9;
    ledCano.ponte.emissiveIntensity = PORTAS.ponte.aberta ? 1.6 : .25; ledCano.elevador.emissiveIntensity = X.luz('elevador') === 2 ? 1.5 : .8;
    ledCano.elevador.emissive.setHex(X.elevadorOuro ? CORES.ouro : CORES.verde);
    aroTunel.emissiveIntensity = PORTAS.tunel.aberta ? 2 : .15; tampaTunel.visible = !PORTAS.tunel.aberta;
    aroPonte.emissiveIntensity = PORTAS.ponte.aberta ? 2 : .15; tampaPonte.visible = !PORTAS.ponte.aberta;
    aroElev.emissiveIntensity = .9 + pulso * .6;
    luzCometa.forEach((m, i) => { const on = COMETA.vivo && i < COMETA.batidas; m.material.color.setHex(on ? (i >= COMETA.precisa - 3 ? 0xff4a1a : 0xffa62a) : 0x2c1a44).multiplyScalar(on ? 1.4 : .8); });
    luzObj.forEach((m, i) => { const feita = i < X.fase, agoraE = i === X.fase; m.material.color.setHex(feita ? 0x35ff9a : agoraE ? 0xffd24a : 0x4a3570).multiplyScalar(feita ? 1.1 : agoraE ? 1.4 : .9); });
    letras.forEach((m, i) => m.material.color.setHex(LETRAS[i].acesa ? CORES.ouro : 0x3c2a5c).multiplyScalar(LETRAS[i].acesa ? 1.3 : .8));
    altas.forEach((m, i) => m.material.color.setHex(ALTAS[i].acesa ? CORES.verde : 0x2a3a4c).multiplyScalar(ALTAS[i].acesa ? 1.3 : .8));
    matAroVinil.emissive.setHex([CORES.ouro, CORES.ouro, CORES.verde, CORES.laranja, CORES.rosa][X.vinil]); matAroVinil.emissiveIntensity = .8 + X.vinil * .5 + pulso * .5;
    TECLAS.forEach((tc, i) => { const k = alvoTecla[i]; k.g.position.y += ((tc.acesa ? -21 : 0) - k.g.position.y) * Math.min(1, dt * 16); });
    ALVOS.forEach((a, i) => { const k = alvos[i], bate = F.relogio - a.toque < .12; k.m.emissiveIntensity = a.aceso ? 1.8 : bate ? 2.4 : .22 + pulso * .12; k.b.rotation.x = bate && a.andar ? -.25 : 0; });
    ESTILINGUES.forEach((s, i) => { const f = s.flash > 0; matEst[i].m.emissiveIntensity = f ? 1.4 : .22; matEst[i].lamp.material.emissiveIntensity = f ? 5 : 1.4; });
    BUMPERS.forEach((u, i) => { const f = Math.max(0, u.flash) / .16, k = bumpers[i]; k.mc.emissiveIntensity = .35 + pulso * .15 + f * 1.2; k.anel.position.y = k.za - f * 6 * k.k; });
    portinhola.position.y += ((PORTAS.arco.aberta ? -16 : 0) - portinhola.position.y) * Math.min(1, dt * 12);
    CATRACAS.forEach((q, i) => catracas[i].rotation.x = q.ang);
    palhetas.forEach((p, i) => malhaPalheta[i].rotation.y = -p.ang);
    vinil.rotation.y = -VINIL.ang;
    const yp = LANCADOR.base + R + 4 + LANCADOR.curso * F.puxar;
    pistao.position.copy(P(LANCADOR.x, yp, 9)); molas.position.copy(P(LANCADOR.x, yp + 3, 9)); molas.scale.z = Math.max(.2, 1 - F.puxar * .7);
    moverFaiscas(agora);
    planetas.forEach((g, i) => { g.rotation.y = t * (i ? .22 : .3); if (g.userData.nuvens) g.userData.nuvens.rotation.y = t * .12; });
    cometa.g.position.copy(P(COMETA.x, COMETA.y, COMETA.r + 1 + Math.sin(t * 2) * 1.2));
    cometa.atualizar(t, COMETA.batidas / COMETA.precisa, COMETA.vivo, Math.max(0, 1 - (F.relogio - COMETA.toque) / .25));

    F.bolas.forEach((bl, i) => {
      const m = bolaMalha(i);
      m.material = bl.bonus ? M.bolaOuro : M.bola;
      m.visible = !(bl.trilha && bl.trilha.nome === 'tunel' && bl.z < -8) && !(bl.andar === 0 && !bl.trilha && bl.y > 932);
      const y = bl.naMola ? bl.y + LANCADOR.curso * F.puxar : bl.y;
      m.position.copy(P(bl.x, y, bl.z + R));
      if (bl.presa) m.position.y -= 5;
      m.rotation.x += (bl.trilha ? bl.v : bl.vy) * .0015 * dt * 60 * .016; m.rotation.z -= (bl.trilha ? 0 : bl.vx) * .0015 * dt * 60 * .016;
    });
    // rastro curto, só logo depois de bater numa peça (rolando, descendo ou no cano não tem)
    F.bolas.forEach((bl, i) => { const q = F.relogio - bl.bateu; if (q < .2 && !bl.trilha && !bl.presa && malhaBolas[i].visible) E.rastro(malhaBolas[i].position, bl.bonus ? 0xffb020 : E.paleta[(i + 1) % 3].getHex(), 9 * (1 - q / .2) + 3); });
    for (let i = F.bolas.length; i < malhaBolas.length; i++) malhaBolas[i].visible = false;
    tremor = E.atualizar(t, dt, cv.height * 2.457);
    moverCamera(t, F, dt);
    if (comBrilho) composer.render(); else renderer.render(cena, camera);
  }

  const explodir = () => cometa.explodir(performance.now() / 1000);
  // o que acontece na mesa vira explosão de cor
  function evento(nome, d = {}) {
    const z = d.andar ? ZV : 0;
    switch (nome) {
      case 'bumper': { const v = P(d.x, d.y, z + 20); E.estourar(v, 26, 150); E.anel(v, ARCO_IRIS[d.i % 6], d.andar ? 34 : 56); if (!d.andar) E.impacto(d.x, d.y, 1); E.tremer(.7); energia += .05; break; }
      case 'estilingue': E.estourar(P(d.x, d.y, 12), 18, 130); E.impacto(d.x, d.y, .7); E.tremer(.4); energia += .02; break;
      case 'alvo': E.estourar(P((d.ax + d.bx) / 2, (d.ay + d.by) / 2, z + 10), 26, 120); E.anel(P((d.ax + d.bx) / 2, (d.ay + d.by) / 2, z + 8), CORES.ouro, 36); energia += .05; break;
      case 'tecla': E.estourar(P((d.ax + d.bx) / 2, d.ay, 14), 22, 130); E.impacto(d.ax + 7, d.ay, .9); energia += .05; break;
      case 'letra': case 'alta': E.estourar(P(d.x, d.y, 6), 14, 90); E.impacto(d.x, d.y, .6); break;
      case 'catraca': E.estourar(P(39, 560, 18), 3, 70); break;
      case 'cometa': E.estourar(P(d.x, d.y, 16), 34, 170, [0xff7a1a, 0xffd23a, 0xffffff, 0x66c8ff]); E.impacto(d.x, d.y, 1.4); E.tremer(1.8); energia += .08; break;
      case 'explosao': E.estourar(P(COMETA.x, COMETA.y, 20), 200, 330, null, 14); E.tremer(9); E.fogos(10, relogioT); for (let i = 0; i < 3; i++) E.anel(P(COMETA.x, COMETA.y, 6 + i * 10), [0xffffff, 0xffa040, 0xff3a6a][i], 120 + i * 60); E.impacto(COMETA.x, COMETA.y, 3); energia = 1; break;
      case 'trilha': { const T = TRILHAS[d.nome]; if (T && T.boca && d.sobe) { const p = T.pts[0]; E.estourar(ponto(p, 10), 24, 130); if (!T.andarIni) E.impacto(p.x, p.y, 1); } break; }
      case 'chegou': { const T = TRILHAS[d.nome]; if (!T || d.nome === 'lancador') break; const p = T.pts[T.pts.length - 1]; E.estourar(ponto(p, 10), 50, 170); E.anel(ponto(p, 4), E.paleta[0].getHex(), 70); if (T.cano) { E.tremer(1); energia += .12; } break; }
      case 'volta': for (let i = 0; i < 5; i++) E.impacto(40 + i * 72, 150 + i * 30, .8); energia += .1; break;
      case 'lancou': E.estourar(P(LANCADOR.x, LANCADOR.base, 12), 30, 150, [0xffd23a, 0xff7a1a, 0xffffff]); break;
      case 'missao': E.fogos(2, relogioT); energia += .15; break;
      case 'combo': E.fogos(Math.min(6, d.n), relogioT); break;
      case 'fase': E.fase(d.i); E.tremer(4); E.fogos(9, relogioT); for (let i = 0; i < 6; i++) E.impacto(60 + i * 50, 200 + (i % 3) * 230, 1.4); energia = 1; break;
      case 'perdeu': E.estourar(P(185, 900, 10), 40, 140, [0xff2040, 0xff8040]); E.tremer(2); energia *= .4; break;
    }
  }
  { const ocultos = []; cena.traverse(o => { if (!o.visible) { ocultos.push(o); o.visible = true; } }); cena.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial) o.receiveShadow = true; });
    const ouro = bolaMalha(0), dourada = new THREE.Mesh(geoBola, M.bolaOuro); dourada.receiveShadow = true; ouro.receiveShadow = true; ouro.visible = true; cena.add(dourada);
    renderer.shadowMap.needsUpdate = true; composer.render(); cena.remove(dourada); ouro.visible = false; ocultos.forEach(o => { o.visible = false; }); }
  return { atualizar, enquadrar, faisca, explodir, evento, modo, renderer, energia: () => energia };
}

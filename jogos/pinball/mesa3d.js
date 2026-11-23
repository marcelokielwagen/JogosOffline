// Pinball Galáxia em 3D (Three.js, guardado em lib/three para funcionar offline).
// A física e o desenho das peças continuam no jogo.js: tudo o que ele pinta no canvas vira a "pintura" da mesa,
// que aqui ganha câmera em perspectiva de verdade, gabinete em volta, verniz brilhante, luzes que iluminam a mesa
// e brilho (bloom). A bola é uma esfera cromada renderizada em 3D e colada na pintura na ordem certa das camadas.
// Se o aparelho não tiver WebGL ou este arquivo não carregar, o jogo segue no modo antigo (2D inclinado).
import * as THREE from 'three';
import { EffectComposer } from '../../lib/three/addons/EffectComposer.js';
import { RenderPass } from '../../lib/three/addons/RenderPass.js';
import { UnrealBloomPass } from '../../lib/three/addons/UnrealBloomPass.js';
import { OutputPass } from '../../lib/three/addons/OutputPass.js';

const N_LUZES = 6;          // luzes que acendem sobre a mesa (número fixo: trocar a quantidade pesa)
const DIST = 1000;          // distância da câmera até o centro da mesa (em unidades da mesa)

function criar({ container, fonte, W, H }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement;
  cv.id = 'tela3d'; cv.setAttribute('aria-label', 'Mesa de pinball');
  container.insertBefore(cv, container.firstChild);
  container.classList.add('m3d');

  const cena = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  // mesa no plano XZ: x da mesa → X, y da mesa → Z (o alto da mesa fica longe), altura → Y
  const P = (x, y, h = 0) => new THREE.Vector3(x - W / 2, h, y - H / 2);

  // ---------- Pintura da mesa ----------
  const tex = new THREE.CanvasTexture(fonte);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const matMesa = new THREE.MeshPhysicalMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .78,
    roughness: .55, metalness: 0, clearcoat: .7, clearcoatRoughness: .12, envMapIntensity: .35,
  });
  const mesa = new THREE.Mesh(new THREE.PlaneGeometry(W, H), matMesa);
  mesa.rotation.x = -Math.PI / 2;
  cena.add(mesa);

  // ---------- Gabinete ----------
  const madeira = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, '#5a3a1e'); gr.addColorStop(.5, '#3e2713'); gr.addColorStop(1, '#2a190b');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 64);
    let s = 7; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      const y = rnd() * 64; g.strokeStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,210,150'},${.05 + rnd() * .12})`; g.lineWidth = .5 + rnd() * 1.5;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + rnd() * 6 - 3, 340, y + rnd() * 6 - 3, 512, y + rnd() * 4 - 2); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  const matMadeira = new THREE.MeshStandardMaterial({ map: madeira, roughness: .62, metalness: 0, emissive: 0x24140a, emissiveMap: madeira, emissiveIntensity: .5 });
  const matCromo = new THREE.MeshStandardMaterial({ color: 0xe8ecf4, roughness: .18, metalness: 1 });
  const matPreto = new THREE.MeshStandardMaterial({ color: 0x0a0b16, roughness: .85, metalness: 0, envMapIntensity: .3 });
  const neonC = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x29d8ff).multiplyScalar(2.2), toneMapped: false });
  const neonR = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3cbe).multiplyScalar(2.2), toneMapped: false });
  const caixa = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); cena.add(m); return m; };
  const LAT = 16, ALT = 20, FR = 34;   // largura e altura das laterais, frente (avental)
  const comp = H + FR + 14, zMeio = (FR - 14) / 2;
  for (const lado of [-1, 1]) {
    const x = lado * (W / 2 + LAT / 2 - 3);
    caixa(LAT, ALT, comp, matMadeira, x, ALT / 2 - 4, zMeio);
    caixa(LAT + 1, 2.4, comp, matCromo, x, ALT - 2.8, zMeio);                         // friso de metal em cima
    caixa(1.4, 1.4, comp, lado < 0 ? neonC : neonR, lado * (W / 2 + LAT - 2.6), ALT - 6, zMeio);   // neon por fora
    caixa(40, 120, comp + 40, matPreto, lado * (W / 2 + LAT + 17), -50, zMeio);       // corpo da máquina
  }
  // fundo (parede de trás, atrás do arco) e avental na frente com a barra de metal
  caixa(W + LAT * 2, 70, 12, matMadeira, 0, 31, -H / 2 - 9);
  caixa(W + LAT * 2 - 6, 2, 1.4, neonC, 0, 52, -H / 2 - 2.6);
  caixa(W + LAT * 2 - 6, ALT - 6, FR, matPreto, 0, (ALT - 6) / 2 - 4, H / 2 + FR / 2);
  const placa = caixa(W - 30, 1, FR - 10, new THREE.MeshStandardMaterial({ color: 0x2a1a55, roughness: .35, metalness: .6, emissive: 0x1a0d40 }), 0, ALT - 9.4, H / 2 + FR / 2 - 2);
  placa.rotation.x = -.12;
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, W + LAT * 2, 24), matCromo);
  barra.rotation.z = Math.PI / 2; barra.position.set(0, ALT - 3, H / 2 + FR - 2); cena.add(barra);

  // ---------- Luzes ----------
  const hemi = new THREE.HemisphereLight(0xc9d2ff, 0x2a1640, .32);
  cena.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff1dc, .25);   // lâmpadas do alto da máquina (fraca: forte demais vira clarão)
  sol.position.set(0, 500, 200); cena.add(sol);
  const luzes = [];
  for (let i = 0; i < N_LUZES; i++) { const l = new THREE.PointLight(0xffffff, 0, 0, 1.6); cena.add(l); luzes.push(l); }

  // ---------- Ambiente refletido (no verniz da mesa e no cromado) ----------
  let envCena = null, envMetal = null;
  function ambiente(fundo) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const ceu = g.createLinearGradient(0, 0, 0, 128);
    ceu.addColorStop(0, '#2a2f44'); ceu.addColorStop(.6, '#141828'); ceu.addColorStop(1, '#0a0b14');
    g.fillStyle = ceu; g.fillRect(0, 0, 512, 128);
    // faixas de luz do alto da máquina e o letreiro de trás
    g.fillStyle = '#fffaf0'; g.fillRect(40, 30, 180, 10); g.fillRect(292, 30, 180, 10);
    g.fillStyle = 'rgba(255,240,220,.55)'; g.fillRect(0, 58, 512, 6);
    const lt = g.createLinearGradient(200, 0, 312, 0); lt.addColorStop(0, '#ff7a1e'); lt.addColorStop(.5, '#ffd25a'); lt.addColorStop(1, '#ff3cbe');
    g.fillStyle = lt; g.fillRect(196, 76, 120, 34);
    // embaixo: a própria mesa (borrada)
    if (fundo && fundo.width) { g.save(); g.filter = 'blur(3px)'; g.drawImage(fundo, 0, 128, 512, 128); g.restore(); }
    else { g.fillStyle = '#1a1240'; g.fillRect(0, 128, 512, 128); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
    if (envCena) envCena.dispose();
    envCena = pm.fromEquirectangular(t).texture; cena.environment = envCena;
    t.dispose();
    // a bola de metal reflete um ambiente bem mais claro: o vidro, as lâmpadas do alto e a mesa colorida embaixo
    const c2 = document.createElement('canvas'); c2.width = 512; c2.height = 256;
    const g2 = c2.getContext('2d'), ceu2 = g2.createLinearGradient(0, 0, 0, 128);
    ceu2.addColorStop(0, '#f4f6ff'); ceu2.addColorStop(.45, '#aab4cc'); ceu2.addColorStop(.85, '#4a5068'); ceu2.addColorStop(1, '#1a1c28');
    g2.fillStyle = ceu2; g2.fillRect(0, 0, 512, 128);
    g2.fillStyle = '#ffffff'; for (const x of [30, 150, 290, 410]) g2.fillRect(x, 22, 70, 16);
    g2.fillStyle = lt; g2.fillRect(196, 70, 120, 36);
    g2.fillStyle = '#1b1530'; g2.fillRect(0, 118, 512, 10);   // horizonte escuro (as laterais da máquina)
    g2.fillStyle = '#6a6880'; g2.fillRect(0, 128, 512, 128);
    if (fundo && fundo.width) { g2.save(); g2.globalAlpha = .55; g2.filter = 'blur(2px) brightness(1.6) saturate(.8)'; g2.drawImage(fundo, 0, 128, 512, 128); g2.restore(); }
    const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; t2.mapping = THREE.EquirectangularReflectionMapping;
    bola.ambiente(t2);
    if (envMetal) envMetal.dispose();
    envMetal = pm.fromEquirectangular(t2).texture;
    for (const m of metais) { m.envMap = envMetal; m.needsUpdate = true; }
    t2.dispose();
  }

  // ---------- Câmera ----------
  const cam = new THREE.PerspectiveCamera(28, 1, 10, 6000);
  let ang = .5, larg = 1, alt = 1, escalaTela = 1, base = new THREE.Vector3(), dist0 = DIST;
  const alvo = new THREE.Vector3(0, 0, 0);
  const cantos = [];
  for (const x of [-W / 2 - LAT - 4, W / 2 + LAT + 4]) for (const z of [-H / 2 - 14, H / 2 + FR]) for (const y of [0, ALT]) cantos.push(new THREE.Vector3(x, y, z));
  // ajusta a câmera para a mesa e o gabinete encherem o espaço (devolve quanto sobra: >1 = sobra altura)
  function enquadrar(a) {
    cam.aspect = larg / alt; cam.fov = 28; cam.zoom = 1;
    base.set(0, Math.cos(a) * DIST, Math.sin(a) * DIST);
    cam.position.copy(base); cam.lookAt(alvo); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    const v = new THREE.Vector3();
    for (const c of cantos) { v.copy(c).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    const sx = 2 / (x1 - x0), sy = 2 / (y1 - y0), s = Math.min(sx, sy) * .985;
    const M = new THREE.Matrix4().set(s, 0, 0, -s * (x0 + x1) / 2, 0, s, 0, -s * (y0 + y1) / 2, 0, 0, 1, 0, 0, 0, 0, 1);
    cam.projectionMatrix.premultiply(M); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    return sy / sx;
  }
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(cena, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .35, .78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  let comBloom = true;

  function ajustar(w, h, { dpr = 1, angMax, angMin, bloom: querBloom = true }) {
    larg = w; alt = h; comBloom = querBloom;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    // como no modo antigo: começa bem inclinada e endireita enquanto a largura for o limite (celular em pé)
    ang = angMax;
    while (ang > angMin && enquadrar(ang) > 1.03) ang -= Math.PI / 180;
    enquadrar(ang);
    construirTrilhas();   // as rampas dependem da inclinação da câmera
    construirMesa();
    dist0 = cam.position.distanceTo(P(W / 2, H));
    const [ax] = proj(0, H), [bx] = proj(W, H);
    escalaTela = (bx - ax) / W;
    return { ang, escala: escalaTela, persp: DIST };
  }

  // ponto da mesa → ponto na tela (pixels do container) e escala relativa (1 = borda de baixo)
  const vp = new THREE.Vector3();
  function proj(x, y, h = 0) {
    vp.copy(P(x, y, h));
    const d = cam.position.distanceTo(vp);
    vp.project(cam);
    return [(vp.x + 1) / 2 * larg, (1 - vp.y) / 2 * alt, dist0 / d];
  }

  const cor = new THREE.Color();
  const dbg = { foco: null };
  function render(est) {
    const { luzes: pedidos = [], tremor = 0, gi = 0, giCor = '255,210,120' } = est;
    tex.needsUpdate = true;
    // treme a câmera quando a mesa é sacudida
    const f = Math.min(1, tremor / .22);
    cam.position.set(base.x + (Math.random() - .5) * 6 * f, base.y + (Math.random() - .5) * 3 * f, base.z + (Math.random() - .5) * 4 * f);
    pedidos.sort((a, b) => b.f - a.f);
    luzes.forEach((l, i) => {
      const p = pedidos[i];
      if (!p) { l.intensity = 0; return; }
      l.position.copy(P(p.x, p.y, p.h || 26)); l.color.set(p.cor); l.intensity = p.f * (p.forca || 900);
    });
    const [r, g, b] = giCor.split(',').map(Number);
    hemi.color.setRGB(.79 + gi * (r / 255 - .79), .82 + gi * (g / 255 - .82), 1 + gi * (b / 255 - 1));
    hemi.intensity = .32 + Math.min(.6, gi * .5);
    atualizarPecas(est);
    if (dbg.foco) {   // só para testes: aproxima a câmera de um ponto da mesa
      const { x, y, d } = dbg.foco, alvoF = P(x, y);
      cam.position.copy(alvoF).add(new THREE.Vector3(0, Math.cos(ang) * d, Math.sin(ang) * d)); cam.lookAt(alvoF);
      cam.fov = 28; cam.updateProjectionMatrix();
    }
    if (comBloom) composer.render(); else renderer.render(cena, cam);
  }

  // ================= Peças com volume: palhetas, cogumelos e alienígena =================
  // A bola continua pintada na mesa. Para ela passar na frente ou atrás das peças do jeito certo, cada bola
  // ganha uma "esfera invisível" que só marca a profundidade: a peça que estiver atrás da bola não se desenha por cima.
  const metais = [matCromo];
  const ORD = 2;
  const pecas = new THREE.Group(); cena.add(pecas);
  const por = (m, pai = pecas) => { m.renderOrder = ORD; pai.add(m); return m; };
  const malha = (geo, mat, pai) => por(new THREE.Mesh(geo, mat), pai);
  const cilU = new THREE.CylinderGeometry(1, 1, 1, 10);   // "osso" de largura 1 e altura 1, esticado entre dois pontos
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0);
  function osso(m, a, b, r) {
    _a.set(...a); _b.set(...b); _d.subVectors(_b, _a);
    const L = _d.length() || .001;
    m.position.addVectors(_a, _b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(CIMA, _d.divideScalar(L));
    m.scale.set(r, L, r);
  }

  // ----- Palhetas: corpo de plástico branco com borracha vermelha em volta e pino cromado -----
  const matBorracha = new THREE.MeshStandardMaterial({ color: 0xd0141f, roughness: .5, emissive: 0x3a0306 });
  const matPlastico = new THREE.MeshStandardMaterial({ color: 0xf6f6fa, roughness: .22, emissive: 0x2a2a30 });
  metais.push(matBorracha, matPlastico);
  function formaPalheta(p, enc) {
    const rb = p.rb - enc, rt = p.rt - enc, L = p.len, f = Math.acos((rb - rt) / L), s = new THREE.Shape();
    s.absarc(0, 0, rb, f, DPI - f, false);
    s.absarc(L, 0, rt, -f, f, false);
    return s;
  }
  function extrudar(forma, alto, chanfro) {
    const g = new THREE.ExtrudeGeometry(forma, { depth: alto, curveSegments: 20, bevelEnabled: true, bevelThickness: chanfro, bevelSize: chanfro * .8, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); g.translate(0, chanfro, 0);
    return g;
  }
  const DPI = Math.PI * 2;
  let palhetas3 = [];
  function criarPalhetas(lista) {
    palhetas3 = lista.map(p => {
      const g = new THREE.Group(); por(g);
      const k = p.rb / 10;
      malha(extrudar(formaPalheta(p, 0), 4.5 * k, .7), matBorracha, g);
      const corpo = malha(extrudar(formaPalheta(p, 1.7 * k), 5 * k, .9), matPlastico, g);
      corpo.position.y = 1.2 * k;
      const pino = malha(new THREE.CylinderGeometry(2.6 * k, 2.6 * k, 10 * k, 20), matCromo, g);
      pino.position.y = 5 * k;
      g.position.copy(P(p.px, p.py));
      return g;
    });
  }

  // ----- Cogumelos (pop bumpers): base cromada, corpo colorido e tampa com estrela que acende -----
  function texEstrela(cor) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(54, 50, 4, 64, 64, 64);
    gr.addColorStop(0, cor[0]); gr.addColorStop(.6, cor[1]); gr.addColorStop(1, cor[2]);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffffff'; g.font = '900 66px "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('★', 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  let cogumelos3 = [];
  function criarCogumelos(lista) {
    cogumelos3 = lista.map(b => {
      const g = new THREE.Group(); por(g); g.position.copy(P(b.x, b.y));
      const r = b.r, HB = r > 14 ? 10 : 6.5;
      malha(new THREE.CylinderGeometry(r * .9, r * 1.02, 2.4, 40), matCromo, g).position.y = 1.2;
      const corpoMat = new THREE.MeshStandardMaterial({ color: b.cor[1], roughness: .3, emissive: b.cor[1], emissiveIntensity: .15 });
      malha(new THREE.CylinderGeometry(r * .6, r * .66, HB, 32), corpoMat, g).position.y = HB / 2;
      const saia = malha(new THREE.CylinderGeometry(r * .98, r * .98, 1.2, 40, 1, true), matCromo, g);
      saia.position.y = HB * .45;
      const tampa = new THREE.Group(); por(tampa, g); tampa.position.y = HB;
      const branco = new THREE.MeshStandardMaterial({ color: 0xeef0f4, roughness: .3, emissive: 0x202024 });
      malha(new THREE.CylinderGeometry(r, r * 1.02, 2.6, 40), branco, tampa).position.y = 1.3;
      const tx = texEstrela(b.cor);
      const topo = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: 0xffffff, emissiveIntensity: .35, roughness: .25 });
      const disco = malha(new THREE.CylinderGeometry(r * .8, r * .8, 1.6, 40), [corpoMat, topo, corpoMat], tampa);
      disco.position.y = 3.2;
      metais.push(corpoMat, branco, topo);
      return { b, g, tampa, topo, corpoMat, HB };
    });
  }
  function atualizarCogumelos() {
    for (const c of cogumelos3) {
      const f = c.b.flash > 0 ? 1 : 0;
      c.tampa.position.y = c.HB - f * 2;
      c.topo.emissiveIntensity = .35 + f * 2.4;
      c.corpoMat.emissiveIntensity = .15 + f * 1.6;
    }
  }

  // ----- Alienígena: criatura biomecânica escura e sóbria, que se inclina para a câmera -----
  // Casca preta brilhante, cabeça longa e lisa sem olhos, tubos nas costas, cauda comprida com lâmina.
  const alien = (() => {
    const g = new THREE.Group(); por(g);
    const casca = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: .16, metalness: .55, emissive: 0x9fdc7a, emissiveIntensity: 0 });
    const junta = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: .32, metalness: .45, emissive: 0x9fdc7a, emissiveIntensity: 0 });
    const dente = new THREE.MeshStandardMaterial({ color: 0xd9ddd2, roughness: .25, metalness: .35 });
    const interior = new THREE.MeshStandardMaterial({ color: 0x1c0608, roughness: .5 });
    const cone = (r, h) => { const c = new THREE.ConeGeometry(r, h, 8); c.translate(0, h / 2, 0); return c; };
    const geoCone = cone(1, 1), geoBola = new THREE.SphereGeometry(1, 14, 10);
    const ponta = (m, a, b, r) => {   // cone da base a até a ponta b
      _a.set(...a); _b.set(...b); _d.subVectors(_b, _a); const L = _d.length() || .001;
      m.position.copy(_a); m.quaternion.setFromUnitVectors(CIMA, _d.divideScalar(L)); m.scale.set(r, L, r); return m;
    };
    const espinho = (a, b, r, mat = casca, pai = g) => ponta(malha(geoCone, mat, pai), a, b, r);
    const conta = (p, r, mat = junta, pai = g) => { const m = malha(geoBola, mat, pai); m.position.set(...p); m.scale.setScalar(r); return m; };
    // pernas (dobradas para trás, como as de um bicho que anda na ponta dos pés)
    for (const s of [-1, 1]) {
      osso(malha(cilU, casca, g), [s * 5, 16, 0], [s * 13, 9, 4], 2.4);
      osso(malha(cilU, casca, g), [s * 13, 9, 4], [s * 10, 4, -2], 1.7);
      osso(malha(cilU, casca, g), [s * 10, 4, -2], [s * 11, 0, 3], 1.4);
      conta([s * 13, 9, 4], 2.2); conta([s * 10, 4, -2], 1.6);
      for (const dx of [-3, 0, 3]) espinho([s * 11, .5, 3], [s * 11 + dx, -.5, 7], .6, junta);
    }
    // cauda comprida, em gomos, com lâmina na ponta
    // a cauda fica num grupo que NÃO se inclina: ela se arrasta pelo chão, para o lado
    const cauda = new THREE.Group(); por(cauda); cauda.scale.setScalar(1.3);
    const curva = new THREE.CatmullRomCurve3([[2, 9, -3], [12, 4, 2], [24, 3, 8], [35, 3.5, 7], [42, 8, 1]].map(p => new THREE.Vector3(...p)));
    malha(new THREE.TubeGeometry(curva, 30, 1.4, 6), casca, cauda);
    for (let i = 0; i <= 14; i++) { const p = curva.getPoint(i / 15); conta([p.x, p.y, p.z], 2.6 - i * .12, junta, cauda); }
    const lamina = espinho([42, 8, 1], [46, 15, -3], 2.2, junta, cauda); lamina.scale.x = .5;
    // tronco estreito com costelas e espinha
    const perfil = [[0, 14], [7, 15], [9.5, 22], [10, 29], [8, 36], [5.5, 41], [0, 42]].map(([x, y]) => new THREE.Vector2(x, y));
    const tronco = malha(new THREE.LatheGeometry(perfil, 20), casca, g);
    tronco.scale.z = .65;
    for (const y of [20, 24, 28, 32]) { const c = malha(new THREE.TorusGeometry(9.6, .65, 6, 20, Math.PI), junta, g); c.position.set(0, y, .3); c.scale.set(1 - Math.abs(y - 27) * .015, 1, .7); c.rotation.x = Math.PI / 2; c.rotation.z = Math.PI; }
    for (let y = 16; y <= 41; y += 3) conta([0, y, -6.2 + Math.abs(y - 29) * .06], 1.4);
    // tubos nas costas
    for (const s of [-1, 1]) for (const [a, b] of [[[s * 5, 38, -4], [s * 10, 52, -16]], [[s * 3, 33, -5], [s * 7, 46, -19]]]) {
      osso(malha(cilU, junta, g), a, b, 1.3); conta(b, 1.9, casca);
    }
    osso(malha(cilU, junta, g), [0, 40, 0], [0, 47, 3], 3);   // pescoço
    // braços finos e compridos, dedos longos (mexem a cada quadro)
    const bracos = [-1, 1].map(s => ({ s, a: malha(cilU, casca, g), b: malha(cilU, casca, g), cot: conta([0, 0, 0], 1.8), dedos: [0, 1, 2].map(() => malha(geoCone, junta, g)) }));
    // cabeça: domo liso e comprido, voltado para trás; boca com duas fileiras de dentes de metal
    const cab = new THREE.Group(); por(cab, g); cab.position.set(0, 47, 3);
    const domo = malha(new THREE.SphereGeometry(1, 32, 22), casca, cab);
    domo.scale.set(7.2, 6.6, 21); domo.rotation.x = .78; domo.position.set(0, 12, -8);
    const rosto = malha(new THREE.SphereGeometry(1, 24, 16), casca, cab);   // rosto, mais largo embaixo
    rosto.scale.set(7.6, 6, 8); rosto.position.set(0, 2, 3);
    const garganta = conta([0, -2, 5], 1, interior, cab); garganta.scale.set(4.2, 3, 4);
    for (let i = 0; i < 7; i++) espinho([-4.2 + i * 1.4, .2, 9.3 - Math.abs(i - 3) * .35], [-4.2 + i * 1.4, -2.2, 9.8 - Math.abs(i - 3) * .35], .55, dente, cab);
    const queixo = new THREE.Group(); por(queixo, cab); queixo.position.set(0, -1, 2);
    const mand = malha(new THREE.SphereGeometry(1, 20, 12), casca, queixo); mand.scale.set(5.6, 2.2, 7.5); mand.position.set(0, -2.6, 2.6);
    for (let i = 0; i < 6; i++) espinho([-3.5 + i * 1.4, -1.6, 7.6 - Math.abs(i - 2.5) * .35], [-3.5 + i * 1.4, .6, 8 - Math.abs(i - 2.5) * .35], .5, dente, queixo);
    const lingua = malha(cilU, junta, cab);   // a segunda boca que avança quando ele ataca
    const bolaPresa = malha(new THREE.SphereGeometry(8 / 1.3, 32, 20), matCromo, cab);
    bolaPresa.position.set(0, -3, 12);
    g.scale.setScalar(1.3);
    metais.push(casca, junta, dente, interior);
    casca.envMapIntensity = 2.1; junta.envMapIntensity = 2; dente.envMapIntensity = 1.6;   // mais luz rebatida no alien
    return {
      atualizar(A) {
        g.visible = cauda.visible = !A.morto;
        if (A.morto) return;
        const t = A.t, raiva = 1 - A.vida / A.max, fl = A.flash > 0 ? A.flash / .3 : 0;
        const sh = fl ? (Math.random() * 4 - 2) * fl : 0;
        cauda.position.copy(P(A.x + sh, A.y + 2));
        const resp = Math.sin(t * (1.6 + raiva * 2.5)), seg = !!A.segurando;
        const boca = seg ? 1 : Math.max(0, .15 + .2 * Math.sin(t * 1.9) + fl * .9);
        g.position.copy(P(A.x + sh, A.y + 2));
        g.rotation.x = -(Math.PI / 2 - ang) * .72;   // inclina para trás, de frente para quem joga
        casca.emissiveIntensity = junta.emissiveIntensity = fl * .35;
        tronco.scale.y = 1 + resp * .015;
        cab.position.y = 47 + resp * .5;
        cab.rotation.set(-.12 + Math.sin(t * .9) * .06 - boca * .1, Math.sin(t * .6) * .18, 0);   // cabeça procura a bola devagar
        queixo.rotation.x = boca * .5;
        const avanco = seg ? .2 : Math.max(0, fl * 1.2 - .1);
        lingua.visible = avanco > 0;
        if (avanco > 0) osso(lingua, [0, -1.5, 4], [0, -1.8, 5 + avanco * 7], 1.4);
        cauda.rotation.set(0, Math.sin(t * 1.1) * .3, Math.sin(t * 1.7) * .05);
        for (const B of bracos) {
          const s = B.s, bal = Math.sin(t * 1.8 + (s > 0 ? 1.3 : 0)) * 2.5 + fl * 5 * s;
          const o = [s * 9, 37, 0], c = seg ? [s * 17, 29, 7] : [s * 16, 26 - bal, 8], m = seg ? [s * 8, 42 - Math.sin(t * 30) * .6, 13] : [s * 12, 39 - bal, 12];
          osso(B.a, o, c, 1.9); osso(B.b, c, m, 1.5); B.cot.position.set(...c);
          B.dedos.forEach((d, k) => ponta(d, m, [m[0] + ([-3, 0, 3][k] + 2) * s, m[1] + [8, 10, 8][k], m[2] + 3], .55));
        }
        bolaPresa.visible = seg;
      },
    };
  })();

  // ================= Rampas de arame e cano de vidro em 3D =================
  // A posição de cada ponto é escolhida para cair, na tela, exatamente onde a pintura (e a bola) estão:
  // o ponto sobe de verdade e anda para a frente na mesa o tanto que a inclinação da câmera "esconde".
  let trilhasDef = [], grupoTrilhas = null;
  const hcArame = zv => 8 + zv * 1.3, hcTubo = z => z + 9;
  const M = (x, y, hc) => P(x, y + hc * Math.tan(ang), hc);
  const matVidro = new THREE.MeshPhysicalMaterial({ color: 0xa8e6ff, transparent: true, opacity: .13, roughness: .04, metalness: 0, envMapIntensity: .9, depthWrite: false, side: THREE.DoubleSide });
  const matAcrilico = new THREE.MeshPhysicalMaterial({ color: 0x7fd0ff, transparent: true, opacity: .32, roughness: .1, metalness: 0, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide, emissive: 0x1a4a70, emissiveIntensity: .4 });
  metais.push(matVidro, matAcrilico);
  // ponto da trilha na distância d (os pontos vêm com d acumulado)
  function interp(pts, d) {
    let i = 1; while (i < pts.length - 1 && pts[i].d < d) i++;
    const a = pts[i - 1], b = pts[i], t = Math.max(0, Math.min(1, (d - a.d) / ((b.d - a.d) || 1)));
    const m = (k) => (a[k] || 0) + ((b[k] || 0) - (a[k] || 0)) * t;
    return { x: m('x'), y: m('y'), dx: m('dx'), dy: m('dy'), zv: m('zv'), d };
  }
  function fio(pontos, raio, mat, pai) {   // tubo fino que passa pelos pontos
    const curva = new THREE.CatmullRomCurve3(pontos);
    return malha(new THREE.TubeGeometry(curva, Math.max(8, pontos.length * 2), raio, 6), mat, pai);
  }
  function arame3D(def, ossos, pai) {
    const pts = def.pts, L = pts[pts.length - 1].d;
    const pt = (p, lat, up) => M(p.x, p.y, hcArame(p.zv)).add(new THREE.Vector3(-p.dy * lat, up, p.dx * lat));
    // dois arames embaixo (onde a bola rola) e dois mais altos dos lados
    for (const [lat, up, r] of [[-5.5, -6.6, .85], [5.5, -6.6, .85], [-9.6, 1, .8], [9.6, 1, .8]]) fio(pts.map(p => pt(p, lat, up)), r, matCromo, pai);
    // travessas em "U" e colunas até o chão
    for (let d = 10; d < L - 4; d += 17) {
      const p = interp(pts, d);
      const tl = pt(p, -9.6, 1), bl = pt(p, -5.5, -6.6), br = pt(p, 5.5, -6.6), tr = pt(p, 9.6, 1);
      ossos.push([tl, bl, .5], [bl, br, .5], [br, tr, .5]);
    }
    for (let d = 40; d < L - 20; d += 62) {
      const p = interp(pts, d), hc = hcArame(p.zv);
      if (hc < 15) continue;
      const topo = pt(p, 0, -7.4), chao = topo.clone(); chao.y = 0;
      ossos.push([topo, chao, 1.25], [chao.clone().setY(0), chao.clone().setY(.9), 3.2]);
    }
    if (def.acrilico) {   // começo de acrílico azul (a "língua" de entrada)
      const fimA = L * def.acrilico, pos = [], idx = [];
      const n = 24;
      for (let k = 0; k <= n; k++) {
        const p = interp(pts, fimA * k / n);
        for (const lat of [-11, 11]) { const v = pt(p, lat, -7.2); pos.push(v.x, v.y, v.z); }
        if (k) { const a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      malha(g, matAcrilico, pai).renderOrder = ORD + 1;
      const p0 = pts[0]; ossos.push([pt(p0, -12, -7), pt(p0, 12, -7), 1.3]);   // beirada de metal na entrada
    }
    if (def.neon) {   // faixa de luz embaixo da ponte
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(def.neon).multiplyScalar(2.4), toneMapped: false });
      fio(pts.map(p => pt(p, 0, -8.6)), .75, mat, pai);
      for (const lat of [-9.6, 9.6]) fio(pts.map(p => pt(p, lat, 2.2)), .35, mat, pai);
    }
  }
  function tubo3D(def, ossos, pai) {
    const pts = def.pts, L = pts[pts.length - 1].d;
    const centro = p => M(p.x, p.y, hcTubo(p.zv));
    const curva = new THREE.CatmullRomCurve3(pts.map(centro));
    malha(new THREE.TubeGeometry(curva, 260, 10, 18, false), matVidro, pai).renderOrder = ORD + 1;
    // anéis de metal ao longo do cano
    const anel = new THREE.TorusGeometry(10.4, .9, 6, 24), q = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1);
    for (let d = 8; d < L - 4; d += 24) {
      const p = interp(pts, d), p2 = interp(pts, Math.min(L, d + 2)), c = centro(p), t = centro(p2).sub(c).normalize();
      const m = malha(anel, matCromo, pai); m.position.copy(c); m.quaternion.copy(q.setFromUnitVectors(Z, t));
    }
    // boca do cano e colunas
    const p0 = pts[0], c0 = centro(p0); ossos.push([c0.clone().add(new THREE.Vector3(-p0.dy * 12, -9, p0.dx * 12)), c0.clone().add(new THREE.Vector3(p0.dy * 12, -9, -p0.dx * 12)), 1.3]);
    for (let d = 50; d < L - 10; d += 46) {
      const p = interp(pts, d), c = centro(p); if (c.y < 16) continue;
      const topo = c.clone(); topo.y -= 10; const chao = topo.clone(); chao.y = 0;
      ossos.push([topo, chao, 1.3], [chao.clone(), chao.clone().setY(.9), 3.4]);
    }
  }
  function construirTrilhas() {
    if (!trilhasDef.length) return;
    if (grupoTrilhas) {
      grupoTrilhas.traverse(o => { if (o.geometry && o.geometry !== cilU) o.geometry.dispose(); });
      cena.remove(grupoTrilhas);
    }
    grupoTrilhas = new THREE.Group(); cena.add(grupoTrilhas);
    const ossos = [];
    for (const d of trilhasDef) (d.tipo === 'tubo' ? tubo3D : arame3D)(d, ossos, grupoTrilhas);
    const im = new THREE.InstancedMesh(cilU, matCromo, ossos.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3();
    ossos.forEach(([a, b, r], i) => {
      _d.subVectors(b, a); const L = _d.length() || .001;
      pos.addVectors(a, b).multiplyScalar(.5); q.setFromUnitVectors(CIMA, _d.divideScalar(L)); s.set(r, L, r);
      im.setMatrixAt(i, m4.compose(pos, q, s));
    });
    im.renderOrder = ORD; grupoTrilhas.add(im);
  }

  // ================= Resto da mesa em 3D: paredes, estilingues, plásticos, alvos, plataformas, spinner, lançador, ovo =================
  const HD = 12;   // altura da Estação Orbital e da Base Lunar
  let mesaDef = null, grupoMesa = null;
  const matParede = new THREE.MeshStandardMaterial({ color: 0x2c313c, roughness: .42, metalness: .65 });
  const matBorrachaB = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .55, emissive: 0x202020 });
  const matPosteV = new THREE.MeshStandardMaterial({ color: 0xc8243e, roughness: .5, emissive: 0x30060c });
  const matDeckLado = new THREE.MeshStandardMaterial({ color: 0x1c1838, roughness: .5, metalness: .3 });
  const matLuaLado = new THREE.MeshStandardMaterial({ color: 0x3a3e4a, roughness: .6, metalness: .2 });
  metais.push(matParede, matBorrachaB, matPosteV, matDeckLado, matLuaLado);
  const geoCaixa = new THREE.BoxGeometry(1, 1, 1), geoCil = new THREE.CylinderGeometry(1, 1, 1, 14);
  const tanA = () => Math.tan(ang);
  // caixa entre dois pontos da mesa (parede), com base na altura "base"
  function matrizParede(m4, ax, ay, bx, by, base, alto, grosso) {
    const dy0 = base * tanA(), L = Math.hypot(bx - ax, by - ay);
    const c = P((ax + bx) / 2, (ay + by) / 2 + dy0, base + alto / 2);
    const q = new THREE.Quaternion().setFromAxisAngle(CIMA, -Math.atan2(by - ay, bx - ax));
    return m4.compose(c, q, new THREE.Vector3(L, alto, grosso));
  }
  function instancias(geo, mat, lista, pai) {   // lista de Matrix4 → uma malha só (rápido no celular)
    if (!lista.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, lista.length);
    lista.forEach((m, i) => im.setMatrixAt(i, m));
    im.renderOrder = ORD; pai.add(im); return im;
  }
  function ossosEmMatrizes(ossos) {
    const q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3();
    return ossos.map(([a, b, r]) => {
      _d.subVectors(b, a); const L = _d.length() || .001;
      pos.addVectors(a, b).multiplyScalar(.5); q.setFromUnitVectors(CIMA, _d.divideScalar(L)); s.set(r, L, r);
      return new THREE.Matrix4().compose(pos, q, s);
    });
  }
  // forma da mesa → geometria extrudada (x da mesa → X, y da mesa → Z)
  function extrudarMesa(pts, alto, chanfro = 0) {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x - W / 2, -(y - H / 2))));
    const g = new THREE.ExtrudeGeometry(s, { depth: alto, bevelEnabled: chanfro > 0, bevelThickness: chanfro, bevelSize: chanfro * .8, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); return g;
  }
  // plataforma elevada: o tampo mostra a mesma pintura da mesa (no lugar certo da tela), os lados são de verdade
  function plataforma(poli, matLado, pai) {
    const t = tanA(), forma = new THREE.Shape(poli.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ShapeGeometry(forma), pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), v = P(x, y + HD * t, HD);
      pos.setXYZ(i, v.x, v.y, v.z); uv[i * 2] = x / W; uv[i * 2 + 1] = 1 - y / H;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const k = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = k; }   // vira o tampo para cima
    g.computeVertexNormals();
    malha(g, matMesa, pai);
    const lados = [], n = poli.length;
    for (let i = 0; i < n; i++) {
      const [ax, ay] = poli[i], [bx, by] = poli[(i + 1) % n];
      const a0 = P(ax, ay + HD * t, 0), a1 = P(ax, ay + HD * t, HD), b0 = P(bx, by + HD * t, 0), b1 = P(bx, by + HD * t, HD);
      lados.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z, a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, a1.x, a1.y, a1.z);
    }
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(lados, 3)); gl.computeVertexNormals();
    const ml = malha(gl, matLado.clone(), pai); ml.material.side = THREE.DoubleSide;
  }
  // peças que mexem (criadas uma vez, posição recalculada em construirMesa)
  let estil3 = [], alvos3 = [], alvosDeck3 = [], spinner3 = null, lancador3 = null, ovo3 = null;
  const matAlvo = new THREE.MeshStandardMaterial({ color: 0xe02a2a, roughness: .35, emissive: 0xff2020, emissiveIntensity: .15 });
  const matAlvoDeck = new THREE.MeshStandardMaterial({ color: 0xe0b820, roughness: .35, emissive: 0xffe27a, emissiveIntensity: .1 });
  metais.push(matAlvo, matAlvoDeck);
  function criarMoveis(d) {
    // estilingues: corpo de plástico, tampa colorida, borrachas brancas e a borracha da frente que estica
    estil3 = d.estilingues.map((s, i) => {
      const g = new THREE.Group(); por(g);
      malha(extrudarMesa([s.a, s.b, s.c], 9, .6), matPlastico, g);
      const corT = i ? 0x2f7cf0 : 0xe62a55;
      const tampaMat = new THREE.MeshStandardMaterial({ color: corT, roughness: .2, transparent: true, opacity: .85, emissive: corT, emissiveIntensity: .25 });
      metais.push(tampaMat);
      const tampa = malha(extrudarMesa([s.a, s.b, s.c], 1.2), tampaMat, g); tampa.position.y = 10.4;
      osso(malha(cilU, matBorrachaB, g), P(...s.a, 5).toArray(), P(...s.b, 5).toArray(), 2.6);
      osso(malha(cilU, matBorrachaB, g), P(...s.b, 5).toArray(), P(...s.c, 5).toArray(), 2.6);
      for (const q of [s.a, s.b, s.c]) { const m = malha(geoCil, matCromo, g); m.position.copy(P(...q, 6)); m.scale.set(2.4, 12, 2.4); }
      const frente = [0, 1, 2, 3, 4, 5].map(() => malha(cilU, matBorrachaB, g));
      return { s, frente, tampaMat };
    });
    alvos3 = d.alvos.map(a => { const m = malha(geoCaixa, matAlvo); return { a, m }; });
    alvosDeck3 = d.alvosDeck.map(a => { const m = malha(geoCaixa, matAlvoDeck.clone()); metais.push(m.material); return { a, m }; });
    // spinner: plaquinha que gira num eixo, presa em dois postes
    spinner3 = new THREE.Group(); por(spinner3);
    const placa = malha(geoCaixa, new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: .2, metalness: .8 }), spinner3);
    placa.scale.set(28, 9, 1); placa.position.y = -4.5; metais.push(placa.material);
    const faixa = malha(geoCaixa, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd84a).multiplyScalar(1.4), toneMapped: false }), spinner3);
    faixa.scale.set(28, 2.4, 1.2); faixa.position.y = -4.5;
    // lançador: ponta vermelha, haste e mola
    lancador3 = new THREE.Group(); por(lancador3);
    const ponta = malha(geoCil, new THREE.MeshStandardMaterial({ color: 0xff3d4e, roughness: .3, emissive: 0x400a10 }), lancador3);
    ponta.rotation.x = Math.PI / 2; ponta.scale.set(9, 8, 9); ponta.position.set(0, 7, 4);
    const haste = malha(geoCil, matCromo, lancador3); haste.rotation.x = Math.PI / 2; haste.position.set(0, 7, 0);
    const pts = []; for (let k = 0; k <= 160; k++) { const a = k / 160 * 7 * DPI; pts.push(new THREE.Vector3(Math.cos(a) * 6.5, 7 + Math.sin(a) * 6.5, k / 160)); }
    const mola = malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, .9, 6), matCromo, lancador3);
    lancador3.userData = { ponta, haste, mola };
    for (const pl of d.plasticos) { pl._mat = new THREE.MeshPhysicalMaterial({ color: pl.cor, transparent: true, opacity: .6, roughness: .15, envMapIntensity: 1, emissive: pl.cor, emissiveIntensity: .35, side: THREE.DoubleSide }); metais.push(pl._mat); }
    // ovo do alien (quando ele morre)
    const ovoMat = new THREE.MeshStandardMaterial({ color: 0x4a3e2a, roughness: .55, metalness: .1, emissive: 0x5dff7a, emissiveIntensity: .1 });
    metais.push(ovoMat);
    ovo3 = malha(new THREE.SphereGeometry(1, 24, 18), ovoMat); ovo3.scale.set(12, 15, 12); ovo3.visible = false;
    for (let k = 0; k < 4; k++) { const p = malha(new THREE.TorusGeometry(1.02, .03, 4, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8cff70, toneMapped: false }), ovo3); p.rotation.set(Math.PI / 2, k * Math.PI / 2, 0); p.position.y = .55; }
  }
  function construirMesa() {
    if (!mesaDef) return;
    if (grupoMesa) { grupoMesa.traverse(o => { if (o.geometry && ![cilU, geoCaixa, geoCil].includes(o.geometry)) o.geometry.dispose(); }); cena.remove(grupoMesa); }
    grupoMesa = new THREE.Group(); cena.add(grupoMesa);
    const d = mesaDef, corpos = [], tampos = [], juntas = [], postesV = [], ossos = [];
    for (const p of d.paredes) {
      const base = p.andar ? HD : 0, t = base * tanA();
      if (p.tipo === 'trilho' || p.tipo === 'bloco' || p.tipo === 'deck') {
        const alto = p.andar ? 7 : 9;
        corpos.push(matrizParede(new THREE.Matrix4(), p.ax, p.ay, p.bx, p.by, base, alto, 4.4));
        tampos.push(matrizParede(new THREE.Matrix4(), p.ax, p.ay, p.bx, p.by, base + alto, 1.4, 5.8));
        for (const [x, y] of [[p.ax, p.ay], [p.bx, p.by]]) juntas.push(new THREE.Matrix4().compose(P(x, y + t, base + (alto + 1.4) / 2), new THREE.Quaternion(), new THREE.Vector3(2.9, alto + 1.4, 2.9)));
      } else if (p.tipo === 'portao') {
        ossos.push([P(p.ax, p.ay, 9), P(p.bx, p.by, 9), 1.1]);
        for (const [x, y] of [[p.ax, p.ay], [p.bx, p.by]]) ossos.push([P(x, y, 0), P(x, y, 10.5), 1.6]);
      } else if (p.tipo === 'luaposte') {
        postesV.push(matrizParede(new THREE.Matrix4(), p.ax, p.ay, p.bx, p.by, base, 7, 7));
        tampos.push(matrizParede(new THREE.Matrix4(), p.ax, p.ay, p.bx, p.by, base + 7, 1.2, 4));
      }
    }
    instancias(geoCaixa, matParede, corpos, grupoMesa);
    instancias(geoCaixa, matCromo, tampos, grupoMesa);
    instancias(geoCil, matCromo, juntas, grupoMesa);
    instancias(geoCaixa, matPosteV, postesV, grupoMesa);
    // plataformas elevadas
    plataforma(d.plataformas[0], matDeckLado, grupoMesa);
    plataforma(d.plataformas[1], matLuaLado, grupoMesa);
    // plásticos coloridos, presos em postes
    for (const pl of d.plasticos) {
      const hc = 17, t = hc * tanA();
      const mat = pl._mat;
      const g = extrudarMesa(pl.pts, 1, .3); g.translate(0, hc, t);
      malha(g, mat, grupoMesa).renderOrder = ORD + 1;
      for (const [x, y] of [pl.pts[0], pl.pts[Math.floor(pl.pts.length / 2)]]) ossos.push([P(x, y + t, hc), P(x, y + t, 0), 1.3]);
    }
    for (const x of [26, 56]) ossos.push([P(x, 300, 0), P(x, 300, 15), 1.2]);   // postes do spinner
    instancias(cilU, matCromo, ossosEmMatrizes(ossos), grupoMesa);
    // posições das peças móveis que dependem da inclinação
    const t = HD * tanA();
    alvosDeck3.forEach(({ a, m }) => { m.position.copy(P(a.ax - 1.5, (a.ay + a.by) / 2 + t, HD + 4)); m.scale.set(4, 8, a.by - a.ay); });
    spinner3.position.copy(P(41, 300, 13));
  }
  function atualizarMoveis(est) {
    if (!mesaDef) return;
    const rel = est.relogio || 0;
    for (const E of estil3) {
      const s = E.s, [ax, ay] = s.a, [cx, cy] = s.c, [bx, by] = s.b;
      const L = Math.hypot(cx - ax, cy - ay); let nx = -(cy - ay) / L, ny = (cx - ax) / L;
      if (nx * (bx - ax) + ny * (by - ay) > 0) { nx = -nx; ny = -ny; }
      const tm = rel - s.mola, tt = rel - s.toque;
      let curva = 0;
      if (tm < .5) curva += -6 * Math.exp(-tm * 9) * Math.cos(tm * 42);
      if (tt < .3) curva += -2.2 * (s.forca || .3) * Math.exp(-tt * 14) * Math.cos(tt * 50);
      const pts = [];
      for (let k = 0; k <= 6; k++) { const u = k / 6, b = 4 * u * (1 - u) * curva * 2; pts.push(P(ax + (cx - ax) * u + nx * b, ay + (cy - ay) * u + ny * b, 5).toArray()); }
      E.frente.forEach((m, k) => osso(m, pts[k], pts[k + 1], 2.8));
      const aceso = s.flash > 0 || tt < .12;
      E.tampaMat.emissiveIntensity = aceso ? 1.6 : .25;
    }
    for (const { a, m } of alvos3) {
      const desce = a.de_pe ? 0 : Math.min(1, (rel - a.cai) / .12);
      const L = Math.hypot(a.bx - a.ax, a.by - a.ay);
      m.position.copy(P((a.ax + a.bx) / 2, (a.ay + a.by) / 2, 6 - desce * 12));
      m.rotation.y = -Math.atan2(a.by - a.ay, a.bx - a.ax); m.scale.set(L - 1, 12, 4);
      m.visible = desce < 1;
    }
    for (const { a, m } of alvosDeck3) m.material.emissiveIntensity = a.aceso || a.flash > 0 ? 1.4 : .1;
    spinner3.rotation.set(est.spinner || 0, 0, 0);
    const plY = est.plY ?? 705, U = lancador3.userData;
    U.ponta.position.set(0, 7, 0); lancador3.position.copy(P(365, plY + 4));
    const curso = Math.max(4, 750 - (plY + 8));
    U.haste.scale.set(2, curso, 2); U.haste.position.set(0, 7, curso / 2 + 4);
    U.mola.position.set(0, 0, 6); U.mola.scale.set(1, 1, curso - 4);
    const A = mesaDef.alien;
    ovo3.visible = !!A.morto;
    if (A.morto) {
      const falta = A.renasce - rel, treme = falta < 2.5 ? Math.sin(rel * 40) * (2.5 - falta) : 0;
      ovo3.position.copy(P(A.x + treme * .6, A.y, 13)); ovo3.rotation.z = treme * .03;
      ovo3.material.emissiveIntensity = .1 + .25 * (.5 + .5 * Math.sin(rel * 4));
    }
  }

  // esferas invisíveis das bolas pintadas (só marcam profundidade)
  const matProx = new THREE.MeshBasicMaterial({ colorWrite: false });
  const geoProx = new THREE.SphereGeometry(1, 16, 12);
  const proxies = [];
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(geoProx, matProx); m.renderOrder = 1; m.visible = false; cena.add(m); proxies.push(m); }
  function atualizarProxies(lista) {
    proxies.forEach((m, i) => {
      const b = lista[i];
      if (!b) { m.visible = false; return; }
      m.visible = true; m.position.copy(P(b.x, b.y));
      let r = b.r;
      if (b.tipo) m.position.copy(M(b.x, b.y, b.tipo === 'tubo' ? hcTubo(b.zv) : hcArame(b.zv)));   // dentro do cano / sobre o arame
      else if (b.andar) m.position.copy(M(b.x, b.y, HD));   // em cima da estação ou da Base Lunar
      else if (b.alto) {   // bola em rampa/andar de cima: fica na frente de qualquer peça do chão
        _d.subVectors(cam.position, m.position); const d = _d.length();
        m.position.addScaledVector(_d.divideScalar(d), 90); r *= (d - 90) / d;
      }
      m.scale.setScalar(r * .95);
    });
  }

  let defs = null;
  function pecas3D(d) { defs = d; criarPalhetas(d.palhetas); criarCogumelos(d.cogumelos); trilhasDef = d.trilhas || []; construirTrilhas(); mesaDef = d; criarMoveis(d); construirMesa(); }
  function atualizarPecas(est) {
    if (!defs) return;
    palhetas3.forEach((g, i) => {
      const p = defs.palhetas[i];
      g.rotation.y = -(est.angulos ? est.angulos[i] : p.ang);
      g.position.copy(p.andar ? M(p.px, p.py, HD) : P(p.px, p.py));   // as pequenas ficam em cima das plataformas
    });
    cogumelos3.forEach(c => { if (c.b.andar) c.g.position.copy(M(c.b.x, c.b.y, HD)); });
    atualizarCogumelos();
    atualizarMoveis(est);
    alien.atualizar(defs.alien);
    atualizarProxies(est.bolas || []);
  }

  // ---------- Bola cromada (renderizada à parte e colada na pintura) ----------
  const bola = (() => {
    const T = 96;
    const r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r2.setPixelRatio(1); r2.setSize(T, T, false);
    r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.NeutralToneMapping; r2.setClearColor(0, 0);
    const pm2 = new THREE.PMREMGenerator(r2);
    const c2 = new THREE.Scene();
    const esfera = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: .1, envMapIntensity: 1.25 }));
    c2.add(esfera);
    const ca = new THREE.OrthographicCamera(-1.02, 1.02, 1.02, -1.02, .1, 20);
    const h2 = new THREE.HemisphereLight(0xffffff, 0x000000, 0); c2.add(h2);
    const brilhos = [];
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffffff, 0, 0, 2); c2.add(l); brilhos.push(l); }
    const topo = new THREE.DirectionalLight(0xffffff, 2.2); topo.position.set(-2, 6, -3); c2.add(topo);
    let env = null;
    return {
      ambiente(t) { if (env) env.dispose(); env = pm2.fromEquirectangular(t).texture; c2.environment = env; },
      // x, y: centro na pintura; r: raio; k: quanto esticar na vertical; extra: luzes próximas e clarão
      desenhar(ctx, x, y, r, k, { bx, by, perto = [], gi = 0, giCor = '255,210,120' }) {
        ca.position.set(0, Math.cos(ang) * 5, Math.sin(ang) * 5); ca.lookAt(0, 0, 0);
        c2.environmentRotation.set(0, bx * .012, 0);   // o reflexo escorrega conforme a bola anda
        perto.sort((a, b) => b.f - a.f);
        brilhos.forEach((l, i) => {
          const p = perto[i];
          if (!p) { l.intensity = 0; return; }
          const dx = p.x - bx, dz = p.y - by, d = Math.hypot(dx, dz) || 1;
          l.position.set(dx / d * 2.4, 1.2, dz / d * 2.4); l.color.set(p.cor); l.intensity = p.f * 14;
        });
        h2.color.setRGB(...giCor.split(',').map(n => n / 255)); h2.intensity = Math.min(1.2, gi * 1.2);
        r2.render(c2, ca);
        ctx.save(); ctx.translate(x, y); ctx.scale(1, k);
        ctx.drawImage(r2.domElement, -r * 1.02, -r * 1.02, r * 2.04, r * 2.04);
        ctx.restore();
      },
    };
  })();

  return { canvas: cv, ajustar, render, proj, ambiente, bola: bola.desenhar, pecas: pecas3D, get ang() { return ang; }, _dbg: dbg };
}

window.PB3D = { criar };
window.dispatchEvent(new Event('pb3d'));

// Tabuleiro 3D de letras, usado pelas Palavras Cruzadas e pelo Caça-Palavras.
// O tabuleiro mede sempre 10 x 10; as peças encolhem conforme o número de casas. y é a altura, -z é o fundo.
import * as THREE from 'three';
import { montarCenario } from './cenarios3d.js';

// Material das peças em cada uma das 10 fases.
export const PELES = [
  { nome: 'Madeira', cor: '#e8c58d', tinta: '#3a2410', base: '#8a5a30', r: .62, m: 0 },
  { nome: 'Nogueira', cor: '#9a6238', tinta: '#fff1dc', base: '#4a2c18', r: .5, m: 0 },
  { nome: 'Porcelana', cor: '#f7f4ec', tinta: '#1f3b63', base: '#41659a', r: .2, m: 0 },
  { nome: 'Pedra', cor: '#a9b1ba', tinta: '#12161d', base: '#4c545e', r: .85, m: 0 },
  { nome: 'Bronze', cor: '#d39a5c', tinta: '#2a1404', base: '#5c3517', r: .4, m: .4 },
  { nome: 'Prata', cor: '#dfe5ee', tinta: '#141c2c', base: '#596579', r: .32, m: .42 },
  { nome: 'Ouro', cor: '#f6c650', tinta: '#3a2500', base: '#7a5410', r: .3, m: .42, sel: '#5fd0ff' },
  { nome: 'Esmeralda', cor: '#1fa877', tinta: '#ffffff', base: '#0b4f3a', r: .12, m: .1, certo: '#ffe29a' },
  { nome: 'Rubi', cor: '#c92f52', tinta: '#ffffff', base: '#5a0f24', r: .2, m: .1, erro: '#2b2f48' },
  { nome: 'Diamante', cor: '#dcf3ff', tinta: '#0f3566', base: '#3f7fb8', r: .05, m: .2 },
];

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÇ', COL = 10, LIN = 8, MAX = 196;
const glifo = ch => ch ? LETRAS.indexOf(ch) : -1, glifoNum = n => n ? 29 + n : -1;

// Folha com todas as letras e números, desenhada na hora.
function folha() {
  const L = 128, c = document.createElement('canvas'); c.width = COL * L; c.height = LIN * L;
  const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const poe = (k, t, tam) => { x.font = `800 ${tam}px "Segoe UI", Roboto, system-ui, sans-serif`; x.fillText(t, (k % COL + .5) * L, (Math.floor(k / COL) + .52) * L); };
  [...LETRAS].forEach((t, k) => poe(k, t, t === 'Ç' ? 92 : 104));
  for (let n = 1; n <= 45; n++) poe(29 + n, String(n), n > 9 ? 82 : 96);
  const t = new THREE.CanvasTexture(c); t.flipY = false; t.anisotropy = 4; return t;
}

// Caixa com cantos arredondados.
function caixaRedonda(w, h, d, r, s) {
  const n = 2 * s + 1, g = new THREE.BoxGeometry(w, h, d, n, n, n), p = g.attributes.position, nor = g.attributes.normal, m = [w / 2, h / 2, d / 2], v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const a = [p.getX(i), p.getY(i), p.getZ(i)].map((q, e) => { const k = Math.round((q + m[e]) / (2 * m[e]) * n); return k <= s ? -m[e] + r * k / s : m[e] - r * (n - k) / s; });
    const c = a.map((q, e) => Math.max(-m[e] + r, Math.min(m[e] - r, q)));
    v.set(a[0] - c[0], a[1] - c[1], a[2] - c[2]).normalize();
    p.setXYZ(i, c[0] + v.x * r, c[1] + v.y * r, c[2] + v.z * r); nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

export function criarTabuleiro(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .92;
  const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 1, 120);

  // Luz do ambiente: um estúdio simples, para metal e pedra terem reflexo.
  {
    const est = new THREE.Scene(), cx = (w, h, d, x, y, z, k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k) })); b.position.set(x, y, z); est.add(b); };
    est.add(new THREE.Mesh(new THREE.SphereGeometry(20, 16, 12), new THREE.MeshBasicMaterial({ color: 0x9aa4b8, side: THREE.BackSide })));
    cx(9, .4, 9, 0, 12, 0, 5); cx(.4, 7, 5, -12, 5, 2, 3); cx(.4, 5, 8, 12, 4, -3, 2); cx(40, .4, 40, 0, -10, 0, .12);
    const pm = new THREE.PMREMGenerator(renderer); cena.environment = pm.fromScene(est, .04).texture; pm.dispose(); cena.environmentIntensity = .5;
  }
  const sol = new THREE.DirectionalLight(0xfff3dd, 2); sol.position.set(-5.5, 13, 4.5); sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024); Object.assign(sol.shadow.camera, { left: -9, right: 9, top: 10, bottom: -8, near: 1, far: 34 }); sol.shadow.bias = -.0006; sol.shadow.normalBias = .03; sol.shadow.radius = 4;
  cena.add(sol, new THREE.HemisphereLight(0xdfe8ff, 0x4a4038, .5));

  // ---------- Peças ----------
  const ALT = .5, atlas = folha(), geo = caixaRedonda(.94, ALT, .94, .1, 3);
  const aG = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 2).fill(-1), 2), aT = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
  geo.setAttribute('aG', aG); geo.setAttribute('aT', aT);
  const mat = new THREE.MeshStandardMaterial({ roughness: .5 });
  mat.onBeforeCompile = s => {
    s.uniforms.uFolha = { value: atlas };
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aG; attribute vec3 aT; varying vec2 vU; varying float vTopo; varying vec2 vG; varying vec3 vT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvU = position.xz / .94 + .5; vTopo = normal.y; vG = aG; vT = aT;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D uFolha; varying vec2 vU; varying float vTopo; varying vec2 vG; varying vec3 vT;
      float letraEm(float k, vec2 l) { k = floor(k + .5); vec2 c = vec2(mod(k, ${COL}.), floor(k / ${COL}.)); vec2 q = clamp(l, .02, .98);
        float a = texture2D(uFolha, (c + q) / vec2(${COL}., ${LIN}.)).r; return k < 0. || l.x < .0 || l.y < .0 || l.x > 1. || l.y > 1. ? 0. : a; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float tinta = max(letraEm(vG.x, (vU - .5) / .84 + .5), letraEm(vG.y, (vU - vec2(.05, .05)) / .4)) * step(.6, vTopo);
      diffuseColor.rgb = mix(diffuseColor.rgb, vT, tinta);`)
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= 1. - tinta;');
  };
  const pecas = new THREE.InstancedMesh(geo, mat, MAX); pecas.castShadow = pecas.receiveShadow = true; pecas.frustumCulled = false; pecas.count = 0;
  pecas.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
  const mesa = new THREE.Group(); mesa.add(pecas); cena.add(mesa);
  const base = new THREE.Mesh(caixaRedonda(10.7, .7, 10.7, .28, 4), new THREE.MeshStandardMaterial({ roughness: .55 })); base.position.y = -.42; base.receiveShadow = base.castShadow = true; cena.add(base);

  // ---------- Confete ----------
  const NC = 180, confete = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .05, .2), new THREE.MeshStandardMaterial({ roughness: .5 }), NC);
  confete.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NC * 3), 3); confete.frustumCulled = false; confete.count = 0; cena.add(confete);
  const grao = Array.from({ length: NC }, () => ({ vida: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), g: 0 })); let vezC = 0;
  function explodir(x, y, z, cor, q, forca = 1) {
    const c = new THREE.Color(), h = {}; new THREE.Color(cor).getHSL(h);
    for (let k = 0; k < q; k++) {
      const i = vezC = (vezC + 1) % NC, a = grao[i], t = Math.random() * 6.283, f = (.6 + Math.random()) * 2.6 * forca;
      a.vida = .9 + Math.random() * .7; a.p.set(x, y, z); a.v.set(Math.cos(t) * f, (3.5 + Math.random() * 4) * forca, Math.sin(t) * f); a.r.set(Math.random() * 6, Math.random() * 6, 0); a.g = 4 + Math.random() * 8;
      c.setHSL((h.h + (Math.random() - .5) * .1 + 1) % 1, Math.min(1, h.s * 1.1), Math.max(.35, Math.min(.8, h.l + (Math.random() - .5) * .3))); confete.setColorAt(i, c);
    }
    confete.instanceColor.needsUpdate = true; confete.count = NC; acordar();
  }

  // ---------- Estado ----------
  let N = 0, P = [], idx = [], esc = 1, pele = PELES[0], cenario = null, W = 1, H = 1, saindo = null, ativoAte = 0, relogio = 0, morto = false, faixa = .16;
  const O = new THREE.Object3D(), cz = new THREE.Color(), claro = new THREE.Color('#ffffff'), escuro = new THREE.Color('#141726');
  const acordar = (s = .9) => { ativoAte = Math.max(ativoAte, relogio + s); };

  function montar(n, casas, fase, nomeCenario) {
    N = n; esc = 10 / n; pele = PELES[Math.max(0, Math.min(9, fase))]; idx = []; P = []; saindo = null;
    mat.roughness = pele.r; mat.metalness = pele.m; mat.needsUpdate = true; base.material.color.set(pele.base); base.material.metalness = pele.m * .7; base.material.roughness = Math.max(.3, pele.r);
    casas.forEach((cs, i) => {
      if (!cs) { idx[i] = -1; return; }
      const l = Math.floor(i / n), c = i % n; idx[i] = P.length;
      P.push({ i, x: c - (n - 1) / 2, z: l - (n - 1) / 2, y: 9, vy: 0, ty: 0, espera: .15 + (l + c) * .028 + Math.random() * .06, rx: 0, vira: null, pulo: null, treme: 0, letra: cs.letra || '', num: cs.num || 0, cor: new THREE.Color(pele.cor), tc: new THREE.Color(pele.cor), tinta: new THREE.Color(pele.tinta), tt: new THREE.Color(pele.tinta), alvoCor: null, fora: 0 });
    });
    pecas.count = P.length; mesa.scale.setScalar(esc); mesa.position.y = ALT * esc / 2 - .06;
    P.forEach((p, k) => aG.setXY(k, glifo(p.letra), glifoNum(p.num))); aG.needsUpdate = true;
    if (!cenario || cenario.nome !== nomeCenario) { if (cenario) cenario.tirar(); cenario = montarCenario(THREE, cena, nomeCenario); }
    sol.color.set(cenario.luz || '#fff3dd'); encaixar(); acordar(2.2);
  }
  const de = i => P[idx[i]];
  // Cor (ou null para a cor da fase) e altura da peça.
  function estado(i, cor, alt = 0) {
    const p = de(i); if (!p) return;
    if (p.ty !== alt || p.alvoCor !== cor) acordar();
    p.ty = alt; p.alvoCor = cor; p.tc.set(cor || pele.cor);
    if (!cor) p.tt.set(pele.tinta); else { const b = p.tc.r * .3 + p.tc.g * .59 + p.tc.b * .11; p.tt.copy(b > .22 ? escuro : claro); }
  }
  function letra(i, ch, girar) {
    const p = de(i); if (!p || p.letra === ch) return;
    p.letra = ch;
    if (girar) p.vira = { t: 0, trocou: false }; else { aG.setX(idx[i], glifo(ch)); aG.needsUpdate = true; }
    acordar();
  }
  const pular = (i, atraso = 0, alt = 1) => { const p = de(i); if (p) { p.pulo = { t: -atraso, alt }; acordar(1 + atraso); } };
  const tremer = i => { const p = de(i); if (p) { p.treme = .4; acordar(); } };
  function centro(i, v = new THREE.Vector3()) { const p = de(i); return p ? v.set(p.x * esc, ALT * esc + p.y * esc, p.z * esc) : v; }
  const estourar = (i, cor, q = 10) => { const v = centro(i); explodir(v.x, v.y + .2, v.z, cor, q, .8); };
  function festa() {
    P.forEach(p => pular(p.i, (Math.abs(p.x) + Math.abs(p.z)) * .05, 1.6));
    ['#ff5a7a', '#ffcf3f', '#4ad0ff', '#5fe08a', '#b58cff'].forEach((c, k) => setTimeout(() => !morto && explodir(-4 + k * 2, .8, -1 + (k % 2) * 2, c, 30, 1.25), k * 130));
    acordar(3);
  }
  // As peças caem em onda e o tabuleiro fica livre para a próxima fase.
  function sair() { return new Promise(ok => { P.forEach(p => { p.fora = .01 + (p.x + p.z + N) * .022; }); saindo = { ate: relogio + 1.15, ok }; acordar(1.6); }); }

  // ---------- Câmera: o tabuleiro na largura toda, com o cenário no alto ----------
  function encaixar() {
    W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, qualidade)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.clearViewOffset();
    const v = new THREE.Vector3(), pts = []; for (const x of [-5.3, 5.3]) for (const z of [-5.3, 5.3]) for (const y of [0, .7]) pts.push([x, y, z]);
    let el = 0;
    const mede = d => {
      camera.position.set(0, Math.sin(el) * d, Math.cos(el) * d); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      let mx = 0, a = 9, b = -9; for (const p of pts) { v.set(...p).project(camera); mx = Math.max(mx, Math.abs(v.x)); a = Math.min(a, v.y); b = Math.max(b, v.y); }
      return { ok: mx <= .985 && (b - a) <= 2 * (1 - faixa) * .985, a, b };
    };
    const ajusta = graus => { el = graus * Math.PI / 180; let lo = 8, hi = 90; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (mede(m).ok) hi = m; else lo = m; } return { d: hi, ...mede(hi) }; };
    // Sobrando altura, a câmera sobe (tabuleiro maior) e o cenário cresce.
    let r = ajusta(61); const alto = Math.max(0, Math.min(1, (2 - (r.b - r.a) - 2 * faixa - .1) / .8)); if (alto) r = ajusta(61 + 7 * alto);
    const sobra = 2 - (r.b - r.a), chao = Math.min(.05, sobra * .1), desce = -1 + chao - r.a;
    if (cenario) cenario.escala(Math.max(.82, Math.min(1.22, .62 + sobra * .75)));
    if (cena.fog) { cena.fog.near = r.d * .98; cena.fog.far = r.d * 1.62; }
    camera.setViewOffset(W, H, 0, desce * H / 2, W, H); camera.updateProjectionMatrix(); acordar(.5);
  }
  let qualidade = 2, lentos = 0;

  // ---------- Toque: casa embaixo do dedo ----------
  const raio = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt = new THREE.Vector3(), ndc = new THREE.Vector2();
  function pegar(cx, cy) {
    const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, 1 - (cy - r.top) / r.height * 2);
    raio.setFromCamera(ndc, camera); plano.constant = -(ALT * esc - .06);
    if (!raio.ray.intersectPlane(plano, pt)) return null;
    const c = Math.floor(pt.x / esc + N / 2), l = Math.floor(pt.z / esc + N / 2), lim = x => Math.max(0, Math.min(N - 1, x));
    return { l: lim(l), c: lim(c), dentro: l >= 0 && c >= 0 && l < N && c < N, longe: l < -1 || c < -1 || l > N || c > N, i: lim(l) * N + lim(c) };
  }
  // Onde a casa aparece na tela (para testes e para balões).
  function naTela(i) { const r = canvas.getBoundingClientRect(), v = new THREE.Vector3((i % N - (N - 1) / 2) * esc, ALT * esc, (Math.floor(i / N) - (N - 1) / 2) * esc).project(camera); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }

  // ---------- Quadro ----------
  function passo(dt) {
    let mexeu = false;
    for (let k = 0; k < P.length; k++) {
      const p = P[k]; let y, rx = 0, rz = 0, dx = 0, s = 1;
      if (p.espera > 0) { p.espera -= dt; mexeu = true; }
      else if (p.fora > 0 && saindo) { p.fora -= dt; if (p.fora <= 0) p.fora = -.0001; mexeu = true; }
      else if (p.fora < 0) { p.vy -= 26 * dt; p.y += p.vy * dt; p.rx += dt * 5; mexeu = true; }
      else {
        const f = (p.ty - p.y) * 190 - p.vy * 19; p.vy += f * dt; p.y += p.vy * dt;
        if (Math.abs(p.ty - p.y) > .002 || Math.abs(p.vy) > .01) mexeu = true; else { p.y = p.ty; p.vy = 0; }
      }
      y = p.y; rx = p.rx;
      if (p.fora < 0) s = Math.max(0, Math.min(1, 1 + (p.y + 1) * .12));
      if (p.pulo) { p.pulo.t += dt; mexeu = true; if (p.pulo.t > 0) { const t = p.pulo.t / .42; if (t >= 1) p.pulo = null; else { y += Math.sin(t * Math.PI) * p.pulo.alt; rz = Math.sin(t * Math.PI * 2) * .12; } } }
      if (p.vira) { p.vira.t += dt / .26; mexeu = true; const t = Math.min(1, p.vira.t); rx += (1 - Math.cos(t * Math.PI)) * Math.PI; y += Math.sin(t * Math.PI) * .75; if (t >= .5 && !p.vira.trocou) { p.vira.trocou = true; aG.setX(k, glifo(p.letra)); aG.needsUpdate = true; } if (t >= 1) p.vira = null; }
      if (p.treme > 0) { p.treme -= dt; mexeu = true; dx = Math.sin(p.treme * 60) * .12 * Math.max(0, p.treme / .4); }
      if (!p.cor.equals(p.tc)) { const q = 1 - Math.exp(-dt * 13); p.cor.lerp(p.tc, q); p.tinta.lerp(p.tt, q); if (Math.abs(p.cor.r - p.tc.r) + Math.abs(p.cor.g - p.tc.g) + Math.abs(p.cor.b - p.tc.b) < .006) { p.cor.copy(p.tc); p.tinta.copy(p.tt); } mexeu = true; }
      O.position.set(p.x + dx, y, p.z); O.rotation.set(rx, 0, rz); O.scale.setScalar(s || .0001); O.updateMatrix(); pecas.setMatrixAt(k, O.matrix);
      pecas.instanceColor.setXYZ(k, p.cor.r, p.cor.g, p.cor.b); aT.setXYZ(k, p.tinta.r, p.tinta.g, p.tinta.b);
    }
    pecas.instanceMatrix.needsUpdate = pecas.instanceColor.needsUpdate = aT.needsUpdate = true;
    if (confete.count) {
      let vivos = 0;
      for (let i = 0; i < NC; i++) {
        const a = grao[i]; if (a.vida > 0) { vivos++; a.vida -= dt; a.v.y -= 9 * dt; a.v.multiplyScalar(1 - dt * .6); a.p.addScaledVector(a.v, dt); if (a.p.y < .05 && a.v.y < 0) { a.p.y = .05; a.v.y *= -.35; a.v.x *= .6; a.v.z *= .6; } a.r.x += a.g * dt; a.r.y += a.g * .7 * dt; }
        O.position.copy(a.p); O.rotation.copy(a.r); O.scale.setScalar(a.vida > 0 ? Math.min(1, a.vida * 3) : .0001); O.updateMatrix(); confete.setMatrixAt(i, O.matrix);
      }
      confete.instanceMatrix.needsUpdate = true; if (!vivos) confete.count = 0; else mexeu = true;
    }
    if (saindo && relogio >= saindo.ate) { const ok = saindo.ok; saindo = null; ok(); }
    return mexeu;
  }
  let antes = 0, par = 0, mexendo = true;
  function quadro(t) {
    if (morto) return; requestAnimationFrame(quadro);
    if (document.hidden || !canvas.clientWidth || (window.JO_parado && window.JO_parado())) { antes = t; return; }
    if (canvas.clientWidth !== W || canvas.clientHeight !== H) encaixar();
    const ativo = mexendo || relogio < ativoAte;
    if (!ativo && (par = par + 1) % 2) return; // parado: metade dos quadros, só o cenário balança de leve
    const real = (t - antes) / 1000, dt = Math.min(.04, real || .016); antes = t; relogio += dt;
    // Celular lento: baixa a definição uma vez ou duas.
    if (ativo && real > .03 && real < .3) { if (++lentos > 45 && qualidade > 1) { qualidade -= .5; lentos = 0; encaixar(); } } else if (lentos > 0 && real < .02) lentos--;
    mexendo = passo(dt); if (cenario) cenario.quadro(relogio);
    if (ativo || mexendo) renderer.shadowMap.needsUpdate = true;
    renderer.render(cena, camera);
  }
  requestAnimationFrame(quadro);
  canvas.addEventListener('webglcontextlost', ev => ev.preventDefault());

  return {
    montar, estado, letra, pular, tremer, estourar, festa, sair, pegar, naTela, encaixar,
    get pele() { return pele; }, set faixa(f) { faixa = f; encaixar(); },
    get info() { return { tri: renderer.info.render.triangles, chamadas: renderer.info.render.calls, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries, qualidade, pecas: P.length, parado: !mexendo }; },
    dispose() { morto = true; if (cenario) cenario.tirar(); renderer.dispose(); },
  };
}

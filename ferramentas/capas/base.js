// Estúdio das capas: luz suave, sombras, foco, brilho e ferramentas de modelagem (letras 3D, caixas arredondadas, cartas).
import * as THREE from 'three';
import { EffectComposer } from '../../lib/three/addons/EffectComposer.js';
import { ShaderPass } from '../../lib/three/addons/ShaderPass.js';
import { UnrealBloomPass } from '../../lib/three/addons/UnrealBloomPass.js';
import { OutputPass } from '../../lib/three/addons/OutputPass.js';

// o reflexo do estúdio continua forte, mas a luz ambiente que ele espalha fica fraca (quem faz isso é o "domo", com sombra)
THREE.ShaderChunk.lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', 'iblIrradiance += .22 * getIBLIrradiance( geometryNormal );');

// o brilho das luzes em superfícies muito lisas vira pontinhos: nelas, quem faz o brilho é só o reflexo do estúdio
THREE.ShaderChunk.lights_physical_pars_fragment = THREE.ShaderChunk.lights_physical_pars_fragment.replace('clearcoatSpecularDirect +=', 'if ( material.clearcoatRoughness > .2 ) clearcoatSpecularDirect +=').replace('reflectedLight.directSpecular += irradiance * BRDF_GGX', 'reflectedLight.directSpecular += smoothstep( .12, .4, material.roughness ) * irradiance * BRDF_GGX');

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
let semente = 7;
export const semear = s => { semente = s; };
export const sorte = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
export const entre = (a, b) => a + sorte() * (b - a);

// ---------- Materiais ----------
export const mat = o => new THREE.MeshPhysicalMaterial(o);
export const verniz = (cor, o = {}) => mat({ color: cor, roughness: .28, clearcoat: 1, clearcoatRoughness: .05, ...o });
export const metal = (cor, r = .18, o = {}) => mat({ color: cor, metalness: 1, roughness: r, ...o });
export const luz = (cor, k = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k) });
export function tela(w, h, f, linear) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d', { willReadFrequently: true }), w, h);
  const t = new THREE.CanvasTexture(c); if (!linear) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}
export const malha = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
export const esfera = (r, m, x, y, z) => malha(new THREE.SphereGeometry(r, 96, 64), m, x, y, z);

// ---------- Formas ----------
export function caixa(w, h, d, r, m, x, y, z, n = 8) {
  const g = new THREE.BoxGeometry(w, h, d, n * 2, n * 2, n * 2), p = g.attributes.position, nm = g.attributes.normal, uv = g.attributes.uv, v = V(), c = V();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  // concentra os pontos nas quinas para o arredondado ficar liso
  const f = (q, m2, h2) => { const k = Math.abs(q / m2) * 2; return Math.sign(q) * (k < .25 ? h2 * k / .25 : h2 + (m2 / 2 - h2) * Math.tan((k - .25) / .75 * Math.PI / 4)); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); v.set(f(v.x, w, hx), f(v.y, h, hy), f(v.z, d, hz));
    const nx = nm.getX(i), ny = nm.getY(i), nz = nm.getZ(i);
    const U = nx ? [-v.z * Math.sign(nx) / d, v.y / h] : ny ? [v.x / w, -v.z * Math.sign(ny) / d] : [v.x * Math.sign(nz) / w, v.y / h];
    uv.setXY(i, U[0] + .5, U[1] + .5);
    c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    const d2 = v.clone().sub(c).normalize(); v.copy(c).addScaledVector(d2, r);
    p.setXYZ(i, v.x, v.y, v.z); nm.setXYZ(i, d2.x, d2.y, d2.z);
  }
  return malha(g, m, x, y, z);
}
// alisa as normais de uma malha extrudada, mantendo quinas vivas
function alisar(g, graus = 38) {
  g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, mapa = new Map(), lim = Math.cos(graus * Math.PI / 180);
  const ch = i => `${Math.round(p.getX(i) * 2e3)},${Math.round(p.getY(i) * 2e3)},${Math.round(p.getZ(i) * 2e3)}`;
  const N = [];
  for (let i = 0; i < p.count; i++) { N.push(V().fromBufferAttribute(n, i)); const k = ch(i); if (!mapa.has(k)) mapa.set(k, []); mapa.get(k).push(i); }
  const s = V();
  for (let i = 0; i < p.count; i++) { s.set(0, 0, 0); for (const j of mapa.get(ch(i))) if (N[i].dot(N[j]) > lim) s.add(N[j]); s.normalize(); n.setXYZ(i, s.x, s.y, s.z); }
  return g;
}
// transforma um desenho (canvas) em contornos: anda pelas bordas com precisão menor que um pixel
function contornos(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data, a = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3] / 255, seg = new Map();
  const pt = (x1, y1, x2, y2) => { const A = a(x1, y1), B = a(x2, y2), t = (.5 - A) / (B - A); return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]; };
  const chave = p => p.map(v => v.toFixed(3)).join(), liga = (p, q) => seg.set(chave(p), { p, q });
  for (let y = -1; y < h; y++) for (let x = -1; x < w; x++) {
    const c = (a(x, y) > .5 ? 8 : 0) | (a(x + 1, y) > .5 ? 4 : 0) | (a(x + 1, y + 1) > .5 ? 2 : 0) | (a(x, y + 1) > .5 ? 1 : 0);
    if (!c || c === 15) continue;
    const T = () => pt(x, y, x + 1, y), R = () => pt(x + 1, y, x + 1, y + 1), B = () => pt(x, y + 1, x + 1, y + 1), L = () => pt(x, y, x, y + 1);
    const pares = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 5: [[L, T], [R, B]], 6: [[B, T]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: [[T, R], [B, L]], 11: [[T, R]], 12: [[R, L]], 13: [[R, B]], 14: [[B, L]] }[c];
    for (const [i, f] of pares) liga(i(), f());
  }
  const saida = [];
  while (seg.size) {
    let [k, s] = seg.entries().next().value; const l = [];
    while (s) { l.push(s.p); seg.delete(k); k = chave(s.q); s = seg.get(k); }
    if (l.length > 8) saida.push(l);
  }
  return saida;
}
function simplifica(l, tol) {
  const dist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / q)); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t); };
  const longe = l.reduce((m, p, i) => Math.hypot(p[0] - l[0][0], p[1] - l[0][1]) > Math.hypot(l[m][0] - l[0][0], l[m][1] - l[0][1]) ? i : m, 0);
  l = [...l, l[0]];
  const dp = (a, b) => { let m = 0, k = -1; for (let i = a + 1; i < b; i++) { const q = dist(l[i], l[a], l[b]); if (q > m) { m = q; k = i; } } return m > tol ? [...dp(a, k), ...dp(k, b)] : [l[a]]; };
  return [...dp(0, longe), ...dp(longe, l.length - 1)];
}
const area = l => l.reduce((s, p, i) => { const q = l[(i + 1) % l.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const dentro = (p, l) => { let r = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) if ((l[i][1] > p[1]) !== (l[j][1] > p[1]) && p[0] < (l[j][0] - l[i][0]) * (p[1] - l[i][1]) / (l[j][1] - l[i][1]) + l[i][0]) r = !r; return r; };
// desenho(ctx, w, h) vira um objeto 3D de altura `alt`, com bordas chanfradas. frente e lado são materiais
export function relevo(w, h, desenho, { alt = 1, prof = .2, chanfro = .03, frente, lado, tol = .28 }) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = x.strokeStyle = '#fff'; desenho(x, w, h);
  const e = alt / h;
  const L = contornos(x, w, h).map(l => simplifica(l, tol)).filter(l => l.length > 3).map(l => l.map(p => [(p[0] - w / 2) * e, (h / 2 - p[1]) * e])).sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
  const formas = [];
  L.forEach((l, i) => {
    const pais = L.filter((o, j) => j < i && dentro(l[0], o)), v = l.map(p => new THREE.Vector2(p[0], p[1]));
    if (pais.length % 2 === 0) { const s = new THREE.Shape(v); s.contorno = l; formas.push(s); }
    else { const pai = pais[pais.length - 1], s = formas.find(f => f.contorno === pai); if (s) s.holes.push(new THREE.Path(v)); }
  });
  const g0 = new THREE.ExtrudeGeometry(formas, { depth: prof, bevelEnabled: chanfro > 0, bevelSize: chanfro * .75, bevelThickness: chanfro, bevelSegments: 5, curveSegments: 4 });
  g0.translate(0, 0, -prof / 2);
  const g = alisar(g0);
  // frente com coordenadas 0..1 para receber degradê
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (w * e) + .5, p.getY(i) / alt + .5);
  return malha(g, [frente, lado || frente]);
}
export function letras(txt, o) {
  const tam = o.tam || 220, f = `${o.estilo || ''} ${o.peso || 900} ${tam}px ${o.fonte || '"Segoe UI Black","Segoe UI",system-ui'}`, t = document.createElement('canvas').getContext('2d');
  t.font = f; if (o.espaco) t.letterSpacing = o.espaco + 'px';
  const w = Math.ceil(t.measureText(txt).width + 90), h = Math.ceil(tam * 1.4);
  return relevo(w, h, x => { x.font = f; if (o.espaco) x.letterSpacing = o.espaco + 'px'; x.textAlign = 'center'; x.textBaseline = 'middle'; if (o.engorda) { x.lineWidth = o.engorda; x.lineJoin = 'round'; x.strokeText(txt, w / 2, h / 2); } x.fillText(txt, w / 2, h / 2); }, { ...o, alt: (o.alt || 1) * 1.4 });
}
// naipes: 0 espadas, 1 copas, 2 ouros, 3 paus (centro em x, y; tamanho s)
export function naipe(c, n, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.beginPath();
  if (n === 1) { c.moveTo(0, 46); c.bezierCurveTo(-14, 26, -46, 4, -46, -20); c.bezierCurveTo(-46, -40, -32, -47, -22, -47); c.bezierCurveTo(-10, -47, -3, -38, 0, -28); c.bezierCurveTo(3, -38, 10, -47, 22, -47); c.bezierCurveTo(32, -47, 46, -40, 46, -20); c.bezierCurveTo(46, 4, 14, 26, 0, 46); }
  else if (n === 2) { c.moveTo(0, -50); c.quadraticCurveTo(14, -22, 36, 0); c.quadraticCurveTo(14, 22, 0, 50); c.quadraticCurveTo(-14, 22, -36, 0); c.quadraticCurveTo(-14, -22, 0, -50); }
  else if (n === 0) { c.moveTo(0, -50); c.bezierCurveTo(12, -28, 44, -8, 44, 15); c.bezierCurveTo(44, 32, 32, 37, 24, 37); c.bezierCurveTo(14, 37, 7, 32, 4, 25); c.bezierCurveTo(5, 37, 9, 45, 18, 50); c.lineTo(-18, 50); c.bezierCurveTo(-9, 45, -5, 37, -4, 25); c.bezierCurveTo(-7, 32, -14, 37, -24, 37); c.bezierCurveTo(-32, 37, -44, 32, -44, 15); c.bezierCurveTo(-44, -8, -12, -28, 0, -50); }
  else { c.arc(0, -26, 22, 0, 7); c.closePath(); c.moveTo(-2, 11); c.arc(-24, 11, 22, 0, 7); c.moveTo(46, 11); c.arc(24, 11, 22, 0, 7); c.moveTo(-9, -12); c.lineTo(9, -12); c.lineTo(12, 14); c.bezierCurveTo(6, 30, 9, 44, 18, 50); c.lineTo(-18, 50); c.bezierCurveTo(-9, 44, -6, 30, -12, 14); }
  c.closePath(); c.fill(); c.restore();
}
export const naipe3d = (n, o) => relevo(420, 420, (c, w, h) => naipe(c, n, w / 2, h / 2, 360), { tol: .2, ...o });

// ---------- Cartas ----------
const PRETO = '#14172a', VERM = '#d0142e';
function figura(c, v, n, cor) {
  const g = c.createLinearGradient(136, 108, 364, 350); g.addColorStop(0, cor === VERM ? '#ffe3df' : '#e3e8fb'); g.addColorStop(1, '#fff6df'); c.fillStyle = g; c.fillRect(136, 108, 228, 242);
  c.fillStyle = cor === VERM ? '#b8102a' : '#1f3494'; c.beginPath(); c.moveTo(136, 350); c.lineTo(164, 272); c.lineTo(250, 300); c.lineTo(336, 272); c.lineTo(364, 350); c.fill();
  c.fillStyle = '#e8b53d'; c.beginPath(); c.moveTo(226, 350); c.lineTo(238, 286); c.lineTo(262, 286); c.lineTo(274, 350); c.fill();
  c.fillStyle = '#f2c9a4'; c.beginPath(); c.ellipse(250, 232, 44, 56, 0, 0, 7); c.fill();
  c.fillStyle = v === 'K' ? '#5d3a1c' : v === 'Q' ? '#8a4a1a' : '#c98a2c';
  if (v === 'K') { c.beginPath(); c.moveTo(206, 232); c.quadraticCurveTo(212, 312, 250, 316); c.quadraticCurveTo(288, 312, 294, 232); c.quadraticCurveTo(280, 262, 250, 258); c.quadraticCurveTo(220, 262, 206, 232); c.fill(); }
  else { for (const s of [-1, 1]) { c.beginPath(); c.ellipse(250 + s * 46, 236, v === 'Q' ? 22 : 14, v === 'Q' ? 66 : 44, s * -.1, 0, 7); c.fill(); } c.beginPath(); c.ellipse(250, 190, 48, 22, 0, 0, 7); c.fill(); }
  c.fillStyle = '#1a1a26'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(250 + s * 17, 222, 5, 6, 0, 0, 7); c.fill(); }
  c.fillStyle = '#b03a3a'; c.fillRect(238, 262, 24, 5);
  c.fillStyle = '#e8b53d'; c.beginPath();
  if (v === 'J') { c.moveTo(200, 186); c.quadraticCurveTo(250, 130, 304, 168); c.lineTo(298, 192); c.quadraticCurveTo(250, 176, 202, 198); }
  else { c.moveTo(202, 188); c.lineTo(194, 132); c.lineTo(224, 160); c.lineTo(250, 122); c.lineTo(276, 160); c.lineTo(306, 132); c.lineTo(298, 188); }
  c.closePath(); c.fill();
  c.fillStyle = cor; for (const x of [222, 250, 278]) { c.beginPath(); c.arc(x, 178, 6, 0, 7); c.fill(); }
  naipe(c, n, 168, 146, 46);
}
const PONTOS = { 2: [[.5, .24], [.5, .76]], 3: [[.5, .22], [.5, .5], [.5, .78]], 4: [[.34, .24], [.66, .24], [.34, .76], [.66, .76]], 5: [[.34, .24], [.66, .24], [.5, .5], [.34, .76], [.66, .76]], 6: [[.34, .22], [.66, .22], [.34, .5], [.66, .5], [.34, .78], [.66, .78]], 7: [[.34, .22], [.66, .22], [.5, .36], [.34, .5], [.66, .5], [.34, .78], [.66, .78]], 8: [[.34, .2], [.66, .2], [.34, .4], [.66, .4], [.34, .6], [.66, .6], [.34, .8], [.66, .8]], 9: [[.34, .18], [.66, .18], [.34, .39], [.66, .39], [.5, .5], [.34, .61], [.66, .61], [.34, .82], [.66, .82]], 10: [[.34, .18], [.66, .18], [.5, .28], [.34, .39], [.66, .39], [.34, .61], [.66, .61], [.5, .72], [.34, .82], [.66, .82]] };
export function cartaTex(v, n) {
  return tela(500, 700, (c, w, h) => {
    const q = c.createLinearGradient(0, 0, w, h); q.addColorStop(0, '#ffffff'); q.addColorStop(1, '#f1efe8');
    c.fillStyle = q; c.beginPath(); c.roundRect(0, 0, w, h, 42); c.fill();
    const cor = n === 1 || n === 2 ? VERM : PRETO, vira = f => { for (const k of [0, 1]) { c.save(); if (k) { c.translate(w, h); c.rotate(Math.PI); } f(); c.restore(); } };
    c.fillStyle = cor; c.textAlign = 'center'; c.textBaseline = 'middle';
    vira(() => { c.font = `700 ${v === '10' ? 92 : 112}px Georgia,serif`; c.fillText(v, v === '10' ? 72 : 68, 78); naipe(c, n, 66, 178, 72); });
    if (v === 'A') naipe(c, n, w / 2, h / 2, 300);
    else if ('JQK'.includes(v)) {
      c.strokeStyle = '#c9962f'; c.lineWidth = 7; c.strokeRect(124, 96, w - 248, h - 192); c.lineWidth = 2; c.strokeRect(134, 106, w - 268, h - 212);
      c.save(); c.beginPath(); c.rect(136, 108, w - 272, h - 216); c.clip(); vira(() => figura(c, v, n, cor)); c.restore();
    } else for (const [x, y] of PONTOS[v]) { c.save(); c.translate(x * w, y * h); if (y > .5) c.rotate(Math.PI); naipe(c, n, 0, 0, 94); c.restore(); }
  });
}
let versoT;
function verso() {
  return versoT ||= tela(500, 700, (c, w, h) => {
    c.fillStyle = '#fbfaf6'; c.beginPath(); c.roundRect(0, 0, w, h, 42); c.fill();
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3447d8'); g.addColorStop(1, '#6a1fb0'); c.fillStyle = g; c.beginPath(); c.roundRect(28, 28, w - 56, h - 56, 26); c.fill(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 4;
    for (let i = -20; i < 40; i++) { c.beginPath(); c.moveTo(i * 44, 0); c.lineTo(i * 44 + h, h); c.stroke(); c.beginPath(); c.moveTo(i * 44, 0); c.lineTo(i * 44 - h, h); c.stroke(); }
    c.fillStyle = '#ffd467'; for (let i = 0; i < 4; i++) naipe(c, i, w / 2 + (i % 2 ? 60 : -60), h / 2 + (i < 2 ? -60 : 60), 80);
  });
}
// carta: largura 1, altura 1,4; curva = quanto ela se dobra
export function carta(v, n, curva = 0) {
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(1, 1.4, 24, 24), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -(x * x * .6 + y * y * .4) * curva); }
  geo.computeVertexNormals();
  const borda = tela(500, 700, (c, w, h) => { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(0, 0, w, h, 42); c.fill(); });
  const f = malha(geo, mat({ map: cartaTex(v, n), alphaTest: .5, roughness: .38, clearcoat: .5, clearcoatRoughness: .18, side: THREE.FrontSide, shadowSide: THREE.DoubleSide }));
  const meio = malha(geo, mat({ color: 0xe9e4d6, map: borda, alphaTest: .5, side: THREE.DoubleSide })); meio.position.z = -.006;
  const b = malha(geo, mat({ map: verso(), alphaTest: .5, roughness: .4, clearcoat: .5, clearcoatRoughness: .18, side: THREE.BackSide })); b.position.z = -.012; b.castShadow = false;
  g.add(f, meio, b); return g;
}

// ---------- Cenário ----------
export function estudio(cores = [[0xffffff, 9, -5, 5, 3, 4, 4], [0xffffff, 5, 6, 2, 2, 2, 5], [0xffffff, 3, 0, 8, -2, 6, 3], [0xffffff, .4, 0, 1, 9, 12, 6]], ambiente = 0x30343f) {
  const s = new THREE.Scene(); s.background = new THREE.Color(ambiente);
  for (const [cor, k, x, y, z, w, h] of cores) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); }
  return s;
}
// fundo infinito curvo, com um clarão colorido (meio) sobre a cor de base (borda)
export function infinito(cena, meio, borda, { y = 0, z = -4, raio = 3, cx = .5, cy = .5, r = .5, rough = .55 } = {}) {
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push([14 - i * (14 - (z + raio)) / 12, y]);
  for (let i = 1; i <= 24; i++) { const a = i / 24 * Math.PI / 2; pts.push([z + raio - Math.sin(a) * raio, y + raio - Math.cos(a) * raio]); }
  for (let i = 1; i <= 10; i++) pts.push([z, y + raio + i * 1.6]);
  const g = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], n = pts.length;
  pts.forEach(([zz, yy], i) => { for (const s of [-1, 1]) { pos.push(s * 16, yy, zz); uv.push(s < 0 ? 0 : 1, i / (n - 1)); } });
  for (let i = 0; i < n - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const t = tela(512, 512, (c, w, h) => { c.fillStyle = borda; c.fillRect(0, 0, w, h); const q = c.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, w * r); q.addColorStop(0, meio); q.addColorStop(1, borda); c.fillStyle = q; c.fillRect(0, 0, w, h); });
  const m = malha(g, mat({ map: t, roughness: rough, envMapIntensity: .4, side: THREE.DoubleSide })); m.castShadow = false; cena.add(m); return m;
}

// ---------- Câmera: soma muitas fotos com luz, lente e foco levemente deslocados ----------
let rend;
const VERT = 'varying vec2 u; void main(){ u = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const halt = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
export function fotografar(cena, cam, o, W, H, rapido) {
  rend ||= (() => { const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; return r; })();
  rend.setPixelRatio(1); rend.setSize(W, H, false); rend.toneMapping = THREE.NoToneMapping; rend.outputColorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(rend);
  cena.environment = pm.fromScene(o.estudio || estudio(), 0, .1, 100).texture; cena.environmentIntensity = o.ambiente ?? 1;
  // luzes
  const raioCena = o.raio || 4, alvo = o.alvo || V(0, 0, 0);
  const faz = () => {
    const l = new THREE.DirectionalLight(0xffffff, 1); l.castShadow = true; l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera; c.left = c.bottom = -raioCena; c.right = c.top = raioCena; c.near = .1; c.far = raioCena * 8;
    l.shadow.bias = -.0004; l.shadow.normalBias = raioCena * .0035; l.target.position.copy(alvo); cena.add(l, l.target); return l;
  };
  const chaves = (o.chaves || [{ cor: 0xfff2e0, k: 2.6, pos: [-3, 5, 4], suave: .3 }]).map(c => { const l = faz(); l.color.set(c.cor); l.intensity = c.k; l.userData = c; return l; });
  const domo = faz(), D = { ceu: 0xbfd0ff, chao: 0x403850, k: 1.1, ...(o.domo || {}) }, cCeu = new THREE.Color(D.ceu), cChao = new THREE.Color(D.chao);
  cena.updateMatrixWorld(true);
  // reflexo do que está em volta, para bolas cromadas e visores
  for (const r of o.espelhos || []) {
    const esc = r.escondidos || [r.malha]; esc.forEach(m => m.visible = false);
    const rt = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter }), cc = new THREE.CubeCamera(r.perto || .05, 4000, rt);
    r.malha.getWorldPosition(cc.position); cena.add(cc);
    const bg = cena.background; if (r.fundo) cena.background = r.fundo;
    domo.position.copy(alvo).add(V(1, 3, 2).multiplyScalar(raioCena)); domo.intensity = D.k * .8; domo.color.copy(cCeu);
    chaves.forEach(l => l.position.copy(alvo).add(V(...l.userData.pos).normalize().multiplyScalar(raioCena * 3)));
    // os painéis de luz do estúdio também aparecem no reflexo
    const paineis = new THREE.Group(); if (o.estudio) { paineis.add(...o.estudio.children.filter(m => m.position.z < 8).map(m => m.clone())); paineis.scale.setScalar(r.estudio || 1); cena.add(paineis); paineis.updateMatrixWorld(true); }
    cc.update(rend, cena); cena.remove(paineis); cena.background = bg; cena.remove(cc); esc.forEach(m => m.visible = true);
    const env = pm.fromCubemap(rt.texture).texture;
    [].concat(r.materiais || r.malha.material).forEach(m => { m.envMap = env; m.envMapIntensity = r.k || 1; m.needsUpdate = true; });
  }
  const N = rapido ? 40 : o.amostras || 240;
  const op = { depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }, f32 = () => new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, ...op });
  const foto = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, ...op, depthBuffer: true }); let A = f32(), B = f32();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { a: { value: null }, b: { value: null } }, vertexShader: VERT, fragmentShader: 'uniform sampler2D a, b; varying vec2 u; void main(){ vec3 n = texture2D(b, u).rgb; if (any(isnan(n))) n = vec3(0.); gl_FragColor = vec4(texture2D(a, u).rgb + min(n, vec3(24.)), 1.); }', depthTest: false, depthWrite: false })); quad.frustumCulled = false;
  const cq = new THREE.Scene(); cq.add(quad); const oc = new THREE.OrthographicCamera();
  const p0 = cam.position.clone(), q0 = cam.quaternion.clone(), dx = V(1, 0, 0).applyQuaternion(q0), dy = V(0, 1, 0).applyQuaternion(q0), foco = o.foco || p0.distanceTo(alvo);
  rend.setRenderTarget(A); rend.setClearColor(0, 1); rend.clear();
  for (let i = 1; i <= N; i++) {
    for (const l of chaves) {
      const c = l.userData, p = V(...c.pos).normalize(), t1 = V(0, 1, .01).cross(p).normalize(), t2 = p.clone().cross(t1), r = Math.sqrt(halt(i, 2)) * (c.suave ?? .3), a = halt(i, 3) * Math.PI * 2;
      l.position.copy(p).addScaledVector(t1, Math.cos(a) * r).addScaledVector(t2, Math.sin(a) * r).normalize().multiplyScalar(raioCena * 4).add(alvo);
    }
    { const y = 1 - halt(i, 5) * 1.35, q = Math.sqrt(Math.max(0, 1 - y * y)), a = halt(i, 7) * Math.PI * 2; domo.position.set(Math.cos(a) * q, y, Math.sin(a) * q).multiplyScalar(raioCena * 4).add(alvo); domo.color.copy(cChao).lerp(cCeu, Math.max(0, Math.min(1, y * .7 + .4))); domo.intensity = D.k * 1.6; }
    const r = Math.sqrt(halt(i, 11)) * (o.abertura || 0), a = halt(i, 13) * Math.PI * 2, sx = Math.cos(a) * r, sy = Math.sin(a) * r;
    cam.position.copy(p0).addScaledVector(dx, sx).addScaledVector(dy, sy); cam.quaternion.copy(q0);
    cam.setViewOffset(W, H, halt(i, 17) - .5, halt(i, 19) - .5, W, H);
    // desloca o enquadramento para o plano de foco ficar parado (lente de verdade, sem girar a câmera)
    { const h = 2 * foco * Math.tan(cam.fov * Math.PI / 360), w = h * cam.aspect; cam.projectionMatrix.elements[8] -= 2 * sx / w; cam.projectionMatrix.elements[9] -= 2 * sy / h; cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert(); }
    // lupa de verdade: fotografa o que está atrás da lente e mostra ampliado dentro dela
    if (o.lupa) {
      const L = o.lupa, u = L.malha.material.uniforms; L.rt ||= new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }); L.esconder.forEach(m => m.visible = false);
      rend.setRenderTarget(L.rt); rend.setClearColor(0, 1); rend.clear(); rend.render(cena, cam); L.esconder.forEach(m => m.visible = true);
      const p = L.malha.getWorldPosition(V()).project(cam); u.t.value = L.rt.texture; u.c.value.set(p.x * .5 + .5, p.y * .5 + .5); u.tam.value.set(W, H);
    }
    rend.setRenderTarget(foto); rend.setClearColor(o.ceu ?? 0x000000, 1); rend.clear(); rend.render(cena, cam);
    quad.material.uniforms.a.value = A.texture; quad.material.uniforms.b.value = foto.texture; rend.setRenderTarget(B); rend.render(cq, oc); [A, B] = [B, A];
  }
  cam.position.copy(p0); cam.clearViewOffset();
  // revelação
  const comp = new EffectComposer(rend, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType })); comp.setPixelRatio(1); comp.setSize(W, H);
  const rev = new ShaderPass(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, k: { value: (o.exposicao || 1.2) / N } }, vertexShader: VERT, fragmentShader: 'uniform sampler2D t; uniform float k; varying vec2 u; void main(){ gl_FragColor = vec4(texture2D(t, u).rgb * k, 1.); }' }));
  rev.uniforms.t.value = A.texture; comp.addPass(rev);
  const b = { f: .25, r: .5, l: 1, ...(o.bloom || {}) }; comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), b.f, b.r, b.l));
  comp.addPass(new OutputPass()); rend.setRenderTarget(null); rend.toneMapping = o.tom || THREE.ACESFilmicToneMapping; rend.toneMappingExposure = 1;
  comp.render();
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.filter = `saturate(${o.saturacao || 1.14}) contrast(${o.contraste || 1.1})`; x.drawImage(rend.domElement, 0, 0); x.filter = 'none';
  const vg = x.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .45, W / 2, H / 2, Math.hypot(W, H) * .56); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${o.vinheta ?? .38})`); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  cena.traverse(m => { if (m.geometry) m.geometry.dispose(); }); foto.dispose(); A.dispose(); B.dispose(); comp.dispose(); pm.dispose();
  return c.toDataURL('image/webp', .86);
}
export const camera = (W, H, fov, pos, olhar) => { const c = new THREE.PerspectiveCamera(fov, W / H, .05, 4000); c.position.set(...pos); c.lookAt(...olhar); c.updateMatrixWorld(); return c; };

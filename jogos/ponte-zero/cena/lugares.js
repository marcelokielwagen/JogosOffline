// Os lugares de cada fase: cada função monta um trecho de 120 m (z de 0 a -120) que se repete enquanto o pelotão avança.
// M = peças por material: conc, aco (cores do clima), lata e vidro (cor própria), cid (prédio com janelas).
// Devolve o que o lugar precisa: chão dos lados, água, lava, cidade ao fundo, chamas e peças que caem do céu.
import * as THREE from 'three';
import { carro, onibus, v } from './ponte.js';

export const LARG = 7.6;
const C = c => new THREE.Color(c), CARROS = ['#d63a2c', '#2d7bd0', '#f2b51d', '#3fa34d', '#f5efe0', '#e8662a', '#7a4fc0'];
const cone = (M, x, y, z, r, h, cor, n = 7) => { const g = new THREE.ConeGeometry(r, h, n); g.translate(x, y + h / 2, z); M.juntar(g, .4, C(cor)); };
const cil = (M, x, y, z, r, h, cor, { r2 = r, n = 9, rx = 0, rz = 0 } = {}) => { const g = new THREE.CylinderGeometry(r2, r, h, n); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(x, y, z); M.juntar(g, .4, C(cor)); };
const bola = (M, x, y, z, r, cor, sx = 1, sy = 1, sz = 1, n = 8) => { const g = new THREE.SphereGeometry(r, n, Math.max(4, n - 3)); g.scale(sx, sy, sz); g.translate(x, y, z); M.juntar(g, .4, C(cor)); };
const pedra = (M, x, y, z, r, cor, rnd) => { const g = new THREE.DodecahedronGeometry(r, 0); g.scale(1, .6 + rnd() * .4, 1); g.rotateY(rnd() * 6); g.translate(x, y, z); M.juntar(g, .4, C(cor)); };
const cx = (M, x, y, z, w, h, d, cor, o = {}) => M.caixa(x, y, z, w, h, d, { cor: typeof cor === 'string' ? C(cor) : cor, ...o });
const lado = rnd => rnd() < .5 ? -1 : 1;
// prédio com janelas; ruína = topo quebrado em degraus e pedaços inclinados
function predio(M, x, z, w, h, d, cor, rnd, ruina = 0) {
  if (!ruina) { M.cid.caixa(x, h / 2 - .2, z, w, h, d, { cor, esc: 1 / 16 }); M.conc.caixa(x, h + .1, z, w + .5, .5, d + .5, { cor: .6 }); return; }
  const n = 4, pw = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const hh = Math.max(3, h * (1 - ruina * rnd())); M.cid.caixa(x - w / 2 + pw * (i + .5), hh / 2 - .2, z - d / 4 + j * d / 2, pw * 1.01, hh, d / 2, { cor: cor * (.8 + rnd() * .3), esc: 1 / 16, rz: rnd() < .2 ? (rnd() - .5) * .12 : 0 }); if (rnd() < .6) M.aco.barra(v(x - w / 2 + pw * (i + .5), hh - .4, z - d / 4 + j * d / 2), v(x - w / 2 + pw * (i + .5) + (rnd() - .5) * 2, hh + 2 + rnd() * 2, z - d / 4 + j * d / 2 + (rnd() - .5)), .1, 4, .4); }
}
// monte de entulho
function entulho(M, x, z, r, n, rnd) { for (let k = 0; k < n; k++) { const a = rnd() * 6.28, q = rnd() * r, t = .25 + rnd() * .8 * (1 - q / r); M.conc.caixa(x + Math.cos(a) * q, t * .3, z + Math.sin(a) * q, t * 1.4, t, t, { rx: rnd(), ry: rnd() * 3, rz: rnd(), cor: .5 + rnd() * .4 }); } }
const poste = (M, x, z, s, cor = .4) => { M.aco.barra(v(x, 0, z), v(x, 6.6, z), .09, 6, cor); M.aco.barra(v(x, 6.6, z), v(x - s * 1.9, 7.1, z), .06, 5, cor); cx(M.lata, x - s * 2, 7.05, z, .7, .12, .3, '#fff0b0'); };
const mureta = (M, s, rnd, cor = .9, falha = .06) => { for (let k = 0; k < 20; k++) if (rnd() > falha) M.conc.caixa(s * (LARG + .1), .42, -k * 6 - 3, .5, .86, 5.85, { cor: cor * (.85 + rnd() * .25), ry: rnd() < .14 ? (rnd() - .5) * .08 : 0 }); };
const carros = (M, lista, queima = 4) => lista.forEach(([x, z, r, t], i) => carro(M, x, z, r, C(CARROS[i % 7]), t, i % queima === 2));
const ACOST = [[6.45, -9, .06, 'sedan'], [-6.5, -30, 3.2, 'suv'], [6.4, -52, -.1, 'van'], [-6.45, -78, .22, 'sedan'], [6.5, -101, 3.1, 'suv']];
const pilha = (M, x, z, n, rnd, s) => { for (let k = 0; k < n; k++) { const ry = (rnd() - .5) * .25 + (s || 0), px = x + (rnd() - .5) * .3, cor = CARROS[Math.floor(rnd() * 7)]; cx(M.lata, px, .42 + k * 1.1, z, 1.9, .6, 4, cor, { ry }); cx(M.lata, px, .86 + k * 1.1, z, 1.6, .42, 2.1, cor, { ry }); cx(M.vidro, px, .84 + k * 1.1, z, 1.66, .26, 1.6, '#4a5a78', { ry }); cx(M.vidro, px, .3 + k * 1.1, z, 1.94, .26, 2.9, '#2a2430', { ry }); } };
const container = (M, x, y, z, cor, ry = 0) => { cx(M.lata, x, y + 1.3, z, 2.5, 2.6, 6.1, cor, { ry }); cx(M.lata, x, y + 2.6, z, 2.58, .1, 6.18, '#2c2a33', { ry }); for (const q of [-1.6, 1.6]) cx(M.lata, x, y + 1.3, z + q, 2.56, 2.5, .14, '#2c2a33', { ry }); };

// Canteiro: viaduto em obra, com andaimes, guindastes de torre, tubos e terra
function obra(M, rnd) {
  for (const s of [-1, 1]) {
    for (let k = 0; k < 24; k++) if (rnd() > .25) cx(M.lata, s * (LARG + .15), .55, -k * 5 - 2.5, .12, 1.05, 4.5, k % 2 ? '#ff7a1f' : '#fbf6ea');
    for (let k = 0; k < 5; k++) { // andaime
      const z = -10 - k * 23, x = s * (11 + rnd() * 2), h = 7 + Math.floor(rnd() * 3) * 2; for (const a of [-1.6, 1.6]) for (const b of [-2.2, 2.2]) M.aco.barra(v(x + a, 0, z + b), v(x + a, h, z + b), .08, 5, 1.1); for (let y = 2; y <= h; y += 2) { cx(M.lata, x, y, z, 3.4, .1, 4.6, '#c98a4a'); M.aco.barra(v(x - 1.6, y - 2, z - 2.2), v(x + 1.6, y, z - 2.2), .05, 4, .8); M.aco.barra(v(x - 1.6, y + .9, z + 2.2), v(x + 1.6, y + .9, z + 2.2), .05, 4, .8); }
      if (k % 2) M.conc.caixa(x + s * 4.2, 5, z, 5, 10, 9, { cor: .85 });
    }
    for (let k = 0; k < 4; k++) { const z = -20 - k * 28, x = s * (10.5 + rnd() * 2); if (k % 2) for (const [a, b] of [[0, .5], [.95, .5], [.48, 1.3]]) cil(M.lata, x + a, b, z, .5, 6, '#9aa5b5', { rx: Math.PI / 2, n: 10 }); else bola(M.lata, x, 0, z, 2.1, '#d8a860', 1.2, .8, 1, 9); }
  }
  // guindaste de torre
  for (const [x, z] of [[-24, -38], [27, -96]]) { const h = 30; for (const a of [-1, 1]) for (const b of [-1, 1]) M.lata.barra(v(x + a, 0, z + b), v(x + a, h, z + b), .16, 4, C('#ffc21f')); for (let y = 0; y < h; y += 3) { M.lata.barra(v(x - 1, y, z + 1), v(x + 1, y + 3, z + 1), .09, 4, C('#ffc21f')); M.lata.barra(v(x + 1, y, z - 1), v(x - 1, y + 3, z - 1), .09, 4, C('#ffc21f')); } const s = x > 0 ? -1 : 1; cx(M.lata, x + s * 9, h + .6, z, 30, 1, 1, '#ffc21f'); cx(M.lata, x - s * 7, h - .6, z, 3, 2, 2, '#6b6478'); cx(M.lata, x, h + 1, z + 1.6, 2, 2, 1.6, '#e0352b'); M.aco.barra(v(x + s * 18, h, z), v(x + s * 18, h - 11, z), .06, 4, .3); M.conc.caixa(x + s * 18, h - 12, z, 3, 1.4, 2); }
  carros(M, [[6.5, -12, .06, 'van'], [-6.5, -62, 3.2, 'van'], [6.45, -90, .1, 'suv']], 9);
  for (let k = 0; k < 14; k++) { const s = lado(rnd), z = -4 - k * 8.4, x = s * 5.9; cone(M.lata, x, 0, z, .24, .68, '#ff7a1f', 10); cil(M.lata, x, .36, z, .17, .14, '#fbf6ea', { r2: .135 }); }
  return { terra: .0, piso: 0, cidade: true };
}
// Sinal: avenida à noite, prédios colados, letreiros e semáforos
function avenida(M, rnd) {
  const NEON = ['#ff3d9a', '#2de0ff', '#ffe24a', '#8a5aff', '#4aff9a'];
  for (const s of [-1, 1]) {
    M.conc.caixa(s * 9.8, .08, -60, 4.4, .24, 120, { cor: .9 });
    for (let z = 0; z < 118;) { const w = 9 + rnd() * 6, dp = 10 + rnd() * 8, h = 13 + rnd() * 22; predio(M, s * (12.2 + w / 2), -z - dp / 2, w, h, dp - .6, .7 + rnd() * .4, rnd); const cor = NEON[Math.floor(rnd() * 5)], x = s * 12; if (rnd() < .8) { cx(M.vidro, x, 4.4 + rnd() * 2, -z - dp / 2, .25, 1.4 + rnd(), dp * .5, '#1a1230'); cx(M.vidro, x - s * .16, 4.6, -z - dp / 2, .1, .32, dp * .42, cor); } if (rnd() < .6) { cx(M.vidro, s * 11.3, 8.5, -z - dp * .3, 1.2, 4.4, .3, '#1a1230'); cx(M.vidro, s * 11.3, 8.5, -z - dp * .3 + .18, .85, 3.9, .06, cor); } cx(M.lata, s * 12, 3, -z - dp / 2, 1.4, .18, dp * .8, CARROS[Math.floor(rnd() * 7)], { rz: s * .12 }); z += dp; }
    for (let k = 0; k < 4; k++) poste(M, s * 8.1, -14 - k * 30, s);
  }
  for (const z of [-34, -94]) { M.aco.barra(v(8.3, 0, z), v(8.3, 6.4, z), .14, 6, .5); M.aco.barra(v(8.3, 6.2, z), v(-2, 6.2, z), .1, 5, .5); for (const x of [-1.6, 3]) { cx(M.vidro, x, 5.7, z + .1, .6, 1.5, .3, '#1d1822'); [['#ff3d2a', .48], ['#ffc62e', 0], ['#3fe06a', -.48]].forEach(([c, y]) => cx(M.vidro, x, 5.7 + y, z + .28, .36, .36, .06, c)); } for (let k = 0; k < 8; k++) cx(M.lata, -6.6 + k * 1.9, .012, z - 3, 1, .012, 3, '#e8e0f4'); }
  carros(M, ACOST); onibus(M, -6.7, -56, .035);
  for (let k = 0; k < 8; k++) { const s = lado(rnd), z = -8 - k * 14; cil(M.lata, s * 9.2, .55, z, .36, 1.1, '#3fa34d'); }
  return { piso: 0, cidade: false, terra: .0, perto: true };
}
// Desmanche: muros de carros amassados, cercas e guindaste com ímã
function patio(M, rnd) {
  for (const s of [-1, 1]) {
    for (let k = 0; k < 22; k++) { const z = -2.5 - k * 5.4; pilha(M, s * (10.2 + rnd() * .8), z, 1 + Math.floor(rnd() * 4), rnd, Math.PI / 2 * (k % 3 === 0)); if (k % 4 === 1) pilha(M, s * (13.6 + rnd()), z - 1, 4 + Math.floor(rnd() * 2), rnd); }
    for (let k = 0; k < 30; k++) M.aco.barra(v(s * 8.2, 0, -k * 4), v(s * 8.2, 2.1, -k * 4), .06, 4, .7); for (const y of [.5, 1.2, 2]) M.aco.caixa(s * 8.2, y, -60, .05, .05, 120, { cor: .8 });
    for (let k = 0; k < 9; k++) { const z = -6 - rnd() * 110, n = 2 + Math.floor(rnd() * 3); for (let j = 0; j < n; j++) { const g = new THREE.TorusGeometry(.42, .17, 5, 10); g.rotateX(Math.PI / 2); g.translate(s * (6.9 + rnd() * .3), .17 + j * .32, z); M.lata.juntar(g, .4, C('#2c2a33')); } }
  }
  for (const [x, z] of [[-19, -44], [20, -104]]) { const s = x > 0 ? -1 : 1; cx(M.lata, x, 2, z, 5, 4, 6, '#e0352b'); cil(M.lata, x, 4.4, z, 2, 1, '#3a3550'); M.lata.barra(v(x, 4, z), v(x + s * 9, 15, z - 3), .5, 5, C('#ffc21f')); M.aco.barra(v(x + s * 9, 15, z - 3), v(x + s * 9, 9, z - 3), .08, 4, .3); cil(M.lata, x + s * 9, 8.6, z - 3, 1.5, .6, '#3a3550', { n: 12 }); cx(M.lata, x + s * 9, 7.5, z - 3, 1.9, 1.2, 4, '#2d7bd0', { rz: .3 }); }
  for (const s of [-1, 1]) { M.aco.barra(v(s * 9.4, 0, -62), v(s * 9.4, 8.4, -62), .22, 6, .5); cx(M.lata, s * 11.6, 7.4, -62, 4.4, 1.9, .4, '#3a3550'); cx(M.lata, s * 11.6, 7.4, -61.75, 3.6, 1.1, .1, '#ffc21f'); }
  carros(M, ACOST, 2);
  return { piso: 2, terra: 1, cidade: true };
}
// Inverno: estrada de montanha, pinheiros com neve, paredões e um lago gelado
function neve(M, rnd) {
  const pinho = (x, z, h) => { cil(M.lata, x, h * .1, z, h * .045, h * .25, '#5a3a24', { n: 5 }); for (let k = 0; k < 3; k++) { const r = h * (.27 - k * .06), y = h * (.16 + k * .24); cone(M.lata, x, y, z, r, h * .36, '#1f7a5a', 7); cone(M.lata, x, y + h * .13, z, r * .68, h * .245, '#f4fbff', 7); } };
  for (const s of [-1, 1]) {
    for (let k = 0; k < 17; k++) bola(M.conc, s * (8.7 + rnd() * .9), .05, -k * 7.2 - rnd() * 3, 1.4 + rnd() * .7, '#ffffff', 1, .55, 2.1, 7); // barranco de neve
    for (let k = 0; k < 20; k++) M.lata.barra(v(s * 8.05, 0, -k * 6 - 1), v(s * 8.05, 1.5, -k * 6 - 1), .06, 5, C(k % 2 ? '#e0352b' : '#fbf6ea'));
    for (let k = 0; k < 20; k++) pinho(s * (11.5 + rnd() * 17), -rnd() * 120, 5 + rnd() * 6);
  }
  for (let k = 0; k < 8; k++) { const z = -8 - k * 15, r = 7 + rnd() * 6; pedra(M.conc, 32 + rnd() * 9, 1, z, r, '#7d94b8', rnd); pedra(M.conc, 33 + rnd() * 8, r * .6, z, r * .62, '#f4fbff', rnd); }
  for (let k = 0; k < 4; k++) { const z = -14 - k * 30; pedra(M.conc, -42 - rnd() * 9, 2, z, 9 + rnd() * 5, '#7d94b8', rnd); pedra(M.conc, -44, 10, z, 6, '#f4fbff', rnd); }
  // cabana, boneco de neve e carros soterrados
  cx(M.lata, 13.5, 1.6, -48, 5, 3.2, 5, '#a8683c'); { const g = new THREE.CylinderGeometry(.01, 4.2, 2.6, 4); g.rotateY(Math.PI / 4); g.translate(13.5, 4.4, -48); M.lata.juntar(g, .4, C('#f4fbff')); } cx(M.vidro, 10.96, 1.7, -48, .1, 1.1, 1.3, '#ffd26a');
  bola(M.lata, -10.4, .7, -84, 1, '#f4fbff'); bola(M.lata, -10.4, 2, -84, .72, '#f4fbff'); bola(M.lata, -10.4, 2.95, -84, .5, '#f4fbff'); cone(M.lata, -10.4, 2.8, -83.4, .1, .5, '#ff7a1f'); cil(M.lata, -10.4, 3.45, -84, .55, .1, '#2c2a33'); cil(M.lata, -10.4, 3.75, -84, .38, .55, '#e0352b');
  carros(M, [[6.5, -22, .2, 'suv'], [-6.5, -66, 3.0, 'sedan'], [6.5, -104, .1, 'van']], 9); for (const [x, z] of [[6.5, -22], [-6.5, -66], [6.5, -104]]) { bola(M.conc, x, 1.35, z + .2, 1, '#ffffff', .85, .28, 1.3, 7); bola(M.conc, x, .2, z - 2.2, 1.2, '#ffffff', 1.1, .5, .9, 7); }
  for (let k = 0; k < 3; k++) poste(M, (k % 2 ? 1 : -1) * 8.3, -20 - k * 40, k % 2 ? 1 : -1);
  return { piso: 1, terra: 2, cidade: false, cai: 'neve', perto: true };
}
// Maré: avenida à beira-mar, com coqueiros, píer e barcos
function orla(M, rnd) {
  const coqueiro = (x, z, h, t) => { M.lata.barra(v(x, 0, z), v(x + t, h, z), .2, 6, C('#a8784a')); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, g = new THREE.BoxGeometry(2.6, .07, .62); g.translate(1.3, 0, 0); g.rotateZ(-.45); g.rotateY(a); g.translate(x + t, h, z); M.lata.juntar(g, .4, C(k % 2 ? '#2fa84a' : '#57c43a')); } for (const a of [0, 2, 4]) bola(M.lata, x + t + Math.cos(a) * .3, h - .3, z + Math.sin(a) * .3, .22, '#8a5a30', 1, 1, 1, 6); };
  for (const s of [-1, 1]) {
    for (let k = 0; k < 20; k++) if (rnd() > .08) { M.conc.caixa(s * (LARG + .1), .3, -k * 6 - 3, .6, .62, 5.6); } M.conc.caixa(s * 8.9, -.12, -60, 2.2, .5, 120, { cor: .85 });
    for (let k = 0; k < 30; k++) pedra(M.conc, s * (10.4 + rnd() * 1.6), -.7, -k * 4 - rnd() * 3, .9 + rnd() * .8, '#8d84a0', rnd);
    for (let k = 0; k < 5; k++) coqueiro(s * (9.1 + rnd() * .4), -8 - k * 24 - rnd() * 8, 5.5 + rnd() * 2.4, s * (.4 + rnd()));
    for (let k = 0; k < 3; k++) { const x = s * (19 + rnd() * 14), z = -16 - k * 40, c = CARROS[Math.floor(rnd() * 7)]; cx(M.lata, x, -.6, z, 2.4, 1.2, 6, '#fbf6ea', { rz: rnd() * .3 - .15, ry: rnd() }); cx(M.lata, x, .3, z, 2.5, .35, 6.2, c, { ry: rnd() * .2 }); M.lata.barra(v(x, 0, z), v(x, 5.6, z), .1, 5, C('#8a5a30')); const g = new THREE.ConeGeometry(1.7, 4, 3); g.scale(1, 1, .1); g.translate(x + .9, 3.2, z); M.lata.juntar(g, .4, C(c)); }
  }
  for (let k = 0; k < 9; k++) { const x = 11 + k * 1.6; M.lata.barra(v(x, -3, -70), v(x, .6, -70), .16, 5, C('#7a5232')); M.lata.barra(v(x, -3, -73), v(x, .6, -73), .16, 5, C('#7a5232')); cx(M.lata, x, .6, -71.5, 1.5, .16, 3.4, '#c08a52'); }
  cx(M.lata, 21, 2, -71.5, 3.4, 2.6, 3.4, '#2d9bd0'); cone(M.lata, 21, 3.3, -71.5, 3, 1.6, '#e0352b', 4);
  carros(M, ACOST); for (let k = 0; k < 4; k++) poste(M, (k % 2 ? 1 : -1) * 8.2, -15 - k * 30, k % 2 ? 1 : -1, 1);
  return { piso: 0, cidade: true, mar: -1.5 };
}
// Porto: pátio de contêineres, guindastes de cais e um navio
function cais(M, rnd) {
  const COR = ['#d63a2c', '#2d7bd0', '#f2a51d', '#3fa34d', '#e8662a', '#7a4fc0', '#1fa8a0'];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 18; k++) { const z = -3.3 - k * 6.6, n = 1 + Math.floor(rnd() * 3); if (rnd() < .12) continue; for (let j = 0; j < n; j++) container(M, s * (10.4 + (j % 2) * .25), j * 2.62, z, COR[Math.floor(rnd() * 7)], (rnd() - .5) * .05); if (k % 2) { container(M, s * 14.2, 0, z, COR[Math.floor(rnd() * 7)]); container(M, s * 14.2, 2.62, z, COR[Math.floor(rnd() * 7)]); if (rnd() < .6) container(M, s * 14.2, 5.24, z, COR[Math.floor(rnd() * 7)]); } }
    for (let k = 0; k < 15; k++) cil(M.lata, s * 8.15, .4, -k * 8 - 4, .28, .8, k % 2 ? '#ffc21f' : '#2c2a33');
  }
  // pórtico que atravessa a pista
  for (const z of [-40]) { for (const s of [-1, 1]) for (const b of [-3, 3]) cx(M.lata, s * 17, 9, z + b, .9, 18, .9, '#1f9a8a'); for (const b of [-3, 3]) cx(M.lata, 0, 18, z + b, 46, 1.3, 1, '#1f9a8a'); for (let k = 0; k < 8; k++) M.lata.barra(v(-20 + k * 5, 18, z - 3), v(-17.5 + k * 5, 18, z + 3), .15, 4, C('#1f9a8a')); cx(M.lata, 4, 17.2, z, 3, 1.6, 4, '#ffc21f'); M.aco.barra(v(14, 17, z), v(14, 12.8, z), .08, 4, .3); container(M, 14, 10.2, z, '#d63a2c'); }
  // navio
  cx(M.lata, 40, 1, -70, 12, 9, 70, '#2c4a8a'); cx(M.lata, 40, -3, -70, 12.2, 2, 70.5, '#d63a2c'); for (let k = 0; k < 7; k++) for (let j = 0; j < 2; j++) container(M, 37 + j * 4, 5.5 + rnd() * .2, -46 - k * 7, COR[(k + j) % 7]); cx(M.lata, 40, 10, -100, 9, 9, 7, '#fbf6ea'); cil(M.lata, 40, 16, -100, 1.3, 4, '#d63a2c');
  carros(M, [[6.5, -14, .06, 'van'], [-6.5, -54, 3.2, 'van'], [6.5, -98, 0, 'suv']], 9);
  return { piso: 3, terra: 3, cidade: true, mar: -2.4, marLonge: true };
}
// Apocalipse: cidade em ruínas pegando fogo, prédios tombados, fendas no asfalto
function ruinas(M, rnd) {
  const fogos = [];
  for (const s of [-1, 1]) {
    M.conc.caixa(s * 9.6, .05, -60, 4, .24, 120, { cor: .55 });
    for (let z = 0; z < 118;) { const w = 10 + rnd() * 6, dp = 11 + rnd() * 8, h = 12 + rnd() * 24; predio(M, s * (12.4 + w / 2), -z - dp / 2, w, h, dp - 1, .55 + rnd() * .35, rnd, .35 + rnd() * .4); if (rnd() < .75) fogos.push([s * (12.2 + rnd() * 2), 1 + rnd() * h * .4, -z - dp / 2, 2.2 + rnd() * 2]); z += dp + rnd() * 3; }
    for (let k = 0; k < 7; k++) { const z = -6 - k * 16 - rnd() * 6; entulho(M, s * (9 + rnd()), z, 2.2, 9, rnd); if (k % 2) fogos.push([s * (8.6 + rnd()), .1, z - 2, 1.5 + rnd()]); }
    for (let k = 0; k < 3; k++) { const z = -18 - k * 38; M.aco.barra(v(s * 8.3, 0, z), v(s * (8.3 - 1.4 * k), 6.2, z - 1.5), .1, 6, .35); }
  }
  // prédio tombado por cima da rua (o pelotão passa embaixo)
  { const g = [[-15, 6, -46, 9, 15, 10, -.42], [17, 8, -100, 9, 18, 10, .36]]; for (const [x, y, z, w, h, d, r] of g) M.cid.caixa(x, y, z, w, h, d, { cor: .7, rz: r, esc: 1 / 16 }); }
  // placas tortas
  for (const [x, z, r] of [[-8.6, -92, -.3], [8.7, -30, .25]]) { M.aco.barra(v(x, 0, z), v(x + r * 3, 4.6, z), .1, 6, .4); cx(M.lata, x + r * 3, 4.4, z + .1, 2.6, 1.4, .1, '#1f8a5a', { rz: -r }); }
  carros(M, [[6.45, -9, .4, 'sedan'], [-6.4, -24, 2.7, 'suv'], [6.4, -58, -.5, 'van'], [-6.45, -74, .6, 'sedan'], [6.5, -104, 2.8, 'suv']], 2); for (const [x, z] of [[-6.4, -24], [6.4, -58], [6.45, -9]]) fogos.push([x, .7, z, 1.6]); onibus(M, -7.4, -108, .5); fogos.push([-7.4, 2.4, -108, 2.6]);
  for (let k = 0; k < 14; k++) fogos.push([(k % 2 ? 1 : -1) * (6.4 + rnd() * 2.2), 0, -4 - k * 8.4, 1 + rnd() * 1.3]);
  return { piso: 4, terra: 4, cidade: true, fogos, cai: 'cinza' };
}
// Siderúrgica: rios de lava dos dois lados, altos-fornos, canos e fogo por toda parte
function fundicao(M, rnd) {
  const fogos = [];
  for (const s of [-1, 1]) {
    M.aco.caixa(s * 8.2, .04, -60, 1.1, .3, 120, { cor: .8 }); for (let k = 0; k < 40; k++) M.lata.caixa(s * 8.5, .7, -k * 3, .1, 1.3, .1, { cor: C('#ffc21f') }); for (const y of [.7, 1.3]) M.lata.caixa(s * 8.5, y, -60, .08, .08, 120, { cor: C('#ffc21f') });
    for (let k = 0; k < 16; k++) pedra(M.conc, s * (9.6 + rnd()), -.7, -k * 7.5 - rnd() * 3, 1 + rnd(), '#5a3a48', rnd);
    for (let k = 0; k < 3; k++) { // alto-forno
      const z = -18 - k * 40, x = s * (27 + rnd() * 5); cil(M.lata, x, 8, z, 5.2, 18, '#5a4a6a', { r2: 3.4, n: 12 }); cil(M.lata, x, 18.5, z, 3.6, 3, '#3a3048', { n: 12 }); for (const y of [3, 8, 13]) cil(M.lata, x, y, z, 5.5 - y * .1, .6, '#c4502a', { n: 12 }); cx(M.vidro, x - s * 4.9, 1.6, z, 1.2, 2.6, 2.4, '#ffd24a'); fogos.push([x, 20, z, 5]); M.lata.barra(v(x, 14, z), v(x - s * 4, 20, z - 14), .7, 7, C('#7d8798')); cil(M.lata, x + s * 7, 12, z - 8, 1.1, 28, '#c4502a', { n: 9 }); cil(M.lata, x + s * 7, 25, z - 8, 1.2, 2, '#fbf6ea', { n: 9 }); fogos.push([x + s * 7, 26, z - 8, 3]);
    }
    for (let k = 0; k < 5; k++) fogos.push([s * (10.5 + rnd() * 9), -1, -10 - k * 24 - rnd() * 10, 2.2 + rnd() * 1.6]);
    M.lata.barra(v(s * 10.2, 5.4, 0), v(s * 10.2, 5.4, -120), .5, 8, C('#8d97a6')); M.lata.barra(v(s * 10.2, 6.8, 0), v(s * 10.2, 6.8, -120), .32, 7, C('#c4502a')); for (let k = 0; k < 8; k++) M.aco.barra(v(s * 10.2, -1.5, -k * 15 - 6), v(s * 10.2, 7, -k * 15 - 6), .2, 5, .7);
  }
  for (const z of [-30, -90]) for (const s of [-1, 1]) { M.aco.barra(v(s * 13, -1.5, z), v(s * 13, 12, z), .3, 6, .8); cx(M.lata, s * 17, 12, z, 10, .9, 1.2, '#e8962a'); M.aco.barra(v(s * 18, 12, z), v(s * 18, 8.4, z), .1, 4, .3); cil(M.lata, s * 18, 7, z, 1.6, 2.6, '#4a4058', { r2: 2.1, n: 10 }); cil(M.vidro, s * 18, 8.25, z, 1.9, .14, '#ffb52a', { n: 10 }); fogos.push([s * 18, 8.2, z, 1.8]); }
  for (let k = 0; k < 16; k++) fogos.push([(k % 2 ? 1 : -1) * (9.2 + rnd() * 1.4), -.9, -3 - k * 7.4, 1.2 + rnd() * 1.6]);
  carros(M, [[6.5, -44, .06, 'van'], [-6.5, -100, 3.2, 'van']], 9);
  return { piso: 3, lava: true, terra: -1, cidade: false, fogos, cai: 'brasa' };
}
export const LUGARES = { obra, avenida, patio, neve, orla, cais, ruinas, fundicao };

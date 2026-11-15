// Pinball Galáxia: mesa de pinball com física própria, desenhada no canvas.
// Medidas da mesa em "unidades" (400 x 740); a tela só aumenta ou diminui o desenho.
(() => {
'use strict';
const W = 400, H = 740, R = 8, G = 1150, PASSO = 1 / 600, VMAX = 3200;
const PL_BASE = 705, PL_CURSO = 32;
const tela = document.getElementById('tela'), ctx = tela.getContext('2d');
const mesa = document.getElementById('mesa');
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const aleat = (a, b) => a + Math.random() * (b - a);
const DPI = Math.PI * 2;
// Visão em 3D: a mesa é inclinada para trás (o alto fica mais longe), como quem olha a máquina de pé na frente dela.
// O ângulo se ajusta à tela: telas altas (celular em pé) inclinam menos para a mesa ficar maior.
const PERSP = 1300, ANG_MAX = 27 * Math.PI / 180, ANG_MIN = 16 * Math.PI / 180;
let ANG = ANG_MAX, SEN = Math.sin(ANG), COS = Math.cos(ANG);
// quanto esticar na vertical um objeto "em pé" (bola, nave) para ele parecer redondo depois da inclinação
const esticar = y => (PERSP + (H - y) * SEN) / (COS * PERSP);
const KZ = .8;   // altura no ar vira deslocamento para cima na mesa
const DZ = 4;    // altura das paredes desenhadas

// ================= Peças da mesa =================
const paredes = [];
function seg(ax, ay, bx, by, o) { const p = Object.assign({ ax, ay, bx, by, r: 3, e: .5, f: .015, tipo: 'trilho' }, o); paredes.push(p); return p; }
function linha(pts, o) { for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); }

const ARCO = [];
for (let i = 0; i <= 48; i++) { const t = Math.PI * (1 + i / 48); ARCO.push([200 + 180 * Math.cos(t), 175 + 155 * Math.sin(t)]); }
const CONTORNO = [[20, 770], ...ARCO, [380, 770]];
linha(CONTORNO, { e: .4 });
seg(350, 770, 350, 214);                                           // parede do corredor do lançador
seg(352, 213, 379, 187, { mao: [-.69, -.72], tipo: 'portao' });     // portinhola: a bola sobe, mas não volta
seg(22, 196, 60, 232, { mao: [.69, -.73], tipo: 'portao' });        // portinhola no alto da órbita
seg(62, 244, 62, 440);                                             // guia da órbita esquerda
linha([[46, 505], [46, 600], [114, 637]]);                          // guias de retorno (terminam sobre a base da palheta)
linha([[324, 505], [324, 600], [256, 637]]);

const ESTILINGUES = [
  { a: [72, 520], b: [72, 580], c: [104, 600], flash: 0, mola: -9, toque: -9 },
  { a: [298, 520], b: [298, 580], c: [266, 600], flash: 0, mola: -9, toque: -9 },
];
for (const s of ESTILINGUES) {
  seg(...s.a, ...s.b, { e: .6, tipo: 'borracha', est: s });
  seg(...s.b, ...s.c, { e: .6, tipo: 'borracha', est: s });
  seg(...s.a, ...s.c, { e: .6, tipo: 'molaBorracha', chute: 520, est: s });
}

const BLOCO = [[350, 298], [330, 315], [318, 405], [350, 420]];
linha(BLOCO, { tipo: 'bloco', e: .4 });
const ALVOS = [];
for (const [t0, t1] of [[.03, .31], [.36, .64], [.69, .97]]) {
  const x0 = 324, y0 = 318, x1 = 312, y1 = 402;
  ALVOS.push({ ax: x0 + (x1 - x0) * t0, ay: y0 + (y1 - y0) * t0, bx: x0 + (x1 - x0) * t1, by: y0 + (y1 - y0) * t1, de_pe: true, cai: 0 });
}

// ----- Andar de cima: a ESTAÇÃO ORBITAL (só as bolas com andar 1 batem nestas peças) -----
const DECK = [[280, 208], [264, 190], [264, 96], [274, 74], [296, 62], [320, 62], [340, 72], [348, 88], [348, 188], [338, 196]];
linha(DECK, { andar: 1, tipo: 'deck', e: .45 });
const ALVOS_DECK = [112, 136, 160].map(y => ({ ax: 267, ay: y, bx: 267, by: y + 16, aceso: false, flash: 0 }));
const KICKER = { x: 322, y: 86 };
// ----- Base Lunar: outro andar de cima, no alto à esquerda (perto do looping) -----
const LUA = [[168, 152], [124, 128], [124, 84], [134, 66], [160, 54], [200, 50], [226, 56], [238, 70], [238, 128], [224, 140]];
linha(LUA, { andar: 1, tipo: 'deck', e: .45 });
for (const x of [156, 180, 204, 228]) seg(x, 66, x, 84, { r: 3.5, andar: 1, tipo: 'luaposte' });   // 3 corredores no topo da Lua
const CRATERA = { x: 148, y: 114 };
// piso de proteção embaixo das palhetas pequenas: com a palheta levantada a bola cai no ralo, não para fora
seg(337, 209, 312, 223, { andar: 1, tipo: 'piso' });
seg(223, 153, 198, 167, { andar: 1, tipo: 'piso' });
const AREAS_ALTAS = [[258, 52, 354, 244], [118, 44, 244, 182]];   // onde existe chão no andar de cima

const COGUMELOS = [
  { x: 145, y: 215, r: 19, cor: ['#ffc2d1', '#e91e63', '#7a0f36'], flash: 0 },
  { x: 225, y: 205, r: 19, cor: ['#c4f1ff', '#039be5', '#014a72'], flash: 0 },
  { x: 306, y: 142, r: 11, cor: ['#fff0b8', '#fb8c00', '#7a3d00'], flash: 0, andar: 1 },
];
// O alienígena fica no meio dos cogumelos: cada batida tira vida; sem vida ele explode e volta mais forte
const ALIEN = { x: 185, y: 282, r: 18, vida: 8, max: 8, flash: 0, morto: false, renasce: 0, mortes: 0, t: 0, golpes: 0, segurando: null };
const GOLPES_AGARRA = 4;
const BURACO = { x: 288, y: 258 };
const CENTRO = { x: 185, y: 352 };   // estrela de luzes que conta os golpes no alien

// palhetas com "peso": aceleram até a velocidade máxima
const palhetas = [
  { px: 116, py: 646, len: 60, rb: 10, rt: 5.5, rep: .5, cima: -.45, ang: .5, oang: .5, w: 0, wReal: 0, apertada: false },
  { px: 254, py: 646, len: 60, rb: 10, rt: 5.5, rep: Math.PI - .5, cima: Math.PI + .45, ang: Math.PI - .5, oang: Math.PI - .5, w: 0, wReal: 0, apertada: false },
  // palheta pequena da estação (andar de cima), mexe junto com a direita
  { px: 332, py: 200, len: 28, rb: 6.5, rt: 4, rep: Math.PI - .42, cima: Math.PI + .45, ang: Math.PI - .42, oang: Math.PI - .42, w: 0, wReal: 0, apertada: false, andar: 1 },
  // palheta pequena da Base Lunar, mexe junto com a esquerda
  { px: 218, py: 144, len: 28, rb: 6.5, rt: 4, rep: Math.PI - .42, cima: Math.PI + .45, ang: Math.PI - .42, oang: Math.PI - .42, w: 0, wReal: 0, apertada: false, andar: 1 },
];

// ----- Trilhas elevadas (rampa de arame e cano de vidro com looping) -----
function catmull(P, n = 10) {
  const pts = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = q => .5 * (2 * p1[q] + (-p0[q] + p2[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t2 + (-p0[q] + 3 * p1[q] - 3 * p2[q] + p3[q]) * t3);
      pts.push([c(0), c(1)]);
    }
  }
  pts.push(P[P.length - 1]);
  return pts;
}
function montarTrilha(pts, alturas, extra) {
  const T = Object.assign({ pts: [], L: 0 }, extra);
  let d = 0;
  pts.forEach((p, i) => {
    if (i) d += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    T.pts.push({ x: p[0], y: p[1], d, dx: (b[0] - a[0]) / l, dy: (b[1] - a[1]) / l, h: 0 });
  });
  T.L = d;
  T.pts.forEach((p, i) => p.h = typeof alturas === 'function' ? alturas(p.d / d) : alturas[i]);
  return T;
}
function pontoTrilha(T, d) {
  const P = T.pts;
  let i = 1;
  while (i < P.length - 1 && P[i].d < d) i++;
  const a = P[i - 1], b = P[i], t = Math.max(0, Math.min(1, (d - a.d) / ((b.d - a.d) || 1)));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: a.dx + (b.dx - a.dx) * t, dy: a.dy + (b.dy - a.dy) * t, h: a.h + (b.h - a.h) * t, z: (a.z || 0) + ((b.z || 0) - (a.z || 0)) * t, zv: (a.zv || 0) + ((b.zv || 0) - (a.zv || 0)) * t };
}
// Rampa: entra à direita do centro e sobe até a estação orbital (andar de cima)
const RAMPA = montarTrilha(
  catmull([[262, 352], [262, 300], [261, 250], [258, 200], [256, 150], [256, 118], [262, 100], [274, 92], [286, 96]]),
  t => t < .6 ? t / .6 : 1 - .25 * (t - .6) / .4,
  { nome: 'rampa', vmin: 150, vmax: 360, andarFim: 1 });
RAMPA.pts.forEach(p => p.zv = p.h * 16);
// Descida: sai do ralo da estação e desce por cima da mesa até o corredor da direita
const DESCIDA = montarTrilha(
  catmull([[294, 224], [312, 258], [330, 312], [336, 390], [330, 450], [318, 495], [311, 524]]),
  t => -.45 * t, { nome: 'descida', vmin: 200, vmax: 560, andarIni: 1 });
DESCIDA.pts.forEach(p => p.zv = 12 * (1 - p.d / DESCIDA.L));
// Travessia: sai do buraco do hipersalto da estação e leva a bola por cima até a Base Lunar
const TRAVESSIA = montarTrilha(
  catmull([[322, 86], [312, 66], [290, 56], [262, 56], [246, 66], [234, 84], [222, 100]]),
  t => .12 * Math.sin(Math.PI * t), { nome: 'travessia', vmin: 100, vmax: 260, andarIni: 1, andarFim: 1 });
TRAVESSIA.pts.forEach(p => { const t = p.d / TRAVESSIA.L; p.zv = 6 + 12 * Math.sin(Math.PI * t); });
// Rampa lunar: sobe pelo corredor da esquerda e chega na Base Lunar
const RAMPA_LUA = montarTrilha(
  catmull([[41, 262], [40, 210], [43, 160], [54, 118], [76, 88], [104, 72], [128, 74], [146, 90]]),
  t => t < .55 ? t / .55 : 1 - .25 * (t - .55) / .45, { nome: 'lua', vmin: 120, vmax: 300, andarFim: 1 });
RAMPA_LUA.pts.forEach(p => p.zv = p.h * 16);
// Descida lunar: sai do ralo da Base Lunar e desce por cima, perto do looping, até a esquerda da mesa
const DESCIDA_LUA = montarTrilha(
  catmull([[183, 166], [172, 180], [152, 194], [130, 220], [118, 258], [115, 310], [116, 372]]),
  t => -.4 * t, { nome: 'descidaLua', vmin: 180, vmax: 480, andarIni: 1 });
DESCIDA_LUA.pts.forEach(p => p.zv = 14 * (1 - p.d / DESCIDA_LUA.L));
// Looping no alto da esquerda: entra à esquerda do centro, dá a volta EM PÉ (no ar) e solta a bola nos cogumelos.
// Cada ponto tem a posição no chão (gx, gy) e a altura (z); na tela ele aparece subido z*KZ.
const TUBO = (() => {
  const RL = 24, LAT = -18, Z0 = 10, CX = 106, CY = 176;
  const ida = catmull([[99, 345], [95, 292], [92, 240], [93, 204], [98, 186], [CX, CY]], 8);
  const volta = [];
  for (let a = 6; a <= 354; a += 6) { const r = a * Math.PI / 180; volta.push([CX + RL * Math.sin(r), CY + LAT * a / 360, Z0 + RL * (1 - Math.cos(r)), r]); }
  const saida = catmull([[CX, CY + LAT], [124, CY + LAT], [138, 162], [148, 170], [152, 178]], 8);
  const chao = [], zs = [], alt = [];
  ida.forEach((p, i) => { chao.push(p); zs.push(Z0 * i / (ida.length - 1)); alt.push(.7 * i / (ida.length - 1)); });
  volta.forEach(v => { chao.push([v[0], v[1]]); zs.push(v[2]); alt.push(.7 + .5 * (1 - Math.cos(v[3])) / 2); });
  saida.forEach((p, i) => { const f = i / (saida.length - 1); chao.push(p); zs.push(Z0 * (1 - f)); alt.push(.7 - .4 * f); });
  const T = montarTrilha(chao.map((p, i) => [p[0], p[1] - zs[i] * KZ]), alt, { nome: 'tubo', vmin: 200, vmax: 480 });
  T.pts.forEach((p, i) => { p.gx = chao[i][0]; p.gy = chao[i][1]; p.z = zs[i]; p.zv = zs[i]; });
  T.meio = ida.length + Math.floor(volta.length / 2);   // a parte depois daqui fica ATRÁS da primeira
  T.CX = CX; T.CY = CY;
  return T;
})();
const TRILHAS = { rampa: RAMPA, tubo: TUBO, descida: DESCIDA, travessia: TRAVESSIA, lua: RAMPA_LUA, descidaLua: DESCIDA_LUA };

const PLANETAS = [
  { nome: 'Lua', x: 110, y: 456, r: 10, cor: ['#ffffff', '#b8bcc6', '#555a66'] },
  { nome: 'Marte', x: 148, y: 438, r: 11, cor: ['#ffb08a', '#d84a22', '#5c1405'] },
  { nome: 'Júpiter', x: 185, y: 425, r: 14, cor: ['#ffe7c2', '#d9a066', '#6b3d14'] },
  { nome: 'Saturno', x: 222, y: 438, r: 11, cor: ['#fff6cf', '#e3c46d', '#6e5313'], anel: true },
  { nome: 'Netuno', x: 260, y: 456, r: 10, cor: ['#c9dcff', '#3f6cff', '#0d1f6b'] },
];
const MISSOES = [
  { ev: 'bancada', txt: 'derrube os alvos', meta: r => r },
  { ev: 'lua', txt: 'visite a base lunar', meta: r => r },
  { ev: 'alien', txt: 'acerte o alien', meta: r => 3 + 2 * r },
  { ev: 'rampa', txt: 'suba à estação', meta: r => r },
  { ev: 'tubo', txt: 'faça o looping', meta: r => r },
];

// Áreas que contam pontos quando a bola passa (não são sólidas)
const ZONAS = [
  ...[168, 192, 216].map((x, i) => ({ x0: x - 9, y0: 66, x1: x + 9, y1: 84, ev: 'trilha', i, andar: 1 })),
  { x0: 24, y0: 292, x1: 58, y1: 308, ev: 'orbita' },
  { x0: 24, y0: 560, x1: 42, y1: 590, ev: 'fora', lado: 'E', faixa: 0 },
  { x0: 50, y0: 560, x1: 68, y1: 590, ev: 'retorno', faixa: 1 },
  { x0: 302, y0: 560, x1: 320, y1: 590, ev: 'retorno', faixa: 2 },
  { x0: 328, y0: 560, x1: 346, y1: 590, ev: 'fora', lado: 'D', faixa: 3 },
  { x0: 353, y0: 150, x1: 380, y1: 185, ev: 'saiu', sobe: true },
  { x0: 80, y0: 330, x1: 118, y1: 352, ev: 'entrada', trilha: 'tubo', sobe: true },
  { x0: 248, y0: 342, x1: 276, y1: 362, ev: 'entrada', trilha: 'rampa', sobe: true },
  { x0: 270, y0: 212, x1: 318, y1: 242, ev: 'ralo', andar: 1, trilha: 'descida' },
  { x0: 164, y0: 152, x1: 200, y1: 180, ev: 'ralo', andar: 1, trilha: 'descidaLua' },
  { x0: 24, y0: 250, x1: 58, y1: 268, ev: 'entrada', trilha: 'lua', sobe: true },
];
const X_FAIXAS = [33, 59, 311, 337];

// ================= Opções e dados salvos =================
const dados = JO.carregar('pinball', { recordes: [], jogos: 0, melhor: 0, nome: '' });
const opc = Object.assign({ bolas: 3, dific: 'normal', musica: true, efeitos: 'completos' }, dados.opcoes);
dados.opcoes = opc;
const DIFIC = {
  facil: { escudo: 15, tilt: 4, catapulta: true },
  normal: { escudo: 8, tilt: 3, catapulta: false },
  dificil: { escudo: 3, tilt: 2, catapulta: false },
};
const efeitos = () => opc.efeitos === 'completos';
let regras = DIFIC[opc.dific], totalBolas = opc.bolas;

// ================= Estado =================
let bolas = [], B = null;
let plY = PL_BASE, puxar = 0, puxando = false;
let relogio = 0, pausado = false, tremor = 0, gi = 0, giCor = '255,210,120', show = 0, brilhoTrilha = { rampa: -9, tubo: -9, descida: -9, travessia: -9, lua: -9, descidaLua: -9 };
const spinner = { ang: 0, w: 0 };
let mensagem = '', msgAte = 0, msgIni = 0, msgAnim = 'zoom';
const agenda = [], particulas = [], popups = [];
const depois = (s, fn) => agenda.push({ t: relogio + s, fn });
const msg = (t, s = 2.4, anim = 'zoom') => { mensagem = t; msgAte = relogio + s; msgIni = relogio; msgAnim = anim; };
let j;

function novaBola(x, y) {
  return { x, y, ox: x, oy: y, vx: 0, vy: 0, presa: 0, andar: 0, destino: null, fora: false, trilha: null, naNave: false, ignora: 0, parado: 0, travar: false,
           zd: ZONAS.map(() => false), rastro: [] };
}

// ================= Sons (feitos pelo código) =================
const audio = (() => {
  let ac = null, mestre = null, gMus = null, buf = null;
  function pronto() {
    if (!JO.carregar('som', true)) return false;
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        mestre = ac.createGain(); mestre.gain.value = .55; mestre.connect(ac.destination);
        gMus = ac.createGain(); gMus.gain.value = .5; gMus.connect(mestre);
      }
      if (ac.state === 'suspended') ac.resume();
      return true;
    } catch (e) { return false; }
  }
  function tomEm(t, f, dur, tipo = 'square', vol = .12, f2 = 0, mus = false) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(mus ? gMus : mestre); o.start(t); o.stop(t + dur + .02);
  }
  function ruidoEm(t, dur, vol = .2, freq = 1500, filtro = 'lowpass', mus = false) {
    if (!buf) { buf = ac.createBuffer(1, ac.sampleRate * .8, ac.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; fl.type = filtro; fl.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(mus ? gMus : mestre); s.start(t); s.stop(t + dur + .02);
  }
  return { pronto, tomEm, ruidoEm, get ac() { return ac; } };
})();
const som = (() => {
  const tom = (f, dur, tipo, vol, f2 = 0, atraso = 0) => audio.tomEm(audio.ac.currentTime + atraso, f, dur, tipo, vol, f2);
  const ruido = (dur, vol, freq, atraso = 0, filtro = 'lowpass') => audio.ruidoEm(audio.ac.currentTime + atraso, dur, vol, freq, filtro);
  const arpejo = (notas, d, vol = .06, tipo = 'square') => notas.forEach((f, i) => tom(f, d * 1.3, tipo, vol, 0, i * d));
  const S = {
    palheta() { ruido(.05, .3, 900); tom(150, .05, 'triangle', .12, 60); },
    batida() { ruido(.06, .35, 2500); tom(220, .05, 'square', .07, 90); },
    cogumelo() { tom(440, .1, 'square', .08, 150); ruido(.05, .15, 3200); },
    estilingue() { tom(260, .06, 'square', .08, 120); ruido(.04, .18, 2600); },
    trilha() { tom(1320, .06, 'sine', .11); },
    alvo() { tom(880, .05, 'square', .07); tom(620, .07, 'square', .06, 0, .045); },
    bancada() { arpejo([523, 659, 784, 1047], .07); },
    orbita() { tom(280, .4, 'sawtooth', .05, 1400); },
    giro() { tom(1800, .02, 'square', .03); },
    rampa() { tom(200, .5, 'sawtooth', .04, 700); ruido(.5, .06, 1800, 0, 'bandpass'); },
    tubo() { tom(300, .9, 'sine', .07, 900); ruido(.9, .07, 1200, 0, 'bandpass'); },
    rampaOk() { arpejo([659, 784, 988, 1319], .06, .06); },
    looping() { arpejo([523, 784, 1047, 1568, 2093], .06, .07); },
    rampaFalha() { tom(500, .3, 'triangle', .07, 180); },
    buraco() { tom(720, .9, 'sine', .13, 50); ruido(.7, .08, 500); },
    ejetar() { ruido(.14, .3, 1300); tom(95, .12, 'square', .1, 45); },
    lancar() { ruido(.18, .25, 2200, 0, 'bandpass'); tom(120, .1, 'triangle', .08, 60); },
    catapulta() { ruido(.2, .35, 900); tom(80, .25, 'square', .12, 300); },
    nave() { tom(90, 1.2, 'sawtooth', .07, 420); ruido(2.8, .12, 700); tom(420, 1.6, 'sawtooth', .04, 300, 1.2); },
    pouso() { tom(300, .5, 'sawtooth', .05, 80); ruido(.4, .1, 500); },
    naveSolta() { arpejo([784, 1047, 1319, 1568], .07, .07); },
    faixa() { tom(1500, .05, 'sine', .08); },
    mola() { tom(70, .05, 'triangle', .06); },
    perdeu() { arpejo([392, 330, 262, 196], .16, .1, 'triangle'); },
    missao() { arpejo([523, 659, 784, 659, 784, 1047], .09); },
    extra() { arpejo([784, 988, 1175, 1568, 1175, 1568], .09, .07); },
    trava() { arpejo([330, 440, 330, 440], .1, .08, 'sawtooth'); },
    multibola() { for (let i = 0; i < 6; i++) { tom(500, .22, 'sawtooth', .07, 1000, i * .25); } },
    jackpot() { arpejo([523, 659, 784, 1047, 784, 1047, 1319, 1568], .08, .08); ruido(.8, .1, 4000, .5, 'highpass'); },
    tacada() { arpejo([1047, 1319, 1568, 2093], .05, .06); },
    tilt() { tom(70, .8, 'sawtooth', .16); },
    aviso() { tom(160, .15, 'square', .1); },
    salvo() { tom(600, .1, 'sine', .12); tom(900, .16, 'sine', .12, 0, .1); },
    contar() { tom(1050, .03, 'square', .04); },
    inicio() { arpejo([262, 330, 392, 523, 392, 523], .08); },
    retorno() { tom(980, .05, 'sine', .08); },
    alien() { tom(140, .28, 'sawtooth', .13, 55); tom(95, .3, 'square', .06, 40, .03); ruido(.3, .2, 700); },
    alienMorre() { tom(1100, .7, 'sawtooth', .1, 120); ruido(1, .35, 900); tom(70, .8, 'square', .16, 28, .15); arpejo([523, 659, 784, 1047, 1319], .08, .07); },
    alienVolta() { tom(60, 1.2, 'sawtooth', .12, 150); ruido(1, .12, 400); },
    descida() { ruido(.8, .06, 1600, 0, 'bandpass'); },
    travessia() { tom(400, 1.4, 'sine', .05, 200); ruido(1.4, .06, 1400, 0, 'bandpass'); },
  };
  return nome => { if (audio.pronto() && S[nome]) try { S[nome](); } catch (e) {} };
})();

// Música de fundo no estilo dos anos 90 (baixo, arpejo e bateria simples)
const musica = (() => {
  let ativo = false, prox = 0, n = 0, timer = null;
  const ACORDES = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]; // Lá menor, Fá, Sol, Mi menor
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function agendar() {
    const ac = audio.ac; if (!ac) return;
    const d16 = 60 / (j && j.multibola ? 146 : 124) / 4;
    if (prox < ac.currentTime) prox = ac.currentTime + .02;
    while (prox < ac.currentTime + .15) {
      const p = n % 16, a = ACORDES[Math.floor(n / 16) % 4];
      try {
        if ([0, 3, 6, 8, 11, 14].includes(p)) audio.tomEm(prox, hz(a[0] - 24), d16 * 1.8, 'triangle', .1, 0, true);
        if (p % 2 === 0) audio.tomEm(prox, hz(a[(p / 2) % 3] + 12), d16 * .9, 'square', .02, 0, true);
        if (p === 0 || p === 8) audio.tomEm(prox, 140, .12, 'sine', .14, 40, true);
        if (p === 4 || p === 12) audio.ruidoEm(prox, .08, .07, 1800, 'bandpass', true);
        if (p % 2 === 1) audio.ruidoEm(prox, .03, .03, 7000, 'highpass', true);
      } catch (e) {}
      prox += d16; n++;
    }
  }
  return {
    ligar(sim) {
      if (sim === ativo) return;
      ativo = sim;
      if (sim) { prox = audio.ac.currentTime + .05; timer = setInterval(agendar, 30); }
      else { clearInterval(timer); timer = null; }
    },
  };
})();

// ================= Efeitos visuais =================
function faiscas(x, y, n, cor, forca = 1, nx = 0, ny = 0) {
  if (!efeitos()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * DPI, v = aleat(60, 260) * forca;
    particulas.push({ x, y, vx: Math.cos(a) * v + nx * 150 * forca, vy: Math.sin(a) * v + ny * 150 * forca, vida: aleat(.25, .6), max: .6, cor, tam: aleat(.8, 2) });
  }
  if (particulas.length > 260) particulas.splice(0, particulas.length - 260);
}
function popup(x, y, txt, cor = '#ffe27a') { if (efeitos()) popups.push({ x, y, txt, cor, t: 0 }); }
function clarao(forca, cor = '255,210,120') { if (efeitos()) { gi = Math.max(gi, forca); giCor = cor; } }

// ================= Partida =================
function novoJogo() {
  agenda.length = 0; particulas.length = 0; popups.length = 0;
  regras = DIFIC[opc.dific]; totalBolas = opc.bolas;
  j = { pontos: 0, bola: 1, extras: 0, mult: 1, trilhas: [false, false, false], faixas: [false, false, false, false], missao: 0, prog: 0, rodada: 1,
        planetas: 0, bonus: 0, salvaAte: 0, tilt: 0, tiltado: false, estado: 'pronto', extraPontos: false,
        trava: false, travadas: 0, multibola: false, jackpot: false, catapulta: true, skill: 0, skillAte: 0,
        letras: [false, false, false, false, false], extraAcesa: false, hiper: false, cratera: false };
  Object.assign(ALIEN, { vida: 8, max: 8, flash: 0, morto: false, renasce: 0, mortes: 0, golpes: 0, segurando: null });
  ALVOS_DECK.forEach(a => a.aceso = false);
  ALVOS.forEach(a => a.de_pe = true);
  prepararBola();
  som('inicio');
  msg('BOA SORTE!', 2);
}
function colocarNoLancador(auto) {
  const b = novaBola(365, plY - R);
  bolas.push(b);
  if (auto) depois(.9, () => lancarAuto(b));
  return b;
}
function lancarAuto(b) {
  if (!bolas.includes(b) || b.x < 351 || b.y < 600) return;
  b.vy = -aleat(1650, 1850); som('lancar');
}
function prepararBola() {
  bolas = [];
  colocarNoLancador(false);
  Object.assign(j, { estado: 'pronto', extraNaBola: false, mult: 1, bonus: 0, tilt: 0, tiltado: false, salvaAte: 0, multibola: false, jackpot: false, skillAte: 0 });
  if (regras.catapulta) j.catapulta = true;
}
function pontuar(n, x, y) {
  if (j.tiltado || j.estado === 'fim') return;
  j.pontos += n;
  if (x !== undefined) popup(x, y, '+' + fmt(n));
  if (!j.extraPontos && j.pontos >= 750000) { j.extraPontos = true; ganharExtra(); }
}
function ganharExtra() { j.extras++; som('extra'); msg('BOLA EXTRA!', 3, 'pisca'); JO.vibrar(80); clarao(.7, '255,140,60'); show = Math.max(show, 1.5); }
// Letras E-X-T-R-A: cada jogada grande (estação, Lua, looping, órbita, alien, alvos) acende uma.
// Com as cinco acesas, a bola extra fica valendo no buraco negro.
function letraExtra() {
  if (j.tiltado || j.extraAcesa || j.extraNaBola) return;
  const i = j.letras.indexOf(false); if (i < 0) return;
  j.letras[i] = true; som('faixa');
  faiscas(145 + i * 20, 614, 10, '#ffb347', .7);
  if (i === 4) {
    j.extraAcesa = true; som('trava'); clarao(.5, '255,150,60');
    depois(2.2, () => { if (j.extraAcesa) msg('EXTRA ACESA\nBURACO NEGRO', 2.8, 'pisca'); });
  }
}
const missaoAtual = () => (MISSOES[j.missao] || {}).ev;
function evento(tipo) {
  if (j.tiltado || missaoAtual() !== tipo) return;
  j.prog++;
  if (j.prog < MISSOES[j.missao].meta(j.rodada)) return;
  const p = PLANETAS[j.missao];
  pontuar(25000 * (j.missao + 1) * j.rodada, p.x, p.y - 20);
  j.planetas++; j.missao++; j.prog = 0;
  som('missao'); show = 2; clarao(.8, '120,200,255');
  faiscas(p.x, p.y, 30, p.cor[1], 1.3);
  msg(`MISSÃO\n${p.nome.toUpperCase()} COMPLETA`, 3);
  if (j.missao >= MISSOES.length) {
    depois(2.4, () => {
      pontuar(250000 * j.rodada);
      j.rodada++; j.missao = 0; j.planetas = 0; ganharExtra(); show = 4;
      msg('GALÁXIA\nCONQUISTADA!', 4, 'pisca');
    });
  }
}

// luzes dos 4 corredores de baixo: acender todas recarrega o escudo
function acenderFaixa(i, b) {
  if (j.faixas[i]) return;
  j.faixas[i] = true; som('faixa'); faiscas(X_FAIXAS[i], 575, 8, '#7dffb2', .6);
  if (j.faixas.every(Boolean)) {
    pontuar(15000 * j.rodada, 185, 640); clarao(.4, '90,200,255');
    if (j.estado === 'jogando') { j.salvaAte = Math.max(j.salvaAte, relogio + 10); msg('ESCUDO\nRECARREGADO', 2.4); }
    depois(.7, () => { j.faixas = [false, false, false, false]; });
  }
}

function aoEntrar(b, z) {
  if (j.tiltado) return;
  switch (z.ev) {
    case 'trilha':
      som('trilha');
      if (j.trilhas[z.i]) { pontuar(100); break; }
      j.trilhas[z.i] = true; pontuar(500, b.x, b.y + 16); j.bonus += 200;
      if (j.trilhas.every(Boolean)) {
        if (j.mult < 5) j.mult++;
        pontuar(5000); msg(`BÔNUS x${j.mult}\nCRATERA ACESA`, 2.2); clarao(.4, '120,255,170'); j.cratera = true;
        depois(.6, () => { j.trilhas = [false, false, false]; });
      }
      break;
    case 'orbita':
      spinner.w += Math.min(60, Math.abs(b.vy) / 40);
      if (b.vy < 0) {
        pontuar(5000 * j.rodada, 60, 300); j.bonus += 1000; som('orbita'); msg('ÓRBITA!', 1.6); evento('orbita'); letraExtra();
      }
      break;
    case 'retorno': pontuar(1000); j.bonus += 250; som('retorno'); acenderFaixa(z.faixa, b); break;
    case 'fora':
      acenderFaixa(z.faixa, b);
      if (z.lado === 'E' && j.catapulta) {
        j.catapulta = false; b.vx = aleat(10, 50); b.vy = -1550; som('catapulta'); msg('CATAPULTA!', 1.6);
        faiscas(b.x, b.y + 10, 20, '#ff5dd8', 1.2, 0, -1); tremor = .12;
      } else { pontuar(2500); msg('QUE AZAR...', 1.6); }
      break;
    case 'saiu':
      if (j.estado === 'pronto') { j.estado = 'jogando'; j.salvaAte = relogio + regras.escudo; j.skillAte = relogio + 6; }
      break;
    case 'entrada':
      if (!b.trilha && b.vy < -150) entrarTrilha(b, TRILHAS[z.trilha]);
      break;
    case 'ralo':   // caiu da estação: desce pelo trilho de arame
      if (!b.trilha) { b.vx = 0; b.vy = Math.max(120, b.vy); entrarTrilha(b, TRILHAS[z.trilha]); }
      break;
  }
}

// ----- Trilhas: a bola sobe gastando força; sem força suficiente, ela volta -----
const K_TRILHA = 8e5, F_TRILHA = 350;
function entrarTrilha(b, T) {
  const s0 = Math.hypot(b.vx, b.vy);
  b.trilha = { T, d: 0, dir: 1, E: s0 * s0 * .8, gasto: 0, s: s0, h: 0 };
  som(T.nome);
}
function moverTrilha(b, h) {
  const r = b.trilha, T = r.T;
  const aqui = pontoTrilha(T, r.d);
  let s2 = r.E - K_TRILHA * aqui.h - F_TRILHA * r.gasto;
  if (r.dir > 0 && s2 <= 0) {
    r.dir = -1; r.E = K_TRILHA * aqui.h + F_TRILHA * r.gasto; s2 = 0; som('rampaFalha');
  }
  const s = Math.max(45, Math.sqrt(Math.max(0, s2)));
  r.s = s;
  r.d += r.dir * s * h; r.gasto += s * h;
  if (r.d >= T.L) { sairTrilha(b, true); return; }
  if (r.d <= 0) { sairTrilha(b, false); return; }
  const p = pontoTrilha(T, r.d);
  b.x = p.x; b.y = p.y; b.vx = p.dx * s * r.dir; b.vy = p.dy * s * r.dir; r.h = p.h; r.z = p.zv;
}
function sairTrilha(b, fim) {
  const T = b.trilha.T, s = b.trilha.s;
  b.trilha = null;
  b.andar = fim ? (T.andarFim || 0) : (T.andarIni || 0);
  if (fim) {
    const p = T.pts[T.pts.length - 1], v = Math.min(T.vmax, Math.max(T.vmin, s));
    b.x = p.x; b.y = p.y; b.vx = p.dx * v; b.vy = p.dy * v;
    trilhaFeita(b, T);
  } else {
    const p = T.pts[0];
    b.x = p.x - p.dx * 3; b.y = p.y - p.dy * 3; b.vx = -p.dx * s; b.vy = -p.dy * s;
  }
  b.ox = b.x; b.oy = b.y;
  b.zd = ZONAS.map(z => b.x > z.x0 && b.x < z.x1 && b.y > z.y0 && b.y < z.y1);
}
function trilhaFeita(b, T) {
  if (j.tiltado) return;
  brilhoTrilha[T.nome] = relogio;
  if (T.nome === 'descida' || T.nome === 'descidaLua') { pontuar(2500, b.x, b.y - 10); j.bonus += 500; som('retorno'); return; }
  if (T.nome === 'lua' || T.nome === 'travessia') {
    pontuar(15000 * j.rodada, 180, 110); j.bonus += 2500; som('rampaOk'); evento('lua'); clarao(.35, '200,210,230');
    if (T.nome === 'lua' && relogio < j.skillAte) {
      j.skillAte = 0; pontuar(50000 * j.rodada, 180, 90); som('tacada'); faiscas(b.x, b.y, 24, '#ffffff', 1.2);
      msg('TACADA\nPERFEITA!', 2.5, 'pisca');
    } else msg('BASE\nLUNAR', 1.8);
    if (T.nome === 'lua') letraExtra();
    return;
  }
  letraExtra();
  if (T.nome === 'tubo') {
    pontuar(20000 * j.rodada, 190, 150); j.bonus += 3000;
    som('looping'); evento('tubo'); clarao(.5, '120,255,190'); faiscas(b.x, b.y, 18, '#7dffb2', 1);
    msg('LOOPING!', 2, 'pisca');
    return;
  }
  pontuar(10000 * j.rodada, 300, 120); j.bonus += 2000;
  som('rampaOk'); evento('rampa'); clarao(.35, '150,120,255');
  if (j.multibola && j.jackpot) {
    pontuar(100000 * j.rodada, 185, 360); som('jackpot'); show = 2.5; clarao(1, '255,220,90'); tremor = .2;
    faiscas(262, 352, 40, '#ffd84a', 1.6); msg('JACKPOT!', 3, 'pisca');
  } else if (!j.trava && !j.multibola) {
    j.trava = true; msg('TRAVA ACESA\nVÁ AO BURACO NEGRO', 2.6);
  } else msg('ESTAÇÃO\nORBITAL', 1.8);
}

// ----- Estação orbital: alvos, buraco do hipersalto -----
function capturarKicker(b) {
  Object.assign(b, { x: KICKER.x, y: KICKER.y, vx: 0, vy: 0, presa: relogio + 1.6, destino: 'travessia' });
  som('buraco'); clarao(.3, '120,200,255');
  if (j.tiltado) return;
  if (j.hiper) {
    j.hiper = false; pontuar(75000 * j.rodada, KICKER.x - 20, KICKER.y + 20); som('jackpot'); show = 2; tremor = .15;
    faiscas(KICKER.x, KICKER.y, 30, '#7fe3ff', 1.4); msg('HIPERSALTO!', 2.6, 'pisca'); letraExtra();
  } else { pontuar(10000 * j.rodada, KICKER.x - 20, KICKER.y + 20); msg('RUMO À LUA', 1.6); }
}
// cratera da Base Lunar: segura a bola, dá pontos e devolve para a palheta
function capturarCratera(b) {
  Object.assign(b, { x: CRATERA.x, y: CRATERA.y, vx: 0, vy: 0, presa: relogio + 1.4, destino: 'cratera' });
  som('buraco'); clarao(.3, '220,220,240');
  if (j.tiltado) return;
  if (j.cratera) {
    j.cratera = false; pontuar(60000 * j.rodada, CRATERA.x, CRATERA.y - 20); som('jackpot'); show = 2; tremor = .12;
    faiscas(CRATERA.x, CRATERA.y, 26, '#e8ecff', 1.3); msg('ALUNISSAGEM!', 2.6, 'pisca'); letraExtra();
  } else { pontuar(15000 * j.rodada, CRATERA.x, CRATERA.y - 20); msg('CRATERA', 1.4); }
}
function alvoDeck(a) {
  if (j.tiltado || a.aceso) return;
  a.aceso = true; a.flash = .2; pontuar(2500, a.ax + 24, a.ay + 8); j.bonus += 500; som('alvo');
  faiscas(a.ax, a.ay + 8, 10, '#ffe27a', .8, 1, 0);
  if (ALVOS_DECK.every(x => x.aceso)) {
    pontuar(30000 * j.rodada); som('bancada'); clarao(.5, '120,200,255'); j.hiper = true;
    msg('HIPERSALTO\nACESO', 2.4, 'pisca');
    depois(.8, () => ALVOS_DECK.forEach(x => x.aceso = false));
  }
}

// ----- Alienígena -----
function baterAlien(c) {
  if (ALIEN.flash > .05 || j.tiltado || ALIEN.segurando) return;
  ALIEN.flash = .3; ALIEN.vida--;
  if (ALIEN.vida > 0 && j.estado === 'jogando' && !j.multibola && ++ALIEN.golpes >= GOLPES_AGARRA) {
    pontuar(5000 * j.rodada, ALIEN.x, ALIEN.y - 70); evento('alien');
    agarrar(B); return;
  }
  B.vx += c.nx * 420; B.vy += c.ny * 420;
  pontuar(5000 * j.rodada, ALIEN.x, ALIEN.y - 70); j.bonus += 1000; som('alien'); evento('alien');
  faiscas(ALIEN.x + c.nx * -10, ALIEN.y - 20, 16, '#9dff3a', 1.2, -c.nx, -c.ny);
  tremor = Math.max(tremor, .1); JO.vibrar(30);
  if (ALIEN.vida <= 0) matarAlien();
  else if (ALIEN.vida <= 2) msg(`ALIEN FERIDO\n${ALIEN.vida} ${ALIEN.vida > 1 ? 'GOLPES' : 'GOLPE'}!`, 1.6);
}
// ponto da boca do alien na mesa (a bola fica presa lá)
const bocaAlien = () => ({ x: ALIEN.x, y: ALIEN.y + 2 - 46 * 1.3 * esticar(ALIEN.y) });
function agarrar(b) {
  ALIEN.golpes = 0; ALIEN.segurando = b;
  const p = bocaAlien();
  Object.assign(b, { x: p.x, y: p.y, vx: 0, vy: 0, presa: relogio + 2.2, destino: 'alien' });
  som('alienVolta'); tremor = .2; clarao(.5, '140,255,90'); JO.vibrar([40, 30, 40]);
  msg('O ALIEN PEGOU\nA BOLA!', 2.2, 'pisca');
}
function alienSolta(b) {
  ALIEN.segurando = null; b.presa = 0;
  Object.assign(b, { x: ALIEN.x + aleat(-6, 6), y: ALIEN.y + 30, vx: aleat(-220, 220), vy: 520 });
  b.zd = ZONAS.map(() => false); b.ignora = relogio + .3;
  if (j.tiltado || j.estado !== 'jogando') return;
  pontuar(50000 * j.rodada, ALIEN.x, ALIEN.y - 60); letraExtra();
  som('alienMorre'); show = Math.max(show, 2.5); clarao(1, '160,255,90'); tremor = .3;
  faiscas(ALIEN.x, ALIEN.y - 30, 40, '#9dff3a', 1.8); faiscas(ALIEN.x, ALIEN.y - 30, 24, '#ffb347', 1.4);
  const emJogo = bolas.filter(x => !x.fora && !x.travado).length;
  const n = Math.min(3, MAX_BOLAS - emJogo);
  if (n <= 0) { msg('O ALIEN\nCUSPIU!', 2); return; }
  msg(`MULTIBOLA\nALIENÍGENA +${n}`, 2.8, 'pisca');
  j.multibola = true; j.jackpot = true; j.salvaAte = Math.max(j.salvaAte, relogio + 8);
  depois(.2, () => som('multibola'));
  const angs = [-2.5, -.65, 2.25];
  for (let k = 0; k < n; k++) depois(.05 + k * .12, () => {
    if (j.estado === 'fim' || j.estado === 'bonus') return;
    const a = angs[k] + aleat(-.15, .15), v = aleat(600, 800);
    const nb = novaBola(ALIEN.x + Math.cos(a) * 32, ALIEN.y + Math.sin(a) * 32);
    nb.vx = Math.cos(a) * v; nb.vy = Math.sin(a) * v; nb.ignora = relogio + .3;
    bolas.push(nb);
    som('ejetar'); faiscas(nb.x, nb.y, 16, '#c8ff6a', 1.2, Math.cos(a), Math.sin(a));
  });
}
function matarAlien() {
  ALIEN.morto = true; ALIEN.mortes++; ALIEN.renasce = relogio + 14;
  pontuar(150000 * j.rodada, ALIEN.x, ALIEN.y - 40); j.bonus += 20000;
  som('alienMorre'); show = 3; clarao(1, '160,255,90'); tremor = .3; JO.vibrar([60, 40, 120]);
  faiscas(ALIEN.x, ALIEN.y - 25, 40, '#9dff3a', 2); faiscas(ALIEN.x, ALIEN.y - 25, 30, '#ff9a3a', 1.6);
  msg('ALIEN\nDESTRUÍDO!', 3, 'pisca'); letraExtra();
}
function atualizarAlien(h) {
  ALIEN.t += h; ALIEN.flash -= h;
  if (ALIEN.morto && relogio >= ALIEN.renasce) {
    ALIEN.morto = false; ALIEN.max = Math.min(20, 8 + 3 * ALIEN.mortes); ALIEN.vida = ALIEN.max; ALIEN.golpes = 0;
    som('alienVolta'); clarao(.5, '120,255,90'); faiscas(ALIEN.x, ALIEN.y - 10, 24, '#9dff3a', 1);
    if (j.estado === 'jogando') msg('O ALIEN\nVOLTOU!', 2.2, 'pisca');
  }
}

const MAX_BOLAS = 5;

// ----- Buraco negro (prende, trava bolas e solta a multibola) -----
function capturar(b) {
  Object.assign(b, { x: BURACO.x, y: BURACO.y, vx: 0, vy: 0, presa: relogio + 1.6 });
  som('buraco'); clarao(.35, '170,110,255');
  if (j.tiltado) return;
  pontuar(7500 * j.rodada, BURACO.x, BURACO.y - 22); j.bonus += 1500; evento('buraco');
  let deuExtra = false;
  if (j.extraAcesa) {
    j.extraAcesa = false; j.extraNaBola = true; j.letras = [false, false, false, false, false]; deuExtra = true;
    faiscas(BURACO.x, BURACO.y, 30, '#ffb347', 1.4);
    depois(j.trava && !j.multibola ? 2.6 : .1, ganharExtra);
  }
  if (j.trava && !j.multibola) {
    j.trava = false; j.travadas++;
    som('trava');
    if (j.travadas === 1) { b.travar = true; b.presa = relogio + 1.2; msg('BOLA 1 TRAVADA', 2.4); }
    else {
      j.travadas = 0; j.multibola = true; j.jackpot = true;
      b.presa = relogio + 2.4; show = 3; clarao(1, '200,120,255');
      j.salvaAte = relogio + 2.4 + 12;
      msg('MULTIBOLA!', 3.5, 'pisca');
      depois(.3, () => som('multibola'));
      depois(2.9, () => { const n = novaBola(BURACO.x, BURACO.y); bolas.push(n); ejetar(n); });
      depois(3.2, () => colocarNoLancador(true));
    }
  } else if (!deuExtra) msg('BURACO NEGRO!', 1.8);
}
function ejetar(b) {
  b.presa = 0; b.ignora = relogio + .5;
  b.vx = aleat(-390, -250); b.vy = aleat(250, 370);
  som('ejetar'); faiscas(b.x, b.y, 14, '#c77dff', .9);
}

function bolaPerdida() {
  if (j.estado === 'fim' || j.estado === 'bonus') return;
  if (!j.tiltado && relogio < j.salvaAte) {
    som('salvo'); msg('BOLA SALVA!', 2); colocarNoLancador(true);
    if (!j.multibola) j.salvaAte = 0;
    return;
  }
  if (bolas.length > 0) {
    if (j.multibola && bolas.length === 1) { j.multibola = false; j.jackpot = false; msg('FIM DA\nMULTIBOLA', 2); }
    return;
  }
  fimDaBola();
}
function fimDaBola() {
  j.estado = 'bonus'; j.multibola = false; j.jackpot = false;
  som('perdeu'); JO.vibrar(120);
  const total = j.tiltado ? 0 : j.bonus * j.mult;
  let contado = 0;
  if (j.tiltado) msg('TILT\nSEM BÔNUS', 2.6);
  else msg(() => `BÔNUS x${j.mult}\n${fmt(contado)}`, 2.8, 'fixo');
  if (total > 0) for (let k = 1; k <= 12; k++) depois(.6 + k * .12, () => {
    const parte = Math.round(total * k / 12) - Math.round(total * (k - 1) / 12);
    j.pontos += parte; contado += parte; som('contar');
  });
  depois(3, proximaBola);
}
function proximaBola() {
  j.pontos = Math.round(j.pontos);
  j.tiltado = false;
  if (j.extras > 0) { j.extras--; prepararBola(); msg('JOGUE\nDE NOVO!', 2.5); return; }
  if (j.bola < totalBolas) { j.bola++; prepararBola(); msg(`BOLA ${j.bola}`, 2); return; }
  fimDeJogo();
}
function fimDeJogo() {
  j.estado = 'fim'; bolas = [];
  msg('FIM DE JOGO', 4);
  dados.jogos++; dados.melhor = Math.max(dados.melhor || 0, j.pontos);
  JO.salvar('pinball', dados);
  const lista = dados.recordes;
  if (j.pontos > 0 && (lista.length < 5 || j.pontos > lista[lista.length - 1].p)) {
    setTimeout(() => {
      $('nome-txt').textContent = `${fmt(j.pontos)} pontos. Escreva seu nome para a lista de recordes:`;
      $('nome-campo').value = dados.nome || '';
      $('nome').showModal();
      $('nome-campo').focus();
    }, 1200);
  }
}
function salvarNome() {
  const n = ($('nome-campo').value.trim() || 'Jogador').slice(0, 12);
  dados.nome = n;
  dados.recordes.push({ n, p: j.pontos });
  dados.recordes.sort((a, b) => b.p - a.p);
  dados.recordes = dados.recordes.slice(0, 5);
  JO.salvar('pinball', dados);
  mostrarRecordes();
  $('nome').close();
}
function mostrarRecordes() {
  const ol = $('recordes');
  ol.innerHTML = dados.recordes.length
    ? dados.recordes.map(() => `<li><span></span><span></span></li>`).join('')
    : '<li class="vazio">Nenhum ainda. Seja o primeiro!</li>';
  if (dados.recordes.length) [...ol.children].forEach((li, i) => { li.children[0].textContent = dados.recordes[i].n; li.children[1].textContent = fmt(dados.recordes[i].p); });
}

function sacudir() {
  if (pausado || j.tiltado || j.estado !== 'jogando') return;
  tremor = .22;
  for (const b of bolas) if (!b.presa && !b.fora && !b.trilha && !b.naNave) { b.vx += (Math.random() < .5 ? -1 : 1) * aleat(50, 100); b.vy -= 160; }
  j.tilt += 1;
  if (j.tilt >= regras.tilt) { j.tiltado = true; som('tilt'); msg('TILT', 5, 'pisca'); JO.vibrar([200, 80, 200]); palhetas.forEach(p => p.apertada = false); }
  else if (j.tilt >= regras.tilt - 1) { som('aviso'); msg('CUIDADO!', 1.5, 'pisca'); }
  else som('mola');
}

// ================= Física =================
const C = { nx: 0, ny: 0, pen: 0, qx: 0, qy: 0 };
function contato(ax, ay, bx, by, rad) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let t = L2 ? ((B.x - ax) * dx + (B.y - ay) * dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx * t, qy = ay + dy * t, ex = B.x - qx, ey = B.y - qy, d2 = ex * ex + ey * ey, m = R + rad;
  if (d2 >= m * m) return null;
  const d = Math.sqrt(d2) || 1e-6;
  C.nx = ex / d; C.ny = ey / d; C.pen = m - d; C.qx = qx; C.qy = qy;
  return C;
}
// Empurra a bola para fora e devolve a força da batida.
// A borracha devolve menos quando a batida é forte, e cada quique tem uma pequena imperfeição.
function rebater(c, e, f, svx = 0, svy = 0) {
  B.x += c.nx * c.pen; B.y += c.ny * c.pen;
  const rvx = B.vx - svx, rvy = B.vy - svy, vn = rvx * c.nx + rvy * c.ny;
  if (vn >= 0) return 0;
  const tx = -c.ny, ty = c.nx, vt = rvx * tx + rvy * ty;
  const ee = e * (1 - Math.min(.3, -vn / 7000));
  const nvn = vn > -35 ? 0 : -vn * ee;
  let nvt = vt * (1 - f);
  if (vn < -150) nvt += aleat(-.025, .025) * -vn;
  B.vx = svx + c.nx * nvn + tx * nvt; B.vy = svy + c.ny * nvn + ty * nvt;
  return -vn;
}

function colisoes() {
  const andar = B.andar || 0;
  for (const p of paredes) {
    if ((p.andar || 0) !== andar) continue;
    if (p.mao && (B.x - p.ax) * p.mao[0] + (B.y - p.ay) * p.mao[1] < 0) continue;
    const c = contato(p.ax, p.ay, p.bx, p.by, p.r);
    if (!c) continue;
    const forca = rebater(c, p.e, p.f);
    if (p.est && forca > 15) { p.est.toque = relogio; p.est.tx = c.qx; p.est.ty = c.qy; p.est.forca = Math.min(1, forca / 600); }
    if (p.chute && forca > 60 && p.est.flash <= 0 && !j.tiltado) {
      B.vx += c.nx * p.chute; B.vy += c.ny * p.chute;
      p.est.flash = .14; p.est.mola = relogio; pontuar(100); j.bonus += 20; som('estilingue');
      faiscas(c.qx, c.qy, 10, '#ffd0dc', .8, c.nx, c.ny);
    }
  }
  if (andar === 1) for (const a of ALVOS_DECK) {
    const c = contato(a.ax, a.ay, a.bx, a.by, 3);
    if (c && rebater(c, .35, .02) > 40) alvoDeck(a);
  }
  if (andar === 0 && !ALIEN.morto) {
    const c = contato(ALIEN.x, ALIEN.y, ALIEN.x, ALIEN.y, ALIEN.r);
    if (c && rebater(c, .45, .03) > 110) baterAlien(c);
  }
  for (const a of ALVOS) {
    if (!a.de_pe || andar) continue;
    const c = contato(a.ax, a.ay, a.bx, a.by, 3);
    if (!c) continue;
    if (rebater(c, .3, .02) > 40 && !j.tiltado) {
      a.de_pe = false; a.cai = relogio; pontuar(1500, (a.ax + a.bx) / 2 - 18, (a.ay + a.by) / 2); j.bonus += 750; som('alvo');
      faiscas(c.qx, c.qy, 12, '#ff6b6b', .9, c.nx, c.ny);
      if (ALVOS.every(x => !x.de_pe)) {
        pontuar(10000 * j.rodada); som('bancada'); msg('ALVOS\nDERRUBADOS!'); evento('bancada'); clarao(.5, '255,90,90'); letraExtra();
        if (!j.catapulta) { j.catapulta = true; depois(.8, () => msg('CATAPULTA\nACESA', 2)); }
        depois(1.2, () => ALVOS.forEach(x => x.de_pe = true));
      }
    }
  }
  for (const b of COGUMELOS) {
    if ((b.andar || 0) !== andar) continue;
    const c = contato(b.x, b.y, b.x, b.y, b.r);
    if (!c) continue;
    rebater(c, .5, .02);
    if (b.flash <= .06 && !j.tiltado) {
      const k = b.andar ? 420 : 650; B.vx += c.nx * k; B.vy += c.ny * k;
      b.flash = .16; pontuar(1000, b.x, b.y - 24); j.bonus += 100; som('cogumelo'); evento('cogumelo');
      faiscas(b.x + c.nx * b.r, b.y + c.ny * b.r, 12, b.cor[0], 1, c.nx, c.ny);
      if (efeitos()) tremor = Math.max(tremor, .05);
    }
  }
  for (const p of palhetas) {
    if ((p.andar || 0) !== andar) continue;
    const co = Math.cos(p.ang), si = Math.sin(p.ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
    let t = ((B.x - p.px) * co + (B.y - p.py) * si) / p.len;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const c = contato(p.px, p.py, tx, ty, p.rb + (p.rt - p.rb) * t);
    if (!c) continue;
    const forca = rebater(c, p.wReal ? .34 : .22, .03, -p.wReal * (c.qy - p.py), p.wReal * (c.qx - p.px));
    if (forca > 900) { som('batida'); faiscas(c.qx, c.qy, 8, '#ffffff', .7, c.nx, c.ny); }
  }
  // ponta do lançador
  if (!andar && B.x > 351 && B.y + R > plY && B.y < plY + 24) {
    B.y = plY - R;
    if (B.vy > 0) B.vy = B.vy > 60 ? -B.vy * .25 : 0;
    B.vx *= .5;
  }
}

function moverBola(b, h) {
  b.ox = b.x; b.oy = b.y;
  if (b.naNave) return;
  if (b.presa) {
    if (relogio >= b.presa) {
      if (b.destino === 'alien') { b.destino = null; alienSolta(b); }
      else if (b.destino === 'cratera') { b.destino = null; b.presa = 0; b.ignora = relogio + .5; b.vx = aleat(200, 260); b.vy = -aleat(80, 160); som('ejetar'); }
      else if (b.destino) { const d = b.destino; b.destino = null; b.presa = 0; b.vx = -300; b.vy = -300; entrarTrilha(b, TRILHAS[d]); }
      else if (b.travar) { b.fora = true; b.travado = true; colocarNoLancador(true); }
      else ejetar(b);
    } else if (efeitos() && Math.random() < .15) {
      const a = Math.random() * DPI;
      particulas.push({ x: b.x + Math.cos(a) * 22, y: b.y + Math.sin(a) * 22, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, vida: .35, max: .35, cor: '#c77dff', tam: 1.2 });
    }
    return;
  }
  if (b.trilha) { moverTrilha(b, h); return; }
  B = b;
  b.vy += G * h;
  if (b.andar === 1) {
    if (relogio > b.ignora && Math.hypot(KICKER.x - b.x, KICKER.y - b.y) < 8 && Math.hypot(b.vx, b.vy) < 1000) { capturarKicker(b); return; }
    if (relogio > b.ignora && Math.hypot(CRATERA.x - b.x, CRATERA.y - b.y) < 8 && Math.hypot(b.vx, b.vy) < 900) { capturarCratera(b); return; }
  } else if (relogio > b.ignora) {
    const dx = BURACO.x - b.x, dy = BURACO.y - b.y, d = Math.hypot(dx, dy);
    if (d < 22) {
      if (d < 8 && Math.hypot(b.vx, b.vy) < 1150) { capturar(b); return; }
      const k = 1700 * (1 - d / 22) * h / (d || 1);
      b.vx += dx * k; b.vy += dy * k;
    }
  }
  b.vx *= 1 - .06 * h; b.vy *= 1 - .06 * h;
  const v2 = b.vx * b.vx + b.vy * b.vy;
  if (v2 > VMAX * VMAX) { const k = VMAX / Math.sqrt(v2); b.vx *= k; b.vy *= k; }
  b.x += b.vx * h; b.y += b.vy * h;

  colisoes();
  ZONAS.forEach((z, i) => {
    const dentro = b.x > z.x0 && b.x < z.x1 && b.y > z.y0 && b.y < z.y1;
    if (dentro && !b.zd[i] && (z.andar || 0) === b.andar && (!z.sobe || b.vy < 0)) aoEntrar(b, z);
    b.zd[i] = dentro;
  });
  // bola parada num canto por muito tempo: a mesa dá um empurrãozinho
  if (j.estado === 'jogando' && b.x < 350 && Math.hypot(b.vx, b.vy) < 12 && !palhetas.some(p => p.apertada)) {
    b.parado += h;
    if (b.parado > 3) { b.vy = -380; b.vx = aleat(-120, 120); b.parado = 0; }
  } else b.parado = 0;
  // segurança: bola do andar de cima fora da área de chão cai para a mesa
  if (b.andar === 1 && !AREAS_ALTAS.some(([x0, y0, x1, y1]) => b.x > x0 && b.x < x1 && b.y > y0 && b.y < y1)) { b.andar = 0; b.zd = ZONAS.map(() => false); }
  if (b.y > 760) b.fora = true;
}

function choqueEntreBolas() {
  for (let i = 0; i < bolas.length; i++) for (let k = i + 1; k < bolas.length; k++) {
    const a = bolas[i], b = bolas[k];
    if (a.presa || b.presa || a.fora || b.fora || a.trilha || b.trilha || a.naNave || b.naNave || a.andar !== b.andar) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
    if (d2 >= 4 * R * R || d2 === 0) continue;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = (2 * R - d) / 2;
    a.x -= nx * pen; a.y -= ny * pen; b.x += nx * pen; b.y += ny * pen;
    const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vn < 0) { const imp = -vn * .95; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; if (-vn > 300) som('estilingue'); }
  }
}

function passo(h) {
  relogio += h;
  for (let i = agenda.length - 1; i >= 0; i--) if (agenda[i].t <= relogio) { const f = agenda[i].fn; agenda.splice(i, 1); f(); }

  for (const p of palhetas) {
    const alvo = p.apertada ? p.cima : p.rep, ant = p.ang, dir = Math.sign(alvo - p.ang);
    p.oang = ant;
    if (!dir) p.w = 0;
    else {
      if (Math.sign(p.w) !== dir) p.w = 0;
      p.w = dir * Math.min(p.apertada ? 46 : 24, Math.abs(p.w) + (p.apertada ? 1500 : 700) * h);
      let novo = p.ang + p.w * h;
      if ((dir > 0 && novo >= alvo) || (dir < 0 && novo <= alvo)) { novo = alvo; p.w = 0; }
      p.ang = novo;
    }
    p.wReal = (p.ang - ant) / h;
  }
  if (puxando) { puxar = Math.min(1, puxar + h / 1.1); plY = PL_BASE + PL_CURSO * puxar; }
  else if (plY > PL_BASE) plY = Math.max(PL_BASE, plY - 1400 * h);
  for (const s of ESTILINGUES) s.flash -= h;
  for (const b of COGUMELOS) b.flash -= h;
  if (tremor > 0) tremor -= h;
  if (gi > 0) gi -= h * 1.6;
  if (show > 0) show -= h;
  j.tilt = Math.max(0, j.tilt - .3 * h);
  const voltas = Math.floor(spinner.ang / DPI);
  spinner.ang += spinner.w * h; spinner.w *= 1 - 1.3 * h;
  if (spinner.w < .3) spinner.w = 0;
  if (Math.floor(spinner.ang / DPI) > voltas && !j.tiltado && j.estado !== 'fim') { pontuar(100); som('giro'); }
  if (j.estado === 'pronto') j.skill = Math.floor(relogio * 2.2) % 3;
  atualizarAlien(h);
  for (const a of ALVOS_DECK) a.flash -= h;

  for (const b of bolas.slice()) moverBola(b, h);
  if (bolas.length > 1) choqueEntreBolas();
  if (bolas.some(b => b.fora)) {
    const perdidas = bolas.filter(b => b.fora && !b.travado).length;
    bolas = bolas.filter(b => !b.fora);
    for (let i = 0; i < perdidas; i++) bolaPerdida();
  }
}

// ================= Controles =================
// Cada tecla apertada fica guardada pelo nome; a palheta só desce quando TODAS as teclas daquele lado forem soltas.
// No Windows, segurar os dois Shift juntos faz o navegador perder o "soltou" de um deles; por isso,
// quando o evento diz que nenhum Shift (ou Ctrl) está apertado, esquecemos os dois.
const teclas = { E: false, D: false };
const apertadas = new Set();
const toques = new Map();
function conferirTeclas(e) {
  if (e && !e.shiftKey) { apertadas.delete('ShiftLeft'); apertadas.delete('ShiftRight'); }
  if (e && !e.ctrlKey) { apertadas.delete('ControlLeft'); apertadas.delete('ControlRight'); }
  teclas.E = TECLAS_E.some(k => apertadas.has(k));
  teclas.D = TECLAS_D.some(k => apertadas.has(k));
}
// soltar tudo: a janela perdeu o foco, abriu um aviso, trocou de aba...
function soltarTudo() {
  apertadas.clear(); toques.clear(); lancadores.clear(); conferirTeclas();
  puxando = false; puxar = 0;
  atualizarPalhetas();
}
function atualizarPalhetas() {
  const lados = [...toques.values()];
  const e = (teclas.E || lados.includes('E')) && !j.tiltado, d = (teclas.D || lados.includes('D')) && !j.tiltado;
  if (pausado) return;
  if (e && !palhetas[0].apertada) { som('palheta'); girarTrilhas(-1); JO.vibrar(10); }
  if (d && !palhetas[1].apertada) { som('palheta'); girarTrilhas(1); JO.vibrar(10); }
  palhetas[0].apertada = e; palhetas[1].apertada = d; palhetas[2].apertada = d; palhetas[3].apertada = e;
}
// as palhetas trocam as luzes do topo de lugar (para ajudar a acender a que falta)
function girarTrilhas(dir) {
  if (j.estado !== 'jogando' || j.trilhas.every(Boolean)) return;
  const t = j.trilhas;
  j.trilhas = dir > 0 ? [t[2], t[0], t[1]] : [t[1], t[2], t[0]];
}
const bolaNoLancador = () => bolas.some(b => b.x > 351 && b.y > 600 && !b.fora);
function comecarPuxar() { if (pausado || puxando) return; puxando = true; puxar = 0; som('mola'); }
function soltar() {
  if (!puxando) return;
  puxando = false;
  for (const b of bolas) if (b.x > 351 && Math.abs(b.y + R - plY) < 4) {
    b.vy = -(400 + 1900 * puxar) * aleat(.97, 1.03);
    som('lancar');
  }
  puxar = 0;
}

const TECLAS_E = ['KeyZ', 'ShiftLeft', 'ArrowLeft', 'ControlLeft'];
const TECLAS_D = ['Slash', 'IntlRo', 'ShiftRight', 'ArrowRight', 'ControlRight', 'NumpadDivide', 'KeyM'];
const TECLAS_L = ['Space', 'ArrowDown', 'Enter'];
const dialogoAberto = () => !!document.querySelector('dialog[open]');
document.addEventListener('keydown', e => {
  if (dialogoAberto() || e.target.tagName === 'INPUT') return;
  if (e.code === 'F2') { e.preventDefault(); pedirNovo(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') { alternarPausa(); return; }
  if (TECLAS_E.includes(e.code) || TECLAS_D.includes(e.code)) { apertadas.add(e.code); conferirTeclas(e); atualizarPalhetas(); e.preventDefault(); }
  else if (TECLAS_L.includes(e.code)) { conferirTeclas(e); atualizarPalhetas(); if (!e.repeat) comecarPuxar(); e.preventDefault(); }
  else if ((e.code === 'KeyX' || e.code === 'ArrowUp') && !e.repeat) { sacudir(); e.preventDefault(); }
});
document.addEventListener('keyup', e => {
  apertadas.delete(e.code);
  conferirTeclas(e); atualizarPalhetas();
  if (TECLAS_L.includes(e.code)) soltar();
});
window.addEventListener('blur', soltarTudo);
window.addEventListener('pagehide', soltarTudo);
const lancadores = new Set();
mesa.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (e.pointerType === 'touch' && temToque) return;   // dedo na tela: quem cuida são os eventos de toque abaixo
  if (pausado) { alternarPausa(); return; }
  const r = tela.getBoundingClientRect();
  const lado = e.clientX < r.left + r.width / 2 ? 'E' : 'D';
  toques.set(e.pointerId, lado);
  try { mesa.setPointerCapture(e.pointerId); } catch (_) {}
  if (lado === 'D' && j.estado === 'pronto' && bolaNoLancador()) { lancadores.add(e.pointerId); comecarPuxar(); }
  atualizarPalhetas();
});
function fimToque(e) {
  if (!toques.has(e.pointerId)) return;
  toques.delete(e.pointerId);
  if (lancadores.delete(e.pointerId) && !lancadores.size) soltar();
  atualizarPalhetas();
}
mesa.addEventListener('pointerup', fimToque);
mesa.addEventListener('pointercancel', fimToque);
mesa.addEventListener('lostpointercapture', fimToque);
window.addEventListener('pointerup', fimToque);
window.addEventListener('pointercancel', fimToque);
// mouse: se o botão já não está apertado, a palheta desce (o "soltou" pode ter se perdido fora da janela)
window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.buttons === 0 && toques.has(e.pointerId)) fimToque(e); });
mesa.addEventListener('contextmenu', e => e.preventDefault());

// Celular: às vezes o aparelho não avisa que o dedo saiu da tela e a palheta ficava levantada para sempre.
// Agora, a cada toque/movimento, o jogo confere a lista de dedos que REALMENTE estão na tela (e.touches)
// e esquece qualquer dedo que não esteja mais lá.
const temToque = 'ontouchstart' in window;
const ignorados = new Set();   // dedo que só tirou o jogo da pausa
function sincronizarToques(e) {
  const vivos = new Set(Array.from(e.touches, t => 't' + t.identifier));
  for (const id of [...toques.keys()]) if (typeof id === 'string' && !vivos.has(id)) toques.delete(id);
  for (const id of [...ignorados]) if (!vivos.has(id)) ignorados.delete(id);
  let saiu = false;
  for (const id of [...lancadores]) if (typeof id === 'string' && !vivos.has(id)) { lancadores.delete(id); saiu = true; }
  if (saiu && !lancadores.size) soltar();
}
if (temToque) {
  mesa.addEventListener('touchstart', e => {
    e.preventDefault();
    sincronizarToques(e);
    const r = tela.getBoundingClientRect();
    for (const t of e.changedTouches) {
      const id = 't' + t.identifier;
      if (pausado) { alternarPausa(); ignorados.add(id); continue; }
      const lado = t.clientX < r.left + r.width / 2 ? 'E' : 'D';
      toques.set(id, lado);
      if (lado === 'D' && j.estado === 'pronto' && bolaNoLancador()) { lancadores.add(id); comecarPuxar(); }
    }
    atualizarPalhetas();
  }, { passive: false });
  const fimDedo = e => { sincronizarToques(e); atualizarPalhetas(); };
  for (const ev of ['touchend', 'touchcancel', 'touchmove']) {
    window.addEventListener(ev, fimDedo);
  }
}

function alternarPausa(forcar) {
  pausado = forcar === undefined ? !pausado : forcar;
  if (pausado) { palhetas.forEach(p => p.apertada = false); apertadas.clear(); conferirTeclas(); toques.clear(); lancadores.clear(); puxando = false; }
  $('pausa').textContent = pausado ? '▶' : '⏸';
  $('pausa').setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
}
$('pausa').addEventListener('click', () => alternarPausa());
document.addEventListener('visibilitychange', () => { if (document.hidden) { soltarTudo(); if (j.estado !== 'fim') alternarPausa(true); } });
$('sacudir').addEventListener('click', sacudir);
function pedirNovo() {
  if (j.estado === 'fim' || (j.pontos === 0 && j.bola === 1)) { novoJogo(); alternarPausa(false); }
  else $('confirma').showModal();
}
$('novo').addEventListener('click', e => { e.currentTarget.blur(); pedirNovo(); });
$('confirma-sim').addEventListener('click', () => { $('confirma').close(); novoJogo(); alternarPausa(false); });
$('nome-ok').addEventListener('click', salvarNome);
$('nome-campo').addEventListener('keydown', e => { if (e.key === 'Enter') salvarNome(); });
document.querySelectorAll('dialog').forEach(d => d.addEventListener('close', soltarTudo));

// Opções
const valorOpc = k => k === 'musica' ? (opc.musica ? '1' : '0') : String(opc[k]);
function mostrarOpcoes() {
  document.querySelectorAll('[data-opc]').forEach(g => g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === valorOpc(g.dataset.opc)))));
}
document.querySelectorAll('[data-opc]').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const k = g.dataset.opc, v = b.dataset.v;
  opc[k] = k === 'bolas' ? +v : k === 'musica' ? v === '1' : v;
  JO.salvar('pinball', dados);
  mostrarOpcoes();
  if (k === 'efeitos') { dprMax = 2; ajustarTamanho(); }
}));
mostrarOpcoes();

// ================= Desenho =================
let escala = 1, dpr = 1, dprMax = 2;
const fundo = document.createElement('canvas'), frente = document.createElement('canvas'), camRampa = document.createElement('canvas'), camTubo = document.createElement('canvas'), camDeck = document.createElement('canvas');

function caminho(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
function circulo(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, DPI); }
function gradRadial(c, x, y, r, cores) {
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  cores.forEach((cor, i) => g.addColorStop(i / (cores.length - 1), cor));
  return g;
}
function seta(c, x, y, ang, tam) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(tam, 0); c.lineTo(-tam * .7, -tam * .75); c.lineTo(-tam * .3, 0); c.lineTo(-tam * .7, tam * .75); c.closePath();
  c.restore();
}
function texto(c, t, x, y, tam, cor, peso = '700', alinhar = 'center') {
  c.font = `${peso} ${tam}px "Trebuchet MS", Verdana, sans-serif`; c.textAlign = alinhar; c.textBaseline = 'middle';
  c.fillStyle = cor; c.fillText(t, x, y);
}
function estrela(c, x, y, r, pontas = 5) {
  c.beginPath();
  for (let i = 0; i < pontas * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pontas, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath();
}
const SETAS = [
  { x: 41, y: 452, ang: -Math.PI / 2, ev: 'orbita', cor: '#ffd84a' },
  { x: 99, y: 384, ang: -Math.PI / 2 - .05, ev: 'tubo', cor: '#7dffb2' },
  { x: 185, y: 398, ang: -Math.PI / 2, ev: 'alien', cor: '#9dff3a' },
  { x: 262, y: 384, ang: -Math.PI / 2, ev: 'rampa', cor: '#7fe3ff' },
  { x: 276, y: 292, ang: -1.19, ev: 'buraco', cor: '#c77dff' },
  { x: 300, y: 378, ang: -.25, ev: 'bancada', cor: '#ff5d5d' },
];
// trilhas de luzes: correm dos botões até cada jogada (acendem em sequência quando a jogada está valendo)
const CAMINHOS = [
  { ev: 'lua', cor: '#dfe6ff', de: [41, 388], ate: [41, 312] },
  { ev: 'tubo', cor: '#7dffb2', de: [152, 470], ate: [106, 418] },
  { ev: 'alien', cor: '#9dff3a', de: [150, 400], ate: [170, 382] },
  { ev: 'alien', cor: '#9dff3a', de: [220, 400], ate: [200, 382] },
  { ev: 'rampa', cor: '#7fe3ff', de: [218, 470], ate: [258, 444] },
  { ev: 'bancada', cor: '#ff5d5d', de: [296, 472], ate: [300, 404] },
  { ev: 'buraco', cor: '#c77dff', de: [298, 340], ate: [282, 318] },
  { ev: 'lancar', cor: '#ffd84a', de: [365, 680], ate: [365, 240] },
].map(c => { const L = Math.hypot(c.ate[0] - c.de[0], c.ate[1] - c.de[1]), n = Math.max(2, Math.round(L / (c.ev === 'lancar' ? 26 : 12))); c.pts = []; for (let i = 0; i <= n; i++) c.pts.push([c.de[0] + (c.ate[0] - c.de[0]) * i / n, c.de[1] + (c.ate[1] - c.de[1]) * i / n]); return c; });
const LUZES = [
  ...[168, 192, 216].map((x, i) => ({ x, y: 94, r: 5, cor: '#ffd84a', deck: true, on: () => j.trilhas[i], pisca: () => false })),
  ...ALVOS.map(a => ({ x: (a.ax + a.bx) / 2 - 20, y: (a.ay + a.by) / 2, r: 4.5, cor: '#ff5d5d', on: () => !a.de_pe, pisca: () => false })),
  ...[2, 3, 4, 5].map((k, i) => ({ x: 140 + i * 30, y: 548, r: 10, cor: '#4dffa6', txt: k + 'x', on: () => j.mult >= k, pisca: () => false })),
  ...X_FAIXAS.map((x, i) => ({ x, y: 575, r: 5, cor: '#7dffb2', estrela: true, on: () => j.faixas[i], pisca: () => false })),
  { x: 185, y: 579, r: 7, cor: '#ff8a3d', on: () => j.extras > 0, pisca: () => false },
  ...'EXTRA'.split('').map((L, i) => ({ x: 145 + i * 20, y: 614, r: 7.5, cor: '#ffa53d', txt: L, on: () => j.letras[i], pisca: () => j.extraAcesa })),
  { x: 185, y: 693, r: 6, cor: '#49c6ff', on: () => relogio < j.salvaAte, pisca: () => j.salvaAte - relogio < 2.5 },
  { x: 33, y: 622, r: 5, cor: '#ff5dd8', on: () => j.catapulta, pisca: () => false },
  { x: 306, y: 280, r: 5, cor: '#c77dff', on: () => false, pisca: () => j.trava },
  { x: 262, y: 421, r: 6, cor: '#ffd84a', on: () => false, pisca: () => j.jackpot },
];

// desenhos pintados na mesa: foguete, satélite e faixas de perigo
function desenharFoguete(c, x, y, esc) {
  c.save(); c.translate(x, y); c.scale(esc, esc);
  c.fillStyle = 'rgba(255,120,40,.55)'; c.beginPath(); c.moveTo(-4, 14); c.lineTo(0, 26); c.lineTo(4, 14); c.fill();
  c.fillStyle = 'rgba(255,230,120,.7)'; c.beginPath(); c.moveTo(-2, 14); c.lineTo(0, 20); c.lineTo(2, 14); c.fill();
  c.fillStyle = '#e8ecf3'; c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(7, -8, 6, 12); c.lineTo(-6, 12); c.quadraticCurveTo(-7, -8, 0, -18); c.fill();
  c.fillStyle = '#e0303f'; c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(4.5, -12, 5.2, -8); c.lineTo(-5.2, -8); c.quadraticCurveTo(-4.5, -12, 0, -18); c.fill();
  c.beginPath(); c.moveTo(-6, 4); c.lineTo(-10, 14); c.lineTo(-6, 12); c.fill(); c.beginPath(); c.moveTo(6, 4); c.lineTo(10, 14); c.lineTo(6, 12); c.fill();
  c.fillStyle = '#5fc8ff'; circulo(c, 0, -1, 2.8); c.fill(); c.strokeStyle = '#8a909c'; c.lineWidth = 1; c.stroke();
  c.restore();
}
function desenharSatelite(c, x, y, esc) {
  c.save(); c.translate(x, y); c.rotate(-.5); c.scale(esc, esc);
  c.fillStyle = '#2f5fd0'; c.strokeStyle = '#9fb8ff'; c.lineWidth = .8;
  for (const lado of [-1, 1]) { c.fillRect(lado > 0 ? 6 : -20, -4, 14, 8); c.strokeRect(lado > 0 ? 6 : -20, -4, 14, 8); for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo((lado > 0 ? 6 : -20) + k * 3.5, -4); c.lineTo((lado > 0 ? 6 : -20) + k * 3.5, 4); c.stroke(); } }
  c.fillStyle = '#d9c070'; c.fillRect(-6, -6, 12, 12); c.strokeStyle = '#8a7a40'; c.strokeRect(-6, -6, 12, 12);
  c.strokeStyle = '#c9cfd9'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, -13); c.stroke();
  c.fillStyle = '#e8ecf3'; c.beginPath(); c.arc(0, -14, 4, Math.PI, 0); c.fill();
  c.restore();
}
function faixaPerigo(c, x, y, w, h) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = 'rgba(255,205,40,.55)'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(20,20,20,.75)';
  for (let k = -h; k < w + h; k += 8) { c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k + 4, y); c.lineTo(x + k + 4 - h, y + h); c.lineTo(x + k - h, y + h); c.fill(); }
  c.restore();
}

function desenharFundo(c) {
  // gabinete: madeira com friso de metal
  const gm = c.createLinearGradient(0, 0, W, 0);
  gm.addColorStop(0, '#1d1209'); gm.addColorStop(.06, '#4a2f18'); gm.addColorStop(.5, '#3b2615'); gm.addColorStop(.94, '#4a2f18'); gm.addColorStop(1, '#1d1209');
  c.fillStyle = gm; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .7;
  for (let y = 4; y < H; y += 7) { c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(W * .3, y + 3, W * .6, y - 3, W, y + 1); c.stroke(); }
  c.save();
  caminho(c, CONTORNO); c.closePath(); c.clip();
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#101e58'); g.addColorStop(.45, '#0a1236'); g.addColorStop(1, '#170b33');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const [x, y, r, cor] of [[100, 330, 170, 'rgba(160,60,220,.28)'], [300, 560, 150, 'rgba(30,190,210,.2)'], [250, 110, 130, 'rgba(230,60,150,.18)'], [80, 620, 110, 'rgba(60,90,255,.2)']]) {
    const n = c.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, cor); n.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = n; c.fillRect(0, 0, W, H);
  }
  let sd = 11; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = rnd() * H, r = rnd() * 1.1 + .3;
    c.globalAlpha = .3 + rnd() * .7; c.fillStyle = rnd() < .2 ? '#ffe9a8' : '#ffffff'; circulo(c, x, y, r); c.fill();
  }
  c.globalAlpha = 1;
  for (const [x, y] of [[300, 470], [60, 170], [215, 600], [330, 140]]) {
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = .8;
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x, y - 6); c.lineTo(x, y + 6); c.stroke();
  }
  c.strokeStyle = 'rgba(80,220,255,.13)'; c.lineWidth = 1;
  for (let i = 0; i <= 12; i++) { const x = 185 + (i - 6) * 34; c.beginPath(); c.moveTo(185 + (i - 6) * 8, 610); c.lineTo(x, 740); c.stroke(); }
  for (let k = 0; k < 6; k++) { const y = 610 + Math.pow(k / 5, 1.6) * 130; c.beginPath(); c.moveTo(20, y); c.lineTo(350, y); c.stroke(); }
  const gl = c.createLinearGradient(350, 0, 380, 0);
  gl.addColorStop(0, '#05070f'); gl.addColorStop(.5, '#121831'); gl.addColorStop(1, '#05070f');
  c.fillStyle = gl; c.fillRect(350, 214, 30, 560);
  for (let y = 300; y < 660; y += 60) { c.fillStyle = 'rgba(255,216,74,.25)'; seta(c, 365, y, -Math.PI / 2, 6); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(20, 240, 42, 205);
  c.fillStyle = '#8f96a3'; c.fillRect(23, 298, 4, 5); c.fillRect(55, 298, 4, 5);

  // circuitos pintados (preenchem os espaços vazios)
  c.lineWidth = 1.1; c.lineCap = 'round';
  const CIRC = [
    [[70, 455], [86, 440], [86, 405], [72, 392]], [[128, 392], [128, 372], [146, 356], [160, 356]], [[208, 356], [226, 356], [238, 372], [238, 398]],
    [[292, 410], [292, 440], [276, 456], [276, 478]], [[240, 300], [228, 318], [212, 318]], [[130, 300], [142, 318], [158, 318]],
    [[70, 420], [60, 430], [60, 470]], [[300, 470], [312, 480], [312, 498]], [[120, 520], [140, 520], [150, 530]], [[250, 520], [230, 520], [220, 530]],
  ];
  for (const pts of CIRC) {
    c.strokeStyle = 'rgba(90,230,255,.28)'; caminho(c, pts); c.stroke();
    for (const [x, y] of [pts[0], pts[pts.length - 1]]) { c.fillStyle = 'rgba(120,240,255,.55)'; circulo(c, x, y, 1.8); c.fill(); }
  }
  // ninho do alien: costelas e gosma verde em volta dele
  const nx = ALIEN.x, ny = ALIEN.y;
  const gn = c.createRadialGradient(nx, ny, 4, nx, ny, 52); gn.addColorStop(0, 'rgba(60,255,90,.32)'); gn.addColorStop(.5, 'rgba(20,80,40,.35)'); gn.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gn; circulo(c, nx, ny, 52); c.fill();
  for (let k = 0; k < 14; k++) {
    const a = k * DPI / 14 + .1, r0 = 20, r1 = 44 + (k % 3) * 4;
    c.strokeStyle = 'rgba(10,30,16,.85)'; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(nx + Math.cos(a) * r0, ny + Math.sin(a) * r0); c.quadraticCurveTo(nx + Math.cos(a + .25) * (r1 * .7), ny + Math.sin(a + .25) * (r1 * .7), nx + Math.cos(a + .1) * r1, ny + Math.sin(a + .1) * r1); c.stroke();
    c.strokeStyle = 'rgba(110,200,120,.35)'; c.lineWidth = 1; c.stroke();
  }
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * DPI / 10; c.fillStyle = 'rgba(255,48,48,.25)'; circulo(c, nx + Math.cos(a) * 30, ny + Math.sin(a) * 30, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.stroke(); }
  texto(c, 'MATE O ALIEN', nx, ny + 44, 7.5, 'rgba(160,255,120,.9)', '900');
  // anel da plataforma da nave
  // estrela de luzes no centro: conta os golpes até o alien agarrar a bola
  { const cx = CENTRO.x, cy = CENTRO.y;
    for (let k = 0; k < 16; k++) { const a = k * DPI / 16, r = k % 2 ? 16 : 22; c.strokeStyle = 'rgba(157,255,58,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); c.fillStyle = 'rgba(157,255,58,.22)'; circulo(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.8); c.fill(); }
    for (let k = 0; k < GOLPES_AGARRA; k++) { c.fillStyle = 'rgba(255,90,40,.25)'; circulo(c, cx - 15 + k * 10, cy, 4); c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.stroke(); }
    texto(c, 'FÚRIA', cx, cy + 12, 6.5, 'rgba(255,160,120,.85)', '900'); }
  for (const cm of CAMINHOS) for (const [x, y] of cm.pts) { c.fillStyle = cm.cor; c.globalAlpha = .2; circulo(c, x, y, 2.4); c.fill(); c.globalAlpha = 1; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = .6; c.stroke(); }
  c.save(); c.translate(41, 282); c.rotate(-Math.PI / 2); texto(c, 'LUA', 0, 0, 7, 'rgba(225,232,255,.9)', '900'); c.restore();
  // bases das lâmpadas de iluminação
  for (const [x, y] of LAMPADAS) { c.fillStyle = '#e8d6a0'; circulo(c, x, y, 1.6); c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = .6; c.stroke(); }

  // laterais de baixo: corredores pintados, desenhos e faixas de perigo
  for (const [x0, x1] of [[23, 43], [49, 69], [301, 321], [327, 347]]) { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x0, 505, x1 - x0, 140); }
  faixaPerigo(c, 24, 640, 19, 7); faixaPerigo(c, 327, 640, 19, 7);
  for (const x of [59, 311]) for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(125,255,178,${.18 + k * .08})`; seta(c, x, 600 + k * 11, Math.PI / 2, 5); c.fill(); }
  desenharFoguete(c, 41, 474, .95);
  desenharSatelite(c, 337, 462, .9);
  c.save(); c.translate(337, 535); c.rotate(-Math.PI / 2); texto(c, 'ESCUDO', 0, 0, 7, 'rgba(125,255,178,.8)', '800'); c.restore();
  c.save(); c.translate(59, 535); c.rotate(-Math.PI / 2); texto(c, 'ESCUDO', 0, 0, 7, 'rgba(125,255,178,.8)', '800'); c.restore();

  c.globalAlpha = .5;
  for (const p of PLANETAS) desenharPlaneta(c, p);
  c.globalAlpha = 1;
  for (const p of PLANETAS) texto(c, p.nome.toUpperCase(), p.x, p.y + p.r + 9, 8, 'rgba(255,255,255,.7)', '800');
  for (const l of LUZES) {
    if (l.deck) continue;
    if (l.estrela) estrela(c, l.x, l.y, l.r + 2); else circulo(c, l.x, l.y, l.r);
    c.fillStyle = l.cor; c.globalAlpha = .22; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.2; c.stroke();
    if (l.txt) texto(c, l.txt, l.x, l.y + .5, 8.5, 'rgba(255,255,255,.6)', '800');
  }
  texto(c, 'BOLA EXTRA', 185, 593, 8, 'rgba(255,170,110,.85)', '800');
  texto(c, 'ESCUDO', 185, 705, 8, 'rgba(120,210,255,.9)', '800');
  texto(c, 'BÔNUS', 185, 532, 8.5, 'rgba(120,255,180,.8)', '800');
  texto(c, 'TRAVA', 306, 291, 7, 'rgba(210,170,255,.9)', '800');
  texto(c, 'JACKPOT', 262, 433, 7.5, 'rgba(255,216,74,.85)', '800');
  texto(c, 'LOOPING', 99, 413, 8, 'rgba(125,255,178,.95)', '900');
  c.save(); c.translate(33, 660); c.rotate(-Math.PI / 2); texto(c, 'CATAPULTA', 0, 0, 7, 'rgba(255,140,230,.85)', '800'); c.restore();
  for (const s of SETAS) for (let k = 0; k < 3; k++) { c.fillStyle = s.cor; c.globalAlpha = .22; seta(c, s.x - Math.cos(s.ang) * k * 10, s.y - Math.sin(s.ang) * k * 10, s.ang, 7.5); c.fill(); c.globalAlpha = 1; }
  c.save(); c.translate(41, 395); c.rotate(-Math.PI / 2); texto(c, 'ÓRBITA', 0, 0, 9, 'rgba(255,216,74,.75)', '800'); c.restore();

  c.save();
  c.translate(185, 496); c.rotate(-.04);
  c.save(); c.shadowColor = '#000'; c.shadowBlur = 4;
  texto(c, 'P I N B A L L', 0, -22, 9, 'rgba(255,255,255,.9)', '800');
  c.restore();
  c.font = 'italic 900 30px "Arial Black", "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const gt = c.createLinearGradient(0, -14, 0, 14); gt.addColorStop(0, '#fff3a0'); gt.addColorStop(.5, '#ffb627'); gt.addColorStop(1, '#ff5e1a');
  c.lineWidth = 5; c.strokeStyle = '#2a0b3a'; c.strokeText('GALÁXIA', 0, 4);
  c.fillStyle = gt; c.fillText('GALÁXIA', 0, 4);
  c.restore();

  const gb = c.createRadialGradient(BURACO.x, BURACO.y, 2, BURACO.x, BURACO.y, 20);
  gb.addColorStop(0, '#000'); gb.addColorStop(.55, '#000'); gb.addColorStop(.75, 'rgba(150,70,255,.7)'); gb.addColorStop(1, 'rgba(150,70,255,0)');
  c.fillStyle = gb; circulo(c, BURACO.x, BURACO.y, 20); c.fill();
  texto(c, 'BURACO NEGRO', BURACO.x - 2, BURACO.y - 27, 8, 'rgba(210,170,255,.9)', '800');

  for (let z = 0; z <= DZ; z++) {
    c.save(); c.translate(0, -z); caminho(c, BLOCO); c.closePath();
    if (z < DZ) c.fillStyle = '#1a1d24';
    else { const gbl = c.createLinearGradient(318, 0, 350, 0); gbl.addColorStop(0, '#4a5060'); gbl.addColorStop(1, '#1a1d24'); c.fillStyle = gbl; }
    c.fill(); c.restore();
  }

  for (const s of ESTILINGUES) {
    c.save(); c.translate(3, 4); caminho(c, [s.a, s.b, s.c]); c.closePath(); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill(); c.restore();
    for (let z = 0; z < 5; z++) { c.save(); c.translate(0, -z); caminho(c, [s.a, s.b, s.c]); c.closePath(); c.fillStyle = '#4a0820'; c.fill(); c.restore(); }
    c.save(); c.translate(0, -5);
    caminho(c, [s.a, s.b, s.c]); c.closePath();
    const ge = c.createLinearGradient(s.a[0], s.a[1], s.c[0], s.c[1]); ge.addColorStop(0, '#ff5f8a'); ge.addColorStop(1, '#8c0f3c');
    c.fillStyle = ge; c.fill();
    const cx = (s.a[0] + s.b[0] + s.c[0]) / 3, cy = (s.a[1] + s.b[1] + s.c[1]) / 3;
    c.fillStyle = 'rgba(255,255,255,.75)'; estrela(c, cx, cy, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; estrela(c, cx - (s.a[0] < 185 ? 2 : -2), cy - 14, 2.5); c.fill();
    c.restore();
  }
  const desenhaTrilho = (largura, cor, filtro) => {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = cor; c.lineWidth = largura;
    for (const p of paredes) if (filtro(p)) { c.beginPath(); c.moveTo(p.ax, p.ay); c.lineTo(p.bx, p.by); c.stroke(); }
  };
  const metal = p => p.tipo === 'trilho' || p.tipo === 'bloco';
  const borr = p => p.tipo === 'borracha';
  const emAltura = (z, fn) => { c.save(); c.translate(0, -z); fn(); c.restore(); };
  // sombras no chão
  c.save(); c.translate(2.5, 4); desenhaTrilho(9, 'rgba(0,0,0,.32)', p => metal(p) || borr(p) || p.tipo === 'poste'); c.restore();
  // lateral das paredes (a face que fica de frente para quem joga)
  for (let z = 0; z < DZ; z++) emAltura(z, () => desenhaTrilho(6.5, z === 0 ? '#0c0e13' : '#3a404c', metal));
  // topo cromado: escuro nas bordas, claro no meio e um fio de brilho
  emAltura(DZ, () => {
    desenhaTrilho(7, '#2a2e37', metal);
    desenhaTrilho(5.2, '#8d95a4', metal);
    desenhaTrilho(3.2, '#dfe4ec', metal);
    c.save(); c.translate(-.5, -.7); desenhaTrilho(1, '#ffffff', metal); c.restore();
  });
  // borrachas brancas dos estilingues, com altura
  for (let z = 0; z < 5; z++) emAltura(z, () => desenhaTrilho(6, '#2a2a2a', borr));
  emAltura(5, () => { desenhaTrilho(6.5, '#1a1a1a', borr); desenhaTrilho(4.5, '#f4f4f0', borr); });
  emAltura(DZ, () => { desenhaTrilho(3.6, '#5d6472', p => p.tipo === 'portao'); desenhaTrilho(2, '#e3e8f0', p => p.tipo === 'portao'); });
  // postes das trilhas do topo: cromados com borracha vermelha
  for (const p of paredes) if (p.tipo === 'poste') {
    c.lineCap = 'round';
    for (let z = 0; z < 6; z++) { c.strokeStyle = z ? '#7a1426' : '#0b0c10'; c.lineWidth = 9; c.beginPath(); c.moveTo(p.ax, p.ay - z); c.lineTo(p.bx, p.by - z); c.stroke(); }
    c.strokeStyle = '#0b0c10'; c.lineWidth = 9.5; c.beginPath(); c.moveTo(p.ax, p.ay - 6); c.lineTo(p.bx, p.by - 6); c.stroke();
    c.strokeStyle = '#d23a58'; c.lineWidth = 7.5; c.stroke();
    c.strokeStyle = '#c9ced8'; c.lineWidth = 3.4; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(p.ax - 1, p.ay - 5); c.lineTo(p.bx - 1, p.by - 7); c.stroke();
  }
  desenharSuportesTubo(c);
  c.fillStyle = 'rgba(125,255,178,.18)'; c.fillRect(82, 336, 34, 16);
  c.fillStyle = 'rgba(120,200,255,.18)'; c.fillRect(249, 344, 26, 16);
  c.restore();
  // borda do gabinete com friso cromado
  c.lineJoin = 'round';
  c.lineWidth = 5; c.strokeStyle = '#0d0905'; caminho(c, CONTORNO); c.stroke();
  c.lineWidth = 1.4; c.strokeStyle = 'rgba(220,226,236,.55)'; caminho(c, CONTORNO); c.stroke();
}

function desenharPlaneta(c, p) {
  if (p.anel) { c.save(); c.translate(p.x, p.y); c.rotate(-.35); c.scale(1, .32); c.strokeStyle = '#e8d9a0'; c.lineWidth = 4; circulo(c, 0, 0, p.r * 1.75); c.stroke(); c.restore(); }
  c.fillStyle = gradRadial(c, p.x, p.y, p.r, p.cor); circulo(c, p.x, p.y, p.r); c.fill();
  if (p.nome === 'Júpiter') {
    c.save(); circulo(c, p.x, p.y, p.r); c.clip(); c.strokeStyle = 'rgba(120,60,20,.45)'; c.lineWidth = 2;
    for (const dy of [-6, -1, 4, 9]) { c.beginPath(); c.moveTo(p.x - p.r, p.y + dy); c.lineTo(p.x + p.r, p.y + dy); c.stroke(); }
    c.restore();
  }
  if (p.anel) { c.save(); c.translate(p.x, p.y); c.rotate(-.35); c.scale(1, .32); c.strokeStyle = '#f6ebc0'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, p.r * 1.75, 0, Math.PI); c.stroke(); c.restore(); }
}

// linha paralela ao caminho de uma trilha, deslocada para o lado
function borda(T, desloc, ini = 0, fim = 1, i0 = 0, i1 = Infinity) {
  const pts = [];
  T.pts.forEach((p, i) => { const t = p.d / T.L; if (t < ini || t > fim || i < i0 || i > i1) return; pts.push([p.x - p.dy * desloc, p.y + p.dx * desloc]); });
  return pts;
}
// traço cromado: borda escura, corpo, reflexo claro e um fio de brilho
function cromado(c, pts, larg) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#15171d'; c.lineWidth = larg + 1.4; caminho(c, pts); c.stroke();
  c.strokeStyle = '#7d8594'; c.lineWidth = larg; caminho(c, pts); c.stroke();
  c.strokeStyle = '#e6eaf1'; c.lineWidth = larg * .5; caminho(c, pts); c.stroke();
  c.save(); c.translate(-.3, -.4); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(.5, larg * .18); caminho(c, pts); c.stroke(); c.restore();
}
function coluna(c, x0, y0, x1, y1) {
  c.lineCap = 'round';
  c.strokeStyle = '#2a2e37'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = '#b7beca'; c.lineWidth = 2.6; c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = .8; c.beginPath(); c.moveTo(x0 - .6, y0); c.lineTo(x1 - .6, y1); c.stroke();
  c.fillStyle = '#5d6472'; c.beginPath(); c.ellipse(x0, y0, 3.2, 1.8, 0, 0, DPI); c.fill();
}
// sombra do cano no chão e as colunas que seguram o looping (desenhadas por baixo da bola)
function desenharSuportesTubo(c) {
  const P = TUBO.pts;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.26)'; c.lineWidth = 17;
  c.beginPath(); P.forEach((p, i) => { const x = p.gx + 3 + p.z * .3, y = p.gy + 5 + p.z * .2; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  c.restore();
  const ida = TUBO.pts.findIndex(p => p.z >= 9.9);
  for (const i of [Math.round(ida * .45), ida, P.length - 14, P.length - 5]) { const p = P[i]; if (p) coluna(c, p.gx, p.gy + 4, p.x, p.y + 6); }
  // pilar do looping: sobe do chão até a parte de baixo da volta
  coluna(c, TUBO.CX, TUBO.CY + 12, TUBO.CX, TUBO.CY - 6);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(TUBO.CX + 5, TUBO.CY + 2, 30, 10, 0, 0, DPI); c.fill();
}

// cano de vidro do looping: desenhado por cima da bola, que aparece "dentro".
// Primeiro a parte de trás (subida), depois a da frente (descida e saída), para a volta ter profundidade.
function desenharTubo(c) {
  const T = TUBO, n = T.pts.length;
  const parte = (i0, i1) => {
    const pts = borda(T, 0, 0, 1, i0, i1);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(8,20,35,.5)'; c.lineWidth = 20; caminho(c, pts); c.stroke();
    c.strokeStyle = 'rgba(160,235,255,.16)'; c.lineWidth = 17; caminho(c, pts); c.stroke();
    c.strokeStyle = 'rgba(210,245,255,.7)'; c.lineWidth = 1.2;
    caminho(c, borda(T, -9, 0, 1, i0, i1)); c.stroke(); caminho(c, borda(T, 9, 0, 1, i0, i1)); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 2.2; caminho(c, borda(T, -5, 0, 1, i0, i1)); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; caminho(c, borda(T, 5.5, 0, 1, i0, i1)); c.stroke();
    // anéis cromados
    const d0 = T.pts[i0].d, d1 = T.pts[Math.min(n - 1, i1)].d;
    for (let d = Math.ceil(d0 / 26) * 26 + 6; d < Math.min(d1, T.L - 6); d += 26) {
      const p = pontoTrilha(T, d), a = Math.atan2(p.dy, p.dx);
      c.save(); c.translate(p.x, p.y); c.rotate(a);
      c.strokeStyle = '#1a1d24'; c.lineWidth = 3.4; c.beginPath(); c.ellipse(0, 0, 3.6, 10.5, 0, 0, DPI); c.stroke();
      c.strokeStyle = '#a9b0bd'; c.lineWidth = 2.2; c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = .9; c.beginPath(); c.ellipse(0, 0, 3.6, 10.5, 0, Math.PI * .95, Math.PI * 1.55); c.stroke();
      c.restore();
    }
  };
  parte(T.meio, n - 1);
  parte(0, T.meio);
  // boca do cano
  const p0 = T.pts[0];
  cromado(c, [[p0.x - p0.dy * 12, p0.y + p0.dx * 12], [p0.x + p0.dy * 12, p0.y - p0.dx * 12]], 3);
}


// ================= Peças novas: estação orbital, trilhos de arame, alienígena e luzes =================
// lâmpadas de iluminação geral (as amarelinhas ao longo das paredes)
const LAMPADAS = [];
for (let i = 5; i <= 43; i += 3) { const [x, y] = ARCO[i], dx = 200 - x, dy = 175 - y, l = Math.hypot(dx, dy); LAMPADAS.push([x + dx / l * 8, y + dy / l * 8]); }
LAMPADAS.push([70, 262], [70, 322], [70, 382], [54, 515], [54, 555], [316, 515], [316, 555], [312, 300], [306, 430], [116, 628], [254, 628]);
const FLASHES = [{ x: 46, y: 497, cor: '#ff3355' }, { x: 324, y: 497, cor: '#33a0ff' }, { x: 342, y: 300, cor: '#ff3355' }];

// trilho de arame genérico (rampa, descida, travessia): sombra, colunas, travessas e dois arames cromados
function desenharArame(c, T, acrilico) {
  c.save(); c.strokeStyle = 'rgba(0,0,0,.26)'; c.lineWidth = 17; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); T.pts.forEach((p, i) => { const z = p.zv || 0, x = p.x + 3 + z * .35, y = p.y + 4 + z * .6; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore();
  for (let d = 50; d < T.L - 30; d += 85) { const p = pontoTrilha(T, d); if ((p.zv || 0) > 5) coluna(c, p.x + p.zv * .2, p.y + 3 + p.zv * .6, p.x, p.y + 3); }
  if (acrilico) {
    const a = borda(T, -11, 0, .2), b = borda(T, 11, 0, .2).reverse();
    caminho(c, a.concat(b)); c.closePath(); c.fillStyle = 'rgba(110,200,255,.22)'; c.fill();
    c.strokeStyle = 'rgba(170,230,255,.6)'; c.lineWidth = 1.5; caminho(c, a); c.stroke(); caminho(c, b); c.stroke();
  }
  for (let d = 24; d < T.L - 8; d += 20) {
    const p = pontoTrilha(T, d);
    c.strokeStyle = '#30343e'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(p.x - p.dy * 9, p.y + p.dx * 9); c.lineTo(p.x + p.dy * 9, p.y - p.dx * 9); c.stroke();
    c.strokeStyle = '#b9c0cc'; c.lineWidth = 1.1; c.stroke();
  }
  for (const lado of [-8, 8]) cromado(c, borda(T, lado, .01, 1), 2.2);
}
function desenharRampa(c) {
  desenharArame(c, DESCIDA_LUA);
  desenharArame(c, RAMPA_LUA, true);
  desenharArame(c, TRAVESSIA);
  desenharArame(c, DESCIDA);
  desenharArame(c, RAMPA, true);
  const p0 = RAMPA.pts[0];
  cromado(c, [[p0.x - p0.dy * 12, p0.y + p0.dx * 12], [p0.x + p0.dy * 12, p0.y - p0.dx * 12]], 2.6);
  texto(c, 'ESTAÇÃO', p0.x, p0.y + 14, 7.5, 'rgba(170,230,255,.95)', '800');
}

// estação orbital: laje elevada, com piso roxo, paredes cromadas, ralo e buraco do hipersalto
const PISO_DECK = [...DECK, [334, 210], [306, 216]];
const PISO_LUA = [...LUA, [214, 150], [192, 160]];
function desenharLua(c) {
  c.save(); c.translate(8, 12); caminho(c, PISO_LUA); c.closePath(); c.fillStyle = 'rgba(0,0,0,.38)'; c.fill(); c.restore();
  coluna(c, 130, 140, 130, 124); coluna(c, 232, 140, 232, 124);
  for (let z = 9; z > 0; z--) { c.save(); c.translate(0, z); caminho(c, PISO_LUA); c.closePath(); c.fillStyle = z > 6 ? '#121318' : '#3a3e4a'; c.fill(); c.restore(); }
  caminho(c, PISO_LUA); c.closePath();
  const g = c.createLinearGradient(124, 50, 238, 160); g.addColorStop(0, 'rgba(170,176,190,.97)'); g.addColorStop(1, 'rgba(78,84,98,.97)');
  c.fillStyle = g; c.fill();
  c.save(); caminho(c, PISO_LUA); c.closePath(); c.clip();
  let sd = 7; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) {   // crateras pintadas
    const x = 128 + rnd() * 108, y = 56 + rnd() * 100, r = 2 + rnd() * 6;
    c.fillStyle = 'rgba(40,44,54,.35)'; circulo(c, x, y, r); c.fill();
    c.strokeStyle = 'rgba(230,234,244,.35)'; c.lineWidth = .8; c.beginPath(); c.arc(x, y, r, Math.PI * .9, Math.PI * 1.7); c.stroke();
  }
  for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(255,216,74,${.3 + k * .1})`; seta(c, 205 - k * 12, 130 - k * 10, -2.45, 5); c.fill(); }
  faixaPerigo(c, 168, 151, 24, 4);
  c.restore();
  texto(c, 'BASE LUNAR', 196, 112, 8, 'rgba(30,34,46,.85)', '900');
  c.fillStyle = '#05040c'; c.beginPath(); c.moveTo(169, 153); c.lineTo(193, 157); c.lineTo(195, 166); c.lineTo(171, 166); c.closePath(); c.fill();
  const gk = c.createRadialGradient(CRATERA.x, CRATERA.y, 1, CRATERA.x, CRATERA.y, 11); gk.addColorStop(0, '#000'); gk.addColorStop(.7, '#0a0b10'); gk.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gk; circulo(c, CRATERA.x, CRATERA.y, 11); c.fill();
  cromado(c, (() => { const p = []; for (let a = 0; a <= DPI + .01; a += .3) p.push([CRATERA.x + Math.cos(a) * 10, CRATERA.y + Math.sin(a) * 10]); return p; })(), 1.8);
  texto(c, 'CRATERA', CRATERA.x + 2, CRATERA.y + 18, 6, 'rgba(20,24,34,.9)', '900');
  for (const p of paredes) if (p.tipo === 'luaposte') {
    c.lineCap = 'round';
    for (let z = 0; z < 5; z++) { c.strokeStyle = z ? '#3a404c' : '#0b0c10'; c.lineWidth = 7; c.beginPath(); c.moveTo(p.ax, p.ay - z); c.lineTo(p.bx, p.by - z); c.stroke(); }
    c.strokeStyle = '#2a2e37'; c.lineWidth = 7.5; c.beginPath(); c.moveTo(p.ax, p.ay - 5); c.lineTo(p.bx, p.by - 5); c.stroke();
    c.strokeStyle = '#c9ced8'; c.lineWidth = 4.5; c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.ax - .8, p.ay - 5); c.lineTo(p.bx - .8, p.by - 5); c.stroke();
  }
}
function desenharDeck(c) {
  desenharLua(c);
  c.save(); c.translate(8, 12); caminho(c, PISO_DECK); c.closePath(); c.fillStyle = 'rgba(0,0,0,.38)'; c.fill(); c.restore();
  coluna(c, 268, 216, 268, 196); coluna(c, 344, 214, 344, 196); coluna(c, 266, 112, 266, 100);
  for (let z = 9; z > 0; z--) { c.save(); c.translate(0, z); caminho(c, PISO_DECK); c.closePath(); c.fillStyle = z > 6 ? '#0c0a1a' : '#2a2150'; c.fill(); c.restore(); }
  caminho(c, PISO_DECK); c.closePath();
  const g = c.createLinearGradient(264, 60, 348, 216); g.addColorStop(0, 'rgba(70,52,150,.95)'); g.addColorStop(1, 'rgba(26,18,70,.95)');
  c.fillStyle = g; c.fill();
  c.save(); caminho(c, PISO_DECK); c.closePath(); c.clip();
  c.strokeStyle = 'rgba(140,200,255,.13)'; c.lineWidth = .8;
  for (let x = 262; x < 350; x += 10) { c.beginPath(); c.moveTo(x, 55); c.lineTo(x, 220); c.stroke(); }
  for (let y = 60; y < 220; y += 10) { c.beginPath(); c.moveTo(260, y); c.lineTo(350, y); c.stroke(); }
  // emblema em volta do cogumelo da estação
  for (const [r, a] of [[24, .5], [30, .25]]) { c.strokeStyle = `rgba(255,190,80,${a})`; c.lineWidth = 2; circulo(c, 306, 142, r); c.stroke(); }
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.fillStyle = 'rgba(255,190,80,.45)'; seta(c, 306 + Math.cos(a) * 36, 142 + Math.sin(a) * 36, a, 4); c.fill(); }
  for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(127,227,255,${.25 + k * .1})`; seta(c, 316 - k * 12, 184 - k * 12, -2.3, 5); c.fill(); }
  faixaPerigo(c, 280, 205, 26, 4);
  c.restore();
  texto(c, 'ESTAÇÃO', 300, 80, 7, 'rgba(255,220,140,.95)', '900'); texto(c, 'ORBITAL', 300, 89, 6, 'rgba(255,220,140,.8)', '900');
  // ralo (a bola cai e desce pelo arame)
  c.fillStyle = '#05040c'; c.beginPath(); c.moveTo(281, 209); c.lineTo(306, 213); c.lineTo(308, 222); c.lineTo(284, 222); c.closePath(); c.fill();
  // buraco do hipersalto
  const gk = c.createRadialGradient(KICKER.x, KICKER.y, 1, KICKER.x, KICKER.y, 11); gk.addColorStop(0, '#000'); gk.addColorStop(.7, '#05070f'); gk.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gk; circulo(c, KICKER.x, KICKER.y, 11); c.fill();
  cromado(c, (() => { const p = []; for (let a = 0; a <= DPI + .01; a += .3) p.push([KICKER.x + Math.cos(a) * 10, KICKER.y + Math.sin(a) * 10]); return p; })(), 1.8);
  texto(c, 'HIPER', KICKER.x - 2, KICKER.y + 19, 6.5, 'rgba(127,227,255,.95)', '900');
  for (const a of ALVOS_DECK) { c.fillStyle = '#0b0a14'; c.fillRect(a.ax - 5, a.ay - 2, 6, a.by - a.ay + 4); }
  // paredes cromadas da estação, com altura
  const segs = paredes.filter(p => p.tipo === 'deck');
  const tr = (w, cor) => { c.lineCap = 'round'; c.strokeStyle = cor; c.lineWidth = w; for (const p of segs) { c.beginPath(); c.moveTo(p.ax, p.ay); c.lineTo(p.bx, p.by); c.stroke(); } };
  for (let z = 0; z < DZ; z++) { c.save(); c.translate(0, -z); tr(6, z ? '#3a404c' : '#0c0e13'); c.restore(); }
  c.save(); c.translate(0, -DZ); tr(6.5, '#2a2e37'); tr(4.8, '#8d95a4'); tr(2.8, '#e6eaf1'); c.translate(-.4, -.6); tr(.9, '#ffffff'); c.restore();
}

// ----- Alienígena: figura em pé no meio dos cogumelos -----
function desenharAlien() {
  const A = ALIEN, t = A.t;
  // anel de vida no chão
  const n = 10, acesas = A.morto ? 0 : Math.ceil(A.vida / A.max * n);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * DPI / n, lx = A.x + Math.cos(a) * 30, ly = A.y + Math.sin(a) * 30;
    if (i < acesas) brilho(lx, ly, 3, A.vida <= 2 && Math.floor(relogio * 6) % 2 ? '#ffd23a' : '#ff3030');
  }
  if (A.morto) { desenharOvo(); return; }
  const raiva = 1 - A.vida / A.max, fl = A.flash > 0 ? A.flash / .3 : 0;
  const sh = fl ? aleat(-2.5, 2.5) * fl : 0;
  const resp = Math.sin(t * (2.2 + raiva * 3)), boca = A.segurando ? 1.6 : .4 + .4 * Math.sin(t * 2.6) + fl * .8;
  const pele = fl ? ['#c8ffd0', '#4c9a5c', '#14301a'] : ['#6f8a78', '#1c2a22', '#040706'];
  halo(A.x, A.y - 45, 60, raiva > .5 ? '#ff3a3a' : '#5dff7a', .14 + .15 * raiva + fl * .4);
  const EA = 1.3;
  ctx.save(); ctx.translate(A.x + sh, A.y + 2); ctx.scale(EA, EA * esticar(A.y));
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(5, 2, 24, 7, 0, 0, DPI); ctx.fill();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // cauda com ferrão
  const ca = Math.sin(t * 1.7) * 5;
  ctx.strokeStyle = pele[2]; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(3, -12); ctx.quadraticCurveTo(26, -10 + ca, 28, 4 + ca * .5); ctx.stroke();
  ctx.strokeStyle = pele[1]; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.fillStyle = '#c9d6c0'; ctx.beginPath(); ctx.moveTo(28, 4 + ca * .5); ctx.lineTo(34, 2 + ca * .5); ctx.lineTo(29, 9 + ca * .5); ctx.fill();
  // pernas
  for (const s of [-1, 1]) {
    ctx.strokeStyle = pele[2]; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(s * 6, -16); ctx.lineTo(s * 14, -8); ctx.lineTo(s * 10, 0); ctx.stroke();
    ctx.strokeStyle = pele[1]; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = '#d8e2d0'; ctx.lineWidth = 1.4; ctx.beginPath(); for (const dx of [-5, 0, 5]) { ctx.moveTo(s * 10, 0); ctx.lineTo(s * 10 + dx, 3); } ctx.stroke();
  }
  // tronco com costelas
  const gt = ctx.createLinearGradient(-12, 0, 12, 0); gt.addColorStop(0, pele[2]); gt.addColorStop(.35, pele[0]); gt.addColorStop(1, pele[2]);
  ctx.fillStyle = gt; ctx.beginPath();
  ctx.moveTo(-9, -14); ctx.bezierCurveTo(-13, -24, -14, -34, -7, -42 - resp); ctx.lineTo(7, -42 - resp); ctx.bezierCurveTo(14, -34, 13, -24, 9, -14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(160,230,170,.45)'; ctx.lineWidth = 1.1;
  for (const y of [-19, -24, -29, -34]) { ctx.beginPath(); ctx.moveTo(-9, y); ctx.quadraticCurveTo(0, y + 3, 9, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -40); ctx.stroke();
  // espinhos dos ombros
  ctx.fillStyle = '#c9d6c0';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 7, -41); ctx.lineTo(s * 20, -54 - resp); ctx.lineTo(s * 12, -38); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(s * 11, -38); ctx.lineTo(s * 22, -44); ctx.lineTo(s * 13, -35); ctx.fill(); }
  // braços erguidos com garras
  for (const s of [-1, 1]) {
    const bal = Math.sin(t * 2.4 + (s > 0 ? 1.3 : 0)) * 3 + fl * 6 * s;
    const seg = !!A.segurando, ox = s * 10, oy = -37, cx = seg ? s * 21 : s * 25, cy = seg ? -30 : -28 + bal, mx = seg ? s * 8 : s * 27, my = seg ? -43 + Math.sin(t * 30) : -48 + bal;
    ctx.strokeStyle = pele[2]; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = pele[1]; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.strokeStyle = '#e8eedf'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const [dx, dy] of [[-4, -7], [0, -9], [4, -7]]) { ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + s * dx * .3 + dx * .5, my + dy * .6, mx + dx * (s > 0 ? 1 : -1) + s * 2, my + dy); }
    ctx.stroke();
  }
  // cabeça
  ctx.save(); ctx.translate(0, -resp * .6);
  const gc = ctx.createRadialGradient(-4, -58, 2, 0, -53, 14); gc.addColorStop(0, pele[0]); gc.addColorStop(.6, pele[1]); gc.addColorStop(1, pele[2]);
  ctx.fillStyle = gc; ctx.beginPath(); ctx.ellipse(0, -54, 11.5, 10.5, 0, 0, DPI); ctx.fill();
  ctx.fillStyle = '#b8c8b0';   // crista de espinhos
  for (const [x0, x1, y1] of [[-9, -12, -68], [-4, -4, -72], [3, 4, -72], [8, 12, -68]]) { ctx.beginPath(); ctx.moveTo(x0, -60); ctx.lineTo(x1, y1); ctx.lineTo(x0 + 4, -61); ctx.fill(); }
  // mandíbulas laterais
  ctx.strokeStyle = pele[2]; ctx.lineWidth = 3.2;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 9, -50); ctx.quadraticCurveTo(s * 12, -42, s * 4, -38 - boca); ctx.stroke(); }
  ctx.strokeStyle = '#e8eedf'; ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -39 - boca); ctx.lineTo(s * 3, -36 - boca); ctx.stroke(); }
  // boca aberta com dentes
  ctx.fillStyle = '#3a040c'; ctx.beginPath(); ctx.ellipse(0, -46, 5.5, 2.4 + boca * 2.4, 0, 0, DPI); ctx.fill();
  ctx.fillStyle = '#f4f0dc';
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath(); ctx.moveTo(k * 2 - 1, -46 - 2.2 - boca * 2.2); ctx.lineTo(k * 2 + 1, -46 - 2.2 - boca * 2.2); ctx.lineTo(k * 2, -46 - boca * .6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(k * 2 - 1, -46 + 2.2 + boca * 2.2); ctx.lineTo(k * 2 + 1, -46 + 2.2 + boca * 2.2); ctx.lineTo(k * 2, -46 + boca * .6); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(160,255,80,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -44 + boca); ctx.quadraticCurveTo(3, -38, 2.5, -33 + Math.sin(t * 3) * 2); ctx.stroke();
  // quatro olhos brilhando
  const olho = raiva > .5 || fl ? '#ff2020' : '#ff6a1a';
  for (const [x, y, r] of [[-4.5, -57, 2.4], [4.5, -57, 2.4], [-8, -52.5, 1.6], [8, -52.5, 1.6]]) {
    ctx.fillStyle = olho; ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * .8, x < 0 ? .4 : -.4, 0, DPI); ctx.fill();
    ctx.fillStyle = '#fff6c0'; circulo(ctx, x - .3, y - .3, r * .35); ctx.fill();
  }
  // brilho da pele molhada
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-5, -60, 4, 1.8, -.5, 0, DPI); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(170,255,190,.22)'; ctx.beginPath(); ctx.ellipse(-6, -30, 1.6, 7, .15, 0, DPI); ctx.fill();
  ctx.fillStyle = 'rgba(140,255,90,.55)'; for (const [x, y, l] of [[-8, -20, 5], [7, -26, 4], [-3, -14, 6]]) { ctx.beginPath(); ctx.ellipse(x, y + l / 2, .8, l / 2 + Math.sin(t * 2 + x) * .8, 0, 0, DPI); ctx.fill(); }
  ctx.restore();
  for (const [x, y] of [[-4.5, -57], [4.5, -57]]) halo(A.x + x * 1.3, A.y + 2 + (y - resp * .6) * 1.3 * esticar(A.y), 9, olho, .6);
}
function desenharOvo() {
  const A = ALIEN, falta = A.renasce - relogio, treme = falta < 2.5 ? Math.sin(relogio * 40) * (2.5 - falta) : 0;
  const pul = .5 + .5 * Math.sin(relogio * 4);
  halo(A.x, A.y - 10, 30, '#5dff7a', .2 + .25 * pul);
  ctx.save(); ctx.translate(A.x + treme * .6, A.y); ctx.scale(1, esticar(A.y)); ctx.rotate(treme * .02);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(3, 1, 13, 4, 0, 0, DPI); ctx.fill();
  const g = ctx.createRadialGradient(-3, -16, 1, 0, -11, 13); g.addColorStop(0, '#a89a70'); g.addColorStop(.6, '#5a4a30'); g.addColorStop(1, '#241a10');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -11, 9.5, 12, 0, 0, DPI); ctx.fill();
  ctx.strokeStyle = 'rgba(30,20,10,.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(6, -20); ctx.moveTo(0, -23); ctx.lineTo(0, -17); ctx.stroke();
  ctx.strokeStyle = `rgba(120,255,110,${.3 + .4 * pul})`; ctx.lineWidth = .8;
  for (const [a, b] of [[-7, -4], [6, -8], [-3, -2]]) { ctx.beginPath(); ctx.moveTo(a, -2); ctx.quadraticCurveTo(a + 2, -10, b, -16); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(93,255,122,.7)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(A.x, A.y, 22, -Math.PI / 2, -Math.PI / 2 + DPI * (1 - Math.max(0, falta) / 14)); ctx.stroke();
}

// peças da estação que mudam: alvos, buraco, cogumelo pequeno
function desenharDeckVivo(piscaOn) {
  for (const a of ALVOS_DECK) {
    const on = a.aceso || a.flash > 0;
    ctx.lineCap = 'butt';
    for (let z = 0; z <= 4; z++) { ctx.strokeStyle = z < 4 ? '#6a5a10' : '#2a2408'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.ax, a.ay - z); ctx.lineTo(a.bx, a.by - z); ctx.stroke(); }
    ctx.strokeStyle = on ? '#fff3a0' : '#e0b820'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a.ax, a.ay - 5); ctx.lineTo(a.bx, a.by - 5); ctx.stroke();
    if (on) halo(a.ax, (a.ay + a.by) / 2 - 5, 14, '#ffe27a', .7);
    brilhoOuApagado(a.ax + 14, (a.ay + a.by) / 2, 3, '#ffe27a', a.aceso);
  }
  for (const l of LUZES) if (l.deck) brilhoOuApagado(l.x, l.y, l.r, l.cor, l.on() || (show > 0 && piscaOn));
  if (j.cratera && piscaOn) { halo(CRATERA.x, CRATERA.y, 24, '#ffffff', .7); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; circulo(ctx, CRATERA.x, CRATERA.y, 13); ctx.stroke(); }
  if (j.hiper && piscaOn) { halo(KICKER.x, KICKER.y, 26, '#7fe3ff', .8); ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 2; circulo(ctx, KICKER.x, KICKER.y, 13); ctx.stroke(); }
}
function brilhoOuApagado(x, y, r, cor, on) {
  if (on) brilho(x, y, r, cor);
  else { ctx.fillStyle = cor; ctx.globalAlpha = .22; circulo(ctx, x, y, r); ctx.fill(); ctx.globalAlpha = 1; }
}
// cogumelo (cilindro cromado com tampa colorida)
function desenharCogumelo(b, missaoCog, piscaOn) {
  const aceso = b.flash > 0, HB = b.r > 14 ? 7 : 5, desce = aceso ? 2 : 0, topo = b.y - HB + desce;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; circulo(ctx, b.x + 4, b.y + 5, b.r + 1); ctx.fill();
  const gc = ctx.createLinearGradient(b.x - b.r, 0, b.x + b.r, 0);
  gc.addColorStop(0, '#3b414c'); gc.addColorStop(.3, '#f4f6fa'); gc.addColorStop(.55, '#8c93a0'); gc.addColorStop(.85, '#c9ced8'); gc.addColorStop(1, '#2c313a');
  ctx.fillStyle = gc; circulo(ctx, b.x, b.y, b.r); ctx.fill();
  ctx.fillRect(b.x - b.r, topo, b.r * 2, b.y - topo);
  ctx.strokeStyle = 'rgba(20,22,28,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#eceef2'; circulo(ctx, b.x, topo, b.r); ctx.fill();
  ctx.strokeStyle = '#9aa0ab'; ctx.lineWidth = .8; ctx.stroke();
  if (aceso || (missaoCog && piscaOn)) halo(b.x, topo, b.r * 2.4, b.cor[1], .8);
  const ri = b.r * .78;
  ctx.fillStyle = gradRadial(ctx, b.x, topo - 1, ri, aceso ? ['#ffffff', b.cor[0], b.cor[1]] : [b.cor[0], b.cor[1], b.cor[2]]);
  circulo(ctx, b.x, topo - 1, ri); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(b.x - b.r * .26, topo - b.r * .32, b.r * .26, b.r * .13, -.4, 0, DPI); ctx.fill();
  ctx.fillStyle = aceso ? '#fff' : 'rgba(255,255,255,.6)';
  ctx.font = `900 ${Math.round(b.r * .63)}px "Arial Black", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', b.x, topo);
}
// luzes gerais, flashes e setas triplas
function desenharLuzesGerais(piscaOn, atracao) {
  if (efeitos()) {
    const forte = gi > .2 || show > 0;
    LAMPADAS.forEach(([x, y], i) => {
      const a = forte ? ((i + Math.floor(relogio * 12)) % 3 === 0 ? .9 : .25) : .32 + .06 * Math.sin(relogio * 3 + i);
      halo(x, y, 9, '#ffd89a', a);
    });
  }
  for (const f of FLASHES) {
    const on = gi > .25 || (show > 0 && Math.floor(relogio * 10) % 2 === 0);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; circulo(ctx, f.x + 2, f.y + 3, 6.5); ctx.fill();
    ctx.fillStyle = gradRadial(ctx, f.x, f.y - 3, 6, on ? ['#ffffff', f.cor, f.cor] : ['rgba(255,255,255,.6)', f.cor, '#200810']);
    ctx.beginPath(); ctx.ellipse(f.x, f.y - 2, 6, 7 * esticar(f.y) * .8, 0, 0, DPI); ctx.fill();
    if (on) halo(f.x, f.y - 3, 40, f.cor, .8);
  }
  // estrela do centro: golpes no alien (3 = ele agarra a bola)
  for (let k = 0; k < GOLPES_AGARRA; k++) if (k < ALIEN.golpes || ALIEN.segurando) brilho(CENTRO.x - 15 + k * 10, CENTRO.y, 4, '#ff6a2a');
  if (ALIEN.golpes === GOLPES_AGARRA - 1 || ALIEN.segurando || atracao)
    for (let k = 0; k < 16; k++) if ((k + Math.floor(relogio * 16)) % 4 === 0) { const a = k * DPI / 16, r = k % 2 ? 16 : 22; brilho(CENTRO.x + Math.cos(a) * r, CENTRO.y + Math.sin(a) * r, 1.8, '#9dff3a'); }
  // trilhas de luzes
  for (const cm of CAMINHOS) {
    const ativa = j.estado !== 'fim' && (cm.ev === 'lancar' ? j.estado === 'pronto' : missaoAtual() === cm.ev || (cm.ev === 'rampa' && j.jackpot) || (cm.ev === 'buraco' && (j.trava || j.extraAcesa)) || (cm.ev === 'alien' && ALIEN.golpes === GOLPES_AGARRA - 1) || (cm.ev === 'lua' && j.cratera));
    const n = cm.pts.length, passo = Math.floor(relogio * (ativa ? 14 : 5));
    cm.pts.forEach(([x, y], i) => {
      let on = atracao ? (i + passo) % 3 === 0 : ativa ? (passo - i) % 4 === 0 || (passo - i) % 4 === 1 : (passo - i) % (n + 6) === 0;
      if (on) brilho(x, y, 2.4, cm.cor);
    });
  }
  for (const s of SETAS) {
    const ativa = j.estado !== 'fim' && ((missaoAtual() === s.ev) || (s.ev === 'rampa' && j.jackpot) || (s.ev === 'buraco' && (j.trava || j.extraAcesa)) || (s.ev === 'alien' && ALIEN.golpes === GOLPES_AGARRA - 1));
    for (let k = 0; k < 3; k++) {
      const x = s.x - Math.cos(s.ang) * k * 10, y = s.y - Math.sin(s.ang) * k * 10;
      const on = atracao ? (k + Math.floor(relogio * 9)) % 3 === 0 : ativa && (2 - k) === Math.floor(relogio * 8) % 3;
      if (on) { halo(x, y, 13, s.cor, .55); ctx.fillStyle = s.cor; seta(ctx, x, y, s.ang, 7.5); ctx.fill(); }
    }
  }
}
const LEDS = [[RAMPA, '#7fe3ff'], [DESCIDA, '#7fe3ff'], [TRAVESSIA, '#ffd84a'], [RAMPA_LUA, '#e6ecff'], [DESCIDA_LUA, '#e6ecff'], [TUBO, '#7dffb2']].map(([T, cor]) => {
  const pts = []; for (let d = 14; d < T.L - 8; d += 24) { const p = pontoTrilha(T, d); pts.push([p.x + p.dy * 10.5, p.y - p.dx * 10.5]); }
  return { T, cor, pts };
});
function desenharLeds() {
  for (const L of LEDS) {
    const recente = relogio - brilhoTrilha[L.T.nome] < 1.2, rapido = recente || show > 0, n = L.pts.length;
    const passo = Math.floor(relogio * (rapido ? 22 : 6));
    L.pts.forEach(([x, y], i) => {
      const on = rapido ? (passo - i) % 3 === 0 : (passo - i) % 7 === 0;
      if (on) { if (efeitos()) halo(x, y, 6, L.cor, .7); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - .9, y - .9, 1.8, 1.8); }
      else { ctx.fillStyle = L.cor; ctx.globalAlpha = .35; ctx.fillRect(x - .7, y - .7, 1.4, 1.4); ctx.globalAlpha = 1; }
    });
  }
}
// estilingues com mola: a borracha estica para dentro, a mola encolhe e tudo volta balançando
function desenharEstilingues() {
  for (const s of ESTILINGUES) {
    const [ax, ay] = s.a, [cx, cy] = s.c, [bx, by] = s.b;
    const L = Math.hypot(cx - ax, cy - ay); let nx = -(cy - ay) / L, ny = (cx - ax) / L;
    if (nx * (bx - ax) + ny * (by - ay) > 0) { nx = -nx; ny = -ny; }   // normal para fora (lado da mesa)
    const tm = relogio - s.mola, tt = relogio - s.toque;
    let curva = 0;
    if (tm < .5) curva += -6 * Math.exp(-tm * 9) * Math.cos(tm * 42);          // batida forte: afunda e volta balançando
    if (tt < .3) curva += -2.2 * (s.forca || .3) * Math.exp(-tt * 14) * Math.cos(tt * 50);   // só encostou: treme
    const mx = (ax + cx) / 2, my = (ay + cy) / 2, Z = 5;
    const qx = mx + nx * curva * 2, qy = my + ny * curva * 2 - Z;
    // mola: do miolo do estilingue até o meio da borracha
    const ix = mx - nx * 13, iy = my - ny * 13 - Z, ex = mx + nx * (curva - 1.5), ey = my + ny * (curva - 1.5) - Z;
    const voltas = 6, px = -ny, py = nx;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a2e37'; ctx.lineWidth = 2.6; ctx.beginPath();
    for (let k = 0; k <= voltas * 2; k++) { const t = k / (voltas * 2), w = k % 2 ? 3.2 : -3.2, x = ix + (ex - ix) * t + px * (k && k < voltas * 2 ? w : 0), y = iy + (ey - iy) * t + py * (k && k < voltas * 2 ? w : 0); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.strokeStyle = '#d6dce6'; ctx.lineWidth = 1.3; ctx.stroke();
    // braço de metal que empurra a borracha
    ctx.strokeStyle = '#8d95a4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx + px * 9 + nx * (curva - 2.5), my + py * 9 + ny * (curva - 2.5) - Z); ctx.lineTo(mx - px * 9 + nx * (curva - 2.5), my - py * 9 + ny * (curva - 2.5) - Z); ctx.stroke();
    // borracha branca (com a curva)
    const aceso = s.flash > 0 || tt < .12;
    for (let z = 0; z < Z; z++) { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ax, ay - z); ctx.quadraticCurveTo(qx, qy + Z - z, cx, cy - z); ctx.stroke(); }
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(ax, ay - Z); ctx.quadraticCurveTo(qx, qy, cx, cy - Z); ctx.stroke();
    ctx.strokeStyle = aceso ? '#ffffff' : '#f4f4f0'; ctx.lineWidth = 4.5; ctx.stroke();
    if (aceso) {
      const g = s.flash > 0 ? 1 : .45;
      halo(mx, my - Z, 46 * g, '#ff7aa8', .8 * g);
      ctx.save(); ctx.translate(0, -Z); caminho(ctx, [s.a, s.b, s.c]); ctx.closePath(); ctx.fillStyle = `rgba(255,220,235,${.45 * g})`; ctx.fill(); ctx.restore();
      if (tt < .12 && s.tx) halo(s.tx, s.ty - Z, 12, '#ffffff', .9);
    }
  }
}
// plásticos coloridos por cima (frente)
function plastico(c, pts, cor, borda) {
  caminho(c, pts); c.closePath(); c.fillStyle = cor; c.fill();
  c.strokeStyle = borda; c.lineWidth = 1.4; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(pts[0][0] + 2, pts[0][1] + 2); c.lineTo(pts[1][0] - 2, pts[1][1] + 2); c.lineTo(pts[1][0] - 4, pts[1][1] + 4); c.closePath(); c.fill();
  for (const [x, y] of [pts[0], pts[Math.floor(pts.length / 2)]]) {
    const cx = x + (pts[2][0] - x) * .15, cy = y + (pts[2][1] - y) * .15;
    c.fillStyle = gradRadial(c, cx, cy, 1.8, ['#ffffff', '#9aa1ad', '#3a3f49']); circulo(c, cx, cy, 1.8); c.fill();
  }
}

function desenharFrente(c) {
  plastico(c, [[36, 492], [80, 492], [80, 506], [60, 512], [36, 506]], 'rgba(230,40,80,.55)', 'rgba(255,190,200,.8)');
  plastico(c, [[290, 492], [334, 492], [334, 506], [310, 512], [290, 506]], 'rgba(40,120,240,.55)', 'rgba(180,220,255,.8)');
  plastico(c, [[328, 288], [352, 288], [352, 312], [334, 318]], 'rgba(230,40,80,.5)', 'rgba(255,190,200,.8)');
  plastico(c, [[54, 236], [72, 236], [72, 254], [54, 254]], 'rgba(40,120,240,.5)', 'rgba(180,220,255,.8)');
  for (const pts of [[[20, 686], [140, 700], [160, 770], [20, 770]], [[350, 686], [230, 700], [210, 770], [350, 770]]]) {
    caminho(c, pts); c.closePath();
    const g = c.createLinearGradient(0, 686, 0, 740); g.addColorStop(0, '#3a4150'); g.addColorStop(1, '#151820');
    c.fillStyle = g; c.fill();
    c.strokeStyle = '#c9ced8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
  }
  texto(c, `${totalBolas} BOLAS POR JOGO`, 72, 718, 6.5, 'rgba(255,210,120,.8)');
  texto(c, 'BOLA EXTRA', 296, 712, 6.5, 'rgba(255,210,120,.8)');
  texto(c, '750.000 PONTOS', 296, 722, 6.5, 'rgba(255,210,120,.8)');
  c.save(); caminho(c, CONTORNO); c.closePath(); c.clip();
  const gv = c.createLinearGradient(0, 0, W, H * .7);
  gv.addColorStop(0, 'rgba(255,255,255,.07)'); gv.addColorStop(.35, 'rgba(255,255,255,0)'); gv.addColorStop(.36, 'rgba(255,255,255,.03)'); gv.addColorStop(.5, 'rgba(255,255,255,0)');
  c.fillStyle = gv; c.fillRect(0, 0, W, H);
  c.restore();
}

function ajustarTamanho() {
  const w = mesa.clientWidth, h = mesa.clientHeight;
  if (!w || !h) return;
  // a mesa inclinada ocupa menos altura na tela: cabe maior. Procura o ângulo que melhor enche o espaço.
  const altura = a => H * Math.cos(a) * PERSP / (PERSP + H * Math.sin(a));
  const alvo = (h / w) * W;   // altura que a mesa teria usando toda a largura
  ANG = ANG_MAX;
  while (ANG > ANG_MIN && altura(ANG) < alvo * .97) ANG -= Math.PI / 360;
  SEN = Math.sin(ANG); COS = Math.cos(ANG);
  const altVis = altura(ANG);
  escala = Math.min(w / W, h / altVis) * .96;
  dpr = Math.min(window.devicePixelRatio || 1, efeitos() ? dprMax : Math.min(dprMax, 1.5));
  const cw = W * escala, ch = H * escala, baixo = (h + altVis * escala) / 2;
  Object.assign(tela.style, { width: cw + 'px', height: ch + 'px', left: (w - cw) / 2 + 'px', top: (baixo - ch) + 'px',
    transform: `perspective(${PERSP * escala}px) rotateX(${ANG}rad)` });
  Object.assign(vis, { ox: w / 2, oy: baixo, e: escala, pe: PERSP * escala });
  hudDpr = Math.min(window.devicePixelRatio || 1, 2); hudW = w; hudH = h;
  hud.width = Math.round(w * hudDpr); hud.height = Math.round(h * hudDpr);
  for (const cv of [tela, fundo, frente, camRampa, camTubo, camDeck]) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  for (const [cv, fn] of [[fundo, desenharFundo], [frente, desenharFrente], [camRampa, desenharRampa], [camTubo, desenharTubo], [camDeck, desenharDeck]]) {
    const c = cv.getContext('2d'); c.setTransform(escala * dpr, 0, 0, escala * dpr, 0, 0); fn(c);
  }
}
new ResizeObserver(ajustarTamanho).observe(mesa);

// brilho das luzes: imagens prontas, para não pesar no celular
const sprites = new Map();
function spriteBrilho(cor) {
  if (!sprites.has(cor)) {
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    sprites.set(cor, s);
  }
  return sprites.get(cor);
}
function halo(x, y, r, cor, alfa = .55) {
  if (!efeitos()) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alfa;
  ctx.drawImage(spriteBrilho(cor), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function brilho(x, y, r, cor, estrelada) {
  halo(x, y, r * 2.6, cor);
  ctx.fillStyle = gradRadial(ctx, x, y, r, ['#ffffff', cor, cor]);
  if (estrelada) estrela(ctx, x, y, r + 2); else circulo(ctx, x, y, r);
  ctx.fill();
}

function desenharBola(b, x, y) {
  let r = R, z = 3, alt = 0;
  if (b.trilha) { alt = Math.max(0, b.trilha.h); r = R * (1 + (b.trilha.z || 0) / 55); }
  if (b.presa && b.destino !== 'alien') { const resta = b.presa - relogio; r = R * Math.max(.15, Math.min(1, (resta - 1) / .6, 1 - resta / .2)); }
  const vel = Math.hypot(b.vx, b.vy);
  if (efeitos()) {
    b.rastro.push([x, y - z]); if (b.rastro.length > 6) b.rastro.shift();
    if (vel > 700 && !b.presa) {
      ctx.lineCap = 'round';
      const n = b.rastro.length, f = Math.min(1, (vel - 700) / 1200);
      for (let i = 1; i < n; i++) {
        ctx.strokeStyle = `rgba(205,215,240,${.16 * f * i / n})`; ctx.lineWidth = r * 1.9 * i / n;
        ctx.beginPath(); ctx.moveTo(...b.rastro[i - 1]); ctx.lineTo(...b.rastro[i]); ctx.stroke();
      }
    }
  }
  // sombra no chão (no cano, a sombra cai mais longe)
  const zc = b.trilha ? (b.trilha.z || 0) : 0;
  const sx = 2 + (x - 185) / 70 + alt * 7 + zc * .3, sy = 3 + (y + 100) / 260 + alt * 6 + zc * (KZ + .25);
  ctx.fillStyle = `rgba(0,0,0,${.45 - alt * .15})`; ctx.beginPath(); ctx.ellipse(x + sx, y + sy, r * 1.02, r * .92, 0, 0, DPI); ctx.fill();
  const k = esticar(y);
  ctx.save(); ctx.translate(x, y - z); ctx.scale(1, k);
  // bola cromada: reflete o "céu" claro em cima, uma linha de horizonte escura no meio e a mesa roxa embaixo
  const g = ctx.createLinearGradient(-r * .3, -r, r * .3, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.24, '#dfe5ef'); g.addColorStop(.42, '#8d96a8'); g.addColorStop(.49, '#262a35');
  g.addColorStop(.55, '#4a4170'); g.addColorStop(.75, '#9d97c4'); g.addColorStop(.92, '#4b4566'); g.addColorStop(1, '#1d1a2b');
  ctx.fillStyle = g; circulo(ctx, 0, 0, r); ctx.fill();
  // borda escurecida: dá o volume de esfera
  const g2 = ctx.createRadialGradient(-r * .25, -r * .3, r * .2, 0, 0, r);
  g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.72, 'rgba(0,0,0,.06)'); g2.addColorStop(1, 'rgba(4,5,12,.78)');
  ctx.fillStyle = g2; circulo(ctx, 0, 0, r); ctx.fill();
  // reflexo das luzes de cima (duas "janelas" e um ponto forte)
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath(); ctx.ellipse(-r * .34, -r * .46, r * .3, r * .17, -.55, 0, DPI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.ellipse(r * .2, -r * .58, r * .14, r * .08, .4, 0, DPI); ctx.fill();
  ctx.fillStyle = '#ffffff'; circulo(ctx, -r * .42, -r * .5, r * .09); ctx.fill();
  // luz rebatida da mesa, na borda de baixo
  ctx.strokeStyle = 'rgba(190,170,255,.45)'; ctx.lineWidth = r * .14;
  ctx.beginPath(); ctx.arc(0, 0, r * .86, .35, Math.PI - .35); ctx.stroke();
  // reflexo colorido dos cogumelos acesos
  for (const c of COGUMELOS) if (c.flash > 0 && Math.hypot(c.x - x, c.y - y) < 60) {
    const a = Math.atan2(c.y - y, c.x - x);
    ctx.fillStyle = c.cor[1]; ctx.globalAlpha = .45; ctx.beginPath(); ctx.arc(0, 0, r * .92, a - .7, a + .7); ctx.lineTo(0, 0); ctx.fill(); ctx.globalAlpha = 1;
  }
  // brilho do clarão da mesa
  if (gi > 0) { ctx.fillStyle = `rgba(${giCor},${Math.min(.35, gi * .4)})`; circulo(ctx, 0, 0, r); ctx.fill(); }
  ctx.restore();
}

function desenhar(dt, alfa) {
  const k = escala * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07091a'; ctx.fillRect(0, 0, tela.width, tela.height);
  let ox = 0, oy = 0;
  if (tremor > 0) { const f = Math.min(1, tremor / .22); ox = aleat(-3, 3) * f; oy = aleat(-2, 2) * f; }
  ctx.setTransform(k, 0, 0, k, ox * k, oy * k);
  ctx.drawImage(fundo, 0, 0, W, H);

  const piscaOn = Math.floor(relogio * 5) % 2 === 0;
  const atracao = j.estado === 'fim' || show > 0;
  LUZES.forEach((l, i) => {
    if (l.deck) return;
    const on = atracao ? (i + Math.floor(relogio * (show > 0 ? 14 : 8))) % 5 === 0 : (l.on() || (l.pisca() && piscaOn));
    if (on) { brilho(l.x, l.y, l.r, l.cor, l.estrela); if (l.txt) texto(ctx, l.txt, l.x, l.y + .5, 8, '#05200f', '800'); }
  });
  PLANETAS.forEach((p, i) => {
    const feito = i < j.planetas, atual = i === j.missao && j.estado !== 'fim';
    if (feito || (atual && piscaOn) || (atracao && (i + Math.floor(relogio * 4)) % 5 === 0)) {
      halo(p.x, p.y, p.r * 2.4, p.cor[1], feito ? .6 : .4);
      desenharPlaneta(ctx, p);
    }
  });
  desenharLuzesGerais(piscaOn, atracao);

  ctx.save(); ctx.translate(BURACO.x, BURACO.y); ctx.rotate(relogio * (bolas.some(b => b.presa) ? 9 : 2));
  ctx.strokeStyle = j.trava ? 'rgba(230,190,255,.85)' : 'rgba(200,150,255,.55)'; ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) { ctx.rotate(DPI / 3); ctx.beginPath(); ctx.arc(4, 0, 9, -1.2, .6); ctx.stroke(); }
  ctx.restore();
  if (j.extraAcesa) { // bola extra valendo no buraco negro
    const pul = .5 + .5 * Math.sin(relogio * 8);
    halo(BURACO.x, BURACO.y, 34, '#ffa53d', .4 + .4 * pul);
    ctx.strokeStyle = `rgba(255,170,60,${.5 + .5 * pul})`; ctx.lineWidth = 2.2; circulo(ctx, BURACO.x, BURACO.y, 16 + 3 * pul); ctx.stroke();
    texto(ctx, 'EXTRA', BURACO.x, BURACO.y + 26, 9, piscaOn ? '#ffd27a' : '#ff8a2a', '900');
  }

  const ac = Math.abs(Math.cos(spinner.ang));
  ctx.fillStyle = '#c9cfd9'; ctx.fillRect(26, 300 - 4 * ac, 30, 8 * ac + .6);
  ctx.fillStyle = 'rgba(255,216,74,.85)'; ctx.fillRect(26, 300 - 1.2 * ac, 30, 2.4 * ac + .2);

  ALVOS.forEach(a => {
    ctx.lineCap = 'butt';
    if (a.de_pe) {
      for (let z = 0; z <= 5; z++) { ctx.strokeStyle = z < 5 ? '#7a1010' : '#3a0a0a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a.ax, a.ay - z); ctx.lineTo(a.bx, a.by - z); ctx.stroke(); }
      ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(a.ax, a.ay - 6); ctx.lineTo(a.bx, a.by - 6); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.ax - 2, a.ay - 5); ctx.lineTo(a.bx - 2, a.by - 7); ctx.stroke();
    } else {
      const f = Math.max(0, 1 - (relogio - a.cai) / .12);
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.lineTo(a.bx, a.by); ctx.stroke();
      if (f > 0) { ctx.strokeStyle = `rgba(255,77,77,${f})`; ctx.lineWidth = 6 * f; ctx.stroke(); }
    }
  });
  desenharEstilingues();
  for (const b of COGUMELOS) if (!b.andar) desenharCogumelo(b, false, piscaOn);
  ctx.fillStyle = '#1b1f29'; ctx.fillRect(354, plY, 22, 770 - plY);
  ctx.strokeStyle = '#a7adb9'; ctx.lineWidth = 1.6; ctx.beginPath();
  const voltas = 9, alto = 750 - (plY + 8);
  for (let i = 0; i <= voltas * 2; i++) { const y = plY + 8 + alto * i / (voltas * 2); ctx.lineTo(i % 2 ? 374 : 356, y); }
  ctx.stroke();
  const gp = ctx.createLinearGradient(354, 0, 376, 0); gp.addColorStop(0, '#7a0a14'); gp.addColorStop(.5, '#ff4d5e'); gp.addColorStop(1, '#7a0a14');
  ctx.fillStyle = gp; ctx.fillRect(354, plY, 22, 8);
  if (puxando) { ctx.fillStyle = `rgba(255,${Math.round(220 - 160 * puxar)},60,.9)`; ctx.fillRect(352, 760 - 120 * puxar, 3, 120 * puxar); }


  // posição suavizada entre dois passos da física: a bola anda sempre no mesmo ritmo
  const pos = b => [b.ox + (b.x - b.ox) * alfa, b.oy + (b.y - b.oy) * alfa];
  // bolas do chão: as que estão atrás do alien primeiro, depois o alien, depois as da frente
  const chao = bolas.filter(b => !b.fora && !b.naNave && !b.trilha && !b.andar && b.destino !== 'alien');
  for (const b of chao) { const [x, y] = pos(b); if (y < ALIEN.y) desenharBola(b, x, y); }
  desenharAlien();
  for (const b of bolas) if (b.destino === 'alien' && !b.fora) desenharBola(b, b.x + aleat(-1, 1), b.y);
  for (const b of chao) { const [x, y] = pos(b); if (y >= ALIEN.y) desenharBola(b, x, y); }
  for (const p of palhetas) if (!p.andar) desenharPalheta(p, p.oang + (p.ang - p.oang) * alfa);
  // andar de cima: estação orbital
  ctx.drawImage(camDeck, 0, 0, W, H);
  desenharDeckVivo(piscaOn);
  for (const b of COGUMELOS) if (b.andar) desenharCogumelo(b, false, piscaOn);
  for (const b of bolas) if (!b.fora && !b.trilha && b.andar === 1) desenharBola(b, ...pos(b));
  for (const p of palhetas) if (p.andar) desenharPalheta(p, p.oang + (p.ang - p.oang) * alfa);

  ctx.drawImage(camRampa, 0, 0, W, H);
  for (const nome of ['rampa', 'tubo', 'descida', 'travessia', 'lua', 'descidaLua']) {
    const er = relogio - brilhoTrilha[nome], T = TRILHAS[nome];
    if (er < .9 && efeitos()) for (let q = 0; q < 6; q++) { const p = pontoTrilha(T, T.L * Math.max(0, Math.min(1, er / .9 - q * .04))); brilho(p.x, p.y, 3, nome === 'tubo' ? '#7dffb2' : '#7fe3ff'); }
  }
  for (const b of bolas) if (b.trilha && b.trilha.T !== TUBO) desenharBola(b, ...pos(b));
  for (const b of bolas) if (b.trilha && b.trilha.T === TUBO) desenharBola(b, ...pos(b));
  ctx.drawImage(camTubo, 0, 0, W, H);
  desenharLeds();


  ctx.drawImage(frente, 0, 0, W, H);

  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    if (!pausado) { p.vida -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 3 * dt; p.vy = p.vy * (1 - 3 * dt) + 200 * dt; }
    if (p.vida <= 0) { particulas.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, p.vida / p.max * 1.5);
    ctx.fillStyle = p.cor; ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;
  if (gi > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${giCor},${Math.min(.35, gi * .35)})`; caminho(ctx, CONTORNO); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  desenharHud(dt);
}

function desenharPalheta(p, ang) {
  const co = Math.cos(ang), si = Math.sin(ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
  const forma = (dx, dy) => {
    ctx.beginPath();
    ctx.arc(p.px + dx, p.py + dy, p.rb, ang + Math.PI / 2, ang + Math.PI * 1.5);
    ctx.arc(tx + dx, ty + dy, p.rt, ang - Math.PI / 2, ang + Math.PI / 2);
    ctx.closePath();
  };
  forma(4, 5); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
  // lateral (a borracha vermelha vista de frente)
  for (let z = 0; z < 4; z++) { forma(0, -z); ctx.fillStyle = z ? '#8e1520' : '#4a070d'; ctx.fill(); }
  forma(0, -4);
  const g = ctx.createLinearGradient(p.px - si * 10, p.py - 4 + co * 10, p.px + si * 10, p.py - 4 - co * 10);
  g.addColorStop(0, '#c9ccd4'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#d7dae1');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#d11f2c'; ctx.lineWidth = 3; ctx.stroke();
  // pino cromado
  const gp = ctx.createRadialGradient(p.px - 1.2, p.py - 5.2, .3, p.px, p.py - 4, 3.6);
  gp.addColorStop(0, '#ffffff'); gp.addColorStop(.5, '#9aa1ad'); gp.addColorStop(1, '#3a3f49');
  ctx.fillStyle = gp; circulo(ctx, p.px, p.py - 4, 3.6); ctx.fill();
}


// ================= Textos grandes por cima da mesa (fora da inclinação, para ler fácil) =================
const hud = $('hud'), hctx = hud.getContext('2d');
let hudDpr = 1, hudW = 0, hudH = 0;
const vis = { ox: 0, oy: 0, e: 1, pe: 1 };   // meio da borda de baixo da mesa na tela, escala e perspectiva
// ponto da mesa → ponto na tela (já com a inclinação)
function proj(x, y) {
  const py = (H - y) * vis.e, s = vis.pe / (vis.pe + py * SEN);
  return [vis.ox + (x - W / 2) * vis.e * s, vis.oy - py * COS * s, s];
}
function letreiro(linhas, x, y, tam, cores, brilhoCor, maxL) {
  hctx.textAlign = 'center'; hctx.textBaseline = 'middle'; hctx.lineJoin = 'round';
  linhas.forEach((l, i) => {
    let t = tam;
    hctx.font = `italic 900 ${t}px "Arial Black", "Trebuchet MS", sans-serif`;
    const larg = hctx.measureText(l).width;
    if (larg > maxL) { t = t * maxL / larg; hctx.font = `italic 900 ${t}px "Arial Black", "Trebuchet MS", sans-serif`; }
    const yy = y + (i - (linhas.length - 1) / 2) * tam * 1.12;
    hctx.lineWidth = t * .22; hctx.strokeStyle = 'rgba(20,6,40,.95)'; hctx.strokeText(l, x, yy);
    const g = hctx.createLinearGradient(0, yy - t / 2, 0, yy + t / 2);
    g.addColorStop(0, cores[0]); g.addColorStop(.55, cores[1]); g.addColorStop(1, cores[2]);
    hctx.save(); hctx.shadowColor = brilhoCor; hctx.shadowBlur = t * .45;
    hctx.fillStyle = g; hctx.fillText(l, x, yy);
    hctx.restore();
  });
}
const OURO = ['#fff6b0', '#ffc02e', '#ff6a1a'];
function desenharHud(dt) {
  if (!hudW) return;
  hctx.setTransform(hudDpr, 0, 0, hudDpr, 0, 0);
  hctx.clearRect(0, 0, hudW, hudH);
  const larg = W * vis.e;
  // pontos subindo de onde a bola bateu
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    if (!pausado) p.t += dt;
    if (p.t > 1) { popups.splice(i, 1); continue; }
    const [x, y, s] = proj(p.x, p.y), tam = Math.max(13, Math.min(26, larg * .045)) * (.75 + .25 * s);
    hctx.globalAlpha = Math.min(1, (1 - p.t) * 3);
    hctx.font = `900 ${tam}px "Arial Black", sans-serif`; hctx.textAlign = 'center'; hctx.textBaseline = 'middle';
    hctx.lineWidth = tam * .22; hctx.lineJoin = 'round'; hctx.strokeStyle = '#1a0830'; hctx.strokeText(p.txt, x, y - p.t * tam * 2.4);
    hctx.fillStyle = p.cor; hctx.fillText(p.txt, x, y - p.t * tam * 2.4);
  }
  hctx.globalAlpha = 1;
  const [cx, cy] = proj(185, 330), maxL = larg * .86;
  let grande = '';
  if (pausado) grande = 'PAUSADO';
  else if (j.tiltado) grande = 'TILT';
  else if (j.estado === 'fim') grande = 'FIM DE JOGO';
  if (grande) {
    const tam = Math.max(30, Math.min(70, larg * .13));
    hctx.fillStyle = 'rgba(5,6,20,.6)'; hctx.fillRect(0, cy - tam * 1.05, hudW, tam * 2.3);
    letreiro([grande], cx, cy - tam * .2, tam, grande === 'TILT' ? ['#ffd0d0', '#ff4d4d', '#9a0f1f'] : OURO, grande === 'TILT' ? '#ff2a2a' : '#ff9a1e', maxL);
    const sub = pausado ? 'Toque na mesa para continuar' : j.estado === 'fim' ? 'Aperte "Novo jogo"' : '';
    if (sub) { const t2 = Math.max(14, tam * .3); hctx.font = `700 ${t2}px "Trebuchet MS", sans-serif`; hctx.fillStyle = '#fff'; hctx.textAlign = 'center'; hctx.fillText(sub, cx, cy + tam * .75); }
    return;
  }
  // mensagens das jogadas (as mesmas do placar), em letras grandes
  const m = relogio < msgAte ? (typeof mensagem === 'function' ? mensagem() : mensagem) : '';
  if (!m) return;
  const el = relogio - msgIni, resta = msgAte - relogio;
  if (msgAnim === 'pisca' && el > .3 && el < 1.5 && Math.floor(el * 5) % 2 === 1) return;
  const linhas = m.split('\n'), tam = Math.max(24, Math.min(58, larg * (linhas.length > 1 ? .085 : .105)));
  const esc = msgAnim === 'zoom' && el < .22 ? .3 + el / .22 * .7 : msgAnim === 'pisca' && el < .15 ? 1.4 - el / .15 * .4 : 1;
  hctx.globalAlpha = Math.min(1, resta / .35, el / .08);
  hctx.save(); hctx.translate(cx, cy); hctx.scale(esc, esc);
  letreiro(linhas, 0, 0, tam, OURO, '#ff8a1e', maxL);
  hctx.restore();
  hctx.globalAlpha = 1;
}

// ================= Placar de pontinhos (como as máquinas dos anos 90) =================
const dmd = $('dmd'), dctx = dmd.getContext('2d');
const DW = 128, DH = 32;
const dbuf = document.createElement('canvas'); dbuf.width = DW; dbuf.height = DH;
const bctx = dbuf.getContext('2d');
const grade = document.createElement('canvas');
function ajustarDMD() {
  const w = dmd.clientWidth; if (!w) return;
  const d = Math.min(window.devicePixelRatio || 1, 2);
  dmd.width = grade.width = Math.round(w * d); dmd.height = grade.height = Math.round(w / 4 * d);
  const g = grade.getContext('2d'), cw = dmd.width / DW, ch = dmd.height / DH;
  g.fillStyle = '#0a0500'; g.fillRect(0, 0, grade.width, grade.height);
  g.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) { g.beginPath(); g.arc((x + .5) * cw, (y + .5) * ch, Math.min(cw, ch) * .42, 0, DPI); g.fill(); }
  g.globalCompositeOperation = 'source-over';
}
new ResizeObserver(ajustarDMD).observe(dmd);
function dTexto(t, x, y, tam, alinhar = 'center') { bctx.font = `bold ${tam}px Arial, Helvetica, sans-serif`; bctx.textAlign = alinhar; bctx.textBaseline = 'middle'; bctx.fillText(t, x, y); }
function cabe(t, tam, max) { bctx.font = `bold ${tam}px Arial, Helvetica, sans-serif`; while (bctx.measureText(t).width > max && tam > 7) { tam--; bctx.font = `bold ${tam}px Arial, Helvetica, sans-serif`; } return tam; }
let anunciado = '';
function desenharDMD() {
  if (!dmd.width) return;
  bctx.clearRect(0, 0, DW, DH); bctx.fillStyle = '#fff';
  const m = relogio < msgAte ? (typeof mensagem === 'function' ? mensagem() : mensagem) : '';
  if (m) {
    const el = relogio - msgIni, linhas = m.split('\n');
    const mostrar = !(msgAnim === 'pisca' && el > .3 && Math.floor(el * 5) % 2 === 1 && el < 1.5);
    const esc = msgAnim === 'zoom' && el < .2 ? .3 + el / .2 * .7 : 1;
    if (mostrar) {
      bctx.save(); bctx.translate(64, 16); bctx.scale(esc, esc);
      if (linhas.length > 1) linhas.forEach((l, i) => dTexto(l, 0, (i - .5) * 15 + 1, cabe(l, 13, 124)));
      else dTexto(m, 0, 1, cabe(m, 20, 124));
      bctx.restore();
    }
    if (m !== anunciado) { anunciado = m; $('anuncio').textContent = m.replace('\n', ' '); }
  } else if (ALIEN.segurando) {
    dTexto('ALIEN!', 64, 16, cabe('ALIEN!', 20, 124));
  } else if (j.estado === 'fim') {
    const fase = Math.floor(relogio / 2.5) % 3;
    if (fase === 0) dTexto('FIM DE JOGO', 64, 16, cabe('FIM DE JOGO', 18, 124));
    else if (fase === 1) { dTexto('SEUS PONTOS', 64, 6, 8); dTexto(fmt(j.pontos), 64, 21, cabe(fmt(j.pontos), 18, 124)); }
    else { dTexto('RECORDE', 64, 6, 8); const t = fmt(Math.max(dados.melhor || 0, j.pontos)); dTexto(t, 64, 21, cabe(t, 18, 124)); }
  } else {
    let meio = '';
    if (j.multibola) meio = 'MULTIBOLA';
    else if (j.estado === 'pronto' && Math.floor(relogio * 1.5) % 2 === 0) meio = 'LANCE A BOLA';
    else if (j.extras) meio = `+${j.extras} EXTRA`;
    dTexto(meio ? `B${j.bola}` : `BOLA ${j.bola}/${totalBolas}`, 2, 5, 8, 'left');
    dTexto(`x${j.mult}`, 126, 5, 8, 'right');
    if (meio) dTexto(meio, 64, 5, 8);
    const t = fmt(j.pontos);
    dTexto(t, 64, 21, cabe(t, 20, 124));
  }
  bctx.globalCompositeOperation = 'source-in'; bctx.fillStyle = '#ff9d1e'; bctx.fillRect(0, 0, DW, DH); bctx.globalCompositeOperation = 'source-over';
  dctx.imageSmoothingEnabled = false;
  dctx.fillStyle = '#2b1503'; dctx.fillRect(0, 0, dmd.width, dmd.height);
  dctx.drawImage(dbuf, 0, 0, dmd.width, dmd.height);
  dctx.drawImage(grade, 0, 0);
}
const cache = {};
function poe(id, v) { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } }
function painel() {
  desenharDMD();
  if (j.estado === 'fim') poe('missao', 'APERTE NOVO JOGO');
  else if (!MISSOES[j.missao]) poe('missao', 'GALÁXIA CONQUISTADA!');
  else {
    const mi = MISSOES[j.missao], meta = mi.meta(j.rodada);
    poe('missao', `${PLANETAS[j.missao].nome}: ${mi.txt} ${j.prog}/${meta}`);
  }
}

// ================= Ciclo principal =================
// Física em passos fixos de 1/600 s; se o aparelho ficar lento, a imagem fica mais leve sozinha.
// RITMO: a mesa roda um pouco mais devagar que o relógio real (bola mais "pesada", como numa máquina grande vista de perto).
const RITMO = .7;
let antes = performance.now(), acumulado = 0, somConf = true, contaQ = 0, tempos = [];
function quadro(agora) {
  const bruto = (agora - antes) / 1000, dt = Math.min(.1, bruto);
  antes = agora;
  const parado = pausado || dialogoAberto(), inicio = performance.now();
  if (!parado) {
    acumulado += dt * RITMO;
    let n = 0;
    while (acumulado >= PASSO && n < 70) { passo(PASSO); acumulado -= PASSO; n++; }
    if (n >= 70) acumulado = 0;
  } else acumulado = 0;
  desenhar(parado ? 0 : dt, parado ? 1 : Math.min(1, acumulado / PASSO));
  painel();
  const trabalho = (performance.now() - inicio) / 1000;
  if (++contaQ % 20 === 0) somConf = JO.carregar('som', true);
  musica.ligar(!!(opc.musica && somConf && !parado && j.estado !== 'fim' && audio.ac && audio.ac.state === 'running'));
  // aparelho lento: se desenhar e calcular passar de 12 ms por quadro, diminui a resolução
  if (!parado && !document.hidden && bruto < .25) {
    tempos.push(trabalho);
    if (tempos.length >= 90) {
      const media = tempos.reduce((a, b) => a + b) / tempos.length;
      tempos = [];
      if (media > .012 && dprMax > 1) { dprMax = Math.max(1, dprMax - .5); ajustarTamanho(); }
    }
  }
  requestAnimationFrame(quadro);
}

novoJogo();
if (location.hostname === 'localhost') window.__pb = { get bolas() { return bolas; }, palhetas, ALVOS, get j() { return j; }, passo: s => { for (let i = 0; i < s / PASSO; i++) passo(PASSO); }, comecarPuxar, soltar, desenhar: () => { desenhar(0, 1); painel(); }, get relogio() { return relogio; }, RAMPA, TUBO, DESCIDA, TRAVESSIA, RAMPA_LUA, DESCIDA_LUA, ALIEN, ALVOS_DECK, novaBola, get dprMax() { return dprMax; } }; // só para testes no computador
mostrarRecordes();
ajustarTamanho();
requestAnimationFrame(quadro);
})();

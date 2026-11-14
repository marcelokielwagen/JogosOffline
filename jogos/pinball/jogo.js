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
for (const x of [125, 165, 205, 245]) seg(x, 92, x, 122, { r: 4, tipo: 'poste' });
linha([[46, 505], [46, 600], [114, 637]]);                          // guias de retorno (terminam sobre a base da palheta)
linha([[324, 505], [324, 600], [256, 637]]);

const ESTILINGUES = [
  { a: [72, 520], b: [72, 580], c: [104, 600], flash: 0 },
  { a: [298, 520], b: [298, 580], c: [266, 600], flash: 0 },
];
for (const s of ESTILINGUES) {
  seg(...s.a, ...s.b, { e: .6, tipo: 'borracha' });
  seg(...s.b, ...s.c, { e: .6, tipo: 'borracha' });
  seg(...s.a, ...s.c, { e: .6, tipo: 'borracha', chute: 500, est: s });
}

const BLOCO = [[350, 298], [330, 315], [318, 405], [350, 420]];
linha(BLOCO, { tipo: 'bloco', e: .4 });
const ALVOS = [];
for (const [t0, t1] of [[.03, .31], [.36, .64], [.69, .97]]) {
  const x0 = 324, y0 = 318, x1 = 312, y1 = 402;
  ALVOS.push({ ax: x0 + (x1 - x0) * t0, ay: y0 + (y1 - y0) * t0, bx: x0 + (x1 - x0) * t1, by: y0 + (y1 - y0) * t1, de_pe: true, cai: 0 });
}

const COGUMELOS = [
  { x: 145, y: 215, r: 19, cor: ['#ffc2d1', '#e91e63', '#7a0f36'], flash: 0 },
  { x: 225, y: 205, r: 19, cor: ['#c4f1ff', '#039be5', '#014a72'], flash: 0 },
  { x: 185, y: 282, r: 19, cor: ['#fff0b8', '#fb8c00', '#7a3d00'], flash: 0 },
];
const BURACO = { x: 288, y: 258 };
const BASE_NAVE = { x: 185, y: 352 };

// palhetas com "peso": aceleram até a velocidade máxima
const palhetas = [
  { px: 116, py: 646, len: 60, rb: 10, rt: 5.5, rep: .5, cima: -.45, ang: .5, oang: .5, w: 0, wReal: 0, apertada: false },
  { px: 254, py: 646, len: 60, rb: 10, rt: 5.5, rep: Math.PI - .5, cima: Math.PI + .45, ang: Math.PI - .5, oang: Math.PI - .5, w: 0, wReal: 0, apertada: false },
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
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: a.dx + (b.dx - a.dx) * t, dy: a.dy + (b.dy - a.dy) * t, h: a.h + (b.h - a.h) * t };
}
// Rampa: entra na frente da esquerda, dá a volta por cima e desce no retorno da direita
const RAMPA = montarTrilha(
  catmull([[99, 345], [92, 290], [88, 225], [96, 160], [118, 108], [160, 72], [220, 60], [276, 76], [314, 112], [334, 165], [340, 230], [339, 310], [336, 390], [329, 450], [318, 495], [311, 524]]),
  t => t < .28 ? t / .28 : 1 - .5 * (t - .28) / .72,
  { nome: 'rampa', vmin: 250, vmax: 650 });
// Cano com looping: entra à direita do centro, sobe, dá uma volta completa e cai no alto da esquerda
const TUBO = (() => {
  const ida = catmull([[262, 352], [258, 305], [246, 262], [230, 215], [212, 182], [190, 176]], 8);
  const volta = [];
  for (let a = 96; a <= 450; a += 6) { const r = a * Math.PI / 180; volta.push([190 + 26 * Math.cos(r), 150 + 26 * Math.sin(r)]); }
  const saida = catmull([[190, 176], [160, 180], [132, 190], [116, 210], [112, 234]], 8).slice(1);
  const pts = ida.concat(volta, saida);
  const alt = pts.map((p, i) => {
    if (i < ida.length) return .7 * i / (ida.length - 1);
    if (i < ida.length + volta.length) { const a = (96 + (i - ida.length) * 6) * Math.PI / 180; return .7 + .5 * (1 - Math.cos(a - Math.PI / 2)) / 2; }
    return .7 - .4 * (i - ida.length - volta.length) / (saida.length - 1);
  });
  return montarTrilha(pts, alt, { nome: 'tubo', vmin: 200, vmax: 480 });
})();
const TRILHAS = { rampa: RAMPA, tubo: TUBO };

// voo da nave: sai da base, dá uma volta pela mesa e solta a bola no alto
const ROTA_NAVE = montarTrilha(catmull([[185, 352], [150, 300], [96, 232], [96, 150], [140, 92], [215, 74], [290, 112], [300, 185], [255, 190], [215, 140], [185, 84]], 10), () => 1, {});

const PLANETAS = [
  { nome: 'Lua', x: 113, y: 452, r: 10, cor: ['#ffffff', '#b8bcc6', '#555a66'] },
  { nome: 'Marte', x: 148, y: 424, r: 11, cor: ['#ffb08a', '#d84a22', '#5c1405'] },
  { nome: 'Júpiter', x: 185, y: 410, r: 15, cor: ['#ffe7c2', '#d9a066', '#6b3d14'] },
  { nome: 'Saturno', x: 222, y: 424, r: 11, cor: ['#fff6cf', '#e3c46d', '#6e5313'], anel: true },
  { nome: 'Netuno', x: 257, y: 452, r: 10, cor: ['#c9dcff', '#3f6cff', '#0d1f6b'] },
];
const MISSOES = [
  { ev: 'bancada', txt: 'derrube os alvos', meta: r => r },
  { ev: 'nave', txt: 'voe com a nave', meta: r => r },
  { ev: 'cogumelo', txt: 'acerte os cogumelos', meta: r => 10 + 5 * r },
  { ev: 'rampa', txt: 'suba a rampa', meta: r => 1 + r },
  { ev: 'tubo', txt: 'faça o looping', meta: r => r },
];

// Áreas que contam pontos quando a bola passa (não são sólidas)
const ZONAS = [
  ...[145, 185, 225].map((x, i) => ({ x0: x - 10, y0: 98, x1: x + 10, y1: 118, ev: 'trilha', i })),
  { x0: 24, y0: 292, x1: 58, y1: 308, ev: 'orbita' },
  { x0: 24, y0: 560, x1: 42, y1: 590, ev: 'fora', lado: 'E', faixa: 0 },
  { x0: 50, y0: 560, x1: 68, y1: 590, ev: 'retorno', faixa: 1 },
  { x0: 302, y0: 560, x1: 320, y1: 590, ev: 'retorno', faixa: 2 },
  { x0: 328, y0: 560, x1: 346, y1: 590, ev: 'fora', lado: 'D', faixa: 3 },
  { x0: 353, y0: 150, x1: 380, y1: 185, ev: 'saiu', sobe: true },
  { x0: 80, y0: 330, x1: 118, y1: 352, ev: 'entrada', trilha: 'rampa', sobe: true },
  { x0: 248, y0: 342, x1: 276, y1: 362, ev: 'entrada', trilha: 'tubo', sobe: true },
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
// marcas na superfície da bola, para ver ela rolando
const MARCAS = [];
for (let i = 0; i < 12; i++) { const y = 1 - (i + .5) / 6, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.4; MARCAS.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
let bolas = [], B = null;
let plY = PL_BASE, puxar = 0, puxando = false;
let relogio = 0, pausado = false, tremor = 0, gi = 0, giCor = '255,210,120', show = 0, brilhoTrilha = { rampa: -9, tubo: -9 };
const spinner = { ang: 0, w: 0 };
// nave: pronta → decolando → voando → voltando → recarga → pronta
const nave = { estado: 'pronta', t: 0, bola: null, x: BASE_NAVE.x, y: BASE_NAVE.y, alt: 0, ang: -Math.PI / 2, voos: 0 };
let mensagem = '', msgAte = 0, msgIni = 0, msgAnim = 'zoom';
const agenda = [], particulas = [], popups = [];
const depois = (s, fn) => agenda.push({ t: relogio + s, fn });
const msg = (t, s = 2.4, anim = 'zoom') => { mensagem = t; msgAte = relogio + s; msgIni = relogio; msgAnim = anim; };
let j;

function novaBola(x, y) {
  return { x, y, ox: x, oy: y, vx: 0, vy: 0, presa: 0, fora: false, trilha: null, naNave: false, ignora: 0, parado: 0, travar: false,
           zd: ZONAS.map(() => false), px: x, py: y, marcas: MARCAS.map(m => m.slice()), rastro: [] };
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
        trava: false, travadas: 0, multibola: false, jackpot: false, catapulta: true, skill: 0, skillAte: 0 };
  ALVOS.forEach(a => a.de_pe = true);
  Object.assign(nave, { estado: 'pronta', t: 0, bola: null, x: BASE_NAVE.x, y: BASE_NAVE.y, alt: 0, ang: -Math.PI / 2, voos: 0 });
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
  Object.assign(j, { estado: 'pronto', mult: 1, bonus: 0, tilt: 0, tiltado: false, salvaAte: 0, multibola: false, jackpot: false, skillAte: 0 });
  if (regras.catapulta) j.catapulta = true;
}
function pontuar(n, x, y) {
  if (j.tiltado || j.estado === 'fim') return;
  j.pontos += n;
  if (x !== undefined) popup(x, y, '+' + fmt(n));
  if (!j.extraPontos && j.pontos >= 750000) { j.extraPontos = true; ganharExtra(); }
}
function ganharExtra() { j.extras++; som('extra'); msg('BOLA EXTRA!', 3, 'pisca'); JO.vibrar(80); clarao(.7, '255,140,60'); }
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
      if (relogio < j.skillAte && z.i === j.skill) {
        j.skillAte = 0; pontuar(50000 * j.rodada, b.x, b.y + 20); som('tacada'); clarao(.6);
        msg('TACADA\nPERFEITA!', 2.5, 'pisca'); faiscas(b.x, b.y, 24, '#ffffff', 1.2);
      }
      if (j.trilhas[z.i]) { pontuar(100); break; }
      j.trilhas[z.i] = true; pontuar(500, b.x, b.y + 16); j.bonus += 200;
      if (j.trilhas.every(Boolean)) {
        if (j.mult < 5) j.mult++;
        pontuar(5000); msg(`BÔNUS x${j.mult}`); clarao(.4, '120,255,170');
        depois(.6, () => { j.trilhas = [false, false, false]; });
      }
      break;
    case 'orbita':
      spinner.w += Math.min(60, Math.abs(b.vy) / 40);
      if (b.vy < 0) {
        pontuar(5000 * j.rodada, 60, 300); j.bonus += 1000; som('orbita'); msg('ÓRBITA!', 1.6); evento('orbita');
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
      if (j.estado === 'pronto') { j.estado = 'jogando'; j.salvaAte = relogio + regras.escudo; j.skillAte = relogio + 4; }
      break;
    case 'entrada':
      if (!b.trilha && b.vy < -150) entrarTrilha(b, TRILHAS[z.trilha]);
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
  b.x = p.x; b.y = p.y; b.vx = p.dx * s * r.dir; b.vy = p.dy * s * r.dir; r.h = p.h;
}
function sairTrilha(b, fim) {
  const T = b.trilha.T, s = b.trilha.s;
  b.trilha = null;
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
  if (T.nome === 'tubo') {
    pontuar(20000 * j.rodada, 190, 150); j.bonus += 3000;
    som('looping'); evento('tubo'); clarao(.5, '120,255,190'); faiscas(b.x, b.y, 18, '#7dffb2', 1);
    msg('LOOPING!', 2, 'pisca');
    return;
  }
  pontuar(10000 * j.rodada, 300, 470); j.bonus += 2000;
  som('rampaOk'); evento('rampa');
  if (j.multibola && j.jackpot) {
    pontuar(100000 * j.rodada, 185, 360); som('jackpot'); show = 2.5; clarao(1, '255,220,90'); tremor = .2;
    faiscas(99, 345, 40, '#ffd84a', 1.6); msg('JACKPOT!', 3, 'pisca');
  } else if (!j.trava && !j.multibola) {
    j.trava = true; msg('TRAVA ACESA\nVÁ AO BURACO NEGRO', 2.6);
  } else msg('RAMPA!', 1.6);
}

// ----- Nave: pega a bola na base, voa pela mesa e solta lá no alto -----
function embarcar(b) {
  b.naNave = true; b.vx = b.vy = 0;
  Object.assign(nave, { estado: 'decolando', t: 0, bola: b });
  som('nave'); msg('DECOLAGEM!', 2, 'pisca'); clarao(.4, '150,220,255');
  faiscas(BASE_NAVE.x, BASE_NAVE.y, 20, '#9fe8ff', 1);
  pontuar(5000 * j.rodada);
}
function atualizarNave(h) {
  nave.t += h;
  if (nave.estado === 'decolando') {
    nave.alt = Math.min(1, nave.t / .6); nave.x = BASE_NAVE.x; nave.y = BASE_NAVE.y - nave.alt * 6;
    if (nave.t >= .6) { nave.estado = 'voando'; nave.t = 0; }
  } else if (nave.estado === 'voando') {
    const dur = 2.6, f = Math.min(1, nave.t / dur), suave = f * f * (3 - 2 * f);
    const p = pontoTrilha(ROTA_NAVE, suave * ROTA_NAVE.L);
    nave.x = p.x; nave.y = p.y; nave.ang = Math.atan2(p.dy, p.dx);
    if (efeitos() && Math.random() < .6) particulas.push({ x: p.x - p.dx * 16, y: p.y - p.dy * 16, vx: -p.dx * 120 + aleat(-30, 30), vy: -p.dy * 120 + aleat(-30, 30), vida: .35, max: .35, cor: Math.random() < .5 ? '#ffb347' : '#ff5e3a', tam: aleat(1.5, 3) });
    if (f >= 1) { nave.estado = 'soltando'; nave.t = 0; }
  } else if (nave.estado === 'soltando') {
    nave.ang += (Math.PI / 2 - nave.ang) * .02;
    if (nave.t >= .35 && nave.bola) {
      const b = nave.bola; nave.bola = null;
      Object.assign(b, { naNave: false, x: 185, y: 82, ox: 185, oy: 82, vx: aleat(-25, 25), vy: 160 });
      b.zd = ZONAS.map(() => false);
      nave.voos++;
      if (!j.tiltado) {
        pontuar(25000 * j.rodada, 185, 70); som('naveSolta'); evento('nave'); show = 1.2;
        if (nave.voos % 3 === 0) { pontuar(75000 * j.rodada); msg('SUPER VOO!\n+' + fmt(75000 * j.rodada), 2.6, 'pisca'); }
        else msg('VOO GALÁCTICO!', 2.2);
      }
    }
    if (nave.t >= .7) { nave.estado = 'voltando'; nave.t = 0; nave.de = [nave.x, nave.y]; }
  } else if (nave.estado === 'voltando') {
    const f = Math.min(1, nave.t / 1.1), s = f * f * (3 - 2 * f);
    nave.x = nave.de[0] + (BASE_NAVE.x - nave.de[0]) * s; nave.y = nave.de[1] + (BASE_NAVE.y - nave.de[1]) * s;
    nave.ang += (-Math.PI / 2 - nave.ang) * .05;
    nave.alt = f > .7 ? 1 - (f - .7) / .3 : 1;
    if (f >= 1) { nave.estado = 'recarga'; nave.t = 0; nave.alt = 0; som('pouso'); }
  } else if (nave.estado === 'recarga') {
    if (nave.t >= 6) { nave.estado = 'pronta'; if (j.estado === 'jogando') msg('NAVE PRONTA', 1.6); }
  }
}

// ----- Buraco negro (prende, trava bolas e solta a multibola) -----
function capturar(b) {
  Object.assign(b, { x: BURACO.x, y: BURACO.y, vx: 0, vy: 0, presa: relogio + 1.6 });
  som('buraco'); clarao(.35, '170,110,255');
  if (j.tiltado) return;
  pontuar(7500 * j.rodada, BURACO.x, BURACO.y - 22); j.bonus += 1500; evento('buraco');
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
  } else msg('BURACO NEGRO!', 1.8);
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
  for (const p of paredes) {
    if (p.mao && (B.x - p.ax) * p.mao[0] + (B.y - p.ay) * p.mao[1] < 0) continue;
    const c = contato(p.ax, p.ay, p.bx, p.by, p.r);
    if (!c) continue;
    const forca = rebater(c, p.e, p.f);
    if (p.chute && forca > 60 && p.est.flash <= 0 && !j.tiltado) {
      B.vx += c.nx * p.chute; B.vy += c.ny * p.chute;
      p.est.flash = .14; pontuar(100); j.bonus += 20; som('estilingue');
      faiscas(c.qx, c.qy, 10, '#ffd0dc', .8, c.nx, c.ny);
    }
  }
  for (const a of ALVOS) {
    if (!a.de_pe) continue;
    const c = contato(a.ax, a.ay, a.bx, a.by, 3);
    if (!c) continue;
    if (rebater(c, .3, .02) > 40 && !j.tiltado) {
      a.de_pe = false; a.cai = relogio; pontuar(1500, (a.ax + a.bx) / 2 - 18, (a.ay + a.by) / 2); j.bonus += 750; som('alvo');
      faiscas(c.qx, c.qy, 12, '#ff6b6b', .9, c.nx, c.ny);
      if (ALVOS.every(x => !x.de_pe)) {
        pontuar(10000 * j.rodada); som('bancada'); msg('ALVOS\nDERRUBADOS!'); evento('bancada'); clarao(.5, '255,90,90');
        if (!j.catapulta) { j.catapulta = true; depois(.8, () => msg('CATAPULTA\nACESA', 2)); }
        depois(1.2, () => ALVOS.forEach(x => x.de_pe = true));
      }
    }
  }
  for (const b of COGUMELOS) {
    const c = contato(b.x, b.y, b.x, b.y, b.r);
    if (!c) continue;
    rebater(c, .5, .02);
    if (b.flash <= .06 && !j.tiltado) {
      B.vx += c.nx * 650; B.vy += c.ny * 650;
      b.flash = .16; pontuar(1000, b.x, b.y - 24); j.bonus += 100; som('cogumelo'); evento('cogumelo');
      faiscas(b.x + c.nx * b.r, b.y + c.ny * b.r, 12, b.cor[0], 1, c.nx, c.ny);
      if (efeitos()) tremor = Math.max(tremor, .05);
    }
  }
  for (const p of palhetas) {
    const co = Math.cos(p.ang), si = Math.sin(p.ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
    let t = ((B.x - p.px) * co + (B.y - p.py) * si) / p.len;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const c = contato(p.px, p.py, tx, ty, p.rb + (p.rt - p.rb) * t);
    if (!c) continue;
    const forca = rebater(c, p.wReal ? .34 : .22, .03, -p.wReal * (c.qy - p.py), p.wReal * (c.qx - p.px));
    if (forca > 900) { som('batida'); faiscas(c.qx, c.qy, 8, '#ffffff', .7, c.nx, c.ny); }
  }
  // ponta do lançador
  if (B.x > 351 && B.y + R > plY && B.y < plY + 24) {
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
      if (b.travar) { b.fora = true; b.travado = true; colocarNoLancador(true); }
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
  if (relogio > b.ignora) {
    const dx = BURACO.x - b.x, dy = BURACO.y - b.y, d = Math.hypot(dx, dy);
    if (d < 22) {
      if (d < 8 && Math.hypot(b.vx, b.vy) < 1150) { capturar(b); return; }
      const k = 1700 * (1 - d / 22) * h / (d || 1);
      b.vx += dx * k; b.vy += dy * k;
    }
  }
  if (nave.estado === 'pronta' && !j.tiltado && j.estado === 'jogando') {
    const dx = BASE_NAVE.x - b.x, dy = BASE_NAVE.y - b.y;
    if (dx * dx + dy * dy < 121 && Math.hypot(b.vx, b.vy) < 2200) { embarcar(b); return; }
  }
  b.vx *= 1 - .06 * h; b.vy *= 1 - .06 * h;
  const v2 = b.vx * b.vx + b.vy * b.vy;
  if (v2 > VMAX * VMAX) { const k = VMAX / Math.sqrt(v2); b.vx *= k; b.vy *= k; }
  b.x += b.vx * h; b.y += b.vy * h;

  colisoes();
  ZONAS.forEach((z, i) => {
    const dentro = b.x > z.x0 && b.x < z.x1 && b.y > z.y0 && b.y < z.y1;
    if (dentro && !b.zd[i] && (!z.sobe || b.vy < 0)) aoEntrar(b, z);
    b.zd[i] = dentro;
  });
  // bola parada num canto por muito tempo: a mesa dá um empurrãozinho
  if (j.estado === 'jogando' && b.x < 350 && Math.hypot(b.vx, b.vy) < 12 && !palhetas.some(p => p.apertada)) {
    b.parado += h;
    if (b.parado > 3) { b.vy = -380; b.vx = aleat(-120, 120); b.parado = 0; }
  } else b.parado = 0;
  if (b.y > 760) b.fora = true;
}

function choqueEntreBolas() {
  for (let i = 0; i < bolas.length; i++) for (let k = i + 1; k < bolas.length; k++) {
    const a = bolas[i], b = bolas[k];
    if (a.presa || b.presa || a.fora || b.fora || a.trilha || b.trilha || a.naNave || b.naNave) continue;
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
  atualizarNave(h);

  for (const b of bolas.slice()) moverBola(b, h);
  if (bolas.length > 1) choqueEntreBolas();
  if (bolas.some(b => b.fora)) {
    const perdidas = bolas.filter(b => b.fora && !b.travado).length;
    bolas = bolas.filter(b => !b.fora);
    for (let i = 0; i < perdidas; i++) bolaPerdida();
  }
}

// ================= Controles =================
const teclas = { E: false, D: false };
const toques = new Map();
function atualizarPalhetas() {
  const lados = [...toques.values()];
  const e = (teclas.E || lados.includes('E')) && !j.tiltado, d = (teclas.D || lados.includes('D')) && !j.tiltado;
  if (pausado) return;
  if (e && !palhetas[0].apertada) { som('palheta'); girarTrilhas(-1); JO.vibrar(10); }
  if (d && !palhetas[1].apertada) { som('palheta'); girarTrilhas(1); JO.vibrar(10); }
  palhetas[0].apertada = e; palhetas[1].apertada = d;
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
  if (TECLAS_E.includes(e.code)) { teclas.E = true; atualizarPalhetas(); e.preventDefault(); }
  else if (TECLAS_D.includes(e.code)) { teclas.D = true; atualizarPalhetas(); e.preventDefault(); }
  else if (TECLAS_L.includes(e.code)) { if (!e.repeat) comecarPuxar(); e.preventDefault(); }
  else if ((e.code === 'KeyX' || e.code === 'ArrowUp') && !e.repeat) { sacudir(); e.preventDefault(); }
});
document.addEventListener('keyup', e => {
  if (TECLAS_E.includes(e.code)) { teclas.E = false; atualizarPalhetas(); }
  else if (TECLAS_D.includes(e.code)) { teclas.D = false; atualizarPalhetas(); }
  else if (TECLAS_L.includes(e.code)) soltar();
});
const lancadores = new Set();
mesa.addEventListener('pointerdown', e => {
  e.preventDefault();
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
mesa.addEventListener('contextmenu', e => e.preventDefault());

function alternarPausa(forcar) {
  pausado = forcar === undefined ? !pausado : forcar;
  if (pausado) { palhetas.forEach(p => p.apertada = false); teclas.E = teclas.D = false; toques.clear(); puxando = false; }
  $('pausa').textContent = pausado ? '▶' : '⏸';
  $('pausa').setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
}
$('pausa').addEventListener('click', () => alternarPausa());
document.addEventListener('visibilitychange', () => { if (document.hidden && j.estado !== 'fim') alternarPausa(true); });
$('sacudir').addEventListener('click', sacudir);
function pedirNovo() {
  if (j.estado === 'fim' || (j.pontos === 0 && j.bola === 1)) { novoJogo(); alternarPausa(false); }
  else $('confirma').showModal();
}
$('novo').addEventListener('click', e => { e.currentTarget.blur(); pedirNovo(); });
$('confirma-sim').addEventListener('click', () => { $('confirma').close(); novoJogo(); alternarPausa(false); });
$('nome-ok').addEventListener('click', salvarNome);
$('nome-campo').addEventListener('keydown', e => { if (e.key === 'Enter') salvarNome(); });
document.querySelectorAll('dialog').forEach(d => d.addEventListener('close', () => { teclas.E = teclas.D = false; atualizarPalhetas(); }));

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
const fundo = document.createElement('canvas'), frente = document.createElement('canvas'), camRampa = document.createElement('canvas'), camTubo = document.createElement('canvas');

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
  { x: 41, y: 462, ang: -Math.PI / 2, ev: 'orbita', cor: '#ffd84a' },
  { x: 99, y: 374, ang: -Math.PI / 2 - .12, ev: 'rampa', cor: '#7fe3ff' },
  { x: 185, y: 381, ang: -Math.PI / 2, ev: 'nave', cor: '#ffffff' },
  { x: 262, y: 378, ang: -Math.PI / 2 + .08, ev: 'tubo', cor: '#7dffb2' },
  { x: 276, y: 290, ang: -1.19, ev: 'buraco', cor: '#c77dff' },
  { x: 283, y: 362, ang: -.08, ev: 'bancada', cor: '#ff5d5d' },
];
const LUZES = [
  ...[145, 185, 225].map((x, i) => ({ x, y: 142, r: 6, cor: '#ffd84a', on: () => j.trilhas[i], pisca: () => false })),
  ...ALVOS.map(a => ({ x: (a.ax + a.bx) / 2 - 20, y: (a.ay + a.by) / 2, r: 4.5, cor: '#ff5d5d', on: () => !a.de_pe, pisca: () => false })),
  ...[2, 3, 4, 5].map((k, i) => ({ x: 140 + i * 30, y: 548, r: 10, cor: '#4dffa6', txt: k + 'x', on: () => j.mult >= k, pisca: () => false })),
  ...X_FAIXAS.map((x, i) => ({ x, y: 575, r: 5, cor: '#7dffb2', estrela: true, on: () => j.faixas[i], pisca: () => false })),
  { x: 185, y: 579, r: 7, cor: '#ff8a3d', on: () => j.extras > 0, pisca: () => false },
  { x: 185, y: 693, r: 6, cor: '#49c6ff', on: () => relogio < j.salvaAte, pisca: () => j.salvaAte - relogio < 2.5 },
  { x: 33, y: 622, r: 5, cor: '#ff5dd8', on: () => j.catapulta, pisca: () => false },
  { x: 306, y: 280, r: 5, cor: '#c77dff', on: () => false, pisca: () => j.trava },
  { x: 99, y: 395, r: 6, cor: '#ffd84a', on: () => false, pisca: () => j.jackpot },
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

  // laterais de baixo: corredores pintados, desenhos e faixas de perigo
  for (const [x0, x1] of [[23, 43], [49, 69], [301, 321], [327, 347]]) { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x0, 505, x1 - x0, 140); }
  faixaPerigo(c, 24, 640, 19, 7); faixaPerigo(c, 327, 640, 19, 7);
  for (const x of [59, 311]) for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(125,255,178,${.18 + k * .08})`; seta(c, x, 600 + k * 11, Math.PI / 2, 5); c.fill(); }
  desenharFoguete(c, 41, 474, .95);
  desenharSatelite(c, 337, 462, .9);
  c.save(); c.translate(337, 535); c.rotate(-Math.PI / 2); texto(c, 'ESCUDO', 0, 0, 5.5, 'rgba(125,255,178,.7)'); c.restore();
  c.save(); c.translate(59, 535); c.rotate(-Math.PI / 2); texto(c, 'ESCUDO', 0, 0, 5.5, 'rgba(125,255,178,.7)'); c.restore();

  c.globalAlpha = .5;
  for (const p of PLANETAS) desenharPlaneta(c, p);
  c.globalAlpha = 1;
  for (const p of PLANETAS) texto(c, p.nome.toUpperCase(), p.x, p.y + p.r + 8, 6.5, 'rgba(255,255,255,.55)');
  for (const l of LUZES) {
    if (l.estrela) estrela(c, l.x, l.y, l.r + 2); else circulo(c, l.x, l.y, l.r);
    c.fillStyle = l.cor; c.globalAlpha = .22; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.2; c.stroke();
    if (l.txt) texto(c, l.txt, l.x, l.y + .5, 8, 'rgba(255,255,255,.55)', '800');
  }
  texto(c, 'BOLA EXTRA', 185, 592, 7, 'rgba(255,170,110,.75)');
  texto(c, 'ESCUDO', 185, 704, 6, 'rgba(120,210,255,.8)');
  texto(c, 'BÔNUS', 185, 532, 7, 'rgba(120,255,180,.7)');
  texto(c, 'TRAVA', 306, 290, 5.5, 'rgba(210,170,255,.85)');
  texto(c, 'JACKPOT', 99, 406, 6, 'rgba(255,216,74,.75)');
  texto(c, 'LOOPING', 262, 393, 6, 'rgba(125,255,178,.8)');
  c.save(); c.translate(33, 660); c.rotate(-Math.PI / 2); texto(c, 'CATAPULTA', 0, 0, 5.5, 'rgba(255,140,230,.75)'); c.restore();
  for (const s of SETAS) { c.fillStyle = s.cor; c.globalAlpha = .25; seta(c, s.x, s.y, s.ang, 10); c.fill(); c.globalAlpha = 1; }
  texto(c, 'ÓRBITA', 41, 380, 7, 'rgba(255,216,74,.6)');

  // base da nave
  const bx = BASE_NAVE.x, by = BASE_NAVE.y;
  c.fillStyle = '#1a2036'; circulo(c, bx, by, 15); c.fill();
  c.strokeStyle = '#8f96a3'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = 'rgba(255,216,74,.5)'; c.lineWidth = 1; circulo(c, bx, by, 11); c.stroke();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.fillStyle = 'rgba(255,216,74,.35)'; circulo(c, bx + Math.cos(a) * 13, by + Math.sin(a) * 13, 1); c.fill(); }
  texto(c, 'NAVE', bx, by + 21, 6, 'rgba(255,255,255,.7)');

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
  texto(c, 'BURACO NEGRO', BURACO.x + 4, BURACO.y - 25, 6.5, 'rgba(210,170,255,.85)');

  caminho(c, BLOCO); c.closePath();
  const gbl = c.createLinearGradient(318, 0, 350, 0); gbl.addColorStop(0, '#3a3f4c'); gbl.addColorStop(1, '#14161c');
  c.fillStyle = gbl; c.fill();

  for (const s of ESTILINGUES) {
    caminho(c, [s.a, s.b, s.c]); c.closePath();
    const ge = c.createLinearGradient(s.a[0], s.a[1], s.c[0], s.c[1]); ge.addColorStop(0, '#ff5f8a'); ge.addColorStop(1, '#8c0f3c');
    c.fillStyle = ge; c.fill();
    const cx = (s.a[0] + s.b[0] + s.c[0]) / 3, cy = (s.a[1] + s.b[1] + s.c[1]) / 3;
    c.fillStyle = 'rgba(255,255,255,.75)'; estrela(c, cx, cy, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; estrela(c, cx - (s.a[0] < 185 ? 2 : -2), cy - 14, 2.5); c.fill();
  }
  const desenhaTrilho = (largura, cor, filtro) => {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = cor; c.lineWidth = largura;
    for (const p of paredes) if (filtro(p)) { c.beginPath(); c.moveTo(p.ax, p.ay); c.lineTo(p.bx, p.by); c.stroke(); }
  };
  const metal = p => p.tipo === 'trilho' || p.tipo === 'bloco';
  desenhaTrilho(8, '#050608', metal);
  desenhaTrilho(6, '#8f96a3', metal);
  desenhaTrilho(2.2, '#e8ecf3', metal);
  const borr = p => p.tipo === 'borracha';
  desenhaTrilho(7, '#1a1a1a', borr);
  desenhaTrilho(4.5, '#f4f4f0', borr);
  desenhaTrilho(3, '#c9ced8', p => p.tipo === 'portao');
  for (const p of paredes) if (p.tipo === 'poste') {
    c.lineCap = 'round';
    c.strokeStyle = '#0b0c10'; c.lineWidth = 10; c.beginPath(); c.moveTo(p.ax, p.ay); c.lineTo(p.bx, p.by); c.stroke();
    c.strokeStyle = '#c62f4f'; c.lineWidth = 8; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.ax - 1.5, p.ay + 2); c.lineTo(p.bx - 1.5, p.by - 2); c.stroke();
  }
  c.fillStyle = 'rgba(120,200,255,.18)'; c.fillRect(82, 336, 34, 16);
  c.fillStyle = 'rgba(125,255,178,.16)'; c.fillRect(249, 344, 26, 16);
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
function borda(T, desloc, ini = 0, fim = 1) {
  const pts = [];
  for (const p of T.pts) { const t = p.d / T.L; if (t < ini || t > fim) continue; pts.push([p.x - p.dy * desloc, p.y + p.dx * desloc]); }
  return pts;
}
function desenharRampa(c) {
  const T = RAMPA;
  c.save(); c.translate(5, 7); c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 18; c.lineCap = 'round'; c.lineJoin = 'round';
  caminho(c, borda(T, 0, .06, .97)); c.stroke(); c.restore();
  const a = borda(T, -11, 0, .2), b = borda(T, 11, 0, .2).reverse();
  caminho(c, a.concat(b)); c.closePath();
  c.fillStyle = 'rgba(110,200,255,.22)'; c.fill();
  c.strokeStyle = 'rgba(170,230,255,.6)'; c.lineWidth = 1.5; caminho(c, a); c.stroke(); caminho(c, b); c.stroke();
  c.strokeStyle = '#7d838f'; c.lineWidth = 1.6;
  for (let d = 30; d < T.L - 10; d += 26) { const p = pontoTrilha(T, d); c.beginPath(); c.moveTo(p.x - p.dy * 9, p.y + p.dx * 9); c.lineTo(p.x + p.dy * 9, p.y - p.dx * 9); c.stroke(); }
  for (const lado of [-8, 8]) {
    const pts = borda(T, lado, .02, 1);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#1a1c22'; c.lineWidth = 3.4; caminho(c, pts); c.stroke();
    c.strokeStyle = '#c9cfd9'; c.lineWidth = 2.1; caminho(c, pts); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .7; caminho(c, pts); c.stroke();
  }
  const p0 = T.pts[0];
  c.strokeStyle = '#e8ecf3'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p0.x - p0.dy * 12, p0.y + p0.dx * 12); c.lineTo(p0.x + p0.dy * 12, p0.y - p0.dx * 12); c.stroke();
  texto(c, 'RAMPA', p0.x, p0.y + 13, 6.5, 'rgba(170,230,255,.85)');
}
// cano de vidro: desenhado por cima da bola, que aparece "dentro"
function desenharTubo(c) {
  const T = TUBO, pts = borda(T, 0, 0, 1);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.save(); c.translate(6, 8); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 20; caminho(c, borda(T, 0, .08, .95)); c.stroke(); c.restore();
  c.strokeStyle = 'rgba(10,40,30,.55)'; c.lineWidth = 21; caminho(c, pts); c.stroke();
  c.strokeStyle = 'rgba(120,255,190,.16)'; c.lineWidth = 18; caminho(c, pts); c.stroke();
  c.strokeStyle = 'rgba(190,255,220,.55)'; c.lineWidth = 1.2;
  caminho(c, borda(T, -9, 0, 1)); c.stroke(); caminho(c, borda(T, 9, 0, 1)); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; caminho(c, borda(T, -5, 0, 1)); c.stroke();
  // anéis de metal
  c.strokeStyle = '#b9c0cc'; c.lineWidth = 2.2;
  for (let d = 18; d < T.L - 5; d += 46) { const p = pontoTrilha(T, d); c.beginPath(); c.moveTo(p.x - p.dy * 11, p.y + p.dx * 11); c.lineTo(p.x + p.dy * 11, p.y - p.dx * 11); c.stroke(); }
  const p0 = T.pts[0];
  c.strokeStyle = '#e8ecf3'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p0.x - p0.dy * 12, p0.y + p0.dx * 12); c.lineTo(p0.x + p0.dy * 12, p0.y - p0.dx * 12); c.stroke();
}

function desenharFrente(c) {
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
  escala = Math.min(w / W, h / H);
  dpr = Math.min(window.devicePixelRatio || 1, efeitos() ? dprMax : Math.min(dprMax, 1.5));
  tela.style.width = W * escala + 'px'; tela.style.height = H * escala + 'px';
  for (const cv of [tela, fundo, frente, camRampa, camTubo]) { cv.width = Math.round(W * escala * dpr); cv.height = Math.round(H * escala * dpr); }
  for (const [cv, fn] of [[fundo, desenharFundo], [frente, desenharFrente], [camRampa, desenharRampa], [camTubo, desenharTubo]]) {
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

// gira as marcas da bola de acordo com o quanto ela andou
function rolar(b, x, y) {
  const dx = x - b.px, dy = y - b.py, d = Math.hypot(dx, dy);
  b.px = x; b.py = y;
  if (d < .01 || d > 60) return;
  const ax = dy / d, ay = -dx / d, ang = d / R, co = Math.cos(ang), si = Math.sin(ang);
  for (const m of b.marcas) {
    const [mx, my, mz] = m, dot = ax * mx + ay * my;
    const cx = ay * mz, cy = -ax * mz, cz = ax * my - ay * mx;
    m[0] = mx * co + cx * si + ax * dot * (1 - co);
    m[1] = my * co + cy * si + ay * dot * (1 - co);
    m[2] = mz * co + cz * si;
  }
}

function desenharBola(b, x, y) {
  let r = R, alt = 0;
  if (b.trilha) { alt = b.trilha.h; r = R * (1 + .15 * alt); }
  if (b.presa) { const resta = b.presa - relogio; r = R * Math.max(.15, Math.min(1, (resta - 1) / .6, 1 - resta / .2)); }
  const vel = Math.hypot(b.vx, b.vy);
  if (efeitos()) {
    b.rastro.push([x, y]); if (b.rastro.length > 6) b.rastro.shift();
    if (vel > 700 && !b.presa) {
      ctx.lineCap = 'round';
      const n = b.rastro.length, f = Math.min(1, (vel - 700) / 1200);
      for (let i = 1; i < n; i++) {
        ctx.strokeStyle = `rgba(205,215,240,${.16 * f * i / n})`; ctx.lineWidth = r * 1.9 * i / n;
        ctx.beginPath(); ctx.moveTo(...b.rastro[i - 1]); ctx.lineTo(...b.rastro[i]); ctx.stroke();
      }
    }
  }
  const sx = 2 + (x - 185) / 70 + alt * 7, sy = 3 + (y + 100) / 260 + alt * 10;
  ctx.fillStyle = `rgba(0,0,0,${.45 - alt * .15})`; ctx.beginPath(); ctx.ellipse(x + sx, y + sy, r * 1.02, r * .92, 0, 0, DPI); ctx.fill();
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.22, '#e6eaf2'); g.addColorStop(.62, '#8a919e'); g.addColorStop(.9, '#3a3f49'); g.addColorStop(1, '#22252c');
  ctx.fillStyle = g; circulo(ctx, x, y, r); ctx.fill();
  for (const [mx, my, mz] of b.marcas) if (mz < -.15) {
    ctx.fillStyle = `rgba(60,66,80,${-mz * .38})`;
    circulo(ctx, x + mx * r * .86, y + my * r * .86, r * .13 * (-mz + .3)); ctx.fill();
  }
  ctx.fillStyle = 'rgba(130,110,255,.22)'; ctx.beginPath(); ctx.ellipse(x + r * .2, y + r * .5, r * .55, r * .25, 0, 0, DPI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(x - r * .38, y - r * .42, r * .24, r * .16, -.6, 0, DPI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; circulo(ctx, x + r * .42, y - r * .18, r * .08); ctx.fill();
  for (const c of COGUMELOS) if (c.flash > 0 && Math.hypot(c.x - x, c.y - y) < 60) {
    const a = Math.atan2(c.y - y, c.x - x);
    ctx.fillStyle = c.cor[1]; ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(x, y, r * .9, a - .7, a + .7); ctx.lineTo(x, y); ctx.fill(); ctx.globalAlpha = 1;
  }
}

function desenharNave() {
  const voando = nave.estado !== 'pronta' && nave.estado !== 'recarga';
  if (nave.estado === 'recarga') {
    // nave guardada no hangar: só a tampa e a contagem
    const f = Math.min(1, nave.t / 6);
    ctx.strokeStyle = 'rgba(255,216,74,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(BASE_NAVE.x, BASE_NAVE.y, 11, -Math.PI / 2, -Math.PI / 2 + DPI * f); ctx.stroke();
    return;
  }
  const x = nave.x, y = nave.y, alt = nave.alt, esc = 1 + .55 * alt;
  ctx.fillStyle = `rgba(0,0,0,${.4 - alt * .15})`; ctx.beginPath(); ctx.ellipse(x + 4 + alt * 16, y + 5 + alt * 22, 17 * esc, 12 * esc, 0, 0, DPI); ctx.fill();
  if (!voando) halo(x, y, 34, '#ffd84a', .35 + .25 * Math.sin(relogio * 6));
  ctx.save(); ctx.translate(x, y); ctx.rotate(nave.ang + Math.PI / 2); ctx.scale(esc, esc);
  if (voando) { // fogo dos motores
    const fl = aleat(.8, 1.2);
    ctx.fillStyle = 'rgba(255,140,40,.8)'; ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(0, 10 + 14 * fl); ctx.lineTo(6, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,150,.9)'; ctx.beginPath(); ctx.moveTo(-3, 10); ctx.lineTo(0, 10 + 8 * fl); ctx.lineTo(3, 10); ctx.fill();
  }
  // disco
  const gd = ctx.createRadialGradient(-5, -5, 2, 0, 0, 17);
  gd.addColorStop(0, '#ffffff'); gd.addColorStop(.5, '#b9c0cc'); gd.addColorStop(1, '#4a505c');
  ctx.fillStyle = gd; ctx.beginPath(); ctx.ellipse(0, 0, 17, 14, 0, 0, DPI); ctx.fill();
  ctx.strokeStyle = '#2a2e36'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#e0303f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 13, 10.5, 0, 0, DPI); ctx.stroke();
  // luzes em volta piscando
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + relogio * (voando ? 8 : 2), on = (k + Math.floor(relogio * 10)) % 2 === 0;
    ctx.fillStyle = on ? ['#ffd84a', '#7fe3ff', '#ff5d8a', '#7dffb2'][k % 4] : 'rgba(40,40,50,.8)';
    circulo(ctx, Math.cos(a) * 15, Math.sin(a) * 12, 1.4); ctx.fill();
  }
  // cúpula de vidro, com a bola dentro quando está carregando
  ctx.fillStyle = 'rgba(90,200,255,.35)'; circulo(ctx, 0, 0, 7); ctx.fill();
  if (nave.bola) { const gb = ctx.createRadialGradient(-1.5, -1.5, .3, 0, 0, 4.5); gb.addColorStop(0, '#fff'); gb.addColorStop(.6, '#9aa1ad'); gb.addColorStop(1, '#2a2e36'); ctx.fillStyle = gb; circulo(ctx, 0, 0, 4.5); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-2.5, -3, 2.5, 1.5, -.6, 0, DPI); ctx.fill();
  ctx.strokeStyle = 'rgba(200,240,255,.8)'; ctx.lineWidth = 1; circulo(ctx, 0, 0, 7); ctx.stroke();
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
    const on = atracao ? (i + Math.floor(relogio * (show > 0 ? 14 : 8))) % 5 === 0 : (l.on() || (l.pisca() && piscaOn));
    if (on) { brilho(l.x, l.y, l.r, l.cor, l.estrela); if (l.txt) texto(ctx, l.txt, l.x, l.y + .5, 8, '#05200f', '800'); }
  });
  if (j.estado === 'pronto' || relogio < j.skillAte) {
    const lx = 145 + j.skill * 40;
    ctx.strokeStyle = piscaOn ? '#ffffff' : 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; circulo(ctx, lx, 142, 9); ctx.stroke();
  }
  PLANETAS.forEach((p, i) => {
    const feito = i < j.planetas, atual = i === j.missao && j.estado !== 'fim';
    if (feito || (atual && piscaOn) || (atracao && (i + Math.floor(relogio * 4)) % 5 === 0)) {
      halo(p.x, p.y, p.r * 2.4, p.cor[1], feito ? .6 : .4);
      desenharPlaneta(ctx, p);
    }
  });
  for (const s of SETAS) {
    const on = j.estado !== 'fim' && ((missaoAtual() === s.ev) || (s.ev === 'rampa' && j.jackpot) || (s.ev === 'buraco' && j.trava) || (s.ev === 'nave' && nave.estado === 'pronta')) && piscaOn;
    if (on) { halo(s.x, s.y, 16, s.cor, .5); ctx.fillStyle = s.cor; seta(ctx, s.x, s.y, s.ang, 10); ctx.fill(); }
  }

  ctx.save(); ctx.translate(BURACO.x, BURACO.y); ctx.rotate(relogio * (bolas.some(b => b.presa) ? 9 : 2));
  ctx.strokeStyle = j.trava ? 'rgba(230,190,255,.85)' : 'rgba(200,150,255,.55)'; ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) { ctx.rotate(DPI / 3); ctx.beginPath(); ctx.arc(4, 0, 9, -1.2, .6); ctx.stroke(); }
  ctx.restore();

  const ac = Math.abs(Math.cos(spinner.ang));
  ctx.fillStyle = '#c9cfd9'; ctx.fillRect(26, 300 - 4 * ac, 30, 8 * ac + .6);
  ctx.fillStyle = 'rgba(255,216,74,.85)'; ctx.fillRect(26, 300 - 1.2 * ac, 30, 2.4 * ac + .2);

  ALVOS.forEach(a => {
    ctx.lineCap = 'butt';
    if (a.de_pe) {
      ctx.strokeStyle = '#3a0a0a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.lineTo(a.bx, a.by); ctx.stroke();
      ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.ax - 2, a.ay + 1); ctx.lineTo(a.bx - 2, a.by - 1); ctx.stroke();
    } else {
      const f = Math.max(0, 1 - (relogio - a.cai) / .12);
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.lineTo(a.bx, a.by); ctx.stroke();
      if (f > 0) { ctx.strokeStyle = `rgba(255,77,77,${f})`; ctx.lineWidth = 6 * f; ctx.stroke(); }
    }
  });
  for (const s of ESTILINGUES) if (s.flash > 0) {
    caminho(ctx, [s.a, s.b, s.c]); ctx.closePath(); ctx.fillStyle = 'rgba(255,240,200,.6)'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...s.a); ctx.lineTo(...s.c); ctx.stroke();
  }
  const missaoCog = j.estado !== 'fim' && missaoAtual() === 'cogumelo';
  for (const b of COGUMELOS) {
    const aceso = b.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; circulo(ctx, b.x + 3, b.y + 4, b.r + 1); ctx.fill();
    ctx.fillStyle = '#d9dce3'; circulo(ctx, b.x, b.y, b.r); ctx.fill();
    ctx.strokeStyle = '#555b66'; ctx.lineWidth = 1; ctx.stroke();
    if (aceso || (missaoCog && piscaOn)) halo(b.x, b.y, b.r * 2.4, b.cor[1], .8);
    const desce = aceso ? 1.5 : 0;
    ctx.fillStyle = gradRadial(ctx, b.x, b.y - 1 + desce, b.r - 4, aceso ? ['#ffffff', b.cor[0], b.cor[1]] : [b.cor[0], b.cor[1], b.cor[2]]);
    circulo(ctx, b.x, b.y - 1 + desce, b.r - 4); ctx.fill();
    ctx.fillStyle = aceso ? '#fff' : 'rgba(255,255,255,.55)';
    ctx.font = '900 11px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', b.x, b.y - 1 + desce);
  }
  ctx.fillStyle = '#1b1f29'; ctx.fillRect(354, plY, 22, 770 - plY);
  ctx.strokeStyle = '#a7adb9'; ctx.lineWidth = 1.6; ctx.beginPath();
  const voltas = 9, alto = 750 - (plY + 8);
  for (let i = 0; i <= voltas * 2; i++) { const y = plY + 8 + alto * i / (voltas * 2); ctx.lineTo(i % 2 ? 374 : 356, y); }
  ctx.stroke();
  const gp = ctx.createLinearGradient(354, 0, 376, 0); gp.addColorStop(0, '#7a0a14'); gp.addColorStop(.5, '#ff4d5e'); gp.addColorStop(1, '#7a0a14');
  ctx.fillStyle = gp; ctx.fillRect(354, plY, 22, 8);
  if (puxando) { ctx.fillStyle = `rgba(255,${Math.round(220 - 160 * puxar)},60,.9)`; ctx.fillRect(352, 760 - 120 * puxar, 3, 120 * puxar); }

  // nave parada na base (abaixo das bolas)
  if (nave.estado === 'pronta' || nave.estado === 'recarga') desenharNave();

  // posição suavizada entre dois passos da física: a bola anda sempre no mesmo ritmo
  const pos = b => [b.ox + (b.x - b.ox) * alfa, b.oy + (b.y - b.oy) * alfa];
  for (const b of bolas) {
    if (b.fora || b.naNave) continue;
    const [x, y] = pos(b); rolar(b, x, y);
    if (!b.trilha) desenharBola(b, x, y);
  }
  for (const p of palhetas) desenharPalheta(p, p.oang + (p.ang - p.oang) * alfa);

  ctx.drawImage(camRampa, 0, 0, W, H);
  for (const nome of ['rampa', 'tubo']) {
    const er = relogio - brilhoTrilha[nome], T = TRILHAS[nome];
    if (er < .9 && efeitos()) for (let q = 0; q < 6; q++) { const p = pontoTrilha(T, T.L * Math.max(0, Math.min(1, er / .9 - q * .04))); brilho(p.x, p.y, 3, nome === 'tubo' ? '#7dffb2' : '#7fe3ff'); }
  }
  for (const b of bolas) if (b.trilha && b.trilha.T === RAMPA) desenharBola(b, ...pos(b));
  for (const b of bolas) if (b.trilha && b.trilha.T === TUBO) desenharBola(b, ...pos(b));
  ctx.drawImage(camTubo, 0, 0, W, H);

  if (nave.estado !== 'pronta' && nave.estado !== 'recarga') desenharNave();

  ctx.drawImage(frente, 0, 0, W, H);

  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    if (!pausado) { p.vida -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 3 * dt; p.vy = p.vy * (1 - 3 * dt) + 200 * dt; }
    if (p.vida <= 0) { particulas.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, p.vida / p.max * 1.5);
    ctx.fillStyle = p.cor; ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    if (!pausado) p.t += dt;
    if (p.t > .9) { popups.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, (0.9 - p.t) * 3);
    ctx.font = '900 10px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = '#1a0830'; ctx.strokeText(p.txt, p.x, p.y - p.t * 30);
    ctx.fillStyle = p.cor; ctx.fillText(p.txt, p.x, p.y - p.t * 30);
  }
  ctx.globalAlpha = 1;
  if (gi > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${giCor},${Math.min(.35, gi * .35)})`; caminho(ctx, CONTORNO); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  let grande = '';
  if (pausado) grande = 'PAUSADO';
  else if (j.tiltado) grande = 'TILT';
  else if (j.estado === 'fim') grande = 'FIM DE JOGO';
  if (grande) {
    ctx.fillStyle = 'rgba(5,6,20,.55)'; ctx.fillRect(40, 330, 290, 70);
    ctx.font = 'italic 900 34px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = '#2a0b3a'; ctx.strokeText(grande, 185, 362);
    ctx.fillStyle = grande === 'TILT' ? '#ff4d4d' : '#ffd84a'; ctx.fillText(grande, 185, 362);
    const sub = pausado ? 'Toque na mesa para continuar' : j.estado === 'fim' ? 'Aperte "Novo jogo"' : '';
    if (sub) texto(ctx, sub, 185, 389, 11, '#ffffff', '600');
  }
}

function desenharPalheta(p, ang) {
  const co = Math.cos(ang), si = Math.sin(ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
  const forma = (dx, dy) => {
    ctx.beginPath();
    ctx.arc(p.px + dx, p.py + dy, p.rb, ang + Math.PI / 2, ang + Math.PI * 1.5);
    ctx.arc(tx + dx, ty + dy, p.rt, ang - Math.PI / 2, ang + Math.PI / 2);
    ctx.closePath();
  };
  forma(3, 4); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
  forma(0, 0);
  const g = ctx.createLinearGradient(p.px - si * 10, p.py + co * 10, p.px + si * 10, p.py - co * 10);
  g.addColorStop(0, '#c9ccd4'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#d7dae1');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#d11f2c'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#8a8f9a'; circulo(ctx, p.px, p.py, 3.2); ctx.fill();
  ctx.fillStyle = '#e8ebf0'; circulo(ctx, p.px - .8, p.py - .8, 1.3); ctx.fill();
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
  } else if (nave.estado === 'voando' || nave.estado === 'decolando') {
    // nave voando no placar
    const f = (relogio * .6) % 1, x = -20 + f * 168;
    bctx.beginPath(); bctx.ellipse(x, 18, 10, 4, 0, 0, DPI); bctx.fill();
    bctx.beginPath(); bctx.arc(x, 15, 4, Math.PI, 0); bctx.fill();
    for (let k = 1; k < 5; k++) bctx.fillRect(x - 10 - k * 6, 17 + (k % 2), 3, 2);
    dTexto('EM VOO', 64, 5, 8);
  } else if (j.estado === 'fim') {
    const fase = Math.floor(relogio / 2.5) % 3;
    if (fase === 0) dTexto('FIM DE JOGO', 64, 16, cabe('FIM DE JOGO', 18, 124));
    else if (fase === 1) { dTexto('SEUS PONTOS', 64, 6, 8); dTexto(fmt(j.pontos), 64, 21, cabe(fmt(j.pontos), 18, 124)); }
    else { dTexto('RECORDE', 64, 6, 8); const t = fmt(Math.max(dados.melhor || 0, j.pontos)); dTexto(t, 64, 21, cabe(t, 18, 124)); }
  } else {
    dTexto(`BOLA ${j.bola}/${totalBolas}`, 2, 5, 8, 'left');
    dTexto(`x${j.mult}`, 126, 5, 8, 'right');
    if (j.multibola) dTexto('MULTIBOLA', 64, 5, 8);
    else if (j.estado === 'pronto' && Math.floor(relogio * 1.5) % 2 === 0) dTexto('LANCE A BOLA', 64, 5, 8);
    else if (j.extras) dTexto(`+${j.extras} EXTRA`, 64, 5, 8);
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
let antes = performance.now(), acumulado = 0, somConf = true, contaQ = 0, tempos = [];
function quadro(agora) {
  const bruto = (agora - antes) / 1000, dt = Math.min(.1, bruto);
  antes = agora;
  const parado = pausado || dialogoAberto(), inicio = performance.now();
  if (!parado) {
    acumulado += dt;
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
if (location.hostname === 'localhost') window.__pb = { get bolas() { return bolas; }, palhetas, ALVOS, nave, get j() { return j; }, passo: s => { for (let i = 0; i < s / PASSO; i++) passo(PASSO); }, comecarPuxar, soltar, desenhar: () => { desenhar(0, 1); painel(); }, get relogio() { return relogio; }, RAMPA, TUBO, novaBola, get dprMax() { return dprMax; } }; // só para testes no computador
mostrarRecordes();
ajustarTamanho();
requestAnimationFrame(quadro);
})();

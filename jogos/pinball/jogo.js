// Pinball Galáxia: mesa de pinball com física própria, desenhada no canvas.
// Medidas da mesa em "unidades" (400 x 740); a tela só aumenta ou diminui o desenho.
(() => {
'use strict';
const W = 400, H = 740, R = 8, G = 820, PASSO = 1 / 600, VMAX = 2600;
const PL_BASE = 705, PL_CURSO = 32;
const tela = document.getElementById('tela'), ctx = tela.getContext('2d');
const mesa = document.getElementById('mesa');
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('pt-BR');

// ================= Peças da mesa =================
const paredes = [];
function seg(ax, ay, bx, by, o) { const p = Object.assign({ ax, ay, bx, by, r: 3, e: .5, f: .015, tipo: 'trilho' }, o); paredes.push(p); return p; }
function linha(pts, o) { for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); }

const ARCO = [];
for (let i = 0; i <= 32; i++) { const t = Math.PI * (1 + i / 32); ARCO.push([200 + 180 * Math.cos(t), 175 + 155 * Math.sin(t)]); }
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
  seg(...s.a, ...s.c, { e: .6, tipo: 'borracha', chute: 430, est: s });
}

const BLOCO = [[350, 298], [330, 315], [318, 405], [350, 420]];
linha(BLOCO, { tipo: 'bloco', e: .4 });
const ALVOS = [];
for (const [t0, t1] of [[.03, .31], [.36, .64], [.69, .97]]) {
  const x0 = 324, y0 = 318, x1 = 312, y1 = 402;
  ALVOS.push({ ax: x0 + (x1 - x0) * t0, ay: y0 + (y1 - y0) * t0, bx: x0 + (x1 - x0) * t1, by: y0 + (y1 - y0) * t1, de_pe: true });
}

const COGUMELOS = [
  { x: 145, y: 215, r: 19, cor: ['#ffc2d1', '#e91e63', '#7a0f36'], flash: 0 },
  { x: 225, y: 205, r: 19, cor: ['#c4f1ff', '#039be5', '#014a72'], flash: 0 },
  { x: 185, y: 282, r: 19, cor: ['#fff0b8', '#fb8c00', '#7a3d00'], flash: 0 },
];
const BURACO = { x: 288, y: 258 };

const palhetas = [
  { px: 116, py: 646, len: 60, rb: 10, rt: 5.5, rep: .5, cima: -.45, ang: .5, w: 0, apertada: false },
  { px: 254, py: 646, len: 60, rb: 10, rt: 5.5, rep: Math.PI - .5, cima: Math.PI + .45, ang: Math.PI - .5, w: 0, apertada: false },
];

const PLANETAS = [
  { nome: 'Lua', x: 113, y: 452, r: 10, cor: ['#ffffff', '#b8bcc6', '#555a66'] },
  { nome: 'Marte', x: 148, y: 424, r: 11, cor: ['#ffb08a', '#d84a22', '#5c1405'] },
  { nome: 'Júpiter', x: 185, y: 410, r: 15, cor: ['#ffe7c2', '#d9a066', '#6b3d14'] },
  { nome: 'Saturno', x: 222, y: 424, r: 11, cor: ['#fff6cf', '#e3c46d', '#6e5313'], anel: true },
  { nome: 'Netuno', x: 257, y: 452, r: 10, cor: ['#c9dcff', '#3f6cff', '#0d1f6b'] },
];
const MISSOES = [
  { ev: 'bancada', txt: 'derrube os alvos', meta: r => r },
  { ev: 'orbita', txt: 'faça órbitas', meta: r => 2 + r },
  { ev: 'cogumelo', txt: 'acerte os cogumelos', meta: r => 10 + 5 * r },
  { ev: 'luzes', txt: 'acenda as 3 luzes do topo', meta: r => r },
  { ev: 'buraco', txt: 'caia no buraco negro', meta: r => 1 + r },
];

// Áreas que contam pontos quando a bola passa (não são sólidas)
const ZONAS = [
  ...[145, 185, 225].map((x, i) => ({ x0: x - 10, y0: 98, x1: x + 10, y1: 118, ev: 'trilha', i })),
  { x0: 24, y0: 300, x1: 58, y1: 330, ev: 'orbita', sobe: true },
  { x0: 50, y0: 560, x1: 68, y1: 590, ev: 'retorno' }, { x0: 302, y0: 560, x1: 320, y1: 590, ev: 'retorno' },
  { x0: 24, y0: 560, x1: 42, y1: 590, ev: 'fora' }, { x0: 328, y0: 560, x1: 346, y1: 590, ev: 'fora' },
  { x0: 353, y0: 150, x1: 380, y1: 185, ev: 'saiu', sobe: true },
];

// ================= Estado =================
const bola = { x: 365, y: PL_BASE - R, vx: 0, vy: 0, presa: 0, fora: false };
let plY = PL_BASE, puxar = 0, puxando = false;
let relogio = 0, pausado = false, tremor = 0, parado = 0, buracoIgnora = 0;
let mensagem = '', msgAte = 0;
const agenda = [];
const depois = (s, fn) => agenda.push({ t: relogio + s, fn });
const msg = (t, s = 2.4) => { mensagem = t; msgAte = relogio + s; };

const dados = JO.carregar('pinball', { recordes: [], jogos: 0, melhor: 0, nome: '' });
let j;

// ================= Sons (feitos pelo código) =================
const som = (() => {
  let ac = null, mestre = null, buf = null;
  function pronto() {
    if (!JO.carregar('som', true)) return false;
    try {
      if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); mestre = ac.createGain(); mestre.gain.value = .55; mestre.connect(ac.destination); }
      if (ac.state === 'suspended') ac.resume();
      return true;
    } catch (e) { return false; }
  }
  function tom(f, dur, tipo = 'square', vol = .12, f2 = 0, atraso = 0) {
    const t = ac.currentTime + atraso, o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + .02);
  }
  function ruido(dur, vol = .2, freq = 1500, atraso = 0, filtro = 'lowpass') {
    if (!buf) { buf = ac.createBuffer(1, ac.sampleRate * .6, ac.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = ac.currentTime + atraso, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; fl.type = filtro; fl.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(mestre); s.start(t); s.stop(t + dur + .02);
  }
  const arpejo = (notas, d, vol = .06, tipo = 'square') => notas.forEach((f, i) => tom(f, d * 1.3, tipo, vol, 0, i * d));
  const S = {
    palheta() { ruido(.05, .3, 900); tom(150, .05, 'triangle', .12, 60); },
    cogumelo() { tom(440, .1, 'square', .08, 150); ruido(.05, .15, 3200); },
    estilingue() { tom(260, .06, 'square', .08, 120); ruido(.04, .18, 2600); },
    trilha() { tom(1320, .06, 'sine', .11); },
    alvo() { tom(880, .05, 'square', .07); tom(620, .07, 'square', .06, 0, .045); },
    bancada() { arpejo([523, 659, 784, 1047], .07); },
    orbita() { tom(280, .4, 'sawtooth', .05, 1400); },
    buraco() { tom(720, .9, 'sine', .13, 50); ruido(.7, .08, 500); },
    ejetar() { ruido(.14, .3, 1300); tom(95, .12, 'square', .1, 45); },
    lancar() { ruido(.18, .25, 2200, 0, 'bandpass'); tom(120, .1, 'triangle', .08, 60); },
    mola() { tom(70, .05, 'triangle', .06); },
    perdeu() { arpejo([392, 330, 262, 196], .16, .1, 'triangle'); },
    missao() { arpejo([523, 659, 784, 659, 784, 1047], .09); },
    extra() { arpejo([784, 988, 1175, 1568, 1175, 1568], .09, .07); },
    tilt() { tom(70, .8, 'sawtooth', .16); },
    aviso() { tom(160, .15, 'square', .1); },
    salvo() { tom(600, .1, 'sine', .12); tom(900, .16, 'sine', .12, 0, .1); },
    contar() { tom(1050, .03, 'square', .04); },
    inicio() { arpejo([262, 330, 392, 523, 392, 523], .08); },
    retorno() { tom(980, .05, 'sine', .08); },
  };
  return nome => { if (pronto() && S[nome]) try { S[nome](); } catch (e) {} };
})();

// ================= Partida =================
function novoJogo() {
  agenda.length = 0;
  j = { pontos: 0, bola: 1, extras: 0, mult: 1, trilhas: [false, false, false], missao: 0, prog: 0, rodada: 1,
        planetas: 0, bonus: 0, salvaAte: 0, tilt: 0, tiltado: false, estado: 'pronto', extraPontos: false };
  ALVOS.forEach(a => a.de_pe = true);
  prepararBola();
  som('inicio');
  msg('BOA SORTE!', 2);
}
function prepararBola() {
  Object.assign(bola, { x: 365, y: plY - R, vx: 0, vy: 0, presa: 0, fora: false });
  j.estado = 'pronto'; j.mult = 1; j.bonus = 0; j.tilt = 0; j.tiltado = false; j.salvaAte = 0;
}
function pontuar(n) {
  if (j.tiltado || j.estado === 'fim') return;
  j.pontos += n;
  if (!j.extraPontos && j.pontos >= 750000) { j.extraPontos = true; ganharExtra(); }
}
function ganharExtra() { j.extras++; som('extra'); msg('BOLA EXTRA!', 3); JO.vibrar(80); }
const missaoAtual = () => MISSOES[j.missao].ev;
function evento(tipo) {
  if (j.tiltado || missaoAtual() !== tipo) return;
  j.prog++;
  if (j.prog < MISSOES[j.missao].meta(j.rodada)) return;
  const p = PLANETAS[j.missao];
  pontuar(25000 * (j.missao + 1) * j.rodada);
  j.planetas++; j.missao++; j.prog = 0;
  som('missao');
  msg(`MISSÃO ${p.nome} COMPLETA!`, 3);
  if (j.missao >= MISSOES.length) {
    depois(2.2, () => {
      pontuar(250000 * j.rodada); msg('GALÁXIA CONQUISTADA!', 3.5);
      j.rodada++; j.missao = 0; j.planetas = 0; ganharExtra(); msg('GALÁXIA CONQUISTADA! BOLA EXTRA', 3.5);
    });
  }
}

function aoEntrar(z) {
  if (j.tiltado) return;
  switch (z.ev) {
    case 'trilha':
      som('trilha');
      if (j.trilhas[z.i]) { pontuar(100); break; }
      j.trilhas[z.i] = true; pontuar(500); j.bonus += 200;
      if (j.trilhas.every(Boolean)) {
        if (j.mult < 5) j.mult++;
        pontuar(5000); msg(`MULTIPLICADOR x${j.mult}`); evento('luzes');
        depois(.6, () => { j.trilhas = [false, false, false]; });
      }
      break;
    case 'orbita':
      pontuar(5000 * j.rodada); j.bonus += 1000; som('orbita'); msg('ÓRBITA!'); evento('orbita'); break;
    case 'retorno': pontuar(1000); j.bonus += 250; som('retorno'); break;
    case 'fora': pontuar(2500); msg('QUE AZAR...'); break;
    case 'saiu':
      if (j.estado === 'pronto') { j.estado = 'jogando'; j.salvaAte = relogio + 9; }
      break;
  }
}

function drenou() {
  if (j.estado === 'fim') return;
  if (!j.tiltado && relogio < j.salvaAte) {
    j.salvaAte = 0; som('salvo'); msg('BOLA SALVA!', 2.5);
    depois(.8, () => { Object.assign(bola, { x: 365, y: plY - R, vx: 0, vy: 0, fora: false }); j.estado = 'pronto'; });
    return;
  }
  j.estado = 'bonus';
  som('perdeu'); JO.vibrar(120);
  const total = j.tiltado ? 0 : j.bonus * j.mult;
  msg(j.tiltado ? 'TILT - SEM BÔNUS' : `BÔNUS ${fmt(j.bonus)} x${j.mult}`, 2.6);
  if (total > 0) for (let k = 1; k <= 10; k++) depois(1 + k * .09, () => { j.pontos += total / 10; som('contar'); });
  depois(2.8, proximaBola);
}
function proximaBola() {
  j.pontos = Math.round(j.pontos);
  j.tiltado = false;
  if (j.extras > 0) { j.extras--; prepararBola(); msg('JOGUE DE NOVO!', 2.5); return; }
  if (j.bola < 3) { j.bola++; prepararBola(); msg(`BOLA ${j.bola}`, 2); return; }
  fimDeJogo();
}
function fimDeJogo() {
  j.estado = 'fim';
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
    ? dados.recordes.map(r => `<li><span></span><span></span></li>`).join('')
    : '<li class="vazio">Nenhum ainda. Seja o primeiro!</li>';
  if (dados.recordes.length) [...ol.children].forEach((li, i) => { li.children[0].textContent = dados.recordes[i].n; li.children[1].textContent = fmt(dados.recordes[i].p); });
}

function sacudir() {
  if (pausado || j.tiltado || j.estado !== 'jogando') return;
  tremor = .22;
  if (!bola.presa && !bola.fora) { bola.vx += (Math.random() < .5 ? -1 : 1) * (50 + Math.random() * 50); bola.vy -= 150; }
  j.tilt += 1;
  if (j.tilt >= 3) { j.tiltado = true; som('tilt'); msg('TILT', 5); JO.vibrar([200, 80, 200]); palhetas.forEach(p => p.apertada = false); }
  else if (j.tilt >= 2) { som('aviso'); msg('CUIDADO!', 1.5); }
  else som('mola');
}

// ================= Física =================
const C = { nx: 0, ny: 0, pen: 0, qx: 0, qy: 0 };
function contato(ax, ay, bx, by, rad) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let t = L2 ? ((bola.x - ax) * dx + (bola.y - ay) * dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx * t, qy = ay + dy * t, ex = bola.x - qx, ey = bola.y - qy, d2 = ex * ex + ey * ey, m = R + rad;
  if (d2 >= m * m) return null;
  const d = Math.sqrt(d2) || 1e-6;
  C.nx = ex / d; C.ny = ey / d; C.pen = m - d; C.qx = qx; C.qy = qy;
  return C;
}
// Empurra a bola para fora e devolve a força da batida
function rebater(c, e, f, svx = 0, svy = 0) {
  bola.x += c.nx * c.pen; bola.y += c.ny * c.pen;
  const rvx = bola.vx - svx, rvy = bola.vy - svy, vn = rvx * c.nx + rvy * c.ny;
  if (vn >= 0) return 0;
  const tx = -c.ny, ty = c.nx, vt = rvx * tx + rvy * ty;
  const nvn = vn > -35 ? 0 : -vn * e, nvt = vt * (1 - f);
  bola.vx = svx + c.nx * nvn + tx * nvt; bola.vy = svy + c.ny * nvn + ty * nvt;
  return -vn;
}

function colisoes() {
  for (const p of paredes) {
    if (p.mao && (bola.x - p.ax) * p.mao[0] + (bola.y - p.ay) * p.mao[1] < 0) continue;
    const c = contato(p.ax, p.ay, p.bx, p.by, p.r);
    if (!c) continue;
    const forca = rebater(c, p.e, p.f);
    if (p.chute && forca > 60 && p.est.flash <= 0) {
      bola.vx += c.nx * p.chute; bola.vy += c.ny * p.chute;
      p.est.flash = .14; pontuar(100); j.bonus += 20; som('estilingue');
    }
  }
  for (const a of ALVOS) {
    if (!a.de_pe) continue;
    const c = contato(a.ax, a.ay, a.bx, a.by, 3);
    if (!c) continue;
    if (rebater(c, .3, .02) > 40 && !j.tiltado) {
      a.de_pe = false; pontuar(1500); j.bonus += 750; som('alvo');
      if (ALVOS.every(x => !x.de_pe)) {
        pontuar(10000 * j.rodada); som('bancada'); msg('ALVOS DERRUBADOS!'); evento('bancada');
        depois(1.2, () => ALVOS.forEach(x => x.de_pe = true));
      }
    }
  }
  for (const b of COGUMELOS) {
    const c = contato(b.x, b.y, b.x, b.y, b.r);
    if (!c) continue;
    rebater(c, .5, .02);
    if (b.flash <= .06) {
      bola.vx += c.nx * 560; bola.vy += c.ny * 560;
      b.flash = .16;
      if (!j.tiltado) { pontuar(1000); j.bonus += 100; som('cogumelo'); evento('cogumelo'); }
    }
  }
  for (const p of palhetas) {
    const co = Math.cos(p.ang), si = Math.sin(p.ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
    let t = ((bola.x - p.px) * co + (bola.y - p.py) * si) / p.len;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const c = contato(p.px, p.py, tx, ty, p.rb + (p.rt - p.rb) * t);
    if (!c) continue;
    rebater(c, .32, .03, -p.w * (c.qy - p.py), p.w * (c.qx - p.px));
  }
  // ponta do lançador
  if (bola.x > 351 && bola.y + R > plY && bola.y < plY + 24) {
    bola.y = plY - R;
    if (bola.vy > 0) bola.vy = bola.vy > 60 ? -bola.vy * .25 : 0;
    bola.vx *= .5;
  }
}

function passo(h) {
  relogio += h;
  for (let i = agenda.length - 1; i >= 0; i--) if (agenda[i].t <= relogio) { const f = agenda[i].fn; agenda.splice(i, 1); f(); }

  for (const p of palhetas) {
    const alvo = p.apertada ? p.cima : p.rep, ant = p.ang, dif = alvo - p.ang;
    p.ang += Math.sign(dif) * Math.min(Math.abs(dif), (p.apertada ? 42 : 20) * h);
    p.w = (p.ang - ant) / h;
  }
  if (puxando) { puxar = Math.min(1, puxar + h / 1.1); plY = PL_BASE + PL_CURSO * puxar; }
  else if (plY > PL_BASE) plY = Math.max(PL_BASE, plY - 1400 * h);
  for (const s of ESTILINGUES) s.flash -= h;
  for (const b of COGUMELOS) b.flash -= h;
  if (tremor > 0) tremor -= h;
  j.tilt = Math.max(0, j.tilt - .3 * h);

  if (bola.presa) { if (relogio >= bola.presa) ejetar(); return; }
  if (bola.fora) return;

  bola.vy += G * h;
  if (relogio > buracoIgnora) {
    const dx = BURACO.x - bola.x, dy = BURACO.y - bola.y, d = Math.hypot(dx, dy);
    if (d < 22) {
      if (d < 8 && Math.hypot(bola.vx, bola.vy) < 1100) { capturar(); return; }
      const k = 1500 * (1 - d / 22) * h / (d || 1);
      bola.vx += dx * k; bola.vy += dy * k;
    }
  }
  bola.vx *= 1 - .08 * h; bola.vy *= 1 - .08 * h;
  const v2 = bola.vx * bola.vx + bola.vy * bola.vy;
  if (v2 > VMAX * VMAX) { const k = VMAX / Math.sqrt(v2); bola.vx *= k; bola.vy *= k; }
  bola.x += bola.vx * h; bola.y += bola.vy * h;

  colisoes();
  for (const z of ZONAS) {
    const dentro = bola.x > z.x0 && bola.x < z.x1 && bola.y > z.y0 && bola.y < z.y1;
    if (dentro && !z.dentro && (!z.sobe || bola.vy < 0)) aoEntrar(z);
    z.dentro = dentro;
  }
  // bola parada num canto por muito tempo: a mesa dá um empurrãozinho
  if (j.estado === 'jogando' && bola.x < 350 && Math.hypot(bola.vx, bola.vy) < 12 && !palhetas.some(p => p.apertada)) {
    parado += h;
    if (parado > 3) { bola.vy = -380; bola.vx = (Math.random() - .5) * 240; parado = 0; }
  } else parado = 0;

  if (bola.y > 760) { bola.fora = true; drenou(); }
}
function capturar() {
  Object.assign(bola, { x: BURACO.x, y: BURACO.y, vx: 0, vy: 0, presa: relogio + 1.6 });
  som('buraco');
  if (!j.tiltado) { pontuar(7500 * j.rodada); j.bonus += 1500; msg('BURACO NEGRO!'); evento('buraco'); }
}
function ejetar() {
  bola.presa = 0; buracoIgnora = relogio + .5;
  bola.vx = -250 - Math.random() * 140; bola.vy = 250 + Math.random() * 120;
  som('ejetar');
}

// ================= Controles =================
const teclas = { E: false, D: false };
const toques = new Map();
function atualizarPalhetas() {
  const lados = [...toques.values()];
  const e = (teclas.E || lados.includes('E')) && !j.tiltado, d = (teclas.D || lados.includes('D')) && !j.tiltado;
  if (pausado) return;
  if (e && !palhetas[0].apertada) { som('palheta'); girarTrilhas(-1); }
  if (d && !palhetas[1].apertada) { som('palheta'); girarTrilhas(1); }
  palhetas[0].apertada = e; palhetas[1].apertada = d;
}
// as palhetas trocam as luzes do topo de lugar (para ajudar a acender a que falta)
function girarTrilhas(dir) {
  if (j.estado !== 'jogando' || j.trilhas.every(Boolean)) return;
  const t = j.trilhas;
  j.trilhas = dir > 0 ? [t[2], t[0], t[1]] : [t[1], t[2], t[0]];
}
const bolaNoLancador = () => bola.x > 351 && bola.y > 600 && !bola.fora;
function comecarPuxar() { if (pausado || puxando) return; puxando = true; puxar = 0; som('mola'); }
function soltar() {
  if (!puxando) return;
  puxando = false;
  if (bola.x > 351 && Math.abs(bola.y + R - plY) < 4) {
    bola.vy = -(300 + 1700 * puxar) * (.97 + Math.random() * .06);
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
  if (lado === 'D' && bolaNoLancador()) { lancadores.add(e.pointerId); comecarPuxar(); }
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

// ================= Desenho =================
let escala = 1, dpr = 1;
const fundo = document.createElement('canvas'), frente = document.createElement('canvas');

function caminho(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
function circulo(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
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
const SETAS = [
  { x: 74, y: 468, ang: -Math.PI / 2 - .35, ev: 'orbita', cor: '#ffd84a' },
  { x: 262, y: 296, ang: -.95, ev: 'buraco', cor: '#c77dff' },
  { x: 283, y: 362, ang: -.08, ev: 'bancada', cor: '#ff5d5d' },
];
const LUZES = [
  ...[145, 185, 225].map((x, i) => ({ x, y: 142, r: 6, cor: '#ffd84a', on: () => j.trilhas[i], pisca: () => missaoAtual() === 'luzes' && !j.trilhas[i] })),
  ...ALVOS.map(a => ({ x: (a.ax + a.bx) / 2 - 20, y: (a.ay + a.by) / 2, r: 4.5, cor: '#ff5d5d', on: () => !a.de_pe, pisca: () => false })),
  ...[2, 3, 4, 5].map((k, i) => ({ x: 140 + i * 30, y: 548, r: 10, cor: '#4dffa6', txt: k + 'x', on: () => j.mult >= k, pisca: () => false })),
  { x: 185, y: 579, r: 7, cor: '#ff8a3d', on: () => j.extras > 0, pisca: () => false },
  { x: 185, y: 693, r: 6, cor: '#49c6ff', on: () => relogio < j.salvaAte, pisca: () => j.salvaAte - relogio < 2.5 },
];

function desenharFundo(c) {
  // gabinete de madeira
  const gm = c.createLinearGradient(0, 0, W, 0);
  gm.addColorStop(0, '#2a1a0e'); gm.addColorStop(.5, '#3b2615'); gm.addColorStop(1, '#2a1a0e');
  c.fillStyle = gm; c.fillRect(0, 0, W, H);
  c.save();
  caminho(c, CONTORNO); c.closePath(); c.clip();
  // espaço
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
  // grade em perspectiva perto das palhetas (bem anos 90)
  c.strokeStyle = 'rgba(80,220,255,.13)'; c.lineWidth = 1;
  for (let i = 0; i <= 12; i++) { const x = 185 + (i - 6) * 34; c.beginPath(); c.moveTo(185 + (i - 6) * 8, 610); c.lineTo(x, 740); c.stroke(); }
  for (let k = 0; k < 6; k++) { const y = 610 + Math.pow(k / 5, 1.6) * 130; c.beginPath(); c.moveTo(20, y); c.lineTo(350, y); c.stroke(); }
  // corredor do lançador
  const gl = c.createLinearGradient(350, 0, 380, 0);
  gl.addColorStop(0, '#05070f'); gl.addColorStop(.5, '#121831'); gl.addColorStop(1, '#05070f');
  c.fillStyle = gl; c.fillRect(350, 214, 30, 560);
  for (let y = 300; y < 660; y += 60) { c.fillStyle = 'rgba(255,216,74,.25)'; seta(c, 365, y, -Math.PI / 2, 6); c.fill(); }
  // canal da órbita
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(20, 240, 42, 205);

  // planetas apagados
  c.globalAlpha = .5;
  for (const p of PLANETAS) desenharPlaneta(c, p);
  c.globalAlpha = 1;
  for (const p of PLANETAS) texto(c, p.nome.toUpperCase(), p.x, p.y + p.r + 8, 6.5, 'rgba(255,255,255,.55)');
  // soquetes das luzes
  for (const l of LUZES) {
    circulo(c, l.x, l.y, l.r); c.fillStyle = l.cor; c.globalAlpha = .22; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.2; c.stroke();
    if (l.txt) texto(c, l.txt, l.x, l.y + .5, 8, 'rgba(255,255,255,.55)', '800');
  }
  texto(c, 'BOLA EXTRA', 185, 592, 7, 'rgba(255,170,110,.75)');
  texto(c, 'ESCUDO', 185, 704, 6, 'rgba(120,210,255,.8)');
  texto(c, 'BÔNUS', 185, 532, 7, 'rgba(120,255,180,.7)');
  for (const s of SETAS) { c.fillStyle = s.cor; c.globalAlpha = .25; seta(c, s.x, s.y, s.ang, 12); c.fill(); c.globalAlpha = 1; }
  texto(c, 'ÓRBITA', 41, 380, 7, 'rgba(255,216,74,.6)');

  // logotipo
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

  // buraco negro
  const gb = c.createRadialGradient(BURACO.x, BURACO.y, 2, BURACO.x, BURACO.y, 20);
  gb.addColorStop(0, '#000'); gb.addColorStop(.55, '#000'); gb.addColorStop(.75, 'rgba(150,70,255,.7)'); gb.addColorStop(1, 'rgba(150,70,255,0)');
  c.fillStyle = gb; circulo(c, BURACO.x, BURACO.y, 20); c.fill();
  texto(c, 'BURACO NEGRO', BURACO.x + 4, BURACO.y - 25, 6.5, 'rgba(210,170,255,.85)');

  // bloco dos alvos
  caminho(c, BLOCO); c.closePath();
  const gbl = c.createLinearGradient(318, 0, 350, 0); gbl.addColorStop(0, '#3a3f4c'); gbl.addColorStop(1, '#14161c');
  c.fillStyle = gbl; c.fill();

  // estilingues (plástico)
  for (const s of ESTILINGUES) {
    caminho(c, [s.a, s.b, s.c]); c.closePath();
    const ge = c.createLinearGradient(s.a[0], s.a[1], s.c[0], s.c[1]); ge.addColorStop(0, '#ff5f8a'); ge.addColorStop(1, '#8c0f3c');
    c.fillStyle = ge; c.fill();
  }
  // trilhos de metal
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
  c.restore();
  // borda do gabinete
  c.lineWidth = 3; c.strokeStyle = '#120c07'; caminho(c, CONTORNO); c.stroke();
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

function desenharFrente(c) {
  // avental (chapa de baixo) que esconde o ralo
  for (const pts of [[[20, 686], [140, 700], [160, 770], [20, 770]], [[350, 686], [230, 700], [210, 770], [350, 770]]]) {
    caminho(c, pts); c.closePath();
    const g = c.createLinearGradient(0, 686, 0, 740); g.addColorStop(0, '#3a4150'); g.addColorStop(1, '#151820');
    c.fillStyle = g; c.fill();
    c.strokeStyle = '#c9ced8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
  }
  texto(c, '3 BOLAS POR JOGO', 72, 718, 6.5, 'rgba(255,210,120,.8)');
  texto(c, 'BOLA EXTRA', 296, 712, 6.5, 'rgba(255,210,120,.8)');
  texto(c, '750.000 PONTOS', 296, 722, 6.5, 'rgba(255,210,120,.8)');
  // reflexo do vidro
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
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  tela.style.width = W * escala + 'px'; tela.style.height = H * escala + 'px';
  for (const cv of [tela, fundo, frente]) { cv.width = Math.round(W * escala * dpr); cv.height = Math.round(H * escala * dpr); }
  for (const [cv, fn] of [[fundo, desenharFundo], [frente, desenharFrente]]) {
    const c = cv.getContext('2d'); c.setTransform(escala * dpr, 0, 0, escala * dpr, 0, 0); fn(c);
  }
}
new ResizeObserver(ajustarTamanho).observe(mesa);

function brilho(x, y, r, cor, forca = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = .55 * forca; ctx.fillStyle = g; circulo(ctx, x, y, r * 2.6); ctx.fill();
  ctx.restore();
  ctx.fillStyle = gradRadial(ctx, x, y, r, ['#ffffff', cor, cor]); circulo(ctx, x, y, r); ctx.fill();
}

function desenhar() {
  const k = escala * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07091a'; ctx.fillRect(0, 0, tela.width, tela.height);
  let ox = 0, oy = 0;
  if (tremor > 0) { ox = (Math.random() - .5) * 6 * tremor / .22; oy = (Math.random() - .5) * 4 * tremor / .22; }
  ctx.setTransform(k, 0, 0, k, ox * k, oy * k);
  ctx.drawImage(fundo, 0, 0, W, H);

  const piscaOn = Math.floor(relogio * 5) % 2 === 0;
  const atracao = j.estado === 'fim';
  // luzes
  LUZES.forEach((l, i) => {
    const on = atracao ? (i + Math.floor(relogio * 8)) % 5 === 0 : (l.on() || (l.pisca() && piscaOn));
    if (on) { brilho(l.x, l.y, l.r, l.cor); if (l.txt) texto(ctx, l.txt, l.x, l.y + .5, 8, '#05200f', '800'); }
  });
  PLANETAS.forEach((p, i) => {
    const feito = i < j.planetas, atual = i === j.missao && j.estado !== 'fim';
    if (feito || (atual && piscaOn) || (atracao && (i + Math.floor(relogio * 4)) % 5 === 0)) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4); g.addColorStop(0, p.cor[1]); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = feito ? .6 : .4; ctx.fillStyle = g; circulo(ctx, p.x, p.y, p.r * 2.4); ctx.fill(); ctx.restore();
      desenharPlaneta(ctx, p);
    }
  });
  for (const s of SETAS) {
    const on = j.estado !== 'fim' && missaoAtual() === s.ev && piscaOn;
    if (on) { ctx.save(); ctx.shadowColor = s.cor; ctx.shadowBlur = 10; ctx.fillStyle = s.cor; seta(ctx, s.x, s.y, s.ang, 12); ctx.fill(); ctx.restore(); }
  }

  // buraco negro girando
  ctx.save(); ctx.translate(BURACO.x, BURACO.y); ctx.rotate(relogio * (bola.presa ? 9 : 2));
  ctx.strokeStyle = 'rgba(200,150,255,.55)'; ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.arc(4, 0, 9, -1.2, .6); ctx.stroke(); }
  ctx.restore();

  // alvos
  ALVOS.forEach(a => {
    ctx.lineCap = 'butt';
    if (a.de_pe) {
      ctx.strokeStyle = '#3a0a0a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.lineTo(a.bx, a.by); ctx.stroke();
      ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.ax - 2, a.ay + 1); ctx.lineTo(a.bx - 2, a.by - 1); ctx.stroke();
    } else {
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.lineTo(a.bx, a.by); ctx.stroke();
    }
  });
  // estilingues acendendo
  for (const s of ESTILINGUES) if (s.flash > 0) {
    caminho(ctx, [s.a, s.b, s.c]); ctx.closePath(); ctx.fillStyle = 'rgba(255,240,200,.6)'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...s.a); ctx.lineTo(...s.c); ctx.stroke();
  }
  // cogumelos
  const missaoCog = j.estado !== 'fim' && missaoAtual() === 'cogumelo';
  for (const b of COGUMELOS) {
    const aceso = b.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; circulo(ctx, b.x + 3, b.y + 4, b.r + 1); ctx.fill();
    ctx.fillStyle = '#d9dce3'; circulo(ctx, b.x, b.y, b.r); ctx.fill();
    ctx.strokeStyle = '#555b66'; ctx.lineWidth = 1; ctx.stroke();
    if (aceso || (missaoCog && piscaOn)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(b.x, b.y, b.r * .5, b.x, b.y, b.r * 2); g.addColorStop(0, b.cor[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; circulo(ctx, b.x, b.y, b.r * 2); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = gradRadial(ctx, b.x, b.y - 1, b.r - 4, aceso ? ['#ffffff', b.cor[0], b.cor[1]] : [b.cor[0], b.cor[1], b.cor[2]]);
    circulo(ctx, b.x, b.y - 1, b.r - 4); ctx.fill();
    ctx.fillStyle = aceso ? '#fff' : 'rgba(255,255,255,.55)';
    ctx.font = '900 11px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', b.x, b.y - 1);
  }
  // lançador
  ctx.fillStyle = '#1b1f29'; ctx.fillRect(354, plY, 22, 770 - plY);
  ctx.strokeStyle = '#a7adb9'; ctx.lineWidth = 1.6; ctx.beginPath();
  const voltas = 9, alto = 750 - (plY + 8);
  for (let i = 0; i <= voltas * 2; i++) { const y = plY + 8 + alto * i / (voltas * 2); ctx.lineTo(i % 2 ? 374 : 356, y); }
  ctx.stroke();
  const gp = ctx.createLinearGradient(354, 0, 376, 0); gp.addColorStop(0, '#7a0a14'); gp.addColorStop(.5, '#ff4d5e'); gp.addColorStop(1, '#7a0a14');
  ctx.fillStyle = gp; ctx.fillRect(354, plY, 22, 8);

  // palhetas
  for (const p of palhetas) desenharPalheta(p);

  // bola
  if (!bola.fora) {
    let r = R;
    if (bola.presa) { const resta = bola.presa - relogio; r = R * Math.max(.15, Math.min(1, (resta - 1) / .6, 1 - resta / .2)); }
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(bola.x + 3, bola.y + 4, r, r * .9, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(bola.x - r * .4, bola.y - r * .45, r * .05, bola.x, bola.y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.25, '#e3e7ef'); g.addColorStop(.7, '#7d8492'); g.addColorStop(1, '#2a2e36');
    ctx.fillStyle = g; circulo(ctx, bola.x, bola.y, r); ctx.fill();
    ctx.fillStyle = 'rgba(160,120,255,.25)'; ctx.beginPath(); ctx.ellipse(bola.x + r * .25, bola.y + r * .45, r * .5, r * .22, 0, 0, Math.PI * 2); ctx.fill();
  }

  ctx.drawImage(frente, 0, 0, W, H);

  // avisos grandes
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

function desenharPalheta(p) {
  const co = Math.cos(p.ang), si = Math.sin(p.ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
  const forma = (dx, dy) => {
    ctx.beginPath();
    ctx.arc(p.px + dx, p.py + dy, p.rb, p.ang + Math.PI / 2, p.ang + Math.PI * 1.5);
    ctx.arc(tx + dx, ty + dy, p.rt, p.ang - Math.PI / 2, p.ang + Math.PI / 2);
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

// ================= Painel =================
const cache = {};
function poe(id, v) { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } }
function painel() {
  poe('pontos', fmt(j.pontos));
  poe('bola', j.estado === 'fim' ? 'FIM DE JOGO' : `BOLA ${j.bola}/3${j.extras ? ' +' + j.extras : ''}`);
  poe('mult', `x${j.mult}`);
  let m = relogio < msgAte ? mensagem : '';
  if (!m) {
    if (pausado) m = 'PAUSADO';
    else if (j.estado === 'pronto') m = bolaNoLancador() ? 'SEGURE E SOLTE P/ LANÇAR' : '';
    else if (j.estado === 'fim') m = `RECORDE ${fmt(Math.max(dados.melhor || 0, j.pontos))}`;
  }
  poe('msg', m || ' ');
  if (j.estado === 'fim') poe('missao', 'APERTE NOVO JOGO');
  else {
    const mi = MISSOES[j.missao], meta = mi.meta(j.rodada);
    poe('missao', `${PLANETAS[j.missao].nome}: ${mi.txt} ${j.prog}/${meta}`);
  }
}

// ================= Ciclo principal =================
let antes = performance.now(), acumulado = 0;
function quadro(agora) {
  const dt = Math.min(.05, (agora - antes) / 1000);
  antes = agora;
  if (!pausado && !dialogoAberto()) {
    acumulado += dt;
    while (acumulado >= PASSO) { passo(PASSO); acumulado -= PASSO; }
  } else acumulado = 0;
  desenhar();
  painel();
  requestAnimationFrame(quadro);
}

novoJogo();
if (location.hostname === 'localhost') window.__pb = { bola, palhetas, ALVOS, get j() { return j; }, passo: s => { for (let i = 0; i < s / PASSO; i++) passo(PASSO); }, comecarPuxar, soltar, desenhar: () => { desenhar(); painel(); }, get relogio() { return relogio; } }; // só para testes no computador
mostrarRecordes();
ajustarTamanho();
requestAnimationFrame(quadro);
})();

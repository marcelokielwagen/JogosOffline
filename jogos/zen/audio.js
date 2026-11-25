/* Zen.Audio: toda a música e todos os efeitos, criados na hora (Web Audio, nenhum arquivo).

   Caminho do som:
     pads ─► filtro passa-baixa (LFO) ─► balanço (LFO) ─┐
     sinos, brisa ──────────────────────────────────────┴─► MÚSICA ─┐
     efeitos dos jogos ──────────────────────────────────► EFEITOS ─┴─► MESTRE ─► compressor ─► saída
     música e efeitos também mandam um pouco para o ECO (vai e volta) e para a SALA (reverberação)

   Os efeitos usam as notas do acorde que a música está tocando naquele momento,
   por isso qualquer peça girada ou forma atingida soa afinada com o fundo.         */
(() => {
'use strict';

// alto-falante de celular quase não reproduz graves: ali o som precisa ser mais agudo e mais forte
const PEQUENO = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 600);
const MAX_VOZES = PEQUENO ? 48 : 80;          // efeitos ao mesmo tempo
const ACORDE_SEG = 15, ENTRA = 5, SAI = 9;    // duração, entrada e saída de cada acorde do pad
const ALEA = (a, b) => a + Math.random() * (b - a);
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

/* Cada ambiente: acordes (notas MIDI), escala de cinco notas (em semitons) e a nota que a inicia. */
const AMBIENTES = {
  menu: { acordes: [[50, 57, 61, 64, 66], [43, 50, 57, 59, 66], [47, 54, 57, 62, 64], [45, 52, 57, 59, 64]], escala: [0, 2, 4, 7, 9], base: 62, sino: .7 },
  loop: { acordes: [[50, 57, 61, 64, 66], [47, 54, 57, 61, 64], [43, 50, 57, 59, 66], [45, 52, 57, 59, 64], [52, 59, 62, 66, 67], [43, 54, 57, 59, 62]], escala: [0, 2, 4, 7, 9], base: 62, sino: 1 },
  okay: { acordes: [[41, 48, 52, 57, 60], [45, 52, 55, 60, 62], [48, 55, 59, 62, 64], [43, 50, 57, 59, 64], [50, 57, 60, 64, 65], [41, 48, 55, 57, 64]], escala: [0, 2, 4, 7, 9], base: 60, sino: .55 }
};
const TOM_GRUPO = [0, -2, 3, 1, -4];          // cada grupo de 10 fases muda de tom

const cfg = { musica: .7, efeitos: .8, mudo: false };
let ctx = null, G = null;                     // contexto e "nós" fixos
let cena = AMBIENTES.menu, nomeCena = 'menu', grupo = 0;
let acordeAtual = cena.acordes[0], passo = 0, proxAcorde = 0, proxSino = 0, padAtivo = [];
let vozes = 0, relogio = 0, vigia = null, refeitos = 0, sono = 0;

/* ======================= contexto e ligação ======================= */

// Chamado a cada gesto. O navegador só libera som com um gesto e, no celular,
// o gesto só vale quando o dedo SOLTA a tela (touchend/click).
function iniciar() {
  if (cfg.mudo && !ctx) return;
  if (ctx && !precisaRefazer()) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  montar();
  volumes(true);
  passo = 0; proxAcorde = ctx.currentTime + .05; proxSino = ctx.currentTime + 6; padAtivo = []; vozes = 0;
  clearInterval(relogio); relogio = setInterval(agendar, 400);
  agendar();
  if (ctx.state !== 'running') retomar();
}
function retomar() { const p = ctx.resume(); if (p) p.catch(() => {}); }

// Depois de uma ligação ou de outro app, o áudio do celular às vezes diz que toca
// mas o relógio dele está parado. Dois toques com o relógio parado = refaz tudo.
function precisaRefazer() {
  if (document.hidden || cfg.mudo) return false;
  const tocando = ctx.state === 'running', agora = performance.now();
  if (!tocando && ctx.state !== 'closed') retomar();
  if (!vigia || vigia.tocando !== tocando || vigia.t !== ctx.currentTime) { vigia = { tocando, t: ctx.currentTime, em: agora }; return false; }
  if (agora - vigia.em < 2500 || refeitos >= 3) return false;
  refeitos++; vigia = null;
  const velho = ctx; ctx = G = null;
  if (velho.state !== 'closed') velho.close().catch(() => {});
  return true;
}

function ganho(v, destino) { const g = ctx.createGain(); g.gain.value = v; if (destino) g.connect(destino); return g; }
function filtro(tipo, f, q = .7, db = 0) { const b = ctx.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.gain.value = db; return b; }
function lado(pan) {
  if (!ctx.createStereoPanner) return ctx.createGain();
  const p = ctx.createStereoPanner(); p.pan.value = Math.max(-.8, Math.min(.8, pan)); return p;
}
function lfo(freq, alcance, alvo) { const o = ctx.createOscillator(), g = ganho(alcance, alvo); o.frequency.value = freq; o.connect(g); o.start(); }
function limitador(limiar, razao, ataque, solta) { const c = ctx.createDynamicsCompressor(); c.threshold.value = limiar; c.knee.value = 8; c.ratio.value = razao; c.attack.value = ataque; c.release.value = solta; return c; }

function montar() {
  G = {};
  // saída
  G.final = ganho(PEQUENO ? .72 : .85, ctx.destination);
  const teto = limitador(-9, 16, .002, .22); teto.connect(G.final);
  const comp = limitador(-18, 3, .012, .35);
  if (PEQUENO) comp.connect(filtro('highpass', 120)).connect(filtro('highshelf', 500, .7, 5)).connect(ganho(2.6)).connect(teto);
  else comp.connect(teto);
  G.mestre = ganho(0, comp);
  G.musica = ganho(0, G.mestre);
  G.efeitos = ganho(0, G.mestre);

  // ECO: dois atrasos que se alternam entre os lados, cada volta mais abafada
  G.eco = ganho(1);
  const a = ctx.createDelay(2), b = ctx.createDelay(2), pa = lado(-.55), pb = lado(.55), volta = ganho(.44), abafa = filtro('lowpass', 2300, .3);
  a.delayTime.value = .46; b.delayTime.value = .69;
  G.eco.connect(a); a.connect(b); b.connect(abafa).connect(volta).connect(a);
  a.connect(pa).connect(ganho(.5, G.mestre)); b.connect(pb).connect(ganho(.42, G.mestre));
  lfo(.11, .0016, a.delayTime); lfo(.083, .0019, b.delayTime);      // leve ondulação, como fita

  // SALA: reverberação feita de ruído que se apaga
  const n = ctx.sampleRate * 3.4 | 0, imp = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); let s = 0; for (let i = 0; i < n; i++) { s += ((Math.random() * 2 - 1) - s) * .34; d[i] = s * Math.pow(1 - i / n, 2.7); } }
  G.sala = ctx.createConvolver(); G.sala.buffer = imp; G.sala.connect(ganho(.34, G.mestre));

  // os envios da música passam pelo volume da música (assim o eco também obedece a ele)
  G.musica.connect(ganho(.3, G.eco)); G.musica.connect(ganho(.5, G.sala));
  G.efeitos.connect(ganho(.2, G.eco)); G.efeitos.connect(ganho(.36, G.sala));

  // PAD: passa-baixa que abre e fecha devagar + volume que respira
  G.corte = filtro('lowpass', PEQUENO ? 1350 : 780, .5);
  G.respira = ganho(.85, G.musica);
  G.pad = ganho(1); G.pad.connect(G.corte).connect(G.respira);
  lfo(.062, PEQUENO ? 420 : 300, G.corte.frequency); lfo(.041, 130, G.corte.frequency); lfo(.053, .14, G.respira.gain);

  // BRISA: ruído bem baixo, filtrado, indo e vindo
  const m = ctx.sampleRate * 6 | 0, x = ctx.sampleRate * .4 | 0, buf = ctx.createBuffer(1, m, ctx.sampleRate), d = buf.getChannelData(0), bruto = new Float32Array(m + x);
  for (let i = 0, u = 0; i < m + x; i++) { u = (u + .03 * (Math.random() * 2 - 1)) / 1.03; bruto[i] = u * 3; }
  for (let i = 0; i < m; i++) d[i] = i < x ? bruto[i] * Math.sqrt(i / x) + bruto[m + i] * Math.sqrt(1 - i / x) : bruto[i];   // emenda sem estalo
  const s = ctx.createBufferSource(), bf = filtro('bandpass', 620, .5), bg = ganho(.03, G.musica);
  s.buffer = G.ruido = buf; s.loop = true; s.connect(bf).connect(bg); s.start();
  lfo(.071, 240, bf.frequency); lfo(.047, .02, bg.gain);
}

/* ======================= música ======================= */

function agendar() {
  if (!ctx || ctx.state !== 'running' || cfg.mudo || cfg.musica <= 0) return;
  const t = ctx.currentTime;
  if (t >= proxAcorde - .5) tocarAcorde(Math.max(t + .05, proxAcorde));
  if (t >= proxSino - .5) {
    const q = Math.max(t + .05, proxSino), notas = escalaDoAcorde(), k = Math.floor(Math.random() * notas.length), p = ALEA(-.6, .6);
    sinoFundo(hz(notas[k]), q, .05 * cena.sino, p);
    if (Math.random() < .4) sinoFundo(hz(notas[(k + 2) % notas.length]), q + ALEA(.35, .8), .034 * cena.sino, -p);
    proxSino = q + ALEA(4.5, 9.5);
  }
}
function tocarAcorde(t) {
  const tom = TOM_GRUPO[grupo], lista = cena.acordes;
  acordeAtual = lista[passo % lista.length].map(n => n + tom); passo++;
  proxAcorde = t + ACORDE_SEG;
  padAtivo = padAtivo.filter(v => v.fim > t);
  acordeAtual.forEach((n, i) => vozPad(hz(n), t, i));
  if (PEQUENO) {                                            // notas a mais no agudo, que o celular consegue tocar
    vozPad(hz(acordeAtual[2] + 12), t, 5);
    if (nomeCena === 'okay') { vozPad(hz(acordeAtual[3] + 12), t, 3); vozPad(hz(acordeAtual[4] + 12), t, 4); }
  }
}
function vozPad(f, t, i) {
  const g = ganho(0, null), p = lado((i % 2 ? 1 : -1) * .16 * i), v = [.105, .1, .085, .075, .06, .05][i], fim = t + ACORDE_SEG + SAI;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + ENTRA + i * .5);
  g.gain.setValueAtTime(v, t + ACORDE_SEG - 1);
  g.gain.linearRampToValueAtTime(0, fim);
  g.connect(p).connect(G.pad);
  for (const [tipo, det, q] of [['triangle', -5, 1], ['triangle', 6, .8], ['sawtooth', 2, .16]]) {
    const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; o.detune.value = det + ALEA(-2, 2);
    o.connect(ganho(q, g)); o.start(t); o.stop(fim + .05);
    padAtivo.push({ o, g, fim });
  }
  // solta os nós quando a última nota acaba
  padAtivo[padAtivo.length - 1].o.onended = () => { g.disconnect(); p.disconnect(); };
}
function sinoFundo(f, t, v, pan) {
  nota(f, t, 4.2, v, { destino: G.musica, pan, ataque: .02 });
  nota(f * 2.003, t, 2.4, v * .3, { destino: G.musica, pan, ataque: .02 });
}

// notas do acorde atual, espalhadas na região média e aguda (para os efeitos)
function escalaDoAcorde() {
  const r = [];
  for (let m = 64; m <= 88; m++) if (acordeAtual.some(n => (m - n) % 12 === 0)) r.push(m);
  return r;
}
// escala de cinco notas que sobe com o combo; no topo, fica ondulando entre as notas mais agudas
function notaDoCombo(c) {
  const e = cena.escala, TOPO = 14;
  let i = Math.max(0, c | 0);
  if (i > TOPO) { const k = (i - TOPO) % 8; i = TOPO - (k < 4 ? k : 8 - k); }
  return hz(cena.base + TOM_GRUPO[grupo] + e[i % 5] + 12 * Math.floor(i / 5));
}

/* ======================= timbres ======================= */

const pronto = () => !!ctx && ctx.state === 'running' && !cfg.mudo && cfg.efeitos > 0;

function nota(f, t, dur, v, { tipo = 'sine', ataque = .006, pan = 0, ate = 0, destino = G.efeitos } = {}) {
  if (vozes >= MAX_VOZES) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), p = lado(pan);
  o.type = tipo; o.frequency.setValueAtTime(f, t);
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur * .7);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + ataque); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(p).connect(destino);
  vozes++; o.onended = () => { vozes--; p.disconnect(); };
  o.start(t); o.stop(t + dur + .03);
}
// vidro: um oscilador treme a frequência do outro (FM) e o brilho se apaga antes do corpo
function vidro(f, t, dur, v, pan = 0, brilho = 1) {
  if (vozes >= MAX_VOZES) return;
  const o = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), p = lado(pan);
  o.frequency.value = f; m.frequency.value = f * 3.51;
  mg.gain.setValueAtTime(f * 1.5 * brilho, t); mg.gain.exponentialRampToValueAtTime(f * .02, t + dur * .35);
  m.connect(mg).connect(o.frequency);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(p).connect(G.efeitos);
  vozes++; o.onended = () => { vozes--; p.disconnect(); mg.disconnect(); };
  o.start(t); m.start(t); o.stop(t + dur + .03); m.stop(t + dur + .03);
}
// lâmina de madeira (kalimba): corpo, harmônico curto e um estalinho
function lamina(f, t, v, pan = 0, dur = 1.5) {
  nota(f, t, dur, v, { pan, ataque: .004 });
  nota(f * 2, t, dur * .55, v * (PEQUENO ? .42 : .26), { pan, ataque: .004 });
  nota(f * 5.43, t, .09, v * .16, { pan, ataque: .002 });
}
function sopro(t, dur, v, f0, f1, pan = 0) {
  if (vozes >= MAX_VOZES) return;
  const s = ctx.createBufferSource(), b = filtro('bandpass', f0, 1.1), g = ctx.createGain(), p = lado(pan);
  s.buffer = G.ruido; s.playbackRate.value = 3;
  b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .25); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(b).connect(g).connect(p).connect(G.efeitos);
  vozes++; s.onended = () => { vozes--; p.disconnect(); };
  s.start(t, Math.random() * 3, dur * 3 + .2); s.stop(t + dur + .03);
}

/* ======================= efeitos ======================= */

const ultimo = {};
const cedo = (nome, seg) => { const t = ctx.currentTime; if (t - (ultimo[nome] ?? -9) < seg) return true; ultimo[nome] = t; return false; };

const efeitos = {
  toque() { const t = ctx.currentTime; nota(hz(acordeAtual[2] + 24), t, .32, .07); },

  /* LOOP ZEN: cada rotação, uma nota do acorde que está no ar.
     coluna/linha (0 a 1) escolhem o lado e a altura; volta (0 a 3) sobe o arpejo. */
  girar(coluna = .5, linha = .5, volta = 0) {
    const t = ctx.currentTime, n = escalaDoAcorde();
    const i = (Math.round((1 - linha) * (n.length - 4)) + volta) % n.length;
    lamina(hz(n[Math.max(0, i)]), t, .22, (coluna - .5) * 1.1);
    sopro(t, .12, .035, 900, 1700, (coluna - .5) * 1.1);
  },
  // duas pontas se encontraram
  encaixar(coluna = .5) { if (cedo('encaixar', .05)) return; const n = escalaDoAcorde(); vidro(hz(n[n.length - 2]), ctx.currentTime + .05, .9, .035, (coluna - .5) * 1.1, .5); },
  // circuito fechado: acorde cristalino que se abre
  fechar() {
    const t = ctx.currentTime + .04, n = escalaDoAcorde(), q = n.filter((_, i) => i % 2 === 0).slice(0, 6);
    q.forEach((m, i) => { vidro(hz(m), t + i * .11, 4.4 - i * .2, .17 - i * .012, (i % 2 ? 1 : -1) * .13 * i, .8); });
    nota(hz(acordeAtual[0] + 12), t, 4, .12, { ataque: .25 }); nota(hz(acordeAtual[1] + 12), t, 4, .08, { ataque: .3 });
    q.slice(-3).forEach((m, i) => vidro(hz(m + 12), t + .95 + i * .16, 2.4, .026, (i - 1) * .5, .4));
  },

  /* RICOCHET ZEN */
  // puxando o estilingue: um tiquinho a cada novo ponto de força (0 a 1)
  esticar(forca = 0) { if (cedo('esticar', .06)) return; nota(hz(cena.base - 12 + TOM_GRUPO[grupo]) * (1 + forca * .5), ctx.currentTime, .16, .05 + forca * .03, { tipo: 'triangle' }); },
  soltar(forca = .5) { const t = ctx.currentTime; sopro(t, .4, .5 + forca * .5, 420, 1700); nota(hz(cena.base - 12 + TOM_GRUPO[grupo]), t, .5, .2, { tipo: 'triangle', ate: hz(cena.base - 24 + TOM_GRUPO[grupo]) }); },
  /* cada ricochete sobe um degrau da escala. combo: quantos já houve neste lançamento.
     tipo: 'alvo' (vidro brilhante), 'parede' (lâmina), 'barreira' (pedra, mais seca) */
  ricochete(combo = 0, tipo = 'alvo', forca = .7, pan = 0) {
    if (cedo('ric' + tipo, .025)) return;
    const t = ctx.currentTime, f = notaDoCombo(combo), v = .45 + .55 * Math.min(1, forca);
    if (tipo === 'alvo') { lamina(f, t, .2 * v, pan, 1.3); vidro(f * 2, t, 1.5, .06 * v, pan, .7); }
    else if (tipo === 'parede') lamina(f, t, .13 * v, pan, .8);
    else { nota(f, t, .34, .15 * v, { tipo: 'triangle', pan }); sopro(t, .1, .1 * v, 1400, 700, pan); }
  },
  // tudo apagado: acorde final que resolve na nota do ambiente
  limpar(combo = 0) {
    const t = ctx.currentTime + .05, r = cena.base + TOM_GRUPO[grupo];
    [0, 7, 12, 16, 19, 24, 28].forEach((s, i) => { vidro(hz(r + s), t + i * .075, 4.2, .15 - i * .01, (i % 2 ? 1 : -1) * .11 * i, .6); });
    nota(hz(r - 12), t, 4, .13, { ataque: .08 }); nota(hz(r - 5), t, 4, .08, { ataque: .12 });
    if (combo > 6) [31, 36].forEach((s, i) => vidro(hz(r + s), t + .8 + i * .2, 2.2, .024, i ? .5 : -.5, .4));
  },
  // lançamento que não limpou tudo: duas notas calmas descendo, sem tom de castigo
  quase() { const t = ctx.currentTime, r = cena.base + TOM_GRUPO[grupo]; lamina(hz(r + 7), t, .17, -.1, 1.6); lamina(hz(r + 4), t + .26, .15, .1, 2); }
};

/* ======================= volumes ======================= */

const curva = v => Math.pow(Math.max(0, Math.min(1, v)), 1.5);
function volumes(inicio) {
  // iPhone: 'playback' toca mesmo com a chavinha de silencioso; mudo, deixa a música de outros apps em paz
  try { if (navigator.audioSession) navigator.audioSession.type = cfg.mudo ? 'ambient' : 'playback'; } catch (e) { /* sem esse ajuste */ }
  if (!ctx) return;
  const t = ctx.currentTime;
  G.mestre.gain.setTargetAtTime(cfg.mudo ? 0 : 1, t, inicio ? .6 : .15);
  G.musica.gain.setTargetAtTime(curva(cfg.musica) * .5, t, .15);
  G.efeitos.gain.setTargetAtTime(curva(cfg.efeitos) * 1.5, t, .08);
  clearTimeout(sono);
  if (cfg.mudo) sono = setTimeout(() => { if (cfg.mudo && ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); }, 1200);   // poupa bateria
  else if (ctx.state !== 'running' && !document.hidden) retomar();
}

/* ======================= o que os outros arquivos usam ======================= */

const Audio = {
  iniciar,
  /* ajustar({ musica: 0..1, efeitos: 0..1, mudo: true/false }), qualquer combinação */
  ajustar(novo) {
    const semMusica = cfg.musica <= 0, eraMudo = cfg.mudo;
    for (const k of ['musica', 'efeitos']) if (Number.isFinite(novo[k])) cfg[k] = Math.max(0, Math.min(1, novo[k]));
    if (typeof novo.mudo === 'boolean') cfg.mudo = novo.mudo;
    if (eraMudo && !cfg.mudo && !ctx) iniciar();          // abriu o jogo no mudo e ligou o som agora
    if (ctx && semMusica && cfg.musica > 0 && proxAcorde < ctx.currentTime) proxAcorde = ctx.currentTime + .05;
    volumes();
  },
  get config() { return { ...cfg }; },
  /* cena('menu' | 'loop' | 'okay', fase 1..50): o tom muda a cada 10 fases.
     A troca é gradual: o acorde novo entra enquanto o antigo ainda se apaga. */
  cena(nome, fase = 1) {
    const g = nome === 'menu' ? 0 : Math.floor((Math.max(1, Math.min(50, fase)) - 1) / 10);
    if (!AMBIENTES[nome] || (nome === nomeCena && g === grupo)) return;
    nomeCena = nome; cena = AMBIENTES[nome]; grupo = g; passo = 0;
    acordeAtual = cena.acordes[0].map(n => n + TOM_GRUPO[g]);
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const v of padAtivo) if (v.fim > t + 3) {
      const a = v.g.gain;
      if (a.cancelAndHoldAtTime) a.cancelAndHoldAtTime(t); else { const atual = a.value; a.cancelScheduledValues(t); a.setValueAtTime(atual, t); }
      a.linearRampToValueAtTime(0, t + 2.8);
      try { v.o.stop(t + 2.9); } catch (e) { /* já parou */ }
      v.fim = t + 2.9;
    }
    proxAcorde = t + .3; proxSino = Math.max(proxSino, t + 4);
  },
  // app em segundo plano
  dormir(sim) {
    vigia = null;
    if (!ctx || ctx.state === 'closed') return;
    if (sim) { const p = ctx.suspend(); if (p) p.catch(() => {}); } else if (!cfg.mudo) retomar();
  },
  get estado() { return ctx ? ctx.state : 'parado'; },
  // para os testes de volume
  get contexto() { return ctx; }, get saida() { return G && G.final; }, get mestre() { return G && G.mestre; }, get vozes() { return vozes; }, pequeno: PEQUENO
};
for (const nome of Object.keys(efeitos)) Audio[nome] = (...a) => { if (pronto()) efeitos[nome](...a); };

for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) addEventListener(ev, iniciar, { passive: true, capture: true });
document.addEventListener('visibilitychange', () => Audio.dormir(document.hidden));

Zen.Audio = Audio;
})();

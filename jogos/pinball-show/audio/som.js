// Música e sons do Galatic Pinball: tudo original, criado na hora pelo próprio aparelho (sem arquivos de áudio).
// Estilo house francês, com a mesma receita de estúdio dos anos 90/2000 (só a técnica; as notas são deste jogo):
//   1) uma "gravação de disco music" original (metais, cordas, guitarra) é fabricada por código;
//   2) ela é recortada em pedaços e tocada em outra ordem, com repetições e gagueira;
//   3) tudo passa por distorção, phaser e um filtro que fecha e abre devagar;
//   4) o bumbo "bombeia" o resto; 5) uma voz de robô (formantes + notas travadas + redução de bits) canta por cima.
export const BPM = 123;
const SEMI = 15 / BPM;                                   // duração de 1/16
const nota = n => 440 * Math.pow(2, (n - 69) / 12);
// harmonia de cada fase: 4 acordes (notas MIDI)
const HARMONIAS = [
  [[56, 60, 63, 67], [53, 56, 60, 63], [58, 61, 65, 68], [51, 55, 58, 61]],
  [[57, 60, 64, 67], [52, 55, 59, 62], [53, 57, 60, 64], [55, 59, 62, 65]],
  [[50, 53, 57, 60], [50, 53, 57, 62], [58, 62, 65, 69], [57, 61, 64, 67]],
  [[54, 57, 61, 64], [59, 62, 66, 69], [52, 56, 59, 62], [57, 61, 64, 68]],
  [[60, 63, 67, 70], [56, 60, 63, 67], [53, 56, 60, 63], [55, 58, 62, 65]],
  [[62, 65, 69, 72], [55, 58, 62, 65], [60, 64, 67, 70], [53, 57, 60, 64]],
];
// recortes: que oitavo de compasso (0 a 7) da gravação toca em cada oitavo; a gravação muda a cada compasso
const RECORTES = [[0, 1, 2, 3, 0, 1, 6, 7], [0, 0, 2, 3, 4, 4, 6, 3], [0, 3, 2, 3, 4, 7, 6, 7], [0, 1, 0, 1, 4, 5, 4, 7], [2, 3, 0, 1, 2, 3, 6, 6], [0, 5, 2, 7, 4, 1, 6, 3]];
const METAIS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1], GUITARRA = [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1];
const BAIXOS = [[0, -1, -1, 12, -1, 0, -1, 10, 0, -1, 12, -1, 0, -1, 7, 10], [0, -1, 12, 0, -1, 12, 0, -1, 0, -1, 12, -1, 5, 7, -1, 10]];
// voz de robô: [passo, grau do acorde, vogal, duração em passos]
const VOZES = [
  [[0, 2, 'o', 3], [4, 3, 'a', 2], [7, 2, 'i', 3], [12, 1, 'e', 3]], [[2, 3, 'a', 2], [5, 3, 'o', 2], [8, 2, 'a', 4], [13, 3, 'i', 2]],
  [[0, 0, 'u', 2], [3, 0, 'a', 2], [6, 3, 'e', 2], [9, 2, 'a', 2], [12, 3, 'o', 4]], [[0, 3, 'i', 4], [6, 2, 'o', 3], [10, 1, 'a', 5]],
  [[0, 1, 'a', 2], [3, 2, 'o', 2], [6, 3, 'a', 2], [8, 3, 'i', 2], [11, 2, 'a', 4]], [[0, 3, 'a', 2], [3, 3, 'o', 1], [4, 3, 'a', 3], [8, 2, 'i', 2], [11, 3, 'a', 4]],
];
const FORMANTES = { a: [760, 1180, 2500], e: [480, 1850, 2550], i: [300, 2250, 2950], o: [470, 860, 2450], u: [330, 760, 2300] };

// curvas de distorção
function curva(f) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = f(i / (n - 1) * 2 - 1); return c; }
const SATURA = k => curva(x => Math.tanh(x * k) / Math.tanh(k)), DEGRAUS = n => curva(x => Math.round(x * n) / n);

// ---------- Fabrica a "gravação de disco" de uma fase (4 compassos) ----------
async function gravarDisco(harmonia, taxa) {
  const dur = SEMI * 16, OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, c = new OC(1, Math.ceil(dur * 4 * taxa), taxa);
  const saida = c.createGain(); saida.gain.value = .8; const sat = c.createWaveShaper(); sat.curve = SATURA(1.8); sat.connect(saida); saida.connect(c.destination);
  const voz = (tipo, f, t, d, vol, corte, corteFim, q = 1, afina = 0, ataque = .006) => {
    const o = c.createOscillator(), g = c.createGain(), b = c.createBiquadFilter(); o.type = tipo; o.frequency.value = f; o.detune.value = afina; b.type = 'lowpass'; b.Q.value = q;
    b.frequency.setValueAtTime(corte, t); b.frequency.exponentialRampToValueAtTime(corteFim, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.setValueAtTime(vol, t + d * .6); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(b); b.connect(g); g.connect(sat); o.start(t); o.stop(t + d + .02);
  };
  harmonia.forEach((ac, k) => {
    const t0 = k * dur;
    // cordas
    for (const n of ac) for (const d of [-9, 8]) voz('sawtooth', nota(n + 24), t0, dur * .98, .022, 2600, 3800, 1, d, .05);
    // metais: ataque curto que "abre" e cai
    METAIS.forEach((on, s) => { if (!on) return; const t = t0 + s * SEMI, d = SEMI * (s % 8 === 0 ? 2.4 : 1.4); ac.forEach((n, j) => { for (const q of [-11, 4, 12]) voz('sawtooth', nota(n + 12), t, d, .038, 900 + (s % 3) * 500, 4200 - j * 300, 1.5, q, .018); }); voz('square', nota(ac[3] + 24), t, d, .028, 2600, 1500, 2); });
    // guitarra com wah
    GUITARRA.forEach((on, s) => { if (!on) return; const t = t0 + s * SEMI; for (const n of ac.slice(1)) voz('square', nota(n + 24), t, SEMI * .55, .02, 1000 + (s % 4) * 900, 600, 8, 0, .002); });
    // baixo da gravação
    [0, 3, 6, 8, 11, 14].forEach(s => voz('triangle', nota(ac[0] - 12), t0 + s * SEMI, SEMI * 1.6, .16, 700, 260));
  });
  return c.startRendering();
}

// ---------- Fabrica os sons das peças ----------
// Cada som é gravado uma vez, no começo, e depois só tocado (fica mais encorpado e mais leve para o celular).
// Os afinados são gravados em dó (nota 72) e tocados na nota do acorde que a música está fazendo.
const BASE = 72, NIVEL_EFEITOS = .9, NIVEL_FUNDO = .7;
const PECAS = {
  // afinados
  stab: [.6, 2.4, o => { for (const d of [-14, -5, 6, 15]) o.osc('sawtooth', 523.25, 0, .46, .3, { afina: d, corte: 7500, corteAte: 900, q: 3 }); o.osc('sawtooth', 261.6, 0, .4, .3, { corte: 3000, corteAte: 500 }); o.osc('square', 1046.5, 0, .14, .16); }],
  sino: [1.2, 1.3, o => { o.fm(523.25, 3.5, 5, 0, 1.1, .5); o.fm(1046.5, 1.41, 3, 0, .5, .35); o.osc('triangle', 1046.5, 0, .7, .3); o.osc('square', 2093, 0, .03, .25); }],
  pluck: [.5, 3.2, o => { o.osc('square', 523.25, 0, .38, .45, { corte: 6500, corteAte: 420, q: 9 }); o.osc('sawtooth', 1046.5, 0, .3, .4, { afina: 8, corte: 8000, corteAte: 600, q: 5 }); }, 12],
  voz: [.6, 2.6, o => { for (const [i, f] of [[0, 760], [1, 1180], [2, 2500]]) for (const [m, d] of [[1, -7], [1, 8], [.5, 0]]) o.osc('sawtooth', 523.25 * m, 0, .5, [1, .8, .6][i], { afina: d, corte: f * .55, corteAte: f, q: 6, filtro: 'bandpass', ataque: .012 }); }, 14],
  // batidas
  tum: [.42, 3, o => { o.osc('sine', 260, 0, .36, 1, { ate: 50, em: .08 }); o.osc('triangle', 1100, 0, .07, .7, { ate: 220 }); o.ruido(0, .02, .6, 'highpass', 2500); }],
  estalo: [.32, 2.4, o => { for (const [t, v] of [[0, .7], [.011, .5], [.023, .9]]) o.ruido(t, .16, v, 'bandpass', 1900, 1300, .8); o.osc('triangle', 420, 0, .12, .7, { ate: 190 }); }],
  clique: [.16, 2.4, o => { o.ruido(0, .05, 1.4, 'bandpass', 1900); o.ruido(0, .012, .6, 'highpass', 5000); o.osc('square', 210, 0, .06, .5, { ate: 85 }); o.osc('sine', 120, 0, .12, .6, { ate: 60 }); }],
  toc: [.2, 1.6, o => { o.osc('triangle', 1300, 0, .07, .8, { ate: 780 }); o.fm(930, 2.76, 3, 0, .16, .5); o.ruido(0, .03, .5, 'bandpass', 3200); }],
  tic: [.07, 1.6, o => { o.ruido(0, .035, .8, 'highpass', 5500); o.osc('square', 2400, 0, .022, .5); }],
  zap: [.36, 2.8, o => { o.osc('sawtooth', 2600, 0, .3, .7, { ate: 170, em: .16, corte: 7500, corteAte: 600, q: 8 }); o.osc('square', 1300, 0, .22, .4, { ate: 90, em: .14 }); }],
  prato: [1.7, 1.3, o => { o.ruido(0, 1.6, .8, 'highpass', 5200, 7500); o.ruido(0, .3, .5, 'bandpass', 3600); for (const f of [3120, 4370, 5230]) o.osc('square', f, 0, .7, .05); }],
  boom: [2.3, 3.4, o => { o.ruido(0, 2.1, 1.1, 'lowpass', 6000, 80); o.ruido(0, .5, .7, 'bandpass', 1500, 300, .7); o.osc('sine', 150, 0, 1.5, 1, { ate: 28 }); for (let i = 0; i < 9; i++) o.osc('square', 500 + i * 310 % 1500, i * .06, .14, .22, { ate: 110 }); }],
  sobe: [1, 1.8, o => { o.ruido(0, .95, .7, 'bandpass', 400, 5500, 1.6); for (const d of [-9, 9]) o.osc('sawtooth', 130.8, 0, .9, .3, { afina: d, ate: 1046, corte: 700, corteAte: 6500, q: 4, ataque: .12 }); }],
  cai: [.9, 2, o => { for (const d of [-10, 10]) o.osc('sawtooth', 988, 0, .85, .45, { afina: d, ate: 62, corte: 5000, corteAte: 300, q: 5 }); o.osc('sine', 494, 0, .8, .4, { ate: 40 }); }],
};
async function gravarPeca([dur, garra, monta, degraus], taxa) {
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, c = new OC(1, Math.ceil(dur * taxa), taxa);
  const entra = c.createWaveShaper(); entra.curve = SATURA(garra);
  if (degraus) { const q = c.createWaveShaper(); q.curve = DEGRAUS(degraus); entra.connect(q); q.connect(c.destination); } else entra.connect(c.destination);
  const chia = c.createBuffer(1, taxa, taxa), dd = chia.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
  const envelope = (t, d, vol, ataque = .002) => { const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(.0001, t + d); g.connect(entra); return g; };
  const filtro = (tipo, f, fAte, t, d, q, para) => { const b = c.createBiquadFilter(); b.type = tipo; b.Q.value = q; b.frequency.setValueAtTime(f, t); if (fAte) b.frequency.exponentialRampToValueAtTime(fAte, t + d); b.connect(para); return b; };
  monta({
    osc(tipo, f, t, d, vol, o = {}) {
      const s = c.createOscillator(), g = envelope(t, d, vol, o.ataque); s.type = tipo; s.detune.value = o.afina || 0; s.frequency.setValueAtTime(f, t);
      if (o.ate) s.frequency.exponentialRampToValueAtTime(o.ate, t + (o.em || d));
      s.connect(o.corte ? filtro(o.filtro || 'lowpass', o.corte, o.corteAte, t, o.filtro ? .07 : d, o.q || 1, g) : g); s.start(t); s.stop(t + d + .01);
    },
    ruido(t, d, vol, tipo, f, fAte, q = 1) { const s = c.createBufferSource(); s.buffer = chia; s.loop = true; s.connect(filtro(tipo, f, fAte, t, d, q, envelope(t, d, vol, .001))); s.start(t); s.stop(t + d + .01); },
    fm(f, razao, indice, t, d, vol) { const s = c.createOscillator(), m = c.createOscillator(), q = c.createGain(); s.frequency.value = f; m.frequency.value = f * razao; q.gain.setValueAtTime(f * indice, t); q.gain.exponentialRampToValueAtTime(f * .05, t + d * .6); m.connect(q); q.connect(s.frequency); s.connect(envelope(t, d, vol)); s.start(t); m.start(t); s.stop(t + d + .01); m.stop(t + d + .01); },
  });
  const buf = await c.startRendering(), a = buf.getChannelData(0);
  // todos saem com o mesmo pico, e o fim é suavizado para não estalar
  let pico = 1e-6; for (const v of a) pico = Math.max(pico, Math.abs(v));
  const fim = Math.min(a.length, Math.ceil(taxa * .02)); for (let i = 0; i < a.length; i++) a[i] *= Math.min(1, (a.length - i) / fim) / pico;
  return buf;
}

export function criarSom(permitido) {
  let ctx = null, mestre, musica, efeitos, bombeia, entradaDisco, filtro, filtro2, vozIn, gravaBaixo, ruido, bumboCurva, passo = 0, proximo = 0, inicio = 0, fase = 0, energia = 0, ligada = true, destaque = -99, abaixa, entradaEco, vozes = 0;
  const discos = [], fazendo = [], pecas = {};
  const pode = () => ctx && ctx.state === 'running' && permitido();

  async function prepararDisco(i) {
    if (discos[i] || fazendo[i]) return; fazendo[i] = true;
    try { discos[i] = await gravarDisco(HARMONIAS[i], 32000); } catch { /* aparelho sem suporte: fica sem esta camada */ }
    fazendo[i] = false;
  }
  async function prepararPecas() {
    for (const nome in PECAS) try { pecas[nome] = await gravarPeca(PECAS[nome], 32000); } catch { /* aparelho sem suporte: fica sem este som */ }
  }
  function acordar() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      const nivel = (v, para) => { const g = ctx.createGain(); g.gain.value = v; g.connect(para); return g; }, forma = (c, para) => { const s = ctx.createWaveShaper(); s.curve = c; s.connect(para); return s; };
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 8; comp.attack.value = .004; comp.release.value = .16;
      // saída final: um limitador que só segura os picos, para nada estourar quando música e batidas somam
      const limite = ctx.createDynamicsCompressor(); limite.threshold.value = -2; limite.knee.value = 0; limite.ratio.value = 20; limite.attack.value = .001; limite.release.value = .08; limite.connect(nivel(.88, ctx.destination));
      abaixa = nivel(1, limite); comp.connect(nivel(NIVEL_FUNDO, abaixa));                         // a música abaixa um instante quando a bola bate
      mestre = nivel(.85, comp);
      const ar = ctx.createBiquadFilter(); ar.type = 'highshelf'; ar.frequency.value = 4200; ar.gain.value = 7; ar.connect(mestre);              // brilho nos agudos
      musica = nivel(ligada ? .5 : 0, forma(SATURA(1.35), ar));           // a música toda passa por uma saturação leve
      bombeia = nivel(1, musica);                                             // "respira" com o bumbo
      // caminho do disco: distorção → phaser → filtro duplo que abre e fecha
      filtro2 = ctx.createBiquadFilter(); filtro2.type = 'lowpass'; filtro2.Q.value = .8; filtro2.connect(bombeia);
      filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.Q.value = 5; filtro.frequency.value = 500; filtro.connect(filtro2); filtro2.frequency.value = 900;
      const seco = nivel(.75, filtro), molhado = nivel(.6, filtro), lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = .22; lfo.start();
      let alvo = molhado; for (const f of [350, 700, 1300, 2300]) { const ap = ctx.createBiquadFilter(); ap.type = 'allpass'; ap.frequency.value = f; ap.Q.value = .6; const q = ctx.createGain(); q.gain.value = f * .65; lfo.connect(q); q.connect(ap.frequency); ap.connect(alvo); alvo = ap; }
      const dist = ctx.createWaveShaper(); dist.curve = SATURA(3.2); dist.connect(seco); dist.connect(alvo); entradaDisco = nivel(1.15, dist);
      // voz de robô: redução de bits + brilho
      const crush = forma(DEGRAUS(14), nivel(.5, musica)), eco = ctx.createDelay(1); eco.delayTime.value = SEMI * 3; const ecoG = nivel(.26, musica); crush.connect(eco); eco.connect(ecoG); const volta = ctx.createGain(); volta.gain.value = .35; eco.connect(volta); volta.connect(eco);
      vozIn = nivel(1.5, forma(SATURA(2.4), crush));
      gravaBaixo = nivel(.5, forma(SATURA(4.5), nivel(.52, bombeia)));
      bumboCurva = forma(SATURA(2.8), nivel(.82, musica));
      // os sons das peças têm caminho próprio: não passam pelo compressor da música (era ele que os escondia)
      efeitos = nivel(.8, forma(SATURA(1.3), nivel(NIVEL_EFEITOS, limite)));
      const ecoF = ctx.createBiquadFilter(), ecoE = ctx.createDelay(1), ecoV = nivel(.34, ecoE); ecoF.type = 'bandpass'; ecoF.frequency.value = 1700; ecoF.Q.value = .5; ecoE.delayTime.value = SEMI * 3;
      ecoF.connect(ecoE); ecoE.connect(ecoV); ecoE.connect(nivel(.5, efeitos)); entradaEco = ecoF;
      ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      inicio = proximo = ctx.currentTime + .1;
      setInterval(agendar, 25);
      prepararPecas().then(() => prepararDisco(0));
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  function pausar(sim) { if (!ctx) return; if (sim && ctx.state === 'running') ctx.suspend(); else if (!sim && ctx.state === 'suspended') ctx.resume(); }

  // ---------- Instrumentos ----------
  function tom(tipo, f, t, dur, vol, saida, o = {}) {
    const s = ctx.createOscillator(), g = ctx.createGain(); s.type = tipo; s.frequency.setValueAtTime(f, t);
    if (o.ate) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.ate), t + (o.em || dur));
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.ataque || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let fim = g;
    if (o.corte) { const q = ctx.createBiquadFilter(); q.type = 'lowpass'; q.Q.value = o.q || 1; q.frequency.setValueAtTime(o.corte, t); if (o.corteAte) q.frequency.exponentialRampToValueAtTime(o.corteAte, t + dur); g.connect(q); fim = q; }
    s.connect(g); fim.connect(saida); s.start(t); s.stop(t + dur + .02);
  }
  function chiado(t, dur, vol, saida, tipo, f, fAte, q = 1) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), b = ctx.createBiquadFilter(); s.buffer = ruido; s.loop = true; b.type = tipo; b.Q.value = q; b.frequency.setValueAtTime(f, t); if (fAte) b.frequency.exponentialRampToValueAtTime(fAte, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(b); b.connect(g); g.connect(saida); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  // um pedaço da gravação (com bordas suaves para não estalar)
  function pedaco(buf, de, dur, t, vel = 1, vol = 1) {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; s.playbackRate.value = vel;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.setValueAtTime(vol, t + dur - .012); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(g); g.connect(entradaDisco); s.start(t, de, dur * vel + .02); s.stop(t + dur + .01);
  }
  // voz de robô: serra + pulso passando por 3 formantes que mudam de vogal
  function robo(n, t, dur, vogal, vol) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.setValueAtTime(vol, t + dur * .8); g.gain.linearRampToValueAtTime(0, t + dur); g.connect(vozIn);
    const fs = [1, .7, .35].map((v, i) => { const b = ctx.createBiquadFilter(), q = ctx.createGain(); b.type = 'bandpass'; b.Q.value = 7 + i * 2; b.frequency.setValueAtTime(FORMANTES.u[i], t); b.frequency.exponentialRampToValueAtTime(FORMANTES[vogal][i], t + Math.min(.09, dur * .5)); q.gain.value = v; b.connect(q); q.connect(g); return b; });
    for (const [tipo, f, d, v] of [['sawtooth', 1, -6, .5], ['sawtooth', 1, 7, .5], ['square', .5, 0, .35], ['sawtooth', 2, 3, .18]]) { const o = ctx.createOscillator(), q = ctx.createGain(); o.type = tipo; o.frequency.value = nota(n) * f; o.detune.value = d; q.gain.value = v; o.connect(q); fs.forEach(b => q.connect(b)); o.start(t); o.stop(t + dur + .02); }
  }
  // ---------- Música: agenda cada passo (1/16) um pouco antes ----------
  function agendar() {
    if (!ctx || ctx.state !== 'running') return;
    if (proximo < ctx.currentTime - .3) { const atraso = Math.ceil((ctx.currentTime - proximo) / SEMI); passo += atraso; proximo += atraso * SEMI; }
    while (proximo < ctx.currentTime + .14) { if (permitido() && ligada) tocarPasso(passo, proximo); passo++; proximo += SEMI; }
  }
  function tocarPasso(p, t) {
    const s = p % 16, comp = Math.floor(p / 16), ciclo = comp % 16, ac = HARMONIAS[fase][comp % 4], e = energia, bal = s % 2 ? SEMI * .12 : 0;   // leve balanço
    const pausa = ciclo >= 12 && ciclo < 14 && fase !== 5, subida = ciclo >= 14 && ciclo < 16, virada = comp % 4 === 3 && s >= 12;
    // filtro: começa fechado, vai abrindo; na pausa fecha, na subida abre de uma vez. Jogo animado = mais aberto
    if (s % 4 === 0) {
      const pos = (ciclo + s / 16) / 12, abre = pausa ? .12 : subida ? .25 + (ciclo - 14 + s / 16) * .38 : Math.min(1, .16 + pos * .75 + e * .35), f = 220 * Math.pow(38, Math.min(1, abre));
      filtro.frequency.setTargetAtTime(f, t, .09); filtro2.frequency.setTargetAtTime(Math.min(15000, f * 1.7), t, .09); filtro.Q.setTargetAtTime(pausa || subida ? 9 : 4.5, t, .1);
    }
    // bateria
    if (s % 4 === 0 && !pausa && !(subida && ciclo === 15 && s > 4)) {
      tom('sine', 170, t, .3, 1.1, bumboCurva, { ate: 44, em: .085 }); chiado(t, .012, .35, musica, 'highpass', 2200);
      bombeia.gain.cancelScheduledValues(t); bombeia.gain.setValueAtTime(.12, t); bombeia.gain.linearRampToValueAtTime(1, t + SEMI * 2.6);
    }
    if (s % 8 === 4 && !pausa) for (const [q, v] of [[0, .34], [.009, .3], [.019, .4]]) chiado(t + q, .13, v, musica, 'bandpass', 1500, 1100, .9);
    if (s % 4 === 2) chiado(t, .12, .26, musica, 'highpass', 7200);
    if (s % 2 === 1 || s % 4 === 0) chiado(t + bal, .03, .09 + e * .05, musica, 'highpass', 9800);
    if (s === 10 || s === 15) chiado(t + bal, .05, .16, musica, 'bandpass', 2800, 0, 2);
    if (subida) chiado(t, .06, .08 + (ciclo - 14 + s / 16) * .16, musica, 'bandpass', 1200 + (ciclo - 14) * 1500 + s * 90, 0, 1.4);
    if (ciclo === 0 && s === 0) chiado(t, 2.2, .34, musica, 'highpass', 4200, 9000);
    if (ciclo === 12 && s === 0) chiado(t, SEMI * 60, .14, musica, 'bandpass', 300, 7000, 1.5);
    // disco recortado
    const buf = discos[fase];
    if (buf) {
      const oit = SEMI * 2, base = (comp % 4) * SEMI * 16;
      if (virada) { const de = base + RECORTES[fase][6] * oit; pedaco(buf, de, SEMI * .5, t, 1, .8); pedaco(buf, de, SEMI * .5, t + SEMI * .5, s > 13 ? 2 : 1, .8); }      // gagueira
      else if (s % 2 === 0) pedaco(buf, base + RECORTES[fase][s / 2] * oit, oit, t);
    }
    // baixo distorcido
    const b = BAIXOS[fase % 2][s];
    if (b >= 0 && !pausa) { const f = nota(ac[0] - 24 + b); tom('sawtooth', f, t + bal, SEMI * 1.5, .7, gravaBaixo, { corte: 520 + e * 900, corteAte: 150, q: 7 }); tom('square', f, t + bal, SEMI * 1.3, .28, gravaBaixo, { corte: 400 }); }
    // voz de robô: entra na segunda metade do ciclo, e logo depois de grandes momentos
    if (ciclo >= 4 && (ciclo % 8 >= 4 || comp - destaque < 4)) for (const [q, grau, vogal, d] of VOZES[(fase + (comp % 4 === 3 ? 1 : 0)) % 6]) if (q === s) robo(ac[grau] + 12, t, SEMI * d * .92, vogal, .34);
    // arpejo ácido quando o jogo esquenta
    if (e > .5 && !pausa) tom('sawtooth', nota(ac[(s * 3) % 4] + 12 + (s % 8 > 5 ? 12 : 0)), t, SEMI * .9, .10, gravaBaixo, { corte: 900 + Math.sin(p * .13) * 600 + e * 1800, corteAte: 300, q: 12 });
  }

  // ---------- Sons das peças ----------
  // passo da música que está soando em t, e o próximo instante que cai no ritmo
  const passoEm = t => passo + Math.floor((t - proximo) / SEMI + 1e-6), noRitmo = t => proximo + Math.ceil((t - proximo) / SEMI + .25) * SEMI;
  // nota do acorde do momento: k sobe pelo acorde, uma oitava a cada 4
  function grau(k, t) {
    const ac = HARMONIAS[fase][((Math.floor(passoEm(t) / 16) % 4) + 4) % 4].map(n => n % 12).sort((a, b) => a - b);
    return 60 + ac[k % 4] + 12 * Math.floor(k / 4);
  }
  function tocar(nome, t, vol, o = {}) {
    const buf = pecas[nome]; if (!buf || vozes > 26) return;
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; g.gain.value = vol;
    s.playbackRate.value = o.n ? Math.pow(2, (o.n - BASE) / 12) : o.vel || 1;
    s.connect(g); let sai = g;
    if (lugar && ctx.createStereoPanner) { sai = ctx.createStereoPanner(); sai.pan.value = lugar; g.connect(sai); }
    sai.connect(efeitos); if (o.eco) { const q = ctx.createGain(); q.gain.value = o.eco; g.connect(q); q.connect(entradaEco); }
    vozes++; s.onended = () => { vozes--; }; s.start(t);
  }
  // batidas seguidas sobem a melodia; depois de um respiro ela recomeça
  let degrau = 3, ultimaBatida = -9, ultimaResposta = -9, lugar = 0;
  function sobeDegrau(t) { degrau = t - ultimaBatida > 1.6 ? 3 : degrau >= 11 ? 5 : degrau + 1; ultimaBatida = t; return degrau; }
  // a música "responde" à batida: notas do acorde, dentro do ritmo
  function resposta(nome, t, k, vol, quantas = 3) {
    if (t - ultimaResposta < .3 || vozes > 14) return; ultimaResposta = t;
    const r = noRitmo(t); for (let i = 0; i < quantas; i++) tocar(nome, r + i * SEMI, vol * Math.pow(.72, i), { n: grau(Math.min(12, k + 1 + i), r + i * SEMI) });
  }
  function frase(nome, t, graus, vol, passoT = SEMI, eco = .25) { graus.forEach((k, i) => tocar(nome, t + i * passoT, vol, { n: grau(k, t), eco })); }
  const varia = v => v * (.95 + Math.random() * .1);
  // [quanto a música abaixa (0 a 1), som]
  const EF = {
    palheta: [0, t => tocar('clique', t, .8, { vel: varia(1) })],
    batida: [0, (t, f) => tocar('toc', t, .22 + .55 * Math.min(1, f / 1800), { vel: varia(.8 + Math.min(.4, f / 4000)) })],
    bumper: [.45, (t, i) => { const k = sobeDegrau(t); tocar('tum', t, .65, { vel: varia(1.1 - (i % 3) * .08) }); tocar('stab', t, 1.15, { n: grau(k, t), eco: .35 }); resposta('pluck', t, k, .4); }],
    estilingue: [.4, t => { const k = sobeDegrau(t); tocar('estalo', t, .8, { vel: varia(1) }); tocar('zap', t, .6, { vel: varia(1) }); tocar('stab', t, .4, { n: grau(Math.max(0, k - 3), t) }); }],
    tecla: [.45, (t, i) => { tocar('tum', t, .5, { vel: 1.3 }); tocar('pluck', t, .9, { n: grau(4 + i % 5, t), eco: .5 }); tocar('voz', t, .45, { n: grau(2 + i % 4, t) }); resposta('pluck', t, 4 + i % 5, .45); }],
    alvo: [.45, (t, i) => { const k = 4 + i % 4; sobeDegrau(t); tocar('estalo', t, .5, { vel: 1.25 }); tocar('sino', t, .9, { n: grau(k, t), eco: .5 }); tocar('voz', t, .5, { n: grau(k - 2, t) }); resposta('sino', t, k, .4, 2); }],
    letra: [.3, (t, i) => { tocar('sino', t, .7, { n: grau(5 + i % 4, t) }); tocar('sino', t + SEMI, .55, { n: grau(7 + i % 4, t), eco: .4 }); }],
    alta: [.3, (t, i) => { tocar('pluck', t, .7, { n: grau(5 + i % 4, t) }); tocar('sino', t + SEMI, .55, { n: grau(8, t), eco: .4 }); }],
    catraca: [0, t => tocar('tic', t, .6, { vel: varia(1) })],
    vinil: [.2, t => { tocar('zap', t, .45, { vel: 1.4 }); tocar('pluck', t, .5, { n: grau(sobeDegrau(t), t), eco: .3 }); }],
    volta: [.4, t => frase('pluck', t, [0, 2, 4, 6, 8, 10], .5, SEMI / 2)],
    cano: [.35, t => { tocar('sobe', t, .65); frase('pluck', t, [2, 3, 4, 5, 6, 7], .3); }],
    chegou: [.5, (t, i) => { const b = Math.min(4, Math.max(0, i - 1)); tocar('tum', t, .7); tocar('prato', t, .4); for (const k of [0, 2, 3]) tocar('stab', t, .32, { n: grau(b + k, t) }); frase('sino', t + SEMI, [b + 3, b + 4, b + 5, b + 7], .5); }],
    buraco: [.4, t => { tocar('tum', t, .7, { vel: .8 }); tocar('cai', t, .65, { vel: 1.5 }); }],
    lancou: [.35, t => { tocar('tum', t, .8, { vel: .9 }); tocar('sobe', t, .75, { vel: 1.3 }); }],
    pouso: [0, (t, f) => { if (f > 150) tocar('tum', t, .3 + .3 * Math.min(1, f / 900), { vel: 1.25 }); }],
    voltouMola: [0, t => tocar('toc', t, .35, { vel: .7 })],
    // cada batida no cometa é mais aguda que a anterior, até ele explodir
    cometa: [.55, (t, i) => { tocar('tum', t, .95, { vel: .75 }); tocar('estalo', t, .6, { vel: .8 }); tocar('voz', t, .8, { n: grau(Math.min(11, i), t), eco: .5 }); tocar('zap', t, .4, { vel: .8 + i * .06 }); resposta('stab', t, Math.min(10, i), .4, 2); }],
    cometaVoltou: [.2, t => frase('sino', t, [7, 5, 4], .45)],
    explosao: [.8, t => { tocar('boom', t, 1); tocar('prato', t, .6); for (const k of [0, 2, 3, 5]) tocar('stab', t, .4, { n: grau(k, t), eco: .4 }); frase('voz', noRitmo(t), [8, 7, 6, 4, 3, 2, 0], .5); }],
    missao: [.4, t => { tocar('voz', t, .7, { n: grau(4, t) }); tocar('voz', t + SEMI * 2, .75, { n: grau(6, t), eco: .4 }); }],
    fase: [.65, t => { tocar('sobe', t, .6); const r = noRitmo(t); frase('stab', r, [0, 2, 3, 4, 5, 6, 7, 8], .7); frase('voz', r + SEMI * 8, [4, 8], .8, SEMI * 2); tocar('prato', r + SEMI * 8, .7); tocar('tum', r + SEMI * 8, .8); }],
    perdeu: [.6, t => { tocar('cai', t, .65); frase('voz', t + SEMI, [5, 3, 2, 0], .5, SEMI * 1.5); }],
    salva: [.4, t => frase('pluck', t, [3, 4, 6, 7], .55)],
  };
  const ultimo = {};
  // i = qual peça (ou a força, nas pancadas); x = lugar da mesa, de -1 (esquerda) a 1 (direita)
  function efeito(nome, i = 0, x = 0) {
    if (!pode() || !EF[nome]) return;
    const t = ctx.currentTime; if (t - (ultimo[nome] || -1) < (nome === 'batida' ? .06 : .035)) return; ultimo[nome] = t;
    const [quanto, som] = EF[nome]; lugar = Math.max(-.6, Math.min(.6, x * .6)); som(t, i);
    if (quanto) { abaixa.gain.cancelScheduledValues(t); abaixa.gain.setTargetAtTime(1 - quanto, t, .006); abaixa.gain.setTargetAtTime(1, t + .07 + quanto * .12, .11); }
  }
  return {
    acordar, pausar, efeito,
    fase(i) { if (i !== fase) destaque = Math.floor(passo / 16); fase = i; if (ctx) { prepararDisco(i); prepararDisco((i + 1) % 6); } },
    energia(e) { energia = e; },
    musica(sim) { ligada = sim; if (musica) musica.gain.setTargetAtTime(sim ? .5 : 0, ctx.currentTime, .1); },
    batida() { return ctx && ctx.state === 'running' ? Math.max(0, ctx.currentTime - inicio - (ctx.outputLatency || 0)) * BPM / 60 : performance.now() / 1000 * BPM / 60; },
  };
}

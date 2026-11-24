// Música e sons do Galatic Pinball: tudo original, tocado na hora pelo próprio aparelho (sem arquivos de áudio).
// Música eletrônica a 126 batidas por minuto; a cada fase entram instrumentos e muda a harmonia.
export const BPM = 126;
const nota = n => 440 * Math.pow(2, (n - 69) / 12);
// harmonia de cada fase: 4 acordes (notas MIDI) e a melodia em graus
const HARMONIAS = [
  [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 66]],
  [[62, 65, 69, 72], [58, 62, 65, 69], [53, 57, 60, 64], [60, 64, 67, 70]],
  [[52, 55, 59, 62], [52, 55, 59, 64], [57, 60, 64, 67], [59, 62, 66, 69]],
  [[54, 57, 61, 64], [50, 54, 57, 61], [57, 61, 64, 68], [52, 56, 59, 62]],
  [[59, 62, 66, 69], [55, 59, 62, 66], [62, 66, 69, 73], [57, 61, 64, 67]],
  [[57, 60, 64, 69], [65, 69, 72, 76], [60, 64, 67, 72], [55, 59, 62, 67]],
];
const BAIXO = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1], MELODIAS = [
  [0, -1, 2, -1, 3, -1, 2, 1, -1, 0, -1, 2, -1, 1, -1, -1], [3, -1, -1, 2, -1, 1, -1, 0, 2, -1, 3, -1, -1, 1, 2, -1],
  [0, 0, -1, 0, 3, -1, 0, -1, 0, 0, -1, 2, -1, 3, -1, 1], [2, -1, 3, -1, 1, -1, 2, -1, 0, -1, 1, -1, 3, -1, 2, -1],
  [0, 1, 2, 3, -1, 3, 2, -1, 0, 1, 2, 3, -1, 1, -1, 2], [3, -1, 3, 2, -1, 3, -1, 0, 3, 2, 1, -1, 3, -1, 2, 1],
];

export function criarSom(permitido) {
  let ctx = null, mestre, musica, efeitos, bombeia, ruido, passo = 0, proximo = 0, inicio = 0, fase = 0, energia = 0, ligada = true, timer = 0;
  const pode = () => ctx && ctx.state === 'running' && permitido();

  function acordar() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; comp.connect(ctx.destination);
      mestre = ctx.createGain(); mestre.gain.value = .8; mestre.connect(comp);
      musica = ctx.createGain(); musica.gain.value = ligada ? .5 : 0; musica.connect(mestre);
      bombeia = ctx.createGain(); bombeia.connect(musica);                    // "respira" com o bumbo
      efeitos = ctx.createGain(); efeitos.gain.value = .55; efeitos.connect(mestre);
      ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      inicio = proximo = ctx.currentTime + .08;
      timer = setInterval(agendar, 25);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  function pausar(sim) { if (!ctx) return; if (sim && ctx.state === 'running') ctx.suspend(); else if (!sim && ctx.state === 'suspended') ctx.resume(); }

  // ---------- Instrumentos ----------
  function tom(tipo, f, t, dur, vol, saida, o = {}) {
    const s = ctx.createOscillator(), g = ctx.createGain(); s.type = tipo; s.frequency.setValueAtTime(f, t);
    if (o.ate) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.ate), t + (o.em || dur));
    if (o.desafina) s.detune.value = o.desafina;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.ataque || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let fim = g;
    if (o.corte) { const q = ctx.createBiquadFilter(); q.type = o.filtro || 'lowpass'; q.Q.value = o.q || 1; q.frequency.setValueAtTime(o.corte, t); if (o.corteAte) q.frequency.exponentialRampToValueAtTime(o.corteAte, t + dur); g.connect(q); fim = q; }
    s.connect(g); fim.connect(saida); s.start(t); s.stop(t + dur + .02);
  }
  function acordeCurto(acorde, t, c) {
    const g = ctx.createGain(), q = ctx.createBiquadFilter(); q.type = 'lowpass'; q.Q.value = 3; q.frequency.setValueAtTime(c, t); q.frequency.exponentialRampToValueAtTime(c * .4, t + .2);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.075, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .2); g.connect(q); q.connect(bombeia);
    acorde.forEach((n, i) => { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = nota(n + 12); s.detune.value = i % 2 ? 7 : -7; s.connect(g); s.start(t); s.stop(t + .22); });
  }
  function chiado(t, dur, vol, saida, filtro, f, fAte, q = 1) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), b = ctx.createBiquadFilter(); s.buffer = ruido; s.loop = true; b.type = filtro; b.Q.value = q; b.frequency.setValueAtTime(f, t); if (fAte) b.frequency.exponentialRampToValueAtTime(fAte, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(b); b.connect(g); g.connect(saida); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  // ---------- Música: agenda cada passo (1/16) um pouco antes ----------
  function agendar() {
    if (!ctx || ctx.state !== 'running') return;
    if (proximo < ctx.currentTime - .3) { const atraso = Math.ceil((ctx.currentTime - proximo) / (15 / BPM)); passo += atraso; proximo += atraso * 15 / BPM; }
    while (proximo < ctx.currentTime + .13) { if (permitido() && ligada) tocarPasso(passo, proximo); passo++; proximo += 15 / BPM; }
  }
  function tocarPasso(p, t) {
    const s = p % 16, comp = Math.floor(p / 16), acorde = HARMONIAS[fase][comp % 4], virada = comp % 8 === 7 && s >= 12, e = energia;
    if (s % 4 === 0) { tom('sine', 150, t, .28, .95, musica, { ate: 42, em: .09 }); chiado(t, .015, .3, musica, 'highpass', 2500); bombeia.gain.cancelScheduledValues(t); bombeia.gain.setValueAtTime(.25, t); bombeia.gain.linearRampToValueAtTime(1, t + .2); }
    if (s % 8 === 4) { chiado(t, .16, .42, musica, 'bandpass', 1700, 0, .8); chiado(t + .012, .1, .25, musica, 'bandpass', 2300, 0, .8); }
    if (s % 4 === 2) chiado(t, .09, .22, musica, 'highpass', 8000);
    if (e > .3 && s % 2) chiado(t, .035, .10, musica, 'highpass', 9500);
    if (virada) chiado(t, .1, .25, musica, 'bandpass', 900 + (s - 12) * 500, 0, 1.2);
    if (BAIXO[s]) { const f = nota(acorde[0] - 24 + (s === 6 || s === 13 ? 12 : 0)); tom('sawtooth', f, t, .2, .34, bombeia, { corte: 380 + e * 700, corteAte: 120, q: 6 }); tom('sine', f, t, .2, .3, bombeia); }
    // acordes picados com filtro que abre e fecha
    if ([0, 3, 6, 10, 13].includes(s)) { const c = 500 + (Math.sin(p / 64 * Math.PI) * .5 + .5) * (1800 + e * 2600); acordeCurto(acorde, t, c); }
    if (s === 0) for (const n of acorde) tom('triangle', nota(n), t, 1.9, .035, bombeia, { ataque: .3, corte: 1400 });
    // melodia
    const m = MELODIAS[fase][s];
    if (m >= 0 && (comp % 4 > 0 || fase > 1)) { const f = nota(acorde[m] + 24); tom('square', f, t, .16, .05, musica, { corte: 3200, corteAte: 900, q: 4 }); tom('sine', f, t + .18, .12, .025, musica); }
    if (e > .55) { const f = nota(acorde[s % 4] + 24 + (s % 8 > 3 ? 12 : 0)); tom('sawtooth', f, t, .08, .03, bombeia, { corte: 5200, corteAte: 1200 }); }
    if (comp % 8 === 0 && s === 0) chiado(t, 1.6, .22, musica, 'highpass', 5000, 9000);
  }

  // ---------- Sons das peças ----------
  const EF = {
    palheta: t => { chiado(t, .04, .3, efeitos, 'bandpass', 1400); tom('square', 130, t, .04, .16, efeitos, { ate: 70 }); },
    bumper: (t, i) => { tom('sine', 520 + (i % 5) * 90, t, .16, .5, efeitos, { ate: 180 }); tom('square', 1040 + (i % 5) * 180, t, .07, .12, efeitos); chiado(t, .05, .3, efeitos, 'highpass', 3000); },
    estilingue: t => { tom('triangle', 300, t, .12, .5, efeitos, { ate: 900 }); chiado(t, .05, .3, efeitos, 'bandpass', 2200); },
    tecla: (t, i) => { const n = [72, 74, 76, 79, 81][i % 5]; tom('square', nota(n), t, .22, .18, efeitos, { corte: 3600 }); tom('sine', nota(n + 12), t, .3, .14, efeitos); },
    alvo: (t, i) => { tom('triangle', nota(76 + (i % 3) * 4), t, .2, .4, efeitos); tom('sine', nota(88 + (i % 3) * 4), t + .03, .2, .18, efeitos); },
    letra: t => { tom('sine', 1200, t, .12, .3, efeitos); tom('sine', 1800, t + .06, .16, .25, efeitos); },
    catraca: t => { chiado(t, .025, .28, efeitos, 'highpass', 5000); tom('square', 1500, t, .02, .08, efeitos); },
    cano: t => { chiado(t, .9, .32, efeitos, 'bandpass', 500, 4200, 2); tom('sawtooth', 160, t, .8, .12, efeitos, { ate: 900, corte: 2200 }); },
    chegou: (t, i) => { [0, 4, 7, 12].forEach((k, j) => tom('triangle', nota(72 + (i % 5) * 2 + k), t + j * .055, .22, .3, efeitos)); },
    buraco: t => { tom('sine', 700, t, .4, .45, efeitos, { ate: 90 }); chiado(t, .3, .2, efeitos, 'lowpass', 900, 200); },
    lancou: t => { chiado(t, .7, .4, efeitos, 'bandpass', 300, 3600, 1.2); tom('sawtooth', 90, t, .6, .22, efeitos, { ate: 520, corte: 1500 }); },
    cometa: (t, i) => { tom('sine', 190 - i * 6, t, .3, .7, efeitos, { ate: 50 }); chiado(t, .16, .45, efeitos, 'lowpass', 1800, 300); tom('square', 700 + i * 60, t, .06, .1, efeitos); },
    explosao: t => { chiado(t, 1.8, .9, efeitos, 'lowpass', 3200, 70); tom('sine', 120, t, 1.2, .9, efeitos, { ate: 26 }); for (let i = 0; i < 8; i++) tom('square', 400 + Math.random() * 1600, t + i * .05, .12, .07, efeitos, { ate: 120 }); },
    fase: t => { [0, 4, 7, 12, 16, 19, 24].forEach((k, j) => { tom('sawtooth', nota(60 + k), t + j * .08, .4, .16, efeitos, { corte: 4200, corteAte: 1200 }); tom('square', nota(72 + k), t + j * .08, .25, .06, efeitos); }); chiado(t, 1, .2, efeitos, 'highpass', 4000, 9000); },
    perdeu: t => { tom('sawtooth', 420, t, .9, .22, efeitos, { ate: 55, corte: 1800, corteAte: 200 }); },
    salva: t => { [67, 71, 74, 79].forEach((n, j) => tom('square', nota(n), t + j * .07, .16, .13, efeitos)); },
    batida: t => { chiado(t, .04, .16, efeitos, 'bandpass', 2600); },
  };
  const ultimo = {};
  function efeito(nome, i = 0) {
    if (!pode() || !EF[nome]) return;
    const t = ctx.currentTime; if (t - (ultimo[nome] || -1) < .035) return; ultimo[nome] = t;
    EF[nome](t, i);
  }
  return {
    acordar, pausar, efeito,
    fase(i) { fase = i; },
    energia(e) { energia = e; },
    musica(sim) { ligada = sim; if (musica) musica.gain.setTargetAtTime(sim ? .5 : 0, ctx.currentTime, .1); },
    // batida atual (contínua), para as luzes seguirem a música
    batida() { return ctx && ctx.state === 'running' ? Math.max(0, ctx.currentTime - inicio - (ctx.outputLatency || 0)) * BPM / 60 : performance.now() / 1000 * BPM / 60; },
  };
}

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

export function criarSom(permitido) {
  let ctx = null, mestre, musica, efeitos, bombeia, entradaDisco, filtro, filtro2, vozIn, gravaBaixo, ruido, bumboCurva, passo = 0, proximo = 0, inicio = 0, fase = 0, energia = 0, ligada = true, destaque = -99;
  const discos = [], fazendo = [];
  const pode = () => ctx && ctx.state === 'running' && permitido();

  async function prepararDisco(i) {
    if (discos[i] || fazendo[i]) return; fazendo[i] = true;
    try { discos[i] = await gravarDisco(HARMONIAS[i], 32000); } catch { /* aparelho sem suporte: fica sem esta camada */ }
    fazendo[i] = false;
  }
  function acordar() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      const nivel = (v, para) => { const g = ctx.createGain(); g.gain.value = v; g.connect(para); return g; }, forma = (c, para) => { const s = ctx.createWaveShaper(); s.curve = c; s.connect(para); return s; };
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 8; comp.attack.value = .004; comp.release.value = .16; comp.connect(ctx.destination);
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
      efeitos = nivel(.55, mestre);
      ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      inicio = proximo = ctx.currentTime + .1;
      setInterval(agendar, 25);
      prepararDisco(0);
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
    fase(i) { if (i !== fase) destaque = Math.floor(passo / 16); fase = i; if (ctx) { prepararDisco(i); prepararDisco((i + 1) % 6); } },
    energia(e) { energia = e; },
    musica(sim) { ligada = sim; if (musica) musica.gain.setTargetAtTime(sim ? .5 : 0, ctx.currentTime, .1); },
    batida() { return ctx && ctx.state === 'running' ? Math.max(0, ctx.currentTime - inicio - (ctx.outputLatency || 0)) * BPM / 60 : performance.now() / 1000 * BPM / 60; },
  };
}

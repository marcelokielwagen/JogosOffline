'use strict';
// Efeitos sonoros gerados na hora (Web Audio). A música e o motor completo de áudio entram na Fase 5.
const Som = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let ctx = null, mestre = null, ruidoBuf = null, ultimaQueda = 0, amb = null;
  let ligado = (() => { try { return localStorage.getItem('tico:som') !== '0'; } catch (e) { return true; } })();
  function init() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      mestre = ctx.createGain(); mestre.gain.value = ligado ? .8 : 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      mestre.connect(comp); comp.connect(ctx.destination);
      const n = ctx.sampleRate * 2; ruidoBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = ruidoBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      // destrava o som no celular: toca um silêncio dentro do toque
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (temaPendente) { const t = temaPendente; temaPendente = null; iniciarMusica(t); }
  }
  const ok = () => ctx && ligado && ctx.state === 'running';
  function tom(f, dur, o = {}) {
    if (!ok()) return;
    const t = ctx.currentTime + (o.q || 0), os = ctx.createOscillator(), g = ctx.createGain();
    os.type = o.tipo || 'sine'; os.frequency.setValueAtTime(f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const v = o.vol ?? .2, at = o.at ?? .005;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g);
    if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); fl.connect(mestre); } else g.connect(mestre);
    os.start(t); os.stop(t + dur + .05);
  }
  function ruido(dur, o = {}) {
    if (!ok()) return;
    const t = ctx.currentTime + (o.q || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruidoBuf; f.type = o.tipo || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    f.Q.value = o.Q ?? 1; const v = o.vol ?? .3;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (o.at ?? .005)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(mestre); s.start(t, Math.random() * 1.2); s.stop(t + dur + .05);
  }

  // ---------- música de aventura (sequenciador de semicolcheias com tempo à frente) ----------
  // Cada tema: tom, escala, andamento, progressão de 4 compassos e "pegada" da bateria. A melodia é sorteada com semente
  // fixa a partir das notas do acorde, então cada tema é sempre a mesma música (gruda no ouvido) e muda a cada modo.
  const TEMAS = {
    mapa: { base: 196, maior: true, bpm: 96, acordes: [0, 3, 0, 4], bat: 'leve', sem: 3 },
    joias: { base: 262, maior: true, bpm: 112, acordes: [0, 4, 5, 3], bat: 'pop', sem: 7 },
    resgate: { base: 220, maior: false, bpm: 128, acordes: [0, 5, 2, 6], bat: 'tensa', sem: 11 },
    arremesso: { base: 294, maior: true, bpm: 120, acordes: [0, 3, 4, 0], bat: 'marcha', sem: 5 },
    pintura: { base: 349, maior: true, bpm: 104, acordes: [0, 5, 1, 4], bat: 'pula', sem: 9 },
  };
  const MAIOR = [0, 2, 4, 5, 7, 9, 11], MENOR = [0, 2, 3, 5, 7, 8, 10];
  let mus = null, musGain = null, musTimer = null, intens = 0, temaPendente = null;
  function semMus(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function montarTema(nome) {
    const T = TEMAS[nome], esc = T.maior ? MAIOR : MENOR, r = semMus(T.sem * 97 + 13);
    const grau = (g, oit = 0) => T.base * 2 ** ((esc[((g % 7) + 7) % 7] + 12 * (Math.floor(g / 7) + oit)) / 12);
    const ritmos = [[0, 3, 6, 8, 10, 12], [0, 2, 4, 6, 8, 12, 14], [0, 4, 6, 7, 8, 12], [0, 3, 4, 8, 11, 12, 14], [0, 6, 8, 10, 12, 14]];
    const mel = []; let ult = 4; // melodia: 4 compassos, notas do acorde com passos curtos
    for (let b = 0; b < 4; b++) {
      const rit = ritmos[Math.floor(r() * ritmos.length)], ac = T.acordes[b], tons = [ac, ac + 2, ac + 4, ac + 7];
      for (const s of rit) { let alvo = tons[Math.floor(r() * tons.length)] + (r() < .3 ? 1 : 0); while (alvo - ult > 4) alvo -= 7; while (ult - alvo > 4) alvo += 7; alvo = clamp(alvo, 0, 11); ult = alvo; mel.push({ passo: b * 16 + s, g: alvo, dur: rit.includes(s + 2) ? .18 : .32 }); }
    }
    return { T, grau, mel, passo: 0, prox: 0, nome };
  }
  function tocarPasso(m, quando) {
    const { T, grau } = m, p = m.passo % 128, compasso = Math.floor(p / 16) % 4, s = p % 16, ac = T.acordes[compasso], seg = 60 / T.bpm / 4;
    const nota = (f, dur, o) => tomEm(f, dur, quando, o), ruidoQ = (dur, o) => ruidoEm(dur, quando, o);
    // bateria
    const bt = T.bat, forte = .55 + intens * .45;
    if (bt === 'marcha') { if (s % 4 === 0) bumbo(quando, .5); if (s === 4 || s === 12) caixa(quando, .22); if (s % 2 === 1 && intens > .3) ruidoQ(.03, { tipo: 'highpass', f: 8000, vol: .03 }); }
    else if (bt === 'tensa') { if (s % 4 === 0 || s === 10) bumbo(quando, .55); if (s === 4 || s === 12) caixa(quando, .2); if (s % (intens > .5 ? 1 : 2) === 0) ruidoQ(.025, { tipo: 'highpass', f: 8500, vol: .025 * forte }); }
    else if (bt === 'pula') { if (s === 0 || s === 6 || s === 8) bumbo(quando, .4); if (s === 4 || s === 12) caixa(quando, .14); if (s % 2 === 0) ruidoQ(.025, { tipo: 'highpass', f: 9000, vol: .02 }); }
    else if (bt === 'pop') { if (s === 0 || s === 8 || s === 10) bumbo(quando, .45); if (s === 4 || s === 12) caixa(quando, .16); if (s % 2 === 0) ruidoQ(.02, { tipo: 'highpass', f: 9000, vol: .022 }); }
    else { if (s === 0) bumbo(quando, .3); if (s === 8) ruidoQ(.12, { f: 6000, Q: .8, vol: .02 }); }
    // baixo
    if (s % 4 === 0 || (bt !== 'leve' && s === 14)) nota(grau(ac, -2), seg * 3, { tipo: 'triangle', vol: .14, lp: 700 });
    // acordes (pad) no começo do compasso
    if (s === 0) for (const g of [ac, ac + 2, ac + 4]) { nota(grau(g, -1), seg * 15, { tipo: 'sawtooth', vol: .018, lp: 1300, at: .08 }); nota(grau(g, -1) * 1.006, seg * 15, { tipo: 'sawtooth', vol: .014, lp: 1100, at: .08 }); }
    // harpa (arpejo) nos contratempos
    if (s % 2 === 1 || bt === 'leve' && s % 4 === 2) { const g = [ac, ac + 2, ac + 4, ac + 7][(s >> 1) % 4]; nota(grau(g, 0), seg * 2.5, { vol: .03 }); }
    // melodia (na segunda metade da frase sobe uma oitava em parte)
    const loop = Math.floor(p / 64);
    for (const n of m.mel) if (n.passo === p % 64) { const oit = loop === 1 && n.passo >= 32 ? 1 : 0; nota(grau(n.g, oit), n.dur, { tipo: 'square', vol: .035, lp: 2600 }); nota(grau(n.g, oit), n.dur, { tipo: 'triangle', vol: .05 }); }
  }
  function tomEm(f, dur, t, o = {}) {
    const os = ctx.createOscillator(), g = ctx.createGain(); os.type = o.tipo || 'sine'; os.frequency.setValueAtTime(f, t);
    const at = o.at ?? .006; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.vol ?? .05, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g); if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); fl.connect(musGain); } else g.connect(musGain);
    os.start(t); os.stop(t + dur + .05);
  }
  function ruidoEm(dur, t, o = {}) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = ruidoBuf; f.type = o.tipo || 'bandpass'; f.frequency.value = o.f || 1000; f.Q.value = o.Q ?? 1;
    g.gain.setValueAtTime(o.vol ?? .05, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(musGain); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  function bumbo(t, v) { const os = ctx.createOscillator(), g = ctx.createGain(); os.frequency.setValueAtTime(140, t); os.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(v * .5, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); os.connect(g); g.connect(musGain); os.start(t); os.stop(t + .22); }
  function caixa(t, v) { ruidoEm(.13, t, { f: 1900, Q: .7, vol: v * .5 }); tomEm(190, .08, t, { tipo: 'triangle', vol: v * .3 }); }
  function agendar() {
    if (!mus || !ctx || ctx.state !== 'running') return;
    const seg = 60 / mus.T.bpm / 4; if (mus.prox < ctx.currentTime) mus.prox = ctx.currentTime + .05;
    while (mus.prox < ctx.currentTime + .15) { tocarPasso(mus, mus.prox); mus.prox += seg; mus.passo++; }
  }
  function iniciarMusica(nome) {
    if (!ctx) { temaPendente = nome; return; }
    if (!musGain) { musGain = ctx.createGain(); musGain.gain.value = 0; musGain.connect(mestre); }
    if (mus && mus.nome === nome) return;
    musGain.gain.cancelScheduledValues(ctx.currentTime); musGain.gain.setTargetAtTime(0, ctx.currentTime, .05);
    const novo = nome ? montarTema(nome) : null;
    setTimeout(() => { mus = novo; if (mus) { mus.prox = ctx.currentTime + .05; musGain.gain.setTargetAtTime(.9, ctx.currentTime, .3); } }, 180);
    if (!musTimer) musTimer = setInterval(agendar, 30);
  }
  const ESC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
  const nota = (b, s) => b * 2 ** (s / 12);
  return {
    musica(nome) { iniciarMusica(nome); }, intensidade(v) { intens = clamp(v, 0, 1); }, get tema() { return mus ? mus.nome : null; }, get passos() { return mus ? mus.passo : 0; },
    medir() { if (!musGain) return 0; if (!this._an) { this._an = ctx.createAnalyser(); this._an.fftSize = 2048; musGain.connect(this._an); } const d = new Float32Array(2048); this._an.getFloatTimeDomainData(d); let q = 0; for (const v of d) q += v * v; return Math.sqrt(q / d.length); },
    init, ligado: () => ligado,
    alternar() { ligado = !ligado; try { localStorage.setItem('tico:som', ligado ? '1' : '0'); } catch (e) {} if (mestre) mestre.gain.value = ligado ? .8 : 0; return ligado; },
    clique() { tom(990, .07, { tipo: 'triangle', vol: .1 }); },
    selecao() { tom(1320, .06, { tipo: 'sine', vol: .07 }); },
    troca() { ruido(.15, { f: 700, f2: 2400, Q: 2, vol: .1 }); tom(520, .1, { vol: .05, f2: 820 }); },
    nao() { tom(240, .1, { tipo: 'square', vol: .05, lp: 900 }); tom(190, .14, { tipo: 'square', vol: .05, lp: 900, q: .1 }); },
    encaixe(n = 1) { // estalo cristalino que sobe a cada cascata
      const f = nota(880, ESC[Math.min(n - 1, ESC.length - 1)]);
      tom(f, .4, { vol: .16 }); tom(f * 2, .28, { vol: .07 }); tom(f * 3.01, .2, { tipo: 'triangle', vol: .035 });
      ruido(.07, { tipo: 'highpass', f: 6500, vol: .07 });
    },
    especial() { [0, 4, 7, 12].forEach((s, i) => tom(nota(660, s), .32, { tipo: 'triangle', vol: .1, q: i * .05 })); ruido(.45, { f: 3000, f2: 9000, Q: .7, vol: .07 }); },
    foguete() { ruido(.55, { f: 500, f2: 4000, Q: 1.4, vol: .2 }); tom(260, .5, { tipo: 'sawtooth', vol: .045, f2: 1300, lp: 2200 }); },
    explosao(forte) { ruido(forte ? 1.2 : .7, { tipo: 'lowpass', f: 2600, f2: 55, Q: .8, vol: forte ? .75 : .5 }); tom(120, forte ? .9 : .5, { vol: .55, f2: 32 }); ruido(.05, { tipo: 'highpass', f: 3000, vol: .2 }); },
    raio(i) { tom(1100 + ((i * 173) % 1000), .14, { tipo: 'triangle', vol: .05 }); },
    gelo() { ruido(.2, { tipo: 'highpass', f: 3800, vol: .17 }); tom(2500, .13, { vol: .05, f2: 1700 }); tom(3300, .1, { vol: .035, q: .03 }); },
    madeira() { ruido(.17, { f: 520, Q: 1.3, vol: .3 }); tom(175, .15, { tipo: 'triangle', vol: .17, f2: 105 }); },
    metal() { [523, 1247, 1871, 2430].forEach((f, i) => tom(f, .55 - i * .09, { vol: .08 })); ruido(.06, { tipo: 'highpass', f: 4200, vol: .1 }); },
    corrente() { for (let i = 0; i < 4; i++) tom(1700 + Math.random() * 1000, .08, { tipo: 'square', vol: .028, lp: 5000, q: i * .045 }); },
    queda() { const a = performance.now(); if (a - ultimaQueda < 80) return; ultimaQueda = a; tom(320 + Math.random() * 90, .07, { vol: .04 }); },
    pavio() { ruido(.3, { tipo: 'highpass', f: 5000, vol: .08 }); },
    vitoria() {
      [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => { tom(nota(392, s), .38, { tipo: 'sawtooth', vol: .065, lp: 2600, q: i * .12 }); tom(nota(392, s) * 1.005, .38, { tipo: 'square', vol: .025, lp: 1800, q: i * .12 }); });
      [0, 4, 7, 12].forEach(s => tom(nota(784, s), 1.5, { tipo: 'sawtooth', vol: .05, lp: 3200, q: 1, at: .03 }));
      tom(98, 1.5, { tipo: 'triangle', vol: .2, q: 1 }); ruido(1.3, { f: 7000, Q: .5, vol: .05, q: 1 });
    },
    derrota() { [7, 4, 0, -5].forEach((s, i) => tom(nota(330, s), .5, { tipo: 'triangle', vol: .13, q: i * .24 })); },
    estrela(i) { const s = [0, 4, 7][i] || 0; tom(nota(1046, s), .55, { tipo: 'triangle', vol: .14 }); tom(nota(2093, s), .4, { vol: .05 }); ruido(.3, { f: 8000, vol: .04 }); },
    moeda() { tom(1318, .08, { tipo: 'square', vol: .045, lp: 6000 }); tom(1760, .28, { tipo: 'square', vol: .045, lp: 6000, q: .07 }); },
    uau() { [0, 7, 12, 16, 19, 24].forEach((s, i) => tom(nota(523, s), .3, { tipo: 'triangle', vol: .08, q: i * .04 })); },
    // ---- resgate ----
    perigo(tipo) {
      if (tipo === 'agua') { tom(240, .35, { vol: .14, f2: 110 }); for (let i = 0; i < 4; i++) tom(500 + Math.random() * 500, .08, { vol: .05, f2: 1400, q: .08 + i * .07 }); }
      else if (tipo === 'lava') { ruido(.7, { tipo: 'highpass', f: 2500, vol: .12 }); tom(70, .6, { tipo: 'sawtooth', vol: .08, lp: 300 }); }
      else if (tipo === 'espinhos') { ruido(.5, { f: 900, Q: 8, vol: .25 }); tom(65, .5, { tipo: 'square', vol: .07, lp: 400 }); }
      else if (tipo === 'pedra') { ruido(.8, { tipo: 'lowpass', f: 260, vol: .55 }); tom(55, .7, { vol: .3, f2: 40 }); }
    },
    entulho(mat) {
      if (mat === 'bolas') { for (let i = 0; i < 5; i++) tom(1500 + Math.random() * 1500, .12, { vol: .05, q: i * .035 }); }
      else if (mat === 'cubos') { for (let i = 0; i < 3; i++) tom(300 + Math.random() * 200, .09, { tipo: 'triangle', vol: .12, q: i * .05 }); }
      else { ruido(.3, { tipo: 'lowpass', f: 900, f2: 200, vol: .4 }); for (let i = 0; i < 3; i++) ruido(.06, { f: 1500 + Math.random() * 1500, Q: 3, vol: .15, q: .03 + i * .05 }); }
    },
    canhao() { tom(90, .5, { vol: .5, f2: 40 }); ruido(.45, { tipo: 'lowpass', f: 1800, f2: 120, vol: .45 }); ruido(.08, { tipo: 'highpass', f: 2500, vol: .15 }); },
    lata(v = 3) { const a = performance.now(); if (a - ultimaQueda < 35) return; ultimaQueda = a; const f = 900 + Math.random() * 700, k = clamp(v / 8, .2, 1); [1, 2.76, 5.4].forEach((m, i) => tom(f * m, .25 - i * .05, { vol: .07 * k, tipo: i ? 'sine' : 'triangle' })); ruido(.05, { tipo: 'highpass', f: 4000, vol: .08 * k }); },
    pancada(v = 3) { const k = clamp(v / 8, .2, 1); tom(110 + Math.random() * 40, .2, { vol: .25 * k, f2: 60 }); ruido(.12, { tipo: 'lowpass', f: 700, vol: .25 * k }); },
    cristal() { for (let i = 0; i < 6; i++) tom(2000 + Math.random() * 3000, .3, { vol: .05, q: i * .02 }); ruido(.25, { tipo: 'highpass', f: 5000, vol: .18 }); },
    splash(i = 0) { ruido(.2, { f: 900 + i * 70, f2: 300, Q: 1.4, vol: .16 }); tom(420 + i * 45, .12, { vol: .05, f2: 900 + i * 60 }); },
    apagar() { ruido(.5, { f: 3200, f2: 400, Q: 2, vol: .14 }); tom(640, .45, { tipo: 'sawtooth', f2: 150, vol: .04, lp: 1500 }); },
    porta() { ruido(.5, { f: 400, f2: 1200, Q: 6, vol: .12 }); tom(140, .4, { tipo: 'triangle', vol: .1, f2: 90 }); },
    cadeado() { tom(2100, .05, { tipo: 'square', vol: .05, lp: 6000 }); tom(1500, .06, { tipo: 'square', vol: .05, lp: 6000, q: .06 }); ruido(.1, { tipo: 'highpass', f: 5000, vol: .1 }); },
    chave() { [0, 7, 12, 19].forEach((s, i) => tom(nota(784, s), .4, { tipo: 'triangle', vol: .1, q: i * .06 })); },
    libertar() { [0, 4, 7, 12, 16].forEach((s, i) => tom(nota(523, s), .5, { tipo: 'sawtooth', vol: .06, lp: 2800, q: i * .07 })); ruido(.8, { f: 6000, Q: .5, vol: .06 }); },
    ambiente(tipo) {
      if (amb) { const a = amb; amb = null; try { a.g.gain.setTargetAtTime(0, ctx.currentTime, .2); setTimeout(() => { try { a.s.stop(); a.o.stop(); } catch (e) {} }, 900); } catch (e) {} }
      if (!tipo || !ctx) return;
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain();
      const C = { agua: ['lowpass', 520, 2, 4, 260], lava: ['lowpass', 320, 4, 7, 140], espinhos: ['bandpass', 170, 5, .5, 40], pedra: ['lowpass', 140, 1, .3, 30] }[tipo];
      s.buffer = ruidoBuf; s.loop = true; f.type = C[0]; f.frequency.value = C[1]; f.Q.value = C[2]; o.frequency.value = C[3]; og.gain.value = C[4];
      o.connect(og); og.connect(f.frequency); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(mestre); s.start(); o.start(); amb = { s, g, o };
    },
    ambienteNivel(v) { if (amb && ctx) amb.g.gain.setTargetAtTime(ligado ? .03 + v * .2 : 0, ctx.currentTime, .3); },
    susto() { tom(880, .25, { tipo: 'square', vol: .05, lp: 3000, f2: 1400 }); tom(660, .3, { tipo: 'square', vol: .04, lp: 3000, q: .12, f2: 990 }); },
  };
})();

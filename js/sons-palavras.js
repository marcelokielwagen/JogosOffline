// Sons das Palavras Cruzadas e do Caça-Palavras, todos fabricados na hora (sem arquivos).
// Os efeitos são bem mais altos que a música; a música abaixa um instante em cada acerto.
export function criarSons() {
  let ctx = null, mestre, efeitos, musG, eco, estilo = null, relogio = null, prox = 0, passoM = 0, ruido = null;
  const ligado = () => JO.carregar('som', true), comMusica = () => JO.carregar('musicaPalavras', true);
  const VM = .5, hz = n => 440 * 2 ** ((n - 69) / 12), PENTA = [0, 2, 4, 7, 9];
  const nota = k => hz(67 + 12 * Math.floor(k / 5) + PENTA[((k % 5) + 5) % 5]);

  function abrir() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' });
    const teto = ctx.createDynamicsCompressor(); teto.threshold.value = -8; teto.knee.value = 6; teto.ratio.value = 10; teto.attack.value = .002; teto.release.value = .15;
    mestre = ctx.createGain(); mestre.gain.value = .9; mestre.connect(teto); teto.connect(ctx.destination);
    efeitos = ctx.createGain(); efeitos.gain.value = 1; efeitos.connect(mestre); musG = ctx.createGain(); musG.gain.value = VM; musG.connect(mestre);
    const n = ctx.sampleRate; ruido = ctx.createBuffer(1, n, n); const d = ruido.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    // eco de sala
    const t = Math.floor(n * 1.5), ir = ctx.createBuffer(2, t, n); for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < t; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / t) ** 3 * .55; }
    const cv = ctx.createConvolver(); cv.buffer = ir; eco = ctx.createGain(); eco.gain.value = .5; eco.connect(cv); cv.connect(mestre);
  }
  const pode = () => { if (!ctx || !ligado()) return false; if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; };

  // ---------- Instrumentos ----------
  function env(v, t, a, dur, para, molha = 0) {
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur); g.connect(para);
    if (molha) { const m = ctx.createGain(); m.gain.value = molha; g.connect(m); m.connect(eco); } return g;
  }
  function osc(f, v, t, dur, { tipo = 'sine', a = .003, para = efeitos, molha = 0, cai = 0 } = {}) { const o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t); if (cai) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * cai), t + dur); o.connect(env(v, t, a, dur, para, molha)); o.start(t); o.stop(t + dur + .02); }
  function sopro(v, t, dur, f, q, { tipo = 'bandpass', para = efeitos, molha = 0, vai = 0 } = {}) { const s = ctx.createBufferSource(), b = ctx.createBiquadFilter(); s.buffer = ruido; b.type = tipo; b.frequency.setValueAtTime(f, t); if (vai) b.frequency.exponentialRampToValueAtTime(vai, t + dur); b.Q.value = q; s.connect(b); b.connect(env(v, t, .002, dur, para, molha)); s.start(t, Math.random() * .5); s.stop(t + dur + .02); }
  const marimba = (f, v, t, o = {}) => { osc(f, v, t, .55, { molha: .35, ...o }); osc(f * 3.93, v * .28, t, .12, { molha: .2, ...o }); osc(f * 9.2, v * .08, t, .05, o); sopro(v * .25, t, .025, 2600, 1, o); };
  const sino = (f, v, t, o = {}) => { [[1, 1, 1.5], [2.01, .45, 1.1], [2.99, .25, .7], [4.2, .16, .45], [5.4, .1, .3]].forEach(([k, g, d]) => osc(f * k, v * g, t, d, { molha: .5, ...o })); };
  const madeira = (v, t, tom = 1) => { osc(210 * tom, v, t, .09, { cai: .6 }); osc(640 * tom, v * .4, t, .05); sopro(v * .7, t, .03, 1800 * tom, 1.2); };
  function abaixar(k = .35, dur = .6) { const p = musG.gain, t = ctx.currentTime; p.cancelScheduledValues(t); p.setTargetAtTime(VM * k, t, .03); p.setTargetAtTime(VM, t + dur, .4); }
  const agora = () => ctx.currentTime + .003;

  // ---------- Música: um ciclo de acordes tocado aos poucos, por estilo ----------
  const ESTILOS = {
    eletronica: { bpm: 108, ac: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 65]] },
    calma: { bpm: 76, ac: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]] },
    alegre: { bpm: 100, ac: [[60, 64, 67, 72], [65, 69, 72, 76], [62, 65, 69, 72], [55, 59, 62, 67]] },
  };
  function agendar() {
    if (!ctx || !estilo || ctx.state !== 'running') return;
    const E = ESTILOS[estilo], semi = 60 / E.bpm / 4; if (prox < ctx.currentTime) prox = ctx.currentTime + .05;
    while (prox < ctx.currentTime + .25) {
      const s = passoM % 16, ac = E.ac[Math.floor(passoM / 16) % 4], volta = Math.floor(passoM / 64) % 4, t = prox, o = { para: musG };
      if (s === 0) ac.forEach(n => { const ol = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), d = semi * 16; ol.type = estilo === 'calma' ? 'triangle' : 'sawtooth'; ol.frequency.value = hz(n); ol.detune.value = (Math.random() - .5) * 12; f.type = 'lowpass'; f.frequency.setValueAtTime(450, t); f.frequency.linearRampToValueAtTime(estilo === 'eletronica' ? 1300 : 900, t + d * .6); f.frequency.linearRampToValueAtTime(450, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(estilo === 'calma' ? .05 : .026, t + .25); g.gain.setValueAtTime(estilo === 'calma' ? .05 : .026, t + d - .25); g.gain.linearRampToValueAtTime(0, t + d + .1); ol.connect(f); f.connect(g); g.connect(musG); ol.start(t); ol.stop(t + d + .12); });
      if (estilo === 'eletronica') {
        if (s % 4 === 0) osc(hz(ac[0] - 24), .22, t, .2, { ...o, cai: .9 });
        if (s % 4 === 0 && volta) { osc(120, .24, t, .16, { ...o, cai: .35 }); } if (s % 4 === 2 && volta > 1) sopro(.05, t, .05, 8000, .8, { ...o, tipo: 'highpass' });
        if ([0, 3, 6, 10, 12, 14].includes(s)) osc(hz(ac[(s * 3) % 4] + 12), .055, t, .18, { ...o, tipo: 'square', molha: .25 });
      } else if (estilo === 'alegre') {
        if (s % 8 === 0) osc(hz(ac[0] - 12), .2, t, .3, o); if ([0, 4, 6, 8, 12, 14].includes(s)) marimba(hz(ac[(s / 2) % 4] + 12), .075, t, o); if (s % 4 === 2) sopro(.035, t, .04, 6000, 1, { ...o, tipo: 'highpass' });
      } else if ([0, 6, 8, 11, 14].includes(s) && !(volta === 0 && s > 8)) marimba(hz(ac[(s + passoM) % 4] + (s % 3 ? 12 : 0)), .085, t, o);
      prox += semi; passoM++;
    }
  }
  function tocarMusica(nome) { if (nome) estilo = nome; clearInterval(relogio); relogio = null; if (!ctx || !estilo || !ligado() || !comMusica()) return; prox = 0; relogio = setInterval(agendar, 90); agendar(); }
  const pararMusica = () => { clearInterval(relogio); relogio = null; };
  // Pausa ou tela apagada: para tudo.
  function vigiar() { if (!ctx) return; const p = document.hidden || JO.pausado(); if (p && ctx.state === 'running') ctx.suspend().catch(() => {}); else if (!p && ctx.state === 'suspended') ctx.resume().catch(() => {}); }
  setInterval(vigiar, 400); document.addEventListener('visibilitychange', vigiar);
  // O navegador só deixa tocar depois do primeiro toque na tela.
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => { abrir(); if (estilo && !relogio) tocarMusica(); }, { capture: true });

  const f = fn => (...a) => { if (pode()) fn(agora(), ...a); };
  return {
    toque: f(t => madeira(.5, t, 1.1)),
    tecla: f(t => madeira(.55, t, .95 + Math.random() * .12)),
    letra: f((t, k) => { marimba(nota(k % 10), .5, t); madeira(.25, t, 1.3); }),
    arrasta: f((t, k) => marimba(nota(k), .42, t)),
    apagar: f(t => { osc(300, .3, t, .12, { cai: .5 }); sopro(.2, t, .06, 900, 1); }),
    erro: f(t => { osc(150, .34, t, .22, { tipo: 'triangle', cai: .7 }); osc(157, .24, t, .22, { tipo: 'triangle', cai: .7 }); madeira(.4, t, .55); }),
    nada: f(t => osc(180, .25, t, .14, { tipo: 'triangle', cai: .7 })),
    // quanto mais palavras achadas, mais alto o acorde
    palavra: f((t, n = 0) => { abaixar(.35, .7); [0, 2, 4, 5, 7].forEach((k, i) => marimba(nota(k + n % 4), .5, t + i * .065)); sino(nota(7 + n % 4), .26, t + .33); sopro(.12, t, .35, 900, .8, { vai: 6000, molha: .4 }); }),
    dica: f(t => { [9, 7, 9].forEach((k, i) => sino(nota(k), .2, t + i * .09)); }),
    pecas: f((t, n = 20) => { for (let i = 0; i < Math.min(n, 26); i++) madeira(.16 + Math.random() * .1, t + .15 + i * .032 + Math.random() * .02, .8 + i * .02); }),
    cair: f(t => { sopro(.25, t, .8, 2400, .7, { vai: 250, molha: .2 }); for (let i = 0; i < 10; i++) madeira(.14, t + i * .05, 1.3 - i * .06); }),
    fase: f(t => { abaixar(.12, 2.4); [[0, 60], [.14, 64], [.28, 67], [.42, 72], [.66, 67], [.8, 72]].forEach(([d, n]) => { marimba(hz(n + 12), .5, t + d); osc(hz(n), .16, t + d, .4, { tipo: 'sawtooth', molha: .3 }); }); [72, 76, 79, 84].forEach(n => sino(hz(n), .2, t + .95)); osc(hz(36), .4, t + .95, .9); sopro(.16, t + .95, 1.2, 7000, .6, { tipo: 'highpass', molha: .4 }); }),
    trofeu: f(t => { abaixar(.08, 4); [[0, 60], [.16, 60], [.32, 60], [.48, 67], [.86, 65], [1.02, 64], [1.18, 62], [1.36, 72]].forEach(([d, n]) => { [0, 4, 7].forEach(k => osc(hz(n + k), .12, t + d, .34, { tipo: 'sawtooth', molha: .3 })); marimba(hz(n + 12), .4, t + d); }); [72, 76, 79, 84, 88].forEach((n, i) => sino(hz(n), .18, t + 1.5 + i * .09)); }),
    abreFase: f(t => { [0, 3, 5].forEach((k, i) => marimba(nota(k), .35, t + i * .08)); }),
    trancado: f(t => { osc(120, .35, t, .1, { tipo: 'square', cai: .8 }); osc(110, .3, t + .12, .12, { tipo: 'square', cai: .8 }); }),
    musica: tocarMusica, pararMusica,
    get musicaLigada() { return comMusica(); },
    alternarMusica() { JO.salvar('musicaPalavras', !comMusica()); if (comMusica()) { abrir(); tocarMusica(); } else pararMusica(); return comMusica(); },
    // para testes: volume que está saindo agora
    medidor() { if (!ctx) return null; if (!this.an) { this.an = ctx.createAnalyser(); this.an.fftSize = 4096; mestre.connect(this.an); } const d = new Float32Array(4096); this.an.getFloatTimeDomainData(d); let p = 0; for (const v of d) p = Math.max(p, Math.abs(v)); return { pico: p, estado: ctx.state }; },
  };
}
const ELETRO = new Set(['pc', 'seguranca', 'infra', 'rede', 'codigo', 'nuvem', 'dados', 'espaco', 'cidade', 'cinema', 'musica']), FESTA = new Set(['festa', 'brasil', 'esporte', 'comida', 'frutas', 'cores', 'animais', 'escola']);
export const estiloDe = cenario => ELETRO.has(cenario) ? 'eletronica' : FESTA.has(cenario) ? 'alegre' : 'calma';

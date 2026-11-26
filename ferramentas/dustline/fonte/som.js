/* Som do Dustline: tudo criado na hora (Web Audio, nenhum arquivo).

   MÚSICA (chillwave, 84 batidas por minuto): bumbo abafado, palmas com eco, chimbal bem leve, baixo,
   acordes longos que "respiram" com o bumbo e um arpejo com eco que vai e volta. Partes de 8 compassos
   que entram e saem sozinhas, para não cansar.
   CARRO: motor macio (ondas filtradas, sobe com a rotação e troca de marcha), cascalho (ruído filtrado,
   mais forte com velocidade e derrapagem) e vento. Nada estridente: tudo passa por filtros passa-baixa.   */
const Som = (() => {
  const PEQUENO = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 600);
  const BPM = 84, SEMI = 60 / BPM / 4, hz = m => 440 * Math.pow(2, (m - 69) / 12), ale = (a, b) => a + Math.random() * (b - a);
  // acordes (notas MIDI) por hora do dia; cada um dura um compasso
  const HORAS = {
    manha: { acordes: [[53, 57, 60, 64, 67], [52, 55, 59, 62, 67], [50, 53, 57, 60, 64], [48, 55, 60, 62, 64]], baixo: [41, 40, 38, 36] },
    tarde: { acordes: [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [53, 57, 60, 64, 67], [48, 52, 55, 60, 62]], baixo: [38, 34, 41, 36] },
    primavera: { acordes: [[55, 59, 62, 66, 69], [52, 55, 59, 62, 66], [48, 52, 55, 59, 62], [50, 54, 57, 62, 64]], baixo: [43, 40, 36, 38] },
    neve: { acordes: [[45, 52, 55, 59, 64], [41, 48, 52, 55, 60], [43, 50, 55, 59, 62], [40, 47, 52, 55, 59]], baixo: [33, 29, 31, 28] },
    outono: { acordes: [[52, 55, 59, 62, 66], [48, 52, 55, 59, 64], [45, 48, 52, 55, 60], [47, 50, 54, 57, 62]], baixo: [40, 36, 33, 35] }
  };
  let ctx = null, G = null, hora = HORAS.manha, volume = 1, escondido = false, relogio = 0, prox = 0, passo = 0, compasso = 0, secao = 0, vigia = null, refeitos = 0;

  function iniciar() {
    if (volume <= 0 && !ctx) return; if (ctx && !travado()) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); montar(); ajustar(volume, true); prox = ctx.currentTime + .1; passo = 0; compasso = 0; secao = 0;
    clearInterval(relogio); relogio = setInterval(agendar, 25); if (ctx.state !== 'running') retomar();
  }
  const retomar = () => { const p = ctx.resume(); if (p) p.catch(() => {}); };
  function travado() {
    if (document.hidden || volume <= 0) return false; const toca = ctx.state === 'running', agora = performance.now();
    if (!toca && ctx.state !== 'closed') retomar();
    if (!vigia || vigia.toca !== toca || vigia.t !== ctx.currentTime) { vigia = { toca, t: ctx.currentTime, em: agora }; return false; }
    if (agora - vigia.em < 2500 || refeitos >= 3) return false; refeitos++; vigia = null; const v = ctx; ctx = G = null; if (v.state !== 'closed') v.close().catch(() => {}); return true;
  }
  const ganho = (v, d) => { const g = ctx.createGain(); g.gain.value = v; if (d) g.connect(d); return g; };
  const filtro = (t, f, q = .7, db = 0) => { const b = ctx.createBiquadFilter(); b.type = t; b.frequency.value = f; b.Q.value = q; b.gain.value = db; return b; };
  const lado = p => { if (!ctx.createStereoPanner) return ctx.createGain(); const n = ctx.createStereoPanner(); n.pan.value = p; return n; };
  const lfo = (f, q, alvo) => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(ganho(q, alvo)); o.start(); };

  function montar() {
    G = {}; G.final = ganho(PEQUENO ? .72 : .85, ctx.destination);
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -9; lim.ratio.value = 16; lim.attack.value = .002; lim.release.value = .2; lim.connect(G.final);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
    if (PEQUENO) comp.connect(filtro('highpass', 110)).connect(filtro('highshelf', 500, .7, 5)).connect(ganho(2)).connect(lim); else comp.connect(lim);
    G.mestre = ganho(0, comp); G.musica = ganho(PEQUENO ? .75 : .5, G.mestre); G.carro = ganho(PEQUENO ? .55 : .85, G.mestre);
    // a música "respira": o volume dos acordes afunda um pouco a cada bumbo
    G.respira = ganho(1, G.musica);
    // eco com tempo da música (colcheia pontuada) e sala
    G.eco = ganho(1); const a = ctx.createDelay(2), b = ctx.createDelay(2), ab = filtro('lowpass', 2400, .3); a.delayTime.value = SEMI * 3; b.delayTime.value = SEMI * 3;
    G.eco.connect(a); a.connect(b); b.connect(ab).connect(ganho(.42)).connect(a); a.connect(lado(-.6)).connect(ganho(.4, G.musica)); b.connect(lado(.6)).connect(ganho(.34, G.musica));
    const n = ctx.sampleRate * 2.8 | 0, imp = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); let s = 0; for (let i = 0; i < n; i++) { s += ((Math.random() * 2 - 1) - s) * .45; d[i] = s * Math.pow(1 - i / n, 2.4); } }
    G.sala = ctx.createConvolver(); G.sala.buffer = imp; G.sala.connect(ganho(.3, G.musica));
    G.padCorte = filtro('lowpass', PEQUENO ? 1500 : 1000, .6); G.padCorte.connect(G.respira); lfo(.05, PEQUENO ? 450 : 350, G.padCorte.frequency);
    G.respira.connect(ganho(.3, G.sala));
    // ruído base (motor, cascalho, vento e bateria usam)
    const m = ctx.sampleRate * 3 | 0; G.ruido = ctx.createBuffer(1, m, ctx.sampleRate); const d = G.ruido.getChannelData(0); for (let i = 0; i < m; i++) d[i] = Math.random() * 2 - 1;
    motor();
  }

  /* ---------- carro ---------- */
  function motor() {
    const M = G.m = {}, saida = filtro('lowpass', 700, .8); saida.connect(G.carro); M.corte = saida;
    M.vol = ganho(0, saida);
    M.o = [['sawtooth', 1, .5], ['sawtooth', 1.007, .4], ['square', .5, .28], ['triangle', 2, .18]].map(([t, k, v]) => { const o = ctx.createOscillator(); o.type = t; o.connect(ganho(v, M.vol)); o.start(); return [o, k]; });
    // "ronco": o volume pulsa no ritmo das explosões do motor
    M.tremor = ctx.createOscillator(); M.tremorG = ganho(.25, M.vol.gain); M.tremor.connect(M.tremorG); M.tremor.start();
    const ruido = (taxa, tipo, f, q) => { const s = ctx.createBufferSource(); s.buffer = G.ruido; s.loop = true; s.playbackRate.value = taxa; const fl = filtro(tipo, f, q), g = ganho(0); s.connect(fl).connect(g).connect(G.carro); s.start(); return { fl, g }; };
    M.cascalho = ruido(1, 'bandpass', 1400, .7); M.grao = ctx.createOscillator(); M.grao.type = 'square'; M.graoG = ganho(0, M.cascalho.g.gain); M.grao.connect(M.graoG); M.grao.start();   // grãos estalando
    M.derrapa = ruido(.8, 'bandpass', 1700, 1); M.vento = ruido(.5, 'lowpass', 500, .5);
  }
  // chamado a cada quadro com o estado do carro
  function carro({ rpm = 0, carga = 0, vel = 0, derrapa = 0, superficie = 1 }) {
    if (!ctx || !G || ctx.state !== 'running') return; const t = ctx.currentTime, M = G.m, k = .05;
    const f = 34 + rpm * 88; M.o.forEach(([o, m]) => o.frequency.setTargetAtTime(f * m, t, k)); M.tremor.frequency.setTargetAtTime(f / 2, t, k);
    M.vol.gain.setTargetAtTime(.05 + carga * .07 + rpm * .03, t, .08); M.corte.frequency.setTargetAtTime(240 + rpm * 520 + carga * 360, t, .08);
    const v = Math.min(1, vel / 30), solto = 1 - superficie * .4;
    M.cascalho.g.gain.setTargetAtTime(v * .2 * solto + Math.min(1, derrapa / 6) * .1, t, .1); M.cascalho.fl.frequency.setTargetAtTime(900 + v * 1100, t, .1);
    M.grao.frequency.setTargetAtTime(9 + v * 26, t, .1); M.graoG.gain.setTargetAtTime(v * .07, t, .1);
    M.derrapa.g.gain.setTargetAtTime(Math.max(0, Math.min(1, (derrapa - 1.2) / 6)) * .14, t, .06);
    M.vento.g.gain.setTargetAtTime(v * v * .16, t, .2);
  }

  /* ---------- música ---------- */
  const voz = (f, t, dur, v, { tipo = 'sine', ataque = .005, corte = 0, destino = G.musica, pan = 0, ate = 0, eco = 0 } = {}) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), p = lado(pan); o.type = tipo; o.frequency.setValueAtTime(f, t); if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur * .6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + ataque); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let n = o; if (corte) { const fl = filtro('lowpass', corte, 1.2); o.connect(fl); n = fl; } n.connect(g).connect(p).connect(destino); if (eco) g.connect(ganho(eco, G.eco));
    o.start(t); o.stop(t + dur + .05); o.onended = () => p.disconnect();
  };
  const chiado = (t, dur, v, tipo, f, q = 1, destino = G.musica, eco = 0) => { const s = ctx.createBufferSource(), fl = filtro(tipo, f, q), g = ganho(0); s.buffer = G.ruido; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(fl).connect(g).connect(destino); if (eco) g.connect(ganho(eco, G.sala)); s.start(t, Math.random() * 2, dur + .05); };
  // partes: 0 só acordes, 1 + bateria e baixo, 2 + arpejo, 3 quebra (acordes e arpejo, sem bumbo)
  const ROTEIRO = [0, 1, 2, 2, 3, 1, 2, 0];
  function agendar() {
    if (!ctx || ctx.state !== 'running' || volume <= 0) return;
    while (prox < ctx.currentTime + .15) { tocarPasso(passo, prox); prox += SEMI * (passo % 2 ? .92 : 1.08); passo++; if (passo % 16 === 0) { compasso++; if (compasso % 8 === 0) secao++; } }
  }
  function tocarPasso(p, t) {
    const s = p % 16, parte = ROTEIRO[secao % ROTEIRO.length], ac = hora.acordes[compasso % 4], bx = hora.baixo[compasso % 4];
    if (s === 0) acorde(ac, t);
    if (parte === 1 || parte === 2) {
      if (s === 0 || s === 8 || (s === 10 && compasso % 2)) bumbo(t);
      if (s === 4 || s === 12) chiado(t, .22, .12, 'bandpass', 1700, .8, G.musica, .35);
      if (s % 2 === 0) chiado(t, .05, s % 4 === 2 ? .045 : .025, 'highpass', 7500, .7);
      if ([0, 3, 6, 8, 10, 14].includes(s)) voz(hz(bx + (s === 10 ? 12 : 0)), t, SEMI * 1.8, .16, { tipo: 'sawtooth', corte: 420, ataque: .01, destino: G.musica });
    }
    if ((parte === 2 || parte === 3) && s % 2 === 0) { const n = ac[[0, 2, 4, 3, 1, 2, 4, 3][(s / 2) % 8]] + 12; voz(hz(n), t, .32, .05, { tipo: 'square', corte: 2600, eco: .5, pan: (s % 4 ? .3 : -.3) }); }
    if (parte === 3 && s === 8) chiado(t, 2.5, .03, 'bandpass', 900, .4, G.musica, .5);
  }
  function bumbo(t) { voz(140, t, .45, .5, { ate: 42, ataque: .002, destino: G.musica, corte: 900 }); const g = G.respira.gain; g.cancelScheduledValues(t); g.setValueAtTime(.55, t); g.linearRampToValueAtTime(1, t + SEMI * 3.2); }
  function acorde(ac, t) {
    const dur = SEMI * 16 + 1.2;
    ac.forEach((n, i) => { for (const det of [-7, 8]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det + ale(-3, 3); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.022 - i * .002, t + .9); g.gain.setValueAtTime(.022 - i * .002, t + dur - 1.2); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g).connect(G.padCorte); o.start(t); o.stop(t + dur + .05); } });
    if (PEQUENO) voz(hz(ac[2] + 12), t, dur, .03, { tipo: 'triangle', ataque: .8, destino: G.respira });
  }

  /* ---------- efeitos de interface ---------- */
  const nota = i => hz(hora.acordes[compasso % 4][i % 5] + 12 * Math.floor(i / 5) + 12);
  const E = {
    botao() { const t = ctx.currentTime; voz(hz(76), t, .3, .08, { tipo: 'triangle', eco: .3 }); },
    // contagem: três notas suaves e uma mais aguda na largada
    contagem(n) { const t = ctx.currentTime; voz(n ? hz(69) : hz(81), t, n ? .4 : .9, n ? .1 : .14, { tipo: 'triangle', eco: .4, destino: G.musica }); },
    marco() { const t = ctx.currentTime; [0, 2, 4].forEach((i, k) => voz(nota(i + 2), t + k * .07, .9, .08, { tipo: 'triangle', eco: .5, pan: (k - 1) * .4 })); },
    chegada(recorde) { const t = ctx.currentTime; [0, 1, 2, 3, 4, 5, 7].forEach((i, k) => voz(nota(i), t + k * .09, 1.6, .09 - k * .006, { tipo: 'triangle', eco: .6, pan: (k % 2 ? 1 : -1) * .3 })); if (recorde) [5, 7, 9].forEach((i, k) => voz(nota(i), t + .8 + k * .12, 1.4, .06, { tipo: 'sine', eco: .6 })); },
    // batida: um baque grave e abafado (nada de estalo metálico)
    batida(f) { if (ctx.currentTime - (E.ult || 0) < .25) return; E.ult = ctx.currentTime; const t = ctx.currentTime, v = Math.min(1, f / 12); voz(90, t, .35, .2 + v * .3, { ate: 45, corte: 400, destino: G.carro }); chiado(t, .25, .08 + v * .12, 'lowpass', 700, .7, G.carro); }
  };
  for (const k in E) { const f = E[k]; E[k] = (...a) => { if (ctx && ctx.state === 'running' && volume > 0) f(...a); }; }
  function ajustar(v, ja) { volume = v; if (!ctx) return; const t = ctx.currentTime; G.mestre.gain.cancelScheduledValues(t); G.mestre.gain.setTargetAtTime(v * .9, t, ja ? .8 : .25); }
  function mudarHora(id) { if (HORAS[id] && HORAS[id] !== hora) { hora = HORAS[id]; compasso = 0; secao = 0; } }
  for (const e of ['touchend', 'click', 'keydown']) addEventListener(e, iniciar, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) { escondido = true; ctx.suspend().catch(() => {}); } else if (escondido) { escondido = false; vigia = null; retomar(); } });
  return { ...E, carro, ajustar, mudarHora, get estado() { return ctx ? ctx.state : 'parado'; }, get contexto() { return ctx; }, get saida() { return G && G.final; }, pequeno: PEQUENO };
})();

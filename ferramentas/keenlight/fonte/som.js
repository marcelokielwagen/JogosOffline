/* Som (Web Audio, nada baixado): trilha própria de cada cenário que reage ao jogo.

   Cada cenário tem escala, acordes, um instrumento solista e um fundo:
     quarto     piano suave, tic-tac de relógio, zumbido da sala
     praia      marimba alegre, ondas que vão e voltam, gaivotas
     galeria    piano e cordas longas, sala grande, passos ao longe
     noir       jazz: contrabaixo andando, vassourinha na caixa, trompete abafado, chuva na janela
     biblioteca celesta (caixinha de música), nota grave contínua, lareira estalando, relógio lento
     cozinha    cordas beliscadas saltitantes, vários relógios, chaleira apitando às vezes

   Reage ao jogo (progresso): quanto mais objetos achados, mais notas e mais brilho; nos dois últimos
   entra um pulso grave de tensão; parado muito tempo, a música abaixa. Efeitos ficam por cima.

   solista + acordes + baixo ─► MÚSICA ─┐
   achar, errar, abrir ────────► EFEITOS ┼─► MESTRE ─► compressor ─► saída
   mar, chuva, lareira, relógios ► AMBIENTE ┘      (todos mandam um pouco para a SALA: reverberação) */
const Som = (() => {
  const PEQUENO = matchMedia('(pointer: coarse)').matches;
  let ctx = null, M = null, mus = null, fx = null, amb = null, sala = null, salaG = null, ruido = null, relogio = 0, ligado = true;
  let mar = null, chuva = null, drone = null, cfg = null, nome = 'quarto';
  let prog = 0, faltam = 12, ultimaAcao = 0, proxFrase = 0, proxAcorde = 0, proxGaivota = 0, proxChaleira = 0, proxPulso = 0, batida = 0, compasso = 0, ia = 0;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12), ale = (a, b) => a + Math.random() * (b - a), escolhe = a => a[Math.random() * a.length | 0];

  const CENAS = {
    quarto: { base: 57, escala: [0, 2, 3, 5, 7, 9, 10], acordes: [[45, 52, 57, 60, 64], [41, 48, 57, 60, 65], [43, 50, 55, 58, 62], [40, 47, 56, 59, 64]], voz: 'piano', fundo: 'piano', tic: [1, .05], sala: .35, frase: [9, 3.5] },
    praia: { base: 60, escala: [0, 2, 4, 7, 9], acordes: [[48, 55, 60, 64, 67], [53, 57, 60, 65, 69], [50, 57, 62, 65, 69], [55, 59, 62, 67, 71]], voz: 'marimba', fundo: 'marimba', mar: .5, gaivotas: 1, sala: .2, frase: [7, 2.5] },
    galeria: { base: 62, escala: [0, 2, 4, 5, 7, 9, 11], acordes: [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]], voz: 'piano', fundo: 'cordas', passos: 1, sala: .6, frase: [10, 4] },
    noir: { base: 62, escala: [0, 3, 5, 6, 7, 10], acordes: [[38, 50, 53, 57, 60], [43, 50, 53, 55, 59], [36, 48, 51, 55, 58], [41, 48, 51, 56, 60]], voz: 'trompete', fundo: 'piano', baixo: 1, vassoura: 1, chuva: .09, sala: .4, frase: [8, 3], bpm: 76 },
    biblioteca: { base: 69, escala: [0, 2, 3, 5, 7, 8, 11], acordes: [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [44, 52, 56, 59, 64], [45, 52, 57, 60, 64]], voz: 'celesta', fundo: 'cordas', drone: 33, lareira: 1, tic: [2, .025], sala: .45, frase: [8, 3] },
    cozinha: { base: 67, escala: [0, 2, 4, 5, 7, 9], acordes: [[48, 55, 60, 64, 67], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62]], voz: 'pizz', fundo: 'marimba', relogios: 1, chaleira: 1, sala: .25, frase: [5, 1.8], bpm: 112 }
  };
  cfg = CENAS.quarto;

  /* ---------- ligar ---------- */
  function iniciar() {
    if (!ligado) return;
    if (ctx) { if (ctx.state !== 'running') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ctx.destination);
    M = g(PEQUENO ? 1.1 : .9);
    if (PEQUENO) { const hp = filtro('highpass', 110); M.connect(hp).connect(comp); } else M.connect(comp);
    mus = g(.3, M); fx = g(.9, M); amb = g(1, M);
    sala = ctx.createConvolver(); const n = ctx.sampleRate * 2.6, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    sala.buffer = b; salaG = g(.35, M); sala.connect(salaG);
    ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = ruido.getChannelData(0); let ult = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; ult = (ult + .02 * w) / 1.02; d[i] = ult * 3.5; }
    laco(ruido, 1, 'lowpass', 280, .7, .045, amb);   // zumbido da sala
    { const s = laco(ruido, 1, 'lowpass', 900, .7, 1, null), mod = g(.5), lfo = ctx.createOscillator(); lfo.frequency.value = .11; lfo.connect(g(.45, mod.gain)); lfo.start(); mar = g(0, amb); s.out.connect(mod).connect(mar); }
    { const s = laco(ruido, 3, 'bandpass', 2600, .6, 1, null); chuva = g(0, amb); s.out.connect(chuva); }
    { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = filtro('lowpass', 300); o.type = o2.type = 'sawtooth'; o2.detune.value = 9; drone = g(0, amb); o.connect(f); o2.connect(f); f.connect(drone); o.start(); o2.start(); drone.osc = [o, o2]; }
    ultimaAcao = ctx.currentTime; aplicar();
    clearInterval(relogio); relogio = setInterval(agendar, 120);
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (ligado) ctx.resume(); });
  }
  const g = (v, dst) => { const x = ctx.createGain(); x.gain.value = v; if (dst) x.connect(dst); return x; };
  const filtro = (t, f, q = .7) => { const b = ctx.createBiquadFilter(); b.type = t; b.frequency.value = f; b.Q.value = q; return b; };
  function laco(buf, taxa, tipo, f, q, v, dst) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = taxa; const fl = filtro(tipo, f, q), o = g(v, dst); s.connect(fl).connect(o); s.start(); return { s, out: o }; }
  function env(no, t, a, pico, s) { no.gain.setValueAtTime(0, t); no.gain.linearRampToValueAtTime(pico, t + a); no.gain.exponentialRampToValueAtTime(.0001, t + a + s); }

  /* ---------- instrumentos ---------- */
  function tocar(voz, m, t, v, dur, saida = mus) {
    const f = hz(m), o = g(0, saida); o.connect(sala);
    const osc = (tipo, k, a, fim) => { const s = ctx.createOscillator(); s.type = tipo; s.frequency.value = f * k; const ga = g(a, o); if (fim) { ga.gain.setValueAtTime(a, t); ga.gain.exponentialRampToValueAtTime(.0001, t + fim); } s.connect(ga); s.start(t); s.stop(t + dur + .2); return s; };
    if (voz === 'piano') { env(o, t, .006, v, dur); [[1, 1], [2, .35, dur / 2], [3, .12, dur / 3], [4.02, .06, dur / 4]].forEach(([k, a, fim]) => osc('sine', k, a, fim)); }
    else if (voz === 'marimba') { env(o, t, .003, v * 1.2, Math.min(dur, .9)); osc('sine', 1, 1); osc('sine', 3.98, .25, .12); osc('sine', 10, .05, .03); }
    else if (voz === 'celesta') { env(o, t, .002, v, dur * 1.2); osc('sine', 1, 1); osc('sine', 2, .5, dur * .6); osc('sine', 5.4, .12, .4); osc('triangle', 4, .06, .2); }
    else if (voz === 'pizz') { env(o, t, .002, v * 1.3, .35); const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; const fl = filtro('lowpass', 2200, 2); fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(400, t + .3); s.connect(fl).connect(o); s.start(t); s.stop(t + .5); }
    else if (voz === 'trompete') { // abafado, com vibrato que entra devagar
      o.gain.setValueAtTime(0, t); o.gain.linearRampToValueAtTime(v * .9, t + .08); o.gain.setValueAtTime(v * .8, t + dur * .7); o.gain.exponentialRampToValueAtTime(.0001, t + dur);
      const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; const vib = ctx.createOscillator(); vib.frequency.value = 5.2; const vg = g(0); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .012, t + dur * .6); vib.connect(vg).connect(s.frequency);
      const fl = filtro('lowpass', 1100, 1.5), fl2 = filtro('peaking', 1500, 2); fl2.gain.value = 6; s.connect(fl).connect(fl2).connect(o); s.start(t); vib.start(t); s.stop(t + dur + .1); vib.stop(t + dur + .1);
    }
    else if (voz === 'cordas') { // acorde longo de cordas suaves
      o.gain.setValueAtTime(0, t); o.gain.linearRampToValueAtTime(v, t + dur * .35); o.gain.linearRampToValueAtTime(0, t + dur);
      for (const dt of [-7, 0, 7]) { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.detune.value = dt; const fl = filtro('lowpass', 900 + 900 * prog); s.connect(fl).connect(o); s.start(t); s.stop(t + dur + .1); }
    }
    else if (voz === 'baixo') { env(o, t, .01, v, .45); const s = ctx.createOscillator(); s.type = 'triangle'; s.frequency.value = f; const fl = filtro('lowpass', 500); s.connect(fl).connect(o); s.start(t); s.stop(t + .6); osc('sine', 1, .8, .5); }
  }
  function bater(t, f, v, dur, q = 8, saida = fx) {
    const s = ctx.createBufferSource(); s.buffer = ruido; const b = filtro('bandpass', f, q), o = g(0, saida); env(o, t, .002, v, dur); s.connect(b).connect(o); s.start(t, Math.random()); s.stop(t + dur + .05);
  }

  /* ---------- agenda da música ---------- */
  function agendar() {
    if (!ctx || !ligado) return;
    const t = ctx.currentTime, c = cfg, parado = t - ultimaAcao > 75;
    mus.gain.setTargetAtTime((parado ? .18 : .3) * (1 + prog * .25), t, 1.5);
    const acorde = c.acordes[ia % c.acordes.length];
    if (t > proxAcorde) {   // acordes de fundo
      const cordas = c.fundo === 'cordas', dur = cordas ? 9 : 6;
      acorde.forEach((m, i) => tocar(c.fundo, m, t + .05 + i * (cordas ? 0 : .07), cordas ? .025 : i ? .04 : .06, dur));
      ia++; proxAcorde = t + (c.bpm ? 60 / c.bpm * 8 : ale(9, 12) - prog * 3);
    }
    if (t > proxFrase) {   // frases do solista: mais frequentes conforme o progresso
      const n = 2 + (Math.random() * (2 + prog * 3) | 0), passo = c.bpm ? 60 / c.bpm / 2 : ale(.32, .55); let grau = Math.random() * c.escala.length | 0;
      for (let i = 0; i < n; i++) {
        grau = Math.max(0, Math.min(c.escala.length * 2 - 1, grau + escolhe([-2, -1, 1, 1, 2])));
        const m = c.base + c.escala[grau % c.escala.length] + 12 * Math.floor(grau / c.escala.length) + (c.voz === 'trompete' ? -12 : 0);
        tocar(c.voz, m, t + .1 + i * passo * (c.voz === 'trompete' ? 1.6 : 1), (c.voz === 'trompete' ? .05 : .065) * (1 + prog * .4), c.voz === 'trompete' ? passo * 1.5 : 3);
      }
      const [lento, rapido] = c.frase; proxFrase = t + ale(.8, 1.2) * (lento - (lento - rapido) * prog) * (parado ? 1.8 : 1);
    }
    if (c.bpm) {   // ritmo: contrabaixo andando e vassourinha (noir), pulso de pizz (cozinha)
      const tb = 60 / c.bpm;
      if (!batida || batida < t) batida = Math.ceil(t / tb) * tb;
      while (batida < t + .25) {
        const k = compasso++ % 4;
        if (c.baixo) { const notas = acorde.slice(0, 3).concat(acorde[0] + 2); tocar('baixo', notas[k] - (notas[k] > 52 ? 12 : 0), batida, .14, .5); }
        if (c.vassoura && prog > .15) bater(batida, 5200, k % 2 ? .05 : .025, k % 2 ? .18 : .1, 1.2, mus);
        if (nome === 'cozinha' && k % 2 === 0) tocar('pizz', acorde[0] + 12 + (k ? 7 : 0), batida, .035 + prog * .02, .3);
        batida += tb;
      }
    }
    if (c.tic || c.relogios) {   // tique-taques
      if (!c._tic || c._tic < t) c._tic = Math.ceil(t);
      while (c._tic < t + .4) { const par = Math.round(c._tic) % 2; if (c.tic && Math.round(c._tic) % c.tic[0] === 0) bater(c._tic, par ? 3200 : 2600, c.tic[1], .03, 14, amb); if (c.relogios) { bater(c._tic, par ? 3400 : 2700, .04, .03, 14, amb); bater(c._tic + .5, 4200, .022, .02, 16, amb); bater(c._tic + .25, 1900, .018, .03, 10, amb); } c._tic += 1; }
    }
    if (c.gaivotas && t > proxGaivota) { const n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) { const s = ctx.createOscillator(), o = g(0, amb), t0 = t + i * .22; s.type = 'triangle'; s.frequency.setValueAtTime(1900, t0); s.frequency.exponentialRampToValueAtTime(1100, t0 + .18); env(o, t0, .02, .045, .2); o.connect(sala); s.connect(o); s.start(t0); s.stop(t0 + .3); } proxGaivota = t + ale(7, 14); }
    if (c.passos && Math.random() < .015) { bater(t + .1, 220, .05, .08, 3, amb); bater(t + .7, 200, .04, .08, 3, amb); }
    if (c.lareira) for (let i = 0; i < 2; i++) if (Math.random() < .3) bater(t + Math.random() * .12, 1200 + Math.random() * 3000, .03 + Math.random() * .05, .015, 6, amb);
    if (c.chaleira && t > proxChaleira) { if (proxChaleira) { const s = ctx.createOscillator(), o = g(0, amb); s.type = 'sine'; s.frequency.setValueAtTime(1700, t); s.frequency.linearRampToValueAtTime(2300, t + 2.5); o.gain.setValueAtTime(0, t); o.gain.linearRampToValueAtTime(.02, t + 1.5); o.gain.linearRampToValueAtTime(0, t + 3.2); s.connect(o); s.start(t); s.stop(t + 3.3); } proxChaleira = t + ale(40, 70); }
    if (faltam > 0 && faltam <= 2 && t > proxPulso) {   // tensão: pulso grave como um coração
      for (const [dt, v] of [[0, .22], [.22, .14]]) { const s = ctx.createOscillator(), o = g(0, mus); s.type = 'sine'; s.frequency.setValueAtTime(70, t + dt); s.frequency.exponentialRampToValueAtTime(42, t + dt + .18); env(o, t + dt, .005, v, .25); s.connect(o); s.start(t + dt); s.stop(t + dt + .3); }
      proxPulso = t + (faltam === 1 ? 1.1 : 1.6);
    }
  }
  function aplicar() {
    if (!ctx) return; const t = ctx.currentTime, c = cfg;
    mar.gain.setTargetAtTime(c.mar || 0, t, .8); chuva.gain.setTargetAtTime(c.chuva || 0, t, .8);
    drone.gain.setTargetAtTime(c.drone ? .03 : 0, t, 1.2); if (c.drone) drone.osc.forEach(o => o.frequency.setValueAtTime(hz(c.drone), t));
    salaG.gain.setTargetAtTime(c.sala, t, .5);
    proxAcorde = t + .3; proxFrase = t + 1.5; batida = 0; compasso = 0; ia = 0; c._tic = 0;
  }

  /* ---------- efeitos ---------- */
  const vozEfeito = () => cfg.voz === 'trompete' ? 'piano' : cfg.voz === 'pizz' ? 'marimba' : cfg.voz;
  function achar(combo = 0) {
    if (!ctx || !ligado) return; const t = ctx.currentTime; ultimaAcao = t;
    bater(t, 1800, .25, .18, .8); bater(t + .05, 4200, .12, .12, 1.2);
    const c = cfg, b = c.base + 12; [0, 2, 4, 7].forEach((k, i) => tocar(vozEfeito(), b + c.escala[Math.min(k, c.escala.length - 1)] + Math.min(combo, 4) * 2, t + .04 + i * .07, .13, 2.2, fx));
    const s = ctx.createOscillator(); s.type = 'triangle'; s.frequency.setValueAtTime(1400, t); s.frequency.exponentialRampToValueAtTime(2600, t + .35);
    const o = g(0, fx); env(o, t, .01, .04, .5); s.connect(o); o.connect(sala); s.start(t); s.stop(t + .6);
  }
  function errar() { if (!ctx || !ligado) return; const t = ctx.currentTime; bater(t, 380, .35, .09, 3); bater(t + .01, 900, .1, .05, 4); }
  function embacar() {
    if (!ctx || !ligado) return; const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = ruido; const b = filtro('bandpass', 600, 2); b.frequency.setValueAtTime(600, t); b.frequency.exponentialRampToValueAtTime(3000, t + .8);
    const o = g(0, fx); env(o, t, .2, .4, 1); s.connect(b).connect(o); s.start(t); s.stop(t + 1.3);
    tocar('piano', 45, t, .12, 2, fx); tocar('piano', 46, t + .02, .1, 2, fx);
  }
  function abrir(tipo, abrindo) {
    if (!ctx || !ligado) return; const t = ctx.currentTime; ultimaAcao = t;
    if (tipo === 'gaveta') { const s = ctx.createBufferSource(); s.buffer = ruido; const b = filtro('bandpass', 700, 1.5), o = g(0, fx); env(o, t, .05, .35, .35); s.connect(b).connect(o); s.start(t, Math.random()); s.stop(t + .5); bater(t + .38, 260, .4, .08, 4); }
    else if (tipo === 'porta' || tipo === 'tampa') { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.setValueAtTime(abrindo ? 520 : 380, t); s.frequency.linearRampToValueAtTime(abrindo ? 380 : 520, t + .4); const b = filtro('bandpass', 1200, 9), o = g(0, fx); env(o, t, .05, .05, .4); s.connect(b).connect(o); s.start(t); s.stop(t + .5); if (!abrindo || tipo === 'tampa') bater(t + .42, 200, .5, .1, 3); }
    else if (tipo === 'cortina') { const s = ctx.createBufferSource(); s.buffer = ruido; const b = filtro('highpass', 1500), o = g(0, fx); env(o, t, .15, .22, .45); s.connect(b).connect(o); s.start(t); s.stop(t + .7); for (let i = 0; i < 4; i++) bater(t + i * .08, 5200, .04, .02, 20); }
  }
  function dica() { if (!ctx || !ligado) return; const t = ctx.currentTime; ultimaAcao = t; [0, 7, 12, 19, 24].forEach((k, i) => tocar('celesta', 79 + k, t + i * .05, .05, 1.8, fx)); }
  function vitoria() {
    if (!ctx || !ligado) return; const t = ctx.currentTime, b = cfg.base - 12, v = vozEfeito();
    [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [0, 7, 12, 16, 19, 24]].forEach((a, k) => a.forEach((x, i) => tocar(v, b + 12 + x, t + k * .5 + i * .04, .08, 3, fx)));
    if (cfg.fundo === 'cordas' || nome === 'noir') [0, 7, 12, 16].forEach(x => tocar('cordas', b + x, t + 1.4, .03, 4, fx));
  }
  function clique() { if (!ctx || !ligado) return; bater(ctx.currentTime, 2400, .12, .03, 6); }
  function ambiente(n) { nome = CENAS[n] ? n : 'quarto'; cfg = CENAS[nome]; if (ctx) aplicar(); }
  function progresso(achados, total) { prog = total ? achados / total : 0; faltam = total - achados; if (ctx) ultimaAcao = ctx.currentTime; }
  function alternar() { ligado = !ligado; if (ctx) { if (ligado) ctx.resume(); else ctx.suspend(); } else if (ligado) iniciar(); return ligado; }
  return { iniciar, ambiente, progresso, achar, errar, embacar, abrir, dica, vitoria, clique, alternar, get ligado() { return ligado; }, set ligado(v) { ligado = v; }, get estado() { return { nome, prog, faltam, rodando: !!ctx && ctx.state }; } };
})();

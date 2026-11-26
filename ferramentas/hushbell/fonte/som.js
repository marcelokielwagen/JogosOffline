/* Som: música e efeitos criados na hora (Web Audio, nenhum arquivo).

   Instrumentos: harpa (corda calculada por Karplus-Strong), kalimba, sino de vento, sino grande
   e um sintetizador analógico suave para os acordes longos. Tudo em escala de cinco notas,
   por isso qualquer toque combina com a música.

   pad ─► passa-baixa que respira ─┐
   harpa, sinos e brisa de fundo ──┴─► MÚSICA ──┐
   passos, peças e toques ───────────► EFEITOS ─┴─► MESTRE ─► compressor ─► saída
   os dois também mandam um pouco para o ECO (vai e volta) e para a SALA (reverberação)        */
const Som = (() => {
  // alto-falante de celular quase não toca graves: ali o som precisa ser mais agudo e mais forte
  const PEQUENO = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 600);
  const MAX_VOZES = PEQUENO ? 40 : 64, ACORDE = 16, ENTRA = 5.5, SAI = 9;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12), ale = (a, b) => a + Math.random() * (b - a);

  // cada hora do dia tem seus acordes (notas MIDI) e a nota de partida da escala de cinco notas
  const HORAS = {
    alvorada:   { acordes: [[53, 60, 64, 67, 69], [50, 57, 60, 65, 69], [46, 53, 57, 62, 69], [48, 55, 60, 62, 67]], base: 65, escala: [0, 2, 4, 7, 9], abre: 1.1, frase: [8, 15], vento: .8 },
    entardecer: { acordes: [[50, 57, 61, 64, 66], [47, 54, 57, 62, 66], [43, 50, 57, 59, 66], [45, 52, 57, 59, 64], [52, 59, 62, 66, 69], [43, 54, 57, 62, 64]], base: 62, escala: [0, 2, 4, 7, 9], abre: 1, frase: [7, 13], vento: 1 },
    crepusculo: { acordes: [[45, 52, 59, 60, 64], [41, 48, 57, 60, 64], [48, 55, 59, 62, 64], [43, 50, 57, 59, 62]], base: 60, escala: [0, 2, 4, 7, 9], abre: .85, frase: [9, 16], vento: 1.1 },
    luar:       { acordes: [[43, 50, 58, 60, 65], [46, 53, 57, 60, 65], [51, 55, 58, 62, 65], [41, 48, 55, 60, 62]], base: 58, escala: [0, 2, 4, 7, 9], abre: .7, frase: [11, 19], vento: 1.3 }
  };
  let ctx = null, G = null, B = null, hora = HORAS.entardecer, volume = 1, escondido = false;
  let passoAcorde = 0, acorde = hora.acordes[0], proxAcorde = 0, proxFrase = 0, proxVento = 0, vozes = 0, relogio = 0, vigia = null, refeitos = 0, motivo = null, pads = [];

  /* ---------- ligar ---------- */
  // Chamado a cada gesto. No celular o gesto só vale quando o dedo SOLTA a tela (touchend/click).
  function iniciar() {
    if (volume <= 0 && !ctx) return;
    if (ctx && !travado()) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); montar(); ajustar(volume, true);
    passoAcorde = 0; vozes = 0; pads = []; const t = ctx.currentTime; proxAcorde = t + .05; proxFrase = t + 3.2; proxVento = t + 8;
    clearInterval(relogio); relogio = setInterval(agendar, 300); agendar();
    if (ctx.state !== 'running') retomar();
  }
  function retomar() { const p = ctx.resume(); if (p) p.catch(() => {}); }
  // Depois de ligação ou de outro app, o áudio às vezes diz que toca mas está parado: aí é refeito.
  function travado() {
    if (document.hidden || volume <= 0) return false;
    const toca = ctx.state === 'running', agora = performance.now();
    if (!toca && ctx.state !== 'closed') retomar();
    if (!vigia || vigia.toca !== toca || vigia.t !== ctx.currentTime) { vigia = { toca, t: ctx.currentTime, em: agora }; return false; }
    if (agora - vigia.em < 2500 || refeitos >= 3) return false;
    refeitos++; vigia = null; const velho = ctx; ctx = G = null; if (velho.state !== 'closed') velho.close().catch(() => {});
    return true;
  }
  const ganho = (v, d) => { const g = ctx.createGain(); g.gain.value = v; if (d) g.connect(d); return g; };
  const filtro = (tipo, f, q = .7, db = 0) => { const b = ctx.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.gain.value = db; return b; };
  const lado = p => { if (!ctx.createStereoPanner) return ctx.createGain(); const n = ctx.createStereoPanner(); n.pan.value = Math.max(-.85, Math.min(.85, p)); return n; };
  const lfo = (f, q, alvo) => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(ganho(q, alvo)); o.start(); };
  const teto = (lim, raz, at, sol) => { const c = ctx.createDynamicsCompressor(); c.threshold.value = lim; c.knee.value = 8; c.ratio.value = raz; c.attack.value = at; c.release.value = sol; return c; };

  function montar() {
    G = {}; G.final = ganho(PEQUENO ? .72 : .85, ctx.destination);
    const lim = teto(-9, 16, .002, .22), comp = teto(-18, 3, .012, .35); lim.connect(G.final);
    if (PEQUENO) comp.connect(filtro('highpass', 120)).connect(filtro('highshelf', 500, .7, 5)).connect(ganho(2.1)).connect(lim); else comp.connect(lim);
    G.mestre = ganho(0, comp); G.musica = ganho(PEQUENO ? .24 : .34, G.mestre); G.efeitos = ganho(1, G.mestre);
    // eco: dois atrasos que trocam de lado, cada volta mais abafada
    G.eco = ganho(1); const a = ctx.createDelay(2), b = ctx.createDelay(2), ab = filtro('lowpass', 2100, .3);
    a.delayTime.value = .52; b.delayTime.value = .78; G.eco.connect(a); a.connect(b); b.connect(ab).connect(ganho(.46)).connect(a);
    const pa = lado(-.6), pb = lado(.6); a.connect(pa).connect(ganho(.5, G.mestre)); b.connect(pb).connect(ganho(.42, G.mestre));
    lfo(.11, .0016, a.delayTime); lfo(.083, .002, b.delayTime);
    // sala grande de pedra
    const n = ctx.sampleRate * 4.2 | 0, imp = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); let s = 0; for (let i = 0; i < n; i++) { const k = i / n; s += ((Math.random() * 2 - 1) - s) * (.42 - .3 * k); d[i] = s * Math.pow(1 - k, 2.6) * Math.min(1, i / 700); } }
    G.sala = ctx.createConvolver(); G.sala.buffer = imp; G.sala.connect(ganho(.42, G.mestre));
    G.musica.connect(ganho(.28, G.eco)); G.musica.connect(ganho(.55, G.sala)); G.efeitos.connect(ganho(.22, G.eco)); G.efeitos.connect(ganho(.42, G.sala));
    // pad
    G.corte = filtro('lowpass', PEQUENO ? 1400 : 760, .5); G.respira = ganho(.82, G.musica); G.pad = ganho(1); G.pad.connect(G.corte).connect(G.respira);
    lfo(.057, PEQUENO ? 420 : 280, G.corte.frequency); lfo(.039, 120, G.corte.frequency); lfo(.049, .15, G.respira.gain);
    // brisa: ruído que se emenda sem estalo
    const m = ctx.sampleRate * 6 | 0, x = ctx.sampleRate * .4 | 0, buf = ctx.createBuffer(1, m, ctx.sampleRate), d = buf.getChannelData(0), br = new Float32Array(m + x);
    for (let i = 0, u = 0; i < m + x; i++) { u = (u + .03 * (Math.random() * 2 - 1)) / 1.03; br[i] = u * 3; }
    for (let i = 0; i < m; i++) d[i] = i < x ? br[i] * Math.sqrt(i / x) + br[m + i] * Math.sqrt(1 - i / x) : br[i];
    G.ruido = buf; const s = ctx.createBufferSource(), bf = filtro('bandpass', 560, .5); G.brisa = ganho(.034, G.musica); s.buffer = buf; s.loop = true; s.connect(bf).connect(G.brisa); s.start();
    lfo(.067, 230, bf.frequency); lfo(.043, .02, G.brisa.gain);
    // água ao longe: o mesmo ruído, mais agudo e bem baixinho
    const s2 = ctx.createBufferSource(), ag = filtro('bandpass', 1500, .8); G.agua = ganho(.02, G.musica); s2.buffer = buf; s2.loop = true; s2.playbackRate.value = 1.7; s2.connect(ag).connect(G.agua); s2.start();
    lfo(.21, 260, ag.frequency);
    B = B && B.sr === ctx.sampleRate ? B : instrumentos();
  }

  /* ---------- instrumentos (calculados uma vez) ---------- */
  function instrumentos() {
    const sr = ctx.sampleRate, novo = (seg, f) => { const n = sr * seg | 0, b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0); f(d, n); let p = 0; for (const v of d) p = Math.max(p, Math.abs(v)); for (let i = 0; i < n; i++) d[i] *= .9 / p * Math.min(1, (n - i) / (sr * .25)); return b; };
    // harpa: um sopro de ruído preso numa volta que amacia a cada passagem
    const harpa = [50, 57, 64, 71, 78, 85].map(midi => {
      const N = Math.round(sr / hz(midi) - .5), f = sr / (N + .5), L = new Float32Array(N); let s = 0, media = 0;
      for (let i = 0; i < N; i++) { s += ((Math.random() * 2 - 1) - s) * .34; L[i] = s; media += s / N; }
      for (let i = 0; i < N; i++) L[i] -= media;
      const perda = Math.pow(.001, 1 / (hz(midi) * (3.6 - (midi - 50) * .045)));
      return { f, b: novo(3.4, (d, n) => { let k = 0; for (let i = 0; i < n; i++) { const j = (k + 1) % N, v = L[k]; d[i] = v * Math.min(1, i / (sr * .002)); L[k] = (L[k] + L[j]) * .5 * perda; k = j; } }) };
    });
    const soma = (seg, f, parciais, ataque) => ({ f, b: novo(seg, (d, n) => { for (const [r, v, dur] of parciais) { const w = 2 * Math.PI * f * r / sr, fase = Math.random() * 6.28, k = Math.exp(-6.9 / (dur * sr)); let e = v; for (let i = 0; i < n; i++) { d[i] += Math.sin(w * i + fase) * e * Math.min(1, i / (sr * ataque)); e *= k; } } }) });
    return { sr, harpa,
      kalimba: [soma(2, 440, [[1, 1, 1.9], [2, .22, .9], [3.01, .08, .5], [5.43, .13, .11], [8.2, .05, .05]], .003)],
      vento: [soma(3, 1320, [[1, 1, 2.8], [2.76, .34, 1.4], [5.4, .12, .6], [1.004, .5, 2.4]], .003)],
      sino: [soma(6, 330, [[.5, .5, 5.8], [1, 1, 5], [1.19, .34, 3.6], [1.5, .24, 3], [2, .42, 2.6], [2.74, .2, 1.5], [3.01, .12, 1.1], [4.2, .07, .6]], .006)]
    };
  }
  function tocar(nome, f, t, v, { pan = 0, destino = G.efeitos, corte = 0 } = {}) {
    if (vozes >= MAX_VOZES) return;
    const lista = B[nome]; let a = lista[0]; for (const x of lista) if (Math.abs(Math.log(x.f / f)) < Math.abs(Math.log(a.f / f))) a = x;
    const s = ctx.createBufferSource(), g = ganho(v), p = lado(pan); s.buffer = a.b; s.playbackRate.value = f / a.f;
    if (corte) s.connect(filtro('lowpass', corte, .4)).connect(g); else s.connect(g);
    g.connect(p).connect(destino); vozes++; s.onended = () => { vozes--; p.disconnect(); }; s.start(t);
  }
  // sintetizador analógico: duas ondas levemente desafinadas, filtro que abre e fecha
  function analogico(f, t, dur, v, pan = 0) {
    if (vozes >= MAX_VOZES) return;
    const g = ganho(0), b = filtro('lowpass', f * 1.5, 1.1), p = lado(pan); b.frequency.setValueAtTime(f * 1.3, t); b.frequency.linearRampToValueAtTime(f * 4.5, t + dur * .35); b.frequency.linearRampToValueAtTime(f * 1.3, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .3); g.gain.linearRampToValueAtTime(0, t + dur);
    let o; for (const d of [-6, 7]) { o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = d; o.connect(b); o.start(t); o.stop(t + dur + .05); }
    b.connect(g).connect(p).connect(G.efeitos); vozes++; o.onended = () => { vozes--; p.disconnect(); };
  }
  function sopro(t, dur, v, f0, f1, pan = 0) {
    if (vozes >= MAX_VOZES) return;
    const s = ctx.createBufferSource(), b = filtro('bandpass', f0, 1), g = ganho(0), p = lado(pan); s.buffer = G.ruido; s.playbackRate.value = 2.4;
    b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .35); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(b).connect(g).connect(p).connect(G.efeitos); vozes++; s.onended = () => { vozes--; p.disconnect(); }; s.start(t, Math.random() * 3, dur * 2.4 + .2); s.stop(t + dur + .03);
  }

  /* ---------- música que se compõe sozinha ---------- */
  // grau 0, 1, 2... sobe a escala de cinco notas a partir da nota da hora do dia
  const grau = g => { const e = hora.escala, i = Math.round(g); return hora.base + e[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5); };
  // de uma nota qualquer, a nota da escala mais próxima que também soa bem com o acorde do momento
  function doAcorde(i, piso = 62) { const r = []; for (let m = piso; m < piso + 26; m++) if (acorde.some(n => (m - n) % 12 === 0) && hora.escala.some(e => (m - hora.base - e) % 12 === 0)) r.push(m); return r.length ? r[((i % r.length) + r.length) % r.length] : grau(i); }

  function agendar() {
    if (!ctx || ctx.state !== 'running' || volume <= 0) return;
    const t = ctx.currentTime;
    if (t >= proxAcorde - .5) novoAcorde(Math.max(t + .05, proxAcorde));
    if (t >= proxFrase - .5) { frase(Math.max(t + .05, proxFrase)); proxFrase = Math.max(t, proxFrase) + ale(...hora.frase); }
    if (t >= proxVento - .5) { ventania(Math.max(t + .05, proxVento)); proxVento = Math.max(t, proxVento) + ale(14, 30) / hora.vento; }
  }
  function novoAcorde(t) {
    acorde = hora.acordes[passoAcorde++ % hora.acordes.length]; proxAcorde = t + ACORDE; pads = pads.filter(x => x.fim > t);
    acorde.forEach((n, i) => vozPad(hz(n), t, i));
    if (PEQUENO) { vozPad(hz(acorde[2] + 12), t, 4); vozPad(hz(acorde[3] + 12), t, 5); }
    vozAr(hz(acorde[4] + 12), t);
  }
  function vozPad(f, t, i) {
    const g = ganho(0), p = lado((i % 2 ? 1 : -1) * .17 * i), v = [.105, .1, .082, .072, .058, .046][i], fim = t + ACORDE + SAI;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + ENTRA + i * .6); g.gain.setValueAtTime(v, t + ACORDE - 1); g.gain.linearRampToValueAtTime(0, fim); g.connect(p).connect(G.pad);
    let o; for (const [tipo, det, q] of [['triangle', -6, 1], ['triangle', 6, .85], ['sawtooth', 1, .15]]) { o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; o.detune.value = det + ale(-2, 2); o.connect(ganho(q, g)); o.start(t); o.stop(fim + .05); }
    pads.push({ g, fim }); o.onended = () => { g.disconnect(); p.disconnect(); };
  }
  // fio de voz bem agudo, quase ar, que aparece no meio do acorde
  function vozAr(f, t) {
    const o = ctx.createOscillator(), g = ganho(0), p = lado(ale(-.5, .5)), vib = ctx.createOscillator(), vg = ganho(f * .003); o.frequency.value = f; vib.frequency.value = 4.2; vib.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(0, t + 4); g.gain.linearRampToValueAtTime(.02, t + 9); g.gain.linearRampToValueAtTime(0, t + ACORDE + 2); o.connect(g).connect(p).connect(G.musica);
    o.start(t); vib.start(t); o.stop(t + ACORDE + 2.1); vib.stop(t + ACORDE + 2.1); pads.push({ g, fim: t + ACORDE + 2 }); o.onended = () => p.disconnect();
  }
  // frase de harpa: um motivo curto que volta de vez em quando, um pouco mudado
  function frase(t) {
    if (!motivo || Math.random() < .35) { let i = 1 + Math.random() * 4 | 0; motivo = Array.from({ length: 4 + Math.random() * 4 | 0 }, () => { const r = i; i = Math.max(0, Math.min(9, i + [-2, -1, 1, 1, 2, 3][Math.random() * 6 | 0])); return r; }); }
    const p0 = ale(-.4, .4); let q = t;
    motivo.forEach((i, k) => { tocar('harpa', hz(doAcorde(i, PEQUENO ? 62 : 57)), q, .42 * (1 - k * .06) * ale(.8, 1), { pan: p0 + (k % 2 ? .18 : -.18), destino: G.musica, corte: 3600 }); q += [.36, .36, .54, .72][Math.random() * 4 | 0] * ale(.96, 1.06); });
    if (Math.random() < .4) tocar('kalimba', hz(doAcorde(motivo[0] + 3, 69)), q + .5, .22, { pan: -p0, destino: G.musica });
  }
  // lufada: sininhos de vento bem longe
  function ventania(t) {
    const p0 = ale(-.6, .6), n = 3 + Math.random() * 4 | 0; let q = t;
    for (let k = 0; k < n; k++) { tocar('vento', hz(doAcorde(Math.random() * 12 | 0, 79)), q, ale(.05, .11), { pan: p0 + ale(-.2, .2), destino: G.musica }); q += ale(.09, .7); }
  }

  /* ---------- efeitos ---------- */
  const pronto = () => !!ctx && ctx.state === 'running' && volume > 0, ult = {};
  const cedo = (n, s) => { const t = ctx.currentTime; if (t - (ult[n] ?? -9) < s) return true; ult[n] = t; return false; };
  const E = {
    // tocar numa pedra: quanto mais alta a pedra, mais aguda a nota
    pedra(g, pan) { const t = ctx.currentTime; tocar('harpa', hz(grau(g)), t, .4, { pan, corte: 4200 }); tocar('kalimba', hz(grau(g) + 12), t + .02, .05, { pan }); },
    agua(pan) { const t = ctx.currentTime, i = Math.random() * 5 | 0; for (let k = 0; k < 3; k++) tocar('kalimba', hz(doAcorde(i + k, 74)), t + k * .09, .16 - k * .04, { pan: pan + k * .12 }); },
    folha(pan) { sopro(ctx.currentTime, .7, .5, 900, 2200, pan); tocar('vento', hz(doAcorde(Math.random() * 8 | 0, 84)), ctx.currentTime + .1, .06, { pan }); },
    personagem() { const t = ctx.currentTime; tocar('kalimba', hz(grau(5)), t, .34); tocar('kalimba', hz(grau(7)), t + .11, .24); },
    sinoGrande() { if (cedo('sg', .4)) return; const t = ctx.currentTime; tocar('sino', hz(grau(0) - (PEQUENO ? 0 : 12)), t, .5); tocar('sino', hz(grau(3)), t + .04, .1); sopro(t, 2.4, .25, 300, 700); },
    sininho(i, pan) { if (cedo('si' + i, .15)) return; tocar('vento', hz(doAcorde(i * 2, 76)), ctx.currentTime, .16, { pan }); },
    // ---- para as próximas fases ----
    passo(g, pan = 0) { tocar('kalimba', hz(grau(g)), ctx.currentTime, .22, { pan }); },
    girar(g, pan = 0) { const t = ctx.currentTime; analogico(hz(grau(g) - 12), t, .7, .1, pan); tocar('harpa', hz(grau(g)), t, .3, { pan }); },
    encaixe() { const t = ctx.currentTime; [0, 2, 4, 7].forEach((i, k) => tocar('harpa', hz(doAcorde(i, 62)), t + k * .07, .3 - k * .03, { pan: -.3 + k * .2 })); tocar('vento', hz(doAcorde(6, 80)), t + .3, .07); },
    // câmera voltando ao ponto onde a ilusão se fecha
    ilusao() { if (cedo('il', 1)) return; const t = ctx.currentTime; analogico(hz(doAcorde(0, 57)), t, 1.6, .07, -.2); analogico(hz(doAcorde(2, 57)), t + .1, 1.6, .06, .2); tocar('vento', hz(doAcorde(3, 81)), t + .25, .06); },
    botao() { tocar('kalimba', hz(grau(4)), ctx.currentTime, .14); },
    viagem() { const t = ctx.currentTime; sopro(t, 2.8, .26, 260, 1300); [9, 7, 5, 4, 2, 0].forEach((i, k) => tocar('harpa', hz(doAcorde(i, 57)), t + .25 + k * .17, .24 - k * .025, { pan: .45 - k * .18, corte: 3800 })); },
    nao() { tocar('kalimba', hz(grau(-2)), ctx.currentTime, .16, { corte: 1400 }); },
    chegada() { const t = ctx.currentTime; for (let k = 0; k < 8; k++) tocar('harpa', hz(doAcorde(k, 57)), t + k * .12, .32 - k * .02, { pan: (k % 2 ? 1 : -1) * .08 * k }); tocar('sino', hz(grau(0)), t + .95, .36); }
  };
  for (const k in E) { const f = E[k]; E[k] = (...a) => { if (pronto()) f(...a); }; }

  /* ---------- ajustes ---------- */
  function ajustar(v, ja) { volume = v; if (!ctx) return; const t = ctx.currentTime; G.mestre.gain.cancelScheduledValues(t); G.mestre.gain.setTargetAtTime(v * .9, t, ja ? .8 : .25); }
  function mudarHora(nome) {
    if (HORAS[nome] === hora) return; hora = HORAS[nome]; passoAcorde = 0; motivo = null; if (!ctx) return;
    const t = ctx.currentTime; for (const p of pads) if (p.fim > t) { p.g.gain.cancelScheduledValues(t); p.g.gain.setTargetAtTime(0, t, 1.3); }
    proxAcorde = t + .6; proxFrase = t + 4; G.corte.frequency.setTargetAtTime((PEQUENO ? 1400 : 760) * hora.abre, t, 2); G.brisa.gain.setTargetAtTime(.034 * hora.vento, t, 2);
  }
  for (const e of ['touchend', 'click', 'keydown']) addEventListener(e, iniciar, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) { escondido = true; ctx.suspend().catch(() => {}); } else if (escondido) { escondido = false; vigia = null; retomar(); } });
  return { ...E, ajustar, mudarHora, get estado() { return ctx ? ctx.state : 'parado'; }, get contexto() { return ctx; }, get saida() { return G && G.final; }, get vozes() { return vozes; }, pequeno: PEQUENO };
})();

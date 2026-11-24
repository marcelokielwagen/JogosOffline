// Mesa de som: toca os sons fabricados em sintese.js. Efeitos e música têm caminhos separados, e a música abaixa nas pancadas.
const VOL_MUSICA = .3, VOZES = 30;
export function criarSom(ligado) {
  let ctx = null, saida, efeitos, musicaG, mestre, morto = false, worker = null, vozes = 0, querMusica = null, tocando = null, ultGemido = 0, vez = 0;
  const bruto = {}, buf = {}, laco = {}, musicas = {}, ult = {};
  // fábrica em segundo plano, começa já (não precisa de toque na tela)
  const chegou = m => { if (morto) return; if (m.som) { bruto[m.som] = [[m.x], 44100]; preparar(m.som); } else if (m.musica) { bruto['m:' + m.musica] = [[m.E, m.D], 32000]; preparar('m:' + m.musica); if (querMusica === m.musica) tocarMusica(); } else if (m.fim) { worker?.terminate(); worker = null; } };
  try { worker = new Worker(new URL('./sintese.js', import.meta.url), { type: 'module' }); worker.onmessage = e => chegou(e.data); worker.onerror = () => { worker?.terminate(); worker = null; semWorker(); }; worker.postMessage(1); } catch (_) { semWorker(); }
  async function semWorker() { // aparelho sem Worker de módulo: fabrica aos poucos
    const s = await import('./sintese.js'), pausa = () => new Promise(ok => setTimeout(ok, 30));
    for (const n in s.SONS) { if (morto) return; if (!bruto[n]) { chegou({ som: n, x: s.fazerSom(n) }); await pausa(); } }
    for (const n in s.MUSICAS) { if (morto) return; if (!bruto['m:' + n]) { chegou({ musica: n, ...s.MUSICAS[n]() }); await pausa(); } }
  }
  function preparar(n) {
    if (!ctx || buf[n] || !bruto[n]) return; const [canais, sr] = bruto[n], b = ctx.createBuffer(canais.length, canais[0].length, sr); canais.forEach((c, i) => b.copyToChannel(c, i)); buf[n] = b; delete bruto[n];
    if (n === 'metralhadora' || n === 'chamas' || n === 'passos' || n === 'vento') { const g = ctx.createGain(), s = ctx.createBufferSource(); g.gain.value = 0; s.buffer = b; s.loop = true; s.connect(g); g.connect(n === 'vento' || n === 'passos' ? musicaLivre() : efeitos); s.start(); laco[n] = { g, s }; }
  }
  let livre = null; const musicaLivre = () => livre || (livre = ctx.createGain(), livre.connect(mestre), livre);
  function abrir() {
    if (ctx || morto) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' }); mestre = ctx.createGain(); mestre.gain.value = ligado() ? 1 : 0; const fim = ctx.createWaveShaper(), cv = new Float32Array(2049); for (let i = 0; i < cv.length; i++) { const x = (i / 1024 - 1) * 1.5, a = Math.abs(x); cv[i] = Math.sign(x) * (a < .75 ? a : .75 + .22 * Math.tanh((a - .75) / .22)); } fim.curve = cv; const entra = ctx.createGain(); entra.gain.value = 1 / 1.5; saida = fim; mestre.connect(entra); entra.connect(fim); fim.connect(ctx.destination);
    const teto = ctx.createDynamicsCompressor(); teto.threshold.value = -5; teto.knee.value = 4; teto.ratio.value = 14; teto.attack.value = .002; teto.release.value = .12; teto.connect(mestre);
    efeitos = ctx.createGain(); efeitos.gain.value = .85; efeitos.connect(teto); musicaG = ctx.createGain(); musicaG.gain.value = VOL_MUSICA; musicaG.connect(mestre);
    for (const n in bruto) preparar(n);
  }
  const pode = () => ctx && ctx.state === 'running' && ligado();
  function tocar(n, { v = 1, pan = 0, vel = 1, em = 0 } = {}) {
    if (!pode() || !buf[n] || vozes >= VOZES) return; const t = ctx.currentTime + em, s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf[n]; s.playbackRate.value = vel; g.gain.value = v; s.connect(g); let o = g;
    if (pan && ctx.createStereoPanner) { o = ctx.createStereoPanner(); o.pan.value = Math.max(-.8, Math.min(.8, pan)); g.connect(o); } o.connect(efeitos); vozes++; s.onended = () => { vozes--; s.disconnect(); g.disconnect(); if (o !== g) o.disconnect(); }; s.start(t);
  }
  const varia = (a = .06) => 1 + (Math.random() - .5) * 2 * a, passou = (n, dt) => { const t = ctx?.currentTime ?? 0; if (t - (ult[n] ?? -9) < dt) return false; ult[n] = t; return true; }, um = (n, q) => n + (vez = vez + 1) % q;
  // a música abaixa um instante para o efeito aparecer
  function abaixar(k, dur) { if (!ctx) return; const p = musicaG.gain, t = ctx.currentTime; p.cancelScheduledValues(t); p.setTargetAtTime(VOL_MUSICA * k, t, .025); p.setTargetAtTime(VOL_MUSICA, t + dur, .35); }
  function tocarMusica() {
    if (!ctx) return; const b = querMusica && buf['m:' + querMusica]; if (tocando && tocando.nome === querMusica) return;
    if (tocando) { const { s, g } = tocando, t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, querMusica ? .2 : .45); s.stop(t + 2); s.onended = () => { s.disconnect(); g.disconnect(); }; tocando = null; }
    if (!b) return; const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.loop = true; g.gain.value = 0; g.gain.setTargetAtTime(1, ctx.currentTime, .15); s.connect(g); g.connect(musicaG); s.start(ctx.currentTime + .05); tocando = { nome: querMusica, s, g };
  }
  const corrente = (n, v, dur) => { const l = laco[n]; if (!l || !pode()) return; const t = ctx.currentTime, p = l.g.gain; p.cancelScheduledValues(t); p.setTargetAtTime(v, t, .02); p.setTargetAtTime(0, t + dur, .07); };
  const RUGE = { cancela: 'rugidoCancela', operario: 'rugidoOperario', sirene: 'rugidoSirene', carcaca: 'rugidoCarcaca' };
  return {
    acordar() { abrir(); if (ctx?.state === 'suspended') ctx.resume().catch(() => {}); },
    tiro(arma, n, pan) {
      if (!pode()) return; const v = Math.min(1, .5 + Math.sqrt(n) * .055);
      if (arma === 0) { if (passou('p', .05)) tocar(um('pistola', 3), { v: v * .85, pan: pan * .5, vel: varia() }); }
      else if (arma === 1) { if (passou('s', .058)) tocar(um('sub', 3), { v: v * .8, pan: pan * .5, vel: varia() }); }
      else if (arma === 2) { if (passou('f', .062)) tocar(um('fuzil', 3), { v: v * .8, pan: pan * .5, vel: varia() }); }
      else if (arma === 3) corrente('metralhadora', .62, .13);
      else if (arma === 4) { if (passou('b', .07)) tocar('bazuca', { v: .75, pan: pan * .5, vel: varia(.04) }); }
      else corrente('chamas', .8, .2);
    },
    evento(nome, d) {
      if (!pode()) return;
      switch (nome) {
        case 'acerto': if (passou('ac', .045)) tocar(um('acerto', 3), { v: .55, pan: d.x / 8, vel: varia(.12) }); break;
        case 'acertoChefe': if (passou('ac', .05)) tocar(um('acerto', 3), { v: .7, pan: d.x / 8, vel: varia(.1) * .8 }); break;
        case 'faisca': case 'faiscaPortao': if (passou('ac', .05)) tocar('acerto2', { v: .6, pan: d.x / 8, vel: 1.3 * varia(.1) }); break;
        case 'morte': if (passou('mo', .065)) tocar(um('morte', 4), { v: .62, pan: d.x / 8, vel: varia(.1) * (d.tipo === 'blindado' ? .7 : d.tipo === 'corredor' ? 1.2 : 1) }); break;
        case 'soldado': if (passou('so', .09)) tocar(um('queda', 2), { v: .8, pan: d.x / 8, vel: varia(.08) }); break;
        case 'explosao': if (passou('ex', .06)) { tocar(um('explosao', 3), { v: .85, pan: d.x / 8, vel: varia(.07) }); abaixar(.55, .3); } break;
        case 'barril': tocar('barril', { v: 1, pan: d.x / 8, vel: varia(.04) }); abaixar(.4, .6); break;
        case 'portao': if (d.l.tipo === 'especial') tocar('armaNova', { v: .95 }); else if (d.l.tipo !== 'arma') tocar(d.bom ? 'portaoBom' : 'portaoRuim', { v: .95 }); break;
        case 'arma': tocar('armaNova', { v: .95 }); break;
        case 'cadencia': tocar('armaNova', { v: .7, vel: 1.15 }); break;
        case 'virou': tocar('virou', { v: .9 }); break;
        case 'reforco': tocar('reforco', { v: 1 }); break;
        case 'chefeEntra': tocar('onda', { v: .7, vel: .6 }); break;
        case 'chefePousa': tocar('pancada', { v: 1, vel: .85 }); tocar('explosao2', { v: .5, vel: .7 }); tocar(RUGE[d.id], { v: 1, em: .3 }); abaixar(.25, 1.8); break;
        case 'fase': tocar(RUGE[d.id], { v: 1, vel: 1.08 }); abaixar(.3, 1.4); break;
        case 'passoChefe': tocar('pisada', { v: .9, pan: d.x / 10, vel: varia(.06) }); break;
        case 'marca': if (passou('ma', .25)) tocar('aviso', { v: .8 }); break;
        case 'golpe': { const s = d.m.som; if (passou('go' + s, .08)) { if (s === 'pancada' || s === 'varrida') { tocar(s, { v: 1, vel: varia(.04) }); abaixar(.35, .6); } else tocar(s, { v: s === 'grito' ? 1 : .9, vel: varia(.05) }); if (s === 'grito') abaixar(.25, 1.1); } break; }
        case 'placaCaiu': tocar('placa', { v: .95 }); abaixar(.5, .5); break;
        case 'alcancou': tocar('pancada', { v: 1 }); tocar('explosao2', { v: .8, em: .05 }); break;
        case 'chefeMorre': tocar('morteChefe', { v: 1, vel: d.id === 'sirene' ? 1.6 : d.id === 'carcaca' ? .85 : 1 }); for (let i = 0; i < 9; i++) tocar('explosao' + i % 3, { v: .6, em: i * .26 + .02, vel: varia(.1), pan: Math.random() - .5 }); tocar('barril', { v: 1, em: 2.5, vel: .8 }); tocar('pancada', { v: 1, em: 2.5, vel: .75 }); break;
        case 'vitoria': tocar('vitoria', { v: 1 }); break;
        case 'derrota': tocar('derrota', { v: 1, em: .25 }); break;
      }
    },
    // a cada quadro: passos do pelotão, vento e gemidos conforme a cena
    atualizar(S, parado) {
      if (!ctx) return; const t = ctx.currentTime, alvo = ligado() ? 1 : 0; if (mestre.gain.value !== alvo) mestre.gain.setTargetAtTime(alvo, t, .03);
      if (t - (ult.amb ?? -1) < .12) return; ult.amb = t; const l = laco;
      l.passos?.g.gain.setTargetAtTime(!parado && S.estado === 'jogando' && S.ritmo > .4 ? Math.min(1, .35 + Math.sqrt(S.n) * .1) : 0, t, .15); l.vento?.g.gain.setTargetAtTime(parado ? .8 : .55, t, .4);
      if (!parado && S.estado === 'jogando' && t > ultGemido) { const c = S.d + S.frente, perto = []; for (const z of S.zumbis) if (!z.morto && z.d - c < 26) { perto.push(z); if (perto.length > 24) break; } if (perto.length) { const z = perto[Math.floor(Math.random() * perto.length)]; tocar(um('gemido', 4), { v: Math.min(.5, .2 + perto.length * .014) * (z.tipo === 'blindado' ? 1.3 : 1), pan: z.x / 6, vel: varia(.16) * (z.tipo === 'blindado' ? .72 : z.tipo === 'corredor' ? 1.3 : 1) }); ultGemido = t + (perto.length > 12 ? .28 : .6) + Math.random() * .5; } }
    },
    musica(nome) { querMusica = nome; tocarMusica(); },
    pausar(p) { if (ctx) (p ? ctx.suspend() : ctx.resume()).catch(() => {}); },
    // para testes: volume que está saindo agora
    medidor() { if (!ctx) return null; const a = this.an ??= (() => { const x = ctx.createAnalyser(); x.fftSize = 8192; saida.connect(x); return x; })(), d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let p = 0, e = 0; for (const v of d) { p = Math.max(p, Math.abs(v)); e += v * v; } return { pico: p, rms: Math.sqrt(e / d.length) }; },
    get estado() { return { prontos: Object.keys(buf).length, espera: Object.keys(bruto).length, musica: tocando?.nome || null, vozes, ctx: ctx?.state }; },
    dispose() { morto = true; worker?.terminate(); worker = null; ctx?.close().catch(() => {}); ctx = null; for (const n in buf) delete buf[n]; for (const n in bruto) delete bruto[n]; },
  };
}

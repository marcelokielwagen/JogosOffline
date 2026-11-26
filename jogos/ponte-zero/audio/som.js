// Mesa de som: toca os sons fabricados em sintese.js. Efeitos e música têm caminhos separados, e a música abaixa nas pancadas.
const VOL_MUSICA = .3, VOZES = 46;
export function criarSom(ligado) {
  let ctx = null, saida, efeitos, musicaG, mestre, morto = false, worker = null, vozes = 0, querMusica = null, tocando = null, ultGemido = 0, vez = 0;
  const bruto = {}, buf = {}, laco = {}, musicas = {}, ult = {};
  // fábrica em segundo plano, começa já (não precisa de toque na tela)
  const chegou = m => { if (morto) return; if (m.eco) { bruto.eco = [m.eco, 44100]; preparar('eco'); } else if (m.som) { bruto[m.som] = [[m.x].flat(), 44100]; preparar(m.som); } else if (m.musica) { bruto['m:' + m.musica] = [[m.E, m.D], 32000]; preparar('m:' + m.musica); if (querMusica === m.musica) tocarMusica(); } else if (m.fim) { worker?.terminate(); worker = null; } };
  try { worker = new Worker(new URL('./sintese.js', import.meta.url), { type: 'module' }); worker.onmessage = e => chegou(e.data); worker.onerror = () => { worker?.terminate(); worker = null; semWorker(); }; worker.postMessage(1); } catch (_) { semWorker(); }
  async function semWorker() { // aparelho sem Worker de módulo: fabrica aos poucos
    const s = await import('./sintese.js'), pausa = () => new Promise(ok => setTimeout(ok, 30));
    chegou({ eco: s.fazerEco() }); for (const n in s.SONS) { if (morto) return; if (!bruto[n]) { chegou({ som: n, x: s.fazerSom(n) }); await pausa(); } }
    for (const n in s.MUSICAS) { if (morto) return; if (!bruto['m:' + n]) { chegou({ musica: n, ...s.MUSICAS[n]() }); await pausa(); } }
  }
  function preparar(n) {
    if (!ctx || buf[n] || !bruto[n]) return; const [canais, sr] = bruto[n], b = ctx.createBuffer(canais.length, canais[0].length, sr); canais.forEach((c, i) => b.copyToChannel(c, i)); buf[n] = b; delete bruto[n];
    if (n === 'eco') { const k = 44100 / ctx.sampleRate, m = Math.floor(b.length / k), r = ctx.createBuffer(2, m, ctx.sampleRate); for (let c = 0; c < 2; c++) { const x = b.getChannelData(c), y = r.getChannelData(c); for (let i = 0; i < m; i++) { const p = i * k, j = p | 0; y[i] = x[j] + ((x[j + 1] || 0) - x[j]) * (p - j); } } try { eco.buffer = r; } catch (_) { /* sem eco */ } return; }
    if (LACOS.includes(n)) { const g = ctx.createGain(), s = ctx.createBufferSource(); g.gain.value = 0; s.buffer = b; s.loop = true; s.connect(g); g.connect(AMB.includes(n) ? musicaLivre() : fogo); s.start(); laco[n] = { g, s }; }
  }
  const LACOS = ['giratoria', 'chamas', 'passos', 'vento', 'camaPistola', 'camaSub', 'camaFuzil', 'ambFogo', 'ventania', 'desliza', 'rotor'], AMB = ['vento', 'passos', 'ambFogo', 'ventania', 'desliza', 'rotor']; let livre = null, fogo, eco, envia; const conta = [0, 0, 0], ritmo = [0, 0, 0], jato = {}; const musicaLivre = () => livre || (livre = ctx.createGain(), livre.connect(mestre), livre);
  function abrir() {
    if (ctx || morto) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' }); mestre = ctx.createGain(); mestre.gain.value = ligado() ? 1 : 0; const fim = ctx.createWaveShaper(), cv = new Float32Array(2049); for (let i = 0; i < cv.length; i++) { const x = (i / 1024 - 1) * 1.5, a = Math.abs(x); cv[i] = Math.sign(x) * (a < .75 ? a : .75 + .22 * Math.tanh((a - .75) / .22)); } fim.curve = cv; const entra = ctx.createGain(); entra.gain.value = 1 / 1.5; saida = fim; mestre.connect(entra); entra.connect(fim); fim.connect(ctx.destination);
    const teto = ctx.createDynamicsCompressor(); teto.threshold.value = -5; teto.knee.value = 4; teto.ratio.value = 14; teto.attack.value = .002; teto.release.value = .12; teto.connect(mestre);
    efeitos = ctx.createGain(); efeitos.gain.value = .85; efeitos.connect(teto);
    // tiros: caminho próprio, com um pouco de eco da ponte e da cidade
    fogo = ctx.createGain(); const cola = ctx.createDynamicsCompressor(); cola.threshold.value = -11; cola.ratio.value = 3.5; cola.attack.value = .004; cola.release.value = .09; fogo.connect(cola); cola.connect(efeitos); envia = ctx.createGain(); envia.gain.value = .5; eco = ctx.createConvolver(); const vEco = ctx.createGain(); vEco.gain.value = .55; fogo.connect(envia); envia.connect(eco); eco.connect(vEco); vEco.connect(efeitos); musicaG = ctx.createGain(); musicaG.gain.value = VOL_MUSICA; musicaG.connect(mestre);
    for (const n in bruto) preparar(n);
  }
  const pode = () => ctx && ctx.state === 'running' && ligado();
  function tocar(n, { v = 1, pan = 0, vel = 1, em = 0, cano = efeitos, molha = 0 } = {}) {
    if (!pode() || !buf[n] || vozes >= (cano === fogo ? 30 : VOZES)) return; const t = ctx.currentTime + em, s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf[n]; s.playbackRate.value = vel; g.gain.value = v; s.connect(g); let o = g;
    if (pan && ctx.createStereoPanner) { o = ctx.createStereoPanner(); o.pan.value = Math.max(-.8, Math.min(.8, pan)); g.connect(o); } o.connect(cano); if (molha) { const m = ctx.createGain(); m.gain.value = molha; o.connect(m); m.connect(envia); } vozes++; s.onended = () => { vozes--; s.disconnect(); g.disconnect(); if (o !== g) o.disconnect(); }; s.start(t);
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
  // arma contínua: som de ligar, laço e som de parar
  const liga = (n, v, dur, abre, fecha) => { const t = ctx.currentTime, j = jato[n]; if (!j || t > j.ate + .5) tocar(abre, { v: .9 }); jato[n] = { ate: t + dur, fecha }; corrente(n, v, dur); };
  const chegam = (q, em = .12) => { const k = q < 5 ? 1 : q < 13 ? 2 : 3; tocar('entra' + k, { v: .95, em, vel: varia(.04) }); if (q < 4) tocar(um('ordem', 4), { v: .5, em: em + .12, pan: Math.random() - .5, vel: varia(.07) }); else tocar(um('coro', 3), { v: .62, em: em + .14, vel: varia(.05) }); };
  const entrou = a => { tocar(['entraM', 'entraB', 'entraL'][a - 3], { v: 1, molha: .12 }); chegam(2, .3); };
  const RUGE = { afogada: 'rugidoAfogada', guindaste: 'rugidoGuindaste', fornalha: 'rugidoFornalha', mae: 'rugidoMae', nevasca: 'rugidoNevasca', pararaios: 'rugidoParaRaios', cancela: 'rugidoCancela', operario: 'rugidoOperario', sirene: 'rugidoSirene', carcaca: 'rugidoCarcaca' };
  return {
    acordar() { abrir(); if (ctx?.state === 'suspended') ctx.resume().catch(() => {}); },
    // tiros soltos na frente e, conforme o pelotão cresce, a cama da rajada por baixo
    tiro(arma, n, pan) {
      if (!pode()) return; const p = pan * .8 + (Math.random() - .5) * .25, v = .72 + Math.random() * .28;
      if (arma < 3) { conta[arma]++; const nome = ['pistola', 'sub', 'fuzil'][arma]; if (passou('t' + arma, [.062, .058, .066][arma])) { tocar(um(nome, 5), { v, pan: p, vel: varia(.045), em: Math.random() * .014, cano: fogo }); if (passou('cap', .19)) tocar(um('capsula', 4), { v: .3, pan: p, vel: varia(.1), em: .32 + Math.random() * .2 }); } }
      else if (arma === 3) liga('giratoria', .8, .14, 'giroLiga', 'giroPara');
      else if (arma === 4) { if (passou('b', .09)) { tocar('bazuca', { v: .9, pan: p, vel: varia(.05), cano: fogo }); if (passou('rec', 1.1)) tocar('recarrega', { v: .8, pan: p, em: .8, vel: varia(.06) }); } }
      else liga('chamas', .85, .2, 'chamaLiga', 'chamaPara');
    },
    evento(nome, d) {
      if (!pode()) return;
      switch (nome) {
        case 'acerto': if (passou('ac', .045)) tocar(um('acerto', 3), { v: .55, pan: d.x / 8, vel: varia(.12) }); break;
        case 'acertoChefe': if (passou('ac', .05)) tocar(um('acerto', 3), { v: .7, pan: d.x / 8, vel: varia(.1) * .8 }); break;
        case 'faisca': case 'faiscaPortao': if (passou('ti', .055)) tocar(um('tinido', 3), { v: .7, pan: d.x / 8, vel: varia(.12) }); break;
        case 'dente': if (passou('de', .07)) tocar('dente', { v: .8, vel: .9 + Math.max(0, d.v + 20) * .012 }); break;
        case 'morte': if (passou('mo', .065)) tocar(um('morte', 4), { v: .62, pan: d.x / 8, vel: varia(.1) * (d.tipo === 'blindado' ? .7 : d.tipo === 'corredor' ? 1.2 : 1) }); break;
        case 'soldado': if (passou('so', .09)) tocar(um('queda', 2), { v: .8, pan: d.x / 8, vel: varia(.08) }); break;
        case 'explosao': if (passou('ex', .06)) { tocar(um('explosao', 3), { v: .85, pan: d.x / 8, vel: varia(.07) }); abaixar(.55, .3); } break;
        case 'barril': tocar('barril', { v: 1, pan: d.x / 8, vel: varia(.04) }); abaixar(.4, .6); break;
        case 'portao': if (!d.bom) { tocar('portaoRuim', { v: 1, molha: .15 }); abaixar(.6, .5); break; } tocar(d.l.tipo === 'vezes' || d.q > 14 ? 'portaoMuito' : 'portaoBom', { v: 1, molha: .12 }); abaixar(.6, .5); if (d.l.tipo === 'especial') entrou(d.l.arma); else if (d.l.tipo === 'cadencia') tocar('cadencia', { v: .95, em: .1 }); else if (d.q > 0) chegam(d.q, .2); break;
        case 'resgate': tocar('gaiola', { v: 1 }); chegam(Math.max(5, d.q), .3); abaixar(.6, .5); break;
        case 'sinal': tocar('caixaArma', { v: 1 }); tocar('aviso', { v: .8, em: .2 }); break;
        case 'heliSolta': tocar('arremesso', { v: .5, vel: 1.3 }); break;
        case 'destruicao': tocar('cadencia', { v: .8 }); break;
        case 'caixa': tocar('caixaArma', { v: 1 }); if (d.l.tipo === 'especial') entrou(d.l.arma); break;
        case 'premioMeio': if (d.l.tipo === 'especial') entrou(d.l.arma); else chegam(d.q, .3); break;
        case 'adrenalina': tocar('adrenalina', { v: 1 }); abaixar(.5, 1.2); break;
        case 'escombro': tocar('pedra', { v: .8, pan: d.x / 8, vel: varia(.1) }); break;
        case 'escudo': tocar('escudo', { v: .8, pan: d.x / 8 }); break;
        case 'batida': if (passou('bt', .12)) tocar('batida', { v: .9, pan: d.x / 8, vel: varia(.08) }); break;
        case 'carroExplode': tocar('barril', { v: .95, pan: d.x / 8, vel: varia(.06) }); abaixar(.45, .5); break;
        case 'carroVoa': tocar('arremesso', { v: .9, pan: d.x / 8, vel: varia(.06) }); break;
        case 'hidrante': tocar('jorro', { v: 1 }); break;
        case 'cuspe': if (passou('cu', .2)) tocar('cuspe', { v: .8, pan: d.x / 8, vel: varia(.1) }); break;
        case 'mergulhou': case 'emergiu': tocar('agua', { v: 1, pan: d.x / 9 }); break;
        case 'lateral': tocar('agua', { v: .5, vel: 1.2 }); tocar(um('gemido', 4), { v: .6, pan: -.7 }); tocar(um('gemido', 4), { v: .6, pan: .7, em: .15 }); break;
        case 'etapa': tocar('range', { v: 1 }); tocar('explosao2', { v: .9, em: .2 }); break;
        case 'arma': tocar(d.arma.id === 'fuzil' ? 'trocaFuzil' : 'trocaSub', { v: 1, molha: .1 }); abaixar(.55, .9); break;
        case 'cadencia': tocar('cadencia', { v: 1 }); break;
        case 'virou': tocar('virou', { v: .9 }); break;
        case 'reforco': tocar('reforco', { v: 1 }); chegam(d.q, .25); break;
        case 'chefeEntra': tocar('onda', { v: .7, vel: .6 }); break;
        case 'chefePousa': tocar('pancada', { v: 1, vel: .85 }); tocar('explosao2', { v: .5, vel: .7 }); tocar(RUGE[d.T.visual || d.id] || RUGE[d.T.corpo === 'bruto' || d.T.corpo === 'casca' ? 'cancela' : 'operario'], { v: d.meio ? .8 : 1, em: .3, vel: d.meio ? 1.35 : 1 }); abaixar(.25, d.meio ? 1.1 : 1.8); break;
        case 'fase': tocar(RUGE[d.T.visual || d.id], { v: 1, vel: 1.08 }); abaixar(.3, 1.4); break;
        case 'passoChefe': tocar('pisada', { v: .9, pan: d.x / 10, vel: varia(.06) }); break;
        case 'marca': if (d.vao) tocar('range', { v: .8 }); if (d.bola) tocar('bolaNeve', { v: .9, pan: d.x / 8, em: Math.max(0, d.dur - 1.15), vel: varia(.06) }); if (d.escombro) tocar('assobio', { v: .9, pan: d.x / 8, em: Math.max(0, d.dur - 1.6), vel: varia(.08) }); if (d.som === 'gosma') break; if (passou('ma', .25)) tocar('aviso', { v: .8 }); break;
        case 'golpe': { const s = d.m.som; if (passou('go' + s, .08)) { if (s === 'pancada' || s === 'varrida') { tocar(s, { v: 1, vel: varia(.04) }); abaixar(.35, .6); } else tocar(s, { v: s === 'grito' ? 1 : .9, vel: varia(.05) }); if (s === 'grito') abaixar(.25, 1.1); } break; }
        case 'placaCaiu': tocar('placa', { v: .95 }); abaixar(.5, .5); break;
        case 'alcancou': tocar('pancada', { v: 1 }); tocar('explosao2', { v: .8, em: .05 }); break;
        case 'chefeMorre': if (d.meio) { tocar('morteChefe', { v: .8, vel: 1.5 }); for (let i = 0; i < 4; i++) tocar('explosao' + i % 3, { v: .6, em: i * .16, vel: varia(.1) }); tocar('barril', { v: .9, em: .9 }); break; } tocar('morteChefe', { v: 1, vel: d.id === 'sirene' ? 1.6 : d.id === 'carcaca' ? .85 : 1 }); for (let i = 0; i < 9; i++) tocar('explosao' + i % 3, { v: .6, em: i * .26 + .02, vel: varia(.1), pan: Math.random() - .5 }); tocar('barril', { v: 1, em: 2.5, vel: .8 }); tocar('pancada', { v: 1, em: 2.5, vel: .75 }); break;
        case 'vitoria': tocar('vitoria', { v: 1 }); break;
        case 'derrota': tocar('derrota', { v: 1, em: .25 }); break;
      }
    },
    // a cada quadro: passos do pelotão, vento e gemidos conforme a cena
    atualizar(S, parado) {
      if (!ctx) return; const t = ctx.currentTime, alvo = ligado() ? 1 : 0; if (mestre.gain.value !== alvo) mestre.gain.setTargetAtTime(alvo, t, .03);
      if (t - (ult.amb ?? -1) < .12) return; const dt = Math.min(.5, t - (ult.amb ?? t)) || .12; ult.amb = t; const l = laco;
      ['camaPistola', 'camaSub', 'camaFuzil'].forEach((n, k) => { ritmo[k] += (conta[k] / dt - ritmo[k]) * .5; conta[k] = 0; l[n]?.g.gain.setTargetAtTime(pode() ? Math.min(.75, Math.sqrt(Math.max(0, ritmo[k] - 9) / 170)) : 0, t, .07); });
      { const h = S.heli, perto = h && h.estado !== 'fora' ? Math.max(0, 1 - Math.abs(h.d - S.d) / 90) : 0; l.rotor?.g.gain.setTargetAtTime(!parado && pode() ? perto * perto * .9 : 0, t, .25); }
      for (const n in jato) if (t > jato[n].ate + .12) { tocar(jato[n].fecha, { v: .9 }); delete jato[n]; }
      l.passos?.g.gain.setTargetAtTime(!parado && S.estado === 'jogando' && S.ritmo > .4 ? Math.min(1, .35 + Math.sqrt(S.n) * .1) : 0, t, .15); const ce = S.trecho.cenario; l.vento?.g.gain.setTargetAtTime(ce === 'inverno' ? 0 : parado ? .8 : .55, t, .4); l.ventania?.g.gain.setTargetAtTime(ce === 'inverno' ? .8 : 0, t, .4); l.ambFogo?.g.gain.setTargetAtTime(ce === 'apocalipse' || ce === 'brasa' ? .55 : 0, t, .4); l.desliza?.g.gain.setTargetAtTime(!parado && (S.noGelo || S.trecho.escorrega) ? Math.min(.6, Math.max(0, Math.abs(S.vx) - 1.2) * (S.noGelo ? .2 : .08)) : 0, t, .08);
      if (!parado && S.estado === 'jogando' && t > ultGemido) { const c = S.d + S.frente, perto = []; for (const z of S.zumbis) if (!z.morto && z.d - c < 26) { perto.push(z); if (perto.length > 24) break; } if (perto.length) { const z = perto[Math.floor(Math.random() * perto.length)]; tocar(um('gemido', 4), { v: Math.min(.5, .2 + perto.length * .014) * (z.tipo === 'blindado' ? 1.3 : 1), pan: z.x / 6, vel: varia(.16) * (z.tipo === 'blindado' ? .72 : z.tipo === 'corredor' ? 1.3 : 1) }); ultGemido = t + (perto.length > 12 ? .28 : .6) + Math.random() * .5; } }
    },
    musica(nome) { querMusica = nome; tocarMusica(); },
    pausar(p) { if (ctx) (p ? ctx.suspend() : ctx.resume()).catch(() => {}); },
    // para testes: volume que está saindo agora
    medidor() { if (!ctx) return null; const a = this.an ??= (() => { const x = ctx.createAnalyser(); x.fftSize = 8192; saida.connect(x); return x; })(), d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let p = 0, e = 0; for (const v of d) { p = Math.max(p, Math.abs(v)); e += v * v; } return { pico: p, rms: Math.sqrt(e / d.length) }; },
    get estado() { return { prontos: Object.keys(buf).length, espera: Object.keys(bruto).length, musica: tocando?.nome || null, vozes, ctx: ctx?.state }; },
    dispose() { morto = true; worker?.terminate(); worker = null; ctx?.close().catch(() => {}); ctx = null; for (const n in buf) delete buf[n]; for (const n in bruto) delete bruto[n]; for (const n in laco) delete laco[n]; },
  };
}

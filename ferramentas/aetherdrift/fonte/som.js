/* =====================================================================
   SOM — tudo gerado na hora com a Web Audio API, sem arquivos.
   - Pad ambiente em Lá lídio, afinado em 432 Hz, atrás de um filtro
     passa-baixa bem macio (não cansa o ouvido).
   - Notinhas soltas de vez em quando (pentatônica), brisa e cachoeiras.
   - Efeitos curtos: salto, arcos de luz, descobertas, cumes.
   Cada conexão sobe uma nota dentro da escala.
   ===================================================================== */
const Som = (() => {
  let ctx = null, mestre = null, seco = null, envio = null, padFiltro = null;
  let ventoG = null, ventoF = null, aguaG = null, aguaF = null;
  const lerNum = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : +v; } catch (e) { return d; } };
  let volume = lerNum('aetherdrift-vol', 0.7), mudo = lerNum('aetherdrift-mudo', 0) === 1;

  const LA = 216;                          // Lá3 em afinação 432 Hz (432 / 2)
  const PENTA = [0, 2, 4, 7, 9];           // pentatônica maior: sempre consonante
  const hz = s => LA * 2 ** (s / 12);      // semitons a partir do Lá → Hz
  // grau da pentatônica (pode passar de 5: sobe de oitava) → Hz
  const grauHz = (g, base = 12) => { const n = PENTA.length, o = Math.floor(g / n); return hz(base + PENTA[((g % n) + n) % n] + 12 * o); };

  // Quatro acordes do modo lídio de Lá (baixo + vozes), um a cada 10 s
  const ACORDES = [
    [-12, 0, 4, 11, 14],   // Lá maj9
    [-10, 2, 6, 9, 16],    // Si (o "II maior" que dá a cor lídia)
    [-15, 0, 4, 7, 11],    // Fá# m9
    [-17, -1, 2, 6, 9],    // Mi 6/9 com Ré#
  ];

  function osc(tipo, f) { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; o.start(); return o; }
  function bufRuido(seg) {
    const n = ctx.sampleRate * seg, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let ult = 0; for (let i = 0; i < n; i++) { ult = ult * 0.96 + (Math.random() * 2 - 1) * 0.04; d[i] = ult * 3.5; } // ruído "marrom", macio
    return b;
  }
  function impulso(seg) {   // reverberação sintética: ruído que se apaga devagar
    const n = ctx.sampleRate * seg, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }

  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ctx.destination);
    mestre = ctx.createGain(); mestre.gain.value = mudo ? 0 : volume; mestre.connect(comp);
    const rev = ctx.createConvolver(); rev.buffer = impulso(3.6);
    const revG = ctx.createGain(); revG.gain.value = 0.5; rev.connect(revG); revG.connect(mestre);
    envio = ctx.createGain(); envio.connect(rev);
    seco = ctx.createGain(); seco.connect(mestre);

    // pad: filtro passa-baixa que "respira" devagar
    padFiltro = ctx.createBiquadFilter(); padFiltro.type = 'lowpass'; padFiltro.frequency.value = 820; padFiltro.Q.value = 0.4;
    const lfo = osc('sine', 0.045), lfoG = ctx.createGain(); lfoG.gain.value = 280; lfo.connect(lfoG); lfoG.connect(padFiltro.frequency);
    const padG = ctx.createGain(); padG.gain.value = 0.85; padFiltro.connect(padG); padG.connect(seco); padG.connect(envio);

    // brisa: ruído macio num passa-banda que muda com a velocidade
    const ruido = ctx.createBufferSource(); ruido.buffer = bufRuido(5); ruido.loop = true;
    ventoF = ctx.createBiquadFilter(); ventoF.type = 'bandpass'; ventoF.frequency.value = 420; ventoF.Q.value = 0.7;
    ventoG = ctx.createGain(); ventoG.gain.value = 0;
    ruido.connect(ventoF); ventoF.connect(ventoG); ventoG.connect(seco); ventoG.connect(envio); ruido.start();

    // água de cachoeira: ruído largo, mais alto quando se passa perto
    const rAgua = ctx.createBufferSource(); rAgua.buffer = bufRuido(4); rAgua.loop = true;
    aguaF = ctx.createBiquadFilter(); aguaF.type = 'lowpass'; aguaF.frequency.value = 1400;
    aguaG = ctx.createGain(); aguaG.gain.value = 0;
    rAgua.connect(aguaF); aguaF.connect(aguaG); aguaG.connect(seco); aguaG.connect(envio); rAgua.start();

    proximoAcorde(); melodia();
    document.addEventListener('visibilitychange', () => { if (ctx) document.hidden ? ctx.suspend() : ctx.resume(); });
  }

  let iAcorde = 0, vozes = [];
  function proximoAcorde() {
    setTimeout(proximoAcorde, 10000);
    if (ctx.state !== 'running') return;             // aba escondida: não acumula osciladores
    const t = ctx.currentTime, ac = ACORDES[iAcorde++ % ACORDES.length];
    for (const v of vozes) { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + 5); v.os.forEach(o => o.stop(t + 5.3)); }
    vozes = ac.map((s, i) => {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(padFiltro);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.05 : 0.026, t + 4.5);
      const f = hz(s), os = [osc('sine', f), osc('triangle', f * 1.0032), osc('sine', f * 0.9971)];
      os.forEach(o => o.connect(g));
      return { g, os };
    });
  }
  function melodia() {   // notinhas soltas, bem espaçadas, como sinos de vento
    setTimeout(melodia, 2600 + Math.random() * 4200);
    if (!ctx || ctx.state !== 'running') return;
    const g = Math.floor(Math.random() * 9);
    sino(grauHz(g, 12), 0.035, 3.2);
    if (Math.random() < 0.35) sino(grauHz(g + 2, 12), 0.022, 3, 0.35);
  }

  // sino macio: seno + oitava, ataque curto e cauda longa
  function sino(f, vol = 0.07, dur = 2.2, atraso = 0) {
    if (!ctx) return; const t = ctx.currentTime + atraso;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(seco); g.connect(envio);
    const o1 = ctx.createOscillator(); o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.frequency.value = f * 2; const g2 = ctx.createGain(); g2.gain.value = 0.22; o2.connect(g2); g2.connect(g);
    o1.connect(g); o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  // sopro: rajada de ruído com filtro que varre de uma frequência a outra
  function sopro(de, para, dur = 0.5, vol = 0.08, atraso = 0) {
    if (!ctx) return; const t = ctx.currentTime + atraso;
    const s = ctx.createBufferSource(); s.buffer = bufRuido(dur + 0.1);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(de, t); f.frequency.exponentialRampToValueAtTime(para, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(seco); g.connect(envio); s.start(t); s.stop(t + dur + 0.1);
  }
  function tok(vol = 0.09) {   // "toc" de madeira macia
    if (!ctx) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(seco); o.start(t); o.stop(t + 0.15);
  }

  const api = {
    iniciar, grauHz,
    get ligado() { return !!ctx; },
    get volume() { return volume; }, get mudo() { return mudo; },
    definirVolume(v) { volume = v; mudo = v <= 0.001; guardar(); aplicar(); },
    alternarMudo() { mudo = !mudo; if (!mudo && volume < 0.05) volume = 0.6; guardar(); aplicar(); },
    salto() { sopro(260, 1500, 0.9, 0.1); sino(grauHz(4, 12), 0.05, 2, 0.15); sino(grauHz(7, 12), 0.04, 2, 0.3); },
    arco(i) { sino(grauHz(i + 3, 12), 0.08, 2.6); sino(grauHz(i + 5, 12), 0.045, 2.4, 0.09); sopro(400, 1800, 0.5, 0.05); },
    descoberta() { [0, 4, 7].forEach((g, i) => sino(grauHz(g, 12), 0.05, 3, i * 0.22)); },
    cume() { [0, 2, 4, 5, 7, 9].forEach((g, i) => sino(grauHz(g, 12), 0.07, 3.2, i * 0.13)); sopro(200, 1400, 1.4, 0.06); },
    fim() { [0, 4, 7, 9, 11, 14].forEach((g, i) => sino(grauHz(g, 0), 0.07, 5.5, i * 0.18)); sopro(150, 1200, 3, 0.07); },
    respingo() { sopro(1600, 260, 1.1, 0.14); sopro(900, 3000, 0.5, 0.05, 0.1); [2, 4, 7].forEach((g, i) => sino(grauHz(g, 12), 0.04, 1.6, 0.15 + i * 0.1)); },
    clique() { sino(grauHz(4, 12), 0.04, 0.8); },
    cachoeira(v) { if (ctx) aguaG.gain.setTargetAtTime(v * v * 0.09, ctx.currentTime, 0.4); },
    // a cada quadro: a brisa acompanha a velocidade; o sopro e o voo rasante deixam o vento mais presente
    atualizar(vel, sopro = 0, rasante = 0) {
      if (!ctx) return; const t = ctx.currentTime;
      const vento = vel ? 0.04 + Math.min(vel / 40, 1) * 0.07 + sopro * 0.04 + rasante * 0.03 : 0.012;
      ventoG.gain.setTargetAtTime(vento, t, 0.3); ventoF.frequency.setTargetAtTime(300 + vel * 22 + sopro * 300, t, 0.3);
    },
  };
  function guardar() { try { localStorage.setItem('aetherdrift-vol', volume); localStorage.setItem('aetherdrift-mudo', mudo ? 1 : 0); } catch (e) {} }
  function aplicar() { if (mestre) mestre.gain.setTargetAtTime(mudo ? 0 : volume, ctx.currentTime, 0.08); }
  return api;
})();

// Sons feitos na hora, sem arquivos (versão simples da Fase 2; o som completo vem na Fase 5).
const ARMA = [{ f: 1900, q: .9, d: .11, g: .5, c: 150 }, { f: 2600, q: .8, d: .07, g: .34, c: 190 }, { f: 1500, q: .7, d: .12, g: .46, c: 110 }];
export function criarSom(ligado) {
  let ctx = null, saida = null, ruido = null, ultimo = 0, ultMorte = 0, morto = false;
  function abrir() {
    if (ctx || morto) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; saida = ctx.createGain(); saida.gain.value = .55; saida.connect(comp); comp.connect(ctx.destination);
    const b = ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const pode = () => ligado() && ctx && ctx.state === 'running';
  function sopro(freq, q, dur, vol, tipo = 'lowpass', fim = freq * .25, pan = 0) {
    const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = ruido; f.type = tipo; f.Q.value = q; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, fim), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(f); f.connect(g); let o = g; if (pan && ctx.createStereoPanner) { o = ctx.createStereoPanner(); o.pan.value = pan; g.connect(o); } o.connect(saida); s.start(t, Math.random() * .7, dur + .02);
  }
  function tom(f0, f1, dur, vol, tipo = 'sine', atraso = 0) { const t = ctx.currentTime + atraso, o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(saida); o.start(t); o.stop(t + dur + .03); }
  return {
    acordar() { abrir(); if (ctx?.state === 'suspended') ctx.resume().catch(() => {}); },
    tiro(arma, n, pan) { if (!pode()) return; const t = ctx.currentTime; if (t - ultimo < .06) return; ultimo = t; const a = ARMA[arma], v = a.g * Math.min(1, .5 + Math.sqrt(n) * .07), k = .92 + Math.random() * .16; sopro(a.f * k, a.q, a.d, v, 'lowpass', a.f * .2, pan * .4); tom(a.c * k, a.c * .35, a.d * .7, v * .7, 'triangle'); },
    evento(nome, d) {
      if (!pode()) return;
      switch (nome) {
        case 'morte': if (ctx.currentTime - ultMorte > .07) { ultMorte = ctx.currentTime; sopro(700, 1.4, .13, .2, 'lowpass', 160, d.x / 8); } break;
        case 'soldado': tom(190, 80, .25, .3, 'sawtooth'); sopro(500, 1, .2, .3); break;
        case 'portao': (d.bom ? [392, 523, 659, 784] : [330, 262, 196]).forEach((f, i) => tom(f, f * 1.01, .22, .24, 'triangle', i * .055)); break;
        case 'virou': tom(440, 880, .25, .22, 'triangle'); break;
        case 'arma': [262, 392, 523, 784].forEach((f, i) => tom(f, f, .3, .22, 'sawtooth', i * .07)); sopro(3000, 2, .25, .3, 'bandpass', 900); break;
        case 'barril': sopro(900, .6, 1.1, 1.2, 'lowpass', 50); tom(95, 28, .7, .9); break;
        case 'vitoria': [392, 523, 659, 784, 1047].forEach((f, i) => tom(f, f, .5, .24, 'triangle', i * .12)); break;
        case 'derrota': [294, 247, 196, 147].forEach((f, i) => tom(f, f * .97, .5, .26, 'triangle', i * .17)); break;
      }
    },
    pausar(p) { if (ctx) (p ? ctx.suspend() : ctx.resume()).catch(() => {}); },
    dispose() { morto = true; ctx?.close().catch(() => {}); ctx = null; },
  };
}

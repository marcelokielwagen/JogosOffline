// Fábrica de sons: contas puras que devolvem as ondas prontas (nenhum arquivo de áudio). Tiros, portões, armas e tropa ficam em realista.js.
// Roda numa tarefa à parte (Worker) para não travar o jogo, e também no Node, para medir volume e duração.
import { REAIS, acabar, ecoPonte } from './realista.js';
export const TAXA = 44100, TAXA_MUSICA = 32000;
const PI2 = Math.PI * 2, lim = (v, a, b) => v < a ? a : v > b ? b : v;
export const sat = (x, k = 1) => Math.tanh(x * k) / Math.tanh(k);
function dado(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export let SR = TAXA, rnd = dado(1);
export const novo = seg => new Float32Array(Math.ceil(seg * SR)), branco = () => rnd() * 2 - 1;
export const gerar = (seg, fn) => { const o = novo(seg); for (let i = 0; i < o.length; i++) o[i] = fn(i / SR, i); return o; };
// envoltórias
export const cai = (t, tau, at = .001) => t < 0 ? 0 : (1 - Math.exp(-t / at)) * Math.exp(-t / tau);
export const sobeDesce = (t, dur, a, r) => t < 0 || t > dur ? 0 : Math.min(1, t / a, (dur - t) / r);
// filtro de 2 polos com frequência que pode mudar no tempo. tipo: lp, hp, bp
export function filtro(x, tipo, freq, q = .7) {
  const o = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2; const f = typeof freq === 'function' ? freq : () => freq;
  for (let i = 0; i < x.length; i++) {
    if (i % 24 === 0) { const w = PI2 * lim(f(i / SR), 15, SR * .46) / SR, s = Math.sin(w), c = Math.cos(w), al = s / (2 * q), a0 = 1 + al; if (tipo === 'lp') { b0 = b2 = (1 - c) / 2; b1 = 1 - c; } else if (tipo === 'hp') { b0 = b2 = (1 + c) / 2; b1 = -1 - c; } else { b0 = al; b1 = 0; b2 = -al; } b0 /= a0; b1 /= a0; b2 /= a0; a1 = -2 * c / a0; a2 = (1 - al) / a0; }
    const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; o[i] = y;
  }
  return o;
}
export const somar = (o, x, ini = 0, g = 1) => { const k = Math.round(ini * SR); for (let i = 0; i < x.length && i + k < o.length; i++) if (i + k >= 0) o[i + k] += x[i] * g; return o; };
export const mapa = (x, fn) => { for (let i = 0; i < x.length; i++) x[i] = fn(x[i], i / SR); return x; };
// seno que escorrega de f0 a f1
export const escorrega = (seg, f0, f1, tau, amp) => { let p = 0; return gerar(seg, t => { p += PI2 * (f1 + (f0 - f1) * Math.exp(-t / tau)) / SR; return Math.sin(p) * amp(t); }); };
export const sopro = (seg, amp) => gerar(seg, t => branco() * amp(t));
// sala: ecos curtos que se misturam
function sala(x, seg, tam = 1, abafa = .45) {
  const o = novo(x.length / SR + seg), g = t => Math.pow(.001, t / seg);
  for (const base of [.0297, .0371, .0411, .0437, .0533]) { const n = Math.round(base * tam * SR), b = new Float32Array(n), k = g(base * tam); let p = 0, lp = 0; for (let i = 0; i < o.length; i++) { const y = b[p]; lp += (y - lp) * (1 - abafa); b[p] = (i < x.length ? x[i] : 0) + lp * k; p = (p + 1) % n; o[i] += y * .2; } }
  for (const base of [.005, .0017]) { const n = Math.round(base * SR), b = new Float32Array(n); let p = 0; for (let i = 0; i < o.length; i++) { const y = b[p], v = o[i] + y * .6; b[p] = v; o[i] = y - v * .6; p = (p + 1) % n; } }
  return o;
}
const comSala = (x, seg, g, tam, abafa) => { const r = sala(x, seg, tam, abafa), o = novo(r.length / SR); somar(o, x); somar(o, r, 0, g); return o; };
// alto-falante de celular quase não toca grave: segura o grave e realça o meio e o agudo, sem tirar o peso
function presenca(x, menos = .5, mais = .9) { const g = filtro(x, 'lp', 150, .6), a = filtro(x, 'hp', 1300, .6), m = filtro(x, 'bp', 520, .5), o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = x[i] - g[i] * menos + m[i] * .55 + a[i] * mais; return filtro(o, 'hp', 42, .7); }
// o estalo inicial não pode mandar no volume: amacia a ponta e traz o corpo para a frente
function encorpa(x, k = 2.6) { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); return mapa(x, v => sat(v / (m || 1), k)); }
// acerta o pico e apaga o fim com suavidade
function fechar(x, pico = .9, fim = .02) { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); const k = m ? pico / m : 1, n = Math.round(fim * SR); for (let i = 0; i < x.length; i++) x[i] *= k * Math.min(1, (x.length - i) / n); return x; }
// laço sem emenda: mistura o fim com o começo
function laco(x, cruza, pico) { const n = Math.round(cruza * SR), o = new Float32Array(x.length - n); for (let i = 0; i < o.length; i++) o[i] = i < n ? x[i] * Math.sqrt(i / n) + x[o.length + i] * Math.sqrt(1 - i / n) : x[i]; let m = 0; for (const v of o) m = Math.max(m, Math.abs(v)); for (let i = 0; i < o.length; i++) o[i] *= pico / m; return o; }
// voz: pulso da garganta com formantes (a, o, u, e de monstro ou gente)
const VOGAL = { a: [[730, 1], [1090, .6], [2440, .3]], o: [[480, 1], [800, .55], [2500, .16]], u: [[320, 1], [740, .35], [2240, .1]], e: [[560, 1], [1700, .5], [2480, .3]], ar: [[620, 1], [1250, .7], [2600, .42]] };
function voz(seg, f, vogal, { amp, rouco = .2, ar = .15, esc = 1, q = 7, rosna = 0, fRosna = 28 } = {}) {
  let p = 0, jit = 0; const fonte = gerar(seg, t => { jit += (branco() - jit) * .002; p += f(t) * (1 + jit * 4 * rouco) / SR; const s = p % 1; let v = (s < .6 ? 1 - s / .3 : -1 + (s - .6) / .4) * (1 + branco() * rouco) + branco() * ar; if (rosna) v *= 1 - rosna * (.5 + .5 * Math.sin(PI2 * fRosna * t + Math.sin(PI2 * 7 * t) * 2)); return v; });
  const o = novo(seg); for (const [fr, g] of VOGAL[vogal]) somar(o, filtro(fonte, 'bp', fr * esc, q), 0, g); somar(o, filtro(fonte, 'lp', 260 * esc), 0, .14); return mapa(filtro(o, 'hp', 75), (v, t) => v * amp(t));
}

// ---------- explosões ----------
function explosao(g = 1) {
  const n = 1.5 + .5 * g, o = novo(n);
  somar(o, escorrega(1.1, 105, 27 / g ** .3, .11, t => cai(t, .3 * g)), 0, 1.15); somar(o, filtro(sopro(.09, t => cai(t, .016, .0003)), 'hp', 1500), 0, 1);
  somar(o, filtro(sopro(n, t => cai(t, .3 * g, .004)), 'lp', t => 5200 * Math.exp(-t * 3 / g) + 220, .6), 0, 2.3); somar(o, filtro(sopro(n, t => cai(t - .08, .5 * g, .05)), 'lp', 380), 0, 1.3);
  for (let k = 0; k < 16; k++) somar(o, filtro(sopro(.06, t => cai(t, .012)), 'bp', 700 + rnd() * 2600, 2.4), .12 + rnd() * .8 * g, .22 * rnd());
  return comSala(mapa(o, v => sat(v, 1.5)), .9 * g, .4, 1.5);
}
const metal = (seg, f, tau, g = 1) => { const ps = [1, 1.47, 2.09, 2.56, 3.39, 4.08, 5.1].map(r => [f * r * (1 + (rnd() - .5) * .02), tau * (1.2 - r * .14), 1 / Math.sqrt(r)]); return gerar(seg, t => { let v = 0; for (const [fr, ta, a] of ps) v += Math.sin(PI2 * fr * t) * a * Math.exp(-t / Math.max(.02, ta)); return v * g * .3 * Math.min(1, t / .0008); }); };
function barril() { const o = novo(2.4); somar(o, explosao(1.05), 0, 1); somar(o, metal(1, 310, .22), 0, .55); somar(o, metal(.8, 520, .14), .1, .25); return o; }

// ---------- personagens ----------
const gemido = k => { const f0 = 88 + k * 17, n = .95; return voz(n, t => f0 * (1 + .22 * Math.sin(PI2 * 1.1 * t + k) - .2 * t), ['o', 'a', 'u', 'ar'][k], { amp: t => sobeDesce(t, n, .14, .4), rouco: .5, ar: .4, rosna: .55, fRosna: 24 + k * 4, q: 6 }); };
const morteZ = k => { const n = .5, o = novo(n), f0 = 150 + k * 26; somar(o, voz(n, t => f0 * (1.25 - t * 1.3), k % 2 ? 'a' : 'ar', { amp: t => sobeDesce(t, n, .015, .34), rouco: .55, ar: .35, rosna: .4, fRosna: 34, q: 6 }), 0, 1.3); somar(o, filtro(sopro(.2, t => cai(t, .035)), 'lp', t => 1300 * Math.exp(-t * 12) + 160), 0, 1); somar(o, escorrega(.25, 130, 52, .03, t => cai(t, .06)), .01, .8); return mapa(o, v => sat(v, 1.5)); };
const acerto = k => { const o = novo(.13); somar(o, filtro(sopro(.13, t => cai(t, .016)), 'bp', 700 + k * 320, .9), 0, 1.6); somar(o, escorrega(.13, 210 + k * 30, 80, .014, t => cai(t, .024)), 0, .9); return mapa(o, v => sat(v, 1.6)); };
const queda = k => { const n = .42, o = novo(n), f0 = 205 + k * 34; somar(o, voz(n, t => f0 * (1.15 - t * .9), k ? 'a' : 'o', { amp: t => sobeDesce(t, .26, .01, .16), rouco: .2, ar: .2, esc: 1.12, q: 7 }), 0, 1.3); somar(o, escorrega(.3, 120, 48, .03, t => cai(t, .07)), .12, 1); somar(o, filtro(sopro(.2, t => cai(t, .03)), 'lp', 700), .12, .7); return o; };
const passos = () => { const n = 4 / 2.9, o = novo(n + .1); for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) { const t0 = k / 2.9 + rnd() * .075; somar(o, filtro(sopro(.07, t => cai(t, .012)), 'bp', 320 + rnd() * 320, 1), t0, .5 + rnd() * .5); somar(o, escorrega(.07, 110, 60, .01, t => cai(t, .018)), t0, .5); } const f = novo(n); for (let i = 0; i < o.length; i++) f[i % f.length] += o[i]; return f; };
const vento = () => { const n = 7; return laco(filtro(filtro(sopro(n, () => 1), 'bp', t => 380 + 170 * Math.sin(PI2 * t / 6 + 1) + 90 * Math.sin(PI2 * t / 2.3), 1.1), 'hp', 140), 1, .5); };

// ---------- avisos ----------
const sino = (seg, f, tau, idx = 2.2, r = 2.01) => gerar(seg, t => Math.sin(PI2 * f * t + idx * Math.exp(-t / (tau * .4)) * Math.sin(PI2 * f * r * t)) * cai(t, tau, .002));
const midi = n => 440 * 2 ** ((n - 69) / 12);
const arpejo = (notas, passo, tau, extra = .5, idx) => { const o = novo(notas.length * passo + extra); notas.forEach((n, i) => somar(o, sino(extra + .2, midi(n), tau, idx), i * passo, .6 + i * .06)); return o; };
const varre = (seg, f0, f1, q = 1.2) => filtro(sopro(seg, t => Math.sin(Math.PI * Math.min(1, t / seg)) ** 2), 'bp', t => f0 * (f1 / f0) ** (t / seg), q);
// ---------- chefes ----------
function rugido(f0, esc, n = 1.9, voc = 'a', fR = 27) { const o = novo(n); somar(o, voz(n, t => f0 * (1 + .5 * Math.sin(Math.PI * Math.min(1, t / n)) ** 2), voc, { amp: t => sobeDesce(t, n, .12, .7), rouco: .6, ar: .5, rosna: .75, fRosna: fR, esc, q: 5 }), 0, 1.6); somar(o, voz(n, t => f0 * .5 * (1 + .4 * Math.sin(Math.PI * Math.min(1, t / n))), 'o', { amp: t => sobeDesce(t, n, .1, .7), rouco: .5, rosna: .6, fRosna: fR * .7, esc: esc * .9, q: 5 }), 0, 1.1); somar(o, filtro(sopro(n, t => sobeDesce(t, n, .15, .8) * (.5 + .5 * Math.sin(PI2 * fR * t))), 'bp', 900 * esc, .6), 0, 1.3); return comSala(mapa(o, v => sat(v, 2.4)), 1.1, .35, 1.6); }
function pancada(g = 1) { const n = 1.3, o = novo(n); somar(o, escorrega(n, 88, 26, .09, t => cai(t, .22 * g)), 0, 1.25); somar(o, filtro(sopro(.6, t => cai(t, .085)), 'lp', t => 3600 * Math.exp(-t * 7) + 240), 0, 2.4); for (let k = 0; k < 14; k++) somar(o, filtro(sopro(.07, t => cai(t, .014)), 'bp', 600 + rnd() * 2200, 1.6), .03 + rnd() * .55, .8 * rnd()); return comSala(mapa(o, v => sat(v, 1.8)), .8, .35, 1.4); }
const varrida = () => { const o = novo(1.2); somar(o, varre(.55, 220, 1500, .8), 0, 2.2); somar(o, pancada(.7), .3, .8); return o; };
const placa = () => { const o = novo(1.6); somar(o, pancada(.6), 0, .75); somar(o, metal(1.3, 205, .34), 0, 1); somar(o, metal(.7, 390, .16), .16, .5); somar(o, metal(.5, 350, .12), .33, .3); return mapa(o, v => sat(v, 1.5)); };
const pedra = () => { const o = novo(.7); somar(o, escorrega(.5, 110, 40, .04, t => cai(t, .1)), 0, 1.4); somar(o, filtro(sopro(.4, t => cai(t, .06)), 'bp', 700, .7), 0, 1.5); for (let k = 0; k < 6; k++) somar(o, filtro(sopro(.05, t => cai(t, .01)), 'bp', 900 + rnd() * 1500, 2), .06 + rnd() * .3, .5); return o; };
const onda = () => { const o = novo(1); somar(o, escorrega(1, 190, 44, .2, t => cai(t, .25, .01)), 0, 1.3); somar(o, varre(.8, 2400, 160, .9), 0, 1.4); return o; };
function grito() { const n = 1.5, f = t => 430 + 260 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 30 * Math.sin(PI2 * 9 * t), o = novo(n); somar(o, voz(n, f, 'e', { amp: t => sobeDesce(t, n, .05, .5), rouco: .45, ar: .4, rosna: .35, fRosna: 46, esc: 1.15, q: 6 }), 0, 1.5); somar(o, voz(n, t => f(t) * 1.505, 'a', { amp: t => sobeDesce(t, n, .09, .5), rouco: .4, ar: .2, esc: 1.2, q: 6 }), 0, .7); somar(o, gerar(n, t => sat(Math.sin(PI2 * (520 + 180 * Math.sin(PI2 * .9 * t)) * t), 2) * sobeDesce(t, n, .1, .6)), 0, .16); return comSala(mapa(o, v => sat(v, 2)), 1, .4, 1.5); }
const pisada = () => { const o = novo(.6); somar(o, escorrega(.6, 78, 30, .05, t => cai(t, .13)), 0, 1.6); somar(o, filtro(sopro(.25, t => cai(t, .03)), 'lp', 520), 0, 1); return mapa(o, v => sat(v, 1.5)); };
const aviso = () => { const o = novo(.75); somar(o, filtro(gerar(.75, t => ((t * 92) % 1 - .5) + ((t * 92.8) % 1 - .5) + ((t * 138) % 1 - .5) * .6), 'lp', t => 240 + 1500 * t), 0, 1); return mapa(o, (v, t) => sat(v, 1.4) * sobeDesce(t, .75, .28, .2)); };
const morteChefe = f0 => { const n = 3, o = novo(n); somar(o, voz(n, t => f0 * (1.5 - t * .33), 'a', { amp: t => sobeDesce(t, n, .06, 1.6), rouco: .7, ar: .5, rosna: .7, fRosna: 22, esc: .9, q: 5 }), 0, 1.6); somar(o, voz(n, t => f0 * .5 * (1.4 - t * .3), 'o', { amp: t => sobeDesce(t, n, .06, 1.6), rouco: .6, rosna: .6, fRosna: 17, esc: .75, q: 5 }), 0, 1.4); return comSala(mapa(o, v => sat(v, 2.3)), 1.4, .4, 1.6); };

// ---------- fanfarras ----------
const metais = (seg, n, forte = 1) => { const f = midi(n); return filtro(gerar(seg, t => { const vib = 1 + .004 * Math.sin(PI2 * 5.4 * t) * Math.min(1, t * 3); return (((t * f * vib) % 1 - .5) + ((t * f * 1.004) % 1 - .5) + ((t * f * .997) % 1 - .5)) * sobeDesce(t, seg, .03, Math.min(.2, seg * .5)); }), 'lp', t => (500 + 3000 * forte * Math.min(1, t * 9)) * (seg - t > .1 ? 1 : .7), .8); };
const vitoria = () => { const o = novo(3.4), P = [[0, .16, [62, 66, 69]], [.18, .16, [62, 66, 69]], [.36, .16, [62, 66, 69]], [.54, .5, [66, 69, 74]], [1.06, .32, [64, 67, 71]], [1.4, 1.5, [66, 69, 74, 78]]]; for (const [t, d, ac] of P) ac.forEach((n, i) => somar(o, metais(d + .1, n, 1.1), t, .5 - i * .04)); for (const [t, n] of [[0, 38], [.54, 38], [1.06, 43], [1.4, 38]]) somar(o, escorrega(.6, midi(n) * 2.2, midi(n), .03, u => cai(u, .24)), t, 1); for (let i = 0; i < 12; i++) somar(o, sino(.5, midi([74, 78, 81, 86][i % 4] + (i > 7 ? 12 : 0)), .18, 1.4), 1.45 + i * .08, .14); return comSala(mapa(o, v => sat(v, 1.1)), 1, .3, 1.4); };
const derrota = () => { const o = novo(3); for (const [t, d, ac] of [[0, .5, [50, 57, 62, 65]], [.52, .5, [48, 55, 60, 64]], [1.04, .5, [46, 53, 58, 62]], [1.56, 1.3, [45, 52, 57, 61]]]) ac.forEach(n => somar(o, metais(d + .12, n, .5), t, .4)); somar(o, escorrega(1.2, 70, 34, .2, t => cai(t, .5)), 1.56, .9); return comSala(o, 1.2, .35, 1.5); };

// volume de pico de cada som (o que manda no equilíbrio entre eles)
export const SONS = {
  ...REAIS, explosao0: [() => explosao(1), .95], explosao1: [() => explosao(.85), .92], explosao2: [() => explosao(1.15), .95], barril: [barril, .97],
  gemido0: [() => gemido(0), .5], gemido1: [() => gemido(1), .5], gemido2: [() => gemido(2), .5], gemido3: [() => gemido(3), .5], morte0: [() => morteZ(0), .52], morte1: [() => morteZ(1), .52], morte2: [() => morteZ(2), .52], morte3: [() => morteZ(3), .52], acerto0: [() => acerto(0), .34], acerto1: [() => acerto(1), .34], acerto2: [() => acerto(2), .34], queda0: [() => queda(0), .6], queda1: [() => queda(1), .6],
  passos: [passos, .16, 1], vento: [vento, .16, 1],
  rugidoCancela: [() => rugido(74, .82), .9], rugidoOperario: [() => rugido(66, .74, 1.9, 'o', 22), .9], rugidoSirene: [() => rugido(150, 1.15, 1.8, 'e', 38), .85], rugidoCarcaca: [() => rugido(54, .66, 2.1, 'ar', 19), .92], rugidoAfogada: [() => rugido(112, .98, 2, 'o', 31), .88], rugidoGuindaste: [() => rugido(60, .7, 2, 'a', 34), .92], rugidoFornalha: [() => rugido(50, .62, 2.1, 'o', 24), .92], rugidoMae: [() => rugido(88, .86, 2.4, 'a', 21), .95],
  pancada: [() => pancada(1), .97], varrida: [varrida, .92], placa: [placa, .9], pedra: [pedra, .75], onda: [onda, .8], grito: [grito, .66], pisada: [pisada, .6], aviso: [aviso, .4], morteChefe: [() => morteChefe(80), .92], vitoria: [vitoria, .7], derrota: [derrota, .66],
};
export function fazerSom(nome) { SR = TAXA; rnd = dado([...nome].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)); const [fn, pico, laco, par, k] = SONS[nome]; if (par) { const { E, D } = fn(); return [acabar(E, pico, laco, k), acabar(D, pico, laco, k)]; } if (REAIS[nome]) return acabar(fn(), pico, laco, k); const x = encorpa(presenca(fn(), .55, .95)); return laco ? (() => { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); for (let i = 0; i < x.length; i++) x[i] *= pico / m; return x; })() : fechar(x, pico); }

// ---------- música ----------
// Duas trilhas originais de ação em laço. Cada instrumento é tocado nota a nota em dois canais.
function tocador(bpm, compassos) {
  SR = TAXA_MUSICA; const p16 = 15 / bpm, total = compassos * 16 * p16, n = Math.round(total * SR), E = new Float32Array(n), D = new Float32Array(n);
  // soma com volta ao começo, para o laço não ter emenda
  const por = (x, passo, g = 1, pan = 0) => { const k = Math.round(passo * p16 * SR), ge = g * Math.cos((pan + 1) * Math.PI / 4), gd = g * Math.sin((pan + 1) * Math.PI / 4); for (let i = 0; i < x.length; i++) { const j = (i + k) % n; E[j] += x[i] * ge; D[j] += x[i] * gd; } };
  return { p16, total, E, D, por };
}
const bumbo = () => { const o = novo(.36); somar(o, escorrega(.36, 170, 47, .028, t => cai(t, .13)), 0, 1.3); somar(o, filtro(sopro(.02, t => cai(t, .003, .0002)), 'hp', 2400), 0, .5); return mapa(o, v => sat(v, 1.6)); };
const caixa = () => { const o = novo(.3); somar(o, filtro(sopro(.3, t => cai(t, .075)), 'hp', 1400), 0, .8); somar(o, escorrega(.2, 260, 175, .02, t => cai(t, .06)), 0, .7); return mapa(o, v => sat(v, 1.5)); };
const prato = (tau, f = 7000) => filtro(sopro(tau * 5, t => cai(t, tau, .0005)), 'hp', f);
const tom = f => mapa(escorrega(.4, f * 1.7, f, .04, t => cai(t, .14)), v => sat(v, 1.5));
const baixo = (seg, n, corte) => { const f = midi(n), x = filtro(gerar(seg, t => (((t * f) % 1 - .5) + ((t * f * 1.006) % 1 - .5)) * .8 + Math.sign(Math.sin(PI2 * f * .5 * t)) * .25), 'lp', t => 160 + corte * Math.exp(-t * 11), 1.6); return mapa(x, (v, t) => sat(v * 1.5, 2) * sobeDesce(t, seg, .004, .03)); };
const guitarra = (seg, n) => { const f = midi(n), fs = [1, 1.498, 2.004]; let x = gerar(seg, t => { let v = 0; for (const r of fs) v += (t * f * r) % 1 - .5; return v * cai(t, seg * .9, .003); }); x = mapa(x, v => sat(v * 1.6, 5)); return mapa(filtro(filtro(x, 'lp', 3000), 'hp', 150), (v, t) => v * sobeDesce(t, seg, .003, .03)); };
const cordas = (seg, n) => { const f = midi(n); return mapa(filtro(gerar(seg, t => { let v = 0; for (const d of [-.006, -.002, .003, .007]) v += (t * f * (1 + d)) % 1 - .5; return v * .5; }), 'lp', 1500), (v, t) => v * sobeDesce(t, seg, Math.min(.12, seg * .3), Math.min(.2, seg * .4))); };
const pulsa = (seg, n) => { const f = midi(n); return filtro(gerar(seg, t => (((t * f) % 1) < .3 ? .6 : -.4) * cai(t, seg * .5, .002)), 'lp', t => 900 + 3200 * Math.exp(-t * 14)); };
function mestre(m, alvo = .8) { let pico = 0; const E = presenca(m.E, .38, 1.5), D = presenca(m.D, .38, 1.5); for (let i = 0; i < E.length; i++) { E[i] = sat(E[i] * .5, 1.15); D[i] = sat(D[i] * .5, 1.15); pico = Math.max(pico, Math.abs(E[i]), Math.abs(D[i])); } for (let i = 0; i < E.length; i++) { E[i] *= alvo / pico; D[i] *= alvo / pico; } return { E, D, seg: m.total }; }
// "Atravessar": ação em ré menor, 136 bpm, 16 compassos
function musicaAcao() {
  rnd = dado(91); const m = tocador(136, 16), B = bumbo(), C = caixa(), H = prato(.022), HA = prato(.09, 6000), PR = prato(.5, 4500), dur = m.p16;
  const AC = [[38, [62, 65, 69]], [38, [62, 65, 69]], [34, [58, 62, 65]], [36, [60, 64, 67]], [38, [62, 65, 69]], [41, [60, 65, 69]], [34, [58, 62, 65]], [33, [57, 61, 64]]];
  const RIFF = [0, -1, 0, 12, -1, 0, -1, 7, 0, -1, 0, 10, -1, 12, 7, 10], MEL = [[0, 74, 3], [3, 72, 1], [4, 74, 2], [6, 77, 2], [8, 76, 4], [12, 72, 4], [16, 70, 3], [19, 72, 1], [20, 74, 4], [24, 69, 6], [32, 74, 3], [35, 76, 1], [36, 77, 2], [38, 81, 2], [40, 79, 4], [44, 77, 4], [48, 74, 4], [52, 73, 4], [56, 76, 6]];
  for (let c = 0; c < 16; c++) { const [r, ac] = AC[c % 8], o = c * 16, cheio = c >= 4, forte = c >= 8;
    for (let k = 0; k < 16; k++) { if (k % 4 === 0 || (k === 10 && c % 2) || (k === 7 && forte)) m.por(B, o + k, .95); if (k === 4 || k === 12) m.por(C, o + k, .62); if (c % 4 === 3 && k > 12) m.por(C, o + k, .3 + (k - 12) * .08); m.por(k % 4 === 2 && cheio ? HA : H, o + k, (k % 2 ? .13 : .2) * (cheio ? 1 : .7), k % 2 ? .3 : -.2); if (RIFF[k] >= 0) m.por(baixo(dur * .95, r + RIFF[k], 1500), o + k, .62); }
    if (c % 4 === 0) m.por(PR, o, .34, .2);
    for (const n of ac) m.por(cordas(dur * 15.5, n), o, cheio ? .26 : .18, (n - 62) / 12); if (cheio) for (const k of [0, 3, 6, 8, 11, 14]) { m.por(guitarra(dur * 1.7, r + 12), o + k, .25, -.55); m.por(guitarra(dur * 1.6, r + 12), o + k, .22, .55); }
    for (let k = 0; k < 16; k += 2) m.por(pulsa(dur * 1.8, ac[(k / 2) % 3] + 12), o + k, forte ? .13 : .16, Math.sin(k) * .7); }
  for (const b of [8, 12]) for (const [k, n, d] of MEL) { m.por(metais(dur * d * .95 + .05, n, .9), b * 16 + k, .42, -.1); if (b === 12) m.por(metais(dur * d * .95 + .05, n - 12, .7), b * 16 + k, .26, .2); }
  return mestre(m);
}
// "Gigante": tema de chefe em mi frígio, 152 bpm, 16 compassos
function musicaChefe() {
  rnd = dado(47); const m = tocador(152, 16), B = bumbo(), C = caixa(), H = prato(.02), PR = prato(.6, 4200), T = [tom(92), tom(120), tom(150)], dur = m.p16;
  const R = [40, 40, 41, 40, 40, 43, 41, 39], RIFF = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1], NOTA = [0, 0, 0, 12, 0, 0, 0, 1, 0, 0, 0, 12, 0, 13, 12, 10];
  const MEL = [[0, 64, 6], [6, 65, 2], [8, 64, 4], [12, 67, 4], [16, 65, 6], [22, 64, 2], [24, 62, 4], [28, 60, 4], [32, 64, 6], [38, 67, 2], [40, 69, 4], [44, 71, 4], [48, 72, 4], [52, 71, 4], [56, 68, 8]];
  for (let c = 0; c < 16; c++) { const r = R[c % 8], o = c * 16, forte = c >= 8;
    for (let k = 0; k < 16; k++) { if ([0, 3, 6, 8, 11].includes(k) || (forte && k % 4 === 2)) m.por(B, o + k, 1); if (k === 4 || k === 12) m.por(C, o + k, .66); m.por(H, o + k, k % 2 ? .12 : .2, k % 2 ? -.3 : .3); if (RIFF[k]) { m.por(baixo(dur * .9, r - 12 + NOTA[k] % 12, 1200), o + k, .7); m.por(guitarra(dur * (k % 4 ? .85 : 1.4), r + NOTA[k]), o + k, .24, -.6); m.por(guitarra(dur * (k % 4 ? .8 : 1.35), r + NOTA[k]), o + k, .22, .6); } }
    if (c % 2) [10, 11, 12, 13, 14, 15].forEach((k, i) => m.por(T[2 - Math.floor(i / 2)], o + k, .5, (i - 2.5) / 4));
    if (c % 4 === 0) m.por(PR, o, .4);
    for (const [n, p] of [[r + 12, -.4], [r + 19, .4], [r + 24, 0]]) m.por(cordas(dur * 15.6, n), o, .24, p); for (const k of [0, 6, 12]) m.por(metais(dur * 2.2, r + 12, 1.1), o + k, .3, .15); }
  for (const b of [4, 8, 12]) for (const [k, n, d] of MEL) { m.por(metais(dur * d * .96 + .05, n + (b === 12 ? 12 : 0), .9), b * 16 + k, b === 12 ? .34 : .4, -.15); if (b >= 8) m.por(cordas(dur * d, n + 12), b * 16 + k, .24, .35); }
  return mestre(m);
}
export const fazerEco = () => { SR = TAXA; rnd = dado(77); return ecoPonte(); };
export const MUSICAS = { acao: musicaAcao, chefe: musicaChefe };

// dentro do Worker: fabrica e devolve um a um
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) self.onmessage = () => {
  { const c = fazerEco(); self.postMessage({ eco: c }, c.map(x => x.buffer)); } for (const n in SONS) { const x = [fazerSom(n)].flat(); self.postMessage({ som: n, x }, x.map(c => c.buffer)); }
  for (const n in MUSICAS) { const { E, D, seg } = MUSICAS[n](); self.postMessage({ musica: n, E, D, seg }, [E.buffer, D.buffer]); }
  self.postMessage({ fim: true });
};

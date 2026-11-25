// Sons "de verdade" feitos por conta física: tiro em camadas (pressão do cano, gás, estalo do projétil, ferrolho, cápsula),
// metal por ressonância (cada peça vibra nas próprias frequências), botas no asfalto, equipamento, vozes de tropa e eco da ponte.
import { TAXA, SR, rnd, novo, gerar, somar, mapa, filtro, sopro, cai, sobeDesce, sat, branco, escorrega } from './sintese.js';
const PI2 = Math.PI * 2, entre = (a, b) => a + (b - a) * rnd(), lista = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

// ---------- tijolos ----------
// onda de pressão de uma explosão no ar (sobe num instante, cai abaixo de zero e volta)
const pressao = (seg, T, b = 1) => gerar(seg, t => t < T * 9 ? (1 - t / T) * Math.exp(-b * t / T) : 0);
// metal/plástico/madeira: um toque curto faz vibrar várias frequências próprias. modos: [freq, duração, força]
function ressoa(seg, modos, { toque = .00024, t0 = 0, desafina = .015 } = {}) {
  const o = novo(seg), i0 = Math.round(t0 * SR), nt = Math.max(2, Math.round(toque * SR)), exc = Float32Array.from({ length: nt }, (_, i) => Math.sin(Math.PI * (i + .5) / nt) * (.55 + .45 * (rnd() * 2 - 1)));
  for (const [f0, tau, g] of modos) { const f = f0 * (1 + (rnd() - .5) * 2 * desafina), w = PI2 * f / SR, r = Math.exp(-1 / (tau * SR)), a1 = 2 * r * Math.cos(w), a2 = -r * r, k = g * Math.sin(w); let y1 = 0, y2 = 0; const fim = Math.min(o.length, i0 + Math.round(tau * 8 * SR)); for (let i = i0; i < fim; i++) { const e = i - i0 < nt ? exc[i - i0] : 0, y = k * e + a1 * y1 + a2 * y2; y2 = y1; y1 = y; o[i] += y; } }
  return o;
}
const ACO = (f, tau, n = 7) => lista(n, k => [f * [1, 1.52, 2.27, 2.94, 3.83, 4.71, 5.9, 7.1][k], tau / (1 + k * .38), 1 / (1 + k * .32)]); // peça maciça de aço
const CHAPA = (f, tau) => lista(11, k => [f * [1, 1.34, 1.71, 2.16, 2.63, 3.18, 3.9, 4.6, 5.4, 6.5, 7.9][k], tau * (1.15 - k * .07), .9 / (1 + k * .16)]); // chapa grande
const OCO = (f, tau) => [[f, tau, 1], [f * 1.47, tau * .8, .7], [f * 2.31, tau * .6, .45], [f * 3.6, tau * .4, .25]];
const tapa = (seg, f, q, tau, at = .0004) => filtro(sopro(seg, t => cai(t, tau, at)), 'bp', f, q);
// ruído que anda devagar (vento, fogo, respiração): nunca se repete igual
function vaga(seg, hz) { const o = novo(seg), passo = Math.max(1, Math.round(SR / hz)); let a = branco(), b = branco(); for (let i = 0; i < o.length; i++) { const k = i % passo; if (!k) { a = b; b = branco(); } const u = k / passo; o[i] = a + (b - a) * u * u * (3 - 2 * u); } return o; }
const modula = (x, m, fn) => { for (let i = 0; i < x.length; i++) x[i] *= fn(m[i], i / SR); return x; };
// reflexões curtas do chão e das muretas, dentro do próprio som
function perto(x, g = .3) { const o = novo(x.length / SR + .07); somar(o, x); let y = filtro(x, 'lp', 3800); somar(o, y, entre(.0024, .0034), g); y = filtro(x, 'lp', 2400); somar(o, y, entre(.017, .022), g * .55); somar(o, y, entre(.041, .05), g * .42); return o; }

// ---------- tiro ----------
// T = duração da pressão (arma maior = mais longa); estalo = projétil mais rápido que o som; gas = corpo do tiro; trem = ferrolho
function disparo({ seg, T, gas, tauGas, f0, f1, estalo = 0, grave = .5, fGrave = 120, trem = .3, fTrem = 2100, volta = .05, capsula = 0, longe = 0 }) {
  const o = novo(seg), ini = .0015;
  if (estalo) { somar(o, filtro(pressao(.004, .00012, .8), 'hp', 1800), 0, estalo); somar(o, tapa(.02, 5200, .8, .0022, .0001), 0, estalo * .8); }
  const p = pressao(seg, T, .9); somar(o, p, ini, 1.25); somar(o, filtro(p, 'lp', 3000), ini + .0028, .5);
  // gás saindo do cano: começa largo e vai fechando
  const g = sopro(seg, t => cai(t, tauGas, .0003) + .35 * cai(t, tauGas * 3.2, .002)); somar(o, filtro(g, 'lp', t => f1 + (f0 - f1) * Math.exp(-t / (tauGas * .9)), .8), ini, gas);
  somar(o, tapa(seg, 900, .55, tauGas * 1.5), ini, gas * .8); somar(o, tapa(seg, 2300, .7, tauGas * .8), ini, gas * .6);
  somar(o, escorrega(seg, fGrave * 2.1, fGrave * .7, .014, t => cai(t, .034)), ini, grave);
  let m = mapa(o, v => sat(v, 1.5)); if (longe) m = filtro(m, 'lp', longe);
  const x = perto(m, .34), r = novo(Math.max(x.length / SR, volta + .16, capsula ? .62 : 0)); somar(r, x);
  // ferrolho: vai para trás (mais abafado) e bate na frente (mais claro)
  if (trem) { somar(r, ressoa(.1, ACO(fTrem * .62, .006, 6)), .012 + entre(0, .003), trem * 2.2); somar(r, ressoa(.14, ACO(fTrem, .0085)), volta + entre(0, .004), trem * 3.4); somar(r, tapa(.05, 3400, 1.2, .006), volta, trem * .9); }
  if (capsula) somar(r, tilinta(.3, 4300), .3, capsula);
  return r;
}
// cápsula de latão quicando no asfalto
function tilinta(seg, f) { const o = novo(seg + .12); let t = 0, d = entre(.075, .1), g = 1; while (t < seg) { somar(o, ressoa(.06, [[f * entre(.97, 1.03), .013, 1], [f * 1.63, .01, .7], [f * 2.37, .006, .5]], { toque: .0003 }), t, g); t += d; d *= .66; g *= .62; if (d < .012) break; } return o; }
const TIROS = {
  pistola: () => disparo({ seg: .24, T: entre(.00055, .0007), gas: 1.15, tauGas: .0125, f0: 7200, f1: 900, grave: .42, fGrave: entre(128, 150), trem: .2, fTrem: entre(2500, 2850), volta: .046 }),
  sub: () => disparo({ seg: .17, T: entre(.00042, .00052), gas: 1, tauGas: .009, f0: 8200, f1: 1200, grave: .28, fGrave: entre(150, 175), trem: .26, fTrem: entre(2900, 3300), volta: .034 }),
  fuzil: () => disparo({ seg: .28, T: entre(.00075, .00092), gas: 1.35, tauGas: .016, f0: 8600, f1: 800, estalo: 1.1, grave: .55, fGrave: entre(104, 122), trem: .18, fTrem: entre(2150, 2450), volta: .052 }),
};
// cama da rajada: dezenas de tiros do pelotão, cada um com a própria distância, lado e afinação (dois canais, em laço)
function cama(tipo, porSeg, seg = 2.2) {
  const n = Math.round(seg * SR), E = new Float32Array(n), D = new Float32Array(n), perto_ = lista(5, () => TIROS[tipo]()), longe = perto_.map(x => filtro(x, 'lp', 2600)), q = Math.round(porSeg * seg);
  for (let k = 0; k < q; k++) { const dist = rnd(), x = dist > .5 ? longe[k % 5] : perto_[k % 5], vel = entre(.92, 1.08), g = (1.05 - dist * .75) * entre(.7, 1), pan = entre(-.85, .85), ge = g * Math.cos((pan + 1) * Math.PI / 4), gd = g * Math.sin((pan + 1) * Math.PI / 4), i0 = Math.floor((k + rnd() * 1.6) / q * n); for (let i = 0; ; i++) { const p = i * vel, a = p | 0; if (a + 1 >= x.length) break; const v = x[a] + (x[a + 1] - x[a]) * (p - a), j = (i + i0) % n; E[j] += v * ge; D[j] += v * gd; } }
  return fecharPar(E, D, .62, 1.25);
}
function fecharPar(E, D, pico, k) { let m = 0; for (const x of [E, D]) for (const v of x) m = Math.max(m, Math.abs(v)); for (const x of [E, D]) for (let i = 0; i < x.length; i++) x[i] = sat(x[i] / m, k) * pico; return { E, D }; }
// metralhadora giratória: motor, engrenagem, esteira de munição e 20 tiros por segundo
function giratoria() {
  const cad = 20, n = 32, dur = n / cad, o = novo(dur + .3), b = lista(6, () => disparo({ seg: .12, T: entre(.0006, .0007), gas: 1.1, tauGas: .0105, f0: 7600, f1: 1000, estalo: .7, grave: .5, fGrave: entre(112, 128), trem: 0 }));
  for (let k = 0; k < n; k++) { somar(o, b[k % 6], k / cad + entre(0, .003), entre(.82, 1)); somar(o, ressoa(.05, ACO(entre(2600, 3000), .004, 5)), k / cad + .024 + entre(0, .004), .5); }
  const g = gerar(dur + .3, t => { let v = 0; for (const [h, a] of [[1, .5], [2, .7], [3, .4], [5, .22]]) v += Math.sin(PI2 * 236 * h * t + h) * a; return v * .075; }); somar(o, filtro(g, 'hp', 180), 0, 1); somar(o, filtro(sopro(dur + .3, () => .12), 'bp', 1500, .7), 0, 1);
  const f = novo(dur); for (let i = 0; i < o.length; i++) f[i % f.length] += o[i]; return f;
}
const motor = (seg, f, amp) => { let p = 0; return gerar(seg, t => { p += f(t) / SR; let v = 0; for (const [h, a] of [[1, .5], [2, .8], [3, .45], [5, .25], [8, .12]]) v += Math.sin(PI2 * p * h) * a; return v * amp(t) * .35; }); };
const giroLiga = () => { const n = .5, o = novo(n); somar(o, motor(n, t => 60 + 176 * Math.min(1, t / .34) ** .7, t => sobeDesce(t, n, .06, .1))); somar(o, filtro(sopro(n, t => sobeDesce(t, n, .1, .1) * .5), 'bp', t => 500 + 1800 * t, .8)); somar(o, ressoa(.1, ACO(1900, .01)), 0, 1.6); return o; };
const giroPara = () => { const n = 1.1, o = novo(n); somar(o, motor(n, t => 40 + 196 * Math.exp(-t * 3.1), t => Math.exp(-t * 2.4) * Math.min(1, t / .01))); for (let k = 0, t = .02; t < .9; k++) { somar(o, ressoa(.06, ACO(entre(2300, 2900), .006, 5)), t, .7 * Math.exp(-t * 1.6)); t += .04 + k * .012; } somar(o, tilinta(.3, 4600), .12, .5); return o; };
// bazuca: clique, estouro do lançamento, sopro para trás e foguete indo embora
function bazuca() {
  const n = 1.35, o = novo(n); somar(o, ressoa(.06, ACO(2100, .006)), 0, .8);
  somar(o, pressao(.3, .0026, .75), .018, 1.5); somar(o, filtro(sopro(.5, t => cai(t, .05, .0006)), 'lp', t => 500 + 5200 * Math.exp(-t * 16), .7), .018, 1.7); somar(o, escorrega(.5, 150, 42, .05, t => cai(t, .1)), .018, .8); somar(o, filtro(sopro(.4, t => cai(t, .07, .004)), 'bp', 1300, .6), .02, 1.3);
  const r = filtro(filtro(sopro(n, t => t < .05 ? 0 : Math.min(1, (t - .05) / .05) * Math.exp(-(t - .05) * 2.5)), 'bp', t => 2900 * Math.exp(-t * 1.5) + 380, .75), 'hp', 260); modula(r, vaga(n, 55), v => .72 + .5 * v); somar(o, r, 0, 1.5); somar(o, filtro(r, 'lp', 900), 0, .8);
  return perto(mapa(o, v => sat(v, 1.3)), .3);
}
const recarrega = () => { const o = novo(.9); somar(o, ressoa(.1, ACO(1500, .011)), 0, 1.8); somar(o, raspa(.16, 900, 2100), .08, .7); somar(o, ressoa(.2, OCO(310, .03)), .25, 2.2); somar(o, tapa(.1, 700, .8, .02), .25, 1); somar(o, ressoa(.16, ACO(1850, .014)), .44, 2.4); somar(o, ressoa(.1, ACO(2600, .008)), .5, 1.2); return o; };
// lança-chamas: chiado do bico, fogo turbulento com ronco e estalos
function chamas() {
  const n = 3, fogo = sopro(n, () => 1), o = novo(n), a = vaga(n, 13), b = vaga(n, 31);
  const ronco = filtro(fogo, 'lp', 420, .6); modula(ronco, a, v => .75 + .42 * v); somar(o, ronco, 0, 1.5); const meio = filtro(sopro(n, () => 1), 'bp', 950, .5); modula(meio, b, v => .6 + .5 * v); somar(o, meio, 0, .95); somar(o, filtro(sopro(n, () => 1), 'bp', 4600, .6), 0, .3);
  for (let k = 0; k < 70; k++) { const t = rnd() * (n - .06); somar(o, tapa(.04, entre(1400, 4200), 2.2, entre(.002, .007)), t, entre(.3, 1.1)); if (k % 6 === 0) somar(o, tapa(.1, entre(180, 360), .9, .03), t, 1.6); }
  return lacoLiso(mapa(o, v => sat(v, 1.1)), .4);
}
const chamaLiga = () => { const o = novo(.6); for (const t of [0, .05, .1]) somar(o, ressoa(.04, ACO(3100, .004)), t, .8); somar(o, filtro(sopro(.5, t => cai(t, .12, .02)), 'lp', t => 300 + 2600 * Math.exp(-t * 8), .7), .1, 2); somar(o, escorrega(.4, 130, 48, .06, t => cai(t, .1, .01)), .1, .8); return o; };
const chamaPara = () => { const o = novo(.6); somar(o, filtro(sopro(.6, t => cai(t, .13, .01)), 'bp', t => 900 + 3200 * Math.min(1, t * 3), .7), 0, 1); somar(o, ressoa(.1, ACO(1700, .012)), .02, 1.4); return o; };
function lacoLiso(x, cruza) { const n = Math.round(cruza * SR), o = new Float32Array(x.length - n); for (let i = 0; i < o.length; i++) o[i] = i < n ? x[i] * Math.sqrt(i / n) + x[o.length + i] * Math.sqrt(1 - i / n) : x[i]; return o; }

// ---------- mecânica das armas ----------
const raspa = (seg, f0, f1) => { const o = filtro(sopro(seg, t => sobeDesce(t, seg, seg * .25, seg * .35)), 'bp', t => f0 + (f1 - f0) * t / seg, 1.1), m = vaga(seg, 190); return modula(o, m, v => .6 + .8 * Math.abs(v)); };
const estala = (f, g = 1) => { const o = novo(.12); somar(o, ressoa(.12, ACO(f, .0065, 6)), 0, 2.4 * g); somar(o, tapa(.03, f * 1.7, 1, .0025), 0, .7 * g); return o; };
const encaixa = (g = 1) => { const o = novo(.2); somar(o, ressoa(.2, OCO(entre(330, 380), .022)), 0, 2.4 * g); somar(o, tapa(.08, 1100, .7, .012), 0, .9 * g); somar(o, estala(entre(2300, 2600), .9 * g), .012); return o; };
const ferrolho = (f = 1750, g = 1) => { const o = novo(.55); somar(o, raspa(.09, 1500, 3000), 0, .9 * g); somar(o, estala(f * .85, .9 * g), .085); somar(o, raspa(.05, 2800, 1700), .17, .6 * g); somar(o, ressoa(.24, ACO(f, .017, 8)), .215, 3.4 * g); somar(o, ressoa(.3, OCO(f * .22, .02)), .215, 1.6 * g); somar(o, tapa(.06, 3000, .9, .006), .215, 1.1 * g); somar(o, ressoa(.3, [[1130, .07, .25], [1710, .06, .2], [2930, .05, .16]]), .22, 1.1 * g); return o; };
const carregador = (g = 1) => { const o = novo(.62); somar(o, estala(3300, .6 * g), 0); somar(o, raspa(.1, 2400, 1500), .02, .7 * g); somar(o, tapa(.08, 1500, .6, .03, .02), .16, .5 * g); somar(o, raspa(.07, 1300, 2200), .27, .6 * g); somar(o, encaixa(1.1 * g), .35); return o; };
// o pelotão inteiro faz quase ao mesmo tempo: cópias com pequenas diferenças de tempo, altura e distância
function emGrupo(fn, n, espalha, seg) { const o = novo(seg); for (let k = 0; k < n; k++) { let x = fn(k); if (k) x = filtro(x, 'lp', entre(3000, 6500)); const v = k ? entre(.94, 1.06) : 1, y = new Float32Array(Math.floor(x.length / v)); for (let i = 0; i < y.length; i++) { const p = i * v, a = p | 0; y[i] = (x[a] || 0) + ((x[a + 1] || 0) - (x[a] || 0)) * (p - a); } somar(o, y, k ? entre(.01, espalha) : 0, k ? entre(.25, .5) : 1); } return o; }
const trocaArma = (f, g = 1) => emGrupo(() => { const o = novo(1.15); somar(o, carregador(g), 0); somar(o, ferrolho(f, g), .56); return o; }, 5, .16, 1.5);
const trocaSub = () => { const o = trocaArma(2150); somar(o, equipa(.5), 0, .7); return perto(o, .3); };
const trocaFuzil = () => { const o = trocaArma(1650, 1.1); somar(o, equipa(.6), 0, .8); return perto(o, .3); };
const cadencia = () => perto(emGrupo(() => { const o = novo(.9); [0, .2, .35].forEach((t, i) => somar(o, ferrolho(1900 + i * 160, .8 + i * .1), t)); return o; }, 3, .07, 1.2), .25);
const entraM = () => { const o = novo(1.5); somar(o, estala(1500, 1.2), 0); somar(o, ressoa(.3, OCO(240, .03)), .02, 2); for (let k = 0; k < 9; k++) somar(o, estala(entre(2500, 3400), .55), .16 + k * .045 + entre(0, .012)); somar(o, ressoa(.3, OCO(280, .03)), .62, 2.6); somar(o, estala(1700, 1.2), .64); somar(o, giroLiga(), .78, 1.1); somar(o, equipa(.5), .1, .6); return perto(o, .25); };
const entraB = () => { const o = novo(1.4); somar(o, recarrega(), .05, 1.15); somar(o, ressoa(.3, OCO(210, .04)), .82, 2.4); somar(o, estala(1500, 1.1), .86); somar(o, equipa(.7), 0, .7); return perto(o, .28); };
const entraL = () => { const o = novo(1.4); const r = filtro(sopro(.35, t => sobeDesce(t, .35, .03, .2)), 'bp', t => 2600 + 900 * Math.sin(t * 30), 3); somar(o, r, 0, .35); somar(o, estala(1900, .9), .22); somar(o, filtro(sopro(.5, t => sobeDesce(t, .5, .05, .2)), 'bp', 5200, .8), .26, .4); somar(o, chamaLiga(), .6, 1.2); somar(o, equipa(.5), 0, .6); return perto(o, .2); };

// ---------- tropa ----------
// pano, fivelas e cantil balançando
function equipa(seg) { const o = novo(seg + .1); for (let k = 0; k < seg * 12; k++) { const t = rnd() * seg; somar(o, filtro(sopro(.09, u => sobeDesce(u, .09, .025, .05)), 'bp', entre(700, 2200), .9), t, entre(.3, .7)); if (k % 2) somar(o, ressoa(.06, ACO(entre(3100, 4600), .006, 4)), t + entre(0, .04), entre(.12, .3)); } return o; }
// uma bota no asfalto: calcanhar, sola raspando e pedrinhas
function bota(g = 1) { const o = novo(.2); somar(o, escorrega(.12, entre(150, 190), 62, .012, t => cai(t, .02)), 0, .42 * g); somar(o, tapa(.1, entre(480, 700), .7, .013), 0, 1.5 * g); somar(o, tapa(.08, entre(1700, 2600), .8, .012, .001), .002, 1 * g); const t1 = entre(.055, .08); somar(o, tapa(.07, entre(700, 1100), .8, .014, .003), t1, .55 * g); for (let k = 0; k < 4; k++) somar(o, tapa(.012, entre(3200, 6200), 2, .0014, .0002), entre(.005, .1), entre(.1, .35) * g); return o; }
// soldados chegando correndo e se juntando ao pelotão (dois canais)
function chegada(q, seg) {
  const n = Math.round((seg + .3) * SR), E = new Float32Array(n), D = new Float32Array(n), bs = lista(6, () => bota());
  const por = (x, t, g, pan) => { const i0 = Math.round(t * SR), ge = g * Math.cos((pan + 1) * Math.PI / 4), gd = g * Math.sin((pan + 1) * Math.PI / 4); for (let i = 0; i < x.length && i + i0 < n; i++) { E[i + i0] += x[i] * ge; D[i + i0] += x[i] * gd; } };
  for (let s = 0; s < q; s++) { const pan = entre(-.9, .9), t0 = entre(0, seg * .25), passo = entre(.2, .25), dur = seg * entre(.55, .9), longe = entre(.5, 1); for (let t = t0, k = 0; t < t0 + dur && t < seg; t += passo * entre(.94, 1.06), k++) { const u = (t - t0) / dur; por(bs[(s + k) % 6], t, longe * (.35 + .65 * Math.sin(Math.PI * Math.min(1, u * 1.15 + .1))) / Math.sqrt(q) * 1.9, pan * (1 - u * .4)); } }
  for (const pan of [-.5, .5]) por(equipa(seg * .85), .02, .5, pan); return fecharPar(E, D, .6, 1.4);
}
// voz humana: pulso da garganta, quatro formantes que andam, sopro e um fio de rouquidão de quem grita
const FORM = { a: [760, 1180, 2500, 3500], e: [520, 1780, 2500, 3550], i: [320, 2200, 2900, 3600], o: [500, 860, 2450, 3400], u: [340, 760, 2300, 3300], h: [560, 1400, 2500, 3400] };
function fala(seg, f0, trilha, { grito = .5, tom = 1 } = {}) {
  let p = 0, jit = 0, sh = 1; const fonte = gerar(seg, t => { jit += (branco() - jit) * .004; const f = f0(t) * tom * (1 + jit * 1.6); const q0 = Math.floor(p); p += f / SR; if (Math.floor(p) !== q0) sh = 1 + branco() * .09; const s = p % 1, ab = .58; const v = s < ab ? 3 * (s / ab) ** 2 - 2 * (s / ab) ** 3 - .5 : s < ab + .12 ? (1 - (s - ab) / .12) * 1 - .5 : -.5; return v * sh; });
  const dif = novo(seg); for (let i = 1; i < dif.length; i++) dif[i] = (fonte[i] - fonte[i - 1]) * 7;
  const amp = t => { let k = 0; while (k < trilha.length - 1 && trilha[k + 1][0] <= t) k++; const a = trilha[k], b = trilha[k + 1] || a, u = b === a ? 0 : Math.min(1, (t - a[0]) / (b[0] - a[0])); return [a, b, u * u * (3 - 2 * u)]; };
  const f = k => t => { const [a, b, u] = amp(t); return (FORM[a[1]][k] + (FORM[b[1]][k] - FORM[a[1]][k]) * u) * (1 + (tom - 1) * .3); }, vol = t => { const [a, b, u] = amp(t); return a[2] + (b[2] - a[2]) * u; }, ar = t => { const [a, b, u] = amp(t); return (a[3] ?? .06) + ((b[3] ?? .06) - (a[3] ?? .06)) * u; };
  const ex = novo(seg); for (let i = 0; i < ex.length; i++) { const t = i / SR; ex[i] = dif[i] * vol(t) + branco() * ar(t) * .5; }
  const o = novo(seg); [[1, 5.5], [.75, 7.5], [.42, 9], [.2, 10]].forEach(([g, q], k) => somar(o, filtro(ex, 'bp', f(k), q), 0, g * 1.4)); somar(o, filtro(ex, 'lp', 300), 0, .12);
  return filtro(mapa(filtro(o, 'hp', 150), v => sat(v * 1.8, 1 + grito)), 'lp', 5200);
}
const FALAS = [ // gritos curtos de comando, sem frase de ninguém
  () => fala(.42, t => 205 - 110 * Math.max(0, t - .08) + 40 * Math.min(1, t / .06), [[0, 'h', 0, .5], [.05, 'a', 1, .1], [.16, 'a', 1], [.3, 'i', .7], [.41, 'i', 0, .1]], { grito: .9, tom: entre(.86, 1.02) }),
  () => fala(.36, t => 190 + 60 * Math.min(1, t / .07) - 150 * Math.max(0, t - .1), [[0, 'h', 0, .7], [.05, 'e', 1, .12], [.15, 'e', 1], [.26, 'i', .6], [.35, 'i', 0, .1]], { grito: .8, tom: entre(.84, 1) }),
  () => fala(.5, t => (t < .2 ? 175 : 215) - 60 * Math.max(0, t - .24), [[0, 'o', 0, .02], [.03, 'o', .9], [.15, 'o', .7], [.19, 'h', .08, .15], [.23, 'a', 1], [.36, 'a', .8], [.49, 'a', 0, .1]], { grito: .8, tom: entre(.82, .98) }),
  () => fala(.24, t => 180 + 50 * Math.min(1, t / .05) - 200 * Math.max(0, t - .1), [[0, 'h', 0, .7], [.04, 'u', 1, .12], [.14, 'u', .9], [.19, 'u', 0, .02]], { grito: .9, tom: entre(.86, 1.02) }),
];
// coro: a mesma ordem respondida por várias gargantas, com as da frente mais claras
function coro(k, n, seg) { const o = novo(seg); for (let i = 0; i < n; i++) { const x = FALAS[(k + (i % 3 === 2 ? 1 : 0)) % 4](); somar(o, i ? filtro(x, 'lp', entre(1600, 3600)) : x, i ? entre(.02, .12) : 0, i ? entre(.3, .6) : 1); } return perto(o, .3); }
const lamento = () => { const o = novo(.6); for (let i = 0; i < 4; i++) { const tom = entre(.78, 1.05); somar(o, filtro(fala(.42, t => 150 - 120 * t, [[0, 'u', 0, .1], [.04, 'o', 1, .12], [.2, 'u', .7], [.41, 'u', 0, .1]], { grito: .4, tom }), 'lp', entre(1400, 2600)), i * .05 + entre(0, .04), .6); } return o; };

// ---------- portões e prêmios ----------
const vento = (seg, f0, f1, q = .9) => filtro(sopro(seg, t => Math.sin(Math.PI * Math.min(1, t / seg)) ** 1.6), 'bp', t => f0 * (f1 / f0) ** (t / seg), q);
// passar pelo portão bom: ar, batida cheia e a estrutura de metal respondendo
const passaBom = () => { const o = novo(.95); somar(o, vento(.34, 380, 3400), 0, 1.5); somar(o, escorrega(.35, 165, 58, .03, t => cai(t, .07)), .13, .95); somar(o, tapa(.14, 520, .6, .026), .13, 1.5); somar(o, ressoa(.75, CHAPA(392, .085)), .13, 1.5); somar(o, ressoa(.5, ACO(1180, .045)), .14, 1.2); somar(o, estala(2500, .8), .2); somar(o, vento(.3, 2600, 900), .2, .4); return perto(o, .28); };
const passaMuito = () => { const o = novo(1.2); somar(o, passaBom(), 0); somar(o, escorrega(.4, 190, 54, .04, t => cai(t, .1)), .27, .9); somar(o, tapa(.16, 620, .6, .03), .27, 1.4); somar(o, ressoa(.7, CHAPA(523, .1)), .27, 1.4); return o; };
// portão ruim: porta de aço batendo pesado, corrente e ronco de chapa
const passaRuim = () => { const o = novo(1.2); somar(o, vento(.3, 1500, 240), 0, 1.1); somar(o, pressao(.2, .004, .7), .12, .9); somar(o, escorrega(.6, 120, 40, .05, t => cai(t, .12)), .12, 1.1); somar(o, tapa(.2, 300, .6, .045), .12, 1.6); somar(o, ressoa(1, CHAPA(127, .16)), .12, 2.2); somar(o, ressoa(.8, CHAPA(183, .1)), .135, 1.2); for (let k = 0; k < 8; k++) somar(o, ressoa(.07, ACO(entre(1500, 2400), .009, 5)), .2 + k * .042 + entre(0, .02), .55 * (1 - k * .09)); somar(o, lamento(), .2, .75); return perto(mapa(o, v => sat(v, 1.2)), .3); };
// bala na chapa e o contador do portão subindo um dente
const tinido = k => { const o = novo(.22); somar(o, pressao(.01, .0002, .8), 0, .6); somar(o, ressoa(.22, CHAPA(620 + k * 170, .02 + k * .006)), 0, 1.1); somar(o, tapa(.03, 4200, .9, .003), 0, .8); return o; };
const dente = () => { const o = novo(.16); somar(o, estala(1900, 1), 0); somar(o, ressoa(.16, OCO(420, .014)), 0, 1.3); somar(o, ressoa(.1, ACO(3000, .012, 4)), .004, .5); return o; };
const virou = () => { const o = novo(.95); for (let k = 0; k < 6; k++) somar(o, estala(1500 + k * 170, .7 + k * .05), k * .032); somar(o, ressoa(.6, CHAPA(330, .09)), .23, 1.6); somar(o, escorrega(.3, 170, 60, .03, t => cai(t, .07)), .23, .9); somar(o, ressoa(.3, ACO(1300, .04)), .24, 1.6); return perto(o, .25); };
const madeira = (n = 14) => { const o = novo(.6); for (let k = 0; k < n; k++) { const t = rnd() ** 1.8 * .3; somar(o, ressoa(.12, OCO(entre(300, 900), entre(.008, .02)), { toque: .0004 }), t, entre(.5, 1.3)); somar(o, tapa(.05, entre(1200, 3400), 1.2, entre(.003, .009), .0002), t, entre(.4, 1)); } somar(o, escorrega(.25, 160, 64, .02, t => cai(t, .05)), 0, .9); return o; };
const reforco = () => { const o = novo(1.1); somar(o, madeira(18), 0, 1.1); somar(o, ressoa(.4, CHAPA(300, .06)), .01, 1.1); somar(o, estala(1700, .9), .22); somar(o, equipa(.5), .2, .7); return perto(o, .3); };
const caixaArma = () => { const o = novo(1.3); somar(o, estala(1500, 1.2), 0); somar(o, ressoa(.5, CHAPA(250, .08)), .02, 1.6); somar(o, ressoa(.3, OCO(210, .03)), .02, 1.6); somar(o, rangido(.2, 620, 980), .1, .5); somar(o, ferrolho(1700, 1.1), .42); somar(o, equipa(.4), .2, .5); return perto(o, .28); };
// dobradiça rangendo: pequenos solavancos excitando o metal
function rangido(seg, f0, f1) { const o = novo(seg + .1); for (let t = 0, k = 0; t < seg; k++) { const u = t / seg, f = f0 + (f1 - f0) * u; somar(o, ressoa(.05, [[f, .012, 1], [f * 2.02, .009, .6], [f * 3.05, .006, .4]], { toque: .0008, desafina: .03 }), t, .6 + .4 * rnd()); t += 1 / entre(70, 130); } return o; }
const gaiola = () => { const o = novo(1.3); somar(o, pressao(.02, .0004, .8), 0, 1); somar(o, estala(1300, 1.5), 0); somar(o, ressoa(.2, ACO(900, .03)), .01, 1.4); for (let k = 0; k < 6; k++) somar(o, ressoa(.06, ACO(entre(1700, 2600), .009, 5)), .06 + k * .035, .6); somar(o, rangido(.32, 480, 900), .14, .55); somar(o, ressoa(.7, CHAPA(210, .1)), .5, 1.7); somar(o, escorrega(.2, 130, 60, .02, t => cai(t, .05)), .5, .7); return perto(o, .3); };
const escudo = () => { const o = novo(.7); somar(o, ressoa(.7, CHAPA(240, .07)), 0, 1.8); somar(o, tapa(.1, 1800, .7, .012), 0, 1); somar(o, ressoa(.4, CHAPA(310, .05)), .14, .9); somar(o, ressoa(.3, CHAPA(280, .04)), .25, .5); return o; };
const batida = () => { const o = novo(.8); somar(o, pressao(.1, .002, .8), 0, 1); somar(o, escorrega(.3, 130, 48, .03, t => cai(t, .07)), 0, 1); somar(o, ressoa(.6, CHAPA(190, .06)), 0, 1.6); somar(o, tapa(.12, 900, .6, .025), 0, 1.3); for (let k = 0; k < 14; k++) somar(o, ressoa(.05, ACO(entre(3200, 6400), .006, 3)), .03 + rnd() ** 2 * .4, entre(.1, .35)); return o; };

// ---------- perigos e golpes novos ----------
const desaba = () => { const n = 1.9, o = novo(n); for (let k = 0; k < 5; k++) somar(o, pressao(.02, entre(.0005, .001), .8), k * .05 + entre(0, .03), entre(.6, 1)); const r = filtro(sopro(n, t => cai(t, .5, .08)), 'lp', t => 260 + 1800 * Math.exp(-t * 3), .6); modula(r, vaga(n, 26), v => .7 + .6 * v); somar(o, r, 0, 2); somar(o, escorrega(1.4, 84, 30, .3, t => cai(t, .4, .03)), .05, .8); for (let k = 0; k < 26; k++) somar(o, ressoa(.14, OCO(entre(160, 620), entre(.012, .03))), .06 + rnd() ** 1.4 * 1.2, entre(.5, 1.6)); for (let k = 0; k < 5; k++) somar(o, ressoa(.3, CHAPA(entre(180, 320), .05)), .1 + rnd() * .7, .6); return perto(mapa(o, v => sat(v, 1.3)), .3); };
const agua = () => { const n = 1.2, o = novo(n); somar(o, filtro(sopro(n, t => cai(t, .1, .004) + .4 * cai(t - .05, .24, .04)), 'bp', t => 700 + 1500 * Math.min(1, t * 4), .5), 0, 2); somar(o, escorrega(.3, 170, 60, .03, t => cai(t, .07)), 0, .9); for (let k = 0; k < 30; k++) { const f = entre(500, 2300), t = .05 + rnd() ** 1.3 * .9; let p = 0; somar(o, gerar(.06, u => { p += PI2 * f * (1 + u * 5) / SR; return Math.sin(p) * cai(u, .011, .001); }), t, entre(.08, .3)); } return o; };
const jorro = () => { const n = 1.6, o = novo(n); somar(o, estala(1300, 1.4), 0); somar(o, ressoa(.3, CHAPA(300, .06)), .01, 1.2); const j = filtro(sopro(n, t => sobeDesce(t, n, .04, .9)), 'bp', t => 2600 - 900 * t, .45); modula(j, vaga(n, 40), v => .8 + .35 * v); somar(o, j, .02, 1.6); somar(o, agua(), .05, .6); return o; };
const fogoSobe = () => { const n = 1.1, o = novo(n), f = filtro(sopro(n, t => cai(t, .22, .03)), 'lp', t => 350 + 2600 * Math.exp(-t * 5), .6); modula(f, vaga(n, 20), v => .75 + .45 * v); somar(o, f, 0, 1.6); const g = filtro(sopro(n, t => cai(t, .2, .02)), 'bp', 1100, .5); modula(g, vaga(n, 33), v => .7 + .5 * v); somar(o, g, 0, 1.3); somar(o, escorrega(.5, 120, 42, .07, t => cai(t, .13, .01)), 0, .4); for (let k = 0; k < 16; k++) somar(o, tapa(.03, entre(1500, 4000), 2, .004, .0002), .05 + rnd() * .7, entre(.3, .8)); return o; };
const gosma = () => { const o = novo(.5); somar(o, filtro(sopro(.4, t => cai(t, .05, .004)), 'bp', t => 400 + 900 * Math.exp(-t * 14), 1.1), 0, 1.8); for (let k = 0; k < 5; k++) { let p = 0; const f = entre(240, 520); somar(o, gerar(.09, u => { p += PI2 * f * (1 + u * 9) / SR; return Math.sin(p) * cai(u, .02, .002); }), .01 + k * .03, .5); } return o; };
const cuspe = () => { const o = novo(.4); somar(o, filtro(sopro(.2, t => sobeDesce(t, .2, .02, .1)), 'bp', t => 900 + 2400 * t, 1), 0, 1); somar(o, filtro(sopro(.2, t => cai(t, .03)), 'bp', 600, 1.2), .05, 1.1); return o; };
const arremesso = () => { const o = novo(.9); somar(o, vento(.6, 180, 900, .8), 0, 2); somar(o, rangido(.28, 260, 420), .02, .7); somar(o, ressoa(.3, CHAPA(150, .06)), 0, .9); return o; };
// coração acelerado e respiração funda
const adrenalina = () => { const n = 1.7, o = novo(n); for (const t of [.02, .52, .98]) for (const [d, g] of [[0, 1], [.14, .75]]) { somar(o, escorrega(.22, 130, 62, .02, u => cai(u, .045, .003)), t + d, .7 * g); somar(o, tapa(.1, 360, .8, .022, .002), t + d, 1.6 * g); } somar(o, filtro(sopro(.7, t => sobeDesce(t, .7, .35, .2)), 'bp', t => 900 + 1100 * t, .9), .1, .8); somar(o, filtro(sopro(.5, t => sobeDesce(t, .5, .08, .35)), 'bp', t => 1700 - 1400 * t, .9), .95, .8); return o; };
const estruturaRange = () => { const o = novo(1.6); somar(o, rangido(1.2, 130, 260), 0, 1.2); somar(o, rangido(.8, 310, 190), .4, .6); for (let k = 0; k < 5; k++) somar(o, ressoa(.3, CHAPA(entre(140, 240), .06)), .1 + k * .26, .8); return perto(o, .3); };

// ---------- eco da ponte e da cidade (resposta do lugar, em dois canais) ----------
export function ecoPonte() {
  const n = 1.45, faz = lado => {
    const o = novo(n), ref = [[.018, .5, 5200], [.052 + lado * .006, .6, 4200], [.087 - lado * .009, .34, 3400], [.128 + lado * .012, .4, 3000], [.196 - lado * .017, .44, 2500], [.262 + lado * .02, .3, 2100], [.355 - lado * .024, .34, 1700], [.452 + lado * .03, .22, 1500], [.585 - lado * .03, .2, 1200], [.74 + lado * .04, .13, 1000]];
    for (const [t, g, f] of ref) { const b = filtro(sopro(.05, u => cai(u, .007, .0015)), 'lp', f, .6); somar(o, b, t, g * 1.5); }
    const c = filtro(sopro(n, t => t < .02 ? 0 : Math.exp(-t / .24) * Math.min(1, (t - .02) / .06)), 'lp', t => 4600 * Math.exp(-t * 2.6) + 650, .6); somar(o, c, 0, .34); return filtro(o, 'hp', 130);
  };
  return [faz(0), faz(1)];
}

// nome: [fábrica, volume de pico, laço?, dois canais?, quanto segura a ponta do pico]
export const REAIS = {
  ...Object.fromEntries(['pistola', 'sub', 'fuzil'].flatMap((n, k) => lista(5, i => [n + i, [TIROS[n], [.72, .62, .76][k], 0, 0, [4.6, 4.2, 4.4][k]]]))),
  camaPistola: [() => cama('pistola', 26), .62, 1, 1, 2.2], camaSub: [() => cama('sub', 46), .62, 1, 1, 2.2], camaFuzil: [() => cama('fuzil', 40), .64, 1, 1, 2.2],
  giratoria: [giratoria, .66, 1, 0, 3.4], giroLiga: [giroLiga, .4], giroPara: [giroPara, .42], bazuca: [bazuca, .9], recarrega: [recarrega, .42], chamas: [chamas, .62, 1], chamaLiga: [chamaLiga, .6], chamaPara: [chamaPara, .34],
  ...Object.fromEntries(lista(4, i => ['capsula' + i, [() => tilinta(.3, entre(3700, 5200)), .4]])),
  trocaSub: [trocaSub, .74, 0, 0, 2.8], trocaFuzil: [trocaFuzil, .78, 0, 0, 2.8], cadencia: [cadencia, .7, 0, 0, 2.8], entraM: [entraM, .76, 0, 0, 2.8], entraB: [entraB, .76, 0, 0, 2.8], entraL: [entraL, .74, 0, 0, 2.8],
  entra1: [() => chegada(3, .75), .56, 0, 1, 2.2], entra2: [() => chegada(8, 1.05), .6, 0, 1, 2.2], entra3: [() => chegada(18, 1.35), .66, 0, 1, 2.2], ...Object.fromEntries(lista(4, i => ['ordem' + i, [() => FALAS[i](), .5]])), coro0: [() => coro(0, 6, .85), .56], coro1: [() => coro(2, 7, .9), .56], coro2: [() => coro(3, 6, .7), .56],
  portaoBom: [passaBom, .72, 0, 0, 2.8], portaoMuito: [passaMuito, .76, 0, 0, 2.8], portaoRuim: [passaRuim, .78], tinido0: [() => tinido(0), .42, 0, 0, 3], tinido1: [() => tinido(1), .42, 0, 0, 3], tinido2: [() => tinido(2), .42, 0, 0, 3], dente: [dente, .5], virou: [virou, .7, 0, 0, 2.8],
  reforco: [reforco, .74, 0, 0, 2.8], caixaArma: [caixaArma, .74, 0, 0, 2.8], gaiola: [gaiola, .74, 0, 0, 2.8], escudo: [escudo, .6, 0, 0, 2.8], batida: [batida, .7],
  desaba: [desaba, .92], agua: [agua, .8], jorro: [jorro, .74, 0, 0, 2.8], fogo: [fogoSobe, .84], gosma: [gosma, .5], cuspe: [cuspe, .4], arremesso: [arremesso, .6], adrenalina: [adrenalina, .7], range: [estruturaRange, .6],
};
// acabamento: limpa o subgrave que celular não toca, abre um pouco o médio e o agudo e segura só a pontinha do pico (sem achatar)
export function acabar(x, pico, laco, k = 1.9) {
  const y = filtro(x, 'hp', 62, .7), a = filtro(y, 'hp', 1500, .6), m = filtro(y, 'bp', 620, .5); for (let i = 0; i < y.length; i++) y[i] += a[i] * .28 + m[i] * .3;
  let p = 0; for (const v of y) p = Math.max(p, Math.abs(v)); let q = 0; for (let i = 0; i < y.length; i++) { y[i] = sat(y[i] / (p || 1), k); q = Math.max(q, Math.abs(y[i])); }
  const fim = laco ? 0 : Math.round(.015 * SR); for (let i = 0; i < y.length; i++) y[i] *= pico / (q || 1) * (fim ? Math.min(1, (y.length - i) / fim) : 1); return y;
}

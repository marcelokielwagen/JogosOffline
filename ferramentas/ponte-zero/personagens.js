// Monta os personagens do Ponte Zero a partir do corpo livre (CC0) do MakeHuman e grava um arquivo pequeno.
// Uso: node personagens.js <pasta com base.obj, default.mhskel, default_weights.mhw e os .target> <saida.bin>
// Não faz parte do jogo publicado; só é usado para gerar de novo recursos/personagens.bin.
const fs = require('fs'), path = require('path');
const [, , ENT, SAIDA] = process.argv;
const ler = f => fs.readFileSync(path.join(ENT, f), 'utf8');

// ---------- vetores ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(...a), norm = a => { const l = len(a) || 1; return mul(a, 1 / l); }, lerp = (a, b, t) => add(mul(a, 1 - t), mul(b, t));
const girar = (p, o, eixo, ang) => { const v = sub(p, o), c = Math.cos(ang), s = Math.sin(ang); return add(o, add(add(mul(v, c), mul(cross(eixo, v), s)), mul(eixo, dot(eixo, v) * (1 - c)))); };
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const h3 = (x, y, z) => { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); };
function ruido(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), f = [x - i, y - j, z - k].map(t => t * t * (3 - 2 * t)); let r = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) r += h3(i + a, j + b, k + c) * (a ? f[0] : 1 - f[0]) * (b ? f[1] : 1 - f[1]) * (c ? f[2] : 1 - f[2]);
  return r * 2 - 1;
}

// ---------- corpo base ----------
const OSSOS = ['pelve', 'coluna', 'peito', 'cabeca', 'bracoE', 'antebracoE', 'maoE', 'bracoD', 'antebracoD', 'maoD', 'coxaE', 'canelaE', 'peE', 'coxaD', 'canelaD', 'peD', 'arma'];
const NB = OSSOS.length;
const MAPA = {}; // osso do MakeHuman -> osso simples
const esq = JSON.parse(ler('default.mhskel')), pesos = JSON.parse(ler('default_weights.mhw')).weights;
const RAIZ = {
  root: 0, 'pelvis.L': 0, 'pelvis.R': 0, spine05: 0, spine04: 1, spine03: 1, spine02: 2, spine01: 2, 'clavicle.L': 2, 'clavicle.R': 2, 'shoulder01.L': 2, 'shoulder01.R': 2, neck01: 3, head: 3,
  'upperarm01.L': 4, 'lowerarm01.L': 5, 'wrist.L': 6, 'upperarm01.R': 7, 'lowerarm01.R': 8, 'wrist.R': 9,
  'upperleg01.L': 10, 'lowerleg01.L': 11, 'foot.L': 12, 'upperleg01.R': 13, 'lowerleg01.R': 14, 'foot.R': 15,
};
for (const b in esq.bones) { let c = b; while (!(c in RAIZ)) c = esq.bones[c].parent; MAPA[b] = RAIZ[c]; }
const baseV = [], grupos = {};
{
  let g = '';
  for (const l of ler('base.obj').split('\n')) {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'v') baseV.push(p.slice(1, 4).map(Number));
    else if (p[0] === 'g') g = p[1];
    else if (p[0] === 'f') (grupos[g] ??= []).push(p.slice(1).map(s => parseInt(s) - 1));
  }
}
const PESO = baseV.map(() => new Float32Array(NB));
for (const b in pesos) for (const [i, w] of pesos[b]) PESO[i][MAPA[b]] += w;

function corpo(alvos, dedos, boca) {
  const V = baseV.map(v => v.slice());
  for (const [f, w] of alvos) for (const l of ler(f).split('\n')) {
    if (!l || l[0] === '#') continue;
    const p = l.trim().split(/\s+/).map(Number);
    if (p.length === 4) for (let k = 0; k < 3; k++) V[p[0]][k] += w * p[k + 1];
  }
  for (const v of V) { v[0] *= .1; v[1] = (v[1] + 8.2) * .1; v[2] *= .1; }
  const junta = j => { const a = esq.joints[j], r = [0, 0, 0]; for (const i of a) for (let k = 0; k < 3; k++) r[k] += V[i][k] / a.length; return r; };
  const cab = b => junta(esq.bones[b].head);
  const filhos = b => Object.keys(esq.bones).filter(x => { let c = x; while (c) { if (c === b) return true; c = esq.bones[c].parent; } return false; });
  const dobrar = (b, o, eixo, ang) => {
    const W = new Float32Array(V.length);
    for (const f of filhos(b)) for (const [i, w] of pesos[f] || []) W[i] += w;
    for (let i = 0; i < V.length; i++) if (W[i] > 0) V[i] = lerp(V[i], girar(V[i], o, eixo, ang), Math.min(1, W[i]));
  };
  const palma = L => {
    const p = cab('wrist.' + L), n = norm(cross(sub(cab('finger2-1.' + L), p), sub(cab('finger5-1.' + L), p)));
    return dot(n, sub(junta(esq.bones['finger3-3.' + L].tail), cab('finger3-1.' + L))) < 0 ? mul(n, -1) : n;
  };
  // fecha os dedos (segurando a arma ou garra de zumbi)
  for (const L of ['L', 'R']) {
    const n = palma(L);
    for (let d = 2; d <= 5; d++) for (let k = 3; k >= 1; k--) {
      const dir = norm(sub(cab(`finger${d}-2.${L}`), cab(`finger${d}-1.${L}`)));
      dobrar(`finger${d}-${k}.${L}`, cab(`finger${d}-${k}.${L}`), norm(cross(dir, n)), dedos[k - 1]);
    }
  }
  if (boca) dobrar('jaw', cab('jaw'), [1, 0, 0], boca);
  const J = {}; // juntas simples
  const NOMES = [['pelve', 'root'], ['coluna', 'spine04'], ['peito', 'spine02'], ['cabeca', 'neck01'], ['bracoE', 'upperarm01.L'], ['antebracoE', 'lowerarm01.L'], ['maoE', 'wrist.L'], ['bracoD', 'upperarm01.R'], ['antebracoD', 'lowerarm01.R'], ['maoD', 'wrist.R'],
    ['coxaE', 'upperleg01.L'], ['canelaE', 'lowerleg01.L'], ['peE', 'foot.L'], ['coxaD', 'upperleg01.R'], ['canelaD', 'lowerleg01.R'], ['peD', 'foot.R']];
  for (const [n, b] of NOMES) J[n] = cab(b);
  for (const L of ['L', 'R']) { const q = L === 'L' ? 'E' : 'D'; J['dedos' + q] = cab('finger3-1.' + L); J['palma' + q] = palma(L); }
  J.arma = [0, 0, 0];
  return { V, J };
}

// ---------- malha em construção ----------
class Malha {
  constructor() { this.p = []; this.w = []; this.f = []; this.m = []; this.imp = []; }
  // copia faces de um grupo do corpo, com filtro, deslocamento e material
  copiar(V, faces, filtro, { mat, desloca, suaviza = 0, imp = 1 }) {
    const sel = faces.filter(filtro), id = new Map(), ini = this.p.length, viz = [];
    for (const f of sel) for (const i of f) if (!id.has(i)) { id.set(i, id.size); this.p.push(V[i].slice()); this.w.push(PESO[i]); this.imp.push(imp); viz.push(new Set()); }
    const ff = sel.map(f => f.map(i => id.get(i)));
    for (const f of ff) f.forEach((a, k) => { const b = f[(k + 1) % f.length]; viz[a].add(b); viz[b].add(a); });
    const loc = () => this.p.slice(ini);
    for (let s = 0; s < suaviza; s++) {
      const q = loc();
      for (let i = 0; i < q.length; i++) { let c = [0, 0, 0]; for (const j of viz[i]) c = add(c, q[j]); this.p[ini + i] = lerp(q[i], mul(c, 1 / viz[i].size), .5); }
    }
    if (desloca) {
      const q = loc(), n = q.map(() => [0, 0, 0]);
      for (const f of ff) { const c = cross(sub(q[f[2]], q[f[0]]), sub(q[f[3] ?? f[1]], q[f[1]])); for (const i of f) n[i] = add(n[i], c); }
      for (let i = 0; i < q.length; i++) { const u = norm(n[i]); this.p[ini + i] = add(q[i], mul(u, desloca(q[i], this.w[ini + i], u))); }
    }
    for (const f of ff) {
      const m = typeof mat === 'function' ? mat(f.map(i => this.p[ini + i])) : mat;
      for (let t = 1; t < f.length - 1; t++) { this.f.push([ini + f[0], ini + f[t], ini + f[t + 1]]); this.m.push(m); }
    }
    return { ff: ff.map(f => f.map(i => i + ini)) };
  }
  // dá espessura: puxa a borda da peça para dentro
  borda(peca, dist, mat) {
    const ar = new Map(), novo = new Map(), nv = new Map();
    for (const f of peca.ff) f.forEach((a, k) => { const b = f[(k + 1) % f.length], c = a < b ? a + '_' + b : b + '_' + a; ar.set(c, ar.has(c) ? null : [a, b]); });
    for (const f of peca.ff) { const c = norm(cross(sub(this.p[f[1]], this.p[f[0]]), sub(this.p[f[2]], this.p[f[0]]))); for (const i of f) nv.set(i, add(nv.get(i) || [0, 0, 0], c)); }
    const dentro = i => { if (!novo.has(i)) { novo.set(i, this.p.length); this.p.push(sub(this.p[i], mul(norm(nv.get(i)), dist))); this.w.push(this.w[i]); this.imp.push(1); } return novo.get(i); };
    for (const v of ar.values()) if (v) { const [a, b] = v, c = dentro(b), d = dentro(a); this.f.push([b, a, d], [b, d, c]); this.m.push(mat, mat); }
  }
  v(p, osso, imp = 1) {
    const w = new Float32Array(NB);
    if (Array.isArray(osso)) for (const [o, k] of osso) w[o] = k; else w[osso] = 1;
    this.p.push(p); this.w.push(w); this.imp.push(imp); return this.p.length - 1;
  }
  // grade genérica (u,v) -> ponto
  grade(nu, nv, fn, osso, mat, fechaU = false, inverte = false, imp = 1) {
    const ini = this.p.length, cu = fechaU ? nu : nu + 1;
    for (let j = 0; j <= nv; j++) for (let i = 0; i < cu; i++) this.v(fn(i / nu, j / nv), osso, imp);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = ini + j * cu + i, b = ini + j * cu + (i + 1) % cu, c = a + cu, d = b + cu;
      for (const t of [[a, b, d], [a, d, c]]) { this.f.push(inverte ? [t[0], t[2], t[1]] : t); this.m.push(mat); }
    }
  }
  // caixa arredondada
  caixa(c, t, osso, mat, rot = null) {
    const pw = x => Math.sign(x) * Math.pow(Math.abs(x), 2 / 4.5);
    this.grade(8, 6, (u, w) => {
      const a = u * 2 * Math.PI + Math.PI / 8, b = w * Math.PI - Math.PI / 2;
      let p = [pw(Math.cos(b)) * pw(Math.cos(a)) * t[0] * .56, pw(Math.sin(b)) * t[1] / 2, pw(Math.cos(b)) * pw(Math.sin(a)) * t[2] * .56];
      if (rot) p = girar(p, [0, 0, 0], rot[0], rot[1]);
      return add(c, p);
    }, osso, mat, true, true);
  }
}
const FR = grupos, faceMed = (V, f) => mul(f.reduce((a, i) => add(a, V[i]), [0, 0, 0]), 1 / f.length);
const dom = f => { const w = new Float32Array(NB); for (const i of f) for (let k = 0; k < NB; k++) w[k] += PESO[i][k]; return w.indexOf(Math.max(...w)); };
const MAT = { pele: 0, cima: 1, calca: 2, couro: 3, colete: 4, metal: 5, cabelo: 6, visor: 7, olho: 8, carne: 9, mochila: 10 };
const perna = b => b >= 10 && b <= 15, pe = b => b === 12 || b === 15, braco = b => b === 4 || b === 5 || b === 7 || b === 8, mao = b => b === 6 || b === 9, tronco = b => b <= 2;
const dobra = (p, a) => a * (.6 * ruido(p[0] * 16 + 5, p[1] * 26, p[2] * 16) + .4 * ruido(p[0] * 34, p[1] * 50 + 9, p[2] * 34));
const media = ps => mul(ps.reduce(add), 1 / ps.length);

function soldado() {
  const { V, J } = corpo([['caucasian-male-young.target', 1], ['universal-male-young-maxmuscle-averageweight.target', .45]], [.75, .95, .5], 0);
  const M = new Malha(), B = FR.body, T = FR['helper-tights'];
  // rosto e pescoço (o topo fica dentro do capacete); a parte de baixo é máscara
  M.copiar(V, B, f => dom(f) === 3 && faceMed(V, f)[1] < 1.715, { mat: ps => ps[0][1] < 1.585 ? MAT.couro : MAT.pele, desloca: p => p[1] < 1.585 ? .005 : 0, imp: 2 });
  // luvas
  M.copiar(V, B, f => mao(dom(f)), { mat: MAT.couro, desloca: () => .004, suaviza: 1, imp: 1.4 });
  // jaqueta e calça
  M.copiar(V, T, f => { const d = dom(f); return (tronco(d) || braco(d)) && faceMed(V, f)[1] < 1.5; }, { mat: ps => ps[0][1] < .93 ? MAT.calca : MAT.cima, suaviza: 3, desloca: p => .014 + dobra(p, .011) });
  M.copiar(V, T, f => { const d = dom(f); return perna(d) && !pe(d) && faceMed(V, f)[1] > .14; }, { mat: MAT.calca, suaviza: 2, desloca: p => .016 + dobra(p, .014) + .022 * suave(.2, .3, p[1]) * (1 - suave(.3, .48, p[1])) });
  // botas
  M.copiar(V, T, f => perna(dom(f)) && faceMed(V, f)[1] < .27, { mat: MAT.couro, suaviza: 3, desloca: p => .012 + (p[1] < .04 ? .006 : 0) + (p[1] > .2 ? .004 : 0) });
  // joelheiras, coldre e bolso da perna
  for (const [s, o] of [[1, 11], [-1, 14]]) { const k = J[s > 0 ? 'canelaE' : 'canelaD']; M.caixa([k[0], k[1] + .005, k[2] + .082], [.105, .15, .05], [[o, .6], [o - 1, .4]], MAT.metal); }
  M.caixa([J.coxaD[0] - .125, .8, J.coxaD[2] + .01], [.06, .2, .12], 13, MAT.couro);
  M.caixa([J.coxaE[0] + .12, .78, J.coxaE[2] + .01], [.06, .16, .13], 10, MAT.mochila);
  // colete com placas e bolsos
  const col = M.copiar(V, T, f => { const c = faceMed(V, f); return tronco(dom(f)) && c[1] > 1.02 && c[1] < 1.42 && Math.abs(c[0]) < .185; }, { mat: MAT.colete, suaviza: 6, desloca: () => .036 });
  M.borda(col, .03, MAT.colete);
  const extremo = (y, s) => { let z = -9; for (const v of V) if (Math.abs(v[0]) < .05 && Math.abs(v[1] - y) < .04) z = Math.max(z, v[2] * s); return z * s; };
  const z = extremo(1.24, 1), zt = extremo(1.28, -1), zb = extremo(1.08, 1), BARRIGA = [[1, .6], [2, .4]];
  M.caixa([0, 1.29, z + .035], [.25, .26, .05], 2, MAT.colete);
  for (const x of [-.085, 0, .085]) M.caixa([x, 1.12, zb + .062], [.075, .145, .05], BARRIGA, MAT.mochila);
  for (const x of [-.15, .15]) M.caixa([x, 1.1, zb], [.07, .12, .09], BARRIGA, MAT.mochila);
  M.caixa([.12, 1.36, z + .02], [.05, .12, .04], 2, MAT.couro); // rádio
  // cinto
  M.grade(14, 1, (u, w) => { const a = u * 6.283; return [Math.cos(a) * .188, .955 + w * .06, Math.sin(a) * .138 + .005]; }, 0, MAT.couro, true, true);
  // mochila
  M.caixa([0, 1.25, zt - .1], [.31, .42, .16], 2, MAT.mochila); M.caixa([0, 1.15, zt - .2], [.23, .17, .08], 2, MAT.mochila);
  M.caixa([0, 1.5, zt - .075], [.36, .1, .1], 2, MAT.calca);
  for (const x of [-.19, .19]) M.caixa([x, 1.17, zt - .09], [.07, .18, .1], 2, MAT.mochila);
  // ombreiras
  for (const [s, o] of [[1, 4], [-1, 7]]) { const p = J[s > 0 ? 'bracoE' : 'bracoD']; M.caixa([p[0] + s * .035, p[1] - .005, p[2] - .01], [.13, .13, .155], [[o, .65], [2, .35]], MAT.colete, [[0, 0, 1], s * .65]); }
  // capacete
  const c = [0, 1.665, .03], R = [.098, .112, .124];
  const corte = a => { const f = Math.sin(a); return 1.62 + (f > 0 ? -.2 * f : -.28 * f) + .34 * Math.pow(Math.abs(Math.cos(a)), 3); };
  M.grade(20, 8, (u, w) => { const a = u * 6.283, t = w * corte(a); return [c[0] + R[0] * 1.06 * Math.sin(t) * Math.cos(a), c[1] + R[1] * 1.08 * Math.cos(t), c[2] + R[2] * 1.06 * Math.sin(t) * Math.sin(a)]; }, 3, MAT.metal, true, false, 1.6);
  M.grade(20, 1, (u, w) => { const a = u * 6.283, t = corte(a), k = 1.06 + (w ? -.13 : .012); return [c[0] + R[0] * k * Math.sin(t) * Math.cos(a), c[1] + R[1] * 1.08 * Math.cos(t) - .004, c[2] + R[2] * k * Math.sin(t) * Math.sin(a)]; }, 3, MAT.metal, true, false, 1.6);
  M.caixa([0, 1.72, .165], [.045, .05, .03], 3, MAT.couro);
  for (const s of [-1, 1]) M.caixa([s * .108, 1.66, .03], [.025, .05, .1], 3, MAT.couro);
  // óculos balísticos
  M.grade(10, 2, (u, w) => { const a = (u - .5) * 2.5; return [Math.sin(a) * .083, 1.605 + w * .047, .03 + Math.cos(a) * .118]; }, 3, MAT.visor, false, false, 1.6);
  return { M, J };
}

function zumbi() {
  const { V, J } = corpo([['caucasian-male-young.target', 1], ['universal-male-young-minmuscle-minweight.target', .85]], [.35, .55, .4], .3);
  const M = new Malha(), B = FR.body, T = FR['helper-tights'];
  // cabeça (bochechas fundas, olheiras)
  M.copiar(V, B, f => dom(f) === 3, {
    imp: 3,
    desloca: p => {
      const x = Math.abs(p[0]);
      return -.009 * Math.exp(-((x - .052) ** 2 + (p[1] - 1.575) ** 2 + (p[2] - .1) ** 2) / .0006) - .004 * Math.exp(-((x - .03) ** 2 + (p[1] - 1.642) ** 2) / .0003) + .002 * ruido(p[0] * 60, p[1] * 60, p[2] * 60);
    },
    mat: ps => {
      const m = media(ps), r = ruido(m[0] * 22, m[1] * 22, m[2] * 22);
      if (m[1] > 1.705 + (m[2] > .08 ? .02 : -.09 + m[2] * .6) + r * .022 && m[2] < .13) return MAT.cabelo;
      if (m[1] > 1.505 && m[1] < 1.565 && m[2] > .06 && m[2] < .148 && Math.abs(m[0]) < .032) return MAT.carne;
      return MAT.pele;
    },
  });
  for (const g of ['helper-l-eye', 'helper-r-eye', 'helper-upper-teeth', 'helper-lower-teeth']) M.copiar(V, FR[g], () => true, { mat: MAT.olho });
  // braços nus e mãos
  M.copiar(V, B, f => { const d = dom(f), c = faceMed(V, f); return mao(d) || d === 5 || d === 8 || d === 7 || (d === 4 && c[0] > .26); }, { mat: ps => { const m = ps[0]; return ruido(m[0] * 13 + 3, m[1] * 13, m[2] * 13) > .42 ? MAT.carne : MAT.pele; }, imp: 1.3, desloca: p => .003 * ruido(p[0] * 40, p[1] * 40, p[2] * 40) });
  // camisa rasgada
  const cam = M.copiar(V, T, f => { const d = dom(f), c = faceMed(V, f); return c[1] < 1.5 && (tronco(d) || (d === 4 && c[0] < .33 + .05 * ruido(c[0] * 30, c[1] * 30, 2)) || (d === 7 && c[0] > -.23)); },
    { mat: ps => { const m = media(ps), r = ruido(m[0] * 10 + 1.7, m[1] * 9 + 4.2, m[2] * 10); return m[1] < .9 ? MAT.calca : r > .5 ? MAT.carne : MAT.cima; }, suaviza: 2, desloca: p => .012 + dobra(p, .016) });
  M.borda(cam, .012, MAT.cima);
  // barra da camisa em tiras
  M.grade(26, 2, (u, w) => { const a = u * 6.283, k = 1 + w * .16 + .05 * Math.sin(u * 60), q = Math.max(0, w - .5) * 2 * (.5 + .5 * Math.sin(u * 170 + 1) + ruido(u * 9, 3, 1)); return [Math.cos(a) * .165 * k, .99 - w * .1 - q * .055, Math.sin(a) * .12 * k]; }, [[0, .7], [1, .3]], MAT.cima, true, false);
  // calça com barra rasgada, um pé descalço
  M.copiar(V, T, f => { const d = dom(f), c = faceMed(V, f); return perna(d) && !pe(d) && c[1] > (c[0] > 0 ? .17 : .33) + .05 * ruido(c[0] * 30, c[1] * 30, c[2] * 30); },
    { mat: ps => { const m = ps[0]; return ruido(m[0] * 11 + 8, m[1] * 8, m[2] * 11) > .55 ? MAT.pele : MAT.calca; }, suaviza: 2, desloca: p => .014 + dobra(p, .015) });
  M.copiar(V, B, f => { const d = dom(f); return (d === 14 && faceMed(V, f)[1] < .4) || d === 15; }, { mat: MAT.pele });
  M.copiar(V, T, f => { const d = dom(f); return d === 12 || (d === 11 && faceMed(V, f)[1] < .2); }, { mat: MAT.couro, suaviza: 3, desloca: () => .011 });
  return { M, J };
}

// ---------- normais e oclusão ----------
function acabamento(M) {
  const n = M.p.map(() => [0, 0, 0]);
  for (const f of M.f) { const c = cross(sub(M.p[f[1]], M.p[f[0]]), sub(M.p[f[2]], M.p[f[0]])); for (const i of f) n[i] = add(n[i], c); }
  M.n = n.map(norm);
  const C = .05, g = new Map(), ch = p => Math.floor(p[0] / C) + ',' + Math.floor(p[1] / C) + ',' + Math.floor(p[2] / C);
  M.f.forEach(f => {
    const c = media(f.map(i => M.p[i])), a = len(cross(sub(M.p[f[1]], M.p[f[0]]), sub(M.p[f[2]], M.p[f[0]]))) / 2, k = ch(c);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push([c, a]);
  });
  M.ao = M.p.map((p, i) => {
    let o = 0; const b = p.map(x => Math.floor(x / C)), p0 = add(p, mul(M.n[i], .006));
    for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let w = -2; w <= 2; w++) for (const [c, a] of g.get((b[0] + x) + ',' + (b[1] + y) + ',' + (b[2] + w)) || []) {
      const d = sub(c, p0), l = len(d); if (l < .004 || l > .11) continue;
      const k = dot(d, M.n[i]) / l; if (k > .15) o += a * k / (l * l + .0004) * (1 - l / .11);
    }
    return Math.max(.25, 1 - o * .28);
  });
}

// ---------- simplificação (contração de arestas por erro quadrático) ----------
function simplificar(M, alvo) {
  const P = M.p.map(p => p.slice()), W = M.w.map(w => Float32Array.from(w)), N = M.n.map(x => x.slice()), AO = M.ao.slice(), F = M.f.map(f => f.slice()), viva = F.map(() => true);
  const Q = P.map(() => new Float64Array(10)), vf = P.map(() => new Set());
  const addQ = (q, n, d, w) => { const v = [n[0], n[1], n[2], d]; let k = 0; for (let a = 0; a < 4; a++) for (let b = a; b < 4; b++) q[k++] += w * v[a] * v[b]; };
  F.forEach((f, i) => {
    for (const a of f) vf[a].add(i);
    const c = cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]])), ar = len(c) / 2; if (ar < 1e-12) return;
    const n = norm(c), d = -dot(n, P[f[0]]);
    for (const a of f) addQ(Q[a], n, d, ar * (M.imp[a] ** 2) + 1e-7);
  });
  const ar = new Map();
  F.forEach((f, i) => { for (let k = 0; k < 3; k++) { const a = f[k], b = f[(k + 1) % 3], c = a < b ? a * 1e6 + b : b * 1e6 + a; if (!ar.has(c)) ar.set(c, [a, b, []]); ar.get(c)[2].push(i); } });
  for (const [a, b, fs_] of ar.values()) {
    const borda = fs_.length === 1, costura = fs_.length === 2 && M.m[fs_[0]] !== M.m[fs_[1]]; if (!borda && !costura) continue;
    const f = F[fs_[0]], nf = norm(cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]]))), e = sub(P[b], P[a]), n = norm(cross(e, nf)), d = -dot(n, P[a]), w = dot(e, e) * (borda ? 1.5 : .6);
    addQ(Q[a], n, d, w); addQ(Q[b], n, d, w);
  }
  const erro = (q, p) => { const [x, y, z] = p; return q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y + 2 * q[5] * y * z + 2 * q[6] * y + q[7] * z * z + 2 * q[8] * z + q[9]; };
  const soma = (a, b) => { const q = new Float64Array(10); for (let i = 0; i < 10; i++) q[i] = a[i] + b[i]; return q; };
  const ver = P.map(() => 0), heap = [];
  const push = it => { heap.push(it); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p].c <= heap[i].c) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => {
    const t = heap[0], u = heap.pop();
    if (heap.length) { heap[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l].c < heap[m].c) m = l; if (r < heap.length && heap[r].c < heap[m].c) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } }
    return t;
  };
  const cand = (a, b) => {
    const q = soma(Q[a], Q[b]); let m = null;
    for (const t of [.5, 0, 1]) { const c = erro(q, lerp(P[a], P[b], t)); if (!m || c < m.c) m = { c, t }; }
    const l = sub(P[a], P[b]); let wd = 0; for (let k = 0; k < NB; k++) wd += Math.abs(W[a][k] - W[b][k]);
    push({ c: m.c + 1e-7 * dot(l, l) + 2e-8 * wd, t: m.t, a, b, va: ver[a], vb: ver[b] });
  };
  for (const [a, b] of ar.values()) cand(a, b);
  let vivas = F.length;
  while (vivas > alvo && heap.length) {
    const e = pop(), { a, b } = e; if (ver[a] !== e.va || ver[b] !== e.vb) continue;
    const p = lerp(P[a], P[b], e.t); let ok = true;
    for (const [v, o] of [[a, b], [b, a]]) for (const i of vf[v]) {
      const f = F[i]; if (f.includes(o)) continue;
      const q = f.map(x => x === v ? p : P[x]), n1 = cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]])), n2 = cross(sub(q[1], q[0]), sub(q[2], q[0]));
      if (dot(n1, n2) < .15 * len(n1) * len(n2)) { ok = false; break; }
    }
    if (!ok) continue;
    Q[a] = soma(Q[a], Q[b]); P[a] = p;
    for (let k = 0; k < NB; k++) W[a][k] = W[a][k] * (1 - e.t) + W[b][k] * e.t;
    N[a] = norm(lerp(N[a], N[b], e.t)); AO[a] = AO[a] * (1 - e.t) + AO[b] * e.t;
    for (const i of vf[b]) { const f = F[i]; if (f.includes(a)) { viva[i] = false; vivas--; for (const x of f) if (x !== b) vf[x].delete(i); } else { f[f.indexOf(b)] = a; vf[a].add(i); } }
    vf[b].clear(); ver[b] = -1; ver[a]++;
    const viz = new Set(); for (const i of vf[a]) for (const x of F[i]) if (x !== a) viz.add(x);
    for (const x of viz) cand(a, x);
  }
  // vértices finais: um por (vértice, material)
  const id = new Map(), out = { p: [], n: [], b: [], w: [], m: [], ao: [], i: [] };
  F.forEach((f, i) => {
    if (!viva[i]) return;
    for (const a of f) {
      const k = a * 16 + M.m[i];
      if (!id.has(k)) {
        id.set(k, id.size); out.p.push(P[a]); out.n.push(N[a]); out.ao.push(AO[a]); out.m.push(M.m[i]);
        const o = [...W[a]].map((w, j) => [w, j]).sort((x, y) => y[0] - x[0]).slice(0, 3), s = o.reduce((t, x) => t + x[0], 0) || 1;
        out.b.push(o.map(x => x[1])); out.w.push(o.map(x => x[0] / s));
      }
      out.i.push(id.get(k));
    }
  });
  return out;
}

// ---------- gravação ----------
const partes = [], cabecalho = { ossos: OSSOS, modelos: {} }; let pos = 0;
const grava = arr => { const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), pad = (4 - b.length % 4) % 4, o = pos; partes.push(b, Buffer.alloc(pad)); pos += b.length + pad; return [o, arr.length]; };
for (const [nome, fn, alvos] of [['soldado', soldado, [4200, 2000, 800, 260]], ['zumbi', zumbi, [4200, 2000, 750, 240]]]) {
  const { M, J } = fn(); acabamento(M); console.log(nome, 'triângulos', M.f.length);
  const lods = alvos.map(a => {
    const o = simplificar(M, a), nv = o.p.length; console.log('  ', a, '->', o.i.length / 3, 'tri', nv, 'vért');
    return {
      nv,
      p: grava(Int16Array.from(o.p.flat().map(x => Math.round(x * 16000)))),
      n: grava(Int8Array.from(o.n.flatMap(x => [...x.map(v => Math.round(v * 127)), 0]))),
      b: grava(Uint8Array.from(o.b.flatMap((x, i) => [...x, o.m[i]]))),
      w: grava(Uint8Array.from(o.w.flatMap((x, i) => [...x.map(v => Math.round(v * 255)), Math.round(o.ao[i] * 255)]))),
      i: grava(Uint16Array.from(o.i)),
    };
  });
  cabecalho.modelos[nome] = { juntas: J, lods };
}
let js = JSON.stringify(cabecalho); while ((Buffer.byteLength(js) + 4) % 4) js += ' ';
const t = Buffer.alloc(4); t.writeUInt32LE(Buffer.byteLength(js));
fs.writeFileSync(SAIDA, Buffer.concat([t, Buffer.from(js), ...partes]));
console.log(SAIDA, fs.statSync(SAIDA).size, 'bytes');

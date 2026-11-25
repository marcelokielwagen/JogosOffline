// Modela os personagens do Soldier Survivor (soldado, zumbis e chefes), todos originais, em estilo desenho animado.
// Cada peça é uma "massinha" descrita por fórmula (campo de distância); o programa transforma em malha, simplifica e grava.
// Uso: node personagens.js <saida.bin> [só estes modelos, separados por vírgula]
// Não faz parte do jogo publicado; só é usado para gerar de novo recursos/personagens.bin.
const fs = require('fs');
const [, , SAIDA, SO] = process.argv;

// ---------- vetores ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return mul(a, 1 / l); }, lerp = (a, b, t) => add(mul(a, 1 - t), mul(b, t));
const media = ps => mul(ps.reduce(add), 1 / ps.length), G = Math.PI / 180;

// ---------- ossos e materiais ----------
const OSSOS = ['pelve', 'coluna', 'peito', 'cabeca', 'bracoE', 'antebracoE', 'maoE', 'bracoD', 'antebracoD', 'maoD', 'coxaE', 'canelaE', 'peE', 'coxaD', 'canelaD', 'peD', 'arma'];
const NB = OSSOS.length;
const M = { pele: 0, roupa: 1, calca: 2, couro: 3, colete: 4, capacete: 5, cabelo: 6, visor: 7, olho: 8, boca: 9, mochila: 10, lenco: 11, preto: 12, osso: 13, amarelo: 14, metal: 15, vermelho: 16, branco: 17, laranja: 18, borracha: 19, madeira: 20, listra: 21, unha: 22, azul: 23, brilho: 25, cano: 26 };

// ---------- formas ----------
function matRot(r) { if (!r) return null; const [x, y, z] = r.map(a => a * G), cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z); // YXZ, linhas = eixos locais
  return [[cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz], [-cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz], [sy * cx, -sx, cy * cx]]; }
const local = (p, c, R) => { const d = sub(p, c); return R ? [dot(R[0], d), dot(R[1], d), dot(R[2], d)] : d; };
const caixaBB = (c, r) => [sub(c, r), add(c, r)];
const F = (d, bb) => ({ d, bb });
const elip = (c, r, rot) => { const R = matRot(rot), m = rot ? [Math.max(...r), Math.max(...r), Math.max(...r)] : r; return F(p => { const q = local(p, c, R), a = [q[0] / r[0], q[1] / r[1], q[2] / r[2]], k0 = len(a), k1 = Math.hypot(a[0] / r[0], a[1] / r[1], a[2] / r[2]); return k1 < 1e-9 ? -Math.min(...r) : k0 * (k0 - 1) / k1; }, caixaBB(c, m)); };
const caps = (a, b, ra, rb = ra) => { const ab = sub(b, a), L = dot(ab, ab) || 1e-9, m = Math.max(ra, rb); return F(p => { const t = Math.min(1, Math.max(0, dot(sub(p, a), ab) / L)); return len(sub(p, add(a, mul(ab, t)))) - (ra + (rb - ra) * t); }, [[0, 1, 2].map(i => Math.min(a[i], b[i]) - m), [0, 1, 2].map(i => Math.max(a[i], b[i]) + m)]); };
const bloco = (c, h, r, rot) => { const R = matRot(rot), k = Math.hypot(...h), m = rot ? [k, k, k] : h; return F(p => { const q = local(p, c, R), x = Math.abs(q[0]) - h[0] + r, y = Math.abs(q[1]) - h[1] + r, z = Math.abs(q[2]) - h[2] + r; return Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(0, Math.max(x, y, z)) - r; }, caixaBB(c, m)); };
// toro no plano XZ local (achatado por sx, sz)
const toro = (c, RR, r, { sx = 1, sz = 1, sy = 1, rot } = {}) => { const R = matRot(rot), k = RR * Math.max(sx, sz) + r, m = rot ? [k, k, k] : [RR * sx + r, r * sy, RR * sz + r]; return F(p => { const q = local(p, c, R); return Math.hypot((Math.hypot(q[0] / sx, q[2] / sz) - RR) * Math.min(sx, sz), q[1] / sy) - r; }, caixaBB(c, m)); };
// cilindro/cone com quina arredondada, eixo Y local, raio rb embaixo e rt em cima
const cil = (c, rb, rt, h, q, rot) => { const R = matRot(rot), k = Math.hypot(Math.max(rb, rt), h); return F(p => { const l = local(p, c, R), t = Math.min(1, Math.max(0, (l[1] + h) / (2 * h))), x = Math.hypot(l[0], l[2]) - (rb + (rt - rb) * t) + q, y = Math.abs(l[1]) - h + q; return Math.hypot(Math.max(x, 0), Math.max(y, 0)) + Math.min(0, Math.max(x, y)) - q; }, caixaBB(c, rot ? [k, k, k] : [Math.max(rb, rt), h, Math.max(rb, rt)])); };
// corneta: cone oco com a boca para +Z local
const corneta = (c, r0, r1, comp, esp, rot) => { const R = matRot(rot), k = Math.max(r1, comp) * 1.3; return F(p => { const l = local(p, c, R), t = Math.min(1, Math.max(0, (l[2] + comp / 2) / comp)), raio = r0 + (r1 - r0) * t * t, x = Math.abs(Math.hypot(l[0], l[1]) - raio) - esp, z = Math.abs(l[2]) - comp / 2; return Math.max(x, z) < 0 ? Math.max(x, z) : Math.hypot(Math.max(x, 0), Math.max(z, 0)) - .004; }, caixaBB(c, [k, k, k])); };
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
const smax = (a, b, k) => -smin(-a, -b, k);

// um grupo = peças de um mesmo material fundidas; osso pode ser número ou [[osso, peso], ...]
class Grupo {
  constructor(mat, { k = .03, res = .011, imp = 1, corte = null, sempre = false, pinta = null } = {}) { Object.assign(this, { mat, k, res, imp, corte, sempre, pinta, pr: [] }); }
  por(f, osso, op = {}) { this.pr.push({ ...f, osso: Array.isArray(osso) ? osso : [[osso, 1]], ...op }); return this; }
  tirar(f, k = .015) { this.pr.push({ ...f, neg: true, k }); return this; }
  d(p) { let d = 9; for (const q of this.pr) d = q.neg ? smax(d, -q.d(p), q.k) : smin(d, q.d(p), q.k ?? this.k); return this.corte ? Math.max(d, this.corte(p)) : d; }
  pesos(p) { let mi = 9; const ds = this.pr.map(q => { if (q.neg) return 9; const d = q.d(p); mi = Math.min(mi, d); return d; }), w = new Float32Array(NB); ds.forEach((d, i) => { const q = this.pr[i]; if (q.neg) return; const e = Math.exp(-(d - mi) * 34); for (const [o, k] of q.osso) w[o] += e * k; }); let s = 0; for (const x of w) s += x; return w.map(x => x / s); }
  bb() { let a = [9, 9, 9], b = [-9, -9, -9]; for (const q of this.pr) if (!q.neg) { a = a.map((x, i) => Math.min(x, q.bb[0][i])); b = b.map((x, i) => Math.max(x, q.bb[1][i])); } const m = this.res * 2 + .004; return [a.map(x => x - m), b.map(x => x + m)]; }
}

// ---------- malha (surface nets) ----------
function malhar(grupos) {
  const out = { p: [], n: [], w: [], imp: [], f: [], m: [] };
  grupos.forEach((g, gi) => {
    const [a, b] = g.bb(), h = g.res, nx = Math.ceil((b[0] - a[0]) / h) + 1, ny = Math.ceil((b[1] - a[1]) / h) + 1, nz = Math.ceil((b[2] - a[2]) / h) + 1, D = new Float32Array(nx * ny * nz), id = new Int32Array(nx * ny * nz).fill(-1), ix = (i, j, k) => (k * ny + j) * nx + i;
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) D[ix(i, j, k)] = g.d([a[0] + i * h, a[1] + j * h, a[2] + k * h]);
    const grad = p => { const e = h * .35; return norm([g.d([p[0] + e, p[1], p[2]]) - g.d([p[0] - e, p[1], p[2]]), g.d([p[0], p[1] + e, p[2]]) - g.d([p[0], p[1] - e, p[2]]), g.d([p[0], p[1], p[2] + e]) - g.d([p[0], p[1], p[2] - e])]); };
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const c = []; let s = 0; for (let q = 0; q < 8; q++) { const v = D[ix(i + (q & 1), j + (q >> 1 & 1), k + (q >> 2))]; c.push(v); if (v < 0) s++; } if (s === 0 || s === 8) continue;
      let m = [0, 0, 0], n = 0; for (const [x, y] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) if (c[x] < 0 !== c[y] < 0) { const t = c[x] / (c[x] - c[y]); for (let e = 0; e < 3; e++) m[e] += (x >> e & 1) + ((y >> e & 1) - (x >> e & 1)) * t; n++; }
      let p = [a[0] + (i + m[0] / n) * h, a[1] + (j + m[1] / n) * h, a[2] + (k + m[2] / n) * h];
      for (let q = 0; q < 2; q++) p = sub(p, mul(grad(p), g.d(p) * .8));
      id[ix(i, j, k)] = out.p.length; out.p.push(p); out.n.push(grad(p)); out.w.push(g.pesos(p)); out.imp.push(g.imp);
    }
    const quad = (A, B, C, E, inv) => {
      if (A < 0 || B < 0 || C < 0 || E < 0) return; const l = inv ? [A, E, C, B] : [A, B, C, E], c = media(l.map(x => out.p[x]));
      // joga fora o que fica escondido bem dentro de outra peça
      if (!g.sempre) for (let o = 0; o < grupos.length; o++) if (o !== gi && l.every(x => grupos[o].d(out.p[x]) < -.02)) return;
      const mt = g.pinta ? g.pinta(c) ?? g.mat : g.mat; out.f.push([l[0], l[1], l[2]], [l[0], l[2], l[3]]); out.m.push(mt, mt);
    };
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const d0 = D[ix(i, j, k)] < 0;
      if (d0 !== D[ix(i + 1, j, k)] < 0) quad(id[ix(i, j - 1, k - 1)], id[ix(i, j, k - 1)], id[ix(i, j, k)], id[ix(i, j - 1, k)], !d0);
      if (d0 !== D[ix(i, j + 1, k)] < 0) quad(id[ix(i - 1, j, k - 1)], id[ix(i - 1, j, k)], id[ix(i, j, k)], id[ix(i, j, k - 1)], !d0);
      if (d0 !== D[ix(i, j, k + 1)] < 0) quad(id[ix(i - 1, j - 1, k)], id[ix(i, j - 1, k)], id[ix(i, j, k)], id[ix(i - 1, j, k)], !d0);
    }
  });
  return out;
}

// ---------- esqueleto ----------
function juntas({ pelve, coluna, peito, cabeca, ombro, cotovelo, punho, coxa, joelho, tornozelo, dedo = .09 }) {
  const J = { pelve: [0, pelve, 0], coluna: [0, coluna, 0], peito: [0, peito, 0], cabeca: [0, cabeca[0], cabeca[1]], arma: [0, 0, 0] };
  for (const [l, s] of [['E', 1], ['D', -1]]) {
    const e = v => [v[0] * s, v[1], v[2]], d = norm(sub(e(punho), e(cotovelo)));
    J['braco' + l] = e(ombro); J['antebraco' + l] = e(cotovelo); J['mao' + l] = e(punho); J['coxa' + l] = e(coxa); J['canela' + l] = e(joelho); J['pe' + l] = e(tornozelo);
    J['dedos' + l] = add(e(punho), mul(d, dedo)); const n = [-s, -.5, 0]; J['palma' + l] = norm(sub(n, mul(d, dot(n, d))));
  }
  return J;
}
const LADOS = [['E', 1, 4, 10], ['D', -1, 7, 13]];
// mão gordinha: palma, três dedos e polegar. fecha: 0 = garra aberta, 1 = punho fechado
function mao(g, J, l, o, t, fecha, unha = null) {
  const w = J['mao' + l], d = norm(sub(J['dedos' + l], w)), n = J['palma' + l]; let lat = norm(cross(d, n)); if (lat[2] < 0) lat = mul(lat, -1);
  const P = (a, b, c) => add(add(add(w, mul(d, a * t)), mul(lat, b * t)), mul(n, c * t));
  g.por(caps(P(-.1, 0, 0), P(.35, 0, 0), t * .42, t * .5), o).por(caps(P(.5, -.28, 0), P(.5, .28, 0), t * .33), o);
  for (const b of [-.42, 0, .42]) { const a1 = P(.75, b, .05), a2 = P(1.05 - fecha * .05, b * (1.25 - fecha * .25), .22 + fecha * .28), a3 = P(1.35 - fecha * .85, b * (1.45 - fecha * .45), .42 + fecha * .5); g.por(caps(a1, a2, t * .22, t * .21), o, { k: t * .12 }).por(caps(a2, a3, t * .21, t * .16), o, { k: t * .1 }); if (unha) unha.por(caps(a3, add(a3, mul(norm(sub(a3, a2)), t * .28)), t * .13, t * .03), o); }
  g.por(caps(P(.2, .45, .1), P(.55, .75 - fecha * .25, .35 + fecha * .25), t * .24, t * .19), o, { k: t * .14 });
}

// ---------- SOLDADO ----------
function soldado() {
  const J = juntas({ pelve: .6, coluna: .7, peito: .84, cabeca: [1.03, .0], ombro: [.2, .965, -.01], cotovelo: [.345, .79, -.035], punho: [.45, .63, .035], coxa: [.1, .585, 0], joelho: [.118, .345, .018], tornozelo: [.13, .115, -.012] });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  // cabeça grande, queixo firme, nariz redondo
  const pele = N(M.pele, { k: .045, imp: 2, res: .009 });
  pele.por(elip([0, 1.225, .01], [.172, .165, .165]), 3).por(elip([0, 1.125, .045], [.125, .095, .115]), 3).por(elip([0, 1.185, .185], [.036, .032, .034]), 3, { k: .012 }).por(caps([0, 1.0, 0], [0, 1.1, 0], .085), 3);
  for (const s of [1, -1]) pele.por(elip([s * .172, 1.2, -.005], [.032, .048, .04]), 3, { k: .012 }).por(elip([s * .085, 1.155, .125], [.05, .042, .04]), 3);
  // rosto expressivo
  for (const s of [1, -1]) {
    N(M.olho, { res: .005, imp: 4, sempre: true }).por(elip([s * .066, 1.232, .145], [.043, .054, .034], [0, s * 20, 0]), 3);
    N(M.preto, { res: .004, imp: 4, sempre: true }).por(elip([s * .058, 1.228, .174], [.02, .03, .012], [0, s * 16, 0]), 3);
    N(M.cabelo, { res: .005, imp: 4, k: .01, sempre: true }).por(caps([s * .03, 1.288, .174], [s * .112, 1.312, .135], .0165, .013), 3);
  }
  N(M.preto, { res: .0045, imp: 3, k: .006, sempre: true }).por(caps([-.04, 1.112, .156], [.018, 1.106, .16], .0085), 3).por(caps([.018, 1.106, .16], [.048, 1.121, .15], .0085, .006), 3);
  N(M.cabelo, { res: .008, k: .03, imp: 1.5 }).por(elip([0, 1.17, -.05], [.168, .1, .125]), 3).por(caps([.16, 1.24, .05], [.15, 1.15, .035], .022, .014), 3).por(caps([-.16, 1.24, .05], [-.15, 1.15, .035], .022, .014), 3);
  // capacete com aba, proteção de orelha e óculos por cima
  const aba = p => 1.272 + .33 * p[2] + (p[2] < 0 ? .12 * p[2] : 0);
  N(M.capacete, { k: .02, res: .0105, imp: 1.7, corte: p => aba(p) - .012 - p[1] }).por(elip([0, 1.265, -.005], [.21, .192, .212]), 3);
  const borda = elip([0, 1.265, -.002], [.228, .205, .236]);
  N(M.capacete, { res: .008, imp: 1.7, corte: p => Math.abs(p[1] - aba(p)) - .017 }).por(borda, 3);
  N(M.couro, { k: .012, res: .008 }).por(toro([0, 1.345, 0], .19, .02, { sy: .9, rot: [-6, 0, 0] }), 3, { k: 0 });
  N(M.preto, { k: .01, res: .0075, imp: 1.6 }).por(bloco([0, 1.385, .178], [.115, .048, .035], .03, [-24, 0, 0]), 3);
  N(M.visor, { res: .0065, imp: 1.8, sempre: true }).por(elip([.056, 1.39, .2], [.048, .036, .028], [-24, 10, 0]), 3).por(elip([-.056, 1.39, .2], [.048, .036, .028], [-24, -10, 0]), 3);
  // lenço no pescoço com as pontas voando para trás
  N(M.lenco, { k: .035, res: .0095, imp: 1.3 }).por(toro([0, 1.03, .005], .112, .05, { sy: .95 }), [[3, .35], [2, .65]]).por(caps([-.03, 1.02, -.13], [-.085, .93, -.255], .042, .03), 2).por(caps([-.085, .93, -.255], [-.12, .8, -.295], .038, .012), 2).por(caps([.0, 1.02, -.13], [.0, .9, -.27], .035, .012), 2);
  // tronco
  N(M.roupa, { k: .06 }).por(elip([0, .9, 0], [.185, .165, .125]), 2).por(elip([0, .75, .01], [.155, .13, .12]), 1).por(elip([0, .66, .005], [.15, .1, .118]), 0);
  N(M.colete, { k: .04, imp: 1.2 }).por(bloco([0, .885, .0], [.178, .15, .142], .085), 2).por(bloco([0, .78, .008], [.16, .09, .142], .07), [[1, .7], [2, .3]]).por(bloco([0, .905, .115], [.12, .085, .05], .035), 2, { k: .012 });
  const bolso = N(M.mochila, { k: .008, res: .0085 }); for (const x of [-.095, 0, .095]) bolso.por(bloco([x, .765, .16], [.04, .058, .04], .022), [[1, .7], [2, .3]]);
  N(M.couro, { k: .01, res: .009 }).por(toro([0, .652, .004], .148, .03, { sz: .82, sy: 1.1 }), 0);
  N(M.amarelo, { res: .007 }).por(bloco([0, .652, .135], [.036, .03, .02], .012), 0);
  // calça larguinha, joelheiras e botas grandes
  const cal = N(M.calca, { k: .05 }); cal.por(elip([0, .6, .0], [.16, .1, .125]), 0);
  for (const [l, s, , c] of LADOS) {
    const q = J['coxa' + l], j = J['canela' + l], t = J['pe' + l];
    cal.por(caps(q, j, .1, .083), c).por(caps(j, [t[0], t[1] + .1, t[2]], .083, .088), c + 1);
    N(M.colete, { k: .02, res: .009 }).por(elip([j[0], j[1] + .005, j[2] + .072], [.062, .07, .035]), [[c + 1, .6], [c, .4]]);
    N(M.couro, { k: .05, imp: 1.2, pinta: p => p[1] < .03 ? M.preto : M.couro }).por(caps([t[0], t[1] + .095, t[2]], [t[0], t[1], t[2]], .084, .085), c + 2).por(bloco([t[0] + s * .008, .065, t[2] + .05], [.083, .065, .15], .06), c + 2).por(elip([t[0] + s * .01, .085, t[2] + .12], [.085, .07, .085]), c + 2);
  }
  // braços, ombreiras e luvas grandes
  for (const [l, s, b] of LADOS) {
    const o = J['braco' + l], c = J['antebraco' + l], w = J['mao' + l];
    N(M.roupa, { k: .045 }).por(elip([s * .16, .955, -.005], [.085, .08, .085]), [[2, .6], [b, .4]]).por(caps(o, c, .078, .068), b).por(caps(c, lerp(c, w, .9), .068, .066), b + 1);
    N(M.colete, { k: .03, res: .0095, imp: 1.2 }).por(elip([s * .228, .985, -.008], [.1, .075, .105], [0, 0, s * -28]), [[b, .6], [2, .4]]);
    const luva = N(M.couro, { k: .03, res: .009, imp: 1.4 }); luva.por(caps(lerp(c, w, .72), lerp(c, w, .96), .076, .066), b + 1); mao(luva, J, l, b + 2, .1, .85);
  }
  // mochila com rolo de dormir, bolso e antena
  N(M.mochila, { k: .025, imp: 1.2 }).por(bloco([0, .895, -.205], [.135, .145, .08], .05), 2).por(bloco([0, .84, -.285], [.09, .07, .04], .03), 2, { k: .01 }).por(bloco([.15, .85, -.19], [.04, .075, .05], .03), 2, { k: .01 }).por(bloco([-.15, .85, -.19], [.04, .075, .05], .03), 2, { k: .01 });
  N(M.calca, { k: .01, res: .0095 }).por(caps([-.15, 1.065, -.215], [.15, 1.065, -.215], .062), 2);
  N(M.preto, { res: .006, k: .004, imp: .8 }).por(caps([.125, .98, -.23], [.15, 1.42, -.27], .009, .005), 2).por(elip([.15, 1.42, -.27], [.014, .014, .014]), 2);
  return { g, J };
}

// ---------- ZUMBI ----------
function zumbi() {
  const J = juntas({ pelve: .67, coluna: .77, peito: .93, cabeca: [1.12, .02], ombro: [.165, 1.06, -.005], cotovelo: [.315, .86, -.035], punho: [.425, .655, .04], coxa: [.085, .655, 0], joelho: [.1, .375, .02], tornozelo: [.112, .095, -.012] });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  const pele = N(M.pele, { k: .04, imp: 1.8, res: .0095 });
  pele.por(elip([0, 1.35, .03], [.175, .165, .165]), 3).por(elip([0, 1.25, .085], [.125, .08, .1]), 3).por(elip([0, 1.135, .1], [.105, .05, .095]), 3, { k: .02 }).por(caps([0, 1.05, .0], [0, 1.2, .02], .062), [[3, .7], [2, .3]]).por(caps([.1, 1.16, .02], [.11, 1.24, .03], .04), 3).por(caps([-.1, 1.16, .02], [-.11, 1.24, .03], .04), 3)
    .por(caps([-.1, 1.43, .145], [.1, 1.415, .145], .03), 3, { k: .02 }).por(elip([0, 1.28, .19], [.028, .025, .025]), 3, { k: .015 });
  pele.por(elip([.18, 1.33, .02], [.025, .05, .04]), 3, { k: .01 }).por(elip([-.175, 1.31, .02], [.02, .028, .03]), 3, { k: .01 });
  pele.tirar(elip([0, 1.19, .155], [.085, .05, .1]), .02);
  N(M.boca, { res: .009, sempre: true }).por(elip([0, 1.195, .085], [.09, .06, .085]), 3);
  const den = N(M.osso, { k: .003, res: .0065, imp: 1.2, sempre: true }); for (const [x, y, h] of [[-.06, 1.232, .026], [-.02, 1.228, .03], [.04, 1.23, .022], [-.045, 1.16, .022], [.025, 1.158, .028], [.065, 1.165, .02]]) den.por(bloco([x, y, .168 - x * x * 5], [.016, h, .012], .008), 3);
  // olhos arregalados, um maior que o outro
  N(M.olho, { res: .0055, imp: 3, sempre: true }).por(elip([.072, 1.36, .155], [.057, .06, .045]), 3); N(M.olho, { res: .0055, imp: 3, sempre: true }).por(elip([-.07, 1.355, .16], [.042, .044, .036]), 3);
  N(M.preto, { res: .0045, imp: 3, sempre: true }).por(elip([.063, 1.352, .196], [.016, .019, .009]), 3).por(elip([-.066, 1.352, .192], [.013, .015, .008]), 3);
  // cabelo em tufos e um pedaço de cérebro
  const cab = N(M.cabelo, { k: .02, res: .0095 }); cab.por(elip([-.05, 1.475, .0], [.1, .05, .12]), 3); for (const [x, z, a, b] of [[-.1, .06, -.17, .1], [-.02, .1, -.02, .16], [-.13, -.04, -.21, -.06], [-.05, -.08, -.08, -.18], [.02, .0, .07, .03]]) cab.por(caps([x, 1.49, z], [a, 1.56, b], .034, .008), 3);
  N(M.boca, { k: .012, res: .009 }).por(elip([.09, 1.475, .02], [.06, .05, .05]), 3).por(elip([.075, 1.465, -.045], [.06, .05, .05]), 3).por(elip([.12, 1.44, -.02], [.045, .05, .05]), 3);
  // camisa rasgada
  const rasgo = p => .052 * Math.sin(Math.atan2(p[0], p[2]) * 7) + .02 * Math.sin(Math.atan2(p[0], p[2]) * 17 + 1);
  N(M.roupa, { k: .06, corte: p => .66 + rasgo(p) - p[1] }).por(elip([0, .99, -.01], [.165, .13, .115]), 2).por(elip([0, .83, .0], [.138, .16, .105]), 1).por(elip([0, .69, 0], [.145, .12, .11]), 0);
  N(M.pele, { k: .03, res: .012 }).por(elip([0, .73, .0], [.125, .13, .098]), [[0, .5], [1, .5]]);
  N(M.lenco, { k: .01, res: .008 }).por(caps([0, 1.04, .105], [.02, .93, .128], .02, .03), 2).por(caps([.02, .93, .128], [.05, .82, .118], .03, .008), [[1, .6], [2, .4]]);
  // costelas à mostra
  const cos = N(M.osso, { k: .006, res: .008, imp: .8 }); for (let k = 0; k < 3; k++) cos.por(caps([-.06, .9 - k * .05, .11 - k * .004], [-.14, .905 - k * .05, .04], .0155), [[1, .4], [2, .6]]);
  const cal = N(M.calca, { k: .045 }); cal.por(elip([0, .67, 0], [.142, .085, .11]), 0);
  for (const [l, s, b, c] of LADOS) {
    const q = J['coxa' + l], j = J['canela' + l], t = J['pe' + l], o = J['braco' + l], e = J['antebraco' + l], w = J['mao' + l];
    cal.por(caps(q, j, .083, .066), c); if (s > 0) cal.por(caps(j, lerp(j, t, .62), .066, .072), c + 1); else cal.por(caps(j, lerp(j, t, .22), .066, .07), c + 1);
    if (s > 0) N(M.couro, { k: .04, pinta: p => p[1] < .026 ? M.preto : M.couro }).por(caps([t[0], t[1] + .07, t[2]], t, .062, .066), c + 2).por(bloco([t[0], .055, t[2] + .05], [.068, .054, .135], .05), c + 2);
    else { const pe = N(M.pele, { k: .035 }); pe.por(caps(lerp(j, t, .1), t, .048, .045), c + 1).por(elip([t[0], .05, t[2] + .045], [.06, .048, .115]), c + 2); for (const x of [-.036, 0, .036]) pe.por(elip([t[0] + x, .035, t[2] + .155], [.022, .028, .03]), c + 2, { k: .01 }); }
    N(M.roupa, { k: .04 }).por(elip([s * .14, 1.05, -.01], [.075, .07, .075]), [[2, .6], [b, .4]]).por(caps(o, lerp(o, e, s > 0 ? .75 : .5), .066, .07), b);
    const br = N(M.pele, { k: .03, imp: 1.2 }), un = N(M.unha, { k: .002, res: .0075 }); br.por(caps(lerp(o, e, .3), e, .05, .046), b).por(caps(e, w, .046, .04), b + 1); mao(br, J, l, b + 2, .105, .18, un);
  }
  return { g, J };
}

// ---------- ZUMBI GORDO (blindado) ----------
function gordo() {
  const J = juntas({ pelve: .6, coluna: .7, peito: .92, cabeca: [1.14, .06], ombro: [.31, 1.06, -.005], cotovelo: [.5, .84, -.03], punho: [.6, .62, .06], coxa: [.14, .575, 0], joelho: [.165, .33, .02], tornozelo: [.175, .1, -.012], dedo: .11 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  const pele = N(M.pele, { k: .05, imp: 1.8, res: .011 });
  pele.por(elip([0, 1.28, .09], [.15, .14, .145]), 3).por(elip([0, 1.18, .13], [.15, .085, .12]), 3).por(caps([0, 1.05, .03], [0, 1.18, .06], .12), [[3, .6], [2, .4]]).por(caps([-.09, 1.335, .2], [.09, 1.335, .2], .028), 3, { k: .02 });
  pele.tirar(elip([0, 1.16, .25], [.08, .035, .07]), .015);
  N(M.boca, { res: .009, sempre: true }).por(elip([0, 1.165, .18], [.085, .045, .07]), 3);
  const den = N(M.osso, { k: .003, res: .008, sempre: true, imp: 1.3 }); for (const x of [-.06, .06]) den.por(caps([x, 1.135, .25], [x * 1.1, 1.215, .265], .02, .008), 3);
  for (const s of [1, -1]) { N(M.olho, { res: .006, imp: 3, sempre: true }).por(elip([s * .06, 1.29, .205], [.035, .032, .03]), 3); N(M.preto, { res: .005, imp: 3, sempre: true }).por(elip([s * .055, 1.288, .232], [.012, .014, .007]), 3); }
  // panela na cabeça
  N(M.metal, { k: .012, imp: 1.4, corte: p => 1.345 - p[1] + .12 * (p[2] - .08) * -1 }).por(cil([0, 1.4, .075], .165, .175, .1, .04, [6, 0, 0]), 3).por(caps([.17, 1.42, .06], [.36, 1.46, .04], .022, .026), 3);
  // barriga e camiseta curta
  N(M.pele, { k: .08, res: .014 }).por(elip([0, .76, .06], [.3, .24, .27]), [[1, .7], [0, .3]]).por(elip([0, .98, .0], [.27, .2, .2]), 2);
  N(M.roupa, { k: .07, res: .013, corte: p => .77 + .03 * Math.sin(Math.atan2(p[0], p[2]) * 9) - p[1] }).por(elip([0, .78, .05], [.308, .25, .275]), [[1, .7], [0, .3]]).por(elip([0, .99, -.005], [.285, .21, .21]), 2);
  // tampa de bueiro amarrada no peito e placa nas costas
  N(M.metal, { k: .01, imp: 1.2, sempre: true }).por(cil([0, .93, .265], .2, .2, .03, .015, [78, 0, 0]), 2).por(toro([0, .93, .292], .15, .018, { rot: [78, 0, 0] }), 2).por(bloco([0, .93, .3], [.02, .09, .012], .006, [-12, 0, 0]), 2).por(bloco([0, .93, .3], [.09, .02, .012], .006, [-12, 0, 0]), 2);
  N(M.couro, { k: .02 }).por(toro([0, .95, .02], .28, .026, { sz: .86, rot: [0, 0, 22] }), 2);
  const cal = N(M.calca, { k: .06 }); cal.por(elip([0, .6, .02], [.26, .13, .21]), 0);
  for (const [l, s, b, c] of LADOS) {
    const q = J['coxa' + l], j = J['canela' + l], t = J['pe' + l], o = J['braco' + l], e = J['antebraco' + l], w = J['mao' + l];
    cal.por(caps(q, j, .135, .11), c).por(caps(j, lerp(j, t, .5), .11, .105), c + 1);
    N(M.couro, { k: .05, pinta: p => p[1] < .03 ? M.preto : M.couro }).por(caps([t[0], t[1] + .07, t[2]], t, .095, .095), c + 2).por(bloco([t[0], .065, t[2] + .05], [.095, .064, .15], .06), c + 2);
    N(M.roupa, { k: .04 }).por(elip([s * .28, 1.07, -.005], [.12, .11, .12]), [[2, .5], [b, .5]]).por(caps(o, lerp(o, e, .45), .115, .12), b);
    const br = N(M.pele, { k: .045 }), un = N(M.unha, { k: .002, res: .009 }); br.por(caps(lerp(o, e, .2), e, .1, .095), b).por(caps(e, w, .1, .08), b + 1); mao(br, J, l, b + 2, .15, .3, un);
    if (s > 0) N(M.borracha, { k: .01 }).por(toro(lerp(o, e, .12), .15, .06, { sy: 1.1, rot: [0, 0, s * 40] }), [[b, .7], [2, .3]]);
  }
  return { g, J };
}

// ---------- CHEFES ----------
// corpo de monstro: cada chefe passa as próprias proporções e enfeites
function cabecaMonstro(N, c, r, { boca = true, dentes = 4, olhos = [.36, .3], testa = 1 }) {
  const [x, y, z] = c, pele = N(M.pele, { k: r * .25, imp: 1.8, res: .012 });
  pele.por(elip([x, y, z], [r, r * .95, r * .95]), 3).por(elip([x, y - r * .55, z + r * .42], [r * .78, r * .42, r * .62]), 3).por(caps([x - r * .55, y + r * .33, z + r * .78], [x + r * .55, y + r * .33, z + r * .78], r * .2 * testa), 3, { k: r * .12 }).por(elip([x, y - r * .1, z + r * 1.02], [r * .17, r * .15, r * .14]), 3, { k: r * .1 });
  if (boca) { pele.tirar(elip([x, y - r * .56, z + r * 1.0], [r * .55, r * .24, r * .5]), r * .08); N(M.boca, { res: .011, sempre: true }).por(elip([x, y - r * .55, z + r * .5], [r * .58, r * .28, r * .45]), 3);
    const d = N(M.osso, { k: .003, res: .009, sempre: true, imp: 1.4 }); for (let i = 0; i < dentes; i++) { const u = (i + .5) / dentes * 2 - 1, zz = z + r * (1.0 - u * u * .25); d.por(caps([x + u * r * .46, y - r * .34, zz], [x + u * r * .44, y - r * (.5 + (i % 2) * .08), zz], r * .1, r * .045), 3).por(caps([x + u * r * .42, y - r * .8, zz - r * .03], [x + u * r * .4, y - r * (.6 - (i % 2) * .06), zz], r * .1, r * .04), 3); } }
  olhos.forEach((o, i) => { const s = i ? -1 : 1; N(M.olho, { res: .008, imp: 2.5, sempre: true }).por(elip([x + s * r * .4, y + r * .1, z + r * .86], [r * o * .72, r * o * .7, r * .2]), 3); N(M.preto, { res: .007, imp: 2.5, sempre: true }).por(elip([x + s * r * .36, y + r * .07, z + r * 1.04], [r * .09, r * .11, r * .05]), 3); });
  return pele;
}
function bracosPernas(N, J, { rb = [.1, .09, .09], rp = [.12, .1, .1], m = .16, fecha = .9, manga = 0, matManga = M.roupa, bota = true, pelada = false, un = true }) {
  const cal = N(M.calca, { k: .06, res: .014 }); cal.por(elip([J.pelve[0], J.pelve[1], 0], [J.coxaE[0] + rp[0] * .85, rp[0] * 1.15, rp[0] * 1.35]), 0);
  for (const [l, s, b, c] of LADOS) {
    const q = J['coxa' + l], j = J['canela' + l], t = J['pe' + l], o = J['braco' + l], e = J['antebraco' + l], w = J['mao' + l];
    cal.por(caps(q, j, rp[0], rp[1]), c).por(caps(j, lerp(j, t, pelada ? .25 : .6), rp[1], rp[2] * 1.02), c + 1);
    if (bota) N(M.couro, { k: .05, res: .013, pinta: p => p[1] < .03 ? M.preto : M.couro }).por(caps([t[0], t[1] + .1, t[2]], t, rp[2] * .92, rp[2] * .95), c + 2).por(bloco([t[0] + s * .01, .07, t[2] + .06], [rp[2] * .98, .07, rp[2] * 1.55], .06), c + 2);
    else { const pe = N(M.pele, { k: .04, res: .013 }); pe.por(caps(lerp(j, t, .1), t, rp[2] * .8, rp[2] * .75), c + 1).por(elip([t[0], .06, t[2] + .06], [rp[2] * .9, .06, rp[2] * 1.5]), c + 2); for (const x of [-.55, 0, .55]) pe.por(elip([t[0] + x * rp[2], .045, t[2] + .06 + rp[2] * 1.35], [rp[2] * .34, .04, rp[2] * .42]), c + 2, { k: .012 }); }
    const br = N(M.pele, { k: .06, res: .0135, imp: 1.2 }), un2 = un ? N(M.unha, { k: .003, res: .011 }) : null;
    br.por(elip(o, [rb[0] * 1.2, rb[0] * 1.15, rb[0] * 1.15]), [[b, .55], [2, .45]]).por(caps(o, e, rb[0], rb[1] * .9), b).por(elip(lerp(o, e, .5), [rb[0] * 1.08, rb[0] * 1.1, rb[0] * 1.1]), b).por(caps(e, w, rb[1], rb[2] * .85), b + 1).por(elip(lerp(e, w, .35), [rb[1] * 1.18, rb[1] * 1.25, rb[1] * 1.18]), b + 1); mao(br, J, l, b + 2, m, fecha, un2);
    if (manga > .9) N(matManga, { k: .05, res: .013 }).por(elip(lerp(o, e, .5), [rb[0] * 1.3, rb[0] * 1.3, rb[0] * 1.3]), b).por(caps(lerp(o, e, .1), e, rb[0] * 1.26, rb[0] * 1.22), b);
    if (manga) N(matManga, { k: .05, res: .013 }).por(elip(o, [rb[0] * 1.3, rb[0] * 1.24, rb[0] * 1.25]), [[b, .55], [2, .45]]).por(caps(o, lerp(o, e, manga), rb[0] * 1.12, rb[0] * 1.14), b);
  }
}

// 1) Cancela: cobrador de pedágio corcunda, com a cancela listrada de porrete e o teto da cabine no ombro
function cancela() {
  const J = juntas({ pelve: .55, coluna: .66, peito: .9, cabeca: [1.16, .16], ombro: [.4, 1.14, .0], cotovelo: [.66, .86, -.03], punho: [.8, .56, .06], coxa: [.16, .53, 0], joelho: [.19, .3, .02], tornozelo: [.2, .1, -.01], dedo: .14 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.3, .24], .19, { dentes: 5, olhos: [.42, .3], testa: 1.25 });
  N(M.pele, { k: .1, res: .015 }).por(caps([0, 1.08, .02], [0, 1.24, .16], .16), [[3, .4], [2, .6]]).por(elip([0, 1.1, -.06], [.42, .27, .27]), 2).por(elip([0, .74, .02], [.27, .22, .22]), 1);
  // colete laranja aberto com faixas claras
  const faixa = p => Math.abs(p[1] - .93) < .035 || Math.abs(Math.abs(p[0]) - .23) < .035 && p[1] > .96 ? M.amarelo : M.laranja;
  N(M.laranja, { k: .09, res: .014, pinta: faixa, imp: 1.2, corte: p => Math.max(.7 + .03 * Math.sin(Math.atan2(p[0], p[2]) * 8) - p[1], p[2] > 0 ? .075 - Math.abs(p[0]) : -1) }).por(elip([0, 1.09, -.055], [.44, .285, .285]), 2).por(elip([0, .78, .0], [.295, .24, .24]), 1);
  // boné de cobrador
  N(M.azul, { k: .02, res: .011, imp: 1.4, corte: p => 1.385 - .25 * (p[2] - .24) - p[1] }).por(elip([0, 1.38, .22], [.2, .15, .2]), 3); N(M.preto, { k: .01, res: .01 }).por(bloco([0, 1.415, .44], [.12, .014, .09], .012, [14, 0, 0]), 3); N(M.amarelo, { res: .008 }).por(elip([0, 1.47, .415], [.035, .035, .02]), 3);
  // pedaço do teto da cabine como ombreira, com os parafusos
  N(M.vermelho, { k: .012, res: .0135, imp: 1.2, sempre: true }).por(bloco([-.44, 1.32, -.02], [.25, .04, .25], .03, [0, 14, 20]), [[7, .4], [2, .6]]); N(M.branco, { k: .01, res: .012, sempre: true }).por(bloco([-.43, 1.275, -.02], [.21, .035, .21], .02, [0, 14, 20]), [[7, .4], [2, .6]]);
  // corrente com molho de chaves/moedas
  const cor = N(M.amarelo, { k: .004, res: .0105 }); for (let i = 0; i < 6; i++) { const a = -.9 + i * .36; cor.por(toro([Math.sin(a) * .27, .72 - Math.cos(a) * .06, .2 + Math.cos(a) * .05], .042, .014, { rot: [90 * (i % 2), 0, 40] }), [[1, .6], [0, .4]]); }
  bracosPernas(N, J, { rb: [.15, .13, .12], rp: [.15, .125, .12], m: .2, fecha: 1 });
  // a cancela (osso da arma): barra listrada, contrapeso e placa
  N(M.listra, { k: .004, res: .0125, imp: 1.6, sempre: true }).por(bloco([0, 0, .74], [.055, .075, .98], .02), 16); N(M.metal, { k: .012, res: .0125, sempre: true }).por(bloco([0, 0, -.34], [.13, .17, .15], .03), 16).por(cil([0, 0, -.1], .05, .05, .1, .02, [0, 0, 90]), 16); N(M.vermelho, { res: .011, sempre: true }).por(cil([0, -.02, 1.1], .17, .17, .022, .012, [0, 0, 90]), 16); N(M.branco, { res: .011, sempre: true }).por(bloco([0, -.02, 1.1], [.03, .03, .105], .01), 16);
  return { g, J };
}
// 2) Operário: barrigudo, capacete de obra, barba e uma marreta feita de rolo compactador
function operario() {
  const J = juntas({ pelve: .52, coluna: .64, peito: .9, cabeca: [1.16, .1], ombro: [.38, 1.1, .0], cotovelo: [.62, .84, -.03], punho: [.74, .56, .07], coxa: [.17, .5, 0], joelho: [.2, .29, .02], tornozelo: [.21, .1, -.01], dedo: .14 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.33, .16], .2, { dentes: 3, olhos: [.3, .4], testa: 1.1 });
  N(M.cabelo, { k: .04, res: .013, imp: 1.2 }).por(elip([0, 1.14, .27], [.17, .1, .1]), 3).por(caps([-.16, 1.28, .2], [-.12, 1.13, .26], .06, .07), 3).por(caps([.16, 1.28, .2], [.12, 1.13, .26], .06, .07), 3).por(caps([0, 1.12, .3], [.02, .98, .33], .09, .03), [[3, .8], [2, .2]]).por(caps([.02, 1.235, .375], [.11, 1.225, .34], .03, .02), 3).por(caps([-.02, 1.235, .375], [-.11, 1.225, .34], .03, .02), 3).tirar(elip([0, 1.2, .38], [.09, .03, .08]), .02);
  N(M.amarelo, { k: .02, res: .012, imp: 1.5, corte: p => 1.41 - .12 * (p[2] - .16) - p[1] }).por(elip([0, 1.41, .14], [.235, .19, .235]), 3).por(caps([0, 1.58, -.03], [0, 1.585, .28], .035), 3, { k: .03 }).por(bloco([0, 1.425, .33], [.16, .018, .13], .015, [8, 0, 0]), 3);
  N(M.pele, { k: .1, res: .015 }).por(caps([0, 1.05, .0], [0, 1.25, .1], .17), [[3, .4], [2, .6]]).por(elip([0, .74, .09], [.36, .28, .34]), [[1, .7], [0, .3]]).por(elip([0, 1.04, -.02], [.38, .24, .25]), 2);
  N(M.roupa, { k: .1, res: .015, corte: p => .62 + .02 * Math.sin(Math.atan2(p[0], p[2]) * 9) - p[1] }).por(elip([0, .76, .085], [.37, .28, .345]), [[1, .7], [0, .3]]).por(elip([0, 1.04, -.02], [.392, .25, .262]), 2);
  const fx = p => Math.abs(p[1] - .86) < .035 || Math.abs(Math.abs(p[0]) - .2) < .035 && p[1] > .9 ? M.branco : M.laranja;
  N(M.laranja, { k: .1, res: .0145, imp: 1.2, pinta: fx, corte: p => Math.max(.74 - p[1], p[2] > 0 ? .1 + (1.1 - p[1]) * .12 - Math.abs(p[0]) : -1) }).por(elip([0, .78, .08], [.395, .3, .365]), [[1, .7], [0, .3]]).por(elip([0, 1.04, -.02], [.412, .262, .278]), 2);
  N(M.couro, { k: .02, res: .013 }).por(toro([0, .575, .04], .31, .05, { sz: .95 }), 0); N(M.metal, { k: .01, res: .012 }).por(bloco([0, .575, .345], [.07, .05, .03], .015), 0); for (const s of [1, -1]) N(M.madeira, { k: .01, res: .012 }).por(bloco([s * .3, .5, .12], [.05, .1, .08], .02), 0);
  bracosPernas(N, J, { rb: [.15, .135, .125], rp: [.16, .13, .13], m: .2, fecha: 1, manga: .45 });
  // marreta-rolo
  N(M.madeira, { k: .01, res: .0125, sempre: true, imp: 1.3 }).por(caps([0, 0, -.35], [0, 0, 1.0], .05, .055), 16);
  N(M.metal, { k: .015, res: .0145, sempre: true, imp: 1.3 }).por(cil([0, 0, 1.0], .26, .26, .33, .05, [0, 0, 0]), 16).por(toro([0, .28, 1.0], .225, .028), 16).por(toro([0, -.28, 1.0], .225, .028), 16); N(M.amarelo, { k: .01, res: .0125, sempre: true }).por(toro([0, 0, 1.0], .252, .05, { sy: 1.2 }), 16).por(cil([0, 0, 1.0], .09, .09, .36, .03, [0, 0, 0]), 16);
  return { g, J };
}
// 3) Sirene: magrela e comprida, alto-falantes nos ombros, boca enorme e uma lâmpada na cabeça
function sirene() {
  const J = juntas({ pelve: .82, coluna: .95, peito: 1.14, cabeca: [1.36, .06], ombro: [.24, 1.28, .0], cotovelo: [.46, 1.0, -.05], punho: [.6, .66, .06], coxa: [.1, .8, 0], joelho: [.12, .46, .03], tornozelo: [.13, .1, -.01], dedo: .16 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  // cabeça: boca enorme aberta
  const pele = N(M.pele, { k: .05, res: .012, imp: 1.8 });
  pele.por(elip([0, 1.6, .08], [.17, .17, .165]), 3).por(elip([0, 1.43, .13], [.15, .13, .14]), 3).por(caps([0, 1.24, .0], [0, 1.42, .06], .075), [[3, .6], [2, .4]]).por(elip([0, 1.36, .14], [.13, .06, .12]), 3).tirar(elip([0, 1.46, .26], [.115, .125, .17]), .025);
  N(M.boca, { res: .011, sempre: true }).por(elip([0, 1.46, .12], [.13, .13, .1]), 3);
  const den = N(M.osso, { k: .003, res: .009, sempre: true, imp: 1.4 }); for (let i = 0; i < 6; i++) { const u = (i + .5) / 6 * 2 - 1, z = .235 - u * u * .06; den.por(caps([u * .1, 1.565 - u * u * .03, z], [u * .095, 1.51 - u * u * .03, z + .01], .022, .008), 3).por(caps([u * .1, 1.365 + u * u * .03, z - .01], [u * .095, 1.415 + u * u * .03, z], .022, .008), 3); }
  for (const s of [1, -1]) { N(M.olho, { res: .008, imp: 2.5, sempre: true }).por(elip([s * .075, 1.645, .22], [.05, .058, .035], [0, s * 18, s * -20]), 3); N(M.preto, { res: .006, imp: 2.5, sempre: true }).por(elip([s * .068, 1.64, .252], [.014, .026, .012]), 3); pele.por(caps([s * .02, 1.69, .235], [s * .13, 1.735, .18], .024, .02), 3, { k: .015 }); }
  // lâmpada de viatura na cabeça
  N(M.metal, { k: .01, res: .011 }).por(cil([0, 1.77, .05], .12, .115, .03, .015), 3); N(M.vermelho, { k: .02, res: .011, sempre: true }).por(elip([0, 1.82, .05], [.1, .09, .1]), 3);
  // tronco magro com costelas
  N(M.pele, { k: .07, res: .0135 }).por(elip([0, 1.18, -.01], [.21, .17, .14]), 2).por(elip([0, .97, .0], [.125, .16, .1]), 1).por(elip([0, .85, 0], [.14, .1, .11]), 0);
  const cos = N(M.osso, { k: .008, res: .011 }); for (const s of [1, -1]) for (let k = 0; k < 4; k++) cos.por(caps([s * .03, 1.2 - k * .062, .132 - k * .005], [s * .155, 1.22 - k * .062, .065], .019), [[2, .7], [1, .3]]);
  N(M.roupa, { k: .06, res: .013, corte: p => Math.max(.62 + .06 * Math.sin(Math.atan2(p[0], p[2]) * 6) - p[1], p[1] - .93) }).por(elip([0, .85, 0], [.165, .13, .135]), 0).por(elip([0, .74, 0], [.19, .2, .16]), 0);
  // cornetas nos ombros e cabos
  for (const [s, b] of [[1, 4], [-1, 7]]) { const o = [[b, .25], [2, .75]]; N(M.amarelo, { k: .01, res: .0125, imp: 1.3, sempre: true }).por(corneta([s * .3, 1.47, .1], .06, .2, .34, .016, [-12, s * 18, 0]), o); N(M.metal, { k: .015, res: .0125, sempre: true }).por(cil([s * .25, 1.43, -.1], .1, .1, .07, .03, [78, s * 18, 0]), o).por(caps([s * .24, 1.3, -.05], [s * .27, 1.42, -.06], .04), o); N(M.preto, { res: .011, sempre: true }).por(elip([s * .28, 1.455, .0], [.085, .085, .05], [-12, s * 18, 0]), o); }
  N(M.metal, { k: .01, res: .012, sempre: true }).por(bloco([0, 1.18, -.16], [.15, .16, .06], .03), 2); const cabo = N(M.preto, { k: .006, res: .0115 }); for (const s of [1, -1]) cabo.por(caps([s * .12, 1.25, -.2], [s * .27, 1.38, -.2], .022), 2).por(caps([s * .27, 1.38, -.2], [s * .26, 1.43, -.15], .022), 2).por(caps([s * .1, 1.08, -.2], [s * .17, .95, -.08], .022), [[1, .6], [2, .4]]).por(caps([s * .17, .95, -.08], [s * .13, .86, .08], .022), [[0, .5], [1, .5]]);
  bracosPernas(N, J, { rb: [.075, .07, .062], rp: [.085, .07, .065], m: .17, fecha: .1, bota: false, pelada: true });
  return { g, J };
}
// 4) Carcaça: bolota de ferro-velho; as placas soltas (capô, portas) são peças à parte, presas em cima
function carcaca() {
  const J = juntas({ pelve: .5, coluna: .62, peito: .88, cabeca: [1.12, .2], ombro: [.45, 1.05, .0], cotovelo: [.7, .76, -.03], punho: [.82, .48, .08], coxa: [.2, .48, 0], joelho: [.235, .28, .02], tornozelo: [.24, .1, -.01], dedo: .15 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.2, .33], .19, { boca: true, dentes: 5, olhos: [.0001, .44], testa: 1.1 });
  // farol no lugar de um olho, para-choque de queixo
  N(M.metal, { res: .009, sempre: true, imp: 1.5 }).por(toro([.085, 1.225, .5], .06, .018, { rot: [90, 0, 0] }), 3); N(M.visor, { res: .009, sempre: true }).por(elip([.085, 1.225, .5], [.06, .06, .035]), 3);
  N(M.metal, { k: .015, res: .011, imp: 1.4, sempre: true }).por(bloco([0, 1.045, .5], [.2, .035, .035], .025), 3).por(bloco([.2, 1.06, .44], [.04, .045, .09], .025, [0, -35, 0]), 3).por(bloco([-.2, 1.06, .44], [.04, .045, .09], .025, [0, 35, 0]), 3).por(bloco([.09, 1.08, .52], [.02, .05, .02], .012), 3).por(bloco([-.09, 1.08, .52], [.02, .05, .02], .012), 3);
  N(M.pele, { k: .12, res: .016 }).por(elip([0, .82, .0], [.47, .42, .4]), [[1, .5], [2, .5]]).por(elip([0, 1.05, .04], [.4, .24, .28]), 2).por(caps([0, 1.0, .1], [0, 1.16, .25], .18), [[3, .4], [2, .6]]);
  // colar de pneus e escapamentos nas costas
  N(M.borracha, { k: .015, res: .014, imp: 1.2, sempre: true }).por(toro([0, 1.1, .12], .27, .1, { rot: [32, 0, 0] }), 2); N(M.borracha, { k: .02, res: .014, sempre: true }).por(toro([-.48, 1.12, -.02], .17, .085, { rot: [0, 0, 60] }), [[7, .5], [2, .5]]);
  N(M.metal, { k: .02, res: .0125, sempre: true }).por(caps([.16, .95, -.36], [.2, 1.4, -.42], .05, .055), 2).por(caps([-.12, .95, -.38], [-.15, 1.32, -.44], .05, .055), 2).tirar(caps([.195, 1.36, -.42], [.205, 1.5, -.43], .035), .004).tirar(caps([-.148, 1.28, -.44], [-.155, 1.45, -.45], .035), .004);
  const rasgo = p => .04 * Math.sin(Math.atan2(p[0], p[2]) * 7);
  N(M.roupa, { k: .1, res: .015, corte: p => Math.max(.5 + rasgo(p) - p[1], p[1] - .78 - rasgo(p) * .6) }).por(elip([0, .8, .0], [.485, .42, .415]), [[0, .4], [1, .6]]);
  bracosPernas(N, J, { rb: [.16, .16, .15], rp: [.17, .14, .14], m: .23, fecha: .55 });
  return { g, J };
}

// 5) Afogada: noiva do rio, cabelo de alga até a cintura, vestido rasgado, rede de pesca, boias no pescoço e âncora na mão
function afogada() {
  const J = juntas({ pelve: .74, coluna: .88, peito: 1.1, cabeca: [1.33, .05], ombro: [.31, 1.24, .0], cotovelo: [.53, .96, -.04], punho: [.68, .64, .06], coxa: [.13, .72, 0], joelho: [.15, .42, .02], tornozelo: [.16, .1, -.01], dedo: .15 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.52, .1], .19, { dentes: 6, olhos: [.46, .46], testa: .9 });
  N(M.pele, { k: .08, res: .0135 }).por(caps([0, 1.22, .0], [0, 1.42, .05], .09), [[3, .5], [2, .5]]).por(elip([0, 1.15, -.01], [.28, .19, .17]), 2).por(elip([0, .95, .0], [.17, .18, .13]), 1);
  // cabelo de alga: mechas grossas que descem dos dois lados e nas costas
  const cab = N(M.cabelo, { k: .045, res: .0125, imp: 1.3 }); cab.por(elip([0, 1.62, .03], [.205, .15, .2]), 3).por(elip([0, 1.5, -.08], [.2, .22, .14]), 3);
  for (const s of [1, -1]) { cab.por(caps([s * .16, 1.6, .12], [s * .21, 1.36, .15], .06, .05), 3).por(caps([s * .21, 1.36, .15], [s * .2, 1.08, .19], .05, .04), [[3, .4], [2, .6]]).por(caps([s * .2, 1.08, .19], [s * .24, .86, .2], .04, .014), 2).por(caps([s * .18, 1.5, -.06], [s * .3, 1.22, -.16], .075, .06), [[3, .5], [2, .5]]).por(caps([s * .3, 1.22, -.16], [s * .26, .84, -.2], .06, .016), 2); }
  cab.por(caps([0, 1.46, -.16], [.04, 1.1, -.25], .1, .075), [[3, .4], [2, .6]]).por(caps([.04, 1.1, -.25], [-.04, .7, -.26], .075, .018), [[2, .5], [1, .5]]).por(caps([-.1, 1.3, -.2], [-.14, .82, -.25], .06, .016), 2);
  // folhas de alga e estrela-do-mar
  N(M.laranja, { k: .012, res: .0095, imp: 1.4, sempre: true }).por(elip([.1, 1.7, .2], [.03, .03, .02]), 3).por(caps([.1, 1.7, .2], [.16, 1.75, .17], .022, .008), 3).por(caps([.1, 1.7, .2], [.17, 1.66, .18], .022, .008), 3).por(caps([.1, 1.7, .2], [.04, 1.75, .2], .022, .008), 3).por(caps([.1, 1.7, .2], [.05, 1.64, .23], .022, .008), 3);
  // vestido rasgado até o joelho
  const barra = p => .3 + .075 * Math.sin(Math.atan2(p[0], p[2]) * 6) + .03 * Math.sin(Math.atan2(p[0], p[2]) * 13 + 1), saia = [[0, .46], [10, .27], [13, .27]];
  N(M.roupa, { k: .07, res: .0145, imp: 1.1, corte: p => barra(p) - p[1], pinta: p => p[1] < barra(p) + .05 ? M.calca : M.roupa }).por(elip([0, 1.06, .0], [.27, .2, .165]), 2).por(elip([0, .92, 0], [.2, .17, .155]), 1).por(elip([0, .78, 0], [.23, .16, .2]), 0).por(cil([0, .52, .0], .37, .22, .27, .05), saia);
  // rede de pesca atravessada
  const red = N(M.madeira, { k: .004, res: .0105, sempre: true }); for (let k = 0; k < 4; k++) red.por(toro([0, 1.16 - k * .1, .0], .255 - k * .018, .014, { sz: .72, rot: [0, 0, 28] }), k < 2 ? 2 : [[2, .5], [1, .5]]); for (let k = 0; k < 4; k++) red.por(caps([-.2 + k * .13, 1.24 - k * .045, .19 - Math.abs(k - 1.5) * .03], [-.1 + k * .1, .84 - k * .03, .19 - Math.abs(k - 1.5) * .03], .012), [[2, .6], [1, .4]]);
  // boias no pescoço
  for (let i = 0; i < 7; i++) { const a = -1.25 + i * .417; N(i % 2 ? M.branco : M.vermelho, { res: .0105, imp: 1.2, sempre: true }).por(elip([Math.sin(a) * .22, 1.23 - Math.cos(a) * .06, .02 + Math.cos(a) * .17], [.052, .05, .05]), 2); }
  // cracas no ombro
  const cr = N(M.osso, { k: .006, res: .0105, sempre: true }); for (const [x, y, z] of [[-.33, 1.33, .03], [-.4, 1.3, -.03], [-.28, 1.35, -.06], [-.37, 1.31, .1]]) cr.por(cil([x, y, z], .045, .022, .035, .01, [0, 0, 25]), [[7, .5], [2, .5]]);
  bracosPernas(N, J, { rb: [.09, .08, .072], rp: [.1, .085, .075], m: .18, fecha: .7, bota: false, pelada: true });
  // âncora
  N(M.metal, { k: .03, res: .0125, imp: 1.4, sempre: true }).por(caps([0, 0, -.3], [0, 0, 1.05], .045, .05), 16).por(caps([0, 0, 1.05], [.2, 0, .96], .06, .05), 16).por(caps([.2, 0, .96], [.34, 0, .74], .05, .035), 16).por(caps([0, 0, 1.05], [-.2, 0, .96], .06, .05), 16).por(caps([-.2, 0, .96], [-.34, 0, .74], .05, .035), 16).por(caps([-.18, 0, .06], [.18, 0, .06], .035), 16).por(toro([0, 0, -.38], .09, .026, { rot: [0, 0, 0] }), 16, { k: .01 });
  N(M.cabelo, { k: .02, res: .0115, sempre: true }).por(toro([0, 0, .5], .06, .03, { rot: [90, 0, 10] }), 16).por(caps([.03, -.04, .5], [.05, -.22, .46], .03, .008), 16).por(caps([-.03, -.04, .56], [-.02, -.3, .6], .03, .008), 16);
  return { g, J };
}
// 6) Guindaste: máquina viva de obra, cabine no lugar da cabeça, lança nas costas e gancho na mão
function guindaste() {
  const J = juntas({ pelve: .56, coluna: .68, peito: .94, cabeca: [1.2, .1], ombro: [.46, 1.12, .0], cotovelo: [.7, .84, -.03], punho: [.82, .54, .06], coxa: [.2, .54, 0], joelho: [.23, .31, .02], tornozelo: [.24, .1, -.01], dedo: .15 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  // cabine-cabeça: teto, vidro com olhos atrás e mandíbula de caçamba
  N(M.amarelo, { k: .02, res: .0125, imp: 1.5 }).por(bloco([0, 1.56, .06], [.235, .05, .22], .04), 3).por(bloco([0, 1.3, .04], [.225, .07, .2], .04), 3).por(bloco([0, 1.43, -.1], [.225, .17, .07], .04), 3).por(bloco([.2, 1.43, .18], [.03, .15, .03], .02), 3).por(bloco([-.2, 1.43, .18], [.03, .15, .03], .02), 3);
  N(M.visor, { res: .0115, sempre: true, imp: 1.2 }).por(bloco([0, 1.43, .08], [.2, .13, .14], .04), 3);
  for (const s of [1, -1]) { N(M.olho, { res: .0085, imp: 2.4, sempre: true }).por(elip([s * .088, 1.44, .215], [.075, .085, .04]), 3); N(M.preto, { res: .0075, imp: 2.4, sempre: true }).por(elip([s * .075, 1.43, .25], [.026, .034, .016]), 3); N(M.preto, { k: .01, res: .01, imp: 1.6, sempre: true }).por(caps([s * .03, 1.515, .235], [s * .165, 1.55, .22], .024, .02), 3); }
  N(M.metal, { k: .015, res: .0115, imp: 1.4, sempre: true, pinta: p => p[2] > .27 ? M.osso : M.metal }).por(bloco([0, 1.2, .16], [.19, .04, .13], .03, [8, 0, 0]), 3).por(bloco([.15, 1.23, .27], [.026, .05, .03], .014), 3).por(bloco([.05, 1.23, .28], [.026, .055, .03], .014), 3).por(bloco([-.05, 1.23, .28], [.026, .055, .03], .014), 3).por(bloco([-.15, 1.23, .27], [.026, .05, .03], .014), 3);
  N(M.laranja, { k: .02, res: .011, sempre: true }).por(cil([.12, 1.645, .02], .06, .05, .05, .02), 3);
  // tronco de motor com faixas, grade e escapamento
  const zebra = p => p[1] < .82 && (((p[0] * 1.1 + p[1]) * 7 % 2 + 2) % 2 < 1) ? M.preto : M.amarelo;
  N(M.amarelo, { k: .06, res: .0155, imp: 1.2, pinta: zebra }).por(bloco([0, .98, .0], [.4, .24, .27], .1), 2).por(bloco([0, .74, .02], [.32, .13, .25], .09), 1);
  N(M.preto, { k: .006, res: .0125, sempre: true }).por(bloco([0, 1.0, .265], [.25, .15, .03], .03), 2); const gr = N(M.metal, { k: .003, res: .0115, sempre: true }); for (let k = 0; k < 4; k++) gr.por(bloco([0, 1.09 - k * .06, .295], [.23, .014, .016], .01), 2);
  N(M.pele, { k: .06, res: .0155 }).por(elip([0, .58, 0], [.28, .15, .23]), 0).por(caps([0, 1.14, .04], [0, 1.3, .08], .15), [[3, .4], [2, .6]]).por(elip([.43, 1.12, 0], [.16, .15, .15]), [[4, .5], [2, .5]]).por(elip([-.43, 1.12, 0], [.16, .15, .15]), [[7, .5], [2, .5]]);
  // lança nas costas, com cabo
  N(M.listra, { k: .004, res: .0135, imp: 1.4, sempre: true, pinta: p => Math.floor(p[1] * 5) % 2 ? M.preto : M.amarelo }).por(bloco([.17, 1.5, -.33], [.045, .56, .045], .015, [-10, 0, 0]), 2).por(bloco([-.17, 1.5, -.33], [.045, .56, .045], .015, [-10, 0, 0]), 2);
  const tre = N(M.metal, { k: .004, res: .0125, sempre: true }); for (let k = 0; k < 4; k++) { const y = 1.08 + k * .26, z = -.4 + k * .045; tre.por(caps([-.17, y, z], [.17, y + .22, z + .035], .026), 2).por(caps([-.17, y, z], [.17, y, z], .026), 2); }
  N(M.vermelho, { k: .01, res: .0125, sempre: true }).por(cil([0, 2.07, -.22], .1, .1, .19, .03, [0, 0, 90]), 2); N(M.metal, { k: .015, res: .0125, sempre: true }).por(bloco([0, .98, -.36], [.27, .2, .12], .05), 2);
  bracosPernas(N, J, { rb: [.15, .14, .135], rp: [.17, .14, .14], m: .22, fecha: 1, un: false });
  // braços com pistões e punhos de máquina
  for (const [l, s, b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l], o = J['braco' + l]; N(M.amarelo, { k: .03, res: .0135, imp: 1.1, pinta: p => (((p[1] * 9) % 2 + 2) % 2 < .7) ? M.preto : M.amarelo }).por(caps(lerp(e, w, .05), lerp(e, w, .85), .195, .165), b + 1); N(M.metal, { k: .01, res: .0125, sempre: true }).por(caps(add(lerp(o, e, .15), [s * .1, .07, 0]), add(lerp(e, w, .2), [s * .13, .06, 0]), .035), [[b, .5], [b + 1, .5]]);
    const t = J['pe' + l]; N(M.borracha, { k: .02, res: .0135, imp: 1.1 }).por(bloco([t[0] + s * .01, .07, .04], [.16, .07, .25], .05), l === 'E' ? 12 : 15); N(M.amarelo, { k: .02, res: .0135 }).por(bloco([t[0] + s * .01, .17, .02], [.12, .07, .15], .04), l === 'E' ? 12 : 15); }
  // gancho
  N(M.preto, { k: .006, res: .0115, sempre: true }).por(caps([0, 0, -.3], [0, 0, .42], .05), 16); N(M.vermelho, { k: .02, res: .0125, sempre: true, imp: 1.3 }).por(bloco([0, 0, .52], [.11, .13, .12], .05), 16);
  const gan = N(M.metal, { k: .035, res: .0125, sempre: true, imp: 1.4 }); let a = [0, 0, .64]; for (let k = 0; k <= 7; k++) { const q = k / 7 * 4.1, b = [0, Math.sin(q) * .24 - .02, .93 - Math.cos(q) * .27 + .02]; gan.por(caps(a, b, .075 - k * .005, .075 - (k + 1) * .005), 16); a = b; }
  return { g, J };
}
// 7) Fornalha: caldeirão com pernas, porta de forno na barriga, rachaduras em brasa e chaminés
function fornalha() {
  const J = juntas({ pelve: .52, coluna: .64, peito: .9, cabeca: [1.17, .12], ombro: [.42, 1.1, .0], cotovelo: [.66, .82, -.03], punho: [.78, .54, .08], coxa: [.18, .5, 0], joelho: [.21, .29, .02], tornozelo: [.22, .1, -.01], dedo: .15 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  const racha = base => p => { const a = Math.sin(p[0] * 17 + Math.sin(p[1] * 13) * 1.6 + p[2] * 9) + .6 * Math.sin(p[1] * 21 + p[0] * 11 - p[2] * 15); return Math.abs(a) < .13 ? M.brilho : base; };
  // barriga-caldeirão com a boca do forno
  const bar = N(M.metal, { k: .05, res: .0145, imp: 1.2 }); bar.por(elip([0, .82, .03], [.43, .39, .4]), [[1, .7], [2, .3]]).tirar(elip([0, .8, .42], [.21, .17, .2]), .03);
  N(M.brilho, { res: .0135, sempre: true }).por(elip([0, .8, .23], [.22, .18, .13]), 1);
  N(M.cano, { k: .01, res: .0125, sempre: true, imp: 1.3 }).por(toro([0, .8, .385], .215, .04, { rot: [90, 0, 0], sz: .82 }), 1); const grd = N(M.preto, { k: .003, res: .0115, sempre: true }); for (const x of [-.12, -.04, .04, .12]) grd.por(caps([x, .66, .4 - x * x * 2], [x, .94, .4 - x * x * 2], .012), 1);
  const reb = N(M.amarelo, { k: 0, res: .0115, sempre: true }); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; reb.por(elip([Math.sin(a) * .375, 1.02, .03 + Math.cos(a) * .35], [.026, .026, .026]), [[1, .4], [2, .6]]); }
  N(M.cano, { k: .02, res: .0135, imp: 1.1 }).por(toro([0, 1.02, .03], .36, .04, { sz: .95 }), [[1, .4], [2, .6]]).por(toro([0, .55, .03], .31, .04, { sz: .95 }), 0);
  // ombros e pescoço em brasa
  N(M.pele, { k: .1, res: .0145, pinta: racha(M.pele) }).por(elip([0, 1.1, -.02], [.4, .18, .24]), 2).por(caps([0, 1.08, .04], [0, 1.22, .12], .17), [[3, .4], [2, .6]]);
  // cabeça: elmo de fundição com olhos e boca acesos
  N(M.metal, { k: .03, res: .0125, imp: 1.5 }).por(elip([0, 1.36, .13], [.21, .22, .2]), 3).por(bloco([0, 1.24, .22], [.15, .09, .12], .05), 3).por(caps([-.15, 1.43, .27], [.15, 1.43, .27], .04), 3).por(caps([0, 1.56, .12], [0, 1.4, .33], .03), 3);
  for (const s of [1, -1]) N(M.brilho, { res: .0085, imp: 2.4, sempre: true }).por(elip([s * .085, 1.365, .3], [.055, .03, .05], [0, s * 16, s * 16]), 3);
  N(M.brilho, { res: .0095, sempre: true, imp: 1.5 }).por(bloco([0, 1.235, .335], [.105, .035, .02], .014), 3); const dn = N(M.preto, { k: 0, res: .0095, sempre: true }); for (const x of [-.07, -.023, .023, .07]) dn.por(bloco([x, 1.235, .35], [.009, .042, .02], .006), 3);
  for (const s of [1, -1]) N(M.osso, { k: .01, res: .0115, imp: 1.3, sempre: true }).por(caps([s * .17, 1.45, .1], [s * .31, 1.53, .1], .05, .04), 3).por(caps([s * .31, 1.53, .1], [s * .34, 1.67, .15], .04, .01), 3);
  // chaminés
  for (const [x, z, h] of [[.22, -.3, 1.66], [-.2, -.32, 1.5]]) { N(M.cano, { k: .015, res: .0135, sempre: true, imp: 1.2 }).por(caps([x, .95, z], [x * 1.1, h, z - .04], .085, .09), 2).por(toro([x * 1.1, h, z - .04], .085, .028), 2); N(M.brilho, { res: .0115, sempre: true }).por(cil([x * 1.1, h + .075, z - .04], .07, .07, .025, .01), 2); N(M.laranja, { res: .0125, sempre: true }).por(toro([x * 1.03, 1.2, z - .02], .085, .022), 2); }
  // avental de couro atrás e calça
  N(M.couro, { k: .02, res: .0135 }).por(bloco([0, .5, -.24], [.24, .16, .04], .03, [-6, 0, 0]), 0);
  const antes = g.length; bracosPernas(N, J, { rb: [.16, .15, .14], rp: [.16, .135, .135], m: .22, fecha: .95, un: false }); for (let i = antes; i < g.length; i++) if (g[i].mat === M.pele) g[i].pinta = racha(M.pele);
  for (const [l, s, b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l]; N(M.cano, { k: .02, res: .0135 }).por(toro(lerp(e, w, .7), .145, .045, { sy: 1.3, rot: [0, 0, s * 24] }), b + 1); N(M.metal, { k: .03, res: .0135, imp: 1.2 }).por(elip([s * .46, 1.2, -.01], [.17, .1, .17], [0, 0, s * -22]), [[b, .5], [2, .5]]); const c = J['canela' + l]; N(M.metal, { k: .02, res: .0135 }).por(elip([c[0], c[1], c[2] + .1], [.12, .12, .07]), [[l === 'E' ? 11 : 14, .6], [l === 'E' ? 10 : 13, .4]]); }
  return { g, J };
}
// 8) Mãe da Ponte: coroa de torres com cabos, saia de concreto, costelas de aço e um núcleo aceso no peito
function mae() {
  const J = juntas({ pelve: .7, coluna: .84, peito: 1.08, cabeca: [1.34, .08], ombro: [.38, 1.24, .0], cotovelo: [.64, .95, -.04], punho: [.82, .62, .08], coxa: [.17, .68, 0], joelho: [.2, .4, .02], tornozelo: [.21, .12, -.01], dedo: .17 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.53, .13], .2, { dentes: 7, olhos: [.4, .4], testa: .8 });
  N(M.olho, { res: .008, imp: 2.5, sempre: true }).por(elip([0, 1.645, .285], [.05, .058, .035]), 3); N(M.preto, { res: .0065, imp: 2.5, sempre: true }).por(elip([0, 1.643, .318], [.015, .026, .01]), 3);
  N(M.pele, { k: .1, res: .0145 }).por(caps([0, 1.22, .0], [0, 1.44, .08], .12), [[3, .5], [2, .5]]).por(elip([0, 1.14, -.02], [.36, .22, .22]), 2).por(elip([0, .92, .0], [.22, .2, .17]), 1);
  // coroa: duas torres de ponte com travessas
  const tor = N(M.vermelho, { k: .006, res: .0125, imp: 1.5, sempre: true }); for (const s of [1, -1]) tor.por(bloco([s * .16, 1.86, .06], [.042, .22, .045], .015, [0, 0, s * -7]), 3).por(bloco([s * .19, 2.09, .06], [.058, .025, .06], .012), 3); for (const y of [1.78, 1.92, 2.04]) tor.por(bloco([0, y, .06], [.17, .022, .032], .012), 3); tor.por(caps([-.16, 1.8, .06], [.17, 1.9, .06], .016), 3).por(caps([.16, 1.8, .06], [-.17, 1.9, .06], .016), 3);
  N(M.cabelo, { k: .02, res: .0125, imp: 1.2 }).por(toro([0, 1.67, .07], .18, .05, { sy: 1.1, rot: [-8, 0, 0] }), 3);
  // cabos: da coroa aos ombros e às costas
  const cab = N(M.cano, { k: .004, res: .0115, sempre: true, imp: 1.1 }); for (const s of [1, -1]) { let a = [s * .2, 2.09, .06]; for (let k = 1; k <= 6; k++) { const q = k / 6, b = [s * (.2 + q * .36), 2.09 - 1.0 * q + .34 * q * q, .06 - q * .12]; cab.por(caps(a, b, .024), q < .5 ? 3 : [[3, 1 - q], [2, q]]); if (k % 2 === 0 && k < 6) cab.por(caps(b, [b[0] * .86, 1.36 - q * .02, b[2]], .013), [[3, .5], [2, .5]]); a = b; } cab.por(caps([s * .19, 2.07, .05], [s * .24, 1.3, -.3], .022), [[3, .5], [2, .5]]).por(caps([s * .12, 2.05, .04], [s * .1, 1.2, -.32], .02), [[3, .5], [2, .5]]); }
  // núcleo e costelas de aço
  N(M.brilho, { res: .0115, imp: 1.3, sempre: true }).por(elip([0, 1.1, .16], [.14, .13, .1]), 2);
  const cos = N(M.vermelho, { k: .012, res: .0125, imp: 1.2, sempre: true }); for (const s of [1, -1]) for (let k = 0; k < 3; k++) { const y = 1.23 - k * .13; cos.por(caps([s * .31, y + .02, .03], [s * .23, y - .01, .19], .032), 2).por(caps([s * .23, y - .01, .19], [s * .1, y - .06, .245], .032, .022), 2); } cos.por(caps([0, 1.32, -.2], [0, .82, -.2], .05), [[2, .5], [1, .5]]);
  // saia de concreto em arcos
  const saia = [[0, .4], [10, .3], [13, .3]], arco = p => { const a = Math.atan2(p[0], p[2]); return .12 + .15 * Math.max(0, Math.cos(a * 4)) ** .6; };
  N(M.osso, { k: .05, res: .0155, imp: 1.1, corte: p => arco(p) - p[1], pinta: p => Math.abs(p[1] - .63) < .03 ? M.amarelo : M.osso }).por(elip([0, .76, 0], [.31, .13, .27]), 0).por(cil([0, .42, .0], .52, .32, .35, .04), saia);
  N(M.vermelho, { k: .02, res: .0135 }).por(toro([0, .8, 0], .28, .05, { sz: .85 }), 0); N(M.amarelo, { k: .01, res: .0125, sempre: true }).por(bloco([0, .8, .25], [.08, .06, .035], .02), 0);
  const antes = g.length; bracosPernas(N, J, { rb: [.12, .105, .1], rp: [.14, .12, .12], m: .21, fecha: .35 });
  for (const [l, s, b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l], o = J['braco' + l]; N(M.vermelho, { k: .01, res: .0125, imp: 1.2, sempre: true }).por(caps(add(lerp(e, w, .05), [s * .11, .03, 0]), add(lerp(e, w, .95), [s * .09, .03, 0]), .03), b + 1).por(caps(add(lerp(e, w, .05), [0, .03, .12]), add(lerp(e, w, .95), [0, .03, .1]), .03), b + 1).por(toro(lerp(e, w, .08), .115, .032, { rot: [0, 0, s * 30] }), b + 1).por(toro(lerp(e, w, .5), .112, .028, { rot: [0, 0, s * 30] }), b + 1).por(toro(lerp(e, w, .92), .105, .032, { rot: [0, 0, s * 30] }), b + 1); N(M.osso, { k: .03, res: .0135 }).por(elip([s * .41, 1.31, -.01], [.16, .1, .16], [0, 0, s * -20]), [[b, .5], [2, .5]]); }
  return { g, J };
}

// 9) Nevasca: gigante peludo da montanha, chifres e espinhos de gelo, com a lâmina de um limpa-neve na mão
function nevasca() {
  const J = juntas({ pelve: .54, coluna: .66, peito: .92, cabeca: [1.16, .16], ombro: [.44, 1.12, .0], cotovelo: [.68, .84, -.03], punho: [.8, .52, .06], coxa: [.19, .52, 0], joelho: [.22, .3, .02], tornozelo: [.23, .1, -.01], dedo: .15 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.3, .24], .2, { dentes: 4, olhos: [.4, .4], testa: 1.3 });
  // pelo em tufos
  const pelo = N(M.branco, { k: .05, res: .0155, imp: 1.1 }); pelo.por(elip([0, 1.1, -.05], [.45, .28, .3]), 2).por(elip([0, .76, .02], [.36, .28, .3]), [[1, .7], [0, .3]]).por(elip([0, 1.36, .12], [.23, .2, .2]), 3).por(elip([0, .56, .0], [.3, .17, .25]), 0);
  for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, x = Math.sin(a), z = Math.cos(a); pelo.por(caps([x * .32, .82, .02 + z * .26], [x * .4, .6, .02 + z * .33], .075, .012), [[1, .6], [0, .4]]); if (z < .6) pelo.por(caps([x * .4, 1.12, -.04 + z * .24], [x * .5, .92, -.04 + z * .3], .08, .014), 2); }
  for (const s of [1, -1]) pelo.por(caps([s * .15, 1.2, .3], [s * .18, 1.02, .36], .07, .015), 3).por(caps([s * .06, 1.13, .34], [s * .06, .96, .4], .06, .012), 3).por(caps([s * .12, 1.5, .16], [s * .2, 1.62, .1], .06, .012), 3);
  for (const s of [1, -1]) N(M.visor, { k: .015, res: .0125, imp: 1.4, sempre: true }).por(caps([s * .17, 1.42, .12], [s * .34, 1.5, .1], .07, .05), 3).por(caps([s * .34, 1.5, .1], [s * .4, 1.72, .18], .05, .008), 3);
  const gelo = N(M.visor, { k: .008, res: .0135, imp: 1.2, sempre: true }); for (const [x, y, z, h, a] of [[0, 1.26, -.28, .46, 0], [.2, 1.2, -.28, .36, .25], [-.2, 1.2, -.28, .36, -.25], [.1, .98, -.33, .32, .1], [-.12, .98, -.33, .3, -.1]]) gelo.por(caps([x, y, z], [x + a * .5, y + h * .75, z - h * .75], .085, .008), 2);
  // cachecol e cinto de corrente
  N(M.vermelho, { k: .03, res: .0135, imp: 1.2 }).por(toro([0, 1.14, .16], .22, .075, { rot: [28, 0, 0] }), [[3, .4], [2, .6]]).por(caps([.16, 1.06, .34], [.2, .74, .4], .07, .06), [[2, .6], [1, .4]]);
  const cor = N(M.metal, { k: .004, res: .0115 }); for (let i = 0; i < 9; i++) { const a = -1.2 + i * .3; cor.por(toro([Math.sin(a) * .33, .6 - Math.cos(a) * .03, .02 + Math.cos(a) * .3], .05, .017, { rot: [90 * (i % 2), 0, 40] }), 0); }
  const antes = g.length; bracosPernas(N, J, { rb: [.16, .15, .13], rp: [.17, .14, .14], m: .21, fecha: 1 });
  for (const [l, s, b, c] of LADOS) { const o = J['braco' + l], e = J['antebraco' + l], w = J['mao' + l], j = J['canela' + l], q = J['coxa' + l]; const f = N(M.branco, { k: .04, res: .0145 }); f.por(elip(o, [.22, .2, .2]), [[b, .6], [2, .4]]).por(caps(o, e, .185, .165), b).por(caps(e, lerp(e, w, .72), .175, .15), b + 1).por(caps(lerp(e, w, .5), add(lerp(e, w, .6), [s * .08, -.2, -.06]), .09, .012), b + 1).por(caps(q, j, .19, .16), c).por(caps(j, lerp(j, J['pe' + l], .55), .165, .16), c + 1); }
  // lâmina do limpa-neve
  N(M.metal, { k: .012, res: .0125, sempre: true }).por(caps([0, 0, -.35], [0, 0, .95], .05, .055), 16); N(M.amarelo, { k: .02, res: .0145, imp: 1.3, sempre: true, pinta: p => Math.abs(p[1]) > .12 && Math.floor((p[0] * 2 + p[2]) * 6) % 2 ? M.preto : M.amarelo }).por(bloco([0, 0, 1.06], [.52, .2, .05], .03, [18, 0, 0]), 16).por(bloco([0, .2, 1.0], [.52, .06, .05], .03, [-20, 0, 0]), 16); N(M.metal, { k: .01, res: .0125, sempre: true }).por(bloco([0, -.19, 1.14], [.53, .05, .04], .02, [18, 0, 0]), 16).por(bloco([.3, .02, .98], [.04, .2, .1], .02), 16).por(bloco([-.3, .02, .98], [.04, .2, .1], .02), 16);
  return { g, J };
}
// 10) Para-raios: torre de energia que anda, isoladores nos ombros, bobina acesa no peito e uma lança de raio
function pararaios() {
  const J = juntas({ pelve: .8, coluna: .93, peito: 1.13, cabeca: [1.36, .06], ombro: [.3, 1.28, .0], cotovelo: [.54, 1.0, -.05], punho: [.68, .66, .06], coxa: [.13, .78, 0], joelho: [.16, .45, .03], tornozelo: [.17, .1, -.01], dedo: .16 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.54, .1], .185, { dentes: 5, olhos: [.44, .36], testa: 1 });
  // coroa de hastes e para-raios
  N(M.metal, { k: .01, res: .0115, imp: 1.3 }).por(toro([0, 1.64, .07], .17, .035, { rot: [-8, 0, 0] }), 3); const has = N(M.cano, { k: .006, res: .0115, sempre: true, imp: 1.2 }); for (let k = 0; k < 5; k++) { const a = -1.2 + k * .6; has.por(caps([Math.sin(a) * .16, 1.66, .07 + Math.cos(a) * .12 - .06], [Math.sin(a) * .3, 1.95 + (k === 2 ? .22 : 0), .03 + Math.cos(a) * .12 - .06], .022, .01), 3); } const bl = N(M.brilho, { k: 0, res: .0105, sempre: true }); for (let k = 0; k < 5; k++) { const a = -1.2 + k * .6; bl.por(elip([Math.sin(a) * .3, 1.96 + (k === 2 ? .23 : 0), .03 + Math.cos(a) * .12 - .06], [.042, .042, .042]), 3); }
  N(M.pele, { k: .07, res: .0135 }).por(caps([0, 1.24, .0], [0, 1.42, .05], .09), [[3, .5], [2, .5]]).por(elip([0, 1.2, -.01], [.28, .19, .18]), 2).por(elip([0, .98, .0], [.17, .18, .14]), 1);
  // gaiola de treliça em volta do tronco
  const tr = N(M.metal, { k: .004, res: .0125, imp: 1.2, sempre: true }); const P = (a, y, r) => [Math.sin(a) * r, y, Math.cos(a) * r * .8]; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + .52, b = (k + 1) / 6 * 6.283 + .52; tr.por(caps(P(a, 1.36, .24), P(a, .84, .31), .026), [[2, .6], [1, .4]]).por(caps(P(a, 1.3, .25), P(b, .92, .3), .018), [[2, .6], [1, .4]]).por(caps(P(a, 1.12, .27), P(b, 1.12, .27), .022), 2).por(caps(P(a, .84, .31), P(b, .84, .31), .028), 1); }
  N(M.brilho, { res: .0115, imp: 1.2, sempre: true }).por(elip([0, 1.16, .12], [.12, .15, .1]), 2); const bob = N(M.laranja, { k: 0, res: .0115, sempre: true }); for (let k = 0; k < 4; k++) bob.por(toro([0, 1.04 + k * .08, .1], .135, .02), 2);
  // isoladores nos ombros
  for (const [s, b] of [[1, 4], [-1, 7]]) { const o = [[b, .35], [2, .65]]; const iso = N(M.vermelho, { k: .006, res: .0115, imp: 1.2, sempre: true }); for (let k = 0; k < 4; k++) iso.por(cil([s * (.33 + k * .02), 1.4 + k * .085, -.02], .115 - k * .012, .085 - k * .012, .024, .012, [0, 0, s * -12]), o); N(M.branco, { k: 0, res: .0115, sempre: true }).por(caps([s * .32, 1.36, -.02], [s * .4, 1.74, -.02], .05, .04), o); N(M.brilho, { res: .0105, sempre: true }).por(elip([s * .405, 1.78, -.02], [.062, .062, .062]), o); }
  // manto rasgado
  N(M.roupa, { k: .06, res: .0145, corte: p => Math.max(.4 + .07 * Math.sin(Math.atan2(p[0], p[2]) * 6) - p[1], p[1] - .92) }).por(elip([0, .84, 0], [.22, .14, .18]), 0).por(cil([0, .6, 0], .33, .2, .24, .05), [[0, .5], [10, .25], [13, .25]]);
  N(M.couro, { k: .01, res: .0125 }).por(toro([0, .88, 0], .2, .045, { sz: .85 }), 0); N(M.amarelo, { res: .0105, sempre: true, k: .004 }).por(caps([.04, .95, .2], [-.03, .88, .21], .022, .02), 0).por(caps([-.03, .88, .21], [.04, .88, .21], .02, .02), 0).por(caps([.04, .88, .21], [-.04, .78, .2], .02, .006), 0);
  bracosPernas(N, J, { rb: [.09, .082, .075], rp: [.105, .09, .08], m: .18, fecha: 1, pelada: true });
  for (const [l, s, b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l]; const a = N(M.cano, { k: 0, res: .0115, sempre: true }); for (let k = 0; k < 4; k++) a.por(toro(lerp(e, w, .15 + k * .2), .105, .02, { rot: [0, 0, s * 26] }), b + 1); }
  // lança em forma de raio
  N(M.couro, { k: .006, res: .0115, sempre: true }).por(caps([0, 0, -.5], [0, 0, .5], .042), 16); const ra = N(M.amarelo, { k: .006, res: .0125, imp: 1.5, sempre: true }); [[[0, 0, .5], [0, .13, .78]], [[0, .13, .78], [0, -.1, .84]], [[0, -.1, .84], [0, .1, 1.12]], [[0, .1, 1.12], [0, -.06, 1.16]], [[0, -.06, 1.16], [0, 0, 1.6]]].forEach(([a, b], k) => ra.por(caps(a, b, .085 - k * .008, k === 4 ? .008 : .078 - k * .008), 16)); N(M.brilho, { res: .0105, sempre: true }).por(elip([0, 0, .48], [.085, .085, .06]), 16);
  return { g, J };
}

// ---------- MEIO-CHEFES: quatro corpos; chapéus, armas e enfeites de cada um ficam em cena/chefes.js ----------
// guarda de farda comprida (Fiscal e Arauto)
function guarda() {
  const J = juntas({ pelve: .7, coluna: .83, peito: 1.03, cabeca: [1.27, .06], ombro: [.3, 1.2, .0], cotovelo: [.49, .93, -.04], punho: [.62, .64, .06], coxa: [.12, .68, 0], joelho: [.14, .4, .02], tornozelo: [.15, .1, -.01], dedo: .13 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.44, .11], .175, { dentes: 4, olhos: [.3, .44], testa: 1.1 });
  N(M.cabelo, { k: .02, res: .0115, imp: 1.3 }).por(caps([.01, 1.4, .3], [.15, 1.36, .24], .032, .014), 3).por(caps([-.01, 1.4, .3], [-.15, 1.36, .24], .032, .014), 3).por(caps([.15, 1.36, .24], [.2, 1.42, .22], .018, .008), 3).por(caps([-.15, 1.36, .24], [-.2, 1.42, .22], .018, .008), 3);
  N(M.pele, { k: .05, res: .0135 }).por(caps([0, 1.18, .0], [0, 1.34, .06], .1), [[3, .5], [2, .5]]);
  const aba = p => .5 + (p[2] > 0 ? Math.max(0, .12 - Math.abs(p[0])) * 2.4 : 0);
  N(M.roupa, { k: .07, res: .0145, imp: 1.1, corte: p => aba(p) - p[1] }).por(elip([0, 1.09, -.01], [.28, .2, .185]), 2).por(elip([0, .9, .0], [.23, .2, .185]), 1).por(cil([0, .64, .0], .29, .22, .2, .05), [[0, .6], [10, .2], [13, .2]]);
  N(M.branco, { k: .01, res: .0115, sempre: true }).por(bloco([0, 1.14, .17], [.06, .1, .03], .02), 2); N(M.vermelho, { k: .012, res: .0105, sempre: true, imp: 1.3 }).por(caps([0, 1.2, .2], [0, .98, .205], .026, .042), 2);
  const bt = N(M.amarelo, { k: 0, res: .0095, sempre: true }); for (const s of [1, -1]) for (const y of [1.08, .98, .87]) bt.por(elip([s * .12, y, .185 - .02 * (1.08 - y)], [.026, .026, .018]), y > .9 ? 2 : 1);
  N(M.couro, { k: .01, res: .0125 }).por(toro([0, .84, 0], .215, .042, { sz: .86 }), 1); N(M.amarelo, { res: .0105, sempre: true }).por(bloco([0, .84, .19], [.06, .045, .025], .015), 1);
  for (const [s, b] of [[1, 4], [-1, 7]]) { N(M.amarelo, { k: .015, res: .0125, imp: 1.2 }).por(bloco([s * .3, 1.29, 0], [.12, .03, .1], .025, [0, 0, s * -14]), [[b, .5], [2, .5]]); const fr = N(M.amarelo, { k: 0, res: .0105, sempre: true }); for (const z of [-.06, 0, .06]) fr.por(caps([s * .41, 1.26, z], [s * .425, 1.17, z], .02, .014), b); }
  bracosPernas(N, J, { rb: [.1, .092, .085], rp: [.115, .095, .09], m: .165, fecha: 1, manga: .95, un: false });
  for (const [l, , b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l]; N(M.roupa, { k: .03, res: .0135 }).por(caps(e, lerp(e, w, .7), .128, .12), b + 1); N(M.branco, { k: .02, res: .0125 }).por(toro(lerp(e, w, .74), .112, .036, { rot: [0, 0, 24] }), b + 1); }
  return { g, J };
}
// brutamontes de avental, antebraços enormes (Britadeira e Fundidor)
function bruto() {
  const J = juntas({ pelve: .48, coluna: .58, peito: .84, cabeca: [1.08, .18], ombro: [.44, 1.02, .02], cotovelo: [.68, .74, -.02], punho: [.8, .42, .1], coxa: [.17, .46, 0], joelho: [.2, .27, .02], tornozelo: [.21, .1, -.01], dedo: .16 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.17, .27], .165, { dentes: 4, olhos: [.34, .34], testa: 1.5 });
  N(M.pele, { k: .12, res: .0155 }).por(elip([0, .92, -.02], [.46, .28, .29]), 2).por(elip([0, .66, .02], [.3, .22, .24]), 1).por(caps([0, 1.0, .06], [0, 1.12, .2], .18), [[3, .4], [2, .6]]).por(elip([0, 1.07, -.14], [.34, .17, .2]), 2);
  N(M.couro, { k: .05, res: .0145, imp: 1.2, corte: p => Math.max(.3 - p[1], Math.abs(p[0]) - .26 - (.9 - p[1]) * .12, p[1] - 1.0, .02 - p[2]) }).por(elip([0, .9, -.0], [.475, .295, .3]), 2).por(elip([0, .66, .03], [.32, .24, .26]), 1).por(cil([0, .44, .02], .3, .27, .16, .05), [[0, .6], [10, .2], [13, .2]]);
  N(M.couro, { k: .02, res: .0135 }).por(toro([0, .93, -.02], .44, .03, { sz: .66, rot: [18, 0, 26] }), 2).por(toro([0, .93, -.02], .44, .03, { sz: .66, rot: [18, 0, -26] }), 2); N(M.metal, { res: .0115, sempre: true, k: .01 }).por(elip([.2, 1.02, .27], [.045, .045, .03]), 2).por(elip([-.2, 1.02, .27], [.045, .045, .03]), 2).por(bloco([0, .56, .27], [.09, .06, .03], .02), [[0, .5], [1, .5]]);
  N(M.madeira, { k: .02, res: .0135 }).por(toro([0, .55, .02], .29, .05, { sz: .88 }), 0);
  bracosPernas(N, J, { rb: [.16, .18, .17], rp: [.15, .13, .13], m: .24, fecha: 1, un: false });
  for (const [l, s, b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l]; N(M.couro, { k: .03, res: .0135, imp: 1.1 }).por(caps(lerp(e, w, .45), lerp(e, w, .95), .185, .17), b + 1); const tx = N(M.metal, { k: 0, res: .0115, sempre: true }); for (const q of [-.1, 0, .1]) tx.por(elip(add(lerp(e, w, .7 + q), [s * .165, .03, .05]), [.034, .034, .034]), b + 1); }
  return { g, J };
}
// macacão e capacete redondo com visor (Motoqueiro e Mergulhador)
function saltador() {
  const J = juntas({ pelve: .7, coluna: .82, peito: 1.0, cabeca: [1.22, .06], ombro: [.29, 1.15, .0], cotovelo: [.5, .9, -.05], punho: [.62, .62, .06], coxa: [.13, .68, 0], joelho: [.16, .4, .03], tornozelo: [.17, .1, -.01], dedo: .14 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  const cap = N(M.capacete, { k: .02, res: .0125, imp: 1.4 }); cap.por(elip([0, 1.45, .07], [.235, .23, .24]), 3).tirar(elip([0, 1.43, .32], [.165, .12, .14]), .02);
  N(M.visor, { res: .0115, sempre: true, imp: 1.2 }).por(elip([0, 1.43, .1], [.19, .16, .19]), 3);
  for (const s of [1, -1]) { N(M.olho, { res: .0085, imp: 2.4, sempre: true }).por(elip([s * .075, 1.44, .27], [.055, s > 0 ? .06 : .048, .03], [0, s * 14, 0]), 3); N(M.preto, { res: .0075, imp: 2.4, sempre: true }).por(elip([s * .066, 1.435, .298], [.02, .024, .012]), 3); }
  const dd = N(M.osso, { k: .003, res: .0095, sempre: true }); for (let i = 0; i < 5; i++) { const x = -.08 + i * .04; dd.por(caps([x, 1.345, .28 - x * x * 2], [x * 1.1, 1.385, .285 - x * x * 2], .019, .006), 3); }
  N(M.metal, { k: .01, res: .0115 }).por(toro([0, 1.23, .03], .15, .04, { sz: .95 }), [[3, .4], [2, .6]]);
  N(M.roupa, { k: .07, res: .0145, imp: 1.1 }).por(elip([0, 1.04, -.01], [.29, .2, .19]), 2).por(elip([0, .86, .0], [.2, .17, .16]), 1).por(elip([0, .74, 0], [.2, .12, .17]), 0);
  N(M.colete, { k: .02, res: .0125, imp: 1.2 }).por(bloco([0, 1.05, .15], [.19, .12, .05], .04), 2).por(bloco([0, .9, .13], [.14, .05, .04], .03), 1); N(M.metal, { res: .0105, sempre: true, k: 0 }).por(bloco([0, .98, .185], [.012, .2, .012], .008), [[2, .7], [1, .3]]);
  N(M.couro, { k: .01, res: .0125 }).por(toro([0, .77, 0], .195, .04, { sz: .86 }), 0); N(M.amarelo, { res: .0105, sempre: true }).por(bloco([0, .77, .17], [.055, .045, .025], .015), 0);
  bracosPernas(N, J, { rb: [.105, .1, .09], rp: [.125, .105, .1], m: .17, fecha: .55, manga: .98, un: false });
  for (const [l, s, b, c] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l], j = J['canela' + l]; N(M.roupa, { k: .03, res: .0135 }).por(caps(e, lerp(e, w, .82), .14, .118), b + 1); N(M.colete, { k: .02, res: .0125, imp: 1.2 }).por(elip([s * .31, 1.21, -.01], [.14, .1, .14], [0, 0, s * -26]), [[b, .6], [2, .4]]).por(elip([j[0], j[1], j[2] + .09], [.1, .11, .055]), [[c + 1, .6], [c, .4]]); N(M.colete, { k: .01, res: .0125 }).por(toro(lerp(e, w, .8), .115, .034, { rot: [0, 0, s * 24] }), b + 1); }
  return { g, J };
}
// corpo largo com casco de chapas nas costas (Tampa e Estivador)
function casca() {
  const J = juntas({ pelve: .5, coluna: .6, peito: .84, cabeca: [1.04, .24], ombro: [.42, 1.0, .04], cotovelo: [.64, .74, .0], punho: [.74, .46, .12], coxa: [.19, .48, 0], joelho: [.22, .28, .02], tornozelo: [.23, .1, -.01], dedo: .14 });
  const g = [], N = (mat, op) => { const x = new Grupo(mat, op); g.push(x); return x; };
  cabecaMonstro(N, [0, 1.12, .36], .165, { dentes: 3, olhos: [.4, .28], testa: 1 });
  N(M.pele, { k: .1, res: .0155 }).por(elip([0, .82, .06], [.38, .32, .28]), [[1, .5], [2, .5]]).por(caps([0, .95, .12], [0, 1.08, .28], .16), [[3, .4], [2, .6]]).por(elip([0, .96, .02], [.4, .2, .24]), 2);
  // casco
  N(M.metal, { k: .03, res: .0155, imp: 1.2, sempre: true, corte: p => p[2] - .02 - (p[1] - .9) * .15 }).por(elip([0, .94, -.02], [.52, .46, .36]), 2);
  N(M.cano, { k: .01, res: .0145, sempre: true, imp: 1.2 }).por(toro([0, .94, -.0], .5, .055, { sz: .9, rot: [82, 0, 0] }), 2); const lin = N(M.cano, { k: .004, res: .0125, sempre: true }); for (const x of [-.22, 0, .22]) lin.por(caps([x, .58, -.31 + x * x], [x * .9, 1.32, -.24 + x * x], .028), 2); const rb = N(M.amarelo, { k: 0, res: .0115, sempre: true }); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; rb.por(elip([Math.sin(a) * .5, .94 + Math.cos(a) * .45, .03], [.03, .03, .03]), 2); }
  N(M.roupa, { k: .06, res: .0145, corte: p => Math.max(.42 + .03 * Math.sin(Math.atan2(p[0], p[2]) * 8) - p[1], p[1] - .78) }).por(elip([0, .8, .06], [.395, .335, .3]), [[0, .5], [1, .5]]).por(elip([0, .56, .02], [.3, .16, .24]), 0);
  N(M.couro, { k: .02, res: .0135 }).por(toro([0, .62, .03], .31, .045, { sz: .9 }), 0);
  bracosPernas(N, J, { rb: [.14, .14, .13], rp: [.16, .135, .13], m: .2, fecha: .85 });
  for (const [l, s, b] of LADOS) { const e = J['antebraco' + l], w = J['mao' + l]; N(M.metal, { k: .02, res: .0135, imp: 1.2 }).por(elip(add(lerp(e, w, .45), [s * .05, .03, 0]), [.16, .18, .16]), b + 1); N(M.borracha, { k: .01, res: .0135 }).por(toro([s * .43, 1.05, .03], .15, .055, { rot: [0, 0, s * 55] }), [[b, .6], [2, .4]]); }
  return { g, J };
}

// ---------- oclusão ----------
function oclusao(m) {
  const C = .05, g = new Map(), ch = p => Math.floor(p[0] / C) + ',' + Math.floor(p[1] / C) + ',' + Math.floor(p[2] / C);
  m.f.forEach(f => { const c = media(f.map(i => m.p[i])), a = len(cross(sub(m.p[f[1]], m.p[f[0]]), sub(m.p[f[2]], m.p[f[0]]))) / 2, k = ch(c); if (!g.has(k)) g.set(k, [[0, 0, 0], 0]); const q = g.get(k); q[0] = add(q[0], mul(c, a)); q[1] += a; });
  m.ao = m.p.map((p, i) => { let o = 0; const b = p.map(x => Math.floor(x / C)), p0 = add(p, mul(m.n[i], .012)); for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let w = -2; w <= 2; w++) { const q = g.get((b[0] + x) + ',' + (b[1] + y) + ',' + (b[2] + w)); if (!q) continue; const d = sub(mul(q[0], 1 / q[1]), p0), l = len(d); if (l < .012 || l > .12) continue; const k = dot(d, m.n[i]) / l; if (k > .2) o += Math.min(q[1], .004) * k / (l * l + .002) * (1 - l / .12); } return Math.max(.35, 1 - o * .3); });
}

// ---------- simplificação (contração de arestas por erro quadrático) ----------
function simplificar(Mh, alvo) {
  const P = Mh.p.map(p => p.slice()), W = Mh.w.map(w => Float32Array.from(w)), N = Mh.n.map(x => x.slice()), AO = Mh.ao.slice(), Fc = Mh.f.map(f => f.slice()), viva = Fc.map(() => true);
  const Q = P.map(() => new Float64Array(10)), vf = P.map(() => new Set());
  const addQ = (q, n, d, w) => { const v = [n[0], n[1], n[2], d]; let k = 0; for (let a = 0; a < 4; a++) for (let b = a; b < 4; b++) q[k++] += w * v[a] * v[b]; };
  Fc.forEach((f, i) => { for (const a of f) vf[a].add(i); const c = cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]])), ar = len(c) / 2; if (ar < 1e-12) return; const n = norm(c), d = -dot(n, P[f[0]]); for (const a of f) addQ(Q[a], n, d, ar * (Mh.imp[a] ** 2) + 1e-8); });
  const ar = new Map();
  Fc.forEach((f, i) => { for (let k = 0; k < 3; k++) { const a = f[k], b = f[(k + 1) % 3], c = a < b ? a * 1e6 + b : b * 1e6 + a; if (!ar.has(c)) ar.set(c, [a, b, []]); ar.get(c)[2].push(i); } });
  for (const [a, b, fs_] of ar.values()) { const borda = fs_.length === 1, costura = fs_.length === 2 && Mh.m[fs_[0]] !== Mh.m[fs_[1]]; if (!borda && !costura) continue; const f = Fc[fs_[0]], nf = norm(cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]]))), e = sub(P[b], P[a]), n = norm(cross(e, nf)), d = -dot(n, P[a]), w = dot(e, e) * (borda ? 1.5 : .6); addQ(Q[a], n, d, w); addQ(Q[b], n, d, w); }
  const erro = (q, p) => { const [x, y, z] = p; return q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y + 2 * q[5] * y * z + 2 * q[6] * y + q[7] * z * z + 2 * q[8] * z + q[9]; };
  const soma = (a, b) => { const q = new Float64Array(10); for (let i = 0; i < 10; i++) q[i] = a[i] + b[i]; return q; };
  const ver = P.map(() => 0), heap = [];
  const push = it => { heap.push(it); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p].c <= heap[i].c) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const t = heap[0], u = heap.pop(); if (heap.length) { heap[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l].c < heap[m].c) m = l; if (r < heap.length && heap[r].c < heap[m].c) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return t; };
  const cand = (a, b) => { const q = soma(Q[a], Q[b]); let m = null; for (const t of [.5, 0, 1]) { const c = erro(q, lerp(P[a], P[b], t)); if (!m || c < m.c) m = { c, t }; } const l = sub(P[a], P[b]); let wd = 0; for (let k = 0; k < NB; k++) wd += Math.abs(W[a][k] - W[b][k]); push({ c: m.c + 1e-7 * dot(l, l) + 2e-8 * wd, t: m.t, a, b, va: ver[a], vb: ver[b] }); };
  for (const [a, b] of ar.values()) cand(a, b);
  let vivas = Fc.length;
  while (vivas > alvo && heap.length) {
    const e = pop(), { a, b } = e; if (ver[a] !== e.va || ver[b] !== e.vb) continue;
    const p = lerp(P[a], P[b], e.t); let ok = true;
    for (const [v, o] of [[a, b], [b, a]]) { for (const i of vf[v]) { const f = Fc[i]; if (f.includes(o)) continue; const q = f.map(x => x === v ? p : P[x]), n1 = cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]])), n2 = cross(sub(q[1], q[0]), sub(q[2], q[0])); if (dot(n1, n2) < .15 * len(n1) * len(n2)) { ok = false; break; } } if (!ok) break; }
    if (!ok) continue;
    Q[a] = soma(Q[a], Q[b]); P[a] = p; for (let k = 0; k < NB; k++) W[a][k] = W[a][k] * (1 - e.t) + W[b][k] * e.t;
    N[a] = norm(lerp(N[a], N[b], e.t)); AO[a] = AO[a] * (1 - e.t) + AO[b] * e.t;
    for (const i of vf[b]) { const f = Fc[i]; if (f.includes(a)) { viva[i] = false; vivas--; for (const x of f) if (x !== b) vf[x].delete(i); } else { f[f.indexOf(b)] = a; vf[a].add(i); } }
    vf[b].clear(); ver[b] = -1; ver[a]++;
    const viz = new Set(); for (const i of vf[a]) for (const x of Fc[i]) if (x !== a) viz.add(x); for (const x of viz) cand(a, x);
  }
  // vértices finais: um por (vértice, material)
  const id = new Map(), out = { p: [], n: [], b: [], w: [], m: [], ao: [], i: [] };
  Fc.forEach((f, i) => {
    if (!viva[i]) return;
    for (const a of f) {
      const k = a * 32 + Mh.m[i];
      if (!id.has(k)) { id.set(k, id.size); out.p.push(P[a]); out.n.push(N[a]); out.ao.push(AO[a]); out.m.push(Mh.m[i]); const o = [...W[a]].map((w, j) => [w, j]).sort((x, y) => y[0] - x[0]).slice(0, 3), s = o.reduce((t, x) => t + x[0], 0) || 1; out.b.push(o.map(x => x[1])); out.w.push(o.map(x => x[0] / s)); }
      out.i.push(id.get(k));
    }
  });
  return out;
}

// ---------- gravação ----------
const partes = [], cabecalho = { ossos: OSSOS, modelos: {} }; let pos = 0;
const grava = arr => { const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), pad = (4 - b.length % 4) % 4, o = pos; partes.push(b, Buffer.alloc(pad)); pos += b.length + pad; return [o, arr.length]; };
const LISTA = [['soldado', soldado, [3400, 1700, 760, 260]], ['zumbi', zumbi, [2800, 1350, 560, 200]], ['gordo', gordo, [3000, 1400, 600, 220]], ['cancela', cancela, [8000, 3600]], ['operario', operario, [8000, 3600]], ['sirene', sirene, [8000, 3600]], ['carcaca', carcaca, [8000, 3600]], ['afogada', afogada, [8000, 3600]], ['guindaste', guindaste, [8000, 3600]], ['fornalha', fornalha, [8000, 3600]], ['mae', mae, [8400, 3600]], ['nevasca', nevasca, [8000, 3600]], ['pararaios', pararaios, [8000, 3600]],
  ['guarda', guarda, [5200, 2400]], ['bruto', bruto, [5200, 2400]], ['saltador', saltador, [5200, 2400]], ['casca', casca, [5200, 2400]]];
for (const [nome, fn, alvos] of LISTA) {
  if (SO && !SO.split(',').includes(nome)) continue;
  const t0 = Date.now(), { g, J } = fn(), m = malhar(g); oclusao(m); console.log(nome, 'triângulos', m.f.length, (Date.now() - t0) + 'ms');
  const lods = alvos.map(a => {
    const o = simplificar(m, a), nv = o.p.length; console.log('  ', a, '->', o.i.length / 3, 'tri', nv, 'vért');
    return {
      nv, p: grava(Int16Array.from(o.p.flat().map(x => Math.round(x * 14000)))), n: grava(Int8Array.from(o.n.flatMap(x => [...x.map(v => Math.round(v * 127)), 0]))),
      b: grava(Uint8Array.from(o.b.flatMap((x, i) => [...x, o.m[i]]))), w: grava(Uint8Array.from(o.w.flatMap((x, i) => [...x.map(v => Math.round(v * 255)), Math.round(o.ao[i] * 255)]))), i: grava(Uint16Array.from(o.i)),
    };
  });
  cabecalho.modelos[nome] = { juntas: J, lods };
}
let js = JSON.stringify(cabecalho); while ((Buffer.byteLength(js) + 4) % 4) js += ' ';
const t = Buffer.alloc(4); t.writeUInt32LE(Buffer.byteLength(js));
fs.writeFileSync(SAIDA, Buffer.concat([t, Buffer.from(js), ...partes])); console.log(SAIDA, fs.statSync(SAIDA).size, 'bytes');

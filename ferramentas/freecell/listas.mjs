// Procura jogos de FreeCell com solução usando só 1 célula (com 4 ou 5 ficam bem tranquilos).
// Começa pelos números com Ases, 2 e 3 mais à mão. Uso: node ferramentas/freecell/listas.mjs [segundos]
// Grava as listas "mfacil" e "facil" em jogos/freecell/jogos.js; "medio" e "dificil" ficam como estão.
import { readFileSync, writeFileSync } from 'node:fs';
const naipe = c => Math.floor(c / 13), valor = c => c % 13, vermelha = c => naipe(c) % 2 === 1, topo = a => a[a.length - 1];
const encaixa = (b, c) => vermelha(b) !== vermelha(c) && valor(b) === valor(c) + 1;
const MSN = [2, 3, 1, 0];
function distribuir(n) {
  let s = n >>> 0; const rnd = () => { s = (s * 214013 + 2531011) % 2147483648; return s >> 16; };
  const b = []; for (let i = 51; i >= 0; i--) b.push(i);
  for (let i = 0; i < 52; i++) { const j = 51 - rnd() % (52 - i); [b[i], b[j]] = [b[j], b[i]]; }
  const c = [[], [], [], [], [], [], [], []];
  b.forEach((x, i) => c[i % 8].push(MSN[x % 4] * 13 + Math.floor(x / 4)));
  return c;
}
// Soma das cartas em cima dos Ases, 2 e 3 (menos = mais fácil).
function enterradas(c) {
  let s = 0;
  for (const col of c) col.forEach((x, i) => { const v = valor(x); if (v <= 2) s += (col.length - 1 - i) * (3 - v); });
  return s;
}
function resolver(c0, ncel, limite) {
  const ini = { c: c0.map(x => x.slice()), f: [0, 0, 0, 0], l: [] };
  const chave = st => st.c.map(x => x.join(',')).sort().join('|') + '#' + st.l.slice().sort((a, b) => a - b).join(',');
  const h = st => {
    let s = 0;
    for (const col of st.c) for (let i = 0; i < col.length; i++) for (let k = i + 1; k < col.length; k++) if (valor(col[k]) > valor(col[i])) { s++; break; }
    return (52 - st.f[0] - st.f[1] - st.f[2] - st.f[3]) * 2 + s + st.l.length * .5 - st.c.filter(x => !x.length).length;
  };
  const seg = (st, c) => {
    const v = valor(c); if (st.f[naipe(c)] !== v) return false; if (v <= 1) return true;
    for (let n = 0; n < 4; n++) if ((n % 2 === 1) !== vermelha(c) && st.f[n] < v - 1) return false;
    return true;
  };
  const auto = st => {
    let m = true;
    while (m) {
      m = false;
      for (const col of st.c) { const c = topo(col); if (c != null && seg(st, c)) { col.pop(); st.f[naipe(c)]++; m = true; } }
      for (let i = 0; i < st.l.length; i++) if (seg(st, st.l[i])) { st.f[naipe(st.l[i])]++; st.l.splice(i--, 1); m = true; }
    }
  };
  const copia = st => ({ c: st.c.map(x => x.slice()), f: st.f.slice(), l: st.l.slice() });
  const heap = [];
  const push = (pr, x) => { heap.push([pr, x]); let i = heap.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const pop = () => { const t = heap[0], u = heap.pop(); if (heap.length) { heap[0] = u; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return t[1]; };
  auto(ini);
  const visto = new Set([chave(ini)]);
  push(h(ini), { st: ini, g: 0 });
  let nos = 0;
  while (heap.length) {
    const { st, g } = pop();
    if (st.f.every(x => x === 13)) return true;
    if (++nos > limite) return false;
    const add = ns => { auto(ns); const k = chave(ns); if (visto.has(k)) return; visto.add(k); push(h(ns) + (g + 1) * .05, { st: ns, g: g + 1 }); };
    const vazia = st.c.findIndex(x => !x.length);
    for (let i = 0; i < st.l.length; i++) {
      const c = st.l[i];
      if (st.f[naipe(c)] === valor(c)) { const ns = copia(st); ns.l.splice(i, 1); ns.f[naipe(c)]++; add(ns); }
      for (let j = 0; j < 8; j++) { const t = topo(st.c[j]); if (t == null ? j === vazia : encaixa(t, c)) { const ns = copia(st); ns.l.splice(i, 1); ns.c[j].push(c); add(ns); } }
    }
    for (let i = 0; i < 8; i++) {
      const col = st.c[i]; if (!col.length) continue; const c = topo(col);
      if (st.f[naipe(c)] === valor(c)) { const ns = copia(st); ns.c[i].pop(); ns.f[naipe(c)]++; add(ns); }
      for (let j = 0; j < 8; j++) { if (j === i) continue; const t = topo(st.c[j]); if (t == null ? (j === vazia && col.length > 1) : encaixa(t, c)) { const ns = copia(st); ns.c[i].pop(); ns.c[j].push(c); add(ns); } }
      if (st.l.length < ncel) { const ns = copia(st); ns.c[i].pop(); ns.l.push(c); add(ns); }
    }
  }
  return false;
}

const ordem = [];
for (let n = 1; n <= 32000; n++) ordem.push([enterradas(distribuir(n)), n]);
ordem.sort((a, b) => a[0] - b[0]);
const achados = [], ate = Date.now() + 1000 * (+process.argv[2] || 300);
let vistos = 0;
for (const [s, n] of ordem) {
  if (achados.length >= 600 || Date.now() > ate) break;
  vistos++;
  if (resolver(distribuir(n), 1, 4000)) achados.push([n, s]);
}
console.log('testados', vistos, '· achados', achados.length, '· cartas em cima: de', achados[0][1], 'a', achados[achados.length - 1][1], '· jogo comum:', ordem[16000][0]);

const arq = new URL('../../jogos/freecell/jogos.js', import.meta.url), window = {};
new Function('window', readFileSync(arq, 'utf8'))(window);
const antes = window.FC_JOGOS, corte = Math.floor(achados.length / 3), num = l => l.map(x => x[0]).sort((a, b) => a - b);
writeFileSync(arq, `// Jogos de FreeCell já testados por computador (gerado por ferramentas/freecell/listas.mjs).
// mfacil e facil: têm solução usando só 1 célula e deixam Ases, 2 e 3 à mão (mfacil mais ainda).
// medio: têm solução usando só 2 células. dificil: têm solução com 3 células, mas não com 2.
window.FC_JOGOS = {
  mfacil: ${JSON.stringify(num(achados.slice(0, corte)))},
  facil: ${JSON.stringify(num(achados.slice(corte)))},
  medio: ${JSON.stringify(antes.medio || antes.facil)},
  dificil: ${JSON.stringify(antes.dificil)},
};
`);

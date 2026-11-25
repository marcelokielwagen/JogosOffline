// Escolhe a tentativa de cada fase do Loop Zen (grava a tabela) e confere as 150 fases.
//   node loop-fases.mjs escolher   |   node loop-fases.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), ARQ = RAIZ + '/jogos/zen/loop_game.js';
globalThis.window = globalThis; globalThis.matchMedia = () => ({ matches: false });
const nucleo = fs.readFileSync(RAIZ + '/jogos/zen/index.html', 'utf8').match(/window\.Zen = \{[\s\S]*?\n\};/)[0]; (0, eval)(nucleo);
// cópia do núcleo, para as páginas de teste abrirem direto do arquivo
fs.writeFileSync(RAIZ + '/ferramentas/zen/nucleo.js', '// Cópia automática do núcleo de jogos/zen/index.html (feita por loop-fases.mjs). Não editar aqui.\n' + nucleo + '\n');
let fonte = fs.readFileSync(ARQ, 'utf8'); (0, eval)(fonte);
const L = Zen.jogos.loop, BASE = { curva: 3, reta: 5, ponte: 15 }, gira = (m, n) => ((m << n) | (m >> (4 - n))) & 15;

// mesma fase girada ou espelhada tem a mesma assinatura
function assinatura({ l, a, m }) {
  const formas = []; let g = { l, a, m: [...m] };
  const roda = ({ l, a, m }) => { const r = new Array(l * a); for (let y = 0; y < a; y++) for (let x = 0; x < l; x++) r[x * a + (a - 1 - y)] = gira(m[y * l + x], 1); return { l: a, a: l, m: r }; };
  const espelha = ({ l, a, m }) => { const r = new Array(l * a); for (let y = 0; y < a; y++) for (let x = 0; x < l; x++) { const v = m[y * l + x]; r[y * l + l - 1 - x] = (v & 5) | (v & 2) << 2 | (v & 8) >> 2; } return { l, a, m: r }; };
  for (let k = 0; k < 8; k++) { formas.push(g.l + 'x' + g.a + ':' + g.m.map(v => v.toString(16)).join('')); g = k === 3 ? espelha(g) : roda(g); }
  return formas.sort()[0];
}
function defeito(F) {
  const { l, a, m } = F, em = (x, y) => m[y * l + x];
  if (L.contarFios(l, a, m) !== 1) return 'mais de um fio';
  for (let x = 0, t = 0, b = 0; x < l; x++) { t |= em(x, 0); b |= em(x, a - 1); if (x === l - 1 && !(t && b)) return 'borda vazia'; }
  for (let y = 0, e = 0, d = 0; y < a; y++) { e |= em(0, y); d |= em(l - 1, y); if (y === a - 1 && !(e && d)) return 'borda vazia'; }
  const n = F.pecas.length; if (n < l * a * .68) return 'vazia demais';
  if (F.pecas.filter(p => p.tipo === 'curva').length < n * .45) return 'poucas curvas';
  return '';
}
if (process.argv[2] === 'escolher') {
  const vistas = new Set();
  for (const dif of Zen.DIFS) {
    let tab = '';
    for (let f = 1; f <= 50; f++) { let k = 0; for (; k < 36; k++) { const F = L.gerar(dif, f, k), s = assinatura(F); if (defeito(F) || vistas.has(s)) continue; vistas.add(s); break; } if (k === 36) { console.log('SEM OPÇÃO', dif, f); k = 35; } tab += k.toString(36); }
    fonte = fonte.replace(new RegExp(`(\\n  ${dif}: ')[0-9a-z]*'`), (_, p) => p + tab + "'");
  }
  fs.writeFileSync(ARQ, fonte); (0, eval)(fonte);
}
// conferência independente
const G = Zen.jogos.loop, todas = new Map(); let ruins = 0, pior = 0;
const erro = (...x) => { ruins++; console.log('FALHA', ...x); };
for (const dif of Zen.DIFS) {
  const res = [];
  for (let f = 1; f <= 50; f++) {
    const t0 = performance.now(), F = G.gerar(dif, f); pior = Math.max(pior, performance.now() - t0);
    const { l, a, m } = F, nome = dif + ' ' + f, d = defeito(F); if (d) erro(nome, d);
    if (JSON.stringify(F.pecas) !== JSON.stringify(G.gerar(dif, f).pecas)) erro(nome, 'não se repete igual');
    const s = assinatura(F); if (todas.has(s)) erro(nome, 'igual a', todas.get(s)); todas.set(s, nome);
    // solução fecha? (as peças na posição certa)
    const cert = new Uint8Array(l * a), ini = new Uint8Array(l * a); for (const p of F.pecas) { cert[p.i] = gira(BASE[p.tipo], p.certo % 4); ini[p.i] = gira(BASE[p.tipo], p.giro); }
    const soltas = v => { let n = 0; for (let y = 0; y < a; y++) for (let x = 0; x < l; x++) for (const [b, dx, dy, o] of [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]]) if (v[y * l + x] & b) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= l || Y >= a || !(v[Y * l + X] & o)) n++; } return n; };
    if (soltas(cert)) erro(nome, 'solução não fecha'); if (!soltas(ini)) erro(nome, 'já nasce pronta');
    // simetria de verdade
    const v = (x, y) => m[y * l + x], H = w => (w & 5) | (w & 2) << 2 | (w & 8) >> 2, V = w => (w & 10) | (w & 1) << 2 | (w & 4) >> 2; let okH = 1, okV = 1, okP = 1;
    for (let y = 0; y < a; y++) for (let x = 0; x < l; x++) { if (v(l - 1 - x, y) !== H(v(x, y))) okH = 0; if (v(x, a - 1 - y) !== V(v(x, y))) okV = 0; if (v(l - 1 - x, a - 1 - y) !== V(H(v(x, y)))) okP = 0; }
    if (!({ dois: okH && okV, lados: okH, topo: okV, volta: okP })[F.sim]) erro(nome, 'não é simétrica', F.sim);
    // solução única: preenche a partir do canto, só com o que chega de cima e da esquerda
    const u = new Uint8Array(l * a), tipo = new Map(F.pecas.map(p => [p.i, p.tipo]));
    for (let i = 0; i < l * a; i++) { const x = i % l, n = i >= l && u[i - l] & 4 ? 1 : 0, w = x && u[i - 1] & 2 ? 1 : 0, t = tipo.get(i); u[i] = !t ? 0 : t === 'ponte' ? 15 : t === 'reta' ? (n ? 5 : 10) : n | (w ? 0 : 2) | (n ? 0 : 4) | (w ? 8 : 0); if (u[i] !== m[i]) { erro(nome, 'solução não é única?'); break; } }
    const giraveis = F.pecas.filter(p => p.tipo !== 'ponte'), certas = giraveis.filter(p => ini[p.i] === m[p.i]).length;
    res.push({ n: F.pecas.length, pontes: F.pecas.length - giraveis.length, certas: certas / giraveis.length, sim: F.sim });
  }
  const med = (k, i) => { const r = res.slice(i, i + 10); return (r.reduce((s, x) => s + x[k], 0) / 10); };
  console.log(dif.padEnd(8), 'peças por grupo', [0, 10, 20, 30, 40].map(i => med('n', i).toFixed(0)).join(' '), '| pontes', [0, 10, 20, 30, 40].map(i => med('pontes', i).toFixed(1)).join(' '), '| já certas no início', (res.reduce((s, x) => s + x.certas, 0) * 2).toFixed(0) + '%', '| simetrias', JSON.stringify(res.reduce((o, x) => (o[x.sim] = (o[x.sim] || 0) + 1, o), {})));
}
console.log(ruins ? ruins + ' problemas' : '150 fases: todas fecham, um só fio, simétricas, solução única, nenhuma repetida', '| pior tempo para criar', pior.toFixed(1), 'ms');

// Gem Shatter: confere as regras e mede quantas jogadas cada fase pede, com um jogador automático.
//   node calibrar.mjs            só mostra e confere as fases com as jogadas atuais
//   node calibrar.mjs --gravar   recalcula as jogadas e grava em jogos/gem-shatter/index.html
import { readFileSync, writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { execFile } from 'node:child_process'; import os from 'node:os';
const ARQ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../jogos/gem-shatter/index.html'), html = readFileSync(ARQ, 'utf8');
const N = new Function(html.match(/<script id="nucleo">([\s\S]*?)<\/script>/)[1] + ';return Nucleo;')();
const gravar = process.argv.includes('--gravar'), JOGOS = +(process.argv.find(a => a.startsWith('--jogos=')) || '').slice(8) || 60;
const erros = new Set(); const confere = (c, m) => { if (!c) erros.add(m); };

function nota(P) {                                       // o quanto o tabuleiro está bom
  let v = 0; for (const m in P.metas) v -= Math.max(0, P.metas[m]) * (m === 'geodo' ? 14 : m === 'pedra' || m === 'ouro' ? 3 : 1);
  P.ouro.forEach(o => v -= o * 1.2);
  P.g.forEach((p, i) => { if (!p) return; if (p.k === 'esp') v += { p: 6, b: 4, h: 2.5, v: 2.5 }[p.e]; else if (p.k === 'pedra') v -= p.hp * 1.5; else if (p.presa) v -= .6; else if (p.k === 'geodo') v += 1.6 * (i / P.W | 0); });
  // caminho para os alvos que faltam: grupos prontos em cima do ouro, ao lado da rocha e embaixo do geodo
  const em = new Set(); for (const g of P.grupos()) for (const o of g) em.add(o.i);
  for (let i = 0; i < P.g.length; i++) { const p = P.g[i];
    if (P.ouro[i] && P.metas.ouro > 0 && em.has(i)) v += .9;
    if (p && ((p.k === 'pedra' && P.metas.pedra > 0) || p.presa) && P.viz(i).some(j => em.has(j))) v += .9;
    if (p && p.k === 'geodo') for (let j = i + P.W; j < P.g.length; j += P.W) if (em.has(j)) v += .5;
    if (p && p.k === 'esp') { const x = i % P.W, y = i / P.W | 0; let alvos = 0; for (let j = 0; j < P.g.length; j++) { const q = P.g[j], dx = Math.abs(j % P.W - x), dy = Math.abs((j / P.W | 0) - y); if ((p.e === 'h' ? dy === 0 : p.e === 'v' ? dx === 0 : dx + dy <= 2) && ((P.ouro[j] && P.metas.ouro > 0) || (q && q.k === 'pedra' && P.metas.pedra > 0) || (q && q.presa))) alvos++; } v += Math.min(4, alvos) * .5; } }
  return v;
}
function invariantes(P, n) {
  const ids = new Set(); for (let i = 0; i < P.g.length; i++) { const p = P.g[i]; if (p) { confere(P.mask[i], n + ': peça fora do tabuleiro'); confere(!ids.has(p.id), n + ': peça repetida'); ids.add(p.id); } }
  for (let x = 0; x < P.W; x++) { for (let y = P.topo[x]; y <= P.base[x]; y++) { const p = P.g[y * P.W + x]; if (p && P.fixo(p)) break; confere(p, n + ': casa vazia sem motivo'); } let vazio = false; for (let y = P.base[x]; y >= P.topo[x]; y--) { const p = P.g[y * P.W + x]; if (!p) vazio = true; else if (P.fixo(p)) vazio = false; else confere(!vazio, n + ': peça flutuando'); } }
  confere(P.venceu || P.temJogada(), n + ': travou sem jogada');
}
const opcoes = P => { const op = P.grupos().map(g => g[0].i); P.g.forEach((p, i) => { if (p && p.k === 'esp') op.push(i); }); return op; };
export function jogarFase(n, movs, est) {
  const P = new N.Partida({ ...N.fase(n), movs });
  while (!P.venceu && P.movs > 0) {
    const av = opcoes(P).map(i => { const c = P.clonar(); c.tocar(i); return [nota(c) + Math.random() * .4, i, c]; }).sort((a, b) => b[0] - a[0]);
    const top = av.slice(0, 7); for (const a of top) { if (a[2].venceu) { a[0] += 100; continue; } let m = -1e9; for (const j of opcoes(a[2])) { const c = a[2].clonar(); c.movs = 5; c.tocar(j); m = Math.max(m, nota(c)); } a[0] = a[0] * .35 + m * .65; } av.splice(0, top.length, ...top.sort((a, b) => b[0] - a[0]));
    const k = Math.random() < .72 ? 0 : Math.min(av.length - 1, 1 + (Math.random() * 3 | 0));       // erra como gente
    const ps = P.tocar(av[k][1]); confere(ps, n + ': jogada recusada'); if (!ps) break;
    if (est) { est.j++; const q = ps.filter(s => s.t === 'quebra').length; if (q > 1) est.cad++; est.max = Math.max(est.max, q); if (ps.some(s => s.cria)) est.esp++; if (ps.some(s => s.t === 'embaralha')) est.emb++; est.ms = 0; }
    invariantes(P, n);
  }
  const usadas = P.jogadas, sobra = P.movs, v = P.venceu, e = P.estrelas; if (v && sobra) { P.bonus(); invariantes(P, n); } return { v, usadas, e };
}
for (let n = 1; n <= N.TOTAL; n++) { const f = N.fase(n); for (const [m] of f.metas) if (m[0] === 'c') confere(+m[1] < f.cores, n + ': meta de cor que não existe'); }
const alvo = n => { const d = (n - 1) % 10, g = (n - 1) / 10 | 0; return Math.max(.5, .97 - g * .06 - [0, .02, .04, .06, .15, .03, .06, .09, .17, .22][d]); };   // dente de serra: a 5 e a 9 são difíceis, a 10 muito difícil
const fatia = process.argv.find(a => a.startsWith('--so='));
if (fatia) { const r = {}; for (const n of fatia.slice(5).split(',').map(Number)) { const est = { j: 0, cad: 0, max: 0, esp: 0, emb: 0 }, f = N.fase(n), l = []; for (let k = 0; k < JOGOS; k++) l.push(jogarFase(n, gravar ? 90 : f.movs, est)); r[n] = { l, est }; } console.log('R' + JSON.stringify({ r, erros: [...erros] })); process.exit(0); }
const K = Math.max(2, os.cpus().length - 2), R = {}, est = { j: 0, cad: 0, max: 0, esp: 0, emb: 0 };
await Promise.all([...Array(K).keys()].map(k => new Promise(fim => { const ns = [...Array(N.TOTAL).keys()].map(x => x + 1).filter(x => x % K === k); if (!ns.length) return fim(); execFile(process.execPath, [fileURLToPath(import.meta.url), '--so=' + ns, '--jogos=' + JOGOS, ...(gravar ? ['--gravar'] : [])], { maxBuffer: 1e8 }, (e, o) => { const m = o && o.match(/^R(.*)$/m); if (!m) { erros.add('fatia falhou ' + e); return fim(); } const d = JSON.parse(m[1]); Object.assign(R, d.r); d.erros.forEach(x => erros.add(x)); fim(); }); })));
for (const n in R) { const e = R[n].est; est.j += e.j; est.cad += e.cad; est.esp += e.esp; est.emb += e.emb; est.max = Math.max(est.max, e.max); }
if (gravar) {
  const M = []; for (let n = 1; n <= N.TOTAL; n++) { const u = R[n].l.map(x => x.usadas); u.sort((a, b) => a - b); let m = u[Math.min(u.length - 1, Math.floor(u.length * alvo(n)))] + (n < 4 ? 3 : 1); const med = u[u.length >> 1]; m = Math.min(m, Math.round(med * (N.fase(n).metas.some(x => x[0] === 'geodo') ? 2.1 : 1.6)) + 2, 45); M.push(Math.max(8, m)); }
  writeFileSync(ARQ, html.replace(/\/\*MOVS\*\/[\s\S]*?\/\*FIM\*\//, `/*MOVS*/[${M.join(', ')}]/*FIM*/`)); console.log('gravado', M.join(' '));
} else {
  let linha = '';
  for (let n = 1; n <= N.TOTAL; n++) { const f = N.fase(n); let v = 0; const e = [0, 0, 0, 0]; for (let k = 0; k < JOGOS; k++) { const r = R[n].l[k]; if (r.v) { v++; e[r.e]++; } } linha += `${n}: ${f.movs} jogadas, vence ${Math.round(100 * v / JOGOS)}% (alvo ${Math.round(alvo(n) * 100)}), estrelas 1/2/3: ${e.slice(1).join('/')}\n`; }
  console.log(linha + `jogadas ${est.j}; com ressonância ${(100 * est.cad / est.j).toFixed(1)}%; maior cadeia ${est.max}; criam especial ${(100 * est.esp / est.j).toFixed(1)}%; embaralhadas ${est.emb}`);
}
console.log('erros:', [...erros].join('\n') || 'nenhum');

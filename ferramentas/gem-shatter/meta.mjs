// Gem Shatter: confere a progressão (obras, coleção, marcos, ficha salva) e mede o ritmo.   node meta.mjs
import { readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const html = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../jogos/gem-shatter/index.html'), 'utf8'), M = new Function(html.match(/<script id="meta">([\s\S]*?)<\/script>/)[1] + ';return Meta;')();
let erros = 0, n = 0; const ok = (c, m) => { n++; if (!c) { erros++; console.log('ERRO', m); } };
const ord = x => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, ord(x[k])])) : x, F = 50, igual = (a, b) => JSON.stringify(ord(a)) === JSON.stringify(ord(b));
function sao(d, m) { ok(igual(M.validar(JSON.parse(JSON.stringify(d)), F), d), m + ': ficha muda ao ser conferida'); ok(M.total(d) - M.gastas(d) >= 0, m + ': gastou estrela que não tinha'); d.obras.forEach((l, g) => ok(igual(l, [...l].sort((a, b) => b - a)), m + ': obra fora de ordem')); M.EX.forEach(e => ok(d.frag[e.i] >= 0 && d.frag[e.i] <= e.q, m + ': fragmento demais')); }
// 1. perfis de jogador
for (const [nome, sorteia] of [['iniciante', () => Math.random() < .6 ? 1 : 2], ['médio', () => 1 + (Math.random() * 3 | 0)], ['bom', () => Math.random() < .75 ? 3 : 2]]) {
  const r = { obras: 0, ex: 0, marcos: 0, primeiraObra: 0, galeriasRest: 0, cada10: [] }, V = 200;
  for (let v = 0; v < V; v++) {
    const d = M.nova(); let p1 = 0;
    for (let f = 1; f <= F; f++) {
      const e = sorteia(), antes = d.estrelas[f] || 0; d.estrelas[f] = Math.max(antes, e); d.recorde[f] = 4000 + Math.random() * 9000 | 0; d.liberada = Math.min(F, f + 1); d.atual = d.liberada; d.est.vitorias++; d.est.pedras += 70; d.est.especiais += 4; d.est.prismas += Math.random() < .2 ? 1 : 0; d.est.comb += Math.random() < .4 ? 1 : 0; d.est.ouro += 5; d.est.rochas += 4; d.est.geodos += 1; d.est.seqMax = Math.min(8, f); d.est.maiorCadeia = Math.min(4, 1 + (f / 6 | 0)); M.marcarDia(d, '2026-12-' + String(1 + (f / 6 | 0)).padStart(2, '0'));
      const ac = M.premiarVitoria(d, f, e, antes); ok(ac.length >= 1 || M.EX.every(x => M.completo(d, x.i)), nome + ': vitória sem achado');
      for (let g = 0; g < 5; g++) { let k; while ((k = d.obras[g].indexOf(0)) >= 0 && M.fazerObra(d, g, k)) if (!p1) p1 = f; }
      for (const m of M.MARCOS) while (M.receber(d, m.id)); if (v < 20) sao(d, nome + ' fase ' + f);
      if (v === 0 && f % 10 === 0) r.cada10.push(`fase ${f}: ${d.obras.flat().filter(Boolean).length} obras, ${M.EX.filter(x => M.completo(d, x.i)).length} minerais`);
    }
    r.obras += d.obras.flat().filter(Boolean).length / V; r.ex += M.EX.filter(x => M.completo(d, x.i)).length / V; r.marcos += Object.values(d.marcos).reduce((a, b) => a + b, 0) / V; r.primeiraObra += p1 / V;
  }
  console.log(nome, 'ao fim das 50:', r.obras.toFixed(1), 'de 25 obras;', r.ex.toFixed(1), 'de 40 minerais;', r.marcos.toFixed(1), 'de 48 marcos; 1a obra na fase', r.primeiraObra.toFixed(1), '|', r.cada10.join('; '));
}
// 2. migração da Fase 1
const v1 = { v: 1, atual: 13, liberada: 13, estrelas: { 1: 3, 2: 1, 3: 3, 12: 2 }, recorde: { 1: 3987 }, op: { som: false }, est: { jogadas: 147, pedras: 781, maiorCadeia: 4, especiais: 40, vitorias: 9 } };
const mg = M.migrar(v1, F); ok(mg.atual === 13 && mg.liberada === 13 && igual(mg.estrelas, v1.estrelas) && mg.est.pedras === 781 && mg.op.som === false && mg.op.ambiente === true && mg.recorde[1] === 3987, 'migração perdeu dado'); ok(mg.frag.reduce((a, b) => a + b, 0) === 6, 'achados retroativos'); ok(M.livres(mg) === 9, 'estrelas retroativas');
// 3. lixo e mistura
const lixo = [null, 5, 'x', [], {}, { estrelas: 'a', obras: 3, frag: {}, marcos: [1], est: null, op: 7, liberada: NaN, atual: -5, moldura: 99, vistos: [1e9, 'a', 3] }, { estrelas: { 1: 99, '-3': 2, 2.5: 3, 60: 3, __proto__: 1 }, obras: [[0, 1, 0, 1]], frag: [1e9, -4, 'a'] }];
for (const x of lixo) { const d = M.validar(x, F); ok(d.atual >= 1 && d.atual <= d.liberada && d.liberada <= F && d.frag.length === 40 && d.obras.length === 5, 'lixo passou'); ok(igual(M.validar(d, F), d), 'validar não é estável'); }
const alea = () => { const d = M.nova(); d.rev = Math.random() * 99 | 0; for (let f = 1; f <= 50; f++) if (Math.random() < .5) { d.estrelas[f] = 1 + (Math.random() * 3 | 0); M.achar(d, f / 11 | 0, 1); } return M.validar(d, F); };
for (let i = 0; i < 300; i++) { const a = alea(), b = alea(); for (let g = 0; g < 5; g++) { let k; while ((k = a.obras[g].indexOf(0)) >= 0 && Math.random() < .7 && M.fazerObra(a, g, k)); } const c = M.mesclar(a, b, F); ok(igual(M.validar(c, F), c), 'mistura inválida'); for (const x of [a, b]) { for (const f in x.estrelas) ok(c.estrelas[f] >= x.estrelas[f], 'mistura perdeu estrela'); ok(x.frag.every((v, j) => c.frag[j] >= v), 'mistura perdeu fragmento'); ok(x.obras.flat().every((v, j) => c.obras.flat()[j] >= v), 'mistura perdeu obra'); ok(c.liberada >= x.liberada, 'mistura trancou fase'); } ok(igual(M.mesclar(a, a, F), a), 'misturar com si mesma muda'); }
ok(M.EX.length === 40 && M.EX.every(e => e.nome && e.txt && e.q >= 2 && e.forma <= 9 && /^[0-9a-f]{6}$/.test(e.c1 + '') && /^[0-9a-f]{6}$/.test(e.c2)) && new Set(M.EX.map(e => e.nome)).size === 40, 'coleção mal escrita'); ok(new Set(M.MARCOS.map(m => m.id)).size === 16, 'marcos');
console.log(n, 'conferências;', erros, 'erros');

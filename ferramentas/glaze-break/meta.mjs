// Glaze Break: confere a progressão da Fase 2 (ficha v2, migração da v1, junção, painéis, peças raras, cartas, marcos, painel do dia) e mede o ritmo.   node meta.mjs
import { readFileSync } from 'node:fs';
const html = readFileSync('C:/Users/Minhoca/Projetos/JogosOffline/jogos/glaze-break/index.html', 'utf8'), bl = id => html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'))[1].replace("'use strict';", '');
const { N, M } = new Function(bl('nucleo') + bl('meta') + ';return{N:Nucleo,M:Meta}')(); let n = 0, ruins = 0; const ok = (c, m) => { n++; if (!c) { ruins++; if (ruins < 25) console.log('FALHOU:', m); } };
let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647, RI = (a, b) => a + Math.floor(R() * (b - a + 1));
const ord = x => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, ord(x[k])])) : x, igual = (a, b) => JSON.stringify(ord(a)) === JSON.stringify(ord(b));

// conteúdo
ok(M.RARAS.length === 50 && new Set(M.RARAS).size === 50, '50 peças raras com nomes únicos'); ok(M.CARTAS.length === 6 && M.CARTAS.every(c => c[1].length < 200), '6 cartas curtas');
ok(M.CUSTO.reduce((a, b) => a + b) * 5 === 100, 'painéis inteiros custam 100 de 150 estrelas'); ok(M.MARCOS.length === 10 && new Set(M.MARCOS.map(m => m.id)).size === 10, '10 marcos');
for (let g = 0; g < 5; g++) { const m = M.mural(g); ok(m.length === M.MC * M.ML && m.every(v => v >= 0 && v <= 6), 'mural ' + g); ok(new Set(m).size >= 4, 'mural ' + g + ' tem desenho'); ok(new Set(M.ORDEM[g]).size === M.MC * M.ML, 'ordem do mural ' + g); for (let r = 0; r < M.ML; r++) for (let c = 0; c < 5; c++) if (g === 0 || g === 2 || g === 4) ok(m[r * M.MC + c] === m[r * M.MC + 10 - c], `mural ${g} simétrico`); }
ok(M.feitos(0) === 0 && M.feitos(5) === M.MC * M.ML, 'obras cobrem o mural');
// toda fase tem exatamente uma peça rara, num azulejo que quebra e sem item; as 50 fases continuam iguais à Fase 1 (mesma contagem)
for (let f = 1; f <= 50; f++) { const F = N.nivel(f), r = F.cel.filter(c => c && c.rara); ok(r.length === 1, 'uma rara na fase ' + f); ok(r.every(c => (c.k === 'a' || c.k === 'b') && !c.item), 'rara num azulejo comum ' + f); ok(igual(N.nivel(f), F), 'fase sempre igual ' + f); }
// painel do dia: desenho de uma fase normal com outra semente, sem fase muito difícil
for (let dia = 20000; dia < 20060; dia++) { const x = M.doDia(dia), F = N.nivel(x.base, x.sem); ok(N.dif(x.base) < 2 && x.base >= 11, 'base do dia ' + dia); ok(F.total > 10 && F.cel.filter(c => c && c.rara).length === 1, 'painel do dia monta ' + dia); }
ok(JSON.stringify(N.nivel(M.doDia(20001).base, M.doDia(20001).sem).cel) !== JSON.stringify(N.nivel(M.doDia(20001).base).cel), 'painel do dia é diferente da fase base');

// peça rara na partida: cai, pega com a barra; se cair no chão ou a bola for perdida, some
{ const P = new N.Partida(3), t = P.cel.find(c => c && c.rara); P.quebra(t, P.bolas[0], false); ok(P.itens.some(i => i.tipo === 'rara'), 'quebrar a rara solta a peça');
  const it = P.itens.find(i => i.tipo === 'rara'); P.rq.alvo = it.x; let pegou = false; for (let i = 0; i < 1200 && !pegou; i++) { P.mover(it.x); for (const e of P.passo(1 / 120)) if (e.e === 'rara') pegou = true; } ok(pegou && P.rara === 1, 'barra pega a peça rara');
  const Q = new N.Partida(3), u = Q.cel.find(c => c && c.rara); Q.quebra(u, Q.bolas[0], false); Q.mover(u.x > 60 ? 10 : 110); let perdeu = false; for (let i = 0; i < 1500 && !perdeu; i++) { Q.mover(u.x > 60 ? 10 : 110); for (const e of Q.passo(1 / 120)) if (e.e === 'rara:perdida') perdeu = true; } ok(perdeu && Q.rara === -1, 'peça no chão se perde');
  const Z = new N.Partida(3, { rara: false }); ok(!Z.cel.some(c => c && c.rara), 'peça já guardada não aparece de novo');
  const W = new N.Partida(3, { barra: M.BARRA }); ok(Math.abs(W.largura - W.F.raquete * M.BARRA) < 1e-9, 'painel pronto alarga a barra'); }

// qualquer lixo vira ficha válida, e validar duas vezes dá igual
const lixo = () => { const v = [null, undefined, NaN, -5, 1e99, 'x', '', [], {}, true, { 1: 3 }, [9, 9, 9, 9, 9, 9], [5, 5, 5, 5, 5], { __proto__: null }, '12', { 3: 1, x: 2, '-1': 1 }, { ult: 'a', total: 9e9 }]; return v[RI(0, v.length - 1)]; };
for (let i = 0; i < 4000; i++) {
  const base = R() < .5 ? M.nova() : {}; for (const k of Object.keys(M.nova())) if (R() < .5) base[k] = lixo();
  if (R() < .3) base.estrelas = { [RI(-3, 60)]: RI(-2, 9), 4.5: 2, x: 1, 1: 3, 2: 3 }; if (R() < .3) base.obras = [RI(-1, 7), RI(0, 5), RI(0, 5), 5, 5];
  let d; try { d = M.validar(base); } catch (e) { ok(false, 'validar quebrou ' + e.message); continue; }
  ok(igual(d, M.validar(JSON.parse(JSON.stringify(d)))), 'validar estável'); ok(M.livres(d) >= 0, 'estrelas livres nunca negativas');
  ok(d.fase >= 1 && d.fase <= 51 && d.obras.length === 5 && d.obras.every(x => x >= 0 && x <= 5) && d.bolas >= 0 && d.bolas <= 999, 'limites');
  ok(d.obras.every((k, g) => g === 0 || k === 0 || d.obras[g - 1] === 5), 'obras na ordem'); for (const m of M.MARCOS) ok(Number.isFinite(M.marco(d, m).v), 'marco numérico ' + m.id);
}
for (const x of [null, 5, 'a', [], undefined]) ok(igual(M.validar(x), M.nova()), 'lixo inteiro vira ficha nova');

// migração da ficha da Fase 1: nada se perde
{ const v1 = { fase: 13, estrelas: { 1: 3, 2: 2, 12: 1 }, recordes: { 1: 2200, 2: 1800 }, tentativas: { 1: 4 }, visto: { inicio: 1, jarro: 1 }, op: { som: false, ambiente: true, vibra: false }, tot: { quebrados: 900, veios: 40, maiorVeio: 7, vitorias: 12, derrotas: 3, segundos: 1200 } };
  const d = M.migrar(v1); ok(d.fase === 13 && igual(d.estrelas, v1.estrelas) && igual(d.recordes, v1.recordes) && d.op.som === false && d.tot.quebrados === 900 && d.tot.maiorVeio === 7 && d.visto.jarro, 'migração mantém tudo');
  ok(d.obras.join() === '0,0,0,0,0' && d.bolas === 0 && M.livres(d) === 6, 'migração começa a Fase 2 do zero com as estrelas para usar'); }

// junção: conquistas ficam, gastos vêm da mais nova
{ const a = M.validar({ estrelas: { 1: 3, 2: 1 }, raras: { 1: 1 }, obras: [1], bolas: 4, salvo: 100, tot: { quebrados: 50 } }), b = M.validar({ estrelas: { 2: 3, 3: 2 }, raras: { 3: 1 }, bolas: 1, salvo: 200, tot: { quebrados: 80 } });
  const r = M.mesclar(a, b); ok(igual(r.estrelas, { 1: 3, 2: 3, 3: 2 }) && igual(r.raras, { 1: 1, 3: 1 }) && r.bolas === 1 && r.obras[0] === 1 && r.tot.quebrados === 80, 'mescla');
  ok(igual(M.mesclar(a, b), M.mesclar(b, a)), 'mesclar não depende da ordem'); ok(igual(M.mesclar(a, a), a), 'mesclar consigo mesma não muda'); }

// código de progresso
{ const d = M.validar({ estrelas: { 1: 3, 5: 2 }, raras: { 1: 1 }, bolas: 7, lidas: { 0: 1 } }), c = M.exportar(d); ok(/^GB2-[A-Za-z0-9+/=]+$/.test(c), 'código'); ok(igual(M.importar(c), d), 'código volta igual'); ok(igual(M.importar(' ' + c.slice(0, 20) + '\n' + c.slice(20) + ' '), d), 'código com espaços');
  ok(M.importar(c.slice(0, -6) + 'AAAAAA') === null && M.importar('oi') === null && M.importar('GB2-') === null && M.importar(null) === null, 'código estragado é recusado'); }

// painéis: restaurar gasta estrelas na ordem
{ const d = M.validar({ estrelas: { 1: 3, 2: 3, 3: 3, 4: 3 } }); ok(M.livres(d) === 12, 'livres'); ok(M.restaurar(d).g === 0 && M.livres(d) === 10, 'obra 1 custa 2'); M.restaurar(d); M.restaurar(d); ok(d.obras[0] === 3 && M.livres(d) === 3, 'obras 2 e 3'); ok(!M.podeRestaurar(d) && M.restaurar(d) === null, 'sem estrelas não restaura');
  d.estrelas = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [i + 1, 3])); let k = 0; while (M.restaurar(d)) k++; ok(d.obras.every(x => x === 5) && M.livres(d) === 50 && M.proxima(d) === null, 'tudo restaurado sobra 50'); ok(M.barra(d, 2) === M.BARRA, 'barra mais larga'); }

// marcos e painel do dia
{ const d = M.nova(); d.tot.quebrados = 1600; const g = M.checarMarcos(d); ok(g.length === 2 && d.marcos.quebra === 2 && d.bolas === 2, 'dois degraus de uma vez'); ok(M.checarMarcos(d).length === 0, 'não entrega duas vezes');
  d.fase = 6; ok(M.diaAberto(d), 'dia abre na fase 6'); let b = 0; for (let i = 0; i < 7; i++) b += M.fecharDia(d, 100 + i * 3); ok(b === 10 && d.dia.total === 7, 'a cada 7 painéis +3 (faltar não zera)'); ok(M.fecharDia(d, 118) === 0, 'mesmo dia não paga duas vezes');
  const c = M.validar({ raras: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 11, 1])) }); ok(M.cartaAberta(c, 1) && !M.cartaAberta(c, 0) && !M.cartaAberta(c, 5), 'carta abre com as 10 peças do lugar'); }

// ritmo: jogador médio (vence quase tudo com 2 estrelas e pega 6 de cada 10 peças) — quando dá para restaurar e como termina
{ const d = M.nova(); const rs = []; let r1 = 0; for (let f = 1; f <= 50; f++) { const e = N.dif(f) ? 2 : (f % 3 ? 3 : 2); d.estrelas[f] = e; d.fase = f + 1; if ((f * 7) % 10 < 6) d.raras[f] = 1; d.tot.quebrados += 60; d.tot.veios += 3; d.tot.jarros += f >= 3 ? 1.5 : 0; d.tot.itens += 2; d.tot.maiorVeio = Math.min(12, 3 + (f / 5 | 0)); d.tot.jarros = Math.round(d.tot.jarros);
    while (M.restaurar(d)) { if (!r1) r1 = f; } const g = M.checarMarcos(d); if (f % 10 === 0) rs.push(`fase ${f}: obras ${d.obras.join('')} · ${M.totalRaras(d)} peças · ${d.bolas} bolas guardadas`); }
  console.log('ritmo (jogador médio):', '1ª obra na fase', r1); for (const l of rs) console.log('  ' + l); ok(r1 === 1, 'primeira obra já na fase 1'); ok(d.obras.every(x => x === 5), 'médio termina com os 5 painéis'); }

console.log(`${n} conferências, ${ruins} falharam`); process.exit(ruins ? 1 : 0);

// Glaze Break, Fase 3: confere a economia (moedas, vidas, reforços, bolas guardadas, continuar, diária, missões, evento, compras, anúncios),
// as ferramentas na física (pincel, rede, três bolas) e mede o ritmo das moedas.   node eco.mjs
import { readFileSync } from 'node:fs';
const html = readFileSync('C:/Users/Minhoca/Projetos/JogosOffline/jogos/glaze-break/index.html', 'utf8'), bl = id => html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'))[1].replace("'use strict';", '');
const { N, E, M } = new Function(bl('nucleo') + bl('eco') + bl('meta') + ';return{N:Nucleo,E:Eco,M:Meta}')(); let n = 0, ruins = 0; const ok = (c, m) => { n++; if (!c) { ruins++; if (ruins < 30) console.log('FALHOU:', m); } };
let s = 11; const R = () => (s = (s * 16807) % 2147483647) / 2147483647, RI = (a, b) => a + Math.floor(R() * (b - a + 1));
const H = '2026-11-26', T0 = Date.parse('2026-11-26T12:00:00'), MIN = 60000;
const ficha = (x = {}) => { const d = M.nova(); Object.assign(d, x); return d; };

// ---------- números e conteúdo ----------
ok(E.ITENS.length === 6 && new Set(E.ITENS.map(i => i.id)).size === 6, '6 reforços'); ok(E.ITENS.filter(i => i.quando === 'durante').length === 3, '3 ferramentas');
ok(E.ITENS.every(i => i.preco >= 50 && i.preco <= 120 && i.fase >= 5 && i.fase <= 14), 'preços e fases dos reforços'); ok(E.DIARIA.length === 7 && E.MISSOES.length === 10 && E.EVENTOS.length === 4, 'diária 7, missões 10, eventos 4');
for (const p of [...E.DIARIA, ...E.PREMIO_SEMANA, E.PREMIO_MISSAO, E.PREMIO_TRES, ...E.PRODUTOS.map(x => x.premio)]) for (const k in p) ok(k === 'moedas' || k === 'vidasLivres' || E.item(k), 'prêmio conhecido ' + k);
ok(E.textoPremio({ moedas: 80, bola: 1 }) === '80 moedas + 1 bola guardada', 'texto do prêmio'); ok(E.textoPremio({ vidasLivres: 30 }) === '30 minutos sem gastar vida', 'texto vidas livres');

// ---------- ficha: qualquer lixo vira economia válida; validar duas vezes dá igual; a ficha da Fase 2 ganha eco zerada ----------
const lixo = () => { const v = [null, undefined, NaN, -5, 1e99, 'x', '', [], {}, true, '12', { __proto__: null }, [1, 2, 3], { dia: '2026-13-99', n: 'a' }, Infinity]; return v[RI(0, v.length - 1)]; };
for (let i = 0; i < 3000; i++) {
  const b = R() < .5 ? E.nova() : {}; for (const k of Object.keys(E.nova())) if (R() < .5) b[k] = lixo();
  if (R() < .3) b.inv = { pincel: RI(-5, 2000), rede: 'x', zzz: 4 }; if (R() < .3) b.tent = { 3: 4, 99: 2, x: 1, 0: 5, 51: 2 }; if (R() < .2) b.missoes = { dia: H, ids: [0, 0, 1], prog: [1, 2, 3], rec: [1, 0, 0] };
  const e = E.validar(b); ok(e.moedas >= 0 && e.moedas <= 999999 && e.vidas >= 0 && e.vidas <= 5, 'números no limite'); ok(Object.keys(e.inv).every(k => E.INV.includes(k) && e.inv[k] >= 0 && e.inv[k] <= 999), 'inventário válido');
  ok(Object.keys(e.tent).every(k => +k >= 1 && +k <= 50), 'tentativas só de fases'); ok(e.missoes.ids.length === 0 || new Set(e.missoes.ids).size === 3, 'missões distintas');
  ok(JSON.stringify(E.validar(e)) === JSON.stringify(e), 'validar é estável');
}
{ const v2 = { fase: 12, estrelas: { 1: 3, 2: 2 }, bolas: 4 }, d = M.validar(v2); ok(d.eco && d.eco.moedas === 0 && d.eco.vidas === 5 && d.bolas === 4, 'ficha da Fase 2 ganha economia zerada e mantém as bolas'); }
// junção: o que se gasta vem da mais nova; o que se recebe uma vez nunca volta atrás
{ const a = ficha(), b = ficha(); a.salvo = 10; b.salvo = 20; a.eco.moedas = 900; b.eco.moedas = 50; a.eco.compras = ['inicial:x1']; b.eco.compras = ['moedas_500:y']; a.eco.semAnuncios = true; a.eco.diaria = { dia: '2026-11-27', passo: 9 }; b.eco.diaria = { dia: H, passo: 3 };
  a.eco.presente = 1; b.eco.ganhos = ['pincel']; const r = M.mesclar(a, b); ok(r.eco.moedas === 50, 'moedas da ficha mais nova'); ok(r.eco.compras.length === 2 && r.eco.semAnuncios, 'compras juntas'); ok(r.eco.diaria.passo === 9 && r.eco.diaria.dia === '2026-11-27', 'diária não volta');
  ok(r.eco.presente === 1 && r.eco.ganhos.includes('pincel'), 'presente e ganhos não se repetem'); const r2 = M.mesclar(r, r); ok(r2.eco.moedas === r.eco.moedas, 'juntar com ela mesma não multiplica');
  const c = M.importar(M.exportar(r)); ok(c && c.eco.moedas === 50 && c.eco.compras.length === 2, 'código do progresso leva a economia'); }

// ---------- moedas e itens ----------
{ const d = ficha({ fase: 7 }); ok(!E.comprarItem(d, 'pincel'), 'sem moedas não compra'); E.ganhar(d, 100); ok(E.comprarItem(d, 'pincel') && d.eco.moedas === 40 && d.eco.inv.pincel === 1, 'compra pincel');
  ok(!E.comprarItem(d, 'rede'), 'rede fechada na fase 7'); ok(E.usarItem(d, 'pincel') && !E.usarItem(d, 'pincel'), 'usa e acaba'); E.ganhar(d, 90); ok(E.comprarItem(d, 'bola') && d.bolas === 1, 'bola guardada vai para d.bolas');
  const l = E.desbloquear(d); ok(l.map(i => i.id).join() === 'pincel' && d.eco.inv.pincel === 2 && d.bolas === 1, 'liberou pincel com 2 de presente, bola não'); ok(!E.desbloquear(d).length, 'presente só uma vez');
  d.fase = 51; const l2 = E.desbloquear(d); ok(l2.length === 4, 'os outros 4 na fase 51');
  const e = ficha({ estrelas: { 1: 3, 2: 3, 3: 2 } }); ok(E.presente(e) === 116 && E.presente(e) === 0, 'presente de chegada uma vez (100 + 2 por estrela)'); ok(E.gastar(e, 116) && !E.gastar(e, 1) && !E.gastar(e, -1), 'gastar não deixa negativo');
  ok(E.moedasVitoria(0, 3, 60) === 21 && E.moedasVitoria(0, 1, -20) === 11 && E.moedasVitoria(2, 3, 100) === 7 && E.moedasVitoria(3, 3, 0) === 2, 'moedas da vitória');
  const f = ficha(); E.entregar(f, { moedas: 10, rede: 2, bola: 1, vidasLivres: 30 }, T0, 2); ok(f.eco.moedas === 20 && f.eco.inv.rede === 4 && f.bolas === 2 && f.eco.livreAte === T0 + 60 * MIN, 'entregar em dobro'); }

// ---------- vidas ----------
{ const e = E.nova(); ok(!E.perderVida(e, 10, T0) && e.vidas === 5, 'fase 10 não gasta'); ok(!E.perderVida(e, 0, T0), 'painel do dia (0) não gasta'); ok(E.perderVida(e, 11, T0) && e.vidas === 4, 'fase 11 gasta');
  ok(E.vidas(e, T0 + 14 * MIN).n === 4 && E.vidas(e, T0 + 15 * MIN).n === 5, 'uma vida a cada 15 min'); for (let i = 0; i < 5; i++) E.perderVida(e, 20, T0 + 20 * MIN); ok(e.vidas === 0 && !E.podeJogar(e, 20, T0 + 20 * MIN) && E.podeJogar(e, 5, T0 + 20 * MIN), 'sem vida: só fases fáceis');
  ok(E.vidas(e, T0).n === 0 && E.vidas(e, T0 + 16 * MIN).n === 1, 'relógio voltou: recomeça a contar'); const d = ficha(); d.eco = e; E.ganhar(d, 150); ok(E.encherVidas(d, T0 + 16 * MIN) && d.eco.vidas === 5 && d.eco.moedas === 0, 'encher por 150');
  d.eco.livreAte = T0 + 30 * MIN; ok(!E.perderVida(d.eco, 30, T0 + 20 * MIN) && E.perderVida(d.eco, 30, T0 + 31 * MIN), 'tempo sem gastar vida'); }
// quem empaca: ajuda e pacote
{ const d = ficha({ fase: 20 }); E.perdeuFase(d.eco, 15); ok(E.ajuda(d.eco, 15) === 0, 'sem ajuda com 1 derrota'); E.perdeuFase(d.eco, 15); ok(E.ajuda(d.eco, 15) === 1, 'ajuda 1 com 2 derrotas'); for (let i = 0; i < 4; i++) E.perdeuFase(d.eco, 15); ok(E.ajuda(d.eco, 15) === 3, 'ajuda 3 com 6');
  ok(!E.pacote(d, 15), 'pacote só para quem pode pagar'); E.ganhar(d, 95); const p = E.pacote(d, 15); ok(p && p.preco === 95 && p.cheio === 130, 'pacote com desconto'); E.venceuFase(d.eco, 15); ok(!E.ajuda(d.eco, 15) && !E.pacote(d, 15), 'vencer zera');
  E.perdeuFase(d.eco, 0); E.perdeuFase(d.eco, 1000); ok(Object.keys(d.eco.tent).length === 0, 'painel do dia não conta derrota'); const g = ficha({ fase: 12 }); E.ganhar(g, 500); g.eco.tent[11] = 3; ok(!E.pacote(g, 11), 'pacote só com bola lenta liberada'); }
// continuar
{ const d = ficha(); d.bolas = 3; let c = { guardadas: 0, pagas: 0 };
  let o = E.continuar(d, c, 40, 50, true); ok(o && o.guardada && !o.preco && !o.video, 'longe do fim: só bola guardada'); o = E.continuar(d, c, 10, 50, true); ok(o.guardada && o.preco === 100 && !o.podePagar && o.video, 'perto do fim: moedas e vídeo');
  E.ganhar(d, 1000); c = { guardadas: 2, pagas: 0 }; o = E.continuar(d, c, 6, 100, false); ok(!o.guardada && o.podePagar && o.preco === 100, 'bola guardada até 2'); c = { guardadas: 1, pagas: 1 }; o = E.continuar(d, c, 5, 100, true); ok(o.preco === 160 && !o.video, 'segunda paga custa 160, vídeo só na primeira');
  ok(!E.continuar(d, { guardadas: 2, pagas: 1 }, 1, 100, true), 'no máximo 3 voltas'); const z = ficha(); ok(!E.continuar(z, { guardadas: 0, pagas: 0 }, 40, 50, true), 'sem bola e longe: nada'); ok(E.pertinho(6, 10) && E.pertinho(35, 100) && !E.pertinho(36, 100), 'perto do fim = até 35% (mínimo 6)'); }

// ---------- diária, missões, evento ----------
{ const d = ficha({ fase: 30 }); ok(E.temDiaria(d.eco, H), 'tem diária'); ok(JSON.stringify(E.pegarDiaria(d, H, T0)) === '{"moedas":20}' && !E.pegarDiaria(d, H, T0), 'uma por dia'); ok(E.pegarDiaria(d, '2026-11-30', T0).pincel === 1, 'faltar dias não zera');
  for (let i = 0; i < 5; i++) E.pegarDiaria(d, '2026-12-0' + (i + 1), T0); ok(d.eco.diaria.passo === 7 && d.bolas === 1, 'sete passos, o último dá bola'); ok(E.pegarDiaria(d, '2026-12-08', T0, 2).moedas === 20 && d.eco.moedas >= 20 + 30 + 40 + 80 + 40, 'recomeça a roda e o vídeo dobra'); }
{ const d = ficha({ fase: 30 }); const m = E.missoes(d, H); ok(m.l.length === 3 && new Set(m.l.map(x => x.tipo)).size === 3, '3 missões diferentes'); ok(JSON.stringify(E.missoes(d, H).l.map(x => x.tipo)) === JSON.stringify(m.l.map(x => x.tipo)), 'as mesmas o dia todo');
  const r = Object.fromEntries(E.MISSOES.map(x => [x.tipo, x.alvo])); E.registrar(d, H, r); const m2 = E.missoes(d, H); ok(m2.l.every(x => x.pronta), 'registrar completa'); for (const x of m2.l) ok(E.pegarMissao(d, x.k, T0) && !E.pegarMissao(d, x.k, T0), 'receber uma vez');
  ok(E.missoes(d, H).bau && E.pegarBau(d, T0) && !E.pegarBau(d, T0), 'baú das três'); ok(d.eco.moedas === 3 * 15 + 25 && d.eco.inv.pincel === 1, 'prêmios das missões'); ok(E.missoes(d, '2026-11-27').l.every(x => !x.feita && x.v === 0), 'dia novo, missões novas');
  const cedo = ficha({ fase: 2 }); for (let k = 0; k < 40; k++) { const t = E.missoes(cedo, `2027-01-${String(k % 28 + 1).padStart(2, '0')}`).l.map(x => x.tipo); ok(!t.includes('jarros') && !t.includes('dia'), 'missão só depois da fase dela'); cedo.eco.missoes.dia = ''; }
  const cheia = ficha({ fase: 51 }); for (let f = 1; f <= 50; f++) cheia.raras[f] = 1; for (let k = 0; k < 60; k++) { const t = E.missoes(cheia, `2027-02-${String(k % 28 + 1).padStart(2, '0')}`).l.map(x => x.tipo); ok(!t.includes('raras'), 'sem missão de peça rara quando não falta nenhuma'); cheia.eco.missoes.dia = ''; } }
{ const d = ficha({ fase: 30 }); const sg = E.semana(d, '2026-11-23'), dm = E.semana(d, '2026-11-29'); ok(sg.cor === dm.cor && sg.dias === 7 && dm.dias === 1, 'semana de segunda a domingo');
  const c = sg.cor, por = [0, 0, 0, 0]; por[c] = 70; por[(c + 1) % 4] = 500; E.registrar(d, '2026-11-24', { porCor: por }); const x = E.semana(d, '2026-11-24'); ok(x.v === 70 && x.pronta, 'conta só o esmalte da semana'); ok(E.pegarSemana(d, '2026-11-24', T0).moedas === 25 && !E.pegarSemana(d, '2026-11-24', T0), 'degrau 1');
  ok(E.semana(d, '2026-11-30').v === 0 && E.semana(d, '2026-11-30').cor !== c, 'segunda nova, esmalte novo'); }

// ---------- anúncios e compras ----------
{ const e = E.nova(); for (let i = 0; i < 8; i++) { ok(E.podeVideo(e, H), 'vídeo ' + i); E.viuVideo(e, H); } ok(!E.podeVideo(e, H) && E.podeVideo(e, '2026-11-27'), '8 vídeos por dia');
  e.inter.vit = 4; ok(!E.podeInter(e, 11, T0) && E.podeInter(e, 12, T0), 'entre fases só depois da 12'); E.viuInter(e, T0); e.inter.vit = 4; ok(!E.podeInter(e, 20, T0 + 60000) && E.podeInter(e, 20, T0 + 180000), '3 minutos de intervalo');
  const d = ficha(); ok(E.entregarCompra(d, 'inicial', 't1', T0) && !E.entregarCompra(d, 'inicial', 't2', T0), 'pacote inicial uma vez só'); ok(d.eco.moedas === 600 && d.bolas === 5 && d.eco.inv.tripla === 3 && d.eco.livreAte === T0 + 1440 * MIN, 'pacote entregue');
  ok(E.entregarCompra(d, 'moedas_500', 'a', T0) && !E.entregarCompra(d, 'moedas_500', 'a', T0) && E.entregarCompra(d, 'moedas_500', 'b', T0) && d.eco.moedas === 1600, 'mesma transação nunca duas vezes');
  ok(!E.entregarCompra(d, 'nada', 'x', T0) && !E.entregarCompra(d, 'moedas_500', '', T0), 'compra inválida'); d.eco.inter.vit = 9; ok(!E.podeInter(d.eco, 30, T0 + 1e9), 'quem comprou não vê anúncio'); E.entregarCompra(d, 'sem_anuncios', 's', T0); ok(d.eco.semAnuncios, 'sem anúncios'); }

// ---------- ferramentas na física ----------
const corre = (P, seg, f) => { for (let i = 0; i < seg * 120 && !P.fim; i++) { if (f) f(P); P.passo(1 / 120); } };
{ // timers não andam com a bola presa
  const P = new N.Partida(9, { largo: 25, lenta: 20 }); corre(P, 3); ok(P.rq.larg === 25 && P.lenta === 20, 'reforço não se gasta com a bola presa'); P.lancar(); corre(P, 2); ok(P.rq.larg < 23.1 && P.lenta < 18.1, 'conta com a bola em jogo');
  const V = new N.Partida(9, { vidas: 1 }); ok(V.vidas === 4, 'bola a mais = 4 bolas'); }
{ // rede: a bola que passa da barra volta; acaba depois do tempo; pisca e some
  const P = new N.Partida(12); P.lancar(); ok(P.ferramenta('rede', 15) && !P.ferramenta('rede', 15), 'rede uma por vez'); let volta = 0, perdeu = 0;
  corre(P, 14, Q => { Q.mover(Q.bolas[0] && Q.bolas[0].x < 60 ? 110 : 10); }); for (const e of P.ev) if (e.e === 'perdeu') perdeu++;
  const Z = new N.Partida(12); Z.lancar(); Z.ferramenta('rede', 15); let r = 0, pd = 0; for (let i = 0; i < 14 * 120 && !Z.fim; i++) { Z.mover(Z.bolas[0] && Z.bolas[0].x < 60 ? 110 : 10); for (const e of Z.passo(1 / 120)) { if (e.e === 'rede') r++; if (e.e === 'perdeu') pd++; } }
  ok(r >= 2 && pd === 0, `com a rede a bola não se perde (rebateu ${r})`); for (let i = 0; i < 20 * 120 && !Z.fim && Z.perdidas === 0; i++) { Z.mover(Z.bolas[0] && Z.bolas[0].x < 60 ? 110 : 10); Z.passo(1 / 120); } ok(Z.perdidas === 1 && Z.rede <= 0, 'sem a rede a bola cai de novo'); }
{ // pincel e três bolas
  const P = new N.Partida(20); ok(P.ferramenta('pincel') && P.bolas.every(b => b.cor >= 0), 'pincel pinta a bola'); const Q = new N.Partida(1); for (const t of Q.cel) if (t && (t.k === 'a' || t.k === 'j')) { t.k = 'b'; t.cor = -1; } ok(!Q.ferramenta('pincel'), 'sem esmalte no painel o pincel não gasta');
  const T = new N.Partida(15); ok(T.ferramenta('tripla') && T.bolas.length === 3 && T.lancou, 'três bolas'); ok(T.ferramenta('tripla') && T.bolas.length === 5 && T.ferramenta('tripla') === false, 'no máximo 5 bolas em jogo');
  T.fim = 'vitoria'; ok(!T.ferramenta('rede'), 'fase acabada não usa'); ok(!T.ferramenta('xyz') === true, 'ferramenta desconhecida');
  const C = new N.Partida(18); C.lancar(); corre(C, 40, X => X.mover(X.bolas.find(b => !b.presa) ? N.prever(X.bolas.find(b => !b.presa), N.PY - 3) ?? X.rq.x : X.rq.x)); ok(C.porCor.reduce((a, b) => a + b, 0) > 0 && C.porCor.reduce((a, b) => a + b, 0) <= C.quebrados, 'contagem por esmalte'); }
// as 50 fases continuam iguais à versão de antes (node eco.mjs index-antigo.html)
if (process.argv[2]) { const antes = readFileSync(process.argv[2], 'utf8').match(/<script id="nucleo">([\s\S]*?)<\/script>/)[1]; const N0 = new Function(antes + ';return Nucleo')();
  for (let f = 1; f <= 50; f++) ok(JSON.stringify(N0.nivel(f)) === JSON.stringify(N.nivel(f)), 'fase igual ' + f); }

// ---------- ritmo das moedas (estimativa: estrelas e tempo da "pessoa" do calibrar, marcos e painéis do meta.mjs) ----------
// médio: 2,6 estrelas nas normais, 2,2 nas difíceis; 15 s abaixo do tempo; 1 peça rara a cada 1,6 fase; 1 painel a cada 10 fases; ~25 degraus de marco nas 50; diária em 1 de cada 2 fases; 1 missão por fase
function ritmo(gasta, iniciante) {
  const d = ficha(); E.presente(d); let compras = 0, sem = 0, derrotas = 0; const e = d.eco;
  for (let f = 1; f <= 50; f++) {
    d.fase = f; E.desbloquear(d); const dif = N.dif(f), perde = iniciante ? [0.25, .6, 1.1][dif] : [0.02, .2, .5][dif];
    let t = 0; while (R() < perde / (1 + perde) && t < 4) { t++; derrotas++; if (!E.perderVida(e, f, T0 + f * 10 * MIN)) sem += E.podeJogar(e, f, T0 + f * 10 * MIN) ? 0 : 1; }
    const est = Math.max(1, Math.min(3, Math.round((dif ? 2.2 : 2.7) - (iniciante ? .7 : 0) + (R() - .5)))); E.ganhar(d, E.moedasVitoria(0, est, iniciante ? 0 : 15));
    if (R() < .62) E.ganhar(d, E.RARA); if (f % 10 === 0) E.ganhar(d, E.PAINEL); if (R() < .5) E.ganhar(d, E.MARCO[Math.min(2, Math.floor(f / 18))]); if (R() < .5) E.pegarDiaria(d, new Date(Date.UTC(2026, 0, 1 + f)).toISOString().slice(0, 10), T0);
    if (f >= 6 && R() < .5) E.ganhar(d, 15); if (f > 12 && R() < .12) E.ganhar(d, 15);
    if (gasta) for (const i of E.ITENS) if (E.aberto(d, i.id) && E.qtd(d, i.id) < 1 && R() < .35 && E.comprarItem(d, i.id)) { compras++; E.usarItem(d, i.id); }
    if (gasta && dif && R() < .5 && E.gastar(d, 100)) compras++;
  }
  return { moedas: e.moedas, ganhas: e.tot.ganhas, compras, derrotas, sem };
}
for (const [nome, g, ini] of [['médio que gasta', 1, 0], ['médio sem gastar', 0, 0], ['iniciante que gasta', 1, 1]]) { const v = [0, 1, 2, 3, 4, 5, 6, 7].map(() => ritmo(g, ini)), m = k => Math.round(v.reduce((a, x) => a + x[k], 0) / v.length);
  console.log(`ritmo ${nome}: termina as 50 com ~${m('moedas')} moedas (ganhou ${m('ganhas')}), ${m('compras')} compras, ${m('derrotas')} derrotas, ficou sem vida ${m('sem')} vez(es)`); }
console.log(`${n} conferências, ${ruins} falharam`); process.exit(ruins ? 1 : 0);

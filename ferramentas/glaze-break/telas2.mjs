// Glaze Break: testa as telas da Fase 2 (início, painéis, caderno, carta, marcos, peça rara, bola guardada, painel do dia, código, migração da ficha v1), com fotos.
//   node telas2.mjs pasta
import { abrir, dorme } from './nav.mjs';
const pasta = process.argv[2]; const p = await abrir({ w: 390, h: 844, movel: true, dpr: 2 }); await dorme(600); let ruins = 0, bons = 0;
const ok = (c, m) => { if (c) bons++; else { ruins++; console.log('FALHOU:', m); } }, E = x => p.av(x.replaceAll('@', '__glaze.'));
const c = async sel => { const r = await E(`(()=>{const e=document.querySelector('${sel}');if(!e||e.disabled)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`); if (!r) return ok(false, 'botão ' + sel); await p.toque(...r); await dorme(300); };
const cabe = sel => E(`[...document.querySelectorAll('${sel}')].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})`);
const recarrega = async () => { await p.recarregar(); for (let i = 0; i < 40; i++) { await dorme(200); if (await E("!!window.__glaze").catch(() => 0)) break; } await dorme(500); };
const ABERT = '#bJogar,#bMapa,#bPaineis,#bCaderno,#bMarcos,#bDia,#bAjustes';

// migração: uma ficha da Fase 1 vira v2 sem perder nada (e a v1 fica intocada)
const soma = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const v1 = { fase: 12, estrelas: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, 3])), recordes: { 1: 2000 }, tentativas: { 1: 2 }, visto: { inicio: 1, jarro: 1, cor: 1 }, op: { som: true, ambiente: false, vibra: true }, tot: { quebrados: 800, veios: 30, maiorVeio: 7, vitorias: 11, derrotas: 2, segundos: 900 } };
const txt1 = JSON.stringify({ v: 1, soma: soma(JSON.stringify(v1)), d: v1 });
await E(`localStorage.clear();localStorage.setItem('glaze-break.v1',${JSON.stringify(txt1)})`); await recarrega();
ok(await E('@Progresso.d.fase') === 12 && await E('@Progresso.d.estrelas[11]') === 3 && await E('@Progresso.d.op.ambiente') === false && await E('@Progresso.d.tot.quebrados') === 800, 'ficha da Fase 1 migra sem perder nada');
ok(await E("localStorage.getItem('glaze-break.v1')") === txt1, 'ficha v1 fica intocada'); ok(await E("JSON.parse(localStorage.getItem('glaze-break.v2')).v") === 2, 'grava a ficha v2');
ok(await E('@Progresso.d.marcos.quebra') === undefined, 'marcos esperam a primeira partida');

// início: tudo cabe, painéis com marca (33 estrelas para usar), do dia aberto
ok(await cabe(ABERT), 'botões do início cabem em pé'); ok(await E("document.getElementById('bPaineis').classList.contains('novo')"), 'marca nos painéis'); ok(!(await E("document.getElementById('bDia').disabled")), 'painel do dia aberto (fase 12)');
await p.foto(`${pasta}/f2-abertura.png`);

// painéis: restaurar gasta estrelas e anima; passa para o próximo lugar
await c('#bPaineis'); ok(await E("@Jogo.aberto") === 'paineis', 'abre painéis'); ok(/33 ★/.test(await E("document.getElementById('qResumo').textContent")), 'mostra 33 estrelas para usar'); await p.foto(`${pasta}/f2-painel-vazio.png`);
await c('#qObra'); await dorme(500); await p.foto(`${pasta}/f2-painel-animando.png`); await dorme(1400);
ok(await E('@Progresso.d.obras[0]') === 1 && /31 ★/.test(await E("document.getElementById('qResumo').textContent")), 'obra 1 custa 2 estrelas');
for (let i = 0; i < 4; i++) { await c('#qObra'); await dorme(1800); } ok(await E('@Progresso.d.obras[0]') === 5, 'painel do Ateliê pronto'); ok(/pronto/i.test(await E("document.getElementById('qTxt').textContent")), 'avisa painel pronto'); await p.foto(`${pasta}/f2-painel-pronto.png`);
await c('#qProx'); ok(/Pátio/.test(await E("document.getElementById('qNome').textContent")), 'vai para o Pátio'); await c('#qProx'); ok(/abre depois/.test(await E("document.getElementById('qTxt').textContent")) && await E("document.getElementById('qObra').hidden"), 'Fonte espera o Pátio');
ok(await E("(()=>{const c=document.getElementById('qCv').getBoundingClientRect();return c.width>200&&c.right<=innerWidth})()"), 'painel grande e dentro da tela');
await c('#paineis [data-volta]'); ok(await E("@Jogo.aberto") === 'abertura', 'volta ao início');
await E('@Jogo.comecar(3).then(()=>1)'); await dorme(300); ok(Math.abs(await E('@Jogo.P.largura') - await E('@Jogo.P.F.raquete') * 1.06) < 1e-6, 'barra 6% mais larga no Ateliê'); await E('@Jogo.comecar(12).then(()=>1)'); await dorme(200); ok(Math.abs(await E('@Jogo.P.largura') - await E('@Jogo.P.F.raquete')) < 1e-6, 'barra normal no Pátio');

// peça rara: quebrar o azulejo dourado solta a peça; a barra pega; fica guardada mesmo perdendo a fase
await E('@Jogo.comecar(2).then(()=>1)'); await dorme(400); ok(await E('@Jogo.P.cel.filter(t=>t&&t.rara).length') === 1, 'fase tem uma peça rara'); await p.foto(`${pasta}/f2-azulejo-raro.png`);
await E(`(()=>{const P=@Jogo.P,t=P.cel.find(t=>t&&t.rara);P.ev=P.fila;P.quebra(t,P.bolas[0],false);})()`); await dorme(400);
ok(/Peça rara/.test(await E("document.getElementById('dica').textContent")), 'ensina a pegar a peça'); await p.foto(`${pasta}/f2-peca-caindo.png`);
for (let i = 0; i < 250 && await E('@Jogo.P.rara') !== 1; i++) { await E('(()=>{const P=@Jogo.P,it=P.itens.find(i=>i.tipo==="rara");if(it)P.mover(it.x);})()'); await dorme(60); }
ok(await E('@Jogo.P.rara') === 1, 'barra pega a peça'); await dorme(200); await E('@Progresso.d.bolas=0'); await p.foto(`${pasta}/f2-peca-pega.png`);
await E('(()=>{const P=@Jogo.P;P.vidas=1;P.bolas.forEach(b=>{b.presa=false;b.x=60;b.y=170;b.dx=0;b.dy=1;});P.rq.alvo=10;P.rq.x=10;})()'); await dorme(2600);
ok(await E("@Jogo.aberto") === 'derrota' && await E('@Progresso.d.raras[2]') === 1, 'perdeu a fase mas a peça ficou'); ok(/Rosa|Losango/.test(await E("document.getElementById('dMais').textContent")), 'derrota mostra a peça guardada');
await p.foto(`${pasta}/f2-derrota-peca.png`);
await E('@Jogo.comecar(2).then(()=>1)'); await dorme(300); ok(await E('@Jogo.P.cel.filter(t=>t&&t.rara).length') === 0, 'peça guardada não volta');

// bola guardada: quando as bolas acabam, oferece continuar
await E('@Progresso.d.bolas=2'); await E('@Jogo.comecar(4).then(()=>1)'); await dorme(300);
await E('(()=>{const P=@Jogo.P;P.vidas=1;P.bolas.forEach(b=>{b.presa=false;b.x=60;b.y=170;b.dx=0;b.dy=1;});P.rq.alvo=10;P.rq.x=10;})()'); await dorme(2600);
ok(await E("@Jogo.aberto") === 'continuar', 'oferece bola guardada'); await p.foto(`${pasta}/f2-continuar.png`); await c('#uSim'); await dorme(300);
ok(await E("@Jogo.aberto") === '' && await E('@Jogo.P.vidas') === 1 && await E('@Progresso.d.bolas') === 1 && await E('@Jogo.P.bolas[0].presa'), 'usa a bola e volta presa na barra');
await E('(()=>{const P=@Jogo.P;P.bolas.forEach(b=>{b.presa=false;b.x=60;b.y=170;b.dx=0;b.dy=1;});P.rq.alvo=10;P.rq.x=10;})()'); await dorme(2600); ok(await E("@Jogo.aberto") === 'continuar', 'oferece de novo (até 2)');
await c('#uNao'); await dorme(300); ok(await E("@Jogo.aberto") === 'derrota' && await E('@Progresso.d.bolas') === 1, 'não usar termina e guarda a bola');

// vitória: peça, marco e botão de restaurar
await E('@Progresso.d.tot.quebrados=1490'); await E('@Jogo.comecar(5).then(()=>1)'); await dorme(300);
await E(`(()=>{const P=@Jogo.P,t=P.cel.find(t=>t&&t.rara);P.quebra(t,P.bolas[0],false);P.rara=1;P.itens=[];for(const x of P.cel)if(x&&x.vivo&&x.k!=='f'){x.vivo=false;P.restam--;P.quebrados++;}})()`); await dorme(2200);
ok(await E("@Jogo.aberto") === 'vitoria', 'vence'); const vm = await E("document.getElementById('vMais').textContent"); ok(/Cruz de pincéis/.test(vm) && /Marco: Azulejos quebrados/.test(vm), 'vitória mostra peça e marco: ' + vm);
ok(!(await E("document.getElementById('vObra').hidden")), 'oferece restaurar'); await p.foto(`${pasta}/f2-vitoria.png`); ok(await cabe('#vitoria .caixa .bt'), 'botões da vitória cabem');
await c('#vObra'); ok(await E("@Jogo.aberto") === 'paineis', 'vitória leva aos painéis'); await c('#paineis [data-volta]');

// caderno e carta
await E('for(let f=11;f<=20;f++)@Progresso.d.raras[f]=1'); await c('#bCaderno'); ok(await E("@Jogo.aberto") === 'caderno', 'abre caderno'); ok(await E("document.querySelectorAll('.pc').length") === 50, '50 peças');
ok(await E("!document.querySelector('[data-c=\"1\"]').disabled") && await E("document.querySelector('[data-c=\"0\"]').disabled"), 'carta do Pátio aberta, Ateliê fechada');
await c('.pc[data-f="12"]'); ok(/Pipa/.test(await E("document.getElementById('cInfo').textContent")), 'toque mostra o nome'); await p.foto(`${pasta}/f2-caderno.png`);
await c('[data-c="1"]'); ok(await E("@Jogo.aberto") === 'carta' && /limoeiro/.test(await E("document.getElementById('kTxt').textContent")), 'lê a carta'); ok(await E('@Progresso.d.lidas[1]') === 1, 'carta lida fica marcada'); await p.foto(`${pasta}/f2-carta.png`);
await c('#carta [data-volta]'); ok(await E("@Jogo.aberto") === 'caderno', 'volta ao caderno'); await c('#caderno [data-volta]');

// marcos
await c('#bMarcos'); ok(await E("document.querySelectorAll('.mc').length") === 10, '10 marcos'); ok(await E("document.querySelectorAll('.mc .deg i.on').length") >= 1, 'degrau marcado'); await p.foto(`${pasta}/f2-marcos.png`); await c('#marcos [data-volta]');

// painel do dia: joga, vence, paga 1 bola e fecha até amanhã
const b0 = await E('@Progresso.d.bolas'); await c('#bDia'); await dorme(400); ok(await E("document.getElementById('tFase').textContent") === 'Painel do dia' && await E('@Jogo.P.dia') > 0, 'abre o painel do dia');
ok(await E('@Jogo.P.cel.filter(t=>t&&t.rara).length') === 0, 'painel do dia sem peça rara'); await p.foto(`${pasta}/f2-dia.png`);
await E(`(()=>{const P=@Jogo.P;for(const x of P.cel)if(x&&x.vivo&&x.k!=='f'){x.vivo=false;P.restam--;}})()`); await dorme(2200);
ok(await E("@Jogo.aberto") === 'vitoria' && /Painel do dia/.test(await E("document.getElementById('vTit').textContent")), 'vence o painel do dia'); ok(await E("@Progresso.d.bolas") >= b0 + 1 && /Painel do dia vencido/.test(await E("document.getElementById('vMais').textContent")), "+1 bola guardada"); ok(await E("document.getElementById('vDeNovo').hidden"), 'sem "de novo" no painel do dia');
await c('#vProx'); ok(await E("@Jogo.aberto") === 'abertura' && await E("document.getElementById('bDia').disabled"), 'do dia fecha até amanhã');

// código do progresso: copia, estraga, usa num aparelho "novo"
await c('#bAjustes'); await c('#aCopia'); const cod = await E("document.getElementById('aCod').value"); ok(/^GB2-/.test(cod), 'gera código'); await p.foto(`${pasta}/f2-ajustes.png`);
await E("document.getElementById('aCod').value='GB2-estragado'"); await c('#aUsa'); ok(/não reconhecido/.test(await E("document.getElementById('aMsg').textContent")), 'código estragado avisa');
await E("localStorage.clear()"); await recarrega(); ok(await E('@Progresso.d.fase') === 1, 'aparelho novo');
await c('#bAjustes'); await E(`document.getElementById('aCod').value=${JSON.stringify(cod)}`); await c('#aUsa'); ok(await E('@Progresso.d.fase') === 12 && await E('@Progresso.d.raras[12]') === 1 && await E('@Progresso.d.obras[0]') === 5, 'código traz o progresso');
await recarrega(); ok(await E('@Progresso.d.obras[0]') === 5, 'progresso do código fica salvo');

// deitado: início e painéis cabem
await p.vp(844, 390, true, 2); await dorme(600); ok(await cabe('#bJogar,#bMapa,#bPaineis'), 'início deitado'); await p.foto(`${pasta}/f2-abertura-deitado.png`);
await c('#bPaineis'); ok(await E("(()=>{const c=document.getElementById('qCv').getBoundingClientRect();return c.width>100})()"), 'painel deitado'); await p.foto(`${pasta}/f2-painel-deitado.png`);
console.log('certos', bons, 'falhas', ruins, 'erros de código', p.erros.slice(0, 4)); p.fim();

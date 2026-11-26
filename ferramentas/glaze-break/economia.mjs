// Glaze Break: testa as telas da Fase 3 (moedas e vidas no início, presente de chegada, diária, missões, loja, vídeo de teste, preparo, ferramentas, oferta,
// continuar com bola guardada / moedas / vídeo, vidas, pausa, pacote, vitória com moedas, compras de teste), em 4 tamanhos, com fotos.   node economia.mjs pasta
import { abrir, dorme } from './nav.mjs';
const pasta = process.argv[2]; let p = await abrir({ w: 390, h: 844, movel: true, dpr: 2 }); await dorme(600); let ruins = 0, bons = 0;
const ok = (c, m) => { if (c) bons++; else { ruins++; console.log('FALHOU:', m); } }, E = x => p.av(x.replaceAll('@', '__glaze.'));
const c = async sel => { const r = await E(`(()=>{const e=document.querySelector('${sel}');if(!e||e.disabled||e.hidden)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.left+r.width/2,r.top+r.height/2]:null})()`); if (!r) return ok(false, 'botão ' + sel); await p.toque(...r); await dorme(300); };
const cabe = sel => E(`[...document.querySelectorAll('${sel}')].filter(e=>!e.hidden&&e.offsetParent).every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})`);
const recarrega = async () => { await p.recarregar(); for (let i = 0; i < 40; i++) { await dorme(200); if (await E("!!window.__glaze").catch(() => 0)) break; } await dorme(500); };
const txt = id => E(`document.getElementById('${id}').textContent`), aberto = () => E('@Jogo.aberto'), moedas = () => E('@Progresso.d.eco.moedas');
const soma = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const grava = async d => { await E(`localStorage.clear();localStorage.setItem('glaze-break.v2',${JSON.stringify(JSON.stringify({ v: 2, soma: soma(JSON.stringify(d)), d }))})`); await recarrega(); };
const derruba = () => E('(()=>{const P=@Jogo.P;P.bolas.forEach(b=>{b.presa=false;b.x=60;b.y=170;b.dx=0;b.dy=1;});P.rq.alvo=10;P.rq.x=10;})()');

// ---------- aparelho novo: 100 moedas sem aviso, coração escondido até a fase 10 ----------
await E('localStorage.clear()'); await recarrega();
{ const m = await moedas(), t = await E("document.querySelector('#abertura [data-moedas]').textContent"); ok(m === 100 && /100/.test(t), 'presente de 100 moedas no aparelho novo ' + m + ' ' + t); } ok(!(await E("document.querySelector('.solta.on')")), 'sem aviso para quem nunca jogou');
ok(await E("document.querySelector('#abertura [data-vidas]').hidden"), 'coração escondido no começo'); ok(await E("document.getElementById('bDiaria').hidden"), 'diária só depois da primeira vitória');
ok(await cabe('#abertura .bt,#abertura .chip'), 'início cabe em pé'); await p.foto(`${pasta}/f3-inicio-novo.png`);
await c('#bJogar'); ok(await aberto() === '' && await E('@Jogo.P.n') === 1, 'fase 1 vai direto, sem preparo'); ok(await E("document.getElementById('ferr').hidden"), 'sem ferramentas antes da fase 6');

// ---------- quem já jogava (ficha da Fase 2 na fase 15): presente pelas estrelas ----------
const est = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [i + 1, i % 3 ? 3 : 2])); const ficha = { fase: 15, estrelas: est, recordes: {}, tentativas: {}, visto: { inicio: 1, cor: 1, jarro: 1, ferro: 1, rara: 1 }, op: { som: true, ambiente: true, vibra: true }, tot: { quebrados: 900, veios: 40, maiorVeio: 7, vitorias: 14, derrotas: 3, segundos: 1200, jarros: 12, itens: 15, dias: 2 }, obras: [5, 1, 0, 0, 0], raras: { 1: 1, 2: 1 }, lidas: {}, marcos: { quebra: 1, fases: 1 }, bolas: 3, dia: { ult: 0, total: 2 }, salvo: 1 };
await p.vp(390, 844, true, 2); await grava(ficha); const tEst = Object.values(est).reduce((a, b) => a + b);
ok(await E("document.getElementById('aviso2').classList.contains('on')") && /Moedas na oficina/.test(await txt('xTit')), 'aviso de chegada para quem já jogava'); ok(await moedas() === 100 + 2 * tEst, `presente 100 + 2 por estrela (${100 + 2 * tEst})`);
ok(await E('@Progresso.d.eco.inv.pincel') === 2 && await E('@Progresso.d.eco.inv.rede') === 2 && await E('@Progresso.d.eco.inv.tripla') === 2 && await E('@Progresso.d.eco.inv.lenta') === 2, '2 de cada reforço já liberado'); ok(await E('@Progresso.d.bolas') === 3 && await E('@Progresso.d.obras[0]') === 5, 'nada da Fase 2 se perde');
await p.foto(`${pasta}/f3-chegada.png`); await c('#aviso2 [data-fecha]'); ok(!(await E("document.getElementById('aviso2').classList.contains('on')")), 'fecha o aviso');
await recarrega(); ok(!(await E("document.querySelector('.solta.on')")) && await moedas() === 100 + 2 * tEst, 'presente uma vez só');

// ---------- diária ----------
ok(!(await E("document.getElementById('bDiaria').hidden")), 'botão da recompensa de hoje'); await c('#bDiaria'); ok(await E("document.getElementById('diaria').classList.contains('on')") && /20 moedas/.test(await txt('gTxt')), 'abre a diária (dia 1: 20 moedas)');
await p.foto(`${pasta}/f3-diaria.png`); let m0 = await moedas(); await c('#bgPega'); ok(await moedas() === m0 + 20 && await E("document.getElementById('bDiaria').hidden"), 'recebe e some até amanhã');

// ---------- missões ----------
await c('#bMissoes'); ok(await aberto() === 'missoes' && await E("document.querySelectorAll('#iDia .mc').length") === 4, '3 missões e as três do dia'); ok(await E("document.querySelectorAll('#iCal .dd').length") === 7 && await E("document.querySelectorAll('#iCal .dd.ok').length") === 1, 'calendário com o dia 1 feito');
ok(/Semana d/.test(await txt('iSem')), 'evento da semana'); await E(`(()=>{const d=@Progresso.d;@Eco.registrar(d,@Hoje(),Object.fromEntries(@Eco.MISSOES.map(x=>[x.tipo,x.alvo])));})()`); await c('#missoes [data-volta]'); await c('#bMissoes');
ok(await E("document.querySelectorAll('#iDia [data-k]').length") === 3, 'missões prontas pedem para receber'); await p.foto(`${pasta}/f3-missoes.png`);
m0 = await moedas(); for (let k = 0; k < 3; k++) await c('#iDia [data-k]'); await c('#iDia [data-bau]'); ok(await moedas() === m0 + 3 * 15 + 25, 'recebe as 3 missões e as três do dia'); await c('#missoes [data-volta]');

// ---------- loja e vídeo de teste ----------
await c('#bLoja'); ok(await aberto() === 'loja' && await E("document.querySelectorAll('#lItens .mc').length") === 6, 'loja com 6 reforços'); ok(/nada é vendido/.test(await txt('lNota')) && await E("[...document.querySelectorAll('#lProd button')].every(b=>b.disabled)"), 'no site nada é vendido');
m0 = await moedas(); let q0 = await E('@Progresso.d.eco.inv.pincel'); await c('#lItens [data-c="pincel"]'); ok(await moedas() === m0 - 60 && await E('@Progresso.d.eco.inv.pincel') === q0 + 1, 'compra pincel'); await c('#lItens [data-c="bola"]'); ok(await E('@Progresso.d.bolas') === 4, 'compra bola guardada');
await p.foto(`${pasta}/f3-loja.png`); m0 = await moedas(); await c('#blVideo'); ok(await E("document.getElementById('anuncio').classList.contains('on')"), 'vídeo de teste abre'); await p.foto(`${pasta}/f3-video.png`); await dorme(5400); await c('#nFecha');
ok(await moedas() === m0 + 15 && await E('@Progresso.d.eco.videos.n') === 1, 'vídeo visto até o fim dá 15 moedas'); await c('#blVideo'); await dorme(1200); await c('#nFecha'); ok(await moedas() === m0 + 15, 'sair antes não dá prêmio'); await c('#loja [data-volta]');

// ---------- preparo ----------
await E('@Progresso.d.eco.inv.largo=0'); await c('#bJogar'); ok(await aberto() === 'preparo' && await E("document.querySelectorAll('#rItens .bst').length") === 3, 'Jogar na fase 15 mostra o preparo'); ok(await cabe('#preparo .bt,#preparo .bst'), 'preparo cabe');
await c('#rItens [data-i="largo"]'); ok(await E("document.querySelector('[data-i=largo]').classList.contains('on')") === false && await E("document.getElementById('oferta').classList.contains('on')"), 'sem barra larga: oferece comprar'); await p.foto(`${pasta}/f3-oferta.png`);
m0 = await moedas(); await c('#bOferta'); ok(await moedas() === m0 - 60 && await E("document.querySelector('[data-i=largo]').classList.contains('on')"), 'comprou e já escolheu'); await c('#rItens [data-i="bola"]'); await c('#rItens [data-i="lenta"]'); await p.foto(`${pasta}/f3-preparo.png`);
await c('#brJogar'); ok(await aberto() === '' && await E('@Jogo.P.vidas') === 4 && await E('@Jogo.P.rq.larg') === 25 && await E('@Jogo.P.lenta') === 20, 'começa com 4 bolas, barra larga e bola lenta');
ok(await E('@Progresso.d.bolas') === 3 && await E('@Progresso.d.eco.inv.largo') === 0 && await E('@Progresso.d.eco.inv.lenta') === 1, 'reforços gastos');

// ---------- ferramentas ----------
ok(!(await E("document.getElementById('ferr').hidden")) && await E("document.querySelectorAll('#ferr .fe').length") === 3, '3 ferramentas na partida'); ok(await cabe('#ferr .fe'), 'ferramentas cabem'); await c('#cv'); await dorme(400);
await c('#ferr [data-i="rede"]'); await dorme(200); ok(await E('@Jogo.P.rede') > 14 && await E('@Progresso.d.eco.inv.rede') === 1, 'rede estendida'); await c('#ferr [data-i="rede"]'); ok(await E('@Progresso.d.eco.inv.rede') === 1, 'segunda rede não gasta');
await c('#ferr [data-i="tripla"]'); await dorme(200); ok(await E('@Jogo.P.bolas.length') >= 3, 'três bolas'); q0 = await E('@Progresso.d.eco.inv.pincel'); await c('#ferr [data-i="pincel"]'); ok(await E('@Progresso.d.eco.inv.pincel') === q0 - 1, 'pincel usado'); await dorme(300); await p.foto(`${pasta}/f3-ferramentas.png`);
await E('@Progresso.d.eco.inv.tripla=0'); await E('@Telas.hud(@Jogo.P)'); await c('#ferr [data-i="tripla"]'); ok(await E("document.getElementById('oferta').classList.contains('on')") && await E('@Jogo.pausado'), 'sem ferramenta: oferta e pausa a partida'); await c('#oferta [data-fecha]'); ok(!(await E('@Jogo.pausado')), 'fechar a oferta volta ao jogo');

// ---------- continuar: bola guardada, moedas, vídeo ----------
await E('@Jogo.comecar(15).then(()=>1)'); await dorme(300); await E('(()=>{const P=@Jogo.P;P.vidas=1;for(const x of P.cel)if(x&&x.vivo&&x.k!=="f"&&P.restam>5){x.vivo=false;P.restam--;}P.mudou=true;})()'); await derruba(); await dorme(2600);
ok(await aberto() === 'continuar', 'as bolas acabaram: oferece continuar'); ok(!(await E("document.getElementById('uSim').hidden")) && !(await E("document.getElementById('uMoedas').hidden")) && !(await E("document.getElementById('uVideo').hidden")), 'bola guardada, moedas e vídeo');
ok(/Terminar gasta 1 vida/.test(await txt('uVida')), 'avisa que terminar gasta vida'); ok(await cabe('#continuar .bt'), 'continuar cabe'); await p.foto(`${pasta}/f3-continuar.png`);
m0 = await moedas(); await c('#uMoedas'); ok(await aberto() === '' && await moedas() === m0 - 100 && await E('@Jogo.P.vidas') === 1, '+1 bola por 100 moedas'); await derruba(); await dorme(2600);
ok(await aberto() === 'continuar' && /160/.test(await txt('uMoedas')) && await E("document.getElementById('uVideo').hidden"), 'segunda vez: 160 e sem vídeo'); await c('#uSim'); ok(await E('@Progresso.d.bolas') === 2 && await aberto() === '', 'usa bola guardada');
await derruba(); await dorme(2600); ok(await aberto() === 'continuar', 'terceira volta'); await c('#uSim'); await derruba(); await dorme(2600); ok(await aberto() === 'derrota', 'depois de 3 voltas acaba'); ok(/Vidas: 4 de 5/.test(await txt('dVida')), 'perder na fase 15 gasta 1 vida'); await p.foto(`${pasta}/f3-derrota.png`);
await E('@Progresso.d.eco.moedas=500'); await E('@Progresso.d.eco.tent[15]=1'); await c('#dDeNovo'); await dorme(300); ok(await aberto() === 'preparo', 'fase difícil: tentar de novo mostra o preparo'); await c('#brJogar'); await E('@Jogo.P.vidas=1'); await derruba(); await dorme(2600); if (await aberto() === 'continuar') await c('#uNao');
ok(await aberto() === 'derrota' && !(await E("document.getElementById('dPacote').hidden")) && /95/.test(await txt('dPacote')), 'pacote com desconto depois de 2 derrotas'); ok(/5% mais larga/.test(await txt('dAjuda')), 'avisa a ajuda da oficina');
m0 = await moedas(); await c('#dPacote'); await dorme(300); ok(await aberto() === '' && await moedas() === m0 - 95 && await E('@Jogo.P.rq.larg') === 25 && await E('@Jogo.P.lenta') === 20, 'pacote: barra larga e bola lenta'); ok(Math.abs(await E('@Jogo.P.largura') / await E('@Jogo.P.F.raquete') - 1.4 * 1.05) < 1e-6, 'ajuda deixa a barra 5% maior');

// ---------- pausa e sair no meio ----------
await E('(()=>{const P=@Jogo.P;P.lancou=true;P.quebrados=3;})()'); await c('#bPausa'); ok(/gasta 1 vida/.test(await txt('zVida')), 'pausa avisa que sair gasta vida'); const v0 = await E('@Progresso.d.eco.vidas'); await c('#pRecomeca'); ok(await E('@Progresso.d.eco.vidas') === v0 - 1, 'recomeçar no meio gasta 1 vida');

// ---------- sem vidas ----------
await E('@Progresso.d.eco.vidas=0;@Progresso.d.eco.base=Date.now()'); await E('@Telas.inicio()'); await dorme(200); await c('#bMapa'); await c('.fs[data-f="12"]'); ok(await aberto() === 'semvida' && /próxima vida/.test(await txt('wTxt')), 'sem vidas na fase 12'); ok(!(await E("document.getElementById('bwDia').hidden")), 'oferece o painel do dia');
await p.foto(`${pasta}/f3-semvida.png`); m0 = await moedas(); await c('#bwMoedas'); ok(await E('@Progresso.d.eco.vidas') === 5 && await moedas() === m0 - 150 && await aberto() !== 'semvida', 'encher por 150 e seguir'); await E('@Telas.inicio()'); await dorme(200);
await E('@Progresso.d.eco.vidas=0;@Progresso.d.eco.base=Date.now()'); await c('#bMapa'); await c('.fs[data-f="4"]'); if (await aberto() === 'preparo') await c('#brJogar'); ok(await aberto() === '' && await E('@Jogo.P.n') === 4, 'fases 1 a 10 jogam sem vida');

// ---------- vitória com moedas e dobro por vídeo ----------
await E('@Progresso.d.fase=16;@Progresso.d.eco.vidas=5'); await E('@Jogo.comecar(16).then(()=>1)'); await dorme(300); m0 = await moedas();
await E(`(()=>{const P=@Jogo.P;for(const x of P.cel)if(x&&x.vivo&&x.k!=='f'){x.vivo=false;P.restam--;P.quebrados++;}})()`); await dorme(2200); ok(await aberto() === 'vitoria' && !(await E("document.getElementById('vMoedas').hidden")), 'vitória mostra moedas');
const ganho = await moedas() - m0; ok(ganho >= 17, 'primeira vitória com 3 estrelas: ' + ganho + ' moedas'); ok(!(await E("document.getElementById('bDobro').hidden")), 'oferece dobrar por vídeo'); await p.foto(`${pasta}/f3-vitoria.png`);
await c('#bDobro'); await dorme(5400); await c('#nFecha'); ok(await moedas() - m0 >= ganho * 2 - 2 && await E("document.getElementById('bDobro').hidden"), 'dobrou');
ok(await E('@Progresso.d.eco.tent[16]') === undefined, 'vencer zera as derrotas da fase');

// ---------- compras de teste (só no computador, ?loja=teste) ----------
await E('localStorage.clear()'); await p.cmd('Page.navigate', { url: p.base + '/jogos/glaze-break/index.html?loja=teste' }); await dorme(2500); await grava({ ...ficha, eco: undefined }); await E("(document.querySelector('.solta.on [data-fecha]')||{click(){}}).click()");
await c('#bLoja'); ok(/Loja de teste/.test(await txt('lNota')), 'loja de teste'); m0 = await moedas(); await c('#lProd [data-p="inicial"]'); await dorme(400); ok(await moedas() === m0 + 600 && await E('@Progresso.d.bolas') === 8, 'pacote da oficina entregue');
ok(!(await E("document.querySelector('#lProd [data-p=\"inicial\"]')")), 'pacote único some da loja'); await c('#lProd [data-p="sem_anuncios"]'); await dorme(300); ok(await E('@Progresso.d.eco.semAnuncios'), 'sem anúncios'); await p.foto(`${pasta}/f3-loja-teste.png`);

// ---------- tamanhos: telas cabem (ou rolam), ferramentas cabem ----------
for (const [w, h, nome] of [[360, 640, 'pequeno'], [844, 390, 'deitado'], [820, 1180, 'tablet']]) {
  await p.vp(w, h, true, 2); await E('@Telas.inicio()'); await dorme(500); ok(await cabe('#abertura .bt.pri,#abertura .chip'), 'início ' + nome); await p.foto(`${pasta}/f3-inicio-${nome}.png`);
  await E('@Jogo.comecar(15).then(()=>1)'); await dorme(500); ok(await cabe('#ferr .fe') && await E("(()=>{const c=document.getElementById('cv').getBoundingClientRect();return c.height>200})()"), 'partida com ferramentas ' + nome); await p.foto(`${pasta}/f3-partida-${nome}.png`);
  await E('@Econ.preparo(15)'); await dorme(300); ok(await cabe('#preparo .bt.pri,#preparo .bst') || await E("document.getElementById('preparo').scrollHeight>innerHeight"), 'preparo ' + nome); await p.foto(`${pasta}/f3-preparo-${nome}.png`);
  await E('@Telas.abrir("missoes")'); await dorme(300); ok(await E("document.querySelector('#iCal').getBoundingClientRect().right<=innerWidth+1"), 'missões ' + nome); await E('@Telas.inicio()');
}
console.log('certos', bons, 'falhas', ruins, 'erros de código', p.erros.slice(0, 4)); p.fim();

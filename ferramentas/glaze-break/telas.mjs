// Glaze Break: testa telas, toque e gestos com toque simulado, e tira fotos.   node telas.mjs pasta
import { abrir, dorme } from './nav.mjs';
const pasta = process.argv[2]; const p = await abrir({ w: 390, h: 844, movel: true, dpr: 2 }); await dorme(600); let ruins = 0, bons = 0;
const ok = (c, m) => { if (c) bons++; else { ruins++; console.log('FALHOU:', m); } }, E = x => p.av(x.replaceAll('@', '__glaze.'));
const c = async sel => { const r = await E(`(()=>{const e=document.querySelector('${sel}');if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`); if (!r) return ok(false, 'botão ' + sel); await p.toque(...r); await dorme(280); };
const tq = (type, ...pts) => p.cmd('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
const arrasta = async (x0, y0, dx, dy = 0, passos = 10) => { await tq('touchStart', [x0, y0]); for (let k = 1; k <= passos; k++) { await tq('touchMove', [x0 + dx * k / passos, y0 + dy * k / passos]); await dorme(16); } await tq('touchEnd'); await dorme(120); };
const fase = async n => { await E(`@Jogo.comecar(${n}).then(()=>1)`); await dorme(500); };
const cabe = sel => E(`[...document.querySelectorAll('${sel}')].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})`);
const HUD = '#bVolta,#bSom,#bPausa,#tFase,#bolas,#pontos,#esmalte';

ok(await E("@Jogo.aberto") === 'abertura', 'abre na abertura'); ok(!(await E("document.documentElement.scrollHeight>innerHeight+1")), 'sem rolagem'); ok(await E("@Som.estado") === 'parado', 'som parado antes do toque'); await p.foto(`${pasta}/t-abertura.png`);
await c('#bMapa'); ok(await E("@Jogo.aberto") === 'mapa', 'abre fases'); ok(await E("document.querySelectorAll('.fs').length") === 50, '50 fases'); ok(await E("document.querySelectorAll('.fs:disabled').length") === 49, 'só a 1 liberada');
ok(await E("document.querySelectorAll('.fs.dura').length") === 15 && await E("document.querySelectorAll('.fs.dura2').length") === 5, 'mapa marca 15 difíceis (5 muito difíceis)'); await p.foto(`${pasta}/t-mapa.png`); await c('#mapa [data-volta]'); ok(await E("@Jogo.aberto") === 'abertura', 'volta');
await c('#bAjustes'); await c('[data-op=ambiente]'); ok(await E("@Progresso.d.op.ambiente") === false, 'desliga fundo'); await p.foto(`${pasta}/t-ajustes.png`); await c('[data-op=ambiente]'); await c('#ajustes [data-volta]'); ok(await E("@Jogo.aberto") === 'abertura', 'volta dos ajustes');
await c('#bJogar'); await dorme(600); ok(await E("@Jogo.aberto") === '' && (await E("@Jogo.n")) === 1, 'começa a fase 1'); ok(await E("@Som.estado") === 'running', 'som ligado depois do toque'); ok(/Arraste/.test(await E("document.getElementById('dica').textContent")), 'ensina a arrastar');
await p.foto(`${pasta}/t-inicio.png`);
// arrastar move a barra (relativo ao dedo) e não lança
let x0 = await E('@Jogo.P.rq.x'), s = await E('@Tela.escala'), sens = await E('@Jogo.SENS'); await arrasta(200, 800, -60);
let x1 = await E('@Jogo.P.rq.x'); ok(Math.abs((x0 - x1) - 60 / s * sens) < 1.5, `arrastar move a barra (${(x0 - x1).toFixed(1)} de ${(60 / s * sens).toFixed(1)})`); ok(await E('@Jogo.P.bolas[0].presa'), 'arrastar não lança'); ok(await E('Math.abs(@Jogo.P.bolas[0].x-@Jogo.P.rq.x)<.01'), 'bola presa anda com a barra');
await arrasta(200, 800, 0, -260); ok(await E('scrollY===0&&document.scrollingElement.scrollTop===0'), 'arrastar para cima não rola a página'); ok(await E('@Jogo.P.bolas[0].presa'), 'arrasto vertical não lança');
await arrasta(10, 800, 400); ok(await E('@Jogo.P.rq.x<=@Nucleo.W-@Jogo.P.rq.w/2+.01'), 'barra para na parede');
await p.toque(200, 800); await dorme(200); ok(!(await E('@Jogo.P.bolas[0].presa')), 'toque curto lança'); ok(await E('@Jogo.P.bolas[0].dy<0'), 'bola sobe');
// toque nos botões não mexe na barra
x0 = await E('@Jogo.P.rq.x'); await c('#bSom'); await c('#bSom'); ok(Math.abs(await E('@Jogo.P.rq.x') - x0) < .01, 'botão não mexe na barra');
// esmalte: o placar mostra a cor da bola
await E('@Jogo.P.bolas[0].cor=2'); await dorme(200); ok(/Sálvia/.test(await E("document.getElementById('esmalte').textContent")), 'placar mostra o esmalte da bola');
// fase difícil avisa
await fase(4); ok(!(await E("!!document.getElementById('aviso')")), 'fase 4 sem aviso');
await fase(5); ok(/Fase difícil/.test(await E("document.getElementById('aviso')?.textContent||''")), 'fase 5 avisa difícil'); ok(/difícil/.test(await E("document.getElementById('tLugar').textContent")), 'título diz difícil'); await dorme(300); await p.foto(`${pasta}/t-aviso.png`);
await fase(9); ok(/Fase difícil/.test(await E("document.getElementById('aviso')?.textContent||''")), 'fase 9 avisa difícil');
await fase(10); ok(/muito difícil/.test(await E("document.getElementById('aviso')?.textContent||''")), 'fase 10 avisa muito difícil'); await dorme(3200); ok(!(await E("!!document.getElementById('aviso')")), 'aviso some sozinho');
// jarro: quebrar pinta os vizinhos e a tela mostra
await fase(13); await E(`(()=>{const P=@Jogo.P,j=P.cel.find(t=>t&&t.k==='j');const b=P.bolas[0];b.presa=false;b.x=j.x+@Nucleo.CW/2;b.y=j.y+@Nucleo.CH+2.4;b.dx=0;b.dy=-1;})()`); await dorme(300); await p.foto(`${pasta}/t-jarro.png`); ok(await E("@Jogo.P.cel.filter(t=>t&&t.k==='j'&&!t.vivo).length") >= 1, 'jarro quebra');
// pausa
await fase(6); await p.toque(200, 800); await dorme(400); await c('#bPausa'); let t0 = await E('@Jogo.P.tempo'), b0 = await E('@Jogo.P.bolas[0].y'); await dorme(700); ok(await E('@Jogo.P.tempo') === t0 && await E('@Jogo.P.bolas[0].y') === b0, 'pausa para tudo'); await p.foto(`${pasta}/t-pausa.png`);
await c('#pContinua'); await dorme(400); ok(await E('@Jogo.P.tempo') > t0, 'continua anda');
// girar o celular no meio da fase
const vivos = await E('@Jogo.P.cel.filter(t=>t&&t.vivo).length'), pid = await E('@Jogo.P.bolas[0].id'); await p.vp(844, 390, true, 2); await dorme(700);
ok(await E('@Jogo.P.cel.filter(t=>t&&t.vivo).length') <= vivos && await E('@Jogo.P.bolas.length') >= 1 && await E('@Jogo.n') === 6, 'gira sem perder a fase'); ok(await cabe(HUD), 'tudo cabe deitado'); ok(await E('(()=>{const c=@Tela.campo;return c.h>300&&c.y>=0&&c.y+c.h<=innerHeight+1})()'), 'campo inteiro deitado');
x0 = await E('@Jogo.P.rq.x'); await arrasta(600, 300, 50); ok(await E('@Jogo.P.rq.x') > x0 + 5 || await E('@Jogo.P.rq.x') >= await E('@Nucleo.W-@Jogo.P.rq.w/2-.1'), 'arrastar funciona deitado'); await p.foto(`${pasta}/t-deitado.png`);
for (const [w, h] of [[320, 568], [360, 740], [412, 915], [768, 1024], [667, 375]]) {
  await p.vp(w, h, true, 2); await dorme(450);
  ok(await cabe(HUD) && await E(`(()=>{const c=@Tela.campo;return c.w>140&&c.h>210&&c.x>=-1&&c.x+c.w<=innerWidth+1&&c.y+c.h<=innerHeight+1})()`) && !(await E("document.documentElement.scrollHeight>innerHeight+1")), `cabe em ${w}x${h}`);
  if (w === 320 || w === 768) await p.foto(`${pasta}/t-${w}x${h}.png`);
}
await p.vp(390, 844, true, 2); await dorme(500);
// derrota
await fase(2); await p.toque(200, 800); await E('(()=>{const P=@Jogo.P;P.vidas=1;P.bolas[0].y=200;P.bolas[0].dy=1})()'); await dorme(500); ok(await E('@Jogo.P.fim') === 'derrota', 'perde a última bola'); await dorme(1400); ok(await E("@Jogo.aberto") === 'derrota', 'mostra a derrota'); await p.foto(`${pasta}/t-derrota.png`);
await c('#dDeNovo'); await dorme(500); ok(await E("@Jogo.aberto") === '' && !(await E("@Jogo.P.fim")) && await E('@Jogo.P.vidas') === 3, 'tenta de novo na hora');
// perder uma bola: volta presa na barra, sem acabar
await p.toque(200, 800); await E('(()=>{const P=@Jogo.P;P.bolas[0].y=200;P.bolas[0].dy=1})()'); await dorme(400); ok(await E('@Jogo.P.vidas') === 2 && await E('@Jogo.P.bolas[0].presa') && !(await E('@Jogo.P.fim')), 'perde 1 bola e continua'); ok(await E("document.querySelectorAll('#bolas i.foi').length") === 1, 'placar mostra a bola perdida');
// vitória
await fase(1); await p.toque(200, 800); await E('(()=>{const P=@Jogo.P;for(const t of P.cel)if(t&&t.vivo){t.vivo=false;P.restam--;}P.mudou=true})()'); await dorme(1600); ok(await E("@Jogo.aberto") === 'vitoria', 'mostra a vitória'); await dorme(900); await p.foto(`${pasta}/t-vitoria.png`);
ok(await E("@Progresso.d.estrelas[1]") === 3 && await E("@Progresso.d.fase") >= 2, 'guarda as estrelas e libera a próxima'); ok(await E("document.querySelectorAll('#vEst svg.on').length") === 3, 'mostra 3 estrelas');
await c('#vProx'); await dorme(500); ok(await E("@Jogo.n") === 2 && await E("@Jogo.aberto") === '', 'próxima é na hora');
// mudo, salvar e recarregar
await c('#bSom'); ok(await E("@Progresso.d.op.som") === false, 'mudo'); await c('#bSom');
const fic = await E("JSON.parse(localStorage.getItem('glaze-break.v1'))"); ok(fic && fic.v === 1 && typeof fic.soma === 'string' && fic.d.estrelas[1] === 3, 'ficha com versão e conferência');
await p.recarregar(); for (let i = 0; i < 40; i++) { await dorme(200); if (await E("!!window.__glaze").catch(() => 0)) break; } await dorme(400); ok(await E("@Progresso.d.estrelas[1]") === 3 && await E("@Progresso.d.fase") >= 2, 'salva e volta igual');
// ficha mexida (conferência não bate): usa a cópia anterior; ficha quebrada: recomeça sem travar
await E("(()=>{const x=JSON.parse(localStorage.getItem('glaze-break.v1'));x.d.estrelas[1]=3;x.d.fase=50;localStorage.setItem('glaze-break.v1',JSON.stringify(x));})()"); await p.recarregar(); await dorme(2200); ok(await E("@Progresso.d.fase") < 50 && await E("@Progresso.d.fase") >= 1, 'ficha mexida não vale');
await E("localStorage.clear();localStorage.setItem('glaze-break.v1','{quebrado')"); await p.recarregar(); await dorme(2200); ok(await E("@Progresso.d.fase") === 1 && await E("@Jogo.aberto") === 'abertura', 'ficha estragada recomeça sem travar');
console.log('certos', bons, 'falhas', ruins, 'erros de código', p.erros.slice(0, 4)); p.fim();

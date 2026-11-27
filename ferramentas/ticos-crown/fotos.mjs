// Fotos e teste: tela inicial, nível 1, jogadas automáticas, especiais e combos.   node fotos.mjs pasta [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, cel] = process.argv.slice(2), movel = !!cel;
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/ticos-crown/index.html#manifest' });
const P = n => `${d}/${movel ? 'c' : ''}${n}.png`, av = p.av;
await dorme(2500); await p.foto(P('1-inicio'));
await av(`localStorage.clear(); __tico.abrirNivel(${process.argv[4] || 1})`); await dorme(900); await p.foto(P('2-objetivos'));
await av('__tico.comecarNivel()'); await dorme(2200); await p.foto(P('3-tabuleiro'));
// jogadas automáticas pelo toque de verdade (arrastar)
async function arrasta(a, b) {
  const [x0, y0] = await av(`(()=>{const q=__tico.posCel(${a.r},${a.c});return __tico.telaDe(q.x,q.y)})()`), [x1, y1] = await av(`(()=>{const q=__tico.posCel(${b.r},${b.c});return __tico.telaDe(q.x,q.y)})()`);
  await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0 }); await p.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 5; i++) await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * i / 5, y: y0 + (y1 - y0) * i / 5, button: 'left' });
  await p.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', clickCount: 1 });
}
for (let i = 0; i < 6; i++) {
  const j = await av('(()=>{const j=__tico.existeJogada();return j&&j.a?{a:{r:j.a.r,c:j.a.c},b:{r:j.b.r,c:j.b.c}}:null})()');
  if (!j) break; await arrasta(j.a, j.b);
  for (let k = 0; k < 40 && await av('__tico.T.ocupado'); k++) await dorme(100);
  if (i === 1) await p.foto(P('4-jogada'));
}
console.log('depois de 6 jogadas:', await av('JSON.stringify({jog:__tico.T.jogadas,pts:__tico.T.pontos,metas:__tico.T.metas.map(m=>m.falta)})'));
// força especiais e um combo foguete + dinamite
await av(`(()=>{const t=__tico,T=t.T,a=t.celula(3,3),b=t.celula(3,4);for(const [k,tp] of [[a,'fh'],[b,'din']]){k.gema.mesh.parent.remove(k.gema.mesh);t.novaGema(k,0,tp);} })()`);
await dorme(400); await p.foto(P('5-especiais'));
await arrasta({ r: 3, c: 3 }, { r: 3, c: 4 }); await dorme(500); await p.foto(P('6-combo'));
for (let k = 0; k < 60 && await av('__tico.T.ocupado'); k++) await dorme(100);
await av(`(()=>{const t=__tico,k=t.celula(4,4);k.gema.mesh.parent.remove(k.gema.mesh);t.novaGema(k,0,'disco');})()`);
await dorme(300); await arrasta({ r: 4, c: 4 }, { r: 4, c: 5 }); await dorme(450); await p.foto(P('7-arcoiris'));
for (let k = 0; k < 60 && await av('__tico.T.ocupado'); k++) await dorme(100);
console.log('depois dos combos:', await av('JSON.stringify({jog:__tico.T.jogadas,pts:__tico.T.pontos,metas:__tico.T.metas.map(m=>m.falta),vazias:__tico.T.cel.flat().filter(k=>k.existe&&!k.bloco&&!k.gema).length})'));
// pânico e vitória
await av('__tico.T.jogadas=3;__tico.Jogo.reagirJogada()'); await dorme(1300); await p.foto(P('8-panico'));
await av('__tico.T.metas.forEach(m=>m.falta=0);__tico.T.jogadas=4;__tico.T.ocupado=true;__tico.Jogo.vencer()'); await dorme(3500); await p.foto(P('9-festa')); await dorme(4000); await p.foto(P('10-vitoria'));
console.log(await av(`new Promise(r=>{let n=0,t=performance.now();const f=()=>{if(++n<60)requestAnimationFrame(f);else r(Math.round(60000/(performance.now()-t))+' quadros/s, '+__tico.R.info.render.calls+' chamadas')};f()})`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

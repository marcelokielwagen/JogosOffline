// Teste do modo Arremesso: abre o nível, mira de verdade (arrastando) na peça mais baixa e atira até acabar.   node arremesso.mjs pasta nivel [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, n = '6', cel] = process.argv.slice(2), movel = !!cel;
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/ticos-crown/index.html#manifest' });
const av = p.av, F = x => `${d}/${movel ? 'c' : ''}a${n}-${x}.png`;
await dorme(1500); await av(`localStorage.clear();__tico.S.nivel=18;__tico.abrirNivel(${n})`); await dorme(700); await p.foto(F('1-objetivo'));
await av('__tico.comecarNivel()'); await dorme(2200); await p.foto(F('2-inicio'));
let tiro = 0;
while (await av('__tico.T.ativo') && tiro < 10) {
  for (let k = 0; k < 80 && await av('__tico.T.ocupado'); k++) await dorme(100);
  if (!await av('__tico.T.ativo')) break;
  const alvos = await av('__tico.Arremesso.alvos()'); if (!alvos.length) break;
  alvos.sort((a, b) => a[1] - b[1]); const a = alvos[0];
  // arrasta o dedo/mouse até o alvo (tela) e solta
  const [x, y] = await av(`__tico.Arremesso.tela(${a[0]},${a[1] - .05},${a[2]})`);
  const oy = 0;
  if (movel) { await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y + oy }] }); await dorme(120); if (tiro === 0) await p.foto(F('3-mira')); await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await p.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await dorme(150); if (tiro === 0) await p.foto(F('3-mira')); await p.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); }
  tiro++; await dorme(700); if (tiro === 1) await p.foto(F('4-impacto'));
}
await dorme(1500);
console.log('tiros:', tiro, await av('JSON.stringify({bolas:__tico.T.jogadas,metas:__tico.T.metas.map(m=>m.t+":"+m.falta),ativo:__tico.T.ativo})'));
await dorme(3500); await p.foto(F('5-fim'));
console.log(await av(`new Promise(r=>{let n=0,t=performance.now();const f=()=>{if(++n<60)requestAnimationFrame(f);else r(Math.round(60000/(performance.now()-t))+' quadros/s')};f()})`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

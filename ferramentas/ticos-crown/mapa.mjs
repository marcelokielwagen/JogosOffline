// Teste do mapa, do baú e dos reforços.   node mapa.mjs pasta [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, cel] = process.argv.slice(2), movel = !!cel;
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/ticos-crown/index.html#manifest' });
const av = p.av, F = x => `${d}/${movel ? 'c' : ''}m-${x}.png`;
await dorme(1500);
await av(`localStorage.clear();Object.assign(__tico.S,{nivel:12,estrelas:{1:3,2:2,3:3,4:1,5:2,6:3,7:2,8:3,9:1,10:2,11:3}});__tico.irInicio()`); await dorme(1500); await p.foto(F('1-mapa'));
// abre o baú do nível 5 clicando nele
const [bx, by] = await av(`(()=>{const b=[...document.querySelectorAll('.bauNo.pronto')][0];b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
await dorme(300); if (movel) await p.toque(bx, by); else await p.clique(bx, by);
await dorme(1700); await p.foto(F('2-bau-abrindo')); await dorme(1800); await p.foto(F('3-bau-premios'));
console.log('reforços:', await av('JSON.stringify(__tico.S.reforcos)'), 'moedas', await av('__tico.S.moedas'));
await av(`document.querySelector('#bPegar').click()`); await dorme(1200); await p.foto(F('4-mapa-depois'));
// reforços num nível de joias
await av('__tico.abrirNivel(1)'); await dorme(400); await av('__tico.comecarNivel()'); await dorme(2200); await p.foto(F('5-reforcos'));
await av(`document.querySelector('#reforcos button[data-r="martelo"]').click()`); await dorme(300);
const [x, y] = await av(`(()=>{const q=__tico.posCel(4,4);return __tico.telaDe(q.x,q.y)})()`);
if (movel) await p.toque(x, y); else await p.clique(x, y); await dorme(250); await p.foto(F('6-martelo'));
for (let k = 0; k < 40 && await av('__tico.T.ocupado'); k++) await dorme(100);
await av(`document.querySelector('#reforcos button[data-r="flecha"]').click()`); await dorme(300);
const [x2, y2] = await av(`(()=>{const q=__tico.posCel(6,2);return __tico.telaDe(q.x,q.y)})()`);
if (movel) await p.toque(x2, y2); else await p.clique(x2, y2); await dorme(300); await p.foto(F('7-flecha'));
for (let k = 0; k < 40 && await av('__tico.T.ocupado'); k++) await dorme(100);
console.log('depois:', await av('JSON.stringify({ref:__tico.S.reforcos,jog:__tico.T.jogadas,vazias:__tico.T.cel.flat().filter(k=>k.existe&&!k.bloco&&!k.gema).length})'));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

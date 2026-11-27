// Teste do modo Pintura: abre o nível, joga com o "melhor pote" (2 jogadas à frente) clicando nos potes de verdade.   node pintura.mjs pasta nivel [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, n = '8', cel] = process.argv.slice(2), movel = !!cel;
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/ticos-crown/index.html#manifest' });
const av = p.av, F = x => `${d}/${movel ? 'c' : ''}p${n}-${x}.png`;
await dorme(1500); await av(`localStorage.clear();__tico.S.nivel=22;__tico.abrirNivel(${n})`); await dorme(700); await p.foto(F('1-objetivo'));
console.log('limite de jogadas:', await av('__tico.T.jogadas'), 'blocos:', await av('__tico.T.metas[0].n'));
await av('__tico.comecarNivel()'); await dorme(2200); await p.foto(F('2-inicio'));
let j = 0;
while (await av('__tico.T.ativo') && j < 40) {
  for (let k = 0; k < 60 && await av('__tico.T.ocupado'); k++) await dorme(100);
  if (!await av('__tico.T.ativo')) break;
  const k = await av('__tico.Pintura.melhor()');
  const [x, y] = await av(`(()=>{const r=document.querySelector('#potes .pote[data-k="${k}"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
  if (movel) await p.toque(x, y); else await p.clique(x, y);
  j++; await dorme(900); if (j === 3) await p.foto(F('3-jogando'));
}
await dorme(1500);
console.log('jogou', j, 'vezes:', await av('JSON.stringify({sobra:__tico.T.jogadas,falta:__tico.T.metas[0].falta,ativo:__tico.T.ativo})'));
await dorme(3500); await p.foto(F('4-fim'));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

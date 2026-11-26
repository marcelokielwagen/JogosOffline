// Uma foto de cada pista (tela inicial e correndo um pouco).   node fotos.mjs pasta [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, cel] = process.argv.slice(2), movel = !!cel, p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/dustline/index.html#manifest' });
await dorme(6500); await p.foto(`${d}/${movel ? 'c' : ''}inicio.png`);
for (let i = 0; i < 5; i++) {
  await p.av(`__dustline.comecar(${i})`); await dorme(5200); await p.av(`__dustline.teclas.add('gas')`); await dorme(3400); await p.av(`__dustline.teclas.add('mao');__dustline.teclas.add('esq')`); await dorme(700); await p.av(`__dustline.teclas.delete('mao');__dustline.teclas.delete('esq')`); await dorme(500);
  await p.foto(`${d}/${movel ? 'c' : ''}pista${i + 1}.png`); await p.av(`__dustline.teclas.clear()`);
  if (!i) console.log(await p.av(`new Promise(r=>{let n=0,t=performance.now();const f=()=>{if(++n<60)requestAnimationFrame(f);else r(Math.round(60000/(performance.now()-t))+' quadros/s, '+__dustline.R.info.render.triangles+' triangulos')};f()})`));
}
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

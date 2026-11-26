// Glaze Break: abre o jogo e fotografa fases (com a bola já em jogo).   node fotos.mjs pasta 1,10,25 [--pc] [--deitado]
// 0 na lista fotografa também a abertura.
import { abrir, dorme } from './nav.mjs';
const [pasta, lista = '0,1'] = process.argv.slice(2), pc = process.argv.includes('--pc'), deit = process.argv.includes('--deitado');
const p = await abrir(pc ? { w: 1366, h: 768 } : deit ? { w: 844, h: 390, movel: true, dpr: 2 } : { w: 390, h: 844, movel: true, dpr: 2 }); const s = pc ? 'pc' : deit ? 'd' : 'c'; await dorme(600);
if (lista.split(',').includes('0')) await p.foto(`${pasta}/${s}-abertura.png`);
for (const n of lista.split(',').map(Number).filter(Boolean)) {
  await p.av(`__glaze.Jogo.comecar(${n}).then(()=>1)`);
  console.log('fase', n, JSON.stringify(await p.av(`(()=>{const P=__glaze.Jogo.P;return{lugar:__glaze.Nucleo.LUGARES[P.F.lugar],dif:P.F.dif,linhas:P.F.linhas,azulejos:P.total,ferro:P.cel.filter(t=>t&&t.k==='f').length,jarros:P.cel.filter(t=>t&&t.k==='j').length,itens:P.cel.filter(t=>t&&t.item).map(t=>t.item).join(','),vel:Math.round(P.F.vel),barra:+P.F.raquete.toFixed(1)}})()`)));
  await p.av(`__glaze.Jogo.P.lancar()`); await dorme(3200); await p.foto(`${pasta}/${s}-f${n}.png`);
}
console.log('erros', p.erros.slice(0, 4)); p.fim();

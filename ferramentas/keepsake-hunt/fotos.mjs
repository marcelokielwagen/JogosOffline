// Keepsake Hunt: abre o jogo e fotografa fases.   node fotos.mjs pasta 1,3,8 [--pc] [--deitado]
import { abrir, dorme } from './nav.mjs';
const [pasta, lista] = process.argv.slice(2), pc = process.argv.includes('--pc'), deit = process.argv.includes('--deitado');
const p = await abrir(pc ? { w: 1366, h: 768 } : deit ? { w: 844, h: 390, movel: true, dpr: 2 } : { w: 390, h: 844, movel: true, dpr: 2 }); const s = pc ? 'pc' : deit ? 'd' : 'c'; await dorme(600);
if (lista.includes('0')) await p.foto(`${pasta}/${s}-abertura.png`);
for (const n of lista.split(',').map(Number).filter(Boolean)) { const t = Date.now(); await p.av(`__keepsake.Jogo.comecar(${n}).then(()=>1)`); console.log('fase', n, 'montou em', Date.now() - t, 'ms', JSON.stringify(await p.av(`(()=>{const P=__keepsake.Jogo.P,M=__keepsake.Nucleo.mapa(P.objs,P.W,P.H,P.masc);return{modo:P.F.modo,alvos:P.meta,total:P.objs.length,tempo:P.F.tempo,vis:P.objs.map((o,i)=>o.alvo?Math.round(M.fracao(i)*100)+(o.fundo?'f':''):0).filter(Boolean).join(' '),med:Math.round(M.fracao(P.objs.findIndex(o=>o.lembranca))*100)}})()`))); await dorme(1500); await p.foto(`${pasta}/${s}-f${n}.png`); }
console.log('erros', p.erros.slice(0, 4)); p.fim();

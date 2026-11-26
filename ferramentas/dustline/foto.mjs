// Fotos do Dustline: parado, dirigindo um pouco, pôr do sol, celular.   node foto.mjs pasta
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2], p = await abrir({ w: 1280, h: 760, url: '/jogos/dustline/index.html#manifest' }); await dorme(4500);
console.log(await p.av(`new Promise(r=>{let n=0,t=performance.now();const f=()=>{if(++n<90)requestAnimationFrame(f);else r(Math.round(90000/(performance.now()-t))+' quadros/s, '+__dustline.R.info.render.triangles+' triangulos, '+__dustline.R.info.render.calls+' desenhos')};f()})`));
await p.foto(d + '/d0.png');
await p.av(`__dustline.teclas.add('gas');document.getElementById('tela').dispatchEvent(new PointerEvent('pointerdown'))`); await dorme(4000); await p.av(`__dustline.teclas.add('esq')`); await dorme(900); await p.av(`__dustline.teclas.delete('esq')`); await dorme(1500); await p.foto(d + '/d1.png');
console.log(await p.av(`(()=>{const F=__dustline.F;return 'vel '+F.vf.toFixed(1)+' m/s, na estrada '+__dustline.naEstrada(F.x,F.z).toFixed(2)+', y '+F.y.toFixed(2)+', marcha '+F.marcha})()`));
await p.av(`__dustline.teclas.clear();__dustline.mudarHora(1,true)`); await dorme(3500); await p.foto(d + '/d2.png');
await p.vp(390, 844, true, 2); await p.av('dispatchEvent(new Event("resize"))'); await dorme(1500); await p.foto(d + '/d3.png');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

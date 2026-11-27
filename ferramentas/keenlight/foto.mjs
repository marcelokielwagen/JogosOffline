// Fotos: node foto.mjs pasta   (abertura, jogo no computador, perto, celular em pé e deitado)
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2] || '.', url = '/jogos/keenlight/index.html#manifest';
const p = await abrir({ w: 1280, h: 760, url }); await dorme(4000);
console.log('erros iniciais:', p.erros.slice(0, 5).join('\n') || 'nenhum');
await p.foto(d + '/abertura.png');
await p.av(`document.getElementById('bJogar').click()`); await dorme(2500); await p.foto(d + '/pc.png');
console.log(await p.av(`new Promise(r=>{let n=0,t=performance.now();const f=()=>{if(++n<60)requestAnimationFrame(f);else r(Math.round(60000/(performance.now()-t))+' quadros/s, '+__keenlight.R.info.render.triangles+' triangulos, '+__keenlight.R.info.render.calls+' desenhos')};f()})`));
await p.av(`document.getElementById('bModo').click()`); await dorme(600); await p.foto(d + '/silhuetas.png');
await p.av(`document.getElementById('bModo').click()`); await dorme(600); await p.foto(d + '/charadas.png');
await p.av(`document.getElementById('bModo').click()`);
await p.av(`__keenlight.vista.A.az=.55;__keenlight.vista.A.el=.1`); await dorme(1800); await p.foto(d + '/girado.png');
await p.av(`__keenlight.vista.A.az=-.5;__keenlight.vista.A.el=.3`); await dorme(1800); await p.foto(d + '/girado2.png');
await p.av(`__keenlight.vista.centro()`); await dorme(1500);
await p.vp(390, 844, true, 2); await p.av('dispatchEvent(new Event("resize"))'); await dorme(1500); await p.foto(d + '/cel.png');
await p.vp(844, 390, true, 2); await p.av('dispatchEvent(new Event("resize"))'); await dorme(1500); await p.foto(d + '/deitado.png');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

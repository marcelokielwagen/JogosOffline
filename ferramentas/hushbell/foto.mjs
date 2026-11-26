// Fotos: node foto.mjs pasta   (computador, celular em pé e deitado, espiando, e as quatro horas)
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2], url = '/jogos/hushbell/index.html#manifest';
const p = await abrir({ w: 1280, h: 760, url }); await dorme(5500); await p.foto(d + '/pc0.png');
for (const i of [1, 2, 3]) { await p.av(`__hushbell.mudarHora(${i},true);__hushbell.Cam.intro=1;document.getElementById('titulo').classList.add('some')`); await dorme(3500); await p.foto(d + `/pc${i}.png`); }
await p.av('__hushbell.mudarHora(0,true)'); await dorme(3000); await p.av('__hushbell.Cam.alvoAz=.36;__hushbell.Cam.alvoEl=.1'); await dorme(1500); await p.foto(d + '/espiar.png'); await p.av('__hushbell.Cam.alvoAz=__hushbell.Cam.alvoEl=0;__hushbell.Cam.alvoZoom=2'); await dorme(2500); await p.foto(d + '/perto.png');
console.log(await p.av(`new Promise(r=>{let n=0,t=performance.now();const f=()=>{if(++n<90)requestAnimationFrame(f);else r(Math.round(90000/(performance.now()-t))+' quadros/s, '+__hushbell.R.info.render.triangles+' triangulos, '+__hushbell.R.info.render.calls+' desenhos')};f()})`));
await p.vp(390, 844, true, 2); await p.av('__hushbell.Cam.alvoZoom=1;dispatchEvent(new Event("resize"))'); await dorme(2000); await p.foto(d + '/cel.png'); await p.vp(844, 390, true, 2); await p.av('dispatchEvent(new Event("resize"))'); await dorme(1500); await p.foto(d + '/deitado.png');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

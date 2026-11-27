// Keenlight: gera capas/keenlight.webp (720x900) com o ateliê em 3D do próprio jogo.   node capa.mjs [pasta para ver em png]
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2, url: '/jogos/keenlight/index.html#manifest' }); await dorme(4000);
await p.av(`(()=>{for(const id of ['abertura','vinheta'])document.getElementById(id).style.display='none';const K=__keenlight;K.J.estado='capa';const v=K.vista;v.A.alvo.set(-.55,1.0,-.2);v.A.az=-.28;v.A.el=.16;v.A.dist=3.3;})()`); await dorme(4000);
const r = await p.cmd('Page.captureScreenshot', { format: 'webp', quality: 90 }); writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/keenlight.webp', Buffer.from(r.data, 'base64'));
if (process.argv[2]) { const q = await p.cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[2] + '/capa-keenlight.png', Buffer.from(q.data, 'base64')); }
console.log('erros:', p.erros.join('\n') || 'nenhum'); p.fim();

// Dustline: gera capas/dustline.webp (720x900): o carrinho derrapando no Vale das Cerejeiras.   node capa.mjs [pasta para ver em png]
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2, url: '/jogos/dustline/index.html#manifest' }); await dorme(3000);
await p.av(`document.querySelector('[data-modo=livre]').click();__dustline.comecar(2)`); for (let i = 0; i < 40 && await p.av('__dustline.estado') !== 'livre'; i++) await dorme(150);
await p.av(`(()=>{for(const s of ['#painel','#controles','#aviso','#botoes'])document.querySelector(s).style.display='none';__dustline.teclas.add('gas')})()`); await dorme(1500);
await p.av(`__dustline.teclas.add('mao');__dustline.teclas.add('dir')`); await dorme(420); await p.av(`__dustline.teclas.delete('mao')`); await dorme(200);
const r = await p.cmd('Page.captureScreenshot', { format: 'webp', quality: 90 }); writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/dustline.webp', Buffer.from(r.data, 'base64'));
if (process.argv[2]) { const q = await p.cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[2] + '/capa-dustline.png', Buffer.from(q.data, 'base64')); }
console.log('erros:', p.erros.join('\n') || 'nenhum'); p.fim();

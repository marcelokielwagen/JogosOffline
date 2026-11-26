// AetherDrift: gera capas/aetherdrift.webp (720x900) com a vista de abertura do próprio jogo.   node capa.mjs [pasta para ver em png]
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2, url: '/jogos/aetherdrift/index.html#manifest' }); await dorme(3000);
await p.av(`document.getElementById('abertura').style.display='none'`); await dorme(5000);
const r = await p.cmd('Page.captureScreenshot', { format: 'webp', quality: 90 }); writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/aetherdrift.webp', Buffer.from(r.data, 'base64'));
if (process.argv[2]) { const q = await p.cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[2] + '/capa-aetherdrift.png', Buffer.from(q.data, 'base64')); }
console.log('erros:', p.erros.join('\n') || 'nenhum'); p.fim();

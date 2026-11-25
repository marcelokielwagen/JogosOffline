// Keepsake Hunt: fotografa os 5 cômodos em 6 estados (arte/c0-0.webp a c4-5.webp).   node gerar-comodos.mjs [--so=0,3] [--estados=0,5] [--prova=pasta]
import { readFileSync, writeFileSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const RAIZ = 'C:/Users/Minhoca/Projetos/JogosOffline/', SAIDA = RAIZ + 'jogos/keepsake-hunt/arte/', arg = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1], prova = arg('prova');
const p = await abrir({ w: 400, h: 300, url: '/index.html?manifest' }); await dorme(600);
await p.av(`(async()=>{window.THREE=await import('/lib/three/three.module.min.js');1})()`); await p.av(readFileSync(RAIZ + 'ferramentas/keepsake-hunt/comodos3d.js', 'utf8') + ';window.CS=Casa(THREE);window.RR=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});1');
for (const r of (arg('so') || '0,1,2,3,4').split(',').map(Number)) for (const k of (arg('estados') || '0,1,2,3,4,5').split(',').map(Number)) {
  const t = Date.now(), L = prova ? 900 : 1800, A = prova ? 640 : 1280; try {
    const u = await p.av(`(()=>{CS.foto(RR,${r},${k},${L},${A},${prova ? 40 : 120});const d=document.createElement('canvas');d.width=${prova ? 900 : 1000};d.height=${prova ? 640 : 711};const q=d.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(RR.domElement,0,0,d.width,d.height);return d.toDataURL('image/webp',.82)})()`);
    const b = Buffer.from(u.split(',')[1], 'base64'); writeFileSync(`${prova ? prova + '/' : SAIDA}c${r}-${k}.webp`, b); console.log('cômodo', r, 'estado', k, Math.round(b.length / 1024), 'KB', ((Date.now() - t) / 1000).toFixed(1) + ' s');
  } catch (e) { console.log('ERRO', r, k, e.message.slice(0, 500)); }
}
console.log([...new Set(p.erros.map(e => e.slice(0, 300)))].slice(0, 4).join('\n') || 'sem erros'); p.fim();

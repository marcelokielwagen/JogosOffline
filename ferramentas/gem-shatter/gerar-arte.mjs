// Gem Shatter: gera as imagens das galerias (6 estados cada) e a folha dos 40 minerais em jogos/gem-shatter/arte/.
//   node gerar-arte.mjs [--so=0,1 | --so=minerais] [--prova=pasta]   (--prova grava só o começo e o fim de cada galeria, pequeno)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const AQUI = 'C:/Users/Minhoca/Projetos/JogosOffline/', SAIDA = AQUI + 'jogos/gem-shatter/arte/', arg = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
const prova = arg('prova'), so = (arg('so') || '0,1,2,3,4,minerais').split(','), html = readFileSync(AQUI + 'jogos/gem-shatter/index.html', 'utf8'), meta = (html.match(/<script id="meta">([\s\S]*?)<\/script>/) || [, readFileSync(arg('meta') || 'meta.js', 'utf8')])[1].replace("'use strict';", '');
mkdirSync(SAIDA, { recursive: true }); const p = await abrir({ w: 400, h: 300, angle: 'gl' });
await p.av((html.includes('id="meta"') ? '' : meta) + readFileSync(AQUI + 'ferramentas/gem-shatter/arte3d.js', 'utf8') + ';window.A3=Arte3D;window.MT=Meta;1');
const grava = (nome, url) => { const b = Buffer.from(url.split(',')[1], 'base64'); writeFileSync((prova ? prova + '/' : SAIDA) + nome, b); return Math.round(b.length / 1024); };
for (const g of so.filter(x => x !== 'minerais').map(Number)) for (const k of prova ? [0, 5] : [0, 1, 2, 3, 4, 5]) {
  const t = Date.now(), L = prova ? 640 : 1680, A = prova ? 400 : 1050, f = prova ? 1 : 2;
  const u = await p.av(`(()=>{const c=document.createElement('canvas');if(!A3.pinta(c,${g},${L},${A},{w:[0,1,2,3,4].map(i=>i<${k}?1:0)}))return '';const d=document.createElement('canvas');d.width=${L / f};d.height=${A / f};const q=d.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(c,0,0,d.width,d.height);return d.toDataURL('image/webp',.8)})()`);
  console.log('galeria', g, 'estado', k, u ? grava(`g${g}-${k}.webp`, u) + ' KB' : 'FALHOU', ((Date.now() - t) / 1000).toFixed(1) + ' s');
}
if (so.includes('minerais')) { const u = await p.av(`(()=>{const T=180,d=document.createElement('canvas');d.width=T*8;d.height=T*5;const q=d.getContext('2d');q.imageSmoothingQuality='high';for(const e of MT.EX){const c=document.createElement('canvas');if(!A3.mineral(c,e,T*2))return '';q.drawImage(c,(e.i%8)*T,(e.i/8|0)*T,T,T)}return d.toDataURL('image/webp',.86)})()`); console.log('minerais', u ? grava('minerais.webp', u) + ' KB' : 'FALHOU'); }
console.log(p.erros.map(e => e.slice(0, 1500)).join('\n') || 'sem erros'); p.fim();

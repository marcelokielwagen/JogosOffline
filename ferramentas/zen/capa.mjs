// Zen: gera capas/zen.webp (720x900), no mesmo estilo de jardim de areia do jogo.   node capa.mjs
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const C = { areia: '#1c2238', areia2: '#141a2c', sulco: '#313a5c', luz: '#f0c9a0', risco: '#8f7058', pedra: '#56618a', sombra: '#0e1326', tinta: '#e9ecf6' };
const LACO = 'M48 6A10 10 0 0 1 58 16A10 10 0 0 0 68 26A10 10 0 0 1 68 46A10 10 0 0 0 58 56A10 10 0 0 1 38 56A10 10 0 0 0 28 46A10 10 0 0 1 28 26A10 10 0 0 0 38 16A10 10 0 0 1 48 6Z';
const pol = (n, r, g = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.28319 + g * Math.PI / 180; return (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); });
const FORMAS = [ // [x, y, desenho, grossura, cor]
  [575, 668, 'M' + pol(6, 34, 10).join('L') + 'Z', 26, C.luz], [300, 640, 'M' + pol(4, 40, 28).join('L') + 'Z', 26, C.luz], [520, 826, 'M-70 14L70 -14', 34, C.pedra], [132, 806, 'M0 0L.01 0', 52, C.tinta]];
const anel = (k, linha) => `<g transform="translate(360 300) scale(5.4)"><path d="${LACO}" transform="translate(-48 -36)" fill="none" stroke-width="${(58 + k * 34 + linha) / 5.4}"/></g>` + FORMAS.map(([x, y, d, w]) => `<path d="${d}" transform="translate(${x} ${y})" stroke-width="${w + 14 + k * 26 + linha}"/>`).join('');
let ondas = ''; for (let y = 10; y < 920; y += 24) ondas += `M0 ${y}Q90 ${y - 8} 180 ${y}T360 ${y}T540 ${y}T720 ${y}`;
let aneis = ''; for (const k of [4, 3, 2, 1]) aneis += `<g fill="${C.sulco}" stroke="${C.sulco}">${anel(k, 2.6)}</g><g fill="url(#g)" stroke="url(#g)">${anel(k, -2.6)}</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900" stroke-linejoin="round" stroke-linecap="round">
<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="900"><stop offset="0" stop-color="${C.areia}"/><stop offset="1" stop-color="${C.areia2}"/></linearGradient></defs>
<rect width="720" height="900" fill="url(#g)"/><path d="${ondas}" fill="none" stroke="${C.sulco}" stroke-width="2.4"/>${aneis.replaceAll('url(#g)', C.areia)}
<g transform="translate(360 300) scale(5.4)" fill="none"><g transform="translate(-48 -36)">
<path d="${LACO}" transform="translate(0 1.7)" stroke="${C.sombra}" stroke-width="10.6"/><path d="${LACO}" stroke="${C.luz}" stroke-width="10.6"/><path d="${LACO}" stroke="${C.risco}" stroke-width="4.9"/><path d="${LACO}" stroke="${C.luz}" stroke-width="3.8"/></g></g>
<path d="M160 786L300 700M338 655L537 668" fill="none" stroke="${C.tinta}" stroke-width="9" stroke-dasharray=".1 24" opacity=".75"/>
${FORMAS.map(([x, y, d, w, c]) => `<g transform="translate(${x} ${y})"><path d="${d}" transform="translate(0 9)" fill="${C.sombra}" stroke="${C.sombra}" stroke-width="${w}"/><path d="${d}" fill="${c}" stroke="${c}" stroke-width="${w}"/></g>`).join('')}</svg>`;
const p = await abrir({ w: 720, h: 900, url: '/ferramentas/zen/nucleo.js#manifest' });
const url = await p.av(`(async()=>{const i=new Image();i.src='data:image/svg+xml;utf8,'+encodeURIComponent(${JSON.stringify(svg)});await i.decode();const c=document.createElement('canvas');c.width=720;c.height=900;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.9)+'|'+c.toDataURL('image/png')})()`);
const [w, png] = url.split('|'); writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/zen.webp', Buffer.from(w.split(',')[1], 'base64')); if (process.argv[2]) writeFileSync(process.argv[2], Buffer.from(png.split(',')[1], 'base64')); p.fim();

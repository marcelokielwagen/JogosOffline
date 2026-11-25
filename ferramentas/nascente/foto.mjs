// Fotos numa folha só: node foto.mjs saida.png LARGxALT fase:dif:estado[:andar[:camera]] ...   estado: s (embaralhada) m (meio) f (florida)
import { writeFileSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const [saida, tam, ...itens] = process.argv.slice(2), [w, h] = tam.split('x').map(Number), movel = h > w;
const p = await abrir({ w, h, movel, url: '/jogos/nascente/index.html#semescolha' }), fotos = [];
for (const it of itens) {
  const [fase, dif, est, andar, cam] = it.split(':');
  await p.av(`(async()=>{document.getElementById("veu").style.transition="none";const N=__nascente;N.salvo.dif=${+dif};N.salvo.andamento={};await N.abrirFase(${fase - 1});N.J.surgir=1;${cam ? `N.Cam.trocar('${cam}');` : ''}for(const n in N.Cam.quer)N.Cam[n]=N.Cam.quer[n];
   ${est === 'f' ? 'N.resolver();' : est === 'm' ? 'const U=N.J.F.unidades.filter(u=>!u.membros[0].fixa);U.forEach((u,i)=>{if(i%2)return;let n=0;while(!N.unidadeCerta(u)&&n++<4)N.girar(u.membros[0]);});' : ''}
   for(let t=0;t<${est === 'f' ? 22 : est === 'm' ? 12 : 1};t+=.04)N.passo(.04); ${andar ? `N.focarAndar(${andar});` : ''} N.passo(.02);
   const R=N.R;document.getElementById('aviso').classList.remove('ver');})()`);
  await dorme(250); const r = await p.cmd('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); fotos.push(r.data);
}
const erros = [...new Set(p.erros)]; const cols = Math.max(1, Math.min(fotos.length, Math.floor(1700 / w * 1.15))), lw = Math.min(w, Math.floor(1700 / cols)), lh = Math.round(lw * h / w);
await p.vp(lw * cols, lh * Math.ceil(fotos.length / cols)); await p.cmd('Page.navigate', { url: p.base + '/manifest.webmanifest' }); await dorme(400);
await p.av(`document.documentElement.innerHTML='<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},${lw}px)"></body>'`);
for (const d of fotos) await p.av(`(()=>{const i=new Image();i.style='width:${lw}px;display:block';i.src='data:image/jpeg;base64,${d}';document.body.append(i);return i.decode()})()`);
await p.foto(saida); console.log('erros:', erros.join('\n') || 'nenhum'); p.fim();

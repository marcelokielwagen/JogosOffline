// Zen: gera capas/zen-loop.webp e capas/zen-ricochet.webp (720x900) com o desenho do próprio jogo.   node capa.mjs [pasta para ver em png]
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2, url: '/jogos/zen/index.html#manifest' }); await dorme(900);
setTimeout(() => p.fim(), 60000).unref();
async function capa(nome, jogo, dif, fase, preparar) {
  await p.av(`(()=>{const S=__zen.S;S.jogo='${jogo}';S.dif='${dif}';S.calmo=true;__zen.entrar(${fase})})()`); await dorme(2400);
  await p.av(`for(const e of document.querySelectorAll('#partida>:not(canvas)'))e.style.display='none';__zen.J.redimensionar(360,450,2,{topo:14,base:14,esq:14,dir:14})`);
  await p.av(preparar); await dorme(3200); await p.av(`__zen.J.redimensionar(360,450,2,{topo:14,base:14,esq:14,dir:14});document.querySelector('#fim').style.display='none'`); await dorme(500);
  const u = await p.av(`(()=>{const c=document.createElement('canvas');c.width=720;c.height=900;const g=c.getContext('2d'),s=getComputedStyle(document.documentElement),f=g.createLinearGradient(0,0,0,900);f.addColorStop(0,s.getPropertyValue('--areia'));f.addColorStop(1,s.getPropertyValue('--areia2'));g.fillStyle=f;g.fillRect(0,0,720,900);${jogo === 'okay' ? "__zen.J.toqueInicio(0,0,1);const T=__zen.J.teste,[a,b]=T.tela(0,0),[x,y]=T.tela(T.F.mira[0],T.F.mira[1]),m=Math.hypot(x-a,y-b);__zen.J.toqueMove(-(x-a)/m*170,-(y-b)/m*170,1);T.desenhar();" : ''}g.drawImage(document.getElementById('quadro'),0,0,720,900);return c.toDataURL('image/webp',.9)+'|'+c.toDataURL('image/png')})()`);
  const [w, png] = u.split('|'); writeFileSync(`C:/Users/Minhoca/Projetos/JogosOffline/capas/${nome}.webp`, Buffer.from(w.split(',')[1], 'base64')); if (process.argv[2]) writeFileSync(`${process.argv[2]}/${nome}.png`, Buffer.from(png.split(',')[1], 'base64'));
}
await capa('zen-loop', 'loop', 'medio', 1, `for(const q of __zen.J.teste.P)if(q.tipo!=='ponte'){const n=q.tipo==='curva'?4:2;let k=(((q.certo-q.giro)%n)+n)%n;while(k--)__zen.J.teste.girarPeca(q)}`);
await capa('zen-ricochet', 'okay', 'medio', 22, '1');
console.log(p.erros); p.fim();

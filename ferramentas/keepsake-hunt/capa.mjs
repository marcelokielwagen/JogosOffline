// Keepsake Hunt: gera capas/keepsake-hunt.webp fotografando a própria mesa do jogo.   node capa.mjs
import { writeFileSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2 }); await dorme(500);
await p.av(`(async()=>{const s=document.createElement('style');s.textContent='#lado,.bandeja,#fx{display:none!important}#app{padding:0!important}';document.head.appendChild(s);await __keepsake.Jogo.comecar(10);__keepsake.Jogo.refazer();})()`); await dorme(1200);
await p.av(`(()=>{const {Jogo,Nucleo,Tela}=__keepsake,P=Jogo.P;Jogo.pausar(true);const i=P.objs.findIndex(o=>o.lembranca),m=P.objs.splice(i,1)[0];
 const quer=[['relogio',-9,-13,.2],['chave',9,-9,2.2],['bussola',10,12,.4],['carretel',-11,3,1.1],['moeda',-3,-15,0],['disqueteAzul',10,1,-.25],['lupa',-8,14,-.8],['tesoura',3,16,1.9],['rei',-13,-4,-.4],['broche',2,-9,.3]];
 for(const [id,x,y,r] of quer){const k=Nucleo.POR[id];let j=P.objs.findIndex(o=>o.k===k);const o=j>=0?P.objs.splice(j,1)[0]:{k,vivo:true,vx:0,vy:0,vr:0,esc:1};Object.assign(o,{x,y,r,esc:1,halo:0});P.objs.push(o);}
 Object.assign(m,{x:0,y:1,r:.12,esc:2.5,halo:.35,sobe_:.5});P.objs.push(m);Tela.sujar();})()`); await dorme(500);
const r = await p.cmd('Page.captureScreenshot', { format: 'png' });
const u = await p.av(`(async()=>{const i=new Image();i.src='data:image/png;base64,${r.data}';await i.decode();const c=document.createElement('canvas');c.width=720;c.height=900;const g=c.getContext('2d');g.imageSmoothingQuality='high';const m=20;g.drawImage(i,m,m,i.width-2*m,i.height-2*m,0,0,720,900);const v=g.createRadialGradient(360,440,200,360,450,620);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.62)');g.fillStyle=v;g.fillRect(0,0,720,900);return c.toDataURL('image/webp',.84)})()`);
writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/keepsake-hunt.webp', Buffer.from(u.split(',')[1], 'base64')); console.log(p.erros); p.fim();

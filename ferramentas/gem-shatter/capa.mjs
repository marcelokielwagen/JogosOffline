// Gem Shatter: gera capas/gem-shatter.webp com a própria arte do jogo.   node capa.mjs
import { writeFileSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const p = await abrir({ w: 400, h: 500 }); await dorme(400);
const url = await p.av(`(()=>{
 const A=__gemShatter.Arte,c=document.createElement('canvas');c.width=720;c.height=900;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(A.parede(0,720,900),0,0,720,900);
 const v=g.createRadialGradient(360,400,60,360,450,620);v.addColorStop(0,'rgba(255,190,90,.20)');v.addColorStop(.5,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=v;g.fillRect(0,0,720,900);
 const L=158,X=(720-L*4)/2,Y=(900-L*5)/2-6;
 g.save();g.shadowColor='rgba(0,0,0,.75)';g.shadowBlur=46;g.shadowOffsetY=14;g.fillStyle='#3a3029';g.beginPath();g.roundRect(X-14,Y-14,L*4+28,L*5+28,26);g.fill();g.restore();g.fillStyle='#16120f';g.beginPath();g.roundRect(X-5,Y-5,L*4+10,L*5+10,20);g.fill();
 const M=['c3 c0 c0 c2','c4 c0 p4 c2','c1 o ogeodo c3','oc1 oc5 ob c3','oc0 oc2 oc2 oc4'].map(l=>l.split(' '));
 M.forEach((l,y)=>l.forEach((n,x)=>{const px=X+x*L,py=Y+y*L;g.fillStyle=(x+y)%2?'#1e1916':'#231d19';g.fillRect(px+2,py+2,L-4,L-4);let t=L*.96,s=n;if(n[0]==='o'){g.drawImage(A.sp.ouro2,px+1,py+1,L-2,L-2);s=n.slice(1);t=L*.86;}if(!s)return;g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=12;g.shadowOffsetY=5;g.drawImage(A.sp[s],px+(L-t)/2,py+(L-t)/2,t,t);g.restore();}));
 const cx=X+1.5*L,cy=Y+2.5*L,b=g.createRadialGradient(cx,cy,0,cx,cy,260);b.addColorStop(0,'rgba(255,205,110,.5)');b.addColorStop(1,'rgba(255,180,60,0)');g.globalCompositeOperation='lighter';g.fillStyle=b;g.fillRect(0,0,720,900);g.globalCompositeOperation='source-over';
 let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;for(let k=0;k<34;k++){const a=r()*6.28,d=40+r()*190,e=7+r()*17,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,q=r()*6.28;g.save();g.translate(x,y);g.rotate(q);g.fillStyle=r()<.6?'#f3b133':'#ffe0a0';g.beginPath();g.moveTo(-e,-e*.5);g.lineTo(e,-e*.6);g.lineTo(e*.1,e);g.fill();g.globalAlpha=.5;g.fillStyle='#fff';g.beginPath();g.moveTo(-e,-e*.5);g.lineTo(e,-e*.6);g.lineTo(0,0);g.fill();g.restore();}
 return c.toDataURL('image/webp',.86)})()`);
writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/gem-shatter.webp', Buffer.from(url.split(',')[1], 'base64')); console.log(p.erros); p.fim();

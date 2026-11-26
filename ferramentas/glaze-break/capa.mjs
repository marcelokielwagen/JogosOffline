// Glaze Break: gera capas/glaze-break.webp (720 x 900) fotografando o próprio campo do jogo, montado à mão.   node capa.mjs [arquivo]
// Cena: fase 47 (faixas nas 4 cores); a bola com esmalte acaba de atravessar azulejos da mesma cor, abrindo um caminho.
import { writeFileSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const saida = process.argv[2] || 'C:/Users/Minhoca/Projetos/JogosOffline/capas/glaze-break.webp';
const p = await abrir({ w: 360, h: 450, dpr: 2 }); await dorme(500);
await p.av(`(async()=>{const s=document.createElement('style');s.textContent='#lado,.tela,#aviso{display:none!important}#app{padding:0!important;gap:0!important}';document.head.appendChild(s);await __glaze.Jogo.comecar(47);__glaze.Tela.medir();})()`); await dorme(400);
const info = await p.av(`(()=>{const {Jogo,Nucleo:N,Tela}=__glaze,P=Jogo.P;Jogo.pausar(true);
 // caminho: na coluna 6, a bola subiu quebrando; a cor dela é a do último azulejo que atravessou
 const col=6,linhas=[];for(let r=P.F.linhas-1;r>=0;r--){const t=P.cel[r*10+col];if(t&&t.vivo&&t.k!=='f')linhas.push(t);}
 const ult=linhas.slice(0,4);for(const t of ult)t.vivo=false;const topo=ult[ult.length-1],cor=topo.k==='a'||topo.k==='j'?topo.cor:1;
 P.mudou=true;N.PY=112;P.rq.x=50;P.rq.alvo=50;const b=P.bolas[0];Object.assign(b,{presa:false,x:ult[1].x+N.CW*.5,y:ult[1].y+N.CH*.5,dx:.1,dy:-.99,cor});b.rastro=[];for(let i=8;i>=1;i--)b.rastro.push(b.x-b.dx*i*2.6,b.y-b.dy*i*2.6);
 for(const t of ult)Tela.efeito({e:'quebrou',x:t.x+N.CW/2,y:t.y+N.CH/2,k:'b',cor:-1,passou:true,veio:0,dx:b.dx,dy:b.dy});
 Tela.efeito({e:'quebrou',x:topo.x+N.CW/2,y:topo.y+N.CH/2,k:'a',cor,passou:true,veio:3,dx:b.dx,dy:b.dy});
 Tela.efeito({e:'cor',cor,x:b.x,y:b.y});Jogo.ritmo=.22;Jogo.pausar(false);return{cor,c:Tela.campo};})()`); await dorme(240);
await p.av(`(()=>{__glaze.Jogo.pausar(true);const P=__glaze.Jogo.P;})()`); await dorme(150);
const r = await p.cmd('Page.captureScreenshot', { format: 'png' }), c = info.c;
// recorte: o campo de cima até logo abaixo da barra (proporção 4:5)
const u = await p.av(`(async()=>{const i=new Image();i.src='data:image/png;base64,${r.data}';await i.decode();const k=i.width/360,x=${c.x}*k,w=${c.w}*k,h=w*1.25,y=0;const cv=document.createElement('canvas');cv.width=720;cv.height=900;const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(i,x,y,w,h,0,0,720,900);const v=g.createRadialGradient(360,380,240,360,450,640);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=v;g.fillRect(0,0,720,900);return cv.toDataURL('image/webp',.86)})()`);
writeFileSync(saida, Buffer.from(u.split(',')[1], 'base64')); console.log('capa gravada em', saida, 'esmalte', info.cor, p.erros); p.fim();

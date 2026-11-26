// Keepsake Hunt: ícone do aplicativo (1024 e 512). Modela o medalhão do jogo em alta resolução, com a mesma luz das folhas de conferência.   node icone.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const RAIZ = 'C:/Users/Minhoca/Projetos/JogosOffline/', SAI = RAIZ + 'lojas/keepsake-hunt/imagens/'; mkdirSync(SAI, { recursive: true });
const p = await abrir({ w: 400, h: 300, url: '/index.html?manifest' }); await dorme(600);
await p.av(`(async()=>{window.THREE=await import('/lib/three/three.module.min.js');1})()`); await p.av(readFileSync(RAIZ + 'ferramentas/keepsake-hunt/objetos3d.js', 'utf8') + ';1');
await p.av(`window.OF=Oficina(THREE);window.RR=new THREE.WebGLRenderer({alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});RR.autoClear=false;RR.outputColorSpace=THREE.LinearSRGBColorSpace;1`);
const url = await p.av(`(()=>{const o=OF.desenhar(RR,OF.OBJ.find(x=>x.id==='medalhao'),150),a=o.cor.getContext('2d').getImageData(0,0,o.w,o.h),b=o.nor.getContext('2d').getImageData(0,0,o.w,o.h);
  for(let k=0;k<a.data.length;k+=4){const nx=b.data[k]/127.5-1,ny=b.data[k+1]/127.5-1,nz=Math.sqrt(Math.max(.02,1-nx*nx-ny*ny)),mm=b.data[k+2]/255,me=mm>.5,ro=me?(mm-.52)/.48:mm/.48;
   const df=.35+.75*Math.max(0,nx*-.42+ny*.5+nz*.76),rx=2*nz*nx,ry=2*nz*ny,sp=Math.pow(Math.max(0,(nx*-.22+ny*.28+nz*.93)),4+(1-ro)*(1-ro)*160)*(1-ro)*1.3,env=.25+.75*(1/(1+Math.exp(-6*(ry+.1))))+.5*Math.exp(-Math.pow((rx+.5)*4,2));
   for(let c=0;c<3;c++){const al=Math.pow(a.data[k+c]/255,2.2);let v=me?al*(env*1.1*(1-ro*.5)+df*.35+sp*1.5):al*df+sp*.5+(1-ro)*.06*env;a.data[k+c]=255*Math.pow(Math.min(1,v),1/2.2);}}
  const x=document.createElement('canvas');x.width=o.w;x.height=o.h;x.getContext('2d').putImageData(a,0,0);
  // fundo: o verde da mesa, sem transparência (a App Store não aceita ícone transparente)
  const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d'),f=g.createRadialGradient(440,380,40,512,512,760);f.addColorStop(0,'#2f5243');f.addColorStop(.55,'#172a22');f.addColorStop(1,'#0a120f');g.fillStyle=f;g.fillRect(0,0,1024,1024);
  const s=Math.min(780/o.w,840/o.h);g.save();g.shadowColor='rgba(0,0,0,.6)';g.shadowBlur=70;g.shadowOffsetX=18;g.shadowOffsetY=30;g.drawImage(x,512-o.w*s/2,530-o.h*s/2,o.w*s,o.h*s);g.restore();return c.toDataURL('image/png')})()`);
const grava = (f, u) => writeFileSync(SAI + f, Buffer.from(u.split(',')[1], 'base64')); grava('icone-1024.png', url);
grava('icone-512.png', await p.av(`(async()=>{const i=new Image();i.src=${JSON.stringify(url)};await i.decode();const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(i,0,0,512,512);return c.toDataURL('image/png')})()`));
console.log('ícone ok', p.erros.slice(0, 3)); p.fim();

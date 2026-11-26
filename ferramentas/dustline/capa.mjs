// Dustline: gera capas/dustline.webp (720x900): o cupê de drift de lado numa zona de cones no Vale das Cerejeiras.   node capa.mjs [pasta para ver em png]
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2, url: '/jogos/dustline/index.html#manifest' }); await dorme(3000);
await p.av(`document.querySelector('[data-modo=livre]').click();__dustline.comecar(2)`); for (let i = 0; i < 40 && await p.av('__dustline.estado') !== 'livre'; i++) await dorme(150);
const lado = await p.av(`(()=>{for(const s of ['#painel','#controles','#aviso','#botoes'])document.querySelector(s).style.display='none';const D=__dustline,M=D.mundo,P=M.pontos,z=M.zonas[0],a=P[z[0]-14],b=P[z[0]-10],c=P[z[0]+14];
  D.F.colocar({x:a.x,z:a.z,rumo:Math.atan2(b.x-a.x,b.z-a.z)});let t=Math.atan2(c.x-b.x,c.z-b.z)-Math.atan2(b.x-a.x,b.z-a.z);t-=Math.round(t/6.2832)*6.2832;D.teclas.add('gas');return t>0?'esq':'dir'})()`); await dorme(1300);
await p.av(`__dustline.teclas.add('mao');__dustline.teclas.add('${lado}')`); await dorme(260); await p.av(`__dustline.teclas.delete('mao')`); await dorme(380);
// câmera de capa: mais perto e mais baixa, de frente para o carro de lado
await p.av(`(()=>{const D=__dustline,R=D.R,o=R.render;R.render=(s,c)=>{const F=D.F,a=F.rumo+1.05,P=new D.THREE.Vector3(F.x,F.y+.8,F.z);c.position.set(F.x+Math.sin(a)*13,F.y+7.5,F.z+Math.cos(a)*13);c.lookAt(P);o.call(R,s,c)}})()`); await dorme(120);
const r = await p.cmd('Page.captureScreenshot', { format: 'webp', quality: 90 }); writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/dustline.webp', Buffer.from(r.data, 'base64'));
if (process.argv[2]) { const q = await p.cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[2] + '/capa-dustline.png', Buffer.from(q.data, 'base64')); }
console.log('erros:', p.erros.join('\n') || 'nenhum'); p.fim();

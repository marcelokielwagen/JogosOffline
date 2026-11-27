// Tico's Crown: gera capas/ticos-crown.webp (720x900): o Rei Tico comemorando em cima de um tabuleiro de joias explodindo.   node capa.mjs [pasta para ver em png]
import { writeFileSync } from 'node:fs';
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 360, h: 450, dpr: 2, url: '/jogos/ticos-crown/index.html#manifest' }), av = p.av; await dorme(2000);
await av(`localStorage.clear();__tico.S.nivel=22;__tico.abrirNivel(1)`); await dorme(300); await av('__tico.comecarNivel()'); await dorme(2200);
await av(`(()=>{for(const s of ['#topo','#painel','#balao','#reforcos','#grito','#flutua'])document.querySelector(s).style.display='none';
  const pc=document.querySelector('#palco');Object.assign(pc.style,{left:'0px',top:'0px',width:'360px',height:'450px',borderRadius:'0',border:'0',boxShadow:'none'});
  const t=__tico;t.dispor=null;removeEventListener('resize',()=>{});
  const L=t.L;L.rei={x:20,y:28,w:320,h:250};L.tab={x:-10,y:205,w:380,h:255};t.Rei.enquadrar(L.rei,false);t.enquadrarTab();
  t.T.ativo=false;t.Rei.reagir('vitoria');})()`);
await dorme(900);
await av(`(()=>{const t=__tico;for(const [r,c,tp] of [[3,2,'fh'],[5,5,'din'],[2,6,'disco']]){const k=t.celula(r,c);k.gema.mesh.parent.remove(k.gema.mesh);t.novaGema(k,0,tp);}
  t.VEL.v=.12;const k=t.celula(5,5);k.gema.ativando=true;t.T.fila.push(k);t.processarFila();})()`);
await dorme(3100);
const r = await p.cmd('Page.captureScreenshot', { format: 'webp', quality: 90 }); writeFileSync('C:/Users/Minhoca/Projetos/JogosOffline/capas/ticos-crown.webp', Buffer.from(r.data, 'base64'));
if (process.argv[2]) { const q = await p.cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[2] + '/capa-ticos-crown.png', Buffer.from(q.data, 'base64')); }
console.log('erros:', p.erros.join('\n') || 'nenhum'); p.fim();

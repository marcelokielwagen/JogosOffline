// Cozinha da Le: gera capas/cozinha-da-le.webp (720 x 900) fotografando o próprio jogo e confere o som.   node capa.mjs [arquivo]
// Cena: os três no balcão com fantasias, pratos a caminho e a mesa cheia de pilhas.
import { writeFileSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const saida = process.argv[2] || 'C:/Users/Minhoca/Projetos/JogosOffline/capas/cozinha-da-le.webp';
const p = await abrir({ w: 540, h: 960, dpr: 720 / 540 }); await dorme(600);
// som: liga, toca tudo e confere se o áudio está rodando sem erro
const som = await p.av(`(async()=>{const S=__le.Som;S.iniciar();await new Promise(r=>setTimeout(r,300));for(const k of ['pega','erro','servir','tada','moeda','nivel','abrir','limpa','luva','ding'])S[k]();for(const t of ['humano','cocker','preto']){S.festa(t);S.carinho(t);S.fome(t);}for(let i=0;i<12;i++)S.clack(i);await new Promise(r=>setTimeout(r,800));return S.estado();})()`);
await p.av(`(()=>{localStorage.clear();const {pers,vagas}=__le;
 const ped=['morango','abacaxi','castanha'], roupa=[8,0,2], pr=[6,8,4];
 pers.forEach((q,i)=>{q.roupa=roupa[i];q.pedido=ped[i];q.pratos=pr[i];q.humor='calmo';q.humorT=0;q.espera=0;q.tagT=0;});
 jogadas=1;botoesSom=()=>{};
 const pil=[['uva','uva','milho','morango','morango','morango'],null,null,['abacate','abacate','abacaxi','abacaxi','abacaxi','abacaxi'],['milho','castanha','castanha','castanha'],['cenoura','uva','uva','morango','morango'],null,['abacaxi','milho','milho','milho'],['castanha','abacate','abacate'],['morango','uva','uva','uva','uva'],['milho','cenoura','cenoura','castanha','castanha','castanha']];
 vagas.forEach((v,i)=>{if(pil[i])v.pilha=pil[i];});
 document.querySelector('.voltar').style.display='none';})()`);
await dorme(1500);
await p.av(`(()=>{const {pers}=__le;pers.forEach(q=>{q.ox=0;q.oy=.2;q.pisca=0;q.piscaT=9;});})()`); await dorme(120);
const r = await p.cmd('Page.captureScreenshot', { format: 'png' });
const u = await p.av(`(async()=>{const i=new Image();i.src='data:image/png;base64,${r.data}';await i.decode();const k=i.width/540;const cv=document.createElement('canvas');cv.width=720;cv.height=900;const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(i,0,104*k,540*k,675*k,0,0,720,900);return cv.toDataURL('image/webp',.88)})()`);
writeFileSync(saida, Buffer.from(u.split(',')[1], 'base64'));
console.log('capa gravada em', saida, '| som:', som, '| erros:', p.erros.length ? p.erros.join(' | ') : 'nenhum'); p.fim();

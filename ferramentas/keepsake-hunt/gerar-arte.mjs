// Keepsake Hunt: modela, fotografa e junta todos os objetos em jogos/keepsake-hunt/arte/.
//   node gerar-arte.mjs [--so=id,id] [--prova=pasta]    (--prova só grava folhas de conferência, com a luz do jogo imitada)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const RAIZ = 'C:/Users/Minhoca/Projetos/JogosOffline/', SAIDA = RAIZ + 'jogos/keepsake-hunt/arte/', arg = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
const K = +(arg('k') || 30), LADO = 2048, prova = arg('prova'), so = arg('so') && arg('so').split(',');
mkdirSync(SAIDA, { recursive: true }); const p = await abrir({ w: 400, h: 300, url: '/index.html?manifest' }); await dorme(600);
await p.av(`(async()=>{window.THREE=await import('/lib/three/three.module.min.js');1})()`);
await p.av(readFileSync(RAIZ + 'ferramentas/keepsake-hunt/objetos3d.js', 'utf8') + ';1');
console.log('three', await p.av('THREE.REVISION'), 'objetos', await p.av(`window.OF=Oficina(THREE);window.RR=new THREE.WebGLRenderer({alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});RR.autoClear=false;RR.outputColorSpace=THREE.LinearSRGBColorSpace;OF.OBJ.length`));
const ids = (await p.av('OF.OBJ.map(o=>o.id)')).filter(i => !so || so.includes(i));
const info = [];
for (const id of ids) {
  try { info.push({ id, ...(await p.av(`(()=>{const o=OF.OBJ.find(x=>x.id==='${id}'),d=OF.desenhar(RR,o,${K});(window.PR=window.PR||{})['${id}']=d;return{w:d.w,h:d.h,alt:+d.alt.toFixed(2),nome:o.nome,tema:o.tema,hz:o.hz,som:o.som}})()`)) }); } catch (e) { console.log('ERRO', id, e.message.slice(0, 400)); }
}
console.log('feitos', info.length, 'área', Math.round(info.reduce((a, o) => a + o.w * o.h, 0) / LADO / LADO * 100) + '% da folha', p.erros.slice(0, 3));
const grava = (f, u) => { const b = Buffer.from(u.split(',')[1], 'base64'); writeFileSync(f, b); return Math.round(b.length / 1024) + ' KB'; };
if (prova) {
  // luz parecida com a do jogo, só para conferir as formas
  for (let t = 0; t < 5; t++) { const l = info.filter(o => o.tema === t); if (!l.length) continue;
    console.log('tema', t, grava(`${prova}/tema${t}.png`, await p.av(`(()=>{const L=${JSON.stringify(l.map(o => o.id))},C=210,N=7,d=document.createElement('canvas');d.width=C*N;d.height=Math.ceil(L.length/N)*(C+16);const q=d.getContext('2d');q.fillStyle='#6b4a30';q.fillRect(0,0,d.width,d.height);
     L.forEach((id,i)=>{const o=PR[id],a=o.cor.getContext('2d').getImageData(0,0,o.w,o.h),b=o.nor.getContext('2d').getImageData(0,0,o.w,o.h);for(let k=0;k<a.data.length;k+=4){const nx=b.data[k]/127.5-1,ny=b.data[k+1]/127.5-1,nz=Math.sqrt(Math.max(.02,1-nx*nx-ny*ny)),mm=b.data[k+2]/255,me=mm>.5,ro=me?(mm-.52)/.48:mm/.48;
       const df=.35+.75*Math.max(0,nx*-.42+ny*.5+nz*.76),rx=2*nz*nx,ry=2*nz*ny,sp=Math.pow(Math.max(0,(nx*-.22+ny*.28+nz*.93)),4+(1-ro)*(1-ro)*160)*(1-ro)*1.3,env=.25+.75*(1/(1+Math.exp(-6*(ry+.1))))+.5*Math.exp(-Math.pow((rx+.5)*4,2));
       for(let c=0;c<3;c++){const al=Math.pow(a.data[k+c]/255,2.2);let v=me?al*(env*1.1*(1-ro*.5)+df*.35+sp*1.5):al*df+sp*.5+(1-ro)*.06*env;a.data[k+c]=255*Math.pow(Math.min(1,v),1/2.2);}}
      const x=document.createElement('canvas');x.width=o.w;x.height=o.h;x.getContext('2d').putImageData(a,0,0);const s=Math.min(1,(C-10)/Math.max(o.w,o.h)),X=(i%N)*C+C/2,Y=(i/N|0)*(C+16)+C/2;q.save();q.shadowColor='rgba(0,0,0,.6)';q.shadowBlur=8;q.shadowOffsetX=4;q.shadowOffsetY=5;q.drawImage(x,X-o.w*s/2,Y-o.h*s/2,o.w*s,o.h*s);q.restore();q.fillStyle='#fff';q.font='12px Arial';q.textAlign='center';q.fillText(id+' '+o.w+'x'+o.h,X,Y+C/2+6);});return d.toDataURL('image/png')})()`))); }
  p.fim();
} else {
  // encaixe em prateleiras, do mais alto para o mais baixo (deita o que for comprido)
  const l = info.map(o => ({ ...o, rot: 0 })).sort((a, b) => b.h - a.h); let x = 0, y = 0, alt = 0; const livres = [{ x: 0, y: 0, w: LADO, h: LADO }];
  for (const o of l) { // retângulos livres (melhor lado curto)
    let m = null; livres.forEach((r, i) => { if (r.w >= o.w && r.h >= o.h) { const s = Math.min(r.w - o.w, r.h - o.h); if (!m || s < m.s) m = { s, i, r }; } });
    if (!m) throw new Error('não coube: ' + o.id); o.x = m.r.x; o.y = m.r.y; const n = [];
    for (const r of livres) { if (o.x >= r.x + r.w || o.x + o.w <= r.x || o.y >= r.y + r.h || o.y + o.h <= r.y) { n.push(r); continue; }
      if (o.x > r.x) n.push({ x: r.x, y: r.y, w: o.x - r.x, h: r.h }); if (o.x + o.w < r.x + r.w) n.push({ x: o.x + o.w, y: r.y, w: r.x + r.w - o.x - o.w, h: r.h }); if (o.y > r.y) n.push({ x: r.x, y: r.y, w: r.w, h: o.y - r.y }); if (o.y + o.h < r.y + r.h) n.push({ x: r.x, y: o.y + o.h, w: r.w, h: r.y + r.h - o.y - o.h }); }
    livres.length = 0; for (const a of n) if (!n.some(b => b !== a && a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h && (n.indexOf(a) > n.indexOf(b) || a.w !== b.w || a.h !== b.h || a.x !== b.x || a.y !== b.y))) livres.push(a);
  }
  const lst = JSON.stringify(l.map(o => [o.id, o.x, o.y]));
  console.log('cor', grava(SAIDA + 'cor.webp', await p.av(`(()=>{const d=document.createElement('canvas');d.width=d.height=${LADO};const q=d.getContext('2d');for(const [i,x,y] of ${lst})q.drawImage(PR[i].cor,x,y);return d.toDataURL('image/webp',.86)})()`)));
  console.log('nor', grava(SAIDA + 'nor.webp', await p.av(`(()=>{const d=document.createElement('canvas');d.width=d.height=${LADO};const q=d.getContext('2d');q.fillStyle='rgb(128,128,100)';q.fillRect(0,0,${LADO},${LADO});for(const [i,x,y] of ${lst})q.drawImage(PR[i].nor,x,y);return d.toDataURL('image/webp',.9)})()`)));
  // sombra: silhueta borrada em um quarto do tamanho
  console.log('sombra', grava(SAIDA + 'sombra.webp', await p.av(`(()=>{const d=document.createElement('canvas');d.width=d.height=${LADO / 4};const q=d.getContext('2d');q.fillStyle='#000';q.fillRect(0,0,d.width,d.height);for(const [i,x,y] of ${lst}){const o=PR[i],c=document.createElement('canvas');c.width=o.w/4;c.height=o.h/4;const k=c.getContext('2d');k.filter='blur(1.7px)';k.drawImage(o.cor,0,0,o.w/4,o.h/4);k.globalCompositeOperation='source-in';k.filter='none';k.fillStyle='#fff';k.fillRect(0,0,c.width,c.height);q.drawImage(c,x/4,y/4);}return d.toDataURL('image/webp',.85)})()`)));
  const dados = info.map(o => { const q = l.find(z => z.id === o.id); return [o.id, o.nome, o.tema, q.x, q.y, o.w, o.h, o.hz, o.som]; });
  writeFileSync(RAIZ + 'ferramentas/keepsake-hunt/atlas.json', JSON.stringify(dados).replaceAll('],[', '],\n[')); console.log('atlas.json', dados.length); p.fim();
}

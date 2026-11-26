// Prova cada nível: procura (em largura) a menor sequência de giros que leva o sino à meta,
// considerando onde ele pode estar e quando ele gira junto com a peça.   node resolver.mjs
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 1280, h: 760, url: '/jogos/hushbell/index.html#manifest' }); await dorme(2500);
const n = await p.av('__hushbell.NIVEIS.length'), planos = [];
for (let i = 0; i < n; i++) {
  const r = await p.av(`(()=>{const H=__hushbell,M=H.NIVEIS[${i}].montar(),Q=Math.PI/2,membros=p=>[p,...(p.move||[])];
   const motores=M.pecas.filter(p=>!p.travada),ini=M.pecas.map(p=>p.rot),fixa=r=>{M.pecas.forEach((p,k)=>{p.rot=r[k];p.ang=r[k]*Q;p.grupo.quaternion.setFromAxisAngle(p.ev,p.ang);});M.montar();};
   const alcance=no=>{const s=new Set([no]),f=[no];while(f.length){const a=f.shift();for(const e of a.viz)if(!s.has(e.para)){s.add(e.para);f.push(e.para);}}return s;};
   fixa(ini);const inicial=M.no(M.inicio)?alcance(M.no(M.inicio)).size:0,total=M.nos.size,ilus=[];
   const visto=new Set(),fila=[[ini,M.inicio,0,[]]];
   while(fila.length){const [rots,hid,prof,hist]=fila.shift(),ch=rots+'|'+hid;if(visto.has(ch))continue;visto.add(ch);
    fixa(rots);const h=M.no(hid);if(!h){if(!prof)return {passos:-1,estados:0,inicial:0,total:M.nos.size,erro:'sem casa de saída '+hid};continue;}const R=alcance(h);
    if([...R].some(x=>x.id===M.meta)){for(const a of M.nos.values())for(const e of a.viz)if(e.k>0)ilus.push(a.id+'>'+e.para.id+' k='+e.k);return {passos:prof,hist,estados:visto.size,inicial,total,ilus};}
    const pos=R;
    for(const mot of motores){const mem=membros(mot);for(const x of pos){const monta=x.peca&&mem.includes(x.peca)?x.peca:null;if(monta&&monta.eixo!=='y')continue;
     for(const dq of [1,2,3]){fixa(rots);const livres=monta?[]:[x.rampa?[x.x,x.y,x.z]:[x.x,x.y+1,x.z]];if(!mem.every(m=>M.cabe(m,(m.rot+dq)%4,livres)))continue;
      const nr=rots.slice();mem.forEach(m=>{const k=M.pecas.indexOf(m);nr[k]=(rots[k]+dq)%4;});let nid=x.id;
      if(monta){const p2=x.centro.clone().sub(monta.centro).applyAxisAngle(monta.ev,dq*Q).add(monta.centro);fixa(nr);const m2=M.noPerto(p2);if(!m2)continue;nid=m2.id;}
      fila.push([nr,nid,prof+1,[...hist,{peca:M.pecas.indexOf(mot),dq,onde:x.id,monta:!!monta}]]);}}}}
   return {passos:-1,estados:visto.size,inicial,total};})()`);
  planos.push(r.hist);
  console.log(`nível ${i + 1}: ${r.passos < 0 ? 'SEM SOLUÇÃO' : r.passos + ' giros'} | casas ${r.total}, alcançáveis no começo ${r.inicial} | estados ${r.estados}`);
  if (r.hist) console.log('   ' + r.hist.map(h => `peça ${h.peca} +${h.dq * 90}°${h.monta ? ' com o sino' : ''}`).join(' → ') + '\n   ilusões abertas: ' + r.ilus.join(', '));
}
(await import('node:fs')).writeFileSync(new URL('./planos.json', import.meta.url), JSON.stringify(planos));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

// Confere o mapa de caminhos no navegador: ligações por ilusão na tela inicial e no nível, e se o nível só se resolve girando as peças.
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 1280, h: 760, url: '/jogos/hushbell/index.html#manifest' }); await dorme(3000);
console.log(await p.av(`(()=>{const H=__hushbell,M=H.casa,o=[];o.push('casa: '+M.nos.size+' casas');
 for(const n of M.nos.values())for(const e of n.viz)if(e.k)o.push(' ilusao '+n.id+' -> '+e.para.id+' k='+e.k);
 o.push(' torre levantada: '+M.no('c-4,7,-4').lift+' | do inicio alcanca: '+[...M.nos.values()].filter(n=>M.caminho(M.no(M.inicio),n)).length);return o.join(String.fromCharCode(10))})()`));
await p.av('__hushbell.irPara(0)'); await dorme(1800);
console.log(await p.av(`(()=>{const H=__hushbell,M=H.mundo,[e,b]=M.pecas,o=['nivel 1: '+M.nos.size+' casas'];const ini=()=>M.no(M.inicio),meta=()=>M.no(M.meta);
 const teste=(re,rb)=>{e.rot=re;b.rot=rb;M.montar();return {ate_patamar:!!M.caminho(ini(),M.no('c0,3,-2')),ate_meta:!!M.caminho(ini(),meta())}};
 for(const re of [0,1,2,3])for(const rb of [0,1,2,3])o.push(' escada '+re+' ponte '+rb+' cabe '+M.cabe(e,re)+'/'+M.cabe(b,rb)+' '+JSON.stringify(teste(re,rb)));
 e.rot=0;b.rot=0;M.montar();for(const n of M.nos.values())for(const x of n.viz)if(x.k)o.push(' ilusao '+n.id+' -> '+x.para.id+' k='+x.k);e.rot=1;b.rot=1;M.montar();return o.join(String.fromCharCode(10))})()`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

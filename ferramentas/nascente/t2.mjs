// Confere que a solução vale seja qual for a posição das distrações (sem saída = tudo certo).
import { regras } from './resolvedor.mjs';
const N=regras(undefined,{doJogo:true});
// peças fora do caminho que importam: sorteia as distrações e confere se a solução continua valendo
let s=5;const al=()=>(s=(s*16807)%2147483647)/2147483647;
for(let i=0;i<100;i++)for(const d of [0,1,2]){const F=N.lerFase(i,d);const cam=new Set(F.caminho.map(c=>c.unidade));let ruim=0;
 for(let k=0;k<200;k++){for(const u of F.unidades){const ps=N.passosDe(u.membros[0]);const q=cam.has(u)||u.membros[0].fixa?0:ps[al()*ps.length|0];for(const m of u.membros)m.giro=N.giroMais(m,q);}N.correr(F);if(!N.venceu(F))ruim++;}
 if(ruim)console.log(i+1,d,ruim);}

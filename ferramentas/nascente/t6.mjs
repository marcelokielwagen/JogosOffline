// Robô: em cada fase e dificuldade, gira peças ao acaso, confere se a água assenta igual às regras, conclui com a solução e também só com dicas.
// node t6.mjs [de] [ate] [giros por fase]
import { abrir } from './nav.mjs';
const [de, ate, voltas] = [+process.argv[2] || 1, +process.argv[3] || 100, +process.argv[4] || 4];
const p = await abrir({ w: 640, h: 420, url: '/jogos/nascente/index.html#semescolha' }); let tot = 0, erros = 0, conc = 0;
for (let f = de - 1; f < ate; f++) for (const dif of [0, 1, 2]) {
  const r = await p.av(`(async()=>{
  const N=__nascente, R=N.R; R.render=()=>{}; let s=${f * 7 + dif + 7}; const al=()=>(s=(s*16807)%2147483647)/2147483647;
  N.salvo.dif=${dif}; N.salvo.andamento={}; N.montar(${f}); N.J.estado='jogando'; N.J.fim=false; let e=0,t=0;
  const passa=(seg,trava)=>{ for(let k=0;k<seg;k+=.04){ if(trava)N.J.surgir=0; N.passo(.04); } };
  const M=N.J.F.celulas.filter(c=>!c.fixa);
  for(let v=0;v<${voltas};v++){ for(let k=0;k<7;k++){ N.girar(M[al()*M.length|0], al()<.3?-1:1); if(al()<.5)passa(al()*.8,1); } if(v%3===2)N.desfazer(); passa(30,1);
    for(const c of N.J.F.celulas)for(const n of c.nos){ t++; if(!!n.alcance!==(n.cheio>=1&&n.nivel>.9))e++; } }
  // dicas até o fim
  let d=0; while(!N.J.F.unidades.every(u=>N.unidadeCerta(u))&&d++<400){ passa(.8,1); if(${dif}===2){ N.pedirDica(); const a=N.J.dica&&N.J.dica.c; if(!a)break; let g=0; while(!N.unidadeCerta(a.unidade)&&g++<4){N.girar(a);passa(.8,1);} } else { N.pedirDica(); if(!N.J.dica)break; passa(.1,1); N.pedirDica(); } }
  N.J.surgir=1; let q=0; while(N.J.estado==='jogando'&&q<60){N.passo(.04);q+=.04;}
  const ok1=N.J.estado==='florido'; N.J.estado='jogando'; N.J.fim=false; N.salvo.andamento={}; N.montar(${f}); N.J.surgir=1; N.resolver(); q=0; while(N.J.estado==='jogando'&&q<60){N.passo(.04);q+=.04;}
  const ok2=N.J.estado==='florido'; N.J.estado='carregando'; return [t,e,ok1,ok2,d];
  })()`);
  tot += r[0]; erros += r[1]; if (r[2] && r[3]) conc++; if (r[1] || !r[2] || !r[3]) console.log('fase', f + 1, 'dif', dif, 'erros', r[1], 'com dicas', r[2], 'com solução', r[3], 'dicas', r[4]);
}
console.log(`fases ${de}-${ate}: conferências ${tot}, erros ${erros}, concluídas ${conc} de ${(ate - de + 1) * 3}`, [...new Set(p.erros)].slice(0, 3).join('\n')); p.fim();

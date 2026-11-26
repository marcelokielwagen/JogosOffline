// Piloto de drift: corre as 5 pistas no modo drift usando o freio de mão nas curvas; mostra pontos, tempo e uma foto no meio do drift.
//   node drift.mjs [pasta-das-fotos]
import { abrir, dorme } from '../nascente/nav.mjs';
const pasta = process.argv[2], p = await abrir({ w: 1280, h: 760, url: '/jogos/dustline/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const D = x => p.av(`(()=>{const D=__dustline;return ${x}})()`), espera = async (c, s = 10) => { for (let i = 0; i < s * 10; i++) { if (await D(c)) return true; await dorme(100); } return false; };
await dorme(3000); await p.av(`localStorage.clear();document.querySelector('[data-modo=drift]').click()`);
const PILOTO = `(seg,parar)=>{const D=__dustline,F=D.F,M=D.mundo,P=M.pontos,T=D.teclas;let mao=0,der=0;
 for(let n=0;n<seg*60&&D.estado!=='fim';n++){const e=M.perto(F.x,F.z),i=Math.min(P.length-1,(e?e.i:0)+Math.round(9+Math.abs(F.vf)*.55)),q=P[i];
  let d=Math.atan2(q.x-F.x,q.z-F.z)-Math.atan2(Math.sin(F.psi),Math.cos(F.psi));d-=Math.round(d/6.2832)*6.2832;T.clear();
  if(!F.deriva&&Math.abs(d)>.22&&F.s>13&&mao<=0)mao=12;if(mao-->0)T.add('mao');
  T.add((!F.deriva&&Math.abs(d)>.4&&F.s>16)||(F.deriva&&Math.abs(d)>.55&&F.s>13)?'freio':'gas');if(d>.05)T.add('esq');if(d<-.05)T.add('dir');
  D.passo(1/60);if(F.deriva)der++;if(parar&&D.drift.ativa&&D.drift.mult>=3)break;}T.clear();return {estado:D.estado,tempo:+D.relogio.toFixed(1),pontos:D.drift.total,maior:D.drift.melhor,drift:+(der/60).toFixed(1)}}`;
for (let i = 0; i < 5; i++) {
  await D(`D.comecar(${i})`); await espera(`D.estado==='correndo'`, 8);
  if (pasta && i < 3) { await p.av(`(${PILOTO})(60,true)`); await dorme(120); await p.foto(`${pasta}/drift${i + 1}.png`); }
  const r = await p.av(`(${PILOTO})(240)`); ok(`pista ${i + 1}`, r.estado === 'fim', JSON.stringify(r));
  await dorme(1800); if (pasta && i === 0) await p.foto(`${pasta}/fimdrift.png`);
}
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

// Som no celular: 1) libera com o toque? 2) dá para ouvir num alto-falante pequeno (faixa 500-8000 Hz)?   node t11.mjs [volume]
import { abrir, dorme } from './nav.mjs';
const vol = +process.argv[2] || 70, p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/jogos/nascente/index.html#semescolha' });
await p.av(`__nascente.salvo.volume=${vol}`);
const est = () => p.av('__nascente.Som.estado'); console.log('antes do toque:', await est());
for (let i = 1; i <= 3; i++) { await p.toque(195, 800); await dorme(500); console.log('depois do toque', i + ':', await est()); }
const r = await p.av(`(async()=>{const N=__nascente,S=N.Som,c=S.contexto; if(!c||c.state!=='running')return 'PARADO';
  const fim=S.final||S.saida, an=f=>{const a=c.createAnalyser();a.fftSize=32768;let n=fim;for(const [t,q] of f){const b=c.createBiquadFilter();b.type=t;b.frequency.value=q;n.connect(b);n=b;}n.connect(a);return a;};
  const tudo=an([]), fala=an([['highpass',500],['highpass',500],['lowpass',8000]]), d=new Float32Array(32768), o={};
  const mede=async(nome,f,seg=1.2)=>{f&&f();let sa=0,pa=0,sb=0,k=0;const fim=performance.now()+seg*1000;while(performance.now()<fim){await new Promise(r=>setTimeout(r,400));tudo.getFloatTimeDomainData(d);for(const x of d){sa+=x*x;pa=Math.max(pa,Math.abs(x));}fala.getFloatTimeDomainData(d);for(const x of d)sb+=x*x;k+=d.length;}
    const db=x=>+(10*Math.log10(x/k+1e-12)).toFixed(1);o[nome]={total:db(sa),celular:db(sb),pico:+pa.toFixed(3)};};
  await new Promise(r=>setTimeout(r,1500));
  await mede('ambiente',null,4);await mede('raspar',S.raspar);await mede('assentar',S.assentar);await mede('gota',()=>S.gota(1));await mede('chegou',()=>S.chegou(0),2);await mede('acorde',S.acorde,6);return o;})()`);
console.log(r); console.log('erros:', [...new Set(p.erros)].slice(0, 3).join('\n') || 'nenhum'); p.fim();

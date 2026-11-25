// Mede o som do Zen: pico, faixa que o celular reproduz (500-8000 Hz), mudo e vazamento de vozes.   node som.mjs [pc]
import { abrir, dorme } from '../nascente/nav.mjs';
const movel = process.argv[2] !== 'pc', p = await abrir({ w: movel ? 390 : 1280, h: 844, movel, url: '/ferramentas/zen/ouvir.html#manifest' });
await dorme(600); console.log('antes do gesto:', await p.av('Zen.Audio.estado'));
movel ? await p.toque(195, 60) : await p.clique(640, 60); await dorme(700);
console.log('depois:', await p.av('Zen.Audio.estado'), '| celular:', await p.av('Zen.Audio.pequeno'));
const r = await p.av(`(async()=>{const S=Zen.Audio,c=S.contexto,fim=S.saida,espera=ms=>new Promise(r=>setTimeout(r,ms));
 const an=f=>{const a=c.createAnalyser();a.fftSize=16384;let n=fim;for(const[t,q]of f){const b=c.createBiquadFilter();b.type=t;b.frequency.value=q;n.connect(b);n=b}n.connect(a);return a};
 const A=an([]),B=an([['highpass',500],['highpass',500],['lowpass',8000]]),d=new Float32Array(16384),o={};
 const mede=async(nome,f,seg)=>{f&&f();let sa=0,sb=0,pico=0,k=0,nan=0;const ate=performance.now()+seg*1000;while(performance.now()<ate){await espera(250);A.getFloatTimeDomainData(d);for(const x of d){if(!(x===x))nan++;sa+=x*x;pico=Math.max(pico,Math.abs(x))}B.getFloatTimeDomainData(d);for(const x of d)sb+=x*x;k+=d.length}
  const db=x=>+(10*Math.log10(x/k+1e-12)).toFixed(1);o[nome]={total:db(sa),celular:db(sb),pico:+pico.toFixed(3),...(nan?{nan}:{})}};
 await espera(9000);await mede('musica menu',0,6);S.cena('loop',1);await espera(8000);await mede('musica loop',0,6);
 await mede('girar',()=>S.girar(.5,.5,1),.8);await mede('girar rapido x12',()=>{for(let i=0;i<12;i++)setTimeout(()=>S.girar(i/12,i%3/2,i%4),i*70)},1.5);await mede('encaixar',()=>S.encaixar(),.8);await mede('fechar',()=>S.fechar(),3);
 S.cena('okay',12);await espera(8000);await mede('musica okay',0,6);await mede('soltar',()=>S.soltar(1),.6);await mede('lancamento 20',()=>{for(let i=0;i<20;i++)setTimeout(()=>S.ricochete(i,['alvo','alvo','parede','barreira'][i%4],1),i*120)},2.6);await mede('limpar',()=>S.limpar(9),3);await mede('quase',()=>S.quase(),1.2);
 await espera(5000);o.vozesPresas=S.vozes;S.ajustar({mudo:true});await espera(2000);o.mudo=[S.estado,+S.mestre.gain.value.toFixed(4)];S.ajustar({mudo:false});await espera(1500);o.volta=[S.estado,+S.mestre.gain.value.toFixed(2)];return o})()`);
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(18), JSON.stringify(v)); console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

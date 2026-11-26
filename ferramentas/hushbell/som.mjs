// Som: liga com o gesto? nível total e na faixa do alto-falante do celular (500-8000 Hz), pico, vozes presas, mudo.   node som.mjs [pc]
import { abrir, dorme } from '../nascente/nav.mjs';
const movel = process.argv[2] !== 'pc', p = await abrir({ w: movel ? 390 : 1280, h: 844, movel, url: '/jogos/hushbell/index.html#manifest' });
await dorme(1500); console.log('antes do gesto:', await p.av('__hushbell.Som.estado')); movel ? await p.toque(195, 700) : await p.clique(640, 700); await dorme(900);
console.log('depois:', await p.av('__hushbell.Som.estado'), '| celular:', await p.av('__hushbell.Som.pequeno'));
const r = await p.av(`(async()=>{const S=__hushbell.Som,c=S.contexto,fim=S.saida,espera=ms=>new Promise(r=>setTimeout(r,ms));
 const an=f=>{const a=c.createAnalyser();a.fftSize=16384;let n=fim;for(const[t,q]of f){const b=c.createBiquadFilter();b.type=t;b.frequency.value=q;n.connect(b);n=b}n.connect(a);return a};
 const A=an([]),B=an([['highpass',500],['highpass',500],['lowpass',8000]]),H=an([['highpass',5000],['highpass',5000]]),d=new Float32Array(16384),o={};
 const mede=async(nome,f,seg)=>{f&&f();let s=[0,0,0],pico=0,k=0,nan=0;const ate=performance.now()+seg*1000;while(performance.now()<ate){await espera(250);[A,B,H].forEach((a,i)=>{a.getFloatTimeDomainData(d);for(const x of d){if(x!==x)nan++;s[i]+=x*x;if(!i)pico=Math.max(pico,Math.abs(x))}});k+=d.length}
  const db=x=>+(10*Math.log10(x/k+1e-12)).toFixed(1);o[nome]={total:db(s[0]),celular:db(s[1]),agudo:db(s[2]),pico:+pico.toFixed(3),...(nan?{nan}:{})}};
 await espera(7000);for(const h of ['entardecer','alvorada','crepusculo','luar']){S.mudarHora(h);await espera(9000);await mede('musica '+h,0,10);}
 S.mudarHora('entardecer');await espera(3000);
 for(const [n,f,s] of [['pedra',()=>S.pedra(4,0),1.2],['pedra x10',()=>{for(let i=0;i<10;i++)setTimeout(()=>S.pedra(i,0),i*90)},1.8],['agua',()=>S.agua(0),1],['folha',()=>S.folha(0),1],['personagem',()=>S.personagem(),1],['sino grande',()=>S.sinoGrande(),2.5],['sininho',()=>S.sininho(1,0),1.2],['passo',()=>S.passo(3),.8],['girar',()=>S.girar(3),1],['encaixe',()=>S.encaixe(),1.5],['ilusao',()=>S.ilusao(),1.5],['chegada',()=>S.chegada(),3],['viagem',()=>S.viagem(),3],['nao',()=>S.nao(),.8]])await mede(n,f,s);
 S.ajustar(0);await espera(1500);await mede('mudo',0,.8);S.ajustar(1);await espera(6000);o.vozes=S.vozes;return o})()`);
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(18), JSON.stringify(v)); console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

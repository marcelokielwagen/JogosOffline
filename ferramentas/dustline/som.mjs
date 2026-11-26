// Mede o som do Dustline: música de cada hora, motor parado e em alta, cascalho com derrapagem, mudo.   node som.mjs [pc]
import { abrir, dorme } from '../nascente/nav.mjs';
const movel = process.argv[2] !== 'pc', p = await abrir({ w: movel ? 390 : 1280, h: 844, movel, url: '/jogos/dustline/index.html#manifest' });
await dorme(2500); movel ? await p.toque(195, 400) : await p.clique(640, 400); await dorme(700); console.log('som:', await p.av('__dustline.Som.estado'), '| celular:', await p.av('__dustline.Som.pequeno'));
const r = await p.av(`(async()=>{const D=__dustline,S=D.Som,c=S.contexto,fim=S.saida,espera=ms=>new Promise(r=>setTimeout(r,ms));
 const an=f=>{const a=c.createAnalyser();a.fftSize=16384;let n=fim;for(const[t,q]of f){const b=c.createBiquadFilter();b.type=t;b.frequency.value=q;n.connect(b);n=b}n.connect(a);return a};
 const A=an([]),B=an([['highpass',500],['highpass',500],['lowpass',8000]]),Hh=an([['highpass',5000],['highpass',5000]]),d=new Float32Array(16384),o={};
 const mede=async(nome,seg,x)=>{if(typeof seg==='function'){seg();seg=x}let s=[0,0,0],pico=0,k=0;const ate=performance.now()+seg*1000;while(performance.now()<ate){await espera(250);[A,B,Hh].forEach((a,i)=>{a.getFloatTimeDomainData(d);for(const x of d){s[i]+=x*x;if(!i)pico=Math.max(pico,Math.abs(x))}});k+=d.length}
  const db=x=>+(10*Math.log10(x/k+1e-12)).toFixed(1);o[nome]={total:db(s[0]),celular:db(s[1]),agudo:db(s[2]),pico:+pico.toFixed(3)}};
 const carro=x=>{clearInterval(window.__i);window.__i=setInterval(()=>S.carro(x),30)};
 carro({rpm:.2,carga:0,vel:0,derrapa:0,superficie:1});await espera(14000);await mede('musica manha + motor parado',16);
 S.mudarHora('tarde');await espera(6000);await mede('musica tarde',12);
 carro({rpm:.9,carga:1,vel:28,derrapa:0,superficie:1});await espera(1000);await mede('motor alto na estrada',4);
 carro({rpm:.8,carga:.6,vel:22,derrapa:8,superficie:0});await espera(1000);await mede('derrapando na grama',4);
 clearInterval(window.__i);carro({rpm:.2,carga:0,vel:0,derrapa:0,superficie:1});S.contagem(3);await mede('contagem 3',1);S.contagem(0);await mede('largada',1.2);S.marco();await mede('marco',1.2);S.chegada(true);await mede('chegada com recorde',2.5);S.batida(14);await mede('batida forte',.8);
 S.ajustar(0);await espera(1500);await mede('mudo',1);return o})()`);
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(28), JSON.stringify(v)); console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

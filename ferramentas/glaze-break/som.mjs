// Glaze Break: mede os sons (total, faixa que o alto-falante do celular toca e pico) e compara com o som de fundo.   node som.mjs [--pc]
// "celular" = só a faixa de 500 a 8000 Hz, que é o que um alto-falante pequeno consegue tocar.
import { abrir, dorme } from './nav.mjs';
const pc = process.argv.includes('--pc'), p = await abrir({ w: pc ? 1280 : 390, h: 844, movel: !pc, dpr: 1 });
console.log('antes do toque:', await p.av('__glaze.Som.estado')); if (pc) await p.clique(5, 5); else await p.toque(195, 20); await dorme(400); console.log('depois:', await p.av('__glaze.Som.estado'), 'celular:', await p.av('__glaze.Som.pequeno'));
await p.av('__glaze.Jogo.comecar(1).then(()=>1)'); await dorme(2500);
const r = await p.av(`(async()=>{const S=__glaze.Som,c=S.contexto,an=f=>{const a=c.createAnalyser();a.fftSize=32768;let n=S.final;for(const [t,q] of f){const b=c.createBiquadFilter();b.type=t;b.frequency.value=q;n.connect(b);n=b;}n.connect(a);return a;},tudo=an([]),fala=an([['highpass',500],['highpass',500],['lowpass',8000]]),d=new Float32Array(32768),o={};
 const mede=async(nome,f,ms=560)=>{f();await new Promise(r=>setTimeout(r,ms));let a=0,b=0,k=0;tudo.getFloatTimeDomainData(d);for(const x of d){a+=x*x;k=Math.max(k,Math.abs(x));}fala.getFloatTimeDomainData(d);for(const x of d)b+=x*x;const db=x=>+(10*Math.log10(x/d.length+1e-12)).toFixed(1);o[nome]={total:db(a),celular:db(b),pico:+k.toFixed(3)};await new Promise(r=>setTimeout(r,650));};
 for(let l=0;l<5;l++){S.lugar(l);await new Promise(r=>setTimeout(r,2200));const m=[];for(let k=0;k<4;k++){await mede('x',()=>{},900);m.push(o.x);}delete o.x;m.sort((a,b)=>a.celular-b.celular);o['fundo '+l]=m[1];o['fundo '+l+' (pior)']=m[3];}S.lugar(0);
 await mede('botao',()=>S.botao());await mede('lanca',()=>S.lanca());await mede('raquete meio',()=>S.raquete(0));await mede('raquete ponta',()=>S.raquete(.9));await mede('parede',()=>S.parede(false));await mede('teto',()=>S.parede(true));
 for(let k=0;k<4;k++)await mede('azulejo cor '+k,()=>S.azulejo(k,0,0));for(const v of[2,5,9])await mede('veio '+v,()=>S.azulejo(1,v,0));
 await mede('biscoito',()=>S.biscoito(0));await mede('racha',()=>S.racha(0));await mede('ferro',()=>S.ferro(0));await mede('jarro',()=>S.jarro(0),700);await mede('cor',()=>S.cor(2));await mede('item',()=>S.item());await mede('item cai',()=>S.itemCai());
 await mede('caiu',()=>S.caiu(),700);await mede('aviso',()=>S.aviso(1),900);await mede('estrela',()=>S.estrela(1));await mede('vitoria',()=>S.vitoria(),900);await mede('derrota',()=>S.derrota(),900);
 await mede('veio rapido',()=>{for(let j=0;j<8;j++)setTimeout(()=>S.azulejo(2,j+1,0),j*30);},500);await mede('tudo junto',()=>{for(let j=0;j<5;j++){S.jarro(0);S.ferro(0);S.azulejo(0,6,0);S.vitoria();S.caiu();}},500);return o;})()`);
console.table(r);
// cada som do jogo precisa ficar acima do fundo mais alto na faixa do celular, sem estourar
const fundo = Math.max(...Object.entries(r).filter(([k]) => k.startsWith('fundo') && !k.includes('pior')).map(([, v]) => v.celular));   // mediana de 4 medidas por lugar
let ruins = 0;
for (const [k, v] of Object.entries(r)) { if (k.startsWith('fundo')) continue; const folga = v.celular - fundo; if (folga < 6 || v.pico > .98) { ruins++; console.log('ATENÇÃO', k, 'folga', folga.toFixed(1), 'dB', 'pico', v.pico); } }
console.log(`fundo mais alto (celular): ${fundo} dB | sons abaixo de 6 dB de folga ou estourando: ${ruins} | erros`, p.erros.slice(0, 3)); p.fim();

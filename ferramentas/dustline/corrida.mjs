// Um piloto automático corre as 5 pistas (tempo de jogo acelerado): passa pelos 4 marcos, chega, grava o melhor tempo.
// Também confere o passeio livre (volta ao começo no fim) e o "voltar para a estrada".   node corrida.mjs
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 1000, h: 640, url: '/jogos/dustline/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const D = x => p.av(`(()=>{const D=__dustline;return ${x}})()`), espera = async (c, s = 10) => { for (let i = 0; i < s * 10; i++) { if (await D(c)) return true; await dorme(100); } return false; };
await dorme(3000); await p.av(`localStorage.removeItem('dustline.v1');__dustline.salvo.melhores={}`);
const PILOTO = `(seg)=>{const D=__dustline,F=D.F,M=D.mundo,P=M.pontos,T=D.teclas;let bat=0,max=0;
 for(let n=0;n<seg*60&&D.estado!=='fim';n++){const e=M.perto(F.x,F.z),i=Math.min(P.length-1,(e?e.i:0)+Math.round(10+Math.abs(F.vf)*.6)),q=P[i];
  let d=Math.atan2(q.x-F.x,q.z-F.z)-F.rumo;d-=Math.round(d/6.2832)*6.2832;T.clear();T.add(Math.abs(d)>.32&&Math.abs(F.vf)>13*D.mundo.E.grip?'freio':'gas');if(d>.06)T.add('esq');if(d<-.06)T.add('dir');
  D.passo(1/60);if(F.batida)bat++;max=Math.max(max,Math.abs(F.vf));}T.clear();return {estado:D.estado,tempo:+D.relogio.toFixed(1),marcos:D.proxMarco,batidas:bat,vmax:+max.toFixed(1)}}`;
for (let i = 0; i < 5; i++) {
  await D(`D.comecar(${i})`); ok(`pista ${i + 1}: contagem`, await espera(`D.estado==='contagem'`, 6)); ok('  largada', await espera(`D.estado==='correndo'`, 6));
  const r = await p.av(`(${PILOTO})(240)`); ok(`  chegou (${await D(`D.ETAPAS[${i}].nome`)})`, r.estado === "fim" && r.marcos === 6, JSON.stringify(r));
  ok('  melhor tempo gravado', Math.abs((await p.av(`JSON.parse(localStorage.getItem('dustline.v1')).melhores[__dustline.ETAPAS[${i}].id]`)) - r.tempo) < .2);
  await dorme(1800); ok('  cartão do fim aparece', await p.av(`!document.getElementById('fim').hidden`));
}
await D(`D.irInicio()`); await espera(`D.estado==='inicio'`, 4); ok('lista mostra os melhores tempos', /melhor 0:|melhor 1:/.test(await p.av(`document.getElementById('pistas').innerText`)));
// passeio livre
await p.av(`document.querySelector('[data-modo=livre]').click()`); await D(`D.comecar(2)`); ok('passeio livre começa sem relógio', await espera(`D.estado==='livre'`, 6) && await p.av(`document.getElementById('relogio').textContent===''`));
await p.av(`(${PILOTO.replace("D.estado!=='fim'", "D.estado==='livre'")})(240)`); ok('no fim da estrada volta ao começo', await espera(`D.estado==='livre'&&D.mundo.perto(D.F.x,D.F.z).i<20`, 4));
// longe da estrada: volta sozinho
await p.av(`(()=>{const D=__dustline,F=D.F;F.x+=60;F.z+=60;for(let n=0;n<60*7;n++)D.passo(1/60);})()`); await dorme(900); ok('longe da estrada volta sozinho', await D(`(D.mundo.perto(D.F.x,D.F.z)||{d:99}).d<4`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

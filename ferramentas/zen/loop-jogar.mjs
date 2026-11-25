// Joga o Loop Zen de verdade no navegador (toque, mouse e teclado), mede a fluidez e tira fotos.   node loop-jogar.mjs <pasta>
import { abrir, dorme } from '../nascente/nav.mjs';
const S = process.argv[2], p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/ferramentas/zen/jogar-loop.html?dif=facil&fase=1#manifest' });
setTimeout(() => { console.log('TEMPO ESGOTADO'); p.fim(); }, 170000).unref();
const ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x), info = () => p.av('J.info');
const fase = async (dif, f, tema = 'noite') => { await p.av(`document.getElementById('dif').value='${dif}';document.getElementById('fase').value=${f};document.getElementById('tema').value='${tema}';abrir()`); await dorme(1900); };
// giros que faltam em cada peça, com o lugar dela na tela
const falta = () => p.av(`J.teste.P.filter(q=>q.tipo!=='ponte').map(q=>{const c=J.teste.centro(q),n=q.tipo==='curva'?4:2;return {x:c.x,y:c.y,n:(((q.certo-q.giro)%n)+n)%n}}).filter(q=>q.n)`);
async function resolver(toque, pausa = 25, deixa = 0) { const L = await falta(); let total = L.reduce((s, q) => s + q.n, 0), feitos = 0; for (const q of L) for (let k = 0; k < q.n; k++) { if (total - feitos <= deixa) return feitos; await toque(q.x, q.y); feitos++; if (pausa) await dorme(pausa); } return feitos; }
await dorme(1500);
// 1) toque no celular, uma fase de cada dificuldade
for (const [dif, f] of [['facil', 1], ['medio', 25], ['dificil', 50]]) {
  await fase(dif, f); await p.foto(`${S}/loop-${dif}-ini.png`);
  const i0 = await info(), n = await resolver(p.toque, 5, 3); await dorme(700); await p.foto(`${S}/loop-${dif}-meio.png`);
  const t = await resolver(p.toque, 5); await dorme(1100); await p.foto(`${S}/loop-${dif}-luz.png`); await dorme(2600);
  const i1 = await info(); ok(`toque, ${dif} ${f}: ${i0.pontas} pontas, ${n + t} giros`, i1.venceu && i1.pontas === 0 && i1.giros === n + t && !(await p.av(`document.getElementById('fim').hidden`)), JSON.stringify(i1));
  if (dif === 'medio') await p.foto(`${S}/loop-fim.png`);
  const g = i1.giros; await p.toque(195, 400); ok('não gira depois de vencer', (await info()).giros === g);
}
// 2) parado não gasta bateria
await p.av('ref()'); await dorme(2500); ok('parado, não redesenha', (await p.av('window.mexe')) === false);
// 3) mouse: esquerdo e direito se desfazem
await fase('facil', 12); const q = (await p.av(`(()=>{const q=J.teste.P.find(q=>q.tipo==='curva'),c=J.teste.centro(q);return [c.x,c.y,q.giro]})()`));
await p.clique(q[0], q[1]); await p.clique(q[0], q[1], 'right'); ok('botão direito gira ao contrário', await p.av(`J.teste.P.find(q=>q.tipo==='curva').giro`) === q[2] && (await info()).giros === 2);
// 4) toques muito rápidos: nenhum se perde
for (let k = 0; k < 9; k++) await p.toque(q[0], q[1]); ok('9 toques seguidos contam', (await info()).giros === 11); await dorme(900); ok('ângulo final bate com a peça', await p.av(`J.teste.P.every(q=>q.ang===q.giro)`));
// 5) dois dedos ao mesmo tempo
const pos = await p.av(`J.teste.P.slice(0,2).map(q=>J.teste.centro(q))`); await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pos.map((c, id) => ({ ...c, id })) }); await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); ok('dois dedos giram duas peças', (await info()).giros === 13);
// 6) guardar e continuar
ok('andamento salvo volta igual', await p.av(`(()=>{const g=J.guardar(),c=document.createElement('canvas'),K=Zen.jogos.loop.criar(c,{dif:'facil',fase:12,cores:cores(),andamento:JSON.parse(JSON.stringify(g))});return JSON.stringify(K.guardar())===JSON.stringify(g)&&K.info.giros===13})()`));
ok('andamento estragado não quebra', await p.av(`[{g:[1],n:2},{},{g:'x'},{g:Array(99).fill(null)}].every(a=>Zen.jogos.loop.criar(document.createElement('canvas'),{dif:'facil',fase:12,cores:cores(),andamento:a}).info.giros===0)`));
// 7) teclado no computador, tela larga
await p.cmd('Emulation.setTouchEmulationEnabled', { enabled: false }); await p.vp(1280, 760); await fase('dificil', 33, 'pastel'); const tecla = async k => { for (const type of ['keyDown', 'keyUp']) await p.cmd('Input.dispatchKeyEvent', { type, key: k }); };
for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'Enter']) await tecla(k); ok('teclado gira', (await info()).giros <= 1 && await p.av('J.teste.deitado')); await dorme(500); await p.foto(`${S}/loop-pc.png`);
const tot = await p.av(`(()=>{let pior=1e9;return new Promise(r=>{const D=[];let a=performance.now();let n=0;const L=J.teste.P.filter(q=>q.tipo!=='ponte');const f=t=>{D.push(t-a);a=t;for(let k=0;k<3;k++)J.teste.girarPeca(L[(n+k*7)%L.length]);if(++n<120&&!J.info.venceu)requestAnimationFrame(f);else{D.sort((x,y)=>x-y);r([D[D.length>>1].toFixed(1),D[D.length*.95|0].toFixed(1)])}};requestAnimationFrame(f)})})()`); console.log('     girando 3 peças por quadro, ms por quadro (metade / 95%):', tot.join(' / '));
console.log('     custo de desenhar um quadro na maior fase (celular 3x):', await (async () => { await p.vp(390, 844, true, 3); await fase('dificil', 50); return p.av(`(()=>{const t=performance.now();for(let k=0;k<60;k++){J.cores(C0);J.quadro(.016)}return ((performance.now()-t)/60).toFixed(2)+' ms'})()`.replace('C0', 'window.C0||(window.C0=cores())')); })());
await p.vp(844, 390, true, 2); await fase('dificil', 42); await p.foto(`${S}/loop-deitado.png`); console.log('     peça no celular deitado:', await p.av('J.teste.lado.toFixed(0)'), 'px');
await p.vp(360, 640, true, 2); await fase('dificil', 50, 'pastel'); await p.foto(`${S}/loop-pequeno.png`); console.log('     peça no celular pequeno (360x640), maior fase:', await p.av('J.teste.lado.toFixed(0)'), 'px');
ok('sem erros', !p.erros.length, p.erros[0] || ''); p.fim();

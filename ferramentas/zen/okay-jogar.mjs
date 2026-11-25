// Joga o Ricochet Zen no navegador com o dedo simulado, mede a fluidez e tira fotos.   node okay-jogar.mjs <pasta>
import { abrir, dorme } from '../nascente/nav.mjs';
const S = process.argv[2], p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/ferramentas/zen/jogar-okay.html#manifest' });
setTimeout(() => { console.log('TEMPO ESGOTADO'); p.fim(); }, 230000).unref();
const ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x), info = () => p.av('J.info');
const fase = async (dif, f, tema = 'noite') => { await p.av(`document.getElementById('dif').value='${dif}';document.getElementById('fase').value=${f};document.getElementById('tema').value='${tema}';abrir()`); await dorme(1900); };
const toc = (type, pts) => p.cmd('Input.dispatchTouchEvent', { type, touchPoints: pts });
// puxa no sentido contrário ao da mira (em tela) e solta. graus: erro de mira; parar: foto antes de soltar
async function estilingue(graus = 0, dist = 150, parar = '') {
  const v = await p.av(`(()=>{const T=J.teste,[a,b]=T.tela(0,0),[c,d]=T.tela(T.F.mira[0],T.F.mira[1]);const m=Math.hypot(c-a,d-b);return [(c-a)/m,(d-b)/m]})()`), k = graus * Math.PI / 180, dx = -(v[0] * Math.cos(k) - v[1] * Math.sin(k)), dy = -(v[0] * Math.sin(k) + v[1] * Math.cos(k));
  const x0 = await p.av('innerWidth/2') - dx * dist / 2, y0 = await p.av('innerHeight/2') - dy * dist / 2;
  await toc('touchStart', [{ x: x0, y: y0 }]); for (let i = 1; i <= 8; i++) { await toc('touchMove', [{ x: x0 + dx * dist * i / 8, y: y0 + dy * dist * i / 8 }]); await dorme(16); }
  if (parar) { await dorme(250); await p.foto(`${S}/${parar}.png`); }
  await toc('touchEnd', []);
}
const espera = async (cond, ms = 9000) => { for (let t = 0; t < ms; t += 100) { if (await p.av(cond)) return true; await dorme(100); } return false; };
await dorme(1500);
// 1) fases de cada nível, resolvidas com o dedo
let certas = 0, tot = 0;
for (const dif of ['facil', 'medio', 'dificil']) for (const f of [1, 8, 15, 22, 36, 50]) {
  await fase(dif, f); tot++; const foto = f === 22 || f === 50;
  await estilingue(0, 160, foto ? `okay-${dif}-${f}-mira` : '');
  if (foto) { await dorme(dif === 'facil' ? 750 : 1100); await p.foto(`${S}/okay-${dif}-${f}-voo.png`); }
  if (await espera('J.info.venceu')) certas++; else console.log('     não limpou', dif, f, JSON.stringify(await info()));
  if (f === 50) { await dorme(700); await p.foto(`${S}/okay-${dif}-luz.png`); await dorme(1400); await p.foto(`${S}/okay-${dif}-fim.png`); ok('painel de fim aparece', !(await p.av(`document.getElementById('fim').hidden`)) && (await info()).lancamentos === 1); }
}
ok(`resolvidas com o dedo: ${certas} de ${tot}`, certas === tot);
// 2) errar: volta sozinho, formas reaparecem, conta o lançamento e mostra o caminho anterior
await fase('medio', 22); await estilingue(140, 160); ok('voando', (await info()).estado === 'voo'); ok('errou e voltou', await espera(`J.info.estado==='mira'`));
{ const i = await info(); ok('formas de volta, 1 lançamento', i.restam === i.total && i.lancamentos === 1); } await dorme(900); await p.foto(`${S}/okay-errou.png`); ok('parado, não redesenha', (await p.av('window.mexe')) === false);
// 3) puxada curta cancela; voltar o dedo ao começo também
await estilingue(0, 15); ok('puxada curta não lança', (await info()).lancamentos === 1);
await toc('touchStart', [{ x: 200, y: 500 }]); await toc('touchMove', [{ x: 200, y: 640 }]); await toc('touchMove', [{ x: 203, y: 506 }]); await toc('touchEnd', []); ok('voltar o dedo cancela', (await info()).lancamentos === 1);
// 4) segundo dedo não atrapalha; toque durante o voo encerra
await toc('touchStart', [{ x: 200, y: 500, id: 1 }]); await toc('touchMove', [{ x: 200, y: 620, id: 1 }]); await toc('touchStart', [{ x: 200, y: 620, id: 1 }, { x: 60, y: 300, id: 2 }]); ok('segundo dedo é ignorado', await p.av('!!J.teste.mira')); await toc('touchCancel', []); await dorme(300); ok('gesto interrompido pelo aparelho não lança', (await info()).lancamentos === 1);
await p.av(`J.refazer()`); await dorme(500); await estilingue(90, 160); await dorme(650); { const antes = (await info()).estado; if (antes === 'voo') { await p.toque(200, 500); await dorme(100); } ok('tocar no voo encerra o lançamento', ['volta', 'mira'].includes((await info()).estado), antes); } await espera(`J.info.estado==='mira'`);
// 5) mesmo lançamento em velocidades de tela diferentes dá exatamente o mesmo caminho
ok('igual a 30, 60, 144 quadros e com engasgos', await p.av(`(()=>{const K=Zen.jogos.okay;let bom=true;for(const [dif,f] of [['facil',33],['medio',47],['dificil',12],['dificil',50]]){const res=[];for(const dts of [[1/30],[1/60],[1/144],[.016,.05,.002,.033]]){const c=document.createElement('canvas'),Q=K.criar(c,{dif,fase:f,cores:cores()});Q.redimensionar(390,844,1);const [a,b]=Q.teste.tela(0,0),[x,y]=Q.teste.tela(Q.teste.F.mira[0],Q.teste.F.mira[1]);Q.toqueInicio(200,400,1);Q.toqueFim(200-(x-a)*300,400-(y-b)*300,1);let n=0;while(Q.info.estado==='voo'&&n<3000)Q.quadro(dts[n++%dts.length]);res.push(JSON.stringify(Q.teste.S.eventos)+Q.info.venceu)}if(new Set(res).size!==1||!res[0].endsWith('true'))bom=false}return bom})()`));
// 6) guardar, andamento estragado
ok('andamento', await p.av(`[[{n:7},7],[{},0],[{n:'x'},0],[null,0],[{n:-3},0]].every(([a,n])=>Zen.jogos.okay.criar(document.createElement('canvas'),{dif:'facil',fase:3,cores:cores(),andamento:a}).info.lancamentos===n)`));
// 7) computador: mouse e teclado, tela larga
await p.cmd('Emulation.setTouchEmulationEnabled', { enabled: false }); await p.vp(1280, 760); await fase('medio', 31, 'pastel');
const mouse = (type, x, y) => p.cmd('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: 1, clickCount: 1 });
{ const [x0, y0, x1, y1] = await p.av(`(()=>{const T=J.teste,[a,b]=T.tela(0,0),[c,d]=T.tela(T.F.mira[0],T.F.mira[1]),m=Math.hypot(c-a,d-b);return [640,380,640-(c-a)/m*180,380-(d-b)/m*180]})()`); await mouse('mouseMoved', x0, y0); await mouse('mousePressed', x0, y0); for (let k = 1; k <= 6; k++) await mouse('mouseMoved', x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6); await dorme(250); await p.foto(`${S}/okay-pc.png`); await mouse('mouseReleased', x1, y1); ok('mouse na tela larga resolve', await espera('J.info.venceu'), 'deitado: ' + await p.av('J.teste.deitado')); }
await fase('facil', 5); for (const k of ['ArrowRight', 'ArrowRight', 'ArrowLeft', ' ']) for (const type of ['keyDown', 'keyUp']) await p.cmd('Input.dispatchKeyEvent', { type, key: k }); ok('teclado lança', (await info()).lancamentos === 1);
{ const q = await p.av(`(()=>new Promise(r=>{abrir();const D=[];let a=performance.now(),n=0;const T=J.teste,[x,y]=T.tela(0,0),[c,d]=T.tela(T.F.mira[0],T.F.mira[1]);J.toqueInicio(0,0,9);J.toqueFim(-(c-x)*300,-(d-y)*300,9);const f=t=>{D.push(t-a);a=t;if(++n<150)requestAnimationFrame(f);else{D.sort((x,y)=>x-y);r([D[75].toFixed(1),D[142].toFixed(1)])}};requestAnimationFrame(f)}))()`); console.log('     ms por quadro durante o voo (metade / 95%):', q.join(' / ')); }
await p.vp(390, 844, true, 3); await fase('dificil', 50); console.log('     desenhar um quadro (celular 3x):', await p.av(`(()=>{const t=performance.now();for(let k=0;k<60;k++)J.teste.desenhar();return ((performance.now()-t)/60).toFixed(2)+' ms'})()`), '| refazer o fundo (troca de cor):', await p.av(`(()=>{const c=cores(),t=performance.now();for(let k=0;k<10;k++){J.cores(c);J.teste.desenhar()}return ((performance.now()-t)/10).toFixed(1)+' ms'})()`));
await p.vp(844, 390, true, 2); await fase('dificil', 42); await p.foto(`${S}/okay-deitado.png`); await p.vp(360, 640, true, 2); await fase('dificil', 33, 'pastel'); await p.foto(`${S}/okay-pequeno.png`);
ok('sem erros', !p.erros.length, p.erros[0] || ''); p.fim();

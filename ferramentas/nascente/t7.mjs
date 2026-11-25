import { abrir, dorme } from './nav.mjs';
const N = '__nascente', p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, semNet: process.argv[2] === 'sem' });
await dorme(3500); console.log('sem CDN?', process.argv[2] === 'sem', 'estado', await p.av(`${N}.J.estado+' r'+${N}.THREE.REVISION`));
const i = await p.av(`${N}.J.F.caminho[0].i`), g = await p.av(`${N}.J.F.grade[${i}].giro`), [x, y] = await p.onde(i);
await p.toque(x, y); await dorme(600); console.log('toque gira', await p.av(`${N}.J.F.grade[${i}].giro`) === (g + 1) % 4);
// pinça
await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 400, id: 1 }, { x: 250, y: 400, id: 2 }] });
for (let k = 1; k < 8; k++) await p.cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150 - k * 8, y: 400, id: 1 }, { x: 250 + k * 8, y: 400, id: 2 }] });
await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); console.log('pinça', await p.av(`${N}.Cam.quer.zoom<.8`));
await p.av(`${N}.abrirFase(11)`); await dorme(4500); await p.foto('m1.png');
await p.av(`document.getElementById('b-fases').click()`); await dorme(500); await p.foto('m2.png'); await p.av(`document.getElementById('d-fases').close()`);
await p.av(`${N}.abrirFase(5)`); await dorme(3000); await p.av(`${N}.resolver()`); await dorme(10500); await p.foto('m3.png');
await p.av(`document.getElementById('fim-ficar').click()`); await dorme(1500); await p.foto('m4.png');
await p.vp(844, 390, true, 2); await dorme(1200); await p.av(`${N}.abrirFase(7)`); await dorme(4000); await p.foto('m5.png');
// som: pico e média na saída
console.log('som', await p.av(`(async()=>{const S=${N}.Som; if(S.estado!=='running') return 'parado '+S.estado; const c=S.contexto,a=c.createAnalyser(); a.fftSize=2048; S.saida.connect(a); const b=new Float32Array(2048); const mede=async(n,f,ms)=>{f();let pico=0,soma=0,k=0;const t=performance.now();while(performance.now()-t<ms){a.getFloatTimeDomainData(b);for(const v of b){pico=Math.max(pico,Math.abs(v));soma+=v*v;k++}await new Promise(r=>setTimeout(r,20))}return n+' pico '+pico.toFixed(3)+' media '+Math.sqrt(soma/k).toFixed(4)};
return [await mede('ambiente',()=>{},1500),await mede('raspar',()=>S.raspar(),400),await mede('assentar',()=>S.assentar(),400),await mede('gota',()=>S.gota(),400),await mede('chegou',()=>S.chegou(1),2000),await mede('acorde',()=>S.acorde(),5000)].join(' | ')})()`));
await p.av(`document.getElementById('mudo').click()`); await dorme(1200);
console.log('mudo', await p.av(`(async()=>{const S=${N}.Som,a=S.contexto.createAnalyser();S.saida.connect(a);const b=new Float32Array(2048);await new Promise(r=>setTimeout(r,300));a.getFloatTimeDomainData(b);return Math.max(...b.map(Math.abs))<.002})()`));
console.log('erros', p.erros.join('\n') || 'nenhum'); p.fim();

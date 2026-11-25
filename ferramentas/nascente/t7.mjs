// Celular (toque e pinça), tela de fases, som por mundo, velocidade e memória. "node t7.mjs sem" = sem a CDN (usa lib/three).
import { abrir, dorme } from './nav.mjs';
const N = '__nascente', sem = process.argv[2] === 'sem', p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, semNet: sem, url: '/jogos/nascente/index.html' }), av = p.av;
for (let k = 0; k < 40 && !(await av(`document.getElementById('d-dif').open`).catch(() => 0)); k++) await dorme(250);
await dorme(800); await p.foto('m0.png'); { const [x, y] = await av(`(()=>{const r=document.querySelectorAll('#d-dif button')[1].getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`); await p.toque(x, y); } for (let k = 0; k < 40 && await av(`${N}.J.estado`) !== 'jogando'; k++) await dorme(250); await dorme(3200);
console.log('sem CDN?', sem, 'estado', await av(`${N}.J.estado+' dif '+${N}.salvo.dif+' r'+${N}.THREE.REVISION+' câmera '+${N}.Cam.modo`)); if (sem) { console.log('erros', p.erros.filter(e => !/ERR_|Failed to load/.test(e)).join() || 'nenhum'); p.fim(); }
else {
  const i = await av(`${N}.J.F.caminho[0].i`), g = await av(`${N}.J.F.grade[${i}].giro`), [x, y] = await p.onde(i);
  await p.toque(x, y); await dorme(800); console.log('toque gira', await av(`${N}.J.F.grade[${i}].giro!==${g}`));
  await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 400, id: 1 }, { x: 250, y: 400, id: 2 }] });
  for (let k = 1; k < 8; k++) await p.cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150 - k * 8, y: 400, id: 1 }, { x: 250 + k * 8, y: 400, id: 2 }] });
  await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); console.log('pinça', await av(`${N}.Cam.quer.zoom<.8`));
  await av(`document.getElementById('b-fases').click()`); await dorme(500); await p.foto('m1.png'); await av(`document.getElementById('d-fases').close()`);
  // todas as peças giráveis têm tamanho de dedo? (distância na tela entre casas vizinhas)
  console.log('casa na tela (px), menor e fase:', await av(`(async()=>{let m=99,q=0;for(let f=0;f<100;f++){const F=${N}.lerFase(f,1),w=390/(F.larg+.3);if(w<m){m=w;q=f+1}}return m.toFixed(0)+' fase '+q})()`));
  // som: pico por mundo
  console.log(await av(`(async()=>{const S=${N}.Som;S.iniciar();await new Promise(r=>setTimeout(r,300));if(S.estado!=='running')return 'som parado';${N}.salvo.mudo=false;${N}.salvo.volume=70;S.volume();const a=S.contexto.createAnalyser();a.fftSize=2048;S.saida.connect(a);const b=new Float32Array(2048),o=[];const mede=async(f,ms)=>{f();let p=0;const t=performance.now();while(performance.now()-t<ms){a.getFloatTimeDomainData(b);for(const v of b)p=Math.max(p,Math.abs(v));await new Promise(r=>setTimeout(r,20))}return p.toFixed(2)};
   for(let m=0;m<10;m++){for(const cl of (m===2||m===7?['chuva']:m===5?['garoa']:['nada'])){S.mundo(m,cl);await new Promise(r=>setTimeout(r,2200));const amb=await mede(()=>{},1200),che=await mede(()=>{S.chegou(3);S.portao();S.raspar()},1400),aco=await mede(()=>S.acorde(),4200);o.push('mundo '+(m+1)+': ambiente '+amb+' chegada '+che+' acorde '+aco)}}return o.join('\\n')})()`));
  // velocidade nas fases mais pesadas
  for (const f of [68, 88, 99, 78]) { await av(`${N}.abrirFase(${f})`); await dorme(3000); await av(`${N}.resolver()`); await dorme(3000); console.log('quadros/s fase', f + 1, await av(`new Promise(r=>{let n=0,t=performance.now();(function q(){n++;performance.now()-t<3000?requestAnimationFrame(q):r(Math.round(n/3))})()})`), 'chamadas', await av(`${N}.R.info.render.calls+' triângulos '+${N}.R.info.render.triangles`)); }
  // memória ao trocar 100 fases (duas voltas: a segunda não pode crescer)
  const volta = async () => { await av(`(async()=>{for(let f=0;f<100;f++){${N}.montar(f);${N}.passo(.03);if(f%10===0)await new Promise(r=>setTimeout(r,30))}${N}.montar(0);${N}.passo(.03)})()`); await p.cmd('HeapProfiler.collectGarbage'); return av(`(()=>{const m=${N}.R.info.memory;return [m.geometries,m.textures,${N}.R.info.programs.length,Math.round(performance.memory.usedJSHeapSize/1e6)+'MB'].join(' ')})()`); };
  console.log('memória (formas, texturas, programas, JS):', await volta(), '->', await volta(), '->', await volta());
  console.log('erros', [...new Set(p.erros)].join(' / ') || 'nenhum'); p.fim();
}

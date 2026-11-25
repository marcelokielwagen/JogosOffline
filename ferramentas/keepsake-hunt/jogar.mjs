// Keepsake Hunt: um robô joga com toque simulado (toca, remexe com o dedo quando o objeto está enterrado).   node jogar.mjs 1-50 [--pc] [--deitado] [--lento] [--foto=pasta]
import { abrir, dorme } from './nav.mjs';
const [a, b] = (process.argv[2] || '1-50').split('-').map(Number), pc = process.argv.includes('--pc'), deit = process.argv.includes('--deitado'), foto = (process.argv.find(x => x.startsWith('--foto=')) || '').slice(7);
const p = await abrir(pc ? { w: 1366, h: 768 } : deit ? { w: 844, h: 390, movel: true, dpr: 2 } : { w: 390, h: 844, movel: true, dpr: 2 }); if (process.argv.includes('--lento')) await p.cmd('Emulation.setCPUThrottlingRate', { rate: 4 }); await dorme(500);
await p.av(`(()=>{const {Jogo,Tela,Nucleo}=__keepsake;window.__fps=[];let u=0;const q=t=>{requestAnimationFrame(q);if(u)__fps.push(t-u);u=t;};requestAnimationFrame(q);
window.__alvo=()=>{const P=Jogo.P;if(!P)return{};if(P.fim)return{fim:P.fim};const M=Nucleo.mapa(P.objs,P.W,P.H,P.masc),ponto=i=>{let c=[];for(let k=0;k<M.id.length;k++)if(M.id[k]===i)c.push(k);if(c.length<5)return null;let mx=0,my=0;for(const k of c){mx+=k%M.w;my+=k/M.w|0;}mx/=c.length;my/=c.length;let m=null,d=1e9;for(const k of c){const e=Math.hypot(k%M.w-mx,(k/M.w|0)-my);if(e<d){d=e;m=k;}}return Tela.paraTela(P,(m%M.w+.5)/Nucleo.RES-P.W/2,((m/M.w|0)+.5)/Nucleo.RES-P.H/2);};
 let l=P.objs.map((o,i)=>i).filter(i=>P.objs[i].alvo&&P.vale(P.objs[i]));if(P.F.modo==='P'&&P.marcado)l=l.filter(i=>P.objs[i]!==P.marcado&&P.objs[i].k===P.marcado.k);l.sort((x,y)=>M.fracao(y)-M.fracao(x));
 if(!l.length)return{espera:1};const i=l[0],pt=ponto(i);if(pt&&M.fracao(i)>.1)return{toca:pt,id:Nucleo.CAT[P.objs[i].k].id};const [x,y]=Tela.paraTela(P,P.objs[i].x,P.objs[i].y);return{remexe:[x,y],id:Nucleo.CAT[P.objs[i].k].id};};
window.__med=()=>{const P=Jogo.P,M=Nucleo.mapa(P.objs,P.W,P.H,P.masc),i=P.objs.findIndex(o=>o.lembranca&&o.vivo);if(i<0)return null;return{f:M.fracao(i),p:Tela.paraTela(P,P.objs[i].x,P.objs[i].y)};};1})()`);
const arrasta = async (x, y, ang, r = 70) => { const c = await p.av('(()=>{const c=__keepsake.Tela.cena;return[c.x,c.y,c.w,c.h]})()'), lim = (v, a, b) => Math.max(a, Math.min(b, v)), pt = k => ({ x: lim(x + Math.cos(ang) * r * k, c[0] + 4, c[0] + c[2] - 4), y: lim(y + Math.sin(ang) * r * k, c[1] + 4, c[1] + c[3] - 4) }); await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(0)] }); for (let k = 1; k <= 8; k++) { await p.cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(k / 8)] }); await dorme(14); } await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await dorme(120); };
if (pc) await p.cmd('Emulation.setTouchEmulationEnabled', { enabled: true });
let ruins = 0; for (let n = a; n <= (b || a); n++) {
  await p.av(`__fps.length=0;__keepsake.Jogo.comecar(${n}).then(()=>1)`); await dorme(950); const t0 = Date.now(); let mex = 0, erros = 0, toq = 0, preso = 0, r;
  for (let g = 0; g < 160; g++) {
    r = await p.av('__alvo()'); if (r.fim) break; if (r.espera) { await dorme(140); if (++preso > 40) break; continue; } preso = 0;
    if (r.toca) { const e = await p.av('__keepsake.Jogo.P.erros'); await p.toque(...r.toca); toq++; await dorme(90); const e2 = await p.av('__keepsake.Jogo.P.erros'); if (e2 > e) erros++; } else { mex++; await arrasta(...r.remexe, mex * 2.4); }
    if (foto && g === 3) await p.foto(`${foto}/jogo${n}.png`);
  }
  const jogo = ((Date.now() - t0) / 1000).toFixed(0); await dorme(1900); const s = await p.av(`(()=>{const P=__keepsake.Jogo.P,f=__fps.slice(10).sort((a,b)=>a-b);return{tela:__keepsake.Jogo.aberto,fim:P.fim,est:__keepsake.Progresso.d.estrelas[${n}],pts:P.pontos,combo:P.maiorCombo,tempo:Math.round(P.tempo),de:P.F.tempo,modo:P.F.modo,meta:P.meta,ach:P.achados,fps:Math.round(1000/(f.reduce((a,b)=>a+b,0)/f.length)),p95:Math.round(f[f.length*.95|0])}})()`);
  if (s.fim !== 'vitoria' || s.tela !== 'vitoria') ruins++; console.log(`${n} ${s.modo} ${s.fim || 'PRESO ' + JSON.stringify(r)} tela=${s.tela} ${s.ach}/${s.meta} em ${jogo}s toques=${toq} remexidas=${mex} erros=${erros} estrelas=${s.est} combo=${s.combo} sobrou ${s.tempo}/${s.de} fps=${s.fps} p95=${s.p95}ms`);
}
console.log('fases com problema:', ruins, '| erros de código:', p.erros.slice(0, 4)); p.fim();

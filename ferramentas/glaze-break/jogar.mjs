// Glaze Break: um robô joga as fases com toque simulado (arrasta o dedo para mover a barra, toque curto para lançar).
//   node jogar.mjs 1-50 [--ritmo=3] [--pc] [--deitado] [--lento] [--foto=pasta]
// --ritmo acelera o relógio do jogo (o toque continua de verdade); --ritmo=1 joga em tempo real. --lento: processador 4x mais lento.
import { readFileSync } from 'node:fs';
import { abrir, dorme } from './nav.mjs';
const arg = k => (process.argv.find(x => x.startsWith('--' + k + '=')) || '').split('=')[1], tem = k => process.argv.includes('--' + k);
const [a, b] = (process.argv[2] || '1-50').split('-').map(Number), pc = tem('pc'), deit = tem('deitado'), foto = arg('foto'), ritmo = +(arg('ritmo') || 3);
const tam = pc ? { w: 1366, h: 768 } : deit ? { w: 844, h: 390, movel: true, dpr: 2 } : { w: 390, h: 844, movel: true, dpr: 2 };
const p = await abrir(tam); if (tem('lento')) await p.cmd('Emulation.setCPUThrottlingRate', { rate: 4 }); await dorme(500);
await p.av(readFileSync(new URL('./cerebro.js', import.meta.url), 'utf8') + `;window.__mira=mira;
(()=>{const {Jogo,Nucleo:N,Tela}=__glaze;Jogo.ritmo=${ritmo};window.__fps=[];let u=0;const q=t=>{requestAnimationFrame(q);if(u)__fps.push(t-u);u=t;};requestAnimationFrame(q);
window.__alvo=()=>{const P=Jogo.P;if(!P)return{};if(P.fim)return{fim:P.fim};const d=__mira(P,N);return{x:d.x,rx:P.rq.x,lancar:d.lancar&&P.bolas.some(b=>b.presa),s:Tela.escala,c:Tela.campo};};1})()`);
const SENS = await p.av('__glaze.Jogo.SENS'), W = tam.w, H = tam.h;
// dedo: começa embaixo, no meio; se chegar perto da borda, levanta e volta para o meio
let dedo = null; const fy = () => H - 30;
const desce = async x => { dedo = { x, t: Date.now() }; await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fy() }] }); };
const sobe = async () => { if (dedo) await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); dedo = null; };
const mexe = async x => { dedo.x = x; await p.cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: fy() }] }); };
const rato = async (x, tipo = 'mouseMoved', extra = {}) => p.cmd('Input.dispatchMouseEvent', { type: tipo, x, y: H - 40, ...extra });
let ruins = 0; const res = [];
for (let n = a; n <= (b || a); n++) {
  await p.av(`__fps.length=0;__glaze.Jogo.comecar(${n}).then(()=>1)`); await dorme(300); const t0 = Date.now(); let toques = 0, arrastos = 0, r = {}, mx = 0, fotoFeita = false;
  if (!pc) await desce(W / 2);
  while (Date.now() - t0 < 600000 / ritmo) {
    r = await p.av('__alvo()'); if (r.fim || !r.s) break;
    if (pc) {
      const alvoX = r.c.x + r.x * r.s; if (Math.abs(alvoX - mx) > .5) { mx = alvoX; await rato(mx); arrastos++; }
      if (r.lancar && Math.abs(r.x - r.rx) < 1.5) { await rato(mx, 'mousePressed', { button: 'left', clickCount: 1 }); await rato(mx, 'mouseReleased', { button: 'left', clickCount: 1 }); toques++; await dorme(60); }
    } else {
      const dx = (r.x - r.rx) * r.s / SENS;
      if (Math.abs(dx) > .3) { let nx = dedo.x + dx; if (nx < 12 || nx > W - 12) { await sobe(); await desce(W / 2); nx = W / 2 + dx; nx = Math.max(12, Math.min(W - 12, nx)); } await mexe(nx); arrastos++; }
      if (r.lancar && Math.abs(r.x - r.rx) < 1.5) { await sobe(); await p.toque(W / 2, fy()); toques++; await dorme(40); await desce(W / 2); }
    }
    if (foto && !fotoFeita && Date.now() - t0 > 2500 / ritmo * 3) { fotoFeita = true; await p.foto(`${foto}/jogo${n}${pc ? '-pc' : deit ? '-d' : ''}.png`); }
    await dorme(8);
  }
  await sobe(); const seg = (Date.now() - t0) / 1000; await dorme(1500);
  const s = await p.av(`(()=>{const P=__glaze.Jogo.P,f=__fps.slice(10).sort((a,b)=>a-b);return{tela:__glaze.Jogo.aberto,fim:P.fim,est:__glaze.Progresso.d.estrelas[${n}]||0,pts:P.pontos,veio:P.maiorVeio,perdidas:P.perdidas,tempo:Math.round(P.tempo),total:P.total,restam:P.restam,fps:Math.round(1000/(f.reduce((a,b)=>a+b,0)/f.length)),p95:Math.round(f[f.length*.95|0])}})()`);
  const bom = s.fim === 'vitoria' && s.tela === 'vitoria'; if (!bom) ruins++; res.push(s.tempo);
  console.log(`${String(n).padStart(2)} ${bom ? 'venceu' : 'PROBLEMA ' + (s.fim || 'sem fim') + ' tela=' + s.tela} ${s.total - s.restam}/${s.total} em ${s.tempo}s de jogo (${seg.toFixed(0)}s reais) toques=${toques} arrastos=${arrastos} bolas perdidas=${s.perdidas} estrelas=${s.est} veio=${s.veio} pontos=${s.pts} fps=${s.fps} p95=${s.p95}ms`);
}
console.log('fases com problema:', ruins, '| tempo médio de jogo', Math.round(res.reduce((x, y) => x + y, 0) / res.length), 's | erros de código:', p.erros.slice(0, 4)); p.fim();

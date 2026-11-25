// Gem Shatter: joga as fases no Chrome com toque de verdade simulado.   node jogar.mjs [1-50 | 3,7] [--lento] [--foto=pasta]
import { abrir, dorme } from './nav.mjs';
const arg = process.argv[2] || '1-50', ns = arg.includes('-') && !arg.startsWith('-') ? (([a, b]) => [...Array(b - a + 1).keys()].map(k => a + k))(arg.split('-').map(Number)) : arg.split(',').map(Number);
const pasta = (process.argv.find(a => a.startsWith('--foto=')) || '').slice(7), p = await abrir({ w: 390, h: 844, movel: true, dpr: 2 });
if (process.argv.includes('--lento')) await p.cmd('Emulation.setCPUThrottlingRate', { rate: 6 });
const E = x => p.av(x); await p.toque(195, 800); await dorme(300); console.log('som depois do 1o toque:', await E('__gemShatter.Som.estado'));
// escolhe um bom grupo e devolve o ponto na tela
const escolhe = `(()=>{const J=__gemShatter.Jogo,P=J.P;if(J.aberto||!J.livre())return {e:J.aberto||'ocupado'};const op=P.grupos().map(g=>g[0].i);P.g.forEach((p,i)=>{if(p&&p.k==='esp')op.push(i)});
 let m=null,mv=-1e9;for(const i of op){const c=P.clonar();c.tocar(i);let v=0;for(const k in c.metas)v-=c.metas[k]*(k[0]==='c'?1:4);c.g.forEach((p,j)=>{if(p&&p.k==='esp')v+=2;if(p&&p.k==='geodo')v+=(j/P.W|0)});v+=Math.random();if(v>mv){mv=v;m=i}}return {p:__gemShatter.Tela.centro(m)}})()`;
let venc = 0, qmin = 99; for (const n of ns) {
  await E(`__gemShatter.Jogo.comecar(${n})`); await dorme(900); await E("document.querySelectorAll('#aviso,#diaria').forEach(x=>x.classList.remove('on'))"); let toques = 0, fim = null, parado = 0; const t0 = Date.now();
  while (!fim && Date.now() - t0 < 90000) { const r = await E(escolhe); if (r.p) { await p.toque(...r.p); toques++; parado = 0; if (pasta && toques === 4) { await dorme(90); await p.foto(`${pasta}/j${n}.png`); } if (toques % 5 === 0) await p.toque(...r.p); await dorme(120); } else if (r.e === 'continuar') { await E('bxNao.click()'); await dorme(400); } else if (r.e !== 'ocupado') fim = r.e; else { await dorme(60); if (++parado > 260) { fim = 'TRAVOU'; } } }
  const i = await E('JSON.stringify({q:__gemShatter.Tela.qps,m:__gemShatter.Jogo.P.metas,mv:__gemShatter.Jogo.metasVis,movs:__gemShatter.Jogo.P.movs,pts:[__gemShatter.Jogo.P.pontos,__gemShatter.Jogo.pts]})'), o = JSON.parse(i); qmin = Math.min(qmin, o.q); if (fim === 'vitoria') venc++;
  const ruim = fim === 'vitoria' && (Object.values(o.mv).some(v => v > 0) || o.pts[0] !== o.pts[1]); console.log(n, fim, 'toques', toques, 'qps', o.q, ruim || !/vitoria|derrota/.test(fim) ? 'PROBLEMA ' + i : ''); if (pasta && n === ns[0]) { await dorme(1500); await p.foto(`${pasta}/fim${n}.png`); }
}
console.log('venceu', venc, 'de', ns.length, 'qps mínimo', qmin, 'erros:', [...new Set(p.erros)].slice(0, 4).join('\n') || 'nenhum'); console.log(await E("localStorage.getItem('gem-shatter.v2')")); p.fim();

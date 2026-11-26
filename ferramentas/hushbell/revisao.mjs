// Revisão final: sair no meio da comemoração não pula de nível; vários vai-e-vem sem vazar memória; redimensionar; perder o contexto 3D.
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 1280, h: 760, url: '/jogos/hushbell/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const H = x => p.av(`(()=>{const H=__hushbell;return ${x}})()`), espera = async (c, s = 12) => { for (let i = 0; i < s * 10; i++) { if (await H(c)) return true; await dorme(100); } return false; };
await dorme(2500); await H('H.irPara(0)'); await espera('H.nivel===0&&!H.viagem');
// resolve o nível 1 direto pelo mapa (rápido) e sai durante a comemoração
await H(`(()=>{const M=H.mundo;for(const p of M.pecas){p.rot=0;p.ang=0;p.grupo.quaternion.identity();}M.montar();H.andar.remapear();H.andar.ir(M.no(M.meta));})()`);
ok('venceu', await espera('H.venceu', 15)); await dorme(800); await H('H.irPara(-1)'); await espera('H.mundo===H.casa&&!H.viagem'); await dorme(5000);
ok('sair na comemoração fica no início', await H('H.mundo===H.casa&&H.nivel===-1'), await H('H.nivel'));
const mem0 = await H('H.R.info.memory.geometries');
for (let i = 0; i < 6; i++) { await H(`H.irPara(${i % 5})`); await espera(`H.nivel===${i % 5}&&!H.viagem`); }
await H('H.irPara(-1)'); await espera('H.mundo===H.casa&&!H.viagem'); await dorme(500);
const mem1 = await H('H.R.info.memory.geometries'); ok('6 viagens sem acumular desenhos', mem1 <= mem0 + 4, mem0 + ' -> ' + mem1);
for (const [w, h] of [[390, 844], [844, 390], [1280, 760]]) { await p.vp(w, h, w < 600); await H('dispatchEvent(new Event("resize"))'); await dorme(400); }
ok('redimensionar sem erro', !p.erros.length);
await H(`(()=>{const e=H.R.getContext().getExtension('WEBGL_lose_context');window.__e=e;e.loseContext();})()`); await dorme(800); await H('__e.restoreContext()'); await dorme(2500);
ok('volta depois de perder o 3D', await H(`document.getElementById('tela').classList.contains('pronta')&&!H.R.getContext().isContextLost()`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

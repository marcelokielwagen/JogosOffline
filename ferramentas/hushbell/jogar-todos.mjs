// Joga a campanha inteira (níveis 1 a 5) com toques e arrastos de verdade, seguindo planos.json (feito por resolver.mjs).
// Confere: peça certa gira, sino anda, chega, passa sozinho para o próximo, salva o progresso e volta ao início no fim.
//   node jogar-todos.mjs [celular] [pasta-de-fotos]
import { abrir, dorme } from '../nascente/nav.mjs';
import { readFileSync } from 'node:fs';
const planos = JSON.parse(readFileSync(new URL('./planos.json', import.meta.url)));
const movel = process.argv[2] === 'celular', pasta = process.argv.find((a, i) => i > 1 && a !== 'celular');
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, url: '/jogos/hushbell/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const H = x => p.av(`(()=>{const H=__hushbell;return ${x}})()`), espera = async (c, s = 15) => { for (let i = 0; i < s * 10; i++) { if (await H(c)) return true; await dorme(100); } return false; };
const toque = (x, y) => movel ? p.toque(x, y) : p.clique(x, y);
async function arrasto(pts) {
  if (movel) { await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] }); for (const [x, y] of pts.slice(1)) { await p.cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await dorme(16); } return p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pts[0][0], y: pts[0][1] }); await p.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button: 'left', clickCount: 1 });
  for (const [x, y] of pts.slice(1)) { await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 }); await dorme(16); }
  const [x, y] = pts.at(-1); return p.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}
// ponto da tela que pega a peça, e o arco que o dedo faz em volta do eixo dela
const arcoDaPeca = (i, graus) => H(`(()=>{const M=H.mundo,P=M.pecas[${i}],T=H.THREE,cel=H.celulasPeca(P,P.rot).blocos,cands=[];
  for(const [x,y,z] of cel)for(const [dx,dy,dz] of [[0,1,0],[0,.6,.45],[.45,.6,0],[.3,1,.3]])cands.push(new T.Vector3(x+dx,y+dy,z+dz));
  for(let a=0;a<6.3;a+=.5)for(const r of [.35,.5])cands.push(P.centro.clone().add(new T.Vector3(Math.cos(a)*r,.2,Math.sin(a)*r)));
  const tela=v=>{const q=v.clone().add(M.grupo.position).project(H.cam);return [(q.x+1)/2*innerWidth,(1-q.y)/2*innerHeight]};
  for(const c of cands){const [sx,sy]=tela(c),a=H.alvoEm(sx,sy,false);if(!a||a.object.userData.peca!==P)continue;
    const pl=new T.Plane().setFromNormalAndCoplanarPoint(P.ev,P.centro),pt=new T.Vector3();if(!new T.Ray().copy(a.point?(()=>{const r=new T.Raycaster();r.setFromCamera(new T.Vector2(sx/innerWidth*2-1,1-sy/innerHeight*2),H.cam);return r.ray})():null).intersectPlane(pl,pt))continue;
    const d=pt.sub(P.centro);if(d.length()<.3)continue;const pts=[[sx,sy]];for(let k=1;k<=24;k++)pts.push(tela(d.clone().applyAxisAngle(P.ev,${graus}*Math.PI/180*k/24).add(P.centro)));return pts;}
  return null})()`);
const telaDoNo = id => H(`(()=>{const n=H.mundo.no('${id}');if(!n)return null;const q=n.centro.clone().add(H.mundo.grupo.position).project(H.cam);return [(q.x+1)/2*innerWidth,(1-q.y)/2*innerHeight]})()`);
async function irAte(id) { if (await H(`H.andar.no.id`) === id) return true; const t = await telaDoNo(id); if (!t) return false; await toque(...t); await espera('!H.andar.andando()', 20); return await H('H.andar.no.id') === id; }

await dorme(3000); await p.av(`localStorage.removeItem('hushbell.v1')`);
const bj = await p.av(`(()=>{const r=document.getElementById('bJogar').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`); await toque(...bj);
for (let i = 0; i < planos.length; i++) {
  ok(`nível ${i + 1}: entrou`, await espera(`H.nivel===${i}&&!H.viagem`, 15));
  await dorme(600); await toque(...(await telaDoNo(await H('H.mundo.meta')) || [10, 10])); await dorme(500); ok(`nível ${i + 1}: meta fechada no começo`, !(await H('H.andar.andando()')));
  for (const [k, passo] of planos[i].entries()) {
    const chegou = await irAte(passo.onde); if (!chegou) ok(`  andar até ${passo.onde}`, false, await H('H.andar.no.id'));
    const graus = { 1: 90, 2: 180, 3: -90 }[passo.dq], arco = await arcoDaPeca(passo.peca, graus);
    if (!arco) { ok(`  pegar a peça ${passo.peca}`, false); continue; }
    const alvo = await H(`(()=>{const P=H.mundo.pecas[${passo.peca}];return [P,...(P.move||[])].map(m=>(m.rot+${passo.dq})%4)})()`);
    await arrasto(arco); await espera(`!H.mundo.pecas.some(q=>q.soltando||q.girando)`, 5);
    const agora = await H(`(()=>{const P=H.mundo.pecas[${passo.peca}];return [P,...(P.move||[])].map(m=>m.rot)})()`);
    ok(`  giro ${k + 1}: peça ${passo.peca} ${graus}°${passo.monta ? ' com o sino' : ''}`, JSON.stringify(agora) === JSON.stringify(alvo), JSON.stringify(agora));
    if (pasta && k === planos[i].length - 1) await p.foto(`${pasta}/${movel ? 'c' : ''}jogo${i + 1}.png`);
  }
  // a ponte levadiça não gira com o sino em cima (nível 2): confere a recusa
  if (i === 1) { await irAte('c0,0,0'); const a = await arcoDaPeca(0, 90); if (a) { await arrasto(a); await dorme(800); } ok('  ponte levadiça não gira com o sino em cima', await H('H.mundo.pecas[0].rot') === 3); }
  await toque(...await telaDoNo(await H('H.mundo.meta'))); ok(`nível ${i + 1}: chegou ao sino`, await espera('H.venceu', 25));
  ok(`nível ${i + 1}: progresso salvo`, await p.av(`JSON.parse(localStorage.getItem('hushbell.v1')).feitos`) === i + 1);
}
ok('fim: volta ao início', await espera('H.mundo===H.casa&&!H.viagem', 20)); await dorme(800);
ok('bolinhas: 5 feitas', await p.av(`document.querySelectorAll('#pontos .feito').length`) === 5);
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

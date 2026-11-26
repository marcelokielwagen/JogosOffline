// Joga o nível 1 do começo ao fim com mouse (ou toque: node jogar.mjs celular), tirando fotos.   node jogar.mjs [celular] [pasta]
import { abrir, dorme } from '../nascente/nav.mjs';
const movel = process.argv[2] === 'celular', pasta = process.argv[3] || process.argv[2];
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, url: '/jogos/hushbell/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const foto = async n => { if (pasta && pasta !== 'celular') await p.foto(`${pasta}/${movel ? 'c-' : ''}${n}.png`); };
const H = x => p.av(`(()=>{const H=__hushbell;return ${x}})()`);
const tela = (x, y, z) => H(`(()=>{const v=new H.THREE.Vector3(${x},${y},${z}).project(H.cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]})()`);
const toque = async (x, y) => movel ? p.toque(x, y) : p.clique(x, y);
const arrasto = async pts => {
  if (movel) { await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] }); for (const [x, y] of pts.slice(1)) { await p.cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await dorme(16); } await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); return; }
  await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pts[0][0], y: pts[0][1] }); await p.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button: 'left', clickCount: 1 });
  for (const [x, y] of pts.slice(1)) { await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 }); await dorme(16); }
  const [x, y] = pts.at(-1); await p.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// arco em volta do eixo vertical da peça, do ângulo a ao b (radianos), raio r, na altura cy
const arco = async (cx, cy, cz, r, a, b, ini) => { const pts = [ini]; for (let i = 0; i <= 24; i++) { const t = a + (b - a) * i / 24; pts.push(await tela(cx + r * Math.cos(t), cy, cz - r * Math.sin(t))); } return pts; };
const espera = async (cond, s = 12) => { for (let i = 0; i < s * 10; i++) { if (await H(cond)) return true; await dorme(100); } return false; };
const onde = () => H('H.andar.no.id');

await dorme(3500); await toque(...await tela(4, 1, 3)); await espera('!H.andar.andando()'); ok('anda na tela inicial', await onde() === 'c4,0,3', await onde());
const bj = await p.av(`(()=>{const r=document.getElementById('bJogar').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`); await toque(...bj); await espera("H.mundo!==H.casa&&!H.viagem", 12); await dorme(300);
ok('entrou no nível', await H('H.mundo!==H.casa&&H.andar.no.id==="c0,0,3"')); await foto('n1-inicio');
await toque(...await tela(0, 4, -2)); await dorme(400); ok('patamar inalcançável no começo', !(await H('H.andar.andando()')));
// gira a escada pela manivela: de 90° para 0°
await arrasto(await arco(0, .5, 1, 1.414, 3 * Math.PI / 4, Math.PI / 4, await tela(0, 1.5, 1))); await espera('!H.mundo.pecas[0].soltando', 4);
ok('escada girou para o lugar certo', await H('H.mundo.pecas[0].rot') === 0, await H('H.mundo.pecas[0].rot'));
await toque(...await tela(1, 4, -2)); await espera('!H.andar.andando()', 15); ok('subiu até a ponte', await onde() === 'c1,3,-2', await onde()); await foto('n1-ponte');
await toque(...await tela(9, 7, 1)); await dorme(400); ok('meta ainda inalcançável', !(await H('H.andar.andando()')));
// gira a ponte com o sino em cima: de 90° (fundo) para 0° (direita)
await arrasto(await arco(1, 3.5, -2, 2, Math.PI / 2, 0, await tela(1, 4, -4))); await dorme(300); await foto('n1-girando'); await espera('!H.mundo.pecas[1].soltando', 4);
ok('ponte girou com o sino junto', await H('H.mundo.pecas[1].rot') === 0 && H.andar?.no !== null, await H('H.mundo.pecas[1].rot+" "+H.andar.no.id'));
await toque(...await tela(9, 7, 1)); await dorme(1500); await foto('n1-andando'); ok('caminho impossível até a meta', await espera('H.venceu', 15));
await dorme(1500); await foto('n1-chegou'); ok('chegou no sino', await onde() === 'c9,6,1'); ok('passou sozinho para o nível 2', await espera('H.nivel===1&&!H.viagem', 15));
// peça não gira enquanto o sino anda em cima dela; e o espiar continua funcionando no nível
await p.av('__hushbell.irPara(0)'); await dorme(500); await espera("H.nivel===0&&!H.viagem", 12); await dorme(300); await arrasto(await arco(0, .5, 1, 1.414, 3 * Math.PI / 4, Math.PI / 4, await tela(0, 1.5, 1))); await espera('!H.mundo.pecas[0].soltando', 4);
await toque(...await tela(0, 4, -2)); await dorme(700); await arrasto(await arco(0, .5, 1, 1.414, 3 * Math.PI / 4, 5 * Math.PI / 4, await tela(0, 1.5, 1))); await dorme(900); ok('escada travada com o sino passando', await H('H.mundo.pecas[0].rot') === 0);
await espera('!H.andar.andando()', 15); ok('chegou ao patamar', await onde() === 'c0,3,-2', await onde());
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

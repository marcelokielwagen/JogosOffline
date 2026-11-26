// Teste de direção e som: esquerda vira para a esquerda da tela, acelera e troca marcha, fica no chão, não sai do mapa, som do motor muda.
import { abrir, dorme } from '../nascente/nav.mjs';
const movel = process.argv[2] === 'celular', p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, url: '/jogos/dustline/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const D = x => p.av(`(()=>{const D=__dustline;return ${x}})()`);
await dorme(3000); await p.av(`document.querySelector('[data-modo=livre]').click()`); const pista = await p.av(`(()=>{const r=document.querySelector('#pistas button').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
movel ? await p.toque(...pista) : await p.clique(...pista); await dorme(600); ok('som liga no gesto', await D('D.Som.estado') === 'running');
for (let i = 0; i < 40 && await D('D.estado') !== 'livre'; i++) await dorme(150); ok('tocar na pista começa o passeio', await D('D.estado') === 'livre');
// botões de toque (celular) ou teclas
const segura = async (k, ms) => { if (movel) { const [x, y] = await p.av(`(()=>{const r=document.querySelector('[data-k=${k}]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`); await p.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await dorme(ms); await p.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); } else { await p.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: { gas: 'ArrowUp', esq: 'ArrowLeft', dir: 'ArrowRight', freio: 'ArrowDown' }[k], code: { gas: 'ArrowUp', esq: 'ArrowLeft', dir: 'ArrowRight', freio: 'ArrowDown' }[k], windowsVirtualKeyCode: { gas: 38, esq: 37, dir: 39, freio: 40 }[k] }); await dorme(ms); await p.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: { gas: 'ArrowUp', esq: 'ArrowLeft', dir: 'ArrowRight', freio: 'ArrowDown' }[k], code: { gas: 'ArrowUp', esq: 'ArrowLeft', dir: 'ArrowRight', freio: 'ArrowDown' }[k], windowsVirtualKeyCode: { gas: 38, esq: 37, dir: 39, freio: 40 }[k] }); } };
const r0 = await D('D.F.rumo'); const g = segura('gas', 3500); await dorme(1500);
let v = 0; for (let k = 0; k < 8; k++) { v = Math.max(v, await D('Math.abs(D.F.vf)')); await dorme(250); } await g; ok('acelera', v > 8, v.toFixed(1) + ' m/s, marcha ' + await D('D.F.marcha'));
// virar à esquerda: o carro deve ir para a esquerda na tela
await D(`(()=>{const F=D.F;F.colocar(D.mundo.largada());for(let i=0;i<60;i++)F.passo(1/60,{gas:1,freio:0,virar:0,mao:false});})()`);
if (!movel) await p.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 });
const antes = await D(`(()=>{const F=D.F,f=new D.THREE.Vector3(F.x+Math.sin(F.rumo)*10,F.y,F.z+Math.cos(F.rumo)*10).project(D.cam),c=new D.THREE.Vector3(F.x,F.y,F.z).project(D.cam);return f.x-c.x})()`);
await segura('esq', 700);
const depois = await D(`(()=>{const F=D.F,f=new D.THREE.Vector3(F.x+Math.sin(F.rumo)*10,F.y,F.z+Math.cos(F.rumo)*10).project(D.cam),c=new D.THREE.Vector3(F.x,F.y,F.z).project(D.cam);return f.x-c.x})()`);
if (!movel) await p.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 });
ok('esquerda vira para a esquerda da tela', depois < antes - .05, antes.toFixed(2) + ' -> ' + depois.toFixed(2));
await segura('freio', 1200); ok('freia e para (ou começa a ré devagar)', Math.abs(await D('D.F.vf')) < 2.5, (await D('D.F.vf')).toFixed(1));
await segura('freio', 2500); ok('ré devagar depois de parar', (await D('D.F.vf')) < -1 && (await D('D.F.vf')) >= -6.5, (await D('D.F.vf')).toFixed(1));
ok('carro no chão', Math.abs(await D('D.F.y-D.mundo.altura(D.F.x,D.F.z)')) < .5);
// 40 s de direção aleatória em tempo simulado: nada de NaN nem sair do mapa
const r = await D(`(()=>{const F=D.F,e={gas:1,freio:0,virar:0,mao:false};for(let i=0;i<2400;i++){e.virar=Math.sin(i*.013);e.mao=i%300<40;F.passo(1/60,e);}return [F.x,F.z,F.y,F.vf].every(Number.isFinite)&&Math.abs(F.x)<240&&Math.abs(F.z)<240})()`); ok('40 s dirigindo (com freio de mão) sem erro nem sair do mapa', r);
const dr = await D(`(()=>{const F=D.F;F.colocar(D.mundo.largada());const e={gas:1,freio:0,virar:0,mao:false};for(let i=0;i<150;i++)F.passo(1/60,e);e.mao=true;e.virar=1;let m=0,b=0;for(let i=0;i<70;i++){F.passo(1/60,e);m=Math.max(m,Math.abs(F.vl));b=Math.max(b,Math.abs(Math.atan2(F.vl,Math.max(.1,Math.abs(F.vf))))*57.3);}return [m,b]})()`); ok('freio de mão solta a traseira (derrapa)', dr[0] > 2.5, dr[0].toFixed(1) + ' m/s de lado'); ok('mas não roda: ângulo de derrapagem até 63°', dr[1] < 63.5, dr[1].toFixed(0) + '°');
const s = await D(`(()=>{const M=D.Som;return M.estado})()`); ok('som segue tocando', s === 'running');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

// Gestos de verdade (toque): pedra, personagem, sino, água, espiar e voltar, pinça, botões, salvar; e abrir o arquivo direto, sem servidor.
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/jogos/hushbell/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
await dorme(4500); await p.av(`localStorage.clear();(()=>{const S=__hushbell.Som;window.__l=[];})()`);
const tela = (x, y, z) => p.av(`(()=>{const N=__hushbell,v=new N.THREE.Vector3(${x},${y},${z}).project(N.cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]})()`);
const tipo = async (x, y, z) => { if (x === 'heroi') { await dorme(2500); [x, y, z] = await p.av('__hushbell.heroi.grupo.position.toArray()'); y += .55; } const [a, b] = await tela(x, y, z); return [a, b, await p.av(`__hushbell.alvoEm(${a},${b})?.object.userData.tipo`)]; };
for (const [n, pt, esp] of [['pedra', [-3.5, 1, 2], 'pedra'], ['personagem', 'heroi', 'personagem'], ['sino grande', [2, 11.6, -1], 'sinoGrande'], ['água', [.6, -1.34, .6], 'agua'], ['ponta impossível', [2, 14, 2], 'pedra']]) { const [a, b, t] = await tipo(...(Array.isArray(pt) ? pt : [pt])); await p.toque(a, b); await dorme(500); ok('tocar ' + n, t === esp, t); }
ok('som ligado', await p.av('__hushbell.Som.estado') === 'running'); ok('título sumiu', await p.av(`document.getElementById('titulo').classList.contains('some')`));
ok('sino balançou', Math.abs(await p.av('__hushbell.monumento.sinos[0].userData.ang')) > .02);
const T = (t, pts) => p.cmd('Input.dispatchTouchEvent', { type: t, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
await T('touchStart', [[195, 500]]); for (let i = 1; i <= 12; i++) { await T('touchMove', [[195 - i * 12, 500 + i * 4]]); await dorme(16); } await dorme(600);
ok('espiar gira a câmera', Math.abs(await p.av('__hushbell.Cam.az')) > .15, await p.av('__hushbell.Cam.az')); await T('touchEnd', []); await dorme(2500); ok('volta ao ângulo exato', await p.av('__hushbell.Cam.az===0&&__hushbell.Cam.el===0'));
await T('touchStart', [[150, 500], [240, 500]]); for (let i = 1; i <= 10; i++) { await T('touchMove', [[150 - i * 8, 500], [240 + i * 8, 500]]); await dorme(16); } await T('touchEnd', []); await dorme(900); ok('pinça aproxima', await p.av('__hushbell.Cam.zoom') > 1.4, await p.av('__hushbell.Cam.zoom'));
ok('ponto coincidente da ilusão', await p.av(`(()=>{const N=__hushbell,a=new N.THREE.Vector3(2,14,2).project(N.cam),b=new N.THREE.Vector3(-4,8,-4).project(N.cam);return Math.hypot(a.x-b.x,a.y-b.y)<1e-6})()`));
for (const id of ['bHora', 'bSom']) { const [x, y] = await p.av(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`); await p.toque(x, y); await dorme(500); }
ok('hora e volume salvos', await p.av(`localStorage.getItem('hushbell.v1')`) === '{"hora":1,"volume":0.5,"feitos":0}', await p.av(`localStorage.getItem('hushbell.v1')`)); await p.recarregar(); await dorme(4500); ok('voltam ao abrir', await p.av(`document.getElementById('bSom').dataset.v==='1'`));
await p.av('window.__x=1'); await p.cmd('Network.enable'); await p.cmd('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await p.cmd('Page.navigate', { url: 'file:///C:/Users/Minhoca/Projetos/JogosOffline/jogos/hushbell/index.html' }); await dorme(5000); ok('abre direto do arquivo, sem internet', await p.av(`location.protocol==='file:'&&document.getElementById('tela').classList.contains('pronta')`)); ok('não busca nada fora', await p.av(`performance.getEntriesByType('resource').filter(r=>!/favicon/.test(r.name)).length`) === 0);
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();

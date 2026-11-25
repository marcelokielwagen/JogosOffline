// Som: regras do iPhone simuladas (só libera em touchend/click), interrupção por ligação, áudio travado, segundo plano e computador.
import { abrir, dorme } from './nav.mjs';
const url = '/jogos/nascente/index.html#semescolha'; let p = await abrir({ w: 390, h: 844, movel: true, url });
const est = () => p.av('__nascente.Som.estado'), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
await p.av(`(()=>{const G=['touchend','click','keydown'];window.__g=0;for(const e of G)addEventListener(e,()=>{__g=1;setTimeout(()=>__g=0)},{capture:true});
 const AC=window.AudioContext;window.__n=0;window.__trava=false;window.AudioContext=class extends AC{constructor(){super();__n++;this.q=0;super.suspend()}
  get state(){return __trava&&__n===__travaN?'running':this.inter?'interrupted':super.state} get currentTime(){return __trava&&__n===__travaN?9:super.currentTime}
  resume(){if(!__g)return new Promise(()=>{});this.inter=false;return super.resume()}};})()`);
await p.toque(195, 800); await dorme(600); ok('iPhone: toca no primeiro toque', await est() === 'running', await est());
await p.av('__nascente.Som.contexto.inter=true'); ok('interrompido por ligação', await est() === 'interrupted');
await p.toque(195, 800); await dorme(400); ok('volta no toque seguinte', await est() === 'running');
await p.av('window.__travaN=__n;__trava=true'); await p.toque(195, 800); await dorme(2700); await p.toque(195, 800); await dorme(600);
ok('áudio travado é refeito', await p.av('__n') === 2 && await est() === 'running', await p.av('__n+" contextos"'));
await dorme(3500); for (let i = 0; i < 3; i++) { await p.toque(195, 800); await dorme(300); } ok('não refaz sem precisar', await p.av('__n') === 2);
await p.av(`Object.defineProperty(document,'hidden',{get:()=>window.__h,configurable:true});__h=true;document.dispatchEvent(new Event('visibilitychange'))`); await dorme(400); ok('cala em segundo plano', await est() === 'suspended');
await p.av(`__h=false;document.dispatchEvent(new Event('visibilitychange'))`); await p.toque(195, 800); await dorme(400); ok('volta do segundo plano', await est() === 'running');
await p.av(`document.getElementById('mudo').click()`); await dorme(900); ok('mudo zera', await p.av('__nascente.Som.saida.gain.value') < .01); await p.av(`document.getElementById('mudo').click()`); await dorme(900); ok('tirar o mudo volta', await p.av('__nascente.Som.saida.gain.value') > .5);
ok('celular usa o reforço', await p.av('__nascente.Som.pequeno')); ok('sem erros', !p.erros.length, p.erros[0] || '');
p.fim();

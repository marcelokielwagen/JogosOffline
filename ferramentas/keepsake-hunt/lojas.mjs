// Keepsake Hunt: faz as imagens das lojas tiradas do próprio jogo (gráfico da Google Play e capturas de celular e tablet).   node lojas.mjs [so=grafico,play,iphone,ipad]; o ícone: node icone.mjs
import { abrir, dorme } from './nav.mjs'; import { writeFileSync, mkdirSync } from 'node:fs';
const SAI = 'C:/Users/Minhoca/Projetos/JogosOffline/lojas/keepsake-hunt/imagens', so = (process.argv.find(a => a.startsWith('so=')) || 'so=grafico,play,iphone,ipad').slice(3).split(','); mkdirSync(SAI, { recursive: true });
const p = await abrir({ w: 1024, h: 1024, dpr: 1 }), E = x => p.av(x.replaceAll('@', '__keepsake.')); await dorme(500);
const grava = (nome, url) => writeFileSync(`${SAI}/${nome}`, Buffer.from(url.split(',')[1], 'base64'));
const jpg = async nome => { const r = await p.cmd('Page.captureScreenshot', { format: 'jpeg', quality: 92 }); writeFileSync(`${SAI}/${nome}`, Buffer.from(r.data, 'base64')); };
const pronta = async () => { for (let i = 0; i < 40; i++) { await dorme(200); if (await E('!!window.__keepsake').catch(() => 0)) break; } await dorme(700); };
// ficha de um jogador no meio do caminho, para as telas terem o que mostrar
const est = {}; for (let k = 1; k <= 24; k++) est[k] = k % 4 ? 3 : 2; const lem = {}; for (const k of [1, 2, 3, 5, 6, 8, 9, 10, 11, 13, 14, 16, 18, 21, 22]) lem[k] = 1;
const ficha = { v: 2, rev: 5, fase: 25, estrelas: est, recordes: { 1: 2400, 24: 4200 }, lembrancas: lem, lidas: { 1: 1, 2: 1, 3: 1 }, cartas: {}, dicas: 4, obras: [5, 3, 1, 0, 0], soma: { vitorias: 26, achados: 190, dias: 4, combo: 9, ultimoDia: '2026-11-25' }, op: { som: true, ambiente: true, vibra: true }, eco: { moedas: 640, presente: 1, ganhos: ['ima', 'vento', 'relogio', 'tempo', 'lista', 'dupla'], inv: { ima: 2, vento: 3, relogio: 1, tempo: 2, lista: 1, dupla: 2 }, gavetas: 4 } };
const acervo = "(()=>{const d=@Progresso.d;for(const id of @Nucleo.FICHA.ids.slice(0,70))d.acervo[id]=1;@Progresso.salvar()})()";
async function preparar() { await E(`(()=>{const d=${JSON.stringify(JSON.stringify(ficha))},h=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};localStorage.clear();localStorage.setItem('keepsake.v2','{"v":2,"soma":"'+h(d)+'","d":'+d+'}')})()`); await p.recarregar(); await pronta(); await E(acervo); await E("document.querySelectorAll('.solta.on').forEach(t=>t.classList.remove('on'));@Econ.inicio()"); await dorme(300); }

// o ícone sai do icone.mjs (medalhão modelado em alta resolução)
if (so.includes('grafico')) {   // gráfico da Google Play (1024x500): a mesa com o nome por cima
  await p.vp(1024, 500, false, 1); await preparar(); await E("@Telas.trocar('abertura')"); await dorme(500);
  await E(`(()=>{document.querySelectorAll('.tela').forEach(t=>t.classList.remove('on'));const d=document.createElement('div');d.id='gf';d.innerHTML='<h2>Keepsake Hunt</h2><p>Remexa a mesa. Ache o que a casa guardou.</p>';d.style.cssText='position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;justify-content:center;align-items:center;background:radial-gradient(60% 70% at 50% 50%,rgba(8,13,11,.72),rgba(8,13,11,.25));text-align:center';document.body.appendChild(d);d.querySelector('h2').style.cssText='margin:0;font:700 96px/1 var(--serifa);color:#f0e9d9;text-shadow:0 6px 30px #000';d.querySelector('p').style.cssText='margin:18px 0 0;font:500 30px var(--corpo);color:#e0b45c;text-shadow:0 2px 12px #000'})()`); await dorme(400); await jpg('grafico-1024x500.jpg'); console.log('gráfico ok');
}
// capturas: a mesma sequência em cada tamanho
async function capturas(pre, w, h, dpr) {
  await p.vp(w, h, true, dpr); await p.cmd('Emulation.setTouchEmulationEnabled', { enabled: true }); await preparar(); const tira = async n => { await dorme(700); await jpg(`${pre}-${n}.jpg`); };
  await E("@Telas.trocar('abertura')"); await tira('1-inicio');
  await E('@Jogo.comecar(24).then(()=>1)'); await dorme(1800); await E("(()=>{const P=@Jogo.P;for(let i=0;i<2;i++){const j=P.objs.findIndex(o=>o.alvo&&P.vale(o));P.tocar(j);}for(let v=0;v<5;v++)if(P.vagas[v]&&P.vagas[v].feita)P.repor(v);@Jogo.refazer()})()"); await dorme(600); await E('@Jogo.pedirDica()'); await dorme(900); await E('@Jogo.pausar(true)'); await tira('2-fase');
  await E('@Jogo.comecar(17).then(()=>1)'); await dorme(1800); await E('@Jogo.pausar(true)'); await tira('3-remexer');
  await E("@Telas.trocar('abertura');@Telas.aba.casa=1;@Telas.abrir('casa')"); await dorme(900); await tira('4-casa');
  await E("@Telas.aba.album=0;@Telas.abrir('album')"); await dorme(500); await E('@Telas.lembranca(3)'); await dorme(1200); await tira('5-lembranca');
  await E("document.querySelectorAll('.solta.on').forEach(t=>t.classList.remove('on'));@Telas.trocar('abertura');@Telas.aba.acervo=1;@Telas.abrir('acervo')"); await dorme(1400); await tira('6-acervo');
  await E("@Telas.trocar('abertura');@Telas.abrir('missoes')"); await tira('7-missoes');
  await E('@Econ.preparo(25)'); await dorme(400); await E("document.querySelector('.bst[data-i=\"tempo\"]').click()"); await tira('8-reforcos');
  console.log('capturas', pre, w * dpr + 'x' + h * dpr);
}
if (so.includes('play')) await capturas('play', 360, 640, 3);         // Google Play: 1080x1920
if (so.includes('iphone')) await capturas('iphone', 430, 932, 3);     // iPhone 6.7": 1290x2796
if (so.includes('ipad')) await capturas('ipad', 1024, 1366, 2);       // iPad 12.9": 2048x2732
console.log('erros', p.erros.slice(0, 4)); p.fim();

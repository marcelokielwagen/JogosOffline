// Glaze Break: testa o jogo SEM INTERNET numa cópia do site (o site de verdade não é tocado).
// Copia a pasta, roda o registrar.mjs na cópia, abre o menu (guarda tudo no aparelho), corta a rede e joga.   node offline.mjs [pasta para fotos]
import { cpSync, mkdtempSync, rmSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { abrir, dorme } from './nav.mjs';
const RAIZ = 'C:/Users/Minhoca/Projetos/JogosOffline', F = process.argv[2], copia = mkdtempSync(path.join(tmpdir(), 'site-gb-'));
cpSync(RAIZ, copia, { recursive: true, filter: f => !/[\\/](\.git|lojas|guardados|node_modules)([\\/]|$)/.test(f.slice(RAIZ.length)) });
console.log(execFileSync('node', [path.join(RAIZ, 'ferramentas/glaze-break/registrar.mjs'), copia]).toString().trim());
let ruins = 0; const ok = (c, m) => { console.log(c ? 'ok   ' : 'FALHA', m); if (!c) ruins++; };
const p = await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/manifest.webmanifest', raiz: copia }), base = p.base + '/';
const ir = async u => { await p.cmd('Page.navigate', { url: base + u }); await dorme(900); for (let i = 0; i < 40; i++) { if (await p.av(`document.readyState==='complete'`).catch(() => 0)) break; await dorme(250); } await dorme(700); };
await ir('index.html'); ok(await p.av(`!!document.querySelector('#cat-acao a[href="jogos/glaze-break/index.html"]')`), 'cartão na categoria Ação');
ok(await p.av(`(()=>{const i=document.querySelector('a[href="jogos/glaze-break/index.html"] img');return i&&i.complete&&i.naturalWidth===720})()`), 'capa aparece');
let pronto = false; for (let i = 0; i < 80 && !pronto; i++) { pronto = /Pronto/.test(await p.av(`document.getElementById('status-offline')?.textContent||''`)); if (!pronto) await dorme(500); } ok(pronto, 'menu diz que está pronto para funcionar sem internet');
if (F) await p.foto(F + '/o-menu.png');
await p.cmd('Network.enable'); await p.cmd('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await ir('index.html'); ok(await p.av(`document.title`) === 'Jogos Offline', 'menu abre sem internet');
await p.av(`document.querySelector('a[href="jogos/glaze-break/index.html"]').click()`); await dorme(2500);
ok(await p.av(`location.pathname.endsWith('/jogos/glaze-break/index.html')&&!!window.__glaze`), 'jogo abre sem internet pelo menu');
await p.av(`__glaze.Jogo.comecar(1).then(()=>1)`); await dorme(400); await p.toque(195, 800); await dorme(1500); ok(await p.av(`!__glaze.Jogo.P.bolas[0].presa&&__glaze.Jogo.aberto===''`), 'joga sem internet');
await p.av(`(()=>{const P=__glaze.Jogo.P;for(const t of P.cel)if(t&&t.vivo){t.vivo=false;P.restam--;}})()`); await dorme(2200); ok(await p.av(`__glaze.Jogo.aberto`) === 'vitoria', 'vence e salva sem internet');
if (F) await p.foto(F + '/o-jogo.png');
await ir('index.html'); await p.av(`document.querySelector('[data-abre="estatisticas"],#bEstat,button[aria-controls*="estat"]')?.click()`);
ok(/Glaze Break[\s\S]*1 de 50/.test(await p.av(`document.body.innerText`)) || /Glaze Break/.test(readFileSync(path.join(copia, 'js/comum.js'), 'utf8')), 'Estatísticas conhecem o Glaze Break');
await ir('jogos/glaze-break/index.html'); ok(await p.av(`!!window.__glaze`), 'link direto abre sem internet'); ok(await p.av(`[...document.querySelectorAll('a[href="../../index.html"]')].every(a=>getComputedStyle(a).display==='none')`), 'link direto: sem botão de voltar à suíte');
console.log('falhas', ruins, '| erros de código', p.erros.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to load|net::/.test(e)).slice(0, 3));
setTimeout(() => { try { rmSync(copia, { recursive: true, force: true }); } catch {} }, 300); p.fim();

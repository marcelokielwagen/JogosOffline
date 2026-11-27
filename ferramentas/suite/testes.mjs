// glaze: Glaze Break conta no total; cozinha-da-le também; tico's crown; keenlight. 17 cartões (gem shatter, keepsake hunt, glaze break e dustline foram guardados na v78)
// Menu por categorias e botão de voltar só para quem entra pela suíte.   node testes.mjs <pasta das fotos>
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 390, h: 844, movel: true, url: '/manifest.webmanifest' }), base = p.base + '/', F = process.argv[2]; let ruins = 0;
const ok = (n, b, x = '') => { if (!b) ruins++; console.log(b ? 'ok   ' : 'FALHA', n, x); };
setTimeout(() => { console.log('TEMPO ESGOTADO'); p.fim(); }, 570000).unref();
const chegou = async u => { await dorme(700); for (let i = 0; i < 40; i++) { if (await p.av(`location.pathname==='/${u.split('?')[0]}'&&document.readyState==='complete'`).catch(() => 0)) break; await dorme(250); } await dorme(900); };
const ir = async u => { await p.cmd('Page.navigate', { url: base + u }); await chegou(u); };
// botões que levam para a suíte e não estão escondidos
const voltas = () => p.av(`[...document.querySelectorAll('a')].filter(a=>a.id!=='voltar'&&a.href.split('?')[0]===new URL('../../index.html',location.href).href&&getComputedStyle(a).display!=='none').length`);
await ir('index.html'); if (F) await p.foto(F + '/menu-celular.png');
ok('cabe na largura', await p.av('document.documentElement.scrollWidth<=innerWidth'));
const cart = await p.av(`[...document.querySelectorAll('a.cartao')].map(a=>a.getAttribute('href'))`); ok('17 cartões em 6 categorias', cart.length === 17 && await p.av(`document.querySelectorAll('.categoria').length`) === 6);
await p.av(`document.querySelector('[data-vai=cartas]').click()`); let y = 0; for (let i = 0; i < 20; i++) { await dorme(300); y = await p.av(`document.querySelector('#cat-cartas').getBoundingClientRect().top`); if (y > 40 && y < 90) break; } /* espera a rolagem suave terminar */ ok('atalho Cartas', y > 40 && y < 90, y); if (F) await p.foto(F + '/menu-cartas.png');
for (const h of cart) {
  await ir('manifest.webmanifest'); await ir(h); const d = await voltas(), arrumado = await p.av(`document.documentElement.scrollWidth<=innerWidth`);
  if (F && /velha|nascente|candeia|gem/.test(h)) await p.foto(F + '/direto-' + h.split('/')[1] + '.png');
  await p.cmd('Page.reload'); await chegou(h); const d2 = await voltas();
  await ir('index.html'); await p.av(`document.querySelector('a[href="${h}"]').click()`); await chegou(h); const s = await voltas(); await p.cmd('Page.reload'); await chegou(h); const s2 = await voltas();
  await ir(h); const d3 = await voltas();
  ok(h, d === 0 && d2 === 0 && s > 0 && s2 > 0 && d3 === 0 && arrumado, `direto ${d}, recarregado ${d2} | pela suíte ${s}, recarregado ${s2} | direto depois ${d3}`);
}
await ir('index.html'); await p.av(`document.querySelector('a[href="jogos/velha/index.html"]').click()`); await dorme(1500); if (F) await p.foto(F + '/suite-velha.png'); await p.av(`document.querySelector('.jo-sair').click()`); await dorme(1200); ok('Sair volta à suíte', await p.av('document.title') === 'Jogos Offline');
await ir('jogos/cruzadas/index.html'); ok('Cruzadas direto: seta interna escondida na lista', await p.av(`getComputedStyle(document.querySelector('#voltar')).display`) === 'none');
// navegador que não conta de onde veio
await p.cmd('Network.enable'); await p.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(document,'referrer',{get:()=>''})` });
await ir('index.html'); await p.av(`document.querySelector('a[href="jogos/freecell/index.html"]').click()`); await dorme(1600); ok('sem referência, pela suíte', await voltas() > 0);
// sem internet
await ir('index.html'); for (let i = 0; i < 60 && !/Pronto/.test(await p.av(`document.getElementById('status-offline').textContent`)); i++) await dorme(500);
await ir('index.html'); await p.cmd('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await ir('jogos/resta-um/index.html'); ok('sem internet, direto', await p.av('document.title').then(t => /Resta/.test(t)) && await voltas() === 0);
await ir('index.html'); await p.av(`document.querySelector('a[href="jogos/resta-um/index.html"]').click()`); await dorme(1600); ok('sem internet, pela suíte', await voltas() > 0);
await p.cmd('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await p.vp(1280, 900); await ir('index.html'); if (F) await p.foto(F + '/menu-pc.png'); ok('erros', !p.erros.length, p.erros.slice(0, 3).join(' | ')); console.log(ruins ? ruins + ' FALHAS' : 'TUDO CERTO'); p.fim();

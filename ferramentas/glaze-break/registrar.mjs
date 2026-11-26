// Glaze Break: liga o jogo ao site (cartão no menu em "Ação", Estatísticas e modo offline) e sobe a versão do sw.js.
// Rodar SÓ na hora de publicar, depois de "git fetch" + atualizar a pasta, e conferindo a versão do sw.js que ele mostra.
// Pode rodar mais de uma vez (o que já estiver ligado fica como está).   node registrar.mjs [pasta do site]
import { readFileSync, writeFileSync } from 'node:fs';
const R = (process.argv[2] || 'C:/Users/Minhoca/Projetos/JogosOffline').replace(/\/?$/, '/');
const ed = (f, marca, fn, opcional = false) => {
  let s = readFileSync(R + f, 'utf8'); if (s.includes(marca)) return console.log(f, 'já tinha');
  const crlf = s.includes('\r\n'); s = s.replaceAll('\r\n', '\n'); const n = fn(s);
  if (n === s) { if (opcional) return console.log(f, 'não encaixou (confira à mão)'); throw new Error('não encaixou em ' + f); }
  writeFileSync(R + f, crlf ? n.replaceAll('\n', '\r\n') : n); console.log(f, 'ok');
};
const antes = readFileSync(R + 'sw.js', 'utf8').match(/jogos-offline-v(\d+)/); if (!antes) throw new Error('sw.js sem versão');
// 1) cartão no fim da categoria Ação
ed('index.html', 'jogos/glaze-break/', s => {
  const i = s.indexOf('id="cat-acao"'); if (i < 0) return s; const j = s.indexOf('    </div>\n    </section>', i); if (j < 0) return s;
  return s.slice(0, j) + `\n    <a class="cartao" href="jogos/glaze-break/index.html">\n      <div class="arte"><img src="capas/glaze-break.webp" width="720" height="900" alt="" decoding="async"></div>\n      <h3>Glaze Break</h3><p>Bola que pega a cor do esmalte e atravessa azulejos: 50 fases</p>\n    </a>\n` + s.slice(j);
});
// 2) Estatísticas: fases vencidas, estrelas e maior veio (lê a ficha glaze-break.v1)
ed('js/comum.js', 'glaze-break.v1', s => {
  s = s.replace(/(\n    let fl = \[\];)/, `\n    let gb = null; try { const x = JSON.parse(localStorage.getItem('glaze-break.v1')); gb = x ? x.d : null; } catch (e) {}$1`);
  const i = s.indexOf("['Keepsake Hunt', [["), j = s.indexOf('\n', i); if (i < 0) return s;
  return s.slice(0, j) + "\n      ['Glaze Break', [['Fases vencidas', `${Object.keys((gb && gb.estrelas) || {}).length} de 50`], ['Estrelas', `${Object.values((gb && gb.estrelas) || {}).reduce((a, b) => a + (+b || 0), 0)} de 150`], ['Maior veio', `${(gb && gb.tot && gb.tot.maiorVeio) || 0} azulejos`]]]," + s.slice(j);
});
// 3) modo offline: o jogo e a capa entram na lista, e a versão sobe 1
ed('sw.js', "'./jogos/glaze-break/index.html'", s => {
  const a = s.replace("'./capas/keepsake-hunt.webp',", "'./capas/keepsake-hunt.webp', './capas/glaze-break.webp',").replace("  './jogos/zen/index.html',", "  './jogos/glaze-break/index.html',\n  './jogos/zen/index.html',");
  return a === s ? s : a.replace(/jogos-offline-v(\d+)/, (_, v) => 'jogos-offline-v' + (+v + 1));
});
// 4) teste da suíte conta um cartão a mais (se o número estiver lá)
ed('ferramentas/suite/testes.mjs', 'glaze', s => s.replace(/(\d+) cartões em (\d+) categorias', cart\.length === (\d+)/, (m, a, b, c) => `${+a + 1} cartões em ${b} categorias', cart.length === ${+c + 1}`).replace("// Menu por categorias", "// glaze: Glaze Break conta no total\n// Menu por categorias"), true);
const depois = readFileSync(R + 'sw.js', 'utf8').match(/jogos-offline-v(\d+)/)[1]; console.log('sw.js: versão', antes[1], '->', depois);

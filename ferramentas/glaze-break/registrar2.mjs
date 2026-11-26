// Glaze Break, Fase 2: as Estatísticas do site passam a ler a ficha nova (glaze-break.v2, com a v1 de reserva) e mostram as peças raras; sobe a versão do sw.js.
// Rodar SÓ na hora de publicar, depois de "git fetch" + atualizar a pasta, e conferindo a versão do sw.js que ele mostra.
// Pode rodar mais de uma vez (o que já estiver feito fica como está).   node registrar2.mjs [pasta do site]
import { readFileSync, writeFileSync } from 'node:fs';
const R = (process.argv[2] || 'C:/Users/Minhoca/Projetos/JogosOffline').replace(/\/?$/, '/');
const ed = (f, marca, fn) => {
  let s = readFileSync(R + f, 'utf8'); if (s.includes(marca)) return console.log(f, 'já tinha');
  const crlf = s.includes('\r\n'); s = s.replaceAll('\r\n', '\n'); const n = fn(s); if (n === s) throw new Error('não encaixou em ' + f);
  writeFileSync(R + f, crlf ? n.replaceAll('\n', '\r\n') : n); console.log(f, 'ok');
};
const antes = readFileSync(R + 'sw.js', 'utf8').match(/jogos-offline-v(\d+)/); if (!antes) throw new Error('sw.js sem versão');
// 1) Estatísticas: lê a v2 (ou a v1, se a pessoa ainda não abriu o jogo depois da Fase 2) e conta as peças raras
ed('js/comum.js', "'glaze-break.v2'", s => s
  .replace("JSON.parse(localStorage.getItem('glaze-break.v1'))", "JSON.parse(localStorage.getItem('glaze-break.v2') || localStorage.getItem('glaze-break.v1'))")
  .replace(/(\['Maior veio', `\$\{\(gb && gb\.tot && gb\.tot\.maiorVeio\) \|\| 0\} azulejos`\])/, "$1, ['Peças raras', `${Object.keys((gb && gb.raras) || {}).length} de 50`]"));
// 2) modo offline: o jogo mudou, a versão sobe 1 (a lista de arquivos é a mesma)
ed('sw.js', 'glaze-break: fase 2', s => s.replace(/const VERSAO = 'jogos-offline-v(\d+)';/, (_, v) => `const VERSAO = 'jogos-offline-v${+v + 1}'; // glaze-break: fase 2`));
const depois = readFileSync(R + 'sw.js', 'utf8').match(/jogos-offline-v(\d+)/)[1]; console.log('sw.js: versão', antes[1], '->', depois);

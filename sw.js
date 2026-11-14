// Funcionamento offline: guarda todos os arquivos no aparelho na primeira visita.
// IMPORTANTE: aumente o número abaixo sempre que qualquer arquivo mudar.
const VERSAO = 'jogos-offline-v13';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './css/base.css', './css/inicio.css', './js/comum.js',
  './icones/icone-192.png', './icones/icone-512.png',
  './jogos/velha/index.html', './jogos/velha/jogo.css', './jogos/velha/jogo.js',
  './jogos/resta-um/index.html', './jogos/resta-um/jogo.css', './jogos/resta-um/jogo.js',
  './jogos/paciencia/index.html', './jogos/paciencia/jogo.css', './jogos/paciencia/jogo.js',
  './jogos/cruzadas/index.html', './jogos/cruzadas/jogo.css', './jogos/cruzadas/jogo.js', './jogos/cruzadas/grades.js', './jogos/cruzadas/grades-temas.js',
  './jogos/caca-palavras/index.html', './jogos/caca-palavras/jogo.css', './jogos/caca-palavras/jogo.js',
  './jogos/dobro/index.html', './jogos/dobro/jogo.css', './jogos/dobro/jogo.js',
  './jogos/pinball/index.html', './jogos/pinball/jogo.css', './jogos/pinball/jogo.js',
];

self.addEventListener('install', e => {
  // cache: 'reload' obriga a buscar a cópia nova de cada arquivo, sem reaproveitar a antiga do navegador.
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(guardado =>
      guardado || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

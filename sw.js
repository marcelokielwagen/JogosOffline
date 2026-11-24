// Funcionamento offline: guarda todos os arquivos no aparelho na primeira visita.
// IMPORTANTE: aumente o número abaixo sempre que qualquer arquivo mudar.
const VERSAO = 'jogos-offline-v41';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './css/base.css', './css/inicio.css', './js/comum.js',
  './icones/icone-192.png', './icones/icone-512.png',
  './capas/velha.webp', './capas/resta-um.webp', './capas/paciencia.webp', './capas/freecell.webp', './capas/cruzadas.webp', './capas/caca-palavras.webp', './capas/dobro.webp',
  './capas/pinball-show.webp',
  './jogos/velha/index.html', './jogos/velha/jogo.css', './jogos/velha/jogo.js',
  './jogos/resta-um/index.html', './jogos/resta-um/jogo.css', './jogos/resta-um/jogo.js',
  './jogos/paciencia/index.html', './jogos/paciencia/jogo.css', './jogos/paciencia/jogo.js',
  './jogos/freecell/index.html', './jogos/freecell/jogo.css', './jogos/freecell/jogo.js', './jogos/freecell/jogos.js',
  './jogos/cruzadas/index.html', './jogos/cruzadas/jogo.css', './jogos/cruzadas/jogo.js', './jogos/cruzadas/grades.js', './jogos/cruzadas/grades-temas.js',
  './jogos/caca-palavras/index.html', './jogos/caca-palavras/jogo.css', './jogos/caca-palavras/jogo.js',
  './jogos/dobro/index.html', './jogos/dobro/jogo.css', './jogos/dobro/jogo.js',
  './jogos/pinball-show/index.html', './jogos/pinball-show/jogo.css', './jogos/pinball-show/principal.js',
  './jogos/pinball-show/fisica/mundo.js', './jogos/pinball-show/regras/conexoes.js', './jogos/pinball-show/mesa/layout.js', './jogos/pinball-show/mesa/cena3d.js', './jogos/pinball-show/mesa/modelagem.js', './jogos/pinball-show/mesa/astronauta.js', './jogos/pinball-show/mesa/efeitos.js', './jogos/pinball-show/audio/som.js', './jogos/pinball-show/mesa/espaco.js',
  './lib/three/three.module.min.js',
  './lib/three/addons/EffectComposer.js', './lib/three/addons/RenderPass.js', './lib/three/addons/ShaderPass.js',
  './lib/three/addons/MaskPass.js', './lib/three/addons/Pass.js', './lib/three/addons/UnrealBloomPass.js',
  './lib/three/addons/OutputPass.js', './lib/three/addons/CopyShader.js',
  './lib/three/addons/LuminosityHighPassShader.js', './lib/three/addons/OutputShader.js',
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

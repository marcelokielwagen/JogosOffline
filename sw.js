// Funcionamento offline: guarda todos os arquivos no aparelho na primeira visita.
// IMPORTANTE: aumente o número abaixo sempre que qualquer arquivo mudar.
const VERSAO = 'jogos-offline-v75'; // glaze-break: fase 2
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './css/base.css', './css/inicio.css', './js/comum.js', './js/suite.js', './js/cartas.js', './js/tabuleiro3d.js', './js/cenarios3d.js', './js/sons-palavras.js', './js/fases.js', './css/palavras.css',
  './icones/icone-192.png', './icones/icone-512.png',
  './capas/velha.webp', './capas/resta-um.webp', './capas/paciencia.webp', './capas/freecell.webp', './capas/cruzadas.webp', './capas/caca-palavras.webp',
  './capas/pinball-show.webp', './capas/ponte-zero.webp', './capas/nascente.webp', './capas/candeia.webp', './capas/hushbell.webp', './capas/aetherdrift.webp', './capas/dustline.webp', './capas/gem-shatter.webp', './capas/keepsake-hunt.webp', './capas/glaze-break.webp', './capas/zen-loop.webp', './capas/zen-ricochet.webp',
  './jogos/velha/index.html', './jogos/velha/jogo.css', './jogos/velha/jogo.js',
  './jogos/resta-um/index.html', './jogos/resta-um/jogo.css', './jogos/resta-um/jogo.js',
  './jogos/paciencia/index.html', './jogos/paciencia/jogo.css', './jogos/paciencia/jogo.js', './jogos/paciencia/sorteio.js',
  './jogos/freecell/index.html', './jogos/freecell/jogo.css', './jogos/freecell/jogo.js', './jogos/freecell/jogos.js',
  './jogos/cruzadas/index.html', './jogos/cruzadas/jogo.css', './jogos/cruzadas/jogo.js', './jogos/cruzadas/grades.js', './jogos/cruzadas/grades-temas.js', './jogos/cruzadas/banco.js', './jogos/cruzadas/banco-geral.js', './jogos/cruzadas/gerador.js',
  './jogos/caca-palavras/index.html', './jogos/caca-palavras/jogo.css', './jogos/caca-palavras/jogo.js', './jogos/caca-palavras/temas.js',
  './jogos/pinball-show/index.html', './jogos/pinball-show/jogo.css', './jogos/pinball-show/principal.js',
  './jogos/pinball-show/fisica/mundo.js', './jogos/pinball-show/regras/conexoes.js', './jogos/pinball-show/mesa/layout.js', './jogos/pinball-show/mesa/cena3d.js', './jogos/pinball-show/mesa/modelagem.js', './jogos/pinball-show/mesa/astronauta.js', './jogos/pinball-show/mesa/efeitos.js', './jogos/pinball-show/audio/som.js', './jogos/pinball-show/mesa/espaco.js',
  './jogos/ponte-zero/index.html', './jogos/ponte-zero/jogo.css', './jogos/ponte-zero/principal.js', './jogos/ponte-zero/ZombieBridgeGame.js',
  './jogos/ponte-zero/nucleo/simulacao.js', './jogos/ponte-zero/dados/balanco.js', './jogos/ponte-zero/audio/som.js', './jogos/ponte-zero/audio/sintese.js', './jogos/ponte-zero/audio/realista.js',
  './jogos/ponte-zero/cena/cena.js', './jogos/ponte-zero/cena/animacoes.js', './jogos/ponte-zero/cena/armas.js', './jogos/ponte-zero/cena/personagens.js', './jogos/ponte-zero/cena/ponte.js', './jogos/ponte-zero/cena/lugares.js', './jogos/ponte-zero/cena/efeitos.js', './jogos/ponte-zero/cena/portoes.js', './jogos/ponte-zero/cena/desenho.js', './jogos/ponte-zero/cena/chefes.js',
  './jogos/ponte-zero/recursos/personagens.bin',
  './jogos/nascente/index.html',
  './jogos/candeia/index.html',
  './jogos/hushbell/index.html',
  './jogos/aetherdrift/index.html',
  './jogos/dustline/index.html',
  './jogos/gem-shatter/index.html', './jogos/gem-shatter/arte/minerais.webp',
  './jogos/gem-shatter/arte/g0-0.webp', './jogos/gem-shatter/arte/g0-1.webp', './jogos/gem-shatter/arte/g0-2.webp', './jogos/gem-shatter/arte/g0-3.webp', './jogos/gem-shatter/arte/g0-4.webp', './jogos/gem-shatter/arte/g0-5.webp',
  './jogos/gem-shatter/arte/g1-0.webp', './jogos/gem-shatter/arte/g1-1.webp', './jogos/gem-shatter/arte/g1-2.webp', './jogos/gem-shatter/arte/g1-3.webp', './jogos/gem-shatter/arte/g1-4.webp', './jogos/gem-shatter/arte/g1-5.webp',
  './jogos/gem-shatter/arte/g2-0.webp', './jogos/gem-shatter/arte/g2-1.webp', './jogos/gem-shatter/arte/g2-2.webp', './jogos/gem-shatter/arte/g2-3.webp', './jogos/gem-shatter/arte/g2-4.webp', './jogos/gem-shatter/arte/g2-5.webp',
  './jogos/gem-shatter/arte/g3-0.webp', './jogos/gem-shatter/arte/g3-1.webp', './jogos/gem-shatter/arte/g3-2.webp', './jogos/gem-shatter/arte/g3-3.webp', './jogos/gem-shatter/arte/g3-4.webp', './jogos/gem-shatter/arte/g3-5.webp',
  './jogos/gem-shatter/arte/g4-0.webp', './jogos/gem-shatter/arte/g4-1.webp', './jogos/gem-shatter/arte/g4-2.webp', './jogos/gem-shatter/arte/g4-3.webp', './jogos/gem-shatter/arte/g4-4.webp', './jogos/gem-shatter/arte/g4-5.webp',
  './jogos/keepsake-hunt/index.html', './jogos/keepsake-hunt/privacidade.html', './jogos/keepsake-hunt/arte/cor.webp', './jogos/keepsake-hunt/arte/nor.webp', './jogos/keepsake-hunt/arte/sombra.webp', './jogos/keepsake-hunt/arte/m0.webp', './jogos/keepsake-hunt/arte/m1.webp', './jogos/keepsake-hunt/arte/m2.webp', './jogos/keepsake-hunt/arte/m3.webp', './jogos/keepsake-hunt/arte/m4.webp',
  './jogos/keepsake-hunt/arte/c0-0.webp', './jogos/keepsake-hunt/arte/c0-1.webp', './jogos/keepsake-hunt/arte/c0-2.webp', './jogos/keepsake-hunt/arte/c0-3.webp', './jogos/keepsake-hunt/arte/c0-4.webp', './jogos/keepsake-hunt/arte/c0-5.webp',
  './jogos/keepsake-hunt/arte/c1-0.webp', './jogos/keepsake-hunt/arte/c1-1.webp', './jogos/keepsake-hunt/arte/c1-2.webp', './jogos/keepsake-hunt/arte/c1-3.webp', './jogos/keepsake-hunt/arte/c1-4.webp', './jogos/keepsake-hunt/arte/c1-5.webp',
  './jogos/keepsake-hunt/arte/c2-0.webp', './jogos/keepsake-hunt/arte/c2-1.webp', './jogos/keepsake-hunt/arte/c2-2.webp', './jogos/keepsake-hunt/arte/c2-3.webp', './jogos/keepsake-hunt/arte/c2-4.webp', './jogos/keepsake-hunt/arte/c2-5.webp',
  './jogos/keepsake-hunt/arte/c3-0.webp', './jogos/keepsake-hunt/arte/c3-1.webp', './jogos/keepsake-hunt/arte/c3-2.webp', './jogos/keepsake-hunt/arte/c3-3.webp', './jogos/keepsake-hunt/arte/c3-4.webp', './jogos/keepsake-hunt/arte/c3-5.webp',
  './jogos/keepsake-hunt/arte/c4-0.webp', './jogos/keepsake-hunt/arte/c4-1.webp', './jogos/keepsake-hunt/arte/c4-2.webp', './jogos/keepsake-hunt/arte/c4-3.webp', './jogos/keepsake-hunt/arte/c4-4.webp', './jogos/keepsake-hunt/arte/c4-5.webp',
  './jogos/glaze-break/index.html',
  './jogos/zen/index.html', './jogos/zen/style.css', './jogos/zen/audio.js', './jogos/zen/loop_game.js', './jogos/zen/okay_game.js', './jogos/zen/app.js',
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

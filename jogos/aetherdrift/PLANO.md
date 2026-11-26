# AetherDrift: Solar Valley — plano e ponto de parada

Jogo 3D contemplativo e claro, **só de voo**: o planador salta de um cume e desce devagar por vales grandes
(rio em degraus, lagos, cachoeiras, florestas, montanhas, névoa no fundo do vale), sobe em espirais de vento
e chega à coroa de luz do próximo cume. Arcos de luz pelo caminho são opcionais.
Sem relógio e sem queda: o vento de baixo nunca deixa o planador encostar no chão ou na água.

## Histórico
- 26–27/11/2026: versão antiga (andar, carro e voo; 3 fases com quebra-cabeças). Marcelo não gostou do boneco andando
  nem do carro e pediu só o voo contemplativo, com cenário mais bonito (inspirado no Nascente), começando por saltar de montanhas.
- **27/11/2026 — refeito do zero (só voo).** Arquivos antigos (`jogador.js`, `elementos.js`, `fases.js`, `fase2.js`, `fase3.js`) apagados;
  estão no Git até o commit 12f8e9c (fase3.js nunca foi para o Git).

- **27/11/2026 (2ª rodada)** — pedido dele: salto do cume, passar por baixo da cachoeira, cenário igual ao Nascente, com corredeiras e aquedutos.
  Feito: aquedutos de pedra creme cruzando o vale (vão central largo sobre o rio, água correndo em cima e cortina de água caindo do arco central;
  atravessar dá respingos na tela e som), corredeiras (degrau com 'c': descida longa com espuma e pedras no rio), 1º vale virou **Vale das Fontes**
  no estilo Nascente (terra clara, verde só perto da água, oliveiras e ciprestes). 2 aquedutos e 2 corredeiras em cada vale.

## O que existe agora
- **3 voos (vales), todos abertos desde o início:**
  1. Vale das Fontes — estilo Nascente: terra clara, oliveiras e ciprestes, 3 cachoeiras, 2 corredeiras, 2 aquedutos, Arco de Pedra, Oliveira Anciã, Lago Espelho.
  2. Desfiladeiro do Entardecer — mesas de arenito em degraus, árvores de outono, 4 cachoeiras, Janela do Desfiladeiro, Bordo Dourado.
  3. Lagos do Céu — picos com neve, lagos turquesa largos, mar de nuvens baixo, Portal de Gelo e Pedra, Lariço Antigo.
- Cada voo: 4 cumes (salta do 1º; passa pela coroa de luz do 2º, 3º e 4º). Cada trecho: mergulho até o rio, arcos de luz
  baixinho sobre a água, espiral de vento perto do próximo cume (sobe sozinha girando), coroa de luz no topo.
- Lugares para descobrir (cachoeiras e especiais): aviso com nome e frase.
- Controles: ← → curva · ↑ mergulha · ↓ sobe · Espaço segurado sobe com o vento · V "deixar o vento levar" (piloto pela rota)
  · arrastar gira a câmera · roda do mouse aproxima · M som · Esc voos. Toque: joystick + botão de subir + botão do vento.
- Progresso em `localStorage['aetherdrift-voos']` = { id: { feito, arcos, lugares } }.

## Como funciona
- Editar em `ferramentas/aetherdrift/fonte/` e rodar `node ferramentas/aetherdrift/montar.mjs`
  (gera `jogos/aetherdrift/index.html`, arquivo único com o Three.js dentro; abre sem internet).
- `som.js` áudio (pad lídio 432 Hz, brisa, cachoeira, sinos) · `mundo.js` relevo 2 km (rio com degraus e lagos, campo de distância ao rio,
  cumes em cone), malha do terreno com cor por vértice, água animada, vegetação em blocos instanciados, pedras, flores, nuvens
  (um desenho só, sempre de frente), cordilheiras ao longe, pássaros, pólen, névoa do vale (`comNeblina`) ·
  `planador.js` modelo e voo (chão macio, térmica em espiral, borda que traz de volta, rastros) · `dados.js` os 3 vales (VOOS) ·
  `voos.js` peças (ArcoLuz, Termica, Cume com coroa e coluna de luz, borrifo de cachoeira, arco de pedra, árvore anciã),
  posição dos cumes e rota de cada trecho · `jogo.js` laço, câmera, controles, telas, piloto do vento.
- **Novo vale:** um item a mais em `VOOS` (dados.js): pontos do rio, degraus (t, nível, 'c' = corredeira), lagos, cumes (t, lado, altura, nome), aquedutos (nomes; a posição é escolhida sozinha perto do fim do 1º e do último trecho, num trecho reto do rio), cores (`aridez: 1` = estilo Nascente).
- Teste no console: `__ad` e `sim(segundos, entrada)`; `__ad.alternarPiloto(true); sim(200)` faz o voo inteiro sozinho.
- Capa: `node ferramentas/aetherdrift/capa.mjs`. A cada mudança, subir a versão do `sw.js`.

## Próximos passos possíveis (só com o OK do Marcelo)
- Testar no celular (desempenho: 300 segmentos de relevo e ~6.500 árvores no toque).
- Mais vales; hora do dia mudando devagar; modo foto.

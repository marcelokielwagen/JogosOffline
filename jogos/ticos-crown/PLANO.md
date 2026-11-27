# Coroa do Minhoca (ex-Tico's Crown) — plano e ponto de parada

Jogo casual 3D de vários desafios, 100% offline (um arquivo HTML só). Pedido de 26/11/2026 (prompt colado).
Nome e personagem próprios (Rei Tico, anime caricato de cabelo laranja, coroa torta, capa vermelha). Nada de nomes,
personagens, arte ou músicas de outros jogos: o pedido citava jogos famosos só como referência de estilo.

## Arquitetura
- Three.js local (`lib/three`), embutido pelo `ferramentas/ticos-crown/montar.mjs` (fonte em `ferramentas/ticos-crown/fonte`).
- Uma tela só, com duas áreas 3D desenhadas no mesmo canvas: o palco do rei e o tabuleiro; mais uma camada de confete por cima.
- Rosto do rei desenhado ao vivo numa textura (troca de expressão sem modelos extras). Joias com material de verniz e reflexo de ambiente.
- Física da Fase 3: própria e pequena (esferas, caixas, impulsos), sem baixar nada. Cannon-es/Rapier só se ele autorizar baixar o arquivo.
- Som: Web Audio gerado na hora (Fase 1 tem os efeitos; música e motor completo na Fase 5).

## Fases (5, uma por comando, com [CHECKPOINT DE SESSÃO] no fim de cada resposta)
1. **Feita (26/11/2026)** Rei Tico 3D com 8 expressões (normal, aceno, feliz, combo, susto, pânico com suor, vitória, choro),
   corpo que pula, gira, treme e segura a cabeça, coroa com mola, capa que balança, olhos que seguem o toque e balão de fala.
   Painel com vidas (voltam 1 a cada 10 min), moedas, estrelas, jogadas e objetivos. Modo Joias: 6 joias (rubi, safira,
   esmeralda, topázio-estrela, ametista, coral-coração), Foguete (4 em linha), Dinamite (L/T), Bola Arco-Íris (5 em linha),
   toque na especial para soltar, 6 super combos (foguete+foguete, foguete+dinamite, dinamite+dinamite, arco-íris+joia,
   arco-íris+especial, arco-íris+arco-íris), gelo (1 e 2 camadas), caixas (1 e 2), cofre (3 batidas), correntes, buracos no
   tabuleiro, queda com deslize na diagonal, dica após 6 s parado, embaralhar sem jogadas, "Festa Real" (jogadas que sobram
   viram foguetes), estrelas por jogadas sobrando, +5 jogadas por 300 moedas, 10 níveis, progresso salvo.
   Testes: `fotos.mjs pasta [celular] [nível]` e `telas.mjs [nível] [celular]`.
2. **Refeita (26/11/2026)** Modo Resgate (`fonte/resgate.js`). A primeira versão (jaula num quadro ao lado) foi rejeitada:
   "sempre igual, só muda a imagem". Agora cena e tabuleiro são uma coisa só (referência de mecânica que ele mandou, arte
   própria): em cima do tabuleiro fica a sala do Rei Tico, que segura a porta contra um depósito de entulho; o entulho desce
   por um canal (E no mapa) dentro do tabuleiro, e cada pedaço quebrado (combinação ao lado ou explosão) faz a pilha descer
   uma casa até esvaziar. Armadilha na sala avança a cada jogada: parede de espinhos, teto de espinhos ou água. Materiais:
   pedras, bolinhas de metal, cubos coloridos. Rei com pose de esforço (dentes cerrados) segurando a porta, "Ufa!" quando a
   pilha sai do depósito, porta abre na vitória, rei espremido/achatado/boiando na derrota. Casas presas embaixo da pilha
   puxam joia do lado. Níveis 4 (pedras+espinhos), 9 (bolinhas+teto), 13 (cubos+água), 17 (pedras+espinhos, canal fundo) — números depois da Fase 3.
   Robô guloso venceu 4, 8 e 11; o 14 é o mais difícil. Testes: `resgate.mjs pasta nível [celular]`, `volta.mjs pasta`.
3. **Feita (26/11/2026)** Modo Arremesso (`fonte/arremesso.js`), jogo à parte, sem tabuleiro: pátio do castelo em 3D, canhão
   de ouro, prateleira com as próximas bolas, rei num quadrinho no canto reagindo. Arraste para mirar (pontos da trajetória +
   anel) e solte para atirar; no toque a mira fica 70 px acima do dedo. Física própria: cada peça é esfera de colisão com
   giro; pilhas dormem até serem atingidas e quem perde o apoio cai em cadeia; voltam a dormir paradas. Peças: lata (alvo),
   cristal (alvo, quebra em impacto forte ou fogo), pedra (pesada, só atrapalha), barril (explode e leva tudo em volta).
   Bolas: ferro, fogo (quebra cristal e acende barril), bomba (explode no primeiro toque). Plataformas fixas e móveis.
   Conta quando a peça cai da plataforma. Vitória: bolas que sobram viram fogos (+1000). Derrota: +3 bolas por 300 moedas.
   Níveis 6, 11, 15 e 18 (agora são 18). Robô (mira no alvo mais baixo, sem prever o movimento) venceu 6, 11 e 18.
   Testes: `arremesso.mjs pasta nível [celular]`, `volta.mjs pasta`.
4. **Feita (27/11/2026)** Modo Pintura (`fonte/pintura.js`): escultura 3D de blocos em relevo num pedestal que balança
   (coração, coroa, castelo, escudo). A cada jogada escolhe-se um pote: a parte pintada vira essa cor e engole os vizinhos da
   mesma cor (onda de cor + respingos). Potes mostram quantos blocos cada cor pinta. Pedra não pega tinta; arco-íris pinta
   tudo em volta; solvente, na primeira vez que a tinta encosta, apaga os blocos pintados em volta e vira bloco comum (a
   regra antiga de apagar toda jogada travava a fase). Limite de jogadas = resolvedor guloso (2 jogadas à frente) + folga;
   cores sorteadas fixas por semente. Níveis 8, 14, 19, 22.
   Mapa (`jogo.js`): trilha que sobe com os 22 níveis, cor e ícone por modo, coroa marcando o atual, rola até ele.
   Baús (`fonte/bau.js`) depois dos níveis 5, 10, 15, 20: baú 3D cai, treme, abre com raios e moedas; dá moedas e reforços.
   Reforços nos níveis de joias e resgate (barra embaixo do tabuleiro, só aparece se tiver algum): martelo (quebra 1 peça),
   flecha (linha), canhão (coluna); não gastam jogada. Testes: `pintura.mjs`, `mapa.mjs`, `volta.mjs`.
5. **Feita (27/11/2026), falta o OK para menu/publicar.** Música de aventura gerada na hora (`som.js`): sequenciador de
   semicolcheias com bateria, baixo, acordes, harpa e melodia sorteada com semente fixa; um tema por modo (mapa, joias,
   resgate em menor e mais rápido, arremesso em marcha, pintura saltitante); a bateria acelera com o perigo do resgate e com
   poucas jogadas; para na vitória/derrota. Salvamento versão 2 (completa campos, corrige valores, salva ao sair da página).
   Balanceamento com robôs (`todos.mjs`): aumentei jogadas dos níveis 2, 4, 9, 10, 11, 13, 20, +1 bola nos arremessos 6, 12,
   21 e folga no 22; robô vence todos (arremesso testado com mira de verdade, `arremesso.mjs`). Capa: `capa.mjs` ->
   `capas/ticos-crown.webp`. Teste da música: `musica.mjs`.

Fora do menu e do sw.js até o sim dele (cartão sugerido: categoria "Combinar e achar").

## Depois de publicado (27/11/2026, pedidos dele)
- Nome: **Coroa do Minhoca**; o rei virou **Rei Minhoca** (pasta continua `jogos/ticos-crown`).
- Pintura saiu (difícil de entender): os 4 níveis foram tirados, o código ficou em `fonte/pintura.js`; agora são 18 níveis
  (resgate 4, 9, 13, 17; arremesso 6, 11, 15, 18); baús depois do 5, 10, 15 e 18. Progresso salvo v3 renumera os níveis.
- Dicas: lâmpada com 3 dicas por nível (mãozinha mostra a melhor jogada); parado 7 s, o rei oferece e a lâmpada pulsa;
  sem dicas, as peças da jogada balançam. Teste: `dica.mjs pasta [celular]`.
- Canhão: toque direto onde quer acertar, sem mira nem trajetória.

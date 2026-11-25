# Progresso — Jogos Offline

O roteiro completo das etapas está em `PROMPT.md`.

## Pronto
- **Etapa 1 (12/11/2026):** estrutura do projeto, tela inicial com 4 cartões,
  tema claro/escuro, funcionamento offline (`sw.js` + `manifest.webmanifest` +
  ícones) e **Jogo da Velha** (2 jogadores, fácil, difícil imbatível, placar
  salvo por modo, desfazer, linha da vitória animada).
- **Etapa 2, parte 1 (12/11/2026):** **Resta Um** (tabuleiro em cruz de 33 casas,
  tocar na peça e no destino, buracos possíveis piscando, desfazer sem limite,
  contadores de peças/jogadas, melhor resultado e vitórias salvos).
- **Etapa 2, parte 2 (12/11/2026):** publicado no GitHub Pages em
  https://marcelokielwagen.github.io/JogosOffline/ (repositório público, branch
  `main`, pasta raiz). Para atualizar o site basta commit + push.
- **Etapa 3 (12/11/2026):** **Paciência** (Klondike): arrastar ou tocar na carta e
  no destino, dois toques mandam para o monte, virar 1 ou 3 cartas, desfazer,
  tempo, jogadas, botão "Completar sozinho" e cartas caindo na vitória.
  Publicada no site.
- **Etapa 4 (12/11/2026):** **Palavras Cruzadas**: 10 grades (9x9 a 11x11, 148
  palavras, sem repetição) em `jogos/cruzadas/grades.js`, teclado próprio com Ç,
  palavra atual destacada, dica acima do teclado, conferir letra/palavra,
  revelar palavra, lista de todas as dicas e progresso salvo por grade.
  As grades foram montadas por um programa que confere que não há cruzamento
  acidental; para criar grades novas, peça para gerar outro lote do mesmo jeito.
- **Etapa 5 (12/11/2026):** acabamento. Tela inicial ganhou Estatísticas (📊) e
  Ajustes (⚙️: sons, vibração, letra grande). Sons curtos feitos pelo próprio
  código em `js/comum.js` (`JO.som`, `JO.vibrar`) ligados nos quatro jogos.
  Paciência e Palavras Cruzadas ajustadas para celular deitado; contraste e
  bordas revistos no tema claro. Publicado.
- **Etapa 6 (12/11/2026):**
  - Endereço aceita qualquer grafia (`jogosoffline`, `JOGOSOFFLINE`...): um
    segundo repositório público, `marcelokielwagen.github.io`, tem só uma página
    `404.html` que redireciona para `/JogosOffline/`.
  - **Resta Um** com tabuleiro maior (peças de 34 para 44 px no celular).
  - **Caça-Palavras** (`jogos/caca-palavras/`): quadro 10x10 sorteado a cada jogo,
    10 temas, 3 níveis, arrastar ou tocar na primeira e na última letra.
  - **Dobro** (`jogos/dobro/`): jogo de deslizar e juntar números iguais (do tipo
    "2048"), com nome e visual próprios, desfazer e recorde.
  - **Palavras Cruzadas por categoria**: 16 grades temáticas novas em
    `jogos/cruzadas/grades-temas.js` (Viagens pelo mundo, Animais, Comidas, Corpo
    humano, Natureza, Brasil, Esportes, Casa), cada uma com uma palavra grande no
    centro. As 10 antigas viraram a categoria "Variadas". Total: 26 grades.
  - Estatísticas incluem os dois jogos novos.
  - Publicada em 13/11/2026 e conferida no site (versão `jogos-offline-v9`, 6 jogos na tela inicial).
- **Etapa 7 (14/11/2026): Pinball Galáxia** (`jogos/pinball/`): pinball no estilo
  dos anos 90, com mesa e nome próprios (não é cópia do Space Cadet). Física
  própria a 600 passos/s, 2 palhetas, lançador com mola, 3 cogumelos, 2
  estilingues, 3 alvos que caem, órbita esquerda com portinholas, buraco negro
  que segura e devolve a bola, 3 luzes do topo (multiplicador até 5x), escudo de
  9 s, bola extra aos 750.000, TILT ao sacudir demais, 5 missões (Lua → Netuno)
  que se repetem mais difíceis, sons feitos pelo código, top 5 de recordes com
  nome. Controles: toque nos lados da mesa / Z e / / setas; espaço ou segurar o
  lado direito para lançar. Estatísticas da tela inicial incluem o pinball.
  - Teste no computador: `window.__pb` (só em localhost) permite rodar a física
    sem animação; um robô jogou 150 bolas sem bola presa nem atravessando parede.
  - Publicado em 14/11/2026 e conferido no site (versão `jogos-offline-v11`, 7 jogos).
- **Botão "🔄 Atualizar jogos" (14/11/2026)** no fim da tela inicial: baixa de novo todos
  os arquivos, apaga a cópia guardada e recarrega. Além disso, a tela inicial
  recarrega sozinha quando uma versão nova termina de baixar (nunca dentro de um jogo).
- **Pinball 2.0 (14/11/2026)**, pedido do dono ("muito simples, bola robotizada"):
  - Física: gravidade 1150, bola gira de verdade (marcas na superfície rodando),
    quiques com pequena imperfeição e borracha mais macia em batidas fortes,
    palhetas com arranque (aceleram), rastro quando a bola está rápida.
  - Mesa nova: rampa de arame (sem força a bola volta), multibola de 3 bolas
    (rampa acende a trava; 2 travas no buraco negro), jackpot na rampa durante a
    multibola, catraca girando na órbita, catapulta na saída esquerda, tacada
    perfeita no lançamento, missão de Saturno virou "suba a rampa".
  - Efeitos: faíscas, pontos subindo, clarões, shows de luzes, cogumelo que desce
    ao bater, alvos caindo animados, reflexo colorido na bola, música de fundo
    própria e placar de pontinhos laranja (DMD) no lugar do texto.
  - Opções (⚙️): 3 ou 5 bolas, Fácil/Normal/Difícil, música, efeitos leves.
  - Testes: robô jogou 3 partidas longas (6 multibolas) sem bola presa nem
    escapando; rampa testada com várias forças; 60 quadros/s no navegador.
  - Publicado em 14/11/2026 e conferido no site (versão `jogos-offline-v14`).
- **Pinball 3.0 (14/11/2026)**, pedido do dono (fundo, velocidade, laterais vazias, mais interação):
  - Velocidade constante: o desenho da bola e das palhetas é suavizado entre os
    passos da física (antes cada quadro andava 9, 10 ou 11 passos e a bola
    parecia acelerar e frear). Brilhos viraram imagens prontas (mais leve) e, se o
    trabalho de um quadro passar de 12 ms, a resolução baixa sozinha.
  - Nave espacial na base do centro: pega a bola, decola, voa pela mesa e solta a
    bola no alto; recarrega em 6 s; a cada 3 voos, Super Voo. Missão de Marte.
  - Cano de vidro com looping à direita do centro (sem força a bola volta antes
    da volta); sai no alto da esquerda. Missão de Netuno.
  - Laterais de baixo: estrelas nos 4 corredores (as 4 acesas recarregam o escudo
    por 10 s), foguete, satélite, faixas de perigo, setas e estrelas nos estilingues.
  - Fundo da página com céu estrelado e nebulosas, moldura cromada com brilho e
    título com o mesmo dourado do logotipo.
  - Testes: robô jogou 15 min (28 voos da nave, 59 entradas no cano, 4
    multibolas) sem bola presa, sem escapar e sem erro; cano testado com várias
    forças; desenho leva menos de 1 ms por quadro.
  - Publicado em 14/11/2026 e conferido no site (versão `jogos-offline-v15`).
- **Pinball 4.0 (14/11/2026)**, pedido do dono (3D, braço travando, nave, bolas extras, textos, cromados, loop):
  - Mesa inclinada em 3D (o alto fica mais longe), feita com inclinação do próprio navegador; o ângulo
    se ajusta à tela (27° no computador, menos no celular em pé para a mesa ficar maior). Bola e nave
    são esticadas para continuarem redondas; paredes, estilingues, cogumelos, alvos e palhetas com altura.
  - Braço travado: as teclas agora são guardadas uma a uma; se o Windows perder o "soltou" (dois Shift
    juntos), a janela perder o foco, abrir um aviso ou o mouse soltar fora, as palhetas descem.
  - Nave virou ônibus espacial (tanque laranja e 2 foguetes que se soltam no voo, compartimento abre
    com a bola). Ao pegar a bola solta **3 bolas** pela mesa (até 5 no total, escudo de 8 s). Recarga 8 s.
  - Bola extra E-X-T-R-A: jogadas grandes acendem letras; com as 5, o buraco negro dá bola extra (1 por bola).
  - Mensagens das jogadas em letras grandes por cima da mesa (camada `#hud`, fora da inclinação);
    pontos que sobem maiores; textos pintados na mesa maiores.
  - Bola cromada (reflexo de céu, horizonte e mesa), trilhos com topo cromado, rampa com arames e
    colunas cromadas, cano de vidro com aros cromados.
  - Looping refeito: a volta fica em pé no ar, com a saída passando na frente da entrada, colunas e sombra.
  - Testes: robô jogou 15 min (até 5 bolas, 31 voos, 14 loopings completos) sem bola presa nem
    escapando; casos do braço travado testados com teclas e mouse simulados; < 1 ms por quadro.
- **Pinball 5.0 (14/11/2026)**, pedido do dono (mesa cheia como as profissionais, andar de cima, trilhos que voltam
  por cima, looping no alto à esquerda, alienígena para matar, mais luzes). Ideias de gênero, desenho próprio:
  - Física com **andares**: cada bola tem `andar` (0 = mesa, 1 = estação); paredes, cogumelos, palhetas e zonas
    só valem no seu andar. Estação orbital no alto à direita (`DECK`), com palheta própria (`palhetas[2]`,
    mexe com a direita), 3 alvos (`ALVOS_DECK`) que acendem o Hipersalto, buraco HIPER (`KICKER`) e cogumelo pequeno.
  - Trilhas: `RAMPA` (direita do centro → estação), `DESCIDA` (ralo da estação → corredor direito),
    `TRAVESSIA` (buraco HIPER → cruza o topo → corredor esquerdo) e `TUBO` (looping em pé no alto à esquerda,
    entrada à esquerda do centro, solta a bola nos cogumelos).
  - `ALIEN` no meio dos cogumelos (no lugar do cogumelo laranja): 8 golpes, anel de vida, explode, vira ovo e
    volta em 14 s com +3 de vida (máx. 20). Missão de Júpiter virou "acerte o alien".
  - Luzes: lâmpadas ao longo das paredes, 3 flashes, setas triplas que correm, anel na plataforma da nave,
    circuitos pintados, ninho do alien, plásticos coloridos.
  - Testes: robô jogou 15 min (até 5 bolas, 38 voos, 46 loopings, 49 travessias, 49 descidas, 24 mortes
    do alien antes de aumentar a vida) sem bola presa nem escapando.
- **Pinball 6.0 (14/11/2026)**, pedido do dono (desenho mostrado antes e aprovado). Versões 4.0 a 6.0 publicadas juntas em 14/11/2026 (`jogos-offline-v20`):
  - **Base Lunar** (`LUA`, andar 1, no alto à esquerda): rampa lunar (`RAMPA_LUA`) sobe pelo corredor da
    órbita; palheta pequena `palhetas[3]` (mexe com a esquerda); 3 corredores (multiplicador, saíram do topo
    da mesa); `CRATERA` que segura e devolve a bola (ALUNISSAGEM com os 3 acesos); volta pela `DESCIDA_LUA`
    ao lado do looping. A `TRAVESSIA` agora leva do buraco HIPER da estação até a Base Lunar.
  - **Nave removida.** No lugar, a estrela FÚRIA: a cada 4 golpes no alien (fora de multibola) ele agarra a
    bola, segura 2,2 s na boca e cospe ela + 3 bolas (multibola alienígena). Missão de Marte = Base Lunar.
  - **Estilingues com mola**: borracha curva para dentro e volta balançando, mola e braço de metal que
    encolhem, clarão; só de encostar a borracha treme.
  - **Luzes de caminho**: trilhas de lâmpadas até cada jogada (correm quando a jogada vale), luzes no
    corredor do lançador e LEDs ao longo de todos os trilhos de arame e do cano.
  - Segurança: piso embaixo das palhetas pequenas e bola do andar de cima fora do chão volta para a mesa.
  - Testes: robô jogou 15 min (até 4 bolas, 10 agarrões, 37 subidas à Lua, 83 à estação, 111 entradas no
    looping) sem bola presa, escapando ou caindo do andar de cima.
- **FreeCell e níveis na Paciência (14/11/2026):**
  - **FreeCell** (`jogos/freecell/`): jogos numerados de 1 a 32.000 com a mesma distribuição do
    FreeCell clássico (jogo nº 1 conferido), escolher número e recomeçar, mover sequências (limite
    pelas células e colunas livres), dois toques mandam para o monte ou célula, cartas sobem sozinhas,
    aviso de "sem jogadas", desfazer sem limite, estatísticas por nível.
    Níveis: Fácil (4 células, só jogos que um resolvedor fecha com 2 células, dica), Médio (4 células,
    qualquer jogo, dica), Difícil (3 células, só jogos com solução, sem dica). As listas estão em
    `jogos/freecell/jogos.js` (448 fáceis e 518 difíceis, entre os jogos 1 a 1.200). A dica 💡 usa o
    mesmo resolvedor dentro do jogo.
  - **Paciência**: o botão Virar 1/3 virou níveis: Fácil (vira 1, Ases e 2 à mão), Médio (vira 3) e
    Difícil (vira 3, só 3 voltas no baralho). Jogo salvo e vitórias antigas continuam valendo.
  - Testes: robô jogou partidas inteiras de FreeCell até vencer (Fácil e Difícil); níveis e limite de
    voltas da Paciência testados no Node. Visual no celular não foi conferido pelo Claude.
- **Cartas maiores no celular (14/11/2026):** Paciência e FreeCell com número/letra da carta ~35%
  maior, naipe do canto maior, pedaço visível de cada carta na pilha mais alto (42% da carta),
  menos margem lateral e espaço entre colunas; o "10" fica mais estreito. Conferido em tela de 375 px.
- Versão atual do cache em `sw.js`: `jogos-offline-v21`. O `sw.js` busca os arquivos com
  `cache: 'reload'` para a atualização nunca guardar cópias antigas.

## Falta
- Nada do roteiro original. Ideias de etapas extras estão no fim do `PROMPT.md`
  (Campo Minado, Memória, Sudoku, Damas, Forca, Caça-Palavras, 2048).
- Ajustes que aparecerem no teste do dono em celular de verdade.

## Lembretes para a próxima etapa
- Cada jogo novo: criar `jogos/<nome>/`, trocar o cartão "em breve" por link em
  `index.html`, incluir os arquivos novos na lista `ARQUIVOS` do `sw.js` e
  **aumentar a versão do cache**.
- Para salvar/carregar use `JO.salvar(chave, valor)` e `JO.carregar(chave, padrao)`
  de `js/comum.js`. Botões com `data-acao="tema"`, `data-abre="id"` e
  `data-fecha` já funcionam sozinhos.
- Para testar: `python -m http.server 8931` na pasta do projeto e abrir
  `http://localhost:8931` (a porta 8765 já é usada por outro programa).

## Testado na Etapa 1
- No navegador do computador em tamanho de celular (375x812): partidas completas
  nos modos 2 jogadores e difícil, desfazer, placar, salvar ao recarregar.
- Offline: com o servidor desligado, a tela inicial e o jogo abriram do cache.

## Testado na Etapa 2
- Resta Um em tamanho de celular: selecionar, pular, desfazer, partida ao acaso
  até ficar sem jogadas, e vitória com a última peça no centro (posição montada
  para o teste, não uma partida inteira ganha à mão).
- O cache novo (v3) guardou os 14 arquivos.

## Testado na Etapa 3
- Em tamanho de celular, por toques simulados: uma partida inteira até a vitória
  (102 jogadas) conferindo as regras a cada passo; arrastar uma carta para outra
  coluna; soltar em lugar inválido (a carta volta); virar 3; desfazer; novo jogo;
  "Completar sozinho" em uma posição montada; aviso de vitória.
- Não conferido de perto: o desenho das cartas em tela real (a janela de teste
  era pequena demais para julgar a leitura) e o arrasto com o dedo de verdade.

## Testado na Etapa 4
- Em tamanho de celular: as 10 grades foram resolvidas inteiras pelo teclado da
  tela até o aviso de vitória; conferir (certo/errado), apagar, revelar, lista
  de dicas, limpar grade e troca horizontal/vertical.
- As dicas foram escritas à mão e não revisadas por outra pessoa.

## Testado na Etapa 5
- Tamanho de celular em pé (375x812) e deitado (812x375), e tela de computador.
- Tema claro conferido visualmente nas cinco telas.
- Ajustes (ligar/desligar som, letra grande) e tela de estatísticas.
- Paciência: arrastar carta em pé e deitado depois da mudança de medidas.
- Offline de verdade: servidor desligado (porta conferida) e as cinco telas
  abriram e funcionaram a partir do cache.

## Testado na Etapa 6
- Redirecionamento do endereço em três grafias, no site real.
- As 26 grades de Palavras Cruzadas resolvidas inteiras pelo teclado da tela.
- Caça-Palavras: os 3 níveis jogados até o fim, metade das palavras arrastando
  e metade tocando na primeira e na última letra.
- Dobro: 157 jogadas comparadas uma a uma com um cálculo independente; desfazer,
  deslizar e fim de jogo (posição montada).
- Resta Um: tamanho novo medido e uma jogada feita.

## Ainda não testado
- Os sons não foram ouvidos (o teste é automático, sem alto-falante): só foi
  conferido que tocar não gera erro.
- Em um celular de verdade: instalação "Adicionar à tela inicial", arrasto com
  o dedo, vibração e som.
- **Pinball mais lento (15/11/2026)**, pedido do dono ("bola muito rápida, deixar mais real"): a mesa
  inteira roda a 70% do tempo real (`RITMO = .7` no ciclo principal de `jogos/pinball/jogo.js`). Bola,
  palhetas, lançador e cogumelos ficam mais lentos na mesma proporção, então as jogadas continuam
  funcionando igual. Para ajustar, mude só esse número (1 = como antes). Cache `jogos-offline-v22`.
- **Braço travado no celular (15/11/2026)**, relato do dono (braço esquerdo ficou levantado, jogando no
  celular): às vezes o aparelho não avisa que o dedo saiu da tela, e a palheta ficava esperando para sempre.
  No celular os toques agora usam os eventos de toque: a cada toque ou movimento o jogo confere a lista de
  dedos que estão de fato na tela e esquece os que sumiram (`sincronizarToques`). Mouse e teclado não mudaram.
  Testes: toques simulados no navegador (soltar normal, dedo sumido sem aviso, dois dedos, lançador).
  Não testado num celular de verdade. Cache `jogos-offline-v23`.
- **Pinball Show de um andar (24/11/2026)**, pedido do dono ("3 andares deixaram o jogo chato"): mesa principal única e
  duas varandas no fundo, só por canos: cabine dos DJs (esquerda) e palco do casal (direita), com 4 personagens 3D
  originais modelados por código (`mesa/personagens.js`). Passagens: 2 canos, elevador de vidro, ponte, túnel-canhão,
  2 voltas com catraca, 3 corredores e 2 trilhos. Regras em `regras/conexoes.js` (4 objetivos → Hora do Show com 3
  bolas). Visual realista (verniz, cromados, acrílico, luz de palco). Testes: regras e 16 partidas na simulação, uma
  partida inteira no navegador. Não testado num celular de verdade. Cache `jogos-offline-v32`.
- **Pinball Show, ajustes (24/11/2026)**, pedido do dono (looping em planeta, cometa que explode, mesa maior e mais clara,
  mais peças e canos, varandas com mais ação, personagens com traço de anime): mesa de 960 de comprimento, 4 canos (2 com
  looping em volta de planetas), cometa com 10 batidas que solta 3 bolas de bônus (`mesa/espaco.js`), varandas com 2
  palhetas e para-choques (visita limitada a 14 s da mesa), acelerador na boca dos canos, personagens com contorno e
  texturas. Testes: regras e 12 partidas na simulação, uma partida inteira no navegador. Não testado num celular de
  verdade. Cache `jogos-offline-v33`.
- **Galatic Pinball (24/11/2026)**, novo nome do Pinball Show (a pasta continua `jogos/pinball-show/`), pedido do dono: sai a
  banda e entram um astronauta flutuando (hang loose) ligado por um cabo a um ônibus espacial (`mesa/astronauta.js`);
  plataformas até o meio da mesa, planetas mais abaixo, 6 loopings, missões em 6 fases com níveis (`regras/conexoes.js`),
  efeitos de cor (`mesa/efeitos.js`), música e sons originais gerados na hora (`audio/som.js`), velocidade 82% (era 60%).
  Testes: regras e 12 partidas na simulação, uma partida inteira no navegador. Sons não ouvidos e não testado num
  celular de verdade. Cache `jogos-offline-v34`.
- **Galatic Pinball sem luz piscando (24/11/2026)**, pedido do dono ("incomoda muito"): nada pisca sozinho (saíram clarões
  de tela, lasers, ondas e pulsos no ritmo da música). Efeitos só quando a bola bate ou completa algo. Cache `v35`.
- **Galatic Pinball mais leve (24/11/2026)**, pedido do dono (meio travado): materiais mais simples, menos peças soltas,
  tudo preparado antes de começar, qualidade que baixa sozinha e fica lembrada (galaticQualidade). Cache `v36`.
- **Galatic Pinball, rastro e letreiros (24/11/2026)**, pedido do dono: rastro da bola só logo depois de bater numa peça;
  letreiros de pontos entram com estouro, ficam menos tempo e saem explodindo. Cache `v37`. Próximo: som.
- **Galatic Pinball, música e cena (24/11/2026)**, pedido do dono: área das palhetas escura; logo do astronauta com a nave
  no centro (no lugar do planeta-disco); loopings dos planetas em trilho fino; asteroide com veios de energia e pedrinhas em
  órbita; astronauta na horizontal, cabo na porta lateral aberta da nave com outro astronauta nos computadores; sem o globo.
  Música nova no estilo house francês (técnica, não cópia): disco original fabricado por código e recortado, filtro, phaser,
  distorção, bombeio do bumbo e voz de robô. Cache `v38`.
- **Galatic Pinball, sons das batidas (24/11/2026)**, pedido do dono: música de fundo aprovada (30% mais baixa); sons das peças
  refeitos e cerca de 12 dB mais fortes, com caminho próprio (não passam mais pelo compressor da música). Cada batida toca nota do
  acorde do momento, batidas seguidas sobem a melodia, a música abaixa um instante e responde no ritmo. Botão de pausa dourado e
  tecla P. Volumes medidos no navegador; não testado num celular de verdade. Cache `v39`.
- **Capas 3D (24/11/2026)**, pedido do dono: os 9 jogos ganharam capa em 3D na tela inicial (pasta `capas/`, imagens prontas, uns 700 KB no
  total). Pinball Galáxia e Galatic Pinball têm desenho próprio; o Galatic usa uma capa larga no celular. As cenas ficam em
  `ferramentas/capas/` e as imagens são refeitas com `node ferramentas/capas/gerar.mjs` (não vai para o celular). Cache `v40`.
- **Pinball Galáxia desativado (24/11/2026)**, pedido do dono: saiu do menu, das estatísticas e do uso offline. O projeto inteiro e a
  capa ficam em `guardados/pinball/`. Os recordes continuam salvos no aparelho. Para reativar: devolver a pasta a `jogos/pinball/`, a
  capa a `capas/pinball.webp`, o cartão em `index.html`, a linha em `js/comum.js` e os arquivos em `sw.js`. Menu com 8 jogos: 2 colunas
  no celular e 4 no computador (a capa larga do Galatic ficou guardada em `capas/`, sem uso). Cache `v41`.
- **Ponte Zero, Fase 2 (24/11/2026)**, jogo novo 3D de ponte contra zumbis (`jogos/ponte-zero/`, módulo `ZombieBridgeGame.js` com
  init/pause/resume/destroy). Fase 1 (proposta) aprovada inteira pelo dono. Protótipo jogável: ponte no pôr do sol, pelotão, 3 armas,
  zumbis (comum, corredor, blindado), portões, barris, vitória e derrota. Personagens montados por `ferramentas/ponte-zero/personagens.js`
  a partir do corpo livre (CC0) do MakeHuman; texturas CC0 do Poly Haven (asphalt_04, concrete_layers_02, rusty_painted_metal).
  Recursos somam 0,7 MB, então o armazenamento separado no sw.js deixou de ser necessário. Capa feita com a cena do jogo (`ferramentas/ponte-zero/capa.mjs`). Publicado como "em construção" a pedido do dono, para testar no celular. Cache `v42`.
  Teste: abrir `jogos/ponte-zero/index.html?teste=1` (expõe `jogo`). Testado: robô em 16 partidas, partida inteira no navegador em pé e
  deitado, pausa, abrir e fechar 20 vezes (0 texturas presas). Não testado num celular de verdade; sons não ouvidos. Próxima: Fase 3.
- **Soldier Survivor (24/11/2026)**, novo nome do Ponte Zero (a pasta `jogos/ponte-zero/` e as chaves salvas continuam), retorno do dono ao
  protótipo. Visual de desenho: personagens próprios modelados por fórmula em `ferramentas/ponte-zero/personagens.js` (o MakeHuman e as texturas
  saíram), luz em faixas e contorno em `cena/desenho.js`, cenário com clima por nível. Tiros com cor por arma; metralhadora, bazuca e lança-chamas
  como especialistas dos portões dourados. 4 níveis com chefe (Cancela, Operário, Sirene, Carcaça) em `cena/chefes.js` e `nucleo/simulacao.js`:
  marca no chão antes do golpe, 3 fases, caixas de reforço, prêmio permanente e próximo nível aberto. Sons e 2 músicas refeitos por conta em
  `audio/sintese.js` (Worker) e tocados por `audio/som.js`. Cache `jogos-offline-v43`.
  Ferramentas: `robo.mjs` (equilíbrio), `medir-som.mjs` (volume), `vitrine.html`, `capa.mjs`. Testado: robô em 5 jeitos de jogar por nível, os 4
  níveis inteiros no navegador, em pé e deitado, 8 aberturas (0 texturas presas), offline com servidor desligado, máximo de 266 mil triângulos no
  modo celular. Não testado num celular de verdade; sons medidos, não ouvidos. Faltam: 6 chefes, níveis 5 a 20, melhorias, infinito, ponte que
  desaba, adrenalina e veteranos.
- **Soldier Survivor, 8 níveis e meio-chefes (24/11/2026)**, pedido do dono depois de jogar: 4 níveis novos (Maré, Porto, Siderúrgica, Última Ponte) com
  4 climas e chefes novos (Afogada, Guindaste, Fornalha, Mãe da Ponte em 3 etapas); meio-chefe com prêmio na hora nos 8 níveis (4 corpos, 8 figuras);
  chefe final com escolta e reforços (escudeiro e cuspidor novos); uma novidade por nível (gaiolas, pista que estreita e caixas de arma, portões que
  correm e adrenalina, carros e portões triplos, laterais, carros que caem, jatos de fogo e hidrantes, ponte que desaba); veteranos com nome.
  Dificuldade crescente (`forca` e `aviso` por nível em `dados/balanco.js`). Sons de tiro, portões, troca de arma e tropa refeitos por conta física em
  `audio/realista.js` (camadas, ferrolho, cápsula, cama de rajada, eco da ponte por convolução); sons dos bonecos idênticos aos anteriores (conferido
  amostra por amostra). `personagens.bin` com 2,4 MB. Cache `jogos-offline-v44`.
  Testado: robô nos 8 níveis (bom vence quase sempre, médio cerca de metade a dois terços nos altos, parado nunca), os 8 níveis inteiros no navegador em
  pé e deitado, modo celular até cerca de 250 mil triângulos, 8 aberturas (0 texturas presas), offline com servidor desligado, áudio sem estourar
  (pico .96). Não testado num celular de verdade; sons medidos, não ouvidos. Faltam: níveis 9 a 20, chefes Para-raios e Siamês, melhorias e modo infinito.
- **Cartas, Cruzadas e Caça-Palavras (24/11/2026)**, pedido do dono (mais temas de TI, toque fluido, níveis mais fáceis, cartas maiores, cruzadas
  menores e mais rápidas).
  Cartas: toque e arrasto comuns em `js/cartas.js` (um toque manda a carta sozinha; arrasto com destino aceso; toque fora da carta ainda vale; salvar
  adiado para não engasgar; no FreeCell o toque não espera mais as cartas que sobem). Cartas de ponta a ponta no celular, mais altas e com número maior;
  deitado, botões na lateral. Nível novo Muito fácil nos dois. Paciência: `jogos/paciencia/sorteio.js` só aceita baralho que um jogador automático vence
  (menos no Difícil). FreeCell: 5 células no Muito fácil; listas novas por `ferramentas/freecell/listas.mjs` (solução com 1 célula).
  Cruzadas: partidas rápidas sorteadas na hora (`gerador.js`, Mini 6 e Média 9 palavras), 15 temas, 6 deles de tecnologia (`banco.js`, 319 palavras); palavra
  certa trava e pula sozinha. As 26 grades antigas ficaram em "Grades grandes", com o progresso salvo. Caça-Palavras: 29 temas em `temas.js` (8 de
  tecnologia) e escolha do tema. Cache `jogos-offline-v45`.
  Testado com toque simulado no Chrome: partida inteira de FreeCell sem esperar animação, arrasto e toque na Paciência, completar sozinho (o botão não
  funcionava no toque, corrigido), cruzadas resolvidas pelo teclado da tela, 29 temas nos 3 níveis, 360x640 a 1440x900, jogos salvos antigos. Não
  testado num celular de verdade.
- **Soldier Survivor, 10 fases, cenários próprios e dificuldades (24/11/2026)**, pedido do dono ("criar níveis, esse sendo fácil; mudar cenário além da
  ponte, apocalipse, muito fogo, inverno que escorrega"): dificuldades Fácil (o jogo como estava), Médio e Difícil, com estrelas por fase
  (`DIFICULDADES` em `dados/balanco.js`); lugar próprio por fase em `cena/lugares.js` (ponte, canteiro de obras, avenida à noite, ferro-velho, montanha
  nevada, beira-mar, porto, cidade em ruínas pegando fogo, siderúrgica com lava, ponte no eclipse), com chão, chamas, lava, mar, neve, cinza e brasas;
  fases novas Inverno (o chão escorrega, placas de gelo, bolas de neve, chefe Nevasca, meio-chefe Lenhador) e Apocalipse (meteoros que deixam entulho,
  chefe Para-raios, meio-chefe Pregador); sons de gelo, raio, meteoro, ventania e fogo. `personagens.bin` com 2,7 MB. Cache `jogos-offline-v48`.
  Testado: robô nas 10 fases e 3 dificuldades (médio vence cerca de 3 em 4 no Fácil, metade no Médio, 1 em 5 no Difícil), as 10 fases inteiras no navegador
  em pé e deitado, modo celular até cerca de 250 mil triângulos, 10 aberturas (0 texturas presas). Não testado num celular de verdade; sons medidos, não ouvidos.
  Faltam: chefe Siamês, mais fases, melhorias e modo infinito.
- **Cruzadas e Caça-Palavras em 3D, com som e 10 fases por tema; Dobro guardado (24/11/2026)**, pedido do dono.
  Comum aos dois: `js/tabuleiro3d.js` (peças 3D com letra, câmera que se ajusta à tela, confete; 10 materiais, um por fase, de Madeira a Diamante),
  `js/cenarios3d.js` (25 cenários por tema, formas paradas juntadas: 10 a 20 chamadas por quadro, até 76 mil triângulos), `js/sons-palavras.js`
  (efeitos e 3 estilos de música feitos por código; música 4 a 5 vezes mais baixa que os efeitos, botão 🎵), `js/fases.js` e `css/palavras.css`.
  Fases: vencer abre a próxima e pula sozinho (janela com contagem de 5 s); estrelas por ajuda usada. Cruzadas: 15 temas, de 4 a 9 palavras; mais 270
  palavras em `banco-geral.js`; as grades grandes continuam. Caça-Palavras: 29 temas, quadro de 7x7 a 11x11, dica nova; os níveis Fácil/Médio/Difícil
  viraram fases. Salvos antigos: grades grandes preservadas; partidas em andamento das versões antigas são descartadas.
  Dobro inteiro em `guardados/dobro/` (com a capa); recordes seguem no aparelho. Para reativar: devolver a `jogos/dobro/` e `capas/dobro.webp`, o
  cartão em `index.html`, a linha em `js/comum.js` e os arquivos em `sw.js`. Cache `jogos-offline-v47`.
  Testado com toque simulado no Chrome: 10 fases seguidas nos dois jogos, fase trancada, pulo sozinho, dica, pausa, música, grade grande, continuar,
  360x640 a 1366x768 e deitado, sem internet, processador 6x mais lento (57 a 61 quadros/s). Não testado num celular de verdade; sons medidos, não ouvidos.
- **Cruzadas de volta à versão anterior (24/11/2026)**, pedido do dono: a versão 3D ficou "muito infantil". Voltou a 2D das partidas rápidas (Mini e
  Média) do commit `a65c85a`, com as 270 palavras extras de `banco-geral.js`; a versão 3D fica no histórico (commit `4f676c6`). O Caça-Palavras segue em
  3D. Cache `jogos-offline-v49`.
- **Nascente (25/11/2026)**, pedido do dono: quebra-cabeça calmo de aquedutos em 3D, em arquivo único (`jogos/nascente/index.html`), com 12 fases, 6 climas,
  sifão e curvas gêmeas, 3 câmeras, dica, desfazer, sons por código e progresso salvo (`nascente.v1`). Fase nova: desenhar o mapa resolvido em `FASES`.
  No menu, nas Estatísticas e no modo offline; com o modo offline ativo usa o Three.js de `lib/three`, senão o da internet. Cache `jogos-offline-v50`.
  Testado: robô nas 12 fases (4.500 conferências da água), toque simulado, pinça, teclado, em pé e deitado, 61 quadros/s. Não testado num celular de
  verdade; sons medidos, não ouvidos.
- **Nascente, 100 fases (25/11/2026)**: 10 mundos x 10 fases (cenário, clima, construções e som próprios), 3 dificuldades com progresso separado
  (`nascente.v2`, migra da v1), andares (aqueduto alto, queda e parafuso d'água), eixo emperrado, peças irmãs, comportas e duas águas com mistura.
  Fases geradas e conferidas por `ferramentas/nascente` (solução única no Médio); detalhes e testes em `jogos/nascente/PLANO-100.md`. `sw.js` v51.
  Em commits locais, falta o dono autorizar a publicação.
- **Candeia (25/11/2026)**, pedido do dono: quebra-cabeça calmo de girar fios de luz, em arquivo único (`jogos/candeia/index.html`), 100 fases em 10 mundos
  (laços, formatos, colmeia, duas chamas, peças irmãs), sons todos por código (giro, sinos, acorde, ambiente) e progresso em `candeia.v1`. Fases geradas
  por semente: mudar `gen` ou `spec` muda todas. No menu, nas Estatísticas e no modo offline. Cache `jogos-offline-v52`. Testado: solução conferida nas 100,
  robô venceu as 100, toque, teclado, em pé e deitado, 61 quadros/s, sem internet. Não testado num celular de verdade; sons medidos, não ouvidos.
  Publicado em 25/11/2026, com autorização do dono.
- **Caça-Palavras com diagonal em todas as fases (25/11/2026)**, pedido do dono (estava fácil): quantidade garantida de palavras na diagonal, de 3 em 5
  (fase 1) a 8 em 10 (fase 10); fase 8 ganhou diagonal de trás para frente. Se as palavras da vez não cabem juntas, sorteia outras (antes podia faltar
  palavra). Cache `jogos-offline-v53`. Testado: 17.400 quadros (29 temas x 10 fases) sem falha; fase 1 jogada arrastando. Não testado num celular de verdade.
- **Gem Shatter (25/11/2026)**, pedido do dono: jogo 1 de uma série de 6 casuais (um por vez, 4 fases cada; ver `jogos/gem-shatter/PLANO.md`). Fase 1: quebrar grupos de
  minerais, arquivo único, 50 fases em 5 galerias, especiais que se combinam, ressonância em cadeia, sons por código, progresso em `gem-shatter.v1`. No menu, nas
  Estatísticas e no modo offline. Cache `jogos-offline-v56`. Testado: robô nas 50 fases (regras e jogadas), 50 fases com toque simulado, 9 tamanhos de tela,
  sons medidos, processador 6x mais lento (44 a 59 quadros/s). Não testado num celular de verdade. Publicado com autorização do dono.
- **Gem Shatter, Fase 2 (25/11/2026)**: restauração de 5 galerias com as estrelas (25 obras, imagens 3D próprias em `jogos/gem-shatter/arte`), coleção de 40
  minerais, 16 marcos, molduras, salvamento com cópia e código para outro aparelho (`gem-shatter.v2`, migra da v1). Cache `jogos-offline-v57`. Detalhes e testes
  em `jogos/gem-shatter/PLANO.md`. Testado: 188 mil conferências da progressão, telas com toque simulado, salvo estragado, sem internet. Não testado num celular
  de verdade. Publicado com autorização do dono.
- **Gem Shatter, Fase 3 (25/11/2026)**: moedas, vidas, 6 boosters, continuar, loja, recompensa diária, missões, evento da semana, ajuda a quem empaca, curva de
  dificuldade refeita e tomada única para anúncios e compras (no site: vídeo de teste e nada à venda). Cache `jogos-offline-v58`. Detalhes em
  `jogos/gem-shatter/PLANO.md`. Testado: 1,5 milhão de conferências, telas com toque simulado, ficha da Fase 2 trazida inteira. Corrigido: os 250 pontos do geodo não
  apareciam no placar. Não testado num celular de verdade. Publicado com autorização do dono.
- **Keepsake Hunt, Fase 1 (25/11/2026)**: jogo 2 da série de 6 (objetos escondidos), pedido do dono. Mesa que dá para remexer com o dedo, 50 fases em 5 cômodos, 8 modos,
  119 objetos 3D feitos por código (`ferramentas/keepsake-hunt`), lupa, dica, combo, lembrança escondida em cada fase, sons por código, progresso em `keepsake.v1`. No menu, nas
  Estatísticas e no modo offline. Cache `jogos-offline-v59`. Detalhes em `jogos/keepsake-hunt/PLANO.md`. Testado: 50 fases com toque simulado, 53 conferências de telas e gestos,
  7 tamanhos de tela, sem internet, sons medidos. Não testado num celular de verdade. Publicado com autorização do dono.
- **Zen (25/11/2026)**, pedido do dono, em 4 etapas: dois jogos num app só (`jogos/zen`, 6 arquivos, sem dependências). Loop Zen (girar peças até fechar o circuito) e
  Ricochet Zen (estilingue, apagar tudo em um lançamento), 50 fases em 3 dificuldades cada (300), geradas por semente; visual próprio de jardim de areia, 10 paletas, música
  e efeitos por código, progresso em `zen.v1`. Mudar gerador ou receita muda as fases: depois rodar `ferramentas/zen/loop-fases.mjs escolher` e `okay-fases.mjs escolher`.
  No menu, nas Estatísticas e no modo offline. Cache `jogos-offline-v60`. Testado: as 300 fases conferidas (solução, repetição), 10.800 lançamentos sem atravessar nada, app inteiro
  com toque simulado (`app-testes.mjs`), sons medidos, regras do iPhone simuladas. Não testado num celular de verdade. Publicado com autorização do dono.
  Depois, a pedido do dono, virou dois cartões no menu (`?jogo=loop` e `?jogo=okay`), cada um com sua capa, só com o seu jogo na tela. Cache `jogos-offline-v61`.

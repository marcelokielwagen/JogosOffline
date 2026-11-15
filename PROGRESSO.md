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

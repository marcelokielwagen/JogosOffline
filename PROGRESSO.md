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
- Versão atual do cache em `sw.js`: `jogos-offline-v15`. O `sw.js` busca os arquivos com
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

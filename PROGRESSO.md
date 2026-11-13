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
- Versão atual do cache em `sw.js`: `jogos-offline-v8`. O `sw.js` busca os arquivos com
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

## Ainda não testado
- Os sons não foram ouvidos (o teste é automático, sem alto-falante): só foi
  conferido que tocar não gera erro.
- Em um celular de verdade: instalação "Adicionar à tela inicial", arrasto com
  o dedo, vibração e som.

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
  Ainda não enviada ao GitHub (falta autorização para o push).
- Versão atual do cache em `sw.js`: `jogos-offline-v4`.

## Falta
- **Etapa 4:** Palavras Cruzadas. **Etapa 5:** acabamento.

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

## Ainda não testado
- Em um celular de verdade e a instalação "Adicionar à tela inicial" (o dono testa
  no próprio aparelho).
- Tema claro e celular deitado foram feitos, mas não conferidos visualmente.

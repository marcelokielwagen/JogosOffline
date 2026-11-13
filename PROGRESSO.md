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
- Versão atual do cache em `sw.js`: `jogos-offline-v3`.

## Falta
- **Etapa 2, parte 2:** criar o repositório público `JogosOffline` no GitHub,
  dar push e ligar o GitHub Pages (só com autorização do dono).
- **Etapa 3:** Paciência. **Etapa 4:** Palavras Cruzadas. **Etapa 5:** acabamento.

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

## Ainda não testado
- Em um celular de verdade e a instalação "Adicionar à tela inicial" (só dá
  depois de publicar no GitHub Pages, na Etapa 2).
- Tema claro e celular deitado foram feitos, mas não conferidos visualmente.

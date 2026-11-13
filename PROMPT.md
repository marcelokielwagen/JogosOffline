# Prompt — Projeto Jogos Offline

Como usar: abra uma sessão na pasta do projeto (`JogosOffline`),
cole o bloco "PROMPT GERAL" **uma vez** e, em seguida, escreva só
`Faça a Etapa 1`. Nas próximas sessões basta escrever `Faça a Etapa 2`, etc.

---

## PROMPT GERAL (colar uma vez)

Você vai construir o projeto **Jogos Offline**: um site de jogos clássicos feito
só com HTML, CSS e JavaScript puro (sem bibliotecas, sem etapa de build, sem
nada baixado da internet), publicado no GitHub Pages e que funcione **no
celular sem internet** depois de aberto uma vez.

**Como o offline funciona (obrigatório):**
- O site é um PWA: tem `manifest.webmanifest`, ícones e um `sw.js` (service
  worker) que guarda **todos** os arquivos no celular na primeira visita.
- Nada pode vir de fora: sem Google Fonts, sem CDN, sem imagens externas.
  Fontes do próprio sistema; desenhos em CSS/SVG dentro do projeto.
- Todos os caminhos são relativos (`./`), porque o site fica em
  `usuario.github.io/JogosOffline/`.
- Cada vez que um arquivo mudar, aumente o número da versão do cache em
  `sw.js`, senão o celular fica com a versão antiga.
- Deve aparecer a opção "Adicionar à tela inicial" e abrir em tela cheia,
  como um aplicativo.

**Visual (obrigatório):**
- Feito primeiro para celular em pé; também funciona deitado e no computador.
- Bonito e caprichado: tema escuro elegante com opção de tema claro, cantos
  arredondados, animações suaves, botões grandes para o dedo (mínimo 44px).
- Tela inicial com um cartão para cada jogo (ícone desenhado, nome, e "em
  breve" nos que ainda não existem).
- Todo jogo tem: botão voltar, novo jogo, desfazer (quando fizer sentido),
  "como jogar" e mensagem de vitória.
- Tudo em português do Brasil.
- O jogo em andamento e as estatísticas ficam salvos no aparelho
  (`localStorage`), para continuar depois de fechar.

**Organização dos arquivos:**
```
index.html            tela inicial
sw.js                 funcionamento offline
manifest.webmanifest
css/base.css          visual compartilhado
js/comum.js           funções compartilhadas (salvar, tema, voltar)
icones/               ícones do aplicativo
jogos/<nome>/index.html, jogo.js, jogo.css
PROGRESSO.md          o que está pronto e o que falta
```

**Regras de trabalho:**
- Faça **somente a etapa que eu pedir**. Não adiante a próxima.
- Economize: não reescreva arquivos que já funcionam, não gere explicações
  longas, não crie arquivos além dos listados.
- Antes de encerrar a etapa: teste abrindo o site no navegador em tamanho de
  celular, jogue uma partida até o fim e confira se abre com a internet
  desligada. Diga com sinceridade o que testou e o que não testou.
- Ao fim de cada etapa: atualize `PROGRESSO.md` (pronto / falta / problemas
  conhecidos) e faça um commit local. Assim, se a sessão acabar no meio, a
  próxima continua de onde parou lendo esse arquivo.
- **Peça minha autorização** antes de criar o repositório no GitHub, de
  publicar ou de dar push. O repositório será público: não coloque nome,
  e-mail ou qualquer dado pessoal nos arquivos.
- Responda em português simples, sem jargão: o que ficou pronto, o que foi
  testado e o que depende de mim.

---

## ETAPAS

### Etapa 1 — Base + Jogo da Velha (etapa curta, cabe no que resta de tokens)
Tamanho pensado para o saldo de hoje (cerca de 17% do limite de 5 horas).
Se o limite acabar no meio, salve o `PROGRESSO.md` primeiro.
1. `git init`, estrutura de pastas, `PROGRESSO.md`.
2. Tela inicial bonita com os cartões: Jogo da Velha (ativo), Resta Um,
   Paciência e Palavras Cruzadas (os três como "em breve").
3. `css/base.css` e `js/comum.js` (tema claro/escuro, salvar, voltar).
4. Offline completo: `manifest.webmanifest`, ícones e `sw.js`.
5. **Jogo da Velha**: 2 jogadores no mesmo celular ou contra o computador
   (fácil / difícil imbatível), placar salvo, linha da vitória animada.
6. Teste e commit local. **Não publicar ainda.**

### Etapa 2 — Resta Um + publicação no GitHub
1. **Resta Um**: tabuleiro inglês em cruz (33 casas), tocar na peça e no
   destino, mostrar jogadas possíveis, desfazer, contador de peças, aviso de
   "sem jogadas" e de vitória (1 peça, bônus se for no centro).
2. Com minha autorização: criar o repositório público `JogosOffline`, dar
   push e ligar o GitHub Pages.
3. Me passar o endereço e o passo a passo para instalar no celular
   (abrir uma vez com internet → "Adicionar à tela inicial").

### Etapa 3 — Paciência (estilo Windows)
1. Paciência clássica (Klondike): 7 colunas, monte, descarte, 4 fundações.
2. Cartas desenhadas em CSS/SVG, legíveis em tela pequena.
3. Jogar tocando (toque na carta, toque no destino) **e** arrastando; dois
   toques mandam a carta para a fundação.
4. Opção virar 1 ou 3 cartas, desfazer, tempo, movimentos, completar
   automático no final e animação de vitória com as cartas caindo.
5. Atualizar a versão do cache e publicar (com autorização).

### Etapa 4 — Palavras Cruzadas
1. Pelo menos 10 grades prontas em português (9x9 a 11x11), com dicas
   horizontais e verticais, guardadas em arquivo dentro do projeto.
   Conferir uma por uma se as palavras cruzam certo e se as dicas batem.
2. Teclado próprio na tela (com Ç e sem depender do teclado do celular),
   destaque da palavra atual, dica visível acima do teclado.
3. Botões: conferir letra, conferir palavra, revelar, e progresso salvo por
   grade.
4. Atualizar a versão do cache e publicar (com autorização).

### Etapa 5 — Acabamento
1. Tela de estatísticas (vitórias, melhor tempo por jogo).
2. Sons curtos opcionais gerados pelo próprio código (sem arquivos de áudio)
   e vibração no celular, com botão para desligar.
3. Revisão de visual em telas pequenas e grandes, e acessibilidade
   (contraste, tamanho de letra).
4. Teste final: instalar no celular, ligar o modo avião e abrir os 4 jogos.

### Etapas extras (se quiser depois)
Campo Minado, Jogo da Memória, Sudoku, Damas, Forca, Caça-Palavras, 2048.
Uma etapa por jogo, sempre no mesmo molde.

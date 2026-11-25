# Nascente: plano das 100 fases

Pedido do dono (25/11/2026): "cria 100 fases com imersões diferentes com níveis de dificuldade aumentando e no início
também 3 níveis de dificuldade; explora bem novos cenários, mas na linha que está, só mais difícil; pode tentar andares
também; caso acabar os tokens, continua quando resetar". Estilo aprovado: sóbrio, contemplativo, adulto.

Regras do trabalho: só mexer em `jogos/nascente`, `ferramentas/nascente`, `js/comum.js` (linha do Nascente), `sw.js` (versão),
`index.html` (cartão), `PROGRESSO.md` e a memória. Um commit LOCAL por etapa, sem push (push = publicar; falta o "sim" do dono).
Antes do commit, `git status`: outra conversa usa a mesma pasta. Gastar pouco: sem subagentes, poucas fotos.

## Decisões
- Mundos (10 fases cada) e novidade: 1 Vale das Oliveiras (bifurcação, degrau, fixa); 2 Serra da Névoa (sifão, gêmeas);
  3 Terraços de Arroz (eixo emperrado, gira 180°); 4 Cânion Vermelho (andar alto passa por cima); 5 Oásis (queda entre andares e
  parafuso d'água que sobe); 6 Jardim dos Bordos (peças irmãs giram juntas); 7 Costa do Farol (água doce e do mar);
  8 Floresta das Ruínas (comportas em par); 9 Montanha do Degelo (fria, termal e mistura); 10 Jardins do Luar (tudo).
- Regras puras entre `// <regras>` e `// </regras>` no HTML; o gerador avalia esse mesmo trecho. Fases entre `// <fases>` e `// </fases>`.
- Altura efetiva = terreno + 2 × andar. A água segue para a peça mais alta da coluna vizinha que não esteja acima dela.
- Fácil: menos distrações, parte das peças já fixa no lugar. Médio: como projetado. Difícil: mais distrações, sem vazamentos.
- As 12 fases antigas viram o mapa Fácil de 8 fases do mundo 1 e 4 do mundo 2 (migração exata de `nascente.v1` para `nascente.v2`).
- Câmera nova "frente" (padrão com o celular em pé); botão de andar (todos / de baixo / de cima).

## Etapas
- [x] 1. Regras novas + gerador + resolvedor (`ferramentas/nascente/gerar.mjs`), fases gravadas no HTML
- [x] 2. Jogo lê as fases novas: andares, peças novas em 3D, duas águas, botão de andar, câmera
- [x] 3. Dificuldades, seletor por mundo, progresso v2 e migração
- [x] 4. Cenários, climas e construções dos 10 mundos
- [x] 5. Sons por mundo
- [x] 6. Testes (lista abaixo)
- [x] 7. `js/comum.js`, `sw.js`, cartão, `PROGRESSO.md`, memória; apagar o aviso (CronDelete); perguntar se publica

## Como testar
`node ferramentas/nascente/<arquivo>.mjs` (Chrome invisível, `nav.mjs`). Pronto = resolvedor 100 × 3; robô (giros ao acaso = regras,
conclui com a solução e só com dicas); folha de fotos por mundo (seca/florida, em pé 390x844 e deitado); 60 quadros/s; memória ao
trocar 100 fases; migração; sem internet; toque e pinça; pico do som <= 0,35.

## Anotações
- Etapa 1: `gerar.mjs <mundo> 30 24` gera fases/mundoN.json; `gravar.mjs` grava no jogo (e copia regras.js: editar as regras SEMPRE em
  regras.js e rodar gravar.mjs); `t1.mjs` = resolvedor 100 x 3 (passou: 1 solução em todas no Médio, 96 no Difícil).
- Etapas 2 e 3 feitas: `t2.mjs` (distrações), `t6.mjs <de> <até> <giros>` (robô; passou 300 de 300), `foto.mjs` (folha de fotos).
  Falta conferir migração e a tela de fases no celular (t4/t7 antigos ainda precisam ser adaptados à v2; usar `#semescolha`).
  MUNDOS está provisório (nomes + temas antigos) logo antes de `// <regras>`; a etapa 4 troca. `LUGAR.marco` também é provisório.
- Etapas 4 e 5 feitas (MUNDOS com 10 cenários, ARV, ADERECOS, MARCOS, CLIMAS, Som.mundo). Falta a etapa 6 (t4, t7, t10, folha de fotos) e a 7.
- Etapas 6 e 7 feitas em 25/11/2026. Resultados: t1 (100 x 3 com solução; médio 1 solução em todas), t2 sem falhas, t6 300 de 300 sem erros,
  t4 tudo ok, t7 61 quadros/s nas mais pesadas, memória estável em 3 voltas de 100 fases, som com pico 0,27, sem CDN ok, t10 offline ok.
  Só falta o "sim" do dono para publicar (git push).

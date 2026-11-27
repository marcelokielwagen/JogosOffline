# Keenlight — plano e ponto de parada

Jogo de objetos escondidos difícil e rico em detalhe (pedido de 26/11/2026), 100% offline, em 5 fases.
Uma fase por comando ("continue" / "próxima fase"); toda resposta termina com **[CHECKPOINT DE SESSÃO]**.
Nome **Keenlight** é provisório. **No menu desde 27/11/2026** (com o sim dele): cartão em "Combinar e achar", capa `capas/keenlight.webp` (`ferramentas/keenlight/capa.mjs`), Estatísticas em `js/comum.js` (`keenlight.v1`: casos, estrelas, conquistas), `sw.js` v81. Sem commit e sem publicar: perguntar.

## Níveis planejados
| # | Nível | Estilo | Fase |
|---|---|---|---|
| 1 | O Ateliê do Pintor | quarto em 3D (Three.js): girar, zoom profundo, gavetas, portas, baú, cortina | 1 — FEITO |
| 2 | Praia Movimentada | ilustração Canvas densa, ondas e gaivotas animadas, zoom + arrasto | 2 — FEITO |
| 3 | Galeria Camuflada | quadro artístico com objetos nas texturas e sombras | 2 — FEITO |
| 4 | Caso Noir | preto e branco (hachuras); item achado ganha cor com onda dourada | 3 — FEITO |
| 5 | Biblioteca Secreta | 3D, lista só com silhuetas | 3 — FEITO |
| 6 | A Cozinha do Relojoeiro | ilustração, lista só com charadas | 3 — FEITO |

## Fases
1. **FEITA (26/11/2026)** Arquitetura, HUD completo e Nível 1.
   - Câmera: arrastar gira (limites por nível), roda/pinça aproxima **onde se aponta**, botão direito / Shift / dois dedos movem; botões +, −, visão inicial; duplo clique aproxima; teclado (setas, +, −, 0, H, Esc). A câmera nunca sai da sala (corte por caixa).
   - Lista: três formas (Nomes ×1, Silhuetas ×1,3, Charadas ×1,6 nos pontos), ícones fotografados do próprio modelo 3D. Tocar num item escolhe o alvo da lupa.
   - Anti-chute: 4 erros em 6 s embaçam a tela 3,5 s, −50 pontos e +10 s.
   - Lupa: recarrega em 45 s; antes disso custa 30 moedas; pulso dourado na região (aponta o móvel quando o item está guardado) e a câmera chega perto.
   - Achou: brilho dourado no objeto, anéis e faíscas, sobe girando e some; sequência rápida (< 9 s) dá bônus.
   - Fim: estrelas (tempo, lupas, embaçadas), bônus de rapidez, moedas; recorde salvo em `keenlight.v1`.
   - Nível 1: 12 objetos (concha atrás da cortina, relógio de bolso na estante ao lado de uma bússola, óculos na pilha de livros, ferradura no aparador, peão branco ao lado do busto de gesso, borboleta na planta perto de folhas secas, chave na gaveta, pena no pote de pincéis, dado debaixo da mesa atrás da cesta, anel no meio das tintas da paleta, tesoura atrás do abajur, moeda de ouro no baú entre moedas de prata e cobre).
2. **FEITA (26/11/2026)** Motor com duas vistas (3D e 2D) e os níveis 2 e 3; níveis 1–3 escolhidos tocando na lista da abertura; "Próximo nível" no fim; som por cenário (tic-tac só no quarto, mar e gaivotas na praia, passos ao longe na galeria).
   - Vista 2D: cena de 3600 × 2250 pintada uma vez em duas camadas (fundo com os objetos, frente transparente com o que tampa); antes de pintar cada objeto guarda o pedacinho do fundo (`remendo`) para apagá-lo quando achado. Zoom até ~4× a tela cheia, arrasto com 1 dedo, pinça com 2. No celular a cena é pintada a 80%.
   - Praia (`praia.js`): ~180 pessoas, 35 guarda-sóis, 50 toalhas, cadeiras, pranchas, castelos, barraca de coco, salva-vidas, vôlei, coqueiros, farol; animados: brilho e ondas, espuma que cobre a garrafa, banhistas e boias, pato, bandeira, gaivotas. Objetos: óculos de sol, relógio meio enterrado, chave do carro, estrela-do-mar na toalha de estrelas, garrafa na espuma, pazinha no castelo, boné na cadeira, máquina fotográfica, frisbee em cima de guarda-sol, pipa no coqueiro, picolé, pato de borracha.
   - Galeria (`galeria.js`): objetos pintados com as cores de onde se escondem (o ícone usa as cores naturais) e verniz/craquelê por cima na frente. Violino na cortina da natureza-morta, lua no céu da tempestade, peixe no rio, máscara na sombra do pedestal, ampulheta na moldura, leque no vestido, guarda-chuva no mosaico, rosa na tapeçaria, coroa no lustre, sino na vitrine, chave no papel de parede, coruja na floresta.
3. **FEITA (26/11/2026)** Níveis 4, 5 e 6; lista fixa por nível (`modo: 'silhueta' | 'charada'` no nível; o botão vira "Só silhuetas"/"Só charadas"); sons novos (chuva no noir, lareira na biblioteca, vários tique-taques na cozinha).
   - Noir (`noir.js`, `noir: true`): escritório de detetive pintado em cor e convertido por `gravura()` (cinza com contraste, hachura cruzada nas sombras, grão); remendo guarda o objeto já cinza. Ao achar: onda que revela a cor + anéis dourados, e o objeto fica colorido. Animados: chuva e letreiro HOTEL piscando na janela, ventilador de teto. Objetos: rosa, batom, ás de copas, chave de hotel, distintivo, gravata, luva, bilhete de trem, colar de pérolas, fósforos, envelope com selo, caneta-tinteiro.
   - Biblioteca (`biblioteca.js`, 3D): estantes até o teto, lareira com fogo e luz tremendo, escada de rodinhas, telescópio, mesa de xadrez, globo, armário, cabideiro, cortina. Estante secreta (livro vermelho) gira e mostra um nicho embutido na parede com vela que acende. Objetos: chave (nicho), ampulheta (lareira), maçã (degrau da escada), xícara, lupa (gaveta), lanterna (embaixo da mesa), torre (entre as peças de xadrez), sininho (armário), bússola (base do globo), cartola (cabideiro), guarda-chuva (atrás da cortina), coruja (prateleira alta). Os dois níveis 3D dividem a cena: só o nível ativo fica visível.
   - Cozinha (`cozinha.js`): relógios com hora certa, pêndulos, cuco a cada 15 s, chaleira com vapor, fogo, neve na janela, gato dormindo com rabo balançando. Charadas: pente, agulha, toalha, garrafa, ovo, vela, colher de pau, esponja, cebola, dedal, luva, pião.
4. **FEITA (27/11/2026)** Mapa de casos, estrelas, moedas, conquistas e salvamento automático.
   - Mapa: quadro de cortiça com 6 cartões tipo polaroide presos por tachinhas e ligados por barbante vermelho (tracejado até o caso ser liberado); cada cartão mostra estrelas, tempo recorde, "novo caso", "em andamento · 5/12", carimbo RESOLVIDO ou cadeado.
   - Desbloqueio: o caso 1 começa aberto; resolver um caso libera o seguinte; dá para abrir antes com 120 moedas (`ficha.abertos`).
   - Patentes por estrelas: Aprendiz (0), Investigador (3), Inspetor (7), Detetive (12), Mestre detetive (18).
   - 14 conquistas (`CONQUISTAS`): primeiro caso, sem lupa, sem embaçar, < 3 min, 5 seguidos, 3 estrelas, silhuetas, charadas, noir, passagem secreta, 15 coisas abertas, 300 moedas, 6 casos, 18 estrelas. Aviso dourado na hora e janela com medalhas e estatísticas (casos, objetos, tempo, lupas, coisas abertas).
   - Salvamento: `ficha.jogo` guarda o caso em andamento (achados, tempo, pontos, lupas, embaçadas, móveis abertos) a cada objeto, a cada 5 s, ao pausar e ao fechar/esconder a página; ao voltar, o botão vira "Continuar: …" e o caso volta como estava. Um caso em andamento por vez.
   - Tela de fim mostra patente, "Novo caso liberado" e as medalhas ganhas.
5. **FEITA (27/11/2026)** Áudio adaptativo, toque revisado e consolidação. **Jogo completo.**
   - Som (`som.js`, `CENAS`): cada cenário com escala, acordes, solista e fundo próprios — quarto (piano, tic-tac), praia (marimba, mar, gaivotas), galeria (piano e cordas, sala grande, passos), noir (contrabaixo andando, vassourinha, trompete abafado, chuva), biblioteca (celesta, nota grave, lareira, relógio lento), cozinha (cordas beliscadas a 112 bpm, vários relógios, chaleira). `Som.progresso(achados, total)`: mais notas e brilho conforme acha; faltando 1–2, pulso grave de coração; 75 s parado, a música abaixa. Efeitos de achar e de vitória usam o instrumento do cenário.
   - Toque: duplo toque/clique aproxima (o erro é adiado 0,28 s e cancelado pelo 2º toque, então não embaça a lupa); arrasto com inércia; vibração curta ao achar/abrir e mais forte ao embaçar (Android); gesto de zoom da página bloqueado no iPhone.
   - Memória: ao trocar de nível, os cenários desenhados que ficaram para trás são desfeitos (refeitos em ~1 s se voltar); os dois 3D ficam.
   - Arquivo único confirmado: ~1 MB, sem nenhum link externo (só o `../../js/suite.js` da coleção, que falha em silêncio fora dela), abre com dois cliques direto do disco.

## Como funciona
- Editar em `ferramentas/keenlight/fonte/` e rodar `node ferramentas/keenlight/montar.mjs` (gera `jogos/keenlight/index.html` com o Three.js dentro, ~800 KB).
- Partes: `praia.js` e `galeria.js` (níveis 2D: `largura, altura, fundo(g), frente(g), itens, animarMeio, animarTopo`), `texturas.js` (Canvas 2D: piso, damasco, tapete persa, quadros a óleo, lombadas, mostrador, mapa…), `pecas.js` (ajudantes e os objetos escondidos), `som.js`, `quarto.js` (Nível 1: `criarAtelie` devolve itens, interativos, câmera e luzes), `jogo.js` (motor).
- Item: `item(id, nome, charada, obj, pai, x,y,z, rx,ry,rz, escala, dentro)`; `dentro` = móveis que o escondem (a lupa aponta para eles enquanto fechados).
- Interativo: `interativo(grupo, tipo, aplicar(k))`, k de 0 a 1 com suavização; tipos com som: gaveta, porta, tampa, cortina.
- Toque: acerta o objeto direto, ou perto do centro na tela (tolerância maior no dedo) se nada estiver na frente.
- Testes: `node ferramentas/keenlight/foto.mjs pasta` (fotos e quadros/s) e `node ferramentas/keenlight/jogar.mjs pasta [movel]` (joga a fase inteira com cliques/toques de verdade). `node ferramentas/keenlight/jogar2d.mjs pasta [movel]` joga praia e galeria. `NIVEIS=3,5 node .../jogar2d.mjs pasta [movel]` escolhe níveis 2D (índice começa em 0); `node .../jogar3d.mjs pasta 4 [movel]` joga um nível 3D tentando ângulos. `node ferramentas/keenlight/final.mjs pasta` (disco, internet, som, duplo toque, inércia, memória) e `node ferramentas/keenlight/progresso.mjs pasta` testa mapa, salvamento, retomada após recarregar, desbloqueio e conquistas. Último resultado (Fase 3): 12/12 nos seis níveis; ~55-60 quadros/s; noir pronto em ~2 s (conversão em gravura).

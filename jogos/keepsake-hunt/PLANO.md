# Keepsake Hunt (jogo 2 da série de 6, objetos escondidos)

Nome confirmado pelo dono em 25/11/2026. Regras da série em `jogos/gem-shatter/PLANO.md`. Nome, arte, fases, sons e regras são próprios.

| Fase | O que é | Estado |
|---|---|---|
| 1 | Protótipo: mecânica, efeitos, som, 50 fases | pronta e publicada (v59) em 25/11/2026 |
| 2 | Casa, álbum, acervo, marcos, mesa do dia e ficha segura | pronta e publicada (v63) em 25/11/2026 |
| 3 | Moedas, vidas, reforços, dificuldade, diária, missões, evento, gavetas, ganchos de anúncio e compra | pronta, aguardando o dono (25/11/2026) |
| 4 | Preparação para as lojas | falta |

## Como é
- **Ideia própria:** a mesa é uma pilha de objetos soltos. Tocar pega; **arrastar remexe** (quem está por cima anda mais, e o que está embaixo aparece). Segurar abre a lupa;
  dois dedos ou a roda do mouse ampliam; dica recarrega em 45 s (mais rápido a cada acerto).
- **8 modos:** L lista, R remexer (alvos enterrados), I todos iguais, S pela sombra, P pares, E escuro com luz no dedo, V um por vez, N só nomes. 5 cômodos x 10 fases
  (Escritório, Cozinha, Ateliê, Sala de TI, Sótão). A 5, a 9 e a 10 de cada cômodo apertam e avisam.
- **Regras:** toque errado tira 4 s e zera o combo; mesa vazia e lupa não punem. Combo: acertos em menos de 6 s um do outro; a partir de 3, +1 s por acerto. Estrelas pelo
  tempo que sobra (40% = 3, 18% = 2). Acabou o tempo: o que faltava fica marcado antes da tela de derrota.
- **Lembrança:** cada fase esconde um medalhão dourado, quase todo coberto (+500 e fica guardado). É a base da coleção da Fase 2.
- Cada tentativa arruma a mesa de outro jeito, sempre igual para a mesma fase e tentativa (`Nucleo.gerar(fase, tentativa, proporção, máscaras)`).

## Como é feito
- `index.html` sem dependências + `arte/` (1,4 MB): 119 objetos 3D modelados por código e pré-fotografados em três folhas: `cor` (cor e recorte), `nor` (inclinação e material) e
  `sombra`; `m0` a `m4` são as mesas. O celular só junta os recortes e calcula a luz (WebGL 2), por isso o brilho acompanha o objeto quando gira.
- Blocos: `nucleo` (catálogo, fases, mesa, remexer, `Partida`), `eco` (economia) e `meta` (progressão), os três sem tela e testáveis no Node; depois Eventos e Ganchos, Progresso, Som, Tela, Jogo, Telas, Monetizacao, Econ.
- **Salvo:** ver Fase 2. `keepsake.v1` (Fase 1) fica intocada.
- Eventos: `fase:inicio, achou, lembranca, dica, fase:vitoria, fase:derrota, salvou`. Ganchos: `antesDaFase, oferecerContinuar, entreFases, premio`.

## Fase 2
- **Casa:** 5 cômodos x 5 obras em ordem (2, 3, 4, 5 e 6 estrelas; 100 de 150). Começa com lençóis, teias e janela tapada. Cômodo pronto: 10% mais tempo nas 10 fases dele
  (`Meta.bonus`; as estrelas da fase continuam pelo tempo normal).
- **Álbum:** as 50 lembranças contam a história de Aurora, Bento, Clara e Téo (`Meta.LEMBRANCAS`); 10 do cômodo abrem uma carta, as 50 abrem a última.
- **Acervo:** os 118 objetos entram quando são achados; cômodo completo dá uma moldura para a mesa. Objeto de perto gira com o dedo (`Tela.girado`).
- **Marcos:** 15 x 3 degraus, pagam dicas guardadas (1, 1, 2). Na fase gasta primeiro a dica da fase, depois a guardada (`Partida.guardadas`, `d.dicas`).
- **Mesa do dia:** abre na fase 6; `n = 1000 + número do dia`, 35 combinações de modo e cômodo; 1 dica por dia, +3 a cada 7 mesas; faltar não zera nada.
- **Salvo:** `keepsake.v2` = {v, soma, d} com conferência, cópia em `keepsake.v2.copia`, migração da v1, código `KH2-`. Tudo passa por `Meta.validar`; duas fichas se juntam por
  `Meta.mesclar` (o que se gasta vem da mais nova). Campo novo na Fase 3: pôr em `Meta.nova`, `validar` e `mesclar`.
- **Ritmo medido:** 1ª obra na fase 1; médio termina as 50 com a casa toda, 30 lembranças e 112 objetos.
- Eventos novos: `obra, comodo:pronto, carta, marco`; `fase:vitoria` traz ganhas, novos, lembNova, cartas.

## Fase 3
- **Uma moeda só** (moedas) e vidas; sem gemas, sem caixa-surpresa, nada sorteado. Todos os números ficam no topo do bloco `eco`.
- **Moedas:** primeira vitória 8 + 3 por estrela + 1 a cada 10 s que sobram (até 4); repetindo, 2 + até 2. Lembrança nova 3, marcos 5/10/20 (além das dicas), cômodo pronto 40, acervo
  completo 30, carta lida 15, mesa do dia 10 (além da dica). Presente de chegada: 100 + 2 por estrela que o jogador já tinha.
- **Vidas:** 5, uma a cada 15 min; até a fase 10 e na mesa do dia não gasta; sair ou recomeçar depois de começar a jogar gasta 1 (a pausa avisa); encher custa 150. Até a fase 10 o
  coração nem aparece.
- **Ferramentas** (durante a fase, não somem com nada da mesa): Ímã (fase 6, 80: até 2 alvos sobem para cima da pilha, ou um par), Vento (9, 60: quem cobre um alvo voa para longe;
  no fim nenhum alvo fica mais coberto do que a mesa permite), Relógio (12, 100: para o tempo 15 s). **Antes da fase:** Tempo extra (8, 60: +15 s), Lista curta (14, 90: 1 a menos, 2
  nas listas de 8 ou mais; nos iguais e pares só se pede menos), Dica dupla (20, 70: cada dica mostra dois). Ganha 2 de cada ao liberar (aparece na tela de vitória).
- **Dica guardada** (`d.dicas`) virou item da loja (50). Sem dica na fase, o botão oferece comprar uma (a partir da fase 6). A diária não dá dica: dica continua sendo o prêmio da
  mesa do dia e dos marcos.
- **Continuar:** +25 s por 100, 160, 240 moedas, ou por vídeo na primeira vez; só aparece se faltam até 4 objetos, e antes de mostrar onde estava o que faltava.
- **Dificuldade:** dente de serra por cômodo (a 5, a 9 e a 10 apertam e avisam), com folga no tempo por posição (`FOLGA` no núcleo: 1ª do cômodo +12%, as difíceis −4%) e +2% a
  +6% nos três últimos cômodos. Quem perde 2, 4 ou 6 vezes a mesma fase ganha 10%, 20% ou 30% mais tempo, e o jogo avisa. Depois de 2 derrotas aparece o pacote lista curta +
  tempo extra por 105 (em vez de 150), só para quem pode pagar.
- **Retenção:** diária de 7 passos que não zera (moedas, reforços, 30 min sem gastar vida); 3 missões por dia (11 tipos); evento da semana de achar objetos de um material (muda na
  segunda, 3 degraus); **gavetas**: uma a cada 10 estrelas, 15 no total, prêmio sempre à vista.
- **Ritmo medido** (modelo de tempo de procura de propósito um pouco lento; estimativa): médio vence 95% das fases normais e ~75% das muito difíceis do sótão na 1ª tentativa;
  iniciante cai para ~30% nas últimas. Moedas no fim das 50: iniciante que gasta ~400, médio que gasta ~1.600, sem gastar ~2.200. Quase nunca fica sem vida.
- **Anúncios e compras:** tudo passa por `Monetizacao.usar(provedor)` com `recompensado(local)`, `intersticial()`, `podeComprar`, `precos()`, `comprar(id)`, `restaurar()`.
  Na web o vídeo é uma contagem de 5 s de teste (sem rede), não há anúncio entre fases e nada é vendido. `?loja=teste` no localhost simula compras. Limites: 8 vídeos por dia;
  entre fases só depois da 12, a cada 4 vitórias, com 3 min de intervalo, nunca para quem comprou qualquer coisa. Compra entregue uma vez por transação. Dobrar a vitória por
  vídeo só da fase 5 em diante.
- **Salvo:** `d.eco` na ficha v2 (`Meta.nova`, `validar`, `mesclar`); ao juntar fichas, moedas, itens e vidas vêm da mais nova; compras, gavetas, diária, missões e evento nunca
  voltam atrás.
- Eventos novos: `booster, gasto, continuou, video:inicio, video:fim, intersticial, compra, compra:falhou, diaria, premio`. `fase:inicio` traz `itens` e `ajuda`.

## Ferramentas (`ferramentas/keepsake-hunt`)
- `node eco.mjs` confere a economia, as ferramentas nas 50 fases, a curva e o ritmo das moedas; `node economia.mjs pasta` testa as telas da Fase 3 com toque simulado (180
  conferências, 5 tamanhos). `node registrar3.mjs` só sobe a versão do `sw.js` (rodar na hora de publicar).
- `node gerar-arte.mjs --k=26` refaz as folhas (objetos em `objetos3d.js`) e o `atlas.json`; depois `node montar.mjs` põe a lista no jogo. `--prova=pasta` só mostra os objetos.
- `node gerar-fundos.mjs` mesas; `node capa.mjs` capa; `node fotos.mjs pasta 1,20` fotografa fases.
- `node jogar.mjs 1-50 [--lento|--pc|--deitado]` robô com toque simulado; `node telas.mjs pasta` telas e gestos; `node som.mjs [--pc]` mede os sons.
- `node gerar-comodos.mjs` refaz os 30 retratos dos cômodos (`comodos3d.js`; 1 a 2 min; `--prova=pasta --estados=0,5`); `node meta.mjs` confere a progressão; `node telas2.mjs pasta`
  testa as telas da Fase 2; `node registrar2.mjs` põe os cômodos no offline e as Estatísticas na ficha nova (já rodado, v63).
- `node registrar.mjs` liga o jogo ao menu, às estatísticas e ao modo offline (sobe a versão do `sw.js`). Já rodado (v59).

## Testado na Fase 3 (25/11/2026)
eco.mjs 4.480 conferências, economia.mjs 180, meta.mjs, telas.mjs 53, telas2.mjs 81, jogar.mjs 1-50 (também lento, deitado e PC), som.mjs (sons novos acima
do fundo no celular), sem internet numa cópia do site. Não testado num celular de verdade.

## Testado (25/11/2026)
50 fases com toque simulado (60 quadros/s; 36 a 49 com processador 4x mais lento), 53 conferências de telas e gestos, 7 tamanhos de tela, giro no meio da fase, ficha estragada, sem
internet (numa cópia do site), picos de som abaixo de 0,61. O tempo das fases é estimativa: robô não enxerga como gente. Não testado num celular de verdade.

# Glaze Break (jogo 3 da série de 6, reflexo e quebra)

Nome escolhido pelo dono em 26/11/2026 (entre Glaze Break, Tile Ricochet e Shard Bounce). Regras da série em `jogos/gem-shatter/PLANO.md`. Nome, arte, fases, sons e
regras são próprios: nenhum jogo existente foi copiado.

| Fase | O que é | Estado |
|---|---|---|
| 1 | Protótipo: mecânica, efeitos, som, 50 fases | publicada em 26/11/2026 (v73, no menu em Ação) |
| 2 | Progressão e retenção (sem perder o salvo) | publicada em 26/11/2026 (v75) |
| 3 | Economia, reforços, dificuldade, diária, ganchos de anúncio e compra | falta |
| 4 | Preparação para as lojas | falta |

## Fase 2 (progressão)
- **Painéis:** um mural de azulejos por lugar (Vaso de flores, Limoeiro, Fonte dos peixes, Relógio da estação, Sol do forno), 11 x 13 azulejos desenhados por código
  (`Meta.mural`). Cada um volta em 5 obras pagas com estrelas (2, 3, 4, 5 e 6: 100 das 150), sempre na ordem dos lugares; os azulejos entram um a um, do centro para
  fora, com som de cerâmica. Painel pronto: barra 6% mais larga nas 10 fases do lugar (`Meta.barra`; as estrelas continuam pelas bolas perdidas).
- **Peça rara:** cada fase tem um azulejo com moldura dourada (de preferência no alto). Quebrado, solta uma peça que cai devagar (24 por segundo, mais lenta que os itens);
  pegue com a barra (+300 pontos). Fica guardada mesmo perdendo a fase. Se cair no chão ou a bola for perdida enquanto ela cai, some e volta na próxima tentativa. Peça
  já guardada não aparece mais.
- **Caderno:** as 50 peças (10 desenhos x cores, moldura dourada), com nome e fase; 10 peças de um lugar abrem uma carta da Mestra Olívia, as 50 abrem a última (6 cartas).
- **Marcos:** 10 x 3 degraus (azulejos, veios, maior veio, jarros, itens, fases sem perder bola, peças, obras, painéis do dia, fases vencidas). Cada degrau dá bolas
  guardadas (1, 1, 2). **Bola guardada:** quando as bolas acabam, o jogo oferece usar uma e continuar (até 2 por partida; a nova volta presa na barra).
- **Painel do dia:** abre na fase 6; o desenho e a dificuldade de uma fase de 11 a 49 (nunca as muito difíceis) com outra semente (`Nucleo.nivel(base, 1000 + dia)`),
  igual para todo mundo no mesmo dia. Sem estrelas e sem peça rara. Vencer dá 1 bola guardada, e mais 3 a cada 7 painéis; faltar um dia não zera nada.
- **Início:** Jogar, Fases, Painéis, Caderno, Marcos, Do dia e Ajustes; ponto dourado quando dá para restaurar, quando há carta nova e quando o do dia está esperando.
  Vitória e derrota mostram a peça guardada, carta nova, marcos e o botão "Restaurar o painel" quando há estrelas para isso.
- **Salvo:** `glaze-break.v2` = {v, soma, d} com conferência e cópia em `glaze-break.v2.copia`. Na primeira abertura a ficha da Fase 1 (`glaze-break.v1`) vira v2 sem
  perder nada e **fica intocada**. Tudo passa por `Meta.validar` (obras na ordem e nunca gastando mais estrelas do que existem). Ajustes têm **código do progresso**
  (`GB2-...`) para levar a outro aparelho; o código se junta com a ficha de lá por `Meta.mesclar` (o que se conquista fica; o que se gasta vem da mais nova). Campo novo
  na Fase 3: pôr em `Meta.nova`, `validar` e `mesclar`.
- Eventos novos: `rara, obra, painel:pronto, carta, marco, dia`; `fase:vitoria` traz `dia` e `rara`.
- **Ritmo medido (jogador médio simulado):** primeira obra na fase 1; painel do Ateliê pronto antes da fase 10; termina as 50 com os 5 painéis, ~30 peças e ~20 bolas
  guardadas (a Fase 3 deve dar uso a elas e talvez reduzir).
- Ferramentas novas: `node meta.mjs` (56 mil conferências: ficha, migração, junção, código, painéis, marcos, painel do dia, peça rara na física, ritmo);
  `node telas2.mjs pasta` (55 conferências das telas novas com toque simulado, fotos em pé e deitado); `node registrar2.mjs` (Estatísticas leem a v2 e mostram as peças
  raras; sobe o sw.js; **rodar só na hora de publicar**).

## Como é
- Oficina de azulejos esmaltados: terracota, ocre, sálvia e vinho, sobre fundos escuros e quentes (nada de azul). Barra de madeira com pontas de latão, bola de cerâmica.
- **Regra própria, o esmalte:** a bola fica da cor do último azulejo que quebrou e **atravessa direto** os azulejos da mesma cor, quebrando em sequência (o "veio",
  com notas que sobem e pontos a mais). Mesma cor quebra até azulejo grosso de uma vez. Cor diferente: rebate e racha. A bola começa marfim (sem esmalte).
- **Jarro de esmalte:** quebrado, espirra a cor dele nos vizinhos (3 x 3 e mais um de cada lado), e até o biscoito vira esmaltado. Combina com a regra do esmalte.
- **Últimos azulejos:** quando sobram poucos (até 3, ou 8% do painel) e a bola passa 5 s subindo sem quebrar nada, ela puxa de leve na direção do mais perto. Evita a caça
  sem fim ao último azulejo.
- Casas: azulejo esmaltado (1 ou 2 batidas), biscoito (barro sem esmalte, não muda a cor da bola), ferro (não quebra, a partir da fase 6), jarro (a partir da 3).
- Itens escondidos (pontinho dourado no azulejo): Barra larga (14 s), Três bolas, Bola lenta (10 s), Pincel (a bola pega a cor que mais tem no painel).
- **3 bolas por fase**; estrelas = 3 menos as bolas perdidas (mínimo 1). Perder uma bola tira os itens ativos e a nova bola volta presa na barra.
- **50 fases** em 5 lugares (Ateliê, Pátio, Fonte, Estação, Forno), 10 desenhos de painel sempre simétricos. Dente de serra: em cada grupo de 10, a 5 e a 9 são difíceis
  e a 10 muito difícil (bola mais rápida, barra mais curta, mais azulejos grossos e ferro), com aviso na tela, marca no mapa e no título.
- Controle: arrastar o dedo em qualquer lugar move a barra (relativo, o dedo não tampa a bola); toque curto lança. Mouse segue a seta; teclado: setas e espaço; Esc pausa.
- Onde a bola bate na barra decide o ângulo (meio sobe reto, pontas inclinam até 62°). A bola acelera 1,2% a cada rebatida, até 22% a mais.
- Campo de medidas fixas (120 x 180): girar o celular não muda nada. Em pé o campo fica no alto e sobra lugar embaixo para o dedo; deitado o placar vai para o lado.

## Como é feito
- `index.html` sem dependências, sem imagens: os azulejos são desenhados por código e guardados como figurinhas (uma por tipo e tamanho de tela).
- Blocos: `nucleo` (fases, física e regras; sem tela, roda no Node), Eventos e Ganchos, Progresso, Som, Tela (canvas 2D), Jogo (liga tudo ao dedo), Telas.
- Física em passos de 1/120 s, e a bola anda no máximo 0,7 unidade por passinho (nunca atravessa um azulejo sem querer). Bola em vaivém sem quebrar nada há 8 s ganha um
  empurrãozinho no ângulo (nas paredes e no ferro). Cada fase sai sempre igual (`Nucleo.nivel(n)`); todo azulejo é alcançável (o ferro que fecha algum vira biscoito).
- **Salvo:** `glaze-break.v1` = {v, soma, d} com conferência (se não bate, usa a cópia `glaze-break.v1.copia`; se nada presta, recomeça sem travar). Tudo passa por
  `Progresso.validar`. Campo novo na Fase 2: pôr em `nova` e `validar` (e criar `mesclar`, como nos jogos 1 e 2).
- Eventos: `fase:inicio, quebrou, veio, jarro, item, bola:perdida, fase:vitoria, fase:derrota, salvou`.
- Ganchos (vazios, para as Fases 2 e 3): `antesDaFase(n)` → `{vidas, largo, lenta}`; `oferecerContinuar(p)` → bolas a mais (a partida usa `p.continuar(k)`);
  `entreFases(n)`; `premio(tipo, dados)` com `estrela`, `recorde` e `veio` (veio de 6 ou mais).
- Som por Web Audio: cada esmalte tem a sua nota de cerâmica, o veio sobe a escala, barra de madeira, ferro metálico, jarro com respingo; fundo de cada lugar (oficina, vento
  com passarinho, água da fonte, trem longe, brasa) e piano de feltro baixinho. Reforço para alto-falante de celular, libera no primeiro toque, refaz o áudio se travar.

## Ferramentas (`ferramentas/glaze-break`)
- `node calibrar.mjs [1-50] [--jogos=16]`: confere as regras (esmalte, racha, jarro, simetria, dente de serra) e joga as 50 fases no Node com um robô perfeito e uma
  "pessoa" simulada (demora a reagir, erra a previsão, mais com bola rápida, às vezes se distrai). `cerebro.js` é o cérebro dos dois robôs.
- `node jogar.mjs 1-50 [--ritmo=3] [--pc] [--deitado] [--lento] [--foto=pasta]`: robô com toque simulado no Chrome (arrasta e toca de verdade); `--ritmo` acelera o
  relógio do jogo, `--ritmo=1` é tempo real.
- `node telas.mjs pasta`: telas, toque, giro, 5 tamanhos, derrota, vitória, salvo e ficha estragada, com fotos. `node som.mjs [--pc]`: mede os sons contra o fundo.
- `node fotos.mjs pasta 0,1,10 [--pc|--deitado]`; `node capa.mjs` refaz `capas/glaze-break.webp`.
- `node offline.mjs [pasta]`: copia o site, roda o `registrar.mjs` **na cópia**, guarda tudo, corta a rede e joga.
- `node registrar.mjs`: liga o jogo ao menu (Ação), às Estatísticas e ao modo offline e sobe a versão do `sw.js`. Já rodado (v73). Rodar só na hora de
  publicar, depois de `git fetch`/atualizar e conferindo a versão que ele mostra.

## Ritmo medido (26/11/2026, estimativa)
- Pessoa simulada: 30 s a 2,5 min por fase (média perto de 1,5 min), vence quase sempre; nas difíceis perde em média 0,3 a 0,9 bola, nas normais 0 a 0,2.
  O modelo de pessoa é só uma aproximação: jogador de verdade deve perder mais bolas no fim. Não testado num celular de verdade.

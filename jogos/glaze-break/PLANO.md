# Glaze Break (jogo 3 da série de 6, reflexo e quebra)

Nome escolhido pelo dono em 26/11/2026 (entre Glaze Break, Tile Ricochet e Shard Bounce). Regras da série em `jogos/gem-shatter/PLANO.md`. Nome, arte, fases, sons e
regras são próprios: nenhum jogo existente foi copiado.

| Fase | O que é | Estado |
|---|---|---|
| 1 | Protótipo: mecânica, efeitos, som, 50 fases | pronta em 26/11/2026, **sem commit e fora do menu** (falta o sim do dono) |
| 2 | Progressão e retenção (sem perder o salvo) | falta |
| 3 | Economia, reforços, dificuldade, diária, ganchos de anúncio e compra | falta |
| 4 | Preparação para as lojas | falta |

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
- `node registrar.mjs`: liga o jogo ao menu (Ação), às Estatísticas e ao modo offline e sobe a versão do `sw.js`. **Ainda não rodado no site.** Rodar só na hora de
  publicar, depois de `git fetch`/atualizar e conferindo a versão que ele mostra.

## Ritmo medido (26/11/2026, estimativa)
- Pessoa simulada: 30 s a 2,5 min por fase (média perto de 1,5 min), vence quase sempre; nas difíceis perde em média 0,3 a 0,9 bola, nas normais 0 a 0,2.
  O modelo de pessoa é só uma aproximação: jogador de verdade deve perder mais bolas no fim. Não testado num celular de verdade.

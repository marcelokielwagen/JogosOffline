# Gem Shatter (jogo 1 da série de 6)

Série em fases, um jogo por vez e uma fase por conversa: 1 grupos de cubos (este) · 2 objetos ocultos · 3 reflexo e quebra · 4 combinar 3 · 5 juntar itens ·
6 colorir por números. Os títulos citados no pedido são só referência de gênero: nome, visual, fases, sons e regras são próprios.

| Fase | O que é | Estado |
|---|---|---|
| 1 | Protótipo: mecânica, efeitos, som, 50 fases | pronta e publicada (v55) em 25/11/2026 |
| 2 | Progresso além da fase (coleção, restauração de áreas, marcos) e salvamento robusto | falta |
| 3 | Moedas, boosters, dificuldade, recompensa diária, ganchos de anúncio e compra | falta |
| 4 | Preparação para as lojas | falta |

## Como é
- Arquivo único `index.html`, sem dependências. Blocos: `<script id="nucleo">` (regras, sem tela; roda no Node), Eventos e Ganchos, Progresso, Som, Arte, Tela, Jogo.
- Regra própria: **ressonância** (4 ou mais pedras da cor quebrada que caem juntas quebram sozinhas). Especiais: 5 broca, 7 carga, 9 prisma; encostados se combinam.
- Salvo em `gem-shatter.v1` (`atual`, `liberada`, `estrelas`, `recorde`, `op`, `est`). A Fase 2 deve migrar sem perder isso.
- Para as próximas fases: `Eventos.on('fase:vitoria' | 'fase:derrota' | 'jogada' | 'ressonancia' | 'especial:criado' | 'especial:usado' | 'fase:inicio' | 'salvou')`
  e `Ganchos.especiaisIniciais / oferecerContinuar / entreFases`.

## Testes (`ferramentas/gem-shatter`)
- `node calibrar.mjs` confere as regras e mede as 50 fases com um robô que pensa duas jogadas; `--gravar` recalcula as jogadas.
- `node jogar.mjs 1-50 [--lento] [--foto=pasta]` joga com toque simulado no Chrome. `node som.mjs [--pc]` mede os sons.
- Mexer em `T` (fases) pede `calibrar.mjs --gravar --jogos=100`.

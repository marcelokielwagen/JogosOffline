# Gem Shatter (jogo 1 da série de 6)

Série em fases, um jogo por vez e uma fase por conversa: 1 grupos de cubos (este) · 2 objetos ocultos · 3 reflexo e quebra · 4 combinar 3 · 5 juntar itens ·
6 colorir por números. Os títulos citados no pedido são só referência de gênero: nome, visual, fases, sons e regras são próprios.

| Fase | O que é | Estado |
|---|---|---|
| 1 | Protótipo: mecânica, efeitos, som, 50 fases | pronta e publicada (v56) em 25/11/2026 |
| 2 | Restauração da mina, coleção, marcos e salvamento robusto | pronta e publicada (v57) em 25/11/2026 |
| 3 | Moedas, vidas, boosters, dificuldade, diária, missões, ganchos de anúncio e compra | publicada em 25/11/2026 (v58) |
| 4 | Preparação para as lojas | falta |

## Como é
- `index.html` sem dependências; imagens próprias em `arte/` (galerias e minerais). Aberto sem a pasta `arte`, o jogo funciona com a parede de pedra no lugar das fotos.
- Blocos: `nucleo` (regras), `eco` (economia) e `meta` (progressão), os três sem tela e testáveis no Node; depois Eventos e Ganchos, Progresso, Som, Arte, Tela, Jogo,
  Telas, Monetizacao, Econ.
- Regra própria: **ressonância** (4 ou mais pedras da cor quebrada que caem juntas quebram sozinhas). Especiais: 5 broca, 7 carga, 9 prisma; encostados se combinam.

## Fase 2
- **Mina:** 5 galerias x 5 obras em ordem (2, 3, 4, 5 e 6 estrelas; 100 de 150). Galeria restaurada dá 1 jogada a mais nas fases dela (`Meta.bonusMovs`).
- **Coleção:** 40 minerais reais, 8 por galeria (21 fragmentos cada). 1 fragmento na primeira vitória, +1 ao chegar a 3 estrelas, 1 a cada 3 vitórias repetidas e nos
  marcos. Nunca vem repetido. Coleção completa dá uma moldura do tabuleiro.
- **Marcos:** 16 x 3 degraus, com fragmentos (1, 1, 2).
- **Salvo:** `gem-shatter.v2` = {v, soma, d} com conferência, cópia da ficha anterior em `gem-shatter.v2.copia`, migração da v1 (que fica intocada), código `GS2-` para
  levar a outro aparelho. Ficha sempre passa por `Meta.validar`; duas fichas se juntam por `Meta.mesclar` (nunca perde nada). Campo novo na Fase 3: pôr em `Meta.nova`,
  `validar` e `mesclar`.
- **Ritmo medido:** jogador médio faz a 1ª obra na fase 1 ou 2 e termina as 50 com cerca de 24 obras, 35 minerais e 29 marcos.
- Eventos: `fase:inicio, fase:vitoria (com achados), fase:derrota, jogada, ressonancia, especial:criado, especial:usado, obra, galeria:restaurada, marco, salvou`.
  Ganchos prontos para a Fase 3: `especiaisIniciais`, `oferecerContinuar`, `entreFases`.

## Fase 3
- **Uma moeda só** (moedas) e vidas; sem gemas, sem caixa-surpresa e sem compra por dinheiro no site. Todos os números ficam no topo do bloco `eco`.
- **Moedas:** primeira vitória 10 + 4 por estrela + até 5 pelas jogadas que sobram (repetindo, 3 + até 3); marcos 10/20/40; galeria 60; coleção 80; diária, missões, evento.
- **Vidas:** 5, uma a cada 15 min; até a fase 10 não gasta; recomeçar ou trocar de fase no meio gasta 1; encher custa 150.
- **Ferramentas** (não gastam jogada): Martelo (fase 6, 80), Mistura (9, 60), Perfuratriz (12, 120). **Antes da fase:** Broca (8, 60), Carga (14, 80), Prisma (20, 140).
  Ganha 2 de cada ao liberar. "Próxima" e "Tentar de novo" são na hora; o preparo só aparece sozinho nas fases difíceis.
- **Continuar:** +5 jogadas por 100, 160, 240 moedas, ou por vídeo na primeira vez.
- **Dificuldade:** dente de serra de 10 em 10 (a 5 e a 9 são difíceis, a 10 muito difícil, com aviso na tela); 10 fases aliviadas; quem perde 3, 5 ou 7 vezes a mesma
  fase ganha 1, 2 ou 3 jogadas, e o jogo avisa.
- **Retenção:** diária de 7 passos que não zera ao faltar; 3 missões por dia; evento semanal de quebrar uma cor (muda na segunda).
- **Ritmo medido:** médio que gasta termina as 50 fases com cerca de 220 moedas; sem gastar, 1.800; fica sem vida menos de 1 vez (iniciante, 2).
- **Anúncios e compras:** tudo passa por `Monetizacao.usar(provedor)` com `recompensado(local)`, `intersticial()`, `podeComprar`, `precos()`, `comprar(id)`, `restaurar()`.
  Na web o vídeo é uma contagem de 5 s de teste (sem rede), não há anúncio entre fases e nada é vendido. `?loja=teste` no localhost simula compras.
  Limites: 8 vídeos por dia; entre fases só depois da 12, a cada 4 vitórias, com 3 min de intervalo, nunca para quem comprou. Compra é entregue uma vez por transação.
- **Salvo:** `d.eco` dentro da ficha v2 (validar e mesclar próprios; ao juntar fichas, o que se gasta vem da mais nova, para o código não multiplicar moedas).
- Eventos novos: `booster, gasto, continuou, video:inicio, video:fim, intersticial, compra, compra:falhou, diaria, premio`.

## Testes (`ferramentas/gem-shatter`)
- `node eco.mjs` confere a economia e as ferramentas e mede o ritmo das moedas; `node economia.mjs pasta` testa as telas da Fase 3.
- `node calibrar.mjs` confere as regras e mede as 50 fases com um robô que pensa duas jogadas; `--gravar` recalcula as jogadas (mexer em `T` pede `--gravar --jogos=100`).
- `node meta.mjs` confere a progressão e mede o ritmo; `node telas.mjs pasta` testa as telas da Fase 2 com toque simulado.
- `node jogar.mjs 1-50 [--lento] [--foto=pasta]` joga com toque simulado; `node som.mjs [--pc]` mede os sons.
- `node gerar-arte.mjs [--so=0,minerais]` refaz as imagens a partir de `arte3d.js` (leva uns 3 minutos); `node capa.mjs` refaz a capa.

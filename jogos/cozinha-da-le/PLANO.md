# Cozinha da Le — plano

Jogo casual de empilhar pratos com comida e servir o balcão. Mecânica do gênero
"empilhar e servir"; nome, personagens, arte e sons são nossos (sem copiar o visual
de nenhum jogo existente). Arquivo único: `index.html`, tudo em Canvas 2D, offline.

Personagens no balcão: **Cão 1** (cocker ruivo e branco, à esquerda), **personagem do meio**
(trocado em 26/11/2026 pela foto nova: rosto redondo, barba ruiva, óculos escuros, boné verde
"Brooklyn", camiseta branca e correntinha; fantasia com chapéu tira o boné, com óculos/máscara tira os óculos) e **Cão 2** (preto grisalho, à direita). Nomes dos cães: constante `NOMES`.

## Fases
1. **Feita (26/11/2026)** — cenário (toldo, céu, balcão, mesa e barra em prévia),
   3 caricaturas animadas (respirar, piscar, olhar, orelhas, rabo, inclinar a cabeça),
   reações (vontade, fome com patinha batendo, carinho ao tocar), festa ao completar
   10 pratos (come o pedido, corações e estrelas), saída para o camarim e volta com
   fantasia nova e pedido novo. 11 fantasias. Painel de teste na tela.
2. **Feita (26/11/2026)** — mesa com 8 vagas livres e 3 trancadas (18k, 26k, 30k),
   pilhas de pratos coloridos (até 14) com a comida no topo, Servir enche as vagas vazias
   (comidas = os 3 pedidos + reservas, até 5 tipos), tocar uma pilha e depois outra ou
   arrastar; os pratos voam em arco. Vagas possíveis brilham. 10 iguais no topo: brilha,
   some e dá +25 moedas (provisório até a Fase 3). Quem pediu a comida pegada se anima.
   O painel de teste saiu.
3. **Feita (26/11/2026)** — tocar/arrastar uma pilha no personagem (ou no prato dele)
   manda os pratos daquela comida para ele (até completar 10); o prato de quem quer a
   comida escolhida brilha; quem não pediu balança o balão. Pilha com 10 iguais vai
   sozinha para quem pediu (sobra vira 250 moedas por prato). Pedido completo: +3.000
   moedas e +1 de experiência (nível = 2 + nível pedidos; subir dá +5 gemas). Começa
   com 12.000 moedas. Lugares trancados abrem tocando (18.000 / 26.000 / 30.000).
   Ajudas (3 de cada; depois 10 gemas por uso): Limpar (toca e escolhe a pilha),
   Organizar (entrega o que dá e junta pilhas iguais; não gasta se não houver o que
   juntar), Entregar (sino: completa o pedido de quem está mais perto de terminar).
4. **Feita (26/11/2026)** — som 100% Web Audio (cerâmica subindo de tom, sino, latidos
   diferentes para cada cão, "oba!" do personagem do meio, moedas, nível, trilha calma) com botões
   de som e de música; confete e moedas voando até o placar; progresso salvo no aparelho
   (`cozinha-da-le.v1`: moedas, gemas, nível, ajudas, mesa, roupas, pedidos); cartão em
   "Combinar e achar", Estatísticas, capa (`ferramentas/cozinha-da-le/capa.mjs`) e modo
   offline (sw.js).

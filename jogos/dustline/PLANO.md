# Dustline — plano e ponto de parada (Jogo 2 da série)

Rali contemplativo de cima, inclinado, em poucos polígonos. *Art of Rally* só como referência de gênero:
nome (provisório), carro (hatch mostarda de desenho próprio, sem marca), pistas e música são próprios.

## Fases (todas feitas)
1. **26/11/2026** Cenário, câmera alta e inclinada, luz, carro de teste, som (música chillwave + motor, cascalho, vento).
2. **26/11/2026** Física de derrapagem perdoável (a velocidade "fica para trás" no giro e o pneu segura até o limite do chão; freio de mão solta a traseira; endireita sozinho; ajuda de estabilidade com teto de ~48°), poeira, marcas de pneu, batida macia em árvores e pedras (árvore balança), margem do lago como barreira, botões de toque com freio de mão.
3. **26/11/2026** 5 pistas contra o relógio (Pinhal na névoa, Serra ao entardecer, Vale das cerejeiras, Neve no planalto, Outono junto ao lago), largada, 4 marcos e chegada, contagem 3-2-1, cartão do fim (de novo / próxima / pistas), melhor tempo por pista.
4. **26/11/2026** Passeio livre (no fim da estrada volta ao começo), clima por pista (névoa, poeira dourada, pétalas, neve, folhas), música por pista, tela inicial mínima (modo + pistas), volta sozinho para a estrada se ficar longe ou preso.
5. **26/11/2026** Revisão, capa (`ferramentas/dustline/capa.mjs`), menu (Ação), Estatísticas, `sw.js` v69, teste da suíte com 16 cartões. Publicação: o dono escolheu (26/11/2026) esperar o AetherDrift (outra conversa) e publicar os dois juntos, porque `index.html` e `sw.js` têm linhas dos dois jogos.

## Como funciona
- Editar em `ferramentas/dustline/fonte/` e rodar `node ferramentas/dustline/montar.mjs` (gera `jogos/dustline/index.html` com o Three.js dentro; abre com dois cliques, sem internet).
- `etapas.js`: cores, morros, curvas, árvore, clima, música, aderência (neve 0,72). `mundo.js`: `criarMundo(E)` monta a pista; a estrada nunca passa a menos de 22 m de outro trecho dela (senão as curvas são suavizadas sozinhas). `MUNDO` = pista atual (altura, naEstrada, bateu, molhado, perto, maisPerto).
- `carro.js`: modelo e física. `efeitos.js`: poeira, marcas, clima (piscinas fixas). `som.js`: música por pista, motor, cascalho, contagem, marco, chegada, batida. `jogo.js`: estados `inicio`, `contagem`, `correndo`, `fim`, `livre`.
- Marcos contam pelo progresso ao longo da estrada (sem saltos grandes): cortar um pouco a curva não faz perder marco.
- Teclado: setas/WASD, Espaço freio de mão, R volta para a estrada, Esc pistas, Enter começa, M som. Toque: ◀ ▶, ▲ ▼ e freio de mão (só em tela de toque).
- Luz do Three r170: intensidade × π. A faixa da estrada precisa de `DoubleSide` (a ordem dos vértices deixa a face virada para baixo).
- Testes: `corrida.mjs` (piloto automático corre as 5 pistas, passeio livre, voltar à estrada), `dirigir.mjs [celular]`, `som.mjs [pc]`, `fotos.mjs pasta [celular]`, `capa.mjs`. Só em localhost: `window.__dustline`.

## Ainda não feito / ideias
O botão de hora do dia da Fase 1 saiu: cada pista tem sua luz. Não testado num celular de verdade (desempenho e toque).

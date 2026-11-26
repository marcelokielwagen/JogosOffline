# Dustline — plano e ponto de parada (Jogo 2 da série)

Drift na terra, de cima, inclinado, em poucos polígonos. Começou como rali contemplativo (*Art of Rally* só como
referência de gênero); em 26/11/2026 virou jogo de drift. Nome (provisório), carro (cupê de desenho próprio, sem
marca), pistas e música são próprios.

## Fases (todas feitas)
1. **26/11/2026** Cenário, câmera alta e inclinada, luz, carro de teste, som (música chillwave + motor, cascalho, vento).
2. **26/11/2026** Física de derrapagem perdoável, poeira, marcas de pneu, batida macia em árvores e pedras (árvore balança), margem do lago como barreira, botões de toque com freio de mão.
3. **26/11/2026** 5 pistas contra o relógio (Pinhal na névoa, Serra ao entardecer, Vale das cerejeiras, Neve no planalto, Outono junto ao lago), largada, marcos e chegada, contagem 3-2-1, cartão do fim (de novo / próxima / pistas), melhor tempo por pista.
4. **26/11/2026** Passeio livre (no fim da estrada volta ao começo), clima por pista (névoa, poeira dourada, pétalas, neve, folhas), música por pista, tela inicial mínima (modo + pistas), volta sozinho para a estrada se ficar longe ou preso.
5. **26/11/2026** Revisão, capa (`ferramentas/dustline/capa.mjs`), menu (Ação), Estatísticas, `sw.js` v69, teste da suíte com 16 cartões. Publicado em 26/11/2026 junto com o AetherDrift (sw.js v70, suíte com 17 cartões).
6. **26/11/2026 — virou jogo de drift** (pedido dele: "o carro tá horrível, mudar para carro de drift, tá simples demais"):
   - Carro novo: cupê baixo e largo, carroceria "costurada" por cortes ao longo do comprimento (capô longo, para-lamas largos, teto baixo, traseira fastback), vidros, faixa central, saias, aerofólio, faróis finos, lanternas que acendem no freio, rodas de 5 raios que contra-esterçam no drift, chama do turbo. 6 cores à escolha na tela inicial (pérola, tangerina, mostarda, oliva, vinho, menta).
   - Física de drift: drift começa no freio de mão; o jogo segura ângulo e curva (seta para dentro fecha, solta mantém, para fora endireita e sai). Nunca roda (teto de ~62°). Sair de um drift longo dá turbo.
   - Pontos de drift (ângulo × velocidade), multiplicador até ×5 com drifts emendados (até 1,6 s), zonas de drift com cones nas curvas fechadas (pontos em dobro); bater forte ou sair muito da estrada perde só o drift atual.
   - Modo novo **drift** (pontos na pista inteira, recorde por pista). Medalhas bronze/prata/ouro nos dois modos (alvos em `etapas.js`, calibrados com os pilotos automáticos e deixados fáceis).
   - Fantasma: no contra o relógio, um carro transparente refaz a sua melhor volta.
   - Pistas mais longas: a estrada serpenteia em 3 trechos ligados por 2 curvas em U (~65–80 s), estrada mais larga (8,8 m), 6 marcos. Câmera mais perto do carro.
   - Capa nova e texto do cartão no menu. **Falta:** subir a versão do `sw.js` e publicar (só com o sim dele).

## Como funciona
- Editar em `ferramentas/dustline/fonte/` e rodar `node ferramentas/dustline/montar.mjs` (gera `jogos/dustline/index.html` com o Three.js dentro; abre com dois cliques, sem internet).
- `etapas.js`: cores, morros, curvas, árvore, clima, música, aderência (neve 0,72), medalhas. `mundo.js`: `criarMundo(E)` monta a pista (3 trechos + 2 curvas em U); a estrada nunca passa a menos de 22 m de outro trecho dela (senão as curvas são suavizadas sozinhas). `MUNDO` = pista atual (altura, naEstrada, bateu, molhado, perto, maisPerto, zonas, emZona).
- `carro.js`: `PINTURAS`, modelo (`criarCarro(pintura, {fantasma})`) e física (`F.s` velocidade, `F.psi` direção da velocidade, `F.rumo` para onde aponta, `F.ang` ângulo de drift, `F.deriva`, `F.turbo`; `F.vf`/`F.vl` continuam para o resto do código). `efeitos.js`: poeira, marcas, clima. `som.js`: música, motor, cascalho, contagem, marco, chegada, batida, combo/drift/perdeu/turbo. `jogo.js`: estados `inicio`, `contagem`, `correndo`, `fim`, `livre`; modos `tempo`, `drift`, `livre`; pontos de drift (`D`), fantasma (`localStorage dustline.fantasma.<pista>`).
- Marcos contam pelo progresso ao longo da estrada (sem saltos grandes): cortar um pouco a curva não faz perder marco.
- Teclado: setas/WASD, Espaço freio de mão (drift), R volta para a estrada, Esc pistas, Enter começa, M som. Toque: ◀ ▶, ▲ ▼ e freio de mão (só em tela de toque).
- Luz do Three r170: intensidade × π. A faixa da estrada precisa de `DoubleSide` (a ordem dos vértices deixa a face virada para baixo).
- Testes: `corrida.mjs` (piloto automático corre as 5 pistas, passeio livre, voltar à estrada), `drift.mjs [pasta]` (piloto de drift no modo drift: pontos e tempos), `dirigir.mjs [celular]`, `som.mjs [pc]`, `fotos.mjs pasta [celular]`, `capa.mjs`. Só em localhost: `window.__dustline`.

## Ainda não feito / ideias
Não testado num celular de verdade (desempenho e toque do freio de mão). Estatísticas da coleção ainda só mostram os tempos (não os pontos de drift).

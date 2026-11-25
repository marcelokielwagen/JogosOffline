# Keepsake Hunt (jogo 2 da série de 6, objetos escondidos)

Nome confirmado pelo dono em 25/11/2026. Regras da série em `jogos/gem-shatter/PLANO.md`. Nome, arte, fases, sons e regras são próprios.

| Fase | O que é | Estado |
|---|---|---|
| 1 | Protótipo: mecânica, efeitos, som, 50 fases | pronta e publicada (v59) em 25/11/2026 |
| 2 | Progressão e retenção | falta |
| 3 | Economia, boosters, dificuldade, ganchos de anúncio e compra | falta |
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
- Blocos: `nucleo` (catálogo, fases, mesa, remexer, `Partida`; sem tela), depois Eventos e Ganchos, Progresso, Som, Tela, Jogo, Telas.
- **Salvo:** `keepsake.v1` = {v, fase, estrelas, recordes, lembrancas, tentativas, op, soma}. A Fase 2 deve migrar sem perder.
- Eventos: `fase:inicio, achou, lembranca, dica, fase:vitoria, fase:derrota, salvou`. Ganchos: `antesDaFase, oferecerContinuar, entreFases, premio`.

## Ferramentas (`ferramentas/keepsake-hunt`)
- `node gerar-arte.mjs --k=26` refaz as folhas (objetos em `objetos3d.js`) e o `atlas.json`; depois `node montar.mjs` põe a lista no jogo. `--prova=pasta` só mostra os objetos.
- `node gerar-fundos.mjs` mesas; `node capa.mjs` capa; `node fotos.mjs pasta 1,20` fotografa fases.
- `node jogar.mjs 1-50 [--lento|--pc|--deitado]` robô com toque simulado; `node telas.mjs pasta` telas e gestos; `node som.mjs [--pc]` mede os sons.
- `node registrar.mjs` liga o jogo ao menu, às estatísticas e ao modo offline (sobe a versão do `sw.js`). Já rodado (v59).

## Testado (25/11/2026)
50 fases com toque simulado (60 quadros/s; 36 a 49 com processador 4x mais lento), 53 conferências de telas e gestos, 7 tamanhos de tela, giro no meio da fase, ficha estragada, sem
internet (numa cópia do site), picos de som abaixo de 0,61. O tempo das fases é estimativa: robô não enxerga como gente. Não testado num celular de verdade.

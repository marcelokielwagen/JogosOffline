# Hushbell — plano e ponto de parada

Série de 2 jogos 3D relaxantes (pedido de 25/11/2026), um de cada vez, uma fase por comando ("continue" / "próxima fase").
- **Jogo 1: Hushbell** — arquitetura impossível, visual e personagem próprios (Monument Valley só como referência de gênero).
- **Jogo 2: rali contemplativo** (Art of Rally só como referência de gênero). Só depois do Jogo 1 pronto.

**A ideia:** um pequeno sino que perdeu a voz sobe monumentos de barro com poços de degraus. Cada passo e cada peça girada
devolve uma nota; no fim do monumento ele se pendura e toca.

## Fases do Jogo 1
1. **FEITA (25/11/2026)** Visual, câmera isométrica, luz, cenário, som.
2. **FEITA (25/11/2026)** Peças que giram ao arrastar, ligações por ilusão, sino andando até onde se toca, tela inicial com botão de jogar e o nível de treino "primeiros passos".
3. **FEITA (25/11/2026)** 5 níveis, viagem entre eles (um desce na névoa, o próximo sobe), progresso salvo (`feitos`), bolinhas na tela inicial para escolher nível liberado, nome do nível ao entrar, final com o grande sino.
   | Nível | Ensina | Giros |
   |---|---|---|
   | I primeiros passos | girar escada; ponte que encosta num pátio mais alto | 2 |
   | II ponte levadiça | peça que deita de lado (eixo z); não gira com o sino em cima, ele espera no ressalto | 2 |
   | III a roda | roda move a ponte à distância (ponte travada); girar com o sino em cima | 2 |
   | IV a escada que gira | escadaria inteira gira; sobe, gira junto, desce a ponte levadiça | 3 |
   | V o grande sino | roda gira a viga do triângulo impossível; a ponta da viga lá em cima = começo da passarela | 2 |
4. **FEITA (25/11/2026)** Polimento: poeira dourada (`criarPoeira`), nuvens que atravessam o céu, gotas na água, sino 1,8x, peças giráveis brilham até o 1º giro do nível (`uRealce`, material próprio por peça), mãozinha de dica (nível 1 após 3 s, outros após 12 s sem girar), brilhos na chegada, cursor que muda sobre peça/chão, toque tolerante (perto do centro da peça já pega), teclado completo.
   Teclado: setas/WASD andam uma casa na direção da tela, Tab escolhe a peça, Q/E (ou , .) giram 90°, Espaço pula, Enter joga, Esc volta, H hora, M som.
5. **FEITA (26/11/2026)** Revisão final: sair durante a comemoração não pula mais de nível (ficha `fichaVitoria`), níveis liberam materiais ao sair, testes de memória, tamanho de tela e perda do 3D (`revisao.mjs`); arquivo único confirmado abrindo do disco sem internet e sem buscar nada fora. Jogo 2 começado em `jogos/dustline`.

## Como funciona
- Editar em `ferramentas/hushbell/fonte/` e rodar `node ferramentas/hushbell/montar.mjs` (gera `jogos/hushbell/index.html`, com o Three.js dentro).
- Partes: `som.js`, `obra.js`, `cena.js`, `mundo.js` (mapa de caminhos, peças, andar), `niveis.js` (NIVEIS), `jogo.js`.
- `obra.js`: blocos da grade; bloco (x,y,z) ocupa x±.5, z±.5, y até y+1; pisa-se em y+1. `cena.js`: cores por hora, céu, água, monumento, personagem. `som.js`. `jogo.js`: câmera e gestos.
- **Regra da ilusão:** (x,y,z) e (x+k,y+k,z+k) caem no mesmo ponto da tela. Para a Fase 2, duas casas são vizinhas se forem vizinhas no desenho: chave (x−z, 2y−x−z). Na emenda, a peça da frente perde as faces que entregariam o truque (`faces`/`bordas` do bloco; ver `ponta` em `criarMonumento`).
- **Mapa (mundo.js):** casa = topo livre de um bloco, ou rampa (`escada`). Portas no meio das bordas; duas portas se ligam se a chave (x−y, z−y, direção) bate, ou seja, mesma posição na tela. Ligação com k≠0 (ilusão) só vale se a emenda aparece mesmo na tela (raio da câmera até cada lado, água tampa). Árvores e arbustos ocupam a casa (`ocupado`).
- **Peças:** `criarPeca({obra montada no lugar certo, eixo, pivo, rot inicial})`. Arrastar gira; ao soltar, assenta no quarto de volta mais perto que caiba. Se o sino está parado em cima, gira junto. Não gira se ele está passando por ela. Encaixe com caminho novo toca `Som.encaixe`.
- **Sino na frente:** quando a mesma casa aparece mais à frente (casa igual em +k), ele é desenhado lá (`lift`); na ligação impossível anda as duas metades no lado da frente.
- **Roda e peça travada:** `roda.move = [peça]` gira junto; `peça.travada = true` não se pega com a mão. Peça de eixo x/z não gira com o sino em cima (ele ficaria de lado).
- **Emenda limpa:** numa ilusão, a casa que está mais à frente precisa encostar pela borda de trás (−x ou −z), senão a parede dela tampa a outra casa e a ligação não vale (ou a face da frente é omitida, como na ponta do triângulo). Arcos e enfeites altos na frente de uma peça roubam o toque: conferir.
- **Nível novo:** objeto em NIVEIS com `montar()` que devolve `new Mundo({grupo, estaticas, pecas, inicio, meta, sinos})`; o enquadramento é automático. Ao chegar na meta: sinos balançam, `Som.chegada`, volta ao início (na Fase 3: próximo nível).
- Peças da ilusão não fazem sombra (a sombra entregaria a profundidade). Sons prontos para a Fase 2: `passo`, `girar`, `encaixe`, `chegada`.
- Personagem em escala 1,5; cuidado com a ordem de profundidade dele ao andar em peças da ilusão.
- Testes: `resolver.mjs` (prova cada nível, menor número de giros, grava `planos.json`), `jogar-todos.mjs [celular] [pasta]` (joga a campanha inteira com toques e arrastos seguindo os planos), `fotos-niveis.mjs pasta [celular]`, `teclado.mjs` (nível 1 só com teclas), `jogar.mjs [celular] [pasta]` (nível 1 em detalhe), `grafo.mjs` (mapa, ilusões e se o nível exige as peças), `gestos.mjs`, `som.mjs [pc]`, `foto.mjs pasta`. Só em localhost: `window.__hushbell`.

## Ainda não feito
Fora do menu, do `sw.js`, das Estatísticas, sem capa e sem commit (perguntar ao dono).

**Ao registrar no menu (aviso de outra conversa, 25/11/2026; conferir no disco antes):** o menu da raiz é dividido em categorias: o cartão (com h3) vai dentro da `section.categoria` certa. No jogo, pôr `<script src="../../js/suite.js"></script>` antes do `<title>` e o link de volta como `href="../../index.html"`. `sw.js` estava em v64. Atenção: o jogo também precisa abrir sozinho, sem o suite.js.

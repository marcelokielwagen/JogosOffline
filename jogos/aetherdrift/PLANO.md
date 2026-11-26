# AetherDrift: Solar Valley — plano e ponto de parada

Jogo 3D relaxante e claro: andar, dirigir e planar no mesmo cenário, com quebra-cabeças de fluxo de luz/água/vento.
Sem cronômetro, sem game over (cair na água = volta suave ao último chão firme).

## Etapas
1. **FEITA (26/11/2026)** Núcleo jogável: céu em degradê, sol com sombras, névoa, pólen, nuvens, água turquesa;
   três formas (1 andar, 2 carro, 3 voo) com troca a qualquer momento; câmera que segue e gira arrastando;
   teclado + mouse + toque (joystick e botão de pulo); som procedural (pad lídio em Lá 432, brisa, motor, efeitos);
   seletor de fases com progresso salvo; **Fase 1 — Vale da Brisa** completa:
   - Elo da Luz: grade 4×4 de prismas na praça branca (girar peças; cada peça acesa sobe uma nota) → gira a ponte do rio.
   - Elo do Vento: 5 arcos de brisa na estrada panorâmica (só de carro) + 2 rampas verdes de pulo.
   - Elo do Céu: torre com elevador → planar → 2 correntes de ar quente → ilha flutuante com cristal.
     4 anéis do céu (opcionais) abrem uma ponte de luz da ilha até o portal.
   - Três elos acesos abrem o portal no terraço do morro (norte). Degraus flutuantes até um mirante perto do início.
2. Fase 2 — Aquedutos do Sol (tarde dourada): canais d'água e comportas.
3. Fase 3 — Arquipélago de Vento (brisa de montanha): ilhas, correntes e ricochetes.
4. Mais fases, clima, detalhes de cenário e polimento.
5. Menu da suíte, capa, modo offline (sw.js) — só com autorização do dono.

## Como funciona
- Editar em `ferramentas/aetherdrift/fonte/` e rodar `node ferramentas/aetherdrift/montar.mjs`
  (gera `jogos/aetherdrift/index.html`, arquivo único com o Three.js dentro; abre sem internet).
- `som.js` áudio · `mundo.js` terreno/céu/decoração/superfícies (chão) · `jogador.js` três formas e física ·
  `elementos.js` peças reutilizáveis (GradeFluxo, Arcos, Termica, Elevador, PonteGiratoria, Pedestal, Farol, Portal, rampaBrisa) ·
  `fases.js` CLIMAS + FASES (cada fase = uma função construir) · `jogo.js` laço, câmera, controles, interface.
- **Nova fase:** escrever `construirXxx(ctx)` em `fases.js` reaproveitando as peças e trocar `pronta: false` por `true` com `construir`.
- Teste rápido no console: `__ad` (jogador, fase, estado, acenderElo, jogar, pedirModo).

/* Níveis. Cada um devolve um Mundo: blocos fixos, peças que giram, casa de saída e casa do sino-meta.
   Coordenadas de bloco: (x, y, z) ocupa y..y+1; pisa-se em y+1. */
const PECA = { lado: '#b2d5c3', topo: '#f4e7cd', ouro: '#e3b75e' }, PECA_B = { lado: PECA.lado, topo: PECA.topo };
const FAIXA = y => ['#dd9d7a', '#d79572', '#e0a883', '#d18f6d', '#e2b288'][((y % 5) + 5) % 5];
const pedraEm = (x, y) => ({ lado: FAIXA(y), topo: BARRO.creme, piso: y >= 0 ? 1 : 0 }), torreCor = (x, y) => ({ lado: ['#e6b090', '#e2a987'][y & 1], topo: BARRO.creme });

// sino pendurado (balança quando o personagem chega ou quando é tocado)
function sinoPendurado(lista, grupo, mat, x, y, z, r, h, fio, nome = 'sinoMeta') {
  const s = new THREE.Group(), ob = new Obra();
  ob.geo(perfilSino(r, h), BARRO.ouro, { m: mover(0, -fio - h, 0), ao: (a, b) => .72 + .28 * Math.min(1, (b + fio + h) / h) });
  ob.geo(new THREE.CylinderGeometry(.02, .02, fio, 8), '#8a5a48', { m: mover(0, -fio / 2, 0) });
  ob.geo(new THREE.TorusGeometry(r * .8, .025, 8, 32), '#f0cf86', { m: deitar(0, -fio - h * .9, 0) });
  const me = new THREE.Mesh(ob.fechar(), mat); me.userData = { tipo: nome, sino: lista.length };
  s.add(me); s.position.set(x, y, z); s.userData = { ang: 0, vel: 0, fase: x * 3 + z, len: fio + h }; lista.push(s); grupo.add(s); return s;
}
// marca dourada no topo da casa onde a peça gira: diz "isto gira"
function marcaGiro(o, x, h, z, r = .3) { o.geo(new THREE.TorusGeometry(r, .03, 8, 36), PECA.ouro, { m: deitar(x, h + .012, z) }); o.geo(new THREE.CircleGeometry(.06, 18).rotateX(-Math.PI / 2), PECA.ouro, { m: mover(x, h + .014, z) }); }
// alavanca dourada num canto do alto da peça: sempre à vista, diz "isto gira"
function alavanca(o, x, y, z) {
  o.geo(new THREE.CylinderGeometry(.035, .045, .5, 10), '#b88a48', { m: mover(x, y + .25, z) });
  o.geo(new THREE.SphereGeometry(.085, 16, 12), PECA.ouro, { m: mover(x, y + .55, z) });
}

const NIVEIS = [
  /* 1. Primeiros passos: girar a escada e girar a ponte com o sino em cima; a ponte "encosta" num pátio que está mais alto e mais perto. */
  { nome: 'primeiros passos', montar() {
    const grupo = new THREE.Group(), mat = pedra(), o = new Obra(), sinos = [];
    const faixa = FAIXA;
    // chão de saída e a ilha embaixo
    o.cheio(-1, 1, -3, 0, 2, 4, pedraEm); o.cheio(-1, 1, -6, -4, 2, 3, pedraEm); o.cheio(0, 0, -6, -2, 1, 1, pedraEm);
    // escadaria fixa e patamar
    o.cheio(0, 0, -3, 1, 0, 0, pedraEm); o.cheio(0, 0, -3, 2, -1, -1, pedraEm); o.cheio(-1, 0, -3, 3, -2, -2, pedraEm);
    o.escada(0, 2, 0, '-z', BARRO.terra2, BARRO.creme); o.escada(0, 3, -1, '-z', BARRO.terra2, BARRO.creme);
    // torre do fundo
    o.cheio(-2, -1, -4, 6, -4, -3, (x, y) => ({ lado: ['#e6b090', '#e2a987'][y & 1], topo: BARRO.creme }));
    o.caixa(-2.58, 6.72, -4.58, -.42, 6.9, -2.42, BARRO.ouro);
    o.nicho('+x', -.5, 4.2, -3.5, .3, .9, '#ffffff', { luz: 1, moldura: BARRO.creme }); o.nicho('+z', -1.5, 4, -2.5, .62, 1.4, BARRO.vao, { moldura: BARRO.creme });
    o.nicho('+z', -1.5, 1.2, -2.5, .5, 1.1, '#ffffff', { luz: .9 }); o.nicho('+x', -.5, 1, -3.5, .5, 1.2, BARRO.vao);
    // coluna onde a ponte gira
    o.cheio(1, 1, -5, 2, -2, -2, (x, y) => ({ lado: y === 2 ? BARRO.creme : faixa(y) }));
    o.caixa(.56, 2.78, -2.44, 1.44, 3, -1.56, BARRO.ouro, { linha: .6 });
    // pátio alto da chegada (mais perto e mais alto do que parece) e a coluna dele sumindo na névoa
    o.cheio(8, 9, 6, 6, 1, 1, { lado: BARRO.creme, topo: BARRO.creme, piso: 1 }); o.cheio(8, 9, -6, 5, 1, 1, (x, y) => ({ lado: faixa(y), topo: BARRO.creme }));
    o.arco('x', 9, 7, .62, 1, 2.1, .22, .33, BARRO.creme, 1.5); o.caixa(8.9, 8.92, .62, 9.1, 9.08, 1.06, BARRO.creme, { linha: .5 });
    o.nicho('+z', 8.5, 1.5, 1.5, .5, 1.6, '#c4806a'); o.nicho('+z', 8.5, 3.6, 1.5, .5, 1.4, '#c4806a');
    // plantas e detalhes
    o.cipreste(-1, 1, 4, 1.9); o.arbusto(-1, 1, 2, .26); o.cipreste(1, 1, 4, 1.4, '#abc3a0'); o.cipreste(-1, 4, -2, 1.5, '#abc3a0');
    o.nicho('+z', 0, -2.4, 4.5, .62, 1.7, '#cf9272'); o.nicho('+x', 1.5, -2.4, 3, .62, 1.7, '#c4806a');
    const m = new THREE.Mesh(o.fechar(), mat); m.castShadow = m.receiveShadow = true; m.userData.tipo = 'pedra'; grupo.add(m);

    // PEÇA 1: escada que gira no próprio eixo (certa quando sobe para o fundo; começa virada de lado)
    const e = new Obra(); e.bloco(0, 0, 1, { lado: PECA.lado, topo: PECA.topo }); e.bloco(0, -1, 1, { lado: PECA.lado }); e.escada(0, 1, 1, '-z', PECA.lado, PECA.topo); alavanca(e, .37, 2, .63);
    // PEÇA 2: ponte de quatro casas que gira sobre a coluna (certa quando aponta para a direita; começa apontando para o fundo)
    const p = new Obra(); for (let x = 1; x <= 4; x++) p.bloco(x, 3, -2, { lado: x === 1 ? PECA.ouro : PECA.lado, topo: PECA.topo, piso: 1 }); marcaGiro(p, 1, 4, -2);
    p.caixa(4.3, 2.6, -2.2, 4.5, 3, -1.8, PECA.lado, { linha: .5 });
    const pecas = [criarPeca({ obra: e, pivo: [0, 0, 1], rot: 1, mat }), criarPeca({ obra: p, pivo: [1, 3, -2], rot: 1, mat })];

    sinoPendurado(sinos, grupo, mat, 9, 8.92, .98, .26, .38, .28);
    return new Mundo({ grupo, estaticas: [o], pecas, inicio: 'c0,0,3', meta: 'c9,6,1', sinos });
  } },

  /* 2. Ponte levadiça: a ponte gira de lado (deita para um lado ou para o outro). Com o sino em cima ela não gira:
        ele espera no ressalto ao lado enquanto ela vira para o outro lado. */
  { nome: 'ponte levadiça', montar() {
    const N = novoNivel(), { o } = N;
    o.cheio(-5, -4, -6, 0, 0, 1, pedraEm);                                                  // margem de saída
    o.cheio(-5, -4, 1, 4, -1, -1, torreCor); o.caixa(-5.58, 4.72, -1.58, -3.42, 4.9, -.42, BARRO.ouro);
    o.nicho('+z', -4.5, 1.2, -.5, .6, 1.4, BARRO.vao, { moldura: BARRO.creme }); o.nicho('+x', -3.5, 2.6, -1, .3, .9, '#ffffff', { luz: 1, moldura: BARRO.creme });
    o.cipreste(-5, 1, 0, 1.8); o.arbusto(-4, 5, -1, .3);
    o.cheio(-1, -1, -6, -1, 0, 0, pedraEm); o.cheio(-1, -1, -6, 0, 1, 1, pedraEm);          // pilar da ponte e o ressalto
    o.caixa(-1.42, 1, 1.12, -1.3, 1.9, 1.24, BARRO.creme); o.geo(new THREE.SphereGeometry(.09, 14, 10), '#ffe2a0', { m: mover(-1.36, 1.98, 1.18), luz: .8 });
    o.cheio(4, 5, -6, 2, 2, 2, pedraEm); metaSino(N, 5, 3, 2);                               // pátio da chegada: mais perto e mais alto
    o.nicho('+z', 4.5, -.4, 2.5, .5, 1.6, '#c4806a'); o.nicho('+x', 5.5, .6, 2, .5, 1.4, '#c4806a');
    const d = new Obra(); d.bloco(-1, 0, 0, { lado: PECA.ouro, topo: PECA.topo, piso: 1 }); d.bloco(-1, 1, 0, PECA_B); d.bloco(-1, 2, 0, PECA_B); eixoDourado(d, -1, .5, 0, 'z');
    return fecharNivel(N, [criarPeca({ obra: d, eixo: 'z', pivo: [-1, 0, 0], mat: N.mat })], 'c-5,0,1', 'c5,2,2');
  } },

  /* 3. A roda: a ponte não se pega com a mão, só pela roda. Primeiro liga a ponte à margem, sobe nela,
        e gira de novo com o sino em cima até a ponta da frente e "encostar" no pátio alto. */
  { nome: 'a roda', montar() {
    const N = novoNivel(), { o } = N;
    o.cheio(-4, -1, -6, 0, 0, 1, pedraEm);                                                  // margem com a roda
    o.cheio(-4, -3, 1, 4, -1, -1, torreCor); o.caixa(-4.58, 4.72, -1.58, -2.42, 4.9, -.42, BARRO.ouro);
    o.nicho('+z', -3.5, 1.1, -.5, .6, 1.4, BARRO.vao, { moldura: BARRO.creme }); o.nicho('+x', -2.5, 2.6, -1, .3, .9, '#ffffff', { luz: 1, moldura: BARRO.creme });
    o.ocupado.add(o.chave(-4, 1, 1)); o.cipreste(-1, 1, 0, 1.6, '#abc3a0'); o.arbusto(-2, 1, 0, .26);
    o.cheio(1, 1, -6, -1, 1, 1, pedraEm); o.caixa(.55, -.24, .55, 1.45, 0, 1.45, BARRO.ouro, { linha: .6 });   // pilar da ponte
    o.cheio(3, 3, -6, 2, 5, 6, pedraEm); metaSino(N, 3, 3, 6);                               // pátio alto, mais perto do que parece
    o.nicho('+z', 3, -1, 6.5, .5, 1.6, '#c4806a'); o.nicho('+x', 3.5, .4, 5.5, .5, 1.4, '#c4806a');
    const t = new Obra(); for (let x = 0; x <= 2; x++) t.bloco(x, 0, 1, { lado: x === 1 ? PECA.ouro : PECA.lado, topo: PECA.topo, piso: 1 }); marcaGiro(t, 1, 1, 1);
    const ponte = criarPeca({ obra: t, pivo: [1, 0, 1], rot: 1, mat: N.mat }); ponte.travada = true;
    const roda = criarPeca({ obra: rodaDourada(-4, 1, 1), pivo: [-4, 1, 1], mat: N.mat }); roda.move = [ponte];
    return fecharNivel(N, [ponte, roda], 'c-3,0,1', 'c3,2,6');
  } },

  /* 4. A escada que gira: uma escadaria inteira gira em volta da coluna. Sobe por ela, gira com o sino lá em cima,
        desce a ponte levadiça e a ponte "encosta" num pátio que está mais alto e mais perto. */
  { nome: 'a escada que gira', montar() {
    const N = novoNivel(), { o } = N;
    o.cheio(-1, 1, -6, 0, 3, 4, pedraEm); o.cipreste(-1, 1, 4, 1.7); o.arbusto(1, 1, 4, .28);   // chão de saída
    o.nicho('+z', 0, -2.4, 4.5, .62, 1.7, '#cf9272'); o.nicho('+x', 1.5, -2.4, 3.5, .62, 1.7, '#c4806a');
    o.cheio(0, 0, -6, -1, 0, 0, pedraEm); o.caixa(-.45, -.22, -.45, .45, 0, .45, BARRO.ouro, { linha: .6 });   // pilar da escada
    o.cheio(2, 3, -6, 2, 0, 0, pedraEm); o.nicho('+z', 2.5, -.6, .5, .5, 1.5, '#c4806a');      // patamar do meio
    o.cheio(4, 4, -6, 1, 0, 0, pedraEm);                                                    // pilar da ponte levadiça
    o.cheio(8, 9, -6, 4, 2, 2, pedraEm); metaSino(N, 9, 5, 2); o.nicho('+z', 8.5, 1, 2.5, .5, 1.6, '#c4806a'); o.nicho('+z', 8.5, 3, 2.5, .5, 1.4, '#c4806a');   // pátio de chegada, mais alto e mais perto
    const t = new Obra(), c = (x, y, z) => t.bloco(x, y, z, PECA_B);
    c(0, 0, 0); c(0, 1, 0); t.bloco(0, 2, 0, { lado: PECA.lado, topo: PECA.topo, piso: 1 }); c(0, 0, 2); c(0, 0, 1); c(0, 1, 1); t.bloco(0, 2, -1, { lado: PECA.lado, topo: PECA.topo, piso: 1 });
    t.escada(0, 1, 2, '-z', PECA.lado, PECA.topo); t.escada(0, 2, 1, '-z', PECA.lado, PECA.topo); alavanca(t, .36, 3, -1.36);
    const d = new Obra(); d.bloco(4, 2, 0, { lado: PECA.ouro, topo: PECA.topo, piso: 1 }); d.bloco(4, 3, 0, PECA_B); eixoDourado(d, 4, 2.5, 0, 'z');
    return fecharNivel(N, [criarPeca({ obra: t, pivo: [0, 0, 0], rot: 2, mat: N.mat }), criarPeca({ obra: d, eixo: 'z', pivo: [4, 2, 0], mat: N.mat })], 'c0,0,4', 'c9,4,2');
  } },

  /* 5. O grande sino: a viga do triângulo gira presa à roda. Fechado, o triângulo é impossível:
        a ponta da viga, lá no alto, é o mesmo lugar que o começo da passarela, cá embaixo. */
  { nome: 'o grande sino', montar() {
    const N = novoNivel(), { o } = N;
    o.cheio(-6, -5, -6, 0, 0, 2, pedraEm); o.cipreste(-6, 1, 2, 1.7); o.arbusto(-6, 1, 0, .28);   // chão de saída
    o.cheio(-5, -5, -6, 0, -1, -1, pedraEm); o.cheio(-5, -5, -6, 1, -2, -2, pedraEm); o.cheio(-5, -5, -6, 2, -3, -3, pedraEm);
    for (const [y, z] of [[1, -1], [2, -2], [3, -3]]) o.escada(-5, y, z, '-z', BARRO.terra2, BARRO.creme);
    o.cheio(-6, -4, -6, 3, -4, -4, pedraEm); o.ocupado.add(o.chave(-6, 4, -4));             // patamar com a roda
    o.cheio(-3, -3, -6, 2, -4, -4, pedraEm);                                                // pilar da ponte levadiça
    o.cheio(-1, 4, 3, 3, -4, -4, { lado: BARRO.creme, topo: BARRO.creme, piso: 1 }); o.cheio(-1, -1, -6, 3, -3, -3, pedraEm);   // passarela (1º lado do triângulo)
    o.cheio(-1, -1, -6, 2, -4, -4, pedraEm); o.cheio(4, 4, -6, 2, -4, -4, pedraEm);
    for (const x of [.5, 2.5]) o.arco('x', x, 0, -4, 2, 3, .62, .74, BARRO.terra, 1.7);
    o.caixa(1.32, -6, -4.31, 1.68, 0, -3.69, BARRO.terra); o.caixa(-1.58, 2.72, -4.58, -.42, 2.9, -2.42, BARRO.ouro);
    o.nicho('+z', -1, .4, -2.5, .5, 1.6, '#c4806a'); o.nicho('+x', 4.5, .6, -4, .5, 1.5, '#c4806a');
    // viga que gira: coluna e o lado de cima do triângulo. A ponta é só um ladrilho (o resto dela "é" a passarela lá embaixo)
    const v = new Obra(), cr = { lado: BARRO.creme, topo: BARRO.creme, piso: 1 };
    for (let y = 4; y <= 7; y++) v.bloco(4, y, -4, { lado: y === 4 ? PECA.ouro : BARRO.creme });
    for (let z = -4; z <= -1; z++) v.bloco(4, 8, z, cr);
    v.bloco(4, 8, 0, { ...cr, faces: ['+y', '+x', '-y', '-x'], bordas: { '+y': [0, 0, 1, 1], '+x': [1, 1, 0, 0] } });
    v.bloco(4, 8, 1, { ...cr, faces: ['+y'], bordas: { '+y': [0, 0, 1, 0] } });
    for (const y of [4.02, 7.6]) v.caixa(3.42, y, -4.58, 4.58, y + .16, -3.42, BARRO.ouro);
    const viga = criarPeca({ obra: v, pivo: [4, 4, -4], rot: 1, mat: N.mat }); viga.travada = true;
    const sino = sinoPendurado(N.sinos, N.grupo, N.mat, 4, 8, -2, .78, 1.25, .45, 'sinoGrande'); N.grupo.remove(sino); sino.position.sub(viga.centro); viga.grupo.add(sino);
    const roda = criarPeca({ obra: rodaDourada(-6, 4, -4), pivo: [-6, 4, -4], mat: N.mat }); roda.move = [viga];
    const d = new Obra(); d.bloco(-3, 3, -4, { lado: PECA.ouro, topo: PECA.topo, piso: 1 }); d.bloco(-3, 4, -4, PECA_B); eixoDourado(d, -3, 3.5, -4, 'z');
    return fecharNivel(N, [viga, roda, criarPeca({ obra: d, eixo: 'z', pivo: [-3, 3, -4], mat: N.mat })], 'c-5,0,2', 'c4,8,-2');
  } }
];

/* ---------- ajudantes dos níveis ---------- */
function novoNivel() { return { grupo: new THREE.Group(), mat: pedra(), o: new Obra(), sinos: [] }; }
function fecharNivel(N, pecas, inicio, meta) { const m = new THREE.Mesh(N.o.fechar(), N.mat); m.castShadow = m.receiveShadow = true; m.userData.tipo = 'pedra'; N.grupo.add(m); return new Mundo({ grupo: N.grupo, estaticas: [N.o], pecas, inicio, meta, sinos: N.sinos }); }
// arco com o sino da chegada, na borda de trás da casa (x, h, z)
function metaSino(N, x, h, z) { N.o.arco('x', x, h, z - .38, 1, 2.1, .22, .33, BARRO.creme, 1.5); N.o.caixa(x - .1, h + 1.92, z - .38, x + .1, h + 2.08, z + .06, BARRO.creme, { linha: .5 }); sinoPendurado(N.sinos, N.grupo, N.mat, x, h + 1.92, z - .02, .26, .38, .28); }
// disco dourado nas duas pontas do eixo de uma ponte levadiça
function eixoDourado(o, x, y, z, eixo) { for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(.3, .3, .06, 28); if (eixo === 'z') g.rotateX(Math.PI / 2); else g.rotateZ(Math.PI / 2); o.geo(g, PECA.ouro, { m: mover(x + (eixo === 'x' ? s * .53 : 0), y, z + (eixo === 'z' ? s * .53 : 0)) }); } }
// roda de girar, dourada, num poste (a peça "roda" não tem blocos: só move outra peça)
function rodaDourada(x, y, z) {
  const o = new Obra();
  o.geo(new THREE.CylinderGeometry(.07, .09, .6, 12), '#b88a48', { m: mover(x, y + .3, z) });
  o.geo(new THREE.CylinderGeometry(.36, .36, .05, 32), '#f0d9a8', { m: mover(x, y + .62, z) });
  o.geo(new THREE.TorusGeometry(.4, .045, 10, 40), PECA.ouro, { m: deitar(x, y + .64, z) });
  for (let i = 0; i < 4; i++) o.geo(new THREE.BoxGeometry(.78, .05, .05).rotateY(i * Math.PI / 4), PECA.ouro, { m: mover(x, y + .66, z) });
  o.geo(new THREE.CylinderGeometry(.035, .035, .26, 10), '#b88a48', { m: mover(x + .4, y + .78, z) }); o.geo(new THREE.SphereGeometry(.075, 14, 10), PECA.ouro, { m: mover(x + .4, y + .93, z) });
  return o;
}

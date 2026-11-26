/* =====================================================================
   FASES — cada fase é uma entrada da lista FASES com:
     id, nome, det (subtítulo), cor, clima, elos [{id, nome}], construir(ctx)
   construir() monta o cenário dentro de ctx.raiz e devolve:
     { inicio, elementos, clicaveis, grade, portal, farois, dicas, atualizar }
   Para criar a Fase 4, 5, 6...: escreva construirXxx() reaproveitando as
   peças de elementos.js e acrescente uma linha em FASES. Só isso.
   ===================================================================== */
const CLIMAS = {
  manha: {      // manhã cristalina (Fase 1)
    ceuTopo: '#8fcbe6', ceuHoriz: '#fde8cf', ceuBaixo: '#f3dcc0', solDir: [0.55, 0.62, 0.42], solCor: '#fff2cc',
    solLuz: '#fff1dc', solInt: 2.7, hemiCeu: '#d9eef7', hemiChao: '#f3dcc0', hemiInt: 1.55,
    nevoa: '#f7e7d3', perto: 180, longe: 700, agua: '#88d9cf', montanhas: ['#ead8d2', '#dfdae6', '#ecdfcd', '#dbe4e3'],
  },
  tarde: {      // tarde dourada (reservado para a Fase 2)
    ceuTopo: '#a9d3e6', ceuHoriz: '#ffe9cc', ceuBaixo: '#f7dfc0', solDir: [-0.62, 0.5, 0.3], solCor: '#ffdcaa',
    solLuz: '#fff0d8', solInt: 2.6, hemiCeu: '#fff4e6', hemiChao: '#f6e4ca', hemiInt: 1.75,
    nevoa: '#fcebd6', perto: 170, longe: 680, agua: '#8fd6c8', montanhas: ['#f0cdbb', '#e8c9c9', '#f3dcc2', '#e6d2c6'],
  },
  montanha: {   // brisa de montanha (reservado para a Fase 3)
    ceuTopo: '#a6d6ec', ceuHoriz: '#eef4ee', ceuBaixo: '#e3ecdf', solDir: [0.3, 0.7, -0.5], solCor: '#fff8e2',
    solLuz: '#fffaf0', solInt: 2.6, hemiCeu: '#e3f3f8', hemiChao: '#e6eadb', hemiInt: 1.6,
    nevoa: '#eef2ea', perto: 150, longe: 680, agua: '#8adbd3', montanhas: ['#dfe5ea', '#e7e2ea', '#e9eee4', '#dde8e6'],
  },
};

// =====================================================================
// FASE 1 — VALE DA BRISA
//   Elo da Luz: grade de prismas na praça branca (andando)
//   Elo do Vento: cinco arcos de brisa na estrada panorâmica (carro)
//   Elo do Céu: torre + térmicas até a ilha flutuante (voo)
//   Os três acendem o portal no terraço do morro, ao norte.
// =====================================================================
function construirVale(ctx) {
  const { raiz, ef } = ctx;
  semear(20261126);
  const rio = x => 35 + 12 * Math.sin(x / 40);

  // ---------- estrada panorâmica (laço fechado) ----------
  const ctrl = [[18, 106], [62, 122], [112, 96], [132, 40], [124, -22], [94, -72], [48, -88], [22, -72], [36, -28], [50, 12], [38, 58], [14, 84]];
  const curva = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const NE = Math.round(curva.getLength() / 1.5), est = curva.getSpacedPoints(NE).slice(0, NE);
  const GR = 20, gradeE = new Map(), chave = (a, b) => a + ',' + b;
  est.forEach((p, i) => { const k = chave(Math.floor(p.x / GR), Math.floor(p.z / GR)); if (!gradeE.has(k)) gradeE.set(k, []); gradeE.get(k).push(i); });
  function pertoEstrada(x, z) {
    const cx = Math.floor(x / GR), cz = Math.floor(z / GR); let melhor = 1e9, im = -1;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const l = gradeE.get(chave(cx + a, cz + b)); if (!l) continue;
      for (const i of l) { const d = (est[i].x - x) ** 2 + (est[i].z - z) ** 2; if (d < melhor) { melhor = d; im = i; } }
    }
    return { d: Math.sqrt(melhor), i: im };
  }
  const tang = i => { const a = est[(i - 1 + NE) % NE], b = est[(i + 1) % NE], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); return [dx / l, dz / l]; };

  // ---------- relevo ----------
  const MORROS = [[-40, 100, 26, 7], [-145, 60, 30, 10], [70, -132, 30, 9], [-12, 8, 22, 5], [152, -92, 26, 8], [-150, -100, 30, 9], [92, 52, 16, 4], [-60, -10, 20, 5]];
  const PLANOS = [{ x: 0, z: 121, r: 12, b: 10 }, { x: -70, z: 52, r: 17, b: 10 }, { x: 0, z: -55, r: 15, b: 17, h: 9.5 }, { x: -118, z: -32, r: 12, b: 8 }];
  function cru(x, z) {
    let h = 3.4 + (fbm(x * 0.016, z * 0.016) - 0.47) * 8;
    for (const [mx, mz, r, a] of MORROS) h += a * Math.exp(-((x - mx) ** 2 + (z - mz) ** 2) / (r * r));
    return mix(-2.6, h, suave(5, 13, Math.abs(z - rio(x))));          // leito do rio
  }
  for (const p of PLANOS) p.hh = p.h ?? Math.max(2.6, cru(p.x, p.z));
  function comPlanos(x, z) {
    let h = cru(x, z);
    for (const p of PLANOS) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + p.b) h = mix(p.hh, h, suave(p.r, p.r + p.b, d)); }
    return h;
  }
  // altura da estrada: acompanha o relevo, alisada, sempre acima da água (vira aterro no rio)
  let hs = est.map(p => Math.max(1.2, comPlanos(p.x, p.z)));
  for (let passo = 0; passo < 3; passo++) hs = hs.map((_, i) => { let s = 0; for (let k = -9; k <= 9; k++) s += hs[(i + k + NE) % NE]; return s / 19; });
  hs = hs.map(h => Math.max(1.2, h));
  function altura(x, z) {
    let h = comPlanos(x, z);
    h += suave(150, 212, Math.hypot(x, z)) * (40 + 24 * fbm(x * 0.02 + 7, z * 0.02 - 3));   // anel de montanhas
    const e = pertoEstrada(x, z); if (e.d < 12) h = mix(hs[e.i], h, suave(4.4, 11, e.d));
    return h;
  }
  function cor(c, h, incl, x, z) {
    if (h < 0.5) c.set('#e8d5ae');
    else if (h < 1.7) c.set('#f2e4c6');                                         // margem creme
    else if (incl > 0.3) c.set(h > 22 ? '#f3e4d0' : '#ebc2a3');                 // barranco terracota suave
    else if (h > 32) c.set('#f7efe3');
    else if (h > 19) c.set('#d8dcae');
    else { const f = fbm(x * 0.02, z * 0.02, 2); c.set(f > 0.53 ? '#b6d6a3' : f > 0.43 ? '#c3daa3' : '#d0e2ae'); }
    c.offsetHSL(0, 0, hash2(Math.floor(x * 0.7), Math.floor(z * 0.7)) * 0.05 - 0.025);
  }
  raiz.add(gerarTerreno(altura, cor));

  // ---------- fita da estrada + faixa tracejada ----------
  {
    const pos = [], cores = [], idx = [], L = [-3.9, -3.2, 3.2, 3.9], c1 = new THREE.Color('#f5e9cd'), c2 = new THREE.Color('#e7d3ab');
    for (let i = 0; i < NE; i++) {
      const [tx, tz] = tang(i), nx = -tz, nz = tx;
      L.forEach((l, k) => { pos.push(est[i].x + nx * l, hs[i] + 0.1, est[i].z + nz * l); const c = k === 0 || k === 3 ? c2 : c1; cores.push(c.r, c.g, c.b); });
      const a = i * 4, b = ((i + 1) % NE) * 4;
      for (let k = 0; k < 3; k++) idx.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const fita = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide }));
    fita.receiveShadow = true; raiz.add(fita);
    const nT = Math.floor(NE / 4), traco = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.04, 1.8), MAT('#ffffff'), nT);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cima = new THREE.Vector3(0, 1, 0), um = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    for (let k = 0; k < nT; k++) { const i = k * 4, [tx, tz] = tang(i); q.setFromAxisAngle(cima, Math.atan2(tx, tz)); traco.setMatrixAt(k, m4.compose(p.set(est[i].x, hs[i] + 0.14, est[i].z), q, um)); }
    raiz.add(traco);
  }

  const elementos = [], farois = {}, dicas = [];
  const nRio = i => Math.abs(est[i].z - rio(est[i].x)) < 22;

  // ---------- ELO DA LUZ: praça branca com a grade de prismas ----------
  const P = PLANOS[1], T = P.hh + 1.0;
  {
    const dais = new THREE.Mesh(new THREE.BoxGeometry(20, 1.0, 20), MAT('#fffaf1')); dais.position.set(P.x, T - 0.5, P.z); dais.receiveShadow = dais.castShadow = true; raiz.add(dais);
    const friso = new THREE.Mesh(new THREE.BoxGeometry(20.3, 0.14, 20.3), MAT('#f6c9a4')); friso.position.set(P.x, T - 0.95, P.z); raiz.add(friso);
    new Superficie({ tipo: 'caixa', x: P.x, z: P.z, hx: 10, hz: 10, topo: T });
    for (const s of [-1, 1]) {                                                  // degraus ao sul e ao norte
      const d = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 2.6), MAT('#f8efe0')); d.position.set(P.x, P.hh + 0.25, P.z + s * 11.3); d.receiveShadow = true; raiz.add(d);
      new Superficie({ tipo: 'caixa', x: P.x, z: P.z + s * 11.3, hx: 4, hz: 1.3, topo: P.hh + 0.5 });
    }
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {              // colunas nos cantos
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 5, 6), MAT('#fbf3e6')); c.position.set(P.x + cx * 9, T + 2.5, P.z + cz * 9); c.castShadow = true;
      const top = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), MAT('#f3c86e')); top.position.set(P.x + cx * 9, T + 5.4, P.z + cz * 9);
      raiz.add(c, top); new Superficie({ tipo: 'cil', x: P.x + cx * 9, z: P.z + cz * 9, r: 0.55, topo: T + 5, solido: true, baixo: T });
    }
  }
  new Superficie({ tipo: 'caixa', x: P.x, z: P.z, hx: 6.4, hz: 6.4, topo: T + 0.36 });
  const ponte = new PonteGiratoria(raiz, {
    x: -92, z: rio(-92), comp: 31, larg: 4.4, yaw0: Math.PI / 2, yaw1: 0,
    y: Math.max(alturaTerreno(-92, rio(-92) - 15.5), alturaTerreno(-92, rio(-92) + 15.5), 2.2) + 0.1,
  });
  elementos.push(ponte);
  const grade = new GradeFluxo(raiz, {
    x: P.x, y: T, z: P.z, tam: 3.2,
    pecas: [[3, 6, 12, 9], [10, 9, 5, 7], [6, 10, 3, 10], [5, 3, 7, 12]],   // caminho: (0,1)(1,1)(1,0)(2,0)(2,1)(2,2)(3,2)
    entrada: [0, 1], saida: [3, 2],
    aoResolver: () => { ctx.elo('luz'); setTimeout(() => { ponte.girar(); ctx.aviso('Uma ponte branca girou sobre o rio, a oeste.', 4); }, 1600); },
  }, ef);
  elementos.push(grade);
  farois.luz = new Farol(raiz, P.x, T, P.z);
  dicas.push({ x: P.x, z: P.z, r: 24, texto: 'Toque nas peças (ou pise nelas e aperte E) para girar os prismas e levar a luz até o cristal.' });

  // ---------- ELO DO VENTO: arcos de brisa e rampas na estrada ----------
  const iArcos = [0.05, 0.23, 0.41, 0.6, 0.79].map(f => { let i = Math.round(f * NE) % NE; while (nRio(i)) i = (i + 3) % NE; return i; });
  const arcos = new Arcos(raiz, iArcos.map(i => { const [tx, tz] = tang(i); return { x: est[i].x, y: hs[i] + 3.7, z: est[i].z, yaw: Math.atan2(tx, tz) }; }), {
    modo: 'carro', raio: 4.4,
    aoPassar: (i, n, a) => { ef.explodir(a.x, a.y, a.z, '#ffe3a0', 40, 5); ctx.aviso(`Arco de brisa ${n} de 5`, 1.6); },
    aoCompletar: () => { obelisco.mat.userData.alvo = 1; ctx.elo('vento'); },
    aoErrarModo: () => ctx.aviso('Os arcos de brisa respondem ao Carro — aperte 2.', 3.5),
  });
  elementos.push(arcos);
  for (const f of [0.32, 0.69]) {
    let i = Math.round(f * NE) % NE;
    while (nRio(i) || iArcos.some(a => Math.abs(a - i) < 14)) i = (i + 3) % NE;
    const [tx, tz] = tang(i); rampaBrisa(raiz, { x: est[i].x, z: est[i].z, yaw: Math.atan2(tx, tz), y0: hs[i] + 0.08 });
  }
  // Torre dos Ventos: obelisco com cata-vento perto do começo da estrada
  let iOb = 0; est.forEach((p, i) => { if (Math.hypot(p.x - 34, p.z - 112) < Math.hypot(est[iOb].x - 34, est[iOb].z - 112)) iOb = i; });
  const obelisco = (() => {
    const [tx, tz] = tang(iOb), x = est[iOb].x + tz * 9, z = est[iOb].z - tx * 9, y = alturaTerreno(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z); raiz.add(g);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 8, 6), MAT('#fbf1de')); col.position.y = 4; col.castShadow = true;
    const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.5, 6), MAT('#9fd8c0')); faixa.position.y = 2.2;
    const mat = matAcende('#e6dccb', '#ffc65e'), cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), mat); cr.position.y = 9.1;
    const helice = new THREE.Group(); helice.position.set(0, 7.2, 0.8);
    for (let k = 0; k < 3; k++) { const pa = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, 0.06), MAT('#f6c9a4')); pa.position.y = 1.2; const h = new THREE.Group(); h.rotation.z = k * TAU / 3; h.add(pa); helice.add(h); }
    g.add(col, faixa, cr, helice);
    new Superficie({ tipo: 'cil', x, z, r: 1.2, topo: y + 8, solido: true, baixo: y });
    farois.vento = new Farol(raiz, x, y, z);
    return { mat, cr, helice, x, z };
  })();
  dicas.push({ x: obelisco.x, z: obelisco.z, r: 20, texto: 'Torre dos Ventos: passe de Carro (2) pelos cinco arcos de brisa da estrada. As rampas verdes dão um pulo macio.' });

  // ---------- ELO DO CÉU: torre, elevador, térmicas, anéis e a ilha ----------
  const TW = PLANOS[3], Y = TW.hh + 27;
  {
    let y = TW.hh;
    [[8.5, 10, '#f8eddb'], [7.6, 9, '#efc9ab'], [6.8, 8, '#fbf3e6']].forEach(([r, h, c]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r, h, 6), MAT(c)); m.position.set(TW.x, y + h / 2, TW.z); m.castShadow = m.receiveShadow = true; raiz.add(m); y += h;
    });
    const mirante = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 10, 0.8, 12), MAT('#fffaf1')); mirante.position.set(TW.x, Y - 0.4, TW.z); mirante.castShadow = mirante.receiveShadow = true; raiz.add(mirante);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(10.4, 0.12, 4, 40), MAT('#9fd8c0')); aro.rotation.x = Math.PI / 2; aro.position.set(TW.x, Y + 0.05, TW.z); raiz.add(aro);
    new Superficie({ tipo: 'cil', x: TW.x, z: TW.z, r: 10.5, topo: Y, solido: true, baixo: TW.hh });
  }
  const dirE = new THREE.Vector2(26, 58).normalize(), ex = TW.x + dirE.x * 12.6, ez = TW.z + dirE.y * 12.6;
  const elevador = new Elevador(raiz, { x: ex, z: ez, yaw: Math.atan2(dirE.x, dirE.y), baixo: Math.max(...[[-2,-2],[2,-2],[-2,2],[2,2],[0,0]].map(([a, b]) => alturaTerreno(ex + a, ez + b))) + 0.05, alto: Y });
  elementos.push(elevador);
  // bandeira na torre (mostra o vento e a direção das térmicas)
  const bandeira = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2, 6, 1), new THREE.MeshLambertMaterial({ color: '#f6b98f', side: THREE.DoubleSide }));
  { const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 5), MAT('#fbf3e6')); mastro.position.set(TW.x - 6, Y + 2.5, TW.z - 6); raiz.add(mastro); bandeira.position.set(TW.x - 6 + 1.2, Y + 4.3, TW.z - 6); raiz.add(bandeira); }

  const termicas = [
    new Termica(raiz, { x: -100, z: -62, base: alturaTerreno(-100, -62), topo: 56 }),
    new Termica(raiz, { x: -78, z: -92, base: alturaTerreno(-78, -92), topo: 63 }),
  ];
  elementos.push(...termicas);
  const ILHA = { x: -56, z: -114, y: 47, r: 10 };
  criarIlha(raiz, { ...ILHA, arvore: true });
  const pedestal = new Pedestal(raiz, { x: ILHA.x + 1.5, y: ILHA.y, z: ILHA.z + 1.5, aoTocar: () => ctx.elo('ceu') });
  elementos.push(pedestal);
  farois.ceu = new Farol(raiz, ILHA.x, ILHA.y, ILHA.z);

  // ponte de luz: aparece quando os quatro anéis do céu forem atravessados
  const PORTAL = { x: 0, z: -55, y: PLANOS[2].hh };
  const pontes = (() => {
    const d = new THREE.Vector2(PORTAL.x - ILHA.x, PORTAL.z - ILHA.z).normalize();
    const A = { x: ILHA.x + d.x * 9.4, z: ILHA.z + d.y * 9.4, y: ILHA.y }, B = { x: PORTAL.x - d.x * 9, z: PORTAL.z - d.y * 9, y: PORTAL.y + 0.6 };
    const comp = Math.hypot(B.x - A.x, B.z - A.z), yaw = Math.atan2(d.x, d.y);
    const sup = new Superficie({ tipo: 'rampa', x: (A.x + B.x) / 2, z: (A.z + B.z) / 2, yaw, hx: 1.6, hz: comp / 2, h0: A.y, h1: B.y, ativa: false });
    const len3 = Math.hypot(comp, A.y - B.y);
    const mat = new THREE.MeshLambertMaterial({ color: '#fff3d6', emissive: '#ffd27a', emissiveIntensity: 0.55, transparent: true, opacity: 0 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, len3), mat); m.rotation.order = 'YXZ'; m.rotation.y = yaw; m.rotation.x = Math.atan2(A.y - B.y, comp);
    m.position.set((A.x + B.x) / 2, (A.y + B.y) / 2 - 0.12, (A.z + B.z) / 2); m.visible = false; raiz.add(m);
    return { sup, m, mat, t: -1 };
  })();
  const pAneis = [[-107, -47, 34], [-92, -74, 50], [-80, -93, 58], [-67, -106, 53]];
  const aneis = new Arcos(raiz, pAneis.map(([x, z, y], i) => {
    const [nx, nz] = i + 1 < pAneis.length ? pAneis[i + 1] : [ILHA.x, ILHA.z];
    return { x, y, z, yaw: Math.atan2(nx - x, nz - z) };
  }), {
    modo: 'voo', raio: 5.2, tubo: 0.3,
    aoPassar: (i, n, a) => { ef.explodir(a.x, a.y, a.z, '#fff0c0', 40, 5); ctx.aviso(`Anel do céu ${n} de 4`, 1.6); ctx.jog.vVoo = Math.min(ctx.jog.vVoo + 4, 26); ctx.jog.impulso += 2.5; },
    aoCompletar: () => { pontes.sup.ativa = true; pontes.m.visible = true; pontes.t = 0; Som.ponte(); ctx.aviso('Os anéis abriram uma ponte de luz da ilha até o portal.', 4); },
  });
  elementos.push(aneis);
  dicas.push({ x: TW.x, z: TW.z, r: 24, texto: 'Suba no elevador. Lá em cima, abra as asas (3) e plane até as correntes de ar quente.' });
  dicas.push({ x: -100, z: -62, r: 16, modo: 'voo', texto: 'Fique dentro da corrente de ar quente para subir. Depois siga até a ilha flutuante.' });
  dicas.push({ x: -100, z: -62, r: 14, modo: 'andar', texto: 'Esta corrente de ar só levanta quem está planando: aperte 3.' });

  // ---------- PORTAL no terraço do morro ----------
  const portal = new Portal(raiz, { x: PORTAL.x, y: PORTAL.y, z: PORTAL.z, yaw: 0, elos: ['luz', 'vento', 'ceu'] });
  elementos.push(portal);
  dicas.push({ x: PORTAL.x, z: PORTAL.z, r: 16, texto: 'O portal desperta quando os três elos brilharem.', antes: true });

  // ---------- praça de chegada e degraus flutuantes até o mirante ----------
  const S = PLANOS[0];
  {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 0.35, 16), MAT('#fffaf1')); d.position.set(S.x, S.hh + 0.17, S.z); d.receiveShadow = true; raiz.add(d);
    new Superficie({ tipo: 'cil', x: S.x, z: S.z, r: 5, topo: S.hh + 0.35 });
    const arco = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 6, 24, Math.PI), MAT('#f6c9a4')); arco.position.set(S.x, S.hh + 0.35, S.z - 4); raiz.add(arco);
    const C = { x: -17, z: 129 }, hS = S.hh;
    for (let k = 0; k < 8; k++) {
      const a = k * 0.78 + 0.6, x = C.x + Math.cos(a) * 7, z = C.z + Math.sin(a) * 7, y = hS + 0.95 + k * 1.05;
      const pedra = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.1, 0.6, 6), MAT(k % 2 ? '#fbf1de' : '#f3d2b8')); pedra.position.set(x, y - 0.3, z); pedra.castShadow = pedra.receiveShadow = true; raiz.add(pedra);
      new Superficie({ tipo: 'cil', x, z, r: 1.5, topo: y });
    }
    criarIlha(raiz, { x: C.x, y: hS + 9.4, z: C.z, r: 4.6, arvore: false });
    dicas.push({ x: C.x, z: C.z, r: 4, y: hS + 9.4, texto: 'Que vista! Daqui dá para ver os três feixes de luz.' });
  }

  // ---------- ilhas decorativas no alto ----------
  for (const [x, z, y, r] of [[62, -18, 40, 7], [140, -140, 56, 9], [-152, 82, 48, 8], [112, 140, 60, 10], [-30, 172, 52, 6], [-170, -150, 62, 9], [-20, -150, 70, 8]]) criarIlha(raiz, { x, y, z, r, arvore: rnd() < 0.7 });

  // ---------- vegetação ----------
  const livre = (x, z) => {
    if (pertoEstrada(x, z).d < 7.5) return false;
    for (const p of PLANOS) if (Math.hypot(x - p.x, z - p.z) < p.r + 4) return false;
    if (Math.abs(z - rio(x)) < 9) return false;
    if (Math.hypot(x + 92, z - rio(-92)) < 19 || Math.hypot(x + 17, z - 129) < 10 || Math.hypot(x - ex, z - ez) < 5) return false;
    return Math.hypot(x, z) < 200;
  };
  plantarArvores(raiz, 760, livre, ['#a9cf9a', '#b9d7a0', '#9fc7a2', '#c7dca0', '#f3c9b4', '#f7d8a8']);
  espalharPedras(raiz, 170, livre);
  espalharFlores(raiz, 1000, livre);

  return {
    inicio: { x: S.x, z: S.z - 1, yaw: Math.PI },
    elementos, farois, dicas, portal, grade, clicaveis: grade.alvos,
    atualizar(dt, jog, t) {
      for (const e of elementos) e.atualizar(dt, jog, t);
      for (const f of Object.values(farois)) f.atualizar(dt, jog, t);
      obelisco.helice.rotation.z += dt * (arcos.completo ? 3 : 0.9);
      obelisco.cr.rotation.y += dt; animarAcende(obelisco.mat, dt, Math.sin(t * 2) * 0.15);
      const pb = bandeira.geometry.attributes.position;          // bandeira ondulando
      for (let i = 0; i < pb.count; i++) { const x = pb.getX(i) + 1.2; pb.setZ(i, Math.sin(t * 4 + x * 2.2) * 0.18 * x / 2.4); }
      pb.needsUpdate = true;
      if (pontes.t >= 0 && pontes.t < 1) { pontes.t = Math.min(1, pontes.t + dt * 0.6); pontes.mat.opacity = pontes.t * 0.85; }
    },
  };
}

const FASES = [
  { id: 'vale', nome: 'Vale da Brisa', ola: 'Bem-vindo ao Vale da Brisa', det: 'manhã cristalina · prismas de luz, estrada panorâmica e térmicas', cor: '#8fd3b8', clima: 'manha', pronta: true,
    elos: [{ id: 'luz', nome: 'Luz' }, { id: 'vento', nome: 'Vento' }, { id: 'ceu', nome: 'Céu' }], construir: construirVale },
  { id: 'aquedutos', nome: 'Aquedutos do Sol', ola: 'Bem-vindo aos Aquedutos do Sol', det: 'tarde dourada · canais d’água, cisterna, aquedutos e espelhos de sol', cor: '#f0b866', clima: 'tarde', pronta: true,
    elos: [{ id: 'agua', nome: 'Água' }, { id: 'aqueduto', nome: 'Aqueduto' }, { id: 'sol', nome: 'Sol' }], construir: construirAquedutos },
  { id: 'arquipelago', nome: 'Arquipélago de Vento', det: 'brisa de montanha · ilhas, correntes e ricochetes', cor: '#9ccfdf', clima: 'montanha', pronta: false },
];

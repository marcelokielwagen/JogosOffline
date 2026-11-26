/* =====================================================================
   FASE 2 — AQUEDUTOS DO SOL (tarde dourada)
   Terra de mesas cor de areia, cortada por um cânion com água turquesa.
     Elo da Água (andando): canais de pedra levam a água da fonte até a
       cisterna; a balsa sobe com a água até o alto da mesa; lá em cima,
       a placa abre a comporta e a cascata desce até o cânion.
     Elo do Aqueduto (carro): cinco arcos na estrada, dois deles sobre
       os aquedutos que cruzam o cânion.
     Elo do Sol (voo): elevador da Torre do Sol, correntes de ar e quatro
       espelhos dourados que mandam feixes de luz para o cristal da torre.
   Os três abrem o portal no terraço ao norte.
   ===================================================================== */

// ---------- ajudantes de estrada (servem para as próximas fases também) ----------
function estradaLaco(ctrl, passo = 1.5) {
  const curva = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const NE = Math.round(curva.getLength() / passo), est = curva.getSpacedPoints(NE).slice(0, NE);
  const GR = 20, grade = new Map(), chave = (a, b) => a + ',' + b;
  est.forEach((p, i) => { const k = chave(Math.floor(p.x / GR), Math.floor(p.z / GR)); if (!grade.has(k)) grade.set(k, []); grade.get(k).push(i); });
  const perto = (x, z) => {
    const cx = Math.floor(x / GR), cz = Math.floor(z / GR); let melhor = 1e9, im = -1;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const l = grade.get(chave(cx + a, cz + b)); if (!l) continue;
      for (const i of l) { const d = (est[i].x - x) ** 2 + (est[i].z - z) ** 2; if (d < melhor) { melhor = d; im = i; } }
    }
    return { d: Math.sqrt(melhor), i: im };
  };
  const tang = i => { const a = est[(i - 1 + NE) % NE], b = est[(i + 1) % NE], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  return { est, NE, perto, tang };
}
function alisarLaco(hs, raio = 9, vezes = 3) {
  const N = hs.length;
  for (let v = 0; v < vezes; v++) hs = hs.map((_, i) => { let s = 0; for (let k = -raio; k <= raio; k++) s += hs[(i + k + N) % N]; return s / (raio * 2 + 1); });
  return hs;
}
function fitaEstrada(raiz, { est, NE, tang }, hs, cores = ['#f5e9cd', '#e7d3ab']) {
  const pos = [], cs = [], idx = [], L = [-3.9, -3.2, 3.2, 3.9], c1 = new THREE.Color(cores[0]), c2 = new THREE.Color(cores[1]);
  for (let i = 0; i < NE; i++) {
    const [tx, tz] = tang(i), nx = -tz, nz = tx;
    L.forEach((l, k) => { pos.push(est[i].x + nx * l, hs[i] + 0.1, est[i].z + nz * l); const c = k === 0 || k === 3 ? c2 : c1; cs.push(c.r, c.g, c.b); });
    const a = i * 4, b = ((i + 1) % NE) * 4;
    for (let k = 0; k < 3; k++) idx.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const fita = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide }));
  fita.receiveShadow = true; raiz.add(fita);
  const nT = Math.floor(NE / 4), traco = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.04, 1.8), MAT('#ffffff'), nT);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cima = new THREE.Vector3(0, 1, 0), um = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let k = 0; k < nT; k++) { const i = k * 4, [tx, tz] = tang(i); q.setFromAxisAngle(cima, Math.atan2(tx, tz)); traco.setMatrixAt(k, m4.compose(p.set(est[i].x, hs[i] + 0.14, est[i].z), q, um)); }
  raiz.add(traco);
}
// arcos de pedra sob um tabuleiro (aqueduto): pilares a cada "vao" metros e meia-lua entre eles
function arcadas(raiz, A, B, topo, fundo, vao = 9, larg = 6) {
  const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / vao)), yaw = Math.atan2(dx, dz);
  const matP = MAT('#f3dcb8'), matA = MAT('#ecc9a2');
  for (let k = 0; k <= n; k++) {
    const x = A.x + dx * k / n, z = A.z + dz * k / n, base = Math.min(fundo, alturaTerreno(x, z)) - 1, alt = topo - 0.8 - base;
    if (alt < 1) continue;
    const p = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, 1.6), matP); p.position.set(x, base + alt / 2, z); p.rotation.y = yaw; p.castShadow = p.receiveShadow = true; raiz.add(p);
  }
  const r = L / n / 2;
  for (let k = 0; k < n; k++) {
    const x = A.x + dx * (k + 0.5) / n, z = A.z + dz * (k + 0.5) / n;
    const arco = new THREE.Mesh(new THREE.TorusGeometry(r - 0.6, 0.7, 5, 14, Math.PI), matA);
    arco.position.set(x, topo - 0.8 - r * 0.9, z); arco.rotation.y = yaw + Math.PI / 2; arco.scale.set(1, 0.9, larg / 1.4); raiz.add(arco);
  }
}

function construirAquedutos(ctx) {
  const { raiz, ef } = ctx;
  semear(20261127);
  const zc = x => 12 + 10 * Math.sin(x / 55);                                  // eixo do cânion
  const E = estradaLaco([[22, 104], [75, 118], [128, 88], [146, 30], [128, -30], [88, -78], [40, -96], [16, -70], [30, -30], [44, 10], [30, 50], [12, 80]]);
  const { est, NE, tang } = E;

  // ---------- relevo: dunas suaves, cânion, mesas de topo chato ----------
  const MORROS = [[-40, 110, 24, 5], [100, -130, 26, 7], [-20, -130, 22, 5], [90, 40, 16, 3], [-150, 20, 24, 6]];
  const PLANOS = [{ x: 0, z: 128, r: 12, b: 10 }, { x: -72, z: 80, r: 16, b: 10 }, { x: -108, z: 80, r: 7, b: 5 }, { x: -10, z: -78, r: 14, b: 14, h: 15 }, { x: -70, z: -80, r: 11, b: 8 }];
  const MESAS = [{ x: -135, z: 80, r: 16, b: 6, h: 24 }, { x: 80, z: 60, r: 11, b: 6, h: 19 }, { x: 62, z: -132, r: 13, b: 6, h: 22 }, { x: -160, z: -125, r: 14, b: 7, h: 27 }, { x: -62, z: 150, r: 10, b: 6, h: 18 }];
  function semCanion(x, z) {
    let h = 7.5 + (fbm(x * 0.014, z * 0.014) - 0.47) * 9 + Math.sin(x * 0.05 + z * 0.031) * 0.9;
    h += suave(150, 212, Math.hypot(x, z)) * (34 + 26 * fbm(x * 0.02 + 3, z * 0.02 + 9));   // anel de montanhas (antes das mesas: topo delas fica plano)
    for (const [mx, mz, r, a] of MORROS) h += a * Math.exp(-((x - mx) ** 2 + (z - mz) ** 2) / (r * r));
    return h;
  }
  const canion = (x, z, h) => mix(-3.5, h, suave(6, 15, Math.abs(z - zc(x))));
  for (const p of PLANOS) p.hh = p.h ?? Math.max(3, semCanion(p.x, p.z));
  const planos = (x, z, h) => { for (const p of PLANOS) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + p.b) h = mix(p.hh, h, suave(p.r, p.r + p.b, d)); } return h; };
  const mesas = (x, z, h) => { for (const m of MESAS) { const d = Math.hypot(x - m.x, z - m.z); if (d < m.r + m.b) h = Math.max(h, mix(m.h, h, suave(m.r, m.r + m.b, d))); } return h; };
  const base = (x, z) => mesas(x, z, planos(x, z, canion(x, z, semCanion(x, z))));
  // estrada: altura sem o cânion (onde o chão some, vira aqueduto)
  let hs = alisarLaco(est.map(p => Math.max(2, planos(p.x, p.z, semCanion(p.x, p.z)))));
  const ponte = est.map((p, i) => base(p.x, p.z) < hs[i] - 1.8);
  // alarga um pouco cada trecho de ponte para apoiar nas duas margens
  const ponteL = ponte.map((_, i) => { for (let k = -3; k <= 3; k++) if (ponte[(i + k + NE) % NE]) return true; return false; });
  function altura(x, z) {
    let h = base(x, z);
    const e = E.perto(x, z); if (e.d < 12 && !ponte[e.i]) h = mix(hs[e.i], h, suave(4.4, 11, e.d));
    return h;
  }
  function cor(c, h, incl, x, z) {
    if (h < 0.6) c.set('#e6d0a6');
    else if (incl > 0.32) c.set(['#e8b38c', '#f2cfa6', '#eabf98'][Math.floor(h / 2.2) % 3]);   // estratos das mesas
    else if (h > 17.5) c.set('#e3dca6');
    else { const f = fbm(x * 0.025, z * 0.025, 2); c.set(f > 0.56 ? '#d6dcab' : f > 0.46 ? '#f1e0b8' : '#f6e8c8'); }
    c.offsetHSL(0, 0, hash2(Math.floor(x * 0.7), Math.floor(z * 0.7)) * 0.05 - 0.025);
  }
  raiz.add(gerarTerreno(altura, cor));
  fitaEstrada(raiz, E, hs);

  const elementos = [], farois = {}, dicas = [], canais = [];

  // ---------- aquedutos da estrada: tabuleiro, arcos e calha com água ----------
  {
    let i0 = -1;
    const trechos = [];
    for (let k = 0; k <= NE; k++) {
      const i = k % NE, on = k < NE && ponteL[i];
      if (on && i0 < 0) i0 = k; else if (!on && i0 >= 0) { trechos.push([i0, k - 1]); i0 = -1; }
    }
    for (const [a, b] of trechos) {
      for (let k = a; k < b; k += 4) {
        const i = k % NE, j = Math.min(k + 4, b) % NE, A = est[i], B = est[j], L = Math.hypot(B.x - A.x, B.z - A.z) + 0.6, yaw = Math.atan2(B.x - A.x, B.z - A.z), y = (hs[i] + hs[j]) / 2;
        new Superficie({ tipo: 'caixa', x: (A.x + B.x) / 2, z: (A.z + B.z) / 2, yaw, hx: 4.4, hz: L / 2, topo: y });
        const deck = new THREE.Mesh(new THREE.BoxGeometry(9, 0.9, L), MAT('#f8ead2')); deck.position.set((A.x + B.x) / 2, y - 0.45, (A.z + B.z) / 2); deck.rotation.y = yaw; deck.castShadow = deck.receiveShadow = true; raiz.add(deck);
        for (const s of [-1, 1]) { const par = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, L), MAT('#f0c9a3')); par.position.set(s * 4.4, 0.8, 0); deck.add(par); }
      }
      const A = est[a % NE], B = est[b % NE];
      arcadas(raiz, A, B, Math.min(hs[a % NE], hs[b % NE]), 0, 9, 7);
      // calha com água corrente ao lado da pista: é isso que faz deles aquedutos
      const pts = []; for (let k = a; k <= b; k += 2) { const i = k % NE, [tx, tz] = tang(i); pts.push([est[i].x - tz * 5.2, hs[i] + 0.55, est[i].z + tx * 5.2]); }
      if (pts.length > 1) { const c = new CanalAgua(raiz, pts, { largura: 1.1, cheio: true }); canais.push(c); }
    }
  }

  // ---------- passarela de pedra sobre o cânion (para quem anda) ----------
  {
    const x = -10, zm = zc(x), comp = 38, y = Math.max(alturaTerreno(x, zm - 19), alturaTerreno(x, zm + 19)) + 0.1;
    new Superficie({ tipo: 'caixa', x, z: zm, hx: 2.4, hz: comp / 2, topo: y });
    const d = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.7, comp), MAT('#fbf0dc')); d.position.set(x, y - 0.35, zm); d.castShadow = d.receiveShadow = true; raiz.add(d);
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, comp), MAT('#efb994')); c.position.set(x + s * 2.3, y + 0.3, zm); raiz.add(c); }
    arcadas(raiz, { x, z: zm - comp / 2 + 3 }, { x, z: zm + comp / 2 - 3 }, y, -3, 8, 4.4);
  }

  // ---------- ELO DA ÁGUA: praça dos canais, cisterna e comporta ----------
  const G = PLANOS[1], T = G.hh + 1.0;
  {
    const dais = new THREE.Mesh(new THREE.BoxGeometry(20, 1.0, 22), MAT('#fbf1de')); dais.position.set(G.x, T - 0.5, G.z); dais.receiveShadow = dais.castShadow = true; raiz.add(dais);
    const friso = new THREE.Mesh(new THREE.BoxGeometry(20.3, 0.14, 22.3), MAT('#7fd0c4')); friso.position.set(G.x, T - 0.95, G.z); raiz.add(friso);
    new Superficie({ tipo: 'caixa', x: G.x, z: G.z, hx: 10, hz: 11, topo: T });
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 2.6), MAT('#f6e7cc')); d.position.set(G.x, G.hh + 0.25, G.z + s * 12.3); d.receiveShadow = true; raiz.add(d);
      new Superficie({ tipo: 'caixa', x: G.x, z: G.z + s * 12.3, hx: 4, hz: 1.3, topo: G.hh + 0.5 });
    }
    // fonte: urna de pedra com água, do lado leste (de onde vem a água)
    const urna = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.1, 1.6, 10), MAT('#f1d9b5')); urna.position.set(G.x + 13.5, T + 0.3, G.z - 6.4); urna.castShadow = true; raiz.add(urna);
    const espelho = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), new THREE.MeshLambertMaterial({ map: texturaAgua(), emissive: '#7fd6cf', emissiveIntensity: 0.3 })); espelho.rotation.x = -Math.PI / 2; espelho.position.set(G.x + 13.5, T + 1.12, G.z - 6.4); raiz.add(espelho);
  }
  new Superficie({ tipo: 'caixa', x: G.x, z: G.z, hx: 6.4, hz: 8, topo: T + 0.36 });
  const AGUA = { corApagada: '#d7bf98', corAcesa: '#86ded4', corFonte: '#9fe6dc', corFaisca: '#c8f4ee' };
  const M1 = MESAS[0];
  const cisterna = new Cisterna(raiz, {
    x: -108, z: 80, lado: 4.5, alto: M1.h,
    baixo: Math.max(...[[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]].map(([a, b]) => alturaTerreno(-108 + a, 80 + b))) + 0.05,
    aoSeca: () => ctx.aviso('A cisterna está seca: primeiro leve a água pelos canais da praça.', 4),
  });
  elementos.push(cisterna);
  // canal da praça até a cisterna (enche quando a grade fica pronta)
  const canalCist = (() => {
    const pts = [[-79.8, T + 0.12, 73.6], [-82.4, T + 0.12, 73.6]];
    for (let x = -83.6; x > -100; x -= 2) pts.push([x, alturaTerreno(x, 73.6) + 0.3, 73.6]);
    for (const [x, z] of [[-100, 74.5], [-101.5, 76], [-102.8, 77.5]]) pts.push([x, alturaTerreno(x, z) + 0.3, z]);
    return new CanalAgua(raiz, pts, { largura: 1.3 });
  })();
  canais.push(canalCist);
  const grade = new GradeFluxo(raiz, {
    x: G.x, y: T, z: G.z, tam: 3.2, yaw: Math.PI, ...AGUA,
    pecas: [[10, 12, 6, 9], [6, 5, 7, 5], [10, 3, 12, 9], [5, 6, 5, 12], [3, 10, 3, 10]],   // caminho: (0,0)(1,0)(1,1)(1,2)(2,2)(2,3)(2,4)(3,4)
    entrada: [0, 0], saida: [3, 4],
    aoResolver: () => {
      canalCist.encher(); Som.ponte();
      setTimeout(() => { cisterna.ativar(); ctx.aviso('A água correu até a cisterna. Pise na balsa: ela sobe com a água.', 5); }, 1800);
    },
  }, ef);
  elementos.push(grade);
  // passarela do alto da cisterna até o topo da mesa
  {
    const y = M1.h, d = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 3.2), MAT('#fbf0dc')); d.position.set(-117, y - 0.25, 80); d.castShadow = true; raiz.add(d);
    new Superficie({ tipo: 'caixa', x: -117, z: 80, hx: 4.6, hz: 1.6, topo: y });
  }
  const cascata = (() => {
    const y = M1.h, pts = [[-135, y + 0.12, 74], [-135, y + 0.12, 64.6]];
    for (let k = 1; k <= 5; k++) { const z = 64.6 - k * 1.3; pts.push([-135, Math.max(alturaTerreno(-135, z) + 0.3, y - (k / 5) ** 1.6 * (y - alturaTerreno(-135, 57))), z]); }
    for (let z = 55; z > 8; z -= 3) pts.push([-135 + (55 - z) * 0.04, Math.max(alturaTerreno(-135 + (55 - z) * 0.04, z) + 0.3, 0.25), z]);
    return new CanalAgua(raiz, pts, { largura: 2.2, vel: 1.6 });
  })();
  canais.push(cascata);
  const comporta = new Comporta(raiz, {
    x: -135, y: M1.h, z: 80,
    aoAbrir: () => { cascata.encher(); setTimeout(() => ctx.elo('agua'), 1200); },
  });
  elementos.push(comporta);
  farois.agua = new Farol(raiz, M1.x, M1.h, M1.z);
  dicas.push({ x: G.x, z: G.z, r: 24, texto: 'Gire os canais de pedra (toque ou E) para levar a água da fonte até a calha da cisterna.' });
  dicas.push({ x: -135, z: 80, r: 14, y: M1.h, texto: 'Pise na placa verde para abrir a comporta.' });

  // ---------- ELO DO AQUEDUTO: arcos e rampas na estrada ----------
  const iArcos = [];
  { // dois arcos sobre aquedutos (se houver) e o resto espalhado
    const nas = []; for (let i = 0; i < NE; i++) if (ponte[i] && !ponte[(i - 1 + NE) % NE]) nas.push(i);
    for (const i of nas.slice(0, 2)) { let j = i; let n = 0; while (ponte[(j + 1) % NE] && n < 10) { j = (j + 1) % NE; n++; } iArcos.push((i + Math.floor(n / 2)) % NE); }
    for (const f of [0.06, 0.3, 0.55, 0.8]) {
      if (iArcos.length >= 5) break;
      let i = Math.round(f * NE) % NE; while (ponteL[i] || iArcos.some(a => Math.abs(a - i) < 25)) i = (i + 3) % NE; iArcos.push(i);
    }
  }
  const arcos = new Arcos(raiz, iArcos.map(i => { const [tx, tz] = tang(i); return { x: est[i].x, y: hs[i] + 3.7, z: est[i].z, yaw: Math.atan2(tx, tz) }; }), {
    modo: 'carro', raio: 4.4,
    aoPassar: (i, n, a) => { ef.explodir(a.x, a.y, a.z, '#ffe3a0', 40, 5); ctx.aviso(`Arco do aqueduto ${n} de ${iArcos.length}`, 1.6); },
    aoCompletar: () => { fonte.mat.userData.alvo = 1; ctx.elo('aqueduto'); },
    aoErrarModo: () => ctx.aviso('Estes arcos respondem ao Carro: aperte 2.', 3.5),
  });
  elementos.push(arcos);
  for (const f of [0.4, 0.92]) {
    let i = Math.round(f * NE) % NE;
    while (ponteL[i] || iArcos.some(a => Math.abs(a - i) < 14)) i = (i + 3) % NE;
    const [tx, tz] = tang(i); rampaBrisa(raiz, { x: est[i].x, z: est[i].z, yaw: Math.atan2(tx, tz), y0: hs[i] + 0.08 });
  }
  // Fonte do Aqueduto: chafariz perto do começo da estrada
  let iF = 0; est.forEach((p, i) => { if (Math.hypot(p.x - 36, p.z - 112) < Math.hypot(est[iF].x - 36, est[iF].z - 112)) iF = i; });
  const fonte = (() => {
    const [tx, tz] = tang(iF), x = est[iF].x + tz * 10, z = est[iF].z - tx * 10, y = alturaTerreno(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z); raiz.add(g);
    const bacia = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.9, 16), MAT('#f6e3c4')); bacia.position.y = 0.45; bacia.castShadow = true;
    const agua = new THREE.Mesh(new THREE.CircleGeometry(2.9, 20), new THREE.MeshLambertMaterial({ map: texturaAgua(), emissive: '#7fd6cf', emissiveIntensity: 0.3 })); agua.rotation.x = -Math.PI / 2; agua.position.y = 0.85;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 4.2, 8), MAT('#fbf1de')); col.position.y = 2.1;
    const tacinha = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.5, 0.5, 10), MAT('#f1d9b5')); tacinha.position.y = 4.2;
    const jato = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 3.4, 8, 1, true), new THREE.MeshLambertMaterial({ map: texturaAgua().clone(), transparent: true, opacity: 0.8, emissive: '#7fd6cf', emissiveIntensity: 0.3 }));
    jato.position.y = 2.6; jato.material.map.needsUpdate = true;
    const mat = matAcende('#e6dccb', '#ffc65e'), cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), mat); cr.position.y = 5.3;
    g.add(bacia, agua, col, tacinha, jato, cr);
    new Superficie({ tipo: 'cil', x, z, r: 3.3, topo: y + 0.9, solido: true, baixo: y });
    farois.aqueduto = new Farol(raiz, x, y, z);
    return { mat, cr, jato, x, z };
  })();
  dicas.push({ x: fonte.x, z: fonte.z, r: 20, texto: 'Fonte do Aqueduto: passe de Carro (2) pelos cinco arcos da estrada. Dois ficam sobre os aquedutos do cânion.' });

  // ---------- ELO DO SOL: Torre do Sol, elevador, térmicas e espelhos ----------
  const TS = PLANOS[4], VAR = 34, ALVO = { x: TS.x, y: 47, z: TS.z };
  {
    const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 5, VAR - TS.hh, 8), MAT('#fbf0dc')); nucleo.position.set(TS.x, (VAR + TS.hh) / 2, TS.z); nucleo.castShadow = nucleo.receiveShadow = true; raiz.add(nucleo);
    for (let k = 1; k < (VAR - TS.hh) / 6; k++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(4.6 - k * 0.15, 4.6 - k * 0.15, 0.5, 8), MAT('#ebb790')); f.position.set(TS.x, TS.hh + k * 6, TS.z); raiz.add(f); }
    const varanda = new THREE.Mesh(new THREE.CylinderGeometry(7, 6.4, 0.8, 16), MAT('#fffaf1')); varanda.position.set(TS.x, VAR - 0.4, TS.z); varanda.castShadow = varanda.receiveShadow = true; raiz.add(varanda);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(6.9, 0.12, 4, 40), MAT('#f0bd55')); aro.rotation.x = Math.PI / 2; aro.position.set(TS.x, VAR + 0.05, TS.z); raiz.add(aro);
    const agulha = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.6, ALVO.y - VAR - 2, 8), MAT('#fbf1de')); agulha.position.set(TS.x, VAR + (ALVO.y - VAR - 2) / 2, TS.z); agulha.castShadow = true; raiz.add(agulha);
    new Superficie({ tipo: 'cil', x: TS.x, z: TS.z, r: 7, topo: VAR, solido: true, baixo: TS.hh });
    new Superficie({ tipo: 'cil', x: TS.x, z: TS.z, r: 1.6, topo: ALVO.y - 2, solido: true, baixo: VAR });
  }
  const solMat = matAcende('#f6ead2', '#ffc65e'), solCr = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), solMat); solCr.position.set(ALVO.x, ALVO.y, ALVO.z); solCr.castShadow = true; raiz.add(solCr);
  const dirE = new THREE.Vector2(0.55, 0.83).normalize(), ex = TS.x + dirE.x * 9.2, ez = TS.z + dirE.y * 9.2;
  elementos.push(new Elevador(raiz, { x: ex, z: ez, yaw: Math.atan2(dirE.x, dirE.y), baixo: Math.max(...[[-2, -2], [2, -2], [-2, 2], [2, 2], [0, 0]].map(([a, b]) => alturaTerreno(ex + a, ez + b))) + 0.05, alto: VAR }));
  elementos.push(
    new Termica(raiz, { x: -104, z: -80, base: alturaTerreno(-104, -80), topo: 52 }),
    new Termica(raiz, { x: -66, z: -122, base: alturaTerreno(-66, -122), topo: 60 }),
    new Termica(raiz, { x: -32, z: -100, base: alturaTerreno(-32, -100), topo: 52 }),
  );
  const espelhos = new Espelhos(raiz, [{ x: -110, z: -55, y: 30 }, { x: -100, z: -124, y: 40 }, { x: -42, z: -130, y: 46 }, { x: -30, z: -52, y: 34 }], ALVO, {
    aoAcender: (i, n, e) => { ef.explodir(e.x, e.y + 2.2, e.z, '#ffe2a0', 40, 5); ctx.aviso(`Espelho do sol ${n} de 4`, 1.8); },
    aoCompletar: () => { solMat.userData.alvo = 1; ef.explodir(ALVO.x, ALVO.y, ALVO.z, '#ffd27a', 120, 9); ctx.elo('sol'); },
  });
  elementos.push(espelhos);
  farois.sol = new Farol(raiz, TS.x, ALVO.y + 2, TS.z);
  dicas.push({ x: TS.x, z: TS.z, r: 22, texto: 'Torre do Sol: suba pelo elevador, abra as asas (3) e plane perto dos quatro espelhos dourados.' });
  dicas.push({ x: -104, z: -80, r: 15, modo: 'voo', texto: 'Use as correntes de ar quente para ganhar altura até os espelhos mais altos.' });

  // ---------- PORTAL no terraço ao norte ----------
  const PT = PLANOS[3];
  const portal = new Portal(raiz, { x: PT.x, y: PT.hh, z: PT.z, yaw: 0, elos: ['agua', 'aqueduto', 'sol'] });
  elementos.push(portal);
  dicas.push({ x: PT.x, z: PT.z, r: 16, texto: 'O portal desperta quando os três elos brilharem.', antes: true });

  // ---------- praça de chegada ----------
  const S = PLANOS[0];
  {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 0.35, 16), MAT('#fbf1de')); d.position.set(S.x, S.hh + 0.17, S.z); d.receiveShadow = true; raiz.add(d);
    new Superficie({ tipo: 'cil', x: S.x, z: S.z, r: 5, topo: S.hh + 0.35 });
    const arco = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 6, 24, Math.PI), MAT('#7fd0c4')); arco.position.set(S.x, S.hh + 0.35, S.z - 4); raiz.add(arco);
    // canalzinho decorativo com água correndo ao lado da praça
    const pts = []; for (let k = 0; k <= 14; k++) { const x = -6 - k * 2, z = S.z + 7 + Math.sin(k * 0.5) * 2; pts.push([x, alturaTerreno(x, z) + 0.3, z]); }
    canais.push(new CanalAgua(raiz, pts, { largura: 1.0, cheio: true }));
  }

  // ---------- ilhas no alto e vegetação seca ----------
  for (const [x, z, y, r] of [[40, -20, 42, 7], [140, -130, 58, 9], [-150, 40, 52, 8], [110, 140, 60, 9], [20, 170, 50, 6], [-20, -160, 70, 8]]) criarIlha(raiz, { x, y, z, r, arvore: rnd() < 0.6, cor: '#d8d8a0' });
  const livre = (x, z) => {
    if (E.perto(x, z).d < 8) return false;
    for (const p of PLANOS) if (Math.hypot(x - p.x, z - p.z) < p.r + 4) return false;
    for (const m of MESAS) if (Math.hypot(x - m.x, z - m.z) < m.r + m.b + 1) return false;
    if (Math.abs(z - zc(x)) < 17) return false;
    if (Math.hypot(x + 10, z - zc(-10)) < 24 || Math.hypot(x + 108, z - 80) < 9 || Math.hypot(x - ex, z - ez) < 5) return false;
    return Math.hypot(x, z) < 200;
  };
  plantarArvores(raiz, 380, livre, ['#c3c98f', '#b6c392', '#d4cf98', '#f3c9a0', '#efb98f', '#bcc79a']);
  espalharPedras(raiz, 260, livre);
  espalharFlores(raiz, 520, livre);

  return {
    inicio: { x: S.x, z: S.z - 1, yaw: Math.PI },
    elementos, farois, dicas, portal, grade, clicaveis: grade.alvos,
    atualizar(dt, jog, t) {
      for (const e of elementos) e.atualizar(dt, jog, t);
      for (const c of canais) c.atualizar(dt);
      for (const f of Object.values(farois)) f.atualizar(dt, jog, t);
      fonte.cr.rotation.y += dt; animarAcende(fonte.mat, dt, Math.sin(t * 2) * 0.15); fonte.jato.material.map.offset.y -= dt * 1.2;
      solCr.rotation.y += dt * (espelhos.completo ? 1.5 : 0.5); solCr.position.y = ALVO.y + Math.sin(t * 1.2) * 0.25; animarAcende(solMat, dt, Math.sin(t * 2.2) * 0.2);
    },
  };
}

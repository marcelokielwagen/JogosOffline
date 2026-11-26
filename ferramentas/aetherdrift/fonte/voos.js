/* =====================================================================
   VOOS — cada voo é um vale diferente. O caminho é sempre o mesmo
   jeito de brincar: saltar de um cume, descer o vale junto do rio
   (arcos de luz opcionais pelo caminho), subir numa espiral de vento
   e passar pela coroa de luz do próximo cume. Três cumes por voo.
   Pelo caminho há lugares para descobrir (cachoeiras, lago, arco de
   pedra, árvore anciã) — só olhar, sem pressa.
   ===================================================================== */

// ---------------- peças ----------------
const matPedra = cor => new THREE.MeshLambertMaterial({ color: cor, flatShading: true });

// arco de luz (opcional): passa por dentro para ouvir a nota
class ArcoLuz {
  constructor(raiz, p, dir, R = 7.5) {
    this.c = p.clone(); this.n = dir.clone().normalize(); this.R = R; this.feito = false; this.brilho = 0;
    this.g = new THREE.Group(); this.g.position.copy(p); this.g.lookAt(p.clone().add(this.n));
    this.anel = new THREE.Mesh(new THREE.TorusGeometry(R, 0.34, 10, 48), new THREE.MeshBasicMaterial({ color: '#ffd98c', transparent: true, opacity: 0.95 }));
    this.veu = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97, 40), new THREE.MeshBasicMaterial({ color: '#fff1c8', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.g.add(this.anel, this.veu); raiz.add(this.g);
  }
  cruzou(p0, p1) {
    if (this.feito) return false;
    if (p1.distanceToSquared(this.c) > 3600) return false;
    const s0 = p0.clone().sub(this.c).dot(this.n), s1 = p1.clone().sub(this.c).dot(this.n);
    if (p1.distanceTo(this.c) < this.R) return true;
    if (s0 * s1 > 0 || s0 === s1) return false;
    const X = p0.clone().lerp(p1, s0 / (s0 - s1));
    return X.distanceTo(this.c) < this.R * 1.6;
  }
  marcar() { this.feito = true; this.brilho = 1; }
  atualizar(dt, t, proximo) {
    const s = this.feito ? 0.6 + this.brilho * 0.5 : 1 + (proximo ? Math.sin(t * 3) * 0.05 : 0);
    this.g.scale.setScalar(s); this.g.rotateZ(dt * 0.25);
    this.brilho = Math.max(0, this.brilho - dt * 2);
    this.anel.material.opacity = this.feito ? 0.12 + this.brilho * 0.5 : proximo ? 0.98 : 0.8;
    this.anel.material.color.set(this.feito ? '#fffaf0' : '#ffd98c');
    this.veu.material.opacity = this.feito ? this.brilho * 0.25 : proximo ? 0.12 : 0.06;
  }
}

// espiral de vento: coluna de pontinhos dourados que sobem girando
class Termica {
  constructor(raiz, x, z, base, topo, r = 55, forca = 11) {
    Object.assign(this, { x, z, base, topo, r, forca });
    // sem desenho próprio: duas águias girando mostram onde o ar sobe
  }
  // quanto sobe aqui (0 se fora)
  em(p) {
    const d = Math.hypot(p.x - this.x, p.z - this.z); if (d > this.r || p.y > this.topo) return 0;
    return this.forca * Math.sqrt(1 - (d / this.r) ** 2) * (1 - suave(this.topo - 35, this.topo, p.y)) + 1.2;
  }
}

// mirante no cume: roda de pedra, pedras em pé, bandeira, coroa de luz e coluna de luz
class Cume {
  constructor(raiz, def, cu, i) {
    this.i = i; this.nome = cu.nome; this.x = cu.x; this.z = cu.z; this.y = cu.h; this.feito = false; this.alvo = false;
    const g = new THREE.Group(); g.position.set(cu.x, cu.h, cu.z); raiz.add(g); this.g = g;
    const pedra = matPedra(def.cores.rocha[0]);
    const roda = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.2, 1.2, 14), pedra); roda.position.y = -0.2; roda.receiveShadow = roda.castShadow = true; g.add(roda);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU + 0.3, h = 2.2 + (k % 3) * 0.9, s = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.6), pedra);
      s.position.set(Math.cos(a) * 6.4, h / 2 + 0.3, Math.sin(a) * 6.4); s.rotation.y = -a; s.rotation.z = (rnd() - 0.5) * 0.12; s.castShadow = true; g.add(s);
    }
    const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 7.5, 6), new THREE.MeshLambertMaterial({ color: '#8c7260' })); mastro.position.set(0, 3.9, 0); mastro.castShadow = true; g.add(mastro);
    this.bandeira = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.9, 12, 4), new THREE.MeshLambertMaterial({ color: def.coresCumes[i % def.coresCumes.length], side: THREE.DoubleSide }));
    this.bandeira.geometry.translate(1.6, 0, 0); this.bandeira.position.set(0.1, 6.6, 0); g.add(this.bandeira);
    this.base0 = this.bandeira.geometry.attributes.position.array.slice();
    // coroa de luz (aonde se chega) — sempre de frente para o planador
    this.coroa = new THREE.Group(); this.coroa.position.set(cu.x, cu.h + 30, cu.z); raiz.add(this.coroa);
    const m1 = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.95 }), m2 = new THREE.MeshBasicMaterial({ color: '#fff4d6', transparent: true, opacity: 0.6 });
    this.aro1 = new THREE.Mesh(new THREE.TorusGeometry(14, 0.55, 10, 64), m1); this.aro2 = new THREE.Mesh(new THREE.TorusGeometry(11.5, 0.2, 8, 56), m2);
    this.coroa.add(this.aro1, this.aro2);
    // coluna de luz macia (só no cume que é o próximo destino)
    this.coluna = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 700, 24, 1, true), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTempo: U.uTempo },
      vertexShader: 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform float uTempo; varying vec2 vUv; varying vec3 vN, vV; void main(){ float a = pow(1. - vUv.y, 2.2) * pow(abs(dot(vN, vV)), 2.) * (.13 + .03 * sin(uTempo * 1.5 + vUv.y * 20.)); gl_FragColor = vec4(vec3(1., .78, .45) * a, 1.); }',
    }));
    this.coluna.position.set(cu.x, cu.h + 350, cu.z); raiz.add(this.coluna);
    this.coluna.visible = false; this.coroa.visible = false;
  }
  get centro() { return this.coroa.position; }
  definirAlvo(v) { this.alvo = v; this.coluna.visible = v; this.coroa.visible = v || this.feito; }
  marcar() { this.feito = true; this.alvo = false; this.coluna.visible = false; this.brilho = 1; }
  atualizar(dt, t, plan) {
    // bandeira ondula
    const p = this.bandeira.geometry.attributes.position, b = this.base0;
    for (let k = 0; k < p.count; k++) { const x = b[k * 3]; p.array[k * 3 + 2] = Math.sin(x * 1.7 - t * 4.2 + b[k * 3 + 1]) * 0.25 * (x / 3.2); }
    p.needsUpdate = true;
    if (this.coroa.visible) {
      this.coroa.lookAt(plan.pos); this.aro2.rotation.z += dt * 0.6;
      const s = this.feito ? 0.7 : 1 + Math.sin(t * 2) * 0.04; this.coroa.scale.setScalar(s);
      this.aro1.material.opacity = this.feito ? 0.3 : 0.95;
    }
  }
}

// névoa de cachoeira: borrifos que sobem e se abrem
function criarBorrifo(raiz, x, y, z, larg) {
  const N = 90, sem = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) sem[i] = rnd();
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); geo.setAttribute('aSem', new THREE.BufferAttribute(sem, 3));
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...U, mapa: { value: texturaBrilho() }, uL: { value: larg } },
    vertexShader: `attribute vec3 aSem; uniform float uTempo, uL; varying float vA;
      void main(){ float f = fract(aSem.y + uTempo * (.12 + aSem.z * .1)); vec3 p = vec3((aSem.x - .5) * uL, f * 16., (aSem.z - .5) * 10. + f * 6.);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (5. + f * 12.) * 300. / -mv.z; vA = (1. - f) * smoothstep(0., .1, f); }`,
    fragmentShader: `uniform sampler2D mapa; varying float vA; void main(){ float a = texture2D(mapa, gl_PointCoord).a * vA * .5; if (a < .01) discard; gl_FragColor = vec4(1., 1., 1., a); }`,
  }));
  pts.position.set(x, y, z); pts.frustumCulled = false; raiz.add(pts);
  return pts;
}

// arco de pedra natural sobre o rio
function criarArcoPedra(raiz, def, r) {
  const R = r.w + 26, geo = new THREE.TorusGeometry(R, 7, 9, 30, Math.PI), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.16 * perlin(x / 6, y / 6 + z / 6); p.setXYZ(i, x * (1 + 0.04 * perlin(y / 9, z)), y * 1.25 * k, z * k); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, comNeblina(matPedra(def.cores.rocha[1]))); m.castShadow = m.receiveShadow = true;
  m.position.set(r.x, r.L - 6, r.z); m.rotation.y = Math.atan2(r.tx, r.tz); raiz.add(m);
  return { topo: r.L - 6 + R * 1.25, R };
}

// árvore anciã: enorme, florida, num prado perto do rio
function criarArvoreAnciao(raiz, def, x, z) {
  const y = alturaTerreno(x, z), g = new THREE.Group(); g.position.set(x, y - 1, z); raiz.add(g);
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3.2, 22, 9), comNeblina(new THREE.MeshLambertMaterial({ color: def.cores.tronco }))); tronco.position.y = 11; tronco.castShadow = true; g.add(tronco);
  const copa = geoCopa(), mat = comNeblina(new THREE.MeshLambertMaterial({ color: def.anciao }));
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * TAU, d = k ? entre(7, 13) : 0, s = k ? entre(8, 11) : 13, b = new THREE.Mesh(copa, mat);
    b.position.set(Math.cos(a) * d, 24 + entre(-3, 5) - d * 0.25, Math.sin(a) * d); b.scale.set(s, s * 0.75, s); b.castShadow = true; g.add(b);
  }
  return g;
}

// aqueduto de pedra atravessando o vale; do arco central cai uma cortina de água sobre o rio
function criarAqueduto(raiz, def, r) {
  const deck = r.L + 34, px = -r.tz, pz = r.tx, PW = 3.4, VAO = 13, FUNDO = 5;
  const lado = s => { for (let u = 20; u < 240; u += 4) if (alturaTerreno(r.x + px * u * s, r.z + pz * u * s) >= deck - 1) return u + 6; return 240; };
  const e1 = lado(1), e2 = lado(-1);
  const g = new THREE.Group(); g.position.set(r.x, 0, r.z); g.rotation.y = Math.atan2(-pz, px); raiz.add(g);
  const chaoU = u => alturaTerreno(r.x + px * u, r.z + pz * u);
  // vãos: o central (largo, sobre o rio) e os outros a cada 15 m até encostar nos morros
  const vaos = [[-VAO - PW / 2, VAO + PW / 2]];
  for (let a = VAO + PW / 2; a < e1; a += 15) vaos.push([a, Math.min(a + 15, e1 + 4)]);
  for (let b = -VAO - PW / 2; b > -e2; b -= 15) vaos.push([Math.max(b - 15, -e2 - 4), b]);
  const formas = vaos.map(([a, b]) => {
    const base = Math.min(chaoU(a), chaoU((a + b) / 2), chaoU(b)) - 5, rad = (b - a - PW) / 2, hs = deck - 3.5 - rad, sh = new THREE.Shape();
    sh.moveTo(a, base);
    if (hs - base > 4 && rad > 2) { sh.lineTo(a + PW / 2, base); sh.lineTo(a + PW / 2, hs); sh.absarc((a + b) / 2, hs, rad, Math.PI, 0, true); sh.lineTo(b - PW / 2, base); }
    sh.lineTo(b, base); sh.lineTo(b, deck); sh.lineTo(a, deck); sh.lineTo(a, base);
    return sh;
  });
  const pedra = comNeblina(new THREE.MeshLambertMaterial({ color: def.cores.aqueduto || '#e8dcc4' }), 1);
  const corpo = new THREE.Mesh(new THREE.ExtrudeGeometry(formas, { depth: FUNDO, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, -FUNDO / 2), pedra);
  corpo.castShadow = corpo.receiveShadow = true; g.add(corpo);
  const comp = e1 + e2 + 8, meio = (e1 - e2) / 2;
  const cornija = new THREE.Mesh(new THREE.BoxGeometry(comp, 0.7, FUNDO + 1), pedra); cornija.position.set(meio, deck + 0.1, 0); cornija.castShadow = true; g.add(cornija);
  for (const zz of [-FUNDO / 2, FUNDO / 2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(comp, 1.6, 0.6), pedra); p.position.set(meio, deck + 1.2, zz * 0.85); p.castShadow = true; g.add(p); }
  // água correndo em cima, das pontas para o meio
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(comp, FUNDO * 0.7).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...U, uCor: { value: new THREE.Color(def.cores.aguaRasa) } },
    vertexShader: 'varying vec3 vMundo; varying vec2 vP; void main(){ vP = position.xz; vec4 w = modelMatrix * vec4(position, 1.); vMundo = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uCor; varying vec3 vMundo; varying vec2 vP; ${GLSL_RUIDO}${GLSL_NEVOA}
      void main(){ float u = vP.x; float f = vnoise(vec2((abs(u) + uTempo * 6.) * .35, vP.y * 1.3)); vec3 c = mix(uCor, vec3(1.), smoothstep(.6, .9, f) * .7);
        c = nevoaLonge(c, vMundo); gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  }));
  canal.position.set(meio, deck + 0.9, 0); g.add(canal);
  // cortina de água: cai do meio do arco central, na face de baixo do rio, até a água
  const alt = deck + 0.6 - r.L, larg = 12, geo = new THREE.PlaneGeometry(larg, alt, 1, 18), pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), q = (alt / 2 - y) / alt; pa.setZ(i, -3.4 * Math.sqrt(q)); }
  const cortina = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...U },
    vertexShader: 'varying vec2 vUv; varying vec3 vMundo; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vMundo = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vMundo; ${GLSL_RUIDO}${GLSL_NEVOA}
      void main(){ float n = vnoise(vec2(vUv.x * 16., vUv.y * 4. + uTempo * 2.4)), n2 = vnoise(vec2(vUv.x * 42., vUv.y * 9. + uTempo * 3.4));
        float bordas = smoothstep(0., .14, vUv.x) * smoothstep(1., .86, vUv.x);
        float a = (.42 + .5 * smoothstep(.35, .85, n * .6 + n2 * .4)) * bordas * (.75 + .25 * smoothstep(.0, .25, vUv.y));
        vec3 c = mix(vec3(.84, .94, .95), vec3(1.), n2); c = nevoaLonge(c, vMundo);
        gl_FragColor = vec4(c, a * .9);
        #include <colorspace_fragment>
      }`,
  }));
  cortina.position.set(0, r.L + alt / 2, -FUNDO / 2 - 0.4); cortina.renderOrder = 2; g.add(cortina);
  const bico = new THREE.Mesh(new THREE.BoxGeometry(larg + 1.5, 1.1, 2.2), pedra); bico.position.set(0, deck + 0.4, -FUNDO / 2 - 0.9); g.add(bico);
  const borrifo = criarBorrifo(raiz, r.x + r.tx * 4, r.L - 0.4, r.z + r.tz * 4, larg * 1.3); borrifo.rotation.y = g.rotation.y;
  g.updateMatrixWorld(true);
  return {
    g, x: r.x, z: r.z, px, pz, tx: r.tx, tz: r.tz, e1, e2, deck, vao: VAO, teto: deck - 3.5, meia: FUNDO / 2 + 1.5, rio: r,
    cortina: { c: new THREE.Vector3(r.x + r.tx * (FUNDO / 2 + 1.5), r.L + alt / 2, r.z + r.tz * (FUNDO / 2 + 1.5)), n: new THREE.Vector3(r.tx, 0, r.tz), larg, alt },
    atravessou: false,
  };
}
// chão "falso" em cima do aqueduto (o planador passa por cima ou pelo vão central, nunca através da pedra)
function pisoAqueduto(o, x, z, y) {
  const dx = x - o.x, dz = z - o.z, u = dx * o.px + dz * o.pz, a = dx * o.tx + dz * o.tz;
  if (Math.abs(a) > o.meia + 2 || u > o.e1 + 4 || u < -o.e2 - 4) return -Infinity;
  if (Math.abs(u) < o.vao + 3 && y < o.teto - 3) return -Infinity;   // folga generosa: quem mira o vão passa
  return o.deck + 2.5;
}
function cruzouCortina(o, p0, p1) {
  const k = o.cortina, s0 = p0.clone().sub(k.c).dot(k.n), s1 = p1.clone().sub(k.c).dot(k.n);
  if (s0 * s1 > 0 || s0 === s1) return false;
  const X = p0.clone().lerp(p1, s0 / (s0 - s1)), d = X.clone().sub(k.c), u = d.x * o.px + d.z * o.pz;
  return Math.abs(u) < k.larg / 2 + 2 && Math.abs(d.y) < k.alt / 2 + 1;
}

// cascatas descendo pelas paredes do vale: fita de água que cai solta do paredão e vira riacho até o rio
function criarCascatas(raiz, def) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    uniforms: { ...U, uCor: { value: new THREE.Color(def.cores.aguaRasa) } },
    vertexShader: 'attribute float aV; attribute float aS; varying float vV; varying float vS; varying float vU; varying vec3 vMundo; void main(){ vV = aV; vS = aS; vU = uv.x; vec4 w = modelMatrix * vec4(position, 1.); vMundo = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uCor; varying float vV; varying float vS; varying float vU; varying vec3 vMundo; ${GLSL_RUIDO}${GLSL_NEVOA}
      void main(){ float q = smoothstep(.45, 1.5, vS);
        float n = vnoise(vec2(vU * 6., vV * .1 - uTempo * mix(.9, 3.6, q))), n2 = vnoise(vec2(vU * 17., vV * .28 - uTempo * mix(1.6, 6., q)));
        float esp = smoothstep(.35, .8, n * .6 + n2 * .4);
        vec3 c = mix(uCor, vec3(1.), clamp(q * .72 + esp * (.25 + .45 * q), 0., 1.));
        float borda = smoothstep(0., .2, vU) * smoothstep(1., .8, vU) * mix(1., .75 + .25 * smoothstep(.2, .6, n), q);
        c = neblinaVale(c, vMundo); c = nevoaLonge(c, vMundo); gl_FragColor = vec4(c, borda * mix(.9, .62 + .35 * esp, q));
        #include <colorspace_fragment>
      }`,
  });
  const nomes = (def.cascatas && def.cascatas.nomes) || [], lugares = [], sons = [];
  TER.cascatas.forEach((cs, ic) => {
    const P = cs.pts, pos = [], uv = [], aV = [], aS = [], ind = [];
    let acc = 0, ini = 0;
    P.forEach((p, k) => {
      const b = P[Math.min(k + 1, P.length - 1)], a = P[Math.max(k - 1, 0)], tx0 = b.x - a.x, tz0 = b.z - a.z, tl = Math.hypot(tx0, tz0) || 1, tx = tx0 / tl, tz = tz0 / tl;
      if (k) acc += Math.hypot(p.x - P[k - 1].x, p.y - P[k - 1].y, p.z - P[k - 1].z);
      const q = suave(0.5, 1.6, p.s), fora = 1.6 * q, W = (2.8 + 4.6 * q) * suave(0, 18, acc) + 0.6, cx = p.x + tx * fora, cz = p.z + tz * fora, cy = p.y + 0.45;
      for (const l of [-1, 1]) {
        const ex = cx - tz * l * W / 2, ez = cz + tx * l * W / 2;
        pos.push(ex, Math.max(cy, alturaTerreno(ex, ez) + 0.35), ez); uv.push(l < 0 ? 0 : 1, 0); aV.push(acc); aS.push(p.s);
      }
      if (k) { const o = (k - 1) * 2; ind.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
      if (!ini && P[Math.max(k - 3, 0)].s > 1 && p.s < 0.45) ini = k;   // pé da queda principal
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('aV', new THREE.Float32BufferAttribute(aV, 1)); geo.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1)); geo.setIndex(ind);
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 1; raiz.add(m);
    const pe = P[ini || Math.floor(P.length * 0.6)];
    criarBorrifo(raiz, pe.x, pe.y - 0.5, pe.z, 9);
    sons.push({ x: pe.x, y: pe.y, z: pe.z });
    const topo = P[0];
    if (nomes[ic]) lugares.push({ nome: nomes[ic][0], frase: nomes[ic][1], x: mix(topo.x, pe.x, 0.5), z: mix(topo.z, pe.z, 0.5), y: mix(topo.y, pe.y, 0.5), raio: 140, achado: false, tipo: 'cachoeira' });
  });
  return { lugares, sons };
}
// casinhas de madeira com telhado inclinado e um rebanho pastando
function criarVilarejo(raiz, def, aquedutos) {
  const vila = def.vilarejo; if (!vila || !TER.chales.length) return;
  const longeAq = (x, z) => aquedutos.every(o => Math.abs((x - o.x) * o.tx + (z - o.z) * o.tz) > 16);
  const chales = TER.chales.filter(c => longeAq(c.x, c.z));
  const geoC = new THREE.BoxGeometry(8, 5, 6).translate(0, 2.5, 0);
  const tel = new THREE.Shape(); tel.moveTo(-5.2, 0); tel.lineTo(0, 3.6); tel.lineTo(5.2, 0); tel.lineTo(-5.2, 0);
  const geoT = new THREE.ExtrudeGeometry(tel, { depth: 7.4, bevelEnabled: false }).translate(0, 4.9, -3.7);
  const geoB = new THREE.BoxGeometry(8.2, 1.6, 6.2).translate(0, 0.8, 0);
  const mC = comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), mT = comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), mB = comNeblina(new THREE.MeshLambertMaterial({ color: vila.base || '#e9e2d4' }));
  const iC = new THREE.InstancedMesh(geoC, mC, chales.length), iT = new THREE.InstancedMesh(geoT, mT, chales.length), iB = new THREE.InstancedMesh(geoB, mB, chales.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), cima = new THREE.Vector3(0, 1, 0);
  chales.forEach((h, i) => {
    q.setFromAxisAngle(cima, h.rot); m4.compose(p.set(h.x, h.y - 0.4, h.z), q, s.setScalar(h.esc));
    iC.setMatrixAt(i, m4); iT.setMatrixAt(i, m4); iB.setMatrixAt(i, m4);
    iC.setColorAt(i, c.set(vila.paredes[i % vila.paredes.length]).offsetHSL(0, 0, entre(-0.03, 0.03)));
    iT.setColorAt(i, c.set(vila.telhados[i % vila.telhados.length]).offsetHSL(0, 0, entre(-0.03, 0.03)));
  });
  for (const im of [iC, iT, iB]) { im.castShadow = im.receiveShadow = true; raiz.add(im); }
  // chaminé e fumacinha subindo devagar
  const iCh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 2.4, 0.9), mB, chales.length), base = [], sem = [];
  chales.forEach((h, i) => {
    const cx = 2.2 * h.esc, cz = 1.4 * h.esc, x = h.x + cx * Math.cos(h.rot) + cz * Math.sin(h.rot), z = h.z - cx * Math.sin(h.rot) + cz * Math.cos(h.rot), y = h.y - 0.4 + 7.6 * h.esc;
    iCh.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromAxisAngle(cima, h.rot), s.setScalar(h.esc)));
    if (i % 2 === 0) for (let k = 0; k < 9; k++) { base.push(x, y + 1.2, z); sem.push(rnd(), rnd(), rnd()); }
  });
  iCh.castShadow = true; raiz.add(iCh);
  if (base.length) {
    const gF = new THREE.BufferGeometry(); gF.setAttribute('position', new THREE.Float32BufferAttribute(base, 3)); gF.setAttribute('aSem', new THREE.Float32BufferAttribute(sem, 3));
    const vx = def.vento[0], vz = def.vento[1];
    const fum = new THREE.Points(gF, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { ...U, mapa: { value: texturaBrilho() } },
      vertexShader: `attribute vec3 aSem; uniform float uTempo; varying float vA;
        void main(){ float f = fract(aSem.x + uTempo * (.05 + aSem.y * .03)); vec3 p = position + vec3(${vx.toFixed(2)} * f * 14. + sin(uTempo * .7 + aSem.z * 6.) * f * 1.5, f * 16., ${vz.toFixed(2)} * f * 14.);
          vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (2.5 + f * 9.) * 300. / -mv.z; vA = smoothstep(0., .1, f) * (1. - f); }`,
      fragmentShader: `uniform sampler2D mapa; varying float vA; void main(){ float a = texture2D(mapa, gl_PointCoord).a * vA * .35; if (a < .01) discard; gl_FragColor = vec4(.96, .96, .95, a); }`,
    }));
    fum.frustumCulled = false; raiz.add(fum);
  }
  criarQuintais(raiz, chales);
  // rebanho: vacas (ou ovelhas/cabras, pela cor) e alguns cavalos, com pernas
  const bichos = TER.rebanho.filter(b => longeAq(b.x, b.z)); if (!bichos.length) return;
  const caixa = (w, h, d, x, y, z, rx = 0) => new THREE.BoxGeometry(w, h, d).rotateX(rx).translate(x, y, z);
  const pernas = (h, dx, dz) => [-1, 1].flatMap(a => [-1, 1].map(b => caixa(0.22, h, 0.22, a * dx, h / 2, b * dz)));
  const geoVaca = juntarGeos([caixa(1.1, 0.9, 2.1, 0, 1.15, 0), caixa(0.6, 0.6, 0.75, 0, 1.4, 1.35), ...pernas(0.78, 0.36, 0.75)]);
  const geoCav = juntarGeos([caixa(0.85, 0.85, 2.2, 0, 1.55, 0), caixa(0.38, 1.0, 0.5, 0, 2.15, 1.1, 0.55), caixa(0.36, 0.42, 0.85, 0, 2.6, 1.55), caixa(0.14, 0.9, 0.3, 0, 1.6, -1.2, 0.5), ...pernas(1.15, 0.3, 0.8)]);
  const mBicho = comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' }));
  for (const [tipo, geo, cores] of [['vaca', geoVaca, vila.bichosCor], ['cavalo', geoCav, ['#b98a62', '#d4ac84', '#8f6b52', '#efe6d6']]]) {
    const lista = bichos.filter(b => (b.tipo || 'vaca') === tipo); if (!lista.length) continue;
    const im = new THREE.InstancedMesh(geo, mBicho, lista.length);
    lista.forEach((b, i) => {
      q.setFromAxisAngle(cima, b.rot); im.setMatrixAt(i, m4.compose(p.set(b.x, b.y - 0.1, b.z), q, s.setScalar(entre(0.9, 1.1))));
      im.setColorAt(i, c.set(cores[Math.floor(rnd() * cores.length)]));
    });
    im.castShadow = true; raiz.add(im);
  }
}
// quintal de cada casa: cerca de madeira com portão, horta, árvore de fruta e galinhas
function criarQuintais(raiz, chales) {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), cima = new THREE.Vector3(0, 1, 0);
  const mundoDe = (h, lx, lz) => [h.x + lx * Math.cos(h.rot) + lz * Math.sin(h.rot), h.z - lx * Math.sin(h.rot) + lz * Math.cos(h.rot)];
  const trilhos = [], postes = [], hortas = [], fileiras = [], arvores = [], galinhas = [];
  const lados = [[-9, -6, 9, -6], [-9, -6, -9, 11], [9, -6, 9, 11], [-9, 11, -1.6, 11], [1.6, 11, 9, 11]];
  for (const h of chales) {
    for (const [a0, b0, a1, b1] of lados) {
      const [x0, z0] = mundoDe(h, a0, b0), [x1, z1] = mundoDe(h, a1, b1), len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(-(z1 - z0), x1 - x0);
      const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, ym = alturaTerreno(xm, zm);
      for (const hh of [0.5, 1.0]) trilhos.push([xm, ym + hh, zm, ang, len]);
      const np = Math.max(1, Math.round(len / 3));
      for (let k = 0; k <= np; k++) { const x = mix(x0, x1, k / np), z = mix(z0, z1, k / np); postes.push([x, alturaTerreno(x, z), z]); }
    }
    const [hx, hz] = mundoDe(h, 4.8, 6.5); hortas.push([hx, alturaTerreno(hx, hz), hz, h.rot]);
    for (const dz of [-1.6, 0, 1.6]) { const [fx, fz] = mundoDe(h, 4.8, 6.5 + dz); fileiras.push([fx, alturaTerreno(fx, fz), fz, h.rot]); }
    const [ax, az] = mundoDe(h, -5.8, 7); arvores.push([ax, alturaTerreno(ax, az), az]);
    for (let k = 0; k < 5; k++) { const [gx, gz] = mundoDe(h, entre(-7.5, 1), entre(4, 10)); galinhas.push([gx, alturaTerreno(gx, gz), gz, rnd() * TAU]); }
  }
  const madeira = comNeblina(new THREE.MeshLambertMaterial({ color: '#dcc6a4' }));
  const iTr = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.12, 0.1), madeira, trilhos.length);
  trilhos.forEach(([x, y, z, a, l], i) => iTr.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromAxisAngle(cima, a), s.set(l, 1, 1))));
  const iPo = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.3, 0.16).translate(0, 0.55, 0), madeira, postes.length);
  postes.forEach(([x, y, z], i) => iPo.setMatrixAt(i, m4.compose(p.set(x, y - 0.1, z), q.identity(), s.set(1, 1, 1))));
  const iHo = new THREE.InstancedMesh(new THREE.BoxGeometry(5.5, 0.3, 5).translate(0, 0.1, 0), comNeblina(new THREE.MeshLambertMaterial({ color: '#b59472' })), hortas.length);
  hortas.forEach(([x, y, z, r], i) => iHo.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromAxisAngle(cima, r), s.set(1, 1, 1))));
  const iFi = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 0.45, 0.7).translate(0, 0.35, 0), comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), fileiras.length);
  fileiras.forEach(([x, y, z, r], i) => { iFi.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromAxisAngle(cima, r), s.set(1, 1, 1))); iFi.setColorAt(i, c.set(['#8cc06a', '#a6cc72', '#7fb565', '#e3c46a'][i % 4])); });
  const copa = geoCopa(), iAr = new THREE.InstancedMesh(copa, comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), arvores.length);
  const iTr2 = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.22, 1, 6).translate(0, 0.5, 0), comNeblina(new THREE.MeshLambertMaterial({ color: '#8a6e58' })), arvores.length);
  arvores.forEach(([x, y, z], i) => {
    const r = entre(1.8, 2.4); iAr.setMatrixAt(i, m4.compose(p.set(x, y + 2.2 + r * 0.6, z), q.setFromAxisAngle(cima, rnd() * TAU), s.set(r, r * 0.9, r)));
    iAr.setColorAt(i, c.set(['#93c472', '#a8cc7c', '#9bbf6c'][i % 3])); iTr2.setMatrixAt(i, m4.compose(p.set(x, y - 0.2, z), q.identity(), s.set(1, 2.6, 1)));
  });
  const geoGal = juntarGeos([new THREE.BoxGeometry(0.34, 0.32, 0.48).translate(0, 0.32, 0), new THREE.BoxGeometry(0.2, 0.22, 0.2).translate(0, 0.55, 0.22)]);
  const iGa = new THREE.InstancedMesh(geoGal, comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), galinhas.length);
  galinhas.forEach(([x, y, z, r], i) => { iGa.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromAxisAngle(cima, r), s.setScalar(1.2))); iGa.setColorAt(i, c.set(['#fffaf2', '#ecc89a', '#c98f5f', '#fffaf2'][i % 4])); });
  for (const im of [iTr, iPo, iHo, iFi, iAr, iTr2, iGa]) { im.castShadow = true; im.receiveShadow = true; raiz.add(im); }
}

// barquinhos a vela passeando devagar nos lagos largos
function criarBarcos(raiz, def) {
  const rio = TER.rio, lista = [];
  const casco = new THREE.BoxGeometry(1.5, 0.6, 4.4).translate(0, 0.3, 0), pc = casco.attributes.position;
  for (let i = 0; i < pc.count; i++) if (pc.getZ(i) > 0) pc.setX(i, pc.getX(i) * 0.35);   // proa fina
  casco.computeVertexNormals();
  const gV = new THREE.BufferGeometry(); gV.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.8, -1.4, 0, 5.4, 0.2, 0, 0.8, 1.3], 3)); gV.computeVertexNormals();
  const mC = comNeblina(new THREE.MeshLambertMaterial({ color: '#b48a6a' })), mV = comNeblina(new THREE.MeshLambertMaterial({ color: '#fffaf0', side: THREE.DoubleSide }));
  for (const [a, b, W] of def.rio.lagos || []) {
    if (W < 38) continue;
    const ia = Math.round((a + 0.03) * (rio.length - 1)), ib = Math.min(Math.round((b - 0.02) * (rio.length - 1)), rio.length - 2); if (ib - ia < 8) continue;
    const n = W > 60 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const g = new THREE.Group(), c = new THREE.Mesh(casco, mC), v = new THREE.Mesh(gV, mV); g.add(c, v); g.scale.setScalar(1.3); raiz.add(g);
      lista.push({ g, ia, ib, off: entre(-0.5, 0.5), fase: rnd() * TAU, vel: entre(0.025, 0.045) });
    }
  }
  return {
    atualizar(dt, t) {
      for (const o of lista) {
        const u = 0.5 + 0.5 * Math.sin(t * o.vel + o.fase), du = Math.cos(t * o.vel + o.fase), f = o.ia + (o.ib - o.ia) * u, r = rio[Math.floor(f)], w = r.w * o.off;
        o.g.position.set(r.x - r.tz * w, r.L - 0.3 + Math.sin(t * 1.3 + o.fase) * 0.06, r.z + r.tx * w);
        o.g.rotation.set(Math.sin(t * 0.9 + o.fase) * 0.04, Math.atan2(r.tx * Math.sign(du), r.tz * Math.sign(du)), Math.sin(t * 1.1 + o.fase) * 0.06);
      }
    },
  };
}
// ---------------- montagem de um voo ----------------
function posicaoNoRio(t) { const rio = TER.rio; return rio[lim(Math.round(t * (rio.length - 1)), 0, rio.length - 1)]; }
function distRio(x, z) { return TER.dist[celula(x, z)]; }

// coloca os cumes ao lado do rio: longe da água, perto do trecho certo e longe uns dos outros
function situarCumes(def) {
  const curva = new THREE.CatmullRomCurve3(def.rio.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const N = 400, amostra = curva.getSpacedPoints(N);
  const perto = (x, z) => { let m = 1e9, k = 0; amostra.forEach((p, i) => { const d = Math.hypot(p.x - x, p.z - z); if (d < m) { m = d; k = i; } }); return [m, k / N]; };
  const feitos = [];
  def.cumes = def.cumesDef.map(c => {
    for (const dt of [0, 0.02, -0.02, 0.04, -0.04, 0.06, -0.06, 0.09, -0.09]) for (const lado of [c.lado, -c.lado]) for (let d = 240; d <= 430; d += 15) {
      const t = lim(c.t + dt, 0.03, 0.97), p = curva.getPointAt(t), tg = curva.getTangentAt(t), x = p.x - tg.z * lado * d, z = p.z + tg.x * lado * d;
      if (Math.max(Math.abs(x), Math.abs(z)) > 790 || feitos.some(f => Math.hypot(f.x - x, f.z - z) < 330)) continue;
      const [m, tn] = perto(x, z);
      if (m >= 228 && Math.abs(tn - t) < 0.05) { const r = { ...c, x, z }; feitos.push(r); return r; }
    }
    const p = curva.getPointAt(c.t), tg = curva.getTangentAt(c.t), r = { ...c, x: p.x - tg.z * c.lado * 260, z: p.z + tg.x * c.lado * 260 };
    feitos.push(r); return r;
  });
}

function construirVoo(def, ctx) {
  const { raiz } = ctx; semear(def.semente + 77);
  const rio = TER.rio, cumes = def.cumes.map((cu, i) => new Cume(raiz, def, cu, i));
  const arcos = [], termicas = [], lugares = [], borrifos = [], rota = [];
  // --- cachoeiras: uma em cada degrau do rio ---
  let nq = 0, nc = 0;
  def.rio.degraus.slice(1).forEach(([t, L, tipo]) => {
    const i = Math.round(t * (rio.length - 1)), cima = rio[Math.max(i - 4, 0)], baixo = rio[Math.min(i + 2, rio.length - 1)];
    if (tipo === 'c') {   // corredeira: só vira lugar para descobrir
      const m = rio[Math.max(0, i - Math.round(75 / 4))], nome = (def.corredeiras || [])[nc++] || ['Corredeira', ''];
      lugares.push({ nome: nome[0], frase: nome[1], x: m.x, z: m.z, raio: 110, achado: false, tipo: 'cachoeira', y: m.L });
      return;
    }
    const larg = Math.max(cima.w, 10) * 1.6;
    const b = criarBorrifo(raiz, baixo.x, L - 0.5, baixo.z, larg); b.rotation.y = Math.atan2(baixo.tx, baixo.tz); borrifos.push(b);
    const nome = def.cachoeiras[nq++] || ['Cachoeira', ''];
    lugares.push({ nome: nome[0], frase: nome[1], x: baixo.x, z: baixo.z, raio: 130, achado: false, tipo: 'cachoeira', y: L });
  });
  // --- aquedutos (passagens por baixo, com cortina de água) ---
  const passagens = [], aquedutos = [];
  // cada aqueduto vai perto do fim de um trecho (primeiro e último), onde dá tempo de descer planando até o vão
  const tDe0 = cu => { let m = 1e9, k = 0; rio.forEach((r, i) => { const d = Math.hypot(r.x - cu.x, r.z - cu.z); if (d < m) { m = d; k = i; } }); return k; };
  const iCumes = def.cumes.map(tDe0), nT = iCumes.length - 1;
  const evitar = def.rio.degraus.slice(1).filter(g => g[2] !== 'c').map(g => Math.round(g[0] * (rio.length - 1)))
    .concat(def.lugares.filter(l => l.tipo === 'arco').map(l => Math.round(l.t * (rio.length - 1))));
  (def.aquedutos || []).forEach((a, j) => {
    const s = j === 0 ? (def.trechoAqueduto || 0) : nT - 1, ia = iCumes[s], ib = iCumes[s + 1];
    let i = Math.round(ia + (ib - ia) * 0.8);
    // no 1º trecho, só depois de dar para descer planando do cume até o vão (sem mergulho brusco)
    if (j === 0 && !def.trechoAqueduto) { const cu = def.cumes[0], pl = (def.planeio || 0.38) * 0.85, ent = ia + Math.sign(ib - ia) * 10;
      for (let k = ent; k !== ib; k += Math.sign(ib - ia)) { const dist = Math.hypot(rio[ent].x - cu.x, rio[ent].z - cu.z) + Math.abs(k - ent) * 4; if (dist * pl >= cu.h + 6 - (rio[k].L + 14)) { if (Math.abs(k - ia) > Math.abs(i - ia)) i = ib > ia ? Math.min(k, ib - 12) : Math.max(k, ib + 12); break; } } }
    // longe de cachoeiras e do arco de pedra, e num trecho reto do rio (curva fechada faria o planador cruzar fora do vão)
    const curva = k => { const a = rio[lim(k - 15, 0, rio.length - 1)], b = rio[lim(k + 15, 0, rio.length - 1)]; return Math.abs(angDif(Math.atan2(a.tx, a.tz), Math.atan2(b.tx, b.tz))); };
    let melhor = i, nota = 1e9;
    for (let d = 0; d <= 40; d += 2) for (const k of [i - Math.sign(ib - ia) * d, i + Math.sign(ib - ia) * Math.min(d, 8)]) {
      if (evitar.some(e => Math.abs(e - k) < 14)) continue;
      const n = curva(k) * 3 + d * 0.01; if (n < nota) { nota = n; melhor = k; }
    }
    i = melhor;
    a.t = i / (rio.length - 1);
  });
  for (const a of def.aquedutos || []) {
    const r0 = posicaoNoRio(a.t), i = rio.indexOf(r0), A = rio[lim(i - 10, 0, rio.length - 1)], B = rio[lim(i + 10, 0, rio.length - 1)], dl = Math.hypot(B.x - A.x, B.z - A.z);
    const r = { ...r0, tx: (B.x - A.x) / dl, tz: (B.z - A.z) / dl }, o = criarAqueduto(raiz, def, r); aquedutos.push(o);
    passagens.push({ x: r.x, z: r.z, y: r.L + 14, R: 8.5, tx: r.tx, tz: r.tz });
    lugares.push({ nome: a.nome, frase: a.frase, x: r.x, z: r.z, raio: 150, achado: false });
  }
  // --- cascatas nas encostas e vilarejo ---
  const cascatas = criarCascatas(raiz, def); lugares.push(...cascatas.lugares);
  criarVilarejo(raiz, def, aquedutos);
  const barcos = criarBarcos(raiz, def);
  // --- lugares especiais ---
  let arcoPedra = null;
  for (const l of def.lugares) {
    const r = posicaoNoRio(l.t);
    if (l.tipo === 'arco') { arcoPedra = { ...criarArcoPedra(raiz, def, r), r }; passagens.push({ x: r.x, z: r.z, y: r.L + arcoPedra.R * 0.55, R: 9, tx: r.tx, tz: r.tz }); lugares.push({ nome: l.nome, frase: l.frase, x: r.x, z: r.z, raio: 120, achado: false }); }
    else if (l.tipo === 'arvore') { const x = r.x - r.tz * l.lado * (r.w + 46), z = r.z + r.tx * l.lado * (r.w + 46); criarArvoreAnciao(raiz, def, x, z); lugares.push({ nome: l.nome, frase: l.frase, x, z, raio: 120, achado: false }); }
    else lugares.push({ nome: l.nome, frase: l.frase, x: r.x, z: r.z, raio: 150, achado: false });
  }
  // --- rota de cada trecho: cume → vale (planando) → espiral de vento → próximo cume ---
  const PLANEIO = def.planeio || 0.38;   // quanto se desce por metro andado, num mergulho tranquilo
  const tDe = cu => { let m = 1e9, k = 0; rio.forEach((r, i) => { const d = Math.hypot(r.x - cu.x, r.z - cu.z); if (d < m) { m = d; k = i; } }); return k; };
  for (let s = 0; s < cumes.length - 1; s++) {
    const A = def.cumes[s], B = def.cumes[s + 1], ia = tDe(A), ib = tDe(B), passo = ia < ib ? 1 : -1;
    const entrada = ia + passo * 10, saida = ib - passo * 10;
    const ini = { x: A.x, y: A.h + (s === 0 ? 6 : 30), z: A.z };
    if (s === 0) rota.push(ini);
    const e = rio[entrada], trecho = [{ x: mix(A.x, e.x, 0.5), y: e.L + 40, z: mix(A.z, e.z, 0.5) }];
    for (let i = entrada; passo > 0 ? i <= saida : i >= saida; i += passo * 12) {
      const r = rio[i];
      const ps = passagens.find(q => !q.usado && Math.hypot(r.x - q.x, r.z - q.z) < 30);
      if (ps) { trecho.push({ x: ps.x - ps.tx * passo * 42, y: ps.y + 4, z: ps.z - ps.tz * passo * 42, fixo: true }, { x: ps.x, y: ps.y, z: ps.z, rio: i, fixo: true, pedra: true, R: ps.R }); ps.usado = true; continue; }
      trecho.push({ x: r.x, y: Math.max(r.L, rio[lim(i + 6 * passo, 0, rio.length - 1)].L) + 18 + 4 * Math.sin(i * 0.06), z: r.z, rio: i });
    }
    // altura planejada: ninguém precisa mergulhar mais que o normal para pegar os arcos
    let alt = ini.y, ant = ini;
    for (const p of trecho) { alt -= Math.hypot(p.x - ant.x, p.z - ant.z) * PLANEIO; if (p.fixo) alt = p.y; else p.y = Math.max(p.y, alt); ant = p; }
    // antes de cada passagem (aqueduto, arco de pedra) a descida começa cedo, sem mergulho brusco no fim
    trecho.forEach((f, k) => {
      if (!f.fixo) return; let acc = 0;
      for (let j = k - 1; j >= 0; j--) { acc += Math.hypot(trecho[j + 1].x - trecho[j].x, trecho[j + 1].z - trecho[j].z); if (trecho[j].fixo) break; trecho[j].y = Math.min(trecho[j].y, f.y + acc * PLANEIO * 1.1); }
    });
    rota.push(...trecho);
    // espiral de vento entre o rio e o próximo cume
    const sr = rio[ib], tx = mix(sr.x, B.x, 0.42), tz = mix(sr.z, B.z, 0.42), base = alturaTerreno(tx, tz);
    const T = new Termica(raiz, tx, tz, base, B.h + 38, 58, 12); termicas.push(T);
    rota.push({ x: tx, y: base + 40, z: tz, termica: T });
    rota.push({ x: B.x, y: B.h + 30, z: B.z, cume: s + 1 });
  }
  // térmicas extras em prados (para quem quer passear alto)
  for (let k = 0; k < def.termicasExtras; k++) {
    for (let tent = 0; tent < 40; tent++) {
      const x = entre(-700, 700), z = entre(-700, 700), y = alturaTerreno(x, z);
      if (distRio(x, z) < 50 || declive(x, z) > 0.3 || rota.some(p => Math.hypot(p.x - x, p.z - z) < 110)) continue;   // longe do caminho, para não atrapalhar o voo guiado
      termicas.push(new Termica(raiz, x, z, y, y + entre(160, 240), 45, 9)); break;
    }
  }
  // --- arcos de luz: um a cada dois pontos do rio (e sempre debaixo do arco de pedra) ---
  let ultimo = -99;
  rota.forEach((p, k) => {
    if (p.rio === undefined) return;
    const prox = rota[k + 1]; if (!prox || prox.termica) return;
    if (!p.pedra && (k - ultimo < 2 || def.cumes.some(cu => Math.hypot(cu.x - p.x, cu.z - p.z) < 240))) return;
    if (p.pedra && k - ultimo < 2) { const a = arcos.pop(); raiz.remove(a.g); }
    ultimo = k;
    const dir = new THREE.Vector3(prox.x - p.x, prox.y - p.y, prox.z - p.z);
    arcos.push(new ArcoLuz(raiz, new THREE.Vector3(p.x, p.y, p.z), p.pedra ? new THREE.Vector3(dir.x, 0, dir.z) : dir, p.pedra ? p.R : 7.5));
  });
  // início: no primeiro cume, de frente para o vale
  const A = def.cumes[0], r1 = rota[1];
  const dI = Math.hypot(r1.x - A.x, r1.z - A.z) || 1, inicio = { x: A.x + (r1.x - A.x) / dI * 5, y: A.h + 2.3, z: A.z + (r1.z - A.z) / dI * 5, yaw: Math.atan2(-(r1.x - A.x), -(r1.z - A.z)) };
  return {
    inicio, cumes, arcos, termicas, lugares, rota, borrifos, aquedutos, sonsAgua: cascatas.sons, barcos,
    vento: new THREE.Vector2(...def.vento).normalize(),
  };
}

/* Obra: o "pedreiro". Junta blocos, escadas, arcos e enfeites numa malha só.

   A grade: o bloco (x,y,z) ocupa x±.5, z±.5 e vai de y até y+1 na altura.
   A câmera olha sempre na direção (1,1,1). Por isso o bloco (x,y,z) e o bloco (x+k,y+k,z+k)
   aparecem EXATAMENTE no mesmo lugar da tela: é daí que nascem todas as ilusões do jogo.   */
const CM = {}; const cor = h => CM[h] || (CM[h] = new THREE.Color(h));
const sorte = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const DIRS = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] };

class Obra {
  constructor() { this.rampas = []; this.ocupado = new Set(); this.blocos = new Map(); this.p = []; this.n = []; this.c = []; this.uv = []; this.tam = []; this.b = []; this.x = []; }
  chave(x, y, z) { return x + ',' + y + ',' + z; }
  tem(x, y, z) { return this.blocos.has(this.chave(x, y, z)); }
  // op: lado, topo (cores), piso (ladrilho), faces ('xyz' com sinal: só estas), semBorda (lista de faces sem linha clara)
  bloco(x, y, z, op) { this.blocos.set(this.chave(x, y, z), { x, y, z, ...op }); return this; }
  tira(x, y, z) { this.blocos.delete(this.chave(x, y, z)); return this; }
  cheio(x0, x1, y0, y1, z0, z1, op) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.bloco(x, y, z, typeof op === 'function' ? op(x, y, z) : op); return this; }

  // um retângulo com cor, linhas claras nas bordas marcadas, sombra de canto (ao), luz própria e ladrilho
  face(q, n, cr, tam, bordas, ao = [1, 1, 1, 1], luz = 0, piso = 0) {
    const uv = [[0, 0], [tam[0], 0], [tam[0], tam[1]], [0, tam[1]]];
    const ordem = ao[0] + ao[2] > ao[1] + ao[3] ? [0, 1, 2, 0, 2, 3] : [1, 2, 3, 1, 3, 0];
    for (const i of ordem) { this.p.push(...q[i]); this.n.push(...n); this.c.push(cr.r, cr.g, cr.b); this.uv.push(...uv[i]); this.tam.push(...tam); this.b.push(...bordas); this.x.push(ao[i], luz, piso); }
  }
  // caixa livre. faces: quais desenhar; bordas: linhas claras
  caixa(x0, y0, z0, x1, y1, z1, cr, { topo = cr, faces = '+x-x+y-y+z-z', linha = 1, luz = 0, piso = 0 } = {}) {
    const mi = [x0, y0, z0], ma = [x1, y1, z1], nomes = 'xyz';
    for (let a = 0; a < 3; a++) for (const s of [1, -1]) {
      if (!faces.includes((s > 0 ? '+' : '-') + nomes[a])) continue;
      const u = (a + 1) % 3, v = (a + 2) % 3, n = [0, 0, 0]; n[a] = s;
      const pt = (pu, pv) => { const r = []; r[a] = s > 0 ? ma[a] : mi[a]; r[u] = pu ? ma[u] : mi[u]; r[v] = pv ? ma[v] : mi[v]; return r; };
      const q = [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)], t = [ma[u] - mi[u], ma[v] - mi[v]];
      this._vira(q, n, cor(a === 1 && s > 0 ? topo : cr), t, [linha, linha, linha, linha], [1, 1, 1, 1], luz, a === 1 && s > 0 ? piso : 0, s);
    }
    return this;
  }
  _vira(q, n, cr, t, bo, ao, luz, piso, s) { if (s > 0) this.face(q, n, cr, t, bo, ao, luz, piso); else this.face([q[0], q[3], q[2], q[1]], n, cr, [t[1], t[0]], [bo[2], bo[3], bo[0], bo[1]], [ao[0], ao[3], ao[2], ao[1]], luz, piso); }

  // peça qualquer do Three.js
  geo(g, cr, { m = null, luz = 0, ao = null, fosco = 0 } = {}) {
    g = g.index ? g.toNonIndexed() : g.clone(); if (m) g.applyMatrix4(m); if (!g.attributes.normal) g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal, k = cor(cr);
    for (let i = 0; i < P.count; i++) { this.p.push(P.getX(i), P.getY(i), P.getZ(i)); this.n.push(N.getX(i), N.getY(i), N.getZ(i)); this.c.push(k.r, k.g, k.b); this.uv.push(.5, .5); this.tam.push(1, 1); this.b.push(0, 0, 0, 0); this.x.push(ao ? ao(P.getX(i), P.getY(i), P.getZ(i)) : 1 - fosco, luz, 0); }
    return this;
  }
  // escada numa casa: sobe 1 na direção dada
  escada(x, y, z, dir, lado, topo, degraus = 4) {
    const [dx, dz] = DIRS[dir], k = 1 / degraus; this.rampas.push({ x, y, z, d: [dx, dz] });   // rampa: sobe de y para y+1 na direção d
    for (let i = 0; i < degraus; i++) {
      const a = -.5 + i * k, y1 = y + (i + 1) * k; let x0 = x - .5, x1 = x + .5, z0 = z - .5, z1 = z + .5;
      if (dx > 0) x0 = x + a; if (dx < 0) x1 = x - a; if (dz > 0) z0 = z + a; if (dz < 0) z1 = z - a;
      this.caixa(x0, y, z0, x1, y1, z1, lado, { topo, linha: .55, faces: '+x-x+y+z-z' });
    }
    return this;
  }
  // parede com vão em arco. eixo: 'x' (parede ao longo de x) ou 'z'; cx,cz centro; y base; l largura, h altura, e espessura, r raio do vão
  arco(eixo, cx, y, cz, l, h, e, r, cr, pe = 0) {
    const s = new THREE.Shape(), m = l / 2; s.moveTo(-m, 0); s.lineTo(-m, h); s.lineTo(m, h); s.lineTo(m, 0); s.lineTo(r, 0); s.lineTo(r, pe); s.absarc(0, pe, r, 0, Math.PI, false); s.lineTo(-r, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: e, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, -e / 2); if (eixo === 'z') g.rotateY(Math.PI / 2);
    return this.geo(g, cr, { m: new THREE.Matrix4().makeTranslation(cx, y, cz) });
  }
  // nicho: desenho de porta ou janela em arco colado numa parede virada para +x ou +z
  nicho(dir, x, y, z, l, h, cr, { luz = 0, moldura = null } = {}) {
    const forma = (w, a) => { const s = new THREE.Shape(), m = w / 2; s.moveTo(-m, 0); s.lineTo(m, 0); s.lineTo(m, a - m); s.absarc(0, a - m, m, 0, Math.PI, false); s.lineTo(-m, 0); return new THREE.ShapeGeometry(s, 16); };
    const põe = (g, f, k, lz) => { if (dir === '+x') { g.rotateY(Math.PI / 2); g.translate(x + f, y, z); } else g.translate(x, y, z + f); this.geo(g, k, { luz: lz, ao: lz ? null : (a, b) => .8 + .2 * Math.min(1, (b - y) / h) }); };
    if (moldura) põe(forma(l + .16, h + .1), .006, moldura, 0);
    põe(forma(l, h), .012, cr, luz); return this;
  }
  // escadinhas em triângulo encostadas na parede, como nos poços de degraus
  pocoDegraus(dir, x, y, z, niveis, s, cr, topo) {
    for (let k = 0; k < niveis; k++) { const w = (niveis - k) * s, y0 = y + k * s; if (dir === '+z') this.caixa(x - w, y0, z, x + w, y0 + s, z + s, cr, { topo, linha: .5, faces: '+x-x+y+z' }); else this.caixa(x, y0, z - w, x + s, y0 + s, z + w, cr, { topo, linha: .5, faces: '+x+y+z-z' }); }
    return this;
  }
  // árvores e arbustos ocupam a casa onde estão: o sino não passa por cima
  cipreste(x, y, z, h, cr = '#9dbb9c') {
    this.ocupado.add(this.chave(Math.round(x), y, Math.round(z)));
    const r = h * .155, pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(Math.max(.001, r * Math.pow(Math.sin(Math.PI * Math.pow(t, .62)), .85) * (1 - t * .25)), t * h)); }
    this.caixa(x - .05, y, z - .05, x + .05, y + .3, z + .05, '#8a5a48', { linha: 0 });
    return this.geo(new THREE.LatheGeometry(pts, 24), cr, { m: new THREE.Matrix4().makeTranslation(x, y + .2, z), ao: (a, b) => .62 + .38 * Math.min(1, (b - y) / (h * .7)) });
  }
  arbusto(x, y, z, r, cr = '#b3c8a4') { this.ocupado.add(this.chave(Math.round(x), y, Math.round(z))); return this.geo(new THREE.SphereGeometry(r, 20, 14), cr, { m: new THREE.Matrix4().makeTranslation(x, y + r * .72, z), ao: (a, b) => .65 + .35 * Math.min(1, (b - y) / (r * 1.3)) }); }

  // transforma os blocos em faces, com sombra de canto e linhas claras só nas quinas de verdade
  fechar() {
    for (const bl of this.blocos.values()) {
      const c = [bl.x, bl.y, bl.z], mi = [bl.x - .5, bl.y, bl.z - .5], v01 = (sorte(...c) - .5) * .07;
      for (let a = 0; a < 3; a++) for (const s of [1, -1]) {
        const nome = (s > 0 ? '+' : '-') + 'xyz'[a]; if (bl.faces && !bl.faces.includes(nome)) continue;
        const viz = (...d) => { const r = [...c]; for (const [e, k] of d) r[e] += k; return this.tem(...r); };
        if (viz([a, s]) && !bl.faces) continue;
        const u = (a + 1) % 3, w = (a + 2) % 3, n = [0, 0, 0]; n[a] = s;
        const pt = (i, j) => { const r = [...mi]; if (s > 0) r[a] += 1; r[u] += i; r[w] += j; return r; };
        const canto = (i, j) => { const A = viz([a, s], [u, i ? 1 : -1]), B = viz([a, s], [w, j ? 1 : -1]), D = viz([a, s], [u, i ? 1 : -1], [w, j ? 1 : -1]); return 1 - (A && B ? 3 : A + B + D) * .15; };
        const quina = (e, k) => (!viz([e, k]) && !viz([a, s], [e, k])) ? 1 : 0;
        const bo = bl.semBorda && bl.semBorda.includes(nome) ? [0, 0, 0, 0] : bl.bordas && bl.bordas[nome] || [quina(u, -1), quina(u, 1), quina(w, -1), quina(w, 1)];
        const k = cor(a === 1 && s > 0 ? (bl.topo || bl.lado) : bl.lado).clone(); k.offsetHSL(0, 0, v01 * .5);
        this._vira([pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)], n, k, [1, 1], bo, bl.faces ? [1, 1, 1, 1] : [canto(0, 0), canto(1, 0), canto(1, 1), canto(0, 1)], 0, a === 1 && s > 0 && bl.piso ? 1 : 0, s);
      }
    }
    const g = new THREE.BufferGeometry(), F = (a, n) => new THREE.Float32BufferAttribute(a, n);
    g.setAttribute('position', F(this.p, 3)); g.setAttribute('normal', F(this.n, 3)); g.setAttribute('color', F(this.c, 3)); g.setAttribute('aUv', F(this.uv, 2)); g.setAttribute('aTam', F(this.tam, 2)); g.setAttribute('aBorda', F(this.b, 4)); g.setAttribute('aExtra', F(this.x, 3));
    g.computeBoundingSphere(); return g;
  }
}

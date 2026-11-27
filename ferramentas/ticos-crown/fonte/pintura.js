'use strict';
// Modo 4: Pintura. Uma escultura 3D de blocos (relevo) num pedestal. A tinta começa num bloco; a cada jogada você
// escolhe um pote: toda a parte já pintada vira essa cor e "engole" os blocos vizinhos da mesma cor. Meta: deixar 100% da
// escultura pintada com poucas jogadas. Pedra (N) não pega tinta; solvente (T) apaga um bloco pintado vizinho a cada
// jogada até ser cercado; arco-íris (R) pega qualquer cor e espalha tinta em todos os vizinhos.
const Pintura = (() => {
  const cena = new THREE.Scene(); cena.environment = ENV;
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 200);
  cena.add(new THREE.HemisphereLight(0xfff6ee, 0x7a5aa0, 1.05));
  { const a = new THREE.DirectionalLight(0xffffff, 2.2); a.position.set(4, 9, 6); cena.add(a); const b = new THREE.DirectionalLight(0xffb0e0, .8); b.position.set(-6, 4, -5); cena.add(b); }
  {
    const g = new THREE.SphereGeometry(80, 32, 16), cor = [], p = g.attributes.position, c = new THREE.Color(), c1 = new THREE.Color(0xff9ad8), c2 = new THREE.Color(0x3a2a9a);
    for (let i = 0; i < p.count; i++) { c.copy(c1).lerp(c2, clamp((p.getY(i) / 80 + .3), 0, 1)); cor.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3)); cena.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));
  }
  { const chao = new THREE.Mesh(new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a2678, roughness: .9 })); chao.position.y = -.5; cena.add(chao); }
  const giro = new THREE.Group(); cena.add(giro);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.08, .5, 48), new THREE.MeshPhysicalMaterial({ color: 0xf4eee6, roughness: .3, clearcoat: .6 }));
  const aroP = new THREE.Mesh(new THREE.TorusGeometry(1.04, .05, 10, 64), MAT.ouro); aroP.rotation.x = Math.PI / 2;
  giro.add(pedestal, aroP);
  const G = new THREE.Group(); giro.add(G);
  const fx = new Particulas(cena, 1600, TEX_PONTO), fxC = new Particulas(cena, 900, TEX_CACO, false), fxB = new Particulas(cena, 300, TEX_BRILHO);

  const CORES = [0xff2f55, 0x2f7bff, 0x1fcf6c, 0xffc21a, 0xa64dff], HEX = CORES.map(c => '#' + c.toString(16).padStart(6, '0'));
  const texMarmore = texCanvas(64, 64, (g, w, h) => { g.fillStyle = '#f6f1ea'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,150,170,.35)'; g.lineWidth = 1.2; for (let i = 0; i < 6; i++) { g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += rnd(-8, 8); y += rnd(6, 14); g.lineTo(x, y); } g.stroke(); } });
  const mLado = new THREE.MeshStandardMaterial({ map: texMarmore, roughness: .45 });
  const vivo = CORES.map(c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .25, clearcoat: .7, clearcoatRoughness: .1, emissive: c, emissiveIntensity: .3, envMapIntensity: .55 }));
  const cru = CORES.map(c => {
    const t = texCanvas(64, 64, (g, w, h) => {
      g.drawImage(texMarmore.image, 0, 0); g.fillStyle = '#' + c.toString(16).padStart(6, '0');
      g.beginPath(); g.moveTo(32, 9); for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 22 : 17; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(25, 24, 6, 4, -.5, 0, 7); g.fill();
    });
    const top = new THREE.MeshStandardMaterial({ map: t, roughness: .4 }); return [mLado, mLado, top, mLado, mLado, mLado];
  });
  const texPedra = texCanvas(64, 64, (g, w, h) => { g.fillStyle = '#8c8696'; g.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '30,20,40'},.15)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } g.strokeStyle = '#5c5668'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); });
  const mPedra = new THREE.MeshStandardMaterial({ map: texPedra, roughness: .9 });
  const texSolv = texCanvas(64, 64, (g, w, h) => {
    g.fillStyle = '#3a1a4a'; g.fillRect(0, 0, w, h); const r = g.createRadialGradient(32, 32, 2, 32, 32, 28); r.addColorStop(0, '#d8ff6a'); r.addColorStop(.5, '#7fd02a'); r.addColorStop(1, 'rgba(60,120,20,0)');
    g.fillStyle = r; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; for (const [x, y, s] of [[24, 26, 5], [38, 34, 3], [30, 40, 2]]) { g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  });
  const mSolv = [mPedra, mPedra, new THREE.MeshStandardMaterial({ map: texSolv, emissive: 0x4a8a10, emissiveIntensity: .5, roughness: .3 }), mPedra, mPedra, mPedra];
  const texArco = texCanvas(64, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${i * 45},90%,60%)`; g.beginPath(); g.moveTo(32, 32); g.arc(32, 32, 46, i * Math.PI / 4, (i + 1) * Math.PI / 4); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill(); });
  const mArco = [mLado, mLado, new THREE.MeshStandardMaterial({ map: texArco, emissive: 0xffffff, emissiveIntensity: .25, roughness: .3 }), mLado, mLado, mLado];
  const geo = new THREE.BoxGeometry(.94, 1, .94).translate(0, .5, 0);

  // ---------- regras (usadas pelo jogo e pelo "resolvedor" que calcula o limite de jogadas) ----------
  let tiles = [], viz = [], inicio = 0, NC = 5;
  const copia = S => ({ cor: S.cor.slice(), pint: S.pint.slice(), arm: S.arm.slice() });
  const comum = (S, j) => tiles[j].tipo === 'n' || (tiles[j].tipo === 'T' && !S.arm[j]);
  const pintados = S => { let n = 0; for (let i = 0; i < tiles.length; i++) if (S.pint[i]) n++; return n; };
  const completo = S => tiles.every((t, i) => t.tipo === 'N' || S.pint[i]);
  function aplicar(S, k) {
    const ev = { novos: [], apag: [], limp: [], arco: [] };
    for (let i = 0; i < tiles.length; i++) if (S.pint[i]) S.cor[i] = k;
    const fila = []; for (let i = 0; i < tiles.length; i++) if (S.pint[i]) fila.push(i);
    const pega = j => { S.pint[j] = 1; S.cor[j] = k; fila.push(j); ev.novos.push(j); };
    while (fila.length) {
      const i = fila.shift();
      for (const j of viz[i]) {
        if (S.pint[j]) continue; const t = tiles[j].tipo;
        if (comum(S, j) && S.cor[j] === k) pega(j);
        else if (t === 'R') { pega(j); ev.arco.push(j); for (const q of viz[j]) if (!S.pint[q] && comum(S, q)) pega(q); }
      }
    }
    for (let t = 0; t < tiles.length; t++) {
      // solvente: na primeira vez que a tinta encosta, apaga os blocos pintados em volta e vira um bloco comum
      if (tiles[t].tipo !== 'T' || !S.arm[t] || !viz[t].some(j => S.pint[j])) continue;
      S.arm[t] = 0; S.cor[t] = tiles[t].orig; ev.limp.push(t);
      for (const j of viz[t]) if (S.pint[j] && j !== inicio) { S.pint[j] = 0; S.cor[j] = tiles[j].orig; ev.apag.push(j); }
    }
    return ev;
  }
  function limiteGuloso(S0) {
    const S = copia(S0); let n = 0;
    while (!completo(S) && n < 90) {
      let best = -1e9, bk = 0;
      for (let k = 0; k < NC; k++) {
        const A = copia(S); aplicar(A, k); let sc = pintados(A) - pintados(S);
        let mx = 0; for (let k2 = 0; k2 < NC; k2++) { const B = copia(A); aplicar(B, k2); mx = Math.max(mx, pintados(B) - pintados(A)); }
        sc += mx * .5; if (completo(A)) sc += 1e6; if (sc > best) { best = sc; bk = k; }
      }
      aplicar(S, bk); n++;
    }
    return n;
  }
  function semente(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- montagem ----------
  const st = { ativo: false, S: null, t: 0 };
  function visual(i) {
    const t = tiles[i], m = t.mesh;
    if (t.tipo === 'N') m.material = mPedra;
    else if (st.S.pint[i]) m.material = vivo[st.S.cor[i]];
    else if (t.tipo === 'T' && st.S.arm[i]) m.material = mSolv;
    else if (t.tipo === 'R') m.material = mArco;
    else m.material = cru[st.S.cor[i]];
  }
  function pular(m, a = .25) { const y0 = m.position.y; return Anim.add(.32, k => { const s = Math.sin(k * Math.PI); m.position.y = y0 + s * a; m.scale.x = m.scale.z = 1 + s * .1; }).then(() => { m.position.y = y0; m.scale.x = m.scale.z = 1; }); }
  function topo(i) { const t = tiles[i], v = new THREE.Vector3(t.x, t.h + .05, t.z); return giro.localToWorld(v); }
  function carregar(nv) {
    for (const o of [...G.children]) G.remove(o);
    const linhas = nv.forma, H = linhas.length, W = Math.max(...linhas.map(l => l.length)); NC = nv.cores;
    tiles = []; const idx = {};
    linhas.forEach((l, r) => [...l].forEach((ch, c) => {
      if (ch === '.' || ch === ' ') return;
      const tipo = /\d/.test(ch) ? 'n' : ch, h = (/\d/.test(ch) ? +ch : 2) * .45 + .2;
      idx[r + ',' + c] = tiles.length; tiles.push({ r, c, tipo, h, x: c - (W - 1) / 2, z: r - (H - 1) / 2, orig: -1 });
    }));
    viz = tiles.map(t => [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b]) => idx[(t.r + a) + ',' + (t.c + b)]).filter(j => j !== undefined));
    inicio = idx[nv.inicio[0] + ',' + nv.inicio[1]];
    const rng = semente(nv.semente || 7);
    tiles.forEach(t => { if (t.tipo === 'n' || t.tipo === 'T') t.orig = Math.floor(rng() * NC); });
    st.S = { cor: Int8Array.from(tiles.map(t => t.orig)), pint: new Uint8Array(tiles.length), arm: Uint8Array.from(tiles.map(t => t.tipo === 'T' ? 1 : 0)) };
    st.S.pint[inicio] = 1; aplicar(st.S, st.S.cor[inicio]);
    const lim = limiteGuloso(st.S) + (nv.folga ?? 2);
    const raio = Math.hypot(W, H) / 2 + .6; const rp = raio * .82; pedestal.scale.set(rp, 1, rp); aroP.scale.set(rp, rp, 1); pedestal.position.y = -.25; aroP.position.y = 0;
    tiles.forEach((t, i) => { const m = new THREE.Mesh(geo, cru[0]); m.position.set(t.x, 0, t.z); m.scale.y = t.h; t.mesh = m; G.add(m); visual(i); });
    st.raio = raio; st.ativo = true; st.t = 0; T.modo = 'pin';
    const total = tiles.filter(t => t.tipo !== 'N').length;
    T.metas = [{ t: 'tinta', n: total, falta: total - pintados(st.S) }];
    T.jogadas = T.jogadasIni = lim; T.pontos = 0;
    montarPotes(); enquadrar();
  }
  function sair() { if (!st.ativo) return; st.ativo = false; $('#potes').hidden = true; }
  function enquadrar() {
    if (!st.ativo) return; const a = L.tab.w / L.tab.h, f = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), el = .78;
    const d = (st.raio * .9) / f / Math.min(1, a) + 1.2; cam.aspect = a;
    cam.position.set(0, Math.sin(el) * d, Math.cos(el) * d); cam.lookAt(0, .55, 0); cam.updateProjectionMatrix();
  }

  // ---------- potes de tinta ----------
  function montarPotes() {
    const p = $('#potes'); p.hidden = false;
    p.innerHTML = HEX.slice(0, NC).map((h, k) => `<button class="pote" data-k="${k}" style="--c:${h}" aria-label="Tinta ${k + 1}"><svg viewBox="0 0 40 44"><path d="M6 12h28l-3 28H9z" fill="var(--c)" stroke="#5a3a10" stroke-width="2"/><path d="M5 9h30v5H5z" fill="#dfe6ef" stroke="#6a7686" stroke-width="2"/><path d="M12 9c0-5 16-5 16 0" fill="none" stroke="#6a7686" stroke-width="2.5"/><path d="M14 14c0 6-3 7-3 10a3 3 0 0 0 6 0c0-3-3-4-3-10z" fill="var(--c)" stroke="#fff" stroke-width="1.5" opacity=".9"/><rect x="11" y="18" width="4" height="16" fill="#fff" opacity=".3"/></svg><b></b></button>`).join('');
    p.querySelectorAll('.pote').forEach(b => b.onclick = () => { Som.init(); jogar(+b.dataset.k); });
    atualizarPotes();
  }
  function atualizarPotes() {
    const atual = st.S.cor[inicio], base = pintados(st.S);
    $('#potes').querySelectorAll('.pote').forEach(b => {
      const k = +b.dataset.k, A = copia(st.S); aplicar(A, k); const g = pintados(A) - base;
      b.querySelector('b').textContent = k === atual ? 'atual' : (g > 0 ? '+' : '') + g; b.classList.toggle('zero', g <= 0); b.classList.toggle('atual', k === atual);
    });
  }
  function respingo(i, k, forte) {
    const p = topo(i), c = corRGB(CORES[k]);
    fxC.explosao(p.x, p.y, p.z, forte ? 14 : 7, { cor: c, tam: .17, tamF: .05, v0: 1, v1: forte ? 4 : 2.6, grav: 8, sobe: 1.5, vida0: .35, vida1: .7 });
    fx.emitir(p.x, p.y, p.z, { tam: .9, tamF: .1, vida: .3, cor: c.map(v => v * .6 + .4) });
  }
  async function jogar(k) {
    if (!st.ativo || !T.ativo || T.ocupado) return;
    T.ocupado = true; T.jogadas--; HUD.jogadas();
    const antes = pintados(st.S), velhos = []; for (let i = 0; i < tiles.length; i++) if (st.S.pint[i]) velhos.push(i);
    const ev = aplicar(st.S, k);
    // distância a partir do bloco inicial (onda de cor)
    const dist = new Map([[inicio, 0]]), q = [inicio];
    while (q.length) { const i = q.shift(); for (const j of viz[i]) if (st.S.pint[j] && !dist.has(j)) { dist.set(j, dist.get(i) + 1); q.push(j); } }
    let fimT = 0;
    for (const i of velhos) { if (!st.S.pint[i]) continue; const d = (dist.get(i) || 0) * .028; fimT = Math.max(fimT, d); espera(d).then(() => { visual(i); if (Math.random() < .35) respingo(i, k); }); }
    Som.splash(0);
    ev.novos.forEach((i, n) => { const d = fimT + .08 + n * .04; espera(d).then(() => { visual(i); pular(tiles[i].mesh); respingo(i, k, true); Som.splash(Math.min(n, 14)); }); });
    let tt = fimT + .1 + ev.novos.length * .04 + .25;
    ev.arco.forEach(i => espera(fimT + .1).then(() => { const p = topo(i); fx.explosao(p.x, p.y, p.z, 40, { cor: [1, 1, 1], tam: .3, v0: 2, v1: 5, vida0: .4, vida1: .8 }); Som.uau(); Jogo.grito('Arco-íris!'); }));
    await espera(tt);
    for (const i of ev.limp) { visual(i); pular(tiles[i].mesh, .4); const p = topo(i); fx.explosao(p.x, p.y, p.z, 30, { cor: [.6, 1, .3], tam: .3, v0: 1, v1: 4, vida0: .4, vida1: .8 }); }
    if (ev.apag.length) {
      for (const i of ev.apag) {
        const p = topo(i); for (let n = 0; n < 16; n++) fx.emitir(p.x + rnd(-.3, .3), p.y + rnd(0, .5), p.z + rnd(-.3, .3), { vy: rnd(.5, 1.5), tam: rnd(.15, .3), vida: rnd(.4, .8), cor: [.6, 1, .3] });
        visual(i); pular(tiles[i].mesh, .15);
      }
      Som.apagar(); Rei.reagir('susto'); Jogo.balao('O solvente apagou a tinta em volta! Agora ele virou um bloco comum.', 2.6);
      await espera(.35);
    }
    const g = pintados(st.S) - antes; T.pontos += Math.max(0, g) * 60; HUD.pontos();
    const m = T.metas[0], falta = tiles.filter((t, i) => t.tipo !== 'N' && !st.S.pint[i]).length; m.falta = falta; HUD.meta(m);
    if (!ev.apag.length && !ev.limp.length) {
      if (g >= 10) { Rei.reagir('combo'); Jogo.grito(pega(['Que pintura!', 'Obra-prima!', 'Magnífico!'])); Som.uau(); }
      else if (g >= 4) { Rei.reagir('feliz'); Jogo.balao(pega(['Lindo!', 'Que cor bonita!', 'Isso!']), 1.5); }
      else if (g <= 0) { Rei.reagir('susto'); Jogo.balao('Essa cor não pegou nada!', 1.8); }
    }
    atualizarPotes();
    if (completo(st.S)) { Jogo.vencer(); return; }
    if (T.jogadas <= 0) { Jogo.perder(); return; }
    Rei.base(T.jogadas <= 2 ? 'panico' : 'normal'); if (T.jogadas === 2) Jogo.balao('Só 2 jogadas!', 1.8);
    T.ocupado = false;
  }
  return {
    cena, cam, fx: [fx, fxC, fxB], get ativo() { return st.ativo; }, carregar, sair, enquadrar, jogar,
    estado() { return { cor: [...st.S.cor], pint: [...st.S.pint], tipos: tiles.map(t => t.tipo), viz, cores: NC }; },
    melhor() { let best = -1e9, bk = 0; for (let k = 0; k < NC; k++) { const A = copia(st.S); aplicar(A, k); let sc = pintados(A); let mx = 0; for (let k2 = 0; k2 < NC; k2++) { const B = copia(A); aplicar(B, k2); mx = Math.max(mx, pintados(B)); } sc += mx * .5 + (completo(A) ? 1e6 : 0); if (sc > best) { best = sc; bk = k; } } return bk; },
    async entrada() { const ms = tiles.map(t => t.mesh); ms.forEach(m => m.scale.y = .01); await Promise.all(tiles.map((t, i) => espera(i * .012).then(() => Anim.add(.35, k => t.mesh.scale.y = Math.max(.01, t.h * k), Ease.back)))); },
    async festa() {
      while (T.jogadas > 0) {
        T.jogadas--; HUD.jogadas(); T.pontos += 500; HUD.pontos(); const k = Math.floor(Math.random() * NC);
        for (let n = 0; n < 6; n++) respingo(Math.floor(Math.random() * tiles.length), k, true); Som.splash(8); await espera(.25);
      }
      const ordem = tiles.map((t, i) => i).sort((a, b) => tiles[a].z - tiles[b].z);
      ordem.forEach((i, n) => espera(n * .015).then(() => pular(tiles[i].mesh, .3)));
      await espera(ordem.length * .015 + .3);
    },
    update(dt) { if (!st.ativo) return; st.t += dt; giro.rotation.y = Math.sin(st.t * .4) * .2; fx.tick(dt); fxC.tick(dt); fxB.tick(dt); },
  };
})();

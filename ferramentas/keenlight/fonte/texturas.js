/* Texturas pintadas na hora em Canvas 2D (nenhuma imagem baixada).
   Cada função desenha num canvas de alta resolução e devolve uma CanvasTexture pronta para o Three. */
const Tex = (() => {
  const MOVEL = matchMedia('(pointer: coarse)').matches;
  const Q = MOVEL ? .5 : 1;                       // no celular as texturas grandes ficam com metade do lado
  let semente = 7;
  const sorte = s => { semente = s >>> 0; };
  const r = () => { semente |= 0; semente = semente + 0x6D2B79F5 | 0; let t = Math.imul(semente ^ semente >>> 15, 1 | semente); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ent = (a, b) => a + r() * (b - a);
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  let aniso = 4;

  function tela(w, h, desenha, { rep = [1, 1], cor = true, grande = true } = {}) {
    const c = document.createElement('canvas');
    c.width = Math.max(64, Math.round(w * (grande ? Q : 1))); c.height = Math.max(64, Math.round(h * (grande ? Q : 1)));
    const g = c.getContext('2d'); g.save(); g.scale(c.width / w, c.height / h); desenha(g, w, h); g.restore();
    const t = new THREE.CanvasTexture(c);
    if (cor) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = aniso;
    return t;
  }
  // veios de madeira: faixas onduladas com nós
  function veios(g, x, y, w, h, base, escuro, n = 26) {
    g.fillStyle = base; g.fillRect(x, y, w, h);
    for (let i = 0; i < n; i++) {
      const yy = y + r() * h, amp = ent(1, 5), f = ent(.004, .02), fase = r() * 9;
      g.strokeStyle = escuro; g.globalAlpha = ent(.06, .22); g.lineWidth = ent(.6, 2.4);
      g.beginPath();
      for (let xx = x; xx <= x + w; xx += 6) g.lineTo(xx, yy + Math.sin(xx * f + fase) * amp + Math.sin(xx * f * 3.1) * amp * .3);
      g.stroke();
    }
    if (r() < .5) { // um nó
      const nx = x + ent(.2, .8) * w, ny = y + ent(.2, .8) * h;
      for (let k = 6; k > 0; k--) { g.globalAlpha = .08; g.strokeStyle = escuro; g.lineWidth = 1.4; g.beginPath(); g.ellipse(nx, ny, k * 5, k * 1.6, 0, 0, 7); g.stroke(); }
    }
    g.globalAlpha = 1;
  }
  function sujeira(g, w, h, n, cor, tam) {
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, rr = ent(tam * .3, tam);
      const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
  }

  /* ---------- piso de tábuas ---------- */
  function piso() {
    sorte(11);
    return tela(1024, 1024, (g, w, h) => {
      const tab = 8, lh = h / tab;
      for (let i = 0; i < tab; i++) {
        let x = -r() * 300;
        while (x < w) {
          const comp = ent(260, 520), l = ent(24, 34), hh = ent(26, 36);
          veios(g, x, i * lh, comp, lh, hsl(hh, ent(38, 50), l), hsl(hh - 6, 50, l - 16), 18);
          g.fillStyle = 'rgba(25,14,6,.75)'; g.fillRect(x, i * lh, 2.5, lh);
          x += comp;
        }
        g.fillStyle = 'rgba(20,10,4,.85)'; g.fillRect(0, i * lh, w, 2.5);
        g.fillStyle = 'rgba(255,230,190,.07)'; g.fillRect(0, i * lh + 3, w, 2);
      }
      sujeira(g, w, h, 40, 'rgba(30,18,8,.18)', 70);
      // pregos
      g.fillStyle = 'rgba(20,14,10,.8)';
      for (let i = 0; i < tab; i++) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(r() * w, i * lh + 8, 1.6, 0, 7); g.arc(r() * w, (i + 1) * lh - 8, 1.6, 0, 7); g.fill(); }
    }, { rep: [2.2, 1.8] });
  }

  /* ---------- papel de parede damasco ---------- */
  function ornamento(g, cx, cy, s, cor) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = cor; g.strokeStyle = cor; g.lineWidth = 2.2;
    for (const lado of [1, -1]) {
      g.save(); g.scale(lado, 1);
      g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(26, -48, 34, -20, 14, -4); g.bezierCurveTo(30, 6, 40, 30, 18, 46); g.bezierCurveTo(10, 52, 4, 56, 0, 64); g.stroke();
      g.beginPath(); g.moveTo(10, -30); g.bezierCurveTo(40, -46, 56, -20, 44, 0); g.bezierCurveTo(36, 12, 22, 6, 26, -6); g.fill();
      g.beginPath(); g.moveTo(8, 22); g.bezierCurveTo(36, 18, 52, 40, 36, 56); g.bezierCurveTo(26, 62, 18, 52, 24, 44); g.fill();
      g.beginPath(); g.ellipse(22, -56, 5, 9, -.6, 0, 7); g.fill();
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(46 + k * 3, 14 + k * 9, 2.4, 0, 7); g.fill(); }
      g.restore();
    }
    g.beginPath(); g.moveTo(0, -70); g.lineTo(7, -50); g.lineTo(0, -40); g.lineTo(-7, -50); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, 6, 8, 16, 0, 0, 7); g.fill();
    g.restore();
  }
  function papelParede() {
    sorte(23);
    return tela(512, 512, (g, w, h) => {
      const fundo = g.createLinearGradient(0, 0, 0, h); fundo.addColorStop(0, '#5f6a4b'); fundo.addColorStop(1, '#56603f');
      g.fillStyle = fundo; g.fillRect(0, 0, w, h);
      // listras finas
      for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(255,240,200,.035)'; g.fillRect(x, 0, 7, h); }
      for (const [x, y] of [[w / 4, h / 4], [w * 3 / 4, h * 3 / 4], [w * 3 / 4, h / 4 - h / 2], [w / 4, h * 3 / 4]]) {
        for (const dx of [0, w]) for (const dy of [0, h, -h]) {
          ornamento(g, x + dx - (dx ? w : 0), y + dy, .95, 'rgba(25,30,15,.28)');
          ornamento(g, x + dx - (dx ? w : 0) - 1.5, y + dy - 1.5, .95, 'rgba(214,190,120,.22)');
        }
      }
      sujeira(g, w, h, 18, 'rgba(60,40,15,.10)', 90);
      for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < .5 ? '255,240,210' : '20,20,10'},${ent(.02, .06)})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    }, { rep: [5, 2.2], grande: false });
  }

  /* ---------- madeira de móvel ---------- */
  function madeira(h = 24, l = 26, rep = [1, 1], s = 3) {
    sorte(s);
    return tela(512, 512, (g, w, hh) => { veios(g, 0, 0, w, hh, hsl(h, 45, l), hsl(h - 8, 55, l - 14), 60); sujeira(g, w, hh, 10, 'rgba(0,0,0,.12)', 60); }, { rep, grande: false });
  }

  /* ---------- tapete persa ---------- */
  function tapete() {
    sorte(41);
    return tela(1024, 768, (g, w, h) => {
      const verm = '#7c2420', azul = '#2f3a52', creme = '#e6d3a8', ouro = '#c08a3a', esc = '#2b1410';
      g.fillStyle = verm; g.fillRect(0, 0, w, h);
      const borda = (m, cor) => { g.strokeStyle = cor; g.lineWidth = 6; g.strokeRect(m, m, w - 2 * m, h - 2 * m); };
      g.fillStyle = azul; g.fillRect(30, 30, w - 60, h - 60); g.fillStyle = verm; g.fillRect(88, 88, w - 176, h - 176);
      borda(30, ouro); borda(88, ouro); borda(20, creme);
      // motivos na borda
      for (let x = 50; x < w - 40; x += 34) for (const y of [59, h - 59]) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = creme; g.fillRect(-9, -9, 18, 18); g.fillStyle = verm; g.fillRect(-4, -4, 8, 8); g.restore(); }
      for (let y = 80; y < h - 70; y += 34) for (const x of [59, w - 59]) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = creme; g.fillRect(-9, -9, 18, 18); g.fillStyle = verm; g.fillRect(-4, -4, 8, 8); g.restore(); }
      // campo com florzinhas
      for (let i = 0; i < 420; i++) {
        const x = ent(100, w - 100), y = ent(100, h - 100), cor = [creme, ouro, azul, esc][i % 4];
        g.fillStyle = cor; g.globalAlpha = .75;
        for (let p = 0; p < 4; p++) { g.beginPath(); g.ellipse(x + Math.cos(p * 1.57) * 4, y + Math.sin(p * 1.57) * 4, 3.4, 1.8, p * 1.57, 0, 7); g.fill(); }
      }
      g.globalAlpha = 1;
      // medalhão
      g.save(); g.translate(w / 2, h / 2);
      for (const [rx, ry, cor] of [[230, 170, ouro], [215, 158, azul], [170, 122, creme], [150, 106, verm], [90, 64, azul], [70, 48, ouro], [36, 26, verm]]) { g.fillStyle = cor; g.beginPath(); for (let a = 0; a < 6.3; a += .05) { const k = 1 + .08 * Math.sin(a * 12); g.lineTo(Math.cos(a) * rx * k, Math.sin(a) * ry * k); } g.fill(); }
      for (let a = 0; a < 6.28; a += Math.PI / 8) { g.save(); g.rotate(a); g.fillStyle = esc; g.beginPath(); g.ellipse(120, 0, 22, 7, 0, 0, 7); g.fill(); g.fillStyle = creme; g.beginPath(); g.arc(120, 0, 3, 0, 7); g.fill(); g.restore(); }
      g.restore();
      // cantos
      for (const [cx, cy] of [[100, 100], [w - 100, 100], [100, h - 100], [w - 100, h - 100]]) { g.fillStyle = azul; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill(); g.fillStyle = ouro; g.beginPath(); g.arc(cx, cy, 40, 0, 7); g.fill(); }
      g.fillStyle = verm; g.fillRect(88, 88, 3, 3);
      // gasto
      sujeira(g, w, h, 30, 'rgba(230,210,170,.10)', 120);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,240,210'},.07)`; g.fillRect(r() * w, r() * h, 1.2, 2.5); }
    });
  }

  /* ---------- tecido ---------- */
  function tecido(base, listra, tipo = 'listra', rep = [1, 1]) {
    sorte(5);
    return tela(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      if (tipo === 'listra') for (let x = 0; x < w; x += 32) { g.fillStyle = listra; g.fillRect(x, 0, 10, h); g.fillRect(x + 15, 0, 2, h); }
      if (tipo === 'xadrez') for (let x = 0; x < w; x += 32) { g.fillStyle = listra; g.globalAlpha = .5; g.fillRect(x, 0, 12, h); g.fillRect(0, x, w, 12); g.globalAlpha = 1; }
      if (tipo === 'flor') for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.fillStyle = listra; for (let p = 0; p < 5; p++) { g.beginPath(); g.ellipse(x + Math.cos(p * 1.26) * 5, y + Math.sin(p * 1.26) * 5, 4, 2.2, p * 1.26, 0, 7); g.fill(); } }
      for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(0,0,0,${ent(.02, .07)})`; g.fillRect(r() * w, r() * h, 1, 3); }
    }, { rep, grande: false });
  }

  /* ---------- reboco do teto ---------- */
  function reboco() {
    sorte(77);
    return tela(512, 512, (g, w, h) => {
      g.fillStyle = '#d9cbb0'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < .5 ? '90,70,40' : '255,250,235'},${ent(.03, .1)})`; g.beginPath(); g.arc(r() * w, r() * h, ent(.5, 2.4), 0, 7); g.fill(); }
      sujeira(g, w, h, 14, 'rgba(120,90,50,.12)', 120);
    }, { rep: [3, 2], grande: false });
  }

  /* ---------- lombadas de livros (uma por desenho; a cor vem da instância) ---------- */
  function lombada(tipo) {
    sorte(100 + tipo);
    return tela(128, 512, (g, w, h) => {
      g.fillStyle = '#e8e2d8'; g.fillRect(0, 0, w, h);
      // canto liso (as faces que não são lombada usam este pedaço)
      const bandas = tipo === 0 ? [40, 56, 440, 456] : tipo === 1 ? [30, 470] : [60, 70, 80, 420, 430, 440];
      g.fillStyle = '#cfa64a';
      for (const y of bandas) g.fillRect(14, y, w - 28, tipo === 1 ? 14 : 5);
      if (tipo !== 2) { g.fillStyle = 'rgba(30,20,10,.55)'; g.fillRect(24, 160, w - 48, 130); g.strokeStyle = '#cfa64a'; g.lineWidth = 3; g.strokeRect(28, 164, w - 56, 122); }
      for (let i = 0; i < 6; i++) { g.fillStyle = '#cfa64a'; g.fillRect(40 + r() * 40, 190 + i * 14, 10 + r() * 30, 4); }
      for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(0,0,0,${ent(.02, .08)})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
      // borda escura (aresta)
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
      g.fillStyle = '#d8d0c2'; g.fillRect(0, 0, 4, 4); // ponto liso no canto (uv 0.01,0.995)
    }, { grande: false });
  }

  /* ---------- quadros a óleo ---------- */
  function pincelada(g, x, y, comp, larg, ang, cor) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = cor; g.beginPath(); g.ellipse(0, 0, comp, larg, 0, 0, 7); g.fill(); g.restore();
  }
  function quadro(tipo, s = 1, larg = 768, alt = 576) {
    sorte(200 + s * 13 + tipo);
    return tela(larg, alt, (g, w, h) => {
      if (tipo === 'paisagem') {
        const c = g.createLinearGradient(0, 0, 0, h * .6); c.addColorStop(0, '#6f8fa6'); c.addColorStop(.6, '#e8c58c'); c.addColorStop(1, '#e9a76a');
        g.fillStyle = c; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 260; i++) pincelada(g, r() * w, r() * h * .45, ent(10, 40), ent(2, 6), ent(-.2, .2), `rgba(255,${ent(220, 245) | 0},${ent(190, 230) | 0},${ent(.05, .2)})`);
        for (let k = 0; k < 4; k++) { // morros
          g.fillStyle = ['#7a7f5a', '#5f6b43', '#4b5634', '#38402a'][k]; g.beginPath(); g.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (.42 + k * .12) + Math.sin(x * .006 + k * 2 + s) * 34 + Math.sin(x * .021 + k) * 10);
          g.lineTo(w, h); g.fill();
          for (let i = 0; i < 160; i++) pincelada(g, r() * w, h * (.5 + k * .12) + r() * h * .2, ent(4, 18), ent(1.5, 4), ent(-.5, .5), `rgba(${k < 2 ? '180,170,110' : '30,40,20'},${ent(.08, .25)})`);
        }
        for (let i = 0; i < 7; i++) { // ciprestes
          const x = ent(.1, .9) * w, y = h * ent(.55, .8), a = ent(60, 130);
          g.fillStyle = '#1f2a18'; g.beginPath(); g.ellipse(x, y - a / 2, a * .12, a / 2, 0, 0, 7); g.fill();
        }
        g.fillStyle = '#c96a3a'; g.fillRect(w * .62, h * .56, 36, 24); g.fillStyle = '#7a2b1c'; g.beginPath(); g.moveTo(w * .62 - 4, h * .56); g.lineTo(w * .62 + 18, h * .52); g.lineTo(w * .62 + 40, h * .56); g.fill();
      } else if (tipo === 'natureza') {
        const c = g.createRadialGradient(w * .4, h * .35, 20, w * .5, h * .5, w * .7); c.addColorStop(0, '#5a4a32'); c.addColorStop(1, '#1b140c');
        g.fillStyle = c; g.fillRect(0, 0, w, h);
        g.fillStyle = '#6b4a2a'; g.fillRect(0, h * .68, w, h * .32); // mesa
        g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(w * .1, h * .7); g.bezierCurveTo(w * .3, h * .62, w * .7, h * .78, w * .95, h * .7); g.lineTo(w, h); g.lineTo(0, h); g.fill(); // toalha
        // jarro
        g.fillStyle = '#8a9aa0'; g.beginPath(); g.ellipse(w * .32, h * .52, 70, 110, 0, 0, 7); g.fill(); g.fillRect(w * .32 - 26, h * .25, 52, 60);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(w * .29, h * .46, 12, 50, -.2, 0, 7); g.fill();
        const fruta = (x, y, rr, cor) => { const gr = g.createRadialGradient(x - rr * .4, y - rr * .4, 2, x, y, rr); gr.addColorStop(0, '#fff3c0'); gr.addColorStop(.3, cor); gr.addColorStop(1, '#2a1208'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); };
        fruta(w * .55, h * .7, 46, '#c8402a'); fruta(w * .66, h * .73, 40, '#d79a2a'); fruta(w * .6, h * .62, 38, '#9a3a1a'); fruta(w * .74, h * .66, 30, '#6a8a2a');
        g.fillStyle = '#4a2a5a'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(w * .45 + i % 4 * 14, h * .74 + (i / 4 | 0) * 12, 9, 0, 7); g.fill(); }
        for (let i = 0; i < 600; i++) pincelada(g, r() * w, r() * h, ent(4, 14), ent(1, 3), r() * 3, `rgba(${r() < .5 ? '0,0,0' : '255,220,160'},.05)`);
      } else if (tipo === 'retrato') {
        g.fillStyle = '#2a2018'; g.fillRect(0, 0, w, h);
        const c = g.createRadialGradient(w * .5, h * .35, 10, w * .5, h * .4, w * .6); c.addColorStop(0, 'rgba(120,90,50,.7)'); c.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = c; g.fillRect(0, 0, w, h);
        g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(w * .5, h * 1.02, w * .4, h * .42, 0, 0, 7); g.fill();
        g.fillStyle = '#d8a882'; g.beginPath(); g.ellipse(w * .5, h * .4, w * .14, h * .2, 0, 0, 7); g.fill();
        g.fillStyle = '#3a2416'; g.beginPath(); g.ellipse(w * .5, h * .28, w * .17, h * .13, 0, Math.PI, 0); g.fill();
        g.fillStyle = '#efe6d0'; g.beginPath(); g.moveTo(w * .4, h * .62); g.lineTo(w * .5, h * .72); g.lineTo(w * .6, h * .62); g.lineTo(w * .55, h * .6); g.lineTo(w * .45, h * .6); g.fill();
        g.fillStyle = 'rgba(80,40,20,.5)'; g.beginPath(); g.ellipse(w * .45, h * .4, 10, 5, 0, 0, 7); g.ellipse(w * .55, h * .4, 10, 5, 0, 0, 7); g.fill();
        for (let i = 0; i < 400; i++) pincelada(g, r() * w, r() * h, ent(4, 16), ent(1, 3), r() * 3, `rgba(${r() < .5 ? '0,0,0' : '255,220,160'},.05)`);
      } else if (tipo === 'mar') {
        const c = g.createLinearGradient(0, 0, 0, h); c.addColorStop(0, '#c9b48a'); c.addColorStop(.45, '#e6d1a0'); c.addColorStop(.46, '#4f6a6a'); c.addColorStop(1, '#2a3a38');
        g.fillStyle = c; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 500; i++) pincelada(g, r() * w, h * ent(.47, 1), ent(8, 30), ent(1, 3), ent(-.1, .1), `rgba(${r() < .4 ? '240,230,200' : '20,40,40'},${ent(.1, .3)})`);
        g.fillStyle = '#3a2a1c'; g.beginPath(); g.moveTo(w * .3, h * .55); g.lineTo(w * .55, h * .55); g.lineTo(w * .5, h * .6); g.lineTo(w * .34, h * .6); g.fill();
        g.fillStyle = '#efe4c8'; g.beginPath(); g.moveTo(w * .42, h * .2); g.lineTo(w * .42, h * .53); g.lineTo(w * .54, h * .53); g.fill();
        g.fillStyle = '#e8dcbc'; g.beginPath(); g.moveTo(w * .41, h * .26); g.lineTo(w * .41, h * .53); g.lineTo(w * .33, h * .53); g.fill();
      } else { // esboço na tela do cavalete: começo de uma pintura
        g.fillStyle = '#efe7d4'; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(60,40,30,.55)'; g.lineWidth = 2;
        for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(r() * w, r() * h * .3 + h * .4); g.bezierCurveTo(r() * w, r() * h, r() * w, r() * h, r() * w, r() * h * .3 + h * .5); g.stroke(); }
        const c = g.createLinearGradient(0, 0, 0, h * .5); c.addColorStop(0, 'rgba(110,140,170,.85)'); c.addColorStop(1, 'rgba(230,190,140,.8)');
        g.fillStyle = c; g.fillRect(0, 0, w * .7, h * .45);
        for (let i = 0; i < 200; i++) pincelada(g, r() * w * .7, r() * h * .45, ent(10, 34), ent(2, 6), ent(-.3, .3), `rgba(255,240,220,${ent(.05, .2)})`);
        g.fillStyle = 'rgba(80,100,60,.85)'; g.beginPath(); g.moveTo(0, h * .45); for (let x = 0; x < w * .7; x += 10) g.lineTo(x, h * .45 - Math.sin(x * .01) * 30 - 20); g.lineTo(w * .7, h * .6); g.lineTo(0, h * .6); g.fill();
      }
      // craquelê e verniz
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = .8;
      for (let i = 0; i < 160; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += ent(-14, 14); y += ent(-14, 14); g.lineTo(x, y); } g.stroke(); }
      const v = g.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .75); v.addColorStop(0, 'rgba(255,220,150,0)'); v.addColorStop(1, 'rgba(40,20,0,.35)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    });
  }

  /* ---------- pequenos: mostrador, mapa, partitura, rótulos, céu ---------- */
  function mostrador() {
    return tela(512, 512, (g, w, h) => {
      g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
      g.strokeStyle = '#2a1f17'; g.lineWidth = 4; g.beginPath(); g.arc(256, 256, 230, 0, 7); g.stroke();
      g.fillStyle = '#2a1f17'; g.font = '600 52px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const rom = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      rom.forEach((t, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(256 + Math.cos(a) * 185, 256 + Math.sin(a) * 185); g.rotate(a + Math.PI / 2); g.fillText(t, 0, 0); g.restore(); });
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(256 + Math.cos(a) * 222, 256 + Math.sin(a) * 222); g.lineTo(256 + Math.cos(a) * (i % 5 ? 212 : 204), 256 + Math.sin(a) * (i % 5 ? 212 : 204)); g.stroke(); }
      g.font = 'italic 22px Georgia'; g.fillText('Hartwell & Filhos', 256, 330);
      sujeira(g, w, h, 8, 'rgba(120,80,30,.14)', 90);
    }, { grande: false });
  }
  function mapa() {
    sorte(55);
    return tela(512, 384, (g, w, h) => {
      g.fillStyle = '#e2cf9f'; g.fillRect(0, 0, w, h); sujeira(g, w, h, 20, 'rgba(120,80,30,.18)', 80);
      g.strokeStyle = 'rgba(90,60,30,.6)'; g.lineWidth = 2; g.fillStyle = 'rgba(150,120,70,.35)';
      for (let k = 0; k < 3; k++) { g.beginPath(); const cx = ent(100, 400), cy = ent(80, 300); for (let a = 0; a < 6.3; a += .2) { const rr = ent(40, 90); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .7); } g.closePath(); g.fill(); g.stroke(); }
      g.setLineDash([6, 6]); g.strokeStyle = '#8a2a1a'; g.beginPath(); g.moveTo(60, 320); g.bezierCurveTo(200, 200, 260, 330, 420, 90); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#8a2a1a'; g.lineWidth = 5; g.beginPath(); g.moveTo(410, 80); g.lineTo(430, 100); g.moveTo(430, 80); g.lineTo(410, 100); g.stroke();
      g.save(); g.translate(70, 70); g.strokeStyle = 'rgba(60,40,20,.7)'; g.lineWidth = 1.5; for (let a = 0; a < 8; a++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, a % 2 ? 22 : 40); g.stroke(); } g.restore();
    }, { grande: false });
  }
  function partitura() {
    return tela(256, 340, (g, w, h) => {
      g.fillStyle = '#efe5cc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(30,20,10,.6)'; g.lineWidth = 1;
      for (let p = 0; p < 7; p++) for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(14, 30 + p * 42 + l * 5); g.lineTo(w - 14, 30 + p * 42 + l * 5); g.stroke(); }
      g.fillStyle = 'rgba(30,20,10,.8)'; sorte(9);
      for (let p = 0; p < 7; p++) for (let i = 0; i < 12; i++) { const x = 30 + i * 18, y = 30 + p * 42 + (r() * 20 | 0); g.beginPath(); g.ellipse(x, y, 3.2, 2.4, -.4, 0, 7); g.fill(); g.fillRect(x + 2.4, y - 14, 1.2, 14); }
    }, { grande: false });
  }
  function rotulo(texto, fundo = '#e9dcbc', tinta = '#3a2416') {
    return tela(256, 128, (g, w, h) => {
      g.fillStyle = fundo; g.fillRect(0, 0, w, h); g.strokeStyle = tinta; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = tinta; g.font = 'italic 600 40px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, w / 2, h / 2);
    }, { grande: false });
  }
  function ceu() {
    return tela(512, 512, (g, w, h) => {
      const c = g.createLinearGradient(0, 0, 0, h); c.addColorStop(0, '#9fbcd0'); c.addColorStop(.55, '#f3dcb0'); c.addColorStop(1, '#f0b980');
      g.fillStyle = c; g.fillRect(0, 0, w, h);
      sorte(3); for (let i = 0; i < 30; i++) pincelada(g, r() * w, r() * h * .5, ent(30, 90), ent(6, 16), 0, 'rgba(255,250,240,.25)');
      g.fillStyle = '#7a8a70'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * .78 + Math.sin(x * .02) * 14); g.lineTo(w, h); g.fill();
      g.fillStyle = '#5c6a4e'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(r() * w, h * .8, ent(20, 40), 0, 7); g.fill(); }
      g.fillStyle = '#b8806a'; for (let i = 0; i < 5; i++) { const x = r() * w; g.fillRect(x, h * .7, 30, 40); g.beginPath(); g.moveTo(x - 4, h * .7); g.lineTo(x + 15, h * .64); g.lineTo(x + 34, h * .7); g.fill(); }
    }, { grande: false });
  }
  // brilho redondo para poeira, anel da lupa e faíscas
  function bolinha(cor = '255,230,170') {
    return tela(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${cor},1)`); gr.addColorStop(.35, `rgba(${cor},.5)`); gr.addColorStop(1, `rgba(${cor},0)`); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, { grande: false });
  }
  function anel() {
    return tela(256, 256, (g) => {
      for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(255,${210 + k * 15},${120 + k * 40},${.9 - k * .25})`; g.lineWidth = 10 - k * 3; g.shadowColor = 'rgba(255,200,90,1)'; g.shadowBlur = 24; g.beginPath(); g.arc(128, 128, 100 - k * 2, 0, 7); g.stroke(); }
    }, { grande: false });
  }
  function raio() { // facho de luz da janela (mais forte no meio, some nas pontas)
    return tela(64, 256, (g, w, h) => { const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(255,230,180,0)'); gx.addColorStop(.5, 'rgba(255,230,180,1)'); gx.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gx; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gy; g.fillRect(0, 0, w, h); }, { grande: false });
  }

  return { r, ent, sorte, hsl, piso, papelParede, madeira, tapete, tecido, reboco, lombada, quadro, mostrador, mapa, partitura, rotulo, ceu, bolinha, anel, raio, set aniso(v) { aniso = v; }, MOVEL };
})();

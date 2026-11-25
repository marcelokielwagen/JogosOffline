// Toque e arrasto das cartas, usado pela Paciência e pelo FreeCell.
// Tudo pela posição do dedo (não pelo elemento tocado): pega a carta mesmo com toque um pouco fora dela.
const Cartas = (() => {
  // Coloca a carta no lugar, mexendo na tela só quando algo mudou.
  function pos(el, x, y, z) {
    if (el._x !== x || el._y !== y) { el._x = x; el._y = y; el.style.transform = `translate3d(${x}px,${y}px,0)`; }
    if (z != null && el._z !== z) { el._z = z; el.style.zIndex = z; }
  }
  // Balançada de "não dá".
  function tremer(els) {
    els.forEach(el => el.animate && el.animate([{ translate: '0' }, { translate: '-5px' }, { translate: '5px' }, { translate: '-3px' }, { translate: '0' }], 220));
  }
  // Salva depois de uma pausa (salvar a cada jogada engasgava); ao sair da tela, salva na hora.
  function gravador(gravar, espera = 500) {
    let t = null;
    const agora = () => { if (t) { clearTimeout(t); t = null; gravar(); } };
    window.addEventListener('pagehide', agora);
    document.addEventListener('visibilitychange', () => { if (document.hidden) agora(); });
    return () => { clearTimeout(t); t = setTimeout(() => { t = null; gravar(); }, espera); };
  }

  // o.tab, o.cartas (elementos), o.xy (lugar de cada carta), o.medidas() -> {cw, ch}
  // o.antes()        termina animações pendentes antes do toque
  // o.achar(x, y)    o que está nesse ponto: {p, id?} ou null
  // o.pegar(id)      grupo que pode ser arrastado ou null
  // o.alvos(g)       lugares onde o grupo pode ser solto: [{p, x, y, w, h, el}]
  // o.tocar(alvo)    toque simples; devolve true se moveu
  // o.repete(alvo)   toques seguidos no mesmo lugar valem (baralho)
  // o.mover(g, p), o.falhou(g, x, y), o.aoArrastar()
  function ligar(o) {
    const tab = o.tab;
    let toque = null, quadro = 0, ultimo = { t: -1e9, x: 0, y: 0, moveu: false };
    const ponto = ev => { const r = tab.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    const emBotao = ev => ev.target.closest && ev.target.closest('button');
    const classe = (g, c, liga) => g.ids.forEach(id => o.cartas[id].classList.toggle(c, liga));

    // Impede o zoom do navegador em toques rápidos (menos nos botões que ficam por cima do tabuleiro).
    const segura = ev => { if (!emBotao(ev) && ev.cancelable) ev.preventDefault(); };
    tab.addEventListener('touchstart', segura, { passive: false });
    tab.addEventListener('touchend', segura, { passive: false });
    tab.addEventListener('dblclick', segura);
    tab.addEventListener('contextmenu', ev => ev.preventDefault());

    tab.addEventListener('pointerdown', ev => {
      if (emBotao(ev) || ev.button > 0) return;
      if (toque) { if (!ev.isPrimary) return; cancelar(); }
      ev.preventDefault();
      o.antes();
      const [x, y] = ponto(ev), alvo = o.achar(x, y);
      if (!alvo) return;
      toque = { alvo, x, y, ax: x, ay: y, id: ev.pointerId, arrastando: false, g: alvo.id != null ? o.pegar(alvo.id) : null, mira: null };
      if (toque.g) classe(toque.g, 'pega', true);
      try { tab.setPointerCapture(ev.pointerId); } catch (err) {}
    });
    tab.addEventListener('pointermove', ev => {
      if (!toque || ev.pointerId !== toque.id || !toque.g) return;
      [toque.ax, toque.ay] = ponto(ev);
      if (!toque.arrastando) {
        if (Math.hypot(toque.ax - toque.x, toque.ay - toque.y) < 7) return;
        toque.arrastando = true;
        toque.lista = o.alvos(toque.g);
        if (o.aoArrastar) o.aoArrastar();
        classe(toque.g, 'arrasta', true);
      }
      if (!quadro) quadro = requestAnimationFrame(seguir);
    });
    function seguir() {
      quadro = 0;
      if (!toque || !toque.arrastando) return;
      const dx = toque.ax - toque.x, dy = toque.ay - toque.y;
      toque.g.ids.forEach((id, k) => pos(o.cartas[id], o.xy[id].x + dx, o.xy[id].y + dy, 2000 + k));
      mirar(melhor());
    }
    // Lugar válido mais coberto pela carta arrastada. O ponto do dedo também vale.
    function melhor() {
      const { cw, ch } = o.medidas(), l = o.xy[toque.g.ids[0]];
      const x = l.x + toque.ax - toque.x, y = l.y + toque.ay - toque.y;
      let m = null;
      for (const a of toque.lista) {
        const w = Math.min(x + cw, a.x + a.w) - Math.max(x, a.x), h = Math.min(y + ch, a.y + a.h) - Math.max(y, a.y);
        const dedo = toque.ax >= a.x && toque.ax <= a.x + a.w && toque.ay >= a.y && toque.ay <= a.y + a.h;
        const nota = (w > cw * .15 && h > ch * .12 ? w * h : 0) + (dedo ? cw * ch * .4 : 0);
        if (nota > 0 && (!m || nota > m.nota)) m = { nota, a };
      }
      return m && m.a;
    }
    function mirar(a) {
      const el = a ? a.el : null;
      if (toque.mira === el) return;
      if (toque.mira) toque.mira.classList.remove('mira');
      if (el) el.classList.add('mira');
      toque.mira = el;
    }
    function limpar(t) {
      if (t.mira) t.mira.classList.remove('mira');
      if (t.g) { classe(t.g, 'pega', false); classe(t.g, 'arrasta', false); }
    }
    function voltar(t) { t.g.ids.forEach(id => pos(o.cartas[id], o.xy[id].x, o.xy[id].y)); o.voltou(t.g); }
    function cancelar() { const t = toque; toque = null; if (!t) return; limpar(t); if (t.arrastando) voltar(t); }

    tab.addEventListener('pointerup', ev => {
      if (!toque || ev.pointerId !== toque.id) return;
      [toque.ax, toque.ay] = ponto(ev);
      const t = toque;
      if (t.arrastando) {
        const a = melhor();
        toque = null; limpar(t);
        if (a) o.mover(t.g, a.p); else { voltar(t); if (o.falhou) o.falhou(t.g, t.ax, t.ay); }
        return;
      }
      toque = null; limpar(t);
      // Segundo toque logo depois, no mesmo lugar: é costume de "toque duplo", não outra jogada.
      const agora = performance.now();
      if (agora - ultimo.t < 320 && ultimo.moveu && Math.hypot(t.x - ultimo.x, t.y - ultimo.y) < 26 && !o.repete(t.alvo)) return;
      ultimo = { t: agora, x: t.x, y: t.y, moveu: !!o.tocar(t.alvo) };
    });
    tab.addEventListener('pointercancel', ev => { if (toque && ev.pointerId === toque.id) cancelar(); });
    tab.addEventListener('lostpointercapture', ev => { if (toque && ev.pointerId === toque.id) cancelar(); });

    return { arrastando: () => !!(toque && toque.arrastando), cancelar };
  }

  return { pos, tremer, gravador, ligar };
})();

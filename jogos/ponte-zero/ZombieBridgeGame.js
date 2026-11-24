// Ponte Zero — módulo independente. Uso:
//   const jogo = new ZombieBridgeGame(plataforma);
//   await jogo.init(container);  jogo.pause();  jogo.resume();  jogo.destroy();
// "plataforma" é a tomada com o pacote de jogos: { carregar, salvar, som, vibrar, somLigado } (tudo opcional).
import { criarSimulacao } from './nucleo/simulacao.js';
import { carregarRecursos, Cena } from './cena/cena.js';
import { criarSom } from './audio/som.js';
import { ARMAS, TRECHO } from './dados/balanco.js';

const BASE = new URL('./', import.meta.url);
const HTML = `
  <div class="pz-vinheta" aria-hidden="true"></div>
  <div class="pz-hud" aria-hidden="true" hidden>
    <div class="pz-linha"><div class="pz-caminho"><i data-caminho></i></div></div>
    <div class="pz-arma"><b data-arma></b><span><i data-evolui></i></span><small data-mortos></small></div>
  </div>
  <div class="pz-conta" data-conta hidden></div>
  <div class="pz-aviso" data-aviso aria-hidden="true"></div>
  <div class="pz-dica" data-dica hidden>Arraste para mover o pelotão</div>
  <div class="so-leitor" role="status" aria-live="polite" data-leitor></div>
  <div class="pz-painel" data-painel>
    <p class="pz-selo" data-selo>Protótipo · Fase 2</p>
    <h2 data-titulo>Ponte Zero</h2>
    <p data-texto>Preparando a ponte…</p>
    <div class="pz-carga"><i data-carga></i></div>
    <div class="pz-placar" data-placar hidden></div>
    <button class="btn principal" data-jogar hidden>Jogar</button>
    <button class="pz-sangue" data-sangue hidden aria-pressed="true">Sangue: <b>ligado</b></button>
  </div>`;

export class ZombieBridgeGame {
  #p; #raiz; #cena; #rec; #som; #S; #raf = 0; #ult = 0; #pausado = false; #parado = true; #fim = 0; #ouvintes = []; #obs; #teclas = new Set(); #dedo = null; #dados; #resto = 0; #lento = { t: 0, n: 0, ok: 0 }; #avisoAte = 0; #vivo = false; #qual; #css;

  constructor(plataforma = {}) {
    this.#p = { carregar: (c, d) => d, salvar() {}, som() {}, vibrar() {}, somLigado: () => true, ...plataforma };
  }

  async init(container) {
    if (this.#vivo) throw new Error('jogo já iniciado'); this.#vivo = true;
    this.#css = document.createElement('link'); this.#css.rel = 'stylesheet'; this.#css.href = new URL('jogo.css', BASE).href; const cssPronto = new Promise(ok => { this.#css.onload = this.#css.onerror = ok; }); document.head.append(this.#css); await cssPronto; if (!this.#vivo) return;
    this.#dados = this.#p.carregar('ponteZero', { melhor: 0, jogos: 0, vitorias: 0, sangue: true });
    const r = this.#raiz = document.createElement('div'); r.className = 'pz'; r.innerHTML = HTML; container.append(r);
    this.#som = criarSom(() => this.#p.somLigado());
    const celular = matchMedia('(pointer: coarse)').matches; this.#qual = this.#p.carregar('ponteZeroQualidade', celular ? 1 : 2);
    try {
      this.#rec = await carregarRecursos(new URL('recursos/', BASE), f => { if (this.#vivo) this.#q('carga').style.transform = `scaleX(${f})`; });
      if (!this.#vivo) { this.#rec.dispose(); return; }
      this.#cena = new Cena(r, this.#rec, this.#qual); this.#nova(); await this.#cena.preparar();
    } catch (e) { if (!this.#vivo) return; this.#q('texto').textContent = 'Este aparelho não conseguiu abrir o jogo em 3D.'; console.error(e); throw e; }
    if (!this.#vivo) return;
    this.#q('texto').textContent = 'Atravesse a ponte. Escolha os portões, some soldados e não deixe os zumbis encostarem.';
    this.#q('carga').parentElement.hidden = true; this.#mostrar('jogar', true); this.#mostrar('sangue', true); this.#sangue(this.#dados.sangue !== false);
    this.#ouvir(this.#q('jogar'), 'click', () => this.#comecar());
    this.#ouvir(this.#q('sangue'), 'click', () => { this.#dados.sangue = this.#dados.sangue === false; this.#p.salvar('ponteZero', this.#dados); this.#sangue(this.#dados.sangue); });
    this.#controles();
    this.#obs = new ResizeObserver(() => { if (this.#cena) { this.#cena.medir(); this.#cena.quadro(0, this.#S); } }); this.#obs.observe(r);
    this.#ult = performance.now(); this.#raf = requestAnimationFrame(this.#laco);
  }
  pause() { if (!this.#vivo || this.#pausado) return; this.#pausado = true; cancelAnimationFrame(this.#raf); this.#soltar(); this.#som.pausar(true); }
  resume() { if (!this.#vivo || !this.#pausado) return; this.#pausado = false; this.#som.pausar(false); this.#ult = performance.now(); this.#raf = requestAnimationFrame(this.#laco); }
  destroy() {
    if (!this.#vivo) return null; this.#vivo = false; cancelAnimationFrame(this.#raf); this.#obs?.disconnect();
    for (const [a, t, f, o] of this.#ouvintes) a.removeEventListener(t, f, o); this.#ouvintes = [];
    this.#som?.dispose(); this.#rec?.dispose(); this.#cena?.dispose(); this.#raiz?.remove(); this.#css?.remove(); const restou = this.#cena?.restou || null; this.#cena = this.#rec = this.#S = null; return restou;
  }
  // para testes e para o pacote mostrar informações
  get info() { const S = this.#S, i = this.#cena?.R?.info; return S && { estado: S.estado, d: S.d, n: S.n, arma: S.arma, mortos: S.mortos, zumbis: S.zumbis.length, tiros: S.tiros.length, chamadas: i.render.calls, triangulos: i.render.triangles, memoria: { ...i.memory }, qualidade: this.#qual, jogando: !this.#parado, quadroMs: this.#lento.media }; }
  // avança o jogo na marra (testes): segundos de jogo, com piloto opcional
  avancar(seg, piloto) { for (let t = 0; t < seg; t += 1 / 60) { piloto?.(this.#S); this.#S.passo(1 / 60); this.#cena.fx.atualizar(1 / 60, this.#S); } for (let k = 0; k < 40; k++) { this.#S.passo(1 / 60); piloto?.(this.#S); this.#cena.camera(.1, this.#S); } this.#cena.quadro(1 / 60, this.#S); this.#hud(1); this.#conferirFim(0); }
  comecar() { this.#comecar(); }
  get cena() { return this.#cena; }
  // mede o custo real de desenhar um quadro (ms), esperando a placa de vídeo terminar
  medir(n = 30) { const gl = this.#cena.R.getContext(), px = new Uint8Array(4), um = () => { this.#cena.quadro(1 / 60, this.#S); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }; um(); const t = performance.now(); for (let i = 0; i < n; i++) um(); return (performance.now() - t) / n; }

  #q(n) { return this.#raiz.querySelector(`[data-${n}]`); }
  #mostrar(n, v) { this.#q(n).hidden = !v; }
  #ouvir(a, t, f, o) { a.addEventListener(t, f, o); this.#ouvintes.push([a, t, f, o]); }
  #sangue(v) { this.#q('sangue').setAttribute('aria-pressed', v); this.#q('sangue').querySelector('b').textContent = v ? 'ligado' : 'desligado'; this.#cena.fx.sangueLigado(v); this.#cena.zum.mat.userData.u.uSangue.value = v ? 1 : 0; }

  #nova() { this.#S = criarSimulacao(TRECHO, { aoEvento: (n, d) => this.#evento(n, d), maxZumbis: this.#qual > 1 ? 220 : this.#qual ? 150 : 100, maxSoldados: this.#qual > 1 ? 100 : 60 }); this.#cena.novaPartida(this.#S); this.#fim = 0; this.#resto = 0; }
  #comecar() {
    this.#som.acordar(); if (this.#S.estado !== 'jogando' || this.#S.d > 0) this.#nova();
    this.#parado = false; this.#cena.noMenu = false; this.#dados.jogos++; this.#p.salvar('ponteZero', this.#dados); this.#raiz.querySelector('.pz-painel').hidden = true; this.#raiz.querySelector('.pz-hud').hidden = false; this.#mostrar('conta', true); this.#mostrar('dica', true); this.#raiz.classList.add('jogando'); this.#q('jogar').blur();
  }
  #evento(n, d) {
    if (!this.#cena) return;
    this.#cena.evento(n, d);
    if (n === 'tiro') this.#som.tiro(this.#S.arma, this.#S.n, this.#S.x / 5); else this.#som.evento(n, d);
    if (n === 'portao') { const t = d.l.tipo; this.#p.vibrar(d.bom ? 25 : 60); if (t !== 'arma' && t !== 'cadencia') this.#avisar(d.q >= 0 ? `+${d.q}` : `−${-d.q}`, d.bom); else if (t === 'cadencia') this.#avisar(`Cadência +${d.l.v}%`, true); }
    if (n === 'arma') { this.#avisar(d.arma.nome, true); this.#p.vibrar(40); }
    if (n === 'cadencia') this.#avisar('Cadência +15%', true);
    if (n === 'virou') this.#avisar('Portão virou!', true);
    if (n === 'soldado') this.#p.vibrar(15); if (n === 'barril') this.#p.vibrar(60);
  }
  #avisar(t, bom) { const e = this.#q('aviso'); e.textContent = t; e.className = 'pz-aviso ' + (bom ? 'bom' : 'ruim'); this.#avisoAte = performance.now() + 1100; e.getAnimations().forEach(a => a.cancel()); e.animate([{ transform: 'translate(-50%, 12px) scale(.7)', opacity: 0 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: .18 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: .7 }, { transform: 'translate(-50%, -22px) scale(1)', opacity: 0 }], { duration: 1100, fill: 'both', easing: 'ease-out' }); this.#q('leitor').textContent = t; }

  // ---------- controles ----------
  #controles() {
    const r = this.#raiz, TECLAS = { ArrowLeft: 'e', KeyA: 'e', ArrowRight: 'd', KeyD: 'd', ArrowUp: 'f', KeyW: 'f', ArrowDown: 't', KeyS: 't' };
    this.#ouvir(window, 'keydown', e => { const k = TECLAS[e.code]; if (k && !this.#parado && !this.#pausado) { this.#teclas.add(k); this.#mostrar('dica', false); e.preventDefault(); } });
    this.#ouvir(window, 'keyup', e => { const k = TECLAS[e.code]; if (k) this.#teclas.delete(k); });
    this.#ouvir(window, 'blur', () => this.#soltar());
    this.#ouvir(r, 'pointerdown', e => { if (this.#parado || this.#pausado || e.target.closest('button')) return; this.#som.acordar(); this.#dedo = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { r.setPointerCapture(e.pointerId); } catch (_) { /* toque simulado */ } });
    this.#ouvir(r, 'pointermove', e => {
      const d = this.#dedo; if (!d || d.id !== e.pointerId || this.#parado) return;
      // um arrasto de meia tela atravessa a pista
      const k = 9.4 / Math.max(220, Math.min(this.#cena.w, 620)) * 1.35; this.#S.mover((e.clientX - d.x) * k, (d.y - e.clientY) * k); d.x = e.clientX; d.y = e.clientY; this.#mostrar('dica', false);
    });
    const solta = e => { if (this.#dedo?.id === e.pointerId) this.#dedo = null; };
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) this.#ouvir(r, t, solta);
    this.#ouvir(document, 'visibilitychange', () => { if (document.hidden) this.#soltar(); this.#ult = performance.now(); });
  }
  #soltar() { this.#dedo = null; this.#teclas.clear(); }

  // ---------- laço ----------
  #laco = agora => {
    if (!this.#vivo || this.#pausado) return;
    this.#raf = requestAnimationFrame(this.#laco);
    const real = (agora - this.#ult) / 1000, dt = Math.min(.05, Math.max(0, real)); this.#ult = agora;
    if (!this.#parado) {
      const t = this.#teclas, v = 9 * dt; if (t.size) this.#S.mover((t.has('d') - t.has('e')) * v, (t.has('f') - t.has('t')) * v);
      this.#resto += dt; while (this.#resto >= 1 / 60) { this.#S.passo(1 / 60); this.#resto -= 1 / 60; }
      this.#conferirFim(dt); this.#vigiar(real);
    }
    this.#cena.quadro(dt, this.#S);
    if (!this.#parado) this.#hud(dt);
  };
  // se ficar lento, experimenta baixar a qualidade; se não adiantar (aparelho limitado a 30 quadros, por exemplo), volta como estava
  #vigiar(real) {
    const l = this.#lento; if (real > .2 || l.fim) return; l.t += real; l.n++; if (l.t < 3) return;
    const m = l.media = l.t / l.n * 1000; l.t = l.n = 0;
    if (l.antes) { if (m > l.antes * .86) { this.#qual++; this.#cena.ajustar(this.#qual); l.fim = true; } else { this.#p.salvar('ponteZeroQualidade', this.#qual); } l.antes = 0; return; }
    if (m > 23 && this.#qual > 0) { if (++l.ok >= 2) { l.ok = 0; l.antes = m; this.#qual--; this.#cena.ajustar(this.#qual); } } else l.ok = 0;
  }
  #conferirFim(dt) {
    const S = this.#S; if (S.estado === 'jogando') return; if (!this.#fim) { this.#fim = .001; const d = this.#dados; d.melhor = Math.max(d.melhor || 0, S.mortos); if (S.estado === 'vitoria') d.vitorias = (d.vitorias || 0) + 1; this.#p.salvar('ponteZero', d); }
    this.#fim += dt; if (this.#fim < 1.9 || this.#parado) return;
    const venceu = S.estado === 'vitoria'; this.#parado = true; this.#soltar(); this.#cena.noMenu = venceu ? .4 : .15; this.#raiz.querySelector('.pz-hud').hidden = true; this.#raiz.classList.remove('jogando'); this.#mostrar('conta', false); this.#mostrar('dica', false);
    this.#q('selo').textContent = venceu ? 'Trecho concluído' : `Parou em ${Math.floor(S.d)} m de ${S.trecho.comprimento} m`; this.#q('titulo').textContent = venceu ? 'Vocês passaram!' : 'O pelotão caiu'; this.#q('texto').textContent = venceu ? 'O chefe da ponte chega na Fase 4.' : 'Some soldados antes das hordas grandes e use os barris.';
    this.#q('placar').innerHTML = `<div><b>${S.n}</b><span>soldados</span></div><div><b>${S.mortos}</b><span>eliminações</span></div><div><b>${this.#dados.melhor}</b><span>recorde</span></div>`; this.#mostrar('placar', true); this.#q('jogar').textContent = venceu ? 'Jogar de novo' : 'Tentar de novo'; this.#raiz.querySelector('.pz-painel').hidden = false;
  }
  #hud() {
    const S = this.#S, A = ARMAS[S.arma], ant = S.arma ? ARMAS[S.arma - 1].meta : 0, txt = (n, v) => { const e = this.#q(n); if (e.textContent !== v) e.textContent = v; };
    this.#q('caminho').style.transform = `scaleX(${Math.min(1, S.d / S.trecho.comprimento)})`; txt('arma', A.nome); this.#q('evolui').style.transform = `scaleX(${A.meta === Infinity ? 1 : Math.max(0, Math.min(1, (S.mortos - ant) / (A.meta - ant)))})`; txt('mortos', `${S.mortos} eliminações`);
    const c = this.#q('conta'); txt('conta', String(S.n)); const [x, y] = this.#cena.naTela(S.x, 2.3, S.d + S.frente + .5 + Math.sqrt(Math.min(100, S.n)) * .22); c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }
}

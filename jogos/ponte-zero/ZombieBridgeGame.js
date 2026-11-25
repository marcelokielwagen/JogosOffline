// Soldier Survivor — módulo independente (a pasta e as chaves salvas seguem o nome antigo, ponte-zero). Uso:
//   const jogo = new ZombieBridgeGame(plataforma);
//   await jogo.init(container);  jogo.pause();  jogo.resume();  jogo.destroy();
// "plataforma" é a tomada com o pacote de jogos: { carregar, salvar, som, vibrar, somLigado } (tudo opcional).
import { criarSimulacao } from './nucleo/simulacao.js';
import { carregarRecursos, Cena } from './cena/cena.js';
import { criarSom } from './audio/som.js';
import { ARMAS, NIVEIS, CHEFES, DIFICULDADES } from './dados/balanco.js';

const BASE = new URL('./', import.meta.url);
const HTML = `
  <div class="pz-hud" aria-hidden="true" hidden>
    <div class="pz-caminho" data-trilho><i data-caminho></i><u data-marco></u></div>
    <div class="pz-chefe" data-chefe hidden><b data-chefenome></b><em data-etapas hidden></em><div class="pz-vida"><i data-vida></i><s></s><s></s></div></div>
    <div class="pz-arma"><b data-arma></b><span><i data-evolui></i></span><small data-mortos></small><div class="pz-esp" data-esp></div></div>
    <div class="pz-adr" data-adr hidden><b>Adrenalina</b><span><i data-adrk></i></span></div>
  </div>
  <div class="pz-conta" data-conta hidden></div>
  <div class="pz-aviso" data-aviso aria-hidden="true"></div>
  <div class="pz-entrada" data-entrada aria-hidden="true"><b></b><span></span></div>
  <div class="pz-dica" data-dica hidden>Arraste para mover o pelotão</div>
  <div class="so-leitor" role="status" aria-live="polite" data-leitor></div>
  <div class="pz-painel" data-painel>
    <p class="pz-selo" data-selo>Em construção</p>
    <h2 data-titulo>Soldier Survivor</h2>
    <p data-texto>Preparando a ponte…</p>
    <div class="pz-carga"><i data-carga></i></div>
    <div class="pz-placar" data-placar hidden></div>
    <p class="pz-premio" data-premio hidden></p>
    <div class="pz-niveis" data-niveis role="group" aria-label="Escolha o nível" hidden></div>
    <button class="btn principal" data-jogar hidden>Jogar</button>
    <div class="pz-linha"><div class="pz-dif" data-dif role="group" aria-label="Dificuldade" hidden></div><button class="pz-sangue" data-sangue hidden aria-pressed="true">Sangue: <b>ligado</b></button></div>
  </div>`;
// nomes dos veteranos (inventados)
const NOMES = ['Cabo Lima', 'Sgt. Rocha', 'Nina', 'Tadeu', 'Cida', 'Bento', 'Dora', 'Raul', 'Jade', 'Ivo', 'Lola', 'Caco'], MAX_VET = 4;
const CADEADO = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M6 9V6.5a4 4 0 0 1 8 0V9" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="4" y="9" width="12" height="8.5" rx="2" fill="currentColor"/></svg>';

export class ZombieBridgeGame {
  #p; #raiz; #cena; #rec; #som; #S; #raf = 0; #ult = 0; #pausado = false; #parado = true; #fim = 0; #ouvintes = []; #obs; #teclas = new Set(); #dedo = null; #dados; #resto = 0; #lento = { t: 0, n: 0, ok: 0 }; #vivo = false; #qual; #css; #nivel = 0; #espTxt = ''; #vetCaidos = new Set(); #avisou = new Set();

  constructor(plataforma = {}) {
    this.#p = { carregar: (c, d) => d, salvar() {}, som() {}, vibrar() {}, somLigado: () => true, ...plataforma };
  }

  async init(container) {
    if (this.#vivo) throw new Error('jogo já iniciado'); this.#vivo = true;
    this.#css = document.createElement('link'); this.#css.rel = 'stylesheet'; this.#css.href = new URL('jogo.css', BASE).href; const cssPronto = new Promise(ok => { this.#css.onload = this.#css.onerror = ok; }); document.head.append(this.#css); await cssPronto; if (!this.#vivo) return;
    this.#dados = { melhor: 0, jogos: 0, vitorias: 0, sangue: true, aberto: 0, medalhas: {}, estrelas: {}, dif: 0, veteranos: [], ...this.#p.carregar('ponteZero', {}) };
    NIVEIS.forEach((n, i) => { if (this.#dados.medalhas[n.chefe]) this.#dados.aberto = Math.max(this.#dados.aberto, Math.min(NIVEIS.length - 1, i + 1)); });
    this.#nivel = Math.min(this.#dados.nivel ?? this.#dados.aberto, this.#dados.aberto, NIVEIS.length - 1);
    const r = this.#raiz = document.createElement('div'); r.className = 'pz'; r.innerHTML = HTML; container.append(r);
    this.#som = criarSom(() => this.#p.somLigado());
    const celular = matchMedia('(pointer: coarse)').matches; this.#qual = this.#p.carregar('ponteZeroQualidade', celular ? 1 : 2);
    try {
      this.#rec = await carregarRecursos(new URL('recursos/', BASE), f => { if (this.#vivo) this.#q('carga').style.transform = `scaleX(${f})`; });
      if (!this.#vivo) { this.#rec.dispose(); return; }
      this.#cena = new Cena(r, this.#rec, this.#qual); this.#nova(); await this.#cena.preparar();
    } catch (e) { if (!this.#vivo) return; this.#q('texto').textContent = 'Este aparelho não conseguiu abrir o jogo em 3D.'; console.error(e); throw e; }
    if (!this.#vivo) return;
    this.#q('carga').parentElement.hidden = true; this.#mostrar('jogar', true); this.#mostrar('sangue', true); this.#sangue(this.#dados.sangue !== false); this.#menu();
    this.#ouvir(this.#q('jogar'), 'click', () => this.#comecar());
    this.#ouvir(this.#q('niveis'), 'click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; this.#nivel = +b.dataset.n; this.#som.acordar(); this.#nova(); this.#cena.noMenu = true; this.#menu(); });
    this.#ouvir(this.#q('dif'), 'click', e => { const b = e.target.closest('button'); if (!b) return; this.#dados.dif = +b.dataset.n; this.#salvar(); this.#difs(); });
    this.#ouvir(this.#q('sangue'), 'click', () => { this.#dados.sangue = this.#dados.sangue === false; this.#salvar(); this.#sangue(this.#dados.sangue); });
    this.#controles();
    this.#obs = new ResizeObserver(() => { if (this.#cena) { this.#cena.medir(); this.#cena.quadro(0, this.#S); } }); this.#obs.observe(r);
    this.#ult = performance.now(); this.#raf = requestAnimationFrame(this.#laco);
  }
  pause() { if (!this.#vivo || this.#pausado) return; this.#pausado = true; cancelAnimationFrame(this.#raf); this.#soltar(); this.#som?.pausar(true); }
  resume() { if (!this.#vivo || !this.#pausado) return; this.#pausado = false; this.#som?.pausar(false); this.#ult = performance.now(); if (this.#cena) this.#raf = requestAnimationFrame(this.#laco); }
  destroy() {
    if (!this.#vivo) return null; this.#vivo = false; cancelAnimationFrame(this.#raf); this.#obs?.disconnect();
    for (const [a, t, f, o] of this.#ouvintes) a.removeEventListener(t, f, o); this.#ouvintes = [];
    this.#som?.dispose(); this.#rec?.dispose(); this.#cena?.dispose(); this.#raiz?.remove(); this.#css?.remove(); const restou = this.#cena?.restou || null; this.#cena = this.#rec = this.#S = null; return restou;
  }
  // para testes e para o pacote mostrar informações
  get info() { const S = this.#S, i = this.#cena?.R?.info, c = S?.chefe; return S && { nivel: this.#nivel + 1, estado: S.estado, luta: S.luta, d: S.d, n: S.n, esp: S.esp, arma: S.arma, mortos: S.mortos, chefe: c && { vida: c.vida, max: c.max, d: c.d - S.d, estado: c.estado, golpe: c.golpe, fase: c.fase, marcas: S.marcas.length, meio: c.meio, etapa: c.etapa, id: c.id }, zumbis: S.zumbis.length, tiros: S.tiros.length, chamadas: i.render.calls, triangulos: i.render.triangles, memoria: { ...i.memory }, qualidade: this.#qual, jogando: !this.#parado, quadroMs: this.#lento.media }; }
  // avança o jogo na marra (testes): segundos de jogo, com piloto opcional
  avancar(seg, piloto) { for (let t = 0; t < seg; t += 1 / 60) { piloto?.(this.#S); this.#S.passo(1 / 60); this.#cena.camera(1 / 60, this.#S); this.#cena.fx.atualizar(1 / 60, this.#S); this.#cena.atualizarChefes(1 / 60, this.#S); this.#cena.portoes.atualizar(1 / 60, t, this.#S.d); const E = this.#cena.espera; for (let i = E.length - 1; i >= 0; i--) if ((E[i][0] -= 1 / 60) <= 0) E.splice(i, 1)[0][1](); } this.#cena.quadro(1 / 60, this.#S); this.#hud(1); this.#conferirFim(0); }
  get sim() { return this.#S; }
  escolher(n) { this.#nivel = n; this.#nova(); this.#menu(); }
  comecar() { this.#comecar(); }
  get cena() { return this.#cena; }
  get somInterno() { return this.#som; }
  // mede o custo real de desenhar um quadro (ms), esperando a placa de vídeo terminar
  medir(n = 30) { const gl = this.#cena.R.getContext(), px = new Uint8Array(4), um = () => { this.#cena.quadro(1 / 60, this.#S); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }; um(); const t = performance.now(); for (let i = 0; i < n; i++) um(); return (performance.now() - t) / n; }

  #q(n) { return this.#raiz.querySelector(`[data-${n}]`); }
  #mostrar(n, v) { this.#q(n).hidden = !v; }
  #ouvir(a, t, f, o) { a.addEventListener(t, f, o); this.#ouvintes.push([a, t, f, o]); }
  #salvar() { this.#p.salvar('ponteZero', this.#dados); }
  #sangue(v) { this.#q('sangue').setAttribute('aria-pressed', v); this.#q('sangue').querySelector('b').textContent = v ? 'ligado' : 'desligado'; const c = this.#cena; c.fx.sangueLigado(v); for (const m of [c.zum, c.gor]) m.mat.userData.u.uSangue.value = v ? 1 : 0; }

  // prêmios dos chefes já vencidos valem em toda partida
  #melhorias() { const r = { soldados: 0, dano: 0, cadencia: 0, bazuca: 0, chamas: 0, metralhadora: 0 }; for (const id in this.#dados.medalhas) { const p = CHEFES[id]?.premio || {}; for (const k in r) r[k] += p[k] || 0; } r.vets = this.#dados.veteranos.filter(v => !v.fora).map(v => v.nome); return r; }
  #nova() { this.#vetCaidos.clear(); this.#avisou.clear(); this.#S = criarSimulacao(NIVEIS[this.#nivel], { aoEvento: (n, d) => this.#evento(n, d), melhorias: this.#melhorias(), dif: DIFICULDADES[this.#dados.dif] || DIFICULDADES[0], maxZumbis: this.#qual > 1 ? 220 : this.#qual ? 150 : 100, maxSoldados: this.#qual > 1 ? 100 : 52 }); this.#cena.novaPartida(this.#S); this.#fim = 0; this.#resto = 0; }
  #menu() {
    const N = NIVEIS[this.#nivel], C = CHEFES[N.chefe], d = this.#dados; this.#q('selo').textContent = `Nível ${this.#nivel + 1} · ${N.nome}`; this.#q('titulo').textContent = 'Soldier Survivor'; this.#texto(N, C); this.#q('jogar').textContent = 'Jogar'; this.#q('painel').classList.remove('fim'); this.#mostrar('placar', false); this.#mostrar('premio', false); this.#niveis();
  }
  #difs() { const d = this.#dados; this.#mostrar('dif', true); this.#q('dif').innerHTML = DIFICULDADES.map((x, i) => `<button data-n="${i}" aria-pressed="${i === d.dif}">${x.nome}</button>`).join(''); }
  #estrela(id) { const d = this.#dados; return d.estrelas[id] || (d.medalhas[id] ? 1 : 0); }
  #texto(N, C) { const f = this.#dados.veteranos.filter(v => !v.fora).length; this.#q('texto').innerHTML = `<b class="pz-novo">${N.novo}</b>${CHEFES[N.meio.id].nome} no meio e ${C.nome} no fim.${f ? ` ${f > 1 ? f + ' veteranos vão' : 'Um veterano vai'} com você.` : ''}`; }
  #niveis() { const d = this.#dados; this.#difs(); this.#mostrar('niveis', true); this.#q('niveis').innerHTML = NIVEIS.map((n, i) => { const ab = i <= d.aberto, me = this.#estrela(n.chefe); return `<button data-n="${i}" ${ab ? '' : 'disabled'} aria-pressed="${i === this.#nivel}" aria-label="Nível ${i + 1}, ${n.nome}${ab ? me ? `, vencido no ${DIFICULDADES[me - 1].nome}` : '' : ', bloqueado'}"><b>${ab ? i + 1 : CADEADO}</b><span>${n.nome}</span>${me ? `<i>${'★'.repeat(me)}</i>` : ''}</button>`; }).join(''); }
  #comecar() {
    for (const n of ['entrada', 'aviso']) this.#q(n).getAnimations().forEach(a => a.cancel()); this.#som.acordar(); this.#nova(); this.#som.musica('acao');
    this.#parado = false; this.#cena.noMenu = false; this.#dados.jogos++; this.#dados.nivel = this.#nivel; this.#salvar(); this.#mostrar('painel', false); this.#raiz.querySelector('.pz-hud').hidden = false; this.#mostrar('trilho', true); this.#mostrar('chefe', false); this.#q('marco').style.left = `${this.#S.trecho.meio.d / this.#S.trecho.comprimento * 100}%`; this.#mostrar('adr', !!this.#S.trecho.adrenalina); this.#mostrar('conta', true); this.#mostrar('dica', true); this.#raiz.classList.add('jogando'); this.#q('jogar').blur();
  }
  #evento(n, d) {
    if (!this.#cena) return; const S = this.#S;
    this.#cena.evento(n, d);
    if (n === 'tiro') { this.#som.tiro(d.arma, S.n, d.s.x / 6); return; }
    this.#som.evento(n, d);
    switch (n) {
      case 'portao': { const l = d.l; this.#p.vibrar(d.bom ? 25 : 60); if (l.tipo === 'especial') this.#avisar(`+${l.v} ${l.v > 1 ? ARMAS[l.arma].plural : ARMAS[l.arma].nome}`, true); else if (l.tipo === 'cadencia') this.#avisar(`Cadência +${l.v}%`, true); else if (l.tipo !== 'arma') this.#avisar(d.q >= 0 ? `+${d.q}` : `−${-d.q}`, d.bom); break; }
      case 'arma': this.#avisar(d.arma.nome, true); this.#p.vibrar(40); break;
      case 'cadencia': this.#avisar('Cadência +15%', true); break;
      case 'virou': this.#avisar('Portão virou!', true); break;
      case 'reforco': this.#avisar(`Reforço +${d.q}`, true); this.#p.vibrar(40); break;
      case 'resgate': this.#avisar(`Resgatados +${d.q}`, true); this.#p.vibrar(40); break;
      case 'caixa': this.#p.vibrar(40); if (d.l.tipo === 'especial') this.#avisar(`+${d.l.v} ${d.l.v > 1 ? ARMAS[d.l.arma].plural : ARMAS[d.l.arma].nome}`, true); break;
      case 'premioMeio': { const l = d.l; setTimeout(() => { if (this.#vivo && this.#S === S) this.#avisar(l.tipo === 'especial' ? `Prêmio: +${l.v} ${l.v > 1 ? ARMAS[l.arma].plural : ARMAS[l.arma].nome}` : `Prêmio: +${d.q} soldados`, true); }, 900); break; }
      case 'meioFim': this.#mostrar('chefe', false); this.#mostrar('trilho', true); break;
      case 'adrenalina': this.#avisar('Adrenalina!', true); this.#p.vibrar(50); break;
      case 'etapa': this.#avisar(`Etapa ${d.etapa + 1} de ${d.T.etapas}`, false); this.#p.vibrar(120); break;
      case 'hidrante': this.#avisar('Esfriou: atire!', true); this.#p.vibrar(40); break;
      case 'mergulhou': this.#uma('mergulho', 'Ela vem pela lateral!'); break;
      case 'hidranteSurge': this.#uma('hid', 'Atire nos hidrantes!', true); break;
      case 'lateral': this.#uma('lateral', 'Pelas laterais!'); break;
      case 'carroVoa': this.#uma('carro', 'Exploda os carros!'); break;
      case 'marca': if (d.vao) this.#uma('vao', 'A ponte vai cair!'); break;
      case 'vetCaiu': this.#vetCaidos.add(d.vet); this.#avisar(`${d.vet} caiu!`, false); break;
      case 'atordoado': this.#avisar('Atordoados!', false); break;
      case 'soldado': this.#p.vibrar(15); break;
      case 'barril': this.#p.vibrar(60); break;
      case 'golpe': if (d.dentro) this.#p.vibrar(80); break;
      case 'placaCaiu': this.#avisar('Placa solta!', true); this.#p.vibrar(40); break;
      case 'fase': this.#avisar('Ele ficou furioso!', false); break;
      case 'chefeEntra': this.#mostrar('trilho', false); this.#mostrar('dica', false); if (!d.meio) this.#som.musica('chefe'); break;
      case 'chefePousa': { this.#p.vibrar(120); this.#q('chefenome').textContent = d.T.nome; this.#q('chefe').classList.toggle('meio', d.meio); this.#q('chefe').classList.toggle('etapas', !!d.T.etapas); this.#mostrar('etapas', !!d.T.etapas); this.#mostrar('chefe', true); const e = this.#q('entrada'); e.querySelector('b').textContent = d.T.nome; e.querySelector('span').textContent = d.T.lema; e.getAnimations().forEach(a => a.cancel()); e.animate([{ opacity: 0, transform: 'translate(-50%, -50%) scale(1.25)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: .16 }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: .78 }, { opacity: 0, transform: 'translate(-50%, -58%) scale(1)' }], { duration: 2100, fill: 'both', easing: 'ease-out' }); e.classList.toggle('meio', d.meio); this.#q('leitor').textContent = `${d.meio ? 'Meio-chefe' : 'Chefe'}: ${d.T.nome}`; break; }
      case 'chefeMorre': this.#avisar(`${d.T.nome} caiu!`, true); this.#p.vibrar(200); if (!d.meio) this.#som.musica(null); break;
      case 'derrota': this.#som.musica(null); break;
    }
  }
  #uma(id, t, bom = false) { if (!this.#avisou.has(id)) { this.#avisou.add(id); this.#avisar(t, bom); } }
  #avisar(t, bom) { const e = this.#q('aviso'); e.textContent = t; e.className = 'pz-aviso ' + (bom ? 'bom' : 'ruim') + (t.length > 18 ? ' longo' : ''); e.getAnimations().forEach(a => a.cancel()); e.animate([{ transform: 'translate(-50%, 12px) scale(.7)', opacity: 0 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: .18 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: .7 }, { transform: 'translate(-50%, -22px) scale(1)', opacity: 0 }], { duration: 1100, fill: 'both', easing: 'ease-out' }); this.#q('leitor').textContent = t; }

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
    this.#cena.quadro(dt, this.#S); this.#som.atualizar(this.#S, this.#parado);
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
    const S = this.#S, d = this.#dados; if (S.estado === 'jogando') return; const venceu = S.estado === 'vitoria';
    if (!this.#fim) {
      this.#fim = .001; d.melhor = Math.max(d.melhor || 0, S.mortos); this.premioNovo = false; if (venceu) { d.vitorias = (d.vitorias || 0) + 1; const id = S.trecho.chefe; this.premioNovo = !d.medalhas[id]; d.medalhas = { ...d.medalhas, [id]: true }; d.estrelas = { ...d.estrelas, [id]: Math.max(d.estrelas[id] || 0, d.dif + 1) }; d.aberto = Math.max(d.aberto, Math.min(NIVEIS.length - 1, this.#nivel + 1)); }
      // veteranos: quem caiu descansa uma partida; a cada vitória um sobrevivente ganha nome
      this.vetNovo = ''; for (const v of d.veteranos) { if (v.fora) v.fora--; else if (venceu) { if (this.#vetCaidos.has(v.nome)) v.fora = 1; else v.vitorias++; } }
      if (venceu && d.veteranos.length < MAX_VET) { const livres = NOMES.filter(n => !d.veteranos.some(v => v.nome === n)), nome = livres[Math.floor(Math.random() * livres.length)]; d.veteranos = [...d.veteranos, { nome, vitorias: 1, fora: 0 }]; this.vetNovo = nome; }
      this.#salvar();
    }
    this.#fim += dt; if (this.#fim < (venceu ? 2.6 : 1.9) || this.#parado) return;
    const N = S.trecho, C = CHEFES[N.chefe], ultimo = this.#nivel === NIVEIS.length - 1;
    this.#parado = true; this.#soltar(); this.#cena.noMenu = venceu ? .4 : .15; this.#raiz.querySelector('.pz-hud').hidden = true; this.#raiz.classList.remove('jogando'); this.#mostrar('conta', false); this.#mostrar('dica', false); const A = S.chefe ? S.chefe.T : C;
    this.#q('selo').textContent = venceu ? `Nível ${this.#nivel + 1} concluído · ${DIFICULDADES[d.dif].nome}` : S.luta ? `${A.nome} ainda tinha ${Math.max(1, Math.round(S.chefe.vida / S.chefe.max * 100))}% de vida` : `Parou em ${Math.floor(S.d)} m de ${N.comprimento} m`;
    this.#q('titulo').textContent = venceu ? `${C.nome} caiu!` : 'O pelotão caiu'; this.#q('texto').textContent = venceu ? ultimo ? 'Você venceu todos os chefes. Tente uma dificuldade maior.' : `Próxima parada: ${NIVEIS[this.#nivel + 1].nome}. ${NIVEIS[this.#nivel + 1].novo}.` : S.luta ? 'Saia das marcas no chão e pegue as caixas verdes de reforço.' : 'Some soldados antes das hordas grandes e use os barris.';
    this.#q('placar').innerHTML = `<div><b>${S.n}</b><span>soldados</span></div><div><b>${S.mortos}</b><span>eliminações</span></div><div><b>${d.melhor}</b><span>recorde</span></div>`; this.#mostrar('placar', true);
    this.#q('premio').textContent = [venceu && this.premioNovo && `Prêmio: ${C.premio.texto}`, this.vetNovo && `${this.vetNovo} virou veterano`].filter(Boolean).join(' · '); this.#mostrar('premio', venceu && (this.premioNovo || !!this.vetNovo));
    this.#q('painel').classList.add('fim'); if (venceu && !ultimo) this.#nivel++; this.#niveis(); this.#q('jogar').textContent = venceu ? ultimo ? 'Jogar de novo' : 'Próximo nível' : 'Tentar de novo'; this.#mostrar('painel', true);
  }
  #hud() {
    const S = this.#S, A = ARMAS[S.arma], ant = S.arma ? ARMAS[S.arma - 1].meta : 0, txt = (n, v) => { const e = this.#q(n); if (e.textContent !== v) e.textContent = v; };
    this.#q('caminho').style.transform = `scaleX(${Math.min(1, S.d / S.trecho.comprimento)})`; txt('arma', A.nome); this.#q('evolui').style.transform = `scaleX(${A.meta === Infinity ? 1 : Math.max(0, Math.min(1, (S.mortos - ant) / (A.meta - ant)))})`; txt('mortos', `${S.mortos} eliminações`);
    let e = ''; if (S.esp) { const q = {}; for (const s of S.soldados) if (s.arma) q[s.arma] = (q[s.arma] || 0) + 1; for (const k in q) e += `<span class="e${k}">${q[k]} ${q[k] > 1 ? ARMAS[k].plural : ARMAS[k].nome}</span>`; } if (e !== this.#espTxt) { this.#espTxt = e; this.#q('esp').innerHTML = e; }
    if (S.chefe) { this.#q('vida').style.transform = `scaleX(${S.chefe.vida / S.chefe.max})`; if (S.chefe.T.etapas) txt('etapas', '●'.repeat(S.chefe.T.etapas - S.chefe.etapa) + '○'.repeat(S.chefe.etapa)); this.#q('vida').classList.toggle('frio', S.chefe.frio > 0); this.#q('vida').classList.toggle('duro', !!S.chefe.T.quente && S.chefe.frio <= 0); }
    if (S.trecho.adrenalina) { const a = this.#q('adr'); this.#q('adrk').style.transform = `scaleX(${S.adrT > 0 ? S.adrT / 5 : S.adr})`; a.classList.toggle('ativa', S.adrT > 0); }
    const c = this.#q('conta'); txt('conta', String(S.n)); const [x, y] = this.#cena.naTela(S.x, 2.1, S.d + S.frente + .5 + Math.sqrt(Math.min(100, S.n)) * .22); c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }
}

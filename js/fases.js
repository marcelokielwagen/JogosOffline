// Temas com 10 fases, usado pelas Palavras Cruzadas e pelo Caça-Palavras.
// prog = { tema: { 1: { e: estrelas, t: tempo }, ... } }. Cada fase vencida abre a seguinte.
import { CLIMA, cenarioDe } from './cenarios3d.js';
import { PELES } from './tabuleiro3d.js';
export const TOTAL = 10;
export const relogio = x => String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
export const estrelas = n => '★'.repeat(n) + '☆'.repeat(3 - n);

export function criarFases({ prog, grupos, lista, sons, aoJogar, continuar, depois, aoMudar }) {
  let tema = null;
  const feitas = t => Object.keys(prog[t] || {}).length;
  const somaE = t => Object.values(prog[t] || {}).reduce((a, x) => a + x.e, 0);
  const liberada = (t, n) => n === 1 || !!(prog[t] && prog[t][n - 1]);
  const proxima = t => { for (let n = 1; n <= TOTAL; n++) if (!(prog[t] && prog[t][n])) return n; return TOTAL; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const cores = t => { const c = CLIMA[cenarioDe(t)] || CLIMA.cores; return `--c1:${c[0]};--c2:${c[1]}`; };

  // ---------- Tela 1: temas ----------
  function temas() {
    tema = null; lista.innerHTML = ''; lista.className = 'lista';
    const total = Object.values(grupos).flat().length * TOTAL, ok = Object.values(grupos).flat().reduce((a, t) => a + feitas(t), 0);
    lista.appendChild(el('p', 'resumo', `Escolha um tema. Cada um tem ${TOTAL} fases. <b>${ok} de ${total}</b> vencidas.`));
    const c = continuar && continuar();
    if (c) { const b = el('button', 'cartao3d largo', `<b>▶ Continuar</b><span>${c.texto}</span>`); b.style.cssText = cores(c.tema); b.addEventListener('click', () => { sons.abreFase(); c.abrir(); }); lista.appendChild(b); }
    for (const g in grupos) {
      lista.appendChild(el('h2', 'cat', g));
      for (const t of grupos[g]) {
        const n = feitas(t), b = el('button', 'cartao3d' + (n >= TOTAL ? ' completo' : ''), `<b>${t}</b><span>${n >= TOTAL ? '🏆 Tema completo' : n ? `Fase ${proxima(t)} · ${somaE(t)} ★` : 'Começar'}</span><i class="pontos">${Array.from({ length: TOTAL }, (_, k) => `<u class="${prog[t] && prog[t][k + 1] ? 'on' : ''}"></u>`).join('')}</i>`);
        b.style.cssText = cores(t); b.addEventListener('click', () => { sons.toque(); fases(t); }); lista.appendChild(b);
      }
    }
    if (depois) depois(lista);
    if (aoMudar) aoMudar(null);
  }

  // ---------- Tela 2: as 10 fases do tema ----------
  function fases(t) {
    tema = t; lista.innerHTML = ''; lista.className = 'lista tela-fases'; window.scrollTo(0, 0);
    const cab = el('div', 'cab-fases', `<b>${t}</b><span>${feitas(t)} de ${TOTAL} fases · ${somaE(t)} de ${TOTAL * 3} ★</span>`); cab.style.cssText = cores(t); lista.appendChild(cab);
    const px = proxima(t), grade = el('div', 'grade-fases'); lista.appendChild(grade);
    for (let n = 1; n <= TOTAL; n++) {
      const p = PELES[n - 1], f = prog[t] && prog[t][n], aberta = liberada(t, n);
      const b = el('button', 'fase' + (aberta ? '' : ' tranca') + (f ? ' feita' : '') + (n === px && aberta && !f ? ' vez' : ''), `<b>${aberta ? n : '🔒'}</b><span>${p.nome}</span><small>${f ? estrelas(f.e) : aberta ? 'Jogar' : 'Vença a ' + (n - 1)}</small>`);
      b.style.cssText = `--cor:${p.cor};--lado:${p.base};--tinta:${p.tinta}`; b.dataset.fase = n;
      b.addEventListener('click', () => { if (!aberta) { sons.trancado(); b.animate([{ translate: '0' }, { translate: '-5px' }, { translate: '5px' }, { translate: '0' }], 200); return; } sons.abreFase(); aoJogar(t, n); });
      grade.appendChild(b);
    }
    if (aoMudar) aoMudar(t);
  }

  // ---------- Fim da fase ----------
  function venceu(t, n, e, tempo) {
    const antes = prog[t] && prog[t][n], completo = feitas(t) >= TOTAL;
    (prog[t] = prog[t] || {})[n] = { e: Math.max(e, antes ? antes.e : 0), t: antes ? Math.min(antes.t, tempo) : tempo };
    return { fechou: !completo && feitas(t) >= TOTAL, recorde: !antes || tempo < antes.t };
  }
  return { temas, fases, venceu, feitas, proxima, liberada, get tema() { return tema; } };
}

// Janela do fim da fase: mostra as estrelas e pula sozinha para a próxima.
export function janelaVitoria(d, { tema, fase, e, texto, fechou, proxima, verFases }) {
  let t = null, conta = 5; const ultima = fase >= TOTAL, fim = () => { clearInterval(t); t = null; if (d.open) d.close(); };
  d.innerHTML = `<h2>${fechou ? '🏆 Tema completo!' : `Fase ${fase} vencida!`}</h2><p class="grandes-estrelas">${[0, 1, 2].map(k => `<i class="${k < e ? 'on' : ''}" style="animation-delay:${.15 + k * .18}s">★</i>`).join('')}</p><p>${texto}</p>` +
    `<button class="btn principal" data-prox>${ultima ? 'Escolher outro tema' : `Fase ${fase + 1} ▶ <small></small>`}</button><button class="btn discreto" data-ver>Ver fases</button>`;
  const peq = d.querySelector('small');
  d.querySelector('[data-prox]').onclick = () => { fim(); proxima(); };
  d.querySelector('[data-ver]').onclick = () => { fim(); verFases(); };
  d.oncancel = ev => { ev.preventDefault(); fim(); verFases(); };
  d.showModal();
  if (!ultima) { const mostra = () => peq.textContent = `(${conta})`; mostra(); t = setInterval(() => { if (!d.open) return clearInterval(t); if (document.hidden) return; if (--conta <= 0) { fim(); proxima(); } else mostra(); }, 1000); }
}

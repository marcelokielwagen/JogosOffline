// Resolvedor do Nascente: conta soluções e mede a dificuldade usando as mesmas regras do jogo (trecho <regras>).
import { readFileSync } from 'node:fs';
const AQUI = new URL('.', import.meta.url);
const HTML = new URL('../../jogos/nascente/index.html', import.meta.url);
// Carrega as regras; fases = lista de fases (ou undefined para ler as do jogo)
export function regras(fases, { doJogo = false } = {}) {
  let txt = readFileSync(new URL('regras.js', AQUI), 'utf8'), dados = 'const FASES = __f;';
  if (doJogo) { const h = readFileSync(HTML, 'utf8'); txt = h.slice(h.indexOf('// <regras>'), h.indexOf('// </regras>')); if (!fases) dados = h.slice(h.indexOf('// <fases>'), h.indexOf('// </fases>')); }
  const sorteador = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  return new Function('__f', 'sorteador', dados + '\n' + txt + '\nreturn { FASES, DX, DZ, TIPOS, SIMBOLOS, lerFase, correr, completa, venceu, vazamentos, ligado, vizinho, ladosDe, temLado, assinatura, passosDe, giroMais, giroDe, certa };')(fases, sorteador);
}

// quem está num lado de uma casa
function coluna(F, c, lado, N) { const x = c.x + N.DX[lado], z = c.z + N.DZ[lado], r = []; if (x < 0 || z < 0 || x >= F.larg || z >= F.prof) return r; for (let a = F.andares - 1; a >= 0; a--) { const v = F.grade[(a * F.prof + z) * F.larg + x]; if (v) r.push(v); } return r; }
// peça de cima para baixo que recebe a água de c pelo lado
const alvo = (F, c, lado, N) => coluna(F, c, lado, N).find(v => v.h <= c.h) || null;
// peças que poderiam mandar água para c por este lado
function fontes(F, c, lado, N) {
  const placa = F.larg * F.prof;
  if (lado === 4) { const u = F.grade[c.i + placa]; return u && u.desce ? [u] : []; }
  if (lado === 5) { const u = F.grade[c.i - placa]; return u && u.sobe ? [u] : []; }
  return coluna(F, c, lado, N).filter(u => u.h >= c.h && alvo(F, u, (lado + 2) % 4, N) === c);
}
const opcoes = (u, N) => { // posições distintas de uma unidade
  const ps = N.passosDe(u.membros[0]); if (u.membros[0].fixa) return [u.membros[0].tipo === 'comporta' ? 0 : 0];
  const vistos = new Set(), r = []; for (const p of ps) { const k = u.membros.map(m => N.assinatura(m.tipo, N.giroMais(m, p))).join('/'); if (!vistos.has(k)) { vistos.add(k); r.push(p); } } return r;
};

/* MÉDIO: conta soluções mínimas (caminhos de cada destino até uma nascente, vazamentos permitidos), de trás para a frente.
   Devolve { solucoes, passos } (passos = tamanho da busca, usado como medida de becos falsos). */
export function contarMedio(F, N, { teto = 6, limite = 60000 } = {}) {
  const opc = new Map(F.unidades.map(u => [u, opcoes(u, N)])), pos = new Map(), agua = new Map(), achadas = new Set(); let passos = 0, fim = false;
  const tarefas = []; for (const c of F.celulas) if (c.destino) for (const w of [1, 2]) if (c.pede & w) tarefas.push([c, w]);
  const poe = (u, p) => { pos.set(u, p); for (const m of u.membros) m.giro = N.giroMais(m, p); };
  const fechar = () => {
    for (const c of F.celulas) c.girando = !c.lugar && !pos.has(c.unidade);
    N.correr(F); const ok = N.completa(F); for (const c of F.celulas) c.girando = false;
    if (ok) { const usados = new Set(); for (const c of F.celulas) if (!c.lugar && c.nos.some(n => agua.get(n))) usados.add(c.i + ':' + N.assinatura(c.tipo, c.giro)); achadas.add([...usados].sort().join(' ')); if (achadas.size >= teto) fim = true; }
  };
  const proxima = k => { if (k === tarefas.length) return fechar(); const [d, w] = tarefas[k]; sobe(d.nos[0], N.ladosDe(d.nos[0]), w, new Set([d.nos[0]]), () => proxima(k + 1)); };
  // procura a origem da água w do nó n, entrando por um dos lados
  function sobe(n, lados, w, via, depois) {
    if (fim || ++passos > limite) { fim = true; return; }
    for (const lado of lados) for (const u of fontes(F, n.c, lado, N)) {
      if (u.destino) continue;
      const volta = lado > 3 ? 9 - lado : (lado + 2) % 4;
      const tenta = un => {
        if (via.has(un)) return;
        const tinha = agua.get(un) || 0;
        if (u.tipo === 'nascente') { if (u.agua === w) marca(() => depois()); return; }
        if (tinha & w) { marca(() => depois()); return; }
        via.add(un); sobe(un, N.ladosDe(un).filter(l => l !== volta), w, via, depois); via.delete(un);
      };
      const marca = f => { const feito = []; for (const v of via) { const a = agua.get(v) || 0; if (!(a & w)) { agua.set(v, a | w); feito.push([v, a]); } } f(); for (const [v, a] of feito) agua.set(v, a); };
      if (u.lugar) { if (N.temLado(u.nos[0], volta)) tenta(u.nos[0]); continue; }
      const livre = !pos.has(u.unidade);
      for (const p of livre ? opc.get(u.unidade) : [pos.get(u.unidade)]) {
        if (livre) poe(u.unidade, p);
        const un = u.nos.find(x => N.temLado(x, volta)); if (un) tenta(un);
        if (livre) pos.delete(u.unidade); if (fim) return;
      }
    }
  }
  proxima(0);
  return { solucoes: achadas.size, passos };
}

/* DIFÍCIL: conta configurações molhadas sem vazamento, da nascente para a frente. */
export function contarDificil(F, N, { teto = 4, limite = 120000 } = {}) {
  const opc = new Map(F.unidades.map(u => [u, opcoes(u, N)])), pos = new Map(), achadas = new Set(); let passos = 0, fim = false;
  const poe = (u, p) => { pos.set(u, p); for (const m of u.membros) m.giro = N.giroMais(m, p); };
  const busca = fila => {
    if (fim || ++passos > limite) { fim = true; return; }
    for (const c of F.celulas) c.girando = false;
    // molha o que já está decidido e acha a primeira ponta indecisa
    const molh = new Set(), q = []; for (const c of F.celulas) if (c.tipo === 'nascente') { molh.add(c.nos[0]); q.push(c.nos[0]); }
    let aberta = null;
    for (let k = 0; k < q.length; k++) {
      const n = q[k]; if (n.c.destino) continue;
      for (const l of N.ladosDe(n)) {
        const volta = l > 3 ? 9 - l : (l + 2) % 4, placa = F.larg * F.prof;
        const v = l === 4 ? (n.c.sobe ? F.grade[n.c.i + placa] : null) : l === 5 ? (n.c.desce ? F.grade[n.c.i - placa] : null) : alvo(F, n.c, l, N);
        if (v) {
          if (!v.lugar && !pos.has(v.unidade)) { aberta ||= [v]; continue; }
          const m = v.nos.find(x => N.temLado(x, volta)); if (m) { if (v.tipo !== 'nascente' && !molh.has(m)) { molh.add(m); q.push(m); } continue; }
        }
        const altas = fontes(F, n.c, l, N).filter(u => u !== v && !u.lugar && !pos.has(u.unidade)); if (altas.length) { aberta ||= [altas[0]]; continue; }
        if (N.ligado(F, n, l)) continue;
        return;                                                  // vaza: ramo morto
      }
    }
    if (!aberta) {
      for (const c of F.celulas) c.girando = !c.lugar && !pos.has(c.unidade);
      N.correr(F); const ok = N.completa(F); for (const c of F.celulas) c.girando = false;
      if (ok) { achadas.add(F.celulas.filter(c => !c.lugar && c.nos.some(n => n.alcance)).map(c => c.i + ':' + N.assinatura(c.tipo, c.giro)).join(' ')); if (achadas.size >= teto) fim = true; }
      return;
    }
    const u = aberta[0].unidade; for (const p of opc.get(u)) { poe(u, p); busca(); pos.delete(u); if (fim) return; }
  };
  busca();
  return { solucoes: achadas.size, passos };
}

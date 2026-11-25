// Gerador das 100 fases do Nascente. Uso: node gerar.mjs [mundo 1..10] [tentativas por fase]
// Grava cada mundo em fases/mundoN.json; "node gravar.mjs" põe tudo dentro do jogo.
import { writeFileSync, mkdirSync } from 'node:fs';
import { regras, contarMedio, contarDificil } from './resolvedor.mjs';
const DX = [0, 1, 0, -1], DZ = [-1, 0, 1, 0];
const caixaFases = []; const N = regras(caixaFases);
let semente = 1; const S = () => { semente |= 0; semente = semente + 0x6D2B79F5 | 0; let t = Math.imul(semente ^ semente >>> 15, 1 | semente); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ate = n => S() * n | 0, sorteia = l => l[ate(l.length)], entre = (a, b) => a + ate(b - a + 1);
const mistura = l => { for (let i = l.length - 1; i > 0; i--) { const j = ate(i + 1); [l[i], l[j]] = [l[j], l[i]]; } return l; };

// O que cada mundo usa. cruza: gosto por sifões/gêmeas; emp: eixos emperrados; irm: irmãs; comp: comportas; anda: forma do andar alto; vert: elos; t: segunda água; mix: mistura
const MUNDOS = [
  { relevo: ['encosta', 'plano', 'degraus'], cruza: 0, fixas: 2 },
  { relevo: ['plano', 'encosta', 'plano'], cruza: .9, fixas: 1 },
  { relevo: ['arrozal', 'degraus'], cruza: .35, emp: [2, 7], fixas: 1 },
  { relevo: ['canion'], cruza: .25, anda: 'ponte', emp: [0, 2], fixas: 0 },
  { relevo: ['plano', 'duna'], cruza: .3, anda: 'ilhas', vert: [1, 3], fixas: 0 },
  { relevo: ['plano', 'degraus'], cruza: .45, irm: [1, 4], emp: [0, 3], fixas: 0 },
  { relevo: ['encosta', 'degraus'], cruza: .6, t: true, irm: [0, 2], fixas: 0 },
  { relevo: ['plano', 'encosta'], cruza: .6, comp: [1, 3], irm: [0, 2], anda: 'ilhas', andaDe: 6, vert: [1, 2], fixas: 0 },
  { relevo: ['arrozal', 'encosta'], cruza: .5, t: true, mix: [1, 2], comp: [0, 2], emp: [0, 3], fixas: 0 },
  { relevo: ['plano', 'canion'], cruza: .6, t: true, mix: [0, 2], anda: 'ilhas', vert: [1, 3], irm: [0, 2], comp: [0, 1], fixas: 0 },
];
// tamanho e quantidade de destinos por fase: cresce dentro do mundo e entre mundos (o começo do mundo seguinte é mais leve)
function medidas(m, f) {
  const M = MUNDOS[m], k = m * 3.1 + f * 2.5, area = Math.min(72, 30 + k * .98) * (M.anda ? .82 : 1);
  let L = 5; while (L < 8 && L * Math.round(area / L) / L > L * 1.34) L++;
  const P = Math.max(L, Math.min(9, Math.round(area / L)));
  return { L, P, dest: Math.max(3, Math.min(10, Math.round(3 + k * .125 + (S() - .5)))), nasc: Math.max(1, Math.min(4, Math.round(1.1 + k * .05 + (S() - .5) * .5))) };
}
function relevo(tipo, L, P) {
  const h = [], fase = S() * 6, dir = S() < .5 ? 1 : -1, n = 2 + ate(2);
  for (let z = 0; z < P; z++) for (let x = 0; x < L; x++) {
    let y = 0; const u = x / (L - 1) - .5, v = z / (P - 1);
    if (tipo === 'encosta') y = (1 - v) * n + u * dir * .9 + Math.sin(x * 1.3 + fase) * .25;
    if (tipo === 'degraus') y = (1 - v + u * dir * 1.2) * n * .9 + .2;
    if (tipo === 'arrozal') y = (1 - v) * 4 + Math.sin(u * 4 + fase) * .55;
    if (tipo === 'duna') y = .5 + .75 * Math.sin(x * .9 + fase) * Math.cos(z * .7 + fase);
    if (tipo === 'canion') { const b = Math.sin(z * .8 + fase) > .55 ? 1 : 0; y = x < 1 + (dir > 0 ? b : 0) || x >= L - 1 - (dir < 0 ? b : 0) ? 2 : 0; }
    h.push(Math.max(0, Math.min(4, Math.round(y))));
  }
  return h;
}

// a solução vale seja qual for a posição das distrações?
function robusta(F) { const cam = new Set(F.caminho.map(c => c.unidade)); for (let k = 0; k < 40; k++) { for (const u of F.unidades) { const ps = N.passosDe(u.membros[0]), q = cam.has(u) || u.membros[0].fixa ? 0 : ps[k * 7 % ps.length === 0 && k > 3 ? ate(ps.length) : ate(ps.length)]; for (const m of u.membros) m.giro = N.giroMais(m, q); } N.correr(F); if (!N.venceu(F)) return false; } return true; }

function montarCandidata(m, f) {
  const M = MUNDOS[m], { L, P, dest, nasc } = medidas(m, f), placa = L * P, t = f / 9;
  const tipoR = sorteia(M.relevo), h = relevo(tipoR, L, P), eff = i => i >= placa ? h[i - placa] + 2 : h[i];
  // ---- andar alto: quais casas podem ter peça em cima
  const alto = new Set(); const anda = M.anda && f >= (M.andaDe || 0) ? M.anda : null;
  if (anda && tipoR === 'canion') { // pontes ligando os dois paredões, mais alguns trechos ao longo
    const linhas = mistura([...Array(P).keys()]).slice(0, 2 + Math.round(t * 2)); for (const z of linhas) for (let x = 0; x < L; x++) if (h[z * L + x] === 0) alto.add(placa + z * L + x);
    for (let k = 0; k < 1 + t * 2; k++) { const x = 1 + ate(L - 2), [a, b] = [ate(P), ate(P)].sort(); for (let z = a; z <= b; z++) if (h[z * L + x] === 0) alto.add(placa + z * L + x); }
  } else if (anda) {
    const quer = Math.round(placa * (.2 + .22 * t)); let x = ate(L), z = ate(P);
    for (let g = 0; alto.size < quer && g < 900; g++) { if (S() < .1) { x = ate(L); z = ate(P); } const d = ate(4), nx = x + DX[d], nz = z + DZ[d]; if (nx < 0 || nz < 0 || nx >= L || nz >= P) continue; x = nx; z = nz; if (h[z * L + x] <= Math.min(...h) + 0) alto.add(placa + z * L + x); }
  }
  const viz = (i, d) => { const b = i % placa, x = b % L + DX[d], z = (b / L | 0) + DZ[d]; return x < 0 || z < 0 || x >= L || z >= P ? -1 : z * L + x; };
  // peças que mandam água para i pelo lado d (de acordo com as casas possíveis)
  const fontesDe = (i, d) => { const b = viz(i, d); if (b < 0) return []; const r = []; for (const u of [b, b + placa]) { if (u >= placa && !alto.has(u)) continue; if (eff(u) < eff(i)) continue; if (i < placa && alto.has(i + placa) && eff(i + placa) <= eff(u)) continue; r.push(u); } return r; };
  const casa = new Map(), lugares = new Map(); // casa: i -> { canais: [{arv, lados:Set}], vert }
  const livreLugar = i => !lugares.has(i) && (i < placa ? !alto.has(i + placa) : alto.has(i) && !casa.has(i - placa) && !lugares.has(i - placa));
  const bocas = [];
  const por = (i, tipo, dados) => { const ds = mistura([0, 1, 2, 3]).filter(d => { const b = viz(i, d); return b >= 0 && (i < placa || alto.has(b + placa)) && !lugares.has(b) && !bocas.includes(b) && (tipo === 'N' || i >= placa || true); }); if (!ds.length) return null; const o = { i, tipo, lado: ds[0], ...dados }; lugares.set(i, o); bocas.push(viz(i, ds[0]) + (i >= placa ? placa : 0)); if (i >= placa) lugares.set(i - placa, { bloqueio: true }); return o; };
  const borda = i => { const x = i % placa % L, z = (i % placa) / L | 0; return Math.min(x, z, L - 1 - x, P - 1 - z); };
  // nascentes: altas e perto da borda
  const agNasc = []; const temT = M.t && f >= 0, nN = Math.max(nasc, temT ? 2 : 1);
  for (let k = 0; k < nN; k++) {
    const op = mistura([...Array(placa).keys()]).filter(i => livreLugar(i) && borda(i) < 2 && [...lugares.values()].every(o => o.bloqueio || dist(o.i, i) > 2)).sort((a, b) => eff(b) * 3 + S() * 4 - borda(b) - (eff(a) * 3 + S() * 4 - borda(a)));
    if (!op.length) return null; const agua = temT ? (k % 2 ? 2 : 1) : 1; const o = por(op[0], 'N', { agua, arv: k }); if (!o) return null; agNasc.push(o);
  }
  function dist(a, b) { a %= placa; b %= placa; return Math.abs(a % L - b % L) + Math.abs((a / L | 0) - (b / L | 0)); }
  const hN = Math.max(...agNasc.map(o => eff(o.i)));
  // destinos: espalhados
  const ds = []; let nMix = M.mix ? entre(...M.mix) : 0; if (M.mix && f < 2) nMix = Math.min(nMix, 1);
  for (let k = 0; k < dest; k++) {
    const cand = mistura([...Array(placa).keys(), ...(M.vert && f > 2 && k % 4 === 1 ? alto : [])]).filter(i => livreLugar(i) && [...lugares.values()].every(o => o.bloqueio || dist(o.i, i) > 1) && !bocas.includes(i));
    if (!cand.length) break;
    const i = cand.slice(0, 7).sort((a, b) => nota(b) - nota(a))[0];
    let pede = 1; if (temT) { const marc = k % 2 ? 2 : 1; pede = nMix > 0 && k >= dest - nMix ? 3 : marc; }
    const o = por(i, 'D', { pede }); if (o) ds.push(o);
  }
  function nota(i) { let m = 9; for (const o of lugares.values()) if (!o.bloqueio) m = Math.min(m, dist(o.i, i)); return m + (M.vert && i >= placa ? 2 : 0); }
  if (ds.length < Math.max(2, dest - 2)) return null;
  // ---- árvores: cada destino procura água de trás para a frente
  const limElos = M.vert ? entre(...M.vert) + Math.round(t) : 0; let elos = 0;
  const nCruz = { n: 0, max: Math.round(M.cruza * (2 + 5 * t)) };
  const custo = new Map(); const custoDe = i => { if (!custo.has(i)) custo.set(i, 1 + S() * 5); return custo.get(i); };
  const usada = i => casa.get(i);
  const ocupado = (i, quer) => { const c = usada(i); return c; };
  function buscar(inicio, agua, aceita, proibe, soNasc) {
    // estado: casa i, saindo pelo lado s (0..5); guarda de onde veio
    const fila = [], vis = new Map(), chave = (i, s) => i * 6 + s;
    const poe = (i, s, g, pai) => { const k = chave(i, s); if (vis.has(k) && vis.get(k).g <= g) return; vis.set(k, { i, s, g, pai, feito: false }); fila.push(vis.get(k)); };
    for (const [i, lado] of inicio) for (const u of fontesDe(i, lado)) poe(u, (lado + 2) % 4, 0, null);
    while (fila.length) {
      let b = 0; for (let k = 1; k < fila.length; k++) if (fila[k].g < fila[b].g) b = k;
      const e = fila.splice(b, 1)[0]; if (e.feito || vis.get(chave(e.i, e.s)) !== e) continue; e.feito = true;
      const { i, s, g } = e;
      const lug = lugares.get(i);
      if (lug) { if (!lug.bloqueio && lug.tipo === 'N' && lug.agua === agua && lug.lado === s && (!soNasc || lug === soNasc)) return e; continue; }
      if (proibe && proibe.has(i)) continue;
      if (i >= placa && !alto.has(i)) continue;
      const c = usada(i);
      if (c) {
        const un = c.canais;
        if (un.length === 1 && s < 4 && un[0].agua === agua && !un[0].lados.has(s) && un[0].lados.size < 4 && aceita(i, un[0]) && !(c.vert && [...un[0].lados].filter(l => l < 4).length > 1)) { e.junta = true; return e; }
        // atravessar sem misturar
        if (un.length === 1 && !c.vert && s < 4 && nCruz.n < nCruz.max && S() < .8) {
          const l = [...un[0].lados];
          if (l.length === 2 && !l.includes(s)) {
            let en = -1; if ((l[0] + 2) % 4 === l[1]) en = (s + 2) % 4; else en = [0, 1, 2, 3].find(d => d !== s && !l.includes(d)); // reto cruza em sifão; curva vira gêmeas
            if (en >= 0 && !l.includes(en)) { const ok = !((l[0] + 2) % 4 === l[1]) || (en + 2) % 4 === s; if (ok) for (const u of fontesDe(i, en)) poe(u, (en + 2) % 4, g + 1.2, { ...e, entra: en }); }
          }
        }
        continue;
      }
      // casa livre: entra por qualquer outro lado
      for (const en of [0, 1, 2, 3]) if (en !== s) for (const u of fontesDe(i, en)) poe(u, (en + 2) % 4, g + custoDe(i) + (eff(u) - eff(i) > 1 ? 4 : 0) + ((en + 2) % 4 === s ? .6 : 0), { ...e, entra: en });
      if (limElos > elos && s < 4) {
        if (i >= placa && !usada(i - placa) && !lugares.has(i - placa)) poe(i - placa, 4, g + custoDe(i) * .25, { ...e, entra: 5 });   // a água sobe por parafuso
        if (i < placa && alto.has(i + placa) && !usada(i + placa)) poe(i + placa, 5, g + custoDe(i) * .25, { ...e, entra: 4 });           // a água desce por queda
      }
    }
    return null;
  }
  // depois de achar, escreve o caminho (conferindo que não repete casa)
  function gravar(e, agua, arvNova) {
    const passos = []; let k = e; if (!e.junta && !lugares.get(e.i)) return false;
    let p = e.pai; const vistos = new Set([e.i]); const lista = []; for (let q = p; q; q = q.pai) { if (vistos.has(q.i)) return false; vistos.add(q.i); lista.push(q); }
    for (const q of lista) if (q.s > 3 || q.entra > 3) if (++passos.elos && 0) return false;
    if (e.junta) casa.get(e.i).canais[0].lados.add(e.s);
    for (const q of lista) {
      const c = usada(q.i), lados = new Set([q.s, q.entra]);
      if (c) { c.canais.push({ agua, lados }); nCruz.n++; }
      else { const nova = { canais: [{ agua, lados }] }; if (q.entra === 5) nova.vert = 5; if (q.entra === 4) nova.vert = 4; if (q.s === 4) { nova.vert = 4; nova.sobe = true; elos++; } if (q.s === 5) { nova.vert = 5; nova.desce = true; elos++; } casa.set(q.i, nova); }
    }
    return true;
  }
  const semDono = agNasc.slice();
  for (const o of mistura(ds.slice())) {
    const aguas = o.pede === 3 ? [sorteia([1, 2])] : [o.pede];
    let ok = false;
    const meu = semDono.findIndex(q => q.agua === aguas[0]); if (meu >= 0) { const q = semDono.splice(meu, 1)[0]; const e = buscar([[o.i, o.lado]], aguas[0], () => false, null, q); if (e) ok = gravar(e, aguas[0]); }
    for (let v = 0; v < 4 && !ok; v++) { const e = buscar([[o.i, o.lado]], aguas[0], () => true, null); if (!e) { custo.clear(); continue; } ok = gravar(e, aguas[0]); if (!ok) custo.clear(); }
    if (!ok) { if (o.pede !== 3 && ds.length > dest - 1 && ds.length > 3) { ds.splice(ds.indexOf(o), 1); lugares.delete(o.i); if (o.i >= placa) lugares.delete(o.i - placa); continue; } return null; }
    o.agua1 = aguas[0];
  }
  // misturas: a outra água entra na cauda exclusiva do destino
  for (const o of ds.filter(o => o.pede === 3)) {
    const cauda = []; let i = o.i, d = o.lado;
    for (let g = 0; g < 40; g++) { const us = fontesDe(i, d).filter(u => casa.get(u) && casa.get(u).canais.some(c => c.lados.has((d + 2) % 4))); if (us.length !== 1) break; const u = us[0], c = casa.get(u); if (c.canais.length > 1 || c.vert) break; const l = [...c.canais[0].lados]; if (l.length > 2) break; cauda.push(u); i = u; d = l.find(x => x !== (d + 2) % 4); if (d > 3) break; }
    let ok = false; const outra = 3 - o.agua1;
    for (const u of mistura(cauda)) { const c = casa.get(u), lados = [0, 1, 2, 3].filter(x => !c.canais[0].lados.has(x)); for (const x of mistura(lados)) { const e = buscar([[u, x]], outra, () => true, new Set(cauda)); if (e && gravar(e, outra)) { c.canais[0].lados.add(x); ok = true; break; } } if (ok) break; }
    if (!ok) { o.pede = o.agua1; }
  }
  if (M.t && M.mix && M.mix[0] && !ds.some(o => o.pede === 3)) return null;
  for (const o of agNasc) { const b = viz(o.i, o.lado); if (![b, b + placa].some(u => casa.get(u) && casa.get(u).canais.some(c => c.lados.has((o.lado + 2) % 4)))) o.ociosa = true; }
  for (const o of agNasc) if (o.ociosa) { lugares.delete(o.i); }
  const vivas = agNasc.filter(o => !o.ociosa); if (!vivas.length || (temT && new Set(vivas.map(o => o.agua)).size < 2)) return null;
  if (anda && [...casa.keys()].filter(i => i >= placa).length < 3) return null;
  if (M.vert && anda && !elos && f > 0) return null;
  // ---- vira símbolos
  const SIMB = {}; for (const [s, [tipo, g]] of Object.entries(N.SIMBOLOS)) if (tipo !== 'comporta') { const k = N.TIPOS[tipo].map(c => c.map(l => N.giroDe(l, g)).sort().join('')).sort().join('|'); SIMB[k] ||= s; }
  const grade = Array(placa * 2).fill(null);
  for (const [i, c] of casa) { const k = c.canais.map(n => [...n.lados].filter(l => l < 4).sort().join('')).sort().join('|'), s = SIMB[k]; if (!s) return null; grade[i] = { s, extra: (c.sobe ? '↑' : '') + (c.desce ? '↓' : ''), caminho: true, vert: c.vert, multi: c.canais.length > 1 }; }
  const LETRAS = 'VHRPM'; const baralho = mistura([...'VHRPMVHRPMVHRPM']); let bk = 0, temM = 0;
  for (const o of lugares.values()) { if (o.bloqueio) continue; const L4 = '^>v<'[o.lado]; let t0 = o.tipo === 'N' ? (o.agua === 2 ? 'T' : 'N') : null; if (!t0) { t0 = baralho[bk++]; if (bk === 1 && f > 0) t0 = 'M'; } grade[o.i] = { s: t0 + L4 + (o.tipo === 'D' && o.pede > 1 ? o.pede : ''), extra: '', lugar: true }; }
  const texto = (g = grade) => { const lin = (d) => { const r = []; for (let z = 0; z < P; z++) { const l = []; for (let x = 0; x < L; x++) { const c = g[d + z * L + x]; l.push(c ? c.s + c.extra : '.'); } r.push(l.join(' ')); } return r.join('/'); }; const r = { m: lin(0) }; if (g.slice(placa).some(Boolean)) r.a = lin(placa); if (h.some(Boolean)) { r.h = ''; for (let z = 0; z < P; z++) r.h += (z ? '/' : '') + h.slice(z * L, z * L + L).join(''); } return r; };
  const ler = (g, dif = 1) => { caixaFases[0] = texto(g); return N.lerFase(0, dif); };
  let F; try { F = ler(grade); } catch { return null; } if (!F.estanque) return null;
  if (F.celulas.some(c => c.destino && !c.nos[0].alcance && 0)) return null;
  // ---- mecânicas sobre as peças do caminho
  const doCaminho = filtro => mistura([...grade.keys()].filter(i => grade[i] && grade[i].caminho && !/[!~a-dA-D]/.test(grade[i].extra) && !grade[i].grupo && filtro(grade[i], i)));
  if (M.emp) for (const i of doCaminho(c => '└┌┐┘├┬┤┴'.includes(c.s)).slice(0, Math.round(M.emp[0] + (M.emp[1] - M.emp[0]) * t))) grade[i].extra += '~';
  if (M.irm) { const ng = Math.round(M.irm[0] + (M.irm[1] - M.irm[0]) * t); for (let k = 0; k < ng; k++) { const l = doCaminho(c => '└┌┐┘├┬┤┴─│╶╷╴╵'.includes(c.s) && !c.extra.includes('~')), curvos = l.filter(i => !'─│'.includes(grade[i].s)); if (l.length < 4 || !curvos.length) break; const g = [curvos[0], l.find(i => i !== curvos[0] && dist(i, curvos[0]) > 1)]; if (k % 2 && t > .4) g.push(l.find(i => !g.includes(i))); for (const i of g) if (i !== undefined) grade[i].extra += 'abcd'[k]; } }
  if (M.comp) { const ng = Math.round(M.comp[0] + (M.comp[1] - M.comp[0]) * t); for (let k = 0; k < ng; k++) {
    const l = doCaminho(c => '─│'.includes(c.s) && !c.vert); if (!l.length) break; const i = l[0]; grade[i].s = grade[i].s === '─' ? '═' : '‖'; grade[i].extra += 'AB CD'.replace(' ', '')[k]; grade[i].comp = true;
    // a par, fechada: numa casa vazia encostada ao caminho, criando um atalho tentador
    const vaz = mistura([...Array(placa).keys()].filter(j => !grade[j] && !(lugares.get(j)) && !alto.has(j + placa) && [0, 1, 2, 3].filter(d => { const b = viz(j, d); return b >= 0 && grade[b] && grade[b].caminho; }).length >= 2));
    if (vaz.length) { const j = vaz[0], d = [0, 1, 2, 3].find(d => { const b = viz(j, d); return b >= 0 && grade[b] && grade[b].caminho; }); grade[j] = { s: d % 2 ? '═' : '‖', extra: 'ABCD'[k] + 'x', comp: true }; }
    else { const l2 = doCaminho(c => '─│'.includes(c.s) && !c.vert); if (l2.length) { grade[l2[0]].s = grade[l2[0]].s === '─' ? '═' : '‖'; grade[l2[0]].extra += 'ABCD'[k]; grade[l2[0]].comp = true; } } } }
  if (M.fixas) for (const i of doCaminho(c => '├┬┤┴┼+'.includes(c.s) && !c.extra).slice(0, entre(0, M.fixas))) grade[i].extra += '!';
  try { F = ler(grade); } catch { return null; } if (!F.estanque) return null;
  // ---- distrações: entram uma a uma, só ficam se não abrirem soluções demais
  const teto = 4, LIM = 25000;
  let r = contarMedio(F, N, { teto, limite: LIM });
  for (let k = 0; k < 5 && r.solucoes >= teto; k++) { const l = doCaminho(c => '├┬┤┴└┌┐┘'.includes(c.s) && !c.extra); if (!l.length) break; grade[l[0]].extra += '!'; F = ler(grade); r = contarMedio(F, N, { teto, limite: LIM }); }
  if (r.solucoes >= teto || !r.solucoes) return null;
  const vazias = mistura([...Array(placa).keys(), ...alto].filter(i => !grade[i] && !lugares.get(i) && !(i < placa && false)));
  const querM = Math.round(vazias.length * (.45 + .3 * t)), bar = m === 0 ? '└└└──├├┼' : M.cruza > .5 ? '└└─├├+╲┼' : '└└└─├├╲┼'; let postas = 0;
  for (const i of vazias) {
    if (postas >= querM) break; const s = sorteia([...bar]); grade[i] = { s, extra: '*' };
    if (i >= placa && !grade[i - placa] && S() < .5) { grade[i] = null; continue; }
    try { F = ler(grade); } catch { grade[i] = null; continue; }
    const q = F.estanque ? contarMedio(F, N, { teto, limite: LIM }) : null;
    if (!q || (i >= placa || M.anda) && !robusta(ler(grade, 2)) || q.solucoes >= teto || q.solucoes === 0 || (q.solucoes > Math.max(1, r.solucoes) && S() < .85)) { grade[i] = null; continue; }
    r = q; postas++;
  }
  // distrações só do difícil
  for (const i of vazias) if (!grade[i] && S() < .6 && (i < placa || grade[i - placa])) { grade[i] = { s: sorteia([...bar]), extra: '°' }; let D; try { D = ler(grade, 2); } catch { grade[i] = null; continue; } if (!D.estanque || !robusta(D)) grade[i] = null; }
  for (const d of [0, 1, 2]) { try { F = ler(grade, d); } catch { return null; } if (!F.estanque || (N.correr(F), N.venceu(F)) || !robusta(F)) return null; }
  F = ler(grade, 1); const gir = F.unidades.filter(u => !u.membros[0].fixa).length;
  const D = ler(grade, 2), rd = contarDificil(D, N, { limite: 8000 });
  const nivel = gir * .32 + Math.log10(r.passos + 1) * 3.2 + ds.length * .9 + elos * 1.6 + (M.t ? 2 : 0) + ds.filter(o => o.pede === 3).length * 1.5 - r.solucoes * 1.2;
  return { ...texto(), _: { nivel: +nivel.toFixed(2), gir, dest: ds.length, nasc: vivas.length, sol: r.solucoes, passos: r.passos, solD: rd.solucoes, passosD: rd.passos, elos, alto: [...casa.keys()].filter(i => i >= placa).length, L, P } };
}

const qual = process.argv[2] ? [+process.argv[2] - 1] : [...Array(10).keys()], tentativas = +process.argv[3] || 24;
mkdirSync(new URL('fases/', import.meta.url), { recursive: true });
for (const m of qual) {
  const fases = [];
  for (let f = 0; f < 10; f++) {
    let boas = []; for (let k = 0; boas.length < (+process.argv[4] || 5) && k < tentativas * 12; k++) { semente = (m * 10 + f) * 100003 + k * 7; const c = montarCandidata(m, f); if (c) boas.push(c); }
    // entre as boas, a mais difícil com menos soluções
    const meta = 13 + m * 2.6 + f * 1.4; boas.sort((a, b) => Math.abs(a._.nivel - meta) + a._.sol * 2 - Math.abs(b._.nivel - meta) - b._.sol * 2); if (!boas.length) { console.log(`mundo ${m + 1} fase ${f + 1}: NENHUMA`); continue; } fases.push(boas[0]);
  }
  fases.sort((a, b) => a._.nivel - b._.nivel);
  writeFileSync(new URL(`fases/mundo${m + 1}.json`, import.meta.url), JSON.stringify(fases, null, 1));
  console.log(`MUNDO ${m + 1}: ${fases.length}`); for (const x of fases) console.log('  ', JSON.stringify(x._));
}

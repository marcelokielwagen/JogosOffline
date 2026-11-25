// <regras>  (trecho sem 3D: o gerador de fases em ferramentas/nascente lê e executa exatamente este texto)
// ============================================================ 2. PEÇAS
// Lados: 0 norte (−z), 1 leste (+x), 2 sul (+z), 3 oeste (−x), 4 para cima, 5 para baixo. Girar = somar 1 (sentido do relógio).
const DX = [0, 1, 0, -1, 0, 0], DZ = [-1, 0, 1, 0, 0, 0];

// Cada tipo lista seus "canais". Um canal é um grupo de lados ligados entre si.
// PEÇA NOVA: acrescente aqui, dê um símbolo em SIMBOLOS e, se for preciso, uma forma em formaPeca (seção 7).
const TIPOS = {
  reto:  [[0, 2]],
  curva: [[0, 1]],
  te:    [[0, 1, 2]],
  cruz:  [[0, 1, 2, 3]],
  sifao: [[1, 3], [0, 2]],          // o primeiro canal passa por cima, o segundo por baixo
  dupla: [[0, 1], [2, 3]],
  ponta: [[0]],                     // um braço só: usado com os elos entre andares
  comporta: [[0, 2]],               // não gira: abre e fecha (giro 0 = aberta, 1 = fechada)
};
// símbolo do mapa -> [tipo, giro]
const SIMBOLOS = {
  '│': ['reto', 0], '─': ['reto', 1], '└': ['curva', 0], '┌': ['curva', 1], '┐': ['curva', 2], '┘': ['curva', 3],
  '├': ['te', 0], '┬': ['te', 1], '┤': ['te', 2], '┴': ['te', 3], '┼': ['cruz', 0], '+': ['sifao', 0], '╲': ['dupla', 0], '╱': ['dupla', 1],
  '╵': ['ponta', 0], '╶': ['ponta', 1], '╷': ['ponta', 2], '╴': ['ponta', 3], '‖': ['comporta', 0], '═': ['comporta', 1],
};
const LUGARES = { N: 'nascente', T: 'nascente', V: 'vila', H: 'horta', R: 'reservatorio', P: 'poco', M: 'marco' };
const LADOS = { '^': 0, '>': 1, 'v': 2, '<': 3 };
const giroDe = (lado, giro) => lado > 3 ? lado : ((lado + giro) % 4 + 4) % 4;
// "assinatura" da posição: duas rotações que dão o mesmo desenho têm a mesma assinatura
const assinatura = (tipo, giro) => tipo === 'comporta' ? giro + '' : TIPOS[tipo].map(g => g.map(l => giroDe(l, giro)).sort().join('')).sort().join('|');
const certa = c => assinatura(c.tipo, c.giro) === assinatura(c.tipo, c.certo);

// ============================================================ 3. REGRAS DA ÁGUA (sem 3D)
// dif: 0 fácil, 1 médio, 2 difícil. Cada dificuldade é o mesmo mapa com mais ou menos distrações e apoios.
function lerFase(indice, dif = 1) {
  const base = FASES[indice], def = dif === 0 && base.f ? base.f : base, sorte = sorteador(1000 + indice * 77 + dif * 7919);
  const abrirMapa = t => t.trim().split(/[\n/]/).map(l => l.trim().split(/\s+/));
  const mapas = [abrirMapa(def.m)]; if (def.a) mapas.push(abrirMapa(def.a));
  const alt = def.h ? def.h.trim().split(/[\n/]/).map(l => [...l.trim()].map(Number)) : null;
  const larg = mapas[0][0].length, prof = mapas[0].length;
  const F = { indice, dif, def, larg, prof, mundo: indice / 10 | 0, andares: mapas.length, alt: (x, z) => alt ? alt[z][x] : 0, celulas: [], grade: [], unidades: [] };
  const grupos = {};
  mapas.forEach((linhas, andar) => linhas.forEach((linha, z) => {
    if (linha.length !== larg) throw new Error(`Fase ${indice + 1}: a linha ${z + 1} tem tamanho diferente`);
    linha.forEach((t, x) => {
      const i = (andar * prof + z) * larg + x; F.grade[i] = null;
      if (t === '.') return;
      const c = { i, x, z, andar, h: F.alt(x, z) + andar * 2, giro: 0, girando: false }, s = t.slice(1);
      if (s.includes('°') && dif < 2) return;                                   // distração só do difícil
      if (s.includes('*') && dif === 0 && sorte() < .6) return;                 // distração: no fácil a maioria some
      if (LUGARES[t[0]]) {
        c.tipo = LUGARES[t[0]]; c.lugar = true; c.fixa = true; c.lado = LADOS[t[1]]; c.nos = [{ lados: [c.lado] }];
        c.agua = t[0] === 'T' ? 2 : 1; c.pede = +t[2] || 1;                       // destino pede água 1, 2 ou 3 (as duas misturadas)
      } else if (SIMBOLOS[t[0]]) {
        [c.tipo, c.certo] = SIMBOLOS[t[0]]; c.fixa = s.includes('!'); c.distracao = /[*°]/.test(s); c.emperrada = s.includes('~');
        if (s.includes('↑')) c.sobe = true; if (s.includes('↓')) c.desce = true;
        c.nos = TIPOS[c.tipo].map(g => ({ lados: g.slice() }));
        if (c.tipo === 'comporta') { c.eixo = c.certo; c.certo = s.includes('x') ? 1 : 0; }
        c.grupo = (s.match(/[a-dA-D]/) || [])[0]; if (c.grupo) (grupos[c.grupo] ||= []).push(c);
      } else throw new Error(`Fase ${indice + 1}: símbolo desconhecido "${t}"`);
      c.destino = !!c.lugar && c.tipo !== 'nascente';
      F.celulas.push(F.grade[i] = c);
    });
  }));
  for (const c of F.celulas) {                                                    // elos verticais: a outra metade ganha o lado que falta
    if (!c.sobe && !c.desce) continue;
    const o = F.grade[c.i + (c.sobe ? 1 : -1) * larg * prof]; if (!o) throw new Error(`Fase ${indice + 1}: elo vertical sem par`);
    c.vert = c.sobe ? 4 : 5; o.vert = 9 - c.vert;
  }
  for (const c of F.celulas) {
    if (c.vert) c.nos[0].lados.push(c.vert);
    for (const n of c.nos) Object.assign(n, { c, cheio: 0, nivel: 0, entrada: n.lados[0], pai: null, alcance: 0, cor: 0 });
    if (c.lugar) continue;
    // unidade = o que se move num toque: uma peça sozinha ou um grupo de irmãs / de comportas
    if (!c.grupo) F.unidades.push(c.unidade = { membros: [c] });
    else if (grupos[c.grupo][0] === c) F.unidades.push(c.unidade = { membros: grupos[c.grupo] });
    else c.unidade = grupos[c.grupo][0].unidade;
  }
  // caminho da solução (na ordem em que a água passa), usado pela dica
  for (const c of F.celulas) if (!c.lugar) c.giro = c.certo;
  F.duas = F.celulas.some(c => c.agua === 2 && c.tipo === 'nascente');
  const ordem = correr(F);
  F.resolvido = completa(F); F.estanque = F.resolvido && !vazamentos(F);
  F.molhadas = [...new Set(ordem.map(n => n.c))];
  F.caminho = F.molhadas.filter(c => !c.fixa);
  if (dif === 0 && !base.f) for (const c of F.caminho) if (!c.grupo && sorte() < .34) c.fixa = c.apoio = true;   // apoios do fácil: já no lugar
  F.caminho = F.caminho.filter(c => !c.fixa);
  // embaralha até ficar longe da solução
  const soltas = F.unidades.filter(u => !u.membros[0].fixa); let voltas = 0;
  do for (const u of soltas) {
    const p = passosDe(u.membros[0]), fora = p.filter(p => u.membros.some(m => assinatura(m.tipo, giroMais(m, p)) !== assinatura(m.tipo, m.certo)));
    const op = fora.length && sorte() < (dif === 2 ? 1 : .85) ? fora : p, q = op[sorte() * op.length | 0];
    for (const m of u.membros) m.giro = giroMais(m, q);
  } while ((correr(F), venceu(F)) && voltas++ < 50);
  for (const c of F.celulas) c.inicio = c.giro;
  return F;
}
// posições que um toque alcança, contadas a partir da certa
const passosDe = c => c.tipo === 'comporta' ? [0, 1] : c.emperrada ? [0, 2] : [0, 1, 2, 3];
const giroMais = (c, p) => c.tipo === 'comporta' ? c.certo ^ (p & 1) : giroDe(c.certo, p);
// lados do mundo que o canal liga agora
const ladosDe = n => { const c = n.c; return c.tipo === 'comporta' ? (c.giro ? [] : n.lados.map(l => giroDe(l, c.eixo))) : n.lados.map(l => giroDe(l, c.giro)); };
const temLado = (n, lado) => ladosDe(n).includes(lado);

// Para onde vai a água que sai de um nó por um lado do mundo? Devolve o nó vizinho ou null.
function vizinho(F, no, lado) {
  const c = no.c, placa = F.larg * F.prof;
  if (lado > 3) {
    const v = F.grade[c.i + (lado === 4 ? placa : -placa)];
    if (!v || v.girando || (lado === 4 ? !c.sobe : !c.desce)) return null;       // para cima só o parafuso leva; para baixo, a queda
    return v.nos.find(n => temLado(n, 9 - lado)) || null;
  }
  const x = c.x + DX[lado], z = c.z + DZ[lado];
  if (x < 0 || z < 0 || x >= F.larg || z >= F.prof) return null;
  for (let a = F.andares - 1; a >= 0; a--) {
    const v = F.grade[(a * F.prof + z) * F.larg + x];
    if (!v || v.h > c.h) continue;                                               // não sobe degrau; passa por baixo do andar alto
    return v.girando ? null : v.nos.find(n => temLado(n, (lado + 2) % 4)) || null;
  }
  return null;
}
// Percorre a água a partir das nascentes. alcance: 0 seco, 1 água clara, 2 segunda água, 3 as duas. Devolve os nós em ordem.
function correr(F) {
  const fila = [];
  for (const c of F.celulas) for (const n of c.nos) { n.alcance = c.tipo === 'nascente' ? c.agua : 0; n.pai = null; if (n.alcance) fila.push(n); }
  for (let k = 0; k < fila.length; k++) {
    const n = fila[k];
    if (n.c.girando || n.c.destino) continue;
    for (const lado of ladosDe(n)) {
      const v = vizinho(F, n, lado);
      if (!v || v.c.tipo === 'nascente' || (v.alcance | n.alcance) === v.alcance) continue;
      if (!v.alcance) { v.pai = n; v.entradaNova = lado > 3 ? 9 - lado : giroDe((lado + 2) % 4, v.c.tipo === 'comporta' ? -v.c.eixo : v.c.lugar ? 0 : -v.c.giro); }
      v.alcance |= n.alcance; fila.push(v);
    }
  }
  return fila;
}
// a ponta deste canal está ligada a alguma coisa? (ou a água escapa por ela)
function ligado(F, n, lado) {
  if (vizinho(F, n, lado)) return true;
  const x = n.c.x + DX[lado], z = n.c.z + DZ[lado], volta = lado > 3 ? 9 - lado : (lado + 2) % 4; if (x < 0 || z < 0 || x >= F.larg || z >= F.prof) return false;
  for (let a = 0; a < F.andares; a++) { const v = F.grade[(a * F.prof + z) * F.larg + x]; if (v && v !== n.c && v.tipo === 'comporta' && v.giro && v.h <= n.c.h && lado < 4 && v.nos[0].lados.some(l => giroDe(l, v.eixo) === volta)) return true;   // comporta fechada segura a água
    if (v && v !== n.c && v.nos.some(m => temLado(m, volta) && vizinho(F, m, volta) === n)) return true; }
  return false;
}
function vazamentos(F) { let k = 0; for (const c of F.celulas) for (const n of c.nos) if (n.alcance && !c.destino) for (const l of ladosDe(n)) if (!ligado(F, n, l)) k++; return k; }
const completa = F => F.celulas.every(c => !c.destino || c.nos[0].alcance === c.pede);
const venceu = F => completa(F) && (F.dif < 2 || !vazamentos(F));
// </regras>

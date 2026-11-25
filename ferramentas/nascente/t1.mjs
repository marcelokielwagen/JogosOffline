// Resolvedor: 100 fases x 3 dificuldades têm solução, não começam resolvidas, e quantas soluções existem.
import { regras, contarMedio, contarDificil } from './resolvedor.mjs';
const N = regras(undefined, { doJogo: true }); let erros = 0; const sm = {}, sd = {}, livres = [0, 0, 0];
for (let i = 0; i < N.FASES.length; i++) for (const dif of [0, 1, 2]) {
  const F = N.lerFase(i, dif), antiga = dif === 0 && N.FASES[i].f;
  if (!F.resolvido || (dif === 2 && !F.estanque)) { erros++; console.log('sem solução', i + 1, dif); }
  N.correr(F); if (N.venceu(F)) { erros++; console.log('já começa resolvida', i + 1, dif); }
  for (const c of F.celulas) if (!c.lugar && !N.passosDe(c).some(p => N.giroMais(c, p) === c.giro)) { erros++; console.log('posição impossível', i + 1, dif); }
  livres[dif] += F.unidades.filter(u => !u.membros[0].fixa).length; if (F.caminho.length < 2) { console.log('caminho curto', i + 1, dif, F.caminho.length); }
  if (dif === 1) { const r = contarMedio(F, N); sm[r.solucoes] = (sm[r.solucoes] || 0) + 1; }
  if (dif === 2) { const r = contarDificil(F, N, { limite: 400000 }); sd[r.solucoes + (r.passos > 400000 ? ' (busca cortada)' : '')] = (sd[r.solucoes + (r.passos > 400000 ? ' (busca cortada)' : '')] || 0) + 1; }
}
console.log('fases', N.FASES.length, 'erros', erros, '| soluções no médio', sm, '| no difícil', sd, '| peças giráveis (média)', livres.map(v => (v / 100).toFixed(1)));

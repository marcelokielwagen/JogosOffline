// Junta fases/mundo*.json com nomes, dicas e os mapas antigos (Fácil) e grava dentro do jogo, entre // <fases> e // </fases>.
// Também copia regras.js para dentro do jogo, entre // <regras> e // </regras>.
import { readFileSync, writeFileSync } from 'node:fs';
const NOMES = [
  'Primeiro fio d’água|A volta do morro|Dois vizinhos|Degraus de pedra|Pedras antigas|Escada de cascatas|O jardim de dentro|Encosta das oliveiras|O lagar e o pomar|A colheita',
  'Águas que se cruzam|Curvas gêmeas|Dois rios|O vale inteiro|Araucárias|Manhã sem horizonte|O pinhão e a brasa|Geada fina|Campos de cima|Quando a névoa abre',
  'O primeiro espelho|Eixos cansados|A muda de arroz|Sete patamares|O búfalo e o açude|Chuva mansa|Os degraus do avô|Bambuzal|Lua na água rasa|A grande escadaria',
  'A ponte sobre a sombra|Paredão de ferro|Vento no desfiladeiro|O arco natural|Barro e milho|Três travessias|A trilha do condor|Calor de pedra|O eco|Catedral vermelha',
  'Sede antiga|O parafuso d’água|Tamareiras|A caravana para|Poço fundo|Pátio de azulejos|Dunas que andam|A cisterna alta|Noite de estrelas|O coração do oásis',
  'Duas mãos|A primeira folha|Pedras penteadas|O lago das carpas|Musgo|A lanterna acesa|Ponte de madeira|Chuva de bordos|Silêncio da tarde|O mestre do jardim',
  'Doce e salgada|As salinas|Maré baixa|Casas brancas|O barco que espera|Falésia|Rede de pescador|Farol ao longe|Vento sul|A luz do farol',
  'Portas d’água|Sob as raízes|O degrau coberto|Cipós|A praça esquecida|Chuva na mata|Colunas caídas|A árvore-mãe|O altar verde|Cidade das águas',
  'Primeiro degelo|A fonte quente|Neve e vapor|Refúgio|As duas correntes|O passo alto|Morno|Gelo azul|A capela da encosta|Primavera no cume',
  'Terraço da lua|Glicínias|O lago suspenso|Jardim sem chão|Sete cascatas|Fio de prata|A torre das águas|Constelação|Antes da aurora|O jardim inteiro',
].map(l => l.split('|'));
// dica da fase (uma linha), por mundo e posição
const DICAS = {
  0: ['Toque nas peças para girar e levar a água até os destinos', null, 'Uma bifurcação reparte a água em dois caminhos', 'A água desce os degraus, mas não sobe', 'As peças de pedra escura são fixas: construa em volta delas'],
  10: ['No sifão, uma água passa por baixo da outra sem misturar', 'As curvas gêmeas levam duas águas separadas na mesma peça'],
  20: ['Peça com cinta de ferro: o eixo emperrou e só dá meia-volta'],
  30: ['O aqueduto alto passa por cima. Use o botão dos andares para ver um de cada vez', 'Do alto, a água também pode cair para o canal de baixo'],
  40: ['Na queda, a água desce ao andar de baixo; no parafuso, ela sobe um andar'],
  50: ['Peças irmãs, com o mesmo símbolo, giram juntas'],
  60: ['Há duas águas. Cada destino mostra, na cor do anel, a água que espera'],
  70: ['Comporta: um toque abre ou fecha. As do mesmo símbolo mudam juntas'],
  80: ['Anel de duas cores: este destino quer as duas águas misturadas'],
  90: ['Tudo o que você aprendeu, sob a lua'],
};
// as 12 fases antigas viram o mapa Fácil de 12 das novas (posição nova: índice antigo)
export const ANTIGAS = [0, 1, 2, 3, 4, 7, 8, 10, 5, 6, 9, 11], NOVAS = [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13];
const velhas = JSON.parse(readFileSync(new URL('antigas.json', import.meta.url), 'utf8'));
const linhas = []; let k = 0;
for (let m = 0; m < 10; m++) {
  const fs = JSON.parse(readFileSync(new URL(`fases/mundo${m + 1}.json`, import.meta.url), 'utf8')); if (fs.length !== 10) throw new Error('mundo ' + (m + 1) + ' com ' + fs.length);
  linhas.push(`  // mundo ${m + 1}`);
  fs.forEach((x, f) => { const o = { n: NOMES[m][f], m: x.m }; if (x.a) o.a = x.a; if (x.h) o.h = x.h; const d = (DICAS[m * 10] || [])[f]; if (d) o.d = d; const v = NOVAS.indexOf(k); if (v >= 0) o.f = velhas[ANTIGAS[v]]; linhas.push('  ' + JSON.stringify(o) + ','); k++; });
}
const arq = new URL('../../jogos/nascente/index.html', import.meta.url); let h = readFileSync(arq, 'utf8');
const troca = (nome, txt) => { const a = h.indexOf(`// <${nome}>`), b = h.indexOf(`// </${nome}>`); if (a < 0 || b < 0) throw new Error('falta ' + nome); h = h.slice(0, a) + txt + h.slice(b + `// </${nome}>`.length); };
troca('fases', '// <fases>  (gravado por ferramentas/nascente/gravar.mjs; pode editar à mão)\nconst FASES = [\n' + linhas.join('\n') + '\n];\n// </fases>');
troca('regras', readFileSync(new URL('regras.js', import.meta.url), 'utf8').trim());
writeFileSync(arq, h); console.log('gravado', k, 'fases');

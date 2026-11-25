// Cenários 3D por tema: ficam atrás do tabuleiro (z de -6 a -11), feitos só com formas simples.
// Cada um define céu, chão, luz e os objetos; quadro(t) balança o que for leve. Nada pisca.
const TEMA_CENA = {
  'Tecnologia da informação': 'pc', 'TI': 'pc', 'Segurança cibernética': 'seguranca', 'Infraestrutura de TI': 'infra', 'Redes e internet': 'rede', 'Redes': 'rede', 'Internet': 'rede',
  'Programação': 'codigo', 'Dados, nuvem e IA': 'nuvem', 'Dados e IA': 'dados', 'Nuvem': 'nuvem',
  'Viagens pelo mundo': 'viagem', 'Países': 'viagem', 'Transportes': 'viagem', 'Animais': 'animais', 'Comidas': 'comida', 'Comida': 'comida', 'Frutas': 'frutas', 'Corpo humano': 'corpo', 'Corpo': 'corpo',
  'Natureza': 'natureza', 'Brasil': 'brasil', 'Esportes': 'esporte', 'Futebol': 'esporte', 'Casa': 'casa', 'Roupas': 'festa', 'Cores': 'cores', 'Profissões': 'cidade', 'Ferramentas': 'ferramentas',
  'Escola': 'escola', 'Espaço': 'espaco', 'Fundo do mar': 'mar', 'Música': 'musica', 'Festa': 'festa', 'Cinema': 'cinema', 'Variadas': 'cores',
};
export const cenarioDe = tema => TEMA_CENA[tema] || 'cores';

// [céu de cima, céu de baixo, chão, luz]
export const CLIMA = {
  pc: ['#1d2b64', '#5f7fe0', '#22306b', '#e8efff'], seguranca: ['#0d2a2c', '#1f8f7c', '#0f3b3a', '#e2fff4'], infra: ['#131a2e', '#36588f', '#1a2440', '#dfeaff'],
  rede: ['#13204e', '#3f8be0', '#17336a', '#eaf4ff'], codigo: ['#1a1433', '#6a46c8', '#241a48', '#f1e8ff'], nuvem: ['#3d86d8', '#cfe8ff', '#6fb0ea', '#ffffff'], dados: ['#102a43', '#2ba6a0', '#133a52', '#ecffff'],
  viagem: ['#3a8fd8', '#ffe3b8', '#e0b878', '#fff1d8'], animais: ['#5bb0e8', '#e8f7d0', '#79b04c', '#fff6dc'], comida: ['#d8552f', '#ffd9a0', '#b5653a', '#fff0d8'], frutas: ['#3fa05a', '#f6f2a8', '#7cbf4e', '#fffadc'],
  corpo: ['#7a2340', '#ffb3b0', '#8f3350', '#fff0ee'], natureza: ['#3f9ad8', '#fdf0c8', '#5d9e45', '#fff4d4'], brasil: ['#1f86d0', '#ffe98a', '#2f9a4e', '#fff7d0'], esporte: ['#3f8fd0', '#dff4ff', '#3f9c48', '#ffffff'],
  casa: ['#6aa8e0', '#ffe8cc', '#86b060', '#fff4e0'], cores: ['#5b4bd0', '#ffb3d0', '#6a4fb0', '#fff4ff'], cidade: ['#28406e', '#ffb27a', '#4a5670', '#ffe6cc'], ferramentas: ['#5a4632', '#e8c08a', '#7a5a3a', '#fff0d8'],
  escola: ['#2f7a5c', '#d8f2c8', '#3f8a68', '#fffbe8'], espaco: ['#07071c', '#33206a', '#1a1440', '#e6e6ff'], mar: ['#0b4f86', '#4fd0e0', '#e6cf96', '#e8ffff'], musica: ['#3a1650', '#e0568c', '#4a1c58', '#ffeaf6'],
  festa: ['#6a2a9a', '#ffb8d8', '#8a3a9a', '#fff0fa'], cinema: ['#2a0c14', '#a82a3c', '#3a1018', '#ffeadc'],
};

export function montarCenario(THREE, cena, nome) {
  if (!CLIMA[nome]) nome = 'cores';
  const [c1, c2, chaoCor, luz] = CLIMA[nome], g = new THREE.Group(), mexe = [], lixo = [];
  cena.add(g);
  // ---------- Céu e chão ----------
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const x2 = cv.getContext('2d'), gr = x2.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, c1); gr.addColorStop(.3, c2); gr.addColorStop(1, c2); x2.fillStyle = gr; x2.fillRect(0, 0, 4, 256);
  const ceu = new THREE.CanvasTexture(cv); ceu.colorSpace = THREE.SRGBColorSpace; cena.background = ceu; lixo.push(ceu);
  cena.fog = new THREE.Fog(new THREE.Color(c2), 30, 62);
  const guarda = {}; // reaproveita materiais da mesma cor
  const M = (cor, o = {}) => { const k = cor + JSON.stringify(o); if (guarda[k]) return guarda[k]; const m = guarda[k] = new THREE.MeshStandardMaterial({ color: cor, roughness: .55, ...o }); lixo.push(m); return m; };
  const add = (geo, cor, x = 0, y = 0, z = 0, o = {}, pai = g) => { lixo.push(geo); const m = new THREE.Mesh(geo, M(cor, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; pai.add(m); return m; };
  const grupo = (x, y, z, s = 1, ry = 0, pai = g) => { const q = new THREE.Group(); q.position.set(x, y, z); q.scale.setScalar(s); q.rotation.y = ry; pai.add(q); return q; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), E = (r, s = 18) => new THREE.SphereGeometry(r, s, Math.round(s * .7)), C = (a, b, h, s = 20) => new THREE.CylinderGeometry(a, b, h, s), K = (r, h, s = 16) => new THREE.ConeGeometry(r, h, s), T = (r, t, arco = Math.PI * 2, s = 28) => new THREE.TorusGeometry(r, t, 10, s, arco);
  const brilho = c => ({ emissive: c, emissiveIntensity: .75 });
  const vivo = o => { o.userData.vivo = true; return o; };
  const flutua = (o, a = .12, v = .9, f = Math.random() * 6) => { vivo(o); const y0 = o.position.y; mexe.push(t => { o.position.y = y0 + Math.sin(t * v + f) * a; }); return o; };
  const gira = (o, v = .3) => { vivo(o); mexe.push(t => { o.rotation.y = t * v; }); return o; };
  const extr = (pts, prof) => { const s = new THREE.Shape(); pts(s); return new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 2, curveSegments: 14 }); };
  const chao = add(new THREE.PlaneGeometry(90, 70), chaoCor, 0, -.78, -12, { roughness: .95 }); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
  const G = -.78; // altura do chão

  // ---------- Peças que se repetem ----------
  const arvore = (x, z, s = 1, cor = '#3f9a4c') => { const q = grupo(x, G, z, s); add(C(.16, .22, .9), '#7a5230', 0, .45, 0, {}, q); add(K(.95, 1.5), cor, 0, 1.5, 0, {}, q); add(K(.75, 1.3), cor, 0, 2.2, 0, {}, q); return q; };
  const copa = (x, z, s = 1, cor = '#5db04a') => { const q = grupo(x, G, z, s); add(C(.15, .2, 1), '#7a5230', 0, .5, 0, {}, q); add(E(.85), cor, 0, 1.6, 0, {}, q); add(E(.6), cor, .55, 1.3, .1, {}, q); add(E(.6), cor, -.5, 1.35, .1, {}, q); return q; };
  const nuvem = (x, y, z, s = 1, cor = '#ffffff') => { const q = grupo(x, y, z, s); [[0, 0, 0, .8], [.8, -.1, 0, .6], [-.8, -.12, 0, .58], [.35, .35, 0, .55]].forEach(a => { const m = add(E(a[3]), cor, a[0], a[1], a[2], { roughness: .9 }, q); m.castShadow = false; }); flutua(q, .1, .5); return q; };
  const monte = (x, z, r, h, cor, neve) => { add(K(r, h, 7), cor, x, G + h / 2, z, { roughness: .9, flatShading: true }); if (neve) add(K(r * .36, h * .36, 7), '#ffffff', x, G + h * .825, z, { flatShading: true }); };
  const predio = (x, z, w, h, cor, jan = '#ffe9a8') => { add(B(w, h, w), cor, x, G + h / 2, z); const n = Math.max(2, Math.floor(h / .55)); for (let i = 0; i < n; i++) for (const k of [-.24, .24]) add(B(w * .24, .2, .04), jan, x + k * w, G + .4 + i * .5, z + w / 2 + .02, brilho(jan)).castShadow = false; };
  const coracao = s => { s.moveTo(0, -.9); s.bezierCurveTo(-1.5, .1, -1, 1.1, -.45, 1); s.bezierCurveTo(-.2, .98, 0, .75, 0, .55); s.bezierCurveTo(0, .75, .2, .98, .45, 1); s.bezierCurveTo(1, 1.1, 1.5, .1, 0, -.9); };
  const rack = (x, z, ry = 0, s = 1) => { const q = grupo(x, G, z, s, ry); add(B(1.5, 2.9, 1), '#161b28', 0, 1.45, 0, { roughness: .4, metalness: .4 }, q); for (let i = 0; i < 7; i++) { add(B(1.3, .28, .06), '#39435c', 0, .4 + i * .36, .52, { metalness: .5, roughness: .35 }, q); ['#39e58c', '#4ac3ff', i % 3 ? '#39e58c' : '#ffb02e'].forEach((c, k) => { add(E(.045, 8), c, -.5 + k * .17, .4 + i * .36, .57, brilho(c), q).castShadow = false; }); } return q; };
  const bola = (x, y, z, r) => { const q = grupo(x, y, z, r); add(new THREE.IcosahedronGeometry(1, 4), '#ffffff', 0, 0, 0, { roughness: .4 }, q); const v = new THREE.IcosahedronGeometry(1, 0).attributes.position, feitos = []; for (let i = 0; i < v.count; i++) { const p = new THREE.Vector3().fromBufferAttribute(v, i); if (feitos.some(f => f.distanceTo(p) < .1)) continue; feitos.push(p); const m = add(new THREE.CircleGeometry(.36, 5), '#1b1e26', p.x * 1.005, p.y * 1.005, p.z * 1.005, {}, q); m.lookAt(q.localToWorld(p.clone().multiplyScalar(3))); m.castShadow = false; } return q; };

  const DESENHO = {
    pc() {
      const q = grupo(-.6, G, -7.6, 1.15); add(B(3.6, 2.2, .2), '#10131f', 0, 2, 0, { roughness: .3 }, q); add(B(3.3, 1.9, .05), '#2f6bff', 0, 2, .11, brilho('#2a5ae0'), q); add(C(.18, .25, .9), '#c9d2e4', 0, .6, 0, { metalness: .6, roughness: .3 }, q); add(C(.8, .9, .12), '#c9d2e4', 0, .08, 0, { metalness: .6, roughness: .3 }, q);
      [['#ffcf3f', -1.1, 2.4, .9], ['#5fe08a', .1, 2.4, .8], ['#ff6a8a', 1.1, 2.4, .7], ['#ffffff', -.6, 1.7, 1.9], ['#9fd0ff', .9, 1.7, .9]].forEach(a => { add(B(a[3] * .85, .3, .04), a[0], a[1], a[2] - .05, .15, brilho(a[0]), q).castShadow = false; });
      const t = grupo(3.5, G, -7.4, 1.1, -.25); add(B(1.1, 2.4, 1.6), '#1a2033', 0, 1.2, 0, { roughness: .35, metalness: .3 }, t); add(T(.32, .06), '#4ac3ff', 0, .8, .82, brilho('#4ac3ff'), t); add(T(.32, .06), '#b58cff', 0, 1.6, .82, brilho('#b58cff'), t);
      const n = grupo(-4.4, G, -7.2, 1, .4); add(B(1.9, .1, 1.2), '#cfd6e4', 0, .06, 0, { metalness: .6, roughness: .3 }, n); const tela = add(B(1.9, 1.2, .08), '#cfd6e4', 0, .66, -.62, { metalness: .6, roughness: .3 }, n); tela.rotation.x = -.18; const l = add(B(1.7, 1, .04), '#35d0b0', 0, .66, -.57, brilho('#1fa890'), n); l.rotation.x = -.18;
    },
    seguranca() {
      const c = grupo(0, G + .1, -7.4, 1.25); add(B(2.2, 1.7, .9), '#f2b632', 0, .9, 0, { metalness: .75, roughness: .28 }, c); const al = add(T(.75, .2, Math.PI), '#dfe6ee', 0, 1.75, 0, { metalness: .85, roughness: .2 }, c); al.scale.y = 1.25; add(C(.24, .24, .1), '#3a2a08', 0, 1.05, .46, {}, c).rotation.x = Math.PI / 2; add(B(.18, .55, .08), '#3a2a08', 0, .72, .46, {}, c);
      const esc = add(extr(s => { s.moveTo(0, -1.2); s.bezierCurveTo(-1, -.6, -1, .2, -.95, .9); s.lineTo(0, 1.2); s.lineTo(.95, .9); s.bezierCurveTo(1, .2, 1, -.6, 0, -1.2); }, .25), '#2fd0a0', -3.7, G + 1.5, -7.6, { metalness: .4, roughness: .25 }); esc.rotation.y = .35; flutua(esc, .1); add(B(.12, .9, .1), '#ffffff', 0, -.05, .34, {}, esc).rotation.z = -.6; add(B(.12, .5, .1), '#ffffff', -.33, -.2, .34, {}, esc).rotation.z = .7;
      const ch = grupo(3.7, G + 1.4, -7.4, 1, -.4); ch.rotation.z = .5; add(T(.5, .15), '#ffd76a', 0, .7, 0, { metalness: .8, roughness: .25 }, ch); add(C(.13, .13, 1.7), '#ffd76a', 0, -.6, 0, { metalness: .8, roughness: .25 }, ch); add(B(.45, .15, .15), '#ffd76a', .25, -1.3, 0, { metalness: .8, roughness: .25 }, ch); add(B(.35, .15, .15), '#ffd76a', .22, -1, 0, { metalness: .8, roughness: .25 }, ch); flutua(ch, .12);
    },
    infra() { rack(-3.9, -7.5, .3, 1.15); rack(-1.8, -8, .12, 1.15); rack(.4, -8.1, 0, 1.15); rack(2.6, -8, -.14, 1.15); rack(4.6, -7.4, -.35, 1.15); [['#ff8a3a', -1], ['#4ac3ff', 1.2], ['#ffd23f', 3.2]].forEach(([c, x]) => { const a = add(T(.9, .06, Math.PI), c, x, G + .05, -6.9); a.scale.y = .5; }); },
    rede() {
      const q = grupo(0, G + 2.1, -8, 1); gira(q, .15); add(E(1.6, 28), '#2c6fd0', 0, 0, 0, { roughness: .35 }, q); const w = add(new THREE.IcosahedronGeometry(1.72, 2), '#bfe4ff', 0, 0, 0, { wireframe: true, roughness: 1 }, q); w.castShadow = false;
      [[.9, 1.1, 1], [-1.2, .5, 1.1], [.3, -.6, 1.6], [1.5, -.2, -.7], [-.6, 1.4, -.6], [-1.4, -.7, -.5]].forEach(p => { const v = new THREE.Vector3(...p).setLength(1.75); add(E(.14, 10), '#ffd23f', v.x, v.y, v.z, brilho('#e0a010'), q); });
      const a = grupo(3.8, G, -7.6, 1.1, -.5); add(C(.09, .14, 1.6), '#dbe3ee', 0, .8, 0, { metalness: .5 }, a); const d = add(new THREE.SphereGeometry(.95, 22, 10, 0, 6.3, 0, 1.1), '#f3f6fb', 0, 1.9, 0, { side: 2, roughness: .4 }, a); d.rotation.set(2.2, 0, 0); add(C(.04, .04, 1), '#ff5a5a', 0, 2, .5, {}, a).rotation.x = 1.1;
      const r = grupo(-3.8, G, -7.3, 1.1, .3); add(B(2, .4, 1.1), '#f3f6fb', 0, .25, 0, {}, r); [-.7, 0, .7].forEach(x => add(C(.07, .07, 1.2), '#303a52', x, 1, -.4, {}, r)); ['#39e58c', '#39e58c', '#4ac3ff', '#ffb02e'].forEach((c, k) => { add(E(.06, 8), c, -.5 + k * .3, .28, .56, brilho(c), r); });
    },
    codigo() {
      const chave = (x, cor, inv) => { const q = grupo(x, G + 1.7, -7.6, 1.15); q.scale.x *= inv; const o = { roughness: .3 }; const a = add(B(.32, 1.5, .4), cor, 0, .5, 0, o, q); a.rotation.z = -.75; const b = add(B(.32, 1.5, .4), cor, 0, -.5, 0, o, q); b.rotation.z = .75; flutua(q, .1); };
      chave(-2.2, '#ff7ac0', 1); chave(2.2, '#ff7ac0', -1); const bar = add(B(.32, 2.4, .4), '#ffd23f', 0, G + 1.7, -7.6, { roughness: .3 }); bar.rotation.z = -.35; flutua(bar, .1);
      [-4.4, 4.4].forEach((x, k) => { const q = grupo(x, G, -7.2, 1, k ? -.4 : .4); add(B(1.8, 2.2, .12), '#120d26', 0, 1.2, 0, { roughness: .3 }, q); ['#5fe08a', '#4ac3ff', '#ffd23f', '#ff7ac0', '#b58cff'].forEach((c, i) => { const w = .5 + ((i * 7 + k * 3) % 5) * .18; add(B(w, .13, .04), c, -.7 + w / 2 + (i % 3) * .12, 2 - i * .36, .08, brilho(c), q).castShadow = false; }); });
    },
    nuvem() { nuvem(0, G + 2.1, -8, 1.7); nuvem(-4, G + 1.3, -7.6, 1.1); nuvem(4, G + 1.5, -7.6, 1.2); rack(-2.2, -7.4, .2, .72); rack(2.2, -7.4, -.2, .72);[-1.1, 0, 1.1].forEach((x, i) => { const s = add(C(.06, .06, 1), '#ffd23f', x, G + .6, -7.3); s.castShadow = false; add(K(.2, .35), '#ffd23f', x, G + 1.2, -7.3); flutua(s, .03); }); },
    dados() {
      [['#ff6a8a', 1], ['#ffcf3f', 1.7], ['#5fe08a', 2.4], ['#4ac3ff', 3.1]].forEach(([c, h], i) => add(B(.75, h, .75), c, -1.4 + i * .95, G + h / 2, -7.7, { roughness: .25 }));
      const q = grupo(-4, G, -7.4, 1.1);[0, .75, 1.5].forEach((y, i) => { add(C(.95, .95, .6, 28), ['#2bb5c8', '#33c9b0', '#7fe0a0'][i], 0, .32 + y, 0, { metalness: .3, roughness: .3 }, q); });
      const r = grupo(4, G, -7.3, 1.1, -.25); add(B(1.1, .9, .8), '#e6ecf5', 0, 1.9, 0, {}, r); add(B(1.3, 1.2, .8), '#c3cede', 0, .8, 0, {}, r);[-.25, .25].forEach(x => add(E(.13, 12), '#23d0ff', x, 1.95, .42, brilho('#18a0d0'), r)); add(C(.03, .03, .5), '#8a96ac', 0, 2.55, 0, {}, r); add(E(.1, 10), '#ff5a7a', 0, 2.85, 0, {}, r);
    },
    viagem() {
      const a = grupo(.2, G + 2.9, -8.6, 1); a.rotation.set(.15, -.7, .12); const o = { roughness: .3 }; const cp = add(C(.3, .3, 2.6), '#ffffff', 0, 0, 0, o, a); cp.rotation.z = Math.PI / 2; add(K(.3, .6), '#ffffff', 1.6, 0, 0, o, a).rotation.z = -Math.PI / 2; add(B(.8, .08, 3.6), '#4a7fe0', .1, -.05, 0, o, a); add(B(.45, .06, 1.3), '#4a7fe0', -1.15, .1, 0, o, a); add(B(.5, .8, .08), '#ff5a5a', -1.2, .5, 0, o, a); flutua(a, .18, .7);
      const t = grupo(-3.8, G, -7.8, 1.05); add(new THREE.CylinderGeometry(.1, .75, 2.9, 4), '#b98a5a', 0, 1.45, 0, { metalness: .3 }, t); add(B(1.3, .14, 1.3), '#a87848', 0, .9, 0, {}, t); add(B(.75, .12, .75), '#a87848', 0, 1.7, 0, {}, t); add(C(.02, .05, .8), '#b98a5a', 0, 3.2, 0, {}, t);
      [[3.1, 1.6, 2.2], [4.7, 1.1, 1.5], [2.2, .8, 1]].forEach(([x, r, h]) => { add(new THREE.ConeGeometry(r, h, 4), '#e8c07a', x, G + h / 2, -8.2 + r * .4, { flatShading: true, roughness: .9 }).rotation.y = .8; });
      const m = grupo(-1.5, G, -7, .8, .3); add(B(1.3, .95, .5), '#d8503a', 0, .5, 0, {}, m); add(T(.22, .05, Math.PI), '#3a2a20', 0, 1, 0, {}, m);[-.4, .4].forEach(x => add(B(.1, .97, .53), '#ffd98a', x, .5, 0, {}, m));
    },
    animais() {
      const bicho = (x, z, s, cor, f) => { const q = grupo(x, G, z, s); f(q, cor); return q; };
      bicho(0, -7.5, 1.1, '#9aa7b8', (q, c) => { const co = add(E(1), c, 0, 1.2, 0, {}, q); co.scale.set(1.25, 1, .95); add(E(.62), c, 1.2, 1.7, .2, {}, q);[-1, 1].forEach(k => { const o = add(E(.42), '#b7a7b8', 1.05, 1.8, .2 + k * .58, {}, q); o.scale.set(.5, 1, .9); }); const tr = add(C(.1, .17, 1.2), c, 1.75, 1.1, .25, {}, q); tr.rotation.z = .35;[-.6, .6].forEach(a => [-.4, .4].forEach(b => add(C(.24, .24, .9), c, a, .4, b, {}, q)));[.02, .42].forEach(b => add(E(.07, 8), '#101318', 1.62, 1.85, b + .02, {}, q)); });
      bicho(-3.8, -7.2, 1, '#f2a23a', (q, c) => { add(E(.75), c, 0, .75, 0, {}, q); add(E(.55), c, 0, 1.6, .2, {}, q);[-.3, .3].forEach(x => { add(K(.2, .4), c, x, 2.15, .15, {}, q); add(E(.08, 8), '#143018', x * .7, 1.7, .68, {}, q); }); add(E(.08, 8), '#ff8fa0', 0, 1.53, .74, {}, q); const r = add(T(.45, .1, 3.2), c, -.8, .6, -.2, {}, q); r.rotation.z = -.6; });
      bicho(3.8, -7.2, 1, '#ffd23f', (q, c) => { const b = add(E(.75), c, 0, .7, 0, {}, q); b.scale.x = 1.25; add(E(.5), c, -.55, 1.5, .1, {}, q); add(K(.16, .4), '#ff8a2a', -1.1, 1.45, .2, {}, q).rotation.z = 1.5; add(E(.07, 8), '#101318', -.75, 1.65, .48, {}, q); add(K(.3, .5), c, .95, 1, 0, {}, q).rotation.z = -.9; });
      copa(-5.6, -8.6, 1.1); copa(5.6, -8.6, 1.1); copa(-2, -9, .9, '#7cc04e');
    },
    comida() {
      const b = grupo(0, G, -7.5, 1.15); add(C(1.5, 1.5, .12, 32), '#ffffff', 0, .06, 0, { roughness: .2 }, b); add(C(1.1, 1.1, .7, 32), '#8a4a2a', 0, .48, 0, {}, b); add(C(1.13, 1.1, .25, 32), '#ffe3ee', 0, .9, 0, {}, b); for (let i = 0; i < 8; i++) add(E(.13, 10), '#e0324a', Math.cos(i * .785) * .85, 1.1, Math.sin(i * .785) * .85, { roughness: .25 }, b);[-.3, 0, .3].forEach((x, i) => { add(C(.05, .05, .6), ['#4ac3ff', '#ffd23f', '#7ee08a'][i], x, 1.35, 0, {}, b); const c = add(K(.06, .2, 8), '#ffb02e', x, 1.75, 0, brilho('#ff9a1a'), b); c.castShadow = false; });
      const h = grupo(-3.9, G, -7.2, 1.05); const p = add(new THREE.SphereGeometry(1, 24, 12, 0, 6.3, 0, 1.57), '#e0a050', 0, .85, 0, {}, h); p.scale.y = .7; add(C(1.08, 1.08, .16, 28), '#6cc04a', 0, .8, 0, {}, h); add(C(1.02, 1.02, .28, 28), '#6a3820', 0, .58, 0, {}, h); add(C(1.05, 1, .12, 28), '#ffc93f', 0, .74, 0, {}, h); add(C(1, .9, .35, 28), '#d8964a', 0, .25, 0, {}, h);
      const s = grupo(3.9, G, -7.2, 1.05); add(K(.55, 1.5), '#d89a4e', 0, .75, 0, {}, s).rotation.x = Math.PI; add(E(.6), '#ff9ac0', 0, 1.75, 0, {}, s); add(E(.5), '#fff3d8', .05, 2.4, 0, {}, s); add(E(.14, 10), '#e0324a', .05, 2.95, 0, { roughness: .2 }, s);
    },
    frutas() {
      const maca = (x, z, c, s = 1) => { const q = grupo(x, G, z, s); const m = add(E(.8), c, 0, .75, 0, { roughness: .25 }, q); m.scale.y = .92; add(C(.04, .05, .4), '#5a3a20', 0, 1.6, 0, {}, q); const f = add(E(.25, 10), '#5db04a', .22, 1.65, 0, {}, q); f.scale.set(1, .3, .6); };
      maca(-.9, -7.2, '#e0324a', 1.1); maca(4, -7.2, '#8ccf3f'); add(E(.85), '#ff9a2a', .95, G + .85, -7.3, { roughness: .45 });
      const a = grupo(2.5, G, -7.9, 1); add(E(.8), '#e0a83a', 0, .95, 0, { roughness: .8, flatShading: true }, a).scale.y = 1.3; for (let i = 0; i < 7; i++) { const f = add(K(.16, 1.1, 6), '#3f9a4c', Math.cos(i) * .2, 2.3, Math.sin(i) * .2, {}, a); f.rotation.set(Math.sin(i) * .5, 0, -Math.cos(i) * .5); }
      const u = grupo(-2.7, G, -7.4, 1);[[0, .4, 0], [-.35, .8, 0], [.35, .8, 0], [0, .85, .3], [-.6, 1.2, 0], [0, 1.25, .1], [.6, 1.2, 0], [-.25, 1.2, .35], [.3, 1.22, .35]].forEach(p => add(E(.36), '#7a3ac0', ...p, { roughness: .25 }, u)); const me = add(new THREE.SphereGeometry(1.25, 26, 14, 0, Math.PI), '#e8485a', -4.6, G + .2, -7.2); me.rotation.x = -1.3; add(T(1.25, .13, Math.PI * 2), '#3f9a4c', -4.6, G + .2, -7.2).rotation.x = Math.PI / 2 - .05;
    },
    corpo() {
      const c = add(extr(coracao, .5), '#e8314f', 0, G + 1.7, -7.8, { roughness: .2 }); c.scale.setScalar(1.35); vivo(c); mexe.push(t => { const k = 1.35 + Math.sin(t * 2.2) * .035; c.scale.setScalar(k); });
      [-3.8, 3.8].forEach((x, k) => { const q = grupo(x, G + .1, -7.6, 1); for (let i = 0; i < 11; i++) { const a = i * .55, y = i * .29; const p = [Math.cos(a) * .7, y, Math.sin(a) * .7]; add(E(.15, 10), '#4ac3ff', ...p, {}, q); add(E(.15, 10), '#ffd23f', -p[0], y, -p[2], {}, q); const b = add(C(.05, .05, 1.4, 6), '#ffffff', 0, y, 0, {}, q); b.rotation.z = Math.PI / 2; b.rotation.y = -a; b.rotation.order = 'YXZ'; } gira(q, k ? .35 : -.35); });
    },
    natureza() { monte(-3.4, -11, 3.2, 4.2, '#6f86a0', true); monte(1.2, -12, 4, 5.2, '#5f7a98', true); monte(5, -11, 2.8, 3.6, '#7c92a8', true); arvore(-5, -7.6, 1.05); arvore(-3.7, -8.2, .85, '#58b050'); arvore(5, -7.6, 1.05); arvore(3.8, -8.2, .8, '#58b050'); copa(-1.6, -7.8, .8); const s = add(E(.9), '#ffd84a', 3, G + 4.4, -14, brilho('#ffb820')); s.castShadow = false; const l = add(new THREE.CircleGeometry(1.7, 30), '#4ab8e8', 1.2, G + .02, -7.4, { roughness: .1, metalness: .2 }); l.rotation.x = -Math.PI / 2; l.scale.y = .5; },
    brasil() {
      const pao = (x, z, r, h, c) => { const m = add(E(1, 22), c, x, G + h * .25, z, { roughness: .85 }); m.scale.set(r, h, r * .8); }; pao(1.6, -10.5, 1.5, 3, '#5a6a52'); pao(-.6, -10.8, 1.5, 1.6, '#4f7a4a'); pao(4.4, -10.8, 2, 1.5, '#4f7a4a');
      const m = add(new THREE.PlaneGeometry(40, 3), '#2f9ad8', 0, G + .02, -8.2, { roughness: .15, metalness: .2 }); m.rotation.x = -Math.PI / 2; const a = add(new THREE.PlaneGeometry(40, 1.2), '#f0d9a0', 0, G + .03, -6.4); a.rotation.x = -Math.PI / 2;
      [[-4.3, -6.7, 1], [4.6, -6.6, .9]].forEach(([x, z, s], k) => { const q = grupo(x, G, z, s); for (let i = 0; i < 6; i++) add(C(.12, .15, .5), '#9a7248', Math.sin(i * .25) * .35, .25 + i * .45, 0, {}, q); for (let i = 0; i < 7; i++) { const f = add(E(.8, 10), '#3fa04c', .35 + Math.cos(i * .9) * .65, 2.75, Math.sin(i * .9) * .65, {}, q); f.scale.set(1, .12, .3); f.rotation.set(0, -i * .9, -.35); } });
      const b = grupo(-1.6, G + 1.3, -7, .9); add(B(2.2, 1.5, .1), '#1fa04c', 0, 0, 0, {}, b); const l = add(new THREE.CircleGeometry(.95, 4), '#ffd93f', 0, 0, .06, {}, b); l.scale.set(1, .62, 1); add(new THREE.CircleGeometry(.36, 24), '#1f4fb0', 0, 0, .07, {}, b); add(C(.05, .05, 3), '#e8e8e8', -1.15, -.4, 0, {}, b);
    },
    esporte() {
      bola(0, G + 1.05, -7.2, 1.05); const t = grupo(-3.8, G, -7.4, 1.1), o = { metalness: .8, roughness: .22 }; add(C(.75, .4, 1.2, 26), '#f4c542', 0, 1.9, 0, o, t); add(C(.12, .2, .8), '#f4c542', 0, 1, 0, o, t); add(C(.6, .7, .35), '#3a2a20', 0, .3, 0, {}, t);[-1, 1].forEach(k => { const a = add(T(.4, .09, Math.PI), '#f4c542', k * .75, 2, 0, o, t); a.rotation.z = k > 0 ? -Math.PI / 2 : Math.PI / 2; });
      const b = add(E(.95), '#e8752a', 3.6, G + .95, -7.3, { roughness: .7 });[0, 1.57].forEach(r => { const l = add(T(.96, .03), '#2a1a10', 0, 0, 0, {}, b); l.rotation.y = r; });
      const g2 = grupo(0, G, -9.4, 1.1);[-2.6, 2.6].forEach(x => add(C(.09, .09, 2.4), '#ffffff', x, 1.2, 0, {}, g2)); add(C(.09, .09, 5.2), '#ffffff', 0, 2.4, 0, {}, g2).rotation.z = Math.PI / 2; for (let i = -5; i <= 5; i++) add(C(.015, .015, 2.4, 5), '#e8eef4', i * .5, 1.2, -.3, {}, g2); for (let i = 1; i < 5; i++) add(C(.015, .015, 5.2, 5), '#e8eef4', 0, i * .5, -.3, {}, g2).rotation.z = Math.PI / 2;
    },
    casa() {
      const q = grupo(0, G, -8, 1.15); add(B(3, 1.8, 2), '#fff3dc', 0, .9, 0, {}, q); const t = add(new THREE.CylinderGeometry(.01, 2.35, 1.4, 4), '#d8503a', 0, 2.5, 0, {}, q); t.rotation.y = Math.PI / 4; t.scale.z = .75; add(B(.7, 1.1, .06), '#7a4a28', 0, .55, 1.03, {}, q);[-1, 1].forEach(x => { add(B(.65, .6, .06), '#9fd8ff', x, 1, 1.03, { roughness: .1 }, q); }); add(B(.4, 1, .4), '#b0503a', .9, 2.7, 0, {}, q);
      copa(-4, -7.8, 1.1); copa(4.1, -7.9, 1.2, '#7cc04e'); for (let i = -6; i <= 6; i++) if (Math.abs(i) > 1) add(B(.22, .8, .1), '#ffffff', i * .85, G + .4, -6.6); nuvem(-2.6, G + 3.8, -12, .9);
    },
    cores() { const cs = ['#ff5a5a', '#ff9a3a', '#ffd93f', '#5fd06a', '#3fb8ff', '#6a6af0', '#c06af0']; cs.forEach((c, i) => { const a = add(T(3.9 - i * .34, .17, Math.PI, 48), c, 0, G, -9, { roughness: .35 }); a.castShadow = false; });[[-4.4, .9, '#ffd93f'], [4.4, .9, '#3fb8ff'], [-3, .6, '#ff5a7a'], [3.1, .6, '#5fd06a']].forEach(([x, r, c]) => flutua(add(E(r), c, x, G + r + .2, -7.2, { roughness: .2 }), .12)); nuvem(-3.9, G + .6, -9, .9); nuvem(3.9, G + .6, -9, .9); },
    cidade() { [[-5, 3], [-3.6, 2.2], [-2.3, 3.6], [-.8, 2.6], [.6, 4], [2, 2.4], [3.3, 3.4], [4.8, 2.4]].forEach(([x, h], i) => predio(x, -8.6 - (i % 2) * .8, 1.15, h, ['#3f5680', '#55698f', '#2f4468'][i % 3])); const s = add(E(1.1), '#ff9a4a', -1.6, G + 4.3, -15, brilho('#ff8a3a')); s.castShadow = false; },
    ferramentas() {
      const m = grupo(-2.8, G + .5, -7.4, 1.1); m.rotation.z = -.5; add(C(.15, .18, 2.6), '#c0803f', 0, .9, 0, {}, m); add(B(1.5, .6, .6), '#aab4c0', 0, 2.3, 0, { metalness: .8, roughness: .3 }, m);
      const c = grupo(2.8, G + .4, -7.4, 1.1); c.rotation.z = .5; add(C(.14, .14, 2.4), '#c8d2de', 0, 1, 0, { metalness: .8, roughness: .25 }, c); add(T(.42, .17, 4.6), '#c8d2de', 0, 2.5, 0, { metalness: .8, roughness: .25 }, c).rotation.z = -1.5;
      const e = grupo(0, G + 1.5, -8, 1); const en = add(C(1, 1, .5, 24), '#f2a02a', 0, 0, 0, { metalness: .5, roughness: .35 }, e); en.rotation.x = Math.PI / 2; for (let i = 0; i < 10; i++) { const d = add(B(.36, .45, .5), '#f2a02a', Math.cos(i * .628) * 1.15, Math.sin(i * .628) * 1.15, 0, { metalness: .5, roughness: .35 }, e); d.rotation.z = i * .628 + 1.57; } add(C(.38, .38, .56, 20), '#5a4632', 0, 0, 0, {}, e).rotation.x = Math.PI / 2; vivo(e); mexe.push(t => { e.rotation.z = t * .15; });
    },
    escola() {
      const l = grupo(0, G, -8.2, 1.1); add(B(4.4, 2.6, .15), '#1f5a44', 0, 1.6, 0, { roughness: .9 }, l); add(B(4.7, .16, .22), '#a8703a', 0, .25, 0, {}, l); add(B(4.7, .16, .22), '#a8703a', 0, 2.95, 0, {}, l); add(B(.16, 2.8, .22), '#a8703a', -2.3, 1.6, 0, {}, l); add(B(.16, 2.8, .22), '#a8703a', 2.3, 1.6, 0, {}, l);[[-.9, 2.2, 1.5], [-.6, 1.8, 2], [.7, 1.3, 1.6]].forEach(a => { add(B(a[2], .07, .02), '#f2fff6', a[0], a[1], .1, {}, l).castShadow = false; });
      [['#e0453a', .2], ['#3f7fe0', .62], ['#f2b632', 1.04]].forEach(([c, y], i) => { add(B(1.8 - i * .15, .38, 1.2), c, -4.1, G + y, -7, {}).rotation.y = i * .25; });
      [['#f2b632', 3.6, .15], ['#e0453a', 4.2, -.1], ['#3fa05a', 4.8, -.25]].forEach(([c, x, r]) => { const p = grupo(x, G + 1.1, -7.2, 1); p.rotation.z = r; add(C(.16, .16, 1.8, 6), c, 0, 0, 0, {}, p); add(K(.16, .4, 6), '#f0d2a0', 0, 1.1, 0, {}, p); add(K(.06, .15, 6), '#2a2a2a', 0, 1.25, 0, {}, p); });
    },
    espaco() {
      const p = add(E(1.3, 28), '#e0a060', -2.6, G + 2.1, -9, { roughness: .7 }); const a = add(T(1.95, .14), '#f2dcb0', -2.6, G + 2.1, -9); a.rotation.set(1.3, .3, 0); a.scale.z = .25; gira(p, .1); add(E(.75, 22), '#4a8fe0', 1.2, G + 3, -10.5, { roughness: .5 }); add(E(.45, 18), '#d8503a', 4.6, G + 2.9, -10, {});
      const f = grupo(3.3, G + .2, -7.6, 1.05); add(C(.45, .5, 1.7), '#f4f6fb', 0, 1.3, 0, {}, f); add(K(.45, .9), '#e0453a', 0, 2.6, 0, {}, f); add(C(.22, .22, .1), '#4ac3ff', 0, 1.6, .45, brilho('#2a90c8'), f).rotation.x = Math.PI / 2;[0, 2.09, 4.19].forEach(r => { const b = add(B(.1, .8, .6), '#e0453a', Math.sin(r) * .55, .7, Math.cos(r) * .55, {}, f); b.rotation.y = r; }); flutua(f, .16, .8);
      const n = 90, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 26; pos[i * 3 + 1] = G + .3 + Math.random() * 8; pos[i * 3 + 2] = -16 - Math.random() * 4; } const gp = new THREE.BufferGeometry(); gp.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const mp = new THREE.PointsMaterial({ color: 0xffffff, size: .09 }); lixo.push(gp, mp); g.add(new THREE.Points(gp, mp));
      [[-5, -7, .5], [-.4, -7.4, .4], [5.4, -7, .55]].forEach(([x, z, r]) => add(new THREE.IcosahedronGeometry(r, 0), '#6a5f9a', x, G + r * .4, z, { flatShading: true }));
    },
    mar() {
      [['#ff6a8a', -4.4], ['#ff9a3a', -3.5], ['#c06af0', 4.5]].forEach(([c, x], k) => { for (let i = 0; i < 6; i++) { const b = add(C(.08, .13, 1.5), c, x + Math.sin(i * 1.1) * .35, G + .7, -7.2 + Math.cos(i * 1.1) * .3); b.rotation.set(Math.cos(i) * .45, 0, -Math.sin(i * 1.1) * .5); add(E(.13, 8), c, x + Math.sin(i * 1.1) * .75, G + 1.4, -7.2 + Math.cos(i * 1.1) * .5); } });
      [['#ffd23f', -1.6, 1.9, 1], ['#ff7a3a', 1.4, 2.6, -1], ['#4ae0c0', 2.8, 1.2, 1]].forEach(([c, x, y, d], k) => { const q = grupo(x, G + y, -7.8, .95); q.scale.x *= d; const b = add(E(.6), c, 0, 0, 0, { roughness: .3 }, q); b.scale.set(1.2, .8, .5); add(K(.4, .6, 4), c, -.95, 0, 0, {}, q).rotation.z = -1.57; add(E(.1, 8), '#ffffff', .4, .12, .26, {}, q); add(E(.055, 8), '#101318', .45, .12, .34, {}, q); vivo(q); mexe.push(t => { q.position.x = x + Math.sin(t * .5 + k * 2) * .35; q.position.y = G + y + Math.sin(t * .9 + k) * .12; }); });
      const e = grupo(.2, G, -6.9, .8); for (let i = 0; i < 5; i++) { const r = add(K(.28, 1, 6), '#ff8a5a', Math.sin(i * 1.257) * .5, .1, Math.cos(i * 1.257) * .5, {}, e); r.rotation.set(Math.cos(i * 1.257) * 1.5, 0, -Math.sin(i * 1.257) * 1.5); } const bo = []; for (let i = 0; i < 8; i++) { const b = add(E(.1 + (i % 3) * .04, 10), '#e8fbff', -3 + i * .9, G + 1 + (i % 4) * .6, -8.4, { roughness: .05, transparent: true, opacity: .55 }); b.castShadow = false; flutua(b, .3, .6, i); bo.push(b); }
    },
    musica() {
      const nota = (x, y, c, s) => { const q = grupo(x, y, -7.6, s); const o = { roughness: .25 }; const a = add(E(.4), c, -.5, 0, 0, o, q); a.scale.set(1.15, .8, .7); const b = add(E(.4), c, .7, .2, 0, o, q); b.scale.set(1.15, .8, .7); add(C(.07, .07, 1.7), c, -.12, .85, 0, o, q); add(C(.07, .07, 1.7), c, 1.08, 1.05, 0, o, q); const t = add(B(1.3, .28, .16), c, .48, 1.75, 0, o, q); t.rotation.z = .16; flutua(q, .15); }; nota(-3.8, G + .8, '#ffd23f', 1); nota(3.3, G + 1, '#4ac3ff', .95);
      const v = grupo(0, G + 1, -7.8, 1); v.rotation.z = .35; const o = { roughness: .25 }; add(C(.9, .9, .4, 28), '#c8702a', 0, 0, 0, o, v).rotation.x = Math.PI / 2; add(C(.65, .65, .4, 28), '#c8702a', 0, 1.05, 0, o, v).rotation.x = Math.PI / 2; add(C(.3, .3, .42, 20), '#2a1408', 0, .65, 0, {}, v).rotation.x = Math.PI / 2; add(B(.24, 1.9, .16), '#4a2814', 0, 2.2, .2, {}, v); add(B(.4, .5, .18), '#4a2814', 0, 3.2, .2, {}, v);
    },
    festa() {
      [['#ff5a7a', -4.4, 2.5], ['#ffd23f', -3.3, 3.1], ['#4ac3ff', -2.3, 2.3], ['#7ee08a', 2.4, 2.4], ['#c06af0', 3.4, 3.1], ['#ff9a3a', 4.5, 2.5]].forEach(([c, x, y], i) => { const q = grupo(x, G + y, -7.8 - (i % 2) * .5, 1); const b = add(E(.62), c, 0, 0, 0, { roughness: .15 }, q); b.scale.y = 1.2; add(K(.12, .18, 8), c, 0, -.78, 0, {}, q); add(C(.015, .015, 1.8, 5), '#ffffff', 0, -1.7, 0, {}, q); flutua(q, .14, .7, i); });
      const p = grupo(0, G, -7.3, 1.05, .35); add(B(1.6, 1.2, 1.6), '#e83f8a', 0, .6, 0, { roughness: .3 }, p); add(B(1.75, .35, 1.75), '#ff6aa8', 0, 1.35, 0, { roughness: .3 }, p); add(B(.3, 1.6, 1.78), '#ffe08a', 0, .8, 0, {}, p); add(B(1.78, 1.6, .3), '#ffe08a', 0, .8, 0, {}, p);[-1, 1].forEach(k => { const l = add(T(.34, .1), '#ffe08a', k * .36, 1.8, 0, {}, p); l.rotation.y = k * .5; });
    },
    cinema() {
      const t = grupo(0, G, -8.6, 1.1); add(B(5.2, 2.8, .16), '#f6f2ea', 0, 1.8, 0, { ...brilho('#c8c0b0') }, t); add(B(5.6, .3, .3), '#c8902a', 0, 3.3, 0, { metalness: .6 }, t);[-3.2, 3.2].forEach(x => { for (let i = 0; i < 4; i++) add(C(.26, .3, 3.4, 10), '#b01f34', x + (i - 1.5) * .34, 1.7, .1, { roughness: .8 }, t); });
      const c = grupo(-3.7, G, -6.9, 1, .3); add(B(1.6, 1.1, .12), '#14161c', 0, .6, 0, {}, c); const b = add(B(1.6, .26, .12), '#14161c', 0, 1.35, 0, {}, c); b.rotation.z = .25;[-.5, 0, .5].forEach(x => { const f = add(B(.22, .26, .14), '#ffffff', x, 1.35 + x * .25, 0, {}, c); f.rotation.z = .25; f.castShadow = false; });
      const p = grupo(3.7, G, -6.9, 1); add(C(.75, .55, 1.3, 20), '#e0324a', 0, .65, 0, {}, p); for (let i = 0; i < 14; i++) add(E(.22, 8), i % 3 ? '#fff0c8' : '#ffd98a', Math.cos(i * 2.4) * .5 * ((i % 4) / 3), 1.4 + (i % 3) * .13, Math.sin(i * 2.4) * .5 * ((i % 4) / 3), { roughness: .9 }, p);
    },
  };
  g.remove(chao);
  DESENHO[nome]();
  juntar();
  // O fundo pode crescer um pouco quando sobra altura na tela: cresce a partir da beira do tabuleiro.
  const palco = new THREE.Group(), solo = new THREE.Group(); cena.remove(g); cena.add(palco, solo); palco.add(g); solo.add(chao);
  const escala = k => { g.position.set(0, 0, 5.5); palco.scale.setScalar(k); palco.position.set(0, G * (1 - k), -5.5); };
  escala(1);

  // Junta as formas paradas que têm o mesmo material, para desenhar tudo em poucas chamadas.
  function juntar() {
    g.updateMatrixWorld(true);
    const monta = (malhas, raiz) => {
      const porMat = new Map(), inv = raiz.matrixWorld.clone().invert();
      malhas.forEach(m => { const k = m.material.uuid + m.castShadow; (porMat.get(k) || porMat.set(k, []).get(k)).push(m); });
      for (const ms of porMat.values()) {
        const P = [], Nn = [], I = [], v = new THREE.Vector3(), mt = new THREE.Matrix4(), nm = new THREE.Matrix3();
        for (const m of ms) {
          mt.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(mt); const a = m.geometry.attributes, b0 = P.length / 3, vira = mt.determinant() < 0;
          for (let i = 0; i < a.position.count; i++) { v.fromBufferAttribute(a.position, i).applyMatrix4(mt); P.push(v.x, v.y, v.z); v.fromBufferAttribute(a.normal, i).applyMatrix3(nm).normalize(); Nn.push(v.x, v.y, v.z); }
          const ix = m.geometry.index, n = ix ? ix.count : a.position.count; for (let i = 0; i < n; i += 3) { const t = [0, 1, 2].map(k => b0 + (ix ? ix.getX(i + k) : i + k)); I.push(t[0], t[vira ? 2 : 1], t[vira ? 1 : 2]); }
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); geo.setIndex(I); lixo.push(geo);
        const r = new THREE.Mesh(geo, ms[0].material); r.castShadow = ms[0].castShadow; r.receiveShadow = true; raiz.add(r);
      }
    };
    const parados = [];
    for (const u of [...g.children]) {
      const ms = []; u.traverse(o => { if (o.isMesh && !(o === u && u.userData.vivo)) ms.push(o); });
      if (u.userData.vivo) { monta(ms, u); ms.forEach(m => { m.parent.remove(m); m.geometry.dispose(); }); }
      else if (ms.length) { parados.push(...ms); g.remove(u); }
    }
    monta(parados, g); parados.forEach(m => m.geometry.dispose());
  }
  return {
    nome, luz, escala,
    quadro(t) { for (const f of mexe) f(t); },
    tirar() { cena.remove(palco, solo); lixo.forEach(x => x.dispose()); },
  };
}

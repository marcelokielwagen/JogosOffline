/* Carro: um cupê de drift baixo e largo, de desenho próprio (sem marca). A carroceria é "costurada" a partir de
   cortes transversais ao longo do comprimento (capô longo, para-lamas largos, teto baixo, traseira fastback),
   com facetas à mostra no estilo do jogo. Vidros, faixa central e saias saem da mesma malha. */
const PINTURAS = [
  { id: 'perola', nome: 'pérola', lata: '#efe8dc', faixa: '#c4553f' },
  { id: 'tangerina', nome: 'tangerina', lata: '#e0782f', faixa: '#f4ead2' },
  { id: 'mostarda', nome: 'mostarda', lata: '#e2b23c', faixa: '#3b3330' },
  { id: 'oliva', nome: 'oliva', lata: '#7f8c4c', faixa: '#efe2c4' },
  { id: 'vinho', nome: 'vinho', lata: '#93403b', faixa: '#ecdcc2' },
  { id: 'menta', nome: 'menta', lata: '#93c4ab', faixa: '#f6efe4' }
];
const RODA = { r: .34, x: .86, z: 1.3 };

// interpola numa tabela [[z, valor], ...] (z decrescente)
function tabela(T, z) { if (z >= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (z >= T[i][0]) { const [z0, a] = T[i - 1], [z1, b] = T[i], k = (z - z1) / (z0 - z1); return b + (a - b) * k; } return T.at(-1)[1]; }

function geometriaCarroceria() {
  const ZS = [2.2, 2.14, 2.02, 1.85, 1.62, 1.42, 1.18, .95, .72, .55, .3, .05, -.25, -.55, -.85, -1.1, -1.32, -1.55, -1.78, -1.96, -2.1, -2.18];
  const BELT = [[2.2, .5], [2.12, .6], [1.9, .69], [1.5, .75], [1.1, .79], [.6, .84], [.2, .88], [-.6, .92], [-1.3, .94], [-1.8, .93], [-2.05, .88], [-2.18, .74]];
  const LADO = [[2.2, .66], [2.1, .82], [1.85, .93], [1.5, .99], [1.3, 1.01], [1.05, .98], [.7, .93], [.2, .91], [-.4, .93], [-.9, .99], [-1.3, 1.03], [-1.65, 1.0], [-1.95, .94], [-2.18, .84]];
  const TETO = [[.58, 0], [-.02, 1.31], [-.82, 1.28], [-1.78, .97]];   // para-brisa sobe, teto, vidro de trás desce até a tampa
  const arco = z => { let a = 0; for (const zw of [RODA.z, -RODA.z]) { const u = (z - zw) / .52; if (Math.abs(u) < 1) a = Math.max(a, .3 * Math.sqrt(1 - u * u)); } return a; };
  const aneis = ZS.map(z => {
    const yb = .26 + arco(z), yBelt = tabela(BELT, z), w = tabela(LADO, z);
    let yTeto = yBelt + .04, wTeto = w - .32, vidroLado = false, vidroCima = false, cabine = false;
    if (z < TETO[0][0] && z > TETO[3][0]) {
      vidroLado = cabine = true; wTeto = .66;
      if (z > TETO[1][0]) { const k = (TETO[0][0] - z) / (TETO[0][0] - TETO[1][0]); yTeto = yBelt + (TETO[1][1] - yBelt) * Math.pow(k, .8); vidroCima = true; }
      else if (z > TETO[2][0]) yTeto = TETO[1][1] + (TETO[2][1] - TETO[1][1]) * (TETO[1][0] - z) / (TETO[1][0] - TETO[2][0]);
      else { const k = (TETO[2][0] - z) / (TETO[2][0] - TETO[3][0]); yTeto = TETO[2][1] + (Math.max(yBelt + .04, TETO[3][1]) - TETO[2][1]) * k; vidroCima = true; }
      if (yTeto - yBelt < .1) vidroLado = false;
    }
    const yMid = Math.max(yb + .16, (yb + yBelt) / 2 + .04);
    // meio perfil (de baixo, no centro, subindo pelo lado direito até o centro do teto)
    const p = [[0, yb], [w - .1, yb], [w, Math.min(yMid - .04, yb + .1)], [w + .01, yMid], [w - .07, yBelt], [w - .2, yBelt + .03], [wTeto, yTeto], [.22, yTeto + .025], [0, yTeto + .03]];
    return { z, p, vidroLado, vidroCima, cabine };
  });
  // materiais: 0 lata, 1 vidro, 2 faixa, 3 escuro (saia e assoalho)
  const pos = [[], [], [], []];
  const tri = (m, a, b, c) => pos[m].push(...a, ...b, ...c);
  for (let k = 0; k < aneis.length - 1; k++) {
    const A = aneis[k], B = aneis[k + 1];
    for (let j = 0; j < A.p.length - 1; j++) {
      let m = 0;
      if (j <= 1) m = 3; else if (j === 5 && A.vidroLado && B.vidroLado) m = 1; else if (j >= 6 && A.vidroCima && B.vidroCima && (A.cabine || B.cabine)) m = 1; else if (j === 7) m = 2;
      for (const s of [1, -1]) {
        const a = [A.p[j][0] * s, A.p[j][1], A.z], b = [A.p[j + 1][0] * s, A.p[j + 1][1], A.z], c = [B.p[j][0] * s, B.p[j][1], B.z], d = [B.p[j + 1][0] * s, B.p[j + 1][1], B.z];
        if (s > 0) { tri(m, a, c, b); tri(m, b, c, d); } else { tri(m, a, b, c); tri(m, b, d, c); }
      }
    }
  }
  // tampas da frente e de trás (leque a partir do centro)
  for (const [A, sent] of [[aneis[0], 1], [aneis.at(-1), -1]]) {
    const cy = A.p.reduce((t, q) => t + q[1], 0) / A.p.length, c = [0, cy, A.z];
    for (let j = 0; j < A.p.length - 1; j++) for (const s of [1, -1]) {
      const a = [A.p[j][0] * s, A.p[j][1], A.z], b = [A.p[j + 1][0] * s, A.p[j + 1][1], A.z];
      if (s * sent > 0) tri(j <= 1 ? 3 : 0, c, b, a); else tri(j <= 1 ? 3 : 0, c, a, b);
    }
  }
  return pos.map(v => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g; });
}
let GEO_CARRO = null;

function criarCarro(pintura = PINTURAS[0], { fantasma = false } = {}) {
  const g = new THREE.Group(), corpo = new THREE.Group();
  const brilho = c => fantasma ? null : new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 70, specular: '#5c574f' });
  const fosco = c => fantasma ? null : new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const M = { lata: brilho(pintura.lata), faixa: brilho(pintura.faixa), vidro: fantasma ? null : new THREE.MeshPhongMaterial({ color: '#2f3d3b', flatShading: true, shininess: 120, specular: '#b8c4bf' }),
    escuro: fosco('#2f2a28'), farol: new THREE.MeshBasicMaterial({ color: '#fff6dc' }), lanterna: new THREE.MeshBasicMaterial({ color: '#9c3a2c' }), pneu: fosco('#2a2624'), aro: brilho('#d9c9a6'), chama: new THREE.MeshBasicMaterial({ color: '#ffb35a', transparent: true, opacity: .85 }) };
  if (fantasma) { const v = new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: .26, depthWrite: false }); for (const k in M) M[k] = v; }
  const peca = (geo, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = !fantasma; corpo.add(b); return b; };
  const caixa = (w, h, l, x, y, z, m) => peca(new THREE.BoxGeometry(w, h, l), m, x, y, z);
  GEO_CARRO = GEO_CARRO || geometriaCarroceria();
  [M.lata, M.vidro, M.faixa, M.escuro].forEach((m, i) => peca(GEO_CARRO[i], m));
  // frente: para-choque com lábio, grade, faróis finos e puxados
  caixa(1.28, .1, .14, 0, .29, 2.13, M.escuro);                                       // lábio dianteiro
  caixa(.9, .13, .04, 0, .46, 2.17, M.escuro);                                       // grade
  for (const s of [-1, 1]) {
    const f = caixa(.34, .05, .16, s * .46, .655, 2.0, M.farol); f.rotation.set(-.5, s * -.3, 0);
    caixa(.1, .08, 1.3, s * .88, .29, -.02, M.escuro);                                 // saia lateral
    caixa(.16, .08, .12, s * .83, .96, .44, M.lata);                                  // retrovisor
    caixa(.18, .08, .06, s * .55, .83, -2.13, M.lanterna);                          // lanternas
  }
  caixa(.64, .07, .05, 0, .83, -2.13, M.lanterna);                                   // faixa de lanterna no meio
  caixa(1.05, .1, .12, 0, .32, -1.98, M.escuro);                                   // difusor
  // aerofólio
  for (const s of [-1, 1]) caixa(.06, .24, .14, s * .52, 1.03, -1.86, M.escuro);
  const asa = caixa(1.78, .05, .36, 0, 1.16, -1.92, M.escuro); asa.rotation.x = .1;
  for (const s of [-1, 1]) caixa(.04, .2, .42, s * .9, 1.14, -1.92, M.escuro);
  // escapamento e chama do turbo
  const esc = peca(new THREE.CylinderGeometry(.06, .06, .2, 8).rotateX(Math.PI / 2), M.escuro, -.42, .3, -2.17);
  const chama = peca(new THREE.ConeGeometry(.09, .55, 7).rotateX(-Math.PI / 2), M.chama, -.42, .3, -2.5); chama.castShadow = false; chama.visible = false;
  // rodas: pneu, aro claro e cinco raios (aparecem girando)
  const rodas = [], rg = new THREE.CylinderGeometry(RODA.r, RODA.r, .3, 14).rotateZ(Math.PI / 2), ag = new THREE.CylinderGeometry(.23, .23, .31, 10).rotateZ(Math.PI / 2), raio = new THREE.BoxGeometry(.03, .055, .2).translate(0, 0, .11), cubo = new THREE.CylinderGeometry(.07, .07, .33, 6).rotateZ(Math.PI / 2);
  for (const [x, z] of [[-RODA.x, RODA.z], [RODA.x, RODA.z], [-RODA.x, -RODA.z], [RODA.x, -RODA.z]]) {
    const r = new THREE.Group(), gira = new THREE.Group(), pneu = new THREE.Mesh(rg, M.pneu); pneu.castShadow = !fantasma; gira.add(pneu, new THREE.Mesh(ag, M.escuro), new THREE.Mesh(cubo, M.aro));
    for (let k = 0; k < 5; k++) { const rr = new THREE.Mesh(raio, M.aro); rr.position.x = Math.sign(x) * .16; rr.rotation.x = k * Math.PI * 2 / 5; gira.add(rr); }
    r.add(gira); r.position.set(x, RODA.r, z); r.rotation.z = Math.sign(x) * (z > 0 ? .02 : .05); g.add(r); rodas.push({ grupo: r, gira });
  }
  g.add(corpo);
  // sombra macia embaixo (ajuda a ler o carro no chão)
  if (!fantasma) {
    const so = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec2 vU;void main(){float d=length(vU*vec2(1.,.9));gl_FragColor=vec4(.16,.12,.09,.42*smoothstep(1.,.3,d));}' }));
    so.rotation.x = -Math.PI / 2; so.position.y = .03; g.add(so);
  }
  return { grupo: g, corpo, rodas, farois: M.farol, lanterna: M.lanterna, chama, M,
    pintar(p) { if (fantasma) return; M.lata.color.set(p.lata); M.faixa.color.set(p.faixa); } };
}

/* Física de drift, gostosa e perdoável (pensada para teclado e botões de toque, sem volante analógico):
   - o carro tem um rumo (para onde aponta) e a velocidade tem a sua direção; os pneus puxam a velocidade
     para o rumo até o limite de aderência do chão.
   - em aderência normal, virar forte só faz o carro "sair de frente" (não roda).
   - DRIFT: começa com o freio de mão numa curva (em velocidade). Daí a
     traseira fica solta e o jogo segura o ângulo e a curva: virar para dentro abre o ângulo (até ~50°) e fecha a
     curva, soltar mantém (~29°), virar para fora endireita e sai do drift. Acelerar sustenta o drift; tirar o pé perde velocidade.
   - saindo de um drift longo, o carro ganha um empurrão de turbo. Bater é macio: ricocheteia e perde velocidade. */
function criarFisica(carro) {
  const F = { x: 0, z: 0, y: 0, rumo: 0, psi: 0, s: 0, vf: 0, vl: 0, ang: 0, wv: 0, giro: 0, giroRodas: 0, volante: 0, deriva: false, dir: 0, tDeriva: 0, saiu: 0, turbo: 0, derrapa: 0, superficie: 1, rpm: .15, marcha: 1, carga: 0, pitch: 0, roll: 0, espera: 0, batida: null, rodas: [], vel: 0 };
  const q = new THREE.Quaternion(), qy = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), eu = new THREE.Euler(), PI2 = Math.PI * 2, fecha = a => a - Math.round(a / PI2) * PI2;
  const lanternaBase = new THREE.Color('#9c3a2c'), lanternaFreio = new THREE.Color('#ff5a3c');
  F.colocar = ({ x, z, rumo }) => { Object.assign(F, { x, z, rumo, psi: rumo, s: 0, vf: 0, vl: 0, ang: 0, wv: 0, giro: 0, volante: 0, deriva: false, tDeriva: 0, saiu: 0, turbo: 0, derrapa: 0 }); F.y = MUNDO.altura(x, z); F.passo(0, { gas: 0, freio: 0, virar: 0, mao: false }); };
  F.sairDrift = () => { F.deriva = false; F.tDeriva = 0; };
  F.passo = (dt, ent) => {
    const M = MUNDO, sup = M.naEstrada(F.x, F.z), mu = (.6 + .4 * sup) * M.E.grip; F.superficie = sup; F.saiu = 0;
    const sA = Math.abs(F.s);
    // motor (mais força em baixa), turbo, arrasto, freio e ré
    let a = ent.gas * 17.5 * (1 - Math.min(1, sA / 46) * .55) * (.65 + .35 * sup) * (F.deriva ? Math.max(.75, Math.cos(F.ang)) : 1);
    if (F.turbo > 0) { a += 10 * Math.min(1, F.turbo * 2); F.turbo = Math.max(0, F.turbo - dt); }
    a -= F.s * (.22 + (1 - sup) * .5) + F.s * sA * .0032;
    if (ent.freio) { if (F.s > .5) a -= 24 * ent.freio; else { F.espera += dt; a = F.espera > .45 ? -ent.freio * 4 - F.s * .5 : -F.s * 6; } } else F.espera = 0;
    if (ent.mao) a -= Math.sign(F.s) * 4;
    if (F.deriva) a -= Math.abs(Math.sin(F.ang)) * (ent.gas ? 3 : 7) * Math.sign(F.s);
    F.s = Math.max(-6, F.s + a * dt);
    // volante
    F.volante += (ent.virar - F.volante) * Math.min(1, dt * 7);
    const dmax = .6 / (1 + sA * .05), delta = -F.volante * dmax;
    // aderência lateral: o quanto os pneus conseguem dobrar a velocidade (m/s²)
    const aMax = 9.8 * mu * (F.deriva ? 1.5 : 1.12) * (ent.mao ? .55 : 1), wvMax = aMax / Math.max(sA, 2);
    // começar o drift
    if (!F.deriva && F.s > 9 && Math.abs(F.volante) > .45 && ent.mao) { F.deriva = true; F.dir = -Math.sign(F.volante); F.tDeriva = 0; }
    // giro do carro
    let alvo;
    if (F.deriva) {
      const dentro = -F.volante * F.dir, angAlvo = F.dir * (dentro >= 0 ? .5 + .36 * dentro : .5 + .64 * dentro);
      alvo = F.wv + (angAlvo - F.ang) * 3.4 + (ent.mao ? -F.volante * 1.2 : 0);
      F.giro += (alvo - F.giro) * Math.min(1, dt * 6);
    } else {
      alvo = F.s * Math.tan(delta) / 2.6; const teto = wvMax * 1.1 + .25; alvo = Math.max(-teto, Math.min(teto, alvo));
      F.giro += (alvo - F.giro) * Math.min(1, dt * 8);
    }
    F.rumo += F.giro * dt;
    // a velocidade vira em direção ao rumo, até o limite dos pneus
    let ang = fecha(F.rumo - F.psi);
    if (sA < 1.5 || F.s < 0) { F.psi = F.rumo; F.wv = F.giro; ang = 0; }
    else if (F.deriva) {   // no drift a seta escolhe a curva: para dentro fecha, solta mantém, para fora abre
      const dentro = -F.volante * F.dir, wvAlvo = F.dir * wvMax * (dentro >= 0 ? .6 + .4 * dentro : .6 + .6 * dentro);
      F.wv += (wvAlvo - F.wv) * Math.min(1, dt * 5); F.psi += F.wv * dt; ang = fecha(F.rumo - F.psi);
    } else { F.wv = Math.max(-wvMax, Math.min(wvMax, ang * 10)); F.psi += F.wv * dt; ang = fecha(F.rumo - F.psi); }
    if (!F.deriva) F.s -= Math.sign(F.s) * Math.abs(Math.sin(ang)) * 4 * dt;
    if (Math.abs(ang) > 1.08) { F.psi = F.rumo - Math.sign(ang) * 1.08; ang = Math.sign(ang) * 1.08; }   // nunca roda: segura em ~62°
    F.ang = ang;
    if (F.deriva) {
      F.tDeriva += dt;
      const virouOLado = Math.sign(ang) === -F.dir && Math.abs(ang) > .06;
      if ((Math.abs(ang) < .09 && F.tDeriva > .35) || F.s < 5 || virouOLado) {
        if (F.tDeriva > .8 && F.s > 8) { F.turbo = Math.min(1.6, F.tDeriva * .32); F.saiu = F.tDeriva; }
        F.deriva = false; F.tDeriva = 0;
      }
    }
    F.vf = F.s * Math.cos(ang); F.vl = -F.s * Math.sin(ang);
    F.derrapa = Math.abs(F.vl) + (ent.mao ? sA * .15 : 0) + (F.deriva && ent.gas ? 2 : 0);
    // andar
    const vx = Math.sin(F.psi) * F.s, vz = Math.cos(F.psi) * F.s, sx = Math.sin(F.rumo), cz = Math.cos(F.rumo), x0 = F.x, z0 = F.z;
    F.x += vx * dt; F.z += vz * dt;
    if (M.molhado(F.x + sx * 1.8, F.z + cz * 1.8) || M.molhado(F.x, F.z)) { F.x = x0; F.z = z0; F.batidaAgua = sA; F.s *= -.25; F.psi = F.rumo; F.sairDrift(); }
    // batida macia: dois círculos (frente e trás)
    F.batida = null;
    for (const k of [1.15, -1.15]) {
      const cx = F.x + sx * k, cz2 = F.z + cz * k, b = M.bateu(cx, cz2, 1.05); if (!b) continue;
      F.x += b.nx * b.f; F.z += b.nz * b.f;
      const ux = Math.sin(F.psi) * F.s, uz = Math.cos(F.psi) * F.s, vn = ux * b.nx + uz * b.nz;
      if (vn < 0) {
        const nx = (ux - 1.35 * vn * b.nx) * .72, nz = (uz - 1.35 * vn * b.nz) * .72; F.s = Math.hypot(nx, nz); F.psi = Math.atan2(nx, nz);
        if (Math.cos(F.psi - F.rumo) < 0) { F.s = -F.s; F.psi += Math.PI; }
        F.giro += (b.nx * cz - b.nz * sx) * vn * .04 * k; F.batida = { forca: -vn, ...b }; if (-vn > 4) F.sairDrift();
      }
    }
    const lim = MAPA / 2 - 6; if (Math.abs(F.x) > lim || Math.abs(F.z) > lim) { F.x = Math.max(-lim, Math.min(lim, F.x)); F.z = Math.max(-lim, Math.min(lim, F.z)); F.s *= .9; }
    // chão: altura e inclinação pelos quatro cantos
    const h = (dx, dz) => M.altura(F.x + cz * dx + sx * dz, F.z - sx * dx + cz * dz), hf = h(0, 1.4), ht = h(0, -1.4), he = h(.9, 0), hd = h(-.9, 0), k = dt ? Math.min(1, dt * 18) : 1;
    F.y += ((hf + ht + he + hd) / 4 - F.y) * k; F.pitch += (Math.atan2(ht - hf, 2.8) - F.pitch) * Math.min(1, k * .6); F.roll += (Math.atan2(he - hd, 1.8) - F.roll) * Math.min(1, k * .6);
    // marchas de mentira, para o som subir e trocar; no drift o pneu patina e a rotação sobe
    const lims = [0, 9, 17, 25, 33, 99]; F.marcha = Math.max(1, lims.findIndex(l => sA < l)); const lo = lims[F.marcha - 1], hi = lims[F.marcha];
    F.rpm += ((.2 + .8 * (sA - lo) / (hi - lo)) * (ent.gas ? 1 : .8) + (ent.gas && F.deriva ? .22 : 0) - F.rpm) * Math.min(1, dt * 6); F.rpm = Math.min(1.15, F.rpm); F.carga += (ent.gas - F.carga) * Math.min(1, dt * 5);
    // desenho: carroceria inclina com a curva e nas frenagens; rodas da frente contra-esterçam no drift
    const c = carro.grupo; c.position.set(F.x, F.y, F.z); qy.setFromAxisAngle(up, F.rumo); c.quaternion.copy(qy).multiply(q.setFromEuler(eu.set(F.pitch, 0, F.roll)));
    carro.corpo.rotation.set(-F.carga * .022 + Math.min(.045, ent.freio * .04), 0, Math.max(-.07, Math.min(.07, F.s * F.wv * .006)));
    F.giroRodas += F.s * dt / RODA.r * (ent.gas && F.deriva ? 1.5 : 1);
    const esterco = F.deriva ? Math.max(-.6, Math.min(.6, -ang * .9)) : delta * .85;
    carro.rodas.forEach((r, i) => { r.gira.rotation.x = F.giroRodas; r.grupo.rotation.y = i < 2 ? esterco : 0; });
    carro.lanterna.color.copy(ent.freio || ent.mao ? lanternaFreio : lanternaBase);
    carro.chama.visible = F.turbo > 0; if (F.turbo > 0) carro.chama.scale.setScalar(.7 + Math.random() * .5);
    // onde ficam as rodas de trás (poeira e marcas)
    F.rodas = [-RODA.x, RODA.x].map(o => [F.x + cz * o - sx * RODA.z, F.z - sx * o - cz * RODA.z]);
    F.vel = sA;
  };
  return F;
}

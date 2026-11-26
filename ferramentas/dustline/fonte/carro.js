/* Carro: um hatch pequeno e quadradinho, de poucos polígonos (desenho próprio), e uma física simples de teste.
   */
function criarCarro() {
  const g = new THREE.Group(), corpo = new THREE.Group(), lambert = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const M = { lata: lambert('#e2b23c'), faixa: lambert('#f4ead2'), vidro: lambert('#3f5f5c'), escuro: lambert('#3b3330'), farol: new THREE.MeshBasicMaterial({ color: '#fff5d6' }), lanterna: lambert('#c4553f'), roda: lambert('#2e2a28'), cubo: lambert('#cfc6b5') };
  const caixa = (w, h, l, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); b.position.set(x, y, z); b.castShadow = true; corpo.add(b); return b; };
  caixa(1.72, .5, 3.7, 0, .62, 0, M.lata);                                   // carroceria
  caixa(1.76, .14, 3.74, 0, .44, 0, M.escuro);                               // saia
  caixa(1.74, .1, 3.72, 0, .82, 0, M.faixa);                                 // faixa clara em volta
  // cabine: perfil de trapézio extrudado
  const s = new THREE.Shape(); s.moveTo(-1.45, 0); s.lineTo(1.0, 0); s.lineTo(.62, .62); s.lineTo(-1.2, .62); s.closePath();
  const cab = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false }), M.lata); cab.geometry.translate(0, 0, -.75); cab.rotation.y = -Math.PI / 2; cab.position.set(0, .87, -.15); cab.castShadow = true; corpo.add(cab);
  const vs = new THREE.Shape(); vs.moveTo(-1.38, .06); vs.lineTo(.93, .06); vs.lineTo(.6, .56); vs.lineTo(-1.15, .56); vs.closePath();
  const vid = new THREE.Mesh(new THREE.ExtrudeGeometry(vs, { depth: 1.54, bevelEnabled: false }), M.vidro); vid.geometry.translate(0, 0, -.77); vid.rotation.y = -Math.PI / 2; vid.position.set(0, .87, -.15); vid.scale.set(1, 1, 1); corpo.add(vid);
  caixa(1.5, .08, 1.7, 0, 1.52, -.42, M.lata);                               // teto
  caixa(1.2, .06, .5, 0, 1.6, -.6, M.escuro);                                // bagageiro
  caixa(1.8, .2, .14, 0, .5, 1.9, M.escuro); caixa(1.8, .2, .14, 0, .5, -1.9, M.escuro);   // para-choques
  for (const x of [-.55, .55]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .06, 12).rotateX(Math.PI / 2), M.farol); f.position.set(x, .68, 1.86); corpo.add(f); caixa(.3, .12, .05, x * 1.25, .7, -1.86, M.lanterna); }
  caixa(.5, .5, .02, -.88, .66, .1, M.faixa).rotation.z = 0; const num = caixa(.02, .36, .36, -.875, .66, .1, M.escuro); num.position.x = -.885;   // círculo de número (sem marca)
  // rodas
  const rodas = [], rg = new THREE.CylinderGeometry(.36, .36, .26, 10).rotateZ(Math.PI / 2), cg = new THREE.CylinderGeometry(.17, .17, .27, 8).rotateZ(Math.PI / 2);
  for (const [x, z] of [[-.86, 1.2], [.86, 1.2], [-.86, -1.22], [.86, -1.22]]) { const r = new THREE.Group(), pneu = new THREE.Mesh(rg, M.roda), cubo = new THREE.Mesh(cg, M.cubo); pneu.castShadow = true; r.add(pneu, cubo); r.position.set(x, .36, z); g.add(r); rodas.push(r); }
  g.add(corpo);
  // sombra macia embaixo (ajuda a ler o carro no chão)
  const so = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.6), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec2 vU;void main(){float d=length(vU*vec2(1.,.9));gl_FragColor=vec4(.18,.14,.1,.35*smoothstep(1.,.35,d));}' }));
  so.rotation.x = -Math.PI / 2; so.position.y = .03; g.add(so);
  return { grupo: g, corpo, rodas, farois: M.farol };
}

/* Física de rali, gostosa e perdoável:
   - a direção gira o carro (rumo); a velocidade "fica para trás" quando ele gira, e a aderência dos pneus
     puxa de volta. Se a curva pede mais aderência do que o chão tem, sobra velocidade de lado: é a derrapagem.
   - freio de mão tira aderência de trás e solta a traseira; acelerar na derrapagem empurra mais um pouco.
   - sem volante, o carro se endireita sozinho (ajuda gentil). Bater é macio: ricocheteia e perde velocidade. */
function criarFisica(carro) {
  const F = { x: 0, z: 0, y: 0, rumo: 0, vf: 0, vl: 0, giro: 0, giroRodas: 0, volante: 0, derrapa: 0, superficie: 1, rpm: .15, marcha: 1, carga: 0, pitch: 0, roll: 0, espera: 0, batida: null, ultBatida: 0, rodas: [] };
  const q = new THREE.Quaternion(), qy = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), eu = new THREE.Euler();
  F.colocar = ({ x, z, rumo }) => { Object.assign(F, { x, z, rumo, vf: 0, vl: 0, giro: 0, volante: 0, derrapa: 0 }); F.y = MUNDO.altura(x, z); F.passo(0, { gas: 0, freio: 0, virar: 0, mao: false }); };
  F.passo = (dt, ent) => {
    const M = MUNDO, sup = M.naEstrada(F.x, F.z), mu = (.62 + .38 * sup) * M.E.grip; F.superficie = sup;
    // motor, freio e ré
    const acel = ent.gas * 15 * (.6 + .4 * sup), freio = ent.freio * (F.vf > .5 ? 22 : 9);
    let a = acel - F.vf * (.3 + (1 - sup) * .55) - F.vf * Math.abs(F.vf) * .0045;
    if (ent.freio) { if (F.vf > .5) a -= freio; else { F.espera += dt; a = F.espera > .5 ? -ent.freio * 4 - F.vf * .5 : -F.vf * 6; } } else F.espera = 0;
    if (ent.mao) a -= Math.sign(F.vf) * 3;
    F.vf = Math.max(-5, F.vf + a * dt);
    // direção: ângulo menor em alta velocidade; o giro segue o que as rodas pedem
    F.volante += (ent.virar - F.volante) * Math.min(1, dt * 6);
    const v = Math.hypot(F.vf, F.vl), dmax = .58 / (1 + Math.abs(F.vf) * .055), delta = -F.volante * dmax;
    let alvoGiro = F.vf * Math.tan(delta) / 2.4;
    const solto = ent.mao ? 1 : Math.min(1, Math.abs(F.vl) / 5);
    alvoGiro *= 1 + solto * (.3 + ent.gas * .2);                          // traseira solta gira mais
    if (!ent.virar && Math.abs(F.vl) > 1) alvoGiro += Math.sign(F.vl) * Math.min(.5, Math.abs(F.vl) * .06) * Math.sign(F.vf);   // endireita sozinho
    const beta = Math.atan2(F.vl, Math.max(2, Math.abs(F.vf)));   // ajuda de estabilidade: a derrapagem passa de ~35° e o carro se corrige, sem rodar
    if (Math.abs(beta) > .6) alvoGiro += Math.sign(beta) * (Math.abs(beta) - .6) * 4 * Math.sign(F.vf || 1);
    F.giro += (alvoGiro - F.giro) * Math.min(1, dt * (ent.mao ? 3 : 7));
    F.rumo += F.giro * dt;
    // a velocidade fica para trás quando o carro gira; o pneu segura até o limite do chão
    F.vl -= F.vf * F.giro * dt; F.vf += F.vl * F.giro * dt * .5;
    const segura = 9.8 * mu * (ent.mao ? .55 : 1) * dt; F.vl -= Math.max(-segura, Math.min(segura, F.vl * Math.min(1, dt * 9)));
    // ajuda de estabilidade: passou de ~32° de derrapagem, o giro que abriria mais é amortecido; o teto é ~48°
    const b2 = Math.atan2(F.vl, Math.max(2, Math.abs(F.vf)));
    if (Math.abs(b2) > .56 && F.giro * F.vl * Math.sign(F.vf || 1) < 0) F.giro *= Math.max(0, 1 - dt * 9);
    if (Math.abs(b2) > .84 && Math.abs(F.vf) > 2) F.vl = Math.sign(F.vl) * Math.tan(.84) * Math.abs(F.vf);
    F.derrapa = Math.abs(F.vl) + (ent.mao ? Math.abs(F.vf) * .15 : 0);
    const sx = Math.sin(F.rumo), cz = Math.cos(F.rumo), x0 = F.x, z0 = F.z;
    F.x += (sx * F.vf + cz * F.vl) * dt; F.z += (cz * F.vf - sx * F.vl) * dt;
    if (M.molhado(F.x + sx * 1.6, F.z + cz * 1.6) || M.molhado(F.x, F.z)) { const f = Math.hypot(F.vf, F.vl); F.x = x0; F.z = z0; F.vf *= -.25; F.vl *= .3; F.batidaAgua = f; }
    // batida macia: dois círculos (frente e trás)
    F.batida = null;
    for (const s of [1.05, -1.05]) {
      const cx = F.x + sx * s, cz2 = F.z + cz * s, b = M.bateu(cx, cz2, 1.05); if (!b) continue;
      F.x += b.nx * b.f; F.z += b.nz * b.f;
      const vx = sx * F.vf + cz * F.vl, vz = cz * F.vf - sx * F.vl, vn = vx * b.nx + vz * b.nz;
      if (vn < 0) { const nvx = vx - 1.35 * vn * b.nx, nvz = vz - 1.35 * vn * b.nz; F.vf = (nvx * sx + nvz * cz) * .72; F.vl = (nvx * cz - nvz * sx) * .72; F.giro += (b.nx * cz - b.nz * sx) * vn * .04 * s; F.batida = { forca: -vn, ...b }; }
    }
    const lim = MAPA / 2 - 6; if (Math.abs(F.x) > lim || Math.abs(F.z) > lim) { F.x = Math.max(-lim, Math.min(lim, F.x)); F.z = Math.max(-lim, Math.min(lim, F.z)); F.vf *= .9; F.vl *= .5; }
    // chão: altura e inclinação pelos quatro cantos
    const h = (dx, dz) => M.altura(F.x + cz * dx + sx * dz, F.z - sx * dx + cz * dz), hf = h(0, 1.4), ht = h(0, -1.4), he = h(.9, 0), hd = h(-.9, 0), k = dt ? Math.min(1, dt * 18) : 1;
    F.y += ((hf + ht + he + hd) / 4 - F.y) * k; F.pitch += (Math.atan2(ht - hf, 2.8) - F.pitch) * Math.min(1, k * .6); F.roll += (Math.atan2(he - hd, 1.8) - F.roll) * Math.min(1, k * .6);
    // marchas de mentira, para o som subir e trocar
    const lims = [0, 8, 15, 22, 29, 99]; F.marcha = Math.max(1, lims.findIndex(l => Math.abs(F.vf) < l)); const lo = lims[F.marcha - 1], hi = lims[F.marcha];
    F.rpm += ((.2 + .8 * (Math.abs(F.vf) - lo) / (hi - lo)) * (ent.gas ? 1 : .8) + (ent.gas && solto > .4 ? .18 : 0) - F.rpm) * Math.min(1, dt * 6); F.carga += (ent.gas - F.carga) * Math.min(1, dt * 5);
    // desenho: carroceria inclina na derrapagem e nas frenagens
    const c = carro.grupo; c.position.set(F.x, F.y, F.z); qy.setFromAxisAngle(up, F.rumo); c.quaternion.copy(qy).multiply(q.setFromEuler(eu.set(F.pitch, 0, F.roll)));
    carro.corpo.rotation.set(-F.carga * .025 + Math.min(.05, ent.freio * .04), 0, Math.max(-.08, Math.min(.08, -F.vl * .012 - F.giro * F.vf * .004)));
    F.giroRodas += F.vf * dt / .36; carro.rodas.forEach((r, i) => { r.children[0].rotation.x = r.children[1].rotation.x = F.giroRodas; r.rotation.y = i < 2 ? delta * .8 : 0; });
    // onde ficam as rodas de trás (poeira e marcas)
    F.rodas = [-.86, .86].map(o => [F.x + cz * o - sx * 1.22, F.z - sx * o - cz * 1.22]);
    F.vel = v;
  };
  return F;
}

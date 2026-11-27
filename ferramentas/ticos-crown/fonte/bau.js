'use strict';
// Baú Real em 3D: cai na tela, treme, a tampa abre com raios de luz e jorram moedas. Desenhado por cima de tudo.
const Bau = (() => {
  const cena = new THREE.Scene(); cena.environment = ENV;
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 60); cam.position.set(0, 1.7, 6.2); cam.lookAt(0, .55, 0);
  cena.add(new THREE.HemisphereLight(0xfff4e0, 0x5a3a8a, 1.2));
  { const a = new THREE.DirectionalLight(0xffffff, 2.2); a.position.set(3, 6, 5); cena.add(a); }
  const brilho = new THREE.PointLight(0xffd060, 0, 8, 1.2); brilho.position.set(0, 1.3, .6); cena.add(brilho);
  const fundo = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x0c0428, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  fundo.position.z = -4; cena.add(fundo);
  const texRaios = texCanvas(256, 256, (g, w, h) => { g.translate(128, 128); for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); const gr = g.createLinearGradient(0, 0, 0, -128); gr.addColorStop(0, 'rgba(255,230,140,.9)'); gr.addColorStop(1, 'rgba(255,230,140,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-6, 0); g.lineTo(-18, -128); g.lineTo(18, -128); g.lineTo(6, 0); g.fill(); } });
  const raios = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: texRaios, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  raios.position.set(0, 1, -1); cena.add(raios);
  const bau = new THREE.Group(); cena.add(bau);
  const mMad = new THREE.MeshStandardMaterial({ map: TEX_CAIXA[1], roughness: .6, color: 0xc8783a });
  const mVeludo = new THREE.MeshStandardMaterial({ color: 0x8a0c2a, roughness: .8 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, .9, 1.05), mMad); base.position.y = .45; bau.add(base);
  for (const x of [-.86, .86]) for (const z of [-.53, .53]) { const q = new THREE.Mesh(new THREE.BoxGeometry(.12, .92, .12), MAT.ouro); q.position.set(x, .45, z); bau.add(q); }
  const faixaB = new THREE.Mesh(new THREE.BoxGeometry(1.76, .1, 1.1), MAT.ouro); faixaB.position.y = .86; bau.add(faixaB);
  const interior = new THREE.Mesh(new THREE.BoxGeometry(1.55, .05, .9), new THREE.MeshBasicMaterial({ color: 0xffd860, toneMapped: false })); interior.position.y = .88; bau.add(interior);
  const tampaG = new THREE.Group(); tampaG.position.set(0, .9, -.52); bau.add(tampaG);
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(.53, .53, 1.7, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mMad); tampa.position.z = .52; tampaG.add(tampa);
  const tampaT = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.62, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mVeludo); tampaT.material = mVeludo.clone(); tampaT.material.side = THREE.BackSide; tampaT.position.z = .52; tampaG.add(tampaT);
  for (const x of [-.6, 0, .6]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .1, 24, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), MAT.ouro); b.material = MAT.ouro; b.position.set(x, 0, .52); tampaG.add(b); }
  const fecho = new THREE.Group(); fecho.position.set(0, .82, .55); bau.add(fecho);
  { const f = new THREE.Mesh(new THREE.BoxGeometry(.26, .3, .06), MAT.ouro); fecho.add(f); const j = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0xff1744, roughness: .05, clearcoat: 1, emissive: 0x600014 })); j.position.z = .05; fecho.add(j); }
  const geoMoeda = new THREE.CylinderGeometry(.12, .12, .03, 20).rotateX(Math.PI / 2);
  const moedas = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(geoMoeda, MAT.ouro); m.visible = false; cena.add(m); moedas.push({ m, v: new THREE.Vector3(), w: rnd(4, 10) }); }
  const fx = new Particulas(cena, 400, TEX_BRILHO);
  let visivel = false, t = 0;
  return {
    fx, get visivel() { return visivel; },
    async abrir() {
      visivel = true; t = 0; tampaG.rotation.x = 0; raios.material.opacity = 0; brilho.intensity = 0; fecho.visible = true; moedas.forEach(o => o.m.visible = false);
      Anim.add(.4, k => fundo.material.opacity = k * .78);
      bau.position.y = 5; bau.rotation.set(0, -.4, 0);
      await Anim.add(.55, k => bau.position.y = 5 * (1 - k), Ease.inn); Som.pancada(8); tremerTela(.1);
      await Anim.add(.3, k => { const s = Math.sin(k * Math.PI) * (1 - k); bau.scale.set(1 + s * .25, 1 - s * .25, 1 + s * .25); });
      await Anim.add(.6, k => { bau.rotation.y = -.4 + .4 * k; bau.rotation.z = Math.sin(k * 40) * .06 * k; });
      bau.rotation.z = 0; Som.porta(); fecho.visible = false;
      Anim.add(.5, k => { tampaG.rotation.x = -k * 1.9; }, Ease.back);
      Anim.add(.6, k => { raios.material.opacity = k * .9; brilho.intensity = k * 6; });
      Som.vitoria(); Confete.explodir(0, -L.H * .1, 70, 800);
      moedas.forEach((o, i) => { o.m.visible = true; o.m.position.set(rnd(-.4, .4), .9, rnd(-.2, .2)); o.v.set(rnd(-2.2, 2.2), rnd(4, 7), rnd(.5, 2.5)); setTimeout(() => Som.moeda(), (200 + i * 45) / VEL.v); });
      for (let i = 0; i < 40; i++) fx.emitir(rnd(-.6, .6), 1, rnd(-.2, .3), { vx: rnd(-2, 2), vy: rnd(1, 4), vz: rnd(0, 2), tam: rnd(.15, .35), vida: rnd(.6, 1.2), cor: [1, .9, .5], grav: 3 });
      await espera(1.2);
    },
    fechar() { Anim.add(.3, k => { fundo.material.opacity = .78 * (1 - k); raios.material.opacity *= (1 - k); }).then(() => { visivel = false; }); },
    update(dt) {
      if (!visivel) return; t += dt; raios.rotation.z += dt * .4; interior.material.color.setHSL(.13, 1, .6 + Math.sin(t * 5) * .1);
      for (const o of moedas) { if (!o.m.visible) continue; o.v.y -= 9 * dt; o.m.position.addScaledVector(o.v, dt); o.m.rotation.y += o.w * dt; if (o.m.position.y < 0) { o.m.position.y = 0; o.v.y *= -.35; o.v.x *= .7; o.v.z *= .7; } }
      fx.tick(dt);
    },
    desenhar() {
      if (!visivel) return; const pr = R.getPixelRatio(); cam.aspect = L.W / L.H; cam.fov = 34; const dz = L.W < L.H ? 6.2 / Math.max(.45, cam.aspect) * .62 : 6.2; cam.position.set(0, 1.7 + (dz - 6.2) * .12, dz); cam.lookAt(0, .7, 0); cam.updateProjectionMatrix();
      fx.mat.uniforms.escala.value = L.H * pr / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
      R.setViewport(0, 0, L.W, L.H); R.clearDepth(); R.render(cena, cam);
    },
  };
})();

'use strict';
/* MEJORAS GRÁFICAS EXPONENCIALES:
   luciérnagas, polvo, glow de ventanas, faros, luna, tone mapping */
window.CityFX = (function(){
  let scene = null, renderer = null, cars = [];
  let fireflies = null, dust = null, windowGlows = [];
  let moon = null, headlights = [];
  let inited = false;
  
  function init(_scene, _renderer, _cars){
    scene = _scene; renderer = _renderer; cars = _cars || [];
    if (!scene || !renderer) return;
    
    // Tone mapping cinematográfico
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    createFireflies();
    createDust();
    createWindowGlows();
    createHeadlights();
    createMoon();
    inited = true;
    console.log('[CityFX] ✓ Gráficos mejorados');
  }
  
  // Luciérnagas (solo de noche, cerca del parque/vegetación)
  function createFireflies(){
    const count = 80;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random()-.5)*120;
      pos[i*3+1] = Math.random()*3 + .3;
      pos[i*3+2] = (Math.random()-.5)*120;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({
      color: 0xc8ff5a, size: .18, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    fireflies = new THREE.Points(geo, mat);
    scene.add(fireflies);
  }
  
  // Polvo ambiental flotando
  function createDust(){
    const count = 250;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random()-.5)*160;
      pos[i*3+1] = Math.random()*8;
      pos[i*3+2] = (Math.random()-.5)*160;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({
      color: 0xa09080, size: .06, transparent: true, opacity: .25,
      depthWrite: false
    });
    dust = new THREE.Points(geo, mat);
    scene.add(dust);
  }
  
  // Glow cálido de ventanas (bloom simulado con sprites aditivos)
  function createWindowGlows(){
    const glowTex = makeGlowTexture();
    for (let i = 0; i < 50; i++) {
      const mat = new THREE.SpriteMaterial({
        map: glowTex, color: 0xffc36b, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sp = new THREE.Sprite(mat);
      const a = Math.random()*Math.PI*2;
      const r = 20 + Math.random()*80;
      sp.position.set(Math.sin(a)*r, 3 + Math.random()*8, Math.cos(a)*r);
      sp.scale.set(3, 3, 1);
      scene.add(sp);
      windowGlows.push(sp);
    }
  }
  
  function makeGlowTexture(){
    const c = document.createElement('canvas'); c.width=c.height=64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0,'rgba(255,255,255,1)');
    grad.addColorStop(.3,'rgba(255,200,120,.6)');
    grad.addColorStop(1,'rgba(255,150,60,0)');
    g.fillStyle = grad; g.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  
  // Faros de coches (conos emisivos que se encienden de noche)
  function createHeadlights(){
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      if (!c.g) continue;
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfff4c0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      for (let s = 0; s < 2; s++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(.6, 5, 8, 1, true), coneMat.clone());
        cone.rotation.x = -Math.PI/2;
        cone.position.set(s===0?-.6:.6, .8, 3.2);
        c.g.add(cone);
        headlights.push(cone);
      }
    }
  }
  
  function createMoon(){
    const moonTex = makeGlowTexture();
    const mat = new THREE.SpriteMaterial({
      map: moonTex, color: 0xd0e0ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    moon = new THREE.Sprite(mat);
    moon.position.set(120, 150, -180);
    moon.scale.set(40, 40, 1);
    scene.add(moon);
  }
  
  function update(dt, daylight, isNight, playerPos){
    if (!inited) return;
    const t = performance.now() * .001;
    
    // Luciérnagas: visibles solo de noche, flotan
    if (fireflies) {
      fireflies.material.opacity = isNight ? .8 : 0;
      if (isNight) {
        const pos = fireflies.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i+1] += Math.sin(t*2 + i)*.004;
          pos[i] += Math.cos(t*1.5 + i)*.003;
        }
        fireflies.geometry.attributes.position.needsUpdate = true;
        if (playerPos) fireflies.position.set(playerPos.x*0, 0, playerPos.z*0);
      }
    }
    
    // Polvo: deriva lenta
    if (dust) {
      dust.rotation.y += dt * .01;
      dust.position.y = Math.sin(t*.3)*.3;
    }
    
    // Glow de ventanas: de noche parpadean suavemente
    for (let i = 0; i < windowGlows.length; i++) {
      const sp = windowGlows[i];
      if (isNight) {
        sp.material.opacity = .4 + Math.sin(t*1.2 + i*7)*.15;
      } else {
        sp.material.opacity = 0;
      }
    }
    
    // Faros de coches de noche
    for (let i = 0; i < headlights.length; i++) {
      headlights[i].material.opacity = isNight ? .3 : 0;
    }
    
    // Luna de noche
    if (moon) moon.material.opacity = isNight ? .9 : 0;
  }
  
  return { init:init, update:update };
})();
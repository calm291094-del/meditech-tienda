'use strict';
/* ============================================================
   SISTEMA DE CLIMA — versión corregida
   Empieza DESPEJADO · primer cambio a los 4 min · función set()
   ============================================================ */
window.Weather = (function(){
  const TYPES = ['clear','clear','clear','cloudy','rain','fog','storm']; // más probabilidad de despejado
  let current = 'clear';
  let changeTimer = 240; // primer cambio después de 4 min (NO al instante)
  let rainParticles = null;
  let sceneRef = null;
  
  function init(scene){
    sceneRef = scene;
    if(rainParticles){ applyWeather(); return; } // ya inicializado (evita duplicados)
    
    const count = 1500;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      positions[i*3] = (Math.random()-.5)*100;
      positions[i*3+1] = Math.random()*50;
      positions[i*3+2] = (Math.random()-.5)*100;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    const mat = new THREE.PointsMaterial({
      color:0xaaccff, size:.15, transparent:true, opacity:.6, depthWrite:false
    });
    rainParticles = new THREE.Points(geo, mat);
    rainParticles.visible = false;
    scene.add(rainParticles);
    
    applyWeather(); // aplica 'clear' inicial
  }
  
  // Forzar un clima concreto (lo usa game.js al iniciar)
  function set(w){
    if(TYPES.indexOf(w) >= 0){
      current = w;
      changeTimer = 240 + Math.random()*180;
      applyWeather();
    }
  }
  
  function applyWeather(){
    if(!sceneRef) return;
    switch(current){
      case 'clear':  sceneRef.fog.far = 300; if(rainParticles)rainParticles.visible=false; break;
      case 'cloudy': sceneRef.fog.far = 240; if(rainParticles)rainParticles.visible=false; break;
      case 'rain':   sceneRef.fog.far = 160; if(rainParticles)rainParticles.visible=true;  break;
      case 'fog':    sceneRef.fog.far = 70;  if(rainParticles)rainParticles.visible=false; break;
      case 'storm':  sceneRef.fog.far = 110; if(rainParticles)rainParticles.visible=true;  break;
    }
  }
  
  function update(dt, scene, playerPos){
    changeTimer -= dt;
    if(changeTimer <= 0){
      changeTimer = 240 + Math.random()*240;
      current = pick(TYPES);
      applyWeather();
      // Avisar solo climas peligrosos
      if((current==='storm'||current==='fog') && window.toast){
        toast('⚠️ El clima empeora: '+(current==='storm'?'TORMENTA':'NIEBLA'),'bad');
      }
    }
    // Animar lluvia siguiendo al jugador
    if(rainParticles && rainParticles.visible && playerPos){
      rainParticles.position.set(playerPos.x, 20, playerPos.z);
      const pos = rainParticles.geometry.attributes.position.array;
      for(let i=0;i<pos.length;i+=3){
        pos[i+1] -= 1.2;
        if(pos[i+1] < 0){
          pos[i+1] = 50;
          pos[i] = (Math.random()-.5)*100;
          pos[i+2] = (Math.random()-.5)*100;
        }
      }
      rainParticles.geometry.attributes.position.needsUpdate = true;
    }
    // Relámpagos en tormenta
    if(current === 'storm' && Math.random() < dt*.3){
      if(window.flashWorld) window.flashWorld();
    }
  }
  
  function getCurrent(){ return current; }
  function getZombieSpeedMul(){
    if(current === 'rain') return .85;
    if(current === 'fog') return .7;
    if(current === 'storm') return .6;
    return 1;
  }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  
  return { init:init, set:set, update:update, getCurrent:getCurrent, getZombieSpeedMul:getZombieSpeedMul };
})();
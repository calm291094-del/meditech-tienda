'use strict';
/* SISTEMA DE RUIDO: disparar/correr/radio genera ruido que atrae hordas */
window.NoiseSystem = (function(){
  let level = 0;          // 0-100
  let indicator = null;
  let CFG = { DECAY:8, HORDE_THRESHOLD:50, ATTRACT_RADIUS:60 };
  
  function init(){
    indicator = document.getElementById('noise-indicator');
    if (window.CONFIG && window.CONFIG.NOISE) CFG = window.CONFIG.NOISE;
  }
  
  function add(amount, player){
    // Reducción por skill de sigilo
    let mul = 1;
    if (window.Progression && player) {
      const lvl = Progression.getSkill('sigilo1');
      mul -= lvl * 0.13; // hasta -40%
    }
    level = Math.min(100, level + amount * Math.max(0.2, mul));
  }
  
  function update(dt, playerPos, zombies){
    // Decaimiento natural
    level = Math.max(0, level - CFG.DECAY * dt);
    
    // Radio añade ruido continuo
    if (window.AudioSystem && AudioSystem.isRadioOn()) {
      level = Math.min(100, level + CFG.RADIO * dt);
    }
    
    // UI indicator
    if (indicator) {
      if (level > 25) {
        indicator.classList.remove('hidden');
        indicator.style.opacity = Math.min(1, level/60);
      } else {
        indicator.classList.add('hidden');
      }
    }
    
    // Si supera el umbral, atrae zombis cercanos
    if (level > CFG.HORDE_THRESHOLD && playerPos && zombies) {
      for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        if (z.dead) continue;
        const d = Math.hypot(z.x - playerPos.x, z.z - playerPos.z);
        if (d < CFG.ATTRACT_RADIUS) {
          z.aggro = 10;
          z.tx = playerPos.x;
          z.tz = playerPos.z;
          z.state = 'chase';
        }
      }
    }
  }
  
  function get(){ return level; }
  function reset(){ level = 0; }
  
  return { init:init, add:add, update:update, get:get, reset:reset };
})();
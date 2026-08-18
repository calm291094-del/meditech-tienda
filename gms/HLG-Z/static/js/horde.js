'use strict';
/* HORDAS NOCTURNAS: cada noche una horda crece con los días */
window.HordeSystem = (function(){
  let active = false;
  let countdown = 0;
  let spawnTimer = 0;
  let toSpawn = 0;
  let spawnedCount = 0;
  let lastDay = 0;
  let alertEl = null, timerEl = null, countEl = null;
  let CFG = { FIRST_NIGHT:2, BASE_SIZE:8, GROWTH_PER_DAY:5, COUNTDOWN:45, SPAWN_INTERVAL:1.2 };
  
  function init(){
    alertEl = document.getElementById('horde-alert');
    timerEl = document.querySelector('.horde-timer');
    countEl = document.querySelector('.horde-count');
    if (window.CONFIG && window.CONFIG.HORDE) CFG = window.CONFIG.HORDE;
  }
  
  function hordeSize(day){
    return CFG.BASE_SIZE + (day - CFG.FIRST_NIGHT) * CFG.GROWTH_PER_DAY;
  }
  
  function update(dt, day, isNight, playerPos, spawnFn){
    if (!alertEl) return;
    
    // Activar countdown al anochecer (si es día suficiente)
    if (isNight && day >= CFG.FIRST_NIGHT && !active && lastDay !== day) {
      active = true;
      countdown = CFG.COUNTDOWN;
      toSpawn = hordeSize(day);
      spawnedCount = 0;
      lastDay = day;
      alertEl.classList.remove('hidden');
      if (window.sfx && sfx.hordeAlarm) sfx.hordeAlarm();
      if (window.toast) toast('⚠️ Se acerca una HORDA. ¡Fortifícate!', 'bad');
    }
    
    if (!active) {
      if (!isNight) lastDay = 0;
      return;
    }
    
    // Fase de countdown
    if (countdown > 0) {
      countdown -= dt;
      if (timerEl) {
        const s = Math.max(0, Math.ceil(countdown));
        timerEl.textContent = '00:' + String(s).padStart(2,'0');
      }
      if (countEl) countEl.textContent = toSpawn + ' muertos acercándose';
      if (countdown <= 0) {
        if (timerEl) timerEl.textContent = '¡AHORA!';
      }
      return;
    }
    
    // Fase de spawn masivo
    if (spawnedCount < toSpawn) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && playerPos && spawnFn) {
        spawnTimer = CFG.SPAWN_INTERVAL;
        // Spawn en círculo alrededor del jugador
        const a = Math.random()*Math.PI*2;
        const r = 35 + Math.random()*15;
        const x = playerPos.x + Math.sin(a)*r;
        const z = playerPos.z + Math.cos(a)*r;
        spawnFn(x, z, true); // true = modo horda (más agresivo)
        spawnedCount++;
        if (countEl) countEl.textContent = (toSpawn - spawnedCount) + ' restantes';
      }
    } else {
      // Horda completada
      active = false;
      alertEl.classList.add('hidden');
      if (window.toast) toast('La horda ha llegado. Sobrevive.', 'bad');
    }
  }
  
  function isActive(){ return active; }
  
  return { init:init, update:update, isActive:isActive };
})();
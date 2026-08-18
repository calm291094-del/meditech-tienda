'use strict';
/* LA LOMA DE LA CRUZ — los 458 escalones hacia la salvación */
window.LomaSystem = (function(){
  let scene = null;
  let active = false;
  let progress = 0;
  let ESCALONES = 458;
  let REQUIERE_DIA = 5;
  let marker = null;
  
  function init(_scene){
    scene = _scene;
    if (window.CONFIG && window.CONFIG.LOMA) {
      ESCALONES = window.CONFIG.LOMA.ESCALONES;
      REQUIERE_DIA = window.CONFIG.LOMA.REQUIERE_DIA;
    }
  }
  
  function reset(){ active = false; progress = 0; }
  
  function getHint(player){
    if (!window.lomaPos) return null;
    const d = Math.hypot(player.pos.x - window.lomaPos.x, player.pos.z - window.lomaPos.z);
    if (d < 20) {
      if (active) {
        return '⛰️ SUBIENDO: ' + progress + '/' + ESCALONES + ' escalones';
      }
      if (window.day !== undefined && window.day < REQUIERE_DIA) {
        return '⛰️ La Loma está bloqueada (necesitas día ' + REQUIERE_DIA + ')';
      }
      return '<em>E</em> COMENZAR EL ASCENSO FINAL (' + ESCALONES + ' escalones)';
    }
    return null;
  }
  
  function update(dt, player, day){
    if (!window.lomaPos) return;
    const d = Math.hypot(player.pos.x - window.lomaPos.x, player.pos.z - window.lomaPos.z);
    
    // Si está cerca y pulsa E, inicia el ascenso (lo maneja interactTarget)
    if (active && d < 25) {
      // Subir escalones con el tiempo mientras está cerca
      progress += dt * 15; // ~15 escalones por segundo
    
      if (progress >= ESCALONES) {
        victory();
      }
    }
  }
  
  function startClimb(player, day){
    if (day < REQUIERE_DIA) {
      if (window.toast) toast('⛰️ La Loma se desbloquea el día ' + REQUIERE_DIA, 'bad');
      return false;
    }
    active = true;
    progress = 0;
    if (window.toast) toast('⛰️ ¡Comienzas el ascenso! Sobrevive hasta arriba', 'mission');
    if (window.announce) announce('EL ASCENSO FINAL', '458 escalones hacia la salvación');
    // Spawn de zombis durante el ascenso para dificultar
    return true;
  }
  
  function victory(){
    active = false;
    if (window.announce) announce('¡HAS LLEGADO A LA CIMA!', 'Holguín está a tus pies');
    if (window.sfx) sfx.level();
    setTimeout(function(){
      if (window.showVictory) window.showVictory();
    }, 2500);
  }
  
  function isActive(){ return active; }
  function getProgress(){ return progress; }
  
  return { init:init, reset:reset, getHint:getHint, update:update,
           startClimb:startClimb, victory:victory, isActive:isActive, getProgress:getProgress };
})();
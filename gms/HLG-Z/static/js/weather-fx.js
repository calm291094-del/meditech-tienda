'use strict';
/* CLIMA VISUAL EN PANTALLA — sincroniza #weather-fx con Weather */
window.WeatherFX = (function(){
  let el = null;
  let current = '';
  
  function init(){
    el = document.getElementById('weather-fx');
    // Conectar con el relámpago de weather.js
    window.flashWorld = flash;
  }
  
  function update(dt){
    if(!el) return;
    const w = window.Weather ? Weather.getCurrent() : 'clear';
    if(w !== current){
      current = w;
      el.classList.remove('is-clear','is-cloudy','is-rain','is-fog','is-storm');
      el.classList.add('is-' + w);
    }
  }
  
  function flash(){
    if(!el) return;
    el.classList.remove('flash');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('flash');
    if(window.sfx) sfx.thud();
    setTimeout(function(){ el.classList.remove('flash'); }, 700);
  }
  
  return { init:init, update:update, flash:flash };
})();
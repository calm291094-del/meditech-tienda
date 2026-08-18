'use strict';
/* RADIO CUBANA: sube la moral pero genera ruido que atrae hordas */
window.RadioSystem = (function(){
  let widget = null, menu = null, stationsEl = null;
  let toggleBtn = null;
  let STATIONS = [];
  
  function init(){
    widget = document.getElementById('radio-widget');
    menu = document.getElementById('radio-menu');
    stationsEl = document.getElementById('radioStations');
    toggleBtn = document.getElementById('radio-toggle');
    if (window.CONFIG && window.CONFIG.RADIO) STATIONS = CONFIG.RADIO.STATIONS;
    
    if (toggleBtn) {
      toggleBtn.onclick = function(){ turnOff(); };
    }
    
    buildStationList();
  }
  
  function buildStationList(){
    if (!stationsEl) return;
    stationsEl.innerHTML = '';
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<div class="ic">📻</div><div class="nm">' + st.name + '<small>' + st.desc + ' · tempo ' + st.tempo + '</small></div>';
      const btn = document.createElement('button');
      btn.className = 'buy';
      btn.textContent = 'SINTONIZAR';
      btn.onclick = (function(s){ return function(){ tuneTo(s); }; })(st);
      row.appendChild(btn);
      stationsEl.appendChild(row);
    }
  }
  
  function openMenu(){
    if (menu) menu.classList.remove('hidden');
    if (window.setState) window.setState('INV');
  }
  
  function tuneTo(station){
    if (!window.AudioSystem) return;
    AudioSystem.resume();
    AudioSystem.playRadio(station);
    if (menu) menu.classList.add('hidden');
    if (widget) {
      widget.classList.remove('hidden');
      const nameEl = widget.querySelector('.radio-station');
      if (nameEl) nameEl.textContent = station.name;
    }
    if (window.setState) window.setState('PLAY');
    if (window.toast) toast('📻 ' + station.name + ' sonando. +Moral, +Riesgo', 'good');
  }
  
  function turnOff(){
    if (window.AudioSystem) AudioSystem.stopRadio();
    if (widget) widget.classList.add('hidden');
    if (window.toast) toast('Radio apagada', 'good');
  }
  
  function update(dt){
    // El efecto de moral/ruido lo manejan NoiseSystem y Progression
  }
  
  return { init:init, openMenu:openMenu, tuneTo:tuneTo, turnOff:turnOff, update:update };
})();
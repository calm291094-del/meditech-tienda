'use strict';
/* ============================================================
   CINEMÁTICA DE INTRO — versión robusta
   El texto aparece con typewriter y el skip funciona al instante
   ============================================================ */
window.Intro = (function(){
  let scenes = [];
  let currentScene = 0;
  let active = false;
  let skipRequested = false;
  let onCompleteCb = null;
  let overlay = null, textEl = null, subEl = null, sceneBg = null;
  let typeInterval = null;
  let sceneTimeout = null;
  
  function init(){
    scenes = [
      { bg:'#0a1428', text:'Holguín. La Ciudad de los Parques.', sub:'Un lugar donde la vida fluía como el son.' },
      { bg:'#1a1e3a', text:'Era una noche como cualquier otra...', sub:'Los faroles del Parque Calixto García se encendían.' },
      { bg:'#3a1a2a', text:'Los muertos del cementerio de Santa Lucía se levantaron.', sub:'Nadie sabe por qué. Nadie pudo detenerlo.' },
      { bg:'#4a0a0a', text:'En horas, la ciudad cayó.', sub:'Los parques se llenaron de silencio. Las calles, de ellos.' },
      { bg:'#2a1a0a', text:'Algunos sobrevivientes se atrincheraron.', sub:'Tú eres uno de ellos.' },
      { bg:'#1a2a3a', text:'Sobrevive. Fortifica. Aprende.', sub:'Y cuando estés listo... sube los 458 escalones de la Loma de la Cruz.' }
    ];
    createUI();
  }
  
  function createUI(){
    // Si ya existe, no duplicar
    if(document.getElementById('intro-cinematic')){
      overlay = document.getElementById('intro-cinematic');
      textEl = overlay.querySelector('#intro-text');
      subEl = overlay.querySelector('#intro-sub');
      sceneBg = overlay.querySelector('#intro-bg');
      return;
    }
    
    overlay = document.createElement('div');
    overlay.id = 'intro-cinematic';
    overlay.className = 'hidden';
    overlay.innerHTML = 
      '<div class="intro-bg" id="intro-bg"></div>' +
      '<div class="intro-vignette"></div>' +
      '<div class="intro-content">' +
      '  <div class="intro-text" id="intro-text"></div>' +
      '  <div class="intro-sub" id="intro-sub"></div>' +
      '</div>' +
      '<div class="intro-skip">Clic · ESPACIO · ENTER para saltar</div>';
    
    // OCULTO desde el inicio (importante)
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    // Guardar referencias directamente
    textEl = overlay.querySelector('#intro-text');
    subEl = overlay.querySelector('#intro-sub');
    sceneBg = overlay.querySelector('#intro-bg');
    
    // Skip con click en cualquier parte
    overlay.addEventListener('mousedown', function(){
      if(active) skip();
    });
  }
  
  function play(onComplete){
    if(!overlay) createUI();
    onCompleteCb = onComplete || null;
    currentScene = 0;
    skipRequested = false;
    active = true;
    
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    
    document.addEventListener('keydown', handleKey);
    playScene();
  }
  
  function handleKey(e){
    if(!active) return;
    if(e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter'){
      e.preventDefault();
      skip();
    }
  }
  
  // Skip inmediato: limpia todo y termina
  function skip(){
    if(!active) return;
    skipRequested = true;
    finish();
  }
  
  function playScene(){
    if(!active) return;
    
    if(currentScene >= scenes.length || skipRequested){
      finish();
      return;
    }
    
    const scene = scenes[currentScene];
    if(sceneBg){
      sceneBg.style.background = 'radial-gradient(ellipse at center, ' + scene.bg + ' 0%, #05070c 100%)';
    }
    if(subEl){
      subEl.textContent = '';
      subEl.style.opacity = '0';
    }
    
    typeText(scene.text, function(){
      if(!active) return;
      if(subEl){
        subEl.textContent = scene.sub;
        subEl.style.opacity = '1';
      }
      sceneTimeout = setTimeout(function(){
        currentScene++;
        playScene();
      }, 2400);
    });
  }
  
  function typeText(text, onDone){
    if(textEl) textEl.textContent = '';
    if(typeInterval) clearInterval(typeInterval);
    let i = 0;
    
    typeInterval = setInterval(function(){
      // Si se pidió skip o se desactivó, completa y termina
      if(!active || skipRequested){
        clearInterval(typeInterval);
        typeInterval = null;
        if(textEl) textEl.textContent = text;
        onDone();
        return;
      }
      if(i < text.length){
        if(textEl) textEl.textContent += text[i];
        i++;
      } else {
        clearInterval(typeInterval);
        typeInterval = null;
        onDone();
      }
    }, 50);
  }
  
  function finish(){
    if(!active) return;
    active = false;
    
    if(typeInterval){ clearInterval(typeInterval); typeInterval = null; }
    if(sceneTimeout){ clearTimeout(sceneTimeout); sceneTimeout = null; }
    document.removeEventListener('keydown', handleKey);
    
    if(overlay){
      overlay.style.display = 'none';
      overlay.classList.add('hidden');
    }
    
    if(onCompleteCb){
      const cb = onCompleteCb;
      onCompleteCb = null;
      cb();
    }
  }
  
  return { init:init, play:play, skip:skip };
})();
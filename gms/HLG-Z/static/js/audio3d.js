'use strict';
/* ============================================================
   AUDIO 3D POSICIONAL + MÚSICA CUBANA PROCEDURAL
   Los sonidos vienen de donde están los objetos.
   ============================================================ */
window.Audio3D = (function(){
  let AC = null, masterG = null, musicG = null, noiseB = null;
  let listenerSet = false;
  let musicTimer = 0, claveTimer = 0, claveBeat = 0;
  let radioStation = null;
  
  function rand(a,b){ return a + Math.random()*(b-a); }
  
  function init(){
    if (AC) return;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      masterG = AC.createGain(); masterG.gain.value = .5; masterG.connect(AC.destination);
      musicG = AC.createGain(); musicG.gain.value = .15; musicG.connect(masterG);
      noiseB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseB.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      console.log('[Audio3D] ✓ Inicializado');
    } catch(e){ console.warn('[Audio3D] No disponible', e); }
  }
  
  function resume(){
    if (!AC) init();
    if (AC && AC.state === 'suspended') AC.resume().catch(function(){});
  }
  
  // Actualiza la posición del oyente (el jugador)
  function setListener(x, y, z, fx, fz){
    if (!AC || !AC.listener) return;
    const l = AC.listener;
    if (l.positionX) {
      l.positionX.value = x; l.positionY.value = y + 1.6; l.positionZ.value = z;
      l.forwardX.value = fx; l.forwardY.value = 0; l.forwardZ.value = fz;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else if (l.setPosition) {
      l.setPosition(x, y + 1.6, z);
      l.setOrientation(fx, 0, fz, 0, 1, 0);
    }
  }
  
  // Crea un panner (fuente de sonido en una posición 3D)
  function makePanner(x, y, z){
    if (!AC) return null;
    const p = AC.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 3;
    p.maxDistance = 80;
    p.rolloffFactor = 1.2;
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
    else if (p.setPosition) p.setPosition(x, y, z);
    p.connect(masterG);
    return p;
  }
  
  function tone(f0, f1, dur, type, vol, dest, delay){
    if (!AC) return;
    const t = AC.currentTime + (delay||0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t+dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    o.connect(g); g.connect(dest || masterG);
    o.start(t); o.stop(t+dur+.02);
  }
  
  function burst(dur, vol, f, dest, delay){
    if (!AC) return;
    const t = AC.currentTime + (delay||0);
    const s = AC.createBufferSource(); s.buffer = noiseB;
    const fl = AC.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value = f;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    s.connect(fl); fl.connect(g); g.connect(dest||masterG);
    s.start(t); s.stop(t+dur+.02);
  }
  
  /* ===== SONIDO POSICIONAL (gemido de zombi en x,z) ===== */
  function zombieGroan(x, y, z, intensity){
    if (!AC) return;
    const p = makePanner(x, y, z);
    if (!p) return;
    const vol = .12 * (intensity||1);
    tone(rand(60,90), rand(35,55), .8, 'sawtooth', vol, p);
    burst(.5, vol*.5, 400, p);
  }
  
  function zombieScream(x, y, z){
    if (!AC) return;
    const p = makePanner(x, y, z);
    if (!p) return;
    tone(rand(400,600), rand(800,1100), 1.2, 'sawtooth', .25, p);
    tone(rand(300,400), rand(700,900), 1.2, 'square', .15, p, .1);
  }
  
  /* ===== SONIDOS NO POSICIONALES (del jugador) ===== */
  const S = {
    pistol(){ resume(); burst(.09,.5,3800); tone(240,70,.08,'square',.22); },
    shotgun(){ resume(); burst(.22,.7,1400); tone(120,45,.18,'square',.3); },
    rifle(){ resume(); burst(.06,.4,4500); tone(300,90,.05,'square',.18); },
    bow(){ resume(); tone(200,80,.15,'sine',.25); burst(.08,.15,1200); },
    swing(){ resume(); burst(.12,.2,900); },
    empty(){ resume(); tone(900,600,.06,'square',.1); },
    reload(){ resume(); tone(500,300,.07,'square',.12); tone(700,400,.07,'square',.12,.14); },
    hit(){ resume(); burst(.05,.3,2000); tone(160,80,.06,'triangle',.2); },
    zdie(){ resume(); tone(140,40,.5,'sawtooth',.2); burst(.3,.2,600); },
    groan(){ resume(); tone(rand(70,100),rand(40,60),.9,'sawtooth',.05); },
    hurt(){ resume(); tone(200,60,.25,'sawtooth',.3); burst(.15,.3,900); },
    pickup(){ resume(); tone(520,780,.09,'sine',.2); tone(780,1040,.09,'sine',.2,.09); },
    eat(){ resume(); burst(.08,.25,800); burst(.08,.25,700,.12); },
    heal(){ resume(); tone(440,660,.25,'sine',.16); tone(660,880,.3,'sine',.14,.2); },
    level(){ resume(); [392,523,659,784].forEach(function(f,i){ tone(f,f,.16,'square',.18,null,i*.11); }); },
    buy(){ resume(); tone(880,880,.07,'sine',.16); tone(1175,1175,.1,'sine',.16,.08); },
    thud(){ resume(); burst(.12,.4,300); tone(80,40,.15,'sine',.3); },
    click(){ resume(); tone(1400,1000,.04,'square',.08); },
    boss(){ resume(); tone(60,30,1.5,'sawtooth',.4); burst(.5,.5,200); },
    craft(){ resume(); tone(660,880,.1,'sine',.2); tone(880,1100,.15,'sine',.2,.1); },
    heartbeat(){ resume(); tone(60,40,.1,'sine',.3); tone(60,40,.1,'sine',.25,.15); },
    screamAlert(){ resume(); tone(500,900,.8,'sawtooth',.3); tone(400,800,.8,'square',.2,.1); },
    spit(){ resume(); burst(.15,.3,800); tone(300,150,.1,'sine',.15); },
    build(){ resume(); burst(.1,.4,1500); tone(200,100,.1,'square',.15); },
    footstep(surface, running){
      if (!AC) return;
      const base = surface==='grass'?600:surface==='asphalt'?1400:1000;
      const vol = running?.14:.07;
      burst(.07, vol, base*rand(.85,1.15));
      tone(90+Math.random()*40, 50, .04, 'sine', vol*.4);
    },
    arrowImpact(surface){
      if (!AC) return;
      if (surface==='wood'){ burst(.12,.35,1800); tone(280,140,.1,'square',.12); }
      else if (surface==='stone'){ burst(.08,.4,3500); tone(900,500,.06,'sine',.18); }
      else { burst(.12,.3,1000); tone(140,70,.1,'sine',.12); }
    },
    arrowStick(){ if(!AC)return; tone(400,200,.08,'sine',.1); burst(.05,.15,2500); }
  };
  
  /* ============================================================
     MÚSICA CUBANA PROCEDURAL (son montuno con clave)
     Patrón de clave 3-2 + tumbao de bajo + montuno
     ============================================================ */
  function playRadio(station){
    if (!AC) return;
    radioStation = station;
    musicG.gain.setValueAtTime(.15, AC.currentTime);
    console.log('[Audio3D] 📻 Radio: ' + station.name);
  }
  
  function stopRadio(){
    radioStation = null;
    if (AC && musicG) musicG.gain.setValueAtTime(0, AC.currentTime);
  }
  
  function isRadioOn(){ return radioStation !== null; }
  function getRadio(){ return radioStation; }
  
  // Secuenciador de música cubana (llamado cada frame)
  function updateMusic(dt){
    if (!AC) return;
    // Música ambiental base (sin radio)
    musicTimer -= dt;
    if (musicTimer <= 0 && !radioStation) {
      musicTimer = 8 + Math.random()*4;
      const scale = [110,130.8,146.8,164.8,196];
      const note = scale[Math.floor(Math.random()*scale.length)];
      const o = AC.createOscillator(), g = AC.createGain();
      o.type='sine'; o.frequency.value = note;
      g.gain.setValueAtTime(0, AC.currentTime);
      g.gain.linearRampToValueAtTime(.05, AC.currentTime+.8);
      g.gain.linearRampToValueAtTime(0, AC.currentTime+4);
      o.connect(g); g.connect(masterG);
      o.start(); o.stop(AC.currentTime+4.1);
    }
    
    // Música cubana cuando la radio está encendida
    if (radioStation) {
      claveTimer -= dt;
      if (claveTimer <= 0) {
        const tempo = radioStation.tempo;
        const beatDur = 60 / tempo / 2; // corcheas
        claveTimer = beatDur;
        playClavePattern(beatDur);
        claveBeat = (claveBeat + 1) % 8;
      }
    }
  }
  
  // Patrón de clave 3-2 cubano + bajo tumbao
  function playClavePattern(beatDur){
    if (!AC || !radioStation) return;
    const scale = radioStation.scale;
    const t = AC.currentTime;
    
    // Clave (madera golpeando) en patrón 3-2
    const clavePattern = [1,0,0,1,0,0,1,0]; // 3-2 simplificado
    if (clavePattern[claveBeat]) {
      burst(.05, .2, 3000, musicG);
      tone(800, 600, .05, 'square', .15, musicG);
    }
    
    // Tumbao de bajo (contrabajo cubano)
    if (claveBeat === 0 || claveBeat === 3 || claveBeat === 6) {
      const bassNote = scale[Math.floor(Math.random()*3)] / 2;
      tone(bassNote, bassNote*.98, beatDur*1.5, 'sine', .2, musicG);
      tone(bassNote*2, bassNote*1.98, beatDur*1.5, 'triangle', .08, musicG);
    }
    
    // Montuno (piano/guitarra) - melodía
    if (claveBeat % 2 === 0 && Math.random() < .6) {
      const melNote = scale[Math.floor(Math.random()*scale.length)];
      tone(melNote, melNote, beatDur*.8, 'triangle', .1, musicG);
      if (Math.random() < .3) tone(melNote*1.25, melNote*1.25, beatDur*.8, 'triangle', .07, musicG, beatDur*.1);
    }
    
    // Congas (percusión)
    if (claveBeat === 2 || claveBeat === 5) {
      burst(.08, .15, 500, musicG);
    }
  }
  
  return {
    init:init, resume:resume, setListener:setListener,
    zombieGroan:zombieGroan, zombieScream:zombieScream,
    updateMusic:updateMusic, playRadio:playRadio, stopRadio:stopRadio,
    isRadioOn:isRadioOn, getRadio:getRadio,
    sfx:S
  };
})();
window.sfx = window.Audio3D.sfx;
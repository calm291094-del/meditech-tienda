'use strict';
/* AUDIO 3D POSICIONAL + MÚSICA CUBANA PROCEDURAL
   Mantiene la interfaz sfx.xxx() existente. */
window.AudioSystem = (function(){
  let AC = null, masterG = null, musicG = null, noiseB = null;
  let musicTimer = 0, claveTimer = 0, claveBeat = 0;
  let radioStation = null;

  function rand(a, b){ return a + Math.random() * (b - a); }

  function init(){
    if(AC) return;
    try{
      AC = new (window.AudioContext || window.webkitAudioContext)();
      masterG = AC.createGain();
      masterG.gain.value = .5;
      masterG.connect(AC.destination);
      musicG = AC.createGain();
      musicG.gain.value = .14;
      musicG.connect(masterG);
      noiseB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseB.getChannelData(0);
      for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }catch(e){
      console.warn('Audio no disponible', e);
    }
  }

  function resume(){
    if(!AC) init();
    if(AC && AC.state === 'suspended') AC.resume().catch(function(){});
  }

  // 🛡️ El oyente es el jugador (blindado contra NaN)
  function setListener(x, y, z, fx, fz){
    if(!AC || !AC.listener) return;
    // Blindaje: si algún valor no es finito, usar 0
    const px = isFinite(x) ? x : 0;
    const py = isFinite(y) ? y + 1.6 : 1.6;
    const pz = isFinite(z) ? z : 0;
    const fxs = isFinite(fx) ? fx : 0;
    const fzs = isFinite(fz) ? fz : 1;

    const l = AC.listener;
    if(l.positionX){
      l.positionX.value = px;
      l.positionY.value = py;
      l.positionZ.value = pz;
      l.forwardX.value = fxs;
      l.forwardY.value = 0;
      l.forwardZ.value = fzs;
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else if(l.setPosition){
      l.setPosition(px, py, pz);
      l.setOrientation(fxs, 0, fzs, 0, 1, 0);
    }
  }

  function makePanner(x, y, z){
    if(!AC) return null;
    const p = AC.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 3;
    p.maxDistance = 80;
    p.rolloffFactor = 1.2;
    const px = isFinite(x) ? x : 0;
    const py = isFinite(y) ? y : 0;
    const pz = isFinite(z) ? z : 0;
    if(p.positionX){
      p.positionX.value = px;
      p.positionY.value = py;
      p.positionZ.value = pz;
    } else if(p.setPosition){
      p.setPosition(px, py, pz);
    }
    p.connect(masterG);
    return p;
  }

  function tone(f0, f1, dur, type, vol, dest, delay){
    if(!AC) return;
    // 🛡️ FIX: Si pasaron un número como dest, en realidad era el delay
    if(typeof dest === 'number'){
      if(delay === undefined) delay = dest;
      dest = null;
    }
    const t = AC.currentTime + (delay || 0);
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g);
    g.connect(dest || masterG);
    o.start(t);
    o.stop(t + dur + .02);
  }

  function burst(dur, vol, f, dest, delay){
    if(!AC) return;
    // 🛡️ FIX: Si pasaron un número como dest, en realidad era el delay
    if(typeof dest === 'number'){
      if(delay === undefined) delay = dest;
      dest = null;
    }
    const t = AC.currentTime + (delay || 0);
    const s = AC.createBufferSource();
    s.buffer = noiseB;
    const fl = AC.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = f;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl);
    fl.connect(g);
    g.connect(dest || masterG);
    s.start(t);
    s.stop(t + dur + .02);
  }

  /* Gemido de zombi POSICIONAL (viene de donde está el zombi) */
  function zombieGroan3D(x, y, z, intensity){
    if(!AC) return;
    const p = makePanner(x, y, z);
    if(!p) return;
    const vol = .12 * (intensity || 1);
    tone(rand(60, 90), rand(35, 55), .8, 'sawtooth', vol, p);
    burst(.5, vol * .5, 400, p);
  }

  /* Grito del Chillón POSICIONAL */
  function zombieScream3D(x, y, z){
    if(!AC) return;
    const p = makePanner(x, y, z);
    if(!p) return;
    tone(rand(400, 600), rand(800, 1100), 1.2, 'sawtooth', .25, p);
    tone(rand(300, 400), rand(700, 900), 1.2, 'square', .15, p, .1);
  }

  /* ===== MÚSICA CUBANA PROCEDURAL (son montuno con clave 3-2) ===== */
  function playRadio(station){
    radioStation = station;
    if(AC && musicG) musicG.gain.setValueAtTime(.14, AC.currentTime);
  }
  function stopRadio(){
    radioStation = null;
    if(AC && musicG) musicG.gain.setValueAtTime(0, AC.currentTime);
  }
  function isRadioOn(){ return radioStation !== null; }
  function getRadio(){ return radioStation; }

  function updateMusic(dt){
    if(!AC) return;
    musicTimer -= dt;
    if(musicTimer <= 0 && !radioStation){
      musicTimer = 8 + Math.random() * 4;
      const scale = [110, 130.8, 146.8, 164.8, 196];
      const note = scale[Math.floor(Math.random() * scale.length)];
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'sine';
      o.frequency.value = note;
      g.gain.setValueAtTime(0, AC.currentTime);
      g.gain.linearRampToValueAtTime(.05, AC.currentTime + .8);
      g.gain.linearRampToValueAtTime(0, AC.currentTime + 4);
      o.connect(g);
      g.connect(masterG);
      o.start();
      o.stop(AC.currentTime + 4.1);
    }
    if(radioStation){
      claveTimer -= dt;
      if(claveTimer <= 0){
        const beatDur = 60 / radioStation.tempo / 2;
        claveTimer = beatDur;
        playClavePattern(beatDur);
        claveBeat = (claveBeat + 1) % 8;
      }
    }
  }

  function playClavePattern(beatDur){
    if(!AC || !radioStation) return;
    const scale = radioStation.scale;
    const clavePattern = [1, 0, 0, 1, 0, 0, 1, 0];
    if(clavePattern[claveBeat]){
      burst(.05, .2, 3000, musicG);
      tone(800, 600, .05, 'square', .15, musicG);
    }
    if(claveBeat === 0 || claveBeat === 3 || claveBeat === 6){
      const bassNote = scale[Math.floor(Math.random() * 3)] / 2;
      tone(bassNote, bassNote * .98, beatDur * 1.5, 'sine', .2, musicG);
      tone(bassNote * 2, bassNote * 1.98, beatDur * 1.5, 'triangle', .08, musicG);
    }
    if(claveBeat % 2 === 0 && Math.random() < .6){
      const melNote = scale[Math.floor(Math.random() * scale.length)];
      tone(melNote, melNote, beatDur * .8, 'triangle', .1, musicG);
      if(Math.random() < .3){
        tone(melNote * 1.25, melNote * 1.25, beatDur * .8, 'triangle', .07, musicG, beatDur * .1);
      }
    }
    if(claveBeat === 2 || claveBeat === 5){
      burst(.08, .15, 500, musicG);
    }
  }

  /* ===== SFX (interfaz completa) ===== */
  const S = {
    pistol: function(){
      resume();
      burst(.09, .5, 3800);
      tone(240, 70, .08, 'square', .22);
    },
    shotgun: function(){
      resume();
      burst(.22, .7, 1400);
      tone(120, 45, .18, 'square', .3);
    },
    rifle: function(){
      resume();
      burst(.06, .4, 4500);
      tone(300, 90, .05, 'square', .18);
    },
    bow: function(){
      resume();
      tone(200, 80, .15, 'sine', .25);
      burst(.08, .15, 1200);
    },
    swing: function(){
      resume();
      burst(.12, .2, 900);
    },
    empty: function(){
      resume();
      tone(900, 600, .06, 'square', .1);
    },
    reload: function(){
      resume();
      tone(500, 300, .07, 'square', .12);
      tone(700, 400, .07, 'square', .12, .14);
    },
    hit: function(){
      resume();
      burst(.05, .3, 2000);
      tone(160, 80, .06, 'triangle', .2);
    },
    zdie: function(){
      resume();
      tone(140, 40, .5, 'sawtooth', .2);
      burst(.3, .2, 600);
    },
    groan: function(){
      resume();
      tone(rand(70, 100), rand(40, 60), .9, 'sawtooth', .05);
    },
    hurt: function(){
      resume();
      tone(200, 60, .25, 'sawtooth', .3);
      burst(.15, .3, 900);
    },
    pickup: function(){
      resume();
      tone(520, 780, .09, 'sine', .2);
      tone(780, 1040, .09, 'sine', .2, .09);
    },
    eat: function(){
      resume();
      burst(.08, .25, 800);
      burst(.08, .25, 700, null, .12);
    },
    heal: function(){
      resume();
      tone(440, 660, .25, 'sine', .16);
      tone(660, 880, .3, 'sine', .14, .2);
    },
    level: function(){
      resume();
      [392, 523, 659, 784].forEach(function(f, i){
        tone(f, f, .16, 'square', .18, null, i * .11);
      });
    },
    buy: function(){
      resume();
      tone(880, 880, .07, 'sine', .16);
      tone(1175, 1175, .1, 'sine', .16, .08);
    },
    thud: function(){
      resume();
      burst(.12, .4, 300);
      tone(80, 40, .15, 'sine', .3);
    },
    click: function(){
      resume();
      tone(1400, 1000, .04, 'square', .08);
    },
    boss: function(){
      resume();
      tone(60, 30, 1.5, 'sawtooth', .4);
      burst(.5, .5, 200);
    },
    craft: function(){
      resume();
      tone(660, 880, .1, 'sine', .2);
      tone(880, 1100, .15, 'sine', .2, .1);
    },
    heartbeat: function(){
      resume();
      tone(60, 40, .1, 'sine', .3);
      tone(60, 40, .1, 'sine', .25, .15);
    },
    screamAlert: function(){
      resume();
      tone(500, 900, .8, 'sawtooth', .3);
      tone(400, 800, .8, 'square', .2, .1);
    },
    spit: function(){
      resume();
      burst(.15, .3, 800);
      tone(300, 150, .1, 'sine', .15);
    },
    build: function(){
      resume();
      burst(.1, .4, 1500);
      tone(200, 100, .1, 'square', .15);
    },
    hordeAlarm: function(){
      resume();
      tone(220, 220, .3, 'square', .2);
      tone(220, 220, .3, 'square', .2, .4);
      tone(180, 180, .5, 'square', .25, .8);
    },
    footstep: function(surface, running){
      if(!AC) return;
      const base = surface === 'grass' ? 600 : surface === 'asphalt' ? 1400 : 1000;
      const vol = running ? .14 : .07;
      burst(.07, vol, base * rand(.85, 1.15));
      tone(90 + Math.random() * 40, 50, .04, 'sine', vol * .4);
    },
    zombieStep: function(){
      if(!AC) return;
      if(Math.random() < .3){
        burst(.1, .05, rand(400, 800));
        tone(60, 40, .06, 'sawtooth', .03);
      }
    },
    arrowImpact: function(surface){
      if(!AC) return;
      if(surface === 'wood'){
        burst(.12, .35, 1800);
        tone(280, 140, .1, 'square', .12);
      } else if(surface === 'stone'){
        burst(.08, .4, 3500);
        tone(900, 500, .06, 'sine', .18);
      } else {
        burst(.12, .3, 1000);
        tone(140, 70, .1, 'sine', .12);
      }
    },
    arrowStick: function(){
      if(!AC) return;
      tone(400, 200, .08, 'sine', .1);
      burst(.05, .15, 2500);
    }
  };

  return {
    init: init,
    resume: resume,
    setListener: setListener,
    zombieGroan3D: zombieGroan3D,
    zombieScream3D: zombieScream3D,
    updateMusic: updateMusic,
    playRadio: playRadio,
    stopRadio: stopRadio,
    isRadioOn: isRadioOn,
    getRadio: getRadio,
    sfx: S
  };
})();
window.sfx = window.AudioSystem.sfx;
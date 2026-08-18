'use strict';
/* CONTROLES estilo GTA SA: A/D rotan a pie, strafe al apuntar */
window.Controls = (function(){
  const keys = {};
  const mouse = { down: false, dx: 0, dy: 0 };
  const listeners = [];
  let aiming = false;

  function init(){
    addEventListener('keydown', function(e){
      if(['Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code) >= 0) e.preventDefault();
      if(e.repeat) return;
      keys[e.code] = true;
      listeners.forEach(function(fn){ fn('keydown', e.code, e); });
    });
    addEventListener('keyup', function(e){
      keys[e.code] = false;
      listeners.forEach(function(fn){ fn('keyup', e.code, e); });
    });
    addEventListener('mousedown', function(e){
      if(e.button === 0){
        mouse.down = true;
        aiming = true;
        listeners.forEach(function(fn){ fn('mousedown', e); });
      }
    });
    addEventListener('mouseup', function(e){
      if(e.button === 0){
        mouse.down = false;
        aiming = false;
        listeners.forEach(function(fn){ fn('mouseup', e); });
      }
    });
    addEventListener('mousemove', function(e){
      if(document.pointerLockElement){
        const mx = isFinite(e.movementX) ? e.movementX : 0;
        const my = isFinite(e.movementY) ? e.movementY : 0;
        mouse.dx += mx;
        mouse.dy += my;
        listeners.forEach(function(fn){ fn('mousemove', e); });
      }
    });
    addEventListener('contextmenu', function(e){ e.preventDefault(); });
  }

  function isDown(code){ return !!keys[code]; }
  function onMouseDown(){ return mouse.down; }
  function isAiming(){ return aiming; }
  function on(evt, fn){
    listeners.push(function(t, c, e){ if(t === evt) fn(c, e); });
  }

  /* A/D rotan a pie, strafe al apuntar */
  function getFootMovement(playerYaw, dt){
    let forward = 0, rotation = 0, strafe = 0;

    if(isDown('KeyW') || isDown('ArrowUp'))    forward += 1;
    if(isDown('KeyS') || isDown('ArrowDown'))  forward -= 1;

    if(aiming){
      // Al apuntar: A/D hacen strafe
      if(isDown('KeyA') || isDown('ArrowLeft'))  strafe -= 1;
      if(isDown('KeyD') || isDown('ArrowRight')) strafe += 1;
    } else {
      // Sin apuntar: A/D rotan el personaje
      if(isDown('KeyA') || isDown('ArrowLeft'))  rotation += 1;
      if(isDown('KeyD') || isDown('ArrowRight')) rotation -= 1;
    }

    return {
      forward: forward,
      rotation: rotation,
      strafe: strafe,
      moving: forward !== 0 || strafe !== 0
    };
  }

  function applyRotation(currentYaw, rotationInput, dt){
    const rotSpeed = 2.8;
    const newYaw = currentYaw + rotationInput * rotSpeed * dt;
    return isFinite(newYaw) ? newYaw : currentYaw;
  }

  function getWorldMovement(playerYaw, forward, strafe){
    if(forward === 0 && strafe === 0) return { x: 0, z: 0, moving: false };
    const fwdX = Math.sin(playerYaw), fwdZ = Math.cos(playerYaw);
    const rtX  = Math.cos(playerYaw), rtZ  = -Math.sin(playerYaw);
    let mx = fwdX * forward + rtX * strafe;
    let mz = fwdZ * forward + rtZ * strafe;
    const len = Math.hypot(mx, mz);
    if(len > 0){ mx /= len; mz /= len; }

    // 🛡️ Blindaje NaN
    if(!isFinite(mx)) mx = 0;
    if(!isFinite(mz)) mz = 0;

    return {
      x: mx,
      z: mz,
      facing: Math.atan2(mx, mz),
      moving: true
    };
  }

  return {
    init: init,
    isDown: isDown,
    onMouseDown: onMouseDown,
    isAiming: isAiming,
    getFootMovement: getFootMovement,
    applyRotation: applyRotation,
    getWorldMovement: getWorldMovement,
    on: on
  };
})();
Controls.init();
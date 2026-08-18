'use strict';
/* DAÑO DIRECCIONAL — muestra el daño según la dirección del atacante */
window.DamageDir = (function(){
  let container = null;
  
  function init(){
    container = document.getElementById('damage-dir');
  }
  
  /* srcX/srcZ: posición del atacante. player: jugador. intensity: 0-1 */
  function show(srcX, srcZ, player, intensity){
    if(!container || !player) return;
    
    // Vector del jugador al atacante
    const dx = srcX - player.pos.x;
    const dz = srcZ - player.pos.z;
    
    // Ángulo del atacante en el mundo
    const worldAngle = Math.atan2(dx, dz);
    
    // Ángulo relativo a la cámara del jugador (normalizado a [-PI, PI])
    let rel = worldAngle - player.camYaw;
    while(rel > Math.PI) rel -= 2*Math.PI;
    while(rel < -Math.PI) rel += 2*Math.PI;
    
    // Viñete en el borde de la pantalla:
    // 0=frente(arriba) · PI/2=derecha · PI=atrás(abajo) · -PI/2=izquierda
    const xPct = 50 + Math.sin(rel) * 52;
    const yPct = 50 - Math.cos(rel) * 52;
    
    // Arco un poco más hacia adentro para que sea visible
    const axPct = 50 + Math.sin(rel) * 40;
    const ayPct = 50 - Math.cos(rel) * 40;
    
    // Rotación del arco (apunta hacia el atacante)
    const rot = rel * 180 / Math.PI;
    
    spawnHit(xPct, yPct, axPct, ayPct, rot, intensity || 1);
  }
  
  function spawnHit(x, y, ax, ay, rot, intensity){
    const hit = document.createElement('div');
    hit.className = 'dmg-hit' + (intensity >= 0.85 ? ' dmg-critical' : '');
    hit.style.setProperty('--x',   x + '%');
    hit.style.setProperty('--y',   y + '%');
    hit.style.setProperty('--ax',  ax + '%');
    hit.style.setProperty('--ay',  ay + '%');
    hit.style.setProperty('--rot', rot + 'deg');
    hit.style.setProperty('--int', intensity);
    container.appendChild(hit);
    
    // Limpiar tras la animación
    setTimeout(function(){ if(hit.parentNode) hit.remove(); }, 1000);
  }
  
  return { init:init, show:show };
})();
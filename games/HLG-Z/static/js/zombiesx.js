'use strict';
/* TIPOS DE ZOMBI: corredor, gordo, chillón, escupidor, sigiloso */
window.ZombiesX = (function(){
  let TYPES = {};
  
  function init(){
    if (window.ZOMBIE_TYPES) TYPES = window.ZOMBIE_TYPES;
  }
  
  // Elige un tipo según el día y la hora
  function pickType(day, isNight){
    const pool = ['caminante','caminante','caminante'];
    if (day >= 2) pool.push('corredor','corredor');
    if (day >= 3) pool.push('gordo');
    if (day >= 3) pool.push('chillon');
    if (day >= 4) pool.push('escupidor');
    if (isNight && day >= 3) pool.push('sigiloso','sigiloso');
    return pool[Math.floor(Math.random()*pool.length)];
  }
  
  // Aplica características visuales según tipo
  function applyType(z, typeId){
    const t = TYPES[typeId];
    if (!t || !z.model) return;
    z.ztype = typeId;
    z.maxhp = t.hp; z.hp = t.hp;
    z.speed = t.speed;
    z.zdmg = t.dmg;
    z.aggroRange = t.aggro;
    
    // Escalar modelo
    if (z.model.group && t.scale !== 1.0) {
      z.model.group.scale.setScalar(t.scale);
    }
    
    // Aura de color para tipos especiales (menos el caminante)
    if (typeId !== 'caminante' && z.model.group) {
      const auraColor = t.color;
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(.9, 12, 12),
        new THREE.MeshBasicMaterial({ color: auraColor, transparent:true, opacity:.12, side:THREE.BackSide, depthWrite:false })
      );
      aura.position.y = 1.0;
      z.model.group.add(aura);
      z.aura = aura;
    }
    
    // Ojos brillantes para sigiloso
    if (typeId === 'sigiloso') {
      z.stealthAlpha = 0.5; // semitransparente hasta que se acerca
    }
  }
  
  // Comportamiento especial por tipo (llamado en updateZombies)
  function updateSpecial(z, dt, players, spitFn, screamFn){
    if (!z.ztype || z.dead) return;
    const t = TYPES[z.ztype];
    if (!t) return;
    
    // Chillón: grita periódicamente y atrae más zombis
    if (t.screams) {
      z.screamCd = (z.screamCd || 0) - dt;
      if (z.screamCd <= 0 && players.length) {
        const d = Math.hypot(z.x - players[0].pos.x, z.z - players[0].pos.z);
        if (d < 40) {
          z.screamCd = 8 + Math.random()*4;
          if (screamFn) screamFn(z);
        }
      }
    }
    
    // Escupidor: ataca a distancia
    if (t.spits) {
      z.spitCd = (z.spitCd || 0) - dt;
      if (z.spitCd <= 0 && players.length) {
        const p = players[0];
        const d = Math.hypot(z.x - p.pos.x, z.z - p.pos.z);
        if (d < t.spitRange && d > 3) {
          z.spitCd = 3;
          if (spitFn) spitFn(z, p, t.spitDmg);
        }
      }
    }
    
    // Sigiloso: más transparente lejos, visible cerca
    if (t.stealth && z.model.group) {
      const p = players[0];
      if (p) {
        const d = Math.hypot(z.x - p.pos.x, z.z - p.pos.z);
        const targetAlpha = d < 8 ? 1.0 : 0.4;
        z.model.group.traverse(function(o){
          if (o.material && !o.material._isAura) {
            o.material.transparent = true;
            o.material.opacity += (targetAlpha - o.material.opacity) * 0.1;
          }
        });
      }
    }
  }
  
  // Al morir un gordo: explosión
  function onDeath(z, players, hurtFn){
    if (!z.ztype) return;
    const t = TYPES[z.ztype];
    if (t && t.explode && players.length) {
      const p = players[0];
      const d = Math.hypot(z.x - p.pos.x, z.z - p.pos.z);
      if (d < 5) {
        if (hurtFn) hurtFn(p, 30, z.x, z.z);
        if (window.toast) toast('💥 ¡El Gordo explotó!', 'bad');
      }
      if (window.sfx) sfx.thud();
      return true; // explotó
    }
    return false;
  }
  
  return { init:init, pickType:pickType, applyType:applyType, updateSpecial:updateSpecial, onDeath:onDeath };
})();
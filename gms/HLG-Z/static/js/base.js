'use strict';
/* BASE FORTIFICABLE en el Parque Calixto García */
window.BaseSystem = (function(){
  let scene = null;
  let structures = [];
  let basePos = { x: 0, z: 0 };
  let turrets = [];
  let CFG = { WALL_COST:40, TRAP_COST:60, TURRET_COST:150, WALL_HP:200,
              TRAP_DMG:80, TURRET_DMG:15, TURRET_RANGE:15, TURRET_RATE:0.8 };
  let menu = null, listEl = null, moneyEl = null;
  
  function init(_scene){
    scene = _scene;
    if (window.CONFIG && window.CONFIG.BASE) CFG = window.CONFIG.BASE;
    menu = document.getElementById('base-menu');
    listEl = document.getElementById('baseList');
    moneyEl = document.getElementById('baseMoney');
    basePos = { x: 0, z: 0 }; // centro del parque
  }
  
  function reset(){
    for (let i = 0; i < structures.length; i++) scene.remove(structures[i].mesh);
    structures = [];
    turrets = [];
  }
  
  function getPos(){ return basePos; }
  
  function openMenu(player){
    if (!menu) return;
    renderMenu(player);
    menu.classList.remove('hidden');
    if (window.setState) window.setState('INV');
  }
  
  function renderMenu(player){
    if (!listEl) return;
    if (moneyEl) moneyEl.textContent = '$ ' + player.money;
    listEl.innerHTML = '';
    const costMul = window.Progression ? Progression.baseCostMul() : 1;
    
    const items = [
      { id:'wall',   icon:'🧱', name:'Muro',     desc:'Bloquea zombis (' + CFG.WALL_HP + ' HP)', cost:Math.round(CFG.WALL_COST*costMul) },
      { id:'trap',   icon:'🪤', name:'Trampa',   desc:'Daña al pisar (' + CFG.TRAP_DMG + ' dmg)', cost:Math.round(CFG.TRAP_COST*costMul) },
      { id:'turret', icon:'🗼', name:'Torreta',  desc:'Dispara sola (' + CFG.TURRET_RANGE + ' m)', cost:Math.round(CFG.TURRET_COST*costMul) }
    ];
    
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<div class="ic">' + it.icon + '</div><div class="nm">' + it.name + '<small>' + it.desc + '</small></div><div class="ct">$' + it.cost + '</div>';
      const btn = document.createElement('button');
      btn.className = 'buy';
      btn.textContent = 'CONSTRUIR';
      btn.disabled = player.money < it.cost;
      btn.onclick = (function(type, cost){
        return function(){
          if (player.money >= cost) {
            player.money -= cost;
            build(type, player);
            renderMenu(player);
          }
        };
      })(it.id, it.cost);
      row.appendChild(btn);
      listEl.appendChild(row);
    }
  }
  
  function build(type, player){
    if (!scene) return;
    // Construir frente al jugador
    const fx = Math.sin(player.camYaw);
    const fz = Math.cos(player.camYaw);
    const x = player.pos.x + fx * 3;
    const z = player.pos.z + fz * 3;
    
    if (type === 'wall') {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, .5),
        new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
      mesh.position.set(x, 1.25, z);
      mesh.rotation.y = player.camYaw;
      scene.add(mesh);
      structures.push({ type:'wall', mesh:mesh, x:x, z:z, hp:CFG.WALL_HP, radius:1.5 });
      window.solids_global.push({ x1:x-1.5, x2:x+1.5, z1:z-.3, z2:z+.3 });
    } else if (type === 'trap') {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .1, 12),
        new THREE.MeshLambertMaterial({ color: 0x5a5a5a }));
      mesh.position.set(x, .05, z);
      scene.add(mesh);
      const spikes = new THREE.Mesh(new THREE.ConeGeometry(.8, .4, 8),
        new THREE.MeshLambertMaterial({ color: 0x9a9a9a }));
      spikes.position.set(x, .3, z);
      scene.add(spikes);
      structures.push({ type:'trap', mesh:mesh, mesh2:spikes, x:x, z:z, radius:1.2, armed:true });
    } else if (type === 'turret') {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .5, 8),
        new THREE.MeshLambertMaterial({ color: 0x4a4a4a }));
      base.position.y = .25; g.add(base);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 1.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
      barrel.rotation.x = Math.PI/2;
      barrel.position.set(0, .7, .5); g.add(barrel);
      g.position.set(x, 0, z);
      scene.add(g);
      structures.push({ type:'turret', mesh:g, x:x, z:z, cd:0 });
      turrets.push(structures[structures.length-1]);
    }
    
    if (window.sfx) sfx.build();
    if (window.toast) toast('🔨 Construido: ' + type, 'good');
  }
  
  function update(dt, zombies, player){
    if (!scene) return;
    
    for (let i = structures.length-1; i >= 0; i--) {
      const s = structures[i];
      
      if (s.type === 'trap' && s.armed) {
        for (let j = 0; j < zombies.length; j++) {
          const z = zombies[j];
          if (z.dead) continue;
          const d = Math.hypot(z.x - s.x, z.z - s.z);
          if (d < s.radius) {
            const dmg = CFG.TRAP_DMG * (window.Progression ? Progression.trapDamageMul() : 1);
            if (window.hurtZombieFromNPC) window.hurtZombieFromNPC(z, dmg, { level:0, kills:0, name:'Trampa' });
            s.armed = false;
            if (s.mesh2) s.mesh2.visible = false;
            if (window.sfx) sfx.thud();
            break;
          }
        }
      }
      
      if (s.type === 'turret') {
        s.cd -= dt;
        if (s.cd <= 0) {
          let nearest = null, nd = CFG.TURRET_RANGE;
          for (let j = 0; j < zombies.length; j++) {
            const z = zombies[j];
            if (z.dead) continue;
            const d = Math.hypot(z.x - s.x, z.z - s.z);
            if (d < nd) { nd = d; nearest = z; }
          }
          if (nearest) {
            s.cd = CFG.TURRET_RATE;
            // Apuntar
            const ang = Math.atan2(nearest.x - s.x, nearest.z - s.z);
            s.mesh.rotation.y = ang;
            if (window.hurtZombieFromNPC) window.hurtZombieFromNPC(nearest, CFG.TURRET_DMG, { level:0, kills:0, name:'Torreta' });
            if (window.sfx) sfx.rifle();
          }
        }
      }
    }
  }
  
  function tryInteract(player){ return false; }
  function getHint(player){ return null; }
  
  return { init:init, reset:reset, getPos:getPos, openMenu:openMenu, build:build,
           update:update, tryInteract:tryInteract, getHint:getHint };
})();
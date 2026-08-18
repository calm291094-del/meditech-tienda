'use strict';
window.Bosses = (function(){
  const bosses = [];
  let lastSpawnLevel = 0;
  
  const BOSS_TYPES = [
    { name: 'Gordo', color: 0x4a2a1a, scale: 2.2, hp: 300, dmg: 25, speed: 1.8,
      reward: { money: 500, xp: 200, item: 'ak' } },
    { name: 'Corredor', color: 0x8a0000, scale: 1.3, hp: 150, dmg: 18, speed: 6.5,
      reward: { money: 300, xp: 150, item: 'rifle' } },
    { name: 'Tanque', color: 0x2a3a4a, scale: 2.8, hp: 500, dmg: 35, speed: 1.4,
      reward: { money: 800, xp: 300, item: 'armor' } },
    { name: 'Alfa', color: 0x4a0a4a, scale: 2.0, hp: 400, dmg: 30, speed: 2.8,
      reward: { money: 1000, xp: 400, item: 'rifle' } }
  ];
  
  function shouldSpawnBoss(playerLevel){
    if (playerLevel < 5) return false;
    // Un jefe cada 3 niveles después del 5
    const expected = Math.floor((playerLevel - 5) / 3) + 1;
    return expected > lastSpawnLevel;
  }
  
  async function spawnBoss(playerPos, scene){
    const type = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 20;
    const x = playerPos.x + Math.sin(angle) * dist;
    const z = playerPos.z + Math.cos(angle) * dist;
    
    // Crear modelo procedural del jefe
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: type.color });
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(1 * type.scale, 1.4 * type.scale, .7 * type.scale), bodyMat);
    body.position.y = 1.16 * type.scale;
    g.add(body);
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(.5 * type.scale, .55 * type.scale, .5 * type.scale), bodyMat);
    head.position.y = 2 * type.scale;
    g.add(head);
    
    // Ojos rojos brillantes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eL = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .05), eyeMat);
    eL.position.set(-.15 * type.scale, 2.05 * type.scale, .25 * type.scale);
    g.add(eL);
    const eR = eL.clone(); eR.position.x = .15 * type.scale; g.add(eR);
    
    // Aura del jefe
    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(2 * type.scale, 16, 16),
      new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: .15, side: THREE.BackSide })
    );
    aura.position.y = 1.5 * type.scale;
    g.add(aura);
    
    g.position.set(x, 0, z);
    scene.add(g);
    
    // Barra de vida grande
    const barBg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x200508 }));
    barBg.scale.set(3, .15, 1); barBg.position.y = 2.8 * type.scale;
    const barFg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff3030 }));
    barFg.scale.set(3, .12, 1); barFg.position.y = 2.8 * type.scale;
    g.add(barBg); g.add(barFg);
    
    const boss = {
      x, z, yaw: Math.random() * Math.PI * 2,
      type, group: g, barFg,
      hp: type.hp, maxHp: type.hp,
      speed: type.speed,
      atkCd: 0, ph: 0,
      dead: false, dieT: 0
    };
    bosses.push(boss);
    
    window.announce(`¡JEFE ${type.name.toUpperCase()}!`, 'PREPÁRATE PARA EL COMBATE');
    window.sfx.boss && window.sfx.boss();
    lastSpawnLevel = Math.floor((Math.max(...window.players.map(p => p.level)) - 5) / 3) + 1;
  }
  
  function update(dt, players, zombies){
    for (let i = bosses.length - 1; i >= 0; i--) {
      const b = bosses[i];
      if (b.dead) {
        b.dieT += dt;
        b.group.rotation.x = -Math.min(1, b.dieT * 1.5) * Math.PI/2;
        if (b.dieT > 4) {
          window.scene_global && window.scene_global.remove(b.group);
          bosses.splice(i, 1);
        }
        continue;
      }
      
      // Buscar objetivo
      let target = null, td = 1e9;
      for (const p of players) {
        if (p.down) continue;
        const d = Math.hypot(p.pos.x - b.x, p.pos.z - b.z);
        if (d < td) { td = d; target = p; }
      }
      
      if (target && td < 40) {
        const dx = target.pos.x - b.x, dz = target.pos.z - b.z;
        const d = Math.hypot(dx, dz) || 1;
        b.x += dx/d * b.speed * dt;
        b.z += dz/d * b.speed * dt;
        b.yaw = Math.atan2(dx, dz);
        
        b.atkCd -= dt;
        if (d < 2.5 * b.type.scale && b.atkCd <= 0) {
          b.atkCd = 1.2;
          window.hurtPlayer(target, b.type.dmg);
          window.sfx.hurt();
        }
      } else {
        b.ph += dt * 2;
        b.x += Math.sin(b.ph) * .5 * dt;
      }
      
      b.group.position.set(b.x, 0, b.z);
      b.group.rotation.y = b.yaw;
      b.barFg.scale.x = 3 * (b.hp / b.maxHp);
    }
  }
  
  function hurtBoss(b, dmg){
    b.hp -= dmg;
    if (b.hp <= 0 && !b.dead) {
      b.dead = true;
      b.dieT = 0;
      window.announce(`¡${b.type.name.toUpperCase()} ELIMINADO!`, 'RECOMPENSA OBTENIDA');
      const p = window.players[0];
      if (p) {
        p.money += b.type.reward.money;
        if (b.type.reward.item) window.giveItem(p, b.type.reward.item);
        p.kills += 10; p.killsLvl += 10;
        window.toast(`+$${b.type.reward.money} · +${b.type.reward.xp} XP`, 'mission');
      }
      window.sfx.level();
    }
  }
  
  function getNearest(x, z){
    let best = null, bd = 1e9;
    for (const b of bosses) {
      if (b.dead) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d < bd) { bd = d; best = b; }
    }
    return { boss: best, dist: bd };
  }
  
  return { spawnBoss, update, hurtBoss, getNearest, shouldSpawnBoss, getAll: () => bosses };
})();
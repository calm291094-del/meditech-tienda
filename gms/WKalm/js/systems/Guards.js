// ============================================================
// GUARDS.JS - Sistema de guardias de torres
// ============================================================

window.Guards = {
  init(sim) {
    if (!Walls.towers || Walls.towers.length === 0) {
      console.warn('[Guards] No hay torres para asignar guardias');
      return;
    }

    console.log(`[Guards] Creando ${Walls.towers.length} guardias...`);

    // Crear un guardia para cada torre
    for (const tower of Walls.towers) {
      const guard = sim.spawnNpc({
        profession: 'guard',
        name: 'Guardia',
        position: { x: tower.x, y: tower.y }
      });

      guard.isGuard = true;
      guard.towerId = tower.id;
      guard.guardPosition = { x: tower.x, y: tower.y };
      guard.weapon = ContentDB.findById(ContentDB.weapons, 'spear');
      guard.skills.combat = 15;
      guard.hp = 150;
      guard.maxHp = 150;

      tower.guardId = guard.id;

      console.log(`[Guards] ✅ Guardia creado: ${guard.name} (${guard.id}) para torre ${tower.id} en (${Math.floor(tower.x)}, ${Math.floor(tower.y)})`);
    }
  },

  update(sim, dt) {
    for (const npc of sim.getNpcs()) {
      if (!npc.isGuard) continue;
      
      if (npc.attackCooldown > 0) npc.attackCooldown -= dt;

      const threat = sim.findNearestHostile(npc.x, npc.y, 200);
      if (threat && npc.weapon) {
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, threat.x, threat.y);
        const range = npc.weapon.range || 40;

        if (dist <= range && npc.attackCooldown <= 0) {
          const dmg = (npc.weapon.damage || 10) * (1 + npc.skills.combat / 50);
          threat.hp -= dmg;
          npc.attackCooldown = 1.2;
          npc.skills.combat += 0.3;
          
          if (sim.onDamage) sim.onDamage(threat.x, threat.y, Math.floor(dmg));
          
          if (threat.hp <= 0) {
            threat.alive = false;
            sim.stats.animalsKilled++;
            if (threat.def?.loot) {
              for (const res in threat.def.loot) {
                sim.addStock(res, threat.def.loot[res]);
              }
            }
          }
        } else if (dist < 200) {
          sim.setDestination(npc, threat.x, threat.y);
        }
      } else {
        if (npc.guardPosition) {
          const distToPost = Phaser.Math.Distance.Between(
            npc.x, npc.y,
            npc.guardPosition.x, npc.guardPosition.y
          );

          if (distToPost > 60) {
            sim.setDestination(npc, npc.guardPosition.x, npc.guardPosition.y);
          } else if (npc.path.length === 0 && Math.random() < 0.02) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const px = npc.guardPosition.x + Math.cos(angle) * 40;
            const py = npc.guardPosition.y + Math.sin(angle) * 40;
            sim.setDestination(npc, px, py);
          }
        }
      }
    }
  }
};
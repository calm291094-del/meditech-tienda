// ============================================================
// GUARDS.JS - OPTIMIZADO (búsqueda de amenazas cada 500ms)
// ============================================================

window.Guards = {

  detectionRange: 250,
  baseDamage: 25,
  updateTimer: 0,
  updateInterval: 500, // Buscar amenazas cada 500ms, no cada frame

  init(sim) {
    if (!Walls.towers || Walls.towers.length === 0) {
      Walls.initTowers();
    }

    for (const tower of Walls.towers) {
      let guard = sim.entities.find(e => 
        e.type === 'npc' && 
        e.profession?.id === 'guard' &&
        e.isGuard === true
      );

      if (!guard) {
        guard = this.createGuard(sim);
      }

      tower.guardId = guard.id;
      guard.isGuard = true;
      guard.towerId = tower.id;
      guard.guardPosition = { x: tower.x, y: tower.y };
      guard.weapon = ContentDB.findById(ContentDB.weapons, 'spear') || 
                     ContentDB.findById(ContentDB.weapons, 'sword');

      guard.x = tower.x;
      guard.y = tower.y;
    }
  },

  createGuard(sim) {
    const guardDef = ContentDB.findById(ContentDB.professions, 'guard');
    const race = ContentDB.randomRace();
    const name = ContentDB.randomName();

    const guard = {
      id: sim.nextId++,
      type: 'npc',
      alive: true,
      name: 'Guardia ' + name,
      race,
      profession: guardDef,
      weapon: ContentDB.findById(ContentDB.weapons, 'spear'),

      x: 0, y: 0,
      speed: 100 * (race.speedMult || 1),

      hp: 150,
      hunger: 100,
      energy: 100,
      social: 100,
      mood: 100,
      age: Phaser.Math.Between(25, 45),
      gold: 50,

      path: [],
      thinkTimer: 0,
      action: 'guard',
      actionTarget: null,
      attackCooldown: 0,
      job: null,

      isGuard: true,
      towerId: null,
      guardPosition: null,
      patrolRadius: 80
    };

    sim.entities.push(guard);
    return guard;
  },

  update(sim, dt) {
    this.updateTimer += dt * 1000;
    
    const shouldSearch = this.updateTimer >= this.updateInterval;
    if (shouldSearch) this.updateTimer = 0;

    for (const tower of Walls.towers) {
      const guard = sim.getById(tower.guardId);
      if (!guard || !guard.alive) continue;

      guard.attackCooldown = Math.max(0, guard.attackCooldown - dt);

      // Solo buscar amenazas cada 500ms
      let threat = null;
      if (shouldSearch) {
        threat = this.findThreat(sim, guard);
      }

      if (threat) {
        const dist = Phaser.Math.Distance.Between(guard.x, guard.y, threat.x, threat.y);
        const range = guard.weapon?.range || 40;

        if (dist <= range && guard.attackCooldown <= 0) {
          this.attack(sim, guard, threat);
          guard.attackCooldown = 1.2;
        } else if (dist < this.detectionRange) {
          sim.setDestination(guard, threat.x, threat.y);
        }
      } else {
        if (guard.guardPosition) {
          const distToPost = Phaser.Math.Distance.Between(
            guard.x, guard.y, 
            guard.guardPosition.x, guard.guardPosition.y
          );

          if (distToPost > 30) {
            sim.setDestination(guard, guard.guardPosition.x, guard.guardPosition.y);
          } else {
            if (guard.path.length === 0 && Math.random() < 0.01) {
              const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
              const px = guard.guardPosition.x + Math.cos(angle) * guard.patrolRadius;
              const py = guard.guardPosition.y + Math.sin(angle) * guard.patrolRadius;
              sim.setDestination(guard, px, py);
            }
          }
        }
      }

      guard.hunger = Math.max(0, guard.hunger - 0.3 * dt);
      guard.energy = Math.max(0, guard.energy - 0.2 * dt);
    }
  },

  findThreat(sim, guard) {
    let best = null;
    let bestDist = this.detectionRange;

    for (const entity of sim.entities) {
      if (entity.type !== 'animal' || !entity.alive || !entity.hostile) continue;

      const dist = Phaser.Math.Distance.Between(guard.x, guard.y, entity.x, entity.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = entity;
      }
    }

    return best;
  },

  attack(sim, guard, target) {
    if (!target || !target.alive) return;

    let damage = this.baseDamage;
    
    if (guard.weapon) {
      damage = guard.weapon.damage || 10;
    }

    const bonuses = guard.profession?.bonuses || {};
    if (bonuses.combat) damage *= bonuses.combat;

    if (guard.race?.id === 'orc') damage *= 1.2;

    damage = Math.floor(damage);

    target.hp -= damage;

    if (sim.onDamage) {
      sim.onDamage(target.x, target.y, damage);
    }

    if (target.hp <= 0) {
      target.alive = false;
      target.deathCause = 'guardia';

      if (target.def?.loot && sim.stock) {
        const loot = target.def.loot;
        for (const res in loot) {
          sim.stock[res] = (sim.stock[res] || 0) + loot[res];
        }
        if (sim.onLoot) sim.onLoot(target.x, target.y, loot);
      }
    }
  }
};
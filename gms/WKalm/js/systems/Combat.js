// ============================================================
// COMBAT SYSTEM
// Ataques, daño, muerte de animales.
// ============================================================

window.Combat = {

  // ----------------------------------------------------------
  // Calcular daño de un atacante
  // ----------------------------------------------------------
  calcDamage(attacker) {
    let dmg = 2; // daño base (puños)

    if (attacker.weapon) {
      dmg = attacker.weapon.damage || 5;
    }

    // Bonus de profesión
    const bonuses = attacker.profession?.bonuses || {};
    if (bonuses.combat) dmg *= bonuses.combat;

    // Bonus de raza
    if (attacker.race?.id === 'orc') dmg *= 1.2;

    return Math.floor(dmg);
  },

  // ----------------------------------------------------------
  // Atacar un objetivo
  // ----------------------------------------------------------
  attack(attacker, target, sim) {
    if (!target || !target.alive) return;
    if (!attacker || !attacker.alive) return;

    const dmg = this.calcDamage(attacker);
    target.hp -= dmg;

    // Efecto visual: número de daño flotante
    if (sim && sim.onDamage) {
      sim.onDamage(target.x, target.y, dmg);
    }

    if (target.hp <= 0) {
      target.alive = false;
      target.deathCause = 'combat';

      // Loot si es animal
      if (target.type === 'animal' && target.def?.loot) {
        const loot = target.def.loot;
        if (sim.stock) {
          for (const res in loot) {
            sim.stock[res] = (sim.stock[res] || 0) + loot[res];
          }
        }
        if (sim.onLoot) sim.onLoot(target.x, target.y, loot);
      }
    }
  },

  // ----------------------------------------------------------
  // Distancia de ataque
  // ----------------------------------------------------------
  getRange(attacker) {
    return attacker.weapon?.range || 30;
  }
};
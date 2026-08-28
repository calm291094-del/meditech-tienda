// ============================================================
// NEEDS SYSTEM
// Maneja hambre, energía, social, ánimo.
// Integrado en el update del Sim.
// ============================================================

window.Needs = {

  // Decaimiento por segundo
  decay: {
    hunger:  1.2,   // por segundo
    energy:  0.8,
    social:  0.5,
    mood:    0.2
  },

  // ----------------------------------------------------------
  // Actualizar necesidades de un NPC
  // delta en segundos
  // ----------------------------------------------------------
  update(npc, delta) {
    if (!npc || npc.type !== 'npc') return;

    // Decaimiento base
    npc.hunger = Math.max(0, npc.hunger - this.decay.hunger * delta);
    npc.energy = Math.max(0, npc.energy - this.decay.energy * delta);
    npc.social = Math.max(0, npc.social - this.decay.social * delta);

    // Ánimo depende de las otras necesidades
    const target = (npc.hunger + npc.energy + npc.social) / 3;
    npc.mood += (target - npc.mood) * 0.05 * delta;
    npc.mood = Phaser.Math.Clamp(npc.mood, 0, 100);

    // Daño por hambre
    if (npc.hunger <= 0) {
      npc.hp -= 2 * delta;
      if (npc.hp <= 0) {
        npc.alive = false;
        npc.deathCause = 'hambre';
      }
    }

    // Muerte por edad
    npc.age += delta * 0.01;
    const maxAge = npc.race ? npc.race.lifespan : 90;
    if (npc.age >= maxAge) {
      npc.alive = false;
      npc.deathCause = 'vejez';
    }
  },

  // ----------------------------------------------------------
  // Comer (restaura hambre)
  // ----------------------------------------------------------
  eat(npc, amount = 30) {
    npc.hunger = Math.min(100, npc.hunger + amount);
  },

  // ----------------------------------------------------------
  // Dormir (restaura energía)
  // ----------------------------------------------------------
  sleep(npc, amount = 40) {
    npc.energy = Math.min(100, npc.energy + amount);
  },

  // ----------------------------------------------------------
  // Socializar
  // ----------------------------------------------------------
  socialize(npc, amount = 15) {
    npc.social = Math.min(100, npc.social + amount);
  },

  // ----------------------------------------------------------
  // Decidir acción basada en necesidades (IA simple)
  // Devuelve string: 'eat' | 'sleep' | 'social' | 'gather' | 'hunt' | 'wander'
  // ----------------------------------------------------------
  decideAction(npc, sim) {
    if (npc.hunger < 30) return 'eat';
    if (npc.energy < 25) return 'sleep';
    if (npc.social < 30) return 'social';

    // Si tiene profesión y hay recursos cerca → recolectar
    if (npc.profession) {
      const prof = npc.profession;
      if (prof.id === 'lumberjack' || prof.id === 'miner') return 'gather';
      if (prof.id === 'farmer')      return 'gather';
    }

    // Si es cazador o guardia y hay animales hostiles → cazar
    if ((npc.profession?.id === 'hunter' || npc.profession?.id === 'guard') && npc.weapon) {
      return 'hunt';
    }

    return 'wander';
  }
};
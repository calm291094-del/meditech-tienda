// ============================================================
// DOGS.JS - Sistema de perros con IA funcional
// ============================================================

window.Dogs = {
  init(sim) {
    // Inicialización
  },

  update(sim, dt) {
    for (const dog of sim.getDogs()) {
      if (!dog.alive) continue;

      this.updateDog(dog, sim, dt);
    }
  },

  updateDog(dog, sim, dt) {
    if (dog.attackCooldown > 0) dog.attackCooldown -= dt;

    // Envejecimiento
    dog.age += dt * 0.01;
    if (dog.age >= dog.maxAge) {
      dog.alive = false;
      sim.socialEvents.push({
        type: 'dog_death',
        emoji: '🐕',
        text: `💀 ${dog.name} murió de viejo`,
        t: 0,
        n: { x: dog.x, y: dog.y }
      });
      return;
    }

    // Crecimiento de cachorros
    if (dog.isPuppy && dog.age >= 1) {
      dog.isPuppy = false;
      dog.emoji = '🐕';
      dog.speed = 120;
      dog.hp = 50;
      dog.damage = 5;
      
      sim.socialEvents.push({
        type: 'dog_growth',
        emoji: '🐕',
        text: `🐕 ${dog.name} creció`,
        t: 0,
        n: { x: dog.x, y: dog.y }
      });
    }

    dog.thinkTimer -= dt;

    // Si tiene compañero, seguirlo
    if (dog.companionOf) {
      const companion = sim.getById(dog.companionOf);
      if (companion && companion.alive) {
        const dist = Phaser.Math.Distance.Between(dog.x, dog.y, companion.x, companion.y);
        if (dist > 60) {
          sim.setDestination(dog, companion.x, companion.y);
          return;
        }
      } else {
        dog.companionOf = null;
      }
    }

    // Buscar amenazas cercanas al pueblo
    const threat = sim.findNearestHostile(dog.x, dog.y, 200);
    if (threat && Navigation.isInside(dog.x, dog.y)) {
      const dist = Phaser.Math.Distance.Between(dog.x, dog.y, threat.x, threat.y);
      if (dist < 30 && dog.attackCooldown <= 0) {
        threat.hp -= dog.damage;
        dog.attackCooldown = 1.5;
        dog.skills.guarding = (dog.skills.guarding || 0) + 0.2;
        
        if (threat.hp <= 0) {
          threat.alive = false;
          sim.socialEvents.push({
            type: 'dog_kill',
            emoji: '🐕',
            text: `🐕 ${dog.name} derrotó a ${threat.name}`,
            t: 0,
            n: { x: threat.x, y: threat.y }
          });
        }
      } else {
        sim.setDestination(dog, threat.x, threat.y);
        return;
      }
    }

    // Patrullar aleatoriamente
    if (dog.path.length === 0 && dog.thinkTimer <= 0) {
      const target = Navigation.randomPointInside();
      sim.setDestination(dog, target.x, target.y);
      dog.thinkTimer = Phaser.Math.Between(3, 7);
    }
  }
};
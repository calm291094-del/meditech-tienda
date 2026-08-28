// ============================================================
// DOGS.JS - Sistema de crianza y compañerismo de perros
// ============================================================

window.Dogs = {

  init(sim) {
    this.sim = sim;
  },

  update(sim, dt) {
    // Intentar reproducción entre perros
    for (const dog of sim.getDogs()) {
      if (dog.isPuppy || dog.age < 2) continue;
      if (dog.pregnancyTimer > 0) {
        dog.pregnancyTimer -= dt;
        if (dog.pregnancyTimer <= 0) {
          this.givePuppies(dog, sim);
        }
        continue;
      }

      // Buscar pareja
      if (Math.random() < 0.001 * dt) {
        const partner = this.findPartner(dog, sim);
        if (partner) {
          dog.pregnancyTimer = 300; // 5 minutos reales
        }
      }
    }
  },

  findPartner(dog, sim) {
    for (const other of sim.getDogs()) {
      if (other.id === dog.id) continue;
      if (other.isPuppy || other.age < 2) continue;
      if (other.pregnancyTimer > 0) continue;
      
      const dist = Phaser.Math.Distance.Between(dog.x, dog.y, other.x, other.y);
      if (dist < 100) {
        return other;
      }
    }
    return null;
  },

  givePuppies(mother, sim) {
    const father = this.findPartner(mother, sim);
    if (!father) return;

    const litterSize = Phaser.Math.Between(1, 3);
    
    for (let i = 0; i < litterSize; i++) {
      const puppy = sim.spawnDog({
        name: ContentDB.randomDogName(),
        position: {
          x: mother.x + Phaser.Math.Between(-30, 30),
          y: mother.y + Phaser.Math.Between(-30, 30)
        },
        isPuppy: true,
        age: 0,
        parentId1: mother.id,
        parentId2: father.id,
        generation: Math.max(mother.generation, father.generation) + 1
      });

      // Heredar skills de los padres
      puppy.skills.hunting = (mother.skills.hunting + father.skills.hunting) / 4;
      puppy.skills.guarding = (mother.skills.guarding + father.skills.guarding) / 4;
    }

    mother.pregnancyTimer = 0;

    if (sim.onBirth) {
      sim.socialEvents.push({
        type: 'puppies',
        mother,
        father,
        count: litterSize,
        t: 0,
        text: `${mother.name} tuvo ${litterSize} cachorros`
      });
    }
  },

  // Asignar perro a un NPC
  assignCompanion(dog, npc) {
    dog.companionOf = npc.id;
  }
};
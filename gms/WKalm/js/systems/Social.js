// ============================================================
// SOCIAL.JS - OPTIMIZADO (update cada 2 segundos, no cada frame)
// ============================================================

window.Social = {

  relationships: {},
  memories: {},
  pendingEvents: [],
  updateTimer: 0,
  updateInterval: 2000, // Solo actualizar cada 2 segundos

  init(sim) {
    this.relationships = {};
    this.memories = {};
    this.pendingEvents = [];
    this.updateTimer = 0;
  },

  getRelation(id1, id2) {
    const key = this.getRelationKey(id1, id2);
    if (!this.relationships[key]) {
      this.relationships[key] = {
        friendship: 0,
        romance: 0,
        interactions: 0,
        lastInteraction: 0
      };
    }
    return this.relationships[key];
  },

  getRelationKey(id1, id2) {
    return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
  },

  interact(npc1, npc2, sim) {
    if (!npc1 || !npc2 || npc1.id === npc2.id) return;
    if (!npc1.alive || !npc2.alive) return;

    const rel = this.getRelation(npc1.id, npc2.id);

    let friendshipGain = 2;
    if (npc1.profession?.id === npc2.profession?.id) friendshipGain += 1;

    rel.friendship = Phaser.Math.Clamp(rel.friendship + friendshipGain, -100, 100);
    rel.interactions++;
    rel.lastInteraction = sim.time;

    npc1.social = Math.min(100, npc1.social + 5);
    npc2.social = Math.min(100, npc2.social + 5);
    npc1.mood = Math.min(100, npc1.mood + 3);
    npc2.mood = Math.min(100, npc2.mood + 3);

    this.addMemory(npc1.id, {
      type: 'social',
      with: npc2.id,
      withName: npc2.name,
      day: sim.day,
      text: `Habló con ${npc2.name}`
    });

    if (this.canRomance(npc1, npc2) && rel.friendship > 30) {
      rel.romance = Math.min(100, rel.romance + 1);

      if (rel.romance > 60 && Math.random() < 0.05) {
        this.proposeMarriage(npc1, npc2, sim);
      }
    }
  },

  canRomance(npc1, npc2) {
    if (!npc1 || !npc2) return false;
    if (npc1.age < 18 || npc2.age < 18) return false;
    if (npc1.spouseId || npc2.spouseId) return false;
    if (npc1.gender === npc2.gender) return false;
    return true;
  },

  proposeMarriage(npc1, npc2, sim) {
    if (npc1.spouseId || npc2.spouseId) return;

    npc1.spouseId = npc2.id;
    npc2.spouseId = npc1.id;

    const rel = this.getRelation(npc1.id, npc2.id);
    rel.romance = 100;

    this.pendingEvents.push({
      type: 'marriage',
      npc1: npc1.id,
      npc2: npc2.id,
      day: sim.day
    });

    this.addMemory(npc1.id, {
      type: 'marriage',
      with: npc2.id,
      withName: npc2.name,
      day: sim.day,
      text: `Se casó con ${npc2.name}`
    });

    this.addMemory(npc2.id, {
      type: 'marriage',
      with: npc1.id,
      withName: npc1.name,
      day: sim.day,
      text: `Se casó con ${npc1.name}`
    });

    if (sim.onMarriage) {
      sim.onMarriage(npc1, npc2);
    }
  },

  tryReproduce(npc, sim) {
    if (!npc.spouseId) return;
    if (npc.age < 18 || npc.age > 45) return;

    const spouse = sim.getById(npc.spouseId);
    if (!spouse || !spouse.alive) return;
    if (spouse.age < 18 || spouse.age > 45) return;

    if (npc.gender !== 'F') return;
    if (npc.pregnancyTimer && npc.pregnancyTimer > 0) return;

    if (Math.random() > 0.001) return;

    npc.pregnancyTimer = 600;

    this.addMemory(npc.id, {
      type: 'pregnancy',
      day: sim.day,
      text: 'Quedó embarazada'
    });

    if (sim.onPregnancy) {
      sim.onPregnancy(npc);
    }
  },

  giveBirth(mother, sim) {
    if (!mother.spouseId) return null;

    const father = sim.getById(mother.spouseId);
    if (!father || !father.alive) return null;

    const baby = sim.spawnNpc({
      name: ContentDB.randomName(),
      race: mother.race,
      profession: ContentDB.findById(ContentDB.professions, 'villager')
    });

    baby.age = 0;
    baby.parentId1 = mother.id;
    baby.parentId2 = father.id;
    baby.x = mother.x + Phaser.Math.Between(-20, 20);
    baby.y = mother.y + Phaser.Math.Between(-20, 20);

    this.addMemory(mother.id, {
      type: 'birth',
      childId: baby.id,
      childName: baby.name,
      day: sim.day,
      text: `Dio a luz a ${baby.name}`
    });

    this.addMemory(father.id, {
      type: 'birth',
      childId: baby.id,
      childName: baby.name,
      day: sim.day,
      text: `Fue padre de ${baby.name}`
    });

    if (sim.onBirth) {
      sim.onBirth(mother, father, baby);
    }

    return baby;
  },

  addMemory(npcId, memory) {
    if (!this.memories[npcId]) {
      this.memories[npcId] = [];
    }

    this.memories[npcId].push(memory);

    if (this.memories[npcId].length > 20) {
      this.memories[npcId].shift();
    }
  },

  getMemories(npcId) {
    return this.memories[npcId] || [];
  },

  getFriends(npcId, sim, minFriendship = 30) {
    const friends = [];

    for (const entity of sim.entities) {
      if (entity.type !== 'npc' || entity.id === npcId || !entity.alive) continue;

      const rel = this.getRelation(npcId, entity.id);
      if (rel.friendship >= minFriendship) {
        friends.push({
          npc: entity,
          friendship: rel.friendship
        });
      }
    }

    return friends.sort((a, b) => b.friendship - a.friendship);
  },

  // ============================================================
  // UPDATE OPTIMIZADO (solo cada 2 segundos)
  // ============================================================
  update(sim, dt) {
    this.updateTimer += dt * 1000; // convertir a ms
    
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;

    // Procesar embarazos (esto sí cada update)
    for (const entity of sim.entities) {
      if (entity.type !== 'npc' || !entity.alive) continue;

      if (entity.pregnancyTimer && entity.pregnancyTimer > 0) {
        entity.pregnancyTimer -= dt * 60;

        if (entity.pregnancyTimer <= 0) {
          entity.pregnancyTimer = 0;
          this.giveBirth(entity, sim);
        }
      }

      // Intentar reproducción (probabilidad baja)
      if (Math.random() < 0.01) {
        this.tryReproduce(entity, sim);
      }
    }
  }
};
// ============================================================
// DUNGEON.JS - Sistema completo de mazmorra
// Los aventureros entran, suben pisos, obtienen loot y XP
// ============================================================

window.Dungeon = {
  floors: [],
  maxFloor: 1,
  pressure: 0,
  expeditions: [],
  log: [],
  
  floorTypes: [
    { id: 'cave', name: 'Cueva', emoji: '🕳️', difficulty: 1 },
    { id: 'crypt', name: 'Cripta', emoji: '⚰️', difficulty: 1.2 },
    { id: 'ruins', name: 'Ruinas', emoji: '🏛️', difficulty: 1.4 },
    { id: 'mine', name: 'Mina', emoji: '⛏️', difficulty: 1.3 },
    { id: 'forest', name: 'Bosque Oscuro', emoji: '🌲', difficulty: 1.5 },
    { id: 'demon', name: 'Plano Demoníaco', emoji: '👹', difficulty: 2.0 },
    { id: 'void', name: 'Vacío', emoji: '🌀', difficulty: 2.5 },
    { id: 'dragon', name: 'Guarida Dragón', emoji: '🐉', difficulty: 3.0 }
  ],

  lootTable: [
    { id: 'gold', name: 'Oro', emoji: '💰', weight: 40, min: 10, max: 50 },
    { id: 'weapon', name: 'Arma', emoji: '⚔️', weight: 25, min: 1, max: 1 },
    { id: 'potion', name: 'Poción', emoji: '🧪', weight: 20, min: 1, max: 3 },
    { id: 'gem', name: 'Gema', emoji: '💎', weight: 10, min: 1, max: 2 },
    { id: 'scroll', name: 'Pergamino', emoji: '📜', weight: 5, min: 1, max: 1 }
  ],

  monsters: [
    { id: 'rat', name: 'Rata Gigante', emoji: '🐀', hp: 20, damage: 3, xp: 5, floor: 1 },
    { id: 'bat', name: 'Murciélago', emoji: '🦇', hp: 15, damage: 4, xp: 6, floor: 1 },
    { id: 'skeleton', name: 'Esqueleto', emoji: '💀', hp: 40, damage: 8, xp: 12, floor: 2 },
    { id: 'goblin', name: 'Goblin', emoji: '👺', hp: 35, damage: 10, xp: 15, floor: 2 },
    { id: 'orc', name: 'Orco', emoji: '👹', hp: 80, damage: 15, xp: 25, floor: 3 },
    { id: 'troll', name: 'Troll', emoji: '🧌', hp: 120, damage: 20, xp: 40, floor: 4 },
    { id: 'dragon', name: 'Dragón Joven', emoji: '🐲', hp: 200, damage: 30, xp: 80, floor: 5 },
    { id: 'demon', name: 'Demonio', emoji: '😈', hp: 300, damage: 40, xp: 120, floor: 7 },
    { id: 'lich', name: 'Liche', emoji: '🧙', hp: 250, damage: 50, xp: 150, floor: 8 }
  ],

  init(sim) {
    this.floors = [];
    this.maxFloor = 1;
    this.pressure = 0;
    this.expeditions = [];
    this.log = [];
    
    // Generar 10 pisos iniciales
    for (let i = 1; i <= 10; i++) {
      this.generateFloor(i);
    }

    this.addLog('🌀 La mazmorra despierta en el centro del pueblo');
  },

  generateFloor(floorNum) {
    const typeIndex = Math.min(Math.floor((floorNum - 1) / 2), this.floorTypes.length - 1);
    const type = this.floorTypes[typeIndex];
    
    const floor = {
      number: floorNum,
      type: type,
      difficulty: type.difficulty * (1 + (floorNum - 1) * 0.2),
      monsters: this.generateMonsters(floorNum),
      loot: this.generateLoot(floorNum),
      discovered: floorNum <= this.maxFloor,
      cleared: false
    };

    this.floors.push(floor);
    return floor;
  },

  generateMonsters(floorNum) {
    const count = Phaser.Math.Between(2, 4 + Math.floor(floorNum / 3));
    const monsters = [];

    for (let i = 0; i < count; i++) {
      const available = this.monsters.filter(m => m.floor <= floorNum);
      const monster = Phaser.Utils.Array.GetRandom(available);
      
      monsters.push({
        ...monster,
        hp: Math.floor(monster.hp * (1 + (floorNum - 1) * 0.15)),
        damage: Math.floor(monster.damage * (1 + (floorNum - 1) * 0.1)),
        xp: Math.floor(monster.xp * (1 + (floorNum - 1) * 0.1)),
        alive: true
      });
    }

    return monsters;
  },

  generateLoot(floorNum) {
    const count = Phaser.Math.Between(1, 3);
    const loot = [];

    for (let i = 0; i < count; i++) {
      const totalWeight = this.lootTable.reduce((sum, l) => sum + l.weight, 0);
      let random = Math.random() * totalWeight;
      let chosen = this.lootTable[0];

      for (const item of this.lootTable) {
        random -= item.weight;
        if (random <= 0) {
          chosen = item;
          break;
        }
      }

      loot.push({
        ...chosen,
        amount: Phaser.Math.Between(item.min, item.max) * Math.ceil(floorNum / 2)
      });
    }

    return loot;
  },

  // Enviar expedición a la mazmorra
  sendExpedition(sim, floorNum, npcIds) {
    if (floorNum > this.maxFloor) {
      this.addLog('❌ Piso no descubierto');
      return false;
    }

    const npcs = npcIds.map(id => sim.getById(id)).filter(n => n && n.alive);
    if (npcs.length === 0) {
      this.addLog('❌ No hay aventureros disponibles');
      return false;
    }

    const expedition = {
      id: Date.now(),
      npcs: npcs,
      floor: floorNum,
      status: 'exploring',
      timer: 0,
      duration: 30 + floorNum * 5, // segundos
      battles: [],
      loot: []
    };

    this.expeditions.push(expedition);
    this.addLog(`⚔️ Expedición enviada al piso ${floorNum}`);
    
    return true;
  },

  update(sim, dt) {
    // Aumentar presión de la mazmorra
    this.pressure = Math.min(100, this.pressure + dt * 0.5);

    // Si la presión llega a 100, genera nuevo piso
    if (this.pressure >= 100) {
      this.pressure = 0;
      this.maxFloor++;
      this.generateFloor(this.maxFloor);
      this.addLog(`🌀 Nuevo piso descubierto: ${this.maxFloor}`);
      
      sim.socialEvents.push({
        type: 'dungeon_floor',
        emoji: '🌀',
        text: `🌀 Piso ${this.maxFloor} descubierto`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    }

    // Actualizar expediciones
    for (const exp of this.expeditions) {
      if (exp.status !== 'exploring') continue;

      exp.timer += dt;

      // Simular batalla cada 5 segundos
      if (exp.timer % 5 < dt) {
        this.simulateBattle(exp, sim);
      }

      // Expedición completada
      if (exp.timer >= exp.duration) {
        this.completeExpedition(exp, sim);
      }
    }

    // Limpiar expediciones terminadas
    this.expeditions = this.expeditions.filter(e => e.status === 'exploring');
  },

  simulateBattle(expedition, sim) {
    const floor = this.floors[expedition.floor - 1];
    if (!floor) return;

    const aliveMonsters = floor.monsters.filter(m => m.alive);
    if (aliveMonsters.length === 0) return;

    const monster = Phaser.Utils.Array.GetRandom(aliveMonsters);
    const npc = Phaser.Utils.Array.GetRandom(expedition.npcs.filter(n => n.alive));

    if (!npc) return;

    // Calcular daño
    const npcPower = (npc.skills?.combat || 0) + (npc.weapon?.damage || 5) + (npc.level || 1) * 2;
    const monsterPower = monster.damage;

    // NPC ataca
    const npcDamage = Math.floor(npcPower * Phaser.Math.FloatBetween(0.8, 1.2));
    monster.hp -= npcDamage;

    expedition.battles.push({
      attacker: npc.name,
      target: monster.name,
      damage: npcDamage,
      type: 'npc_attack'
    });

    // Monstruo muere
    if (monster.hp <= 0) {
      monster.alive = false;
      
      // NPC gana XP
      npc.experience = (npc.experience || 0) + monster.xp;
      npc.skills.combat = (npc.skills.combat || 0) + 0.5;

      // Level up
      if (npc.experience >= (npc.level || 1) * 100) {
        npc.level = (npc.level || 1) + 1;
        npc.experience = 0;
        npc.hp = Math.min(150, npc.hp + 10);
        npc.speed += 3;
        
        this.addLog(`⬆️ ${npc.name} subió a nivel ${npc.level}`);
      }

      this.addLog(`⚔️ ${npc.name} derrotó a ${monster.name} (+${monster.xp} XP)`);
    } else {
      // Monstruo contraataca
      const monsterDamage = Math.floor(monsterPower * Phaser.Math.FloatBetween(0.8, 1.2));
      npc.hp -= monsterDamage;

      expedition.battles.push({
        attacker: monster.name,
        target: npc.name,
        damage: monsterDamage,
        type: 'monster_attack'
      });

      // NPC muere
      if (npc.hp <= 0) {
        npc.alive = false;
        this.addLog(`💀 ${npc.name} murió en la mazmorra`);
      }
    }
  },

  completeExpedition(expedition, sim) {
    const floor = this.floors[expedition.floor - 1];
    if (!floor) return;

    expedition.status = 'completed';

    // Verificar si limpiaron el piso
    const aliveMonsters = floor.monsters.filter(m => m.alive);
    if (aliveMonsters.length === 0) {
      floor.cleared = true;
      this.addLog(`✅ Piso ${expedition.floor} completado`);

      // Recompensa de piso
      const goldReward = 50 * expedition.floor;
      sim.addStock('gold', goldReward);
      this.addLog(`💰 +${goldReward} oro por completar piso`);
    }

    // Recolectar loot
    for (const item of floor.loot) {
      expedition.loot.push(item);
      
      if (item.id === 'gold') {
        sim.addStock('gold', item.amount);
      } else if (item.id === 'potion') {
        // Curar NPCs sobrevivientes
        for (const npc of expedition.npcs) {
          if (npc.alive) {
            npc.hp = Math.min(100, npc.hp + 30);
          }
        }
      } else if (item.id === 'weapon') {
        // Dar arma aleatoria al primer NPC
        const survivor = expedition.npcs.find(n => n.alive);
        if (survivor) {
          const weapon = ContentDB.randomWeapon();
          survivor.weapon = weapon;
          this.addLog(`⚔️ ${survivor.name} encontró ${weapon.name}`);
        }
      }
    }

    // Registrar en eventos sociales
    const survivors = expedition.npcs.filter(n => n.alive).length;
    sim.socialEvents.push({
      type: 'expedition_return',
      emoji: '🌀',
      text: `🌀 Expedición regresó (${survivors}/${expedition.npcs.length} sobrevivieron)`,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });
  },

  addLog(message) {
    this.log.unshift({
      message,
      time: Date.now()
    });

    if (this.log.length > 50) {
      this.log.pop();
    }

    console.log('[Mazmorra]', message);
  },

  getStats() {
    return {
      maxFloor: this.maxFloor,
      pressure: Math.floor(this.pressure),
      activeExpeditions: this.expeditions.length,
      totalFloors: this.floors.length
    };
  }
};
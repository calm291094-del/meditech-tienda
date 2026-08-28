// ============================================================
// DIPLOMACY.JS - Sistema de tribus rivales, guerras, alianzas
// ============================================================

window.Diplomacy = {
  rivals: [],
  relations: {},
  warParties: [],
  stats: { warsWon: 0, warsLost: 0, dragonsKilled: 0, alliances: 0 },
  updateTimer: 0,

  init(sim) {
    this.rivals = [];
    this.relations = {};
    this.warParties = [];
    this.stats = { warsWon: 0, warsLost: 0, dragonsKilled: 0, alliances: 0 };

    const rivalNames = ContentDB.rivals || [
      'Los Salvajes', 'Los Nómadas', 'Los Bárbaros',
      'Los Errantes', 'Los Sombríos', 'Los Feroces'
    ];

    const colors = ['#b45309', '#7f1d1d', '#1e3a8a', '#4c1d95', '#065f46'];
    const cx = sim.mapWidth / 2;
    const cy = sim.mapHeight / 2;

    // Crear 3 tribus rivales alrededor del mapa
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 900 + Math.random() * 200;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      const rival = {
        id: 'rival_' + i,
        name: rivalNames[i % rivalNames.length],
        color: colors[i % colors.length],
        emoji: ['⚔️', '🏹', '🛡️'][i % 3],
        x, y,
        pop: Phaser.Math.Between(8, 15),
        strength: Phaser.Math.Between(20, 40),
        alive: true,
        hostile: Math.random() < 0.3,
        warCooldown: 0
      };

      this.rivals.push(rival);
      this.relations[rival.id] = {
        reputation: 50,
        trade: false,
        alliance: false,
        war: rival.hostile
      };
    }
  },

  getRelation(id) {
    return this.relations[id] || { reputation: 50, trade: false, alliance: false, war: false };
  },

  changeRep(id, amount, sim) {
    const rel = this.relations[id];
    if (!rel) return;
    rel.reputation = Phaser.Math.Clamp(rel.reputation + amount, 0, 100);

    // Alianza automática
    if (rel.reputation >= 82 && !rel.alliance) {
      rel.alliance = true;
      rel.trade = true;
      this.stats.alliances++;
      sim.socialEvents.push({
        type: 'alliance',
        emoji: '🤝',
        text: `🤝 Alianza con ${this.getRival(id).name}`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    }

    // Ruptura de alianza
    if (rel.alliance && rel.reputation < 55) {
      rel.alliance = false;
      sim.socialEvents.push({
        type: 'alliance_broken',
        emoji: '💔',
        text: `💔 Alianza rota con ${this.getRival(id).name}`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    }

    // Guerra automática
    if (rel.reputation <= 18 && !rel.war) {
      rel.war = true;
      rel.alliance = false;
      sim.socialEvents.push({
        type: 'war_declared',
        emoji: '⚔️',
        text: `⚔️ Guerra con ${this.getRival(id).name}`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    }

    // Paz automática
    if (rel.war && rel.reputation >= 45) {
      rel.war = false;
      sim.socialEvents.push({
        type: 'peace',
        emoji: '🕊️',
        text: `🕊️ Paz con ${this.getRival(id).name}`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    }
  },

  getRival(id) {
    return this.rivals.find(r => r.id === id);
  },

  // ===== ACCIONES DIPLOMÁTICAS =====

  sendGift(rivalId, resource, amount, sim) {
    const rel = this.getRelation(rivalId);
    const rival = this.getRival(rivalId);
    if (!rival || !rival.alive) return false;
    if (rel.war) return false;
    if ((sim.stock[resource] || 0) < amount) return false;

    sim.stock[resource] -= amount;
    this.changeRep(rivalId, Math.floor(amount / 5) + 5, sim);
    return true;
  },

  trade(rivalId, giveRes, giveAmt, recvRes, recvAmt, sim) {
    const rel = this.getRelation(rivalId);
    if (rel.war) return false;
    if ((sim.stock[giveRes] || 0) < giveAmt) return false;

    sim.stock[giveRes] -= giveAmt;
    sim.addStock(recvRes, recvAmt);
    this.changeRep(rivalId, 5, sim);
    return true;
  },

  declareWar(rivalId, sim) {
    const rel = this.relations[rivalId];
    const rival = this.getRival(rivalId);
    if (!rel || !rival || !rival.alive) return false;

    rel.war = true;
    rel.alliance = false;
    rel.reputation = Math.min(rel.reputation, 15);
    rival.hostile = true;

    sim.socialEvents.push({
      type: 'war_declared',
      emoji: '⚔️',
      text: `⚔️ ¡Guerra declarada a ${rival.name}!`,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });

    return true;
  },

  offerPeace(rivalId, sim) {
    const rel = this.relations[rivalId];
    const rival = this.getRival(rivalId);
    if (!rel || !rel.war) return false;
    if ((sim.stock.gold || 0) < 80) return false;

    sim.stock.gold -= 80;
    rel.war = false;
    rel.reputation = 42;
    rival.hostile = false;
    return true;
  },

  sendWarParty(rivalId, sim) {
    const rival = this.getRival(rivalId);
    if (!rival || !rival.alive) return false;

    const warriors = sim.getNpcs().filter(n => 
      n.weapon && !n.isGuard && n.age >= 18
    ).length;

    const troops = Math.max(3, Math.min(6, Math.floor(warriors * 0.4)));
    if (troops < 2) return false;

    this.warParties.push({
      id: Date.now(),
      x: sim.mapWidth / 2,
      y: sim.mapHeight / 2,
      targetX: rival.x,
      targetY: rival.y,
      targetRival: rivalId,
      count: troops,
      hp: troops * 20,
      isPlayerAttack: true,
      alive: true,
      timer: 0
    });

    sim.socialEvents.push({
      type: 'expedition',
      emoji: '⚔️',
      text: `⚔️ Expedición de ${troops} guerreros enviada`,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });

    return true;
  },

  // ===== UPDATE =====

  update(sim, dt) {
    this.updateTimer += dt;

    // Decaimiento natural de reputación (cada 30 segundos)
    if (this.updateTimer >= 30) {
      this.updateTimer = 0;
      for (const id in this.relations) {
        const rel = this.relations[id];
        if (!rel.war) {
          this.changeRep(id, -0.3, sim);
        }
      }

      // Ataques aleatorios de rivales en guerra
      for (const rival of this.rivals) {
        if (!rival.alive) continue;
        const rel = this.getRelation(rival.id);
        
        if (rel.war && Math.random() < 0.2) {
          this.enemyRaid(rival, sim);
        }
      }
    }

    // Actualizar partidas de guerra
    for (const party of this.warParties) {
      if (!party.alive) continue;

      party.timer += dt;

      const dx = party.targetX - party.x;
      const dy = party.targetY - party.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 20) {
        const speed = 60 * dt;
        party.x += (dx / dist) * speed;
        party.y += (dy / dist) * speed;
      } else {
        // Llegó al destino
        if (party.isPlayerAttack) {
          this.resolveAttack(party, sim);
        } else {
          this.resolveDefense(party, sim);
        }
        party.alive = false;
      }
    }

    this.warParties = this.warParties.filter(p => p.alive);
  },

  enemyRaid(rival, sim) {
    // Ataque sorpresa: roba recursos
    const stolen = Phaser.Math.Between(10, 30);
    sim.stock.food = Math.max(0, sim.stock.food - stolen);
    
    // Probabilidad de dañar un NPC
    const npcs = sim.getNpcs().filter(n => !n.isGuard);
    if (npcs.length > 0 && Math.random() < 0.4) {
      const victim = Phaser.Utils.Array.GetRandom(npcs);
      victim.hp -= Phaser.Math.Between(10, 25);
    }

    sim.socialEvents.push({
      type: 'raid',
      emoji: '🏴',
      text: `🏴 ${rival.name} nos atacó: -${stolen} comida`,
      t: 0,
      n: { x: rival.x, y: rival.y }
    });
  },

  resolveAttack(party, sim) {
    const rival = this.getRival(party.targetRival);
    if (!rival || !rival.alive) return;

    const playerStrength = party.count * 8;
    const rivalStrength = rival.strength;

    if (playerStrength > rivalStrength) {
      // Victoria
      rival.pop = Math.max(0, rival.pop - Phaser.Math.Between(2, 5));
      rival.strength = Math.max(5, rival.strength - Phaser.Math.Between(5, 15));
      
      // Botín
      const loot = Phaser.Math.Between(30, 80);
      sim.addStock('gold', loot);
      sim.addStock('food', Phaser.Math.Between(20, 50));
      
      this.stats.warsWon++;
      this.changeRep(rival.id, -20, sim);

      if (rival.pop <= 0) {
        rival.alive = false;
        sim.socialEvents.push({
          type: 'conquest',
          emoji: '🏆',
          text: `🏆 ¡${rival.name} conquistado!`,
          t: 0,
          n: { x: rival.x, y: rival.y }
        });
      } else {
        sim.socialEvents.push({
          type: 'victory',
          emoji: '⚔️',
          text: `⚔️ Victoria contra ${rival.name} (+${loot} oro)`,
          t: 0,
          n: { x: rival.x, y: rival.y }
        });
      }
    } else {
      // Derrota
      this.stats.warsLost++;
      this.changeRep(rival.id, -10, sim);
      sim.socialEvents.push({
        type: 'defeat',
        emoji: '💀',
        text: `💀 Nuestra expedición fue derrotada`,
        t: 0,
        n: { x: rival.x, y: rival.y }
      });
    }
  },

  resolveDefense(party, sim) {
    // Ataque enemigo al pueblo
    const defense = this.calculateDefense(sim);
    const attack = party.count * 6;

    if (defense > attack) {
      // Defensa exitosa
      this.stats.warsWon++;
      sim.socialEvents.push({
        type: 'defense_success',
        emoji: '🛡️',
        text: `🛡️ Ataque repelido con éxito`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    } else {
      // Pueblo sufre
      const damage = Math.floor((attack - defense) / 2);
      sim.stock.food = Math.max(0, sim.stock.food - damage);
      
      const npcs = sim.getNpcs();
      const victims = Math.min(npcs.length, Math.floor(damage / 10));
      for (let i = 0; i < victims; i++) {
        const victim = Phaser.Utils.Array.GetRandom(npcs);
        if (victim) victim.hp -= 20;
      }

      sim.socialEvents.push({
        type: 'defense_fail',
        emoji: '🔥',
        text: `🔥 El pueblo sufrió daños`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
    }
  },

  calculateDefense(sim) {
    let def = 0;
    // Guardias
    def += sim.getNpcs().filter(n => n.isGuard).length * 15;
    // Guerreros
    def += sim.getNpcs().filter(n => n.weapon && !n.isGuard).length * 5;
    // Perros
    def += sim.countType('dog') * 4;
    // Muralla
    def += Pantheon.getDefenseBonus();
    return def;
  },

  // ===== HELPERS =====

  getAtWar() {
    return this.rivals.filter(r => r.alive && this.getRelation(r.id).war);
  },

  getAlliedRivals() {
    return this.rivals.filter(r => r.alive && this.getRelation(r.id).alliance);
  },

  getAllAlive() {
    return this.rivals.filter(r => r.alive);
  }
};
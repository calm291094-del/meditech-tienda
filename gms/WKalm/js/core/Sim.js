class Sim {

  constructor() {
    this.time = 0;
    this.day = 1;
    this.dayTimer = 0;

    this.stock = {
      food: 250, wood: 200, stone: 150, ore: 80, 
      gold: 200, faith: 100, knowledge: 150
    };

    this.mapSeed = Date.now();
    this.grid = MapGenerator.generate(this.mapSeed);
    this.mapWidth = MapGenerator.width * MapGenerator.tileSize;
    this.mapHeight = MapGenerator.height * MapGenerator.tileSize;

    Navigation.worldWidth = this.mapWidth;
    Navigation.worldHeight = this.mapHeight;
    Navigation.center = { x: this.mapWidth / 2, y: this.mapHeight / 2 };

    this.entities = [];
    this.nextId = 1;
    this.selectedId = null;

    this.fog = new Uint8Array(MapGenerator.width * MapGenerator.height);

    this.damageEvents = [];
    this.lootEvents = [];
    this.buildEvents = [];
    this.socialEvents = [];

    this.onDamage = (x, y, dmg) => this.damageEvents.push({ x, y, dmg, t: 0 });
    this.onLoot = (x, y, loot) => this.lootEvents.push({ x, y, loot, t: 0 });
    this.onBuild = (x, y, emoji) => this.buildEvents.push({ x, y, emoji, t: 0 });
    this.onMarriage = (n1, n2) => this.socialEvents.push({ type: 'marriage', n1, n2, t: 0, text: `💍 ${n1.name} + ${n2.name}` });
    this.onBirth = (m, f, b) => this.socialEvents.push({ type: 'birth', m, f, b, t: 0, text: `👶 ${b.name}` });

    Economy.init(this);
    Social.init(this);
    Dogs.init(this);
    Weather.init(this);
    DayNight.init(this);
    Diplomacy.init(this);

    this.spawnInitial();
    this.autoAssignJobs();
  }

  getNpcs()    { return this.entities.filter(e => e.type === 'npc' && e.alive); }
  getAnimals() { return this.entities.filter(e => e.type === 'animal' && e.alive); }
  getItems()   { return this.entities.filter(e => e.type === 'item' && e.alive); }
  getDogs()    { return this.entities.filter(e => e.type === 'dog' && e.alive); }

  addStock(key, amount) {
    this.stock[key] = (this.stock[key] || 0) + amount;
  }

  spawnInitial() {
    for (let i = 0; i < 15; i++) this.spawnNpc();
    for (let i = 0; i < 12; i++) this.spawnAnimal();
    for (let i = 0; i < 3; i++) this.spawnDog();
    
    this.resources = MapGenerator.spawnResources(this.grid);
    this.spawnInitialBusinesses();

    Walls.initTowers();
    Guards.init(this);

    this.revealArea(this.mapWidth / 2, this.mapHeight / 2, 10);
  }

  spawnInitialBusinesses() {
    const cx = this.mapWidth / 2;
    const cy = this.mapHeight / 2;
    const npcs = this.getNpcs();

    const farmDef = ContentDB.findById(ContentDB.buildings, 'farm');
    const marketDef = ContentDB.findById(ContentDB.buildings, 'market');

    if (farmDef && npcs.length > 0) {
      const farmer = npcs.find(v => v.profession?.id === 'farmer') || npcs[0];
      const pos = this.findBuildSpot(cx - 150, cy - 100);
      if (pos) {
        const biz = Economy.createBusiness(farmDef, farmer, pos.x, pos.y);
        Economy.hire(biz, farmer);
      }
    }

    if (marketDef && npcs.length > 1) {
      const merchant = npcs.find(v => v.profession?.id === 'merchant') || npcs[1];
      const pos = this.findBuildSpot(cx + 150, cy - 100);
      if (pos) {
        const biz = Economy.createBusiness(marketDef, merchant, pos.x, pos.y);
        Economy.hire(biz, merchant);
      }
    }
  }

  findBuildSpot(x, y) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const tx = x + Phaser.Math.Between(-50, 50);
      const ty = y + Phaser.Math.Between(-50, 50);
      if (!Navigation.isInside(tx, ty)) continue;

      let clash = false;
      for (const biz of Economy.businesses) {
        if (Phaser.Math.Distance.Between(tx, ty, biz.x, biz.y) < 60) {
          clash = true;
          break;
        }
      }
      if (!clash) return { x: tx, y: ty };
    }
    return { x, y };
  }

  autoAssignJobs() {
    for (const npc of this.getNpcs()) {
      if (npc.job || npc.isGuard) continue;
      const biz = Economy.findJobForNpc(npc);
      if (biz) Economy.hire(biz, npc);
    }
  }

  spawnNpc(opts = {}) {
    const race = opts.race || ContentDB.randomRace();
    const profession = opts.profession || ContentDB.randomProfession();
    const name = opts.name || ContentDB.randomName();
    const home = opts.position || Navigation.randomPointInside();

    let weapon = null;
    if (profession.id === 'hunter' || profession.id === 'guard') {
      weapon = ContentDB.findById(ContentDB.weapons, 'spear');
    }

    const npc = {
      id: this.nextId++,
      type: 'npc',
      alive: true,
      name, race, profession, weapon,
      x: home.x, y: home.y,
      speed: 90 * (race.speedMult || 1),
      hp: 100, hunger: 100, energy: 100, social: 100, mood: 100,
      age: Phaser.Math.Between(18, 40),
      gold: Phaser.Math.Between(10, 50),
      gender: Math.random() < 0.5 ? 'M' : 'F',
      traits: [
        ContentDB.randomTrait()?.id,
        ContentDB.randomTrait()?.id
      ].filter(Boolean),
      path: [],
      thinkTimer: 0,
      action: 'idle',
      actionTarget: null,
      attackCooldown: 0,
      job: null,
      spouseId: null,
      parentId1: null,
      parentId2: null,
      pregnancyTimer: 0,
      isGuard: false,
      towerId: null,
      guardPosition: null,
      
      // ✅ Sistema de skills y aprendizaje
      skills: {
        hunting: 0,
        gathering: 0,
        combat: 0,
        social: 0,
        crafting: 0,
        building: 0
      },
      experience: 0,
      level: 1,
      
      // ✅ Sistema de navegación por fases
      _navPhase: null,
      _navDirection: null,
      _navTicks: 0
    };

    this.entities.push(npc);
    return npc;
  }

  spawnAnimal(opts = {}) {
    const def = opts.def || ContentDB.randomAnimal();
    const pos = opts.position || Navigation.randomPointOutside();

    const animal = {
      id: this.nextId++,
      type: 'animal',
      alive: true,
      def,
      name: def.name,
      emoji: def.emoji,
      x: pos.x, y: pos.y,
      speed: def.speed || 60,
      hostile: !!def.hostile,
      hp: def.hp || 20,
      damage: def.damage || 3,
      path: [],
      thinkTimer: Phaser.Math.Between(500, 3000),
      attackCooldown: 0,
      _navPhase: null
    };

    this.entities.push(animal);
    return animal;
  }

  spawnDog(opts = {}) {
    const name = opts.name || (ContentDB.randomDogName ? ContentDB.randomDogName() : 'Rex');
    const pos = opts.position || Navigation.randomPointInside();

    const dog = {
      id: this.nextId++,
      type: 'dog',
      alive: true,
      name,
      emoji: '🐕',
      x: pos.x, y: pos.y,
      speed: 120,
      hp: 50,
      damage: 5,
      path: [],
      thinkTimer: Phaser.Math.Between(500, 2000),
      attackCooldown: 0,
      age: opts.age || 0,
      maxAge: Phaser.Math.Between(12, 16),
      isPuppy: opts.isPuppy || false,
      parentId1: opts.parentId1 || null,
      parentId2: opts.parentId2 || null,
      pregnancyTimer: 0,
      companionOf: null,
      skills: { hunting: 0, guarding: 0 },
      generation: opts.generation || 1,
      _navPhase: null
    };

    if (dog.isPuppy) {
      dog.emoji = '🐶';
      dog.speed = 80;
      dog.hp = 20;
      dog.damage = 2;
    }

    this.entities.push(dog);
    return dog;
  }

  spawnWeapon(opts = {}) {
    const def = opts.def || ContentDB.randomWeapon();
    const pos = opts.position || Navigation.randomPointInside();

    const item = {
      id: this.nextId++,
      type: 'item',
      alive: true,
      def,
      name: def.name,
      emoji: def.emoji,
      x: pos.x, y: pos.y,
      path: [],
      _navPhase: null
    };

    this.entities.push(item);
    return item;
  }

  // ✅ NUEVO: Construir edificio automáticamente
  autoBuild(buildingId) {
    const def = ContentDB.findById(ContentDB.buildings, buildingId);
    if (!def) return null;

    for (const res in def.cost) {
      if ((this.stock[res] || 0) < def.cost[res]) return null;
    }

    for (const res in def.cost) {
      this.stock[res] -= def.cost[res];
    }

    const cx = this.mapWidth / 2;
    const cy = this.mapHeight / 2;
    const pos = this.findBuildSpot(
      cx + Phaser.Math.Between(-200, 200),
      cy + Phaser.Math.Between(-200, 200)
    );

    const npcs = this.getNpcs();
    const builder = npcs[0] || { id: 0, name: 'Pueblo' };
    const biz = Economy.createBusiness(def, builder, pos.x, pos.y);

    if (this.onBuild) this.onBuild(pos.x, pos.y, def.emoji);
    
    this.socialEvents.push({
      type: 'build',
      emoji: def.emoji,
      text: `🏗️ ${builder.name} construyó ${def.name}`,
      t: 0,
      n: { x: pos.x, y: pos.y }
    });

    return biz;
  }

  buildBusiness(buildingId, builderNpc = null) {
    return this.autoBuild(buildingId);
  }

  getById(id) { return this.entities.find(e => e.id === id) || null; }

  countType(type) {
    return this.entities.filter(e => e.type === type && e.alive).length;
  }

  setDestination(entity, x, y) {
    if (!entity) return;
    entity.path = Navigation.buildPath(entity, { x, y });
    
    // ✅ Inicializar fase de navegación si cruza la puerta
    const fromInside = Navigation.isInside(entity.x, entity.y);
    const toInside = Navigation.isInside(x, y);
    
    if (fromInside !== toInside) {
      entity._navDirection = fromInside ? 'exit' : 'enter';
      entity._navPhase = entity._navDirection === 'exit' ? 'to_gate_in' : 'to_gate_out';
      entity._navTicks = 0;
    }
  }

  revealArea(x, y, radiusTiles = 4) {
    const tx = Math.floor(x / MapGenerator.tileSize);
    const ty = Math.floor(y / MapGenerator.tileSize);
    const W = MapGenerator.width, H = MapGenerator.height;

    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        if (dx * dx + dy * dy > radiusTiles * radiusTiles) continue;
        const nx = tx + dx, ny = ty + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
          this.fog[ny * W + nx] = 1;
        }
      }
    }
  }

  tileAt(x, y) {
    const tx = Math.floor(x / MapGenerator.tileSize);
    const ty = Math.floor(y / MapGenerator.tileSize);
    const W = MapGenerator.width, H = MapGenerator.height;
    if (tx < 0 || tx >= W || ty < 0 || ty >= H) return 0;
    return this.grid[ty * W + tx];
  }

  findNearestResource(x, y, maxDist = 400) {
    let best = null, bd = maxDist;
    for (const r of this.resources) {
      if (r.amount <= 0) continue;
      const d = Phaser.Math.Distance.Between(x, y, r.x, r.y);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }

  findNearestHostile(x, y, maxDist = 300) {
    let best = null, bd = maxDist;
    for (const e of this.entities) {
      if (e.type !== 'animal' || !e.alive || !e.hostile) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  findNearestOtherNpc(npc, maxDist = 250) {
    let best = null, bd = maxDist;
    for (const e of this.entities) {
      if (e.type !== 'npc' || !e.alive || e.id === npc.id) continue;
      const d = Phaser.Math.Distance.Between(npc.x, npc.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  findNearestWeapon(x, y, maxDist = 300) {
    let best = null, bd = maxDist;
    for (const e of this.entities) {
      if (e.type !== 'item' || !e.alive) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ✅ NUEVO: Verificar si falta vivienda
  getHousingDeficit() {
    let capacity = 0;
    for (const biz of Economy.businesses) {
      const def = ContentDB.findById(ContentDB.buildings, biz.buildingId);
      if (def && def.cat === 'house') {
        capacity += def.capacity || 2;
      }
    }
    const population = this.getNpcs().length;
    return Math.max(0, population - capacity + 2); // +2 de margen
  }

  update(delta) {
    const dt = delta / 1000;
    this.time += delta;
    this.dayTimer += delta;

    if (this.dayTimer >= 60000) {
      this.dayTimer = 0;
      this.day++;
      this.onNewDay();
    }

    this.damageEvents = this.damageEvents.filter(e => { e.t += dt; return e.t < 1; });
    this.lootEvents = this.lootEvents.filter(e => { e.t += dt; return e.t < 1.5; });
    this.buildEvents = this.buildEvents.filter(e => { e.t += dt; return e.t < 2; });
    this.socialEvents = this.socialEvents.filter(e => { e.t += dt; return e.t < 4; });

    Guards.update(this, dt);
    Social.update(this, dt);
    Dogs.update(this, dt);
    Economy.update(dt, this);
    Weather.update(this, dt);
    DayNight.update(this, dt);
    Diplomacy.update(this, dt);

    for (const e of this.entities) {
      if (!e.alive) continue;
      if (e.type === 'npc' && !e.isGuard) this.updateNpc(e, dt);
      if (e.type === 'animal') this.updateAnimal(e, dt);
      if (e.type === 'dog') this.updateDog(e, dt);
      this.moveAlongPath(e, dt);
    }

    this.entities = this.entities.filter(e => e.alive);
  }

  onNewDay() {
    for (const biz of Economy.businesses) {
      Economy.paySalaries(biz, this);
      Economy.onNewDay(biz);
    }
  }

  updateNpc(npc, dt) {
    Needs.update(npc, dt);
    if (npc.attackCooldown > 0) npc.attackCooldown -= dt;

    if (!npc.weapon && (npc.profession?.id === 'hunter' || npc.profession?.id === 'guard')) {
      const w = this.findNearestWeapon(npc.x, npc.y);
      if (w) {
        this.setDestination(npc, w.x, w.y);
        npc.action = 'pickup';
        npc.actionTarget = w;
        npc.thinkTimer = 0;
      }
    }

    npc.thinkTimer -= dt;

    if (npc.path.length === 0 && npc.thinkTimer <= 0) {
      this.decideNpcAction(npc);
      npc.thinkTimer = Phaser.Math.Between(2, 5);
    }

    if (npc.path.length === 0 && npc.actionTarget) {
      this.executeNpcAction(npc, dt);
    }

    this.revealArea(npc.x, npc.y, 4);
  }

  decideNpcAction(npc) {
    // ✅ PRIORIDAD 1: Construir si falta vivienda
    const deficit = this.getHousingDeficit();
    if (deficit > 0 && Math.random() < 0.3) {
      const hutDef = ContentDB.findById(ContentDB.buildings, 'hut');
      if (hutDef) {
        let canBuild = true;
        for (const res in hutDef.cost) {
          if ((this.stock[res] || 0) < hutDef.cost[res]) {
            canBuild = false;
            break;
          }
        }
        
        if (canBuild) {
          const spot = this.findBuildSpot(
            this.mapWidth / 2 + Phaser.Math.Between(-150, 150),
            this.mapHeight / 2 + Phaser.Math.Between(-150, 150)
          );
          this.setDestination(npc, spot.x, spot.y);
          npc.action = 'build';
          npc.actionTarget = { def: hutDef, x: spot.x, y: spot.y };
          return;
        }
      }
    }

    // ✅ PRIORIDAD 2: Ir al trabajo
    if (npc.job) {
      const biz = Economy.getById(npc.job.businessId);
      if (biz) {
        this.setDestination(npc, biz.x, biz.y);
        npc.action = 'work';
        npc.actionTarget = biz;
        return;
      }
    }

    // PRIORIDAD 3: Socializar
    if (npc.social < 60 && Math.random() < 0.4) {
      const friend = this.findNearestOtherNpc(npc, 200);
      if (friend && !friend.isGuard) {
        this.setDestination(npc, friend.x, friend.y);
        npc.action = 'socialize';
        npc.actionTarget = friend;
        return;
      }
    }

    // PRIORIDAD 4: Necesidades básicas
    const basic = Needs.decideAction(npc, this);
    if (basic === 'eat') {
      const r = this.findNearestResource(npc.x, npc.y, 600);
      if (r && r.def.id === 'berry') {
        this.setDestination(npc, r.x, r.y);
        npc.action = 'eat';
        npc.actionTarget = r;
        return;
      }
    }

    // PRIORIDAD 5: Recolectar recursos
    if ((this.stock.wood || 0) < 50 && Math.random() < 0.3) {
      const tree = this.findNearestResource(npc.x, npc.y, 800);
      if (tree && tree.def.id === 'tree') {
        this.setDestination(npc, tree.x, tree.y);
        npc.action = 'gather';
        npc.actionTarget = tree;
        return;
      }
    }

    // PRIORIDAD 6: Cliente en negocio
    if ((npc.gold || 0) > 10 && Math.random() < 0.3) {
      const biz = Economy.businesses.find(b => 
        b.buildingId === 'tavern' || b.buildingId === 'market'
      );
      if (biz) {
        this.setDestination(npc, biz.x, biz.y);
        npc.action = 'shop';
        npc.actionTarget = biz;
        return;
      }
    }

    // PRIORIDAD 7: Wander
    const target = Math.random() < 0.5
      ? Navigation.randomPointInside()
      : Navigation.randomPointOutside();
    this.setDestination(npc, target.x, target.y);
    npc.action = 'wander';
  }

  executeNpcAction(npc, dt) {
    const target = npc.actionTarget;
    if (!target) return;

    const dist = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);

    switch (npc.action) {
      case 'build':
        if (dist < 40 && target.def) {
          // Construir el edificio
          const built = this.autoBuild(target.def.id);
          if (built) {
            npc.skills.building += 2;
            npc.experience += 10;
          }
          npc.actionTarget = null;
          npc.action = 'idle';
        }
        break;

      case 'work':
        if (dist < 50) {
          npc.mood = Math.min(100, npc.mood + 5 * dt);
          npc.social = Math.min(100, npc.social + 3 * dt);
          npc.energy = Math.max(0, npc.energy - 2 * dt);
          npc.experience += 0.5 * dt;
          if (npc.experience >= npc.level * 100) {
            npc.level++;
            npc.experience = 0;
            this.onLevelUp(npc);
          }
        }
        break;

      case 'socialize':
        if (dist < 40 && target.alive && target.type === 'npc') {
          Social.interact(npc, target, this);
          npc.skills.social += 0.1 * dt;
          npc.actionTarget = null;
          npc.action = 'idle';
        }
        break;

      case 'shop':
        if (dist < 40) {
          Economy.customerVisit(target, npc);
          npc.actionTarget = null;
          npc.action = 'idle';
        }
        break;

      case 'eat':
        if (dist < 30 && target.amount > 0) {
          target.amount -= 1;
          Needs.eat(npc, 20);
          if (target.amount <= 0) npc.actionTarget = null;
        }
        break;

      case 'gather':
        if (dist < 30 && target.amount > 0) {
          const yieldData = target.def.yield;
          const bonuses = npc.profession?.bonuses || {};
          for (const key in yieldData) {
            let amt = yieldData[key];
            if (bonuses['gather_' + key]) amt *= bonuses['gather_' + key];
            this.addStock(key, amt);
          }
          target.amount -= 1;
          npc.skills.gathering += 0.2;
          npc.experience += 2;
          if (target.amount <= 0) npc.actionTarget = null;
        }
        break;

      case 'hunt':
        if (target.alive && dist < Combat.getRange(npc) && npc.attackCooldown <= 0) {
          Combat.attack(npc, target, this);
          npc.attackCooldown = 1.0;
          npc.skills.hunting += 0.3;
          npc.skills.combat += 0.2;
          npc.experience += 5;
          if (!target.alive) npc.actionTarget = null;
        } else if (target.alive) {
          this.setDestination(npc, target.x, target.y);
        } else {
          npc.actionTarget = null;
        }
        break;

      case 'pickup':
        if (dist < 25 && target.alive) {
          npc.weapon = target.def;
          target.alive = false;
          npc.actionTarget = null;
        }
        break;
    }
  }

  onLevelUp(npc) {
    npc.speed += 5;
    npc.hp = Math.min(150, npc.hp + 10);
    this.socialEvents.push({
      type: 'levelup',
      emoji: '⬆️',
      text: `⬆️ ${npc.name} subió a nivel ${npc.level}`,
      t: 0,
      n: { x: npc.x, y: npc.y }
    });
  }

  updateDog(dog, dt) {
    if (dog.attackCooldown > 0) dog.attackCooldown -= dt;

    dog.age += dt * 0.01;
    if (dog.age >= dog.maxAge) {
      dog.alive = false;
      return;
    }

    if (dog.isPuppy && dog.age >= 1) {
      dog.isPuppy = false;
      dog.emoji = '🐕';
      dog.speed = 120;
      dog.hp = 50;
      dog.damage = 5;
    }

    dog.thinkTimer -= dt;

    if (dog.companionOf) {
      const companion = this.getById(dog.companionOf);
      if (companion && companion.alive) {
        const dist = Phaser.Math.Distance.Between(dog.x, dog.y, companion.x, companion.y);
        if (dist > 60) {
          this.setDestination(dog, companion.x, companion.y);
          return;
        }
      } else {
        dog.companionOf = null;
      }
    }

    const threat = this.findNearestHostile(dog.x, dog.y, 200);
    if (threat && Navigation.isInside(dog.x, dog.y)) {
      const dist = Phaser.Math.Distance.Between(dog.x, dog.y, threat.x, threat.y);
      if (dist < 30 && dog.attackCooldown <= 0) {
        threat.hp -= dog.damage;
        dog.attackCooldown = 1.5;
        dog.skills.guarding += 0.2;
        if (threat.hp <= 0) {
          threat.alive = false;
        }
      } else {
        this.setDestination(dog, threat.x, threat.y);
        return;
      }
    }

    if (dog.path.length === 0 && dog.thinkTimer <= 0) {
      const target = Navigation.randomPointInside();
      this.setDestination(dog, target.x, target.y);
      dog.thinkTimer = Phaser.Math.Between(3, 7);
    }
  }

  updateAnimal(animal, dt) {
    if (animal.attackCooldown > 0) animal.attackCooldown -= dt;
    animal.thinkTimer -= dt;

    if (Navigation.isInside(animal.x, animal.y)) {
      const outside = Navigation.randomPointOutside();
      this.setDestination(animal, outside.x, outside.y);
      return;
    }

    if (animal.hostile && animal.alive) {
      const prey = this.findNearestNpcForAnimal(animal, 200);
      if (prey && !prey.isGuard) {
        const dist = Phaser.Math.Distance.Between(animal.x, animal.y, prey.x, prey.y);
        if (dist < 25 && animal.attackCooldown <= 0) {
          prey.hp -= animal.damage;
          animal.attackCooldown = 1.5;
          if (prey.hp <= 0) {
            prey.alive = false;
            prey.deathCause = animal.name;
          }
        } else {
          this.setDestination(animal, prey.x, prey.y);
          return;
        }
      }
    }

    if (animal.path.length === 0 && animal.thinkTimer <= 0) {
      const target = Navigation.randomPointOutside();
      this.setDestination(animal, target.x, target.y);
      animal.thinkTimer = Phaser.Math.Between(3, 7);
    }
  }

  findNearestNpcForAnimal(animal, maxDist) {
    let best = null, bd = maxDist;
    for (const e of this.entities) {
      if (e.type !== 'npc' || !e.alive || e.isGuard) continue;
      const d = Phaser.Math.Distance.Between(animal.x, animal.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  moveAlongPath(entity, dt) {
    if (!entity.path || entity.path.length === 0) return;

    if (entity.type === 'animal') {
      const target = entity.path[entity.path.length - 1];
      if (Navigation.isInside(target.x, target.y)) {
        entity.path = [];
        const outside = Navigation.randomPointOutside();
        this.setDestination(entity, outside.x, outside.y);
        return;
      }
    }

    const target = entity.path[0];
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);
    const step = (entity.speed || 80) * dt;

    let newX, newY;
    if (dist <= step) {
      newX = target.x;
      newY = target.y;
      entity.path.shift();
      
      // ✅ Avanzar fase de navegación
      if (entity._navPhase && target.phase) {
        if (target.phase === 'direct') {
          entity._navPhase = null;
          entity._navDirection = null;
          entity._navTicks = 0;
        }
      }
    } else {
      newX = entity.x + (dx / dist) * step;
      newY = entity.y + (dy / dist) * step;
    }

    const resolved = Walls.resolveCollision(entity, entity.x, entity.y, newX, newY);
    entity.x = resolved.x;
    entity.y = resolved.y;

    if (resolved.x === entity.x && resolved.y === entity.y && dist > step) {
      entity.path = Navigation.buildPath(entity, target);
    }
  }
}
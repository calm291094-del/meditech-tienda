// ============================================================
// SIM.JS - NÚCLEO COMPLETO (Fase 7 - Con arrays legacy)
// ============================================================
class Sim {
  constructor() {
    this.time = 0;
    this.day = 1;
    this.dayTimer = 0;
    this.timeOfDay = 0.3;
    this.currentSeason = 0;
    this.seasonTimer = 0;

    this.stock = {
      food: 200, wood: 150, stone: 100, ore: 50,
      gold: 100, faith: 50, knowledge: 50
    };

    this.mapSeed = Date.now();
    this.grid = MapGenerator.generate(this.mapSeed);
    this.mapWidth = MapGenerator.width * MapGenerator.tileSize;
    this.mapHeight = MapGenerator.height * MapGenerator.tileSize;

    Navigation.worldWidth = this.mapWidth;
    Navigation.worldHeight = this.mapHeight;
    Navigation.center = { x: this.mapWidth / 2, y: this.mapHeight / 2 };

    this.entities = [];
    this.resources = [];
    this.buildings = [];
    this.nextId = 1;
    this.selectedId = null;

    this.fog = new Uint8Array(MapGenerator.width * MapGenerator.height);

    // ✅ ARRAYS LEGACY (necesarios para WorldScene)
    this.damageEvents = [];
    this.lootEvents = [];
    this.buildEvents = [];
    this.socialEvents = [];

    // Callbacks de eventos visuales
    this.onDamage = (x, y, dmg) => this.damageEvents.push({ x, y, dmg, t: 0 });
    this.onLoot = (x, y, loot) => this.lootEvents.push({ x, y, loot, t: 0 });
    this.onBuild = (x, y, emoji) => this.buildEvents.push({ x, y, emoji, t: 0 });
    this.onLevelUp = (npc) => this.socialEvents.push({
      type: 'levelup', emoji: '⬆️', text: `⬆️ ${npc.name} Nv ${npc.level}`,
      t: 0, n: { x: npc.x, y: npc.y }
    });
    this.onBirth = (m, b) => this.socialEvents.push({
      type: 'birth', emoji: '👶', text: `👶 ${b.name} nació`,
      t: 0, n: { x: b.x, y: b.y }
    });
    this.onDeath = (npc, cause) => this.socialEvents.push({
      type: 'death', emoji: '💀', text: `💀 ${npc.name} murió`,
      t: 0, n: { x: npc.x, y: npc.y }
    });
    this.onMarriage = (n1, n2) => this.socialEvents.push({
      type: 'marriage', emoji: '💍', text: `💍 ${n1.name} + ${n2.name}`,
      t: 0, n: { x: n1.x, y: n1.y }
    });

    // ===== FASE 7: CLIMA Y DÍA/NOCHE =====
    this.weather = 'sunny';
    this.weatherTimer = 0;
    this.weatherParticles = [];
    this.moonPhase = 0;
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.mapWidth,
        y: Math.random() * this.mapHeight,
        brightness: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2
      });
    }

    // ===== ESTADÍSTICAS =====
    this.stats = {
      animalsKilled: 0, dungeonsCleared: 0, buildingsBuilt: 0,
      births: 0, deaths: 0, marriages: 0, daysSurvived: 0
    };

    // ===== MAZMORRA =====
    this.dungeon = {
      maxFloor: 1,
      pressure: 0,
      expeditions: [],
      log: [],
      x: this.mapWidth / 2,
      y: this.mapHeight / 2
    };

    // ===== RIVALES =====
    this.rivals = [];
    this.relations = {};
    this.warParties = []; // Para asedios visuales

    // ===== LOGROS =====
    this.achievements = {};
    this.logs = [];

    this.spawnInitial();
    this.initRivals();
    this.initDungeon();
    this.log('🌍 El mundo ha despertado');
  }

  // ==========================================================
  // GETTERS
  // ==========================================================
  getNpcs()    { return this.entities.filter(e => e.type === 'npc' && e.alive); }
  getAnimals() { return this.entities.filter(e => e.type === 'animal' && e.alive); }
  getDogs()    { return this.entities.filter(e => e.type === 'dog' && e.alive); }
  getItems()   { return this.entities.filter(e => e.type === 'item' && e.alive); }
  getById(id)  { return this.entities.find(e => e.id === id) || null; }
  countType(t) { return this.entities.filter(e => e.type === t && e.alive).length; }

  // ==========================================================
  // LOGS
  // ==========================================================
  log(msg) {
    this.logs.unshift({ msg, day: this.day, time: Date.now() });
    if (this.logs.length > 100) this.logs.pop();
    console.log(`[Día ${this.day}] ${msg}`);
  }

  addStock(key, amount) {
    this.stock[key] = (this.stock[key] || 0) + amount;
    if (this.stock[key] < 0) this.stock[key] = 0;
  }

  canAfford(cost) {
    for (const res in cost) if ((this.stock[res] || 0) < cost[res]) return false;
    return true;
  }

  payCost(cost) {
    for (const res in cost) this.stock[res] -= cost[res];
  }

  // ==========================================================
  // SPAWN INICIAL
  // ==========================================================
  spawnInitial() {
    const professions = ['farmer', 'hunter', 'miner', 'guard', 'merchant', 'mage', 'healer', 'builder', 'adventurer'];
    for (let i = 0; i < 15; i++) {
      this.spawnNpc({
        profession: professions[i % professions.length],
        isAdventurer: i >= 12
      });
    }
    for (let i = 0; i < 3; i++) this.spawnDog();
    for (let i = 0; i < 15; i++) this.spawnAnimal();
    this.resources = MapGenerator.spawnResources(this.grid);
    this.spawnInitialBuildings();
    this.revealArea(this.mapWidth / 2, this.mapHeight / 2, 10);
  }

  spawnInitialBuildings() {
    const cx = this.mapWidth / 2, cy = this.mapHeight / 2;
    const houseDef = ContentDB.findById(ContentDB.buildings, 'wood_house');
    if (houseDef) {
      const pos = this.findBuildSpot(cx, cy, 100);
      if (pos) this.buildBuilding(houseDef, pos.x, pos.y, true);
    }
    const farmDef = ContentDB.findById(ContentDB.buildings, 'farm');
    if (farmDef) {
      const pos = this.findBuildSpot(cx - 100, cy, 80);
      if (pos) this.buildBuilding(farmDef, pos.x, pos.y, true);
    }
    const smithDef = ContentDB.findById(ContentDB.buildings, 'smith');
    if (smithDef) {
      const pos = this.findBuildSpot(cx + 100, cy, 80);
      if (pos) this.buildBuilding(smithDef, pos.x, pos.y, true);
    }
  }

  // ==========================================================
  // SPAWN DE ENTIDADES
  // ==========================================================
  spawnNpc(opts = {}) {
    const race = opts.race || ContentDB.randomRace();
    const professionId = opts.profession || ContentDB.randomProfession().id;
    const profession = ContentDB.findById(ContentDB.professions, professionId);
    const name = opts.name || ContentDB.randomName();
    const pos = opts.position || Navigation.randomPointInside();

    const npc = {
      id: this.nextId++, type: 'npc', alive: true,
      name, race, profession,
      x: pos.x, y: pos.y,
      speed: 90 * (race.speedMult || 1),
      hp: 100, maxHp: 100, hunger: 100, energy: 100, social: 100, mood: 100,
      age: opts.age || Phaser.Math.Between(18, 45),
      gender: Math.random() < 0.5 ? 'M' : 'F',
      skills: { hunting: 0, gathering: 0, combat: 0, social: 0, crafting: 0, farming: 0, mining: 0 },
      experience: 0, level: 1, skillPoints: 0,
      state: 'idle', actionTarget: null, thinkTimer: Phaser.Math.Between(1, 5),
      attackCooldown: 0, path: [],
      spouseId: null, parentId1: null, parentId2: null, childrenIds: [],
      friends: [], pregnancyTimer: 0, isPregnant: false,
      job: null, isAdventurer: opts.isAdventurer || false,
      isGuard: professionId === 'guard',
      weapon: null, inventory: [], gold: Phaser.Math.Between(5, 20),
      traits: opts.traits || [ContentDB.randomTrait()?.id, ContentDB.randomTrait()?.id].filter(Boolean),
      dungeonDepth: 0, inDungeon: false,
      _navPhase: null, _navDirection: null, _navTicks: 0
    };

    if (npc.isGuard || npc.isAdventurer) {
      npc.weapon = ContentDB.findById(ContentDB.weapons, 'sword');
      npc.skills.combat = 10;
    }

    if (profession && profession.bonuses) {
      for (const skill in profession.bonuses) {
        if (npc.skills.hasOwnProperty(skill)) {
          npc.skills[skill] = Math.floor(profession.bonuses[skill] * 5);
        }
      }
    }

    this.entities.push(npc);
    return npc;
  }

  spawnAnimal(opts = {}) {
    const def = opts.def || ContentDB.randomAnimal();
    const pos = opts.position || Navigation.randomPointOutside();
    const animal = {
      id: this.nextId++, type: 'animal', alive: true,
      def, name: def.name, emoji: def.emoji,
      x: pos.x, y: pos.y, speed: def.speed || 60,
      hostile: !!def.hostile, hp: def.hp || 20, maxHp: def.hp || 20,
      damage: def.damage || 3, path: [], state: 'wander',
      thinkTimer: Phaser.Math.Between(2, 6), attackCooldown: 0,
      target: null, _navPhase: null
    };
    this.entities.push(animal);
    return animal;
  }

  spawnDog(opts = {}) {
    const name = opts.name || (ContentDB.randomDogName ? ContentDB.randomDogName() : 'Rex');
    const pos = opts.position || Navigation.randomPointInside();
    const dog = {
      id: this.nextId++, type: 'dog', alive: true,
      name, emoji: opts.isPuppy ? '🐶' : '🐕',
      x: pos.x, y: pos.y, speed: opts.isPuppy ? 80 : 120,
      hp: opts.isPuppy ? 20 : 50, maxHp: opts.isPuppy ? 20 : 50,
      damage: opts.isPuppy ? 2 : 5, path: [], state: 'patrol',
      thinkTimer: Phaser.Math.Between(2, 5), attackCooldown: 0,
      age: opts.isPuppy ? 0 : Phaser.Math.Between(2, 6),
      maxAge: Phaser.Math.Between(12, 16),
      isPuppy: opts.isPuppy || false,
      companionOf: null, isPregnant: false, pregnancyTimer: 0,
      skills: { hunting: 0, guarding: 0 }, _navPhase: null
    };
    this.entities.push(dog);
    return dog;
  }

  spawnWeapon(opts = {}) {
    const def = opts.def || ContentDB.randomWeapon();
    const pos = opts.position || Navigation.randomPointInside();
    const item = {
      id: this.nextId++, type: 'item', alive: true,
      def, name: def.name, emoji: def.emoji,
      x: pos.x, y: pos.y, path: [], _navPhase: null
    };
    this.entities.push(item);
    return item;
  }

  // ==========================================================
  // CONSTRUIR
  // ==========================================================
  findBuildSpot(x, y, radius = 100) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const tx = x + Phaser.Math.Between(-radius, radius);
      const ty = y + Phaser.Math.Between(-radius, radius);
      if (!Navigation.isInside(tx, ty)) continue;
      let clash = false;
      for (const b of this.buildings) {
        if (Phaser.Math.Distance.Between(tx, ty, b.x, b.y) < 50) {
          clash = true; break;
        }
      }
      if (!clash) return { x: tx, y: ty };
    }
    return { x, y };
  }

  buildBuilding(def, x, y, free = false) {
    if (!free) {
      const cost = { wood: def.cw || 0, stone: def.cs || 0 };
      if (!this.canAfford(cost)) return null;
      this.payCost(cost);
    }
    const building = {
      id: this.nextId++, type: 'building', def,
      name: def.name, emoji: def.e || def.emoji,
      x, y, growth: 0, occIds: [], alive: true
    };
    this.buildings.push(building);
    this.stats.buildingsBuilt++;
    if (this.onBuild) this.onBuild(x, y, def.e || def.emoji);
    this.log(`🏗️ Se construyó: ${def.name}`);
    this.checkAchievements();
    return building;
  }

  tileAt(x, y) {
    const tx = Math.floor(x / MapGenerator.tileSize);
    const ty = Math.floor(y / MapGenerator.tileSize);
    const W = MapGenerator.width, H = MapGenerator.height;
    if (tx < 0 || tx >= W || ty < 0 || ty >= H) return 0;
    return this.grid[ty * W + tx];
  }

  revealArea(x, y, radiusTiles = 4) {
    const tx = Math.floor(x / MapGenerator.tileSize);
    const ty = Math.floor(y / MapGenerator.tileSize);
    const W = MapGenerator.width, H = MapGenerator.height;
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        if (dx * dx + dy * dy > radiusTiles * radiusTiles) continue;
        const nx = tx + dx, ny = ty + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) this.fog[ny * W + nx] = 1;
      }
    }
  }

  // ==========================================================
  // BÚSQUEDAS
  // ==========================================================
  findNearestResource(x, y, type, maxDist = 400) {
    let best = null, bd = maxDist;
    for (const r of this.resources) {
      if (r.amount <= 0) continue;
      if (type && r.type !== type) continue;
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

  findNearestNpcForAnimal(animal, maxDist = 200) {
    let best = null, bd = maxDist;
    for (const e of this.entities) {
      if (e.type !== 'npc' || !e.alive || e.isGuard) continue;
      const d = Phaser.Math.Distance.Between(animal.x, animal.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ==========================================================
  // MOVIMIENTO
  // ==========================================================
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
      newX = target.x; newY = target.y;
      entity.path.shift();
    } else {
      newX = entity.x + (dx / dist) * step;
      newY = entity.y + (dy / dist) * step;
    }
    const resolved = Walls.resolveCollision(entity, entity.x, entity.y, newX, newY);
    entity.x = resolved.x;
    entity.y = resolved.y;
  }

  setDestination(entity, x, y) {
    if (!entity) return;
    entity.path = Navigation.buildPath(entity, { x, y });
  }

  // ==========================================================
  // UPDATE PRINCIPAL
  // ==========================================================
  update(delta) {
    const dt = delta / 1000;
    this.time += delta;
    this.dayTimer += delta;

    if (this.dayTimer >= 60000) {
      this.dayTimer = 0;
      this.day++;
      this.stats.daysSurvived++;
      this.moonPhase = (this.moonPhase + 1) % 8;
      this.onNewDay();
    }

    // Hora del día: 0 = medianoche, 0.25 = amanecer, 0.5 = mediodía, 0.75 = atardecer
    this.timeOfDay = (this.time % 60000) / 60000;

    // Actualizar clima
    this.updateWeather(dt);

    // Limpiar eventos
    this.damageEvents = this.damageEvents.filter(e => { e.t += dt; return e.t < 1; });
    this.lootEvents = this.lootEvents.filter(e => { e.t += dt; return e.t < 1.5; });
    this.buildEvents = this.buildEvents.filter(e => { e.t += dt; return e.t < 2; });
    this.socialEvents = this.socialEvents.filter(e => { e.t += dt; return e.t < 4; });

    // Eventos aleatorios
    this.eventTimer += dt;
    if (this.eventTimer >= 60) {
      this.eventTimer = 0;
      this.triggerRandomEvent();
    }

    // Actualizar entidades
    for (const e of this.entities) {
      if (!e.alive) continue;
      if (e.type === 'npc' && !e.isGuard) this.updateNpc(e, dt);
      if (e.type === 'animal') this.updateAnimal(e, dt);
      if (e.type === 'dog') this.updateDog(e, dt);
      this.moveAlongPath(e, dt);
    }

    // Actualizar mazmorra
    this.updateDungeon(dt);

    // Actualizar asedios
    this.updateWarParties(dt);

    this.entities = this.entities.filter(e => e.alive);
  }

  // ==========================================================
  // FASE 7: CLIMA
  // ==========================================================
  updateWeather(dt) {
    this.weatherTimer += dt;
    if (this.weatherTimer >= 45) { // Cambio cada 45 segundos
      this.weatherTimer = 0;
      const weathers = ['sunny', 'sunny', 'sunny', 'cloudy', 'rain', 'storm'];
      // En invierno más nieve
      if (this.currentSeason === 3) weathers.push('snow', 'snow');
      this.weather = Phaser.Utils.Array.GetRandom(weathers);
      this.log(`🌦️ Clima: ${this.getWeatherName()}`);
    }

    // Generar partículas según clima
    this.weatherParticles = this.weatherParticles.filter(p => {
      p.y += p.speed * dt;
      p.x += p.wind * dt;
      p.life -= dt;
      return p.life > 0 && p.y < this.mapHeight;
    });

    const intensity = this.getWeatherIntensity();
    if (this.weather === 'rain' || this.weather === 'storm') {
      for (let i = 0; i < intensity * 10; i++) {
        this.weatherParticles.push({
          x: Phaser.Math.Between(0, this.mapWidth),
          y: 0,
          speed: 400 + (this.weather === 'storm' ? 200 : 0),
          wind: this.weather === 'storm' ? Phaser.Math.Between(-100, 100) : -30,
          life: 3,
          type: 'rain'
        });
      }
    } else if (this.weather === 'snow') {
      for (let i = 0; i < intensity * 5; i++) {
        this.weatherParticles.push({
          x: Phaser.Math.Between(0, this.mapWidth),
          y: 0,
          speed: 80,
          wind: Phaser.Math.Between(-40, 40),
          life: 10,
          type: 'snow',
          sway: Math.random() * Math.PI * 2
        });
      }
    }
  }

  getWeatherName() {
    const names = {
      sunny: '☀️ Soleado',
      cloudy: '☁️ Nublado',
      rain: '🌧️ Lluvia',
      storm: '⛈️ Tormenta',
      snow: '❄️ Nieve'
    };
    return names[this.weather] || this.weather;
  }

  getWeatherIntensity() {
    const seasonMult = [1.0, 1.2, 0.8, 1.5][this.currentSeason] || 1;
    return seasonMult;
  }

  isNight() {
    return this.timeOfDay < 0.25 || this.timeOfDay > 0.75;
  }

  getDaylightIntensity() {
    // Curva sinusoidal: máximo al mediodía (0.5)
    const t = this.timeOfDay;
    if (t < 0.25) return t / 0.25; // Amaneciendo
    if (t < 0.5) return 1;          // Día
    if (t < 0.75) return 1 - (t - 0.5) / 0.25; // Atardeciendo
    return 0; // Noche
  }

  getSkyColor() {
    const t = this.timeOfDay;
    if (t < 0.2) return { r: 10, g: 20, b: 40 }; // Noche profunda
    if (t < 0.3) { // Amanecer
      const p = (t - 0.2) / 0.1;
      return { r: 10 + p * 200, g: 20 + p * 100, b: 40 + p * 60 };
    }
    if (t < 0.7) return { r: 135, g: 206, b: 235 }; // Día
    if (t < 0.8) { // Atardecer
      const p = (t - 0.7) / 0.1;
      return { r: 255 - p * 100, g: 140 - p * 80, b: 50 + p * 50 };
    }
    return { r: 10, g: 20, b: 40 }; // Noche
  }

  // ==========================================================
  // UPDATE DE NPC
  // ==========================================================
  updateNpc(npc, dt) {
    npc.age += dt * 0.01;
    if (npc.age >= 80) { this.killNpc(npc, 'old_age'); return; }

    npc.hunger -= dt * 0.5;
    if (npc.hunger <= 0) {
      npc.hp -= dt * 2;
      if (npc.hp <= 0) { this.killNpc(npc, 'hunger'); return; }
    }

    if (npc.state !== 'sleep') npc.energy -= dt * 0.3;
    if (npc.energy <= 0) { npc.state = 'sleep'; npc.thinkTimer = 10; }

    npc.social -= dt * 0.1;
    if (npc.social <= 0) npc.social = 0;

    const avgNeeds = (npc.hunger + npc.energy + npc.social) / 3;
    npc.mood = Phaser.Math.Clamp(avgNeeds, 0, 100);

    if (npc.attackCooldown > 0) npc.attackCooldown -= dt;

    if (npc.isPregnant) {
      npc.pregnancyTimer -= dt;
      if (npc.pregnancyTimer <= 0) this.giveBirth(npc);
    }

    npc.thinkTimer -= dt;
    if (npc.thinkTimer <= 0) {
      this.decideNpcAction(npc);
      npc.thinkTimer = Phaser.Math.Between(2, 6);
    }

    this.executeNpcAction(npc, dt);
    this.revealArea(npc.x, npc.y, 3);
  }

  decideNpcAction(npc) {
    if (npc.hunger < 30) {
      const food = this.findNearestResource(npc.x, npc.y, 'berry', 300);
      if (food) {
        npc.state = 'eat'; npc.actionTarget = food;
        this.setDestination(npc, food.x, food.y); return;
      }
    }

    if (npc.energy < 20) { npc.state = 'sleep'; npc.thinkTimer = 15; return; }

    if ((npc.isGuard || npc.isAdventurer) && npc.weapon) {
      const threat = this.findNearestHostile(npc.x, npc.y, 250);
      if (threat) {
        npc.state = 'hunt'; npc.actionTarget = threat;
        this.setDestination(npc, threat.x, threat.y); return;
      }
    }

    // Construir si falta vivienda
    const housingCap = this.buildings.filter(b => b.def.cap > 0)
      .reduce((s, b) => s + b.def.cap, 0);
    if (housingCap < this.getNpcs().length + 2) {
      const hutDef = ContentDB.findById(ContentDB.buildings, 'hut') ||
                     ContentDB.findById(ContentDB.buildings, 'wood_house');
      if (hutDef && this.canAfford({ wood: hutDef.cw || 0, stone: hutDef.cs || 0 })) {
        const spot = this.findBuildSpot(this.mapWidth / 2, this.mapHeight / 2, 150);
        if (spot) {
          npc.state = 'build'; npc.actionTarget = { def: hutDef, x: spot.x, y: spot.y };
          this.setDestination(npc, spot.x, spot.y); return;
        }
      }
    }

    // Socializar
    if (npc.social < 40) {
      const friend = this.findNearestOtherNpc(npc, 200);
      if (friend) {
        npc.state = 'socialize'; npc.actionTarget = friend;
        this.setDestination(npc, friend.x, friend.y); return;
      }
    }

    // Recolectar
    if (this.stock.wood < 80) {
      const w = this.findNearestResource(npc.x, npc.y, 'tree', 500);
      if (w) {
        npc.state = 'gather'; npc.actionTarget = w;
        this.setDestination(npc, w.x, w.y); return;
      }
    }

    // Vagar
    npc.state = 'wander';
    const target = Navigation.randomPointInside();
    this.setDestination(npc, target.x, target.y);
  }

  executeNpcAction(npc, dt) {
    const target = npc.actionTarget;
    if (!target) return;
    const dist = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);

    switch (npc.state) {
      case 'eat':
        if (dist < 30 && target.amount > 0) {
          target.amount -= 1;
          npc.hunger = Math.min(100, npc.hunger + 30);
          if (target.amount <= 0) { npc.state = 'idle'; npc.actionTarget = null; }
        }
        break;

      case 'sleep':
        npc.energy = Math.min(100, npc.energy + dt * 5);
        if (npc.energy >= 95) { npc.state = 'idle'; npc.thinkTimer = 1; }
        break;

      case 'hunt':
        if (!target.alive) { npc.state = 'idle'; npc.actionTarget = null; return; }
        if (dist < 30 && npc.attackCooldown <= 0 && npc.weapon) {
          const dmg = (npc.weapon.damage || 5) * (1 + npc.skills.combat / 50);
          target.hp -= dmg;
          npc.attackCooldown = 1;
          npc.skills.combat += 0.5;
          npc.experience += 2;
          if (this.onDamage) this.onDamage(target.x, target.y, Math.floor(dmg));
          if (target.hp <= 0) {
            target.alive = false;
            this.stats.animalsKilled++;
            if (target.def?.loot) {
              for (const res in target.def.loot) this.addStock(res, target.def.loot[res]);
              if (this.onLoot) this.onLoot(target.x, target.y, target.def.loot);
            }
            this.log(`⚔️ ${npc.name} derrotó a ${target.name}`);
            npc.state = 'idle'; npc.actionTarget = null;
          }
        } else if (target.alive) {
          this.setDestination(npc, target.x, target.y);
        }
        break;

      case 'gather':
        if (dist < 30 && target.amount > 0) {
          const yieldData = target.def?.yield || {};
          for (const key in yieldData) {
            let amt = yieldData[key];
            amt *= (1 + (npc.skills.gathering || 0) / 50);
            this.addStock(key, Math.floor(amt));
          }
          target.amount -= 1;
          npc.skills.gathering += 0.3;
          npc.experience += 1;
          if (target.amount <= 0) { npc.state = 'idle'; npc.actionTarget = null; }
        }
        break;

      case 'socialize':
        if (dist < 40 && target.alive) {
          npc.social = Math.min(100, npc.social + dt * 10);
          target.social = Math.min(100, target.social + dt * 10);
          npc.skills.social += 0.2;
          npc.experience += 0.5;

          // Posibilidad de matrimonio
          if (!npc.spouseId && !target.spouseId && npc.gender !== target.gender &&
              npc.age >= 18 && npc.age < 50 && target.age >= 18 && target.age < 50 &&
              Math.random() < 0.005) {
            npc.spouseId = target.id;
            target.spouseId = npc.id;
            this.stats.marriages++;
            if (this.onMarriage) this.onMarriage(npc, target);
          }
        }
        break;

      case 'build':
        if (dist < 30 && target.def) {
          const built = this.buildBuilding(target.def, target.x, target.y);
          if (built) {
            npc.skills.crafting += 1;
            npc.experience += 5;
          }
          npc.state = 'idle'; npc.actionTarget = null;
        }
        break;

      case 'wander':
        if (dist < 20) npc.state = 'idle';
        break;
    }

    this.checkLevelUp(npc);
  }

  checkLevelUp(npc) {
    const xpNeeded = npc.level * 20;
    if (npc.experience >= xpNeeded) {
      npc.experience -= xpNeeded;
      npc.level++;
      npc.skillPoints += 1;
      npc.maxHp += 5;
      npc.hp = npc.maxHp;
      this.log(`⬆️ ${npc.name} subió a nivel ${npc.level}`);
      if (this.onLevelUp) this.onLevelUp(npc);
    }
  }

  killNpc(npc, cause) {
    if (!npc.alive) return;
    npc.alive = false;
    this.stats.deaths++;
    this.log(`💀 ${npc.name} murió (${cause})`);
    if (this.onDeath) this.onDeath(npc, cause);
    if (npc.spouseId) {
      const spouse = this.getById(npc.spouseId);
      if (spouse) spouse.spouseId = null;
    }
    this.checkAchievements();
  }

  // ==========================================================
  // UPDATE DE PERROS
  // ==========================================================
  updateDog(dog, dt) {
    dog.age += dt * 0.01;
    if (dog.age >= dog.maxAge) {
      dog.alive = false;
      this.log(`💀 ${dog.name} murió de viejo`);
      return;
    }
    if (dog.isPuppy && dog.age >= 1) {
      dog.isPuppy = false;
      dog.emoji = '🐕';
      dog.speed = 120;
      dog.hp = 50;
      dog.maxHp = 50;
      dog.damage = 5;
    }
    if (dog.attackCooldown > 0) dog.attackCooldown -= dt;

    dog.thinkTimer -= dt;
    if (dog.thinkTimer <= 0) {
      const threat = this.findNearestHostile(dog.x, dog.y, 200);
      if (threat && Navigation.isInside(dog.x, dog.y)) {
        dog.state = 'attack'; dog.actionTarget = threat;
        this.setDestination(dog, threat.x, threat.y);
      } else {
        dog.state = 'patrol';
        const target = Navigation.randomPointInside();
        this.setDestination(dog, target.x, target.y);
      }
      dog.thinkTimer = Phaser.Math.Between(2, 5);
    }
  }

  // ==========================================================
  // UPDATE DE ANIMALES
  // ==========================================================
  updateAnimal(animal, dt) {
    if (animal.attackCooldown > 0) animal.attackCooldown -= dt;
    animal.thinkTimer -= dt;

    if (Navigation.isInside(animal.x, animal.y)) {
      const outside = Navigation.randomPointOutside();
      this.setDestination(animal, outside.x, outside.y);
      return;
    }

    if (animal.hostile && animal.thinkTimer <= 0) {
      const prey = this.findNearestNpcForAnimal(animal, 200);
      if (prey && !prey.isGuard) {
        animal.state = 'hunt'; animal.actionTarget = prey;
        this.setDestination(animal, prey.x, prey.y);
      } else {
        const target = Navigation.randomPointOutside();
        this.setDestination(animal, target.x, target.y);
      }
      animal.thinkTimer = Phaser.Math.Between(3, 7);
    }

    if (animal.state === 'hunt' && animal.actionTarget) {
      const target = animal.actionTarget;
      if (!target.alive) { animal.state = 'wander'; animal.actionTarget = null; return; }
      const dist = Phaser.Math.Distance.Between(animal.x, animal.y, target.x, target.y);
      if (dist < 25 && animal.attackCooldown <= 0) {
        target.hp -= animal.damage;
        animal.attackCooldown = 1.5;
        if (this.onDamage) this.onDamage(target.x, target.y, animal.damage);
        if (target.hp <= 0) this.killNpc(target, 'animal');
      }
    }
  }

  // ==========================================================
  // REPRODUCCIÓN
  // ==========================================================
  giveBirth(mother) {
    mother.isPregnant = false;
    mother.pregnancyTimer = 0;
    if (this.getNpcs().length >= 100) return;

    const baby = this.spawnNpc({
      age: 0,
      position: {
        x: mother.x + Phaser.Math.Between(-20, 20),
        y: mother.y + Phaser.Math.Between(-20, 20)
      }
    });
    baby.parentId1 = mother.id;
    baby.parentId2 = mother.spouseId;
    mother.childrenIds.push(baby.id);
    if (mother.spouseId) {
      const father = this.getById(mother.spouseId);
      if (father) {
        if (!father.childrenIds) father.childrenIds = [];
        father.childrenIds.push(baby.id);
      }
    }
    this.stats.births++;
    this.log(`👶 ${baby.name} nació de ${mother.name}`);
    if (this.onBirth) this.onBirth(mother, baby);
    this.checkAchievements();
  }

  // ==========================================================
  // MAZMORRA
  // ==========================================================
  initDungeon() {
    this.dungeon = {
      maxFloor: 1, pressure: 0, expeditions: [], log: [],
      x: this.mapWidth / 2, y: this.mapHeight / 2
    };
  }

  updateDungeon(dt) {
    if (!this.dungeon) return;
    this.dungeon.pressure += dt * 0.1;
    if (this.dungeon.pressure >= 100) {
      this.dungeon.pressure = 0;
      this.dungeon.maxFloor++;
      this.log(`🌀 Nuevo piso de mazmorra: ${this.dungeon.maxFloor}`);
    }
  }

  enterDungeon(npc) {
    if (npc.inDungeon) return;
    npc.inDungeon = true;
    npc.state = 'dungeon';
    this.log(`⚔️ ${npc.name} entró a la mazmorra`);
    // Simular expedición corta
    setTimeout(() => {
      if (npc.alive) {
        npc.inDungeon = false;
        npc.experience += 20;
        npc.skills.combat += 1;
        this.addStock('gold', 30);
        this.log(`⚔️ ${npc.name} regresó de la mazmorra`);
      }
    }, 10000);
  }

  // ==========================================================
  // RIVALES Y ASEDIOS (FASE 7)
  // ==========================================================
  initRivals() {
    const names = ['Tribu del Lobo', 'Tribu del Águila', 'Tribu del Oso'];
    const colors = ['#8B4513', '#4682B4', '#654321'];
    const cx = this.mapWidth / 2, cy = this.mapHeight / 2;

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const radius = 800;
      const rival = {
        id: `rival_${i}`,
        name: names[i],
        color: colors[i],
        emoji: ['🐺', '🦅', '🐻'][i],
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        pop: Phaser.Math.Between(8, 15),
        strength: Phaser.Math.Between(20, 40),
        alive: true,
        hostile: Math.random() < 0.3,
        siegeTimer: 0,
        lastAttack: 0
      };
      this.rivals.push(rival);
      this.relations[rival.id] = {
        reputation: 50, trade: false, alliance: false, war: rival.hostile
      };
    }
  }

  updateWarParties(dt) {
    // Ataques de rivales hostiles
    for (const rival of this.rivals) {
      if (!rival.alive || !this.relations[rival.id].war) continue;

      rival.siegeTimer += dt;
      if (rival.siegeTimer >= 180 && this.day - rival.lastAttack > 3) { // Ataque cada 3 días
        rival.siegeTimer = 0;
        rival.lastAttack = this.day;
        this.launchSiege(rival);
      }
    }

    // Actualizar partidas de guerra activas
    for (const party of this.warParties) {
      if (!party.alive) continue;
      party.timer += dt;

      const dx = party.targetX - party.x;
      const dy = party.targetY - party.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 30) {
        const speed = 50 * dt;
        party.x += (dx / dist) * speed;
        party.y += (dy / dist) * speed;
      } else {
        // Llegó al destino
        if (party.isEnemyAttack) {
          this.resolveEnemySiege(party);
        }
        party.alive = false;
      }
    }

    this.warParties = this.warParties.filter(p => p.alive);
  }

  launchSiege(rival) {
    const troops = Math.max(3, Math.floor(rival.strength / 10));
    const party = {
      id: Date.now(),
      x: rival.x, y: rival.y,
      targetX: this.mapWidth / 2,
      targetY: this.mapHeight / 2,
      count: troops,
      rivalId: rival.id,
      isEnemyAttack: true,
      alive: true,
      timer: 0,
      color: rival.color
    };
    this.warParties.push(party);
    this.log(`⚔️ ¡${rival.name} envía ${troops} guerreros a atacar!`);
    this.socialEvents.push({
      type: 'siege_start',
      emoji: '⚔️',
      text: `⚔️ ${rival.name} ataca!`,
      t: 0,
      n: { x: rival.x, y: rival.y }
    });
  }

  resolveEnemySiege(party) {
    // Calcular defensa
    const guards = this.getNpcs().filter(n => n.isGuard).length;
    const warriors = this.getNpcs().filter(n => n.weapon && !n.isGuard).length;
    const dogs = this.countType('dog');
    const defense = guards * 15 + warriors * 8 + dogs * 5;
    const attack = party.count * 10;

    if (defense > attack) {
      this.log(`🛡️ Ataque de ${party.rivalId} repelido`);
      this.socialEvents.push({
        type: 'siege_defend',
        emoji: '🛡️',
        text: `🛡️ ¡Ataque repelido!`,
        t: 0,
        n: { x: this.mapWidth / 2, y: this.mapHeight / 2 }
      });
    } else {
      const damage = Math.floor((attack - defense) / 2);
      this.stock.food = Math.max(0, this.stock.food - damage);
      const npcs = this.getNpcs();
      const victims = Math.min(npcs.length, Math.floor(damage / 10));
      for (let i = 0; i < victims; i++) {
        const victim = Phaser.Utils.Array.GetRandom(npcs);
        if (victim) victim.hp -= 20;
      }
      this.log(`🔥 El pueblo sufrió daños (-${damage} comida)`);
      this.socialEvents.push({
        type: 'siege_damage',
        emoji: '🔥',
        text: `🔥 Saqueo: -${damage} comida`,
        t: 0,
        n: { x: this.mapWidth / 2, y: this.mapHeight / 2 }
      });
    }
  }

  declareWar(rivalId) {
    const rel = this.relations[rivalId];
    const rival = this.rivals.find(r => r.id === rivalId);
    if (!rel || !rival) return;
    rel.war = true;
    rel.reputation = 0;
    rival.hostile = true;
    this.log(`⚔️ Guerra declarada con ${rival.name}`);
  }

  // ==========================================================
  // EVENTOS ALEATORIOS
  // ==========================================================
  triggerRandomEvent() {
    const events = [
      { id: 'good_harvest', weight: 20, minDay: 5, exec: () => {
        this.addStock('food', 50);
        this.log('🌾 ¡Buena cosecha! +50 comida');
        this.socialEvents.push({ type: 'event', emoji: '🌾', text: '🌾 Buena cosecha', t: 0, n: { x: this.mapWidth / 2, y: this.mapHeight / 2 } });
      }},
      { id: 'discovery', weight: 25, minDay: 3, exec: () => {
        this.addStock('knowledge', 30);
        this.log('💡 ¡Descubrimiento! +30 conocimiento');
      }},
      { id: 'festival', weight: 18, minDay: 7, exec: () => {
        this.getNpcs().forEach(n => {
          n.social = Math.min(100, n.social + 20);
          n.mood = Math.min(100, n.mood + 20);
        });
        this.log('🎉 ¡Festival! Todos más felices');
      }},
      { id: 'migration', weight: 22, minDay: 10, exec: () => {
        const count = Phaser.Math.Between(1, 3);
        for (let i = 0; i < count; i++) this.spawnNpc();
        this.log(`👥 ${count} nuevos aldeanos llegaron`);
      }},
      { id: 'plague', weight: 8, minDay: 15, exec: () => {
        let affected = 0;
        this.getNpcs().forEach(n => {
          if (Math.random() < 0.2) { n.hp = Math.max(30, n.hp - 30); affected++; }
        });
        if (affected > 0) this.log(`🤒 Plaga: ${affected} afectados`);
      }}
    ];

    const available = events.filter(e => this.day >= e.minDay);
    if (available.length === 0) return;

    const totalWeight = available.reduce((s, e) => s + e.weight, 0);
    let random = Math.random() * totalWeight;
    for (const event of available) {
      random -= event.weight;
      if (random <= 0) { event.exec(); break; }
    }
  }

  // ==========================================================
  // LOGROS
  // ==========================================================
  checkAchievements() {
    const checks = [
      { id: 'first_build', cond: () => this.stats.buildingsBuilt >= 1, name: '🏗️ Primer Edificio' },
      { id: 'pop10', cond: () => this.getNpcs().length >= 10, name: '👥 10 Aldeanos' },
      { id: 'pop25', cond: () => this.getNpcs().length >= 25, name: '👥 25 Aldeanos' },
      { id: 'dogs3', cond: () => this.getDogs().length >= 3, name: '🐕 3 Perros' },
      { id: 'dogs10', cond: () => this.getDogs().length >= 10, name: '🐕 10 Perros' },
      { id: 'marriage_1', cond: () => this.stats.marriages >= 1, name: '💍 Matrimonio' },
      { id: 'birth_1', cond: () => this.stats.births >= 1, name: '👶 Primer Bebé' },
      { id: 'kills_10', cond: () => this.stats.animalsKilled >= 10, name: '🏹 10 Animales' },
      { id: 'days_30', cond: () => this.stats.daysSurvived >= 30, name: '📅 30 Días' }
    ];

    for (const check of checks) {
      if (!this.achievements[check.id] && check.cond()) {
        this.achievements[check.id] = true;
        this.log(`🏆 Logro: ${check.name}`);
        this.socialEvents.push({
          type: 'achievement', emoji: '🏆', text: `🏆 ${check.name}`,
          t: 0, n: { x: this.mapWidth / 2, y: this.mapHeight / 2 }
        });
      }
    }
  }

  onNewDay() {
    this.log(`📅 Día ${this.day}`);
    for (const npc of this.getNpcs()) {
      if (npc.spouseId && !npc.isPregnant && npc.age >= 18 && npc.age < 50 && npc.gender === 'F') {
        if (Math.random() < 0.01) {
          npc.isPregnant = true;
          npc.pregnancyTimer = 60;
          this.log(`🤰 ${npc.name} está embarazada`);
        }
      }
    }
    this.checkAchievements();
  }

  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================
  getStats() {
    return {
      npcs: this.countType('npc'),
      animals: this.countType('animal'),
      dogs: this.countType('dog'),
      buildings: this.buildings.length,
      dungeonFloor: this.dungeon?.maxFloor || 1,
      wars: this.rivals.filter(r => this.relations[r.id]?.war).length,
      achievements: Object.keys(this.achievements).length,
      day: this.day,
      timeOfDay: this.timeOfDay,
      weather: this.weather,
      season: this.currentSeason
    };
  }
}
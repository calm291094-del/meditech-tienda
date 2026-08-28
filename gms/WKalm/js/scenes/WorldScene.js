// ============================================================
// WORLD SCENE - Edificios, torres y entidades visibles
// ============================================================
class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isMobile = this.registry.get('isMobile');
    this.views = new Map();
    this.buildingViews = new Map(); // ✅ NUEVO: Mapa de edificios
    this.resourceTexts = new Map();
    this.towerGraphics = []; // ✅ NUEVO: Gráficos de torres

    // Capas
    this.tileLayer = this.add.graphics();
    this.drawTiles();
    
    // ✅ NUEVO: Dibujar torres DESPUÉS de tiles
    this.drawGuardTowers();

    this.fogLayer = this.add.graphics();
    this.fogLayer.setDepth(5);

    this.resourceLayer = this.add.container(0, 0);
    this.resourceLayer.setDepth(2);
    this.drawResources();

    this.buildingLayer = this.add.container(0, 0);
    this.buildingLayer.setDepth(2.5);
    this.drawBuildings();

    this.entityLayer = this.add.container(0, 0);
    this.entityLayer.setDepth(3);

    this.weatherLayer = this.add.container(0, 0);
    this.weatherLayer.setDepth(4);

    this.eventLayer = this.add.container(0, 0);
    this.eventLayer.setDepth(8);

    this.lightingOverlay = this.add.graphics();
    this.lightingOverlay.setDepth(9);

    // Cámara
    this.cameras.main.setBounds(0, 0, this.sim.mapWidth, this.sim.mapHeight);
    this.cameras.main.centerOn(this.sim.mapWidth / 2, this.sim.mapHeight / 2);
    this.cameras.main.setZoom(this.isMobile ? 0.7 : 1);

    // Input
    this.input.on('pointerdown', this.handleClick, this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey('W'),
      A: this.input.keyboard.addKey('A'),
      S: this.input.keyboard.addKey('S'),
      D: this.input.keyboard.addKey('D')
    };

    this.input.on('wheel', (p, go, dx, dy) => {
      const cam = this.cameras.main;
      const zoom = cam.zoom + (dy > 0 ? -0.1 : 0.1);
      cam.setZoom(Phaser.Math.Clamp(zoom, 0.3, 2.5));
    });

    this.setupTouchControls();

    this.resourceUpdateTimer = 0;
  }

  setupTouchControls() {
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragDistance = 0;
    this.lastPinchDistance = 0;

    this.input.on('pointerdown', (pointer) => {
      if (this.input.pointer1.isDown && !this.input.pointer2.isDown) {
        this.isDragging = true;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
        this.dragDistance = 0;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.isDragging && this.input.pointer1.isDown && !this.input.pointer2.isDown) {
        const dx = pointer.x - this.dragStart.x;
        const dy = pointer.y - this.dragStart.y;
        this.dragDistance += Math.abs(dx) + Math.abs(dy);
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
      }
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.lastPinchDistance > 0) {
          const delta = dist - this.lastPinchDistance;
          const newZoom = this.cameras.main.zoom + delta * 0.005;
          this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.3, 2.5));
        }
        this.lastPinchDistance = dist;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.lastPinchDistance = 0;
    });
  }

  handleClick(pointer) {
    if (this.dragDistance > 15) return;
    if (this.input.pointer2.isDown) return;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const picked = this.pickEntity(worldPoint.x, worldPoint.y);
    if (picked) { this.sim.selectedId = picked.id; return; }
    const selected = this.sim.getById(this.sim.selectedId);
    if (selected && selected.type === 'npc') {
      this.sim.setDestination(selected, worldPoint.x, worldPoint.y);
    }
  }

  pickEntity(x, y) {
    let best = null, bestDist = 30;
    for (const e of this.sim.entities) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  drawTiles() {
    const g = this.tileLayer;
    const W = MapGenerator.width, H = MapGenerator.height;
    const T = MapGenerator.tileSize;
    const tiles = ContentDB.tiles;
    const colorById = {
      0: tiles.water.color, 1: tiles.sand.color, 2: tiles.grass.color,
      3: tiles.forest.color, 4: tiles.stone.color, 5: tiles.ore.color
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = this.sim.grid[y * W + x];
        g.fillStyle(colorById[t] || 0x222222, 1);
        g.fillRect(x * T, y * T, T, T);
      }
    }

    const cx = this.sim.mapWidth / 2, cy = this.sim.mapHeight / 2;
    g.lineStyle(4, 0x78716c, 1);
    g.strokeCircle(cx, cy, Navigation.wallRadius);

    const slots = Navigation.getWallSlots();
    const gate = Navigation.gateIndex;
    const a = slots[gate], b = slots[(gate + 1) % slots.length];
    g.lineStyle(6, 0xfbbf24, 1);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.strokePath();

    // Mazmorra
    this.add.text(cx, cy, '🕳️', { fontSize: '32px' })
      .setOrigin(0.5).setDepth(2.3);

    this.add.text(cx, cy, '🏰', { fontSize: '40px' })
      .setOrigin(0.5).setDepth(4);
  }

  // ✅ CORREGIDO: Torres con verificación robusta
  drawGuardTowers() {
    // Limpiar torres anteriores
    this.towerGraphics.forEach(g => g.destroy());
    this.towerGraphics = [];

    if (!Walls.towers || Walls.towers.length === 0) {
      console.warn('[WorldScene] No hay torres definidas, intentando reinicializar...');
      Walls.initTowers();
      
      if (!Walls.towers || Walls.towers.length === 0) {
        console.error('[WorldScene] ❌ Aún no hay torres después de reinicializar');
        return;
      }
    }

    console.log(`[WorldScene] Dibujando ${Walls.towers.length} torres...`);

    for (const tower of Walls.towers) {
      // Base de la torre (cuadrado marrón)
      const base = this.add.rectangle(tower.x, tower.y, 40, 40, 0x57534e, 1)
        .setDepth(3.5);
      this.towerGraphics.push(base);
      
      // Techo triangular rojo
      const roof = this.add.triangle(tower.x, tower.y - 25, 0, 0, 20, 25, -20, 25, 0x7f1d1d)
        .setDepth(3.6);
      this.towerGraphics.push(roof);

      // Emoji de torre
      const emoji = this.add.text(tower.x, tower.y - 5, '🗼', { fontSize: '28px' })
        .setOrigin(0.5).setDepth(3.7);
      this.towerGraphics.push(emoji);

      console.log(`[WorldScene] ✅ Torre dibujada en (${Math.floor(tower.x)}, ${Math.floor(tower.y)})`);
    }
  }

  drawResources() {
    this.resourceTexts.forEach(t => t.destroy());
    this.resourceTexts.clear();
    for (const r of this.sim.resources) {
      if (r.amount <= 0) continue;
      const container = this.add.container(r.x, r.y);
      const emoji = this.add.text(0, 0, r.def?.emoji || r.emoji || '🌲', { fontSize: '18px' })
        .setOrigin(0.5);
      container.add(emoji);
      this.resourceLayer.add(container);
      this.resourceTexts.set(r.id || Math.random(), container);
    }
  }

  drawBuildings() {
    // Solo dibuja los edificios iniciales
    for (const b of this.sim.buildings) {
      this.createBuildingView(b);
    }
  }

  // ✅ NUEVO: Crear vista de edificio individual
  createBuildingView(building) {
    if (this.buildingViews.has(building.id)) return;

    const emoji = building.def?.e || building.def?.emoji || '🏠';
    const text = this.add.text(building.x, building.y, emoji, { fontSize: '28px' })
      .setOrigin(0.5).setDepth(2.5);
    
    // Nombre del edificio debajo
    const name = this.add.text(building.x, building.y + 20, building.name || '', {
      fontSize: '9px', color: '#e2e8f0',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(2.5);

    const container = this.add.container(0, 0);
    container.add([text, name]);
    this.buildingLayer.add(container);
    this.buildingViews.set(building.id, container);
    
    console.log(`[WorldScene] ✅ Edificio dibujado: ${building.name} en (${Math.floor(building.x)}, ${Math.floor(building.y)})`);
  }

  // ✅ NUEVO: Sincronizar edificios dinámicamente
  syncBuildings() {
    const currentBuildingIds = new Set();

    for (const building of this.sim.buildings) {
      currentBuildingIds.add(building.id);
      
      // Si no existe vista, crearla
      if (!this.buildingViews.has(building.id)) {
        this.createBuildingView(building);
      }
    }

    // Eliminar vistas de edificios que ya no existen
    for (const [id, view] of this.buildingViews.entries()) {
      if (!currentBuildingIds.has(id)) {
        view.destroy();
        this.buildingViews.delete(id);
      }
    }
  }

  drawFog() {
    const g = this.fogLayer;
    g.clear();
    const W = MapGenerator.width, H = MapGenerator.height;
    const T = MapGenerator.tileSize;
    g.fillStyle(0x000000, 0.85);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (this.sim.fog[y * W + x] === 0) g.fillRect(x * T, y * T, T, T);
      }
    }
  }

  drawDayNightCycle() {
    const overlay = this.lightingOverlay;
    overlay.clear();

    const daylight = this.sim.getDaylightIntensity();
    const isNight = this.sim.isNight();
    const skyColor = this.sim.getSkyColor();

    if (daylight < 1) {
      const darkness = (1 - daylight) * 0.6;
      overlay.fillStyle(
        Phaser.Display.Color.GetColor(skyColor.r, skyColor.g, skyColor.b),
        darkness
      );
      overlay.fillRect(0, 0, this.sim.mapWidth, this.sim.mapHeight);
    }

    if (isNight) {
      const alpha = Math.min(1, (1 - daylight) * 2);
      for (const star of this.sim.stars) {
        const twinkle = Math.sin(star.twinkle + this.sim.time * 0.001) * 0.3 + 0.7;
        overlay.fillStyle(0xffffcc, alpha * star.brightness * twinkle);
        overlay.fillCircle(star.x, star.y, 1.5);
      }

      const moonPhase = this.sim.moonPhase;
      const moonX = this.sim.mapWidth - 200;
      const moonY = 100;
      overlay.fillStyle(0xf8f8ff, alpha * 0.9);
      overlay.fillCircle(moonX, moonY, 30);

      if (moonPhase !== 4) {
        const shadowOffset = (moonPhase - 4) * 6;
        overlay.fillStyle(0x000020, alpha * 0.8);
        overlay.fillCircle(moonX + shadowOffset, moonY, 30);
      }
    }

    if (daylight > 0.2 && daylight < 0.8) {
      const t = this.sim.timeOfDay;
      if (t < 0.3 || t > 0.7) {
        overlay.fillStyle(0xff8844, 0.15);
        overlay.fillRect(0, 0, this.sim.mapWidth, this.sim.mapHeight);
      }
    }
  }

  drawWeatherParticles() {
    this.weatherLayer.removeAll(true);

    for (const p of this.sim.weatherParticles) {
      if (p.type === 'rain') {
        const line = this.add.rectangle(p.x, p.y, 1, 8, 0x88aaff, 0.6);
        this.weatherLayer.add(line);
      } else if (p.type === 'snow') {
        p.sway += 0.02;
        p.x += Math.sin(p.sway) * 0.5;
        const circle = this.add.circle(p.x, p.y, 2, 0xffffff, 0.8);
        this.weatherLayer.add(circle);
      }
    }

    if (this.sim.weather === 'storm') {
      const fog = this.add.rectangle(
        this.cameras.main.scrollX + this.cameras.main.width / 2,
        this.cameras.main.scrollY + this.cameras.main.height / 2,
        this.cameras.main.width / this.cameras.main.zoom,
        this.cameras.main.height / this.cameras.main.zoom,
        0x445566, 0.2
      ).setScrollFactor(0);
      this.weatherLayer.add(fog);
    }
  }

  drawWarParties() {
    for (const party of this.sim.warParties) {
      if (!party.alive) continue;

      const color = Phaser.Display.Color.HexStringToColor(party.color).color;
      const g = this.add.graphics();
      g.fillStyle(color, 0.8);
      g.fillCircle(party.x, party.y, 15);

      const flag = this.add.text(party.x, party.y - 20, '⚔️', { fontSize: '16px' })
        .setOrigin(0.5);

      const count = this.add.text(party.x, party.y + 5, `${party.count}`, {
        fontSize: '10px', color: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5);

      this.eventLayer.add([g, flag, count]);
    }

    for (const rival of this.sim.rivals) {
      if (!rival.alive) continue;
      const color = Phaser.Display.Color.HexStringToColor(rival.color).color;
      const g = this.add.graphics();
      g.fillStyle(color, 0.3);
      g.fillCircle(rival.x, rival.y, 40);
      g.lineStyle(2, color, 0.8);
      g.strokeCircle(rival.x, rival.y, 40);

      const label = this.add.text(rival.x, rival.y, rival.emoji, { fontSize: '32px' })
        .setOrigin(0.5);
      const name = this.add.text(rival.x, rival.y + 25, rival.name, {
        fontSize: '10px', color: '#fff', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5);

      this.eventLayer.add([g, label, name]);
    }
  }

  drawEvents() {
    this.eventLayer.removeAll(true);

    for (const ev of this.sim.damageEvents) {
      const alpha = 1 - ev.t;
      const t = this.add.text(ev.x, ev.y - 20 - ev.t * 30, '-' + ev.dmg, {
        fontSize: '16px', color: '#ef4444', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(alpha);
      this.eventLayer.add(t);
    }

    for (const ev of this.sim.lootEvents) {
      const alpha = 1 - ev.t / 1.5;
      const text = Object.entries(ev.loot).map(([k, v]) => `+${v} ${k}`).join(' ');
      const t = this.add.text(ev.x, ev.y - 30 - ev.t * 20, text, {
        fontSize: '12px', color: '#fbbf24', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(alpha);
      this.eventLayer.add(t);
    }

    for (const ev of this.sim.socialEvents) {
      const alpha = 1 - ev.t / 4;
      let color = '#fbbf24';
      if (ev.type === 'death') color = '#ef4444';
      else if (ev.type === 'birth' || ev.type === 'marriage') color = '#ec4899';
      else if (ev.type === 'levelup') color = '#4ade80';
      else if (ev.type === 'achievement') color = '#fbbf24';
      else if (ev.type === 'siege_start' || ev.type === 'siege_damage') color = '#ef4444';
      else if (ev.type === 'siege_defend') color = '#4ade80';

      const t = this.add.text(ev.n.x, ev.n.y - 40 - ev.t * 20, ev.text || ev.emoji, {
        fontSize: '11px', color, fontStyle: 'bold',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(alpha);
      this.eventLayer.add(t);
    }

    this.drawWarParties();
  }

  update(time, delta) {
    if (!this.isMobile) {
      const camSpeed = 400 / this.cameras.main.zoom;
      const dt = delta / 1000;
      if (this.cursors.left.isDown || this.wasd.A.isDown) this.cameras.main.scrollX -= camSpeed * dt;
      if (this.cursors.right.isDown || this.wasd.D.isDown) this.cameras.main.scrollX += camSpeed * dt;
      if (this.cursors.up.isDown || this.wasd.W.isDown) this.cameras.main.scrollY -= camSpeed * dt;
      if (this.cursors.down.isDown || this.wasd.S.isDown) this.cameras.main.scrollY += camSpeed * dt;
    }

    this.sim.update(delta);

    this.resourceUpdateTimer += delta;
    if (this.resourceUpdateTimer > 500) {
      this.resourceUpdateTimer = 0;
      this.drawFog();
    }

    this.syncViews();
    this.syncBuildings(); // ✅ NUEVO: Sincronizar edificios
    this.drawEvents();
    this.drawDayNightCycle();
    this.drawWeatherParticles();
  }

  syncViews() {
    const aliveIds = new Set();
    
    for (const e of this.sim.entities) {
      if (!e.alive) continue;
      aliveIds.add(e.id);

      let view = this.views.get(e.id);
      
      if (!view) {
        view = this.createView(e);
        if (!view) {
          console.error(`[WorldScene] No se pudo crear vista para entidad ${e.type} ${e.id}`);
          continue;
        }
      }

      view.x = e.x;
      view.y = e.y;

      if (e.id === this.sim.selectedId) {
        view.setScale(1.3);
        view.setDepth(10);
      } else {
        view.setScale(1);
        view.setDepth(3);
      }

      if (e.type === 'npc' || e.type === 'animal' || e.type === 'dog') {
        this.updateHealthBar(view, e);
      }
    }

    for (const [id, view] of this.views.entries()) {
      if (!aliveIds.has(id)) {
        view.destroy();
        this.views.delete(id);
      }
    }
  }

  createView(entity) {
    const container = this.add.container(entity.x, entity.y);
    
    const shadow = this.add.ellipse(0, 8, 22, 8, 0x000000, 0.4);
    
    const emojiText = this.getEntityEmoji(entity);
    const fontSize = (entity.type === 'npc' && entity.isGuard) ? '32px' : '24px';
    const emoji = this.add.text(0, 0, emojiText, { fontSize }).setOrigin(0.5);

    const nameColor = entity.isGuard ? '#fbbf24' :
                      entity.type === 'dog' ? '#93c5fd' : '#e2e8f0';
    
    const name = this.add.text(0, 18, entity.name || '', {
      fontSize: '10px', color: nameColor,
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    const hpBg = this.add.rectangle(0, -18, 26, 4, 0x000000, 0.6).setOrigin(0.5);
    const hpBar = this.add.rectangle(-13, -18, 26, 4, 0x22c55e).setOrigin(0, 0.5);

    container.add([shadow, emoji, name, hpBg, hpBar]);
    container.setData('hpBar', hpBar);
    
    this.entityLayer.add(container);
    this.views.set(entity.id, container);
    
    return container;
  }

  updateHealthBar(view, entity) {
    const hpBar = view.getData('hpBar');
    if (!hpBar) return;

    const maxHp = entity.maxHp || entity.def?.hp || 100;
    const hp = Math.max(0, Math.min(maxHp, entity.hp || 0));
    const ratio = hp / maxHp;
    hpBar.width = 26 * ratio;

    if (ratio < 0.3) hpBar.setFillStyle(0xef4444);
    else if (ratio < 0.6) hpBar.setFillStyle(0xfbbf24);
    else hpBar.setFillStyle(0x22c55e);
  }

  getEntityEmoji(e) {
    if (e.type === 'npc') return e.race?.emoji || '🧑';
    if (e.type === 'animal') return e.emoji || '🐾';
    if (e.type === 'dog') return e.emoji || '🐕';
    if (e.type === 'item') return e.emoji || '🎁';
    return '❔';
  }
}
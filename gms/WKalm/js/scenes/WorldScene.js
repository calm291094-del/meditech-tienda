// ============================================================
// WORLD SCENE - Con drag, pinch-zoom y tap para móvil
// ============================================================

class WorldScene extends Phaser.Scene {

  constructor() { super('WorldScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isMobile = this.registry.get('isMobile');
    this.views = new Map();
    this.resourceTexts = new Map();

    // Capas
    this.tileLayer = this.add.graphics();
    this.drawTiles();
    this.drawGuardTowers();

    this.fogLayer = this.add.graphics();
    this.fogLayer.setDepth(5);

    this.resourceLayer = this.add.container(0, 0);
    this.resourceLayer.setDepth(2);
    this.drawResources();

    this.entityLayer = this.add.container(0, 0);
    this.entityLayer.setDepth(3);

    this.eventLayer = this.add.container(0, 0);
    this.eventLayer.setDepth(8);

    // Cámara
    this.cameras.main.setBounds(0, 0, this.sim.mapWidth, this.sim.mapHeight);
    this.cameras.main.centerOn(this.sim.mapWidth / 2, this.sim.mapHeight / 2);
    this.cameras.main.setZoom(this.isMobile ? 0.7 : 1);

    // ===== CONTROLES DE ESCRITORIO =====
    this.input.on('pointerdown', this.handleClick, this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey('W'),
      A: this.input.keyboard.addKey('A'),
      S: this.input.keyboard.addKey('S'),
      D: this.input.keyboard.addKey('D')
    };

    // Rueda del ratón (zoom)
    this.input.on('wheel', (p, go, dx, dy) => {
      const cam = this.cameras.main;
      const zoom = cam.zoom + (dy > 0 ? -0.1 : 0.1);
      cam.setZoom(Phaser.Math.Clamp(zoom, 0.3, 2.5));
    });

    // ===== CONTROLES TÁCTILES =====
    this.setupTouchControls();

    // Estado de drag
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragDistance = 0;
    this.lastPinchDistance = 0;

    this.resourceUpdateTimer = 0;
  }

  // ============================================================
  // CONTROLES TÁCTILES (drag + pinch + tap)
  // ============================================================
  setupTouchControls() {
    const cam = this.cameras.main;

    this.input.on('pointerdown', (pointer) => {
      if (this.input.pointer1.isDown && !this.input.pointer2.isDown) {
        this.isDragging = true;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
        this.dragDistance = 0;
      }
    });

    this.input.on('pointermove', (pointer) => {
      // DRAG: mover cámara con un dedo
      if (this.isDragging && this.input.pointer1.isDown && !this.input.pointer2.isDown) {
        const dx = pointer.x - this.dragStart.x;
        const dy = pointer.y - this.dragStart.y;
        this.dragDistance += Math.abs(dx) + Math.abs(dy);

        cam.scrollX -= dx / cam.zoom;
        cam.scrollY -= dy / cam.zoom;

        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
      }

      // PINCH ZOOM: dos dedos
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);

        if (this.lastPinchDistance > 0) {
          const delta = dist - this.lastPinchDistance;
          const newZoom = cam.zoom + delta * 0.005;
          cam.setZoom(Phaser.Math.Clamp(newZoom, 0.3, 2.5));
        }
        this.lastPinchDistance = dist;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.lastPinchDistance = 0;
    });
  }

  // ============================================================
  // CLICK / TAP (detectar si fue tap vs drag)
  // ============================================================
  handleClick(pointer) {
    // Si fue un drag, no procesar como click
    if (this.dragDistance > 15) return;
    // Si hay pinch activo, tampoco
    if (this.input.pointer2.isDown) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const picked = this.pickEntity(worldPoint.x, worldPoint.y);

    if (picked) {
      this.sim.selectedId = picked.id;
      return;
    }

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

  // ============================================================
  // DIBUJADO
  // ============================================================
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

    const cx = this.sim.mapWidth / 2;
    const cy = this.sim.mapHeight / 2;
    g.lineStyle(4, 0x78716c, 1);
    g.strokeCircle(cx, cy, Navigation.wallRadius);

    const slots = Navigation.getWallSlots();
    const gate = Navigation.gateIndex;
    const a = slots[gate];
    const b = slots[(gate + 1) % slots.length];
    g.lineStyle(6, 0xfbbf24, 1);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.strokePath();

    this.add.text(cx, cy, '🏰', { fontSize: '40px' }).setOrigin(0.5).setDepth(4);
  }

  drawGuardTowers() {
    const g = this.tileLayer;
    for (const tower of Walls.towers) {
      g.fillStyle(0x78716c, 1);
      g.fillRect(tower.x - 15, tower.y - 15, 30, 30);
      g.fillStyle(0x92400e, 1);
      g.fillTriangle(
        tower.x - 18, tower.y - 15,
        tower.x + 18, tower.y - 15,
        tower.x, tower.y - 30
      );
      this.add.text(tower.x, tower.y - 5, '🛡️', {
        fontSize: '20px'
      }).setOrigin(0.5).setDepth(4);
    }
  }

  drawResources() {
    this.resourceTexts.forEach(text => text.destroy());
    this.resourceTexts.clear();

    for (const r of this.sim.resources) {
      if (r.amount <= 0) continue;
      const container = this.add.container(r.x, r.y);
      const shadow = this.add.ellipse(0, 4, 16, 6, 0x000000, 0.3);
      const emoji = this.add.text(0, 0, r.def.emoji, { fontSize: '18px' }).setOrigin(0.5);
      container.add([shadow, emoji]);
      this.resourceLayer.add(container);
      this.resourceTexts.set(r.id, container);
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
        if (this.sim.fog[y * W + x] === 0) {
          g.fillRect(x * T, y * T, T, T);
        }
      }
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update(time, delta) {
    // Teclado (solo desktop)
    if (!this.isMobile) {
      const camSpeed = 400 / this.cameras.main.zoom;
      const dt = delta / 1000;
      if (this.cursors.left.isDown  || this.wasd.A.isDown) this.cameras.main.scrollX -= camSpeed * dt;
      if (this.cursors.right.isDown || this.wasd.D.isDown) this.cameras.main.scrollX += camSpeed * dt;
      if (this.cursors.up.isDown    || this.wasd.W.isDown) this.cameras.main.scrollY -= camSpeed * dt;
      if (this.cursors.down.isDown  || this.wasd.S.isDown) this.cameras.main.scrollY += camSpeed * dt;
    }

    this.sim.update(delta);

    this.resourceUpdateTimer += delta;
    if (this.resourceUpdateTimer > 500) {
      this.resourceUpdateTimer = 0;
      this.drawFog();
    }

    this.syncViews();
    this.drawEvents();
    this.drawWeatherAndLighting();
  }

  syncViews() {
    const aliveIds = new Set();

    for (const e of this.sim.entities) {
      if (!e.alive) continue;
      aliveIds.add(e.id);

      let view = this.views.get(e.id);
      if (!view) view = this.createView(e);

      view.x = e.x;
      view.y = e.y;

      if (e.id === this.sim.selectedId) {
        view.setScale(1.3);
        view.setDepth(10);
      } else {
        view.setScale(1);
        view.setDepth(3);
      }

      if (e.type === 'npc' || e.type === 'animal') {
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
    const fontSize = entity.type === 'npc' && entity.isGuard ? '28px' : '24px';
    const emoji = this.add.text(0, 0, this.getEntityEmoji(entity), { fontSize }).setOrigin(0.5);
    const nameColor = entity.isGuard ? '#fbbf24' : '#e2e8f0';
    const name = this.add.text(0, 18, entity.name || '', {
      fontSize: '10px', color: nameColor, stroke: '#000', strokeThickness: 2
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

    const maxHp = entity.type === 'animal' ? (entity.def?.hp || 20) : (entity.isGuard ? 150 : 100);
    // ✅ PROTECCIÓN: Clamp de valores
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
    if (e.type === 'item') return e.emoji || '🎁';
    return '❔';
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

    // Eventos sociales (matrimonios, nacimientos)
    for (const ev of this.sim.socialEvents) {
      const alpha = 1 - ev.t / 4;
      let msg = '', color = '#fbbf24';
      if (ev.type === 'marriage') { msg = '💍 ' + ev.text; color = '#ec4899'; }
      else if (ev.type === 'birth') { msg = '👶 ' + ev.text; color = '#4ade80'; }
      else if (ev.type === 'pregnancy') { msg = '🤰 ' + ev.text; color = '#fbbf24'; }

      const t = this.add.text(ev.n?.x || ev.n1?.x || 0, (ev.n?.y || ev.n1?.y || 0) - 40 - ev.t * 20, msg, {
        fontSize: '11px', color, fontStyle: 'bold',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(alpha);
      this.eventLayer.add(t);
    }
  }

drawWeatherAndLighting() {
  const w = this.scale.width;
  const h = this.scale.height;

  // Partículas de clima
  for (const p of Weather.particles) {
    if (p.type === 'rain') {
      const line = this.add.rectangle(p.x, p.y, 1, 10, 0x4a90e2, 0.6);
      this.eventLayer.add(line);
    } else if (p.type === 'snow') {
      const circle = this.add.circle(p.x, p.y, 2, 0xffffff, 0.8);
      this.eventLayer.add(circle);
    }
  }

  // Tinte de día/noche
  const tint = DayNight.getTint();
  const intensity = DayNight.getLightIntensity();
  const darkness = 1 - intensity;

  if (darkness > 0.1) {
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 
      Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b), 
      darkness * 0.4
    ).setDepth(9).setScrollFactor(0);
    
    // Limpiar overlay anterior
    if (this.dayNightOverlay) {
      this.dayNightOverlay.destroy();
    }
    this.dayNightOverlay = overlay;
  }
}

}
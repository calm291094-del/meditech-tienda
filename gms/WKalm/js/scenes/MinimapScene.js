// ============================================================
// MINIMAP SCENE - Con click/touch para teletransportar cámara
// ============================================================

class MinimapScene extends Phaser.Scene {

  constructor() { super('MinimapScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isMobile = this.registry.get('isMobile');

    // Tamaño responsivo
    const baseW = this.isMobile ? 120 : 180;
    const baseH = this.isMobile ? 90 : 135;
    const padding = this.isMobile ? 6 : 10;

    this.minimapX = this.scale.width - baseW - padding;
    this.minimapY = this.scale.height - baseH - padding;
    this.W = baseW;
    this.H = baseH;

    this.cameras.main.setViewport(this.minimapX, this.minimapY, baseW, baseH);
    this.cameras.main.setBackgroundColor('#0f172a');

    const scaleX = baseW / this.sim.mapWidth;
    const scaleY = baseH / this.sim.mapHeight;
    this.mapScale = Math.min(scaleX, scaleY);

    this.mapGfx = this.add.graphics();
    this.drawMap();

    this.fogGfx = this.add.graphics();
    this.entityGfx = this.add.graphics();

    // Borde
    this.add.rectangle(
      this.minimapX + baseW / 2, this.minimapY + baseH / 2, baseW, baseH
    ).setStrokeStyle(2, 0xfbbf24).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Click/touch para teletransportar cámara
    this.input.on('pointerdown', (p) => {
      const localX = p.x - this.minimapX;
      const localY = p.y - this.minimapY;
      if (localX < 0 || localX > baseW || localY < 0 || localY > baseH) return;

      const worldX = localX / this.mapScale;
      const worldY = localY / this.mapScale;

      const worldScene = this.scene.get('WorldScene');
      worldScene.cameras.main.centerOn(worldX, worldY);
    });
  }

  drawMap() {
    const g = this.mapGfx;
    const W = MapGenerator.width, H = MapGenerator.height;
    const s = this.mapScale * MapGenerator.tileSize;

    const tiles = ContentDB.tiles;
    const colorById = {
      0: tiles.water.color, 1: tiles.sand.color, 2: tiles.grass.color,
      3: tiles.forest.color, 4: tiles.stone.color, 5: tiles.ore.color
    };

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = this.sim.grid[y * W + x];
        g.fillStyle(colorById[t] || 0x222222, 1);
        g.fillRect(x * s, y * s, s + 1, s + 1);
      }
    }

    const cx = (this.sim.mapWidth / 2) * this.mapScale;
    const cy = (this.sim.mapHeight / 2) * this.mapScale;
    const r = Navigation.wallRadius * this.mapScale;
    g.lineStyle(2, 0x78716c, 1);
    g.strokeCircle(cx, cy, r);
  }

  update() {
    this.fogGfx.clear();
    const W = MapGenerator.width, H = MapGenerator.height;
    const s = this.mapScale * MapGenerator.tileSize;

    this.fogGfx.fillStyle(0x000000, 0.8);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (this.sim.fog[y * W + x] === 0) {
          this.fogGfx.fillRect(x * s, y * s, s + 1, s + 1);
        }
      }
    }

    this.entityGfx.clear();

    for (const biz of Economy.businesses) {
      const x = biz.x * this.mapScale;
      const y = biz.y * this.mapScale;
      this.entityGfx.fillStyle(0x3b82f6, 1);
      this.entityGfx.fillCircle(x, y, 3);
    }

    for (const e of this.sim.entities) {
      if (!e.alive) continue;
      const x = e.x * this.mapScale;
      const y = e.y * this.mapScale;

      if (e.type === 'npc') {
        this.entityGfx.fillStyle(e.isGuard ? 0xfbbf24 : 0x4ade80, 1);
        this.entityGfx.fillCircle(x, y, e.isGuard ? 3 : 2);
      } else if (e.type === 'animal') {
        this.entityGfx.fillStyle(e.hostile ? 0xef4444 : 0xfbbf24, 1);
        this.entityGfx.fillCircle(x, y, 2);
      }
    }

    const worldScene = this.scene.get('WorldScene');
    const cam = worldScene.cameras.main;
    const vx = cam.scrollX * this.mapScale;
    const vy = cam.scrollY * this.mapScale;
    const vw = (cam.width / cam.zoom) * this.mapScale;
    const vh = (cam.height / cam.zoom) * this.mapScale;

    this.entityGfx.lineStyle(1, 0xffffff, 1);
    this.entityGfx.strokeRect(vx, vy, vw, vh);
  }
}
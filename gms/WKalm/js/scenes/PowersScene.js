// ============================================================
// POWERS SCENE - CORREGIDO (inicialización robusta)
// ============================================================

class PowersScene extends Phaser.Scene {

  constructor() { super('PowersScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isVisible = false;

    const w = this.scale.width;
    const h = this.scale.height;

    // Fondo oscuro semi-transparente
    this.bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(1000)
      .setVisible(false)
      .setInteractive();

    this.bg.on('pointerdown', () => this.hide());

    // Panel central
    this.panel = this.add.container(w / 2, h / 2);
    this.panel.setVisible(false);
    this.panel.setDepth(1001);

    const panelBg = this.add.rectangle(0, 0, 700, 580, 0x0f172a, 0.98)
      .setStrokeStyle(3, 0xa855f7);

    this.titleText = this.add.text(0, -270, '⚡ PODERES DIVINOS', {
      fontSize: '24px', color: '#a855f7', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.closeBtn = this.add.text(320, -270, '✕', {
      fontSize: '28px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.closeBtn.on('pointerdown', () => this.hide());

    // Contenido dinámico
    this.contentContainer = this.add.container(0, 0);

    this.panel.add([panelBg, this.titleText, this.closeBtn, this.contentContainer]);

    console.log('[PowersScene] ✓ Inicializada correctamente');
  }

  show() {
    // ✅ Protección por si create() aún no terminó
    if (!this.bg || !this.panel) {
      console.warn('[PowersScene] Aún no inicializada');
      return;
    }
    
    this.isVisible = true;
    this.bg.setVisible(true);
    this.panel.setVisible(true);
    this.render();
  }

  hide() {
    this.isVisible = false;
    if (this.bg) this.bg.setVisible(false);
    if (this.panel) this.panel.setVisible(false);
  }

  render() {
    this.contentContainer.removeAll(true);

    const sections = [
      {
        title: '💎 RECURSOS DIVINOS',
        items: [
          { emoji: '🍖', name: '+50 Comida', action: () => { this.sim.addStock('food', 50); this.showMessage('🍖 +50 Comida'); } },
          { emoji: '🪵', name: '+50 Madera', action: () => { this.sim.addStock('wood', 50); this.showMessage('🪵 +50 Madera'); } },
          { emoji: '🪨', name: '+50 Piedra', action: () => { this.sim.addStock('stone', 50); this.showMessage('🪨 +50 Piedra'); } },
          { emoji: '⛏️', name: '+30 Mineral', action: () => { this.sim.addStock('ore', 30); this.showMessage('⛏️ +30 Mineral'); } },
          { emoji: '💰', name: '+100 Oro', action: () => { this.sim.addStock('gold', 100); this.showMessage('💰 +100 Oro'); } },
          { emoji: '✨', name: '+100 Fe', action: () => { this.sim.addStock('faith', 100); this.showMessage('✨ +100 Fe'); } }
        ]
      },
      {
        title: '🙏 MILAGROS',
        items: [
          { emoji: '💖', name: 'Sanar Todos (60 Fe)', cost: 60, action: () => this.doMiracle('heal_all', 60) },
          { emoji: '⚡', name: 'Resurrección (150 Fe)', cost: 150, action: () => this.doMiracle('resurrect', 150) },
          { emoji: '🌾', name: 'Cosecha (40 Fe)', cost: 40, action: () => this.doMiracle('harvest', 40) }
        ]
      },
      {
        title: '⚔️ ARSENAL LEGENDARIO',
        items: [
          { emoji: '⚔️', name: 'Espada Divina (100 Fe)', cost: 100, action: () => this.spawnWeapon('w44', 100) },
          { emoji: '⚡', name: 'Rayo Zeus (150 Fe)', cost: 150, action: () => this.spawnWeapon('w45', 150) },
          { emoji: '🔨', name: 'Mjolnir (150 Fe)', cost: 150, action: () => this.spawnWeapon('w48', 150) },
          { emoji: '🔱', name: 'Tridente (120 Fe)', cost: 120, action: () => this.spawnWeapon('w46', 120) }
        ]
      },
      {
        title: '🐾 INVOCAR CRIATURAS',
        items: [
          { emoji: '🐕', name: 'Perro (50 Fe)', cost: 50, action: () => this.invokeCreature('dog', 50) },
          { emoji: '🐺', name: 'Lobo (80 Fe)', cost: 80, action: () => this.invokeCreature('wolf', 80) },
          { emoji: '🐻', name: 'Oso (100 Fe)', cost: 100, action: () => this.invokeCreature('bear', 100) },
          { emoji: '🐉', name: 'Dragón (200 Fe)', cost: 200, action: () => this.invokeCreature('dragon', 200) }
        ]
      }
    ];

    let y = -220;
    
    for (const section of sections) {
      const sectionTitle = this.add.text(-320, y, section.title, {
        fontSize: '14px', color: '#fbbf24', fontStyle: 'bold'
      });
      this.contentContainer.add(sectionTitle);
      y += 30;

      let x = -320;
      for (const item of section.items) {
        const btn = this.createButton(x, y, item);
        this.contentContainer.add(btn);
        x += 160;
        if (x > 160) {
          x = -320;
          y += 60;
        }
      }
      y += 70;
    }
  }

  createButton(x, y, item) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 150, 50, 0x1e293b, 0.95)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });

    const emoji = this.add.text(-55, -10, item.emoji, { fontSize: '22px' }).setOrigin(0.5);
    const name = this.add.text(-35, 5, item.name, {
      fontSize: '10px', color: '#f8fafc'
    }).setOrigin(0, 0.5);

    if (item.cost) {
      const costText = this.add.text(60, 15, `${item.cost}✨`, {
        fontSize: '9px', color: '#fbbf24', fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add(costText);
    }

    container.add([bg, emoji, name]);

    bg.on('pointerover', () => bg.setFillStyle(0x10b981, 0.9));
    bg.on('pointerout', () => bg.setFillStyle(0x1e293b, 0.95));
    bg.on('pointerdown', () => {
      try {
        item.action();
      } catch (err) {
        console.error('[Powers] Error:', err);
      }
      this.render();
    });

    return container;
  }

  doMiracle(type, cost) {
    if ((this.sim.stock.faith || 0) < cost) {
      this.showMessage(`❌ Necesitas ${cost} Fe`);
      return;
    }
    this.sim.divinePower(type);
    this.showMessage(`🙏 Milagro ejecutado`);
  }

  spawnWeapon(weaponId, cost) {
    if ((this.sim.stock.faith || 0) < cost) {
      this.showMessage(`❌ Necesitas ${cost} Fe`);
      return;
    }
    this.sim.stock.faith -= cost;
    const weapon = ContentDB.findById(ContentDB.weapons, weaponId);
    if (weapon) {
      this.sim.spawnWeapon({ def: weapon });
      this.showMessage(`⚔️ ${weapon.name} invocada`);
    }
  }

  invokeCreature(type, cost) {
    if ((this.sim.stock.faith || 0) < cost) {
      this.showMessage(`❌ Necesitas ${cost} Fe`);
      return;
    }
    this.sim.stock.faith -= cost;
    
    if (type === 'dog') {
      this.sim.spawnDog();
      this.showMessage('🐕 Perro invocado');
    } else {
      const animalDef = ContentDB.findById(ContentDB.animals, type);
      if (animalDef) {
        this.sim.spawnAnimal({ def: animalDef });
        this.showMessage(`${animalDef.emoji} ${animalDef.name} invocado`);
      }
    }
  }

  showMessage(msg) {
    console.log('[Poderes]', msg);
    // Mostrar en el HUD de forma simple
    if (this.sim && this.sim.socialEvents) {
      this.sim.socialEvents.push({
        type: 'power',
        emoji: '⚡',
        text: msg,
        t: 0,
        n: { x: this.sim.mapWidth / 2, y: this.sim.mapHeight / 2 }
      });
    }
  }
}
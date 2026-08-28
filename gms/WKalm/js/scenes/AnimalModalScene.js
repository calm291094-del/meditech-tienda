// ============================================================
// ANIMAL MODAL SCENE - Para elegir qué animal spawnear
// ============================================================

class AnimalModalScene extends Phaser.Scene {

  constructor() { super('AnimalModalScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isVisible = false;

    const w = this.scale.width;
    const h = this.scale.height;

    this.bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(1000).setVisible(false).setInteractive();
    this.bg.on('pointerdown', () => this.hide());

    this.panel = this.add.container(w / 2, h / 2);
    this.panel.setVisible(false);
    this.panel.setDepth(1001);

    const panelBg = this.add.rectangle(0, 0, 600, 550, 0x0f172a, 0.98)
      .setStrokeStyle(3, 0x10b981);

    this.titleText = this.add.text(0, -250, '🐾 INVOCAR ANIMAL', {
      fontSize: '22px', color: '#10b981', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.closeBtn = this.add.text(270, -250, '✕', {
      fontSize: '28px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.hide());

    this.contentContainer = this.add.container(0, 0);
    this.panel.add([panelBg, this.titleText, this.closeBtn, this.contentContainer]);

    console.log('[AnimalModalScene] ✓ Inicializada');
  }

  show() {
    if (!this.bg || !this.panel) return;
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

    const animals = ContentDB.animals || [];
    let y = -210;
    let col = 0;

    for (const animal of animals) {
      const x = -250 + col * 180;

      const btn = this.createAnimalButton(x, y, animal);
      this.contentContainer.add(btn);

      col++;
      if (col >= 3) {
        col = 0;
        y += 65;
      }
    }
  }

  createAnimalButton(x, y, animal) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 170, 55, 0x1e293b, 0.95)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });

    const emoji = this.add.text(-70, -10, animal.emoji, { fontSize: '28px' }).setOrigin(0.5);
    const name = this.add.text(-50, 5, animal.name, {
      fontSize: '11px', color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const stats = this.add.text(-50, 18, 
      `HP:${animal.hp} ${animal.hostile ? '⚔️' : '🕊️'}`, {
        fontSize: '9px', color: '#94a3b8'
      }).setOrigin(0, 0.5);

    container.add([bg, emoji, name, stats]);

    bg.on('pointerover', () => bg.setFillStyle(0x10b981, 0.9));
    bg.on('pointerout', () => bg.setFillStyle(0x1e293b, 0.95));
    bg.on('pointerdown', () => {
      this.sim.spawnAnimal({ def: animal });
      console.log(`[Animal] Spawneado: ${animal.name}`);
      this.hide();
    });

    return container;
  }
}
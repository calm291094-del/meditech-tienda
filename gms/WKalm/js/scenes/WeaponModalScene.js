// ============================================================
// WEAPON MODAL SCENE - Para elegir qué arma spawnear
// ============================================================

class WeaponModalScene extends Phaser.Scene {

  constructor() { super('WeaponModalScene'); }

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
      .setStrokeStyle(3, 0xa855f7);

    this.titleText = this.add.text(0, -250, '⚔️ INVOCAR ARMA', {
      fontSize: '22px', color: '#a855f7', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.closeBtn = this.add.text(270, -250, '✕', {
      fontSize: '28px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.hide());

    this.contentContainer = this.add.container(0, 0);
    this.panel.add([panelBg, this.titleText, this.closeBtn, this.contentContainer]);

    console.log('[WeaponModalScene] ✓ Inicializada');
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

    const weapons = ContentDB.weapons || [];
    let y = -210;
    let col = 0;

    for (const weapon of weapons) {
      const x = -250 + col * 180;

      const btn = this.createWeaponButton(x, y, weapon);
      this.contentContainer.add(btn);

      col++;
      if (col >= 3) {
        col = 0;
        y += 65;
      }
    }
  }

  createWeaponButton(x, y, weapon) {
    const container = this.add.container(x, y);

    const bgColor = weapon.divine ? 0x7c2d12 : 0x1e293b;
    const borderColor = weapon.divine ? 0xfbbf24 : 0x475569;

    const bg = this.add.rectangle(0, 0, 170, 55, bgColor, 0.95)
      .setStrokeStyle(1, borderColor)
      .setInteractive({ useHandCursor: true });

    const emoji = this.add.text(-70, -10, weapon.emoji, { fontSize: '28px' }).setOrigin(0.5);
    const name = this.add.text(-50, 5, weapon.name, {
      fontSize: '11px', color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const stats = this.add.text(-50, 18, 
      `DMG:${weapon.damage} R:${weapon.range}`, {
        fontSize: '9px', color: '#94a3b8'
      }).setOrigin(0, 0.5);

    container.add([bg, emoji, name, stats]);

    bg.on('pointerover', () => bg.setFillStyle(weapon.divine ? 0xfbbf24 : 0xa855f7, 0.9));
    bg.on('pointerout', () => bg.setFillStyle(bgColor, 0.95));
    bg.on('pointerdown', () => {
      this.sim.spawnWeapon({ def: weapon });
      console.log(`[Arma] Spawneada: ${weapon.name}`);
      this.hide();
    });

    return container;
  }
}
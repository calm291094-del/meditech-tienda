class AchievementsScene extends Phaser.Scene {

  constructor() { super('AchievementsScene'); }

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

    const panelBg = this.add.rectangle(0, 0, 600, 500, 0x0f172a, 0.98)
      .setStrokeStyle(3, 0xfbbf24);

    this.titleText = this.add.text(0, -230, '🏆 LOGROS', {
      fontSize: '24px', color: '#fbbf24', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.closeBtn = this.add.text(270, -230, '✕', {
      fontSize: '28px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.hide());

    this.contentContainer = this.add.container(0, 0);
    this.panel.add([panelBg, this.titleText, this.closeBtn, this.contentContainer]);

    console.log('[AchievementsScene] ✓ Inicializada correctamente');
  }

  show() {
    if (!this.bg || !this.panel) {
      console.warn('[AchievementsScene] Aún no inicializada');
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

    // Forzar verificación de logros
    if (typeof Achievements !== 'undefined' && Achievements.update) {
      Achievements.update(this.sim);
    }

    const achievements = (typeof Achievements !== 'undefined' && Achievements.getAll) 
      ? Achievements.getAll() 
      : (ContentDB.achievements || []).map(a => ({ ...a, unlocked: false }));

    const progress = (typeof Achievements !== 'undefined' && Achievements.getProgress)
      ? Achievements.getProgress()
      : { unlocked: 0, total: achievements.length, percent: 0 };

    const progressText = this.add.text(0, -195, 
      `Progreso: ${progress.unlocked}/${progress.total} (${progress.percent}%)`, {
        fontSize: '12px', color: '#94a3b8'
      }).setOrigin(0.5);
    this.contentContainer.add(progressText);

    let y = -165;
    for (const ach of achievements) {
      if (y > 220) break;

      const bgColor = ach.unlocked ? 0x10b981 : 0x1e293b;
      const borderColor = ach.unlocked ? 0x10b981 : 0x334155;

      const achBg = this.add.rectangle(0, y, 560, 35, bgColor, 0.9)
        .setStrokeStyle(1, borderColor);

      const emoji = this.add.text(-260, y, ach.emoji || '🏆', {
        fontSize: '18px', alpha: ach.unlocked ? 1 : 0.3
      }).setOrigin(0, 0.5);

      const name = this.add.text(-230, y - 8, ach.name || ach.n, {
        fontSize: '11px', color: ach.unlocked ? '#f8fafc' : '#64748b', fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const desc = this.add.text(-230, y + 8, ach.desc || ach.d || '', {
        fontSize: '9px', color: ach.unlocked ? '#e2e8f0' : '#475569'
      }).setOrigin(0, 0.5);

      const check = this.add.text(260, y, ach.unlocked ? '✓' : '', {
        fontSize: '18px', color: '#10b981', fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      const row = this.add.container(0, 0);
      row.add([achBg, emoji, name, desc, check]);
      this.contentContainer.add(row);

      y += 40;
    }
  }
}
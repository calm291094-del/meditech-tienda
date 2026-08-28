class TechScene extends Phaser.Scene {

  constructor() { super('TechScene'); }

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

    const panelBg = this.add.rectangle(0, 0, 700, 580, 0x0f172a, 0.98)
      .setStrokeStyle(3, 0x3b82f6);

    this.titleText = this.add.text(0, -270, '🔬 INVESTIGACIÓN', {
      fontSize: '24px', color: '#3b82f6', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.closeBtn = this.add.text(320, -270, '✕', {
      fontSize: '28px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.hide());

    this.contentContainer = this.add.container(0, 0);
    this.panel.add([panelBg, this.titleText, this.closeBtn, this.contentContainer]);

    console.log('[TechScene] ✓ Inicializada correctamente');
  }

  show() {
    if (!this.bg || !this.panel) {
      console.warn('[TechScene] Aún no inicializada');
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

    const techs = ContentDB.techs || [];
    let y = -230;

    const eraNames = ['Piedra', 'Agrícola', 'Bronce', 'Hierro', 'Medieval', 'Industrial', 'Moderna', 'Futurista'];

    for (const tech of techs) {
      if (y > 250) break;

      const researched = Tech.researched.has(tech.id);
      const canResearch = Tech.canResearch(tech.id);
      const affordable = (this.sim.stock.knowledge || 0) >= tech.cost;

      const bgColor = researched ? 0x10b981 : (canResearch && affordable ? 0x1e293b : 0x0f172a);
      const borderColor = researched ? 0x10b981 : (canResearch ? 0xfbbf24 : 0x334155);

      const techBg = this.add.rectangle(0, y, 660, 40, bgColor, 0.9)
        .setStrokeStyle(2, borderColor);

      const emoji = this.add.text(-310, y, tech.emoji, { fontSize: '18px' }).setOrigin(0, 0.5);
      const name = this.add.text(-280, y, tech.name, {
        fontSize: '12px', color: '#f8fafc', fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const eraText = this.add.text(-100, y, `[Era ${tech.era}: ${eraNames[tech.era] || '?'}]`, {
        fontSize: '10px', color: '#94a3b8'
      }).setOrigin(0, 0.5);

      let statusText = '';
      let statusColor = '#94a3b8';

      if (researched) {
        statusText = '✓ Investigada';
        statusColor = '#10b981';
      } else if (canResearch && affordable) {
        statusText = `Investigar (${tech.cost} 📖)`;
        statusColor = '#fbbf24';
      } else if (!canResearch) {
        statusText = '🔒 Bloqueada';
        statusColor = '#64748b';
      } else {
        statusText = `Necesitas ${tech.cost} 📖`;
        statusColor = '#ef4444';
      }

      const status = this.add.text(310, y, statusText, {
        fontSize: '11px', color: statusColor, fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      const row = this.add.container(0, 0);
      row.add([techBg, emoji, name, eraText, status]);

      if (canResearch && affordable && !researched) {
        techBg.setInteractive({ useHandCursor: true });
        techBg.on('pointerdown', () => {
          if (Tech.instantResearch(tech.id, this.sim)) {
            this.showMessage(`🔬 ${tech.name} investigada!`);
            this.render();
          }
        });
        techBg.on('pointerover', () => techBg.setFillStyle(0x3b82f6, 0.9));
        techBg.on('pointerout', () => techBg.setFillStyle(bgColor, 0.9));
      }

      this.contentContainer.add(row);
      y += 45;
    }
  }

  showMessage(msg) {
    console.log('[Tech]', msg);
    if (this.sim && this.sim.socialEvents) {
      this.sim.socialEvents.push({
        type: 'tech', emoji: '🔬', text: msg, t: 0,
        n: { x: this.sim.mapWidth / 2, y: this.sim.mapHeight / 2 }
      });
    }
  }
}
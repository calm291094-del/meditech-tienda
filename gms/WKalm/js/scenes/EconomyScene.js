// ============================================================
// ECONOMY SCENE
// Panel visual que muestra todos los negocios activos.
// ============================================================

class EconomyScene extends Phaser.Scene {

  constructor() { super('EconomyScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isVisible = false;

    // Cámara fija
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);

    // Fondo semi-transparente
    this.bg = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      600, 500, 0x0f172a, 0.95
    ).setStrokeStyle(2, 0xfbbf24).setVisible(false).setInteractive();

    this.bg.on('pointerdown', (p) => {
      // Click fuera del panel cierra
      if (Math.abs(p.x - this.scale.width / 2) > 300 || Math.abs(p.y - this.scale.height / 2) > 250) {
        this.hide();
      }
    });

    // Título
    this.title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 220,
      '💰 Economía de Worl Kalm', {
        fontSize: '20px', color: '#fbbf24', fontStyle: 'bold'
      }).setOrigin(0.5).setVisible(false);

    // Texto de negocios
    this.content = this.add.text(this.scale.width / 2 - 270, this.scale.height / 2 - 180,
      '', {
        fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace',
        wordWrap: { width: 540 }, lineSpacing: 6
      }).setVisible(false);

    // Botón cerrar
    this.closeBtn = this.add.text(this.scale.width / 2 + 270, this.scale.height / 2 - 230, '✕', {
      fontSize: '24px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.closeBtn.on('pointerdown', () => this.hide());
  }

  show() {
    this.isVisible = true;
    this.bg.setVisible(true);
    this.title.setVisible(true);
    this.content.setVisible(true);
    this.closeBtn.setVisible(true);
    this.refresh();
  }

  hide() {
    this.isVisible = false;
    this.bg.setVisible(false);
    this.title.setVisible(false);
    this.content.setVisible(false);
    this.closeBtn.setVisible(false);
  }

  refresh() {
    if (!this.isVisible) return;

    let text = '';

    if (Economy.businesses.length === 0) {
      text = 'No hay negocios activos.\n\nConstruye uno desde los botones del HUD.';
    } else {
      for (const biz of Economy.businesses) {
        const employees = biz.employees.map(id => {
          const npc = this.sim.getById(id);
          return npc ? npc.name : '?';
        }).join(', ') || 'Vacante';

        text += `${biz.emoji} ${biz.name} (Nivel ${biz.level})\n`;
        text += `   👤 Dueño: ${biz.ownerName}\n`;
        text += `   👷 Empleados: ${employees}\n`;
        text += `   💰 Oro: ${Math.floor(biz.gold)} | ⭐ Rep: ${Math.floor(biz.reputation)}\n`;
        text += `   📊 Hoy: +${Math.floor(biz.dailyIncome)} / -${Math.floor(biz.dailyExpenses)}\n`;
        text += `   🏆 Total: ${Math.floor(biz.totalProfit)} | 👥 Clientes: ${biz.customersToday}\n`;
        text += `────────────────────────────\n\n`;
      }
    }

    text += `\n💼 Impuestos: ${Math.floor(Economy.taxRate * 100)}% del comercio va al pueblo`;
    
    this.content.setText(text);
  }

  update() {
    if (this.isVisible && this.time.now % 500 < 20) {
      this.refresh();
    }
  }
}
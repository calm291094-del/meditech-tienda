// ============================================================
// HUD SCENE - CORREGIDO (botones funcionales)
// ============================================================

class HUDScene extends Phaser.Scene {

  constructor() { super('HUDScene'); }

  create() {
    this.sim = this.registry.get('sim');
    this.isMobile = this.registry.get('isMobile');
    this.updateTimer = 0;
    this.buttons = [];
    
    this.createLayout();
    this.scale.on('resize', this.handleResize, this);
  }

  handleResize(gameSize) {
    // Reposicionar si es necesario
  }

  createLayout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const isMobile = this.isMobile;
    const pad = isMobile ? 8 : 10;

    // ===== PANEL DE STATS =====
    const statsW = isMobile ? 180 : 240;
    const statsH = isMobile ? 110 : 130;

    this.statsBg = this.add.rectangle(pad, pad, statsW, statsH, 0x0f172a, 0.85)
      .setOrigin(0, 0).setStrokeStyle(1, 0x334155);

    this.statsText = this.add.text(pad + 8, pad + 8, '', {
      fontSize: isMobile ? '10px' : '12px',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      lineSpacing: isMobile ? -2 : 0
    });

    // ===== PANEL DE SELECCIÓN =====
    const selY = pad + statsH + 6;
    this.selectedBg = this.add.rectangle(pad, selY, statsW, 110, 0x0f172a, 0.85)
      .setOrigin(0, 0).setStrokeStyle(1, 0xfbbf24);

    this.selectedText = this.add.text(pad + 8, selY + 8, '', {
      fontSize: isMobile ? '9px' : '11px',
      color: '#fbbf24',
      fontFamily: 'monospace',
      lineSpacing: isMobile ? -2 : 0
    });

    // ===== BOTONES PRINCIPALES =====
    const btnW = isMobile ? 95 : 110;
    const btnH = isMobile ? 28 : 32;
    const btnGap = 4;
    const btnX = w - btnW - pad;

    const buttonDefs = [
      { label: '👤 Crear NPC', action: () => this.scene.get('NpcModalScene').show() },
      { label: '🐾 Animal',    action: () => this.scene.get('AnimalModalScene').show() },
      { label: '⚔️ Arma',      action: () => this.scene.get('WeaponModalScene').show() },
      { label: '⚡ Poderes',   action: () => this.scene.get('PowersScene').show() },
      { label: '🔬 Tech',      action: () => this.scene.get('TechScene').show() },
      { label: '🏆 Logros',    action: () => this.scene.get('AchievementsScene').show() },
      { label: '💰 Economía',  action: () => this.scene.get('EconomyScene').show() },
      { label: '👥 Mover',     action: () => this.moveAllNpcs() }
    ];

    buttonDefs.forEach((def, i) => {
      const y = pad + i * (btnH + btnGap);
      this.addButton(btnX, y, btnW, btnH, def.label, def.action);
    });
  }

  addButton(x, y, w, h, label, callback) {
    const bg = this.add.rectangle(x, y, w, h, 0x1e293b, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x334155)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x + w / 2, y + h / 2, label, {
      fontSize: this.isMobile ? '10px' : '11px',
      color: '#f8fafc',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x10b981, 0.8));
    bg.on('pointerout', () => bg.setFillStyle(0x1e293b, 0.9));
    bg.on('pointerdown', (p) => {
      if (p.event) p.event.stopPropagation();
      try {
        callback();
      } catch (err) {
        console.error('[HUD] Error en botón:', label, err);
      }
    });

    this.buttons.push({ bg, text });
  }

  moveAllNpcs() {
    for (const e of this.sim.entities) {
      if (e.type !== 'npc' || !e.alive) continue;
      const t = Math.random() < 0.5
        ? Navigation.randomPointInside()
        : Navigation.randomPointOutside();
      this.sim.setDestination(e, t.x, t.y);
    }
  }

  update(time, delta) {
    this.updateTimer += delta;
    if (this.updateTimer < 250) return;
    this.updateTimer = 0;

    this.updateStats();
    this.updateSelected();
    this.updateSelectedSkills(); 
  }

updateStats() {
  const s = this.sim;
  const stock = s.stock;
  const bizCount = s.buildings.length;
  const compact = this.isMobile;

  // Hora del día
  const hours = Math.floor(s.timeOfDay * 24);
  const minutes = Math.floor((s.timeOfDay * 24 * 60) % 60);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const timeIcon = s.isNight() ? '🌙' : '☀️';

  // Estación
  const seasons = ['🌸 Primavera', '☀️ Verano', '🍂 Otoño', '❄️ Invierno'];
  const seasonStr = seasons[s.currentSeason];

  // Clima
  const weatherStr = s.getWeatherName ? s.getWeatherName() : '☀️';

  // Luna
  const moonPhases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const moonStr = moonPhases[s.moonPhase || 0];

  // Rivales en guerra
  const warsCount = s.rivals ? s.rivals.filter(r => s.relations[r.id]?.war).length : 0;

  if (compact) {
    this.statsText.setText(
      `${timeIcon} ${timeStr} ${moonStr}\n` +
      `${weatherStr}\n` +
      `📅 D${s.day} ${seasonStr}\n` +
      `👥${s.countType('npc')} 🐾${s.countType('animal')} 🐕${s.countType('dog')}\n` +
      `🏪${bizCount} ⚔️${warsCount} 🌀${s.dungeon?.maxFloor || 1}\n` +
      `🍖${Math.floor(stock.food)} 🪵${Math.floor(stock.wood)} 💰${Math.floor(stock.gold)}`
    );
  } else {
    this.statsText.setText(
      `${timeIcon} ${timeStr}  ${moonStr} Luna\n` +
      `${weatherStr}\n` +
      `${seasonStr}  |  Día ${s.day}\n` +
      `─────────────────\n` +
      `👥 NPCs: ${s.countType('npc')}  |  🐾 Animales: ${s.countType('animal')}\n` +
      `🐕 Perros: ${s.countType('dog')}  |  🏪 Edificios: ${bizCount}\n` +
      `⚔️ Guerras: ${warsCount}  |  🌀 Mazmorra: Piso ${s.dungeon?.maxFloor || 1}\n` +
      `─────────────────\n` +
      `🍖 Comida: ${Math.floor(stock.food)}  |  🪵 Madera: ${Math.floor(stock.wood)}\n` +
      `🪨 Piedra: ${Math.floor(stock.stone)}  |  ⛏️ Mineral: ${Math.floor(stock.ore)}\n` +
      `💰 Oro: ${Math.floor(stock.gold)}  |  ✨ Fe: ${Math.floor(stock.faith)}`
    );
  }
}

  updateSelected() {
    const sel = this.sim.getById(this.sim.selectedId);

    if (!sel) {
      this.selectedText.setText(
        this.isMobile 
          ? 'Toca un NPC\npara ver sus stats'
          : 'Seleccionado: ninguno\n\nHaz click en un NPC\npara ver sus stats'
      );
      return;
    }

    if (sel.type === 'npc') {
      const bars = (v) => {
        const val = Math.max(0, Math.min(100, v || 0));
        const filled = Math.round(val / 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
      };

      this.selectedText.setText(
        `${sel.race?.emoji || '🧑'} ${sel.name}\n` +
        `${sel.profession?.name || '—'} • Nv${sel.level || 1}\n` +
        `❤️${bars(sel.hp)} ${Math.floor(sel.hp || 0)}\n` +
        `🍖${bars(sel.hunger)} ${Math.floor(sel.hunger || 0)}\n` +
        `⚡${bars(sel.energy)} ${Math.floor(sel.energy || 0)}\n` +
        `💬${bars(sel.social)} ${Math.floor(sel.social || 0)}\n` +
        `😊${bars(sel.mood)} ${Math.floor(sel.mood || 0)}`
      );
    } else if (sel.type === 'animal') {
      this.selectedText.setText(
        `${sel.emoji} ${sel.name}\n` +
        `HP: ${Math.floor(sel.hp)}/${sel.def?.hp || '?'}\n` +
        `${sel.hostile ? '⚠️ Hostil' : '🕊️ Pacífico'}`
      );
    } else if (sel.type === 'dog') {
      this.selectedText.setText(
        `${sel.emoji} ${sel.name}\n` +
        `Edad: ${Math.floor(sel.age)} años\n` +
        `HP: ${Math.floor(sel.hp)}\n` +
        `${sel.isPuppy ? '🐶 Cachorro' : '🐕 Adulto'}`
      );
    }
  }

  updateSelectedSkills() {
    const sel = this.sim.getById(this.sim.selectedId);
    if (!sel || sel.type !== 'npc') {
      if (this.skillsText) this.skillsText.setText('');
      return;
    }

    if (!this.skillsText) {
      const selY = this.selectedBg.y + this.selectedBg.height + 10;
      this.skillsBg = this.add.rectangle(10, selY, 240, 120, 0x0f172a, 0.85)
        .setOrigin(0, 0).setStrokeStyle(1, 0x3b82f6);

      this.skillsText = this.add.text(18, selY + 8, '', {
        fontSize: '10px', color: '#3b82f6', fontFamily: 'monospace', lineSpacing: 2
      });
    }

    const skills = sel.skills || {};
    const skillNames = {
      hunting: '🏹 Caza',
      gathering: '🌾 Recolección',
      combat: '⚔️ Combate',
      social: '💬 Social',
      crafting: '🔨 Artesanía',
      building: '🏗️ Construcción'
    };

    let text = `📊 HABILIDADES (Nv ${sel.level || 1})\n`;
    text += `XP: ${Math.floor(sel.experience || 0)}/${(sel.level || 1) * 100}\n`;
    text += `─────────────────\n`;

    for (const [key, name] of Object.entries(skillNames)) {
      const value = Math.floor(skills[key] || 0);
      text += `${name}: ${value}\n`;
    }

    this.skillsText.setText(text);
  }

}
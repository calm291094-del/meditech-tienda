// ============================================================
// NPC MODAL SCENE - Para crear NPCs con nombre personalizado
// ============================================================

class NpcModalScene extends Phaser.Scene {

  constructor() { super('NpcModalScene'); }

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

    const panelBg = this.add.rectangle(0, 0, 500, 450, 0x0f172a, 0.98)
      .setStrokeStyle(3, 0x10b981);

    this.titleText = this.add.text(0, -200, '👤 CREAR NUEVO NPC', {
      fontSize: '22px', color: '#10b981', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.closeBtn = this.add.text(220, -200, '✕', {
      fontSize: '28px', color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.hide());

    // Campos del formulario
    this.formContainer = this.add.container(0, 0);
    this.createForm();

    this.panel.add([panelBg, this.titleText, this.closeBtn, this.formContainer]);

    console.log('[NpcModalScene] ✓ Inicializada correctamente');
  }

  createForm() {
    this.formContainer.removeAll(true);

    // Nombre
    this.nameLabel = this.add.text(-200, -140, 'Nombre:', {
      fontSize: '14px', color: '#e2e8f0'
    }).setOrigin(0, 0.5);
    
    this.nameInput = this.add.rectangle(0, -140, 300, 30, 0x1e293b, 0.95)
      .setStrokeStyle(1, 0x475569)
      .setInteractive();
    
    this.nameText = this.add.text(5, -140, 'Click para escribir...', {
      fontSize: '12px', color: '#94a3b8'
    }).setOrigin(0, 0.5);

    this.nameInput.on('pointerdown', () => {
      const name = prompt('Nombre del NPC:', ContentDB.randomName());
      if (name) {
        this.currentName = name;
        this.nameText.setText(name);
        this.nameText.setColor('#f8fafc');
      }
    });

    // Género
    this.genderLabel = this.add.text(-200, -90, 'Género:', {
      fontSize: '14px', color: '#e2e8f0'
    }).setOrigin(0, 0.5);
    
    this.currentGender = 'M';
    this.genderBtn = this.add.rectangle(0, -90, 300, 30, 0x1e293b, 0.95)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });
    
    this.genderText = this.add.text(0, -90, '👨 Masculino', {
      fontSize: '12px', color: '#f8fafc'
    }).setOrigin(0.5);

    this.genderBtn.on('pointerdown', () => {
      this.currentGender = this.currentGender === 'M' ? 'F' : 'M';
      this.genderText.setText(this.currentGender === 'M' ? '👨 Masculino' : '👩 Femenino');
    });

    // Profesión
    this.profLabel = this.add.text(-200, -40, 'Profesión:', {
      fontSize: '14px', color: '#e2e8f0'
    }).setOrigin(0, 0.5);

    this.currentProfession = ContentDB.randomProfession();
    this.profBtn = this.add.rectangle(0, -40, 300, 30, 0x1e293b, 0.95)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });

    this.profText = this.add.text(0, -40, 
      `${this.currentProfession.emoji} ${this.currentProfession.name}`, {
        fontSize: '12px', color: '#f8fafc'
      }).setOrigin(0.5);

    this.profBtn.on('pointerdown', () => {
      this.currentProfession = ContentDB.randomProfession();
      this.profText.setText(`${this.currentProfession.emoji} ${this.currentProfession.name}`);
    });

    // Raza
    this.raceLabel = this.add.text(-200, 10, 'Raza:', {
      fontSize: '14px', color: '#e2e8f0'
    }).setOrigin(0, 0.5);

    this.currentRace = ContentDB.randomRace();
    this.raceBtn = this.add.rectangle(0, 10, 300, 30, 0x1e293b, 0.95)
      .setStrokeStyle(1, 0x475569)
      .setInteractive({ useHandCursor: true });

    this.raceText = this.add.text(0, 10, 
      `${this.currentRace.emoji} ${this.currentRace.name}`, {
        fontSize: '12px', color: '#f8fafc'
      }).setOrigin(0.5);

    this.raceBtn.on('pointerdown', () => {
      this.currentRace = ContentDB.randomRace();
      this.raceText.setText(`${this.currentRace.emoji} ${this.currentRace.name}`);
    });

    // Botón CREAR
    this.createBtn = this.add.rectangle(0, 100, 300, 45, 0x10b981, 0.95)
      .setStrokeStyle(2, 0x059669)
      .setInteractive({ useHandCursor: true });

    this.createBtnText = this.add.text(0, 100, '✨ CREAR Y ENVIAR AL PUEBLO', {
      fontSize: '14px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.createBtn.on('pointerover', () => this.createBtn.setFillStyle(0x059669, 0.95));
    this.createBtn.on('pointerout', () => this.createBtn.setFillStyle(0x10b981, 0.95));
    this.createBtn.on('pointerdown', () => this.createNpc());

    // Botón CANCELAR
    this.cancelBtn = this.add.rectangle(0, 160, 300, 35, 0x475569, 0.95)
      .setStrokeStyle(1, 0x64748b)
      .setInteractive({ useHandCursor: true });

    this.cancelBtnText = this.add.text(0, 160, 'Cancelar', {
      fontSize: '12px', color: '#e2e8f0'
    }).setOrigin(0.5);

    this.cancelBtn.on('pointerdown', () => this.hide());

    this.formContainer.add([
      this.nameLabel, this.nameInput, this.nameText,
      this.genderLabel, this.genderBtn, this.genderText,
      this.profLabel, this.profBtn, this.profText,
      this.raceLabel, this.raceBtn, this.raceText,
      this.createBtn, this.createBtnText,
      this.cancelBtn, this.cancelBtnText
    ]);

    this.currentName = ContentDB.randomName();
    this.nameText.setText(this.currentName);
    this.nameText.setColor('#f8fafc');
  }

  createNpc() {
    try {
      const npc = this.sim.spawnNpc({
        name: this.currentName || ContentDB.randomName(),
        race: this.currentRace,
        profession: this.currentProfession
      });
      npc.gender = this.currentGender;

      this.sim.socialEvents.push({
        type: 'npc_created',
        emoji: '✨',
        text: `${npc.name} llegó al pueblo`,
        t: 0,
        n: { x: npc.x, y: npc.y }
      });

      console.log(`[NPC] Creado: ${npc.name} (${npc.race.name}, ${npc.profession.name})`);
      this.hide();
    } catch (err) {
      console.error('[NPC] Error al crear:', err);
    }
  }

  show() {
    if (!this.bg || !this.panel) {
      console.warn('[NpcModal] Aún no inicializada');
      return;
    }
    this.isVisible = true;
    this.bg.setVisible(true);
    this.panel.setVisible(true);
    this.createForm(); // Resetear formulario
  }

  hide() {
    this.isVisible = false;
    if (this.bg) this.bg.setVisible(false);
    if (this.panel) this.panel.setVisible(false);
  }
}
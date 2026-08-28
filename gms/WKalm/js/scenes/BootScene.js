class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    Navigation.worldWidth  = MapGenerator.width  * MapGenerator.tileSize;
    Navigation.worldHeight = MapGenerator.height * MapGenerator.tileSize;
    Navigation.center = { x: Navigation.worldWidth / 2, y: Navigation.worldHeight / 2 };

    const sim = new Sim();
    this.registry.set('sim', sim);

    // ✅ IMPORTANTE: Lanzar TODAS las escenas secundarias ANTES de start
    this.scene.launch('MinimapScene');
    this.scene.launch('HUDScene');
    this.scene.launch('EconomyScene');
    this.scene.launch('PowersScene');
    this.scene.launch('TechScene');
    this.scene.launch('AchievementsScene');
    this.scene.launch('NpcModalScene');  // ← NUEVO: modal de crear NPC
    this.scene.launch('AnimalModalScene');
    this.scene.launch('WeaponModalScene');
    // Al final, iniciar la escena principal
    this.scene.start('WorldScene');
  }
}
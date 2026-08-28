// ============================================================
// PANTHEON.JS - Sistema de dioses
// ============================================================

window.Pantheon = {
  activeGods: new Set(),

  activate(godId, sim) {
    const god = ContentDB.findById(ContentDB.pantheon, godId);
    if (!god) return false;
    
    if (this.activeGods.has(godId)) {
      console.warn(`[Pantheon] ${god.name} ya está activo`);
      return false;
    }

    if ((sim.stock.faith || 0) < god.cost) {
      console.warn(`[Pantheon] Necesitas ${god.cost} fe`);
      return false;
    }

    sim.stock.faith -= god.cost;
    this.activeGods.add(godId);

    sim.socialEvents.push({
      type: 'god',
      emoji: god.emoji,
      text: `🏛️ ${god.name} bendice el pueblo`,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });

    console.log(`[Pantheon] ⚡ Activado: ${god.name}`);
    return true;
  },

  isActive(godId) {
    return this.activeGods.has(godId);
  },

  // Bonificaciones basadas en dioses activos
  getMultipliers() {
    const mults = {
      damage: 1, birth: 1, farm: 1, fish: 1, 
      knowledge: 1, construction: 1, hunt: 1, defense: 1
    };

    if (this.isActive('ares')) mults.damage *= 1.5;
    if (this.isActive('aphrodite')) mults.birth *= 2;
    if (this.isActive('demeter')) mults.farm *= 1.8;
    if (this.isActive('poseidon')) mults.fish *= 2;
    if (this.isActive('zeus')) mults.damage *= 1.3;
    if (this.isActive('athena')) mults.knowledge *= 2;
    if (this.isActive('hephaestus')) mults.construction *= 1.6;
    if (this.isActive('artemis')) mults.hunt *= 1.8;

    return mults;
  },

  getDefenseBonus() {
    let bonus = 0;
    if (this.isActive('ares')) bonus += 15;
    if (this.isActive('zeus')) bonus += 10;
    return bonus;
  }
};
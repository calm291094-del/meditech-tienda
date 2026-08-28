// ============================================================
// ACHIEVEMENTS.JS - Sistema de logros
// ============================================================

window.Achievements = {
  unlocked: new Set(),

  definitions: [
    { id: 'first_build', name: 'Constructor', emoji: '🏗️', desc: 'Primer edificio',
      check: (sim) => Economy.businesses.length >= 1 },
    { id: 'pop10', name: 'Pequeña Aldea', emoji: '👥', desc: '10 habitantes',
      check: (sim) => sim.countType('npc') >= 10 },
    { id: 'pop20', name: 'Aldea', emoji: '🏘️', desc: '20 habitantes',
      check: (sim) => sim.countType('npc') >= 20 },
    { id: 'pop50', name: 'Ciudad', emoji: '🏙️', desc: '50 habitantes',
      check: (sim) => sim.countType('npc') >= 50 },
    { id: 'first_puppy', name: 'Vida Canina', emoji: '🐶', desc: 'Primer cachorro',
      check: (sim) => sim.entities.some(e => e.type === 'dog' && e.isPuppy) },
    { id: 'dogs5', name: 'Manada', emoji: '🐕', desc: '5 perros',
      check: (sim) => sim.countType('dog') >= 5 },
    { id: 'dogs10', name: 'Señor de los Perros', emoji: '🐺', desc: '10 perros',
      check: (sim) => sim.countType('dog') >= 10 },
    { id: 'first_marriage', name: 'Amor Verdadero', emoji: '💍', desc: 'Primer matrimonio',
      check: (sim) => sim.getNpcs().some(n => n.spouseId) },
    { id: 'first_birth', name: 'Nueva Vida', emoji: '👶', desc: 'Primer nacimiento',
      check: (sim) => sim.getNpcs().some(n => n.age < 5) },
    { id: 'era1', name: 'Era Agrícola', emoji: '🌾', desc: 'Investiga Agricultura',
      check: (sim) => Tech.researched.has('agriculture') },
    { id: 'era3', name: 'Era del Hierro', emoji: '⚔️', desc: 'Investiga Hierro',
      check: (sim) => Tech.researched.has('iron') },
    { id: 'gods4', name: 'Panteón Menor', emoji: '🏛️', desc: '4 dioses activos',
      check: (sim) => Pantheon.activeGods.size >= 4 },
    { id: 'gods8', name: 'Panteón Completo', emoji: '⚡', desc: '8 dioses activos',
      check: (sim) => Pantheon.activeGods.size >= 8 },
    { id: 'rich', name: 'Riqueza', emoji: '💰', desc: '1000 de oro',
      check: (sim) => (sim.stock.gold || 0) >= 1000 },
    { id: 'faith100', name: 'Devoto', emoji: '🙏', desc: '100 de fe',
      check: (sim) => (sim.stock.faith || 0) >= 100 },
    { id: 'knowledge500', name: 'Sabio', emoji: '📚', desc: '500 conocimiento',
      check: (sim) => (sim.stock.knowledge || 0) >= 500 },
    { id: 'peace', name: 'Diplomático', emoji: '🕊️', desc: 'Alianza con un rival',
      check: (sim) => Diplomacy.getAlliedRivals().length >= 1 },
    { id: 'warlord', name: 'Señor de la Guerra', emoji: '⚔️', desc: 'Gana una guerra',
      check: (sim) => Diplomacy.stats.warsWon >= 1 },
    { id: 'dragon', name: 'Cazador de Dragones', emoji: '🐉', desc: 'Mata un dragón',
      check: (sim) => Diplomacy.stats.dragonsKilled >= 1 },
    { id: 'walls', name: 'Fortaleza', emoji: '🧱', desc: 'Muralla completa',
      check: (sim) => Walls.isComplete && Walls.isComplete() }
  ],

  update(sim) {
    for (const ach of this.definitions) {
      if (this.unlocked.has(ach.id)) continue;
      
      try {
        if (ach.check(sim)) {
          this.unlocked.add(ach.id);
          this.onUnlock(ach, sim);
        }
      } catch (e) {}
    }
  },

  onUnlock(ach, sim) {
    console.log(`[Logro] 🏆 Desbloqueado: ${ach.name}`);
    
    sim.socialEvents.push({
      type: 'achievement',
      emoji: ach.emoji,
      text: `🏆 Logro: ${ach.name}`,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });

    // Recompensa
    sim.addStock('gold', 20);
    sim.addStock('faith', 10);
  },

  isUnlocked(id) {
    return this.unlocked.has(id);
  },

  getAll() {
    return this.definitions.map(d => ({
      ...d,
      unlocked: this.unlocked.has(d.id)
    }));
  },

  getProgress() {
    return {
      unlocked: this.unlocked.size,
      total: this.definitions.length,
      percent: Math.round((this.unlocked.size / this.definitions.length) * 100)
    };
  }
};
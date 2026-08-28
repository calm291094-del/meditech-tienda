// ============================================================
// TECH.JS - Sistema de investigación
// ============================================================

window.Tech = {
  researched: new Set(['huts', 'fire']), // Iniciales
  current: null, // Tecnología en investigación
  progress: 0,

  canResearch(techId) {
    if (this.researched.has(techId)) return false;
    const tech = ContentDB.findById(ContentDB.techs, techId);
    if (!tech) return false;
    
    // Verificar requisitos
    for (const req of (tech.req || [])) {
      if (!this.researched.has(req)) return false;
    }
    
    return true;
  },

  startResearch(techId, sim) {
    if (!this.canResearch(techId)) return false;
    const tech = ContentDB.findById(ContentDB.techs, techId);
    if (!tech) return false;
    
    if ((sim.stock.knowledge || 0) < tech.cost) {
      console.warn(`[Tech] Necesitas ${tech.cost} conocimiento`);
      return false;
    }

    this.current = techId;
    this.progress = 0;
    console.log(`[Tech] Investigando: ${tech.name}`);
    return true;
  },

  instantResearch(techId, sim) {
    if (!this.canResearch(techId)) return false;
    const tech = ContentDB.findById(ContentDB.techs, techId);
    if (!tech) return false;
    
    if ((sim.stock.knowledge || 0) < tech.cost) return false;

    sim.stock.knowledge -= tech.cost;
    this.researched.add(techId);
    
    sim.socialEvents.push({
      type: 'tech',
      emoji: tech.emoji,
      text: `🔬 Investigado: ${tech.name}`,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });

    console.log(`[Tech] ✅ Completado: ${tech.name}`);
    return true;
  },

  update(sim, dt) {
    if (!this.current) return;

    // Avance automático lento basado en NPCs con profesión scholar/mage
    const scholars = sim.getNpcs().filter(n => 
      n.profession?.id === 'scholar' || n.profession?.id === 'mage'
    ).length;

    const baseRate = 0.5 + scholars * 0.3;
    this.progress += baseRate * dt;

    const tech = ContentDB.findById(ContentDB.techs, this.current);
    if (tech && this.progress >= tech.cost) {
      this.researched.add(this.current);
      sim.socialEvents.push({
        type: 'tech',
        emoji: tech.emoji,
        text: `🔬 ¡Investigado: ${tech.name}!`,
        t: 0,
        n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
      });
      this.current = null;
      this.progress = 0;
    }
  },

  getCurrentEra() {
    let maxEra = 0;
    for (const techId of this.researched) {
      const tech = ContentDB.findById(ContentDB.techs, techId);
      if (tech && tech.era > maxEra) maxEra = tech.era;
    }
    return maxEra;
  },

  getEraName() {
    const eras = ContentDB.eras || ['Piedra', 'Agrícola', 'Bronce', 'Hierro', 'Medieval', 'Industrial', 'Moderna', 'Futurista'];
    return eras[this.getCurrentEra()] || 'Piedra';
  },

  getAvailable() {
    return ContentDB.techs.filter(t => this.canResearch(t.id));
  }
};
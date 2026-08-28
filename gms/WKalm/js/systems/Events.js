// ============================================================
// EVENTS.JS - Eventos aleatorios del mundo
// ============================================================

window.Events = {
  timer: 0,
  interval: 120, // segundos reales entre eventos
  lastDay: 0,
  
  definitions: [
    { id: 'good_harvest', name: 'Buena Cosecha', emoji: '🌾', weight: 20, minDay: 3,
      execute: (sim) => { sim.addStock('food', 80); return '🌾 +80 comida por buena cosecha'; } },
    { id: 'drought', name: 'Sequía', emoji: '☀️', weight: 12, minDay: 5,
      execute: (sim) => { sim.stock.food = Math.max(0, sim.stock.food - 40); return '☀️ Sequía: -40 comida'; } },
    { id: 'discovery', name: 'Descubrimiento', emoji: '💡', weight: 25, minDay: 2,
      execute: (sim) => { sim.addStock('knowledge', 40); return '💡 +40 conocimiento'; } },
    { id: 'festival', name: 'Festival', emoji: '🎉', weight: 15, minDay: 5,
      execute: (sim) => {
        sim.getNpcs().forEach(n => {
          n.social = Math.min(100, n.social + 25);
          n.mood = Math.min(100, n.mood + 25);
        });
        return '🎉 Festival: todos más felices';
      } },
    { id: 'migration', name: 'Migración', emoji: '👥', weight: 18, minDay: 3,
      execute: (sim) => {
        const count = Phaser.Math.Between(2, 4);
        for (let i = 0; i < count; i++) sim.spawnNpc();
        return `👥 ${count} nuevos aldeanos llegaron`;
      } },
    { id: 'blessing', name: 'Bendición', emoji: '✨', weight: 15, minDay: 2,
      execute: (sim) => { sim.addStock('faith', 30); return '✨ +30 fe'; } },
    { id: 'plague', name: 'Plaga', emoji: '🤒', weight: 8, minDay: 10,
      execute: (sim) => {
        let affected = 0;
        sim.getNpcs().forEach(n => {
          if (Math.random() < 0.3) { n.hp = Math.max(20, n.hp - 30); affected++; }
        });
        return `🤒 Plaga afectó a ${affected} aldeanos`;
      } },
    { id: 'raid', name: 'Incursión', emoji: '⚔️', weight: 10, minDay: 8,
      execute: (sim) => {
        const loss = Phaser.Math.Between(20, 50);
        sim.stock.food = Math.max(0, sim.stock.food - loss);
        return `⚔️ Incursión enemiga: -${loss} comida`;
      } },
    { id: 'trade_caravan', name: 'Caravana', emoji: '🐫', weight: 15, minDay: 5,
      execute: (sim) => {
        if (sim.stock.wood > 30) {
          sim.stock.wood -= 30;
          sim.addStock('food', 40);
          sim.addStock('gold', 20);
          return '🐫 Caravana: 30🪵 → 40🍖 + 20💰';
        }
        return '🐫 Caravana pasó de largo';
      } },
    { id: 'miracle', name: 'Milagro', emoji: '🙏', weight: 5, minDay: 10,
      execute: (sim) => {
        sim.getNpcs().forEach(n => {
          n.hp = Math.min(100, n.hp + 30);
          n.hunger = Math.min(100, n.hunger + 30);
        });
        return '🙏 Milagro divino: todos curados';
      } },
    { id: 'storm', name: 'Tormenta', emoji: '🌩️', weight: 10, minDay: 4,
      execute: (sim) => {
        sim.stock.wood = Math.max(0, sim.stock.wood - 20);
        return '🌩️ Tormenta: -20 madera';
      } },
    { id: 'treasure', name: 'Tesoro', emoji: '💎', weight: 8, minDay: 7,
      execute: (sim) => {
        sim.addStock('gold', 100);
        sim.addStock('ore', 20);
        return '💎 Tesoro encontrado: +100 oro + 20 mineral';
      } },
    { id: 'inspiration', name: 'Inspiración', emoji: '📜', weight: 12, minDay: 5,
      execute: (sim) => {
        sim.addStock('knowledge', 60);
        return '📜 +60 conocimiento por inspiración';
      } }
  ],

  update(sim, dt) {
    this.timer += dt;
    
    if (this.timer >= this.interval && sim.day > this.lastDay) {
      this.triggerRandom(sim);
      this.timer = 0;
      this.lastDay = sim.day;
    }
  },

  triggerRandom(sim) {
    const available = this.definitions.filter(e => sim.day >= e.minDay);
    if (available.length === 0) return;

    const totalWeight = available.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * totalWeight;
    let chosen = available[0];

    for (const event of available) {
      r -= event.weight;
      if (r <= 0) { chosen = event; break; }
    }

    const message = chosen.execute(sim);
    
    sim.socialEvents.push({
      type: 'event',
      emoji: chosen.emoji,
      text: message,
      t: 0,
      n: { x: sim.mapWidth / 2, y: sim.mapHeight / 2 }
    });

    console.log(`[Evento] ${chosen.name}: ${message}`);
  },

  triggerSpecific(sim, eventId) {
    const event = this.definitions.find(e => e.id === eventId);
    if (event) {
      const message = event.execute(sim);
      console.log(`[Evento forzado] ${event.name}: ${message}`);
    }
  }
};
// ============================================================
// WEATHER.JS - Sistema de clima dinámico
// ============================================================

window.Weather = {
  current: 'sunny',
  timer: 0,
  duration: 600, // 10 minutos reales
  
  types: [
    { id: 'sunny', name: 'Soleado', emoji: '☀️', weight: 40, effect: { farm: 1.0, mood: 1.0 } },
    { id: 'cloudy', name: 'Nublado', emoji: '☁️', weight: 25, effect: { farm: 0.9, mood: 0.95 } },
    { id: 'rain', name: 'Lluvia', emoji: '🌧️', weight: 20, effect: { farm: 1.3, mood: 0.9 } },
    { id: 'storm', name: 'Tormenta', emoji: '⛈️', weight: 10, effect: { farm: 0.5, mood: 0.7 } },
    { id: 'snow', name: 'Nieve', emoji: '❄️', weight: 5, effect: { farm: 0.3, mood: 0.8 } }
  ],

  particles: [],

  init(sim) {
    this.current = 'sunny';
    this.timer = 0;
    this.particles = [];
  },

  update(sim, dt) {
    this.timer += dt;

    // Cambiar clima cada 10 minutos
    if (this.timer >= this.duration) {
      this.timer = 0;
      this.changeWeather();
    }

    // Generar partículas de clima
    this.updateParticles(dt);
  },

  changeWeather() {
    const totalWeight = this.types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    let chosen = this.types[0];

    for (const type of this.types) {
      random -= type.weight;
      if (random <= 0) {
        chosen = type;
        break;
      }
    }

    this.current = chosen.id;
    console.log(`[Clima] Cambió a: ${chosen.name} ${chosen.emoji}`);
  },

  getCurrentType() {
    return this.types.find(t => t.id === this.current) || this.types[0];
  },

  updateParticles(dt) {
    // Limpiar partículas viejas
    this.particles = this.particles.filter(p => {
      p.y += p.speed * dt;
      p.life -= dt;
      return p.life > 0 && p.y < 2000;
    });

    // Generar nuevas partículas según el clima
    if (this.current === 'rain') {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: Phaser.Math.Between(0, 2560),
          y: 0,
          speed: 400,
          life: 3,
          type: 'rain'
        });
      }
    } else if (this.current === 'storm') {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: Phaser.Math.Between(0, 2560),
          y: 0,
          speed: 500,
          life: 2,
          type: 'rain'
        });
      }
    } else if (this.current === 'snow') {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: Phaser.Math.Between(0, 2560),
          y: 0,
          speed: 100,
          life: 8,
          type: 'snow'
        });
      }
    }
  },

  getMultiplier(effectType) {
    const type = this.getCurrentType();
    return type.effect[effectType] || 1.0;
  }
};
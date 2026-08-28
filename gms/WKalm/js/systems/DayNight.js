// ============================================================
// DAYNIGHT.JS - Ciclo día/noche con iluminación
// ============================================================

window.DayNight = {
  timeOfDay: 0.3, // 0 = medianoche, 0.5 = mediodía, 1 = medianoche
  dayLength: 120, // 2 minutos reales = 1 día completo

  init(sim) {
    this.timeOfDay = 0.3;
  },

  update(sim, dt) {
    this.timeOfDay += dt / this.dayLength;
    if (this.timeOfDay >= 1) {
      this.timeOfDay = 0;
    }
  },

  // Obtener intensidad de luz (0 = noche, 1 = día)
  getLightIntensity() {
    // Curva sinusoidal: máximo al mediodía (0.5), mínimo a medianoche (0 y 1)
    return Math.max(0.2, Math.sin(this.timeOfDay * Math.PI));
  },

  // Obtener tinte de color según hora
  getTint() {
    if (this.timeOfDay < 0.25) {
      // Amanecer (6am - 12pm)
      const t = this.timeOfDay / 0.25;
      return {
        r: 255,
        g: Math.floor(180 + t * 75),
        b: Math.floor(100 + t * 155)
      };
    } else if (this.timeOfDay < 0.75) {
      // Día (12pm - 6pm)
      return { r: 255, g: 255, b: 255 };
    } else {
      // Atardecer/Noche (6pm - 6am)
      const t = (this.timeOfDay - 0.75) / 0.25;
      return {
        r: Math.floor(255 - t * 100),
        g: Math.floor(255 - t * 155),
        b: Math.floor(255 - t * 200)
      };
    }
  },

  isNight() {
    return this.timeOfDay < 0.2 || this.timeOfDay > 0.8;
  },

  getTimeString() {
    const hours = Math.floor(this.timeOfDay * 24);
    const minutes = Math.floor((this.timeOfDay * 24 * 60) % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
};
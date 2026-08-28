// ============================================================
// NAVIGATION.JS - Sistema de navegación con cruce de puerta
// ============================================================

window.Navigation = {
  worldWidth: 2560,
  worldHeight: 1920,
  center: { x: 1280, y: 960 },
  wallRadius: 300,
  wallSegments: 16,
  gateIndex: 8,

  _slots: null,
  _gateOpening: null,

  isInside(x, y) {
    const d = Phaser.Math.Distance.Between(x, y, this.center.x, this.center.y);
    return d < this.wallRadius;
  },

  getWallSlots() {
    if (this._slots) return this._slots;
    this._slots = [];
    for (let i = 0; i < this.wallSegments; i++) {
      const angle = (i / this.wallSegments) * Math.PI * 2 - Math.PI / 2;
      this._slots.push({
        x: this.center.x + Math.cos(angle) * this.wallRadius,
        y: this.center.y + Math.sin(angle) * this.wallRadius,
        gate: i === this.gateIndex
      });
    }
    return this._slots;
  },

  getGateOpening() {
    if (this._gateOpening) return this._gateOpening;

    const slots = this.getWallSlots();
    const a = slots[this.gateIndex];
    const b = slots[(this.gateIndex + 1) % slots.length];

    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const dx = mid.x - this.center.x;
    const dy = mid.y - this.center.y;
    const dist = Math.hypot(dx, dy) || 1;

    this._gateOpening = {
      mid,
      inside: {
        x: mid.x - (dx / dist) * 40,
        y: mid.y - (dy / dist) * 40
      },
      outside: {
        x: mid.x + (dx / dist) * 40,
        y: mid.y + (dy / dist) * 40
      }
    };
    return this._gateOpening;
  },

  // Sistema de pathfinding con waypoints para cruzar puerta
  buildPath(from, to) {
    const fromInside = this.isInside(from.x, from.y);
    const toInside = this.isInside(to.x, to.y);

    // Mismo lado: directo
    if (fromInside === toInside) {
      return [{ x: to.x, y: to.y, phase: 'direct' }];
    }

    const gate = this.getGateOpening();

    // Dentro → Fuera
    if (fromInside && !toInside) {
      return [
        { x: gate.inside.x, y: gate.inside.y, phase: 'to_gate_in' },
        { x: gate.mid.x, y: gate.mid.y, phase: 'crossing' },
        { x: gate.outside.x, y: gate.outside.y, phase: 'to_gate_out' },
        { x: to.x, y: to.y, phase: 'direct' }
      ];
    }

    // Fuera → Dentro
    return [
      { x: gate.outside.x, y: gate.outside.y, phase: 'to_gate_out' },
      { x: gate.mid.x, y: gate.mid.y, phase: 'crossing' },
      { x: gate.inside.x, y: gate.inside.y, phase: 'to_gate_in' },
      { x: to.x, y: to.y, phase: 'direct' }
    ];
  },

  randomPointInside() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Phaser.Math.Between(30, this.wallRadius - 40);
    return {
      x: this.center.x + Math.cos(angle) * radius,
      y: this.center.y + Math.sin(angle) * radius
    };
  },

  randomPointOutside() {
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(30, this.worldWidth - 30);
      const y = Phaser.Math.Between(30, this.worldHeight - 30);
      if (!this.isInside(x, y)) {
        return { x, y };
      }
    }
    return { x: this.worldWidth - 40, y: this.worldHeight / 2 };
  }
};
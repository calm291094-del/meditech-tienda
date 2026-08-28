// ============================================================
// WALLS.JS - Sistema de muros con puerta y torres FUNCIONAL
// ============================================================

window.Walls = {
  towers: [],
  _initialized: false,

  initTowers() {
    this.towers = [];
    
    // Forzar inicialización de Navigation si es necesario
    if (!Navigation._slots || Navigation._slots.length === 0) {
      Navigation.getWallSlots();
    }
    
    const gate = Navigation.getGateOpening();
    if (!gate) {
      console.warn('[Walls] No se pudo obtener apertura de puerta');
      return;
    }
    
    const center = Navigation.center;
    const dx = gate.mid.x - center.x;
    const dy = gate.mid.y - center.y;
    const dist = Math.hypot(dx, dy) || 1;
    const perpX = -dy / dist;
    const perpY = dx / dist;

    // Torre izquierda
    this.towers.push({
      id: 'tower_left',
      x: gate.outside.x + perpX * 60,
      y: gate.outside.y + perpY * 60,
      guardId: null
    });

    // Torre derecha
    this.towers.push({
      id: 'tower_right',
      x: gate.outside.x - perpX * 60,
      y: gate.outside.y - perpY * 60,
      guardId: null
    });

    this._initialized = true;
    console.log(`[Walls] ✅ ${this.towers.length} torres creadas`);
  },

  crossesWall(fromX, fromY, toX, toY, entity) {
    const fromInside = Navigation.isInside(fromX, fromY);
    const toInside = Navigation.isInside(toX, toY);

    if (fromInside === toInside) return false;

    // Si la entidad está en fase de cruce, permitir
    if (entity && entity._navPhase) {
      return false;
    }

    const gate = Navigation.getGateOpening();
    if (!gate) return true;

    const crossX = (fromX + toX) / 2;
    const crossY = (fromY + toY) / 2;

    const distToGateMid = Phaser.Math.Distance.Between(crossX, crossY, gate.mid.x, gate.mid.y);
    const distToGateIn = Phaser.Math.Distance.Between(crossX, crossY, gate.inside.x, gate.inside.y);
    const distToGateOut = Phaser.Math.Distance.Between(crossX, crossY, gate.outside.x, gate.outside.y);

    const minDistToGate = Math.min(distToGateMid, distToGateIn, distToGateOut);

    // Permitir cruce si está cerca de la puerta
    if (minDistToGate < 80) return false;

    return true;
  },

  resolveCollision(entity, oldX, oldY, newX, newY) {
    if (entity.type === 'animal') {
      const oldInside = Navigation.isInside(oldX, oldY);
      const newInside = Navigation.isInside(newX, newY);
      if (!oldInside && newInside) {
        return { x: oldX, y: oldY };
      }
    }

    if (!this.crossesWall(oldX, oldY, newX, newY, entity)) {
      return { x: newX, y: newY };
    }
    return { x: oldX, y: oldY };
  }
};
// ============================================================
// WALLS.JS - PERMITE CRUCE POR FASES
// ============================================================

window.Walls = {

  towers: [],

  initTowers() {
    this.towers = [];
    const gate = Navigation.getGateOpening();
    const center = Navigation.center;

    const dx = gate.mid.x - center.x;
    const dy = gate.mid.y - center.y;
    const dist = Math.hypot(dx, dy) || 1;
    const perpX = -dy / dist;
    const perpY = dx / dist;

    this.towers.push({
      id: 'tower_left',
      x: gate.outside.x + perpX * 60,
      y: gate.outside.y + perpY * 60,
      guardId: null
    });

    this.towers.push({
      id: 'tower_right',
      x: gate.outside.x - perpX * 60,
      y: gate.outside.y - perpY * 60,
      guardId: null
    });
  },

  // ✅ Solo bloquea si NO está en fase de cruce
  crossesWall(fromX, fromY, toX, toY, entity) {
    const fromInside = Navigation.isInside(fromX, fromY);
    const toInside = Navigation.isInside(toX, toY);

    if (fromInside === toInside) return false;

    // ✅ Si la entidad está en fase de cruce, permitir
    if (entity && entity._navPhase) {
      return false;
    }

    const gate = Navigation.getGateOpening();
    const crossX = (fromX + toX) / 2;
    const crossY = (fromY + toY) / 2;

    const distToGateMid = Phaser.Math.Distance.Between(crossX, crossY, gate.mid.x, gate.mid.y);
    const distToGateIn = Phaser.Math.Distance.Between(crossX, crossY, gate.inside.x, gate.inside.y);
    const distToGateOut = Phaser.Math.Distance.Between(crossX, crossY, gate.outside.x, gate.outside.y);

    const minDistToGate = Math.min(distToGateMid, distToGateIn, distToGateOut);

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
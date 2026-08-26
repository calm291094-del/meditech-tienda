window.WK = window.WK || {};
WK.Walls = {
    slots: [], center: { x: 0, y: 0 },
    init: function(center) {
        this.slots = [];
        this.center = center || { x: WK.CFG.WW / 2, y: WK.CFG.WH / 2 };
        var N = WK.CFG.WALL_N, R = WK.CFG.WALL_R, gateIdx = Math.floor(N / 2);
        for (var i = 0; i < N; i++) {
            var ang = (i / N) * Math.PI * 2 - Math.PI / 2;
            this.slots.push({ x: this.center.x + Math.cos(ang) * R, y: this.center.y + Math.sin(ang) * R, ang: ang, gate: (i === gateIdx), built: false });
        }
    },
    isInside: function(x, y) { return Math.hypot(x - this.center.x, y - this.center.y) < WK.CFG.WALL_R - 8; },
    isComplete: function() {
        for (var i = 0; i < this.slots.length; i++) if (!this.slots[i].gate && !this.slots[i].built) return false;
        return true;
    },
    countBuilt: function() {
        var n = 0; for (var i = 0; i < this.slots.length; i++) if (this.slots[i].built) n++; return n;
    },
    getGate: function() {
        for (var i = 0; i < this.slots.length; i++) if (this.slots[i].gate) return this.slots[i];
        return this.slots[0];
    },
    segIntersect: function(x1, y1, x2, y2, x3, y3, x4, y4) {
        var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(den) < 0.0001) return false;
        var t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        var u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    },
    crossesWall: function(x1, y1, x2, y2) {
        if (!this.isComplete()) return false;
        for (var i = 0; i < this.slots.length; i++) {
            var s = this.slots[i]; if (s.gate || !s.built) continue;
            var next = this.slots[(i + 1) % this.slots.length];
            if (this.segIntersect(x1, y1, x2, y2, s.x, s.y, next.x, next.y)) return true;
        }
        return false;
    },
    buildNext: function() {
        for (var i = 0; i < this.slots.length; i++) {
            if (!this.slots[i].gate && !this.slots[i].built) { this.slots[i].built = true; return this.slots[i]; }
        }
        return null;
    },
    draw: function(ctx) {
        for (var i = 0; i < this.slots.length; i++) {
            var s = this.slots[i], sx = WK.SX(s.x), sy = WK.SY(s.y);
            if (sx < -50 || sx > window.innerWidth + 50 || sy < -50 || sy > window.innerHeight + 50) continue;
            if (s.gate) {
                ctx.fillStyle = '#8b5cf6'; ctx.fillRect(sx - WK.SZ(10), sy - WK.SZ(14), WK.SZ(20), WK.SZ(28));
                ctx.fillStyle = '#451a03'; ctx.fillRect(sx - WK.SZ(6), sy - WK.SZ(8), WK.SZ(12), WK.SZ(20));
                ctx.font = WK.SZ(14) + 'px serif'; ctx.textAlign = 'center'; ctx.fillText('🚪', sx, sy - WK.SZ(16));
            } else if (s.built) {
                var next = this.slots[(i + 1) % this.slots.length];
                ctx.strokeStyle = '#57534e'; ctx.lineWidth = WK.SZ(10); ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(WK.SX(next.x), WK.SY(next.y)); ctx.stroke();
            } else {
                var next2 = this.slots[(i + 1) % this.slots.length];
                ctx.strokeStyle = 'rgba(120,113,108,0.25)'; ctx.lineWidth = WK.SZ(2); ctx.setLineDash([WK.SZ(4), WK.SZ(4)]);
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(WK.SX(next2.x), WK.SY(next2.y)); ctx.stroke(); ctx.setLineDash([]);
            }
        }
    }
};
console.log('[WK] Muros cargados');
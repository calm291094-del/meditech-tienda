window.WK = window.WK || {};
WK.Map = {
    grid: null, explored: null, miniBase: null, waterSpot: null,
    generate: function() {
        var C = WK.CFG.COLS, R = WK.CFG.ROWS, U = WK.U;
        this.grid = new Uint8Array(C * R); this.explored = new Uint8Array(C * R);
        for (var y = 0; y < R; y++) {
            for (var x = 0; x < C; x++) {
                var e = U.fbm(x * 0.055, y * 0.055), m = U.fbm(x * 0.09 + 137, y * 0.09 + 137);
                var bx = x / C, by = y / R, edge = Math.min(bx, 1 - bx, by, 1 - by), t = 2;
                if (edge < 0.05 + U.h2(x, y) * 0.02) t = 0;
                else if (e < 0.36) t = 0; else if (e < 0.41) t = 1;
                else if (e > 0.74) t = (U.h2(x * 3, y * 3) > 0.78 ? 5 : 4);
                else if (m > 0.58) t = 3;
                this.grid[y * C + x] = t;
            }
        }
        var cx = Math.floor(C / 2), cy = Math.floor(R / 2);
        for (var y2 = cy - 8; y2 <= cy + 8; y2++) {
            for (var x2 = cx - 8; x2 <= cx + 8; x2++) {
                if (Math.hypot(x2 - cx, y2 - cy) <= 8 && y2 >= 0 && y2 < R && x2 >= 0 && x2 < C) this.grid[y2 * C + x2] = 2;
            }
        }
        var best = null, bd = 1e9;
        for (var y3 = 0; y3 < R; y3++) {
            for (var x3 = 0; x3 < C; x3++) {
                if (this.grid[y3 * C + x3] === 0) {
                    var d = Math.hypot(x3 - cx, y3 - cy);
                    if (d < bd) { bd = d; best = { x: x3 * WK.CFG.TILE + 20, y: y3 * WK.CFG.TILE + 20 }; }
                }
            }
        }
        this.waterSpot = best; this.buildMini();
    },
    tileAt: function(x, y) {
        var c = Math.floor(x / WK.CFG.TILE), r = Math.floor(y / WK.CFG.TILE);
        if (c < 0 || r < 0 || c >= WK.CFG.COLS || r >= WK.CFG.ROWS) return 0;
        return this.grid[r * WK.CFG.COLS + c];
    },
    isWater: function(x, y) { return this.tileAt(x, y) === 0; },
    isGrass: function(x, y) { return this.tileAt(x, y) === 2; },
    randomLand: function() {
        for (var i = 0; i < 60; i++) {
            var x = WK.U.rand(60, WK.CFG.WW - 60), y = WK.U.rand(60, WK.CFG.WH - 60);
            var t = this.tileAt(x, y); if (t >= 1 && t <= 3) return { x: x, y: y };
        }
        return { x: WK.CFG.WW / 2, y: WK.CFG.WH / 2 };
    },
    edgeLand: function() {
        for (var i = 0; i < 60; i++) {
            var s = WK.U.ri(0, 4), x, y;
            if (s === 0) { x = WK.U.rand(40, WK.CFG.WW - 40); y = 60; }
            else if (s === 1) { x = WK.U.rand(40, WK.CFG.WW - 40); y = WK.CFG.WH - 60; }
            else if (s === 2) { x = 60; y = WK.U.rand(40, WK.CFG.WH - 40); }
            else { x = WK.CFG.WW - 60; y = WK.U.rand(40, WK.CFG.WH - 40); }
            if (!this.isWater(x, y)) return { x: x, y: y };
        }
        return this.randomLand();
    },
    buildMini: function() {
        this.miniBase = document.createElement('canvas');
        this.miniBase.width = WK.CFG.COLS; this.miniBase.height = WK.CFG.ROWS;
        var mc = this.miniBase.getContext('2d');
        var cols = ['#0c4a6e', '#fde68a', '#15803d', '#14532d', '#57534e', '#78716c'];
        for (var y = 0; y < WK.CFG.ROWS; y++) for (var x = 0; x < WK.CFG.COLS; x++) {
            mc.fillStyle = cols[this.grid[y * WK.CFG.COLS + x]]; mc.fillRect(x, y, 1, 1);
        }
    },
    reveal: function(x, y, r) {
        var c = Math.floor(x / WK.CFG.TILE), ro = Math.floor(y / WK.CFG.TILE);
        for (var dy = -r; dy <= r; dy++) {
            for (var dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    var nx = c + dx, ny = ro + dy;
                    if (nx >= 0 && ny >= 0 && nx < WK.CFG.COLS && ny < WK.CFG.ROWS) this.explored[ny * WK.CFG.COLS + nx] = 1;
                }
            }
        }
    },
    exploredAt: function(x, y) {
        var c = Math.floor(x / WK.CFG.TILE), r = Math.floor(y / WK.CFG.TILE);
        if (c < 0 || r < 0 || c >= WK.CFG.COLS || r >= WK.CFG.ROWS) return false;
        return this.explored[r * WK.CFG.COLS + c] === 1;
    }
};
console.log('[WK] Mapa cargado');
// ═══════════════════════════════════════════════════════════
// 🧮 UTILIDADES Y MATEMÁTICAS
// ═══════════════════════════════════════════════════════════

WK.U = {
    rand: function(a, b) { return Math.random() * (b - a) + a; },
    ri: function(a, b) { return Math.floor(this.rand(a, b)); },
    dist: function(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    clamp: function(v, a, b) { return Math.max(a, Math.min(b, v)); },
    pick: function(a) { return a[this.ri(0, a.length)]; },
    uid: function() { return Math.random().toString(36).substr(2, 9); },
    
    h2: function(x, y) {
        var n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
        n = Math.imul(n ^ (n >>> 13), 1274126177);
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    },
    
    sn: function(x, y) {
        var xi = Math.floor(x), yi = Math.floor(y);
        var xf = x - xi, yf = y - yi;
        xf = xf * xf * (3 - 2 * xf);
        yf = yf * yf * (3 - 2 * yf);
        var a = this.h2(xi, yi), b = this.h2(xi + 1, yi);
        var c = this.h2(xi, yi + 1), d = this.h2(xi + 1, yi + 1);
        return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    },
    
    fbm: function(x, y) {
        var t = 0, amp = 1, f = 1, tot = 0;
        for (var i = 0; i < 4; i++) {
            t += this.sn(x * f, y * f) * amp;
            tot += amp;
            amp *= 0.5;
            f *= 2;
        }
        return t / tot;
    }
};

console.log('[WK] Utilidades cargadas');
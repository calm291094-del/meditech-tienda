window.WK = window.WK || {};
WK.Cam = {
    x: 0, y: 0, zoom: 1, keys: {}, mx: -100, my: -100, drag: false, moved: 0,
    clamp: function() {
        var W = window.innerWidth, H = window.innerHeight;
        this.x = WK.U.clamp(this.x, 0, Math.max(0, WK.CFG.WW - W / this.zoom));
        this.y = WK.U.clamp(this.y, 0, Math.max(0, WK.CFG.WH - H / this.zoom));
    },
    centerOn: function(x, y) {
        this.x = x - (window.innerWidth / this.zoom) / 2;
        this.y = y - (window.innerHeight / this.zoom) / 2;
        this.clamp();
    },
    setZoom: function(nz) {
        nz = WK.U.clamp(nz, 0.4, 3);
        var cx = this.x + (window.innerWidth / this.zoom) / 2, cy = this.y + (window.innerHeight / this.zoom) / 2;
        this.zoom = nz;
        this.x = cx - (window.innerWidth / nz) / 2; this.y = cy - (window.innerHeight / nz) / 2;
        this.clamp();
    },
    zoomBy: function(f) { this.setZoom(this.zoom * f); },
    toWorld: function(sx, sy) { return { x: sx / this.zoom + this.x, y: sy / this.zoom + this.y }; },
    update: function() {
        var sp = 16 / this.zoom;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.x -= sp;
        if (this.keys['ArrowRight'] || this.keys['d']) this.x += sp;
        if (this.keys['ArrowUp'] || this.keys['w']) this.y -= sp;
        if (this.keys['ArrowDown'] || this.keys['s']) this.y += sp;
        this.clamp();
    }
};
WK.SX = function(x) { return (x - WK.Cam.x) * WK.Cam.zoom; };
WK.SY = function(y) { return (y - WK.Cam.y) * WK.Cam.zoom; };
WK.SZ = function(v) { return v * WK.Cam.zoom; };
console.log('[WK] Cámara cargada');
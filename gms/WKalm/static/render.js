window.WK = window.WK || {};

WK.Render = {
    canvas: null, ctx: null, mini: null, miniCtx: null,
    init: function() {
        this.canvas = document.getElementById('gc');
        this.ctx = this.canvas.getContext('2d');
        this.mini = document.getElementById('mm');
        this.miniCtx = this.mini.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
        console.log('[WK] Render System cargado correctamente');
    },
    resize: function() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    draw: function() {
        var G = WK.Game, ctx = this.ctx, W = window.innerWidth, H = window.innerHeight, z = WK.Cam.zoom;
        if (!G || !G.running) return;
        
        var nf = 0;
        if (G.timeOfDay > 0.75) nf = (G.timeOfDay - 0.75) * 4;
        else if (G.timeOfDay < 0.25) nf = (0.25 - G.timeOfDay) * 4;
        
        ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, 0, W, H);
        ctx.save();
        
        if (G.shake > 0) { ctx.translate(WK.U.rand(-G.shake, G.shake) * 0.4, WK.U.rand(-G.shake, G.shake) * 0.4); G.shake--; }
        
        var cols = ['#155e8a', '#fde68a', G.currentSeason === 3 ? '#94a3b8' : (G.currentSeason === 2 ? '#a16207' : (G.currentSeason === 0 ? '#4ade80' : '#2f9e44')), '#1b4332', '#57534e', '#78716c'];
        var viewW = W / z, viewH = H / z;
        var c0 = Math.max(0, Math.floor(WK.Cam.x / WK.CFG.TILE)), r0 = Math.max(0, Math.floor(WK.Cam.y / WK.CFG.TILE));
        var c1 = Math.min(WK.CFG.COLS - 1, Math.ceil((WK.Cam.x + viewW) / WK.CFG.TILE)), r1 = Math.min(WK.CFG.ROWS - 1, Math.ceil((WK.Cam.y + viewH) / WK.CFG.TILE));
        
        for (var r = r0; r <= r1; r++) {
            for (var c = c0; c <= c1; c++) {
                var tile = WK.Map.grid[r * WK.CFG.COLS + c];
                var sx = WK.SX(c * WK.CFG.TILE), sy = WK.SY(r * WK.CFG.TILE), tsz = WK.CFG.TILE * z + 1;
                ctx.fillStyle = cols[tile]; ctx.fillRect(sx, sy, tsz, tsz);
                if (WK.Map.explored[r * WK.CFG.COLS + c] === 0) { ctx.fillStyle = '#050810'; ctx.fillRect(sx, sy, tsz, tsz); }
            }
        }
        
        for (var i = 0; i < G.resources.length; i++) { var rr = G.resources[i]; if (WK.Map.exploredAt(rr.x, rr.y)) this.drawResource(rr); }
        for (var j = 0; j < G.buildings.length; j++) { var bb = G.buildings[j]; if (WK.Map.exploredAt(bb.x, bb.y)) this.drawBuilding(bb); }
        
        if (WK.Walls) WK.Walls.draw(ctx);
        
        for (var k = 0; k < G.animals.length; k++) { var aa = G.animals[k]; if (aa.alive && WK.Map.exploredAt(aa.x, aa.y)) this.drawAnimal(aa); }
        for (var l = 0; l < G.dogs.length; l++) this.drawDog(G.dogs[l]);
        for (var m = 0; m < G.villagers.length; m++) this.drawVillager(G.villagers[m]);
        
        if (G.weather === 'rain') {
            ctx.strokeStyle = 'rgba(147,197,253,.4)'; ctx.lineWidth = 1;
            for (var q = 0; q < 60; q++) { var rx = WK.U.rand(0, W), ry = WK.U.rand(0, H); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 14); ctx.stroke(); }
        }
        if (nf > 0) { ctx.fillStyle = 'rgba(2,6,23,' + (nf * 0.62) + ')'; ctx.fillRect(0, 0, W, H); }
        
        ctx.restore(); 
        this.drawMinimap();
    },
    drawResource: function(r) {
        if (r.amount <= 0 && r.type !== 'tool') return;
        var ctx = this.ctx, sx = WK.SX(r.x), sy = WK.SY(r.y);
        if (r.type === 'wood') { ctx.fillStyle = '#78350f'; ctx.fillRect(sx - WK.SZ(3), sy - WK.SZ(5), WK.SZ(6), WK.SZ(15)); ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(sx, sy - WK.SZ(14), WK.SZ(14), 0, Math.PI * 2); ctx.fill(); }
        else if (r.type === 'stone') { ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(sx, sy, WK.SZ(11), 0, Math.PI * 2); ctx.fill(); }
        else if (r.type === 'berry') { ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(sx, sy - WK.SZ(5), WK.SZ(9), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(sx - WK.SZ(4), sy - WK.SZ(6), WK.SZ(2.5), 0, Math.PI * 2); ctx.fill(); }
        else if (r.type === 'tool') { ctx.font = WK.SZ(22) + 'px serif'; ctx.textAlign = 'center'; ctx.fillText(r.toolData.e, sx, sy + WK.SZ(8)); }
    },
    drawBuilding: function(b) {
        var ctx = this.ctx, sx = WK.SX(b.x), sy = WK.SY(b.y);
        ctx.font = WK.SZ(20) + 'px serif'; ctx.textAlign = 'center'; ctx.fillText(b.def.e, sx, sy - (b.def.cap > 0 ? WK.SZ(34) : WK.SZ(6)));
    },
    drawAnimal: function(a) {
        var ctx = this.ctx, sx = WK.SX(a.x), sy = WK.SY(a.y);
        ctx.font = WK.SZ(20) + 'px serif'; ctx.textAlign = 'center'; ctx.fillText(a.data.e, sx, sy);
    },
    drawDog: function(d) {
        if (!d.alive) return;
        var ctx = this.ctx, sx = WK.SX(d.x), sy = WK.SY(d.y), s = d.isPuppy ? 0.6 : 1;
        ctx.font = WK.SZ(18) * s + 'px serif'; ctx.textAlign = 'center'; ctx.save();
        if (d.facing < 0) { ctx.translate(sx, sy); ctx.scale(-1, 1); ctx.fillText(d.emoji, 0, 0); }
        else ctx.fillText(d.emoji, sx, sy);
        ctx.restore(); ctx.font = WK.SZ(7) + 'px sans-serif'; ctx.fillStyle = d.isPuppy ? '#fbbf24' : '#93c5fd'; ctx.fillText(d.name, sx, sy + WK.SZ(14) * s);
    },
    drawVillager: function(v) {
        if (!v.alive) return;
        var ctx = this.ctx, sx = WK.SX(v.x), sy = WK.SY(v.y), cs = v.isChild ? 0.65 : 1;
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, sy + WK.SZ(3), WK.SZ(6), WK.SZ(3), 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e293b'; ctx.fillRect(sx - WK.SZ(3) * cs, sy - WK.SZ(2), WK.SZ(2) * cs, WK.SZ(6) * cs); ctx.fillRect(sx + WK.SZ(1) * cs, sy - WK.SZ(2), WK.SZ(2) * cs, WK.SZ(6) * cs);
        ctx.fillStyle = v.shirtColor; ctx.fillRect(sx - WK.SZ(4) * cs, sy - WK.SZ(10) * cs, WK.SZ(8) * cs, WK.SZ(10) * cs);
        ctx.fillStyle = v.skinColor; ctx.beginPath(); ctx.arc(sx, sy - WK.SZ(14) * cs, WK.SZ(4) * cs, 0, Math.PI * 2); ctx.fill();
        if (v.isChief) { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(sx - WK.SZ(4), sy - WK.SZ(18) * cs); ctx.lineTo(sx - WK.SZ(2), sy - WK.SZ(22) * cs); ctx.lineTo(sx, sy - WK.SZ(19) * cs); ctx.lineTo(sx + WK.SZ(2), sy - WK.SZ(22) * cs); ctx.lineTo(sx + WK.SZ(4), sy - WK.SZ(18) * cs); ctx.fill(); }
        if (v.pathToGate) { ctx.font = WK.SZ(9) + 'px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fbbf24'; ctx.fillText('🚪', sx, sy - WK.SZ(20) * cs); }
    },
    drawMinimap: function() {
        var G = WK.Game, mc = this.miniCtx; mc.clearRect(0, 0, 110, 80); mc.drawImage(WK.Map.miniBase, 0, 0);
        mc.fillStyle = 'rgba(0,0,0,.75)';
        for (var mr = 0; mr < WK.CFG.ROWS; mr += 2) for (var mc2 = 0; mc2 < WK.CFG.COLS; mc2 += 2) if (WK.Map.explored[mr * WK.CFG.COLS + mc2] === 0) mc.fillRect(mc2, mr, 2, 2);
        mc.fillStyle = '#4ade80'; for (var i = 0; i < G.villagers.length; i++) mc.fillRect(G.villagers[i].x / WK.CFG.TILE, G.villagers[i].y / WK.CFG.TILE, 1.5, 1.5);
        mc.fillStyle = '#fbbf24'; for (var b = 0; b < G.buildings.length; b++) mc.fillRect(G.buildings[b].x / WK.CFG.TILE, G.buildings[b].y / WK.CFG.TILE, 2, 2);
        mc.strokeStyle = '#fff'; mc.lineWidth = 0.6;
        mc.strokeRect(WK.Cam.x / WK.CFG.TILE, WK.Cam.y / WK.CFG.TILE, (window.innerWidth / WK.Cam.zoom) / WK.CFG.TILE, (window.innerHeight / WK.Cam.zoom) / WK.CFG.TILE);
    }
};
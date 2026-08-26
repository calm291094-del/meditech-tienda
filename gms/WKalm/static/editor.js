window.WK = window.WK || {};
WK.MapEditor = {
    active: false, tool: 'grass',
    tools: [{ id: 'grass', name: 'Hierba', emoji: '🟩' }, { id: 'water', name: 'Agua', emoji: '🟦' }, { id: 'forest', name: 'Bosque', emoji: '🌲' }, { id: 'stone', name: 'Piedra', emoji: '🪨' }],
    activate: function() {
        this.active = true; this.tool = 'grass'; if (WK.Game) WK.Game.paused = true;
        if (WK.UI) WK.UI.banner('🗺️ Modo Editor activo', 'magic'); this.renderToolbar();
    },
    deactivate: function() {
        this.active = false; if (WK.Game) WK.Game.paused = false;
        var toolbar = document.getElementById('mapEditorToolbar'); if (toolbar) toolbar.remove();
    },
    renderToolbar: function() {
        var existing = document.getElementById('mapEditorToolbar'); if (existing) existing.remove();
        var toolbar = document.createElement('div'); toolbar.id = 'mapEditorToolbar';
        toolbar.style.cssText = 'position:fixed;top:60px;right:320px;z-index:100;background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:5px;';
        var html = '<div style="width:100%;font-size:.75rem;font-weight:bold;margin-bottom:5px;">🗺️ Editor</div>';
        for (var i = 0; i < this.tools.length; i++) {
            var t = this.tools[i];
            html += '<button style="padding:5px;border:1px solid var(--border);border-radius:5px;background:' + (this.tool === t.id ? 'var(--ac)' : 'rgba(255,255,255,.05)') + ';color:white;cursor:pointer;font-size:.65rem" data-tool="' + t.id + '">' + t.emoji + ' ' + t.name + '</button>';
        }
        html += '<button style="width:100%;padding:5px;margin-top:5px;border:1px solid var(--danger);border-radius:5px;background:rgba(239,68,68,.2);color:var(--danger);cursor:pointer;font-size:.65rem" onclick="WK.MapEditor.deactivate()">❌ Cerrar</button>';
        toolbar.innerHTML = html; document.body.appendChild(toolbar);
        var toolBtns = toolbar.querySelectorAll('[data-tool]');
        for (var i = 0; i < toolBtns.length; i++) {
            toolBtns[i].onclick = function() { WK.MapEditor.tool = this.getAttribute('data-tool'); WK.MapEditor.renderToolbar(); };
        }
    },
    paint: function(x, y) {
        if (!this.active || !WK.Map) return;
        var tileX = Math.floor(x / WK.CFG.TILE), tileY = Math.floor(y / WK.CFG.TILE);
        if (tileX < 0 || tileX >= WK.CFG.COLS || tileY < 0 || tileY >= WK.CFG.ROWS) return;
        var tileIndex = tileY * WK.CFG.COLS + tileX;
        if (this.tool === 'grass') WK.Map.grid[tileIndex] = 2;
        else if (this.tool === 'water') WK.Map.grid[tileIndex] = 0;
        else if (this.tool === 'forest') WK.Map.grid[tileIndex] = 3;
        else if (this.tool === 'stone') WK.Map.grid[tileIndex] = 4;
    }
};
console.log('[WK] Editor cargado');
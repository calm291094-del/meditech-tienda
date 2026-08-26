window.WK = window.WK || {};
WK.WeatherManager = {
    current: 'sunny', duration: 0,
    update: function() {
        var G = WK.Game; this.duration--;
        if (this.duration <= 0) { this.current = WK.U.pick(['sunny', 'rain', 'storm']); this.duration = WK.U.ri(300, 800); }
        if (G) G.weather = this.current;
    }
};
WK.QuestManager = {
    active: ['q_pop_20', 'q_build_5'], completed: [],
    pool: [{ id: 'q_pop_20', title: '👥 Crecimiento', desc: 'Alcanza 20 habitantes', type: 'population', goal: 20 }, { id: 'q_build_5', title: '🏗️ Constructor', desc: 'Construye 5 edificios', type: 'buildings', goal: 5 }],
    update: function() {
        var G = WK.Game;
        for (var i = this.active.length - 1; i >= 0; i--) {
            var q = this.pool.find(function(q) { return q.id === this.active[i]; }.bind(this));
            if (!q) { this.active.splice(i, 1); continue; }
            var done = (q.type === 'population' && G.villagers.length >= q.goal) || (q.type === 'buildings' && G.buildings.length >= q.goal);
            if (done) { this.completed.push(q.id); this.active.splice(i, 1); if (G) G.log('🏆 Misión completada: ' + q.title, 'gold'); }
        }
    }
};
WK.DiplomacyManager = {
    relations: {},
    init: function() { if (WK.Game) { for (var i = 0; i < WK.Game.rivals.length; i++) this.relations[WK.Game.rivals[i].id] = { type: 'peace', respect: 50 }; } },
    update: function() {}
};
console.log('[WK] Managers cargados');
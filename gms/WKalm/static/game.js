window.WK = window.WK || {};

WK.Game = {
    profile: null, running: false, paused: false, speed: 1,
    time: 0, timeOfDay: 0.3, day: 1, weather: 'sunny', era: 0, currentSeason: 0, seasonTimer: 0,
    villagers: [], dogs: [], animals: [], resources: [], buildings: [], projectiles: [], caravans: [], rivals: [], warParties: [],
    techs: { huts: 1 }, activeGods: {},
    stock: { food: 60, wood: 30, stone: 0, ore: 0, gold: 0, faith: 0, knowledge: 30 },
    chiefOrder: null, chiefThinkTimer: 0, plagueTimer: 0, birthBoost: 0, shake: 0,
    lastCaravanDay: 0, caravanInterval: 4, logs: [], achievements: {}, deadVillagers: [], villageStart: { x: 0, y: 0 }, autoSaveTimer: 0,

    init: function(profile) {
        this.profile = profile; 
        this.reset(); 
        WK.Map.generate();
        
        var cx = WK.CFG.WW / 2, cy = WK.CFG.WH / 2; 
        this.villageStart = { x: cx, y: cy };
        WK.Walls.init();
        
        var roster = [
            {n:'Kael',g:'M',p:'warrior',age:28}, {n:'Borin',g:'M',p:'worker',age:32},
            {n:'Darian',g:'M',p:'wise',age:58}, {n:'Tarek',g:'M',p:'explorer',age:24},
            {n:'Oren',g:'M',p:'merchant',age:30}, {n:'Lyra',g:'F',p:'pious',age:26},
            {n:'Aria',g:'F',p:'farmer',age:27}, {n:'Selene',g:'F',p:'social',age:25},
            {n:'Mira',g:'F',p:'worker',age:29}, {n:'Nadia',g:'F',p:'wise',age:31}
        ];
        for (var i = 0; i < roster.length; i++) {
            var r = roster[i], pers = WK.D.PERS.find(function(p) { return p.id === r.p; });
            this.villagers.push(new WK.Villager(cx + WK.U.rand(-90, 90), cy + WK.U.rand(-90, 90), r.age, { name: r.n, gender: r.g, pers: pers }));
        }
        this.assignChief();
        
        var dogRoster = [{n:'Rex',e:'🐕',g:'M'},{n:'Max',e:'🐕‍🦺',g:'M'},{n:'Luna',e:'🐩',g:'F'},{n:'Rocky',e:'🦮',g:'F'}];
        for (var d = 0; d < dogRoster.length; d++) { 
            var dr = dogRoster[d]; 
            this.dogs.push(new WK.Dog(cx + WK.U.rand(-60, 60), cy + WK.U.rand(-60, 60), dr.n, dr.e, dr.g, false)); 
        }
        
        var hutDef = WK.D.BUILDINGS.find(function(b) { return b.id === 'hut'; });
        var hut = new WK.Building(cx, cy, hutDef); 
        hut.occIds = [this.villagers[0].id, this.villagers[1].id]; 
        this.buildings.push(hut);
        
        var diff = WK.CFG.DIFF[profile.difficulty || 'normal'];
        for (var i2 = 0; i2 < 420 * diff.r; i2++) {
            var p = WK.Map.randomLand(), t = WK.Map.tileAt(p.x, p.y);
            if (t === 3 && Math.random() < 0.8) this.resources.push(new WK.Resource(p.x, p.y, 'wood'));
            else if (t === 2 && Math.random() < 0.5) this.resources.push(new WK.Resource(p.x, p.y, Math.random() < 0.5 ? 'wood' : 'berry'));
        }
        for (var i3 = 0; i3 < 160 * diff.r; i3++) {
            var p2 = WK.Map.randomLand(), t2 = WK.Map.tileAt(p2.x, p2.y);
            if (t2 === 4) this.resources.push(new WK.Resource(p2.x, p2.y, 'stone'));
            else if (t2 === 5) this.resources.push(new WK.Resource(p2.x, p2.y, 'ore'));
        }
        for (var i4 = 0; i4 < 30; i4++) this.spawnAnimal();
        
        WK.Map.reveal(cx, cy, 9); 
        WK.Cam.centerOn(cx, cy);
        this.log('🌅 ' + profile.name + ' desciende', 'gold');
        this.running = true;
    },

    reset: function() {
        this.time = 0; this.timeOfDay = 0.3; this.day = 1; this.weather = 'sunny'; this.era = 0; this.currentSeason = 0; this.seasonTimer = 0;
        this.villagers = []; this.dogs = []; this.animals = []; this.resources = []; this.buildings = []; this.projectiles = []; this.caravans = []; this.rivals = []; this.warParties = [];
        this.techs = { huts: 1 }; this.activeGods = {}; 
        this.stock = { food: 60, wood: 30, stone: 0, ore: 0, gold: 0, faith: 0, knowledge: 30 };
        this.chiefOrder = null; this.plagueTimer = 0; this.birthBoost = 0; this.shake = 0; this.logs = []; 
        this.achievements = this.profile ? (this.profile.achievements || {}) : {}; 
        this.deadVillagers = [];
    },

    villageCenter: function() {
        var camp = this.nearestBuilding('campfire');
        if (camp) return { x: camp.x, y: camp.y };
        if (this.buildings.length > 0) return { x: this.buildings[0].x, y: this.buildings[0].y };
        return this.villageStart;
    },

    nearestBuilding: function(id) { 
        for (var i = 0; i < this.buildings.length; i++) {
            if (this.buildings[i].def.id === id) return this.buildings[i]; 
        }
        return null; 
    },

    hasBuilding: function(id) { return !!this.nearestBuilding(id); },

    assignHomeless: function() {
        for (var i = 0; i < this.villagers.length; i++) {
            var v = this.villagers[i], has = false;
            for (var b = 0; b < this.buildings.length; b++) {
                if (this.buildings[b].def.cap > 0 && this.buildings[b].occIds.indexOf(v.id) >= 0) { has = true; break; }
            }
            if (has) continue;
            for (var j = 0; j < this.buildings.length; j++) { 
                var bd = this.buildings[j]; 
                if (bd.def.cap > 0 && bd.occIds.length < bd.def.cap) { 
                    bd.occIds.push(v.id); 
                    break; 
                } 
            }
        }
    },

    assignChief: function() {
        var adults = this.villagers.filter(function(v) { return !v.isChild && v.alive; });
        if (adults.length === 0) return;
        for (var i = 0; i < this.villagers.length; i++) this.villagers[i].isChief = false;
        var oldest = adults.reduce(function(p, c) { return p.age > c.age ? p : c; });
        oldest.isChief = true;
    },

    getChief: function() { 
        for (var i = 0; i < this.villagers.length; i++) {
            if (this.villagers[i].isChief && this.villagers[i].alive) return this.villagers[i]; 
        }
        return null; 
    },

    log: function(msg, type) { 
        this.logs.unshift({ msg: msg, type: type || '', time: 'Día ' + this.day }); 
        if (this.logs.length > 60) this.logs.pop(); 
        if (WK.UI) WK.UI.renderLogs(); 
    },

    spawnAnimal: function(forced) {
        var pool = WK.D.ANIMALS.filter(function(a) { return a.era <= this.era; }.bind(this));
        var def = forced || WK.U.pick(pool);
        var pos = def.w ? { x: WK.U.rand(60, WK.CFG.WW - 60), y: WK.U.rand(60, WK.CFG.WH - 60) } : WK.Map.randomLand();
        this.animals.push(new WK.Animal(pos.x, pos.y, def));
    },

    updateSeason: function() {
        this.seasonTimer++;
        if (this.seasonTimer >= WK.CFG.SEASON_LEN) {
            this.seasonTimer = 0; 
            this.currentSeason = (this.currentSeason + 1) % 4;
            var s = WK.CFG.SEASONS[this.currentSeason];
            this.log(s.e + ' ' + s.n, 'evolve'); 
            if (WK.UI) WK.UI.banner(s.e + ' ' + s.n + '!', 'gold');
        }
    },

    update: function() {
        if (!this.running || this.paused) return;
        
        this.time += WK.CFG.TICK * this.speed; 
        this.timeOfDay = (this.time % WK.CFG.DAY) / WK.CFG.DAY;
        
        if (this.time % WK.CFG.DAY < WK.CFG.TICK) { 
            this.day++; 
            if (this.weather === 'rain' && Math.random() < 0.5) this.weather = 'sunny'; 
        }
        
        this.updateSeason();
        WK.Cam.update();
        
        this.autoSaveTimer += WK.CFG.TICK * this.speed;
        if (this.autoSaveTimer > 60000) { 
            this.autoSaveTimer = 0; 
            if (WK.Save) WK.Save.save(true); 
        }
        
        var i;
        for (i = 0; i < this.villagers.length; i++) this.updateVillager(this.villagers[i]);
        for (i = 0; i < this.dogs.length; i++) this.dogs[i].update();
        for (i = 0; i < this.animals.length; i++) this.animals[i].update();
        for (i = 0; i < this.resources.length; i++) this.resources[i].update();
        
        this.villagers = this.villagers.filter(function(v) { return v.alive; });
        this.dogs = this.dogs.filter(function(d) { return d.alive; });
        this.animals = this.animals.filter(function(a) { return a.alive; });
        this.resources = this.resources.filter(function(r) { return r.alive; });
        
        if (this.villagers.length === 0) { 
            this.log('☠️ Tu aldea ha perecido', 'death'); 
            this.paused = true; 
            if (WK.UI) WK.UI.banner('☠️ Fin del juego', 'danger'); 
        }
        
        if (this.animals.length < 40 && Math.random() < 0.02) this.spawnAnimal();
        if (WK.UI) WK.UI.updateHUD();
    },

    updateVillager: function(v) {
        if (!v.alive) return;
        v.age += WK.CFG.AGING;
        
        if (v.age >= v.maxAge) { 
            v.alive = false; 
            this.log('💀 ' + v.name + ' murió de vejez', 'death'); 
            return; 
        }
        
        if (!v.isChild) { v.hunger -= 0.0038; v.energy -= 0.0025; }
        v.social -= 0.0015;
        
        if (v.hunger < 30 || v.energy < 25) v.mood -= 0.003;
        else if (v.social > 60 && v.hunger > 60) v.mood = Math.min(100, v.mood + 0.012);
        
        if (v.hunger <= 0) v.hp -= 0.15;
        if (v.hp <= 0) { 
            v.alive = false; 
            this.log('💀 ' + v.name + ' murió de hambre', 'death'); 
            return; 
        }
        
        if (WK.Map) WK.Map.reveal(v.x, v.y, v.isChild ? 2 : 3);
        v.timer--;
        
        if (v.timer <= 0 || !v.target || (v.target instanceof WK.Entity && !v.target.alive)) {
            this.decideVillager(v);
        }
        this.actVillager(v);
        v.update();
    },

    decideVillager: function(v) {
        var S = this.stock, T = this.techs;
        var threat = null, td = 150;
        
        for (var i = 0; i < this.animals.length; i++) {
            var a = this.animals[i];
            if (!a.alive || !a.data.h) continue;
            var d = WK.U.dist(v, a);
            if (d < td) { td = d; threat = a; }
        }
        
        if (threat) {
            if ((v.weapon && v.weapon.d > 0) || v.hasTrait('brave')) {
                v.state = 'hunt'; v.target = threat; v.timer = 130; v.profession = 'Guerrero';
            } else {
                v.state = 'flee'; 
                v.target = { x: v.x + (v.x - threat.x) * 2, y: v.y + (v.y - threat.y) * 2 }; 
                v.timer = 70; 
            }
            return;
        }
        
        if (v.isChild) { v.state = 'play'; v.target = WK.Map.randomLand(); v.timer = 180; return; }
        if (this.timeOfDay > 0.78 || this.timeOfDay < 0.22) { v.state = 'sleep'; v.timer = 160; return; }
        if (v.hunger < 35) { v.state = 'eat'; v.timer = 40; return; }
        if (v.energy < 25) { v.state = 'sleep'; v.timer = 160; return; }
        
        if (!v.weapon) {
            var tool = null;
            for (var t = 0; t < this.resources.length; t++) {
                var r = this.resources[t];
                if (r.type === 'tool' && r.amount > 0 && WK.U.dist(v, r) < 400) { tool = r; break; }
            }
            if (tool) { v.state = 'pickup'; v.target = tool; v.timer = 120; return; }
        }
        
        if (T['mysticism'] && this.hasBuilding('temple') && Math.random() < (v.persIs('pious') ? 0.45 : 0.2)) { 
            v.state = 'pray'; v.target = this.nearestBuilding('temple'); v.timer = 240; v.profession = 'Fiel'; return; 
        }
        
        if (T['agriculture']) {
            var farm = this.nearestBuilding('farm');
            if (farm && (farm.growth >= 100 || (S.food < this.villagers.length * 4 && Math.random() < 0.5))) { 
                v.state = 'farm'; v.target = farm; v.timer = 220; v.profession = 'Granjero'; return; 
            }
        }
        
        if (v.weapon && v.weapon.d > 0 && Math.random() < 0.5) {
            var prey = this.nearestAnimal(v.x, v.y, 800);
            if (prey) { v.state = 'hunt'; v.target = prey; v.timer = 240; v.profession = 'Cazador'; return; }
        }
        
        if (v.weapon && (v.weapon.t === 'fish' || v.weapon.t === 'net')) { 
            v.state = 'fish'; v.target = WK.Map.waterSpot || this.villageCenter(); v.timer = 260; v.profession = 'Pescador'; return; 
        }
        
        if (S.wood < 60) {
            var wood = null;
            for (var w = 0; w < this.resources.length; w++) {
                var rw = this.resources[w];
                if (rw.type === 'wood' && rw.amount > 0 && WK.U.dist(v, rw) < 1200) { wood = rw; break; }
            }
            if (wood) { v.state = 'gather_w'; v.target = wood; v.timer = 220; v.profession = 'Leñador'; return; }
        }
        
        if (S.food < this.villagers.length * 3) {
            var berry = null;
            for (var b = 0; b < this.resources.length; b++) {
                var rb = this.resources[b];
                if (rb.type === 'berry' && rb.amount > 0 && WK.U.dist(v, rb) < 900) { berry = rb; break; }
            }
            if (berry) { v.state = 'gather_f'; v.target = berry; v.timer = 200; v.profession = 'Recolector'; return; }
        }
        
        if (v.social < 55) {
            var friend = null;
            for (var f = 0; f < this.villagers.length; f++) {
                var vf = this.villagers[f];
                if (vf !== v && vf.alive && !vf.isChild) { friend = vf; break; }
            }
            if (friend) {
                v.state = 'social'; v.target = friend; v.timer = 180; v.profession = 'Social';
                var charm = (v.hasTrait('charismatic') ? 2 : 1) * (this.activeGods['aphrodite'] ? 3 : 1);
                if (!v.spouseId && !friend.spouseId && !friend.isChild && v.gender !== friend.gender && Math.random() < 0.005 * charm) {
                    v.spouseId = friend.id; friend.spouseId = v.id;
                    this.log('💍 ' + v.name + ' y ' + friend.name + ' se casaron', 'birth');
                    if (WK.UI) WK.UI.banner('💍 ¡Boda!', 'magic');
                }
                return;
            }
        }
        
        v.state = 'wander'; v.target = WK.Map.randomLand(); v.timer = WK.U.ri(120, 260); v.profession = 'Aldeano';
    },

    actVillager: function(v) {
        if (!v.target) return;
        var tx = v.target.x, ty = v.target.y;
        
        if (WK.Walls.isComplete()) {
            var iAmInside = WK.Walls.isInside(v.x, v.y), targetInside = WK.Walls.isInside(tx, ty);
            if (iAmInside !== targetInside) {
                var gate = WK.Walls.getGate(), distToGate = Math.hypot(v.x - gate.x, v.y - gate.y);
                if (distToGate > 30) { tx = gate.x; ty = gate.y; v.pathToGate = true; } 
                else { v.pathToGate = false; }
            } else {
                v.pathToGate = false;
            }
        }
        
        var d = WK.U.dist(v, { x: tx, y: ty }), eff = v.mood > 50 ? 1 : 0.5;
        if (d > 22) {
            var dx = tx - v.x, dy = ty - v.y, spd = v.isElder ? 1 : (v.isChild ? 1.3 : 1.7);
            if (v.state === 'flee') spd = 2.4; 
            if (v.hasTrait('swift')) spd *= 1.2;
            v.vx = (dx / d) * spd; v.vy = (dy / d) * spd; 
            return;
        }
        
        v.vx = 0; v.vy = 0;
        
        if (v.state === 'pickup' && v.target.type === 'tool') {
            v.weapon = v.target.toolData; v.target.alive = false;
            this.log('🛠️ ' + v.name + ' tomó ' + v.weapon.n, 'evolve');
        }
        else if (v.state === 'eat') {
            if (this.stock.food >= 1) { this.stock.food -= 1; v.hunger = 100; }
            else if (v.inv.f > 0) { v.inv.f--; v.hunger = 90; }
        }
        else if (v.state === 'sleep') { 
            v.energy = Math.min(100, v.energy + 0.6 * eff); 
            if (v.energy >= 99) { v.state = 'idle'; v.timer = 0; } 
        }
        else if (v.state === 'pray') {
            this.stock.faith += 0.06 * eff * (v.persIs('pious') ? 1.5 : 1);
            v.mood = Math.min(100, v.mood + 0.05);
            if (!v.believer && Math.random() < 0.012) { 
                v.believer = true; 
                this.log('🕊️ ' + v.name + ' se volvió fiel', 'faith'); 
            }
        }
        else if (v.state === 'social' && v.target instanceof WK.Villager) {
            v.social = Math.min(100, v.social + 1); 
            v.target.social = Math.min(100, v.target.social + 1);
            this.stock.knowledge += 0.02 * this.knowledgeMult();
        }
        else if (v.state === 'farm' && v.target.def && v.target.def.id === 'farm') {
            var seasonMult = WK.CFG.SEASONS[this.currentSeason].f;
            var farmBoost = this.activeGods['demeter'] ? 1.8 : 1;
            if (v.target.growth >= 100) { 
                v.target.growth = 0; 
                this.stock.food += 14 * farmBoost; 
                this.log('🌾 Cosecha exitosa', 'evolve'); 
            } else {
                v.target.growth += 0.2 * eff * seasonMult * farmBoost * (v.persIs('farmer') ? 1.3 : 1); 
            }
        }
        else if (v.state === 'fish') {
            if (WK.Map.isWater(v.x, v.y) || WK.Map.isWater(v.x, v.y + 30)) {
                v.inv.f += (v.weapon.t === 'net' ? 0.5 : 0.25) * eff * (this.activeGods['poseidon'] ? 2 : 1); 
            }
        }
        else if (v.state === 'hunt' && (v.target instanceof WK.Animal || v.target instanceof WK.WarParty)) {
            if (v.target.alive && v.weapon && v.weapon.d > 0) {
                var dogBoost = v.hasDogCompanion() ? 1.5 : 1;
                var dmg = v.weapon.d * eff * dogBoost * (this.activeGods['ares'] ? 1.5 : 1) * (this.activeGods['artemis'] ? 1.8 : 1);
                this.projectiles.push(new WK.Projectile(v.x, v.y, v.target, dmg, v.weapon.e === '🏹' ? 'arrow' : 'spear'));
                v.timer = 55;
                if (v.target instanceof WK.WarParty) v.target.count -= 0.5;
            }
        }
        else if (v.state === 'gather_w' && v.target.type === 'wood') {
            var yw = 2.2 * this.gatherMult() * eff * (v.weapon && v.weapon.t === 'axe' ? 2 : 1);
            v.inv.w += yw; v.target.amount -= yw;
        }
        else if (v.state === 'gather_f' && v.target.type === 'berry') { 
            v.inv.f += 3 * eff; v.target.amount -= 3; 
        }
        
        var carry = v.inv.w + v.inv.s + v.inv.o + v.inv.f + v.inv.m;
        if (carry >= 8 && ['gather_w', 'gather_f', 'fish', 'hunt'].indexOf(v.state) >= 0) { 
            v.state = 'deposit'; v.target = this.villageCenter(); v.timer = 300; 
        }
        else if (v.state === 'deposit') {
            this.stock.wood += v.inv.w; 
            this.stock.food += v.inv.f + v.inv.m;
            v.inv = { w: 0, s: 0, o: 0, f: 0, m: 0 }; 
            v.state = 'idle'; v.timer = 5;
        }
    },

    knowledgeMult: function() { 
        var m = 1; 
        if (this.techs['writing']) m *= 1.5; 
        if (this.techs['printing']) m *= 1.5; 
        if (this.techs['internet']) m *= 2; 
        if (this.activeGods['athena']) m *= 2; 
        return m; 
    },

    gatherMult: function() { 
        var m = 1; 
        if (this.techs['stone_tools']) m *= 1.5; 
        if (this.techs['bronze']) m *= 1.25; 
        if (this.techs['iron']) m *= 1.35; 
        return m; 
    }
};

console.log('[WK] Lógica del juego cargada');
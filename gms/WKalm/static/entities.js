window.WK = window.WK || {};
WK.Entity = class {
    constructor(x, y) {
        this.id = WK.U.uid(); this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.alive = true; this.facing = 1; this.isBoat = false; this.ignoreWalls = false; this.pathToGate = false;
    }
    update() {
        var nx = this.x + this.vx, ny = this.y + this.vy;
        if (!this.isBoat && WK.Map.isWater(nx, ny)) {
            this.vx = 0; this.vy = 0; nx = this.x; ny = this.y;
            if (WK.Map.isWater(this.x, this.y)) {
                for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                    var tx = this.x + Math.cos(a) * 10, ty = this.y + Math.sin(a) * 10;
                    if (!WK.Map.isWater(tx, ty)) { nx = tx; ny = ty; break; }
                }
            }
        }
        if (!this.ignoreWalls && WK.Walls.isComplete()) {
            var wasInside = WK.Walls.isInside(this.x, this.y), willBeInside = WK.Walls.isInside(nx, ny);
            if (wasInside !== willBeInside) {
                if (WK.Walls.crossesWall(this.x, this.y, nx, ny)) { this.vx = 0; this.vy = 0; this.pathToGate = true; return; }
            }
        }
        this.x = nx; this.y = ny; this.vx *= 0.85; this.vy *= 0.85;
        if (Math.abs(this.vx) > 0.1) this.facing = this.vx > 0 ? 1 : -1;
        this.x = WK.U.clamp(this.x, 10, WK.CFG.WW - 10); this.y = WK.U.clamp(this.y, 10, WK.CFG.WH - 10);
    }
};

WK.Resource = class extends WK.Entity {
    constructor(x, y, type, toolData) {
        super(x, y); this.type = type; this.toolData = toolData || null;
        this.amount = type === 'tool' ? 1 : (type === 'berry' ? WK.U.ri(15, 30) : WK.U.ri(30, 60));
        this.max = this.amount; this.regen = 0; this.ignoreWalls = true;
    }
    update() { if (this.amount <= 0 && this.type !== 'tool') { this.regen++; if (this.regen > 2500) { this.amount = this.max; this.regen = 0; } } }
};

WK.Building = class extends WK.Entity {
    constructor(x, y, def) { super(x, y); this.def = def; this.occIds = []; this.growth = 0; this.buildingProgress = 0; this.ignoreWalls = true; }
};

WK.Animal = class extends WK.Entity {
    constructor(x, y, data) {
        super(x, y); this.data = data; this.hp = data.hp; this.maxHp = data.hp;
        this.state = 'idle'; this.timer = WK.U.rand(100, 300); this.tx = x; this.ty = y; this.isBoat = !!data.w;
    }
    update() {
        if (!this.alive) return; this.timer--; var G = WK.Game;
        if (this.data.h && this.state !== 'flee') {
            var prey = null, bd = 170;
            for (var i = 0; i < G.villagers.length; i++) { var d = WK.U.dist(this, G.villagers[i]); if (d < bd) { bd = d; prey = G.villagers[i]; } }
            if (prey) {
                this.tx = prey.x; this.ty = prey.y;
                if (bd < 16) {
                    prey.hp -= 0.3;
                    if (prey.state !== 'flee' && !(prey.weapon && prey.weapon.d > 0) && !prey.hasTrait('brave')) {
                        prey.state = 'flee'; prey.target = { x: prey.x + (prey.x - this.x) * 2, y: prey.y + (prey.y - this.y) * 2 }; prey.timer = 70;
                    }
                }
                var dx = this.tx - this.x, dy = this.ty - this.y, dd = Math.hypot(dx, dy);
                if (dd > 5) { this.vx = (dx / dd) * this.data.sp; this.vy = (dy / dd) * this.data.sp; }
                super.update(); return;
            }
        }
        if (this.state === 'flee') {
            if (this.timer <= 0) this.state = 'idle';
            else { var fdx = this.tx - this.x, fdy = this.ty - this.y, fdd = Math.hypot(fdx, fdy); if (fdd > 5) { this.vx = (fdx / fdd) * this.data.sp * 1.3; this.vy = (fdy / fdd) * this.data.sp * 1.3; } super.update(); return; }
        }
        if (this.timer <= 0) { var p = WK.Map.randomLand(); this.tx = p.x; this.ty = p.y; this.timer = WK.U.rand(200, 500); }
        var dx2 = this.tx - this.x, dy2 = this.ty - this.y, d2 = Math.hypot(dx2, dy2);
        if (d2 > 5) { var s = this.data.sp * 0.4; this.vx = (dx2 / d2) * s; this.vy = (dy2 / d2) * s; }
        super.update();
    }
};

WK.Dog = class extends WK.Entity {
    constructor(x, y, name, emoji, gender, isPuppy) {
        super(x, y); this.name = name || WK.U.pick(WK.D.DOG_NAMES); this.emoji = emoji || '🐕'; this.gender = gender || (Math.random() > 0.5 ? 'M' : 'F');
        this.isPuppy = !!isPuppy; this.age = this.isPuppy ? 0 : WK.U.rand(2, 6); this.maxAge = WK.U.rand(14, 20);
        this.hp = 100; this.maxHp = 100; this.barkCD = 0; this.barkShow = 0; this.patrolAngle = WK.U.rand(0, Math.PI * 2);
        this.state = 'patrol'; this.companionOf = null; this.pregnancyTimer = 0; this.motherId = null; this.ignoreWalls = true;
        if (this.isPuppy) this.emoji = '🐶';
    }
    update() {
        if (!this.alive) return; var G = WK.Game;
        if (this.barkCD > 0) this.barkCD--; if (this.barkShow > 0) this.barkShow--; this.age += WK.CFG.AGING * 2.5;
        if (!this.isPuppy && this.age >= this.maxAge) { this.alive = false; G.log('🐕 ' + this.name + ' murió de viejo', 'death'); return; }
        if (this.isPuppy && this.age >= 1.5) { this.isPuppy = false; this.emoji = WK.U.pick(['🐕', '🐕‍🦺', '🐩', '🦮']); G.log('🐶 ¡' + this.name + ' creció!', 'dog'); }
        var c = G.villageCenter();
        if (this.state === 'patrol') {
            this.patrolAngle += 0.012; var pr = 180 + Math.sin(this.patrolAngle * 0.3) * 40;
            var px = c.x + Math.cos(this.patrolAngle) * pr, py = c.y + Math.sin(this.patrolAngle) * pr;
            var dx = px - this.x, dy = py - this.y, dd = Math.hypot(dx, dy);
            if (dd > 25) { this.vx = (dx / dd) * 2; this.vy = (dy / dd) * 2; } else { this.vx *= 0.5; this.vy *= 0.5; }
        }
        super.update(); if (WK.Map) WK.Map.reveal(this.x, this.y, 2);
    }
};

WK.Villager = class extends WK.Entity {
    constructor(x, y, age, opts) {
        super(x, y); opts = opts || {};
        this.name = opts.name || WK.U.pick(WK.D.NAMES) + WK.U.ri(1, 99); this.gender = opts.gender || (Math.random() > 0.5 ? 'M' : 'F');
        this.age = age || 0; this.maxAge = WK.U.ri(60, 90);
        this.hp = 100; this.hunger = 100; this.energy = 100; this.social = 100; this.mood = 100;
        this.state = 'idle'; this.target = null; this.timer = WK.U.ri(10, 60);
        this.spouseId = null; this.houseId = null; this.isChief = false; this.believer = false;
        this.sick = false; this.sickTimer = 0; this.parentId = null;
        this.inv = { w: 0, s: 0, o: 0, f: 0, m: 0 }; this.weapon = null;
        this.skills = { hunt: 0, fish: 0, farm: 0, build: 0, social: 0, wisdom: 0 }; this.profession = 'Ocioso';
        this.pers = opts.pers || WK.U.pick(WK.D.PERS); this.traits = opts.traits || [WK.U.pick(WK.D.TRAITS).id, WK.U.pick(WK.D.TRAITS).id];
        this.like = opts.like || WK.U.pick(WK.D.LIKES);
        this.skinColor = 'hsl(' + WK.U.rand(20, 40) + ',' + WK.U.rand(40, 60) + '%,' + WK.U.rand(40, 60) + '%)';
        this.shirtColor = 'hsl(' + WK.U.rand(0, 360) + ',50%,40%)'; this.arrivalStory = opts.story || null;
        if (this.hasTrait('sickly')) this.hp = 70;
    }
    get isChild() { return this.age < 16; }
    get isElder() { return this.age >= 55; }
    hasTrait(id) { return this.traits.indexOf(id) >= 0; }
    persIs(id) { return this.pers && this.pers.id === id; }
    update() {
        if (!this.alive) return; this.age += WK.CFG.AGING;
        if (this.age >= this.maxAge) { this.alive = false; if (WK.Game) WK.Game.killVillager(this, 'vejez'); return; }
        if (!this.isChild) { this.hunger -= 0.0038; this.energy -= 0.0025; } this.social -= 0.0015;
        if (this.hunger < 30 || this.energy < 25) this.mood -= 0.003; else if (this.social > 60 && this.hunger > 60) this.mood = Math.min(100, this.mood + 0.012);
        if (this.hunger <= 0) this.hp -= 0.15; if (this.hp <= 0) { this.alive = false; if (WK.Game) WK.Game.killVillager(this, 'hambre'); return; }
        if (WK.Map) WK.Map.reveal(this.x, this.y, this.isChild ? 2 : 3);
        this.timer--;
        if (this.timer <= 0 || !this.target) {
            if (this.hunger < 35) { this.state = 'eat'; this.timer = 40; }
            else if (this.energy < 25) { this.state = 'sleep'; this.timer = 160; }
            else { this.state = 'wander'; this.target = WK.Map.randomLand(); this.timer = WK.U.ri(120, 260); }
        }
        if (WK.Game) WK.Game.actVillager(this);
        super.update();
    }
};
console.log('[WK] Entidades cargadas');
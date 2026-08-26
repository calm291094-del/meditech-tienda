// ═══════════════════════════════════════════════════════════
// 💾 SISTEMA DE AUTENTICACIÓN Y GUARDADO (WK.Auth y WK.Save)
// ═══════════════════════════════════════════════════════════

WK.Auth = {
    KEY: 'worlkalm_profiles',
    profiles: [],
    loadProfiles: function() {
        try { this.profiles = JSON.parse(localStorage.getItem(this.KEY)) || []; } 
        catch (e) { this.profiles = []; }
    },
    saveProfiles: function() {
        try { localStorage.setItem(this.KEY, JSON.stringify(this.profiles)); } catch (e) {}
    },
    createProfile: function(name, avatar, diff) {
        var p = { id: WK.U.uid(), name: name, avatar: avatar, difficulty: diff, created: Date.now(), lastPlayed: Date.now(), achievements: {}, saves: {} };
        this.profiles.push(p); this.saveProfiles(); return p;
    },
    deleteProfile: function(id) { this.profiles = this.profiles.filter(function(p) { return p.id !== id; }); this.saveProfiles(); },
    getProfile: function(id) { return this.profiles.find(function(p) { return p.id === id; }) }
};

WK.Save = {
    save: function(silent) {
        var G = WK.Game, p = G.profile; if (!p) return;
        var data = {
            v: 'WK_v2', time: G.time, day: G.day, era: G.era, weather: G.weather, season: G.currentSeason, seasonTimer: G.seasonTimer,
            techs: G.techs, activeGods: G.activeGods, stock: G.stock, achievements: G.achievements,
            villagers: G.villagers.map(function(v) {
                return { id: v.id, n: v.name, x: v.x, y: v.y, age: v.age, g: v.gender, hp: v.hp, hu: v.hunger, en: v.energy, so: v.social, mo: v.mood, sp: v.spouseId, ch: v.isChief, be: v.believer, inv: v.inv, wep: v.weapon ? v.weapon.id : null, sk: v.skills, pr: v.profession, pe: v.pers ? v.pers.id : null, tr: v.traits, li: v.like, sc: v.skinColor, sh: v.shirtColor, story: v.arrivalStory };
            }),
            dogs: G.dogs.map(function(d) {
                return { id: d.id, x: d.x, y: d.y, n: d.name, e: d.emoji, g: d.gender, hp: d.hp, puppy: d.isPuppy, age: d.age, comp: d.companionOf, preg: d.pregnancyTimer, mother: d.motherId };
            }),
            buildings: G.buildings.map(function(b) {
                return { id: b.id, x: b.x, y: b.y, did: b.def.id, occ: b.occIds, gr: b.growth };
            }),
            rivals: G.rivals.map(function(r) {
                return { id: r.id, x: r.x, y: r.y, n: r.name, c: r.color, p: r.pop, s: r.strength, a: r.alive, h: r.hostile, wc: r.warCooldown };
            }),
            walls: WK.Walls.slots.map(function(s) { return s.built; })
        };
        p.saves['main'] = data; p.lastPlayed = Date.now(); WK.Auth.saveProfiles();
        if (!silent) WK.UI.notify('💾 Partida guardada');
    },
    load: function() {
        var G = WK.Game, p = G.profile; if (!p || !p.saves['main']) return false;
        var d = p.saves['main'];
        G.time = d.time; G.day = d.day; G.era = d.era; G.weather = d.weather; G.currentSeason = d.season; G.seasonTimer = d.seasonTimer;
        G.techs = d.techs; G.activeGods = d.activeGods; G.stock = d.stock; G.achievements = d.achievements;
        G.villagers = d.villagers.map(function(vd) {
            var pers = WK.D.PERS.find(function(p2) { return p2.id === vd.pe; });
            var v = new WK.Villager(vd.x, vd.y, vd.age, { name: vd.n, gender: vd.g, pers: pers, traits: vd.tr, like: vd.li, story: vd.story });
            v.id = vd.id; v.hp = vd.hp; v.hunger = vd.hu; v.energy = vd.en; v.social = vd.so; v.mood = vd.mo;
            v.spouseId = vd.sp; v.isChief = vd.ch; v.believer = vd.be; v.inv = vd.inv; v.skills = vd.sk; v.profession = vd.pr; v.skinColor = vd.sc; v.shirtColor = vd.sh; v.arrivalStory = vd.story;
            if (vd.wep) { var w = WK.D.WEAPONS.find(function(w2) { return w2.id === vd.wep; }); if (w) v.weapon = w; }
            return v;
        });
        G.dogs = d.dogs.map(function(dd) {
            var dog = new WK.Dog(dd.x, dd.y, dd.n, dd.e, dd.g, dd.puppy);
            dog.id = dd.id; dog.hp = dd.hp; dog.age = dd.age; dog.companionOf = dd.comp; dog.pregnancyTimer = dd.preg; dog.motherId = dd.mother;
            return dog;
        });
        G.buildings = d.buildings.map(function(bd) {
            var def = WK.D.BUILDINGS.find(function(b) { return b.id === bd.did; }) || WK.D.BUILDINGS[0];
            var b = new WK.Building(bd.x, bd.y, def); b.id = bd.id; b.occIds = bd.occ || []; b.growth = bd.gr || 0; return b;
        });
        G.rivals = d.rivals.map(function(rd) {
            var r = new WK.RivalVillage(rd.x, rd.y, rd.n, rd.c); r.id = rd.id; r.pop = rd.p; r.strength = rd.s; r.alive = rd.a; r.hostile = rd.h; r.warCooldown = rd.wc; return r;
        });
        if (d.walls) { for (var i = 0; i < Math.min(d.walls.length, WK.Walls.slots.length); i++) WK.Walls.slots[i].built = d.walls[i]; }
        G.assignChief(); return true;
    },
    exportSave: function() {
        var G = WK.Game, p = G.profile; if (!p || !p.saves || !p.saves['main']) { WK.UI.notify('❌ No hay partida'); return; }
        this.save(true);
        var data = JSON.stringify(p, null, 2), blob = new Blob([data], { type: 'application/json' }), url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'worlkalm-' + p.name + '-dia' + G.day + '.json'; a.click(); URL.revokeObjectURL(url);
        WK.UI.notify('📤 Partida exportada'); WK.UI.banner('📤 ¡Exportada!', 'gold');
    },
    importSave: function() {
        var input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = function(e) {
            var file = e.target.files[0]; if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var data = JSON.parse(ev.target.result);
                    if (!data.saves || !data.saves['main']) { WK.UI.notify('❌ Archivo inválido'); return; }
                    var newProf = WK.Auth.createProfile(data.name + ' (Import)', data.avatar || '👑', data.difficulty || 'normal');
                    newProf.saves = data.saves; newProf.achievements = data.achievements || {}; WK.Auth.saveProfiles();
                    WK.UI.notify('✅ Importado: ' + data.name); WK.UI.banner('📥 ¡Importado!', 'gold');
                    if (confirm('¿Cargar la partida importada ahora?')) WK.App.startWithProfile(newProf);
                } catch (err) { WK.UI.notify('❌ Error: ' + err.message); }
            };
            reader.readAsText(file);
        };
        input.click();
    }
};
console.log('[WK] Auth y Save System cargados');
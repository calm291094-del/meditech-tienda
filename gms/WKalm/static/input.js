window.WK = window.WK || {};

WK.Input = {
    init: function() {
        var canvas = WK.Render.canvas;
        
        var resumeAudio = function() { 
            WK.Audio.resume(); 
            window.removeEventListener('click', resumeAudio); 
            window.removeEventListener('touchstart', resumeAudio); 
        };
        window.addEventListener('click', resumeAudio); 
        window.addEventListener('touchstart', resumeAudio);
        
        window.addEventListener('keydown', function(e) { 
            WK.Cam.keys[e.key] = true; 
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault(); 
        });
        
        window.addEventListener('keyup', function(e) { 
            WK.Cam.keys[e.key] = false; 
        });
        
        canvas.addEventListener('mousemove', function(e) {
            WK.Cam.mx = e.clientX; WK.Cam.my = e.clientY;
            if (WK.Cam.drag) { 
                WK.Cam.x -= e.movementX / WK.Cam.zoom; 
                WK.Cam.y -= e.movementY / WK.Cam.zoom; 
                WK.Cam.clamp(); 
                WK.Cam.moved += Math.abs(e.movementX) + Math.abs(e.movementY); 
            }
        });
        
        canvas.addEventListener('mousedown', function(e) { 
            if (e.button === 0) { 
                WK.Cam.drag = true; 
                WK.Cam.moved = 0; 
            } 
        });
        
        window.addEventListener('mouseup', function(e) { 
            if (e.button === 0 && WK.Cam.drag) {
                WK.Cam.drag = false;
                if (WK.Cam.moved < 6) {
                    var w = WK.Cam.toWorld(e.clientX, e.clientY);
                    WK.Input.handleClick(w.x, w.y);
                }
            }
        });
        
        document.getElementById('mm').addEventListener('click', function(e) {
            var r = this.getBoundingClientRect(); 
            WK.Cam.centerOn((e.clientX - r.left) / r.width * WK.CFG.WW, (e.clientY - r.top) / r.height * WK.CFG.WH);
        });
        
        document.getElementById('zIn').addEventListener('click', function() { WK.Cam.zoomBy(1.25); });
        document.getElementById('zOut').addEventListener('click', function() { WK.Cam.zoomBy(0.8); });
        
        document.getElementById('bPause').addEventListener('click', function() { 
            WK.Game.paused = !WK.Game.paused; 
            this.textContent = WK.Game.paused ? '▶' : '⏸'; 
        });
        
        document.getElementById('bSpd').addEventListener('click', function() {
            var speeds = [0.5, 1, 2, 4, 8], idx = speeds.indexOf(WK.Game.speed);
            WK.Game.speed = speeds[WK.U.clamp(idx + 1, 0, speeds.length - 1)]; 
            this.textContent = '▶x' + WK.Game.speed;
        });
        
        document.getElementById('bLog').addEventListener('click', function() { WK.UI.togglePanel('pLog'); });
        document.getElementById('bPow').addEventListener('click', function() { WK.UI.togglePanel('pPow'); });
        document.getElementById('bTech').addEventListener('click', function() { WK.UI.togglePanel('pTech'); });
        document.getElementById('bPan').addEventListener('click', function() { WK.UI.togglePanel('pPan'); });
        document.getElementById('bAch').addEventListener('click', function() { WK.UI.togglePanel('pAch'); });
        
        document.querySelectorAll('[data-c]').forEach(function(el) {
            el.onclick = function() { 
                var id = this.getAttribute('data-c'); 
                var target = document.getElementById(id); 
                if (target) target.style.display = 'none'; 
            };
        });
        
        this.initNpcModal();
    },

    handleClick: function(wx, wy) {
        var G = WK.Game;
        for (var j = 0; j < G.villagers.length; j++) {
            var v = G.villagers[j];
            if (v.alive && Math.hypot(v.x - wx, v.y - wy) < 20) {
                var traitStr = '';
                for (var t = 0; t < v.traits.length; t++) {
                    var tr = WK.D.TRAITS.find(function(x) { return x.id === v.traits[t]; });
                    if (tr) traitStr += tr.e + ' ';
                }
                var html = '<p><b>' + (v.gender === 'M' ? '👨' : '👩') + ' ' + v.name + '</b> · ' + Math.floor(v.age) + ' años</p>';
                html += '<p style="margin:4px 0;">' + (v.pers ? v.pers.e + ' ' + v.pers.n : '') + ' · ' + traitStr + '</p>';
                html += '<p style="color:var(--td);font-size:.65rem;">Le gusta ' + v.like + '</p>';
                if (v.arrivalStory) {
                    var stories = { refuge: '🏚️ Buscó refugio', family: '👨‍👩‍👧 Buscó familiar', adventure: '🧭 Aventurero', exile: '⚔️ Exiliado', divine: '✨ Enviado divino' };
                    html += '<p style="color:var(--gold);font-size:.65rem;">' + (stories[v.arrivalStory] || '') + '</p>';
                }
                html += '<p style="margin-top:4px;">' + v.profession + (v.isChief ? ' 👑' : '') + '</p>';
                html += '<p>❤️' + Math.floor(v.hp) + ' 🍎' + Math.floor(v.hunger) + ' ⚡' + Math.floor(v.energy) + '</p>';
                if (v.sick) html += '<p style="color:var(--danger);">🤒 Enfermo</p>';
                if (v.hasDogCompanion()) html += '<p>🐕 Con perro</p>';
                
                WK.UI.showPopup(v.name, html);
                return;
            }
        }
    },

    initNpcModal: function() {
        var modal = document.getElementById('npcModal');
        var persSel = document.getElementById('npcPers');
        var likeSel = document.getElementById('npcLike');
        var traitsDiv = document.getElementById('npcTraits');
        var ageInput = document.getElementById('npcAge');
        var ageVal = document.getElementById('npcAgeVal');
        
        var pHtml = '';
        for (var i = 0; i < WK.D.PERS.length; i++) {
            pHtml += '<option value="' + WK.D.PERS[i].id + '">' + WK.D.PERS[i].e + ' ' + WK.D.PERS[i].n + '</option>';
        }
        persSel.innerHTML = pHtml;
        
        var lHtml = '';
        for (var j = 0; j < WK.D.LIKES.length; j++) {
            lHtml += '<option value="' + WK.D.LIKES[j] + '">' + WK.D.LIKES[j] + '</option>';
        }
        likeSel.innerHTML = lHtml;
        
        var tHtml = '';
        for (var k = 0; k < WK.D.TRAITS.length; k++) {
            tHtml += '<span class="trait-opt" data-trait="' + WK.D.TRAITS[k].id + '">' + WK.D.TRAITS[k].e + ' ' + WK.D.TRAITS[k].n + '</span>';
        }
        traitsDiv.innerHTML = tHtml;
        
        var traitOpts = traitsDiv.querySelectorAll('.trait-opt');
        for (var t = 0; t < traitOpts.length; t++) {
            traitOpts[t].addEventListener('click', function() {
                var selected = traitsDiv.querySelectorAll('.trait-opt.sel');
                if (this.classList.contains('sel')) {
                    this.classList.remove('sel');
                } else if (selected.length < 3) {
                    this.classList.add('sel');
                } else {
                    WK.UI.notify('Máximo 3 rasgos');
                }
            });
        }
        
        ageInput.addEventListener('input', function() { 
            ageVal.textContent = this.value; 
        });
        
        document.getElementById('npcCreate').addEventListener('click', function() {
            var name = document.getElementById('npcName').value.trim();
            if (!name) { WK.UI.notify('⚠️ Ponle nombre'); return; }
            
            var age = parseInt(ageInput.value) || 25;
            var gender = document.getElementById('npcGender').value;
            var pers = document.getElementById('npcPers').value;
            var like = document.getElementById('npcLike').value;
            var story = document.getElementById('npcStory').value;
            var traits = [];
            
            var selTraits = traitsDiv.querySelectorAll('.trait-opt.sel');
            for (var s = 0; s < selTraits.length; s++) {
                traits.push(selTraits[s].getAttribute('data-trait'));
            }
            if (traits.length === 0) traits = [WK.U.pick(WK.D.TRAITS).id];
            
            var edge = WK.Map.edgeLand();
            var persObj = WK.D.PERS.find(function(p) { return p.id === pers; }) || WK.D.PERS[0];
            
            var newVillager = new WK.Villager(edge.x, edge.y, age, { 
                name: name, gender: gender, pers: persObj, traits: traits, like: like, story: story 
            });
            newVillager.arrivalStory = story;
            
            G.villagers.push(newVillager); 
            G.assignHomeless();
            
            var storyMsg = {
                refuge: '🏚️ ' + name + ' buscó refugio',
                family: '👨‍👩‍👧 ' + name + ' buscó a un familiar',
                adventure: '🧭 ' + name + ' llegó por aventura',
                exile: '⚔️ ' + name + ' fue exiliado',
                divine: '✨ ' + name + ' fue enviado por los dioses'
            };
            
            G.log(storyMsg[story] || storyMsg.refuge, 'birth');
            WK.UI.banner('👤 ¡' + name + ' llegó!', 'magic');
            WK.Audio.play('birth');
            
            modal.classList.remove('show');
            document.getElementById('npcName').value = '';
            ageInput.value = 25; 
            ageVal.textContent = '25';
            traitsDiv.querySelectorAll('.trait-opt.sel').forEach(function(el) { el.classList.remove('sel'); });
        });
        
        document.getElementById('npcCancel').addEventListener('click', function() { 
            modal.classList.remove('show'); 
        });
    }
};

console.log('[WK] Controles cargados');
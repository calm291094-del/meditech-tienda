// ═══════════════════════════════════════════════════════════
// 🚀 APLICACIÓN PRINCIPAL Y BUCLE (WK.App)
// ═══════════════════════════════════════════════════════════

WK.App = {
    selectedAvatar: '👑', selectedDiff: 'normal',
    init: function() {
        WK.Audio.init(); WK.Render.init(); WK.Input.init();
        WK.Auth.loadProfiles(); // Ahora WK.Auth está definido correctamente en save.js
        this.renderAuth(); 
        requestAnimationFrame(this.loop.bind(this));
    },
    renderAuth: function() {
        var profSection = document.getElementById('authProfiles'), createSection = document.getElementById('authCreate');
        if (WK.Auth.profiles.length > 0) {
            profSection.style.display = 'block'; createSection.style.display = 'none';
            var list = document.getElementById('profList'), html = '';
            for (var i = 0; i < WK.Auth.profiles.length; i++) {
                var p = WK.Auth.profiles[i];
                html += '<div class="pf" data-id="' + p.id + '"><span class="av">' + p.avatar + '</span><span class="inf"><span class="nm">' + p.name + '</span></span><span class="dl" data-del="' + p.id + '">🗑️</span></div>';
            }
            list.innerHTML = html;
            list.querySelectorAll('.pf').forEach(function(card) {
                card.addEventListener('click', function(e) {
                    if (e.target.hasAttribute('data-del')) return;
                    WK.App.startWithProfile(WK.Auth.getProfile(this.getAttribute('data-id')));
                });
            });
            list.querySelectorAll('[data-del]').forEach(function(del) {
                del.addEventListener('click', function(e) {
                    e.stopPropagation(); if (confirm('¿Eliminar?')) { WK.Auth.deleteProfile(this.getAttribute('data-del')); WK.App.renderAuth(); }
                });
            });
            document.getElementById('btnNewProf').onclick = function() { profSection.style.display = 'none'; createSection.style.display = 'block'; WK.App.renderCreate(); };
        } else { profSection.style.display = 'none'; createSection.style.display = 'block'; this.renderCreate(); }
    },
    renderCreate: function() {
        var avPick = document.getElementById('avPick'), html = '';
        for (var i = 0; i < WK.D.AVATARS.length; i++) html += '<span class="avopt' + (WK.D.AVATARS[i] === this.selectedAvatar ? ' sel' : '') + '" data-av="' + WK.D.AVATARS[i] + '">' + WK.D.AVATARS[i] + '</span>';
        avPick.innerHTML = html;
        avPick.querySelectorAll('.avopt').forEach(function(opt) {
            opt.addEventListener('click', function() {
                WK.App.selectedAvatar = this.getAttribute('data-av');
                avPick.querySelectorAll('.avopt').forEach(function(x) { x.classList.remove('sel'); });
                this.classList.add('sel');
            });
        });
        var diffPick = document.getElementById('diffPick'), dHtml = '';
        var diffs = [{ id: 'peaceful', l: '🕊️ Pacífico' }, { id: 'normal', l: '⚖️ Normal' }, { id: 'hard', l: '🔥 Difícil' }, { id: 'brutal', l: '💀 Brutal' }];
        for (var d = 0; d < diffs.length; d++) dHtml += '<button class="dbtn' + (diffs[d].id === this.selectedDiff ? ' act' : '') + '" data-diff="' + diffs[d].id + '">' + diffs[d].l + '</button>';
        diffPick.innerHTML = dHtml;
        diffPick.querySelectorAll('.dbtn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                diffPick.querySelectorAll('.dbtn').forEach(function(x) { x.classList.remove('act'); });
                this.classList.add('act'); WK.App.selectedDiff = this.getAttribute('data-diff');
            });
        });
        document.getElementById('btnCreate').onclick = function() {
            var name = document.getElementById('inpName').value.trim() || 'Dios';
            var profile = WK.Auth.createProfile(name, WK.App.selectedAvatar, WK.App.selectedDiff);
            WK.App.startWithProfile(profile);
        };
        document.getElementById('btnBack').onclick = function() { WK.App.renderAuth(); };
    },
    startWithProfile: function(profile) {
        if (!profile) return;
        WK.Audio.resume(); // Esto soluciona el aviso del navegador sobre AudioContext
        document.getElementById('auth').style.display = 'none';
        document.getElementById('tb').style.display = 'flex';
        document.getElementById('ctrls').style.display = 'flex';
        document.getElementById('mmw').style.display = 'block';
        document.getElementById('zoomc').style.display = 'flex';
        WK.Game.init(profile);
        if (profile.saves && profile.saves['main']) {
            if (confirm('¿Cargar partida guardada?')) { WK.Save.load(); WK.UI.notify('📂 Cargada'); }
        }
        WK.UI.updateHUD(); WK.UI.banner('🌍 ¡Bienvenido, ' + profile.name + '!', 'gold');
    },
    loop: function() {
        if (WK.Game) WK.Game.update();
        if (WK.Render && WK.Cam) WK.Render.draw();
        requestAnimationFrame(this.loop.bind(this));
    }
};

window.addEventListener('load', function() { WK.App.init(); });
console.log('[WK] Aplicación principal cargada');
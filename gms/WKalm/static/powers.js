window.WK = window.WK || {};
WK.Powers = {
    render: function() {
        var G = WK.Game, el = document.getElementById('powC'); if (!el) return;
        var sections = [
            { title: '📦 Recursos', items: [{ e: '🍇', n: 'Bayas (+50)', fn: function() { G.stock.food += 50; } }, { e: '🪵', n: 'Madera (+50)', fn: function() { G.stock.wood += 50; } }, { e: '🪨', n: 'Piedra (+50)', fn: function() { G.stock.stone += 50; } }] },
            { title: '✨ Milagros', items: [{ e: '💚', n: 'Sanar (60🕊️)', cost: 60, fn: function() { if (G.stock.faith < 60) return; G.stock.faith -= 60; for (var i = 0; i < G.villagers.length; i++) { G.villagers[i].hp = 100; G.villagers[i].sick = false; } } }] }
        ];
        var html = '';
        for (var s = 0; s < sections.length; s++) {
            var sec = sections[s]; html += '<div class="sec' + (s < 2 ? ' act' : '') + '"><div class="sect" data-sec="' + s + '">' + sec.title + '</div><div class="secb"><div class="secc"><div class="pgrid">';
            for (var i = 0; i < sec.items.length; i++) {
                var item = sec.items[i], costText = item.cost > 0 ? ' <small style="color:var(--gold)">' + item.cost + '🕊️</small>' : '';
                html += '<div class="pbtn" data-s="' + s + '" data-i="' + i + '"><span class="ic">' + item.e + '</span>' + item.n + costText + '</div>';
            }
            html += '</div></div></div></div>';
        }
        el.innerHTML = html;
        var btns = el.querySelectorAll('.pbtn');
        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener('click', function() {
                var s = parseInt(this.getAttribute('data-s')), idx = parseInt(this.getAttribute('data-i'));
                sections[s].items[idx].fn(); if (WK.Audio) WK.Audio.play('click');
            });
        }
        var titles = el.querySelectorAll('.sect');
        for (var t = 0; t < titles.length; t++) { titles[t].addEventListener('click', function() { this.parentElement.classList.toggle('act'); }); }
    }
};
console.log('[WK] Poderes cargados');
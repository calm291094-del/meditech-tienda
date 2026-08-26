// ═══════════════════════════════════════════════════════════
// 🔊 SISTEMA DE AUDIO PROCEDURAL
// ═══════════════════════════════════════════════════════════

WK.Audio = {
    ctx: null,
    on: true,
    
    init: function() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.on = false;
        }
    },
    
    resume: function() {
        if (this.ctx && this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch (e) {}
        }
    },
    
    tone: function(f, d, t, v) {
        if (!this.on || !this.ctx) return;
        this.resume();
        try {
            var o = this.ctx.createOscillator();
            var g = this.ctx.createGain();
            o.type = t || 'sine';
            o.frequency.value = f;
            g.gain.setValueAtTime(v || 0.08, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (d || 0.2));
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start();
            o.stop(this.ctx.currentTime + (d || 0.2));
        } catch (e) {}
    },
    
    play: function(n) {
        if (!this.on) return;
        var s = this;
        switch (n) {
            case 'click': s.tone(600, 0.06, 'square', 0.04); break;
            case 'build': s.tone(300, 0.12, 'triangle', 0.07); break;
            case 'discover':
                s.tone(523, 0.12, 'sine', 0.09);
                setTimeout(function(){s.tone(784, 0.2, 'sine', 0.09);}, 120);
                break;
            case 'birth': s.tone(880, 0.15, 'sine', 0.07); break;
            case 'death': s.tone(200, 0.3, 'sine', 0.07); break;
            case 'war': s.tone(150, 0.25, 'sawtooth', 0.07); break;
            case 'bark':
                s.tone(400, 0.08, 'square', 0.05);
                setTimeout(function(){s.tone(350, 0.08, 'square', 0.05);}, 80);
                break;
            case 'achv':
                s.tone(659, 0.1, 'sine', 0.09);
                setTimeout(function(){s.tone(880, 0.15, 'sine', 0.09);}, 100);
                break;
            case 'miracle':
                s.tone(523, 0.2, 'sine', 0.09);
                setTimeout(function(){s.tone(784, 0.3, 'sine', 0.09);}, 150);
                break;
        }
    }
};

console.log('[WK] Audio cargado');
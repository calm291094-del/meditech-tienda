// ═══════════════════════════════════════════════════════════
// ⚙️ CONFIGURACIÓN GLOBAL
// ═══════════════════════════════════════════════════════════

window.WK = window.WK || {};

WK.CFG = {
    TILE: 40,
    COLS: 110,
    ROWS: 80,
    TICK: 16,
    DAY: 120000,
    AGING: 0.00015,
    SEASON_LEN: 3600,
    MAX_DOGS: 12,
    MAX_POP: 100,
    WALL_R: 230,
    WALL_N: 16,
    WW: 4400,
    WH: 3200,
    ERAS: ['Piedra', 'Agrícola', 'Bronce', 'Hierro', 'Medieval', 'Industrial', 'Moderna', 'Futurista'],
    SEASONS: [
        { n: 'Primavera', e: '🌸', f: 1.3, c: '#4ade80' },
        { n: 'Verano', e: '☀️', f: 1.5, c: '#fbbf24' },
        { n: 'Otoño', e: '🍂', f: 1.0, c: '#f97316' },
        { n: 'Invierno', e: '❄️', f: 0.4, c: '#93c5fd' }
    ],
    DIFF: {
        peaceful: { t: 0.3, r: 1.5 },
        normal: { t: 1.0, r: 1.0 },
        hard: { t: 1.8, r: 0.7 },
        brutal: { t: 3.0, r: 0.4 }
    }
};

console.log('[WK] Configuración cargada');
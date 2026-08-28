// ============================================================
// CONTENT.JS
// Base de datos central y completa del juego Worl Kalm.
// Unifica TODO el contenido del antiguo data.js.
// Todo lo que agregues aquí aparece automáticamente.
// ============================================================

window.ContentDB = {

  // ==========================================================
  // RAZAS
  // ==========================================================
  races: [
    { id: 'human',    name: 'Humano',    emoji: '🧑', lifespan: 90,  speedMult: 1.0 },
    { id: 'elf',      name: 'Elfo',      emoji: '🧝', lifespan: 650, speedMult: 1.1 },
    { id: 'dwarf',    name: 'Enano',     emoji: '🧔', lifespan: 220, speedMult: 0.9 },
    { id: 'orc',      name: 'Orco',      emoji: '👹', lifespan: 85,  speedMult: 1.05 },
    { id: 'beastkin', name: 'Bestial',   emoji: '🐺', lifespan: 110, speedMult: 1.2 },
    { id: 'halfling', name: 'Mediano',   emoji: '🧒', lifespan: 120, speedMult: 1.15 },
    { id: 'giant',    name: 'Gigante',   emoji: '🗿', lifespan: 300, speedMult: 0.7 }
  ],

  // ==========================================================
  // ANIMALES (105 especies del data.js original)
  // hostile: si ataca NPCs
  // loot: qué suelta al morir
  // damage: daño al atacar
  // ==========================================================
  animals: [
    // === ERA 0: Prehistóricos / Comunes ===
    { id: 'a1',  name: 'Conejo',        emoji: '🐇', hp: 10,  speed: 80,  hostile: false, loot: { food: 3 } },
    { id: 'a2',  name: 'Ciervo',        emoji: '🦌', hp: 30,  speed: 100, hostile: false, loot: { food: 8 } },
    { id: 'a3',  name: 'Oveja',         emoji: '🐑', hp: 15,  speed: 60,  hostile: false, loot: { food: 5 } },
    { id: 'a4',  name: 'Jabalí',        emoji: '🐗', hp: 40,  speed: 90,  hostile: true,  loot: { food: 10 }, damage: 8 },
    { id: 'a5',  name: 'Lobo',          emoji: '🐺', hp: 50,  speed: 120, hostile: true,  loot: { food: 6 },  damage: 5 },
    { id: 'a6',  name: 'Oso',           emoji: '🐻', hp: 100, speed: 90,  hostile: true,  loot: { food: 15 }, damage: 12 },
    { id: 'a7',  name: 'Águila',        emoji: '🦅', hp: 20,  speed: 160, hostile: true,  loot: { food: 3 },  damage: 4 },
    { id: 'a8',  name: 'Cangrejo',      emoji: '🦀', hp: 10,  speed: 40,  hostile: false, loot: { food: 2 } },
    { id: 'a17', name: 'Zorro',         emoji: '🦊', hp: 25,  speed: 120, hostile: true,  loot: { food: 4 },  damage: 3 },
    { id: 'a18', name: 'Gato',          emoji: '🐈', hp: 12,  speed: 120, hostile: false, loot: {} },
    { id: 'a19', name: 'Perro Salvaje', emoji: '🐕', hp: 30,  speed: 100, hostile: true,  loot: { food: 4 },  damage: 4 },
    { id: 'a20', name: 'Caballo',       emoji: '🐎', hp: 40,  speed: 150, hostile: false, loot: { food: 10 } },
    { id: 'a21', name: 'Vaca',          emoji: '🐄', hp: 35,  speed: 60,  hostile: false, loot: { food: 12 } },
    { id: 'a22', name: 'Cerdo',         emoji: '🐖', hp: 20,  speed: 70,  hostile: false, loot: { food: 8 } },
    { id: 'a23', name: 'Gallina',       emoji: '🐓', hp: 8,   speed: 60,  hostile: false, loot: { food: 2 } },
    { id: 'a24', name: 'Pato',          emoji: '🦆', hp: 8,   speed: 80,  hostile: false, loot: { food: 2 } },
    { id: 'a25', name: 'Pavo',          emoji: '🦃', hp: 12,  speed: 60,  hostile: false, loot: { food: 4 } },
    { id: 'a26', name: 'Cabra',         emoji: '🐐', hp: 18,  speed: 90,  hostile: false, loot: { food: 5 } },
    { id: 'a27', name: 'Tortuga',       emoji: '🐢', hp: 20,  speed: 20,  hostile: false, loot: { food: 3 } },
    { id: 'a28', name: 'Serpiente',     emoji: '🐍', hp: 15,  speed: 80,  hostile: true,  loot: {},           damage: 3 },
    { id: 'a29', name: 'Rana',          emoji: '🐸', hp: 5,   speed: 80,  hostile: false, loot: { food: 1 } },
    { id: 'a30', name: 'Ratón',         emoji: '🐁', hp: 4,   speed: 80,  hostile: false, loot: {} },
    { id: 'a31', name: 'Ardilla',       emoji: '🐿️', hp: 8,   speed: 120, hostile: false, loot: { food: 1 } },
    { id: 'a32', name: 'Mapache',       emoji: '🦝', hp: 20,  speed: 80,  hostile: false, loot: { food: 3 } },
    { id: 'a33', name: 'Mofeta',        emoji: '🦨', hp: 15,  speed: 60,  hostile: false, loot: { food: 2 } },
    { id: 'a34', name: 'Tejón',         emoji: '🦡', hp: 30,  speed: 60,  hostile: true,  loot: { food: 4 },  damage: 5 },
    { id: 'a35', name: 'Castor',        emoji: '🦫', hp: 20,  speed: 60,  hostile: false, loot: { food: 3, wood: 2 } },
    { id: 'a57', name: 'Búho',          emoji: '🦉', hp: 15,  speed: 120, hostile: true,  loot: { food: 2 },  damage: 3 },
    { id: 'a58', name: 'Cuervo',        emoji: '🐦‍⬛', hp: 10,  speed: 140, hostile: false, loot: {} },
    { id: 'a59', name: 'Loro',          emoji: '🦜', hp: 12,  speed: 120, hostile: false, loot: {} },
    { id: 'a60', name: 'Flamenco',      emoji: '🦩', hp: 15,  speed: 80,  hostile: false, loot: { food: 2 } },
    { id: 'a63', name: 'Colibrí',       emoji: '🐦', hp: 3,   speed: 200, hostile: false, loot: {} },
    { id: 'a64', name: 'Pavo Real',     emoji: '🦚', hp: 15,  speed: 60,  hostile: false, loot: { food: 3 } },
    { id: 'a65', name: 'Mariposa',      emoji: '🦋', hp: 2,   speed: 120, hostile: false, loot: {} },
    { id: 'a66', name: 'Abeja',         emoji: '🐝', hp: 3,   speed: 160, hostile: true,  loot: { food: 1 },  damage: 1 },
    { id: 'a67', name: 'Escorpión',     emoji: '🦂', hp: 10,  speed: 60,  hostile: true,  loot: {},           damage: 4 },
    { id: 'a69', name: 'Iguana',        emoji: '🦎', hp: 15,  speed: 60,  hostile: false, loot: { food: 2 } },
    { id: 'a70', name: 'Camaleón',      emoji: '🦎', hp: 10,  speed: 40,  hostile: false, loot: {} },
    { id: 'a99', name: 'Hiena',         emoji: '🐕', hp: 45,  speed: 100, hostile: true,  loot: { food: 6 },  damage: 6 },
    { id: 'a100',name: 'Buitre',        emoji: '🦅', hp: 20,  speed: 100, hostile: false, loot: {} },

    // === ERA 1: Animales más grandes ===
    { id: 'a9',  name: 'Cocodrilo',     emoji: '🐊', hp: 120, speed: 60,  hostile: true,  loot: { food: 20 }, damage: 15 },
    { id: 'a10', name: 'Tiburón',       emoji: '🦈', hp: 80,  speed: 120, hostile: true,  loot: { food: 15 }, damage: 12 },
    { id: 'a11', name: 'León',          emoji: '🦁', hp: 90,  speed: 100, hostile: true,  loot: { food: 18 }, damage: 12 },
    { id: 'a12', name: 'Tigre',         emoji: '🐯', hp: 80,  speed: 120, hostile: true,  loot: { food: 15 }, damage: 12 },
    { id: 'a36', name: 'Nutria',        emoji: '🦦', hp: 15,  speed: 80,  hostile: false, loot: { food: 2 } },
    { id: 'a37', name: 'Foca',          emoji: '🦭', hp: 25,  speed: 60,  hostile: false, loot: { food: 5 } },
    { id: 'a38', name: 'Pingüino',      emoji: '🐧', hp: 15,  speed: 40,  hostile: false, loot: { food: 2 } },
    { id: 'a43', name: 'Pez Espada',    emoji: '🐟', hp: 30,  speed: 120, hostile: false, loot: { food: 6 } },
    { id: 'a44', name: 'Mantarraya',    emoji: '🐟', hp: 40,  speed: 80,  hostile: false, loot: { food: 8 } },
    { id: 'a45', name: 'Leopardo',      emoji: '🐆', hp: 70,  speed: 140, hostile: true,  loot: { food: 12 }, damage: 10 },
    { id: 'a46', name: 'Pantera',       emoji: '🐈‍⬛', hp: 80,  speed: 140, hostile: true,  loot: { food: 14 }, damage: 11 },
    { id: 'a48', name: 'Chimpancé',     emoji: '🐒', hp: 40,  speed: 100, hostile: false, loot: { food: 6 } },
    { id: 'a53', name: 'Cebra',         emoji: '🦓', hp: 40,  speed: 120, hostile: false, loot: { food: 8 } },
    { id: 'a54', name: 'Bisonte',       emoji: '🦬', hp: 80,  speed: 80,  hostile: false, loot: { food: 18 } },
    { id: 'a55', name: 'Alce',          emoji: '🦌', hp: 60,  speed: 80,  hostile: false, loot: { food: 14 } },
    { id: 'a56', name: 'Reno',          emoji: '🦌', hp: 50,  speed: 100, hostile: false, loot: { food: 12 } },
    { id: 'a61', name: 'Cisne',         emoji: '🦢', hp: 15,  speed: 80,  hostile: false, loot: { food: 3 } },
    { id: 'a62', name: 'Pelícano',      emoji: '🐦', hp: 20,  speed: 80,  hostile: false, loot: { food: 4 } },
    { id: 'a68', name: 'Araña Gigante', emoji: '🕷️', hp: 25,  speed: 80,  hostile: true,  loot: {},           damage: 5 },
    { id: 'a71', name: 'Komodo',        emoji: '🦎', hp: 60,  speed: 60,  hostile: true,  loot: { food: 10 }, damage: 8 },
    { id: 'a72', name: 'Piraña',        emoji: '🐟', hp: 10,  speed: 120, hostile: true,  loot: { food: 1 },  damage: 3 },
    { id: 'a73', name: 'Anguila',       emoji: '🐍', hp: 20,  speed: 80,  hostile: true,  loot: { food: 3 },  damage: 4 },
    { id: 'a74', name: 'Langosta',      emoji: '🦞', hp: 15,  speed: 40,  hostile: false, loot: { food: 4 } },
    { id: 'a93', name: 'Lobo Gélido',   emoji: '🐺', hp: 80,  speed: 120, hostile: true,  loot: { food: 10 }, damage: 8 },
    { id: 'a94', name: 'Oso Polar',     emoji: '🐻‍❄️', hp: 120, speed: 60,  hostile: true,  loot: { food: 20 }, damage: 14 },
    { id: 'a95', name: 'Búfalo',        emoji: '🦬', hp: 70,  speed: 80,  hostile: false, loot: { food: 16 } },
    { id: 'a96', name: 'Antílope',      emoji: '🦌', hp: 30,  speed: 140, hostile: false, loot: { food: 6 } },
    { id: 'a97', name: 'Jaguar',        emoji: '🐆', hp: 75,  speed: 120, hostile: true,  loot: { food: 12 }, damage: 10 },
    { id: 'a98', name: 'Puma',          emoji: '🐈', hp: 65,  speed: 120, hostile: true,  loot: { food: 10 }, damage: 9 },
    { id: 'a101',name: 'Anaconda',      emoji: '🐍', hp: 80,  speed: 60,  hostile: true,  loot: { food: 12 }, damage: 10 },
    { id: 'a102',name: 'Pez Globo',     emoji: '🐡', hp: 15,  speed: 60,  hostile: true,  loot: { food: 2 },  damage: 5 },
    { id: 'a103',name: 'Morena',        emoji: '🐍', hp: 35,  speed: 80,  hostile: true,  loot: { food: 5 },  damage: 6 },

    // === ERA 2: Gigantes prehistóricos ===
    { id: 'a13', name: 'Mamut',         emoji: '🦣', hp: 200, speed: 40,  hostile: true,  loot: { food: 40 }, damage: 20 },
    { id: 'a14', name: 'T-Rex',         emoji: '🦖', hp: 300, speed: 80,  hostile: true,  loot: { food: 60 }, damage: 30 },
    { id: 'a39', name: 'Delfín',        emoji: '🐬', hp: 60,  speed: 160, hostile: false, loot: { food: 12 } },
    { id: 'a40', name: 'Ballena',       emoji: '🐋', hp: 250, speed: 40,  hostile: false, loot: { food: 60 } },
    { id: 'a41', name: 'Pulpo',         emoji: '🐙', hp: 70,  speed: 80,  hostile: true,  loot: { food: 12 }, damage: 8 },
    { id: 'a42', name: 'Calamar',       emoji: '🦑', hp: 60,  speed: 100, hostile: true,  loot: { food: 10 }, damage: 7 },
    { id: 'a47', name: 'Gorila',        emoji: '🦍', hp: 100, speed: 80,  hostile: true,  loot: { food: 18 }, damage: 14 },
    { id: 'a49', name: 'Elefante',      emoji: '🐘', hp: 180, speed: 40,  hostile: false, loot: { food: 35 } },
    { id: 'a50', name: 'Rinoceronte',   emoji: '🦏', hp: 150, speed: 60,  hostile: true,  loot: { food: 30 }, damage: 16 },
    { id: 'a51', name: 'Hipopótamo',    emoji: '🦛', hp: 140, speed: 40,  hostile: true,  loot: { food: 28 }, damage: 15 },
    { id: 'a52', name: 'Jirafa',        emoji: '🦒', hp: 120, speed: 60,  hostile: false, loot: { food: 25 } },
    { id: 'a75', name: 'Erizo de Mar',  emoji: '🦔', hp: 10,  speed: 20,  hostile: true,  loot: { food: 2 },  damage: 2 },
    { id: 'a76', name: 'Estrella de Mar',emoji: '⭐', hp: 5,   speed: 12,  hostile: false, loot: {} },
    { id: 'a81', name: 'Basilisco',     emoji: '🐍', hp: 180, speed: 80,  hostile: true,  loot: { food: 25, gold: 20 }, damage: 18 },
    { id: 'a82', name: 'Minotauro',     emoji: '🐂', hp: 250, speed: 80,  hostile: true,  loot: { food: 30, gold: 30 }, damage: 22 },
    { id: 'a83', name: 'Cíclope',       emoji: '👁️', hp: 200, speed: 60,  hostile: true,  loot: { food: 25, gold: 25 }, damage: 20 },
    { id: 'a89', name: 'Yeti',          emoji: '🦍', hp: 200, speed: 80,  hostile: true,  loot: { food: 28, gold: 20 }, damage: 18 },
    { id: 'a90', name: 'Espectro',      emoji: '👻', hp: 100, speed: 120, hostile: true,  loot: { gold: 15 }, damage: 12 },
    { id: 'a91', name: 'Golem de Piedra',emoji: '🗿', hp: 400, speed: 40,  hostile: true,  loot: { stone: 30 }, damage: 25 },
    { id: 'a104',name: 'Narval',        emoji: '🐋', hp: 100, speed: 80,  hostile: false, loot: { food: 20, gold: 10 } },
    { id: 'a105',name: 'Orca',          emoji: '🐋', hp: 120, speed: 120, hostile: true,  loot: { food: 25 }, damage: 14 },

    // === ERA 3: Criaturas míticas ===
    { id: 'a15', name: 'Dragón',        emoji: '🐉', hp: 500, speed: 160, hostile: true,  loot: { food: 50, gold: 100 }, damage: 40 },
    { id: 'a16', name: 'Unicornio',     emoji: '🦄', hp: 200, speed: 120, hostile: false, loot: { gold: 50 } },
    { id: 'a77', name: 'Grifo',         emoji: '🦅', hp: 300, speed: 160, hostile: true,  loot: { food: 40, gold: 50 }, damage: 28 },
    { id: 'a78', name: 'Fénix',         emoji: '🔥', hp: 250, speed: 160, hostile: true,  loot: { gold: 60 },  damage: 25 },
    { id: 'a79', name: 'Kraken',        emoji: '🦑', hp: 400, speed: 80,  hostile: true,  loot: { food: 50, gold: 80 }, damage: 35 },
    { id: 'a80', name: 'Leviatán',      emoji: '🐋', hp: 450, speed: 80,  hostile: true,  loot: { food: 60, gold: 100 }, damage: 38 },
    { id: 'a84', name: 'Hidra',         emoji: '🐉', hp: 350, speed: 60,  hostile: true,  loot: { food: 45, gold: 60 }, damage: 30 },
    { id: 'a85', name: 'Mantícora',     emoji: '🦂', hp: 280, speed: 120, hostile: true,  loot: { food: 35, gold: 45 }, damage: 24 },
    { id: 'a86', name: 'Quimera',       emoji: '🦁', hp: 320, speed: 100, hostile: true,  loot: { food: 40, gold: 55 }, damage: 26 },
    { id: 'a87', name: 'Wyvern',        emoji: '🐲', hp: 280, speed: 160, hostile: true,  loot: { food: 35, gold: 50 }, damage: 25 },
    { id: 'a88', name: 'Behemoth',      emoji: '🦏', hp: 500, speed: 40,  hostile: true,  loot: { food: 70, gold: 80 }, damage: 35 },
    { id: 'a92', name: 'Elemental de Fuego', emoji: '🔥', hp: 200, speed: 80,  hostile: true,  loot: { gold: 40 }, damage: 20 }
  ],

  // ==========================================================
  // RECURSOS (nodos recolectables del mapa)
  // ==========================================================
  resources: [
    { id: 'tree',   name: 'Árbol',    emoji: '🌳', tile: 'forest', yield: { wood: 5 },  max: 30 },
    { id: 'berry',  name: 'Arbusto',  emoji: '🫐', tile: 'berry',  yield: { food: 3 },  max: 15 },
    { id: 'stone',  name: 'Piedra',   emoji: '🪨', tile: 'stone',  yield: { stone: 4 }, max: 25 },
    { id: 'ore',    name: 'Mineral',  emoji: '⛏️', tile: 'ore',    yield: { ore: 3 },   max: 20 },
    { id: 'herb',   name: 'Hierba',   emoji: '🌿', tile: 'grass',  yield: { food: 1 },  max: 10 },
    { id: 'mushroom',name: 'Hongo',   emoji: '🍄', tile: 'forest', yield: { food: 2 },  max: 8 }
  ],

  // ==========================================================
  // ARMAS (102 armas del data.js original)
  // era: era requerida para usarla
  // range: alcance en pixels
  // ==========================================================
  weapons: [
    // === ERA 0: Primitivas ===
    { id: 'w1',  name: 'Garrote',         emoji: '🪵', damage: 3,   range: 30,  era: 0 },
    { id: 'w2',  name: 'Roca Afilada',    emoji: '🪨', damage: 4,   range: 30,  era: 0 },
    { id: 'w3',  name: 'Lanza Caña',      emoji: '🔱', damage: 4,   range: 45,  era: 0 },
    { id: 'w4',  name: 'Honda',           emoji: '🪢', damage: 4,   range: 120, era: 0 },
    { id: 'w5',  name: 'Daga Hueso',      emoji: '🦴', damage: 5,   range: 25,  era: 0 },
    { id: 'w6',  name: 'Hacha Pedernal',  emoji: '🪓', damage: 5,   range: 30,  era: 0 },
    { id: 'w7',  name: 'Arco Corto',      emoji: '🏹', damage: 6,   range: 140, era: 0 },
    { id: 'w8',  name: 'Jabalina',        emoji: '🎯', damage: 6,   range: 100, era: 0 },
    { id: 'w9',  name: 'Maza Piedra',     emoji: '🔨', damage: 7,   range: 30,  era: 0 },
    { id: 'w10', name: 'Cuchillo Sílex',  emoji: '🔪', damage: 7,   range: 25,  era: 0 },
    { id: 'w11', name: 'Boomerang',       emoji: '🪃', damage: 6,   range: 80,  era: 0 },
    { id: 'w12', name: 'Atlatl',          emoji: '🔱', damage: 8,   range: 110, era: 0 },

    // === ERA 1: Bronce ===
    { id: 'w13', name: 'Hacha Bronce',    emoji: '🪓', damage: 12,  range: 30,  era: 1 },
    { id: 'w14', name: 'Espada Bronce',   emoji: '🗡️', damage: 10,  range: 30,  era: 1 },
    { id: 'w15', name: 'Lanza Bronce',    emoji: '🔱', damage: 11,  range: 45,  era: 1 },
    { id: 'w16', name: 'Arco Compuesto',  emoji: '🏹', damage: 14,  range: 180, era: 1 },
    { id: 'w17', name: 'Maza Guerra',     emoji: '🔨', damage: 15,  range: 30,  era: 1 },
    { id: 'w18', name: 'Daga Bronce',     emoji: '🔪', damage: 12,  range: 25,  era: 1 },
    { id: 'w19', name: 'Pico Bronce',     emoji: '⛏️', damage: 8,   range: 30,  era: 1 },
    { id: 'w23', name: 'Escudo Madera',   emoji: '🛡️', damage: 5,   range: 20,  era: 1 },
    { id: 'w24', name: 'Falx',            emoji: '🗡️', damage: 13,  range: 30,  era: 1 },
    { id: 'w25', name: 'Khopesh',         emoji: '🗡️', damage: 14,  range: 30,  era: 1 },
    { id: 'w53', name: 'Hoz Cosecha',     emoji: '🌾', damage: 8,   range: 30,  era: 1 },

    // === ERA 2: Hierro ===
    { id: 'w26', name: 'Espada Hierro',   emoji: '🗡️', damage: 20,  range: 30,  era: 2 },
    { id: 'w27', name: 'Hacha Hierro',    emoji: '🪓', damage: 22,  range: 30,  era: 2 },
    { id: 'w28', name: 'Ballesta',        emoji: '🏹', damage: 25,  range: 200, era: 2 },
    { id: 'w29', name: 'Alabarda',        emoji: '🔱', damage: 24,  range: 45,  era: 2 },
    { id: 'w30', name: 'Martillo Guerra', emoji: '🔨', damage: 28,  range: 30,  era: 2 },
    { id: 'w31', name: 'Pico Hierro',     emoji: '⛏️', damage: 12,  range: 30,  era: 2 },
    { id: 'w32', name: 'Espada Larga',    emoji: '🗡️', damage: 22,  range: 35,  era: 2 },
    { id: 'w33', name: 'Mandoble',        emoji: '⚔️', damage: 30,  range: 40,  era: 2 },
    { id: 'w34', name: 'Lanza Larga',     emoji: '🔱', damage: 26,  range: 50,  era: 2 },
    { id: 'w35', name: 'Arco Largo',      emoji: '🏹', damage: 28,  range: 220, era: 2 },
    { id: 'w36', name: 'Escudo Torre',    emoji: '🛡️', damage: 10,  range: 20,  era: 2 },
    { id: 'w37', name: 'Mangual',         emoji: '⛓️', damage: 27,  range: 35,  era: 2 },
    { id: 'w54', name: 'Pico Oro',        emoji: '⛏️', damage: 15,  range: 30,  era: 2 },
    { id: 'w58', name: 'Katana',          emoji: '🗡️', damage: 32,  range: 35,  era: 2 },
    { id: 'w59', name: 'Naginata',        emoji: '🔱', damage: 30,  range: 45,  era: 2 },
    { id: 'w60', name: 'Shuriken',        emoji: '⭐', damage: 18,  range: 100, era: 2 },
    { id: 'w61', name: 'Cimitarra',       emoji: '🗡️', damage: 28,  range: 30,  era: 2 },
    { id: 'w70', name: 'Barda',           emoji: '🔱', damage: 36,  range: 45,  era: 2 },
    { id: 'w71', name: 'Lucero del Alba', emoji: '⛓️', damage: 33,  range: 35,  era: 2 },
    { id: 'w72', name: 'Bec de Corbin',   emoji: '🔨', damage: 34,  range: 35,  era: 2 },
    { id: 'w73', name: 'Partesana',       emoji: '🔱', damage: 30,  range: 50,  era: 2 },
    { id: 'w74', name: 'Voulge',          emoji: '🪓', damage: 29,  range: 40,  era: 2 },
    { id: 'w75', name: 'Glaive',          emoji: '🔱', damage: 31,  range: 45,  era: 2 },
    { id: 'w94', name: 'Daga Veneno',     emoji: '🐍', damage: 45,  range: 25,  era: 2 },

    // === ERA 3: Acero / Medieval ===
    { id: 'w38', name: 'Espada Acero',    emoji: '🗡️', damage: 35,  range: 35,  era: 3 },
    { id: 'w39', name: 'Hacha Acero',     emoji: '🪓', damage: 38,  range: 35,  era: 3 },
    { id: 'w40', name: 'Arco Élite',      emoji: '🏹', damage: 40,  range: 240, era: 3 },
    { id: 'w41', name: 'Ballesta Pesada', emoji: '🏹', damage: 42,  range: 220, era: 3 },
    { id: 'w42', name: 'Alabarda Real',   emoji: '🔱', damage: 44,  range: 50,  era: 3 },
    { id: 'w43', name: 'Martillo Combate',emoji: '🔨', damage: 45,  range: 35,  era: 3 },
    { id: 'w62', name: 'Pica',            emoji: '🔱', damage: 35,  range: 55,  era: 3 },
    { id: 'w67', name: 'Sable',           emoji: '🗡️', damage: 38,  range: 35,  era: 3 },
    { id: 'w68', name: 'Florete',         emoji: '🗡️', damage: 25,  range: 40,  era: 3 },
    { id: 'w69', name: 'Guadaña',         emoji: '⚔️', damage: 40,  range: 45,  era: 3 },
    { id: 'w76', name: 'Scythe Guerra',   emoji: '⚔️', damage: 37,  range: 45,  era: 3 },
    { id: 'w77', name: 'Warhammer',       emoji: '🔨', damage: 46,  range: 35,  era: 3 },
    { id: 'w78', name: 'Maul',            emoji: '🔨', damage: 48,  range: 35,  era: 3 },
    { id: 'w79', name: 'Claymore',        emoji: '⚔️', damage: 42,  range: 45,  era: 3 },
    { id: 'w80', name: 'Zweihander',      emoji: '⚔️', damage: 50,  range: 50,  era: 3 },
    { id: 'w95', name: 'Ballesta Repetición', emoji: '🏹', damage: 38, range: 200, era: 3 },
    { id: 'w96', name: 'Arco Compuesto Élite', emoji: '🏹', damage: 44, range: 240, era: 3 },
    { id: 'w97', name: 'Pica Caballería', emoji: '🔱', damage: 40,  range: 55,  era: 3 },
    { id: 'w98', name: 'Lanza Dragón',    emoji: '🐉', damage: 115, range: 50,  era: 3 },
    { id: 'w99', name: 'Hacha Berserker', emoji: '🪓', damage: 55,  range: 40,  era: 3 },

    // === ERA 4: Pólvora ===
    { id: 'w63', name: 'Mosquete',        emoji: '🔫', damage: 50,  range: 300, era: 4 },
    { id: 'w64', name: 'Cañón Manual',    emoji: '💣', damage: 80,  range: 200, era: 4 },
    { id: 'w65', name: 'Rifle',           emoji: '🔫', damage: 60,  range: 350, era: 4 },
    { id: 'w66', name: 'Granada',         emoji: '💣', damage: 70,  range: 80,  era: 4 },

    // === ARMAS DIVINAS ===
    { id: 'w44', name: 'Espada Divina',   emoji: '⚔️', damage: 100, range: 40,  era: 3, divine: true },
    { id: 'w45', name: 'Rayo Zeus',       emoji: '⚡', damage: 200, range: 200, era: 3, divine: true },
    { id: 'w46', name: 'Tridente',        emoji: '🔱', damage: 110, range: 50,  era: 3, divine: true },
    { id: 'w47', name: 'Excalibur',       emoji: '🗡️', damage: 150, range: 45,  era: 3, divine: true },
    { id: 'w48', name: 'Mjolnir',         emoji: '🔨', damage: 180, range: 40,  era: 3, divine: true },
    { id: 'w49', name: 'Gungnir',         emoji: '🔱', damage: 160, range: 55,  era: 3, divine: true },
    { id: 'w50', name: 'Arco Artemisa',   emoji: '🏹', damage: 140, range: 300, era: 3, divine: true },
    { id: 'w51', name: 'Cetro Divino',    emoji: '🪄', damage: 120, range: 80,  era: 3, divine: true },
    { id: 'w52', name: 'Escudo Divino',   emoji: '🛡️', damage: 80,  range: 30,  era: 3, divine: true },
    { id: 'w81', name: 'Tridente Poseidón',emoji: '🔱',damage: 130, range: 50,  era: 3, divine: true },
    { id: 'w82', name: 'Arco Apolo',      emoji: '🏹', damage: 145, range: 300, era: 3, divine: true },
    { id: 'w83', name: 'Lanza Longinus',  emoji: '🔱', damage: 135, range: 55,  era: 3, divine: true },
    { id: 'w84', name: 'Hacha Hefesto',   emoji: '🪓', damage: 155, range: 40,  era: 3, divine: true },
    { id: 'w85', name: 'Báculo Atenea',   emoji: '🪄', damage: 125, range: 80,  era: 3, divine: true },
    { id: 'w86', name: 'Escudo Perseo',   emoji: '🛡️', damage: 90,  range: 30,  era: 3, divine: true },
    { id: 'w87', name: 'Espada Fuego',    emoji: '🔥', damage: 95,  range: 40,  era: 3, divine: true },
    { id: 'w88', name: 'Espada Hielo',    emoji: '❄️', damage: 95,  range: 40,  era: 3, divine: true },
    { id: 'w89', name: 'Espada Rayo',     emoji: '⚡', damage: 98,  range: 40,  era: 3, divine: true },
    { id: 'w90', name: 'Espada Sombra',   emoji: '🌑', damage: 92,  range: 40,  era: 3, divine: true },
    { id: 'w91', name: 'Espada Luz',      emoji: '✨', damage: 97,  range: 40,  era: 3, divine: true },
    { id: 'w92', name: 'Arco Viento',     emoji: '🌪️', damage: 88,  range: 280, era: 3, divine: true },
    { id: 'w93', name: 'Lanza Tierra',    emoji: '🪨', damage: 85,  range: 40,  era: 3, divine: true },
    { id: 'w100',name: 'Martillo Thor',   emoji: '🔨', damage: 190, range: 45,  era: 3, divine: true },
    { id: 'w101',name: 'Espada del Vacío',emoji: '🌀', damage: 160, range: 50,  era: 3, divine: true },
    { id: 'w102',name: 'Arco Celestial',  emoji: '🌟', damage: 170, range: 320, era: 3, divine: true }
  ],

  // ==========================================================
  // PROFESIONES con efectos
  // ==========================================================
  professions: [
    { id: 'farmer',       name: 'Granjero',       emoji: '🌾', bonuses: { gather_food: 1.5, farm: 1.5 } },
    { id: 'hunter',       name: 'Cazador',        emoji: '🏹', bonuses: { hunt: 1.6, combat: 1.3 } },
    { id: 'miner',        name: 'Minero',         emoji: '⛏️', bonuses: { gather_stone: 1.6, gather_ore: 1.6 } },
    { id: 'lumberjack',   name: 'Leñador',        emoji: '🪓', bonuses: { gather_wood: 1.7 } },
    { id: 'merchant',     name: 'Comerciante',    emoji: '💰', bonuses: { trade: 1.5 } },
    { id: 'guard',        name: 'Guardia',        emoji: '🛡️', bonuses: { combat: 1.8, defense: 1.5 } },
    { id: 'mage',         name: 'Mago',           emoji: '🔮', bonuses: { magic: 2.0 } },
    { id: 'priest',       name: 'Sacerdote',      emoji: '⛪', bonuses: { faith: 1.8 } },
    { id: 'blacksmith',   name: 'Herrero',        emoji: '🔨', bonuses: { craft: 1.7 } },
    { id: 'scholar',      name: 'Erudito',        emoji: '📚', bonuses: { knowledge: 1.6 } },
    { id: 'tavern_keeper',name: 'Tabernero',      emoji: '🍺', bonuses: { social: 1.5 } },
    { id: 'builder',      name: 'Constructor',    emoji: '🏗️', bonuses: { build: 1.6 } },
    { id: 'fisher',       name: 'Pescador',       emoji: '🎣', bonuses: { fish: 1.7 } },
    { id: 'healer',       name: 'Sanador',        emoji: '💊', bonuses: { heal: 1.8 } },
    { id: 'warrior',      name: 'Guerrero',       emoji: '⚔️', bonuses: { combat: 1.6 } },
    { id: 'explorer',     name: 'Explorador',     emoji: '🧭', bonuses: { explore: 1.5 } },
    { id: 'villager',     name: 'Aldeano',        emoji: '👤', bonuses: {} }
  ],

  // ==========================================================
  // EDIFICIOS / NEGOCIOS
  // cost: recursos necesarios para construir
  // produces: recurso que produce
  // rate: velocidad de producción
  // capacity: máximo de empleados
  // ==========================================================
  buildings: [
    // === VIVIENDAS ===
    { id: 'hut',        name: 'Choza',           emoji: '🛖', cost: { wood: 10 },                 produces: null,      rate: 0,   capacity: 2,  cat: 'house' },
    { id: 'wood_house', name: 'Casa Madera',     emoji: '🏠', cost: { wood: 20, stone: 5 },       produces: null,      rate: 0,   capacity: 4,  cat: 'house' },
    { id: 'stone_house',name: 'Casa Piedra',     emoji: '🏡', cost: { wood: 15, stone: 40 },      produces: null,      rate: 0,   capacity: 6,  cat: 'house' },
    { id: 'mansion',    name: 'Mansión',         emoji: '🏢', cost: { wood: 50, stone: 60 },      produces: null,      rate: 0,   capacity: 10, cat: 'house' },
    { id: 'villa',      name: 'Villa',           emoji: '🏡', cost: { wood: 40, stone: 30 },      produces: null,      rate: 0,   capacity: 8,  cat: 'house' },
    { id: 'apartment',  name: 'Apartamento',     emoji: '🏢', cost: { wood: 60, stone: 50 },      produces: null,      rate: 0,   capacity: 12, cat: 'house' },

    // === PRODUCCIÓN ===
    { id: 'farm',       name: 'Granja',          emoji: '🌾', cost: { wood: 15 },                 produces: 'food',    rate: 2.0, capacity: 3,  cat: 'prod', profession: 'farmer' },
    { id: 'quarry',     name: 'Cantera',         emoji: '⛏️', cost: { wood: 20, stone: 5 },       produces: 'stone',   rate: 1.5, capacity: 3,  cat: 'prod', profession: 'miner' },
    { id: 'mine',       name: 'Mina',            emoji: '🕳️', cost: { wood: 20, stone: 25 },      produces: 'ore',     rate: 1.0, capacity: 2,  cat: 'prod', profession: 'miner' },
    { id: 'lumbermill', name: 'Aserradero',      emoji: '🪚', cost: { wood: 20, stone: 10 },      produces: 'wood',    rate: 2.5, capacity: 3,  cat: 'prod', profession: 'lumberjack' },
    { id: 'smithy',     name: 'Herrería',        emoji: '🔨', cost: { wood: 25, stone: 20 },      produces: 'weapons', rate: 0.5, capacity: 2,  cat: 'prod', profession: 'blacksmith' },
    { id: 'fishery',    name: 'Pesquería',       emoji: '🐟', cost: { wood: 15, stone: 10 },      produces: 'food',    rate: 1.8, capacity: 2,  cat: 'prod', profession: 'fisher' },
    { id: 'bakery',     name: 'Panadería',       emoji: '🍞', cost: { wood: 15, stone: 10 },      produces: 'food',    rate: 2.2, capacity: 2,  cat: 'prod' },
    { id: 'brewery',    name: 'Cervecería',      emoji: '🍺', cost: { wood: 20, stone: 15 },      produces: 'gold',    rate: 2.5, capacity: 2,  cat: 'prod' },
    { id: 'apiary',     name: 'Apiario',         emoji: '🐝', cost: { wood: 8,  stone: 5 },       produces: 'food',    rate: 1.5, capacity: 1,  cat: 'prod' },
    { id: 'vineyard',   name: 'Viñedo',          emoji: '🍇', cost: { wood: 15, stone: 5 },       produces: 'gold',    rate: 2.0, capacity: 2,  cat: 'prod' },
    { id: 'orchard',    name: 'Huerto',          emoji: '🍎', cost: { wood: 12, stone: 5 },       produces: 'food',    rate: 1.8, capacity: 2,  cat: 'prod' },
    { id: 'pasture',    name: 'Pasto',           emoji: '🐑', cost: { wood: 10, stone: 5 },       produces: 'food',    rate: 1.5, capacity: 1,  cat: 'prod' },

    // === COMERCIO ===
    { id: 'tavern',     name: 'Taberna',         emoji: '🍺', cost: { wood: 20, stone: 15 },      produces: 'gold',    rate: 3.0, capacity: 4,  cat: 'civic', profession: 'tavern_keeper' },
    { id: 'market',     name: 'Mercado',         emoji: '🏪', cost: { wood: 35, stone: 20 },      produces: 'gold',    rate: 5.0, capacity: 5,  cat: 'prod', profession: 'merchant' },
    { id: 'warehouse',  name: 'Almacén',         emoji: '📦', cost: { wood: 25, stone: 20 },      produces: null,      rate: 0,   capacity: 0,  cat: 'prod' },
    { id: 'bank',       name: 'Banco',           emoji: '🏦', cost: { wood: 40, stone: 35 },      produces: 'gold',    rate: 4.0, capacity: 3,  cat: 'civic' },

    // === CÍVICOS ===
    { id: 'campfire',   name: 'Fogata',          emoji: '🔥', cost: { wood: 5 },                  produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'well',       name: 'Pozo',            emoji: '⛲', cost: { wood: 8,  stone: 10 },      produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'library',    name: 'Biblioteca',      emoji: '📚', cost: { wood: 30, stone: 20 },      produces: 'knowledge', rate: 0.8, capacity: 3, cat: 'civic', profession: 'scholar' },
    { id: 'hospital',   name: 'Hospital',        emoji: '🏥', cost: { wood: 40, stone: 30 },      produces: null,      rate: 0,   capacity: 2,  cat: 'civic', profession: 'healer' },
    { id: 'school',     name: 'Escuela',         emoji: '🏫', cost: { wood: 30, stone: 25 },      produces: 'knowledge', rate: 0.6, capacity: 2, cat: 'civic' },
    { id: 'university', name: 'Universidad',     emoji: '🎓', cost: { wood: 50, stone: 40 },      produces: 'knowledge', rate: 1.2, capacity: 4, cat: 'civic' },
    { id: 'theater',    name: 'Teatro',          emoji: '🎭', cost: { wood: 35, stone: 30 },      produces: 'gold',    rate: 2.0, capacity: 3,  cat: 'civic' },
    { id: 'bath',       name: 'Termas',          emoji: '🛁', cost: { wood: 25, stone: 20 },      produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'garden',     name: 'Jardín',          emoji: '🌺', cost: { wood: 10, stone: 5 },       produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'fountain',   name: 'Fuente',          emoji: '⛲', cost: { wood: 10, stone: 15 },      produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'monument',   name: 'Monumento',       emoji: '🗿', cost: { wood: 20, stone: 30 },      produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'park',       name: 'Parque',          emoji: '🌳', cost: { wood: 8,  stone: 3 },       produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },
    { id: 'plaza',      name: 'Plaza',           emoji: '🏛️', cost: { wood: 15, stone: 15 },      produces: null,      rate: 0,   capacity: 0,  cat: 'civic' },

    // === MILITARES ===
    { id: 'tower',      name: 'Torre Vigía',     emoji: '🗼', cost: { wood: 10, stone: 40 },      produces: null,      rate: 0,   capacity: 0,  cat: 'mil' },
    { id: 'barracks',   name: 'Cuartel',         emoji: '⚔️', cost: { wood: 30, stone: 25 },      produces: null,      rate: 0,   capacity: 4,  cat: 'mil', profession: 'guard' },
    { id: 'wall',       name: 'Muralla',         emoji: '🧱', cost: { stone: 15 },                produces: null,      rate: 0,   capacity: 0,  cat: 'mil' },
    { id: 'gate',       name: 'Puerta',          emoji: '🚪', cost: { wood: 15, stone: 20 },      produces: null,      rate: 0,   capacity: 0,  cat: 'mil' },
    { id: 'castle',     name: 'Castillo',        emoji: '🏰', cost: { wood: 100, stone: 150 },    produces: null,      rate: 0,   capacity: 20, cat: 'mil' },
    { id: 'archery',    name: 'Campo Tiro',      emoji: '🏹', cost: { wood: 15, stone: 10 },      produces: null,      rate: 0,   capacity: 0,  cat: 'mil' },
    { id: 'arena',      name: 'Arena',           emoji: '🏟️', cost: { wood: 40, stone: 35 },      produces: 'gold',    rate: 3.0, capacity: 0,  cat: 'mil' },

    // === RELIGIOSOS ===
    { id: 'temple',     name: 'Templo',          emoji: '🏛️', cost: { wood: 25, stone: 25 },      produces: 'faith',   rate: 1.0, capacity: 2,  cat: 'relig', profession: 'priest' },
    { id: 'shrine',     name: 'Santuario',       emoji: '⛩️', cost: { wood: 15, stone: 15 },      produces: 'faith',   rate: 0.6, capacity: 1,  cat: 'relig' },
    { id: 'cathedral',  name: 'Catedral',        emoji: '⛪', cost: { wood: 60, stone: 80 },      produces: 'faith',   rate: 2.0, capacity: 4,  cat: 'relig' },
    { id: 'monastery',  name: 'Monasterio',      emoji: '🏯', cost: { wood: 40, stone: 35 },      produces: 'faith',   rate: 1.5, capacity: 3,  cat: 'relig' },
    { id: 'oracle',     name: 'Oráculo',         emoji: '🔮', cost: { wood: 30, stone: 30 },      produces: 'faith',   rate: 1.2, capacity: 1,  cat: 'relig' },
    { id: 'altar',      name: 'Altar',           emoji: '🕯️', cost: { wood: 10, stone: 10 },      produces: 'faith',   rate: 0.4, capacity: 0,  cat: 'relig' },
    { id: 'totem',      name: 'Tótem',           emoji: '🗿', cost: { wood: 8,  stone: 5 },       produces: 'faith',   rate: 0.3, capacity: 0,  cat: 'relig' },

    // === MARAVILLAS ===
    { id: 'wonder_pyramid',    name: 'Pirámide',            emoji: '🔺', cost: { wood: 100, stone: 150 }, produces: 'faith', rate: 3.0, capacity: 0, cat: 'wonder' },
    { id: 'wonder_colossus',   name: 'Coloso',              emoji: '🗿', cost: { wood: 80,  stone: 120 }, produces: 'faith', rate: 2.5, capacity: 0, cat: 'wonder' },
    { id: 'wonder_garden',     name: 'Jardines Colgantes',  emoji: '🌺', cost: { wood: 60,  stone: 80 },  produces: 'food',  rate: 5.0, capacity: 0, cat: 'wonder' },
    { id: 'wonder_lighthouse', name: 'Faro Alejandría',     emoji: '🗼', cost: { wood: 70,  stone: 100 }, produces: 'gold',  rate: 4.0, capacity: 0, cat: 'wonder' },
    { id: 'wonder_rome',       name: 'Coliseo',             emoji: '🏟️', cost: { wood: 90,  stone: 130 }, produces: 'gold',  rate: 6.0, capacity: 0, cat: 'wonder' },
    { id: 'wonder_taj',        name: 'Taj Mahal',           emoji: '🕌', cost: { wood: 100, stone: 120 }, produces: 'faith', rate: 4.0, capacity: 0, cat: 'wonder' },
    { id: 'wonder_eiffel',     name: 'Torre Eiffel',        emoji: '🗼', cost: { wood: 80,  stone: 140 }, produces: 'gold',  rate: 5.0, capacity: 0, cat: 'wonder' },
    { id: 'wonder_space',      name: 'Puerta Estelar',      emoji: '🚀', cost: { wood: 200, stone: 200 }, produces: 'knowledge', rate: 8.0, capacity: 0, cat: 'wonder' }
  ],

  // ==========================================================
  // TECNOLOGÍAS
  // req: tecnologías requeridas
  // cost: costo en conocimiento
  // ==========================================================
  techs: [
    { id: 'huts',         name: 'Choza',            emoji: '🛖', era: 0, cost: 20,    req: [] },
    { id: 'fire',         name: 'Fuego',            emoji: '🔥', era: 0, cost: 50,    req: [] },
    { id: 'dog_taming',   name: 'Domar Perros',     emoji: '🐕', era: 0, cost: 60,    req: ['fire'] },
    { id: 'dog_breeding', name: 'Crianza Canina',   emoji: '🐶', era: 0, cost: 90,    req: ['dog_taming'] },
    { id: 'stone_tools',  name: 'Herramientas',     emoji: '🪓', era: 0, cost: 120,   req: ['fire'] },
    { id: 'language',     name: 'Lenguaje',         emoji: '💬', era: 0, cost: 160,   req: ['stone_tools'] },
    { id: 'well_dig',     name: 'Excavación',       emoji: '⛲', era: 0, cost: 70,    req: ['stone_tools'] },
    { id: 'fishing',      name: 'Pesca',            emoji: '🎣', era: 0, cost: 90,    req: ['fire'] },
    { id: 'agriculture',  name: 'Agricultura',      emoji: '🌾', era: 1, cost: 300,   req: ['stone_tools', 'language'] },
    { id: 'pottery',      name: 'Cerámica',         emoji: '🏺', era: 1, cost: 340,   req: ['fire', 'agriculture'] },
    { id: 'wood_houses',  name: 'Casa Madera',      emoji: '🏠', era: 1, cost: 420,   req: ['huts', 'stone_tools'] },
    { id: 'mysticism',    name: 'Misticismo',       emoji: '🌙', era: 1, cost: 380,   req: ['fire', 'language'] },
    { id: 'medicine',     name: 'Medicina',         emoji: '🏥', era: 1, cost: 250,   req: ['language'] },
    { id: 'writing',      name: 'Escritura',        emoji: '📜', era: 2, cost: 600,   req: ['language', 'pottery'] },
    { id: 'bronze',       name: 'Bronce',           emoji: '⚱️', era: 2, cost: 700,   req: ['pottery', 'stone_tools'] },
    { id: 'masonry',      name: 'Albañilería',      emoji: '🧱', era: 2, cost: 850,   req: ['writing', 'bronze'] },
    { id: 'stone_houses', name: 'Casa Piedra',      emoji: '🏡', era: 2, cost: 950,   req: ['masonry', 'wood_houses'] },
    { id: 'iron',         name: 'Hierro',           emoji: '⚔️', era: 3, cost: 1200,  req: ['bronze', 'masonry'] },
    { id: 'currency',     name: 'Moneda',           emoji: '🪙', era: 3, cost: 1300,  req: ['writing', 'iron'] },
    { id: 'philosophy',   name: 'Filosofía',        emoji: '🏛️', era: 3, cost: 1500,  req: ['writing', 'currency'] },
    { id: 'gunpowder',    name: 'Pólvora',          emoji: '🧨', era: 4, cost: 2000,  req: ['iron', 'philosophy'] },
    { id: 'printing',     name: 'Imprenta',         emoji: '📚', era: 4, cost: 2300,  req: ['philosophy', 'currency'] },
    { id: 'steam',        name: 'Vapor',            emoji: '🚂', era: 5, cost: 3200,  req: ['gunpowder', 'printing'] },
    { id: 'electricity',  name: 'Electricidad',     emoji: '⚡', era: 5, cost: 4200,  req: ['steam'] },
    { id: 'flight',       name: 'Vuelo',            emoji: '✈️', era: 6, cost: 5500,  req: ['electricity', 'steam'] },
    { id: 'internet',     name: 'Internet',         emoji: '🌐', era: 6, cost: 7000,  req: ['electricity', 'flight'] },
    { id: 'ai_tech',      name: 'IA',               emoji: '🤖', era: 7, cost: 9000,  req: ['internet'] },
    { id: 'space',        name: 'Era Espacial',     emoji: '🚀', era: 7, cost: 12000, req: ['ai_tech'] }
  ],

  // ==========================================================
  // PANTEÓN (DIOSES)
  // ==========================================================
  pantheon: [
    { id: 'ares',      name: 'Ares',      emoji: '⚔️', dom: 'Guerra',     fx: '+50% daño',       cost: 100 },
    { id: 'aphrodite', name: 'Afrodita',  emoji: '💖', dom: 'Amor',       fx: 'x2 nacimientos',  cost: 80  },
    { id: 'demeter',   name: 'Deméter',   emoji: '🌾', dom: 'Cosecha',    fx: '+80% granjas',    cost: 90  },
    { id: 'poseidon',  name: 'Poseidón',  emoji: '🌊', dom: 'Mar',        fx: 'x2 pesca',        cost: 85  },
    { id: 'zeus',      name: 'Zeus',      emoji: '⚡', dom: 'Cielo',      fx: 'Rayos',           cost: 120 },
    { id: 'athena',    name: 'Atenea',    emoji: '🦉', dom: 'Sabiduría',  fx: '+100% saber',     cost: 100 },
    { id: 'hephaestus',name: 'Hefesto',   emoji: '🔨', dom: 'Forja',      fx: '+60% construcción',cost: 95  },
    { id: 'artemis',   name: 'Artemisa',  emoji: '🏹', dom: 'Caza',       fx: '+80% caza',       cost: 75  }
  ],

  // ==========================================================
  // PERSONALIDADES
  // ==========================================================
  personalities: [
    { id: 'worker',    name: 'Trabajador',  emoji: '⚒️' },
    { id: 'wise',      name: 'Sabio',       emoji: '🦉' },
    { id: 'warrior',   name: 'Guerrero',    emoji: '⚔️' },
    { id: 'social',    name: 'Sociable',    emoji: '🎭' },
    { id: 'pious',     name: 'Piadoso',     emoji: '🕊️' },
    { id: 'merchant',  name: 'Mercader',    emoji: '🪙' },
    { id: 'explorer',  name: 'Explorador',  emoji: '🧭' },
    { id: 'farmer',    name: 'Granjero',    emoji: '🌾' }
  ],

  // ==========================================================
  // RASGOS
  // ==========================================================
  traits: [
    { id: 'strong',      name: 'Fuerte',       emoji: '💪' },
    { id: 'smart',       name: 'Inteligente',  emoji: '🧠' },
    { id: 'fertile',     name: 'Fértil',       emoji: '🌱' },
    { id: 'charismatic', name: 'Carismático',  emoji: '✨' },
    { id: 'brave',       name: 'Valiente',     emoji: '🦁' },
    { id: 'swift',       name: 'Veloz',        emoji: '⚡' },
    { id: 'sickly',      name: 'Enfermizo',    emoji: '🤒' },
    { id: 'glutton',     name: 'Glotón',       emoji: '🍖' }
  ],

  // ==========================================================
  // GUSTOS
  // ==========================================================
  likes: [
    'la música', 'la caza', 'el agua', 'el fuego',
    'las estrellas', 'la tierra', 'los animales', 'la lluvia',
    'el oro', 'la fe', 'los perros', 'la cocina',
    'la aventura', 'la paz'
  ],

  // ==========================================================
  // NOMBRES
  // ==========================================================
  names: [
    'Aria', 'Borin', 'Cael', 'Dara', 'Elio', 'Fael', 'Gael', 'Hira',
    'Ilo', 'Jora', 'Kael', 'Lyra', 'Miro', 'Nia', 'Orin', 'Pia',
    'Rion', 'Sia', 'Tiro', 'Ulia', 'Vane', 'Wren', 'Xio', 'Yara', 'Zane'
  ],

  // ==========================================================
  // NOMBRES DE PERROS
  // ==========================================================
  dogNames: [
    'Firulais', 'Toby', 'Nala', 'Simba', 'Bobby', 'Kira', 'Leo', 'Mia',
    'Zeus', 'Thor', 'Lola', 'Bruno', 'Canela', 'Rocky', 'Sasha', 'Rex',
    'Max', 'Luna', 'Shadow', 'Duke'
  ],

  // ==========================================================
  // RIVALES
  // ==========================================================
  rivals: [
    'Los Salvajes', 'Los Nómadas', 'Los Bárbaros',
    'Los Errantes', 'Los Sombríos', 'Los Feroces'
  ],

  // ==========================================================
  // AVATARES (para el dios jugador)
  // ==========================================================
  avatars: ['👑', '⚡', '🔱', '🌟', '🔥', '🌊', '🦉', '☀️', '🌙', '⭐'],

  // ==========================================================
  // LOGROS
  // ==========================================================
  achievements: [
    { id: 'first_build', name: 'Constructor',     emoji: '🏗️', desc: 'Primer edificio' },
    { id: 'first_puppy', name: 'Vida Canina',     emoji: '🐶', desc: 'Primer cachorro' },
    { id: 'first_war',   name: 'Victoria',        emoji: '⚔️', desc: 'Gana una guerra' },
    { id: 'pop20',       name: 'Aldea',           emoji: '👥', desc: '20 habitantes' },
    { id: 'pop50',       name: 'Ciudad',          emoji: '🏙️', desc: '50 habitantes' },
    { id: 'era1',        name: 'Agricultura',     emoji: '🌾', desc: 'Era Agrícola' },
    { id: 'era3',        name: 'Hierro',          emoji: '⚔️', desc: 'Era del Hierro' },
    { id: 'era5',        name: 'Industrial',      emoji: '🚂', desc: 'Era Industrial' },
    { id: 'gods8',       name: 'Panteón',         emoji: '🏛️', desc: '8 dioses activos' },
    { id: 'dogs10',      name: 'Señor Perros',    emoji: '🐕', desc: '10 perros' },
    { id: 'walls',       name: 'Fortaleza',       emoji: '🧱', desc: 'Muralla completa' },
    { id: 'space',       name: 'Estrellas',       emoji: '🚀', desc: 'Era Espacial' },
    { id: 'npc_created', name: 'Creación Divina', emoji: '👤', desc: 'Crea un NPC' }
  ],

  // ==========================================================
  // ERAS HISTÓRICAS
  // ==========================================================
  eras: [
    'Piedra', 'Agrícola', 'Bronce', 'Hierro',
    'Medieval', 'Industrial', 'Moderna', 'Futurista'
  ],

  // ==========================================================
  // ESTACIONES
  // f: factor de producción agrícola
  // ==========================================================
  seasons: [
    { name: 'Primavera', emoji: '🌸', factor: 1.3, color: '#4ade80' },
    { name: 'Verano',    emoji: '☀️', factor: 1.5, color: '#fbbf24' },
    { name: 'Otoño',     emoji: '🍂', factor: 1.0, color: '#f97316' },
    { name: 'Invierno',  emoji: '❄️', factor: 0.4, color: '#93c5fd' }
  ],

  // ==========================================================
  // TIPOS DE TILE del mapa
  // ==========================================================
  tiles: {
    water:  { id: 0, color: 0x1e40af, walkable: false, name: 'Agua'   },
    sand:   { id: 1, color: 0xfde68a, walkable: true,  name: 'Arena'  },
    grass:  { id: 2, color: 0x4ade80, walkable: true,  name: 'Hierba' },
    forest: { id: 3, color: 0x14532d, walkable: true,  name: 'Bosque' },
    stone:  { id: 4, color: 0x57534e, walkable: true,  name: 'Piedra' },
    ore:    { id: 5, color: 0x78716c, walkable: true,  name: 'Mineral'}
  },

  // ==========================================================
  // BIENES COMERCIALIZABLES
  // ==========================================================
  goods: [
    { id: 'food',      name: 'Comida',    emoji: '🍖', basePrice: 5  },
    { id: 'wood',      name: 'Madera',    emoji: '🪵', basePrice: 3  },
    { id: 'stone',     name: 'Piedra',    emoji: '🪨', basePrice: 4  },
    { id: 'ore',       name: 'Mineral',   emoji: '⛏️', basePrice: 8  },
    { id: 'weapons',   name: 'Armas',     emoji: '⚔️', basePrice: 25 },
    { id: 'faith',     name: 'Fe',        emoji: '✨', basePrice: 10 },
    { id: 'knowledge', name: 'Saber',     emoji: '📖', basePrice: 15 },
    { id: 'gold',      name: 'Oro',       emoji: '💰', basePrice: 1  }
  ],

  // ==========================================================
  // DIFICULTADES
  // t: multiplicador de amenazas
  // r: multiplicador de recursos
  // ==========================================================
  difficulties: {
    peaceful: { name: 'Pacífico', emoji: '🕊️', threats: 0.3, resources: 1.5 },
    normal:   { name: 'Normal',   emoji: '⚖️', threats: 1.0, resources: 1.0 },
    hard:     { name: 'Difícil',  emoji: '⚔️', threats: 1.8, resources: 0.7 },
    brutal:   { name: 'Brutal',   emoji: '💀', threats: 3.0, resources: 0.4 }
  },

  // ==========================================================
  // HELPERS
  // ==========================================================
  randomFromArray(arr) {
    return arr && arr.length ? Phaser.Utils.Array.GetRandom(arr) : null;
  },
  randomRace()          { return this.randomFromArray(this.races); },
  randomAnimal()        { return this.randomFromArray(this.animals); },
  randomWeapon()        { return this.randomFromArray(this.weapons); },
  randomProfession()    { return this.randomFromArray(this.professions); },
  randomName()          { return this.randomFromArray(this.names); },
  randomDogName()       { return this.randomFromArray(this.dogNames); },
  randomResource()      { return this.randomFromArray(this.resources); },
  randomBuilding()      { return this.randomFromArray(this.buildings); },
  randomPersonality()   { return this.randomFromArray(this.personalities); },
  randomTrait()         { return this.randomFromArray(this.traits); },
  randomLike()          { return this.randomFromArray(this.likes); },
  randomRival()         { return this.randomFromArray(this.rivals); },
  randomAvatar()        { return this.randomFromArray(this.avatars); },

  randomDogName() {
    const names = ['Rex', 'Max', 'Luna', 'Rocky', 'Bella', 'Charlie', 'Daisy', 'Buddy', 'Molly', 'Bear'];
    return Phaser.Utils.Array.GetRandom(names);
  },
  
  findById(arr, id) {
    return arr.find(x => x.id === id) || null;
  },

  findByCategory(arr, category) {
    return arr.filter(x => x.cat === category);
  },

  // ==========================================================
  // EXTENSIÓN DINÁMICA
  // ==========================================================
  addRace(obj)          { this.races.push(obj); },
  addAnimal(obj)        { this.animals.push(obj); },
  addWeapon(obj)        { this.weapons.push(obj); },
  addProfession(obj)    { this.professions.push(obj); },
  addResource(obj)      { this.resources.push(obj); },
  addBuilding(obj)      { this.buildings.push(obj); },
  addTech(obj)          { this.techs.push(obj); },
  addGod(obj)           { this.pantheon.push(obj); },
  addPersonality(obj)   { this.personalities.push(obj); },
  addTrait(obj)         { this.traits.push(obj); },
  addName(name)         { if (!this.names.includes(name)) this.names.push(name); },
  addAchievement(obj)   { this.achievements.push(obj); },

  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================
  stats() {
    return {
      razas: this.races.length,
      animales: this.animals.length,
      armas: this.weapons.length,
      profesiones: this.professions.length,
      edificios: this.buildings.length,
      tecnologias: this.techs.length,
      dioses: this.pantheon.length,
      logros: this.achievements.length
    };
  }
};

// ============================================================
// Inicialización
// ============================================================
console.log('[ContentDB] Base de datos completa cargada:', ContentDB.stats());
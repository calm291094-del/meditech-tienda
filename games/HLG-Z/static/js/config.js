'use strict';
/* CONFIG CENTRAL — datos y balance */
window.CONFIG = {
  NOISE: { DECAY:8, HORDE_THRESHOLD:50, ATTRACT_RADIUS:60, RADIO:2.5 },
  HORDE: { FIRST_NIGHT:2, BASE_SIZE:8, GROWTH_PER_DAY:5, COUNTDOWN:45, SPAWN_INTERVAL:1.2 },
  BASE: { WALL_COST:40, TRAP_COST:60, TURRET_COST:150, WALL_HP:200, TRAP_DMG:80,
          TURRET_DMG:15, TURRET_RANGE:15, TURRET_RATE:0.8 },
  LOMA: { ESCALONES:458, REQUIERE_DIA:5, ZONA_X:0, ZONA_Z:-175 }
};

/* TIPOS DE ZOMBI */
window.ZOMBIE_TYPES = {
  caminante: { name:'Caminante', color:0x6a8a5a, scale:1.0, hp:42,  dmg:10, speed:1.5, aggro:15 },
  corredor:  { name:'Corredor',  color:0x8a4a3a, scale:0.95, hp:30, dmg:14, speed:5.5, aggro:25 },
  gordo:     { name:'Gordo',     color:0x4a5a3a, scale:1.8, hp:150, dmg:25, speed:1.2, aggro:12, explode:true },
  chillon:   { name:'Chillón',   color:0x7a3a7a, scale:1.1, hp:50,  dmg:8,  speed:2.5, aggro:20, screams:true },
  escupidor: { name:'Escupidor', color:0x3a7a4a, scale:1.0, hp:45,  dmg:0,  speed:1.8, aggro:22, spits:true, spitDmg:12, spitRange:12 },
  sigiloso:  { name:'Sigiloso',  color:0x2a2a3a, scale:0.9, hp:35,  dmg:18, speed:3.0, aggro:30, stealth:true }
};

/* ÁRBOL DE SKILLS */
window.SKILLS = {
  fuerza1:  { branch:'FUERZA', name:'Golpe Potente',     icon:'💪', desc:'+30% daño melee', max:3, cost:1 },
  fuerza2:  { branch:'FUERZA', name:'Flechas Pesadas',   icon:'🏹', desc:'+20% daño de arco', max:3, cost:1 },
  fuerza3:  { branch:'FUERZA', name:'Empujón',           icon:'🤜', desc:'Melee empuja zombis', max:1, cost:2 },
  sigilo1:  { branch:'SIGILO', name:'Pasos Ligeros',     icon:'👣', desc:'-40% ruido al moverte', max:3, cost:1 },
  sigilo2:  { branch:'SIGILO', name:'Arco Silencioso',   icon:'🔇', desc:'-50% ruido del arco', max:2, cost:1 },
  sigilo3:  { branch:'SIGILO', name:'Puñalada Trasera',  icon:'🗡', desc:'x2 daño por la espalda', max:1, cost:2 },
  superv1:  { branch:'SUPERVIVENCIA', name:'Estómago de Hierro', icon:'🍖', desc:'-30% hambre', max:3, cost:1 },
  superv2:  { branch:'SUPERVIVENCIA', name:'Corazón Fuerte', icon:'❤️', desc:'+25 estamina máx', max:3, cost:1 },
  superv3:  { branch:'SUPERVIVENCIA', name:'Inmunidad', icon:'💉', desc:'-50% riesgo infección', max:2, cost:2 },
  ing1:     { branch:'INGENIERÍA', name:'Manitas', icon:'🔧', desc:'-30% coste de base', max:3, cost:1 },
  ing2:     { branch:'INGENIERÍA', name:'Trampas Mortales', icon:'🪤', desc:'+50% daño de trampas', max:2, cost:1 },
  ing3:     { branch:'INGENIERÍA', name:'Mecánico', icon:'🚗', desc:'Reparas coches', max:1, cost:2 }
};
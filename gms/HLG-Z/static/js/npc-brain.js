'use strict';
/* ============================================================
   MOTOR DE IA DE NPCs
   Personalidades + profesiones + aprendizaje + pensamientos
   ============================================================ */
window.NpcBrain = (function(){
  let DATA = null;
  let brains = [];
  let thoughtFeed = [];
  let thoughtTimer = 0;
  let loaded = false;
  
  // Carga los datos del JSON
  function init(){
    fetch('static/data/npc-data.json')
      .then(function(r){ return r.json(); })
      .then(function(json){
        DATA = json;
        loaded = true;
        console.log('[NpcBrain] ✓ Datos cargados:', DATA.personalities.length, 'personalidades');
      })
      .catch(function(e){
        console.warn('[NpcBrain] No se pudo cargar npc-data.json, usando fallback', e);
        DATA = createFallbackData();
        loaded = true;
      });
  }
  
  // Datos de respaldo si el JSON no carga
  function createFallbackData(){
    return {
      names:{male:['Carlos','Pedro','Raúl'],female:['Yaneli','Maité','Lianet']},
      professions:[{id:'medico',name:'Médico',icon:'🩺',skill:'healing'}],
      personalities:[{id:'valiente',name:'Valiente',traits:{courage:0.8,optimism:0.6},
        thoughts:{idle:['Estoy listo.'],combat:['¡Vamos!'],night:['Cuidado.'],learned:['Aprendí algo.']}}],
      observations:{seeZombie:['Ahí viene uno.'],playerKill:['¡Bien!'],nightfall:['Se hace de noche.']}
    };
  }
  
  // Genera un NPC nuevo con personalidad, profesión y nombre únicos
  function createNpc(){
    if(!loaded || !DATA) return null;
    const personality = pick(DATA.personalities);
    const profession = pick(DATA.professions);
    const isMale = Math.random() < 0.5;
    const namePool = isMale ? DATA.names.male : DATA.names.female;
    const name = pick(namePool);
    
    const brain = {
      name: name,
      gender: isMale ? 'male' : 'female',
      personality: personality,
      profession: profession,
      traits: Object.assign({}, personality.traits),
      memory: [],
      beliefs: {},
      mood: 'neutral',
      trust: 0.5,
      learned: [],
      lastThought: 0
    };
    brains.push(brain);
    return brain;
  }
  
  // Registra un evento en la memoria del NPC (aprendizaje)
  function learn(brain, eventType, details){
    if(!brain) return;
    brain.memory.push({ type:eventType, details:details, time:Date.now() });
    if(brain.memory.length > 20) brain.memory.shift();
    
    // Ajustar creencias según el evento
    if(eventType === 'playerKill'){
      brain.trust = Math.min(1, brain.trust + 0.05);
      brain.beliefs.playerStrong = true;
    }
    if(eventType === 'zombieNear'){
      brain.traits.courage = Math.max(0.1, brain.traits.courage - 0.01);
      brain.beliefs.danger = true;
    }
    if(eventType === 'survivedNight'){
      brain.traits.courage = Math.min(1, brain.traits.courage + 0.02);
      brain.learned.push('Sobreviví otra noche');
      emitThought(brain, 'learned');
    }
    if(eventType === 'playerHelped'){
      brain.trust = Math.min(1, brain.trust + 0.1);
    }
  }
  
  // Genera y emite un pensamiento según el contexto
  function emitThought(brain, contextKey){
    if(!brain || !brain.personality) return;
    const thoughts = brain.personality.thoughts[contextKey];
    if(!thoughts || !thoughts.length) return;
    const text = pick(thoughts);
    pushToFeed(brain, text);
  }
  
  // Genera una observación contextual
  function observe(obsKey){
    if(!DATA || !DATA.observations[obsKey]) return;
    const alive = brains.filter(function(b){ return b; });
    if(!alive.length) return;
    const brain = pick(alive);
    const text = pick(DATA.observations[obsKey]);
    pushToFeed(brain, text);
  }
  
  // Añade un pensamiento al feed (el "chat")
  function pushToFeed(brain, text){
    const entry = {
      name: brain.name,
      profession: brain.profession.name,
      icon: brain.profession.icon,
      personality: brain.personality.name,
      text: text,
      time: Date.now()
    };
    thoughtFeed.push(entry);
    if(thoughtFeed.length > 15) thoughtFeed.shift();
    if(window.NpcChat) NpcChat.render(thoughtFeed);
  }
  
  // Actualización periódica: los NPC piensan solos según el contexto
  function update(dt, context){
    if(!loaded || !brains.length) return;
    thoughtTimer -= dt;
    if(thoughtTimer > 0) return;
    thoughtTimer = 8 + Math.random() * 8;
    
    const brain = pick(brains);
    if(!brain) return;
    
    // Elegir contexto según la situación
    let key = 'idle';
    if(context.isNight) key = 'night';
    else if(context.inCombat) key = 'combat';
    else if(context.justLearned) key = 'learned';
    emitThought(brain, key);
  }
  
  // Obtiene una descripción completa del NPC (para diálogos)
  function describe(brain){
    if(!brain) return '';
    return brain.name + ', ' + brain.profession.name.toLowerCase() + 
           ' (' + brain.personality.name.toLowerCase() + ')';
  }
  
  function getBrains(){ return brains; }
  function getFeed(){ return thoughtFeed; }
  function clear(){ brains = []; thoughtFeed = []; }
  
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  
  return {
    init:init, createNpc:createNpc, learn:learn,
    emitThought:emitThought, observe:observe, update:update,
    describe:describe, getBrains:getBrains, getFeed:getFeed, clear:clear
  };
})();
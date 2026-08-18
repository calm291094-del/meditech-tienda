/* ============================================
   SISTEMA DE GUARDADO
   - localStorage para partida actual
   - Auto-guardado cada 3 minutos
   - Exportar/Importar partida a JSON
   - Manejo de múltiples slots (futuro)
   ============================================ */
'use strict';
window.SaveSystem = (function(){
  const STORAGE_KEY = 'hdz_save_v2';
  const RECORD_KEY = 'hdz_best';
  const AUTOSAVE_INTERVAL = 180; // 3 minutos
  let lastAutoSave = 0;
  
  function canSave(){
    try { return !!window.localStorage; } catch(e){ return false; }
  }
  
  /* Guarda el estado completo del juego */
  function save(gameState){
    if (!canSave()) {
      window.toast && window.toast('Guardado no disponible', 'bad');
      return false;
    }
    try {
      const data = {
        version: 2,
        timestamp: Date.now(),
        mode: gameState.mode,
        day: gameState.day,
        dayT: gameState.dayT,
        hour: gameState.hour,
        players: gameState.players.map(p => ({
          idx: p.idx,
          pos: { x: p.pos.x, z: p.pos.z },
          yaw: p.yaw,
          hp: p.hp,
          hunger: p.hunger,
          stam: p.stam,
          infected: p.infected,
          money: p.money,
          level: p.level,
          kills: p.kills,
          killsLvl: p.killsLvl,
          weapons: p.weapons,
          cur: p.cur,
          ammo: p.ammo,
          mag: p.mag,
          items: p.items
        })),
        npcs: (window.NPCSystem.getAll() || []).map(n => ({
          id: n.id, name: n.name, x: n.x, z: n.z,
          hp: n.hp, level: n.level, kills: n.kills,
          recruited: n.recruited, dead: n.dead,
          memory: n.memory
        })),
        missions: (window.Missions.getAll() || []).map(m => ({
          id: m.id, type: m.type, title: m.title, description: m.description,
          x: m.x, z: m.z, difficulty: m.difficulty, status: m.status,
          progress: m.progress, goal: m.goal, reward: m.reward,
          targetItem: m.targetItem
        })),
        world: gameState.world || {},
        explored: gameState.explored || null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showAutoSaveIndicator('PARTIDA GUARDADA');
      window.toast && window.toast('✓ Partida guardada', 'good');
      return true;
    } catch(e){
      console.error('Error al guardar:', e);
      window.toast && window.toast('Error al guardar', 'bad');
      return false;
    }
  }
  
  /* Carga el estado del juego */
  function load(){
    if (!canSave()) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== 2) {
        window.toast && window.toast('Partida incompatible', 'bad');
        return null;
      }
      return data;
    } catch(e){
      console.error('Error al cargar:', e);
      return null;
    }
  }
  
  function hasSave(){
    return !!localStorage.getItem(STORAGE_KEY);
  }
  
  function deleteSave(){
    localStorage.removeItem(STORAGE_KEY);
  }
  
  /* Auto-guardado periódico */
  function tickAutoSave(gameState, currentGameTime){
    if (currentGameTime - lastAutoSave > AUTOSAVE_INTERVAL) {
      lastAutoSave = currentGameTime;
      save(gameState);
    }
  }
  
  function showAutoSaveIndicator(text){
    let ind = document.getElementById('autosave-indicator');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'autosave-indicator';
      document.body.appendChild(ind);
    }
    ind.textContent = '💾 ' + text;
    ind.classList.add('show');
    clearTimeout(ind._t);
    ind._t = setTimeout(() => ind.classList.remove('show'), 2500);
  }
  
  /* Récords */
  function updateRecord(kills, level, day){
    try {
      const cur = JSON.parse(localStorage.getItem(RECORD_KEY) || '{"k":0,"lv":0,"d":0}');
      let isNew = false;
      if (kills > cur.k || level > cur.lv || day > cur.d) {
        cur.k = Math.max(cur.k, kills);
        cur.lv = Math.max(cur.lv, level);
        cur.d = Math.max(cur.d, day);
        localStorage.setItem(RECORD_KEY, JSON.stringify(cur));
        isNew = true;
      }
      return { cur, isNew };
    } catch(e){ return { cur: { k:0, lv:0, d:0 }, isNew: false }; }
  }
  
  function getRecord(){
    try {
      return JSON.parse(localStorage.getItem(RECORD_KEY) || '{"k":0,"lv":0,"d":0}');
    } catch(e){ return { k:0, lv:0, d:0 }; }
  }
  
  /* Exportar a archivo */
  function exportToFile(){
    const data = load();
    if (!data) { window.toast && window.toast('No hay partida para exportar', 'bad'); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'holguin-save-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    window.toast && window.toast('Partida exportada', 'good');
  }
  
  return { save, load, hasSave, deleteSave, tickAutoSave, updateRecord, getRecord, exportToFile };
})();
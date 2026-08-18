/* ============================================
   SISTEMA DE MISIONES TIPO GTA
   - Misiones generadas proceduralmente
   - Marcadores en minimapa y mapa grande
   - Recompensas escalables
   - Tipos: eliminar, recolectar, escoltar, explorar, rescatar
   ============================================ */
'use strict';
window.Missions = (function(){
  const missions = [];
  let activeId = null;
  let nextId = 1;
  
  const TYPES = {
    'kill':    { icon: '🎯', color: '#ff4a3d', name: 'Eliminación' },
    'collect': { icon: '📦', color: '#ffb340', name: 'Recolección' },
    'escort':  { icon: '🛡', color: '#3fe0c8', name: 'Escolta' },
    'explore': { icon: '🗺', color: '#c77dff', name: 'Exploración' },
    'rescue':  { icon: '❤',  color: '#ff8fa3', name: 'Rescate' }
  };
  
  const TITLES_KILL    = ['Limpieza en Martí','Cazador nocturno','La plaga del parque','Cacería de almas'];
  const TITLES_COLLECT = ['Suministros perdidos','Botiquín urgente','Gasolina para los viejos','Medicinas del hospital'];
  const TITLES_ESCORT  = ['Escolta al médico','Caravana a la Catedral','Salvando al explorador'];
  const TITLES_EXPLORE = ['Reconocimiento norte','Zona cero','La Loma susurra','Ruinas del este'];
  const TITLES_RESCUE  = ['Sobreviviente atrapado','Voces en el hospital','El último radio'];
  
  /* Genera misiones al iniciar la partida */
  function generateInitialMissions(worldCenter, worldSize){
    missions.length = 0;
    const count = 6;
    for (let i = 0; i < count; i++) {
      const type = pick(['kill','kill','collect','explore','rescue','escort']);
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * (worldSize * .35);
      const x = worldCenter.x + Math.sin(angle) * dist;
      const z = worldCenter.z + Math.cos(angle) * dist;
      missions.push(createMission(type, x, z));
    }
    window.toast('Nuevas misiones disponibles en el mapa (pulsa J)', 'good');
  }
  
  function createMission(type, x, z){
    const id = nextId++;
    const diff = 1 + Math.floor(Math.random() * 3);
    const data = {
      id, type, x, z, difficulty: diff,
      status: 'available', // available, active, completed
      progress: 0, goal: 0,
      reward: { money: 0, xp: 0, item: null }
    };
    
    switch(type){
      case 'kill':
        data.title = pick(TITLES_KILL);
        data.description = `Elimina ${diff * 5} zombis en la zona marcada`;
        data.goal = diff * 5;
        data.reward.money = 80 * diff;
        data.reward.xp = 25 * diff;
        if (Math.random() < .4) data.reward.item = 'rifle';
        break;
      case 'collect':
        data.title = pick(TITLES_COLLECT);
        const item = pick(['medkit','antib','fuel','b9mm','cart']);
        data.targetItem = item;
        data.description = `Recolecta ${diff * 2} ${window.ITEMS[item].n}`;
        data.goal = diff * 2;
        data.reward.money = 100 * diff;
        data.reward.xp = 20 * diff;
        break;
      case 'escort':
        data.title = pick(TITLES_ESCORT);
        data.description = 'Escolta al NPC hasta el punto seguro';
        data.goal = 1;
        data.reward.money = 150 * diff;
        data.reward.xp = 35 * diff;
        data.reward.item = 'ak';
        break;
      case 'explore':
        data.title = pick(TITLES_EXPLORE);
        data.description = 'Llega al punto y explora el área por 30 segundos';
        data.goal = 30;
        data.reward.money = 120 * diff;
        data.reward.xp = 30 * diff;
        break;
      case 'rescue':
        data.title = pick(TITLES_RESCUE);
        data.description = 'Rescata al sobreviviente y tráelo a la cafetería';
        data.goal = 1;
        data.reward.money = 200 * diff;
        data.reward.xp = 50 * diff;
        if (Math.random() < .5) data.reward.item = 'ak';
        break;
    }
    return data;
  }
  
  function acceptMission(id){
    const m = missions.find(m => m.id === id);
    if (!m || m.status !== 'available') return;
    // Cancelar anterior si hay
    missions.forEach(o => { if (o.status === 'active') o.status = 'available'; });
    m.status = 'active';
    activeId = id;
    window.toast(`Misión aceptada: ${m.title}`, 'mission');
    window.sfx && window.sfx.buy && window.sfx.buy();
    return m;
  }
  
  function updateProgress(type, payload){
    const active = missions.find(m => m.status === 'active');
    if (!active) return;
    
    let completed = false;
    switch(active.type){
      case 'kill':
        if (type === 'kill') {
          active.progress++;
          if (active.progress >= active.goal) completed = true;
        }
        break;
      case 'collect':
        if (type === 'collect' && payload === active.targetItem) {
          active.progress++;
          if (active.progress >= active.goal) completed = true;
        }
        break;
      case 'explore':
        if (type === 'explore_area') {
          // Progreso por tiempo en la zona
          active.progress += payload || 1;
          if (active.progress >= active.goal) completed = true;
        }
        break;
      case 'rescue':
      case 'escort':
        if (type === 'reach_target') {
          active.progress = 1;
          completed = true;
        }
        break;
    }
    
    if (completed) completeMission(active);
  }
  
  function completeMission(m){
    m.status = 'completed';
    activeId = null;
    const p = window.players && window.players[0];
    if (p) {
      p.money += m.reward.money;
      // Sumar XP simulando kills equivalentes
      const fakeKills = Math.ceil(m.reward.xp / 20);
      p.kills += fakeKills; p.killsLvl += fakeKills;
      if (m.reward.item && window.giveItem) {
        window.giveItem(p, m.reward.item);
      }
    }
    window.announce && window.announce('¡MISIÓN COMPLETADA!', m.title);
    window.toast(`+$${m.reward.money} · +${m.reward.xp} XP${m.reward.item ? ' · +'+window.ITEMS[m.reward.item].n : ''}`, 'mission');
    // Generar nueva misión de reemplazo
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 100;
      const worldCenter = { x: 0, z: 0 };
      const nx = worldCenter.x + Math.sin(angle) * dist;
      const nz = worldCenter.z + Math.cos(angle) * dist;
      const type = pick(['kill','kill','collect','explore','rescue']);
      missions.push(createMission(type, nx, nz));
    }, 2000);
  }
  
  function getAll(){ return missions; }
  function getActive(){ return missions.find(m => m.status === 'active'); }
  
  /* Dibujar marcadores en minimapa */
  function drawOnMinimap(ctx, playerPos, MAPS, MAPHALF, drawPx){
    missions.forEach(m => {
      if (m.status === 'completed') return;
      const d = Math.hypot(m.x - playerPos.x, m.z - playerPos.z);
      if (d > 120 && m.status !== 'active') return;
      const px = drawPx(m.x), pz = drawPx(m.z);
      ctx.fillStyle = m.status === 'active' ? '#4fd684' : TYPES[m.type].color;
      ctx.beginPath();
      // Forma de bandera
      ctx.moveTo(px, pz - 4);
      ctx.lineTo(px + 4, pz - 2);
      ctx.lineTo(px + 4, pz + 1);
      ctx.lineTo(px, pz);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(px, pz - 4, 1, 5);
    });
  }
  
  /* Dibujar marcadores en mapa grande */
  function drawOnBigMap(ctx, MAPS, MAPHALF, s){
    missions.forEach(m => {
      const px = (m.x + MAPHALF) * MAPS * s;
      const pz = (m.z + MAPHALF) * MAPS * s;
      ctx.fillStyle = m.status === 'completed' ? '#555' : m.status === 'active' ? '#4fd684' : TYPES[m.type].color;
      ctx.beginPath();
      ctx.arc(px, pz, m.status === 'active' ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      if (m.status === 'active') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }
  
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  
  return { generateInitialMissions, acceptMission, updateProgress, getAll, getActive, drawOnMinimap, drawOnBigMap };
})();
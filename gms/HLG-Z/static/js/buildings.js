'use strict';
/* ============================================
   INTERIORES DE EDIFICIOS (CORREGIDO)
   - Pausa el juego al entrar
   - Libera el pointer lock
   - Soporta tecla E / ESC para salir
   ============================================ */
window.Buildings = (function(){
  const interiors = [];
  let currentInterior = null;
  let exitPoint = null;
  let keyHandler = null;

  const INTERIOR_TYPES = [
    { name: 'Casa',        items: ['pan','croqueta','cafe','venda','medkit','b9mm'], minItems: 2, maxItems: 4 },
    { name: 'Farmacia',    items: ['medkit','antib','venda','venda'],                minItems: 3, maxItems: 5 },
    { name: 'Bodega',      items: ['pan','croqueta','refresco','refresco','cafe'],   minItems: 3, maxItems: 6 },
    { name: 'Comisaría',   items: ['b9mm','b9mm','cart','rifle','medkit'],           minItems: 2, maxItems: 4 },
    { name: 'Gasolinera',  items: ['fuel','fuel','refresco','croqueta'],             minItems: 2, maxItems: 4 },
    { name: 'Taller',      items: ['fuel','tubo','machete','venda','chatarra','madera','tubo','chatarra','armor'], minItems: 3, maxItems: 5 }
  ];

  function generateDoors(solids){
    interiors.length = 0;
    const candidates = solids.filter((_, i) => i % 3 === 0);
    candidates.forEach((b, i) => {
      const type = INTERIOR_TYPES[i % INTERIOR_TYPES.length];
      const side = Math.floor(Math.random() * 4);
      let x, z;
      switch(side){
        case 0: x = (b.x1 + b.x2) / 2; z = b.z1 - 1.2; break;
        case 1: x = (b.x1 + b.x2) / 2; z = b.z2 + 1.2; break;
        case 2: x = b.x1 - 1.2; z = (b.z1 + b.z2) / 2; break;
        case 3: x = b.x2 + 1.2; z = (b.z1 + b.z2) / 2; break;
      }
      interiors.push({ id: i, x, z, type, looted: false, building: b });
    });
  }

  function createDoorMarker(door, scene){
    const g = new THREE.Group();
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(.4, .8, .1),
      new THREE.MeshBasicMaterial({ color: 0xffb340, transparent: true, opacity: .8 })
    );
    marker.position.y = 1.6;
    g.add(marker);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.4, 16),
      new THREE.MeshBasicMaterial({ color: 0xffb340, transparent: true, opacity: .4, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI/2; ring.position.y = .05;
    g.add(ring);
    g.position.set(door.x, 0, door.z);
    scene.add(g);
    door.markerGroup = g;
    door.ring = ring;
  }

  function tryEnter(player, scene){
    for (const d of interiors) {
      const dist = Math.hypot(d.x - player.pos.x, d.z - player.pos.z);
      if (dist < 2.5) {
        enterBuilding(player, d, scene);
        return true;
      }
    }
    return false;
  }

  function enterBuilding(player, door, scene){
    // ⛔ PAUSAR EL JUEGO — esto impide que los zombis te muerdan
    if (window.setState) window.setState('INTERIOR');

    // 🔓 Liberar pointer lock para poder hacer clic en los botones
    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch(e){}
    }

    exitPoint = { x: player.pos.x, z: player.pos.z, yaw: player.yaw };
    currentInterior = door;

    let overlay = document.getElementById('interior-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'interior-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:45;display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;';
      document.body.appendChild(overlay);
    }

    const type = door.type;
    const lootCount = type.minItems + Math.floor(Math.random() * (type.maxItems - type.minItems + 1));
    const loot = [];
    for (let i = 0; i < lootCount; i++) {
      const item = type.items[Math.floor(Math.random() * type.items.length)];
      loot.push(item);
    }
    const money = 20 + Math.floor(Math.random() * 80);

    overlay.innerHTML = `
      <div style="max-width:500px;text-align:center;padding:30px">
        <h1 style="color:#ffb340;letter-spacing:5px;margin-bottom:10px">🏠 ${type.name.toUpperCase()}</h1>
        <p style="color:#aaa;margin-bottom:20px">Has entrado a ${door.looted ? 'un edificio ya saqueado' : 'un edificio sin saquear'}</p>
        <div style="background:rgba(255,179,64,.1);border:1px solid #ffb340;padding:20px;margin:20px 0">
          <h3 style="color:#ffb340;margin-bottom:12px">📦 ENCONTRASTE:</h3>
          ${door.looted 
            ? '<p style="color:#888">Este edificio ya fue saqueado. No queda nada útil.</p>'
            : `<div style="font-size:18px;line-height:2">
                ${loot.map(function(id){
                  const it = window.ITEMS[id];
                  if(!it) return '<div>❓ ' + id + '</div>';
                  return '<div>' + it.i + ' ' + it.n + '</div>';
                }).join('')}
                <div style="color:#ffb340">💰 $${money}</div>
              </div>`
          }
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
          ${!door.looted ? '<button id="btn-loot" style="background:#4fd684;color:#000;padding:12px 28px;border:none;cursor:pointer;font-size:14px;letter-spacing:2px;font-weight:700">SAQUEAR TODO</button>' : ''}
          <button id="btn-exit" style="background:#ff4a3d;color:#fff;padding:12px 28px;border:none;cursor:pointer;font-size:14px;letter-spacing:2px;font-weight:700">SALIR (ESC/E)</button>
        </div>
        <p style="color:#556;margin-top:14px;font-size:12px">El juego está en pausa · los zombis no pueden tocarte</p>
      </div>`;

    overlay.style.display = 'flex';
    if (window.toast) toast('Entrando a ' + type.name + (door.looted ? ' (saqueado)' : ''), 'good');

    const doExit = () => exitBuilding(player, scene);
    const doLoot = () => {
      if (door.looted) return;

        loot.forEach(function(id){
          if(window.ITEMS && window.ITEMS[id]){
            if(window.giveItem) window.giveItem(player, id);
          } else if(window.WEAPONS && window.WEAPONS[id]){
            // Si es un arma, añadirla al arsenal
            if(player.weapons.indexOf(id) === -1){
              player.weapons.push(id);
              window.toast('+ 🔫 ' + window.WEAPONS[id].name, 'good');
            } else {
              window.toast('Ya tienes ' + window.WEAPONS[id].name, 'good');
              player.money += 30; // compensación
            }
          } else {
            console.warn('[Buildings] Item desconocido:', id);
          }
        });

      player.money += money;
      door.looted = true;
      if (window.toast) toast(`+$${money} y ${loot.length} items`, 'good');
      if (window.sfx && sfx.pickup) sfx.pickup();
      setTimeout(doExit, 700);
    };

    const btnLoot = document.getElementById('btn-loot');
    if (btnLoot) btnLoot.onclick = doLoot;
    document.getElementById('btn-exit').onclick = doExit;

    // 🎮 Soporte de teclado (ESC o E para salir)
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = function(e){
      if (e.code === 'Escape' || e.code === 'KeyE') {
        e.preventDefault();
        e.stopPropagation();
        doExit();
      }
    };
    document.addEventListener('keydown', keyHandler, true);
  }

  function exitBuilding(player, scene){
    const overlay = document.getElementById('interior-overlay');
    if (overlay) overlay.style.display = 'none';
    if (exitPoint) {
      player.pos.set(exitPoint.x, 0, exitPoint.z);
      player.yaw = exitPoint.yaw;
      player.facing = exitPoint.yaw;
    }
    currentInterior = null;
    exitPoint = null;

    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler, true);
      keyHandler = null;
    }

    // ▶️ Reanudar el juego
    if (window.setState) window.setState('PLAY');

    // 🔒 Re-activar pointer lock
    const el = window.renderer_global && window.renderer_global.domElement;
    if (el && document.hasFocus()) {
      try {
        const p = el.requestPointerLock();
        if (p && p.catch) p.catch(function(){});
      } catch(e){}
    }
  }

  function update(dt){
    interiors.forEach(d => {
      if (!d.markerGroup) return;
      const pulse = .3 + Math.sin(performance.now() * .003) * .15;
      d.ring.material.opacity = d.looted ? pulse * .3 : pulse;
      d.ring.material.color.set(d.looted ? 0x55606a : 0xffb340);
      d.markerGroup.children[0].position.y = 1.6 + Math.sin(performance.now() * .002) * .1;
    });
  }

  function getHint(player){
    for (const d of interiors) {
      const dist = Math.hypot(d.x - player.pos.x, d.z - player.pos.z);
      if (dist < 2.5) {
        return `<em>E</em> ENTRAR A ${d.type.name.toUpperCase()}${d.looted ? ' (saqueado)' : ''}`;
      }
    }
    return null;
  }

  return {
    generateDoors: generateDoors,
    createDoorMarker: createDoorMarker,
    tryEnter: tryEnter,
    exitBuilding: exitBuilding,
    update: update,
    getHint: getHint,
    getAll: function(){ return interiors; }
  };
})();
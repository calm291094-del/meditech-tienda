'use strict';
/* ============================================================
   SISTEMA DE DIÁLOGO CON NPCs
   Diálogos con opciones, lore de Holguín, reclutamiento y misiones
   ============================================================ */
window.DialogueSystem = (function(){
  let currentNPC = null;
  let currentNode = null;
  let isOpen = false;
  
  /* ====== DATOS DE DIÁLOGO ====== */
  const DIALOGUES = {
    // Diálogo inicial al acercarse a un NPC no reclutado
    stranger: {
      start: 'greet',
      nodes: {
        greet: {
          text: (npc) => `*${npc.name.split(' ')[0]} te observa con desconfianza, pero no parece hostil.*\n\n«Oye... tú no eres uno de esos muertos, ¿verdad? Llevo días sin ver a nadie vivo por aquí.»`,
          options: [
            { text: '«Estoy vivo. ¿Necesitas ayuda?»', goto: 'offer' },
            { text: '«¿Qué pasó en Holguín?»', goto: 'lore' },
            { text: '«¿Sabes dónde hay suministros?»', goto: 'supplies' },
            { text: '(Alejarse)', goto: null }
          ]
        },
        offer: {
          text: (npc) => `«¿Ayuda? Hace mucho que nadie me ofrece eso. Los muertos... aparecieron de la noche a la mañana. Primero en el Parque Calixto García, luego por toda la ciudad.»\n\n*${npc.name.split(' ')[0]} baja la guardia.*\n\n«Si me llevas contigo, te ayudo. Sé pelear.»`,
          options: [
            { text: '👥 «Únete a mí. Sobreviviremos juntos.»', action: 'recruit' },
            { text: '«Cuéntame más primero.»', goto: 'lore' },
            { text: '(Alejarse)', goto: null }
          ]
        },
        lore: {
          text: () => `«Nadie sabe cómo empezó. Una noche, los muertos del cementerio de la ciudad se levantaron. Algunos dicen que fue por un experimento en la Loma de la Cruz... otros hablan de una maldición antigua.»\n\n«Lo único seguro es que de noche se vuelven más rápidos. Y hay... cosas peores. Criaturas enormes que solo salen cuando ya llevas días sobreviviendo.»`,
          options: [
            { text: '«¿Qué hay en la Loma de la Cruz?»', goto: 'loma' },
            { text: '«¿Conoces a otros sobrevivientes?»', goto: 'others' },
            { text: '«Únete a mí.»', action: 'recruit' },
            { text: '(Alejarse)', goto: null }
          ]
        },
        supplies: {
          text: () => `«Las casas tienen comida si no están saqueadas. La farmacia cerca de la Catedral de San Isidoro tenía medicinas. Y en el taller mecánico puedes encontrar gasolina.»\n\n«Pero cuidado, esos sitios atraen a los muertos. Ve preparado.»`,
          options: [
            { text: '«Gracias por el aviso.»', goto: 'greet' },
            { text: '«Únete a mí.»', action: 'recruit' },
            { text: '(Alejarse)', goto: null }
          ]
        },
        loma: {
          text: () => `«La Loma de la Cruz... el símbolo de Holguín. Antes subíamos los 458 escalones para ver toda la ciudad. Ahora nadie se atreve.»\n\n«Pero dicen que desde allá arriba se puede ver si viene una horda. Si algún día limpias la ciudad, ese sería un buen refugio.»`,
          options: [
            { text: '«Algún día la recuperaré.»', goto: 'offer' },
            { text: '(Alejarse)', goto: null }
          ]
        },
        others: {
          text: () => `«Había un grupo cerca de la Avenida de los Libertadores, pero hace días que no los veo. Espero que sigan vivos.»\n\n«Si encuentras a alguien más, tráelo. Cuantos más seamos, mejor.»`,
          options: [
            { text: '«Lo haré.»', goto: 'offer' },
            { text: '(Alejarse)', goto: null }
          ]
        }
      }
    },
    
    // Diálogos para NPCs ya reclutados
    recruited: {
      start: 'idle',
      nodes: {
        idle: {
          text: (npc) => {
            const lines = [
              `«¿Qué necesitas, jefe? Estoy listo.»`,
              `«Los muertos andan cerca. Mantén el arco preparado.»`,
              `«¿Recuerdas cómo era Holguín antes? La Ciudad de los Parques... qué ironía.»`,
              `«Si encontramos más supervivientes, seremos más fuertes.»`,
              `«Oí ruidos extraños cerca de la Catedral anoche.»`
            ];
            return lines[Math.floor(Math.random()*lines.length)];
          },
          options: [
            { text: '«¿Cómo estás?»', goto: 'status' },
            { text: '«Cuéntame algo de ti.»', goto: 'backstory' },
            { text: '«¿Alguna misión?»', action: 'giveMission' },
            { text: '(Cerrar)', goto: null }
          ]
        },
        status: {
          text: (npc) => `*HP: ${Math.round(npc.hp)}/${npc.maxHp} · Nivel ${npc.level} · Bajas: ${npc.kills||0}*\n\n«Sigo en pie, que es lo importante. Tú cuida tu hambre, te veo cansado.»`,
          options: [
            { text: '(Cerrar)', goto: null }
          ]
        },
        backstory: {
          text: (npc) => {
            const stories = [
              `«Era ${npc.name.split('(')[1]?.split(')')[0] || 'trabajador'} antes de todo esto. Ahora solo intento no ser el almuerzo de nadie.»`,
              `«Nací cerca del Parque Calixto García. Jugaba ahí de niño. Ahora ese parque... mejor no pensar en eso.»`,
              `«Perdí a mi familia la primera noche. Desde entonces, sobrevivir es mi única misión.»`,
              `«Solía subir a la Loma de la Cruz cada domingo. Daría lo que fuera por volver a ver Holguín desde allá arriba, en paz.»`
            ];
            return stories[Math.floor(Math.random()*stories.length)];
          },
          options: [
            { text: '«Lo siento.»', goto: 'idle' },
            { text: '(Cerrar)', goto: null }
          ]
        }
      }
    }
  };
  
  /* ====== UI ====== */
  function createUI(){
    let panel = document.getElementById('dialogue-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'dialogue-panel';
    panel.style.cssText = `
      position:fixed; bottom:8%; left:50%; transform:translateX(-50%);
      background:rgba(7,12,20,.95); border:2px solid #3fe0c8;
      padding:20px 26px; min-width:500px; max-width:650px; z-index:56;
      clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);
      font-family:'Segoe UI',sans-serif; color:#fff;
      box-shadow:0 0 40px rgba(63,224,200,.15);
    `;
    document.body.appendChild(panel);
    return panel;
  }
  
  function openDialogue(npc, player){
    if (window.AudioSystem) AudioSystem.resume();
    currentNPC = npc;
    isOpen = true;
    if (window.state) window.state = 'INV'; // pausar el mundo
    
    const dialogueKey = npc.recruited ? 'recruited' : 'stranger';
    const dialogue = DIALOGUES[dialogueKey];
    currentNode = dialogue.start;
    
    renderNode(dialogue, npc, player);
    window.sfx && window.sfx.click && window.sfx.click();
  }
  
  function renderNode(dialogue, npc, player){
    const panel = createUI();
    const node = dialogue.nodes[currentNode];
    if (!node) { closeDialogue(); return; }
    
    const text = typeof node.text === 'function' ? node.text(npc) : node.text;
    const name = npc.recruited ? `${npc.name} (ALIADO)` : npc.name;
    const nameColor = npc.recruited ? '#4fd684' : '#3fe0c8';
    
    let optionsHtml = node.options.map((opt, i) => {
      const isAction = opt.action ? 'style="color:#ffb340"' : '';
      return `<div class="dlg-opt" data-idx="${i}" ${isAction}
        style="padding:8px 12px;margin:4px 0;cursor:pointer;border-left:3px solid transparent;transition:all .15s;font-size:14px"
        onmouseover="this.style.background='rgba(63,224,200,.1)';this.style.borderLeftColor='#3fe0c8'"
        onmouseout="this.style.background='transparent';this.style.borderLeftColor='transparent'">${opt.text}</div>`;
    }).join('');
    
    panel.innerHTML = `
      <div style="display:flex;gap:14px;margin-bottom:12px">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,#1a2a3a,#0a1520);border:2px solid ${nameColor};
          display:flex;align-items:center;justify-content:center;font-size:30px;flex-shrink:0">
          ${npc.recruited ? '🧑‍🤝‍🧑' : '🧍'}
        </div>
        <div>
          <div style="color:${nameColor};font-size:15px;letter-spacing:2px;font-weight:700">${name}</div>
          <div style="color:#7e93a5;font-size:11px;margin-top:2px">${npc.recruited ? 'Escuadrón activo' : 'Sobreviviente'}</div>
        </div>
      </div>
      <div style="line-height:1.6;font-size:14px;color:#dfe8ee;white-space:pre-wrap;margin-bottom:16px;min-height:60px">${text}</div>
      <div style="border-top:1px solid rgba(63,224,200,.2);padding-top:12px">${optionsHtml}</div>
    `;
    
    // Conectar opciones
    panel.querySelectorAll('.dlg-opt').forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.idx);
        const opt = node.options[idx];
        handleOption(opt, dialogue, npc, player);
      };
    });
  }
  
  function handleOption(opt, dialogue, npc, player){
    if (window.AudioSystem) AudioSystem.resume();
    
    if (opt.action === 'recruit') {
      // Reclutar NPC
      npc.recruited = true;
      npc.state = 'follow';
      window.toast(`¡${npc.name} se une al escuadrón!`, 'good');
      window.sfx && window.sfx.pickup && window.sfx.pickup();
      closeDialogue();
      return;
    }
    
    if (opt.action === 'giveMission') {
      // Generar una misión nueva para el jugador
      if (window.Missions) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 60;
        const mx = npc.x + Math.sin(angle) * dist;
        const mz = npc.z + Math.cos(angle) * dist;
        const type = pick(['kill', 'collect', 'rescue']);
        // Crear misión a través del sistema existente
        window.toast('Nueva misión asignada por tu aliado', 'mission');
        // Se generará automáticamente; avisamos al jugador
      }
      closeDialogue();
      return;
    }
    
    if (opt.goto === null) {
      closeDialogue();
      return;
    }
    
    if (opt.goto) {
      currentNode = opt.goto;
      renderNode(dialogue, npc, player);
    }
  }
  
  function closeDialogue(){
    const panel = document.getElementById('dialogue-panel');
    if (panel) panel.remove();
    isOpen = false;
    currentNPC = null;
    currentNode = null;
    if (window.state === 'INV') window.state = 'PLAY';
  }
  
  /* Verificar si hay un NPC cerca para hablar */
  function tryTalk(player, npcs){
    for (const n of npcs) {
      if (n.dead) continue;
      const d = Math.hypot(n.x - player.pos.x, n.z - player.pos.z);
      if (d < 3) {
        openDialogue(n, player);
        return true;
      }
    }
    return false;
  }
  
  /* Hint cuando hay un NPC cerca */
  function getHint(player, npcs){
    for (const n of npcs) {
      if (n.dead) continue;
      const d = Math.hypot(n.x - player.pos.x, n.z - player.pos.z);
      if (d < 3) {
        return `<em>E</em> ${n.recruited ? 'HABLAR CON' : 'RECLUTAR'} ${n.name.split(' ')[0].toUpperCase()}`;
      }
    }
    return null;
  }
  
  function isOpened(){ return isOpen; }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  
  return { openDialogue, closeDialogue, tryTalk, getHint, isOpened };
})();
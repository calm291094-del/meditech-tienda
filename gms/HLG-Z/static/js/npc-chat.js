'use strict';
/* CHAT DE PENSAMIENTOS — muestra lo que piensan los NPCs */
window.NpcChat = (function(){
  let panel = null, feedEl = null, toggleBtn = null;
  let visible = true;
  
  function init(){
    createUI();
  }
  
  function createUI(){
    panel = document.createElement('div');
    panel.id = 'npc-chat';
    panel.innerHTML = 
      '<div class="chat-header">' +
      '  <i class="ri-chat-3-line"></i> PENSAMIENTOS DEL ESCUADRÓN' +
      '  <button id="chat-toggle">—</button>' +
      '</div>' +
      '<div class="chat-feed" id="chat-feed"></div>';
    document.body.appendChild(panel);
    feedEl = document.getElementById('chat-feed');
    toggleBtn = document.getElementById('chat-toggle');
    toggleBtn.onclick = function(){
      visible = !visible;
      feedEl.style.display = visible ? 'block' : 'none';
      toggleBtn.textContent = visible ? '—' : '+';
    };
  }
  
  function render(feed){
    if(!feedEl) return;
    let html = '';
    for(let i = feed.length - 1; i >= Math.max(0, feed.length - 8); i--){
      const e = feed[i];
      html += '<div class="chat-msg">' +
        '<div class="chat-who"><span class="chat-icon">' + e.icon + '</span> ' +
        '<b>' + e.name + '</b> <em>' + e.profession + '</em></div>' +
        '<div class="chat-text">"' + e.text + '"</div>' +
        '</div>';
    }
    feedEl.innerHTML = html;
    feedEl.scrollTop = feedEl.scrollHeight;
  }
  
  function show(){ if(panel) panel.classList.remove('hidden'); }
  function hide(){ if(panel) panel.classList.add('hidden'); }
  
  return { init:init, render:render, show:show, hide:hide };
})();
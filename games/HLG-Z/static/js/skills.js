'use strict';
/* ÁRBOL DE HABILIDADES con puntos por nivel */
window.Progression = (function(){
  let skillPoints = 0;
  let skillLevels = {};
  let panel = null, listEl = null, pointsEl = null;
  let SKILLS = {};
  
  function init(){
    panel = document.getElementById('skills-panel');
    listEl = document.getElementById('skillsList');
    pointsEl = document.getElementById('skillPoints');
    if (window.SKILLS) SKILLS = window.SKILLS;
    for (const key in SKILLS) skillLevels[key] = 0;
  }
  
  function addPoints(n){
    skillPoints += n;
    if (window.toast) toast('+' + n + ' punto de habilidad (pulsa K)', 'good');
  }
  
  function getSkill(id){ return skillLevels[id] || 0; }
  
  function openPanel(){
    if (!panel) return;
    renderSkills();
    panel.classList.remove('hidden');
    if (window.setState) window.setState('INV');
  }
  
  function renderSkills(){
    if (!listEl) return;
    listEl.innerHTML = '';
    if (pointsEl) pointsEl.textContent = skillPoints;
    
    // Agrupar por rama
    const branches = {};
    for (const key in SKILLS) {
      const s = SKILLS[key];
      if (!branches[s.branch]) branches[s.branch] = [];
      branches[s.branch].push({ key:key, s:s });
    }
    
    for (const branch in branches) {
      const h = document.createElement('div');
      h.className = 'skill-branch';
      h.textContent = branch;
      listEl.appendChild(h);
      
      for (let i = 0; i < branches[branch].length; i++) {
        const item = branches[branch][i];
        const key = item.key, s = item.s;
        const lvl = skillLevels[key];
        const maxed = lvl >= s.max;
        const canBuy = skillPoints >= s.cost && !maxed;
        
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.innerHTML = '<div class="skill-icon">' + s.icon + '</div>' +
          '<div class="skill-info"><div class="skill-name">' + s.name + '</div>' +
          '<div class="skill-desc">' + s.desc + '</div></div>' +
          '<div class="skill-level">' + lvl + '/' + s.max + '</div>';
        
        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        btn.textContent = maxed ? 'MÁX' : 'MEJORAR (' + s.cost + ')';
        btn.disabled = !canBuy;
        btn.onclick = (function(k, cost){
          return function(){
            if (skillPoints >= cost && skillLevels[k] < SKILLS[k].max) {
              skillPoints -= cost;
              skillLevels[k]++;
              if (window.sfx) sfx.level();
              renderSkills();
            }
          };
        })(key, s.cost);
        row.appendChild(btn);
        listEl.appendChild(row);
      }
    }
  }
  
  // Modificadores consultados por el juego
  function meleeDamageMul(){ return 1 + getSkill('fuerza1') * 0.30; }
  function bowDamageMul(){ return 1 + getSkill('fuerza2') * 0.20; }
  function noiseMul(){ return Math.max(0.2, 1 - getSkill('sigilo1') * 0.13); }
  function hungerMul(){ return Math.max(0.3, 1 - getSkill('superv1') * 0.10); }
  function staminaBonus(){ return getSkill('superv2') * 25; }
  function infectionRiskMul(){ return Math.max(0.2, 1 - getSkill('superv3') * 0.25); }
  function baseCostMul(){ return Math.max(0.4, 1 - getSkill('ing1') * 0.10); }
  function trapDamageMul(){ return 1 + getSkill('ing2') * 0.25; }
  function canPush(){ return getSkill('fuerza3') > 0; }
  function canBackstab(){ return getSkill('sigilo3') > 0; }
  
  return {
    init:init, addPoints:addPoints, getSkill:getSkill, openPanel:openPanel,
    meleeDamageMul:meleeDamageMul, bowDamageMul:bowDamageMul, noiseMul:noiseMul,
    hungerMul:hungerMul, staminaBonus:staminaBonus, infectionRiskMul:infectionRiskMul,
    baseCostMul:baseCostMul, trapDamageMul:trapDamageMul, canPush:canPush, canBackstab:canBackstab
  };
})();
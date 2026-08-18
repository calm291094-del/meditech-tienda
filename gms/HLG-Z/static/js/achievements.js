'use strict';
/* SISTEMA DE LOGROS */
window.Achievements = (function(){
  let unlocked = {};
  let stats = {
    kills:0, bowKills:0, daysSurvived:1, npcsRecruited:0,
    structuresBuilt:0, radioOn:false, hordesSurvived:0, carsDriven:0
  };
  
  const LOGROS = [
    { id:'firstBlood',  icon:'🩸', name:'Primera Sangre', desc:'Mata tu primer zombi', cond:function(){ return stats.kills >= 1; } },
    { id:'hunter',      icon:'🏹', name:'Cazador', desc:'Mata 50 zombis', cond:function(){ return stats.kills >= 50; } },
    { id:'legend',      icon:'⚔️', name:'Leyenda', desc:'Mata 150 zombis', cond:function(){ return stats.kills >= 150; } },
    { id:'archer',      icon:'🎯', name:'Arquero', desc:'Mata 20 con el arco', cond:function(){ return stats.bowKills >= 20; } },
    { id:'survivor3',   icon:'🌅', name:'Sobreviviente', desc:'Sobrevive 3 días', cond:function(){ return stats.daysSurvived >= 3; } },
    { id:'veteran',     icon:'🎖️', name:'Veterano', desc:'Sobrevive 7 días', cond:function(){ return stats.daysSurvived >= 7; } },
    { id:'squad',       icon:'👥', name:'Escuadrón', desc:'Recluta 3 NPCs', cond:function(){ return stats.npcsRecruited >= 3; } },
    { id:'builder',     icon:'🏠', name:'Constructor', desc:'Construye 5 defensas', cond:function(){ return stats.structuresBuilt >= 5; } },
    { id:'melomano',    icon:'📻', name:'Melómano', desc:'Enciende la radio', cond:function(){ return stats.radioOn; } },
    { id:'driver',      icon:'🚗', name:'Almendrones', desc:'Conduce un coche', cond:function(){ return stats.carsDriven >= 1; } },
    { id:'horde',       icon:'🧟', name:'Marea Muerta', desc:'Sobrevive una horda', cond:function(){ return stats.hordesSurvived >= 1; } },
    { id:'summit',      icon:'⛰️', name:'La Cima', desc:'Llega a la Loma de la Cruz', cond:function(){ return false; } }
  ];
  
  function init(){
    unlocked = {};
    stats = { kills:0, bowKills:0, daysSurvived:1, npcsRecruited:0,
              structuresBuilt:0, radioOn:false, hordesSurvived:0, carsDriven:0 };
  }
  
  function addStat(key, amount){
    if(stats[key] !== undefined) stats[key] += (amount || 1);
    checkAll();
  }
  
  function setStat(key, value){
    if(stats[key] !== undefined) stats[key] = value;
    checkAll();
  }
  
  function checkAll(){
    for(let i = 0; i < LOGROS.length; i++){
      const l = LOGROS[i];
      if(!unlocked[l.id] && l.cond()){
        unlock(l);
      }
    }
  }
  
  function unlock(logro){
    unlocked[logro.id] = true;
    if(window.toast) toast(logro.icon + ' LOGRO: ' + logro.name, 'mission');
    if(window.sfx) sfx.level();
  }
  
  // Logro especial (La Cima) se desbloquea manualmente
  function unlockSummit(){
    const l = LOGROS.find(function(x){ return x.id === 'summit'; });
    if(l && !unlocked[l.id]) unlock(l);
  }
  
  function getUnlocked(){
    const result = [];
    for(let i = 0; i < LOGROS.length; i++){
      const l = LOGROS[i];
      result.push({ icon:l.icon, name:l.name, desc:l.desc, unlocked:!!unlocked[l.id] });
    }
    return result;
  }
  
  function getStats(){ return stats; }
  
  return { init:init, addStat:addStat, setStat:setStat,
           unlockSummit:unlockSummit, getUnlocked:getUnlocked, getStats:getStats };
})();
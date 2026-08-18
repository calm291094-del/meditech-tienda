'use strict';
window.Crafting = (function(){
  const RECIPES = [
    { id:'craft_bandage', name:'Venda casera', icon:'🩹',
      ingredients:{pan:1, cafe:1}, result:{item:'venda', qty:2}, desc:'Tela + alcohol improvisado' },
    { id:'craft_molotov', name:'Molotov', icon:'🔥',
      ingredients:{refresco:1, fuel:1}, result:{item:'molotov', qty:1}, desc:'Arma arrojadiza de área' },
    { id:'craft_ammo_arrow', name:'Flechas (×10)', icon:'🏹',
      ingredients:{tubo:1}, result:{ammo:'flecha', qty:10}, desc:'Flechas improvisadas' },
    { id:'craft_ammo_9mm', name:'Balas 9mm (×6)', icon:'🔸',
      ingredients:{fuel:1, croqueta:2}, result:{ammo:'b9mm', qty:6}, desc:'Recarga improvisada' },
    { id:'craft_medkit', name:'Botiquín grande', icon:'💊',
      ingredients:{venda:3, antib:1}, result:{item:'medkit', qty:1}, desc:'Cura 60 HP' },
    { id:'craft_armor', name:'Chaleco protector', icon:'🛡',
      ingredients:{fuel:2, tubo:1}, result:{item:'armor', qty:1}, desc:'Reduce daño 30%' }
  ];
  
  if (window.ITEMS) {
    window.ITEMS.molotov = { n:'Molotov', i:'🔥', throwable:true, dmg:40, radius:5 };
    window.ITEMS.armor = { n:'Chaleco protector', i:'🛡', armor:30 };
  }
  
  function canCraft(player, recipe){
    for (const ing in recipe.ingredients) {
      if ((player.items[ing]||0) < recipe.ingredients[ing]) return false;
    }
    return true;
  }
  
  function craft(player, recipe){
    if (!canCraft(player, recipe)) return false;
    for (const ing in recipe.ingredients) player.items[ing] -= recipe.ingredients[ing];
    if (recipe.result.item) {
      player.items[recipe.result.item] = (player.items[recipe.result.item]||0) + (recipe.result.qty||1);
      window.toast(`+ ${recipe.icon} ${recipe.name}`, 'good');
    } else if (recipe.result.ammo) {
      player.ammo[recipe.result.ammo] = (player.ammo[recipe.result.ammo]||0) + recipe.result.qty;
      window.toast(`+ ${recipe.result.qty} ${recipe.name}`, 'good');
    }
    window.sfx.craft && window.sfx.craft();
    return true;
  }
  
  function openCraftingUI(player){
    let panel = document.getElementById('crafting-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'crafting-panel';
      document.body.appendChild(panel);
    }
    panel.innerHTML = `<div class="card" style="min-width:520px">
      <h2>FABRICACIÓN</h2>
      <div id="craft-list"></div>
      <button class="btn gh" id="craft-close">CERRAR (C)</button>
    </div>`;
    const list = panel.querySelector('#craft-list');
    RECIPES.forEach(r => {
      const can = canCraft(player, r);
      const row = document.createElement('div');
      row.className = 'row';
      row.style.opacity = can ? '1' : '.5';
      const ings = Object.entries(r.ingredients)
        .map(([id,q]) => `${window.ITEMS[id]?window.ITEMS[id].i:'?'}×${q}`)
        .join(' + ');
      row.innerHTML = `
        <div class="ic">${r.icon}</div>
        <div class="nm">${r.name}<small>${r.desc} · Necesita: ${ings}</small></div>
        <button class="buy" ${can?'':'disabled'}>FABRICAR</button>`;
      row.querySelector('button').onclick = () => {
        if (craft(player, r)) openCraftingUI(player);
      };
      list.appendChild(row);
    });
    panel.style.display = 'flex';
    panel.querySelector('#craft-close').onclick = () => {
      panel.style.display = 'none';
      window.state = 'PLAY';
    };
    window.state = 'INV';
  }
  
  return { RECIPES, canCraft, craft, openCraftingUI };
})();
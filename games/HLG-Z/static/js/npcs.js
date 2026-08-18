'use strict';
window.NPCSystem = (function(){
  const npcs = [];
  const NAMES = ['Carlos','Yaneli','Pedro','Maité','Raúl','Lianet','Eduardo','Dayana','Omar','Yusnel','Yamila','Arlet'];
  const ROLES = ['médico','mecánico','explorador','francotirador','ingeniero','ex-soldado'];
  
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  
  function buildHuman(shirt, pants, skin){
    const g = new THREE.Group();
    const M = c => new THREE.MeshLambertMaterial({ color: c });
    const mkP = (px,py,len,wid,mat) => {
      const p = new THREE.Group(); p.position.set(px,py,0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(wid,len,wid), mat);
      m.position.y = -len/2; p.add(m); g.add(p); return p;
    };
    const ll = mkP(-.14,.82,.78,.23,M(pants));
    const rl = mkP(.14,.82,.78,.23,M(pants));
    const body = new THREE.Mesh(new THREE.BoxGeometry(.6,.72,.34), M(shirt));
    body.position.y = 1.16; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.36), M(skin));
    head.position.y = 1.72; g.add(head);
    const la = mkP(-.4,1.46,.6,.17,M(shirt));
    const ra = mkP(.4,1.46,.6,.17,M(shirt));
    return { g, ll, rl, la, ra, head };
  }
  
  function makeHealthBar(){
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x200508 }));
    bg.scale.set(.95,.08,1);
    const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x4fd684 }));
    fg.scale.set(.95,.06,1);
    const grp = new THREE.Group(); grp.add(bg); grp.add(fg);
    grp.position.y = 2.15; grp.visible = false;
    return { grp, fg };
  }
  
  function createNPC(x, z, scene){
    const idx = npcs.length;
    const human = buildHuman(
      pick(['#c94f4f','#4f7fc9','#e0a84b','#7fb6a4','#8f4f8f']),
      '#2c3138',
      pick([0xd9a878,0xb68860,0xa8784a,0xc9a078])
    );
    human.g.position.set(x, 0, z);
    scene.add(human.g);
    const bar = makeHealthBar();
    human.g.add(bar.grp);
    
    const npc = {
      id: idx, name: pick(NAMES)+' ('+pick(ROLES)+')',
      x, z, yaw: Math.random()*Math.PI*2,
      hp: 100, maxHp: 100, level: 0, kills: 0, killsLvl: 0,
      speed: 4.5, state: 'idle', recruited: false,
      aggroRange: 14, attackCd: 0, atkDmg: 18,
      human, bar, dead: false, dieT: 0,
      memory: { aggroDist:14, courage:rand(.3,1), caution:rand(.3,1),
                tacticsScore:{rush:0, flank:0, cover:0} },
      target: null, ph: rand(0, Math.PI*2),
      wanderT: 0, wx: x, wz: z
    };
    npcs.push(npc);
    return npc;
  }
  
  function tryRecruit(player, npcList, scene){
    for (const n of npcList) {
      if (n.dead || n.recruited) continue;
      const d = Math.hypot(n.x - player.pos.x, n.z - player.pos.z);
      if (d < 2.8) {
        n.recruited = true; n.state = 'follow';
        window.toast && window.toast('¡'+n.name+' se une al escuadrón!', 'good');
        window.sfx && window.sfx.pickup && window.sfx.pickup();
        return true;
      }
    }
    return false;
  }
  
  function update(dt, players, zombies, playerPos){
    for (let i = npcs.length - 1; i >= 0; i--) {
      const n = npcs[i];
      if (n.dead) { n.dieT += dt; continue; }
      
      let target = null, td = 1e9;
      for (const z of zombies) {
        if (z.dead) continue;
        const d = Math.hypot(z.x - n.x, z.z - n.z);
        if (d < n.memory.aggroDist && d < td) { td = d; target = z; }
      }
      
      let sp = 0;
      if (target) {
        n.state = 'attack'; n.target = target;
        const dx = target.x - n.x, dz = target.z - n.z;
        const d = Math.hypot(dx,dz) || 1;
        if (n.hp < 30 && n.memory.caution > .6) {
          sp = -n.speed * .8;
        } else if (d > 1.5) {
          sp = n.speed;
        } else {
          n.attackCd -= dt;
          if (n.attackCd <= 0) {
            n.attackCd = .7;
            const dmg = n.atkDmg + n.level * 2;
            if (window.hurtZombieFromNPC) window.hurtZombieFromNPC(target, dmg, n);
          }
        }
        const mx = dx/d*sp, mz = dz/d*sp;
        n.x += mx*dt; n.z += mz*dt;
        n.yaw = Math.atan2(dx, dz);
        if (sp > 0) n.memory.tacticsScore.rush += .01;
      } else if (n.recruited) {
        const p = players[0];
        if (p && !p.down) {
          const dx = p.pos.x - n.x, dz = p.pos.z - n.z;
          const d = Math.hypot(dx,dz);
          if (d > 4) {
            sp = n.speed;
            n.x += dx/d*sp*dt; n.z += dz/d*sp*dt;
            n.yaw = Math.atan2(dx, dz);
            n.state = 'follow';
          } else {
            n.state = 'idle';
          }
        }
      } else {
        n.state = 'wander';
        if (!n.wanderT || n.wanderT <= 0) {
          n.wanderT = rand(2,5);
          n.wx = n.x + rand(-8,8);
          n.wz = n.z + rand(-8,8);
        }
        n.wanderT -= dt;
        const dx = n.wx - n.x, dz = n.wz - n.z;
        const d = Math.hypot(dx,dz);
        if (d > 1) {
          sp = n.speed*.5;
          n.x += dx/d*sp*dt; n.z += dz/d*sp*dt;
          n.yaw = Math.atan2(dx, dz);
        }
      }
      
      if (window.tryMove) window.tryMove(n, 0, 0, .45);
      
      n.ph += dt * (sp > 0 ? sp*2.4 : 2);
      const sw = Math.sin(n.ph)*.5;
      n.human.ll.rotation.x = sw;
      n.human.rl.rotation.x = -sw;
      if (n.state === 'attack') {
        n.human.ra.rotation.x = -1.35 - Math.sin(performance.now()*.01)*.4;
      } else {
        n.human.la.rotation.z = Math.sin(n.ph*.5)*.08;
        n.human.ra.rotation.z = -Math.sin(n.ph*.5)*.08;
      }
      n.human.g.position.set(n.x, 0, n.z);
      n.human.g.rotation.y = n.yaw;
      
      const show = n.hp < n.maxHp;
      n.bar.grp.visible = show;
      if (show) n.bar.fg.scale.x = .95 * (n.hp/n.maxHp);
    }
  }
  
  function hurt(n, dmg){
    if (n.dead) return;
    n.hp -= dmg;
    if (n.hp <= 0) {
      n.dead = true; n.dieT = 0;
      window.toast && window.toast(n.name + ' ha caído', 'bad');
    }
  }
  
  function getAll(){ return npcs; }
  function recruitedCount(){ return npcs.filter(n => n.recruited && !n.dead).length; }
  
  function learnFromCombat(outcome){
    npcs.forEach(n => {
      if (n.dead) return;
      if (outcome === 'win') {
        const dominant = Object.entries(n.memory.tacticsScore).reduce((a,b)=>b[1]>a[1]?b:a,['rush',0])[0];
        n.memory.tacticsScore[dominant] += 1;
      } else if (outcome === 'lose') {
        n.memory.tacticsScore.rush = Math.max(0, n.memory.tacticsScore.rush - .5);
        n.memory.caution = Math.min(1, n.memory.caution + .1);
      }
    });
  }
  
  return {
    createNPC: createNPC,
    tryRecruit: tryRecruit,
    update: update,
    hurt: hurt,
    getAll: getAll,
    recruitedCount: recruitedCount,
    learnFromCombat: learnFromCombat
  };
})();
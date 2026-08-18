'use strict';
/* MODELOS 100% PROCEDURALES — SIN GLB (nunca rompe) */
window.Models = (function(){

  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

  /* Zombi procedural con pivotes animables (ll,rl,la,ra,head) */
  function makeZombie(){
    var g = new THREE.Group();
    var M = function(c){ return new THREE.MeshLambertMaterial({color:c}); };
    var skin  = pick(['#7a9a6a','#8fae7a','#6f8f6f','#9aa87a','#6f8f6f']);
    var cloth = pick(['#5a5f6a','#7a5a4a','#4a6a5a','#8a8a7a','#6a4a5a','#4a4a5a']);

    var ll = new THREE.Group(); ll.position.set(-.14,.82,0); g.add(ll);
    var llM = new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23), M(cloth));
    llM.position.y=-.39; ll.add(llM); ll.rotation.x=-.2;

    var rl = new THREE.Group(); rl.position.set(.14,.82,0); g.add(rl);
    var rlM = new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23), M(cloth));
    rlM.position.y=-.39; rl.add(rlM); rl.rotation.x=.1;

    var torso = new THREE.Group(); torso.position.y=1.16; torso.rotation.x=.25;
    var body = new THREE.Mesh(new THREE.BoxGeometry(.6,.72,.34), M(cloth));
    torso.add(body);
    var blood = new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.02), M(0x6a0d0d));
    blood.position.set(.15,.1,.18); torso.add(blood);
    g.add(torso);

    var head = new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.36), M(skin));
    head.position.set(0,1.68,.05); head.rotation.x=-.15; head.rotation.z=.1; g.add(head);

    var eyeM = new THREE.MeshBasicMaterial({color:0xff3030});
    var eL = new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02), eyeM); eL.position.set(-.09,1.72,.19); g.add(eL);
    var eR = new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02), eyeM); eR.position.set(.09,1.72,.19); g.add(eR);
    var mouth = new THREE.Mesh(new THREE.BoxGeometry(.15,.04,.02), M(0x1a0505));
    mouth.position.set(0,1.58,.19); g.add(mouth);

    var la = new THREE.Group(); la.position.set(-.4,1.46,0); g.add(la);
    var laM = new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17), M(cloth));
    laM.position.set(0,-.3,.15); la.add(laM); la.rotation.x=-1.1; la.rotation.z=.1;

    var ra = new THREE.Group(); ra.position.set(.4,1.46,0); g.add(ra);
    var raM = new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17), M(cloth));
    raM.position.set(0,-.3,.15); ra.add(raM); ra.rotation.x=-1.2; ra.rotation.z=-.1;

    var sh = new THREE.Mesh(new THREE.CircleGeometry(.55,12),
      new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false}));
    sh.rotation.x=-Math.PI/2; sh.position.y=.03; g.add(sh);

    return { group:g, isGLB:false, mixer:null, human:{g:g,ll:ll,rl:rl,la:la,ra:ra,head:head} };
  }

  /* Zombi procedural alternativo (más variado) */
  function createFallbackZombie(){ return makeZombie(); }

  return { makeZombie:makeZombie, createFallbackZombie:createFallbackZombie };
})();
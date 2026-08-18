'use strict';
/* HOLGUÍN DE LOS MUERTOS v4.2 — MOTOR COMPLETO Y LIMPIO */

/* ================= UTILIDADES ================= */
var $ = function(q){ return document.querySelector(q); };
var clamp = function(v,a,b){ return v<a?a:(v>b?b:v); };
var rand = function(a,b){ return a+Math.random()*(b-a); };
var irand = function(a,b){ return Math.floor(rand(a,b+1)); };
var pick = function(a){ return a[Math.floor(Math.random()*a.length)]; };
var lerp = function(a,b,t){ return a+(b-a)*t; };
var TAU = Math.PI*2;
function angTo(a,b){ var d=(b-a)%TAU; if(d>Math.PI)d-=TAU; if(d<-Math.PI)d+=TAU; return d; }
function lerpAng(a,b,t){ return a+angTo(a,b)*t; }
function isDown(code){ return window.Controls && Controls.isDown(code); }
window.pick = pick;

/* ================= DATOS ================= */
window.WEAPONS = {
  arco:{name:'Arco de caza',icon:'🏹',type:'bow',dmg:35,rate:.7,range:60,ammo:'flecha',sfx:'bow',noise:4},
  tubo:{name:'Tubo de hierro',icon:'🔧',type:'melee',dmg:22,rate:.5,range:2.5,arc:1.3,noise:8},
  machete:{name:'Machete',icon:'🔪',type:'melee',dmg:50,rate:.42,range:2.7,arc:1.5,noise:8},
  pistola:{name:'Pistola 9mm',icon:'🔫',type:'gun',dmg:26,rate:.3,range:70,mag:12,ammo:'b9mm',spread:.025,sfx:'pistol',noise:35},
  escopeta:{name:'Escopeta',icon:'💥',type:'gun',dmg:12,pellets:6,rate:.95,range:26,mag:6,ammo:'cart',spread:.13,sfx:'shotgun',noise:55},
  ak:{name:'AK-47',icon:'🪖',type:'gun',dmg:19,rate:.13,range:85,mag:30,ammo:'rifle',spread:.045,sfx:'rifle',noise:45}
};
window.ITEMS = {
  flecha:{n:'Flechas',i:'🏹',ammo:'flecha',q:10}, croqueta:{n:'Croquetas',i:'🍢',food:18},
  refresco:{n:'Refresco de malta',i:'🥤',food:12,stam:20}, pan:{n:'Pan con lechón',i:'🥪',food:38},
  cafe:{n:'Café cubano',i:'☕',food:8,stam:48}, venda:{n:'Venda',i:'🩹',heal:18},
  medkit:{n:'Botiquín',i:'💊',heal:60}, antib:{n:'Antibióticos',i:'💉',cure:1},
  fuel:{n:'Bidón de gasolina',i:'⛽',fuel:55}, b9mm:{n:'Balas 9mm',i:'🔸',ammo:'b9mm',q:12},
  cart:{n:'Cartuchos 12',i:'🔶',ammo:'cart',q:6}, rifle:{n:'Cargas 7.62',i:'🔷',ammo:'rifle',q:30},
  tubo:{n:'Tubo de hierro',i:'🔧',craft:1}, chatarra:{n:'Chatarra',i:'🔩',material:1},
  madera:{n:'Madera',i:'🪵',material:1}, molotov:{n:'Molotov',i:'🔥',throwable:1,dmg:60,radius:6},
  armor:{n:'Chaleco',i:'🛡',armor:30}, rum:{n:'Ron añejo',i:'🥃',trade:1,moral:15},
  tabaco:{n:'Tabaco',i:'🚬',trade:1,moral:10}
};
window.FOOD_ORDER = ['refresco','croqueta','pan','cafe'];
window.SHOP = [['flecha',20],['croqueta',15],['refresco',12],['pan',40],['cafe',14],['venda',25],['medkit',95],['antib',75],['fuel',60],['b9mm',30],['cart',45],['rifle',80],['chatarra',15],['madera',12]];
window.UNLOCKS = {
  1:{txt:'PISTOLA 9MM',w:'pistola',ammo:{b9mm:24}},
  2:{txt:'ESCOPETA',w:'escopeta',ammo:{cart:12}},
  3:{txt:'MACHETE + CONDUCIR',w:'machete'},
  4:{txt:'AK-47',w:'ak',ammo:{rifle:60}},
  5:{txt:'JEEP + JEFE + BASE'},
  6:{txt:'+8% DAÑO/NIVEL'}
};
/* ★ Niveles progresivos: nivel N necesita N+1 kills */
window.need = function(l){ return l+1; };
window.ZT = [['money',45],['b9mm',20],['croqueta',18],['venda',12],['cafe',10],['antib',4],['tubo',4],['chatarra',8],['madera',8]];
window.CT = [['money',30],['fuel',26],['b9mm',18],['pan',16],['medkit',8],['chatarra',10]];
window.ZOMBIE_TYPES = {
  caminante:{name:'Caminante',color:0x6a8a5a,scale:1.0,hp:42,dmg:10,speed:1.5,aggro:15},
  corredor:{name:'Corredor',color:0x8a4a3a,scale:1.0,hp:30,dmg:14,speed:5.0,aggro:25},
  gordo:{name:'Gordo',color:0x4a5a3a,scale:1.8,hp:150,dmg:25,speed:1.2,aggro:12,explode:true},
  chillon:{name:'Chillón',color:0x7a3a7a,scale:1.1,hp:50,dmg:8,speed:2.5,aggro:20,screams:true},
  escupidor:{name:'Escupidor',color:0x3a7a4a,scale:1.0,hp:45,dmg:12,speed:1.8,aggro:22,spits:true,spitDmg:12,spitRange:12},
  sigiloso:{name:'Sigiloso',color:0x2a2a3a,scale:0.9,hp:35,dmg:18,speed:3.0,aggro:30,stealth:true}
};

/* ================= THREE ================= */
var renderer, scene, ambCam, hemi, sun, flashL;
var sideMats = [], skyC = new THREE.Color();
try{ renderer = new THREE.WebGLRenderer({antialias:true}); }
catch(e){ document.body.innerHTML='<h2 style="padding:40px">WebGL no soportado.</h2>'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('view').appendChild(renderer.domElement);
scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x8fb4d9,90,260);
ambCam = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,500);
hemi = new THREE.HemisphereLight(0xbfd9ff,0x3a3f2e,.7); scene.add(hemi);
sun = new THREE.DirectionalLight(0xffe0b0,.9); sun.position.set(60,90,30); scene.add(sun);
flashL = new THREE.PointLight(0xffc36b,0,14); scene.add(flashL);
window.scene_global = scene;
window.renderer_global = renderer;

/* ================= MUNDO ================= */
var W = {n:8,B:26,R:12};
W.size = W.R*(W.n+1)+W.B*W.n;
W.half = W.size/2;
var blockC = function(i){ return -W.half+W.R+i*(W.B+W.R)+W.B/2; };
var roadC = function(i){ return -W.half+W.R/2+i*(W.B+W.R); };
var solids = [], cars = [], parkLights = [];
window.cars_global = cars;
window.solids_global = solids;

function floorTexture(){
  var c=document.createElement('canvas'); c.width=c.height=2048;
  var g=c.getContext('2d');
  var S=2048/W.size, mx=function(x){return (x+W.half)*S;};
  g.fillStyle='#26292f'; g.fillRect(0,0,2048,2048);
  var i,j,x0,y0,w;
  for(i=0;i<W.n;i++){ x0=mx(-W.half+W.R+i*(W.B+W.R)); w=W.B*S; g.fillStyle='#4a4e55'; g.fillRect(x0,0,w,2048); g.fillRect(0,x0,2048,w); }
  for(i=0;i<W.n;i++)for(j=0;j<W.n;j++){
    x0=mx(-W.half+W.R+i*(W.B+W.R)); y0=mx(-W.half+W.R+j*(W.B+W.R)); w=W.B*S;
    g.fillStyle=(i===3&&j===3)?'#3f6b34':(i===4&&j===3)?'#6f6a60':'#3c4046';
    g.fillRect(x0,y0,w,w);
  }
  g.fillStyle='#cfd3d8';
  for(i=0;i<=W.n;i++){
    var cx=mx(roadC(i)); for(var y=0;y<2048;y+=64)g.fillRect(cx-3,y,6,34);
    var cy=mx(roadC(i)); for(var x=0;x<2048;x+=64)g.fillRect(x,cy-3,34,6);
  }
  return new THREE.CanvasTexture(c);
}
function facadeMats(hex){
  var mk=function(glow){
    var c=document.createElement('canvas'); c.width=c.height=128;
    var g=c.getContext('2d');
    g.fillStyle=glow?'#000':hex; g.fillRect(0,0,128,128);
    if(!glow){g.fillStyle='rgba(0,0,0,.16)';for(var y=28;y<128;y+=28)g.fillRect(0,y,128,2);}
    var wc=glow?'#ffd27a':'#1c2733';
    for(var r=0;r<3;r++)for(var q=0;q<4;q++){g.fillStyle=wc;g.fillRect(8+q*31,8+r*29,20,20);}
    if(!glow){g.fillStyle='#131a21';for(var q2=0;q2<3;q2++)g.fillRect(10+q2*40,110,26,18);}
    return new THREE.CanvasTexture(c);
  };
  var side=new THREE.MeshLambertMaterial({map:mk(false),emissiveMap:mk(true),emissive:0xffc36b,emissiveIntensity:0});
  sideMats.push(side);
  return side;
}
var PALETTE=['#d96a4f','#e0a84b','#7fb6a4','#c96a6a','#6fa8c9','#d9c08f','#8fae6e','#c98fb6','#ddd8c8','#b6543c','#5f8fa8','#d98f4b'];
var roofMat=new THREE.MeshLambertMaterial({color:0x3a3f47});
var matCache={}; for(var pi=0;pi<PALETTE.length;pi++)matCache[PALETTE[pi]]=facadeMats(PALETTE[pi]);
function addBuildingDetailed(x,z,w,d,h,color){
  var mat=matCache[color];
  var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[mat,mat,roofMat,roofMat,mat,mat]);
  m.position.set(x,h/2,z); scene.add(m);
  solids.push({x1:x-w/2-.2,x2:x+w/2+.2,z1:z-d/2-.2,z2:z+d/2+.2});
  var door=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.2,.1),new THREE.MeshLambertMaterial({color:0x2a1a0a}));
  door.position.set(x,1.1,z+d/2+.05); scene.add(door);
}
function addBush(x,z,scale){
  scale=scale||1;
  var g=new THREE.Group();
  var mat=new THREE.MeshLambertMaterial({color:pick([0x3f6b2a,0x4a7a33,0x356b28])});
  for(var i=0;i<3;i++){
    var s=new THREE.Mesh(new THREE.SphereGeometry(rand(.4,.7)*scale,6,6),mat);
    s.position.set(rand(-.3,.3)*scale,rand(.3,.6)*scale,rand(-.3,.3)*scale); g.add(s);
  }
  g.position.set(x,0,z); scene.add(g);
}
function palm(x,z,s){
  s=s||1; var g=new THREE.Group();
  var trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14*s,.22*s,4.4*s,5),new THREE.MeshLambertMaterial({color:0x8a6a44}));
  trunk.position.y=2.2*s; trunk.rotation.z=rand(-.09,.09); g.add(trunk);
  var lm=new THREE.MeshLambertMaterial({color:0x3f7a34,side:THREE.DoubleSide});
  for(var i=0;i<7;i++){
    var f=new THREE.Mesh(new THREE.PlaneGeometry(2.6*s,.55*s),lm);
    f.position.y=4.4*s; f.rotation.y=i/7*TAU; f.rotation.x=-.6; f.translateY(1.1*s); g.add(f);
  }
  g.position.set(x,0,z); scene.add(g);
}
function lampWithLight(x,z,hasLight){
  var g=new THREE.Group();
  var pm=new THREE.MeshLambertMaterial({color:0x1a1d22});
  var p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,4.6,6),pm); p.position.y=2.3; g.add(p);
  var bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:0xffe6a8}));
  bulb.position.set(.9,4.25,0); g.add(bulb);
  if(hasLight){ var light=new THREE.PointLight(0xffe6a8,.5,16,2); light.position.set(.9,4.2,0); g.add(light); }
  g.position.set(x,0,z); scene.add(g);
}
function textSprite(txt,col,size){
  var c=document.createElement('canvas'); c.width=256;c.height=80;
  var g=c.getContext('2d');
  g.fillStyle='rgba(8,14,20,.9)'; g.fillRect(0,0,256,80);
  g.strokeStyle=col; g.lineWidth=4; g.strokeRect(3,3,250,74);
  g.fillStyle=col; g.font='bold 30px sans-serif';
  g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,128,42);
  var t=new THREE.CanvasTexture(c);
  var s=new THREE.Sprite(new THREE.SpriteMaterial({map:t}));
  s.scale.set(size||3.4,(size||3.4)*80/256,1);
  return s;
}
function blob(r){
  return new THREE.Mesh(new THREE.CircleGeometry(r,12),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false}));
}
function buildLomaCruz(){
  var lg=new THREE.Group();
  var hill=new THREE.Mesh(new THREE.ConeGeometry(40,18,24),new THREE.MeshLambertMaterial({color:0x4a5d33}));
  hill.position.y=9; lg.add(hill);
  var crossM=new THREE.MeshLambertMaterial({color:0xe8e4d4});
  var c1=new THREE.Mesh(new THREE.BoxGeometry(1.4,14,1.4),crossM); c1.position.y=25; lg.add(c1);
  var c2=new THREE.Mesh(new THREE.BoxGeometry(7,1.4,1.4),crossM); c2.position.y=28; lg.add(c2);
  var ts=textSprite('⛰️ LOMA DE LA CRUZ','#3fe0c8',8); ts.position.y=36; lg.add(ts);
  lg.position.set(0,0,-W.half-45); scene.add(lg);
  window.lomaPos=new THREE.Vector3(0,0,-W.half-45);
}
function makeCarDetailed(x,z,a,col,type,req){
  var g=new THREE.Group();
  var bm=new THREE.MeshLambertMaterial({color:col});
  var jeep=type==='jeep';
  var body=new THREE.Mesh(new THREE.BoxGeometry(2,jeep?.9:.8,4.6),bm); body.position.y=.75; g.add(body);
  var cab=new THREE.Mesh(new THREE.BoxGeometry(1.7,jeep?.7:.55,jeep?2.8:2),jeep?bm:new THREE.MeshLambertMaterial({color:0xdfe6ea}));
  cab.position.set(0,jeep?1.5:1.35,-.3); g.add(cab);
  var wm=new THREE.MeshLambertMaterial({color:0x1a1a1e});
  var wp=[[-1,1.5],[1,1.5],[-1,-1.5],[1,-1.5]];
  for(var i=0;i<wp.length;i++){
    var w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.28,12),wm);
    w.rotation.z=Math.PI/2; w.position.set(wp[i][0],.42,wp[i][1]); g.add(w);
  }
  var sh=blob(2.6); sh.scale.set(1,1.6,1); sh.position.y=.05; g.add(sh);
  g.position.set(x,0,z); g.rotation.y=a; scene.add(g);
  cars.push({g:g,x:x,z:z,a:a,speed:0,fuel:rand(35,95),type:type,req:req,searched:false,driver:null,hp:100});
}
function createStars(){
  var geo=new THREE.BufferGeometry();
  var pos=new Float32Array(800*3);
  for(var i=0;i<800;i++){
    var th=rand(0,TAU), ph=rand(0,Math.PI/2), r=400;
    pos[i*3]=r*Math.sin(ph)*Math.cos(th);
    pos[i*3+1]=r*Math.cos(ph);
    pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:1.2,transparent:true,opacity:0}));
  scene.add(stars); window.starsMesh=stars;
}
function buildPark(bx,bz){
  var grass=new THREE.Mesh(new THREE.PlaneGeometry(W.B,W.B),new THREE.MeshLambertMaterial({color:0x3f7a34}));
  grass.rotation.x=-Math.PI/2; grass.position.set(bx,.06,bz); scene.add(grass);
  var fb=new THREE.Mesh(new THREE.CylinderGeometry(3,3.5,.8,12),new THREE.MeshLambertMaterial({color:0x8a8a80}));
  fb.position.set(bx,.4,bz); scene.add(fb);
  solids.push({x1:bx-3.6,x2:bx+3.6,z1:bz-3.6,z2:bz+3.6});
  window.shopPos=new THREE.Vector3(bx+8,0,bz-8);
  var cafe=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),new THREE.MeshLambertMaterial({color:0xe0a84b}));
  cafe.position.set(bx+8,1.5,bz-8); scene.add(cafe);
  solids.push({x1:bx+6,x2:bx+10,z1:bz-10,z2:bz-6});
  var sign=textSprite('☕ CAFETERÍA EL JÚCARO','#ffb340',4); sign.position.set(bx+8,4,bz-8); scene.add(sign);
  for(var i=0;i<8;i++)palm(bx+rand(-11,11),bz+rand(-11,11),rand(.9,1.3));
  var pl1=new THREE.PointLight(0xffc36b,.5,30); pl1.position.set(bx,5,bz); scene.add(pl1); parkLights.push(pl1);
}
function buildPlaza(bx,bz){
  var wm=new THREE.MeshLambertMaterial({color:0xe8e4d4});
  var body=new THREE.Mesh(new THREE.BoxGeometry(15,11,10),wm); body.position.set(bx-2,5.5,bz); scene.add(body);
  var tow=new THREE.Mesh(new THREE.BoxGeometry(4.4,18,4.4),wm); tow.position.set(bx+7.5,9,bz); scene.add(tow);
  solids.push({x1:bx-9.7,x2:bx+5.7,z1:bz-5.2,z2:bz+5.2});
  solids.push({x1:bx+5.1,x2:bx+9.9,z1:bz-2.4,z2:bz+2.4});
}
function buildCity(){
  var gc=document.createElement('canvas'); gc.width=gc.height=512;
  var g=gc.getContext('2d');
  g.fillStyle='#4a5d33'; g.fillRect(0,0,512,512);
  for(var i=0;i<2000;i++){
    g.fillStyle=pick(['#3f5229','#556b3d','#4a5d33','#5a7042']);
    g.fillRect(Math.random()*512,Math.random()*512,2,2);
  }
  var gt=new THREE.CanvasTexture(gc);
  gt.wrapS=gt.wrapT=THREE.RepeatWrapping; gt.repeat.set(40,40);
  var ground=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshLambertMaterial({map:gt}));
  ground.rotation.x=-Math.PI/2; ground.position.y=-.05; scene.add(ground);
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(W.size,W.size),new THREE.MeshLambertMaterial({map:floorTexture()}));
  floor.rotation.x=-Math.PI/2; floor.position.y=.01; scene.add(floor);
  for(var bi=0;bi<W.n;bi++)for(var bj=0;bj<W.n;bj++){
    var bx=blockC(bi),bz=blockC(bj);
    if(bi===3&&bj===3){buildPark(bx,bz);continue;}
    if(bi===4&&bj===3){buildPlaza(bx,bz);continue;}
    var nb=irand(2,3);
    for(var k=0;k<nb;k++){
      var w=rand(7,11),d=rand(7,11),h=rand(6,14);
      addBuildingDetailed(bx+rand(-4,4),bz+rand(-4,4),w,d,h,pick(PALETTE));
    }
    if(Math.random()<.5)palm(bx+rand(-11,11),bz+rand(-11,11),rand(.8,1.3));
  }
  buildLomaCruz();
  var carCols=['#c94f4f','#4f7fc9','#e0a84b','#7fb6a4','#d9d9d9','#8f4f8f','#e07a3f','#5c8a5c'];
  for(var k2=0;k2<14;k2++){
    var vert=Math.random()<.5,ri=irand(0,W.n);
    var off=(Math.random()<.5?1:-1)*(W.R/2-2.5);
    var x,z,a;
    if(vert){x=roadC(ri)+off;z=rand(-W.half+8,W.half-8);a=Math.random()<.5?0:Math.PI;}
    else{z=roadC(ri)+off;x=rand(-W.half+8,W.half-8);a=Math.random()<.5?Math.PI/2:-Math.PI/2;}
    makeCarDetailed(x,z,a,pick(carCols),'clasico',3);
  }
  makeCarDetailed(blockC(4)+9,blockC(3)-15.5,Math.PI,'#4a5d3a','jeep',5);
  if(window.Buildings){ Buildings.generateDoors(solids); }
  createStars();
}

/* ================= PERSONAJES ================= */
function buildHuman(shirt,pants,skin){
  var g=new THREE.Group();
  var M=function(c){return new THREE.MeshLambertMaterial({color:c});};
  var mkP=function(px,py){var p=new THREE.Group();p.position.set(px,py,0);g.add(p);return p;};
  var ll=mkP(-.14,.82); ll.add(new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(pants))).children[0].position.y=-.39;
  var rl=mkP(.14,.82); rl.add(new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(pants))).children[0].position.y=-.39;
  var body=new THREE.Mesh(new THREE.BoxGeometry(.6,.72,.34),M(shirt)); body.position.y=1.16; g.add(body);
  var head=new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.36),M(skin)); head.position.y=1.72; g.add(head);
  var la=mkP(-.4,1.46); la.add(new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(shirt))).children[0].position.y=-.3;
  var ra=mkP(.4,1.46); ra.add(new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(shirt))).children[0].position.y=-.3;
  var sh=blob(.55); sh.rotation.x=-Math.PI/2; sh.position.y=.03; g.add(sh);
  return {g:g,ll:ll,rl:rl,la:la,ra:ra,head:head};
}
function gunMesh(id){
  var g=new THREE.Group(), M=function(c){return new THREE.MeshLambertMaterial({color:c});};
  var m=null;
  if(id==='arco'){
    var bc=new THREE.Mesh(new THREE.TorusGeometry(.5,.03,4,12,Math.PI),M(0x6a4a2a));
    bc.rotation.y=Math.PI/2; g.add(bc);
    return g;
  }
  if(id==='tubo')m=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.9,6),M(0x777f88));
  else if(id==='machete')m=new THREE.Mesh(new THREE.BoxGeometry(.05,.09,.85),M(0xcfd8de));
  else if(id==='pistola')m=new THREE.Mesh(new THREE.BoxGeometry(.09,.14,.34),M(0x23272e));
  else if(id==='escopeta')m=new THREE.Mesh(new THREE.BoxGeometry(.1,.12,.95),M(0x4a3626));
  else if(id==='ak')m=new THREE.Mesh(new THREE.BoxGeometry(.09,.13,.95),M(0x2e2a24));
  if(m){m.rotation.x=Math.PI/2;g.add(m);}
  return g;
}
function makeBar(){
  var bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x200508})); bg.scale.set(.95,.08,1);
  var fg=new THREE.Sprite(new THREE.SpriteMaterial({color:0xff5a4a})); fg.scale.set(.95,.06,1);
  var grp=new THREE.Group(); grp.add(bg); grp.add(fg); grp.position.y=2.15; grp.visible=false;
  return {grp:grp,fg:fg};
}

/* ================= ESTADO ================= */
var mode=1, state='MENU';
window.players=[];
var zombies=[],crates=[],tracers=[],bloods=[],noises=[];
var arrows=[],stuckArrows=[];
var stepAccumulator=0;
var dayT=.5,day=1,hour=12,prevHour=12,zSpawnT=0,groanT=4;
var gameRunningTime=0;
var MAPC=null,MAPS=0,MAPHALF=175;
var camMenuA=0;
var aimLine=null,impactMarker=null,aimRayLine=null,aimRayMarker=null;
window.zombies_global=zombies;

/* ================= MIRILLA UNIVERSAL ================= */
function createAimHelpers(){
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(80*3),3));
  aimLine=new THREE.Line(geo,new THREE.LineDashedMaterial({color:0xffb340,dashSize:.25,gapSize:.18,transparent:true,opacity:.75}));
  aimLine.frustumCulled=false; aimLine.visible=false; scene.add(aimLine);
  impactMarker=new THREE.Mesh(new THREE.RingGeometry(.15,.26,20),new THREE.MeshBasicMaterial({color:0xffb340,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false}));
  impactMarker.renderOrder=10; impactMarker.visible=false; scene.add(impactMarker);
  var rayGeo=new THREE.BufferGeometry();
  rayGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
  aimRayLine=new THREE.Line(rayGeo,new THREE.LineBasicMaterial({color:0xff3030,transparent:true,opacity:.8}));
  aimRayLine.frustumCulled=false; aimRayLine.visible=false; scene.add(aimRayLine);
  aimRayMarker=new THREE.Mesh(new THREE.RingGeometry(.12,.22,16),new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false}));
  aimRayMarker.renderOrder=10; aimRayMarker.visible=false; scene.add(aimRayMarker);
}
var _aimRay=null,_aimNDC=null,_aimPlane=null,_aimPoint=null;
function getAimDir(p){
  if(!_aimRay){_aimRay=new THREE.Raycaster();_aimNDC=new THREE.Vector2(0,0);_aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.5);_aimPoint=new THREE.Vector3();}
  _aimRay.setFromCamera(_aimNDC,p.cam);
  var hit=_aimRay.ray.intersectPlane(_aimPlane,_aimPoint);
  if(hit){
    var dx=_aimPoint.x-p.pos.x,dz=_aimPoint.z-p.pos.z;
    var len=Math.hypot(dx,dz);
    if(len>0.2)return{x:dx/len,z:dz/len};
  }
  return{x:Math.sin(p.camYaw),z:Math.cos(p.camYaw)};
}
function updateBowAim(p){
  if(!aimLine||!impactMarker)return;
  var cw=WEAPONS[p.weapons[p.cur]];
  if(!cw||cw.type!=='bow'){aimLine.visible=false;impactMarker.visible=false;return;}
  var ad=getAimDir(p);
  var px=p.pos.x+ad.x*.8,py=1.5,pz=p.pos.z+ad.z*.8;
  var vx=ad.x*28,vy=3.5,vz=ad.z*28;
  var points=[],simDt=1/30,maxSteps=80,maxRange=cw.range||60;
  var hitPoint=null,hitTarget=false,lastDir={x:vx,y:vy,z:vz},totalDist=0;
  for(var i=0;i<maxSteps;i++){
    points.push(px,py,pz);
    var zh=null;
    for(var j=0;j<zombies.length;j++){
      var zom=zombies[j]; if(zom.dead)continue;
      var dx=zom.x-px,dz=zom.z-pz;
      if(dx*dx+dz*dz<.5&&py>.3&&py<2.2){zh=zom;break;}
    }
    if(zh){hitPoint={x:px,y:py,z:pz};hitTarget=true;break;}
    vy-=12*simDt;
    var nx=px+vx*simDt,ny=py+vy*simDt,nz=pz+vz*simDt;
    totalDist+=Math.hypot(nx-px,ny-py,nz-pz);
    if(totalDist>maxRange){hitPoint={x:nx,y:ny,z:nz};break;}
    lastDir={x:vx,y:vy,z:vz}; px=nx;py=ny;pz=nz;
    if(py<=.05){hitPoint={x:px,y:.05,z:pz};break;}
    if(inSolid(px,pz,.1)){hitPoint={x:px,y:py,z:pz};break;}
  }
  var pa=aimLine.geometry.getAttribute('position');
  var count=Math.min(Math.floor(points.length/3),pa.count);
  for(var k=0;k<count;k++)pa.setXYZ(k,points[k*3],points[k*3+1],points[k*3+2]);
  pa.needsUpdate=true;
  aimLine.geometry.setDrawRange(0,count);
  if(count>1)aimLine.computeLineDistances();
  aimLine.visible=count>1;
  aimLine.material.color.set(hitTarget?0xff4a3d:0xffb340);
  if(hitPoint){
    impactMarker.position.set(hitPoint.x,hitPoint.y,hitPoint.z);
    var len=Math.hypot(lastDir.x,lastDir.y,lastDir.z)||1;
    impactMarker.lookAt(hitPoint.x+lastDir.x/len,hitPoint.y+lastDir.y/len,hitPoint.z+lastDir.z/len);
    impactMarker.material.color.set(hitTarget?0xff4a3d:0xffb340);
    impactMarker.visible=true;
  }else impactMarker.visible=false;
}
function updateGunAim(p){
  if(!aimRayLine||!aimRayMarker)return;
  var cw=WEAPONS[p.weapons[p.cur]];
  if(!cw||cw.type!=='gun'){aimRayLine.visible=false;aimRayMarker.visible=false;return;}
  var ad=getAimDir(p);
  var ox=p.pos.x,oz=p.pos.z;
  var bestT=cw.range||70,hitZ=false;
  for(var j=0;j<zombies.length;j++){
    var z=zombies[j]; if(z.dead)continue;
    var dx=z.x-ox,dz=z.z-oz;
    var t=dx*ad.x+dz*ad.z;
    if(t>0&&t<bestT){
      var px=ox+ad.x*t,pz=oz+ad.z*t;
      if((z.x-px)*(z.x-px)+(z.z-pz)*(z.z-pz)<.6){bestT=t;hitZ=true;}
    }
  }
  var ex=ox+ad.x*bestT,ez=oz+ad.z*bestT;
  var pa=aimRayLine.geometry.getAttribute('position');
  pa.setXYZ(0,ox+ad.x*.6,1.5,oz+ad.z*.6);
  pa.setXYZ(1,ex,1.4,ez);
  pa.needsUpdate=true;
  aimRayLine.visible=true;
  aimRayLine.material.color.set(hitZ?0xff3030:0xff6060);
  aimRayMarker.position.set(ex,1.4,ez);
  aimRayMarker.rotation.x=-Math.PI/2;
  aimRayMarker.material.color.set(hitZ?0xff3030:0xff6060);
  aimRayMarker.visible=true;
}
function updateAimTrajectory(p){
  if(p.inCar||p.down){
    if(aimLine)aimLine.visible=false; if(impactMarker)impactMarker.visible=false;
    if(aimRayLine)aimRayLine.visible=false; if(aimRayMarker)aimRayMarker.visible=false;
    return;
  }
  var aiming=window.Controls&&Controls.isAiming();
  var cw=WEAPONS[p.weapons[p.cur]];
  if(!aiming||!cw){
    if(aimLine)aimLine.visible=false; if(impactMarker)impactMarker.visible=false;
    if(aimRayLine)aimRayLine.visible=false; if(aimRayMarker)aimRayMarker.visible=false;
    return;
  }
  if(cw.type==='bow'){updateBowAim(p); if(aimRayLine)aimRayLine.visible=false; if(aimRayMarker)aimRayMarker.visible=false;}
  else if(cw.type==='gun'){updateGunAim(p); if(aimLine)aimLine.visible=false; if(impactMarker)impactMarker.visible=false;}
  else{
    if(aimLine)aimLine.visible=false; if(impactMarker)impactMarker.visible=false;
    if(aimRayLine)aimRayLine.visible=false; if(aimRayMarker)aimRayMarker.visible=false;
  }
}
function shootArrow(p){
  if((p.ammo.flecha||0)<=0){ if(window.sfx)sfx.empty(); toast('¡Sin flechas!','bad'); return; }
  p.ammo.flecha--;
  if(window.sfx)sfx.bow();
  var ad=getAimDir(p);
  var arrow={x:p.pos.x+ad.x*.8,y:1.5,z:p.pos.z+ad.z*.8,vx:ad.x*28,vy:3.5,vz:ad.z*28,mesh:null,life:4,fromPlayer:p.idx};
  var group=new THREE.Group();
  var shaft=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.7,4),new THREE.MeshLambertMaterial({color:0x8a6a3a}));
  shaft.rotation.x=Math.PI/2; group.add(shaft);
  group.position.set(arrow.x,arrow.y,arrow.z);
  scene.add(group); arrow.mesh=group; arrows.push(arrow);
}
function stickArrow(a){
  var sg=new THREE.Group();
  var shaft=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.5,4),new THREE.MeshLambertMaterial({color:0x8a6a3a}));
  shaft.position.y=.25; sg.add(shaft);
  sg.position.set(a.x,Math.max(.05,a.y-.3),a.z);
  sg.rotation.x=rand(-.3,.3); sg.rotation.z=rand(-.3,.3);
  scene.add(sg); stuckArrows.push({mesh:sg,life:15});
  if(window.sfx)sfx.arrowStick();
}
function updateArrows(dt){
  for(var i=arrows.length-1;i>=0;i--){
    var a=arrows[i];
    a.life-=dt;
    if(a.life<=0){scene.remove(a.mesh);arrows.splice(i,1);continue;}
    var speed=Math.hypot(a.vx,a.vy,a.vz);
    var steps=Math.max(1,Math.ceil(speed*dt/0.12)),sdt=dt/steps;
    var hit=false,hitSurface='';
    for(var s=0;s<steps&&!hit;s++){
      a.vy-=12*sdt; a.x+=a.vx*sdt; a.y+=a.vy*sdt; a.z+=a.vz*sdt;
      if(a.y<=.05){hit=true;hitSurface='ground';break;}
      if(inSolid(a.x,a.z,.1)){hit=true;hitSurface=Math.random()<.6?'stone':'wood';break;}
      for(var j=0;j<zombies.length;j++){
        var z=zombies[j]; if(z.dead)continue;
        var dx=z.x-a.x,dz=z.z-a.z;
        if(dx*dx+dz*dz<.64&&a.y>.2&&a.y<2.3){
          var bm=window.Progression?Progression.bowDamageMul():1;
          hurtZombie(z,WEAPONS.arco.dmg*dmgMul(players[a.fromPlayer]||{level:0})*bm,a.fromPlayer);
          hit=true;hitSurface='flesh';break;
        }
      }
      if(hit)break;
    }
    a.mesh.position.set(a.x,a.y,a.z);
    var len=Math.hypot(a.vx,a.vy,a.vz);
    if(len>0)a.mesh.lookAt(a.x+a.vx/len,a.y+a.vy/len,a.z+a.vz/len);
    if(hit){
      if(hitSurface==='flesh')scene.remove(a.mesh);
      else{ if(window.sfx)sfx.arrowImpact(hitSurface); stickArrow(a); }
      arrows.splice(i,1);
    }
  }
  for(var k=stuckArrows.length-1;k>=0;k--){
    var sa=stuckArrows[k]; sa.life-=dt;
    if(sa.life<=0){scene.remove(sa.mesh);stuckArrows.splice(k,1);}
  }
}

/* ================= ZOMBIS ================= */
function createLocalFallback(){
  var g=new THREE.Group();
  var pivot=new THREE.Group(); pivot.position.y=.05; g.add(pivot);
  var inner=new THREE.Group(); pivot.add(inner);
  var M=function(c){return new THREE.MeshLambertMaterial({color:c});};
  var skin=pick(['#7a9a6a','#8fae7a','#6f8f6f','#9aa87a']);
  var cloth=pick(['#5a5f6a','#7a5a4a','#4a6a5a','#8a8a7a','#6a4a5a']);
  var ll=new THREE.Group(); ll.position.set(-.14,.82,0); inner.add(ll);
  ll.add(new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(cloth))).children[0].position.y=-.39;
  var rl=new THREE.Group(); rl.position.set(.14,.82,0); inner.add(rl);
  rl.add(new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(cloth))).children[0].position.y=-.39;
  var torso=new THREE.Group(); torso.position.y=1.16; torso.rotation.x=.25;
  torso.add(new THREE.Mesh(new THREE.BoxGeometry(.6,.72,.34),M(cloth)));
  inner.add(torso);
  var head=new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.36),M(skin));
  head.position.set(0,1.68,.05); inner.add(head);
  var eyeMat=new THREE.MeshBasicMaterial({color:0xff3030});
  var eL=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02),eyeMat); eL.position.set(-.09,1.72,.19); inner.add(eL);
  var eR=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02),eyeMat); eR.position.set(.09,1.72,.19); inner.add(eR);
  var la=new THREE.Group(); la.position.set(-.4,1.46,0); inner.add(la);
  la.add(new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(cloth))).children[0].position.y=-.3;
  var ra=new THREE.Group(); ra.position.set(.4,1.46,0); inner.add(ra);
  ra.add(new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(cloth))).children[0].position.y=-.3;
  return {group:g,pivot:pivot,isGLB:false,mixer:null,human:{g:inner,ll:ll,rl:rl,la:la,ra:ra,head:head}};
}
function spawnZombie(x, z, menu){
    // 1. Crear wrapper persistente
    var wrapper = new THREE.Group();
    wrapper.position.set(x, 0, z);
    scene.add(wrapper);
    
    // 2. Fallback inmediato
    var fallback = createLocalFallback();
    wrapper.add(fallback.group);
    
    var bar = makeBar(); 
    wrapper.add(bar.grp);
    
    var zombie = {
        x:x, z:z, yaw:rand(0,TAU),
        hp:42, maxhp:42, speed:rand(1,1.8),
        state:'wander', wt:rand(0,3), tx:x, tz:z,
        atkCd:0,
        model: {
            group: wrapper,
            pivot: fallback.pivot,
            isGLB: false,
            mixer: null,
            human: fallback.human,
            currentVisual: fallback.group
        },
        bar:bar,
        dead:false, dieT:0, flash:0,
        menu:!!menu, ph:rand(0,TAU),
        ztype:'caminante', zdmg:10, aggroRange:15
    };
    zombies.push(zombie);
    
    // 3. Carga de modelo GLB (BLINDADO: soporta Promesas y retornos síncronos)
    if(window.Models && Models.makeZombie){
        var result = Models.makeZombie();
        
        var applyModel = function(glb){
            if(!glb || !glb.group) return;
            if(zombie.dead){ scene.remove(glb.group); return; }
            
            if(zombie.model.currentVisual && zombie.model.currentVisual.parent === wrapper){
                wrapper.remove(zombie.model.currentVisual);
            }
            
            wrapper.add(glb.group);
            zombie.model.currentVisual = glb.group;
            zombie.model.isGLB = true;
            zombie.model.mixer = glb.mixer;
            zombie.model.pivot = glb.pivot;
            
            wrapper.updateMatrixWorld(true);
            var box = new THREE.Box3().setFromObject(wrapper);
            if(box.min.y < -0.05) wrapper.position.y += (-box.min.y + 0.02);
            else if(box.min.y > 0.3) wrapper.position.y -= (box.min.y - 0.02);
        };

        // Si es una Promesa (async), usar .then(). Si es síncrono, ejecutar directo.
        if(result && typeof result.then === 'function'){
            result.then(applyModel).catch(function(err){
                console.warn('[Spawn] GLB falló, manteniendo fallback:', err);
            });
        } else {
            applyModel(result);
        }
    }
    
    // 4. Aplicar tipos especiales
    if(window.ZombiesX && Math.random() < .6){
        var typeId = ZombiesX.pickType(day, isNight());
        ZombiesX.applyType(zombie, typeId);
    }
}
function spawnHordeZombie(x,z){ spawnZombie(x,z,false); }
function freeSpot(cx,cz,rMin,rMax){
  for(var k=0;k<9;k++){
    var a=rand(0,TAU),r=rand(rMin,rMax);
    var x=clamp(cx+Math.sin(a)*r,-W.half+2,W.half-2);
    var z=clamp(cz+Math.cos(a)*r,-W.half+2,W.half-2);
    if(!inSolid(x,z,.6))return{x:x,z:z};
  }
  return null;
}
function inSolid(x,z,r){
  for(var i=0;i<solids.length;i++){var b=solids[i];if(x>b.x1-r&&x<b.x2+r&&z>b.z1-r&&z<b.z2+r)return true;}
  return false;
}
function segBox(o,d,b){
  var tmin=0,tmax=1e9;
  if(Math.abs(d.x)<1e-8){if(o.x<b.x1||o.x>b.x2)return null;}
  else{var t1=(b.x1-o.x)/d.x,t2=(b.x2-o.x)/d.x;if(t1>t2){var t=t1;t1=t2;t2=t;}tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);}
  if(Math.abs(d.z)<1e-8){if(o.z<b.z1||o.z>b.z2)return null;}
  else{var u1=(b.z1-o.z)/d.z,u2=(b.z2-o.z)/d.z;if(u1>u2){var u=u1;u1=u2;u2=u;}tmin=Math.max(tmin,u1);tmax=Math.min(tmax,u2);}
  if(tmax<tmin)return null;
  return tmin>0?tmin:(tmax>0?0:null);
}
function tryMove(o,dx,dz,r){
  if(!isFinite(dx))dx=0; if(!isFinite(dz))dz=0;
  o.x+=dx;
  for(var i=0;i<solids.length;i++){var b=solids[i];if(o.x>b.x1-r&&o.x<b.x2+r&&o.z>b.z1-r&&o.z<b.z2+r)o.x=(dx>0)?b.x1-r:b.x2+r;}
  o.z+=dz;
  for(var j=0;j<solids.length;j++){var b2=solids[j];if(o.x>b2.x1-r&&o.x<b2.x2+r&&o.z>b2.z1-r&&o.z<b2.z2+r)o.z=(dz>0)?b2.z1-r:b2.z2+r;}
  o.x=clamp(o.x,-W.half+1,W.half-1);
  o.z=clamp(o.z,-W.half-60,W.half-1);
}
window.tryMove=tryMove;
function addBlood(x,z,big){
  var m=new THREE.Mesh(new THREE.CircleGeometry(big?rand(.7,1.1):rand(.3,.5),8),new THREE.MeshBasicMaterial({color:0x6a0d0d,transparent:true,opacity:.6,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(x,.04,z); scene.add(m);
  bloods.push({m:m,t:22});
  if(bloods.length>70){var o=bloods.shift();scene.remove(o.m);}
}
function addTracer(a,b){
  var geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z)]);
  var l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffd894,transparent:true,opacity:.9}));
  scene.add(l); tracers.push({l:l,t:.06});
}
function noiseAt(x,z,r){noises.push({x:x,z:z,r:r,t:2});}

/* ================= COMBATE ================= */
function hurtZombie(z,dmg,pi){
  if(z.dead)return;
  z.hp-=dmg; z.flash=.14; z.aggro=14;
  var p=players[pi];
  if(p){var dx=z.x-p.pos.x,dz=z.z-p.pos.z,d=Math.hypot(dx,dz)||1;tryMove(z,dx/d*.5,dz/d*.5,.45);}
  addBlood(z.x,z.z,false);
  if(window.sfx)sfx.hit();
  if(z.hp<=0)killZombie(z,pi);
}
window.hurtZombieFromNPC=function(z,dmg,npc){
  if(z.dead)return;
  z.hp-=dmg; z.flash=.14; z.aggro=14;
  addBlood(z.x,z.z,false);
  if(window.sfx)sfx.hit();
  if(z.hp<=0){
    z.dead=true; z.dieT=0; addBlood(z.x,z.z,true);
    if(window.sfx)sfx.zdie();
    if(npc){npc.kills=(npc.kills||0)+1;npc.killsLvl=(npc.killsLvl||0)+1;}
    if(window.Missions)Missions.updateProgress('kill');
  }
};
function killZombie(z,pi){
  if(window.ZombiesX&&ZombiesX.onDeath(z,players,hurtPlayer))addBlood(z.x,z.z,true);
  z.dead=true; z.dieT=0; addBlood(z.x,z.z,true);
  if(window.sfx)sfx.zdie();
  if(Math.random()<.55){
    var m=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,.3),new THREE.MeshLambertMaterial({color:0x8a6a3f}));
    m.position.set(z.x,.16,z.z); m.rotation.y=rand(0,TAU); scene.add(m);
    crates.push({x:z.x,z:z.z,m:m});
  }
  if(players[pi])addKill(players[pi]);
  if(window.Missions)Missions.updateProgress('kill');
  if(window.Achievements){
    Achievements.addStat('kills',1);
    if(pi===0&&players[0]&&players[0].weapons[players[0].cur]==='arco')Achievements.addStat('bowKills',1);
  }
  if(Math.random()<.75&&players[pi]){
    var r=irand(1,3);
    players[pi].ammo.flecha=(players[pi].ammo.flecha||0)+r;
    toast('+'+r+' 🏹 flechas','good');
  }
}
function addKill(p){
  p.kills++; p.killsLvl++;
  var ups=0;
  while(p.killsLvl>=need(p.level)){p.killsLvl-=need(p.level);p.level++;ups++;applyUnlock(p);if(window.Progression)Progression.addPoints(1);}
  if(ups)p.hp=Math.min(100,p.hp+30);
}
function applyUnlock(p){
  var u=UNLOCKS[p.level];
  if(window.sfx)sfx.level();
  if(u){
    announce('NIVEL '+p.level,u.txt);
    if(u.w){p.weapons.push(u.w);if(!p.mag[u.w]&&WEAPONS[u.w].mag)p.mag[u.w]=WEAPONS[u.w].mag;equipWeapon(p,u.w);}
    if(u.ammo)for(var k in u.ammo)p.ammo[k]+=u.ammo[k];
  }else announce('NIVEL '+p.level,'SIGUE ASÍ');
}
function fireWeapon(p){
  var id=p.weapons[p.cur],w=WEAPONS[id];
  if(p.fireCd>0||p.reloading>0)return;
  if(w.type==='melee'){
    p.fireCd=w.rate; p.meleeT=.25;
    if(window.sfx)sfx.swing();
    var mm=window.Progression?Progression.meleeDamageMul():1;
    for(var i=0;i<zombies.length;i++){
      var z=zombies[i]; if(z.dead)continue;
      var dx=z.x-p.pos.x,dz=z.z-p.pos.z,d=Math.hypot(dx,dz);
      if(d<w.range&&Math.abs(angTo(p.facing,Math.atan2(dx,dz)))<w.arc/2)
        hurtZombie(z,w.dmg*dmgMul(p)*mm,p.idx);
    }
    if(window.NoiseSystem&&w.noise)NoiseSystem.add(w.noise,p);
    return;
  }
  if(w.type==='bow'){
    p.fireCd=w.rate; shootArrow(p);
    if(window.NoiseSystem)NoiseSystem.add(w.noise||4,p);
    return;
  }
  if((p.mag[id]||0)<=0){ if(window.sfx)sfx.empty(); startReload(p); toast('¡Sin munición!','bad'); return; }
  p.mag[id]--; p.fireCd=w.rate;
  if(window.sfx&&sfx[w.sfx])sfx[w.sfx]();
  noiseAt(p.pos.x,p.pos.z,48);
  if(window.NoiseSystem&&w.noise)NoiseSystem.add(w.noise,p);
  flashL.position.set(p.pos.x+Math.sin(p.camYaw)*.8,1.6,p.pos.z+Math.cos(p.camYaw)*.8);
  flashL.intensity=2.6;
  var n=w.pellets||1;
  for(var s=0;s<n;s++){
    var yaw=p.camYaw+rand(-w.spread,w.spread);
    var d={x:Math.sin(yaw),z:Math.cos(yaw)};
    var o={x:p.pos.x+d.x*.6,z:p.pos.z+d.z*.6};
    var best={t:w.range,z:null};
    for(var si=0;si<solids.length;si++){var t=segBox(o,d,solids[si]);if(t!=null&&t<best.t)best={t:t,z:null};}
    for(var zi=0;zi<zombies.length;zi++){
      var zz=zombies[zi]; if(zz.dead)continue;
      var ddx=zz.x-o.x,ddz=zz.z-o.z,tt=ddx*d.x+ddz*d.z;
      if(tt>0&&tt<best.t){
        var px=o.x+d.x*tt,pz=o.z+d.z*tt;
        if((zz.x-px)*(zz.x-px)+(zz.z-pz)*(zz.z-pz)<.42)best={t:tt,z:zz};
      }
    }
    addTracer({x:o.x,y:1.5,z:o.z},{x:o.x+d.x*best.t,y:1.4,z:o.z+d.z*best.t});
    if(best.z)hurtZombie(best.z,w.dmg*dmgMul(p)*(Math.random()<.15?1.7:1),p.idx);
  }
  if(p.mag[id]<=0)startReload(p);
}
function startReload(p){
  var id=p.weapons[p.cur],w=WEAPONS[id];
  if(w.type!=='gun'||p.reloading>0)return;
  if((p.mag[id]||0)>=w.mag||p.ammo[w.ammo]<=0)return;
  p.reloading=1.15;
  if(window.sfx)sfx.reload();
}
function finishReload(p){
  var id=p.weapons[p.cur],w=WEAPONS[id];
  if(w.type!=='gun')return;
  var take=Math.min(w.mag-(p.mag[id]||0),p.ammo[w.ammo]);
  p.ammo[w.ammo]-=take; p.mag[id]=(p.mag[id]||0)+take;
}
function hurtPlayer(p,dmg,srcX,srcZ){
  if(p.down)return;
  if((p.items.armor||0)>0)dmg*=.7;
  p.hp-=dmg; p.hitFlash=.4;
  if(window.DamageDir&&srcX!==undefined)DamageDir.show(srcX,srcZ,p,clamp(dmg/30,.4,1));
  var df=document.getElementById('damage-flash');
  if(df){df.classList.add('on');setTimeout(function(){df.classList.remove('on');},200);}
  if(window.sfx)sfx.hurt();
  if(p.hp<=0){p.hp=0;downPlayer(p);}
}
window.hurtPlayer=hurtPlayer;
function downPlayer(p){
  if(mode===1){p.hp=0;gameOver();return;}
  p.down=true; p.human.g.visible=false;
  toast('JUGADOR '+(p.idx+1)+' HA CAÍDO','bad');
  var all=true;
  for(var i=0;i<players.length;i++)if(!players[i].down&&players[i].hp>0)all=false;
  if(all)gameOver();
}
function dmgMul(p){return 1+(p.level>=6?(p.level-5)*.08:0);}

/* ================= HUD ================= */
function buildHUD(i){
  var d=document.createElement('div'); d.className='hud p'+(i+1);
  d.innerHTML='<div class="tl"><div class="clock"><span class="day">DÍA 1</span><span class="hr">12:00</span></div><div class="lvline"><div class="lvbadge">NV 0</div><div class="xpbar"><i></i></div></div><div class="kills">☠ 0 · FALTAN: 1</div><div class="inf hidden">☣ INFECTADO</div></div>'+
  '<div class="compass"><b>N</b> 0°</div>'+
  '<div class="tr"><div class="barlbl"><span>SALUD</span></div><div class="bar hp"><i></i></div><div class="barlbl"><span>HAMBRE</span></div><div class="bar hun"><i></i></div><div class="barlbl"><span>ESTAMINA</span></div><div class="bar sta"><i></i></div><div class="ammoline"><b>50</b><span> 🏹</span></div><div class="wname">ARCO DE CAZA</div><div class="money">$ 60</div></div>'+
  '<div class="mmwrap"><canvas id="mmframe'+i+'" width="180" height="180"></canvas><div class="mmlabel">P'+(i+1)+' · HOLGUÍN</div></div>'+
  '<div class="hint" style="display:none"></div><div class="cross"><i></i></div><div class="vig"></div><div class="downov hidden"><b>HAS CAÍDO</b></div>';
  document.getElementById('hudroot').appendChild(d);
  var q=function(s){return d.querySelector(s);};
  var fog=document.createElement('canvas'); fog.width=fog.height=512;
  var fg=fog.getContext('2d'); fg.fillStyle='#000'; fg.fillRect(0,0,512,512);
  return {root:d,clockD:q('.day'),clockH:q('.hr'),lvl:q('.lvbadge'),xp:q('.xpbar i'),kills:q('.kills'),inf:q('.inf'),comp:q('.compass'),
    hp:q('.bar.hp i'),hun:q('.bar.hun i'),sta:q('.bar.sta i'),ammo:q('.ammoline b'),ammoR:q('.ammoline span'),
    wname:q('.wname'),money:q('.money'),mm:q('#mmframe'+i),mmctx:q('#mmframe'+i).getContext('2d'),
    fog:fog,fogctx:fg,hint:q('.hint'),vig:q('.vig'),down:q('.downov')};
}
function newPlayer(i){
  var x=blockC(3)+(i?5:-5),z=blockC(3)+10;
  var h=buildHuman(i?0xc94f4f:0x2f8f83,'#2c3138',0xd9a878);
  scene.add(h.g); h.g.position.set(x,0,z); h.g.visible=true;
  var spot=new THREE.SpotLight(0xffe9c0,0,34,.62,.55); scene.add(spot); scene.add(spot.target);
  var cam=new THREE.PerspectiveCamera(62,1,.1,500);
  return {idx:i,pos:new THREE.Vector3(x,0,z),yaw:Math.PI,facing:Math.PI,camYaw:Math.PI,camPitch:.4,
    hp:100,hunger:100,stam:100,infected:false,down:false,money:60,level:0,kills:0,killsLvl:0,
    weapons:['arco','tubo'],cur:0,ammo:{flecha:50,b9mm:0,cart:0,rifle:0},mag:{},items:{pan:1,venda:1},
    inCar:null,fireCd:0,reloading:0,meleeT:0,hitFlash:0,walkT:0,spot:spot,cam:cam,gun:null,human:h,hud:buildHUD(i)};
}
function equipWeapon(p,id){
  p.cur=p.weapons.indexOf(id);
  if(p.gun)p.human.ra.remove(p.gun);
  p.gun=gunMesh(id); p.gun.position.set(0,-.55,0); p.human.ra.add(p.gun);
  p.human.la.rotation.x=-1.15; p.human.ra.rotation.x=-1.35;
}

/* ================= INTERACCIÓN ================= */
function giveItem(p,id,q){
  q=q||1; var it=ITEMS[id]; if(!it)return;
  if(it.ammo){p.ammo[it.ammo]+=it.q*q;toast('+ '+it.n,'good');}
  else{p.items[id]=(p.items[id]||0)+q;toast('+ '+it.i+' '+it.n,'good');}
  if(window.sfx)sfx.pickup();
}
window.giveItem=giveItem;
function giveItemSilent(p,id){
  var it=ITEMS[id]; if(!it)return;
  if(it.ammo)p.ammo[it.ammo]+=it.q; else p.items[id]=(p.items[id]||0)+1;
}
function lootRoll(p,table,n){
  var got=[];
  for(var i=0;i<n;i++){
    var r=pick(table)[0];
    if(r==='money'){var m=irand(12,45);p.money+=m;got.push('$'+m);}
    else if(r!=='none'){giveItemSilent(p,r);got.push(ITEMS[r].n);}
  }
  if(got.length)toast('Saqueado: '+got.join(' · '),'good');
  if(window.sfx)sfx.pickup();
}
function quickEat(p){
  for(var i=0;i<FOOD_ORDER.length;i++){
    var id=FOOD_ORDER[i];
    if((p.items[id]||0)>0){p.items[id]--;var it=ITEMS[id];p.hunger=Math.min(100,p.hunger+it.food);if(window.sfx)sfx.eat();toast(it.i+' '+it.n,'good');return;}
  }
  toast('No tienes comida','bad');
}
function quickHeal(p){
  if(p.infected&&(p.items.antib||0)>0){p.items.antib--;p.infected=false;if(window.sfx)sfx.heal();return;}
  if((p.items.venda||0)>0){p.items.venda--;p.hp=Math.min(100,p.hp+18);if(window.sfx)sfx.heal();return;}
  if((p.items.medkit||0)>0){p.items.medkit--;p.hp=Math.min(100,p.hp+60);if(window.sfx)sfx.heal();return;}
  toast('Sin suministros','bad');
}
function interactTarget(p){
  if(window.DialogueSystem&&window.NPCSystem&&DialogueSystem.tryTalk(p,NPCSystem.getAll()))return;
  if(window.LomaSystem&&window.lomaPos){
    var ld=Math.hypot(p.pos.x-window.lomaPos.x,p.pos.z-window.lomaPos.z);
    if(ld<20&&!LomaSystem.isActive()){ if(LomaSystem.startClimb(p,day))return; }
  }
  if(window.BaseSystem&&BaseSystem.tryInteract(p))return;
  if(window.Buildings&&Buildings.tryEnter(p,scene)){window.setState('INV');return;}
  if(window.NPCSystem&&NPCSystem.tryRecruit(p,NPCSystem.getAll(),scene))return;
  if(window.Missions){
    var all=Missions.getAll();
    for(var i=0;i<all.length;i++){
      var m=all[i];
      if(m.status==='available'&&Math.hypot(m.x-p.pos.x,m.z-p.pos.z)<3){Missions.acceptMission(m.id);return;}
    }
  }
  if(p.inCar){exitCar(p);return;}
  var bc=null,bd=3.6;
  for(var c=0;c<cars.length;c++){
    var cc=cars[c]; var dd=Math.hypot(cc.x-p.pos.x,cc.z-p.pos.z);
    if(dd<bd){bd=dd;bc=cc;}
  }
  if(bc){
    if(p.level<bc.req){toast('Necesitas NIVEL '+bc.req,'bad');return;}
    if(!bc.searched){bc.searched=true;lootRoll(p,CT,irand(1,2));return;}
    enterCar(p,bc);return;
  }
  if(window.shopPos&&p.pos.distanceTo(window.shopPos)<4){openShop(p);return;}
}
function enterCar(p,c){p.inCar=c;c.driver=p;p.human.g.visible=false;if(window.Achievements)Achievements.addStat('carsDriven',1);}
function exitCar(p){
  var c=p.inCar; if(!c)return;
  p.human.g.visible=!p.down; p.inCar=null; c.driver=null; p.yaw=c.a;
}

/* ================= MINIMAPA ================= */
function buildMapCanvas(){
  var c=document.createElement('canvas'); c.width=c.height=512;
  var g=c.getContext('2d');
  MAPS=512/(MAPHALF*2);
  var mx=function(x){return (x+MAPHALF)*MAPS;};
  g.fillStyle='#060a12'; g.fillRect(0,0,512,512);
  g.fillStyle='#141c2a';
  for(var i=0;i<=W.n;i++){var r=mx(roadC(i)),w=W.R*MAPS;g.fillRect(r-w/2,0,w,512);g.fillRect(0,r-w/2,512,w);}
  g.fillStyle='#232e42';
  for(var a=0;a<W.n;a++)for(var j=0;j<W.n;j++)g.fillRect(mx(blockC(a)-13),mx(blockC(j)-13),26*MAPS,26*MAPS);
  g.fillStyle='#2e5a2e'; g.fillRect(mx(blockC(3)-13),mx(blockC(3)-13),26*MAPS,26*MAPS);
  MAPC=c;
}
function reveal(p){
  var f=p.hud.fogctx,x=(p.pos.x+MAPHALF)*MAPS,y=(p.pos.z+MAPHALF)*MAPS,r=30*MAPS;
  f.globalCompositeOperation='destination-out';
  var gr=f.createRadialGradient(x,y,r*.4,x,y,r);
  gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)');
  f.fillStyle=gr; f.beginPath(); f.arc(x,y,r,0,TAU); f.fill();
  f.globalCompositeOperation='source-over';
}
function drawMini(p){
  var c=p.hud.mmctx,S=180;
  c.save(); c.fillStyle='#04060b'; c.fillRect(0,0,S,S);
  var ox=S/2-(p.pos.x+MAPHALF)*MAPS,oy=S/2-(p.pos.z+MAPHALF)*MAPS;
  if(MAPC)c.drawImage(MAPC,ox,oy);
  c.drawImage(p.hud.fog,ox,oy);
  var px=function(w){return S/2+w*MAPS;};
  for(var i=0;i<zombies.length;i++){
    var z=zombies[i];
    if(z.dead||Math.hypot(z.x-p.pos.x,z.z-p.pos.z)>60)continue;
    c.fillStyle='#ff4a3d'; c.fillRect(px(z.x)-1.5,px(z.z)-1.5,3,3);
  }
  c.translate(S/2,S/2); c.rotate(p.inCar?-p.inCar.a:-(p.facing));
  c.fillStyle='#fff'; c.beginPath(); c.moveTo(0,-6); c.lineTo(4.5,5); c.lineTo(-4.5,5); c.closePath(); c.fill();
  c.restore();
}

/* ================= UI GLOBAL ================= */
function toast(txt,cls){
  var d=document.createElement('div'); d.className='toast '+(cls||''); d.textContent=txt;
  var c=document.getElementById('toasts');
  if(c){c.appendChild(d);while(c.children.length>5)c.firstChild.remove();}
  setTimeout(function(){d.remove();},3800);
}
window.toast=toast;
function announce(t,s){
  var at=document.getElementById('ann-t'),as=document.getElementById('ann-s'),a=document.getElementById('announce');
  if(!at||!a)return;
  at.textContent=t; as.textContent=s||'';
  a.classList.remove('hidden','pop'); void a.offsetWidth; a.classList.add('pop');
  setTimeout(function(){a.classList.add('hidden');},2600);
}
window.announce=announce;
window.G={
  ui:{show:function(id){var e=document.getElementById(id);if(e)e.classList.remove('hidden');},
      hide:function(id){var e=document.getElementById(id);if(e)e.classList.add('hidden');}},
  closePanels:function(){closePanels();},
  closeSkills:function(){G.ui.hide('skills-panel');state='PLAY';},
  closeRadio:function(){if(window.RadioSystem)RadioSystem.turnOff();G.ui.hide('radio-menu');state='PLAY';},
  closeBase:function(){G.ui.hide('base-menu');state='PLAY';}
};
window.setState=function(s){state=s;};
window.getGameState=function(){return state;};
window.getPlayers=function(){return players;};
function closePanels(){
  G.ui.hide('shop');G.ui.hide('inv');G.ui.hide('bigmap');G.ui.hide('missions');
  var cp=document.getElementById('crafting-panel'); if(cp)cp.style.display='none';
  if(state!=='PLAY')state='PLAY';
}
window.closePanels=closePanels;
function openShop(p){
  state='SHOP'; G.ui.show('shop');
  if(window.sfx)sfx.click();
  var list=document.getElementById('shopList'); list.innerHTML='';
  document.getElementById('shopMoney').textContent='$ '+p.money;
  for(var i=0;i<SHOP.length;i++){
    var id=SHOP[i][0],pr=SHOP[i][1],it=ITEMS[id];
    var r=document.createElement('div'); r.className='row';
    r.innerHTML='<div class="ic">'+it.i+'</div><div class="nm">'+it.n+'</div><div class="ct">$'+pr+'</div>';
    var b=document.createElement('button'); b.className='buy'; b.textContent='COMPRAR'; b.disabled=p.money<pr;
    b.onclick=(function(pid,ppr){return function(){if(p.money<ppr)return;p.money-=ppr;giveItem(p,pid);openShop(p);};})(id,pr);
    r.appendChild(b); list.appendChild(r);
  }
}
function openInv(p){
  state='INV'; G.ui.show('inv');
  if(window.sfx)sfx.click();
  document.getElementById('invMoney').textContent='$ '+p.money;
  document.getElementById('invLvl').textContent='NV '+p.level;
  document.getElementById('invXp').style.width=(p.killsLvl/need(p.level)*100)+'%';
  document.getElementById('invKills').textContent='☠ '+p.kills+' · FALTAN: '+(need(p.level)-p.killsLvl);
  var list=document.getElementById('invList'); list.innerHTML='';
  var cons=['pan','croqueta','refresco','cafe','venda','medkit','antib','fuel','molotov','armor','chatarra','madera'];
  for(var i=0;i<cons.length;i++){
    var id=cons[i],it=ITEMS[id],n=p.items[id]||0;
    if(!n)continue;
    var r=document.createElement('div'); r.className='row';
    r.innerHTML='<div class="ic">'+it.i+'</div><div class="nm">'+it.n+'</div><div class="ct">×'+n+'</div>';
    var b=document.createElement('button'); b.className='buy'; b.textContent='USAR';
    b.onclick=(function(pid){return function(){useItem(p,pid);openInv(p);};})(id);
    r.appendChild(b); list.appendChild(r);
  }
}
function useItem(p,id){
  var it=ITEMS[id]; if((p.items[id]||0)<=0)return;
  if(it.food){p.items[id]--;p.hunger=Math.min(100,p.hunger+it.food);if(window.sfx)sfx.eat();return;}
  if(it.heal){p.items[id]--;p.hp=Math.min(100,p.hp+it.heal);if(window.sfx)sfx.heal();return;}
  if(it.cure){p.items[id]--;p.infected=false;if(window.sfx)sfx.heal();return;}
}

/* ================= ENTRADA ================= */
if(window.Controls){
  Controls.on('keydown',function(code){
    if(window.AudioSystem)AudioSystem.resume();
    if(state==='MENU')return;
    if(state==='PLAY'){
      if(code==='KeyE')interactTarget(players[0]);
      if(code==='KeyR')startReload(players[0]);
      if(code==='KeyQ')quickEat(players[0]);
      if(code==='KeyF')quickHeal(players[0]);
      if(code==='Tab')openInv(players[0]);
      if(code==='KeyJ'&&window.openMissions)window.openMissions();
      if(code==='KeyC'&&window.Crafting)Crafting.openCraftingUI(players[0]);
      if(code==='KeyK'&&window.Progression)Progression.openPanel();
      if(code==='KeyO'&&window.RadioSystem)RadioSystem.openMenu();
      if(code==='KeyB'&&window.BaseSystem)BaseSystem.openMenu(players[0]);
      if(code==='KeyM'){state='MAP';G.ui.show('bigmap');}
      for(var i=1;i<=6;i++)if(code==='Digit'+i&&players[0].weapons[i-1])equipWeapon(players[0],players[0].weapons[i-1]);
      if(code==='Escape')pauseGame();
    }else if(state==='PAUSE'){ if(code==='Escape')resumeGame(); }
    else if(state==='SHOP'||state==='INV'||state==='MAP'){ if(code==='Escape'||code==='Tab')closePanels(); }
  });
}
addEventListener('mousedown',function(e){
  if(window.AudioSystem)AudioSystem.resume();
  if(state==='PLAY'&&document.pointerLockElement&&e.button===0)fireWeapon(players[0]);
});
addEventListener('mousemove',function(e){
  if(state!=='PLAY'||!document.pointerLockElement)return;
  var p=players[0];
  var mx=isFinite(e.movementX)?e.movementX:0, my=isFinite(e.movementY)?e.movementY:0;
  p.camYaw-=mx*.0026;
  p.camPitch=clamp(p.camPitch+my*.0022,.08,1.05);
});
document.addEventListener('pointerlockchange',function(){
  if(!document.pointerLockElement&&state==='PLAY')pauseGame();
});
renderer.domElement.addEventListener('click',function(){
  if(window.AudioSystem)AudioSystem.resume();
  if(state==='PLAY'&&!document.pointerLockElement&&document.hasFocus()){
    try{renderer.domElement.requestPointerLock();}catch(e){}
  }
});
addEventListener('resize',function(){
  renderer.setSize(innerWidth,innerHeight);
  var w=mode===2?innerWidth/2:innerWidth;
  for(var i=0;i<players.length;i++){players[i].cam.aspect=w/innerHeight;players[i].cam.updateProjectionMatrix();}
  ambCam.aspect=innerWidth/innerHeight; ambCam.updateProjectionMatrix();
});
function pauseGame(){ if(state!=='PLAY')return; state='PAUSE'; if(document.exitPointerLock)document.exitPointerLock(); G.ui.show('pause'); }
function resumeGame(){ G.ui.hide('pause'); state='PLAY'; if(document.hasFocus()){try{renderer.domElement.requestPointerLock();}catch(e){}} }
var menuBtns=Array.prototype.slice.call(document.querySelectorAll('.mi'));
for(var mbi=0;mbi<menuBtns.length;mbi++){
  (function(b){
    b.onclick=function(){ if(window.AudioSystem)AudioSystem.resume();
      if(b.dataset.a==='solo')startGame(1);
      else if(b.dataset.a==='duo')startGame(2);
      else if(b.dataset.a==='how')G.ui.show('howto');
    };
  })(menuBtns[mbi]);
}
document.getElementById('btnResume').onclick=resumeGame;
document.getElementById('btnRestart').onclick=function(){startGame(mode);};
document.getElementById('btnMenu').onclick=function(){toMenu();};
document.getElementById('btnRetry').onclick=function(){startGame(mode);};
document.getElementById('btnMenu2').onclick=function(){toMenu();};

/* ================= DÍA/NOCHE ================= */
function isNight(){return hour<6||hour>=19;}
function daylight(){return clamp(Math.sin((hour-6)/12*Math.PI)*1.3,0,1);}
function updateDayCycle(dt){
  dayT+=dt/240;
  if(dayT>=1){dayT-=1;day++;announce('DÍA '+day,'SIGUES VIVO');}
  hour=dayT*24;
  var dl=daylight();
  var sunA=(hour-6)/12*Math.PI;
  sun.position.set(Math.cos(sunA)*90,Math.max(6,Math.sin(sunA)*90),34);
  sun.intensity=.15+.85*dl;
  hemi.intensity=.22+.55*dl;
  for(var i=0;i<sideMats.length;i++)sideMats[i].emissiveIntensity=(1-dl)*.95;
  for(var j=0;j<parkLights.length;j++)parkLights[j].intensity=(1-dl)*1.1;
  prevHour=hour;
  if(window.starsMesh)window.starsMesh.material.opacity=clamp((1-dl)*.8,0,.8);
  return dl;
}

/* ================= UPDATE ================= */
function updatePlayer(p,dt,dl){
  var h=p.hud;
  if(p.down){p.hp=0;return;}
  var p1=p.idx===0;
  p.fireCd-=dt;
  if(p.meleeT>0)p.meleeT-=dt;
  if(p.reloading>0){p.reloading-=dt;if(p.reloading<=0)finishReload(p);}
  var hm=window.Progression?Progression.hungerMul():1;
  p.hunger=Math.max(0,p.hunger-dt*.24*hm);
  p.stam=Math.min(100+(window.Progression?Progression.staminaBonus():0),p.stam+12*dt);
  if(p.hunger<=0)p.hp-=2*dt;
  if(p.infected)p.hp-=1.5*dt;
  if(p.hp<=0){downPlayer(p);return;}
  if(p.inCar){updateDriving(p,dt,dl);return;}
  var mv;
  if(p1&&window.Controls){
    var input=Controls.getFootMovement(p.yaw,dt);
    if(input.rotation!==0){p.yaw=Controls.applyRotation(p.yaw,input.rotation,dt);p.facing=p.yaw;}
    mv=Controls.getWorldMovement(p.yaw,input.forward,input.strafe);
    var sprint=Controls.isDown('ShiftLeft')&&input.forward>0&&p.stam>2;
    if(mv.moving){
      var sp=sprint?9.2:6.2;
      tryMove(p.pos,mv.x*sp*dt,mv.z*sp*dt,.45);
      if(input.forward!==0)p.facing=mv.facing;
      p.walkT+=dt*(sprint?13:9);
      if(sprint)p.stam=Math.max(0,p.stam-20*dt);
      if(window.sfx&&sfx.footstep)sfx.footstep('asphalt',sprint);
    }else p.walkT*=.9;
    if(Controls.onMouseDown())fireWeapon(p);
  }else{
    var f=(isDown('ArrowUp')?1:0)-(isDown('ArrowDown')?1:0);
    mv=Controls.getWorldMovement(p.yaw,f,0);
    if(isDown('ArrowLeft'))p.yaw+=2.5*dt;
    if(isDown('ArrowRight'))p.yaw-=2.5*dt;
    p.facing=p.yaw;
    if(mv.moving){tryMove(p.pos,mv.x*6.2*dt,mv.z*6.2*dt,.45);p.walkT+=dt*9;}
    else p.walkT*=.9;
  }
  var cy=p1?p.camYaw:lerpAng(p.camYaw,p.yaw,1-Math.pow(.002,dt));
  var cd=6.4,cp=p1?p.camPitch:.42;
  p.cam.position.set(p.pos.x-Math.sin(cy)*Math.cos(cp)*cd,1.6+Math.sin(cp)*cd+1,p.pos.z-Math.cos(cy)*Math.cos(cp)*cd);
  if(p.cam.position.y<1)p.cam.position.y=1;
  p.cam.lookAt(p.pos.x,1.6,p.pos.z);
  var sw=Math.sin(p.walkT)*.55;
  p.human.ll.rotation.x=sw; p.human.rl.rotation.x=-sw;
  p.human.g.position.copy(p.pos);
  p.human.g.rotation.y=p.facing;
  p.spot.intensity=(1-dl)*1.15;
  p.spot.position.set(p.pos.x,3,p.pos.z);
  p.spot.target.position.set(p.pos.x+Math.sin(cy)*8,0,p.pos.z+Math.cos(cy)*8);
}
function updateDriving(p,dt,dl){
  var c=p.inCar,max=c.type==='jeep'?15:17,p1=p.idx===0;
  var f=p1?((Controls.isDown('KeyW')?1:0)-(Controls.isDown('KeyS')?1:0)):0;
  var s=p1?((Controls.isDown('KeyD')?1:0)-(Controls.isDown('KeyA')?1:0)):0;
  c.speed+=f*(f>0?13:9)*dt;
  if(!f)c.speed-=c.speed*1.4*dt;
  c.speed=clamp(c.speed,-6,max);
  if(Math.abs(c.speed)>.4)c.a-=s*dt*1.7*Math.sign(c.speed)*clamp(Math.abs(c.speed)/8,.35,1);
  var nx=c.x+Math.sin(c.a)*c.speed*dt,nz=c.z+Math.cos(c.a)*c.speed*dt;
  if(!inSolid(nx,nz,1.5)){c.x=nx;c.z=nz;}else c.speed*=-.25;
  c.fuel=Math.max(0,c.fuel-Math.abs(c.speed)*.05*dt);
  c.g.position.set(c.x,0,c.z); c.g.rotation.y=c.a;
  p.pos.set(c.x,0,c.z); p.facing=c.a;
  var cy=lerpAng(p.camYaw,c.a,1-Math.pow(.004,dt)); p.camYaw=cy;
  p.cam.position.set(c.x-Math.sin(cy)*9.5,4.6,c.z-Math.cos(cy)*9.5);
  p.cam.lookAt(c.x,1.4,c.z);
}
function updateZombies(dt){
  var night=isNight();
  var maxLevel=0; for(var pl=0;pl<players.length;pl++)if(players[pl].level>maxLevel)maxLevel=players[pl].level;
  var cap=Math.min(46,(18+maxLevel*3)*(night?1.5:1));
  zSpawnT-=dt;
  if(zSpawnT<=0&&players.length>0){
    zSpawnT=night?1.4:3.0;
    if(zombies.length<cap){
      var alive=[]; for(var a=0;a<players.length;a++)if(!players[a].down)alive.push(players[a]);
      if(alive.length){var pp=pick(alive);var s=freeSpot(pp.pos.x,pp.pos.z,42,75);if(s)spawnZombie(s.x,s.z,false);}
    }
  }
  groanT-=dt;
  if(groanT<=0){
    groanT=rand(3,7);
    if(zombies.length&&players.length&&window.AudioSystem&&AudioSystem.zombieGroan3D){
      var near=null,nd=1e9;
      for(var g=0;g<zombies.length;g++){var zz=zombies[g];if(zz.dead)continue;var dd=Math.hypot(zz.x-players[0].pos.x,zz.z-players[0].pos.z);if(dd<nd){nd=dd;near=zz;}}
      if(near&&nd<30)AudioSystem.zombieGroan3D(near.x,1.5,near.z,1-nd/30);
    }
  }
  for(var ni=noises.length-1;ni>=0;ni--){noises[ni].t-=dt;if(noises[ni].t<=0)noises.splice(ni,1);}
  var speedMul=window.Weather?Weather.getZombieSpeedMul():1;
  for(var i=zombies.length-1;i>=0;i--){
    var z=zombies[i];
    if(z.dead){
      z.dieT+=dt;
      z.model.group.rotation.x=-Math.min(1,z.dieT*2.2)*Math.PI/2;
      if(z.dieT>6){scene.remove(z.model.group);zombies.splice(i,1);}
      continue;
    }
    z.atkCd-=dt; if(z.aggro>0)z.aggro-=dt;
    var tgt=null,td=1e9;
    for(var j=0;j<players.length;j++){var pj=players[j];if(pj.down)continue;var dj=Math.hypot(pj.pos.x-z.x,pj.pos.z-z.z);if(dj<td){td=dj;tgt=pj;}}
    var aggroR=z.aggroRange||(night?30:15);
    var sp=0;
    if(tgt&&(td<aggroR||z.aggro>0)){
      var dx=tgt.pos.x-z.x,dz=tgt.pos.z-z.z,d=Math.hypot(dx,dz)||1;
      sp=Math.min(5.2,(z.speed||3.3))*speedMul;
      tryMove(z,dx/d*sp*dt,dz/d*sp*dt,.45);
      z.yaw=Math.atan2(dx,dz);
      if(d<1.6&&z.atkCd<=0){z.atkCd=.9;hurtPlayer(tgt,(z.zdmg||irand(7,13)),z.x,z.z);}
    }else{
      z.wt-=dt;
      if(z.wt<=0){z.wt=rand(2,5);var s2=freeSpot(z.x,z.z,1,9);if(s2){z.tx=s2.x;z.tz=s2.z;}}
      var dx2=z.tx-z.x,dz2=z.tz-z.z,d2=Math.hypot(dx2,dz2);
      if(d2>1){sp=(z.speed||1.5)*speedMul;tryMove(z,dx2/d2*sp*dt,dz2/d2*sp*dt,.45);z.yaw=Math.atan2(dx2,dz2);}
    }
    z.ph+=dt*(sp>0?sp*2.6:2);
    if(z.model.isGLB&&z.model.mixer)z.model.mixer.update(dt);
    z.model.group.position.set(z.x,z.model.group.position.y,z.z);
    z.model.group.rotation.y=z.yaw;
    if(!z.model.isGLB&&z.model.human){
      z.model.human.ll.rotation.x=Math.sin(z.ph)*.5;
      z.model.human.rl.rotation.x=-Math.sin(z.ph)*.5;
    }
    var show=z.hp<z.maxhp;
    z.bar.grp.visible=show;
    if(show)z.bar.fg.scale.x=.95*clamp(z.hp/z.maxhp,0,1);
  }
}
function updateWorldFx(dt){
  for(var i=tracers.length-1;i>=0;i--){var t=tracers[i];t.t-=dt;if(t.t<=0){scene.remove(t.l);tracers.splice(i,1);}}
  for(var b=bloods.length-1;b>=0;b--){var bl=bloods[b];bl.t-=dt;if(bl.t<=0){scene.remove(bl.m);bloods.splice(b,1);}}
  for(var c=crates.length-1;c>=0;c--){
    var cr=crates[c]; cr.m.rotation.y+=dt*2;
    for(var j=0;j<players.length;j++){
      var p=players[j];
      if(!p.down&&Math.hypot(p.pos.x-cr.x,p.pos.z-cr.z)<1.3){lootRoll(p,ZT,irand(1,2));scene.remove(cr.m);crates.splice(c,1);break;}
    }
  }
  flashL.intensity=Math.max(0,flashL.intensity-dt*16);
}
function updateHUD(p,dl){
  var h=p.hud;
  h.clockD.textContent='DÍA '+day;
  var hh=String(Math.floor(hour)),mm=String(Math.floor((hour%1)*60));
  if(hh.length<2)hh='0'+hh; if(mm.length<2)mm='0'+mm;
  h.clockH.textContent=(isNight()?'🌙 ':'☀ ')+hh+':'+mm;
  h.lvl.textContent='NV '+p.level;
  h.xp.style.width=(p.killsLvl/need(p.level)*100)+'%';
  h.kills.textContent='☠ '+p.kills+' · FALTAN: '+(need(p.level)-p.killsLvl);
  h.hp.style.transform='scaleX('+(p.hp/100)+')';
  h.hun.style.transform='scaleX('+(p.hunger/100)+')';
  h.sta.style.transform='scaleX('+(p.stam/100)+')';
  var w=WEAPONS[p.weapons[p.cur]];
  h.wname.textContent=w.icon+' '+w.name.toUpperCase();
  if(w.type==='gun'){h.ammo.textContent=(p.mag[p.weapons[p.cur]]||0);h.ammoR.textContent='/'+p.ammo[w.ammo];}
  else if(w.type==='bow'){h.ammo.textContent=(p.ammo.flecha||0);h.ammoR.textContent=' 🏹';}
  else{h.ammo.textContent='∞';h.ammoR.textContent='';}
  h.money.textContent='$ '+p.money;
  h.down.classList.toggle('hidden',!p.down);
  reveal(p); drawMini(p);
}

/* ================= RENDER ================= */
function render(){
  if(state==='MENU'||state==='INTRO'||players.length===0){
    renderer.setViewport(0,0,innerWidth,innerHeight);
    renderer.setScissorTest(false);
    renderer.render(scene,ambCam);
    return;
  }
  renderer.setScissorTest(true);
  for(var i=0;i<players.length;i++){
    var p=players[i];
    var w=mode===2?Math.floor(innerWidth/2):innerWidth;
    var x=i*w;
    renderer.setViewport(x,0,w,innerHeight);
    renderer.setScissor(x,0,w,innerHeight);
    renderer.render(scene,p.cam);
  }
}

/* ================= SAVE STATE ================= */
function getGameState(){
  var playersData=[];
  if(players&&players.length>0){
    for(var i=0;i<players.length;i++){
      var p=players[i];
      playersData.push({idx:p.idx,pos:{x:p.pos.x,z:p.pos.z},yaw:p.yaw,hp:p.hp,hunger:p.hunger,stam:p.stam,infected:p.infected,money:p.money,level:p.level,kills:p.kills,killsLvl:p.killsLvl,weapons:p.weapons,cur:p.cur,ammo:p.ammo,mag:p.mag,items:p.items});
    }
  }
  return {mode:mode,day:day,dayT:dayT,hour:hour,players:playersData};
}

/* ================= LOOP ================= */
var lastT=performance.now();
function loop(){
  requestAnimationFrame(loop);
  var now=performance.now();
  var dt=Math.min(.05,(now-lastT)/1000);
  lastT=now; gameRunningTime+=dt;
  if(state==='MENU'||state==='INTRO'){
    camMenuA+=dt*.08;
    ambCam.position.set(blockC(3)+Math.sin(camMenuA)*46,20+Math.sin(camMenuA*.5)*5,blockC(3)+Math.cos(camMenuA)*46);
    ambCam.lookAt(blockC(3),3,blockC(3));
    updateDayCycle(dt);
    updateWorldFx(dt);
    if(window.CityFX)CityFX.update(dt,daylight(),isNight(),null);
    if(window.AudioSystem)AudioSystem.updateMusic(dt);
  }else if(state==='PLAY'){
    var dl=updateDayCycle(dt);
    for(var i=0;i<players.length;i++)updatePlayer(players[i],dt,dl);
    updateZombies(dt);
    updateArrows(dt);
    updateWorldFx(dt);
    if(players[0])updateAimTrajectory(players[0]);
    if(players[0]){
      var p0=players[0];
      if(window.AudioSystem){
        AudioSystem.setListener(p0.pos.x,p0.pos.y,p0.pos.z,Math.sin(p0.camYaw),Math.cos(p0.camYaw));
        AudioSystem.updateMusic(dt);
      }
      if(window.NoiseSystem)NoiseSystem.update(dt,p0.pos,zombies);
      if(window.HordeSystem)HordeSystem.update(dt,day,isNight(),p0.pos,spawnHordeZombie);
      if(window.RadioSystem)RadioSystem.update(dt);
      if(window.BaseSystem)BaseSystem.update(dt,zombies,p0);
      if(window.LomaSystem)LomaSystem.update(dt,p0,day);
      if(window.CityFX)CityFX.update(dt,dl,isNight(),p0.pos);
      if(window.Achievements&&window.NPCSystem)Achievements.setStat('npcsRecruited',NPCSystem.recruitedCount());
      if(window.NpcBrain&&window.NPCSystem)NpcBrain.update(dt,{isNight:isNight(),inCombat:false,justLearned:false});
    }
    if(window.NPCSystem)NPCSystem.update(dt,players,zombies,players[0]?players[0].pos:null);
    if(window.Weather)Weather.update(dt,scene,players[0]?players[0].pos:{x:0,z:0});
    if(window.Buildings)Buildings.update(dt);
    if(window.WeatherFX)WeatherFX.update(dt);
    if(window.Bosses){
      Bosses.update(dt,players,zombies);
      var ml=0; for(var b=0;b<players.length;b++)if(players[b].level>ml)ml=players[b].level;
      if(Bosses.shouldSpawnBoss(ml)&&players[0])Bosses.spawnBoss(players[0].pos,scene);
    }
    for(var h=0;h<players.length;h++)updateHUD(players[h],dl);
    if(window.SaveSystem)SaveSystem.tickAutoSave(getGameState(),gameRunningTime);
  }
  render();
}

/* ================= CICLO DE JUEGO ================= */
function startGame(m,saveData){
  if(window.AudioSystem)AudioSystem.resume();
  mode=m;
  var i;
  for(i=0;i<zombies.length;i++)scene.remove(zombies[i].model.group);
  zombies=[];
  for(i=0;i<crates.length;i++)scene.remove(crates[i].m); crates=[];
  for(i=0;i<bloods.length;i++)scene.remove(bloods[i].m); bloods=[];
  for(i=0;i<arrows.length;i++)scene.remove(arrows[i].mesh); arrows=[];
  for(i=0;i<stuckArrows.length;i++)scene.remove(stuckArrows[i].mesh); stuckArrows=[];
  for(i=0;i<players.length;i++){scene.remove(players[i].human.g);scene.remove(players[i].spot);scene.remove(players[i].spot.target);}
  players=[];
  document.getElementById('hudroot').innerHTML='';
  if(window.Achievements)Achievements.init();
  if(window.NpcBrain)NpcBrain.clear();
  for(i=0;i<m;i++){var p=newPlayer(i);players.push(p);equipWeapon(p,'arco');}
  var w=mode===2?innerWidth/2:innerWidth;
  for(i=0;i<players.length;i++){players[i].cam.aspect=w/innerHeight;players[i].cam.updateProjectionMatrix();}
  if(saveData){
    day=saveData.day; dayT=saveData.dayT; hour=saveData.hour;
    for(i=0;i<saveData.players.length;i++){
      var sp=saveData.players[i]; if(!players[i])continue;
      var p2=players[i];
      p2.pos.set(sp.pos.x,0,sp.pos.z); p2.yaw=sp.yaw; p2.camYaw=sp.yaw;
      p2.hp=sp.hp; p2.level=sp.level; p2.kills=sp.kills; p2.killsLvl=sp.killsLvl;
      p2.weapons=sp.weapons; p2.ammo=sp.ammo; p2.items=sp.items;
      p2.human.g.position.copy(p2.pos);
      equipWeapon(p2,p2.weapons[p2.cur]);
    }
    toast('Partida cargada','good');
  }else{
    dayT=.5; day=1; hour=12; prevHour=12; zSpawnT=2;
    for(i=0;i<8;i++){var s=freeSpot(players[0].pos.x,players[0].pos.z,25,70);if(s)spawnZombie(s.x,s.z,false);}
    if(window.NPCSystem){for(i=0;i<4;i++){var s2=freeSpot(blockC(3),blockC(3),30,80);if(s2)NPCSystem.createNPC(s2.x,s2.z,scene);}}
    if(window.Missions)Missions.generateInitialMissions({x:0,z:0},W.size);
    if(window.BaseSystem)BaseSystem.reset();
    if(window.LomaSystem)LomaSystem.reset();
    announce('DÍA 1','HOLGUÍN · SOBREVIVE');
  }
  document.getElementById('menu').classList.add('hidden');
  G.ui.hide('howto');G.ui.hide('pause');G.ui.hide('shop');G.ui.hide('inv');G.ui.hide('bigmap');G.ui.hide('missions');G.ui.hide('over');
  if(window.Weather&&window.Weather.init)Weather.init(scene);
  if(window.Weather&&window.Weather.set)Weather.set('clear');
  state='PLAY';
  setTimeout(function(){toast('🏹 Empiezas con arco y 50 flechas');},1000);
}
function toMenu(){
  state='MENU';
  G.ui.hide('over');G.ui.hide('pause');G.ui.hide('victory');
  document.getElementById('menu').classList.remove('hidden');
  for(var i=0;i<players.length;i++){scene.remove(players[i].human.g);scene.remove(players[i].spot);scene.remove(players[i].spot.target);}
  players=[];
  document.getElementById('hudroot').innerHTML='';
  if(document.exitPointerLock)document.exitPointerLock();
}
function gameOver(){
  state='OVER';
  if(document.exitPointerLock)document.exitPointerLock();
  var tk=0,tl=0,tm=0;
  for(var i=0;i<players.length;i++){tk+=players[i].kills;tl+=players[i].level;tm+=players[i].money;}
  var ovD=document.getElementById('ovD'); if(ovD)ovD.textContent=day;
  var ovK=document.getElementById('ovK'); if(ovK)ovK.textContent=tk;
  var ovL=document.getElementById('ovL'); if(ovL)ovL.textContent=tl;
  var ovM=document.getElementById('ovM'); if(ovM)ovM.textContent='$'+tm;
  if(window.SaveSystem)SaveSystem.deleteSave();
  G.ui.show('over');
}

/* ================= ARRANQUE ================= */
/* ★ Usa la ciudad REAL si CityBuilder existe, si no, la interna */
if(window.CityBuilder && window.CityBuilder.buildAll){
  window.CityBuilder.buildAll();
}else{
  buildCity();
}
buildMapCanvas();
createAimHelpers();
if(window.CityFX)CityFX.init(scene,renderer,cars);
if(window.NoiseSystem)NoiseSystem.init();
if(window.HordeSystem)HordeSystem.init();
if(window.RadioSystem)RadioSystem.init();
if(window.Progression)Progression.init();
if(window.ZombiesX)ZombiesX.init();
if(window.BaseSystem)BaseSystem.init(scene);
if(window.LomaSystem)LomaSystem.init(scene);
if(window.NpcBrain)NpcBrain.init();
if(window.NpcChat)NpcChat.init();
if(window.Intro)Intro.init();
if(window.Achievements)Achievements.init();
if(window.WeatherFX)WeatherFX.init();
if(window.DamageDir)DamageDir.init();
loop();
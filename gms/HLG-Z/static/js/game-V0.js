'use strict';
/* ============================================================
   HOLGUÍN DE LOS MUERTOS v3.0 — MOTOR PRINCIPAL COMPLETO
   Integra: arco, tipos zombi, ruido, hordas, radio, skills,
   base, Loma, intro, logros, cerebro NPC, chat, audio 3D
   ============================================================ */

/* ================= UTILIDADES ================= */
const $ = q => document.querySelector(q);
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const rand = (a,b) => a+Math.random()*(b-a);
const irand = (a,b) => Math.floor(rand(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const lerp = (a,b,t) => a+(b-a)*t;
const TAU = Math.PI*2;
function angTo(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
function lerpAng(a,b,t){return a+angTo(a,b)*t;}
function isDown(code){return window.Controls && Controls.isDown(code);}
window.pick = pick;

/* ================= DATOS ================= */
window.WEAPONS = {
  arco:    { name:'Arco de caza',    icon:'🏹', type:'bow',   dmg:35, rate:.7,  range:60, ammo:'flecha', sfx:'bow', noise:4 },
  tubo:    { name:'Tubo de hierro',  icon:'🔧', type:'melee', dmg:22, rate:.5,  range:2.5, arc:1.3, noise:8 },
  machete: { name:'Machete',         icon:'🔪', type:'melee', dmg:50, rate:.42, range:2.7, arc:1.5, noise:8 },
  pistola: { name:'Pistola 9mm',     icon:'🔫', type:'gun',   dmg:26, rate:.3,  range:70, mag:12, ammo:'b9mm',  spread:.025, sfx:'pistol', noise:35 },
  escopeta:{ name:'Escopeta',        icon:'💥', type:'gun',   dmg:12, pellets:6, rate:.95, range:26, mag:6, ammo:'cart', spread:.13, sfx:'shotgun', noise:55 },
  ak:      { name:'AK-47',           icon:'🪖', type:'gun',   dmg:19, rate:.13, range:85, mag:30, ammo:'rifle', spread:.045, sfx:'rifle', noise:45 }
};
window.ITEMS = {
  flecha:  { n:'Flechas',              i:'🏹', ammo:'flecha', q:10 },
  croqueta:{ n:'Croquetas',            i:'🍢', food:18 },
  refresco:{ n:'Refresco de malta',    i:'🥤', food:12, stam:20 },
  pan:     { n:'Pan con lechón',       i:'🥪', food:38 },
  cafe:    { n:'Café cubano',          i:'☕', food:8,  stam:48 },
  venda:   { n:'Venda',                i:'🩹', heal:18 },
  medkit:  { n:'Botiquín',             i:'💊', heal:60 },
  antib:   { n:'Antibióticos',         i:'💉', cure:1 },
  fuel:    { n:'Bidón de gasolina',    i:'⛽', fuel:55 },
  b9mm:    { n:'Balas 9mm',            i:'🔸', ammo:'b9mm',  q:12 },
  cart:    { n:'Cartuchos 12',         i:'🔶', ammo:'cart',  q:6 },
  rifle:   { n:'Cargas 7.62',          i:'🔷', ammo:'rifle', q:30 },
  tubo:    { n:'Tubo de hierro',       i:'🔧', craft:1 },
  chatarra:{ n:'Chatarra',             i:'🔩', material:1 },
  madera:  { n:'Madera',               i:'🪵', material:1 },
  molotov: { n:'Molotov',              i:'🔥', throwable:1, dmg:60, radius:6 },
  armor:   { n:'Chaleco protector',    i:'🛡', armor:30 },
  rum:     { n:'Ron añejo',            i:'🥃', trade:1, moral:15 },
  tabaco:  { n:'Tabaco',               i:'🚬', trade:1, moral:10 }
};
window.FOOD_ORDER = ['refresco','croqueta','pan','cafe'];
window.SHOP = [['flecha',20],['croqueta',15],['refresco',12],['pan',40],['cafe',14],
              ['venda',25],['medkit',95],['antib',75],['fuel',60],
              ['b9mm',30],['cart',45],['rifle',80],['chatarra',15],['madera',12]];
window.UNLOCKS = {
  1:{txt:'PISTOLA 9MM', w:'pistola', ammo:{b9mm:24}},
  2:{txt:'ESCOPETA', w:'escopeta', ammo:{cart:12}},
  3:{txt:'MACHETE + CONDUCIR', w:'machete'},
  4:{txt:'AK-47', w:'ak', ammo:{rifle:60}},
  5:{txt:'JEEP + JEFE + BASE'},
  6:{txt:'+8% DAÑO/NIVEL'}
};
window.need = function(l){ return 5*(l+1); };
window.ZT = [['money',45],['b9mm',20],['croqueta',18],['venda',12],['cafe',10],['antib',4],['tubo',4],['chatarra',8],['madera',8]];
window.CT = [['money',30],['fuel',26],['b9mm',18],['pan',16],['medkit',8],['chatarra',10]];

/* ================= THREE ================= */
let renderer, scene, ambCam, hemi, sun, flashL;
const sideMats = [], skyC = new THREE.Color();
try { renderer = new THREE.WebGLRenderer({ antialias:true }); }
catch(e){ document.body.innerHTML = '<h2 style="padding:40px">WebGL no soportado.</h2>'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('view').appendChild(renderer.domElement);
scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x8fb4d9, 90, 260);
ambCam = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 500);
hemi = new THREE.HemisphereLight(0xbfd9ff, 0x3a3f2e, .7); scene.add(hemi);
sun = new THREE.DirectionalLight(0xffe0b0, .9); sun.position.set(60,90,30); scene.add(sun);
flashL = new THREE.PointLight(0xffc36b, 0, 14); scene.add(flashL);
window.scene_global = scene;
window.renderer_global = renderer;

/* ================= MUNDO ================= */
const W = { n:8, B:26, R:12 };
W.size = W.R*(W.n+1)+W.B*W.n;
W.half = W.size/2;
const blockC = i => -W.half+W.R+i*(W.B+W.R)+W.B/2;
const roadC  = i => -W.half+W.R/2+i*(W.B+W.R);
const solids = [], cars = [], signMeshes = [], parkLights = [];
window.cars_global = cars;
window.solids_global = solids;

function floorTexture(){
  const c = document.createElement('canvas'); c.width=c.height=2048;
  const g = c.getContext('2d');
  const S = 2048/W.size, mx = x => (x+W.half)*S;
  g.fillStyle = '#26292f'; g.fillRect(0,0,2048,2048);
  for (let i=0;i<W.n;i++){const x0=mx(-W.half+W.R+i*(W.B+W.R)),w=W.B*S;g.fillStyle='#4a4e55';g.fillRect(x0,0,w,2048);g.fillRect(0,x0,2048,w);}
  for (let i=0;i<W.n;i++)for(let j=0;j<W.n;j++){
    const x0=mx(-W.half+W.R+i*(W.B+W.R)),y0=mx(-W.half+W.R+j*(W.B+W.R)),w=W.B*S;
    g.fillStyle=(i===3&&j===3)?'#3f6b34':(i===4&&j===3)?'#6f6a60':'#3c4046';
    g.fillRect(x0,y0,w,w);
    g.strokeStyle='rgba(255,255,255,.12)';g.strokeRect(x0+1,y0+1,w-2,w-2);
  }
  g.fillStyle='#cfd3d8';
  for(let i=0;i<=W.n;i++){const cx=mx(roadC(i));for(let y=0;y<2048;y+=64)g.fillRect(cx-3,y,6,34);
    const cy=mx(roadC(i));for(let x=0;x<2048;x+=64)g.fillRect(x,cy-3,34,6);}
  return new THREE.CanvasTexture(c);
}
function facadeMats(hex){
  const mk = glow => {
    const c = document.createElement('canvas'); c.width=c.height=128;
    const g = c.getContext('2d');
    g.fillStyle = glow?'#000':hex; g.fillRect(0,0,128,128);
    if(!glow){g.fillStyle='rgba(0,0,0,.16)';for(let y=28;y<128;y+=28)g.fillRect(0,y,128,2);}
    const wc = glow?'#ffd27a':'#1c2733';
    for(let r=0;r<3;r++)for(let q=0;q<4;q++){g.fillStyle=wc;g.fillRect(8+q*31,8+r*29,20,20);}
    if(!glow){g.fillStyle='#131a21';for(let q=0;q<3;q++)g.fillRect(10+q*40,110,26,18);}
    return new THREE.CanvasTexture(c);
  };
  const side = new THREE.MeshLambertMaterial({map:mk(false),emissiveMap:mk(true),emissive:0xffc36b,emissiveIntensity:0});
  sideMats.push(side);
  return side;
}
const PALETTE = ['#d96a4f','#e0a84b','#7fb6a4','#c96a6a','#6fa8c9','#d9c08f','#8fae6e','#c98fb6','#ddd8c8','#b6543c','#5f8fa8','#d98f4b'];
const roofMat = new THREE.MeshLambertMaterial({color:0x3a3f47});
const matCache = {}; PALETTE.forEach(h=>matCache[h]=facadeMats(h));

function addBuildingDetailed(x,z,w,d,h,color){
  const mat = matCache[color];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[mat,mat,roofMat,roofMat,mat,mat]);
  m.position.set(x,h/2,z); scene.add(m);
  solids.push({x1:x-w/2-.2,x2:x+w/2+.2,z1:z-d/2-.2,z2:z+d/2+.2});
  if(h>8 && Math.random()<.6){
    const floors = Math.floor(h/3);
    for(let f=1;f<floors;f++){
      if(Math.random()<.4){
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(w*.6,.15,1),new THREE.MeshLambertMaterial({color:0x3a3a3e}));
        balcony.position.set(x,f*3,z+d/2+.5); scene.add(balcony);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w*.6,.5,.05),new THREE.MeshLambertMaterial({color:0x2a2a2e}));
        rail.position.set(x,f*3+.3,z+d/2+1); scene.add(rail);
      }
    }
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2,2.2,.1),new THREE.MeshLambertMaterial({color:0x2a1a0a}));
  door.position.set(x,1.1,z+d/2+.05); scene.add(door);
}
function addBush(x,z,scale){
  scale = scale||1;
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({color:pick([0x3f6b2a,0x4a7a33,0x356b28])});
  for(let i=0;i<3;i++){
    const s = new THREE.Mesh(new THREE.SphereGeometry(rand(.4,.7)*scale,6,6),mat);
    s.position.set(rand(-.3,.3)*scale,rand(.3,.6)*scale,rand(-.3,.3)*scale);
    g.add(s);
  }
  g.position.set(x,0,z); scene.add(g);
}
function palm(x,z,s){
  const g = new THREE.Group(); s=s||1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14*s,.22*s,4.4*s,5),new THREE.MeshLambertMaterial({color:0x8a6a44}));
  trunk.position.y=2.2*s; trunk.rotation.z=rand(-.09,.09); g.add(trunk);
  const lm = new THREE.MeshLambertMaterial({color:0x3f7a34,side:THREE.DoubleSide});
  for(let i=0;i<7;i++){
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2.6*s,.55*s),lm);
    f.position.y=4.4*s; f.rotation.y=i/7*TAU; f.rotation.x=-.6; f.translateY(1.1*s); g.add(f);
  }
  g.position.set(x,0,z); scene.add(g);
}
function lampWithLight(x,z,hasLight){
  const g = new THREE.Group();
  const pm = new THREE.MeshLambertMaterial({color:0x1a1d22});
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,4.6,6),pm); p.position.y=2.3; g.add(p);
  const a = new THREE.Mesh(new THREE.BoxGeometry(1,.1,.1),pm); a.position.set(.45,4.5,0); g.add(a);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.3,.4,6),new THREE.MeshLambertMaterial({color:0x2a2d32}));
  shade.position.set(.9,4.4,0); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:0xffe6a8}));
  bulb.position.set(.9,4.25,0); g.add(bulb);
  if(hasLight){const light = new THREE.PointLight(0xffe6a8,.5,16,2);light.position.set(.9,4.2,0);g.add(light);}
  g.position.set(x,0,z); scene.add(g);
}
function textSprite(txt,col,size){
  const c = document.createElement('canvas'); c.width=256;c.height=80;
  const g = c.getContext('2d');
  g.fillStyle='rgba(8,14,20,.9)';g.fillRect(0,0,256,80);
  g.strokeStyle=col;g.lineWidth=4;g.strokeRect(3,3,250,74);
  g.fillStyle=col;g.font='bold 30px sans-serif';
  g.textAlign='center';g.textBaseline='middle';g.fillText(txt,128,42);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t}));
  s.scale.set(size||3.4,(size||3.4)*80/256,1); return s;
}
function blob(r){
  return new THREE.Mesh(new THREE.CircleGeometry(r,12),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false}));
}
function buildLomaCruz(){
  const lg = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.ConeGeometry(40,18,24),new THREE.MeshLambertMaterial({color:0x4a5d33}));
  hill.position.y=9; lg.add(hill);
  for(let i=0;i<10;i++){
    const step = new THREE.Mesh(new THREE.BoxGeometry(4,.3,1.5),new THREE.MeshLambertMaterial({color:0x8a8a80}));
    step.position.set(0,i*1.6,40-i*3.5); lg.add(step);
  }
  const crossM = new THREE.MeshLambertMaterial({color:0xe8e4d4});
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.4,14,1.4),crossM); c1.position.y=25; lg.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(7,1.4,1.4),crossM); c2.position.y=28; lg.add(c2);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2,2.5,1,8),new THREE.MeshLambertMaterial({color:0x8a8a80}));
  base.position.y=18.5; lg.add(base);
  const ts = textSprite('⛰️ LOMA DE LA CRUZ — LA SALVACIÓN','#3fe0c8',8); ts.position.y=36; lg.add(ts);
  lg.position.set(0,0,-W.half-45); scene.add(lg);
  window.lomaPos = new THREE.Vector3(0,0,-W.half-45);
}
function makeCarDetailed(x,z,a,col,type,req){
  const g = new THREE.Group();
  const bm = new THREE.MeshLambertMaterial({color:col});
  const jeep = type==='jeep';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2,jeep?.9:.8,4.6),bm); body.position.y=.75; g.add(body);
  const cabMat = jeep?bm:new THREE.MeshLambertMaterial({color:0xdfe6ea});
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7,jeep?.7:.55,jeep?2.8:2),cabMat);
  cab.position.set(0,jeep?1.5:1.35,-.3); g.add(cab);
  if(!jeep){
    const winMat = new THREE.MeshLambertMaterial({color:0x87ceeb,transparent:true,opacity:.7});
    const winF = new THREE.Mesh(new THREE.BoxGeometry(1.5,.35,.05),winMat); winF.position.set(0,1.35,.75); g.add(winF);
    const winB = new THREE.Mesh(new THREE.BoxGeometry(1.5,.35,.05),winMat); winB.position.set(0,1.35,-1.35); g.add(winB);
  }
  const chromeMat = new THREE.MeshLambertMaterial({color:0xd4d4d8});
  const bF = new THREE.Mesh(new THREE.BoxGeometry(2.1,.15,.2),chromeMat); bF.position.set(0,.5,2.35); g.add(bF);
  const bB = new THREE.Mesh(new THREE.BoxGeometry(2.1,.15,.2),chromeMat); bB.position.set(0,.5,-2.35); g.add(bB);
  const wm = new THREE.MeshLambertMaterial({color:0x1a1a1e});
  const rimMat = new THREE.MeshLambertMaterial({color:0x8a8a90});
  const wheelPos = [[-1,1.5],[1,1.5],[-1,-1.5],[1,-1.5]];
  for(let i=0;i<wheelPos.length;i++){
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.28,12),wm);
    w.rotation.z=Math.PI/2; w.position.set(wheelPos[i][0],.42,wheelPos[i][1]); g.add(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.3,8),rimMat);
    rim.rotation.z=Math.PI/2; rim.position.set(wheelPos[i][0],.42,wheelPos[i][1]); g.add(rim);
  }
  const headMat = new THREE.MeshBasicMaterial({color:0xfff8d0});
  const headPos = [[-.6,2.32],[.6,2.32]];
  for(let i=0;i<headPos.length;i++){
    const h = new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),headMat);
    h.position.set(headPos[i][0],.8,headPos[i][1]); g.add(h);
  }
  const sh = blob(2.6); sh.scale.set(1,1.6,1); sh.position.y=.05; g.add(sh);
  g.position.set(x,0,z); g.rotation.y=a; scene.add(g);
  cars.push({g:g,x:x,z:z,a:a,speed:0,fuel:rand(35,95),type:type,req:req,searched:false,driver:null,hp:100});
}
function createStars(){
  const starGeo = new THREE.BufferGeometry();
  const count = 800;
  const positions = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const theta = rand(0,TAU), phi = rand(0,Math.PI/2), r = 400;
    positions[i*3] = r*Math.sin(phi)*Math.cos(theta);
    positions[i*3+1] = r*Math.cos(phi);
    positions[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
  }
  starGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const starMat = new THREE.PointsMaterial({color:0xffffff,size:1.2,transparent:true,opacity:0});
  const stars = new THREE.Points(starGeo,starMat);
  scene.add(stars);
  window.starsMesh = stars;
}
function buildPark(bx,bz){
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(W.B,W.B),new THREE.MeshLambertMaterial({color:0x3f7a34}));
  grass.rotation.x=-Math.PI/2; grass.position.set(bx,.06,bz); scene.add(grass);
  const pathMat = new THREE.MeshLambertMaterial({color:0xb8a678});
  const path1 = new THREE.Mesh(new THREE.PlaneGeometry(2,W.B),pathMat);
  path1.rotation.x=-Math.PI/2; path1.position.set(bx,.07,bz); scene.add(path1);
  const path2 = new THREE.Mesh(new THREE.PlaneGeometry(W.B,2),pathMat);
  path2.rotation.x=-Math.PI/2; path2.position.set(bx,.07,bz); scene.add(path2);
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(3,3.5,.8,12),new THREE.MeshLambertMaterial({color:0x8a8a80}));
  fb.position.set(bx,.4,bz); scene.add(fb);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,.3,12),new THREE.MeshLambertMaterial({color:0x4a9fd4,transparent:true,opacity:.8}));
  water.position.set(bx,.85,bz); scene.add(water);
  const ft = new THREE.Mesh(new THREE.CylinderGeometry(.3,.5,1.5,8),new THREE.MeshLambertMaterial({color:0x8a8a80}));
  ft.position.set(bx,1.5,bz); scene.add(ft);
  solids.push({x1:bx-3.6,x2:bx+3.6,z1:bz-3.6,z2:bz+3.6});
  window.shopPos = new THREE.Vector3(bx+8,0,bz-8);
  const cafe = new THREE.Mesh(new THREE.BoxGeometry(4,3,4),new THREE.MeshLambertMaterial({color:0xe0a84b}));
  cafe.position.set(bx+8,1.5,bz-8); scene.add(cafe);
  solids.push({x1:bx+6,x2:bx+10,z1:bz-10,z2:bz-6});
  const sign = textSprite('☕ CAFETERÍA EL JÚCARO','#ffb340',4);
  sign.position.set(bx+8,4,bz-8); scene.add(sign);
  const benchMat = new THREE.MeshLambertMaterial({color:0x6a4a2a});
  const benchPos = [[-6,0],[6,0],[0,-6],[0,6]];
  for(let i=0;i<benchPos.length;i++){
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2,.4,.6),benchMat);
    bench.position.set(bx+benchPos[i][0],.5,bz+benchPos[i][1]); scene.add(bench);
  }
  for(let i=0;i<8;i++) palm(bx+rand(-11,11),bz+rand(-11,11),rand(.9,1.3));
  for(let i=0;i<4;i++) addBush(bx+rand(-10,10),bz+rand(-10,10),.8);
  for(let i=0;i<4;i++) lampWithLight(bx+(i<2?-1:1)*10,bz+(i%2?-1:1)*10,true);
  const pl1 = new THREE.PointLight(0xffc36b,.5,30); pl1.position.set(bx,5,bz); scene.add(pl1);
  parkLights.push(pl1);
}
function buildPlaza(bx,bz){
  const wm = new THREE.MeshLambertMaterial({color:0xe8e4d4});
  const body = new THREE.Mesh(new THREE.BoxGeometry(15,11,10),wm); body.position.set(bx-2,5.5,bz); scene.add(body);
  const tow = new THREE.Mesh(new THREE.BoxGeometry(4.4,18,4.4),wm); tow.position.set(bx+7.5,9,bz); scene.add(tow);
  const cm = new THREE.MeshLambertMaterial({color:0x3a3a3e});
  const cc1 = new THREE.Mesh(new THREE.BoxGeometry(.4,3,.4),cm); cc1.position.set(bx+7.5,23,bz); scene.add(cc1);
  solids.push({x1:bx-9.7,x2:bx+5.7,z1:bz-5.2,z2:bz+5.2});
  solids.push({x1:bx+5.1,x2:bx+9.9,z1:bz-2.4,z2:bz+2.4});
}
function buildCity(){
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width=groundCanvas.height=512;
  const gctx = groundCanvas.getContext('2d');
  gctx.fillStyle='#4a5d33'; gctx.fillRect(0,0,512,512);
  for(let i=0;i<2000;i++){
    gctx.fillStyle=pick(['#3f5229','#556b3d','#4a5d33','#5a7042']);
    gctx.fillRect(Math.random()*512,Math.random()*512,2,2);
  }
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping; groundTex.repeat.set(40,40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshLambertMaterial({map:groundTex}));
  ground.rotation.x=-Math.PI/2; ground.position.y=-.05; scene.add(ground);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W.size,W.size),new THREE.MeshLambertMaterial({map:floorTexture()}));
  floor.rotation.x=-Math.PI/2; floor.position.y=.01; scene.add(floor);
  for(let i=0;i<W.n;i++)for(let j=0;j<W.n;j++){
    const bx=blockC(i),bz=blockC(j);
    if(i===3&&j===3){buildPark(bx,bz);continue;}
    if(i===4&&j===3){buildPlaza(bx,bz);continue;}
    const nb = irand(2,3);
    for(let k=0;k<nb;k++){
      const w=rand(7,11),d=rand(7,11),h=rand(6,14);
      const ox=rand(-(13-w/2-1),13-w/2-1);
      const oz=rand(-(13-d/2-1),13-d/2-1);
      addBuildingDetailed(bx+ox,bz+oz,w,d,h,pick(PALETTE));
    }
    if(Math.random()<.5) palm(bx+rand(-11,11),bz+rand(-11,11),rand(.8,1.3));
    if(Math.random()<.3) addBush(bx+rand(-10,10),bz+rand(-10,10));
  }
  let lampCount=0;
  for(let i=0;i<8&&lampCount<12;i++){
    for(let j=0;j<2&&lampCount<12;j++){
      lampWithLight(roadC(i)+W.R/2-.8,blockC(irand(0,7))+rand(-9,9),lampCount%3===0);
      lampCount++;
    }
  }
  buildLomaCruz();
  for(let i=0;i<40;i++){
    const a=rand(0,TAU),r=rand(W.half+25,W.half+180);
    if(Math.abs(r*Math.sin(a))<60&&Math.cos(a)<0)continue;
    if(Math.random()<.6) palm(r*Math.sin(a),r*Math.cos(a),rand(1,1.8));
    else addBush(r*Math.sin(a),r*Math.cos(a),rand(1,2));
  }
  const carCols = ['#c94f4f','#4f7fc9','#e0a84b','#7fb6a4','#d9d9d9','#8f4f8f','#e07a3f','#5c8a5c','#d4af37','#2a5d8f'];
  for(let k=0;k<14;k++){
    const vert=Math.random()<.5,ri=irand(0,W.n);
    const off=(Math.random()<.5?1:-1)*(W.R/2-2.5);
    let x,z,a;
    if(vert){x=roadC(ri)+off;z=rand(-W.half+8,W.half-8);a=Math.random()<.5?0:Math.PI;}
    else{z=roadC(ri)+off;x=rand(-W.half+8,W.half-8);a=Math.random()<.5?Math.PI/2:-Math.PI/2;}
    if(Math.abs(x-blockC(3))<16&&Math.abs(z-blockC(3))<16)continue;
    makeCarDetailed(x,z,a,pick(carCols),'clasico',3);
  }
  makeCarDetailed(blockC(4)+9,blockC(3)-15.5,Math.PI,'#4a5d3a','jeep',5);
  makeCarDetailed(blockC(4)+9,blockC(3)-19.5,Math.PI,'#4a5d3a','jeep',5);
  if(window.Buildings){
    Buildings.generateDoors(solids);
    Buildings.getAll().forEach(d=>Buildings.createDoorMarker(d,scene));
  }
  createStars();
}

/* ================= PERSONAJES ================= */
function buildHuman(shirt,pants,skin){
  const g = new THREE.Group();
  const M = c => new THREE.MeshLambertMaterial({color:c});
  const mkPivot = (px,py) => {const p=new THREE.Group();p.position.set(px,py,0);g.add(p);return p;};
  const ll = mkPivot(-.14,.82);
  const llMesh = new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(pants)); llMesh.position.y=-.39; ll.add(llMesh);
  const rl = mkPivot(.14,.82);
  const rlMesh = new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(pants)); rlMesh.position.y=-.39; rl.add(rlMesh);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.6,.72,.34),M(shirt)); body.position.y=1.16; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.36),M(skin)); head.position.y=1.72; g.add(head);
  const la = mkPivot(-.4,1.46);
  const laMesh = new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(shirt)); laMesh.position.y=-.3; la.add(laMesh);
  const ra = mkPivot(.4,1.46);
  const raMesh = new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(shirt)); raMesh.position.y=-.3; ra.add(raMesh);
  const sh = blob(.55); sh.rotation.x=-Math.PI/2; sh.position.y=.03; g.add(sh);
  return {g:g,ll:ll,rl:rl,la:la,ra:ra,head:head};
}
function gunMesh(id){
  const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({color:c});
  let m = null;
  if(id==='arco'){
    const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(.5,.03,4,12,Math.PI),M(0x6a4a2a));
    bowCurve.rotation.y=Math.PI/2; g.add(bowCurve);
    const string = new THREE.Mesh(new THREE.BoxGeometry(.01,.9,.01),M(0xdddddd)); g.add(string);
    return g;
  }
  if(id==='tubo') m = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.9,6),M(0x777f88));
  else if(id==='machete') m = new THREE.Mesh(new THREE.BoxGeometry(.05,.09,.85),M(0xcfd8de));
  else if(id==='pistola') m = new THREE.Mesh(new THREE.BoxGeometry(.09,.14,.34),M(0x23272e));
  else if(id==='escopeta') m = new THREE.Mesh(new THREE.BoxGeometry(.1,.12,.95),M(0x4a3626));
  else if(id==='ak'){
    m = new THREE.Mesh(new THREE.BoxGeometry(.09,.13,.95),M(0x2e2a24));
    const mg = new THREE.Mesh(new THREE.BoxGeometry(.07,.24,.12),M(0x201d18));
    mg.position.set(0,-.12,.05); g.add(mg);
  }
  if(m){m.rotation.x=Math.PI/2;g.add(m);}
  return g;
}
function makeBar(){
  const bg = new THREE.Sprite(new THREE.SpriteMaterial({color:0x200508})); bg.scale.set(.95,.08,1);
  const fg = new THREE.Sprite(new THREE.SpriteMaterial({color:0xff5a4a})); fg.scale.set(.95,.06,1);
  const grp = new THREE.Group(); grp.add(bg); grp.add(fg); grp.position.y=2.15; grp.visible=false;
  return {grp:grp,fg:fg};
}

/* ================= ESTADO ================= */
let mode = 1, state = 'MENU';
window.players = [];
let zombies = [], crates = [], tracers = [], bloods = [], noises = [];
let arrows = [], stuckArrows = [];
let stepAccumulator = 0;
let dayT = .29, day = 1, hour = 7, prevHour = 7, zSpawnT = 0, groanT = 4;
let gameRunningTime = 0;
let MAPC = null, MAPS = 0; const MAPHALF = 175;
let camMenuA = 0;
let aimLine = null, impactMarker = null;
window.zombies_global = zombies;

/* ================= FLECHAS + PUNTERO ================= */
function createAimHelpers(){
  const maxPoints = 80;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(maxPoints*3);
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const mat = new THREE.LineDashedMaterial({color:0xffb340,dashSize:.25,gapSize:.18,transparent:true,opacity:.75});
  aimLine = new THREE.Line(geo,mat);
  aimLine.frustumCulled = false; aimLine.visible = false;
  scene.add(aimLine);
  const ringGeo = new THREE.RingGeometry(.15,.26,20);
  const ringMat = new THREE.MeshBasicMaterial({color:0xffb340,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false});
  impactMarker = new THREE.Mesh(ringGeo,ringMat);
  impactMarker.renderOrder = 10; impactMarker.visible = false;
  scene.add(impactMarker);
  const dotGeo = new THREE.CircleGeometry(.05,10);
  const dotMat = new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false});
  const dot = new THREE.Mesh(dotGeo,dotMat); dot.renderOrder=11;
  impactMarker.add(dot);
}

// ===== APUNTADO TIPO GTA: rayo desde la cámara por el crosshair =====
const _aimRay=new THREE.Raycaster();
const _aimNDC=new THREE.Vector2(0,0);
const _aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.5);
const _aimPoint=new THREE.Vector3();
function getAimDir(p){
  _aimRay.setFromCamera(_aimNDC,p.cam);
  const hit=_aimRay.ray.intersectPlane(_aimPlane,_aimPoint);
  if(hit){
    const dx=_aimPoint.x-p.pos.x,dz=_aimPoint.z-p.pos.z;
    const len=Math.hypot(dx,dz);
    if(len>0.2)return{x:dx/len,z:dz/len};
  }
  return{x:Math.sin(p.camYaw),z:Math.cos(p.camYaw)};
}

function updateAimTrajectory(p){
  if(!aimLine||!impactMarker)return;
  if(p.inCar||p.down){aimLine.visible=false;impactMarker.visible=false;return;}
  const cw = WEAPONS[p.weapons[p.cur]];
  if(!cw||cw.type!=='bow'){aimLine.visible=false;impactMarker.visible=false;return;}
  const _ad=getAimDir(p);
  const dirX=_ad.x,dirZ=_ad.z;
  let px=p.pos.x+dirX*.8,py=1.5,pz=p.pos.z+dirZ*.8;
  const speed=28;
  let vx=dirX*speed,vy=3.5,vz=dirZ*speed;
  const points=[];
  const simDt=1/30,maxSteps=80,maxRange=cw.range||60;
  let hitPoint=null,hitTarget=false;
  let lastDir={x:vx,y:vy,z:vz};
  let totalDist=0;
  for(let i=0;i<maxSteps;i++){
    points.push(px,py,pz);
    let zombieHit=null;
    for(let j=0;j<zombies.length;j++){
      const zom=zombies[j];
      if(zom.dead)continue;
      const dx=zom.x-px,dz=zom.z-pz;
      if(dx*dx+dz*dz<.5&&py>.3&&py<2.2){zombieHit=zom;break;}
    }
    if(zombieHit){hitPoint={x:px,y:py,z:pz};hitTarget=true;break;}
    if(window.Bosses){
      const bh=Bosses.getNearest(px,pz);
      if(bh.boss&&bh.dist<1.5&&py>.3&&py<3){hitPoint={x:px,y:py,z:pz};hitTarget=true;break;}
    }
    vy-=12*simDt;
    const nx=px+vx*simDt,ny=py+vy*simDt,nz=pz+vz*simDt;
    totalDist+=Math.hypot(nx-px,ny-py,nz-pz);
    if(totalDist>maxRange){hitPoint={x:nx,y:ny,z:nz};break;}
    lastDir={x:vx,y:vy,z:vz};
    px=nx;py=ny;pz=nz;
    if(py<=.05){hitPoint={x:px,y:.05,z:pz};break;}
    if(inSolid(px,pz,.1)){hitPoint={x:px,y:py,z:pz};break;}
  }
  const posAttr=aimLine.geometry.getAttribute('position');
  const numPoints=Math.floor(points.length/3);
  const count=Math.min(numPoints,posAttr.count);
  for(let i=0;i<count;i++){posAttr.setXYZ(i,points[i*3],points[i*3+1],points[i*3+2]);}
  posAttr.needsUpdate=true;
  aimLine.geometry.setDrawRange(0,count);
  if(count>1)aimLine.computeLineDistances();
  aimLine.visible=count>1;
  aimLine.material.color.set(hitTarget?0xff4a3d:0xffb340);
  if(hitPoint){
    impactMarker.position.set(hitPoint.x,hitPoint.y,hitPoint.z);
    const len=Math.hypot(lastDir.x,lastDir.y,lastDir.z)||1;
    impactMarker.lookAt(hitPoint.x+lastDir.x/len,hitPoint.y+lastDir.y/len,hitPoint.z+lastDir.z/len);
    impactMarker.material.color.set(hitTarget?0xff4a3d:0xffb340);
    const pulse=1+Math.sin(performance.now()*.006)*.18;
    impactMarker.scale.set(pulse,pulse,pulse);
    impactMarker.visible=true;
  }else{impactMarker.visible=false;}
}

function shootArrow(p){
  if((p.ammo.flecha||0)<=0){sfx.empty();toast('¡Sin flechas! Mata zombis para recuperar','bad');return;}
  p.ammo.flecha--;
  sfx.bow&&sfx.bow();
  const _ad=getAimDir(p);
  const dirX=_ad.x,dirZ=_ad.z;
  const arrow={x:p.pos.x+dirX*.8,y:1.5,z:p.pos.z+dirZ*.8,vx:dirX*28,vy:3.5,vz:dirZ*28,mesh:null,life:4,fromPlayer:p.idx};
  const group=new THREE.Group();
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.7,4),new THREE.MeshLambertMaterial({color:0x8a6a3a}));
  shaft.rotation.x=Math.PI/2; group.add(shaft);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.04,.15,4),new THREE.MeshLambertMaterial({color:0x555555}));
  tip.rotation.x=-Math.PI/2; tip.position.z=.4; group.add(tip);
  const feather=new THREE.Mesh(new THREE.BoxGeometry(.08,.02,.15),new THREE.MeshLambertMaterial({color:0xc94f4f}));
  feather.position.z=-.3; group.add(feather);
  group.position.set(arrow.x,arrow.y,arrow.z);
  scene.add(group);
  arrow.mesh=group;
  arrows.push(arrow);
}
function stickArrow(a){
  const sg=new THREE.Group();
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.5,4),new THREE.MeshLambertMaterial({color:0x8a6a3a}));
  shaft.position.y=.25; sg.add(shaft);
  const feather=new THREE.Mesh(new THREE.BoxGeometry(.08,.02,.12),new THREE.MeshLambertMaterial({color:0xc94f4f}));
  feather.position.y=.45; sg.add(feather);
  sg.position.set(a.x,Math.max(.05,a.y-.3),a.z);
  sg.rotation.x=rand(-.3,.3); sg.rotation.z=rand(-.3,.3);
  scene.add(sg);
  stuckArrows.push({mesh:sg,life:15});
  sfx.arrowStick&&sfx.arrowStick();
}
function spawnImpactParticles(x,y,z,surface){
  const colors={stone:0x9a9a9a,wood:0x8a6a3a,ground:0x5a4a3a};
  const color=colors[surface]||0x888888;
  for(let i=0;i<6;i++){
    const p=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.05),new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.9}));
    p.position.set(x,y,z); scene.add(p);
    const vel={x:rand(-2,2),y:rand(1,3),z:rand(-2,2)};
    const st=performance.now();
    const anim=function(){
      const el=(performance.now()-st)/1000;
      if(el>.5){scene.remove(p);return;}
      p.position.x+=vel.x*.016;p.position.y+=vel.y*.016;p.position.z+=vel.z*.016;
      vel.y-=9.8*.016;
      p.material.opacity=.9*(1-el/.5);
      requestAnimationFrame(anim);
    };
    anim();
  }
}

function updateArrows(dt){
  for(let i=arrows.length-1;i>=0;i--){
    const a=arrows[i];
    a.life-=dt;
    if(a.life<=0){scene.remove(a.mesh);arrows.splice(i,1);continue;}
    
    // SUBSTEPS: divide el movimiento en pasos pequeños para no atravesar
    const speed=Math.hypot(a.vx,a.vy,a.vz);
    const steps=Math.max(1,Math.ceil(speed*dt/0.12));
    const sdt=dt/steps;
    let hit=false,hitSurface='';
    
    for(let s=0;s<steps&&!hit;s++){
      a.vy-=12*sdt;
      a.x+=a.vx*sdt; a.y+=a.vy*sdt; a.z+=a.vz*sdt;
      
      if(a.y<=.05){hit=true;hitSurface='ground';break;}
      if(inSolid(a.x,a.z,.1)){hit=true;hitSurface=Math.random()<.6?'stone':'wood';break;}
      
      // Zombis con RADIO MAYOR (0.8)
      for(let j=0;j<zombies.length;j++){
        const z=zombies[j];
        if(z.dead)continue;
        const dx=z.x-a.x,dz=z.z-a.z;
        if(dx*dx+dz*dz<0.64&&a.y>0.2&&a.y<2.3){
          const bowMul=window.Progression?Progression.bowDamageMul():1;
          hurtZombie(z,WEAPONS.arco.dmg*dmgMul(players[a.fromPlayer]||{level:0})*bowMul,a.fromPlayer);
          hit=true;hitSurface='flesh';break;
        }
      }
      if(hit)break;
      
      if(window.Bosses){
        const bh=Bosses.getNearest(a.x,a.z);
        if(bh.boss&&bh.dist<1.6&&a.y>0.2&&a.y<3){
          Bosses.hurtBoss(bh.boss,WEAPONS.arco.dmg);
          hit=true;hitSurface='flesh';break;
        }
      }
    }
    
    a.mesh.position.set(a.x,a.y,a.z);
    const len=Math.hypot(a.vx,a.vy,a.vz);
    if(len>0)a.mesh.lookAt(a.x+a.vx/len,a.y+a.vy/len,a.z+a.vz/len);
    
    if(hit){
      if(hitSurface==='flesh'){
        scene.remove(a.mesh);
      }else{
        sfx.arrowImpact&&sfx.arrowImpact(hitSurface);
        spawnImpactParticles(a.x,a.y,a.z,hitSurface);
        stickArrow(a);
      }
      arrows.splice(i,1);
    }
  }
  for(let i=stuckArrows.length-1;i>=0;i--){
    const sa=stuckArrows[i];
    sa.life-=dt;
    if(sa.life<=0){scene.remove(sa.mesh);stuckArrows.splice(i,1);}
    else if(sa.life<2){
      sa.mesh.traverse(function(o){if(o.material){o.material.transparent=true;o.material.opacity=sa.life/2;}});
    }
  }
}

/* ================= ZOMBIS ================= */
function createLocalFallback(){
  const g=new THREE.Group();
  const M=c=>new THREE.MeshLambertMaterial({color:c});
  const skin=pick(['#7a9a6a','#8fae7a','#6f8f6f','#9aa87a']);
  const cloth=pick(['#5a5f6a','#7a5a4a','#4a6a5a','#8a8a7a','#6a4a5a']);
  const ll=new THREE.Group();ll.position.set(-.14,.82,0);g.add(ll);
  const llMesh=new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(cloth));llMesh.position.y=-.39;ll.add(llMesh);ll.rotation.x=-.2;
  const rl=new THREE.Group();rl.position.set(.14,.82,0);g.add(rl);
  const rlMesh=new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.23),M(cloth));rlMesh.position.y=-.39;rl.add(rlMesh);rl.rotation.x=.1;
  const torso=new THREE.Group();torso.position.y=1.16;torso.rotation.x=.25;
  const bodyMesh=new THREE.Mesh(new THREE.BoxGeometry(.6,.72,.34),M(cloth));torso.add(bodyMesh);
  const blood1=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.02),M(0x6a0d0d));blood1.position.set(.15,.1,.18);torso.add(blood1);
  g.add(torso);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.36),M(skin));
  head.position.set(0,1.68,.05);head.rotation.x=-.15;head.rotation.z=.1;g.add(head);
  const eyeMat=new THREE.MeshBasicMaterial({color:0xff3030});
  const eL=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02),eyeMat);eL.position.set(-.09,1.72,.19);g.add(eL);
  const eR=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02),eyeMat);eR.position.set(.09,1.72,.19);g.add(eR);
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(.15,.04,.02),M(0x1a0505));mouth.position.set(0,1.58,.19);g.add(mouth);
  const la=new THREE.Group();la.position.set(-.4,1.46,0);g.add(la);
  const laMesh=new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(cloth));laMesh.position.set(0,-.3,.15);la.add(laMesh);
  la.rotation.x=-1.1;la.rotation.z=.1;
  const ra=new THREE.Group();ra.position.set(.4,1.46,0);g.add(ra);
  const raMesh=new THREE.Mesh(new THREE.BoxGeometry(.17,.6,.17),M(cloth));raMesh.position.set(0,-.3,.15);ra.add(raMesh);
  ra.rotation.x=-1.2;ra.rotation.z=-.1;
  const sh=blob(.55);sh.position.y=.03;g.add(sh);
  return {group:g,isGLB:false,human:{g:g,ll:ll,rl:rl,la:la,ra:ra,head:head}};
}

async function spawnZombie(x,z,menu){
  let model=null;
  try{if(window.Models&&Models.makeZombie)model=await Models.makeZombie();}catch(e){model=null;}
  if(!model||!model.group)model=createLocalFallback();
  
  // Posicionar en el mundo
  model.group.position.set(x, 0.02, z);  // offset base de seguridad
  scene.add(model.group);
  
  // 🔧 CORRECCIÓN AUTOMÁTICA: si está enterrado, subirlo
  if(model.isGLB){
    const box = new THREE.Box3().setFromObject(model.group);
    if(box.min.y < -0.05){
      const correction = -box.min.y + 0.02;
      model.group.position.y += correction;
    }
    // Si flota demasiado, bajarlo
    if(box.min.y > 0.3){
      model.group.position.y -= box.min.y - 0.02;
    }
  }
  
  const bar=makeBar();
  model.group.add(bar.grp);
  
  zombies.push({
    x:x, z:z, yaw:rand(0,TAU),
    hp:42, maxhp:42, speed:rand(1,1.8),
    state:'wander', wt:rand(0,3), tx:x, tz:z,
    atkCd:0, model:model, bar:bar,
    dead:false, dieT:0, flash:0,
    menu:!!menu, ph:rand(0,TAU),
    ztype:'caminante', zdmg:10, aggroRange:15
  });
  
  if(window.ZombiesX&&Math.random()<.6){
    const z2=zombies[zombies.length-1];
    const typeId=ZombiesX.pickType(day,isNight());
    ZombiesX.applyType(z2,typeId);
  }
}

async function spawnHordeZombie(x,z){
  await spawnZombie(x,z,false);
  const z2=zombies[zombies.length-1];
  if(z2&&window.ZombiesX){
    const typeId=ZombiesX.pickType(day,isNight());
    ZombiesX.applyType(z2,typeId);
  }
}
function freeSpot(cx,cz,rMin,rMax){
  for(let k=0;k<9;k++){
    const a=rand(0,TAU),r=rand(rMin,rMax);
    const x=clamp(cx+Math.sin(a)*r,-W.half+2,W.half-2);
    const z=clamp(cz+Math.cos(a)*r,-W.half+2,W.half-2);
    if(!inSolid(x,z,.6))return{x:x,z:z};
  }
  return null;
}
function inSolid(x,z,r){
  for(let i=0;i<solids.length;i++){const b=solids[i];if(x>b.x1-r&&x<b.x2+r&&z>b.z1-r&&z<b.z2+r)return true;}
  return false;
}
function segBox(o,d,b){
  let tmin=0,tmax=1e9;
  if(Math.abs(d.x)<1e-8){if(o.x<b.x1||o.x>b.x2)return null;}
  else{let t1=(b.x1-o.x)/d.x,t2=(b.x2-o.x)/d.x;if(t1>t2){const t=t1;t1=t2;t2=t;}tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);}
  if(Math.abs(d.z)<1e-8){if(o.z<b.z1||o.z>b.z2)return null;}
  else{let t1=(b.z1-o.z)/d.z,t2=(b.z2-o.z)/d.z;if(t1>t2){const t=t1;t1=t2;t2=t;}tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);}
  if(tmax<tmin)return null;
  return tmin>0?tmin:(tmax>0?0:null);
}

function tryMove(o,dx,dz,r){
  o.x+=dx;
  for(let i=0;i<solids.length;i++){const b=solids[i];if(o.x>b.x1-r&&o.x<b.x2+r&&o.z>b.z1-r&&o.z<b.z2+r){o.x=(dx>0)?b.x1-r:b.x2+r;}}
  o.z+=dz;
  for(let i=0;i<solids.length;i++){const b=solids[i];if(o.x>b.x1-r&&o.x<b.x2+r&&o.z>b.z1-r&&o.z<b.z2+r){o.z=(dz>0)?b.z1-r:b.z2+r;}}
  o.x=clamp(o.x,-W.half+1,W.half-1);
  o.z=clamp(o.z,-W.half-60,W.half-1);   // ← CAMBIADO: extendido hacia la Loma (norte)
}
window.tryMove=tryMove;

function addBlood(x,z,big){
  const m=new THREE.Mesh(new THREE.CircleGeometry(big?rand(.7,1.1):rand(.3,.5),8),new THREE.MeshBasicMaterial({color:0x6a0d0d,transparent:true,opacity:.6,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.rotation.z=rand(0,TAU);
  m.position.set(x,.04,z);scene.add(m);
  bloods.push({m:m,t:22});
  if(bloods.length>70){const o=bloods.shift();scene.remove(o.m);}
}
function addTracer(a,b){
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z)]);
  const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffd894,transparent:true,opacity:.9}));
  scene.add(l);tracers.push({l:l,t:.06});
}
function noiseAt(x,z,r){noises.push({x:x,z:z,r:r,t:2});}

/* ================= COMBATE ================= */
function hurtZombie(z,dmg,pi){
  if(z.dead)return;
  z.hp-=dmg;z.flash=.14;z.aggro=14;
  const p=players[pi];
  if(p){const dx=z.x-p.pos.x,dz=z.z-p.pos.z,d=Math.hypot(dx,dz)||1;tryMove(z,dx/d*.5,dz/d*.5,.45);}
  addBlood(z.x,z.z,false);sfx.hit();
  if(z.hp<=0)killZombie(z,pi);
}
window.hurtZombieFromNPC=function(z,dmg,npc){
  if(z.dead)return;
  z.hp-=dmg;z.flash=.14;z.aggro=14;
  addBlood(z.x,z.z,false);sfx.hit();
  if(z.hp<=0){
    z.dead=true;z.dieT=0;addBlood(z.x,z.z,true);sfx.zdie();
    npc.kills=(npc.kills||0)+1;
    npc.killsLvl=(npc.killsLvl||0)+1;
    while(npc.killsLvl>=need(npc.level)){
      npc.killsLvl-=need(npc.level);npc.level++;
      npc.maxHp+=10;npc.hp=Math.min(npc.maxHp,npc.hp+10);npc.atkDmg+=4;
      toast(npc.name+' subió a nivel '+npc.level,'good');
    }
    if(window.Missions)Missions.updateProgress('kill');
    if(window.NpcBrain&&npc.brain)NpcBrain.learn(npc.brain,'playerKill');
  }
};
function killZombie(z,pi){
  if(window.ZombiesX&&ZombiesX.onDeath(z,players,hurtPlayer)){addBlood(z.x,z.z,true);}
  z.dead=true;z.dieT=0;addBlood(z.x,z.z,true);sfx.zdie();
  if(Math.random()<.55){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,.3),new THREE.MeshLambertMaterial({color:0x8a6a3f}));
    m.position.set(z.x,.16,z.z);m.rotation.y=rand(0,TAU);scene.add(m);
    crates.push({x:z.x,z:z.z,m:m});
  }
  if(players[pi])addKill(players[pi]);
  if(window.Missions)Missions.updateProgress('kill');
  if(window.Achievements){
    Achievements.addStat('kills',1);
    if(pi===0&&players[0]&&players[0].weapons[players[0].cur]==='arco')Achievements.addStat('bowKills',1);
  }
  if(window.NpcBrain&&window.NPCSystem){
    NpcBrain.observe('playerKill');
    const all=NPCSystem.getAll();
    for(let i=0;i<all.length;i++){if(all[i].brain)NpcBrain.learn(all[i].brain,'playerKill');}
  }
  if(Math.random()<.75){
    const recovered=irand(1,3);
    if(players[pi]){
      players[pi].ammo.flecha=(players[pi].ammo.flecha||0)+recovered;
      toast('+'+recovered+' 🏹 flechas recuperadas','good');
    }
  }
}
function addKill(p){
  p.kills++;p.killsLvl++;
  let ups=0;
  while(p.killsLvl>=need(p.level)){
    p.killsLvl-=need(p.level);p.level++;ups++;
    applyUnlock(p);
    if(window.Progression)Progression.addPoints(1);
  }
  if(ups)p.hp=Math.min(100,p.hp+30);
}
function applyUnlock(p){
  const u=UNLOCKS[p.level];sfx.level();
  if(u){
    announce('NIVEL '+p.level,u.txt);
    if(u.w){p.weapons.push(u.w);if(!p.mag[u.w])p.mag[u.w]=WEAPONS[u.w].mag;equipWeapon(p,u.w);}
    if(u.ammo)for(const k in u.ammo)p.ammo[k]+=u.ammo[k];
  }else announce('NIVEL '+p.level,'SIGUE ASÍ');
  if(p.level===3)toast('Puedes conducir almendrones (E)','good');
  if(p.level===5)toast('Jeep + Jefes + Base disponibles','good');
}
function fireWeapon(p){
  const id=p.weapons[p.cur],w=WEAPONS[id];
  if(p.fireCd>0||p.reloading>0)return;
  if(w.type==='melee'){
    p.fireCd=w.rate;p.meleeT=.25;sfx.swing();
    const meleeMul=window.Progression?Progression.meleeDamageMul():1;
    for(let i=0;i<zombies.length;i++){
      const z=zombies[i];
      if(z.dead)continue;
      const dx=z.x-p.pos.x,dz=z.z-p.pos.z,d=Math.hypot(dx,dz);
      if(d<w.range&&Math.abs(angTo(p.facing,Math.atan2(dx,dz)))<w.arc/2){
        hurtZombie(z,w.dmg*dmgMul(p)*meleeMul,p.idx);
        if(window.Progression&&Progression.canPush()){tryMove(z,dx/d*1.5,dz/d*1.5,.45);}
      }
    }
    if(window.NoiseSystem&&w.noise)NoiseSystem.add(w.noise,p);
    return;
  }
  if(w.type==='bow'){
    p.fireCd=w.rate;
    shootArrow(p);
    if(window.NoiseSystem){
      let n=w.noise||4;
      if(window.Progression){const silLvl=Progression.getSkill('sigilo2');n*=(1-silLvl*.25);}
      NoiseSystem.add(n,p);
    }
    return;
  }
  if((p.mag[id]||0)<=0){sfx.empty();startReload(p);toast('¡Sin munición!','bad');return;}
  p.mag[id]--;p.fireCd=w.rate;sfx[w.sfx]();
  noiseAt(p.pos.x,p.pos.z,48);
  if(window.NoiseSystem&&w.noise)NoiseSystem.add(w.noise,p);
  flashL.position.set(p.pos.x+Math.sin(p.camYaw)*.8,1.6,p.pos.z+Math.cos(p.camYaw)*.8);
  flashL.intensity=2.6;
  const n=w.pellets||1;
  for(let s=0;s<n;s++){
    const yaw=p.camYaw+rand(-w.spread,w.spread);
    const d={x:Math.sin(yaw),z:Math.cos(yaw)};
    const o={x:p.pos.x+d.x*.6,z:p.pos.z+d.z*.6};
    let best={t:w.range,z:null,boss:null};
    for(let i=0;i<solids.length;i++){const t=segBox(o,d,solids[i]);if(t!=null&&t<best.t)best={t:t,z:null,boss:null};}
    for(let i=0;i<zombies.length;i++){
      const z=zombies[i];
      if(z.dead)continue;
      const dx=z.x-o.x,dz=z.z-o.z,t=dx*d.x+dz*d.z;
      if(t>0&&t<best.t){
        const px=o.x+d.x*t,pz=o.z+d.z*t;
        if((z.x-px)*(z.x-px)+(z.z-pz)*(z.z-pz)<.42)best={t:t,z:z,boss:null};
      }
    }
    if(window.Bosses){
      const bh=Bosses.getNearest(p.pos.x,p.pos.z);
      if(bh.boss&&bh.dist<w.range){
        const dx=bh.boss.x-o.x,dz=bh.boss.z-o.z,t=dx*d.x+dz*d.z;
        if(t>0&&t<best.t){
          const px=o.x+d.x*t,pz=o.z+d.z*t;
          if((bh.boss.x-px)*(bh.boss.x-px)+(bh.boss.z-pz)*(bh.boss.z-pz)<4)best={t:t,z:null,boss:bh.boss};
        }
      }
    }
    const end={x:o.x+d.x*best.t,y:1.4,z:o.z+d.z*best.t};
    addTracer({x:o.x,y:1.5,z:o.z},end);
    if(best.z)hurtZombie(best.z,w.dmg*dmgMul(p)*(Math.random()<.15?1.7:1),p.idx);
    else if(best.boss)Bosses.hurtBoss(best.boss,w.dmg*dmgMul(p)*(Math.random()<.15?1.7:1));
  }
  if(p.mag[id]<=0)startReload(p);
}
function startReload(p){
  const id=p.weapons[p.cur],w=WEAPONS[id];
  if(w.type!=='gun'||p.reloading>0)return;
  if((p.mag[id]||0)>=w.mag||p.ammo[w.ammo]<=0)return;
  p.reloading=1.15;sfx.reload();
}
function finishReload(p){
  const id=p.weapons[p.cur],w=WEAPONS[id];
  if(w.type!=='gun')return;
  const take=Math.min(w.mag-(p.mag[id]||0),p.ammo[w.ammo]);
  p.ammo[w.ammo]-=take;p.mag[id]=(p.mag[id]||0)+take;
}

function hurtPlayer(p,dmg,srcX,srcZ){
  if(p.down)return;
  if((p.items.armor||0)>0)dmg*=.7;
  p.hp-=dmg;p.hitFlash=.4;
  if(window.DamageDir&&srcX!==undefined&&srcZ!==undefined){
    DamageDir.show(srcX,srcZ,p,clamp(dmg/30,0.4,1));
  }
  const df=document.getElementById('damage-flash');
  if(df){df.classList.add('on');setTimeout(function(){df.classList.remove('on');},200);}
  sfx.hurt();
  if(p.hp<=0){p.hp=0;downPlayer(p);}
}
window.hurtPlayer=hurtPlayer;

function downPlayer(p){
  if(mode===1){p.hp=0;gameOver();return;}
  p.down=true;p.human.g.visible=false;
  const m=new THREE.Mesh(new THREE.BoxGeometry(1.6,.3,.7),new THREE.MeshLambertMaterial({color:p.idx?0xc94f4f:0x2f8f83}));
  m.position.set(p.pos.x,.2,p.pos.z);scene.add(m);p.downMesh=m;
  toast('JUGADOR '+(p.idx+1)+' HA CAÍDO','bad');
  if(players.every(function(q){return q.down||q.hp<=0;}))gameOver();
}
function dmgMul(p){return 1+(p.level>=6?(p.level-5)*.08:0);}

/* ================= HUD ================= */
function buildHUD(i){
  const d=document.createElement('div');d.className='hud p'+(i+1);
  d.innerHTML='<div class="tl">'+
    '<div class="clock"><span class="day">DÍA 1</span><span class="hr">07:00</span></div>'+
    '<div class="lvline"><div class="lvbadge">NV 0</div><div class="xpbar"><i></i></div></div>'+
    '<div class="kills">☠ 0 BAJAS</div>'+
    '<div class="inf hidden">☣ INFECTADO</div>'+
    '</div>'+
    '<div class="compass"><b>N</b> 0°</div>'+
    '<div class="tr">'+
    '<div class="barlbl"><span>SALUD</span></div><div class="bar hp"><i></i></div>'+
    '<div class="barlbl"><span>HAMBRE</span></div><div class="bar hun"><i></i></div>'+
    '<div class="barlbl"><span>ESTAMINA</span></div><div class="bar sta"><i></i></div>'+
    '<div class="ammoline"><b>—</b><span></span></div>'+
    '<div class="wname">ARCO DE CAZA</div>'+
    '<div class="money">$ 60</div>'+
    '</div>'+
    '<div class="mission-hud hidden"><div class="title">🎯 MISIÓN ACTIVA</div><div class="desc"></div><div class="prog"><i></i></div></div>'+
    '<div class="squad-hud hidden"><div class="title">👥 ESCUADRÓN</div><div class="members"></div></div>'+
    '<div class="weather-hud hidden"></div>'+
    '<div class="mmwrap"><canvas id="mmframe" width="180" height="180"></canvas><div class="mmlabel">P'+(i+1)+' · HOLGUÍN NORTE ↑</div></div>'+
    '<div class="hint" style="display:none"></div>'+
    '<div class="cross"><i></i></div>'+
    '<div class="vig"></div>'+
    '<div class="downov hidden"><b>HAS CAÍDO</b><span>Tu compañero puede reanimarte</span></div>';
  document.getElementById('hudroot').appendChild(d);
  const q=function(s){return d.querySelector(s);};
  const fog=document.createElement('canvas');fog.width=fog.height=512;
  const fg=fog.getContext('2d');fg.fillStyle='#000';fg.fillRect(0,0,512,512);
  return {root:d,clockD:q('.day'),clockH:q('.hr'),lvl:q('.lvbadge'),xp:q('.xpbar i'),kills:q('.kills'),inf:q('.inf'),comp:q('.compass'),
    hp:q('.bar.hp i'),hun:q('.bar.hun i'),sta:q('.bar.sta i'),ammo:q('.ammoline b'),ammoR:q('.ammoline span'),
    wname:q('.wname'),money:q('.money'),
    missionHud:q('.mission-hud'),missionDesc:q('.mission-hud .desc'),missionProg:q('.mission-hud .prog i'),
    squadHud:q('.squad-hud'),squadMembers:q('.squad-hud .members'),weatherHud:q('.weather-hud'),
    mm:q('#mmframe'),mmctx:q('#mmframe').getContext('2d'),fog:fog,fogctx:fg,hint:q('.hint'),vig:q('.vig'),down:q('.downov')};
}
function newPlayer(i){
  const x=blockC(3)+(i?5:-5),z=blockC(3)+10;
  const h=buildHuman(i?0xc94f4f:0x2f8f83,'#2c3138',0xd9a878);
  scene.add(h.g);h.g.position.set(x,0,z);
  const spot=new THREE.SpotLight(0xffe9c0,0,34,.62,.55);
  scene.add(spot);scene.add(spot.target);
  const cam=new THREE.PerspectiveCamera(62,1,.1,500);
  h.g.visible=true;
  return {idx:i,pos:new THREE.Vector3(x,0,z),yaw:Math.PI,facing:Math.PI,camYaw:Math.PI,camPitch:.4,
    hp:100,hunger:100,stam:100,infected:false,down:false,
    money:60,level:0,kills:0,killsLvl:0,
    weapons:['arco','tubo'],cur:0,
    ammo:{flecha:50,b9mm:0,cart:0,rifle:0},
    mag:{},items:{pan:1,venda:1},
    inCar:null,fireCd:0,reloading:0,meleeT:0,hitFlash:0,walkT:0,
    spot:spot,cam:cam,gun:null,human:h,hud:buildHUD(i)};
}
function equipWeapon(p,id){
  p.cur=p.weapons.indexOf(id);
  if(p.gun)p.human.ra.remove(p.gun);
  p.gun=gunMesh(id);p.gun.position.set(0,-.55,0);p.human.ra.add(p.gun);
  p.human.la.rotation.x=-1.15;p.human.ra.rotation.x=-1.35;
}

/* ================= INTERACCIÓN ================= */
function giveItem(p,id,q){
  q=q||1;const it=ITEMS[id];
  if(it.ammo){p.ammo[it.ammo]+=it.q*q;toast('+ '+it.n,'good');}
  else{p.items[id]=(p.items[id]||0)+q;toast('+ '+it.i+' '+it.n,'good');}
  sfx.pickup();
  if(window.Missions)Missions.updateProgress('collect',id);
}
window.giveItem=giveItem;
function giveItemSilent(p,id){
  const it=ITEMS[id];
  if(it.ammo)p.ammo[it.ammo]+=it.q;
  else p.items[id]=(p.items[id]||0)+1;
}
function lootRoll(p,table,n){
  const got=[];
  for(let i=0;i<n;i++){
    const r=pick(table)[0];
    if(r==='money'){const m=irand(12,45);p.money+=m;got.push('$'+m);}
    else if(r==='none')continue;
    else{giveItemSilent(p,r);got.push(ITEMS[r].i+' '+ITEMS[r].n);if(window.Missions)Missions.updateProgress('collect',r);}
  }
  if(got.length)toast('Saqueado: '+got.join(' · '),'good');
  sfx.pickup();
}
function quickEat(p){
  for(let i=0;i<FOOD_ORDER.length;i++){
    const id=FOOD_ORDER[i];
    if((p.items[id]||0)>0){
      p.items[id]--;const it=ITEMS[id];
      p.hunger=Math.min(100,p.hunger+it.food);
      if(it.stam)p.stam=Math.min(100,p.stam+it.stam);
      sfx.eat();toast(it.i+' '+it.n,'good');return;
    }
  }
  toast('No tienes comida','bad');
}
function quickHeal(p){
  if(p.infected&&(p.items.antib||0)>0){p.items.antib--;p.infected=false;sfx.heal();toast('💉 Curado','good');return;}
  if((p.items.venda||0)>0){p.items.venda--;p.hp=Math.min(100,p.hp+18);sfx.heal();return;}
  if((p.items.medkit||0)>0){p.items.medkit--;p.hp=Math.min(100,p.hp+60);sfx.heal();return;}
  toast('Sin suministros médicos','bad');
}
function interactTarget(p){
  if(window.DialogueSystem&&window.NPCSystem){
    if(DialogueSystem.tryTalk(p,NPCSystem.getAll()))return;
  }
  if(window.LomaSystem&&window.lomaPos){
    const d=Math.hypot(p.pos.x-window.lomaPos.x,p.pos.z-window.lomaPos.z);
    if(d<20&&!LomaSystem.isActive()){
      if(LomaSystem.startClimb(p,day))return;
    }
  }
  if(window.BaseSystem&&BaseSystem.tryInteract(p))return;
  if(window.Buildings&&Buildings.tryEnter(p,scene)){
    window.setState('INV');   // ← pausa la simulación mientras saqueas
    return;
  }
  if(window.NPCSystem&&NPCSystem.tryRecruit(p,NPCSystem.getAll(),scene))return;
  if(window.Missions){
    const all=Missions.getAll();
    for(let i=0;i<all.length;i++){
      const m=all[i];
      if(m.status!=='available')continue;
      if(Math.hypot(m.x-p.pos.x,m.z-p.pos.z)<3){Missions.acceptMission(m.id);return;}
    }
  }
  for(let i=0;i<players.length;i++){
    const q=players[i];
    if(q!==p&&q.down&&p.pos.distanceTo(q.pos)<2.4){
      q.down=false;q.hp=45;
      if(q.downMesh){scene.remove(q.downMesh);q.downMesh=null;}
      q.human.g.visible=true;
      toast('Compañero reanimado','good');sfx.heal();return;
    }
  }
  if(p.inCar){exitCar(p);return;}
  let bc=null,bd=3.6;
  for(let i=0;i<cars.length;i++){
    const c=cars[i];
    const d=Math.hypot(c.x-p.pos.x,c.z-p.pos.z);
    if(d<bd){bd=d;bc=c;}
  }
  if(bc){
    if(p.level<bc.req){toast('Necesitas NIVEL '+bc.req,'bad');sfx.empty();return;}
    if(!bc.searched){bc.searched=true;lootRoll(p,CT,irand(1,2));return;}
    enterCar(p,bc);return;
  }
  if(window.shopPos&&p.pos.distanceTo(window.shopPos)<4){openShop(p);return;}
}
function enterCar(p,c){p.inCar=c;c.driver=p;p.human.g.visible=false;toast(c.type==='jeep'?'🪖 Jeep':'🚗 Almendrón');
  if(window.Achievements)Achievements.addStat('carsDriven',1);}
function exitCar(p){
  const c=p.inCar;if(!c)return;
  const sx=c.x+Math.cos(c.a)*2.4,sz=c.z-Math.sin(c.a)*2.4;
  if(!inSolid(sx,sz,.5))p.pos.set(sx,0,sz);else p.pos.set(c.x,0,c.z);
  p.human.g.visible=!p.down;p.inCar=null;c.driver=null;p.yaw=c.a;
}

/* ================= MINIMAPA ================= */
function buildMapCanvas(){
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
  MAPS=512/(MAPHALF*2);
  const mx=function(x){return (x+MAPHALF)*MAPS;};
  g.fillStyle='#060a12';g.fillRect(0,0,512,512);
  g.fillStyle='#141c2a';
  for(let i=0;i<=W.n;i++){const r=mx(roadC(i)),w=W.R*MAPS;g.fillRect(r-w/2,0,w,512);g.fillRect(0,r-w/2,512,w);}
  g.fillStyle='#232e42';
  for(let i=0;i<W.n;i++)for(let j=0;j<W.n;j++)
    g.fillRect(mx(blockC(i)-13),mx(blockC(j)-13),26*MAPS,26*MAPS);
  g.fillStyle='#2e5a2e';g.fillRect(mx(blockC(3)-13),mx(blockC(3)-13),26*MAPS,26*MAPS);
  g.fillStyle='#4a463c';g.fillRect(mx(blockC(4)-13),mx(blockC(3)-13),26*MAPS,26*MAPS);
  g.fillStyle='#3fe0c8';g.font='bold 14px sans-serif';g.textAlign='center';
  g.fillText('⛰',mx(0),mx(-W.half-30));
  MAPC=c;
}
function reveal(p){
  const f=p.hud.fogctx,x=(p.pos.x+MAPHALF)*MAPS,y=(p.pos.z+MAPHALF)*MAPS,r=30*MAPS;
  f.globalCompositeOperation='destination-out';
  const gr=f.createRadialGradient(x,y,r*.4,x,y,r);
  gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');
  f.fillStyle=gr;f.beginPath();f.arc(x,y,r,0,TAU);f.fill();
  f.globalCompositeOperation='source-over';
}
function drawMini(p){
  const c=p.hud.mmctx,S=180;
  c.save();c.fillStyle='#04060b';c.fillRect(0,0,S,S);
  const ox=S/2-(p.pos.x+MAPHALF)*MAPS,oy=S/2-(p.pos.z+MAPHALF)*MAPS;
  c.drawImage(MAPC,ox,oy);c.drawImage(p.hud.fog,ox,oy);
  const px=function(w){return S/2+w*MAPS;};
  for(let i=0;i<cars.length;i++){
    const cr=cars[i];
    if(Math.hypot(cr.x-p.pos.x,cr.z-p.pos.z)>95)continue;
    c.fillStyle=cr.type==='jeep'?'#8fd45c':'#7fb4ff';
    c.fillRect(px(cr.x)-2,px(cr.z)-2,4,4);
  }
  if(window.NPCSystem){
    const all=NPCSystem.getAll();
    for(let i=0;i<all.length;i++){
      const n=all[i];
      if(n.dead||Math.hypot(n.x-p.pos.x,n.z-p.pos.z)>70)continue;
      c.fillStyle=n.recruited?'#4fd684':'#3fe0c8';
      c.fillRect(px(n.x)-1.5,px(n.z)-1.5,3,3);
    }
  }
  if(window.shopPos&&p.pos.distanceTo(window.shopPos)<95){
    c.fillStyle='#ffb340';
    c.beginPath();c.arc(px(window.shopPos.x),px(window.shopPos.z),3,0,TAU);c.fill();
  }
  if(window.BaseSystem){
    const bp=BaseSystem.getPos();
    if(bp&&Math.hypot(bp.x-p.pos.x,bp.z-p.pos.z)<95){
      c.fillStyle='#4fd684';
      c.fillRect(px(bp.x)-3,px(bp.z)-3,6,6);
    }
  }
  for(let i=0;i<zombies.length;i++){
    const z=zombies[i];
    if(z.dead||Math.hypot(z.x-p.pos.x,z.z-p.pos.z)>60)continue;
    c.fillStyle='#ff4a3d';c.fillRect(px(z.x)-1.5,px(z.z)-1.5,3,3);
  }
  if(window.Missions)Missions.drawOnMinimap(c,p.pos,MAPS,MAPHALF,px);
  c.translate(S/2,S/2);c.rotate(p.inCar?-p.inCar.a:-(p.facing));
  c.fillStyle='#ffffff';c.beginPath();
  c.moveTo(0,-6);c.lineTo(4.5,5);c.lineTo(-4.5,5);c.closePath();c.fill();
  c.restore();
  c.fillStyle='#3fe0c8';c.font='bold 10px sans-serif';c.fillText('N',6,12);
}
function drawBigMap(){
  const c=document.getElementById('bmC').getContext('2d');
  c.fillStyle='#04060b';c.fillRect(0,0,600,600);
  const s=600/512;c.save();c.scale(s,s);
  c.drawImage(MAPC,0,0);
  if(players[0])c.drawImage(players[0].hud.fog,0,0);
  c.scale(1/s,1/s);
  if(window.Missions)Missions.drawOnBigMap(c,MAPS,MAPHALF,s);
  const px=function(w){return (w+MAPHALF)*MAPS*s;};
  for(let i=0;i<cars.length;i++){
    const cr=cars[i];
    c.fillStyle=cr.type==='jeep'?'#8fd45c':'#7fb4ff';
    c.fillRect(px(cr.x)-2,px(cr.z)-2,4,4);
  }
  for(let i=0;i<players.length;i++){
    const p=players[i];
    c.fillStyle=p.idx?'#ff4a3d':'#fff';
    c.save();c.translate(px(p.pos.x),px(p.pos.z));c.rotate(-(p.facing));
    c.beginPath();c.moveTo(0,-8);c.lineTo(6,6);c.lineTo(-6,6);c.closePath();c.fill();
    c.restore();
  }
  c.restore();
}

/* ================= UI GLOBAL ================= */
function toast(txt,cls){
  const d=document.createElement('div');
  d.className='toast '+(cls||'');
  d.textContent=txt;
  const container=document.getElementById('toasts');
  if(container){
    container.appendChild(d);
    while(container.children.length>5)container.firstChild.remove();
  }
  setTimeout(function(){d.remove();},3800);
}
window.toast=toast;
function announce(t,s){
  const at=document.getElementById('ann-t');
  const as=document.getElementById('ann-s');
  const a=document.getElementById('announce');
  if(!at||!a)return;
  at.textContent=t;as.textContent=s||'';
  a.classList.remove('hidden','pop');
  void a.offsetWidth;
  a.classList.add('pop');
  setTimeout(function(){a.classList.add('hidden');},2600);
}
window.announce=announce;
window.G={
  ui:{
    show:function(id){const el=document.getElementById(id);if(el)el.classList.remove('hidden');},
    hide:function(id){const el=document.getElementById(id);if(el)el.classList.add('hidden');}
  },
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
  const craft=document.getElementById('crafting-panel');
  if(craft)craft.style.display='none';
  if(state!=='PLAY')state='PLAY';
}
window.closePanels=closePanels;
function openShop(p){
  state='SHOP';G.ui.show('shop');sfx.click();
  const list=document.getElementById('shopList');list.innerHTML='';
  document.getElementById('shopMoney').textContent='$ '+p.money;
  for(let i=0;i<SHOP.length;i++){
    const id=SHOP[i][0],pr=SHOP[i][1];
    const it=ITEMS[id];
    const r=document.createElement('div');r.className='row';
    let desc='item';
    if(it.food)desc='+'+it.food+' hambre';
    else if(it.heal)desc='+'+it.heal+' vida';
    else if(it.cure)desc='cura infección';
    else if(it.fuel)desc='+55 combustible';
    else if(it.ammo)desc='+'+it.q+' munición';
    else if(it.material)desc='material de base';
    r.innerHTML='<div class="ic">'+it.i+'</div><div class="nm">'+it.n+'<small>'+desc+'</small></div><div class="ct">$'+pr+'</div>';
    const b=document.createElement('button');b.className='buy';b.textContent='COMPRAR';
    b.disabled=p.money<pr;
    b.onclick=(function(pid,ppr){return function(){if(p.money<ppr)return;p.money-=ppr;giveItem(p,pid);sfx.buy();openShop(p);};})(id,pr);
    r.appendChild(b);list.appendChild(r);
  }
}
function openInv(p){
  state='INV';G.ui.show('inv');sfx.click();
  document.getElementById('invMoney').textContent='$ '+p.money;
  document.getElementById('invLvl').textContent='NV '+p.level;
  document.getElementById('invXp').style.width=(p.killsLvl/need(p.level)*100)+'%';
  document.getElementById('invKills').textContent='☠ '+p.kills+' · sig: '+(need(p.level)-p.killsLvl)+' bajas';
  const list=document.getElementById('invList');list.innerHTML='';
  const consumables=['pan','croqueta','refresco','cafe','venda','medkit','antib','fuel','molotov','armor','chatarra','madera','rum','tabaco'];
  const h=document.createElement('h4');h.textContent='CONSUMIBLES Y MATERIALES';list.appendChild(h);
  for(let i=0;i<consumables.length;i++){
    const id=consumables[i];
    const it=ITEMS[id],n=p.items[id]||0;
    if(!n)continue;
    const r=document.createElement('div');r.className='row';
    r.innerHTML='<div class="ic">'+it.i+'</div><div class="nm">'+it.n+'</div><div class="ct">×'+n+'</div>';
    const b=document.createElement('button');b.className='buy';b.textContent='USAR';
    b.onclick=(function(pid){return function(){useItem(p,pid);openInv(p);};})(id);
    r.appendChild(b);list.appendChild(r);
  }
  const h2=document.createElement('h4');h2.textContent='MUNICIÓN';list.appendChild(h2);
  const am=document.createElement('div');am.className='row';
  am.innerHTML='<div class="ic">🔸</div><div class="nm">Reserva</div><div class="ct">🏹×'+(p.ammo.flecha||0)+' · 9mm×'+p.ammo.b9mm+' · 12×'+p.ammo.cart+' · 7.62×'+p.ammo.rifle+'</div>';
  list.appendChild(am);
  const h3=document.createElement('h4');h3.textContent='ARSENAL';list.appendChild(h3);
  for(let i=0;i<p.weapons.length;i++){
    const wid=p.weapons[i];
    const w=WEAPONS[wid];
    const r=document.createElement('div');r.className='row';
    const typeDesc=w.type==='melee'?'cuerpo a cuerpo':(w.type==='bow'?'arco':'cargador '+w.mag);
    r.innerHTML='<div class="ic">'+w.icon+'</div><div class="nm">'+w.name+'<small>'+typeDesc+'</small></div>';
    const isCurrent=p.weapons[p.cur]===wid;
    const b=document.createElement('button');
    b.className='buy equip'+(isCurrent?' on':'');
    b.textContent=isCurrent?'EN MANO':'EQUIPAR';
    b.onclick=(function(pid){return function(){equipWeapon(p,pid);openInv(p);};})(wid);
    r.appendChild(b);list.appendChild(r);
  }
}
function openMissions(){
  state='INV';G.ui.show('missions');sfx.click();
  const list=document.getElementById('missionList');list.innerHTML='';
  const all=window.Missions?Missions.getAll():[];
  if(all.length===0){list.innerHTML='<div class="krow">No hay misiones disponibles</div>';return;}
  const types={kill:'🎯',collect:'📦',escort:'🛡',explore:'🗺',rescue:'❤'};
  for(let i=0;i<all.length;i++){
    const m=all[i];
    const r=document.createElement('div');
    r.className='mission-row'+(m.status==='active'?' active':'')+(m.status==='completed'?' completed':'');
    const itemReward=m.reward.item?' · '+ITEMS[m.reward.item].i+' '+ITEMS[m.reward.item].n:'';
    const statusText=m.status==='available'?'disponible':(m.status==='active'?'activa ('+m.progress+'/'+m.goal+')':'completada');
    r.innerHTML='<div class="ttl">'+(types[m.type]||'?')+' '+m.title.toUpperCase()+'</div>'+
      '<div class="dsc">'+m.description+'</div>'+
      '<div class="rwd">💰 $'+m.reward.money+' · ⚡ '+m.reward.xp+' XP'+itemReward+'</div>'+
      '<div style="font-size:11px;color:#7e93a5;margin-top:4px">Dificultad: '+'★'.repeat(m.difficulty)+'☆'.repeat(3-m.difficulty)+' · '+statusText+'</div>';
    if(m.status==='available'){
      r.onclick=(function(mid){return function(){Missions.acceptMission(mid);openMissions();};})(m.id);
    }
    list.appendChild(r);
  }
}
function useItem(p,id){
  const it=ITEMS[id];if((p.items[id]||0)<=0)return;
  if(it.food){p.items[id]--;p.hunger=Math.min(100,p.hunger+it.food);if(it.stam)p.stam=Math.min(100,p.stam+it.stam);sfx.eat();return;}
  if(it.heal){p.items[id]--;p.hp=Math.min(100,p.hp+it.heal);sfx.heal();return;}
  if(it.cure){p.items[id]--;p.infected=false;sfx.heal();toast('Infección curada','good');return;}
  if(it.armor){p.items[id]--;toast('🛡 Chaleco equipado','good');return;}
  if(it.moral){p.items[id]--;toast('🥃 Moral subida','good');return;}
  if(it.fuel){
    if(p.inCar){p.items[id]--;p.inCar.fuel=Math.min(100,p.inCar.fuel+55);toast('⛽ Repostado','good');}
    else toast('Sube a un coche y pulsa G','bad');
    return;
  }
  if(it.throwable){
    p.items[id]--;toast('🔥 Molotov lanzado','good');
    for(let i=0;i<zombies.length;i++){
      const z=zombies[i];
      if(z.dead)continue;
      if(Math.hypot(z.x-p.pos.x,z.z-p.pos.z)<6)hurtZombie(z,it.dmg||60,p.idx);
    }
    return;
  }
}

/* ================= ENTRADA ================= */
if(window.Controls){
  Controls.on('keydown',function(code){
    if(window.AudioSystem)AudioSystem.resume();
    if(state==='MENU'){menuKeys({code:code});return;}
    if(state==='PLAY'){
      if(code==='KeyE')interactTarget(players[0]);
      if(mode===2&&code==='Enter')interactTarget(players[1]);
      if(code==='KeyR')startReload(players[0]);
      if(mode===2&&code==='Slash')startReload(players[1]);
      if(code==='KeyQ')quickEat(players[0]);
      if(code==='KeyF')quickHeal(players[0]);
      if(code==='KeyG'&&players[0].inCar){
        if((players[0].items.fuel||0)>0){
          players[0].items.fuel--;
          players[0].inCar.fuel=Math.min(100,players[0].inCar.fuel+55);
          toast('⛽ Repostado','good');
        }else toast('No tienes bidones','bad');
      }
      if(mode===2&&code==='Comma')quickEat(players[1]);
      if(mode===2&&code==='Period')quickHeal(players[1]);
      if(code==='Tab')openInv(players[0]);
      if(code==='KeyJ')openMissions();
      if(code==='KeyC'&&window.Crafting)Crafting.openCraftingUI(players[0]);
      if(code==='KeyK'&&window.Progression)Progression.openPanel();
      if(code==='KeyO'&&window.RadioSystem)RadioSystem.openMenu();
      if(code==='KeyB'&&window.BaseSystem)BaseSystem.openMenu(players[0]);
      if(code==='KeyM'){state='MAP';drawBigMap();G.ui.show('bigmap');}
      for(let i=1;i<=6;i++){
        if(code==='Digit'+i&&players[0].weapons[i-1])equipWeapon(players[0],players[0].weapons[i-1]);
      }
      if(code==='Escape')pauseGame();
    }else if(state==='PAUSE'){
      if(code==='Escape')resumeGame();
    }else if(state==='SHOP'||state==='INV'||state==='MAP'){
      if(code==='Escape'||code==='Tab'||code==='KeyM'||code==='KeyJ'||code==='KeyC'||code==='KeyK'||code==='KeyO'||code==='KeyB')closePanels();
    }
  });
}
addEventListener('mousedown',function(e){
  if(window.AudioSystem)AudioSystem.resume();
  if(state==='PLAY'&&document.pointerLockElement&&e.button===0)fireWeapon(players[0]);
});
addEventListener('mousemove',function(e){
  if(state!=='PLAY'||!document.pointerLockElement)return;
  const p=players[0];
  p.camYaw-=e.movementX*.0026;
  p.camPitch=clamp(p.camPitch+e.movementY*.0022,.08,1.05);
});
document.addEventListener('pointerlockchange',function(){
  if(!document.pointerLockElement&&state==='PLAY')pauseGame();
});
renderer.domElement.addEventListener('click',function(){
  if(window.AudioSystem)AudioSystem.resume();
  if(state==='PLAY'&&!document.pointerLockElement){
    if(document.hasFocus()){
      try{
        const promise=renderer.domElement.requestPointerLock();
        if(promise&&promise.catch)promise.catch(function(err){console.warn('Pointer lock:',err.message);});
      }catch(e){console.warn('Pointer lock error:',e);}
    }
  }
});
addEventListener('resize',function(){
  renderer.setSize(innerWidth,innerHeight);
  const w=mode===2?innerWidth/2:innerWidth;
  for(let i=0;i<players.length;i++){
    players[i].cam.aspect=w/innerHeight;
    players[i].cam.updateProjectionMatrix();
  }
  ambCam.aspect=innerWidth/innerHeight;
  ambCam.updateProjectionMatrix();
});

let menuSel=0;
const menuBtns=Array.prototype.slice.call(document.querySelectorAll('.mi'));
menuBtns.forEach(function(b,i){
  b.onclick=function(){if(window.AudioSystem)AudioSystem.resume();menuAction(b.dataset.a);};
  b.onmouseenter=function(){menuSel=i;paintMenu();};
});
function paintMenu(){menuBtns.forEach(function(b,i){b.classList.toggle('sel',i===menuSel);});}
function menuKeys(e){
  if(e.code==='ArrowDown'){menuSel=(menuSel+1)%menuBtns.length;paintMenu();sfx.click();}
  if(e.code==='ArrowUp'){menuSel=(menuSel+menuBtns.length-1)%menuBtns.length;paintMenu();sfx.click();}
  if(e.code==='Enter')menuAction(menuBtns[menuSel].dataset.a);
}
function menuAction(a){
  if(a==='how'){G.ui.show('howto');return;}
  if(a==='load'){
    const save=window.SaveSystem?SaveSystem.load():null;
    if(!save){toast('No hay partida guardada','bad');return;}
    startGame(save.mode||1,save);
    return;
  }
  if(a==='solo')startGame(1);
  if(a==='duo')startGame(2);
}
document.getElementById('btnResume').onclick=resumeGame;
document.getElementById('btnSave').onclick=function(){if(window.SaveSystem)SaveSystem.save(getGameState());};
document.getElementById('btnRestart').onclick=function(){startGame(mode);};
document.getElementById('btnMenu').onclick=function(){toMenu();};
document.getElementById('btnRetry').onclick=function(){startGame(mode);};
document.getElementById('btnMenu2').onclick=function(){toMenu();};
document.getElementById('btnVRetry').onclick=function(){G.ui.hide('victory');startGame(mode);};
document.getElementById('btnVMenu').onclick=function(){G.ui.hide('victory');toMenu();};
function pauseGame(){
  if(state!=='PLAY')return;
  state='PAUSE';
  document.exitPointerLock&&document.exitPointerLock();
  G.ui.show('pause');
}
function resumeGame(){
  G.ui.hide('pause');
  state='PLAY';
  renderer.domElement.focus();
  if(mode>=1&&document.hasFocus()){
    try{
      const promise=renderer.domElement.requestPointerLock();
      if(promise&&promise.catch)promise.catch(function(e){console.warn(e);});
    }catch(e){}
  }
}

/* ================= DÍA/NOCHE ================= */
function isNight(){return hour<6||hour>=19;}
function daylight(){return clamp(Math.sin((hour-6)/12*Math.PI)*1.3,0,1);}
function updateDayCycle(dt){
  dayT+=dt/240;
  if(dayT>=1){dayT-=1;day++;announce('DÍA '+day,'SIGUES VIVO');
    if(window.Achievements)Achievements.setStat('daysSurvived',day);
    if(window.NpcBrain&&window.NPCSystem){
      const all=NPCSystem.getAll();
      for(let i=0;i<all.length;i++){if(all[i].brain)NpcBrain.learn(all[i].brain,'survivedNight');}
    }
  }
  hour=dayT*24;
  const dl=daylight();
  const sunA=(hour-6)/12*Math.PI;
  sun.position.set(Math.cos(sunA)*90,Math.max(6,Math.sin(sunA)*90),34);
  sun.intensity=.15+.85*dl;
  sun.color.set(dl>.05?0xffe0b0:0x8fb4ff);
  hemi.intensity=.22+.55*dl;
  const dusk=clamp(1-Math.abs(Math.sin(sunA))*3,0,1)*(hour>5&&hour<20?1:0);
  skyC.setRGB(
    lerp(lerp(.035,.42,dl)+dusk*.5,0,0),
    lerp(.06,.66,dl)+dusk*.22,
    lerp(.13,.85,dl)
  );
  scene.background=skyC;
  scene.fog.color.copy(skyC).lerp(new THREE.Color(0xffffff), .2);
  for(let i=0;i<sideMats.length;i++)sideMats[i].emissiveIntensity=(1-dl)*.95;
  for(let i=0;i<parkLights.length;i++)parkLights[i].intensity=(1-dl)*1.1;
  if(Math.floor(prevHour)!==Math.floor(hour)){
    if(Math.floor(hour)===19){
      announce('ANOCHECE','LOS MUERTOS SE AGITAN');
      if(window.NpcBrain)NpcBrain.observe('nightfall');
    }
    if(Math.floor(hour)===6)announce('AMANECE','RESPIRA');
  }
  prevHour=hour;
  if(window.starsMesh)window.starsMesh.material.opacity=clamp((1-dl)*.8,0,.8);
  return dl;
}

/* ================= UPDATE ================= */
function updatePlayer(p,dt,dl){
  const h=p.hud;
  if(p.down){p.hp=0;return;}
  const p1=p.idx===0;
  p.fireCd-=dt;
  if(p.meleeT>0)p.meleeT-=dt;
  if(p.reloading>0){p.reloading-=dt;if(p.reloading<=0)finishReload(p);}
  if(p.hitFlash>0)p.hitFlash-=dt;else h.vig.classList.remove('on');
  
  const hungerMul=window.Progression?Progression.hungerMul():1;
  p.hunger=Math.max(0,p.hunger-dt*.24*hungerMul);
  const stamMax=100+(window.Progression?Progression.staminaBonus():0);
  p.stam=Math.min(stamMax,p.stam+12*dt);
  if(p.hunger<=0)p.hp-=2*dt;
  else if(p.hunger>70&&p.hp<100)p.hp=Math.min(100,p.hp+.8*dt);
  if(p.infected)p.hp-=1.5*dt;
  if(p.hp<=0){downPlayer(p);return;}
  
  if(p.inCar){updateDriving(p,dt,dl);return;}
  
  let mv;
  if(p1&&window.Controls){
    const input=Controls.getFootMovement(p.yaw,dt);
    if(input.rotation!==0){
      p.yaw=Controls.applyRotation(p.yaw,input.rotation,dt);
      p.facing=p.yaw;
    }
    mv=Controls.getWorldMovement(p.yaw,input.forward,input.strafe);
    const sprint=Controls.isDown('ShiftLeft')&&input.forward>0&&p.stam>2;
    if(mv.moving){
      const sp=sprint?9.2:6.2;
      const oldX=p.pos.x,oldZ=p.pos.z;
      tryMove(p.pos,mv.x*sp*dt,mv.z*sp*dt,.45);
      const distMoved=Math.hypot(p.pos.x-oldX,p.pos.z-oldZ);
      stepAccumulator+=distMoved;
      const stepDistance=sprint?1.1:.75;
      if(stepAccumulator>=stepDistance){
        stepAccumulator=0;
        const inPark=Math.abs(p.pos.x-blockC(3))<13&&Math.abs(p.pos.z-blockC(3))<13;
        const surface=inPark?'grass':'asphalt';
        if(sfx.footstep)sfx.footstep(surface,sprint);
      }
      if(input.forward!==0)p.facing=mv.facing;
      p.walkT+=dt*(sprint?13:9);
      if(sprint)p.stam=Math.max(0,p.stam-20*dt);
    }else{p.walkT*=.9;stepAccumulator=0;}
    if(Controls.onMouseDown())fireWeapon(p);
  }else{
    const f=(isDown('ArrowUp')?1:0)-(isDown('ArrowDown')?1:0);
    mv=Controls.getWorldMovement(p.yaw,f,0);
    if(isDown('ArrowLeft'))p.yaw+=2.5*dt;
    if(isDown('ArrowRight'))p.yaw-=2.5*dt;
    p.facing=p.yaw;
    if(mv.moving){tryMove(p.pos,mv.x*6.2*dt,mv.z*6.2*dt,.45);p.walkT+=dt*9;}
    else p.walkT*=.9;
    if(isDown('ShiftRight'))fireWeapon(p);
  }
  
  const cy=p1?p.camYaw:lerpAng(p.camYaw,p.yaw,1-Math.pow(.002,dt));
  const cd=6.4,cp=p1?p.camPitch:.42;
  p.cam.position.set(
    p.pos.x-Math.sin(cy)*Math.cos(cp)*cd,
    1.6+Math.sin(cp)*cd+1,
    p.pos.z-Math.cos(cy)*Math.cos(cp)*cd
  );
  if(p.cam.position.y<1)p.cam.position.y=1;
  p.cam.lookAt(p.pos.x,1.6,p.pos.z);
  
  const hu=p.human,sw=Math.sin(p.walkT)*.55;
  hu.ll.rotation.x=sw;hu.rl.rotation.x=-sw;
  const curWeaponType=WEAPONS[p.weapons[p.cur]].type;
  if(p.meleeT>0){hu.ra.rotation.x=-1.35-Math.sin((.25-p.meleeT)/.25*Math.PI)*1.2;}
  else if(curWeaponType==='gun'||curWeaponType==='bow'){hu.ra.rotation.x=-1.35;}
  hu.la.rotation.z=Math.sin(p.walkT*.5)*.08;
  hu.ra.rotation.z=-Math.sin(p.walkT*.5)*.08;
  p.human.g.position.copy(p.pos);
  p.human.g.rotation.y=p.facing;
  
  p.spot.intensity=(1-dl)*1.15;
  p.spot.position.set(p.pos.x,3,p.pos.z);
  p.spot.target.position.set(p.pos.x+Math.sin(cy)*8,0,p.pos.z+Math.cos(cy)*8);
}
function updateDriving(p,dt,dl){
  const c=p.inCar;
  const max=c.type==='jeep'?15:17;
  const p1=p.idx===0;
  const f=p1?((Controls.isDown('KeyW')?1:0)-(Controls.isDown('KeyS')?1:0)):0;
  const s=p1?((Controls.isDown('KeyD')?1:0)-(Controls.isDown('KeyA')?1:0)):0;
  c.speed+=f*(f>0?13:9)*dt;
  if(!f)c.speed-=c.speed*1.4*dt;
  c.speed=clamp(c.speed,-6,max);
  if(Math.abs(c.speed)>.4)c.a-=s*dt*1.7*Math.sign(c.speed)*clamp(Math.abs(c.speed)/8,.35,1);
  const nx=c.x+Math.sin(c.a)*c.speed*dt;
  const nz=c.z+Math.cos(c.a)*c.speed*dt;
  if(!inSolid(nx,nz,1.5)&&Math.abs(nx)<W.half-1&&Math.abs(nz)<W.half-1){c.x=nx;c.z=nz;}
  else{if(Math.abs(c.speed)>5)sfx.thud();c.speed*=-.25;}
  c.fuel=Math.max(0,c.fuel-Math.abs(c.speed)*.05*dt);
  if(Math.abs(c.speed)>5.5){
    for(let i=0;i<zombies.length;i++){
      const z=zombies[i];
      if(z.dead)continue;
      if(Math.hypot(z.x-c.x,z.z-c.z)<2.3){
        hurtZombie(z,60+Math.abs(c.speed)*5,p.idx);
        noiseAt(c.x,c.z,30);
      }
    }
  }
  c.g.position.set(c.x,0,c.z);c.g.rotation.y=c.a;
  p.pos.set(c.x,0,c.z);p.facing=c.a;
  const cy=lerpAng(p.camYaw,c.a,1-Math.pow(.004,dt));p.camYaw=cy;
  p.cam.position.set(c.x-Math.sin(cy)*9.5,4.6,c.z-Math.cos(cy)*9.5);
  p.cam.lookAt(c.x,1.4,c.z);
  p.spot.intensity=(1-dl)*1.3;
  p.spot.position.set(c.x+Math.sin(c.a)*2,2.2,c.z+Math.cos(c.a)*2);
  p.spot.target.position.set(c.x+Math.sin(c.a)*14,0,c.z+Math.cos(c.a)*14);
}
function updateZombies(dt){
  const night=isNight();
  const maxLevel=players.length?Math.max.apply(null,players.map(function(p){return p.level;})):0;
  const cap=Math.min(46,(18+maxLevel*3)*(night?1.5:1));
  zSpawnT-=dt;
  if(zSpawnT<=0&&players.length){
    zSpawnT=night?1.4:2.6;
    if(zombies.length<cap){
      const alive=players.filter(function(q){return !q.down;});
      if(alive.length){
        const p=pick(alive);
        const s=freeSpot(p.pos.x,p.pos.z,42,75);
        if(s)spawnZombie(s.x,s.z);
      }
    }
  }
  groanT-=dt;
  if(groanT<=0){
    groanT=rand(3,7);
    if(zombies.length&&players.length){
      let nearest=null,nd=1e9;
      for(let i=0;i<zombies.length;i++){
        const z=zombies[i];
        if(z.dead)continue;
        const d=Math.hypot(z.x-players[0].pos.x,z.z-players[0].pos.z);
        if(d<nd){nd=d;nearest=z;}
      }
      if(nearest&&nd<30&&window.AudioSystem){
        AudioSystem.zombieGroan3D(nearest.x,1.5,nearest.z,1-nd/30);
      }
    }
  }
  for(let i=noises.length-1;i>=0;i--){noises[i].t-=dt;if(noises[i].t<=0)noises.splice(i,1);}
  const speedMul=window.Weather?Weather.getZombieSpeedMul():1;
  for(let i=zombies.length-1;i>=0;i--){
    const z=zombies[i];
    if(z.dead){
      z.dieT+=dt;
      z.model.group.rotation.x=-Math.min(1,z.dieT*2.2)*Math.PI/2;
      if(z.dieT>6){scene.remove(z.model.group);zombies.splice(i,1);}
      continue;
    }
    if(z.flash>0)z.flash-=dt;
    z.atkCd-=dt;
    if(z.aggro>0)z.aggro-=dt;
    let tgt=null,td=1e9;
    for(let j=0;j<players.length;j++){
      const p=players[j];
      if(p.down)continue;
      const d=Math.hypot(p.pos.x-z.x,p.pos.z-z.z);
      if(d<td){td=d;tgt=p;}
    }
    if(window.NPCSystem){
      const all=NPCSystem.getAll();
      for(let j=0;j<all.length;j++){
        const n=all[j];
        if(n.dead||!n.recruited)continue;
        const d=Math.hypot(n.x-z.x,n.z-z.z);
        if(d<td){td=d;tgt=n;}
      }
    }
    const aggroR=z.aggroRange||(night?30:15);
    let sp=0;
    if(tgt&&(td<aggroR||z.aggro>0)){
      z.state='chase';
      const tx=tgt.pos?tgt.pos.x:tgt.x;
      const tz2=tgt.pos?tgt.pos.z:tgt.z;
      const dx=tx-z.x,dz=tz2-z.z,d=Math.hypot(dx,dz)||1;
      sp=Math.min(5.2,(z.speed||3.3)+maxLevel*.06)*speedMul;
      tryMove(z,dx/d*sp*dt,dz/d*sp*dt,.45);
      z.yaw=Math.atan2(dx,dz);
      if(d<1.6&&z.atkCd<=0){
        z.atkCd=.9;
        if(tgt.inCar){tgt.inCar.speed*=.82;sfx.thud();}
        else if(tgt.pos){
          hurtPlayer(tgt,(z.zdmg||irand(7,13)),z.x,z.z);
          const infRisk=(window.Progression?Progression.infectionRiskMul():1)*.16;
          if(Math.random()<infRisk&&!tgt.infected){
            tgt.infected=true;toast('☣ Infectado','bad');
          }
        }else if(window.NPCSystem){
          NPCSystem.hurt(tgt,irand(7,13));
        }
      }
    }else{
      z.state='wander';
      for(let j=0;j<noises.length;j++){
        const n=noises[j];
        if(Math.hypot(n.x-z.x,n.z-z.z)<n.r){
          z.state='chase';z.tx=n.x;z.tz=n.z;z.aggro=8;break;
        }
      }
      z.wt-=dt;
      if(z.wt<=0){
        z.wt=rand(2,5);
        const s2=freeSpot(z.x,z.z,1,9);
        if(s2){z.tx=s2.x;z.tz=s2.z;}
      }
      const dx=z.tx-z.x,dz=z.tz-z.z,d=Math.hypot(dx,dz);
      if(d>1){
        sp=(z.speed||1.5)*speedMul;
        tryMove(z,dx/d*sp*dt,dz/d*sp*dt,.45);
        z.yaw=Math.atan2(dx,dz);
      }
    }
    for(let j=i+1;j<zombies.length;j++){
      const o=zombies[j];if(o.dead)continue;
      const dx=o.x-z.x,dz=o.z-z.z,d=Math.hypot(dx,dz);
      if(d<.8&&d>0){
        const push=(0.8-d)/2;
        z.x-=dx/d*push;z.z-=dz/d*push;
        o.x+=dx/d*push;o.z+=dz/d*push;
      }
    }
    z.ph+=dt*(sp>0?sp*2.6:2);
    
    if(z.model.isGLB&&z.model.mixer)z.model.mixer.update(dt);
    
    if(window.ZombiesX){
      ZombiesX.updateSpecial(z,dt,players,
        function(zom,p,dmg){
          if(sfx.spit)sfx.spit();
          hurtPlayer(p,dmg,zom.x,zom.z);
        },
        function(zom){
          if(sfx.screamAlert)sfx.screamAlert();
          if(window.AudioSystem)AudioSystem.zombieScream3D(zom.x,1.5,zom.z);
          for(let k=0;k<zombies.length;k++){
            const o=zombies[k];
            if(o.dead||o===zom)continue;
            const d=Math.hypot(o.x-zom.x,o.z-zom.z);
            if(d<30&&players.length){
              o.aggro=12;o.tx=players[0].pos.x;o.tz=players[0].pos.z;
            }
          }
          toast('📢 ¡Un Chillón llamó a la horda!','bad');
        }
      );
    }
    
    if(sp>0&&players.length){
      const nearest=players[0];
      const distToPlayer=Math.hypot(z.x-nearest.pos.x,z.z-nearest.pos.z);
      if(distToPlayer<15&&Math.random()<dt*sp*.5){
        if(sfx.zombieStep)sfx.zombieStep();
      }
    }
    
    z.model.group.position.set(z.x,0,z.z);
    z.model.group.rotation.y=z.yaw;
    if(!z.model.isGLB&&z.model.human){
      z.model.human.ll.rotation.x=Math.sin(z.ph)*.5;
      z.model.human.rl.rotation.x=-Math.sin(z.ph)*.5;
      z.model.human.la.rotation.x=-1.1+Math.sin(z.ph*.7)*.12;
      z.model.human.ra.rotation.x=-1.2-Math.sin(z.ph*.7)*.12;
    }
    const show=z.hp<z.maxhp;
    z.bar.grp.visible=show;
    if(show)z.bar.fg.scale.x=.95*clamp(z.hp/z.maxhp,0,1);
    if(players.length){
      let mind=1e9;
      for(let j=0;j<players.length;j++){
        mind=Math.min(mind,Math.hypot(players[j].pos.x-z.x,players[j].pos.z-z.z));
      }
      if(mind>130&&!z.menu){scene.remove(z.model.group);zombies.splice(i,1);}
    }
  }
}
function updateWorldFx(dt){
  for(let i=tracers.length-1;i>=0;i--){
    const t=tracers[i];t.t-=dt;t.l.material.opacity=t.t/.06;
    if(t.t<=0){scene.remove(t.l);tracers.splice(i,1);}
  }
  for(let i=bloods.length-1;i>=0;i--){
    const b=bloods[i];b.t-=dt;
    if(b.t<=0){scene.remove(b.m);bloods.splice(i,1);}
    else if(b.t<4)b.m.material.opacity=b.t/4*.6;
  }
  for(let i=crates.length-1;i>=0;i--){
    const c=crates[i];c.m.rotation.y+=dt*2;
    c.m.position.y=.16+Math.sin(performance.now()*.004)*.06;
    for(let j=0;j<players.length;j++){
      const p=players[j];
      if(!p.down&&Math.hypot(p.pos.x-c.x,p.pos.z-c.z)<1.3){
        lootRoll(p,ZT,irand(1,2));
        scene.remove(c.m);crates.splice(i,1);break;
      }
    }
  }
  flashL.intensity=Math.max(0,flashL.intensity-dt*16);
}
function hintFor(p){
  if(p.down)return 'ESPERA A QUE TE REANIMEN…';
  if(p.inCar){
    let h='<em>'+(p.idx?'ENTER':'E')+'</em> BAJAR';
    if((p.items.fuel||0)>0)h+=' · <em>G</em> REPOSTAR';
    return h;
  }
  if(window.LomaSystem){
    const lh=LomaSystem.getHint(p);
    if(lh)return lh;
  }
  if(window.DialogueSystem&&window.NPCSystem){
    const dlgHint=DialogueSystem.getHint(p,NPCSystem.getAll());
    if(dlgHint)return dlgHint;
  }
  if(window.BaseSystem){
    const bh=BaseSystem.getHint(p);
    if(bh)return bh;
  }
  if(window.Buildings){
    const doorHint=Buildings.getHint(p);
    if(doorHint)return doorHint;
  }
  if(window.Missions){
    const all=Missions.getAll();
    for(let i=0;i<all.length;i++){
      const m=all[i];
      if(m.status==='available'&&Math.hypot(m.x-p.pos.x,m.z-p.pos.z)<3)
        return '<em>'+(p.idx?'ENTER':'E')+'</em> ACEPTAR: '+m.title;
    }
  }
  if(window.NPCSystem){
    const all=NPCSystem.getAll();
    for(let i=0;i<all.length;i++){
      const n=all[i];
      if(n.dead||n.recruited)continue;
      if(Math.hypot(n.x-p.pos.x,n.z-p.pos.z)<2.8)
        return '<em>'+(p.idx?'ENTER':'E')+'</em> RECLUTAR: '+n.name;
    }
  }
  for(let i=0;i<players.length;i++){
    const q=players[i];
    if(q!==p&&q.down&&p.pos.distanceTo(q.pos)<2.6)
      return '<em>'+(p.idx?'ENTER':'E')+'</em> REANIMAR';
  }
  let bc=null,bd=3.6;
  for(let i=0;i<cars.length;i++){
    const c=cars[i];
    const d=Math.hypot(c.x-p.pos.x,c.z-p.pos.z);
    if(d<bd){bd=d;bc=c;}
  }
  if(bc){
    if(p.level<bc.req)return '🔒 REQUIERE NV '+bc.req;
    return bc.searched?'<em>E</em> SUBIR':'<em>E</em> MALETERO';
  }
  if(window.shopPos&&p.pos.distanceTo(window.shopPos)<4)return '<em>E</em> CAFETERÍA';
  return '';
}
function updateHUD(p,dl){
  const h=p.hud;
  h.clockD.textContent='DÍA '+day;
  h.clockH.textContent=(isNight()?'🌙 ':'☀ ')+String(Math.floor(hour)).padStart(2,'0')+':'+String(Math.floor(hour%1*60)).padStart(2,'0');
  h.lvl.textContent='NV '+p.level;
  h.xp.style.width=(p.killsLvl/need(p.level)*100)+'%';
  h.kills.textContent='☠ '+p.kills+' · SIG: '+(need(p.level)-p.killsLvl);
  h.inf.classList.toggle('hidden',!p.infected);
  h.hp.style.transform='scaleX('+(p.hp/100)+')';
  h.hun.style.transform='scaleX('+(p.hunger/100)+')';
  h.sta.style.transform='scaleX('+(p.stam/100)+')';
  h.vig.classList.toggle('low',p.hp<28&&!p.down);
  const w=WEAPONS[p.weapons[p.cur]];
  h.wname.textContent=w.icon+' '+w.name.toUpperCase();
  if(w.type==='gun'){h.ammo.textContent=(p.mag[p.weapons[p.cur]]||0);h.ammoR.textContent='/'+p.ammo[w.ammo];}
  else if(w.type==='bow'){h.ammo.textContent=(p.ammo.flecha||0);h.ammoR.textContent='🏹';}
  else{h.ammo.textContent='∞';h.ammoR.textContent='';}
  if(p.reloading>0)h.wname.textContent='↻ RECARGANDO';
  h.money.textContent='$ '+p.money;
  const deg=((p.yaw*180/Math.PI-180+720)%360);
  const dirs=['N','NE','E','SE','S','SO','O','NO'];
  h.comp.innerHTML='<b>'+dirs[Math.round(deg/45)%8]+'</b> '+Math.round(deg)+'°';
  const hint=hintFor(p);
  h.hint.style.display=hint?'block':'none';
  h.hint.innerHTML=hint;
  h.down.classList.toggle('hidden',!p.down);
  if(window.Missions){
    const active=Missions.getActive();
    if(active){
      h.missionHud.classList.remove('hidden');
      h.missionDesc.textContent=active.title+' ('+active.progress+'/'+active.goal+')';
      h.missionProg.style.width=(active.progress/active.goal*100)+'%';
    }else h.missionHud.classList.add('hidden');
  }
  if(window.NPCSystem){
    const all=NPCSystem.getAll();
    const npcs=all.filter(function(n){return n.recruited&&!n.dead;});
    if(npcs.length>0){
      h.squadHud.classList.remove('hidden');
      let html='';
      for(let i=0;i<npcs.length;i++){
        const n=npcs[i];
        html+='<div class="squad-member"><span class="nm">'+n.name.split(' ')[0]+' (NV'+n.level+')</span><span class="st">'+Math.round(n.hp)+'/'+n.maxHp+'</span></div>';
      }
      h.squadMembers.innerHTML=html;
    }else h.squadHud.classList.add('hidden');
  }
  if(window.Weather){
    const w2=Weather.getCurrent();
    const labels={clear:'☀ DESPEJADO',cloudy:'☁ NUBLADO',rain:'🌧 LLUVIA',fog:'🌫 NIEBLA',storm:'⛈ TORMENTA'};
    h.weatherHud.classList.remove('hidden');
    h.weatherHud.textContent=labels[w2]||w2;
  }
  reveal(p);drawMini(p);
}

/* ================= RENDER ================= */
function render(){
  if(state==='MENU'||state==='INTRO'||state==='INTERIOR'||players.length===0){
    renderer.setViewport(0,0,innerWidth,innerHeight);
    renderer.setScissorTest(false);
    renderer.render(scene,ambCam);
    return;
  }
  renderer.setScissorTest(true);
  for(let i=0;i<players.length;i++){
    const p=players[i];
    const w=mode===2?Math.floor(innerWidth/2):innerWidth;
    const x=i*w;
    renderer.setViewport(x,0,w,innerHeight);
    renderer.setScissor(x,0,w,innerHeight);
    renderer.render(scene,p.cam);
  }
}

/* ================= SAVE STATE ================= */
function getGameState(){
  return {
    mode:mode,day:day,dayT:dayT,hour:hour,
    players:players.map(function(p){
      return {idx:p.idx,pos:{x:p.pos.x,z:p.pos.z},yaw:p.yaw,
        hp:p.hp,hunger:p.hunger,stam:p.stam,infected:p.infected,
        money:p.money,level:p.level,kills:p.kills,killsLvl:p.killsLvl,
        weapons:p.weapons,cur:p.cur,ammo:p.ammo,mag:p.mag,items:p.items};
    })
  };
}

/* ================= PANTALLA DE VICTORIA ================= */
function showVictory(){
  state='OVER';
  document.exitPointerLock&&document.exitPointerLock();
  let totalKills=0,totalLevel=0;
  for(let i=0;i<players.length;i++){
    totalKills+=players[i].kills;
    totalLevel+=players[i].level;
  }
  const allies=window.NPCSystem?NPCSystem.recruitedCount():0;
  document.getElementById('vD').textContent=day;
  document.getElementById('vK').textContent=totalKills;
  document.getElementById('vL').textContent=totalLevel;
  document.getElementById('vN').textContent=allies;
  if(window.Achievements){
    Achievements.unlockSummit();
    const achEl=document.getElementById('vAchievements');
    if(achEl){
      const all=Achievements.getUnlocked();
      let html='';
      for(let i=0;i<all.length;i++){
        const a=all[i];
        html+='<div class="v-ach '+(a.unlocked?'unlocked':'locked')+'">'+
          '<div class="ach-icon">'+a.icon+'</div>'+
          '<div class="ach-info"><div class="ach-name">'+a.name+'</div>'+
          '<div class="ach-desc">'+a.desc+'</div></div></div>';
      }
      achEl.innerHTML=html;
    }
  }
  if(window.SaveSystem)SaveSystem.updateRecord(totalKills,totalLevel,day);
  G.ui.show('victory');
}
window.showVictory=showVictory;

/* ================= LOOP ================= */
let lastT=performance.now();
function loop(){
  requestAnimationFrame(loop);
  const now=performance.now();
  const dt=Math.min(.05,(now-lastT)/1000);
  lastT=now;
  gameRunningTime+=dt;
  
  if(state==='MENU'||state==='INTRO'||state==='INTERIOR'){
    camMenuA+=dt*.08;
    ambCam.position.set(blockC(3)+Math.sin(camMenuA)*46,20+Math.sin(camMenuA*.5)*5,blockC(3)+Math.cos(camMenuA)*46);
    ambCam.lookAt(blockC(3),3,blockC(3));
    updateDayCycle(dt);
    for(let i=0;i<zombies.length;i++){
      const z=zombies[i];
      if(z.dead)continue;
      z.wt-=dt;
      if(z.wt<=0){z.wt=rand(2,5);z.tx=z.x+rand(-9,9);z.tz=z.z+rand(-9,9);}
      const dx=z.tx-z.x,dz=z.tz-z.z,d=Math.hypot(dx,dz);
      if(d>1){tryMove(z,dx/d*1.2*dt,dz/d*1.2*dt,.45);z.yaw=Math.atan2(dx,dz);}
      z.ph+=dt*3;
      if(!z.model.isGLB&&z.model.human){
        z.model.human.ll.rotation.x=Math.sin(z.ph)*.4;
        z.model.human.rl.rotation.x=-Math.sin(z.ph)*.4;
      }
      z.model.group.position.set(z.x,0,z.z);
      z.model.group.rotation.y=z.yaw;
    }
    updateWorldFx(dt);
    if(window.CityFX)CityFX.update(dt,daylight(),isNight(),null);
    if(window.AudioSystem)AudioSystem.updateMusic(dt);
  }else if(state==='PLAY'){
    const dl=updateDayCycle(dt);
    for(let i=0;i<players.length;i++)updatePlayer(players[i],dt,dl);
    updateZombies(dt);
    updateArrows(dt);
    updateWorldFx(dt);
    if(players[0])updateAimTrajectory(players[0]);
    
    if(players[0]){
      const p0=players[0];
      if(window.AudioSystem){
        const fx=Math.sin(p0.camYaw),fz=Math.cos(p0.camYaw);
        AudioSystem.setListener(p0.pos.x,p0.pos.y,p0.pos.z,fx,fz);
        AudioSystem.updateMusic(dt);
      }
      if(window.NoiseSystem){
        if(Controls.isDown('ShiftLeft')&&Controls.isDown('KeyW')){
          NoiseSystem.add(0.5*dt*60,p0);
        }
        NoiseSystem.update(dt,p0.pos,zombies);
      }
      if(window.HordeSystem)HordeSystem.update(dt,day,isNight(),p0.pos,function(x,z){spawnHordeZombie(x,z);});
      if(window.RadioSystem){
        RadioSystem.update(dt);
        if(AudioSystem.isRadioOn()&&window.Achievements)Achievements.setStat('radioOn',true);
      }
      if(window.BaseSystem)BaseSystem.update(dt,zombies,p0);
      if(window.LomaSystem)LomaSystem.update(dt,p0,day);
      if(window.CityFX)CityFX.update(dt,dl,isNight(),p0.pos);
      
      if(window.Achievements&&window.NPCSystem){
        Achievements.setStat('npcsRecruited',NPCSystem.recruitedCount());
      }
      if(window.NpcBrain&&window.NPCSystem){
        const zNear=zombies.some(function(z){return !z.dead&&players[0]&&Math.hypot(z.x-players[0].pos.x,z.z-players[0].pos.z)<20;});
        NpcBrain.update(dt,{isNight:isNight(),inCombat:zNear,justLearned:false});
      }
    }
    
    if(window.NPCSystem)NPCSystem.update(dt,players,zombies,players[0]&&players[0].pos);
    if(window.Weather)Weather.update(dt,scene,players[0]?players[0].pos:{x:0,z:0});
    if(window.Buildings)Buildings.update(dt);
    if(window.WeatherFX)WeatherFX.update(dt);
    if(window.Bosses){
      Bosses.update(dt,players,zombies);
      const maxLvl=players.length?Math.max.apply(null,players.map(function(p){return p.level;})):0;
      if(Bosses.shouldSpawnBoss(maxLvl)&&players[0])Bosses.spawnBoss(players[0].pos,scene);
    }
    for(let i=0;i<players.length;i++)updateHUD(players[i],dl);
    if(window.SaveSystem)SaveSystem.tickAutoSave(getGameState(),gameRunningTime);
  }
  render();
}

/* ================= CICLO DE JUEGO ================= */
async function startGame(m,saveData){
  if(window.AudioSystem)AudioSystem.resume();
  mode=m;
  for(let i=0;i<zombies.length;i++)scene.remove(zombies[i].model.group);
  zombies=[];
  for(let i=0;i<crates.length;i++)scene.remove(crates[i].m);
  crates=[];
  for(let i=0;i<bloods.length;i++)scene.remove(bloods[i].m);
  bloods=[];
  for(let i=0;i<arrows.length;i++)scene.remove(arrows[i].mesh);
  arrows=[];
  for(let i=0;i<stuckArrows.length;i++)scene.remove(stuckArrows[i].mesh);
  stuckArrows=[];
  stepAccumulator=0;
  noises=[];
  if(window.Bosses){
    const all=Bosses.getAll();
    for(let i=0;i<all.length;i++)scene.remove(all[i].group);
  }
  for(let i=0;i<players.length;i++){
    scene.remove(players[i].human.g);
    scene.remove(players[i].spot);
    scene.remove(players[i].spot.target);
  }
  players=[];
  document.getElementById('hudroot').innerHTML='';
  document.getElementById('divider').classList.toggle('hidden',m===1);
  
  if(window.Achievements)Achievements.init();
  if(window.NpcBrain)NpcBrain.clear();
  
  for(let i=0;i<m;i++){
    const p=newPlayer(i);
    players.push(p);
    equipWeapon(p,'arco');
  }
  const w=mode===2?innerWidth/2:innerWidth;
  for(let i=0;i<players.length;i++){
    players[i].cam.aspect=w/innerHeight;
    players[i].cam.updateProjectionMatrix();
  }
  
  if(saveData){
    day=saveData.day;dayT=saveData.dayT;hour=saveData.hour;
    for(let i=0;i<saveData.players.length;i++){
      const sp=saveData.players[i];
      if(!players[i])continue;
      const p=players[i];
      p.pos.set(sp.pos.x,0,sp.pos.z);
      p.yaw=sp.yaw;p.facing=sp.yaw;p.camYaw=sp.yaw;
      p.hp=sp.hp;p.hunger=sp.hunger;p.stam=sp.stam;
      p.infected=sp.infected;p.money=sp.money;
      p.level=sp.level;p.kills=sp.kills;p.killsLvl=sp.killsLvl;
      p.weapons=sp.weapons;p.cur=sp.cur;
      p.ammo=sp.ammo;p.mag=sp.mag;p.items=sp.items;
      p.human.g.position.copy(p.pos);
      p.human.g.rotation.y=p.yaw;
      equipWeapon(p,p.weapons[p.cur]);
    }
    toast('Partida cargada','good');
  }else{
    dayT=.5;day=1;hour=12;prevHour=12;zSpawnT=2;
    for(let i=0;i<8;i++){
      const s=freeSpot(players[0].pos.x,players[0].pos.z,25,70);
      if(s)await spawnZombie(s.x,s.z);
    }
    if(window.NPCSystem){
      for(let i=0;i<4;i++){
        const s=freeSpot(blockC(3),blockC(3),30,80);
        if(s)NPCSystem.createNPC(s.x,s.z,scene);
      }
      if(window.NpcBrain){
        const allNpcs=NPCSystem.getAll();
        for(let i=0;i<allNpcs.length;i++){
          const brain=NpcBrain.createNpc();
          if(brain){
            allNpcs[i].brain=brain;
            allNpcs[i].name=brain.name+' ('+brain.profession.name+')';
          }
        }
      }
    }
    if(window.Missions)Missions.generateInitialMissions({x:0,z:0},W.size);
    if(window.BaseSystem)BaseSystem.reset();
    if(window.LomaSystem)LomaSystem.reset();
    announce('DÍA 1','HOLGUÍN · SOBREVIVE');
  }
  
  for(let i=0;i<players.length;i++){
    const p=players[i];
    p.hud.fogctx.fillStyle='#000';
    p.hud.fogctx.globalCompositeOperation='source-over';
    p.hud.fogctx.fillRect(0,0,512,512);
  }
  
  document.getElementById('menu').classList.add('hidden');
  G.ui.hide('howto');G.ui.hide('pause');G.ui.hide('shop');
  G.ui.hide('inv');G.ui.hide('bigmap');G.ui.hide('missions');G.ui.hide('over');
  if(window.Weather&&window.Weather.init)Weather.init(scene);
  if(window.Weather&&window.Weather.set)Weather.set('clear');
  
  if(!saveData&&window.Intro){
    state='INTRO';
    Intro.play(function(){
      state='PLAY';
      // Forzar cámara y posición del jugador al terminar la intro
      if(players[0]){
        const p=players[0];
        p.cam.aspect=(mode===2?innerWidth/2:innerWidth)/innerHeight;
        p.cam.updateProjectionMatrix();
        // Colocar la cámara detrás del jugador inmediatamente
        const cy=p.camYaw, cd=6.4, cp=p.camPitch;
        p.cam.position.set(
          p.pos.x-Math.sin(cy)*Math.cos(cp)*cd,
          1.6+Math.sin(cp)*cd+1,
          p.pos.z-Math.cos(cy)*Math.cos(cp)*cd
        );
        p.cam.lookAt(p.pos.x,1.6,p.pos.z);
        // Asegurar que el avatar sea visible
        p.human.g.visible=true;
      }
      renderer.render(scene, players[0]?players[0].cam:ambCam);
      setTimeout(function(){toast('🏹 Empiezas con arco y 50 flechas');},1000);
      setTimeout(function(){toast('Mata zombis para recuperar flechas');},5000);
      setTimeout(function(){toast('K skills · O radio · B base · J misiones');},9000);
    });
  }else{
    state='PLAY';
    setTimeout(function(){toast('🏹 Empiezas con arco y 50 flechas');},2000);
  }
}

function toMenu(){
  state='MENU';
  G.ui.hide('over');G.ui.hide('pause');G.ui.hide('victory');
  document.getElementById('menu').classList.remove('hidden');
  for(let i=0;i<players.length;i++){
    scene.remove(players[i].human.g);
    scene.remove(players[i].spot);
    scene.remove(players[i].spot.target);
  }
  players=[];
  document.getElementById('hudroot').innerHTML='';
  document.getElementById('divider').classList.add('hidden');
  document.exitPointerLock&&document.exitPointerLock();
  loadRecord();
  const loadBtn=document.querySelector('[data-a="load"]');
  if(loadBtn&&window.SaveSystem){
    loadBtn.querySelector('small').textContent=SaveSystem.hasSave()?'PARTIDA ENCONTRADA':'SIN PARTIDAS';
  }
}
function gameOver(){
  state='OVER';
  document.exitPointerLock&&document.exitPointerLock();
  let totalKills=0,totalLevel=0,totalMoney=0;
  for(let i=0;i<players.length;i++){
    totalKills+=players[i].kills;
    totalLevel+=players[i].level;
    totalMoney+=players[i].money;
  }
  document.getElementById('ovD').textContent=day;
  document.getElementById('ovK').textContent=totalKills;
  document.getElementById('ovL').textContent=totalLevel;
  document.getElementById('ovM').textContent='$'+totalMoney;
  document.getElementById('ovSub').textContent=mode===2?'EL ESCUADRÓN HA CAÍDO':'LA CIUDAD TE RECLAMA';
  if(window.SaveSystem){
    const rec=SaveSystem.updateRecord(totalKills,totalLevel,day);
    document.getElementById('ovNew').classList.toggle('hidden',!rec.isNew);
    SaveSystem.deleteSave();
  }
  G.ui.show('over');
}
function loadRecord(){
  const b=window.SaveSystem?SaveSystem.getRecord():{k:0,lv:0,d:0};
  document.getElementById('rk').textContent=b.k;
  document.getElementById('rl').textContent=b.lv;
  document.getElementById('rd').textContent=b.d;
}

/* ================= FIX DIÁLOGO NPC (parche universal) ================= */
(function patchDialogueClose(){
  // Sobrescribir tryTalk para añadir cierre con ESC y liberar pointer lock
  if(window.DialogueSystem && DialogueSystem.tryTalk){
    const originalTryTalk = DialogueSystem.tryTalk;
    let dialogueKeyHandler = null;
    
    DialogueSystem.tryTalk = function(player, npcs){
      const result = originalTryTalk.call(DialogueSystem, player, npcs);
      
      if(result){
        // 🔓 Liberar pointer lock para poder hacer clic en botones del diálogo
        if(document.exitPointerLock){
          try{ document.exitPointerLock(); }catch(e){}
        }
        
        // Buscar el contenedor del diálogo (puede tener varios IDs/clases)
        setTimeout(function(){
          const dialogueEl = document.querySelector('#dialogue, #dialog, .dialogue, .dialog, [class*="dialogue"], [class*="dialog"]');
          if(!dialogueEl) return;
          
          // Añadir botón de cerrar si no existe
          if(!dialogueEl.querySelector('.dialogue-close-btn, .close-btn, [data-close]')){
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialogue-close-btn';
            closeBtn.textContent = '✕ CERRAR (ESC)';
            closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:#ff4a3d;color:#fff;border:none;padding:8px 16px;cursor:pointer;font-family:inherit;z-index:100;font-size:13px;letter-spacing:1px;';
            closeBtn.onclick = function(){
              closeDialogue();
            };
            
            // Intentar añadir al contenedor principal
            const container = dialogueEl.querySelector('.card, .dialog-content, .content') || dialogueEl;
            if(container.style) container.style.position = container.style.position || 'relative';
            container.appendChild(closeBtn);
          }
        }, 100);
        
        // 🎮 ESC para cerrar
        if(dialogueKeyHandler) document.removeEventListener('keydown', dialogueKeyHandler);
        dialogueKeyHandler = function(e){
          if(e.code === 'Escape' || e.code === 'KeyE'){
            e.preventDefault();
            closeDialogue();
          }
        };
        document.addEventListener('keydown', dialogueKeyHandler, true);
      }
      return result;
    };
    
    function closeDialogue(){
      // Buscar y ocultar todos los posibles contenedores de diálogo
      const candidates = document.querySelectorAll('#dialogue, #dialog, .dialogue, .dialog, [class*="dialogue"], [class*="dialog"]');
      candidates.forEach(function(el){
        if(el.classList) el.classList.add('hidden');
        if(el.style) el.style.display = 'none';
      });
      
      // Llamar a la función original de cierre si existe
      if(DialogueSystem.close) DialogueSystem.close();
      if(DialogueSystem.endDialogue) DialogueSystem.endDialogue();
      if(DialogueSystem.hideDialogue) DialogueSystem.hideDialogue();
      
      // Limpiar handler
      if(dialogueKeyHandler){
        document.removeEventListener('keydown', dialogueKeyHandler, true);
        dialogueKeyHandler = null;
      }
      
      // 🔒 Re-activar pointer lock
      const el = window.renderer_global && window.renderer_global.domElement;
      if(el && document.hasFocus()){
        try{
          const p = el.requestPointerLock();
          if(p && p.catch) p.catch(function(){});
        }catch(e){}
      }
    }
    
    // Exponer closeDialogue globalmente por si otros módulos la necesitan
    window.closeNpcDialogue = closeDialogue;
  }
})();

/* ================= ARRANQUE ================= */
buildCity();
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

(async function(){
  for(let i=0;i<6;i++){
    const a=rand(0,TAU);
    await spawnZombie(blockC(3)+Math.sin(a)*rand(8,26),blockC(3)+Math.cos(a)*rand(8,26),true);
  }
  loadRecord();
  paintMenu();
  loop();
})();
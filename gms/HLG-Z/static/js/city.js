'use strict';
/* CIUDAD REAL DE HOLGUÍN — parques y calles con nombre */
window.CityBuilder = (function(){
  var CW = { n:8, B:26, R:12 };
  CW.size = CW.R*(CW.n+1) + CW.B*CW.n;
  CW.half = CW.size/2;
  var TAU = Math.PI*2;
  function cB(i){ return -CW.half + CW.R + i*(CW.B+CW.R) + CW.B/2; }
  function rC(i){ return -CW.half + CW.R/2 + i*(CW.B+CW.R); }
  function rand(a,b){ return a+Math.random()*(b-a); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function T(){ return window.scene_global; }
  function SOL(){ return window.solids_global; }
  function CARS(){ return window.cars_global; }

  var PARKS = [
    [3,3,'PARQUE CALIXTO GARCÍA', true],
    [3,2,'PARQUE C. M. DE CÉSPEDES'],
    [3,1,'PARQUE RUBÉN BRAVO'],
    [3,0,'PARQUE PAQUITO GONZÁLEZ'],
    [4,4,'PARQUE JULIO G. DE PERALTA'],
    [3,5,'PARQUE JOSÉ MARTÍ (1941)'],
    [2,3,'PARQUE SOTOMAYOR']
  ];
  var CEMETERY = [2,5,'CEMENTERIO'];
  var LANDMARKS = [
    [0,2,'HOSPITAL LENÍN',0xe8e4d4],
    [0,4,'FAC. CIENCIAS MÉDICAS',0xe8e4d4],
    [1,1,'ATENEO DEPORTIVO',0x9fb6a4],
    [1,2,'CRUZ ROJA',0xe8e4d4],
    [1,3,'PIZZERÍA ROMA',0xd9c08f],
    [2,2,'TEATRO EDDY SUÑOL',0xc98fb6],
    [2,4,'REST. LA GRANJITA',0xd9c08f],
    [4,2,'HOTEL TURQUINO',0xd9d9d9],
    [4,3,'MUSEO C. NATAL',0xd9c08f],
    [6,2,'HOSP. PEDIÁTRICO',0xe8e4d4],
    [7,2,'HOTEL PERNIK',0xd9d9d9],
    [7,3,'ESTADIO C. GARCÍA',0x9fb6a4],
    [6,4,'MERCADO',0xd9c08f]
  ];
  var V_STREETS = ['COLÓN','MANDULEY','MÁXIMO GÓMEZ','MACEO','ARICOCHEA','LIBERTAD','I. GARCÍA','XX ANIVERSARIO','MAYARÍ'];
  var H_STREETS = ['NICICIO GARCÍA','FREXES','AGUILERA','MARTÍ','ARIAS','LIBERTADORES','PERALTA','C. CENTRAL','MAYARÍ'];

  function txt(t,col,size){
    var c=document.createElement('canvas'); c.width=256; c.height=80;
    var g=c.getContext('2d');
    g.fillStyle='rgba(8,14,20,.9)'; g.fillRect(0,0,256,80);
    g.strokeStyle=col; g.lineWidth=4; g.strokeRect(3,3,250,74);
    g.fillStyle=col; g.font='bold 26px sans-serif';
    g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,128,42);
    var t2=new THREE.CanvasTexture(c);
    var s=new THREE.Sprite(new THREE.SpriteMaterial({map:t2}));
    s.scale.set(size||3.4,(size||3.4)*80/256,1);
    return s;
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
    g.position.set(x,0,z); T().add(g);
  }
  function bush(x,z,s){
    s=s||1; var g=new THREE.Group();
    var mat=new THREE.MeshLambertMaterial({color:0x3f6b2a});
    for(var i=0;i<3;i++){
      var b=new THREE.Mesh(new THREE.SphereGeometry(rand(.4,.7)*s,6,6),mat);
      b.position.set(rand(-.3,.3)*s,rand(.3,.6)*s,rand(-.3,.3)*s); g.add(b);
    }
    g.position.set(x,0,z); T().add(g);
  }
  function building(x,z,w,d,h,color,name){
    var mat=new THREE.MeshLambertMaterial({color:color});
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,h/2,z); T().add(m);
    SOL().push({x1:x-w/2-.2,x2:x+w/2+.2,z1:z-d/2-.2,z2:z+d/2+.2});
    if(name){ var s=txt(name,'#3fe0c8',3.2); s.position.set(x,h+1.2,z); T().add(s); }
    return m;
  }
  function park(bx,bz,name,isCenter){
    var grass=new THREE.Mesh(new THREE.PlaneGeometry(CW.B,CW.B),new THREE.MeshLambertMaterial({color:0x3f7a34}));
    grass.rotation.x=-Math.PI/2; grass.position.set(bx,.06,bz); T().add(grass);
    var s=txt(name,'#3fe0c8',3.6); s.position.set(bx,3,bz); T().add(s);
    for(var i=0;i<6;i++) palm(bx+rand(-11,11),bz+rand(-11,11),rand(.9,1.3));
    for(var i2=0;i2<3;i2++) bush(bx+rand(-10,10),bz+rand(-10,10),.8);
    if(isCenter){
      var fb=new THREE.Mesh(new THREE.CylinderGeometry(3,3.5,.8,12),new THREE.MeshLambertMaterial({color:0x8a8a80}));
      fb.position.set(bx,.4,bz); T().add(fb);
      SOL().push({x1:bx-3.6,x2:bx+3.6,z1:bz-3.6,z2:bz+3.6});
      window.shopPos = new THREE.Vector3(bx+8,0,bz-8);
      var cafe=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),new THREE.MeshLambertMaterial({color:0xe0a84b}));
      cafe.position.set(bx+8,1.5,bz-8); T().add(cafe);
      SOL().push({x1:bx+6,x2:bx+10,z1:bz-10,z2:bz-6});
      var cs=txt('☕ CAFETERÍA EL JÚCARO','#ffb340',3.4); cs.position.set(bx+8,4,bz-8); T().add(cs);
    }
  }
  function cemetery(bx,bz,name){
    var gr=new THREE.Mesh(new THREE.PlaneGeometry(CW.B,CW.B),new THREE.MeshLambertMaterial({color:0x4a5d33}));
    gr.rotation.x=-Math.PI/2; gr.position.set(bx,.06,bz); T().add(gr);
    for(var i=0;i<10;i++){
      var t=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.15),new THREE.MeshLambertMaterial({color:0x9a9a9a}));
      t.position.set(bx+rand(-10,10),.4,bz+rand(-10,10)); T().add(t);
    }
    var s=txt(name,'#9aa0a8',3.2); s.position.set(bx,3,bz); T().add(s);
  }
  function car(x,z,a,col,type,req){
    var g=new THREE.Group();
    var bm=new THREE.MeshLambertMaterial({color:col});
    var jeep=type==='jeep';
    var body=new THREE.Mesh(new THREE.BoxGeometry(2,jeep?.9:.8,4.6),bm); body.position.y=.75; g.add(body);
    var cab=new THREE.Mesh(new THREE.BoxGeometry(1.7,jeep?.7:.55,jeep?2.8:2), jeep?bm:new THREE.MeshLambertMaterial({color:0xdfe6ea}));
    cab.position.set(0,jeep?1.5:1.35,-.3); g.add(cab);
    var wm=new THREE.MeshLambertMaterial({color:0x1a1a1e});
    var wp=[[-1,1.5],[1,1.5],[-1,-1.5],[1,-1.5]];
    for(var i=0;i<wp.length;i++){
      var w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.28,12),wm);
      w.rotation.z=Math.PI/2; w.position.set(wp[i][0],.42,wp[i][1]); g.add(w);
    }
    g.position.set(x,0,z); g.rotation.y=a; T().add(g);
    CARS().push({g:g,x:x,z:z,a:a,speed:0,fuel:rand(35,95),type:type,req:req,searched:false,driver:null,hp:100});
  }

  function buildAll(){
    var scene=T();
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshLambertMaterial({color:0x4a5d33}));
    ground.rotation.x=-Math.PI/2; ground.position.y=-.05; scene.add(ground);
    var base=new THREE.Mesh(new THREE.PlaneGeometry(CW.size,CW.size),new THREE.MeshLambertMaterial({color:0x3c4046}));
    base.rotation.x=-Math.PI/2; base.position.y=.01; scene.add(base);
    var roadMat=new THREE.MeshLambertMaterial({color:0x4a4e55});
    for(var i=0;i<=CW.n;i++){
      var v=new THREE.Mesh(new THREE.PlaneGeometry(CW.R,CW.size),roadMat);
      v.rotation.x=-Math.PI/2; v.position.set(rC(i),.02,0); scene.add(v);
      var hz=new THREE.Mesh(new THREE.PlaneGeometry(CW.size,CW.R),roadMat);
      hz.rotation.x=-Math.PI/2; hz.position.set(0,.02,rC(i)); scene.add(hz);
    }
    var diag=new THREE.Mesh(new THREE.PlaneGeometry(18,300),roadMat);
    diag.rotation.x=-Math.PI/2; diag.rotation.z=Math.PI/4; diag.position.set(-CW.half*.5,.03,CW.half*.5); scene.add(diag);
    var river=new THREE.Mesh(new THREE.PlaneGeometry(6,340),new THREE.MeshLambertMaterial({color:0x3a6a8a}));
    river.rotation.x=-Math.PI/2; river.rotation.z=-Math.PI/5; river.position.set(CW.half*.2,.04,-CW.half*.1); scene.add(river);

    for(var bi=0;bi<CW.n;bi++){
      for(var bj=0;bj<CW.n;bj++){
        var bx=cB(bi), bz=cB(bj), done=false;
        for(var p=0;p<PARKS.length;p++){
          if(PARKS[p][0]===bi && PARKS[p][1]===bj){ park(bx,bz,PARKS[p][2],PARKS[p][3]); done=true; break; }
        }
        if(!done && CEMETERY[0]===bi && CEMETERY[1]===bj){ cemetery(bx,bz,CEMETERY[2]); done=true; }
        if(!done){
          for(var L=0;L<LANDMARKS.length;L++){
            if(LANDMARKS[L][0]===bi && LANDMARKS[L][1]===bj){
              building(bx,bz,rand(8,12),rand(8,12),rand(6,12),LANDMARKS[L][3],LANDMARKS[L][2]);
              done=true; break;
            }
          }
        }
        if(!done){
          for(var k=0;k<2;k++){
            var w=rand(7,11),d=rand(7,11),h=rand(6,14);
            var ox=rand(-(13-w/2-1),13-w/2-1), oz=rand(-(13-d/2-1),13-d/2-1);
            building(bx+ox,bz+oz,w,d,h,pick(['#d96a4f','#e0a84b','#7fb6a4','#c96a6a','#6fa8c9','#d9c08f']));
          }
        }
      }
    }
    for(var vi=1;vi<=5;vi++){ var sv=txt(V_STREETS[vi],'#ffb340',2.6); sv.position.set(rC(vi),3,rC(3)); scene.add(sv); }
    for(var hj=1;hj<=6;hj++){ if(hj===3)continue; var sh=txt(H_STREETS[hj],'#ffb340',2.6); sh.position.set(rC(3),3,rC(hj)); scene.add(sh); }

    var lg=new THREE.Group();
    var hill=new THREE.Mesh(new THREE.ConeGeometry(40,18,24),new THREE.MeshLambertMaterial({color:0x4a5d33}));
    hill.position.y=9; lg.add(hill);
    var cm=new THREE.MeshLambertMaterial({color:0xe8e4d4});
    var c1=new THREE.Mesh(new THREE.BoxGeometry(1.4,14,1.4),cm); c1.position.y=25; lg.add(c1);
    var c2=new THREE.Mesh(new THREE.BoxGeometry(7,1.4,1.4),cm); c2.position.y=28; lg.add(c2);
    var lts=txt('LOMA DE LA CRUZ','#3fe0c8',8); lts.position.y=36; lg.add(lts);
    lg.position.set(0,0,-CW.half-45); scene.add(lg);
    window.lomaPos = new THREE.Vector3(0,0,-CW.half-45);

    var cols=['#c94f4f','#4f7fc9','#e0a84b','#7fb6a4','#d9d9d9','#8f4f8f','#e07a3f','#5c8a5c'];
    for(var ci=0;ci<14;ci++){
      var vert=Math.random()<.5, ri=Math.floor(rand(0,CW.n));
      var off=(Math.random()<.5?1:-1)*(CW.R/2-2.5);
      var x,z,a;
      if(vert){ x=rC(ri)+off; z=rand(-CW.half+8,CW.half-8); a=Math.random()<.5?0:Math.PI; }
      else{ z=rC(ri)+off; x=rand(-CW.half+8,CW.half-8); a=Math.random()<.5?Math.PI/2:-Math.PI/2; }
      car(x,z,a,pick(cols),'clasico',3);
    }
    car(cB(4)+9,cB(3)-15.5,Math.PI,'#4a5d3a','jeep',5);
    car(cB(4)+9,cB(3)-19.5,Math.PI,'#4a5d3a','jeep',5);

    var sg=new THREE.BufferGeometry(); var pos=new Float32Array(800*3);
    for(var s2=0;s2<800;s2++){
      var th=rand(0,TAU), ph=rand(0,Math.PI/2), rr=400;
      pos[s2*3]=rr*Math.sin(ph)*Math.cos(th); pos[s2*3+1]=rr*Math.cos(ph); pos[s2*3+2]=rr*Math.sin(ph)*Math.sin(th);
    }
    sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    var stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.2,transparent:true,opacity:0}));
    scene.add(stars); window.starsMesh=stars;
    console.log('[CityBuilder] ✓ Ciudad real de Holguín construida');
  }
  return { buildAll:buildAll };
})();
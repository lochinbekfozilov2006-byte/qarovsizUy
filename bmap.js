/* Qarovsiz Uy — maps 3 ("Qishloq hovlisi") and 4 ("Yer osti bunkeri").
   Same interface as world.js / hospital.js (window.WORLD). Visuals come from mapN.glb, collisions, hide spots,
   item spots, stations and lights from mapN.json (both baked offline from one layout). */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI;
const ID=window.MAP_ID==='map4'?'map4':'map3',H3=ID==='map3';
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const CF=H3?{file:'map3',LEVELS:[0,-2.8],B:[-12.3,12.3,-12.3,10.3],nav:{x0:-12.5,z0:-12.5,nx:50,nz:46},hw:.9,
  spawn:[[-.6,8.6],[.6,8.6],[-1.4,8.0],[1.4,8.0],[0,7.6]],yaw:0,exposure:.95,fog:[0x070a14,.055],bg:0x070a14}
 :{file:'map4',LEVELS:[0,-3.2],B:[-12.3,12.3,-9.3,9.3],nav:{x0:-12.5,z0:-9.5,nx:50,nz:38},hw:.82,
  spawn:[[-7.6,-7.4],[-7.0,-6.6],[-7.6,-5.8],[-6.8,-7.9],[-8.4,-5.6]],yaw:-PI/2,exposure:.85,fog:[0x030405,.1],bg:0x030405};
const LV=CF.LEVELS,LOW=LV[1];
const W={map:ID,H:-LOW,LEVELS:LV,solids:[],doors:[],curtains:[],containers:[],hideSpots:[],keySpots:[],batSpots:[],furnBoxes:[],flick:[],anim:[],F:[],D:[],WIN:[],KEY:[],BAT:[],HIDE:[],flickerAll:0,
 KINDS:[H3?'alvasti':'kor'],noCar:true,lampBulbs:[],exposure:CF.exposure,spawnYaw:CF.yaw};
window.WORLD=W;
function ctex(sz,T,draw){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');draw(x,sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/T,1/T);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
W.ctex=ctex;
const colMats={};function MC(c,r,metal,flat){const key=c+'_'+r+'_'+metal+'_'+flat;if(colMats[key])return colMats[key];const m=new THREE.MeshStandardMaterial({roughness:r==null?.85:r,metalness:metal||0,flatShading:!!flat});m.color.set(c).convertSRGBToLinear();return colMats[key]=m}
const glow=c=>new THREE.MeshBasicMaterial({color:c});
W.MC=MC;W.glow=glow;
W.C={wood:0x4a3020,dark:0x2a1b12,red:0x5a1d1d,fabric:0x4b4542,green:0x2f3a2c,white:0xd2ccbe,metal:0x6a6c6e,rust:0x5c3a25,cream:0xa59a86,plant:0x2b3a22,brass:0x7a6430};

/* ---------- stairs ---------- */
let FL=[];
const inFl=(f,x,z,m)=>Math.abs(x-f.x)<CF.hw+(m||0)&&z>f.zl-(m||0)&&z<f.zh+(m||0);
function rampY(f,z){const t=f.climbNeg?(f.zh-z)/(f.zh-f.zl):(z-f.zl)/(f.zh-f.zl);return f.y+Math.max(0,Math.min(1,t))*(f.top-f.y)}
const lvOf=y=>y<LOW/2?1:0;
W.groundY=function(x,z,y){for(const f of FL){if(!inFl(f,x,z))continue;if(y>f.top+1.2)return f.top;return rampY(f,z)}return LV[lvOf(y)]};
W.level=function(y){return lvOf(y+.05)};
W.isStair=function(x,z){return FL.some(f=>inFl(f,x,z,.3))};

/* ---------- collisions ---------- */
W.indexSolids=function(){const B=new Map();const cs=2;W.solids.forEach(s=>{for(let i=Math.floor((s.x1-.5)/cs);i<=Math.floor((s.x2+.5)/cs);i++)for(let j=Math.floor((s.z1-.5)/cs);j<=Math.floor((s.z2+.5)/cs);j++){const k=i*4096+j;let a=B.get(k);if(!a)B.set(k,a=[]);a.push(s)}});W.sIndex=B};
W.near=function(x,z){if(!W.sIndex)return W.solids;return W.sIndex.get(Math.floor(x/2)*4096+Math.floor(z/2))||[]};
W.blocked=function(x,z,y,r,ignoreDoors){r=r||.28;const b=CF.B;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])return true;for(const s of W.near(x,z)){if(s.off)continue;if(ignoreDoors&&s.door!=null)continue;if(y+1.6<s.y1||y+.35>s.y2)continue;if(x>s.x1-r&&x<s.x2+r&&z>s.z1-r&&z<s.z2+r)return true}return false};

/* ---------- monster navigation ---------- */
W.NAVCFG={cs:.5,levels:LV.map(y=>Object.assign({},CF.nav,{y})),links:[],
 off(li,x,z){for(const f of FL){if(li===f.up&&inFl(f,x,z,.05))return true}return false}};
W.spawn=function(i){const s=CF.spawn[i%CF.spawn.length];return V(s[0],0,s[1])};
W.menuCam=H3?function(t,cam){const u=(Math.sin(t*.05)+1)/2;cam.position.set(-3+u*6,1.75,8.6-u*1.5);cam.lookAt(Math.sin(t*.11)*2,1.4,-4)}
 :function(t,cam){const u=(Math.sin(t*.05)+1)/2;cam.position.set(-5,1.65,-7.6+u*15);cam.lookAt(-5+Math.sin(t*.13)*.6,1.45,-7.6+u*15+(Math.cos(t*.05)>0?4:-4))};

/* ---------- runtime pieces ---------- */
function flameTex(){return ctex(64,1,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,240,190,1)');g.addColorStop(.35,'rgba(255,150,40,.8)');g.addColorStop(1,'rgba(255,60,0,0)');x.fillStyle=g;x.fillRect(0,0,s,s)})}
function smokeTex(){return ctex(64,1,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(210,205,195,.55)');g.addColorStop(1,'rgba(200,195,185,0)');x.fillStyle=g;x.fillRect(0,0,s,s)})}
function sky(scene){/* stars + moon, rendered without fog */const g=new THREE.SphereGeometry(200,24,12);const t=ctex(1024,1,(x,s)=>{x.fillStyle='#04060d';x.fillRect(0,0,s,s);for(let i=0;i<1600;i++){const a=Math.random();x.fillStyle='rgba(220,225,255,'+(.25+a*.6)+')';x.fillRect(Math.random()*s,Math.random()*s*.55,a>.95?2:1,a>.95?2:1)}});t.repeat.set(1,1);
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(m);
 const mt=ctex(128,1,(x,s)=>{const gr=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,'rgba(240,240,225,1)');gr.addColorStop(.32,'rgba(225,228,215,1)');gr.addColorStop(.38,'rgba(160,170,200,.35)');gr.addColorStop(1,'rgba(120,130,170,0)');x.fillStyle=gr;x.fillRect(0,0,s,s)});mt.repeat.set(1,1);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(9,16,10),new THREE.MeshBasicMaterial({map:mt,transparent:true,fog:false,depthWrite:false}));moon.position.set(-70,95,-110);scene.add(moon)}
function beshik(par,p){/* the cradle rocks by itself */const g=new THREE.Group();g.position.set(p[0],p[1],p[2]);par.add(g);const wd=MC(0x6a4022,.8),cl=MC(0x8a2a3a,.9);
 const body=new THREE.Group();body.position.y=.12;g.add(body);const b=new THREE.Mesh(new THREE.BoxGeometry(.95,.32,.5),cl);b.position.y=.38;body.add(b);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.BoxGeometry(.05,.75,.5),wd);e.position.set(s*.47,.38,0);body.add(e);const r=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,4,14,PI*.7),wd);r.rotation.z=PI*1.15;r.rotation.y=PI/2;r.position.set(s*.4,.42,0);g.add(r)});
 const bar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.0,6),wd);bar.rotation.z=PI/2;bar.position.y=.78;body.add(bar);
 const kp=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.46),MC(0xb89a50,.9));kp.position.y=.56;body.add(kp);
 let a=0;W.anim.push((t,dt)=>{a=Math.sin(t*1.7)*(.12+.1*Math.max(0,Math.sin(t*.13)));body.rotation.x=a})}
/* tandir fire: W.setFire(on) */
function fire(par,st){const g=new THREE.Group();g.position.set(st.x,st.y,st.z);par.add(g);const ft=flameTex(),stx=smokeTex();
 const fl=[];for(let i=0;i<5;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ft,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(.5,.7,1);s.visible=false;g.add(s);fl.push(s)}
 const sm=[];for(let i=0;i<14;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:stx,transparent:true,depthWrite:false,opacity:0}));s.visible=false;g.add(s);sm.push({s,t:i/14})}
 const L=new THREE.PointLight(0xff8a30,0,9,1.6);L.position.set(st.x,st.y+.6,st.z);par.add(L);W.lampBulbs.push(L);
 let on=false;W.setFire=v=>{on=!!v};W.fireOn=()=>on;
 W.anim.push((t,dt)=>{fl.forEach((s,i)=>{s.visible=on;if(on){s.position.set(Math.sin(t*9+i)*.08,.1+((t*1.6+i*.2)%1)*.5,Math.cos(t*7+i)*.08);s.material.opacity=.9-((t*1.6+i*.2)%1)*.8}});
  sm.forEach(o=>{o.s.visible=on;if(!on)return;o.t=(o.t+dt*.12)%1;const k=o.t;o.s.position.set(Math.sin(k*9+o.t*30)*.6*k+k*2.5,.4+k*6,Math.cos(k*7)*.5*k-k*1.5);o.s.scale.setScalar(.6+k*4.5);o.s.material.opacity=.6*Math.sin(k*PI)});
  L.intensity=on?1.6+Math.sin(t*13)*.25+Math.sin(t*31)*.15:0})}
/* bunker gate (two sliding halves) and power */
function gate(par,m){const y=m[1],x=m[0],z=m[2];const mat=MC(0x3a4044,.6,.5),hz=MC(0xb8921c,.7);const halves=[];
 [-1,1].forEach(s=>{const h=new THREE.Group();h.position.set(x,y,z+s*.375);par.add(h);const p=new THREE.Mesh(new THREE.BoxGeometry(.14,2.28,.76),mat);p.position.y=1.14;h.add(p);
  for(let i=0;i<3;i++){const st=new THREE.Mesh(new THREE.BoxGeometry(.16,.12,.76),hz);st.position.y=.4+i*.7;h.add(st)}const wh=new THREE.Mesh(new THREE.TorusGeometry(.16,.025,4,12),MC(0x222222,.5,.6));wh.rotation.y=PI/2;wh.position.set(-.09,1.2,-s*.2);h.add(wh);halves.push({h,s})});
 const solid={x1:x-.16,x2:x+.16,z1:z-.8,z2:z+.8,y1:y+.3,y2:y+2.9};W.solids.push(solid);let open=0,want=0;
 W.setGate=v=>{want=v?1:0};W.gateOpen=()=>want===1;
 W.anim.push((t,dt)=>{open+=(want-open)*Math.min(1,dt*.8);halves.forEach(({h,s})=>h.position.z=z+s*(.375+open*.72));solid.off=open>.6})}
function lightsTagged(){/* returns lights by tag */const by={};W.lampBulbs.forEach(l=>{const k=l.userData.tag||0;(by[k]=by[k]||[]).push(l)});return by}

W.build=function(scene){
 const G={yard:new THREE.Group(),ground:new THREE.Group(),ceil:new THREE.Group(),roof:new THREE.Group(),base:new THREE.Group(),items:new THREE.Group()};
 Object.values(G).forEach(g=>scene.add(g));W.G=G;
 scene.background=new THREE.Color(CF.bg);scene.fog=new THREE.FogExp2(CF.fog[0],CF.fog[1]);
 const amb=new THREE.AmbientLight(H3?0x5a6a90:0x4a5462,H3?.1:.05);scene.add(amb);W.amb=amb;
 const hemi=new THREE.HemisphereLight(H3?0x4a5a88:0x3a4652,0x120c0a,H3?.16:.06);scene.add(hemi);
 const moon=new THREE.DirectionalLight(0x8090b0,H3?.0:.0);moon.position.set(-40,55,45);moon.castShadow=false;scene.add(moon);W.moon=moon;
 const car=new THREE.Group();car.position.set(0,-200,0);scene.add(car);W.car=car;W.garage=car;W.carBatSlot=new THREE.Group();car.add(W.carBatSlot);
 W.CARP={hood:V(0,0,0),door:V(0,0,0),seat:V(0,0,0),exit:V(0,0,0)};
 if(H3)sky(scene);
 W.ready=Promise.all([
  fetch(CF.file+'.json').then(r=>r.json()),
  new Promise((res,rej)=>{const L=new THREE.GLTFLoader();if(window.MeshoptDecoder)L.setMeshoptDecoder(MeshoptDecoder);L.load(CF.file+'.glb',res,undefined,rej)})
 ]).then(([J,gltf])=>{
  FL=J.stairs.map(s=>({x:s.x,y:s.y,lv:s.lv,up:s.up,top:LV[s.up],zl:s.zl,zh:s.zh,climbNeg:s.climbNeg}));
  J.solids.forEach(s=>W.solids.push({x1:s[0],x2:s[1],z1:s[2],z2:s[3],y1:s[4],y2:s[5]}));
  /* nav links: the top of each flight joins the floor above */
  FL.forEach(f=>{const d=f.climbNeg?-.5:.5;W.NAVCFG.links.push({a:f.lv,b:f.up,x1:f.x-CF.hw,x2:f.x+CF.hw,z1:f.climbNeg?f.zl:f.zh-.5,z2:f.climbNeg?f.zl+.5:f.zh,d})});
  J.spots.forEach(s=>W.KEY.push({n:s.n,t:s.t==='floor'?'floor':'top',x:s.x,y:s.y,z:s.z,lv:s.lv,r:s.r}));W.BAT=W.KEY;
  J.hide.forEach(h=>W.HIDE.push(h));
  W.STATIONS=J.stations;W.STATION=H3?J.stations.tandir:J.stations.panel;
  const root=gltf.scene;root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;const m=o.material;if(m){if(m.map){m.map.encoding=THREE.sRGBEncoding;m.map.anisotropy=2}if(m.isMeshStandardMaterial){m.roughness=1;m.metalness=0;m.envMapIntensity=0}if(m.alphaTest>0){m.transparent=false;m.depthWrite=true}}}});
  G.ground.add(root);
  J.lights.forEach(([x,y,z,c,i,d,tag])=>{const l=new THREE.PointLight(c,i*(H3?.75:.8),d*1.15,1.8);l.position.set(x,y,z);l.userData.base=l.intensity;l.userData.tag=tag||0;G.ground.add(l);W.lampBulbs.push(l)});
  if(H3){
   if(J.mark.beshik){beshik(G.ground,J.mark.beshik);W.solids.push({x1:J.mark.beshik[0]-.55,x2:J.mark.beshik[0]+.55,z1:J.mark.beshik[2]-.33,z2:J.mark.beshik[2]+.33,y1:.3,y2:1.2})}
   fire(G.ground,J.stations.tandir);
   /* moonlight over the yard: big soft lights, no shadows */
   [[0,9,3,.55,20],[0,9,-4,.3,14]].forEach(([x,y,z,i,d])=>{const l=new THREE.PointLight(0x7f90c8,i,d,1);l.position.set(x,y,z);l.userData.base=i;l.userData.tag=9;G.ground.add(l);W.lampBulbs.push(l)});
   W.anim.push((t,dt)=>{W.lampBulbs.forEach(l=>{const k=l.userData.tag;if(k===9||l.userData.fire)return;if(k===1)l.intensity=Math.random()<.04?l.userData.base*.1:l.userData.base;else if(k===2)l.intensity=l.userData.base*(.8+.2*Math.sin(t*11+l.position.x)+.08*Math.sin(t*27))});
    if(W.flickerAll>0){W.flickerAll-=dt;W.lampBulbs.forEach(l=>{if(l.userData.tag!==9&&Math.random()<.55)l.intensity=0})}})}
  else{
   gate(G.items,J.mark.gate);let power=false,powT=0;
   W.setPower=v=>{if(v&&!power){power=true;powT=0}};W.powerOn=()=>power;
   /* generator exhaust light + hum handled by the game; here only lights */
   const genL=new THREE.PointLight(0xffb060,0,6,1.6);const gs=J.stations.gen;genL.position.set(gs.x,gs.y+1.2,gs.z-1);G.ground.add(genL);W.lampBulbs.push(genL);genL.userData.tag=7;let gen=false;W.setGen=v=>{gen=!!v};W.genOn=()=>gen;
   W.anim.push((t,dt)=>{if(power)powT+=dt;W.lampBulbs.forEach(l=>{const k=l.userData.tag;
     if(k===0)l.intensity=power?0:l.userData.base*(.5+.5*Math.abs(Math.sin(t*1.3+l.position.x)));
     else if(k===1){if(!power)l.intensity=0;else{const on=powT>(Math.abs(l.position.x)*.08+Math.abs(l.position.z)*.05);l.intensity=on?(powT<4&&Math.random()<.2?0:(Math.random()<.01?l.userData.base*.2:l.userData.base)):0}}
     else if(k===3)l.intensity=power?l.userData.base*(.7+.3*Math.sin(t*3)):0;
     else if(k===7)l.intensity=gen?.6+Math.sin(t*20)*.1:0});
    if(W.flickerAll>0){W.flickerAll-=dt;W.lampBulbs.forEach(l=>{if(Math.random()<.55)l.intensity=0})}})}
 });
};
})();

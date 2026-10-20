/* Qarovsiz Uy — map 2: "Tashlandiq kasalxona" (abandoned hospital, 3 floors).
   Same interface as world.js (window.WORLD), so game.js runs on either map.
   Visuals come from hospital.glb (calv182 "Abandoned Hospital" pack, merged), collisions, hide spots,
   item spots and lights from hospital.json (both baked offline from one layout). */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI;
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const LH=3.22;
const W={map:'hosp',H:LH,LEVELS:[0,LH,2*LH],solids:[],doors:[],curtains:[],containers:[],hideSpots:[],keySpots:[],batSpots:[],furnBoxes:[],flick:[],anim:[],F:[],D:[],WIN:[],KEY:[],BAT:[],HIDE:[],flickerAll:0,
 KINDS:['bemor'],noCar:true,lampBulbs:[],exposure:.82};
window.WORLD=W;

function ctex(sz,T,draw){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');draw(x,sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/T,1/T);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
W.ctex=ctex;
const colMats={};function MC(c,r,metal,flat){const key=c+'_'+r+'_'+metal+'_'+flat;if(colMats[key])return colMats[key];const m=new THREE.MeshStandardMaterial({roughness:r==null?.85:r,metalness:metal||0,flatShading:!!flat});m.color.set(c).convertSRGBToLinear();return colMats[key]=m}
const glow=c=>new THREE.MeshBasicMaterial({color:c});
W.MC=MC;W.glow=glow;
W.C={wood:0x4a3020,dark:0x2a1b12,red:0x5a1d1d,fabric:0x4b4542,green:0x2f3a2c,white:0xd2ccbe,metal:0x6a6c6e,rust:0x5c3a25,cream:0xa59a86,plant:0x2b3a22,brass:0x7a6430};

/* ---------- stairs (two flights in the stairwell at the end of each corridor) ---------- */
let FL=[];/* {x,y,zl,zh,climbNeg} */
const inFl=(f,x,z,m)=>Math.abs(x-f.x)<1+(m||0)&&z>f.zl-(m||0)&&z<f.zh+(m||0);
function rampY(f,z){const t=f.climbNeg?(f.zh-z)/(f.zh-f.zl):(z-f.zl)/(f.zh-f.zl);return f.y+Math.max(0,Math.min(1,t))*LH}
W.groundY=function(x,z,y){for(const f of FL){if(!inFl(f,x,z))continue;if(y>f.y+LH+1.2)return f.y+2*LH;if(y<f.y-1)return f.y-LH;return rampY(f,z)}
 const lv=Math.max(0,Math.min(2,Math.round(y/LH)));return lv*LH};
W.level=function(y){return Math.max(0,Math.min(2,Math.floor((y+.1)/LH)))};
W.isStair=function(x,z){return FL.some(f=>inFl(f,x,z,.3))};

/* ---------- collisions ---------- */
W.indexSolids=function(){const B=new Map();const cs=2;W.solids.forEach(s=>{for(let i=Math.floor((s.x1-.5)/cs);i<=Math.floor((s.x2+.5)/cs);i++)for(let j=Math.floor((s.z1-.5)/cs);j<=Math.floor((s.z2+.5)/cs);j++){const k=i*4096+j;let a=B.get(k);if(!a)B.set(k,a=[]);a.push(s)}});W.sIndex=B};
W.near=function(x,z){if(!W.sIndex)return W.solids;return W.sIndex.get(Math.floor(x/2)*4096+Math.floor(z/2))||[]};
W.blocked=function(x,z,y,r,ignoreDoors){r=r||.28;if(x<-6.7||x>6.7||z<-30.5||z>8.6)return true;for(const s of W.near(x,z)){if(s.off)continue;if(ignoreDoors&&s.door!=null)continue;if(y+1.6<s.y1||y+.35>s.y2)continue;if(x>s.x1-r&&x<s.x2+r&&z>s.z1-r&&z<s.z2+r)return true}return false};

/* ---------- monster navigation: one grid per floor, stair links between them ---------- */
W.NAVCFG={cs:.5,levels:[0,1,2].map(li=>({x0:-6.8,z0:-30.6,nx:28,nz:79,y:li*LH})),links:[],
 off(li,x,z){/* the floor above a flight is a hole */for(const f of FL){if(li===f.lv+1&&inFl(f,x,z,.05))return true}return false}};

W.spawn=function(i){const S=[[-.6,6.0],[.4,6.0],[-1.4,6.0],[-.6,5.3],[.4,5.3]];const s=S[i%S.length];return V(s[0],0,s[1])};
W.menuCam=function(t,cam){const u=(Math.sin(t*.06)+1)/2;cam.position.set(.35*Math.sin(t*.2),1.62,3.5-u*9);cam.lookAt(-.2+Math.sin(t*.13)*.4,1.45,-24)};

W.build=function(scene){
 const G={yard:new THREE.Group(),ground:new THREE.Group(),ceil:new THREE.Group(),roof:new THREE.Group(),base:new THREE.Group(),items:new THREE.Group()};
 Object.values(G).forEach(g=>scene.add(g));W.G=G;
 scene.background=new THREE.Color(0x020304);scene.fog=new THREE.FogExp2(0x020304,.1);
 const amb=new THREE.AmbientLight(0x4a5462,.06);scene.add(amb);W.amb=amb;
 const hemi=new THREE.HemisphereLight(0x3a4652,0x120c0a,.07);scene.add(hemi);
 /* the game expects a "moon" light; inside the hospital it is only a faint fill with no shadows */
 const moon=new THREE.DirectionalLight(0x8090b0,.12);moon.position.set(-40,55,45);moon.castShadow=false;scene.add(moon);W.moon=moon;
 /* no car on this map: an empty, far-away placeholder keeps old code paths harmless */
 const car=new THREE.Group();car.position.set(0,-200,0);scene.add(car);W.car=car;W.garage=car;W.carBatSlot=new THREE.Group();car.add(W.carBatSlot);
 W.CARP={hood:V(0,0,0),door:V(0,0,0),seat:V(0,0,0),exit:V(0,0,0)};
 W.ready=Promise.all([
  fetch('hospital.json').then(r=>r.json()),
  new Promise((res,rej)=>{const L=new THREE.GLTFLoader();if(window.MeshoptDecoder)L.setMeshoptDecoder(MeshoptDecoder);L.load('hospital.glb',res,undefined,rej)})
 ]).then(([J,gltf])=>{
  /* stairs */
  FL=J.stairs.map(s=>({x:s.x,y:s.y,lv:s.lv,zl:s.cz-2.475,zh:s.cz+2.475,climbNeg:s.climbNeg}));
  const A=FL.find(f=>f.climbNeg),B=FL.find(f=>!f.climbNeg);
  /* baked collision boxes */
  J.solids.forEach(s=>W.solids.push({x1:s[0],x2:s[1],z1:s[2],z2:s[3],y1:s[4],y2:s[5]}));
  /* stair rails and the edges of the stairwell openings */
  const add=(x1,x2,z1,z2,y1,y2)=>W.solids.push({x1,x2,z1,z2,y1,y2,rail:1});
  if(A){add(-.97,-.86,A.zl,A.zh-.8,0,LH+1.2);add(-2.95,-.86,A.zh-.04,A.zh+.16,LH-.2,LH+1.2)}
  if(B){add(.86,.97,B.zl,B.zh-1.0,LH-.3,2*LH+1.2);add(.86,2.95,B.zh-1.05,B.zh+.2,LH+.1,LH+1.75);add(.86,2.95,B.zl-.16,B.zl+.04,2*LH-.2,2*LH+1.2)}
  /* nav links: the top step of each flight connects to the floor above */
  FL.forEach(f=>{const d=f.climbNeg?-.5:.5,zt=f.climbNeg?f.zl:f.zh;W.NAVCFG.links.push({a:f.lv,b:f.lv+1,x1:f.x-1,x2:f.x+1,z1:f.climbNeg?zt:zt-.5,z2:f.climbNeg?zt+.5:zt,d})});
  /* spots */
  J.spots.forEach(s=>{const o={n:s.n,t:s.t==='floor'?'floor':'top',x:s.x,y:s.y,z:s.z,lv:s.lv};W.KEY.push(o)});W.BAT=W.KEY;
  J.hide.forEach(h=>W.HIDE.push(h));
  W.STATION=J.station;
  /* visuals */
  const root=gltf.scene;root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;const m=o.material;if(m){if(m.map){m.map.encoding=THREE.sRGBEncoding;m.map.anisotropy=2}if(m.isMeshStandardMaterial){m.roughness=1;m.metalness=0;m.envMapIntensity=0}if(m.alphaTest>0){m.transparent=false;m.depthWrite=true}}}});
  G.ground.add(root);
  /* lights: some flicker, some are dead, the operating room light hums */
  J.lights.forEach(([x,y,z,c,i,d],k)=>{const l=new THREE.PointLight(c,i*.32,d*1.1,1.8);l.position.set(x,y,z);l.userData.base=l.intensity;l.userData.fl=rnd()<.4?(.02+rnd()*.06):0;G.ground.add(l);W.lampBulbs.push(l)});
  /* emergency red light in the stairwell and above the reception door */
  [[0,2.6,-27,.9],[0,LH+2.6,-27,.7],[0,2*LH+2.6,-27,.8],[0,2.5,7.4,.8]].forEach(([x,y,z,i])=>{const l=new THREE.PointLight(0xff2a1a,i,7,1.6);l.position.set(x,y,z);l.userData.base=i;l.userData.red=1;G.ground.add(l);W.lampBulbs.push(l)});
  W.anim.push((t,dt)=>{W.lampBulbs.forEach(l=>{if(l.userData.red){l.intensity=l.userData.base*(.55+.45*Math.abs(Math.sin(t*1.4)));return}if(l.userData.fl)l.intensity=Math.random()<l.userData.fl?l.userData.base*.05:l.userData.base});
   if(W.flickerAll>0){W.flickerAll-=dt;W.lampBulbs.forEach(l=>{if(Math.random()<.55)l.intensity=0})}});
 });
};
})();

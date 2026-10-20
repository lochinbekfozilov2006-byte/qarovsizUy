/* Qarovsiz Uy — main game */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI,UP=V(0,1,0);
const Q=new URLSearchParams(location.search);const FAST=Q.get('fast')==='1';
const $=s=>document.querySelector(s);
const W=WORLD,A=ACTORS,S=SND,N=NET,VC=VOICE,T=window.T,MAXP=5;
const TOUCH=('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches;
if(TOUCH)document.body.classList.add('touch');
const LOG=(...a)=>{if(Q.get('debug'))console.log('[game]',...a)};

/* ---------- renderer ---------- */
let GQ=new URLSearchParams(location.search).get('gfx')||(()=>{try{return localStorage.getItem('qu_gfx')}catch(e){return null}})()||(TOUCH?'low':'mid');
const QS={low:{pr:.75,sh:false,lights:3,far:85},mid:{pr:1,sh:true,map:1024,lights:5,far:110},high:{pr:1.5,sh:true,map:2048,soft:true,lights:8,far:300}}[GQ]||{pr:1,sh:true,map:1024,lights:5,far:110};
const cv=$('#cv');const R=new THREE.WebGLRenderer({canvas:cv,antialias:!TOUCH&&GQ==='high',powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio,QS.pr));R.shadowMap.enabled=QS.sh;R.shadowMap.type=QS.soft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;R.shadowMap.autoUpdate=QS.sh;
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.35;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x05060b);scene.fog=new THREE.FogExp2(0x06070c,.03);
const cam=new THREE.PerspectiveCamera(70,1,.05,QS.far);scene.add(cam);
const flash=new THREE.SpotLight(0xfff1d6,0,26,.52,.45,1.3);flash.position.set(.18,-.12,.05);flash.target.position.set(0,-.15,-1);cam.add(flash);cam.add(flash.target);
function size(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}addEventListener('resize',size);size();
W.build(scene);const G=W.G;const H=W.H;
const introL=new THREE.PointLight(0xff3a2a,0,7,1.6);introL.position.set(6.8,2.4,8.9);scene.add(introL);

/* ---------- game state (host authoritative, mirrored on clients) ---------- */
const ST={phase:'menu',players:{},cont:[],doors:[],items:{key:{spot:0,holder:null,inst:false,pos:null},bat:{spot:0,holder:null,inst:false,pos:null},cross:{spot:1,holder:null,inst:false,pos:null}},car:{key:false,bat:false},ended:null,t:0};let endShown=false,paused=false;
let me={id:'me',name:'',char:'marlon'};
const P={pos:V(0,0,87),yaw:0,pitch:0,vel:V(),stamina:1,run:false,fl:true,hide:-1,alive:true,inCar:false,speed:0,stepT:0};
const remotes={};/* id -> {ch,tag,spot,pos,tpos,ry,try,sp,fl,hide,alive} */
const monster={model:null,models:null,kind:'wolf'};
const VIEWS=['wolf','zombie','parasite'].map(k=>({kind:k,pos:V(0,-50,0),tpos:V(0,-50,0),ry:0,try:0,vis:false,anim:'',ts:1,stepT:0,model:null}));

/* ---------- loading ---------- */
const furnObjs=[];let FURN=null;
A.onProgress=p=>{$('#bootBar i').style.width=Math.round(p*100)+'%'};
let carSrc=null;A.progress.total=9;
const loadAll=Promise.all([A.loadFurniture().then(P=>{FURN=P}),A.loadChars(),A.loadMonster(),A.loadMonsters(),A.loadGLB('car').then(g=>{carSrc=g})]).then(buildFurniture).then(()=>{setupCar();buildInteractive();W.indexSolids();{const t0=performance.now();buildNav();window.__navMs=Math.round(performance.now()-t0)}makeThumbs();monster.models={wolf:A.makeMonster(),zombie:A.makeHumanMonster('zombie'),parasite:A.makeHumanMonster('parasite')};Object.values(monster.models).forEach(m=>{scene.add(m.group);m.group.visible=false});monster.model=monster.models.wolf;VIEWS.forEach(v=>v.model=monster.models[v.kind]);try{makePortraits()}catch(e){}try{optimizeScene()}catch(e){console.warn('opt',e)}bootReady()}).catch(e=>{console.error(e);$('#bootMsg').textContent=T('boot_err')});
function buildFurniture(){const C=W.C;const geoCache={};const getG=k=>geoCache[k]||(geoCache[k]=FURN[k]?A.parseFurn(FURN[k]):Promise.resolve([]));
 const jobs=W.F.map(f=>{const [k,x,z,ry,col,s,y0,tag]=f;let par=G.ground,y=y0||0,rx=0;if(tag&&tag.startsWith('yard'))par=G.yard;if(tag&&tag.startsWith('base'))par=G.base;if(tag&&tag.endsWith('tip'))rx=-PI/2;
  return getG(k).then(geos=>{const g=new THREE.Group();geos.forEach(ge=>{const m=new THREE.Mesh(ge,W.MC(col,.8,col===C.metal?.5:0,true));m.castShadow=m.receiveShadow=true;g.add(m)});
   g.position.set(x,rx?y+.18:y,z);g.rotation.y=ry;g.rotation.x=rx;g.scale.setScalar(s||1);par.add(g);furnObjs.push(g);
   if(tag!=='nb'&&!rx&&k!=='fan'&&k!=='plant'){g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);if(b.max.y-b.min.y>.3){const sh=.06;W.solids.push({x1:b.min.x+sh,x2:b.max.x-sh,z1:b.min.z+sh,z2:b.max.z-sh,y1:b.min.y,y2:b.max.y,furn:k})}}})});
 /* doors */
 W.D.forEach((d,i)=>{const [k,cx,ck,ax,w,open,col,dbl]=d;const hinges=[];const lw=dbl?w/2:w;
  const mk=(geos)=>{const g=new THREE.Group();geos.forEach(ge=>{const m=new THREE.Mesh(ge,W.MC(col,.75,0,true));m.castShadow=true;g.add(m)});g.scale.set(lw/.9,2.22/2.13,1);g.position.x=lw/2;return g};
  const h1=new THREE.Group();if(ax==='x')h1.position.set(cx-w/2,0,ck);else h1.position.set(cx,0,ck+w/2);h1.userData.closed=ax==='x'?0:PI/2;h1.userData.open=h1.userData.closed+open;G.ground.add(h1);hinges.push(h1);
  if(dbl){const h2=new THREE.Group();h2.position.set(cx+w/2,0,ck);h2.userData.closed=PI;h2.userData.open=PI+1.45;G.ground.add(h2);hinges.push(h2)}
  const solid=ax==='x'?{x1:cx-w/2,x2:cx+w/2,z1:ck-.08,z2:ck+.08,y1:0,y2:2.3,door:i}:{x1:cx-.08,x2:cx+.08,z1:ck-w/2,z2:ck+w/2,y1:0,y2:2.3,door:i};W.solids.push(solid);
  W.doors[i]={hinges,solid,pos:V(cx,1.1,ck),cur:1};jobs.push(getG(k).then(geos=>hinges.forEach(h=>h.add(mk(geos)))))});
 W.WIN.forEach(([ax,k,c,out])=>{jobs.push(getG('window').then(geos=>{const g=new THREE.Group();geos.forEach(ge=>g.add(new THREE.Mesh(ge,W.MC(C.dark,.7,0,true))));g.scale.set(1.3/.905,1.4/.996,1);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(.86,.95),new THREE.MeshStandardMaterial({color:0x10141a,transparent:true,opacity:.55,roughness:.1,metalness:.3,side:THREE.DoubleSide}));gl.position.y=.5;g.add(gl);
  if(ax==='x')g.position.set(c,.95,k);else{g.position.set(k,.95,c);g.rotation.y=PI/2}G.ground.add(g)}))});
 return Promise.all(jobs)}

function makeThumbs(){Object.keys(A.CHARS).forEach(k=>{try{const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:true});r.setSize(180,240);r.outputEncoding=THREE.sRGBEncoding;const sc=new THREE.Scene();
 sc.add(new THREE.HemisphereLight(0xffe8d0,0x201418,1.1));const d=new THREE.DirectionalLight(0xffd0b0,1.2);d.position.set(1.5,2.5,3);sc.add(d);const rim=new THREE.DirectionalLight(0xff4030,.9);rim.position.set(-2,1.5,-2);sc.add(rim);
 const ch=A.makeCharacter(k);ch.pose(0,0,0,0);ch.group.rotation.y=.35;sc.add(ch.group);const c=new THREE.PerspectiveCamera(30,180/240,.1,20);c.position.set(0,1.05,4.6);c.lookAt(0,.95,0);r.render(sc,c);
 $('#thumb_'+k).src=r.domElement.toDataURL();r.dispose();r.forceContextLoss&&r.forceContextLoss()}catch(e){}})}
const PORTRAIT={};function makePortraits(){Object.keys(A.CHARS).forEach(k=>{const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:true});r.setSize(300,520);r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.2;const sc=new THREE.Scene();
 sc.add(new THREE.HemisphereLight(0xa8b0d0,0x100808,.5));const d=new THREE.DirectionalLight(0xffd0a0,1.6);d.position.set(2,2.5,3);sc.add(d);const rim=new THREE.DirectionalLight(0xff3020,2.2);rim.position.set(-2.5,1.5,-2);sc.add(rim);
 const ch=A.makeCharacter(k);ch.pose(0,0,0,0);ch.group.rotation.y=-.45;sc.add(ch.group);const c=new THREE.PerspectiveCamera(26,300/520,.1,30);c.position.set(0,.98,4.4);c.lookAt(0,.9,0);r.render(sc,c);PORTRAIT[k]=r.domElement.toDataURL('image/png');r.dispose();r.forceContextLoss&&r.forceContextLoss()});setHero(me.char)}
function setupCar(){const m=carSrc.scene;m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;[].concat(o.material).forEach(mt=>{if(mt.map)mt.map.encoding=THREE.sRGBEncoding;mt.roughness=.75;mt.metalness=.1})}});
 const box=new THREE.Box3().setFromObject(m),sz=box.getSize(V()),c=box.getCenter(V());const sc=5.4/sz.z;const inner=new THREE.Group();inner.add(m);m.position.set(-c.x,-box.min.y,-c.z);inner.scale.setScalar(sc);W.car.add(inner);
 const L=sz.z*sc,Wd=sz.x*sc,Ht=sz.y*sc;W.CARP={hood:V(0,.9,L/2+.45),door:V(-Wd/2-.45,.9,.35),seat:V(-.42,Ht*.62,-.25),exit:V(-Wd/2-1.1,0,.35)};
 const hlM=new THREE.MeshBasicMaterial({color:0x221810});[-.62,.62].forEach(x=>{const hl=new THREE.Mesh(new THREE.CircleGeometry(.11,12),hlM);hl.position.set(x,Ht*.42,L/2+.02);W.car.add(hl)});W.carHeadM=hlM;
 W.carBatSlot.position.set(0,Ht*.5,L/2-.7);W.car.updateMatrixWorld(true);const wb=new THREE.Box3().setFromObject(W.car);W.solids.push({x1:wb.min.x+.1,x2:wb.max.x-.1,z1:wb.min.z+.1,z2:wb.max.z-.1,y1:0,y2:1.5,car:1});W.carBox=wb}
/* ---------- items, containers, hide spots, car ---------- */
const IT={};
function makeKey(){const g=new THREE.Group();const m=W.MC(0xc9a24a,.3,.85);const ring=new THREE.Mesh(new THREE.TorusGeometry(.035,.009,8,18),m);g.add(ring);const sh=new THREE.Mesh(new THREE.BoxGeometry(.11,.012,.012),m);sh.position.x=.08;g.add(sh);
 [.1,.125].forEach(x=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.01,.03,.01),m);t.position.set(x,-.015,0);g.add(t)});g.rotation.x=-PI/2;const w=new THREE.Group();w.add(g);w.add(glint(0xffd27a));return w}
function makeBattery(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.18),W.MC(0x161616,.5));b.position.y=.1;b.castShadow=true;g.add(b);const top=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,.18),W.MC(0x2a2a2a,.5));top.position.y=.21;g.add(top);
 [[-.09,0xb82020],[.09,0x202020]].forEach(([x,c])=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.03,8),W.MC(c,.4,.3));t.position.set(x,.235,0);g.add(t)});const lab=new THREE.Mesh(new THREE.PlaneGeometry(.2,.08),W.MC(0xd9b030,.6));lab.position.set(0,.11,.091);g.add(lab);g.add(glint(0xffe08a,.35));return g}
function makeCross(){const g=new THREE.Group();const m=W.MC(0xd8d2c0,.25,.9);const v=new THREE.Mesh(new THREE.BoxGeometry(.03,.2,.022),m);v.position.y=.1;const h=new THREE.Mesh(new THREE.BoxGeometry(.13,.03,.022),m);h.position.y=.14;g.add(v);g.add(h);g.rotation.z=.25;const w=new THREE.Group();w.add(g);w.add(glint(0xfff3c4,.12));return w}
function glint(c,y){const t=W.ctex(64,1,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,240,200,.9)');g.addColorStop(.3,'rgba(255,220,150,.35)');g.addColorStop(1,'rgba(255,220,150,0)');x.fillStyle=g;x.fillRect(0,0,s,s)});t.repeat.set(1,1);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,color:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.set(.35,.35,1);sp.position.y=y||.05;sp.userData.glint=1;return sp}
function fwdOf(ry){return V(Math.sin(ry),0,Math.cos(ry))}
const CONT=[];/* containers: {spot, group, type, pos (interaction), item anchor} */
const HIDE=[];
function buildInteractive(){
 W.KEY.forEach((s,i)=>{const f=fwdOf(s.ry||0);let anchor=V(s.x,s.y,s.z);
  if(s.t==='drawer'){const g=new THREE.Group();g.position.set(s.x+f.x*(s.d-.2),s.y,s.z+f.z*(s.d-.2));g.rotation.y=s.ry;G.ground.add(g);const wm=W.MC(0x3a2618,.8,0,true);
   W.bx(s.w,.02,.38,0,0,0,wm,g,{rot:[0,0,0]});W.bx(s.w,.16,.02,0,.08,.19,wm,g,{rot:[0,0,0]});W.bx(s.w,.12,.02,0,.06,-.19,wm,g,{rot:[0,0,0]});W.bx(.02,.12,.38,-s.w/2,.06,0,wm,g,{rot:[0,0,0]});W.bx(.02,.12,.38,s.w/2,.06,0,wm,g,{rot:[0,0,0]});
   const kn=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),W.MC(0x8a7040,.4,.7));kn.position.set(0,.08,.205);g.add(kn);
   CONT.push({spot:i,type:'drawer',g,base:g.position.clone(),f,pos:V(s.x+f.x*(s.d+.1),s.y+.1,s.z+f.z*(s.d+.1)),cur:0});s.anchorObj=g;s.local=V(0,.03,0);s.c=CONT.length-1}
  else if(s.t==='cab'){const g=new THREE.Group();const side=V(Math.cos(s.ry),0,-Math.sin(s.ry));g.position.set(s.x+f.x*(s.d+.02)-side.x*s.w/2,s.y-s.h/2+.02,s.z+f.z*(s.d+.02)-side.z*s.w/2);g.rotation.y=s.ry;G.ground.add(g);
   const panel=new THREE.Mesh(new THREE.BoxGeometry(s.w,s.h,.025),W.MC(0x8e8574,.8,0,true));panel.position.set(s.w/2,s.h/2,0);panel.castShadow=true;g.add(panel);const kn=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),W.MC(0x777777,.4,.7));kn.position.set(s.w-.06,s.h*.7,.02);g.add(kn);
   CONT.push({spot:i,type:'cab',g,f,pos:V(s.x+f.x*(s.d+.15),s.y+.1,s.z+f.z*(s.d+.15)),cur:0});s.c=CONT.length-1;s.itemPos=V(s.x+f.x*(s.d+.1),s.y-.25,s.z+f.z*(s.d+.1))}
 });
 /* closets get closed doors (visual) */
 W.HIDE.forEach((h,i)=>{const f=fwdOf(h.ry);const y0=h.y||0;let doors=null;
  if(h.k==='closet'){doors=new THREE.Group();doors.position.set(h.x+f.x*.34,y0,h.z+f.z*.34);doors.rotation.y=h.ry;G.ground.add(doors);[-1,1].forEach(s=>{const d=new THREE.Mesh(new THREE.BoxGeometry(.55,2.0,.03),W.MC(h.y?0x4a2a18:0x2a1b12,.8,0,true));d.position.set(s*.28,1.12,0);d.castShadow=true;doors.add(d);for(let k=0;k<5;k++){const sl=new THREE.Mesh(new THREE.BoxGeometry(.4,.015,.035),W.MC(0x0a0605,1));sl.position.set(s*.28,1.4+k*.07,.002);doors.add(sl)}})}
  HIDE.push({i,h,doors,pos:V(h.x+f.x*(h.k==='closet'?.6:h.k==='under'?0:.4),y0+1,h.z+f.z*(h.k==='closet'?.6:h.k==='under'?0:.4))})});
 IT.key=makeKey();IT.bat=makeBattery();IT.cross=makeCross();G.items.add(IT.key);G.items.add(IT.bat);G.items.add(IT.cross);
}

/* ---------- navigation grid (monster) ---------- */
const NAV={};
function buildNav(){const cs=.5;const L0={x0:-86,z0:-81,nx:344,nz:344},L1={x0:-14,z0:-10,nx:56,nz:40};NAV.cs=cs;NAV.L=[L0,L1];
 [L0,L1].forEach((L,li)=>{L.walk=new Uint8Array(L.nx*L.nz);L.sight=new Uint8Array(L.nx*L.nz);for(let j=0;j<L.nz;j++)for(let i=0;i<L.nx;i++){const x=L.x0+(i+.5)*cs,z=L.z0+(j+.5)*cs;let y=li?-H:0;
  if(!li&&x>10.6&&x<12.9&&z<-3.6&&z>-8.6)y=W.groundY(x,z,0);
  L.walk[i+j*L.nx]=W.blocked(x,z,y,.2,true)?0:1;
  let sb=0;for(const s of W.near(x,z)){if(s.door!=null)continue;const yl=y+1.1,yh=y+1.7;if(yh<s.y1||yl>s.y2)continue;if(x>s.x1&&x<s.x2&&z>s.z1&&z<s.z2){sb=1;break}}L.sight[i+j*L.nx]=sb?0:1}});
 NAV.N0=L0.nx*L0.nz;}
function cellOf(x,z,li){const L=NAV.L[li];const i=Math.floor((x-L.x0)/NAV.cs),j=Math.floor((z-L.z0)/NAV.cs);if(i<0||j<0||i>=L.nx||j>=L.nz)return -1;return i+j*L.nx}
function cellPos(li,c){const L=NAV.L[li];const i=c%L.nx,j=(c/L.nx)|0;const x=L.x0+(i+.5)*NAV.cs,z=L.z0+(j+.5)*NAV.cs;return V(x,0,z)}
function isStair(x,z){return x>10.6&&x<12.9&&z<-3.6&&z>-8.6}
function walkable(li,c){return c>=0&&NAV.L[li].walk[c]===1}
function nearestWalk(li,x,z){let c=cellOf(x,z,li);if(walkable(li,c))return c;const L=NAV.L[li];for(let r=1;r<8;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const cc=cellOf(x+di*NAV.cs,z+dj*NAV.cs,li);if(walkable(li,cc))return cc}return -1}
function Heap(){const k=[],v=[];this.size=()=>k.length;this.push=(p,x)=>{k.push(p);v.push(x);let i=k.length-1;while(i>0){const q=(i-1)>>1;if(k[q]<=k[i])break;[k[q],k[i]]=[k[i],k[q]];[v[q],v[i]]=[v[i],v[q]];i=q}};
 this.pop=()=>{const top=v[0];const lk=k.pop(),lv=v.pop();if(k.length){k[0]=lk;v[0]=lv;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<k.length&&k[l]<k[m])m=l;if(r<k.length&&k[r]<k[m])m=r;if(m===i)break;[k[m],k[i]]=[k[i],k[m]];[v[m],v[i]]=[v[i],v[m]];i=m}}return top}}
function astar(sx,sz,sl,tx,tz,tl){const a=nearestWalk(sl,sx,sz),b=nearestWalk(tl,tx,tz);if(a<0||b<0)return null;const N0=NAV.N0;const sId=sl?N0+a:a,tId=tl?N0+b:b;
 const g=new Map(),came=new Map(),tp=tl?cellPos(1,b):cellPos(0,b);g.set(sId,0);let it=0;const heap=new Heap();heap.push(0,sId);const closed=new Set();
 const pos=id=>id>=N0?cellPos(1,id-N0):cellPos(0,id);
 while(heap.size()&&it++<60000){const cur=heap.pop();if(closed.has(cur))continue;closed.add(cur);if(cur===tId)break;
  const li=cur>=N0?1:0,c=li?cur-N0:cur,L=NAV.L[li],ci=c%L.nx,cj=(c/L.nx)|0,cp=cellPos(li,c);
  const nb=[];for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=L.nx||nj>=L.nz)continue;const nc=ni+nj*L.nx;if(!L.walk[nc])continue;if(di&&dj&&(!L.walk[ci+di+cj*L.nx]||!L.walk[ci+(cj+dj)*L.nx]))continue;nb.push([li?N0+nc:nc,di&&dj?1.414:1])}
  /* stairs link levels */
  if(li===0&&isStair(cp.x,cp.z)&&cp.z<-8.1){[0,-.5].forEach(o=>{const c1=cellOf(cp.x,cp.z+o,1);if(walkable(1,c1))nb.push([N0+c1,1])})}
  if(li===1&&cp.x>10.6&&cp.x<12.9&&cp.z<-8.1&&cp.z>-9.2){[0,.5].forEach(o=>{const c0=cellOf(cp.x,cp.z+o,0);if(walkable(0,c0)&&isStair(cp.x,cp.z+o))nb.push([c0,1])})}
  const gc=g.get(cur);for(const [n,w] of nb){const ng=gc+w;if(ng<(g.has(n)?g.get(n):1e9)){g.set(n,ng);came.set(n,cur);const np=pos(n);const lvPen=(n>=N0)!==(tId>=N0)?20:0;heap.push(ng+Math.hypot(np.x-tp.x,np.z-tp.z)*1.2+lvPen,n)}}}
 if(!came.has(tId)&&sId!==tId)return null;const path=[];let c=tId;while(c!==undefined&&c!==sId){const p=pos(c);p.y=c>=N0?-H:0;path.push(p);c=came.get(c)}path.reverse();return path}
function sight(a,b){/* line of sight at eye height on the same level */if(Math.abs(a.y-b.y)>1.6)return false;const li=W.level(Math.min(a.y,b.y)+.5);const d=Math.hypot(b.x-a.x,b.z-a.z);const n=Math.ceil(d/.25);for(let k=1;k<n;k++){const x=a.x+(b.x-a.x)*k/n,z=a.z+(b.z-a.z)*k/n;const c=cellOf(x,z,li);if(c<0)return false;if(!NAV.L[li].sight[c])return false}
 for(const d of W.doors){if(!d||d.cur>.5)continue;/* closed doors block sight */const s=d.solid;if(segBox(a,b,s))return false}return true}
function segBox(a,b,s){for(let k=0;k<=20;k++){const x=a.x+(b.x-a.x)*k/20,z=a.z+(b.z-a.z)*k/20;if(x>s.x1-.05&&x<s.x2+.05&&z>s.z1-.05&&z<s.z2+.05)return true}return false}

/* ---------- UI helpers ---------- */
const HERO_SCREENS=['menu','mode','online'];let curScreen='boot';
function show(id){curScreen=id;document.querySelectorAll('.screen').forEach(e=>e.hidden=e.id!==id);$('#heroShow').hidden=!HERO_SCREENS.includes(id)}
let toastT=null;function toast(t,ms){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,ms||2600)}
function pingCls(p){return p==null?'':p<90?'g':p<180?'y':'r'}
function fmtT(t){t=Math.max(0,Math.floor(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}

/* ---------- boot / intro ---------- */
I18N.apply();
function bootReady(){$('#bootBtn').disabled=false;$('#bootBtn').textContent=T('boot_enter');$('#bootMsg').textContent=T('boot_tip');if(Q.get('auto'))startIntro(true);else if(Q.get('menu'))toMenu()}
function toMenu(){intro=null;show('menu');ST.phase='menu';setHero(me.char)}
$('#bootBtn').onclick=()=>{S.init();S.resume();applyVolumes();startIntro(false)};
let intro=null;
const INTRO_LINES=[[1,6,'intro1'],[7,13,'intro2'],[14,20,'intro3'],[21,27,'intro4'],[28,34,'intro5'],[35,40,'intro6']];
const INTRO_CAM=[[0,[80,45,150],[0,2,20]],[6,[30,18,112],[0,1,50]],[12,[0,2.2,98],[0,1.6,60]],[19,[0,1.9,62],[-8,1.5,40]],[26,[-30,2.4,42],[-40,1,30]],[33,[3,1.75,19],[4,1.8,9]],[40,[6.4,1.75,13.2],[6.8,1.8,9]],[44,[6.7,1.75,12.0],[6.8,1.8,9]]];
function camAt(t){let k=0;while(k<INTRO_CAM.length-2&&t>INTRO_CAM[k+1][0])k++;const a=INTRO_CAM[k],b=INTRO_CAM[k+1];let u=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));u=u*u*(3-2*u);
 return [V(...a[1]).lerp(V(...b[1]),u),V(...a[2]).lerp(V(...b[2]),u)]}
function startIntro(quick){show('intro');S.ambience(true);intro={t:quick?40:0,roared:false};monster.model.group.visible=false;ST.phase='intro'}
$('#skipBtn').onclick=endIntro;
function endIntro(){if(!intro)return;intro=null;introL.intensity=0;$('#introTitle').hidden=true;monster.model.group.visible=false;W.flickerAll=0;toMenu()}
function updateIntro(dt){intro.t+=dt;const t=intro.t;const [p,l]=camAt(t);cam.position.copy(p);cam.lookAt(l);
 const line=INTRO_LINES.find(L=>t>=L[0]&&t<L[1]);$('#sub').textContent=line?T(line[2]):'';$('#introBar i').style.width=Math.min(100,t/46*100)+'%';
 if(t>34&&!intro.mon){intro.mon=1;const g=monster.model.group;g.visible=true;g.position.set(6.8,0,7.9);g.rotation.y=0;monster.model.play('idle2',0);introL.intensity=2.2}
 if(t>37.5&&!intro.roared){intro.roared=true;S.roar(6.8,1.8,8.7,1.2);W.flickerAll=1.6;monster.model.play('scare',.1)}
 if(t>41.5&&!intro.title){intro.title=1;monster.model.group.visible=false;introL.intensity=0;$('#introTitle').hidden=false}
 if(t>46)endIntro()}

/* ---------- hero picker (main menu) ---------- */
try{const c=localStorage.getItem('qu_char');if(c&&A.CHARS[c])me.char=c}catch(e){}
function setHero(c){me.char=c;try{localStorage.setItem('qu_char',c)}catch(e){}$('#heroName').textContent=charName(c);if(PORTRAIT[c])$('#heroImg').src=PORTRAIT[c];$('#heroImg').alt=charName(c);selChar(c)}
function charName(c){const n=A.CHARS[c]?A.CHARS[c].name:c;return c==='boy'?({uz:'Bola',ru:'Мальчик',en:'Boy'}[I18N.lang]||n):n}
function cycleHero(d){const ks=Object.keys(A.CHARS);setHero(ks[(ks.indexOf(me.char)+d+ks.length)%ks.length])}
$('#heroPrev').onclick=()=>cycleHero(-1);$('#heroNext').onclick=()=>cycleHero(1);

/* ---------- menus ---------- */
let flow='solo',setupFrom='mode';
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));
$('#mPlay').onclick=()=>{S.init();S.resume();applyVolumes();show('mode')};
$('#mSettings').onclick=()=>openSettings('menu');
$('#mOnline').onclick=()=>{show('online');$('#joinErr').textContent=''};
$('#mSolo').onclick=()=>{flow='solo';setupFrom='mode';openSetup()};
$('#mCreate').onclick=()=>{flow='host';setupFrom='online';openSetup()};
$('#mOpen').onclick=()=>{flow='open';setupFrom='online';openSetup()};
$('#joinCode').addEventListener('input',()=>{$('#joinCode').value=$('#joinCode').value.replace(/\D/g,'').slice(0,4);$('#joinErr').textContent=''});
$('#mJoin').onclick=()=>{const c=$('#joinCode').value;if(!/^\d{4}$/.test(c)){$('#joinErr').textContent=T('err_code');return}$('#codeIn').value=c;flow='join';setupFrom='online';openSetup()};
$('#joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')$('#mJoin').click()});
if(window.PREVIEW_SOLO){const msg=()=>toast(T('preview_only'),5000);$('#mOnline').onclick=msg}
function openSetup(){show('setup');$('#codeRow').hidden=flow!=='join';$('#setupTitle').textContent=T({host:'t_create',join:'t_join',solo:'t_solo',open:'t_open'}[flow]);
 try{const n=localStorage.getItem('qu_name');if(n&&!$('#nameIn').value)$('#nameIn').value=n}catch(e){}$('#setupErr').textContent='';selChar(me.char)}
document.querySelectorAll('.charCard').forEach(b=>b.onclick=()=>setHero(b.dataset.c));
function selChar(c){me.char=c;document.querySelectorAll('.charCard').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===c))}
$('#setupBack').onclick=()=>show(setupFrom);
$('#codeIn').addEventListener('input',()=>{$('#codeIn').value=$('#codeIn').value.replace(/\D/g,'').slice(0,4);$('#setupErr').textContent=''});
$('#nameIn').addEventListener('input',()=>$('#setupErr').textContent='');
$('#nameIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#setupGo').click()});
function becomeHost(name){me.id='h';ST.players={h:{name,lg:I18N.lang,char:me.char,alive:true,hide:-1,car:false,ping:0}};ST.phase='lobby';chatLog.length=0;showLobby();VC.init()}
$('#setupGo').onclick=()=>{const name=$('#nameIn').value.trim().slice(0,14);if(!name){$('#setupErr').textContent=T('err_name');return}
 if(flow==='join'&&!/^\d{4}$/.test($('#codeIn').value)){$('#setupErr').textContent=T('err_code');return}
 me.name=name;try{localStorage.setItem('qu_name',name)}catch(e){}S.init();S.resume();applyVolumes();
 if(flow==='solo'){N.solo();me.id='me';ST.players={me:{name,char:me.char,alive:true,hide:-1,car:false}};startGame(hostInitState());return}
 VC.init();
 if(flow==='host'){$('#setupGo').disabled=true;$('#setupErr').textContent=T('opening');N.host((err,code)=>{$('#setupGo').disabled=false;if(err){$('#setupErr').textContent=T('open_fail');return}becomeHost(name)})}
 else if(flow==='open'){startRooms()}
 else joinRoom($('#codeIn').value,err=>{$('#setupErr').textContent=err==='notfound'?T('not_found'):T('conn_fail')})};
function joinRoom(code,onErr){$('#setupGo').disabled=true;$('#setupErr').textContent=T('connecting');
 N.join(code,err=>{$('#setupGo').disabled=false;if(err){N.close();onErr(err);return}me.id=N.myId;N.send({t:'hello',name:me.name,lg:I18N.lang,char:me.char});ST.phase='lobby';chatLog.length=0;showLobby()})}

/* ---------- open rooms: find one with a free slot or open our own ---------- */
let roomsRun=0,roomsFound=[];
function startRooms(again){const run=++roomsRun;if(!again){show('rooms');roomsFound=[];renderRooms();$('#roomsStatus').textContent=T('searching')}$('#roomsQuick').disabled=true;
 N.scan(found=>{if(run!==roomsRun)return;roomsFound=found;renderRooms();const ok=found.filter(r=>r.phase==='lobby'&&r.players<r.max).sort((a,b)=>a.ping-b.ping);
  $('#roomsStatus').textContent=ok.length?T('rooms_found',{n:ok.length}):T('rooms_none');
  setTimeout(()=>{if(run===roomsRun&&curScreen==='rooms')startRooms(true)},9000)},
  part=>{if(run!==roomsRun||again)return;roomsFound=part;renderRooms()})}
function joinOpen(list,i){if(i>=list.length){$('#roomsStatus').textContent=T('err_join');startRooms(true);return}const r=list[i];roomsRun++;
 N.join('O'+(r.slot+1),err=>{if(err){N.close();joinOpen(list,i+1);return}me.id=N.myId;N.send({t:'hello',name:me.name,lg:I18N.lang,char:me.char});ST.phase='lobby';chatLog.length=0;showLobby()})}
function hostOpenRoom(){roomsRun++;$('#roomsStatus').textContent=T('opening');N.hostOpen((err)=>{if(err){$('#roomsStatus').textContent=T('open_fail');return}becomeHost(me.name)})}
function renderRooms(){const ok=roomsFound.filter(r=>r.phase==='lobby'&&r.players<r.max);$('#roomsQuick').disabled=!ok.length;
 const html=roomsFound.length?roomsFound.slice().sort((a,b)=>a.ping-b.ping).map(r=>'<div class="rrow"><b>'+FLAG(r.lg)+esc(r.name)+'</b><span>'+r.players+' / '+r.max+'</span><span><span class="pdot '+pingCls(r.ping)+'"></span> '+r.ping+' '+T('ms')+'</span><span class="st">'+(r.phase==='lobby'?T('waiting_state'):'…')+'</span><button data-slot="'+r.slot+'"'+(r.phase==='lobby'&&r.players<r.max?'':' disabled')+'>'+T('join_btn')+'</button></div>').join(''):'';
 /* only touch the DOM when something changed, so a tap on "Join" is never lost to a refresh */
 if(html===renderRooms.last)return;renderRooms.last=html;$('#roomList').innerHTML=html;
 $('#roomList').querySelectorAll('button[data-slot]').forEach(b=>b.onclick=()=>{const r=roomsFound.find(x=>x.slot===+b.dataset.slot);if(r)joinOpen([r],0)})}
$('#roomsQuick').onclick=()=>{const ok=roomsFound.filter(r=>r.phase==='lobby'&&r.players<r.max).sort((a,b)=>a.ping-b.ping);if(ok.length)joinOpen(ok,0)};
$('#roomsOwn').onclick=()=>hostOpenRoom();$('#roomsRefresh').onclick=()=>startRooms();
$('#roomsBack').onclick=()=>{roomsRun++;N.close();show('online')};

/* ---------- lobby ---------- */
function showLobby(){show('lobby');renderLobby();renderChat()}
function renderLobby(){if(curScreen!=='lobby')return;const ids=Object.keys(ST.players);const host=N.mode==='host';
 $('#lobbyTitle').textContent=N.open?T('open_room')+' '+(N.code||''):T('room')+' '+(N.code||'');
 $('#lobbyBadge').textContent=N.open?T('open_badge'):T('closed_badge');$('#lobbyBadge').className='badge '+(N.open?'ok':'lock');
 $('#codeWrap').hidden=N.open;$('#lobbyCode').textContent=N.code||'----';$('#lobbyHint').textContent=T('code_hint');
 const myPing=host?0:N.ping;$('#lobbyPing').textContent=host?T('host_tag'):(myPing+' '+T('ms'));
 const rows=[],dyn=[];for(let k=0;k<MAXP;k++){const id=ids[k];if(!id){rows.push('<li class="empty">'+T('empty_slot')+'</li>');continue}const p=ST.players[id];const pg=id==='h'?0:(p.ping||0);
  const talk=false;dyn.push([id,pg]);
  rows.push('<li data-id="'+esc(id)+'"><img src="'+($('#thumb_'+p.char).src||'')+'" alt=""><span class="nm">'+FLAG(p.lg)+esc(p.name)+'<i class="muted">'+(id==='h'?'('+T('host_tag')+(id===me.id?', '+T('you'):'')+')':id===me.id?'('+T('you')+')':'')+'</i></span>'+
   (id===me.id?'<button class="vbtn '+(VC.on&&!VC.denied?(talk?'on':''):'off')+'" data-mymic title="'+esc(T('mic'))+'">'+MIC_ICON(!(VC.on&&!VC.denied))+'</button>'
    :(()=>{const m=VC.isMuted(p.name);return '<button class="vbtn'+(m?' muted':talk?' on':'')+'" data-mute="'+esc(p.name)+'" title="'+esc(T(m?'unmute_p':'mute_p'))+'">'+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/>'+(m?'<path d="M16 9l5 6M21 9l-5 6"/>':'<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>')+'</svg>'+'</button>'})())+
   '<span class="pg"></span></li>')}
 const lh=rows.join('');if(lh!==renderLobby.last){renderLobby.last=lh;$('#lobbyList').innerHTML=lh}renderLobbyMic();
 /* talking light and ping are patched in place (the row itself is only rebuilt when it really changes) */
 dyn.forEach(([id,pg])=>{const li=$('#lobbyList').querySelector('li[data-id="'+id+'"]');if(!li)return;const talk=id===me.id?VC.speaking:VC.isTalking(id);const b=li.querySelector('.vbtn');if(b)b.classList.toggle('on',talk&&!b.classList.contains('muted')&&!b.classList.contains('off'));
  const ph='<span class="pdot '+pingCls(pg)+'"></span>'+(id==='h'?'—':pg+' '+T('ms'));const pe=li.querySelector('.pg');if(pe&&pe.innerHTML!==ph)pe.innerHTML=ph});
 const n=ids.length;$('#lobbyCount').textContent=T('lobby_count',{n});$('#lobbyStart').hidden=!host;$('#lobbyStart').disabled=n<2;$('#lobbyNeed').hidden=n>=2||!host;$('#lobbyWait').hidden=host}
const FLAGS={uz:'<svg class="flag" viewBox="0 0 18 12"><rect width="18" height="12" fill="#fff"/><rect width="18" height="4" fill="#0099b5"/><rect y="8" width="18" height="4" fill="#1eb53a"/><rect y="3.7" width="18" height=".5" fill="#ce1126"/><rect y="7.8" width="18" height=".5" fill="#ce1126"/><circle cx="3" cy="2" r="1.3" fill="#fff"/><circle cx="3.5" cy="2" r="1.1" fill="#0099b5"/></svg>',
ru:'<svg class="flag" viewBox="0 0 18 12"><rect width="18" height="4" fill="#fff"/><rect y="4" width="18" height="4" fill="#0039a6"/><rect y="8" width="18" height="4" fill="#d52b1e"/></svg>',
en:'<svg class="flag" viewBox="0 0 60 30" preserveAspectRatio="none"><rect width="60" height="30" fill="#012169"/><path d="M0 0L60 30M60 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0L60 30M60 0L0 30" stroke="#c8102e" stroke-width="2.4"/><path d="M30 0V30M0 15H60" stroke="#fff" stroke-width="10"/><path d="M30 0V30M0 15H60" stroke="#c8102e" stroke-width="6"/></svg>'};
function FLAG(lg){return FLAGS[lg]||''}
function okLg(l){return FLAGS[l]?l:'uz'}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
$('#lobbyStart').onclick=()=>{if(Object.keys(ST.players).length<2)return;const s=hostInitState();N.broadcast({t:'start',s});startGame(s)};
$('#lobbyLeave').onclick=()=>{VC.closeAll();N.close();show('online');ST.phase='menu'};
$('#copyCode').onclick=()=>{const c=$('#lobbyCode').textContent;try{navigator.clipboard.writeText(c).then(()=>toast(T('copied'))).catch(()=>toast(c))}catch(e){toast(c)}};
N.info=()=>({players:Object.keys(ST.players).length,max:MAXP,phase:ST.phase==='lobby'?'lobby':'play',name:(ST.players.h||{}).name||'?',lg:(ST.players.h||{}).lg});
N.onCall=call=>VC.onIncoming(call);
N.onLeave=id=>{if(ST.players[id]){const n=ST.players[id].name;if(ST.phase==='lobby'){delete ST.players[id];N.broadcast({t:'lobby',players:ST.players});renderLobby()}else{ST.players[id].alive=false;ST.players[id].gone=true;broadcastState();hostCheckEnd()}sysChat(T('left',{n}));N.broadcast({t:'sys',k:'left',n});toast(T('left',{n}));VC.sync(Object.keys(ST.players),me.id)}};
N.onStatus=(s)=>{if(s==='closed'&&N.mode==='client'){toast(T('host_lost'),4000);setTimeout(()=>quitToMenu(),2500)}};
VC.onDenied=()=>toast(T('mic_denied'),5000);

/* ---------- chat ---------- */
const chatLog=[];let chatLast=0;
function addChat(name,text,cls,lg){chatLog.push({name,text,cls,lg});if(chatLog.length>60)chatLog.shift();renderChat()}
function sysChat(text,cls){addChat(null,text,cls||'sys')}
function renderChat(){const html=chatLog.slice(-40).map(c=>c.name?'<div>'+FLAG(c.lg)+'<b>'+esc(c.name)+':</b> '+esc(c.text)+'</div>':'<div class="'+c.cls+'">'+esc(c.text)+'</div>').join('');
 ['#lobbyChat','#hudLog'].forEach(s=>{const e=$(s);e.innerHTML=s==='#hudLog'?chatLog.slice(-6).map(c=>c.name?'<div>'+FLAG(c.lg)+'<b>'+esc(c.name)+':</b> '+esc(c.text)+'</div>':'<div class="'+c.cls+'">'+esc(c.text)+'</div>').join(''):html;e.scrollTop=e.scrollHeight})}
function sendChat(text){text=String(text||'').trim().slice(0,120);if(!text)return;const now=performance.now();if(now-chatLast<700)return;chatLast=now;
 if(N.mode==='client')N.send({t:'chat',m:text});else if(N.mode==='host')hostChat('h',text);else addChat(me.name,text,null,I18N.lang)}
function hostChat(from,text){const p=ST.players[from];if(!p)return;text=String(text).slice(0,120);N.broadcast({t:'chat',n:p.name,lg:p.lg,m:text});addChat(p.name,text,null,p.lg)}
document.querySelectorAll('form[data-chat]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const i=f.querySelector('input');sendChat(i.value);i.value='';if(f.id==='hudForm'){i.blur()}}));
$('#hudForm input').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';e.target.blur()}});

/* ---------- network message handling ---------- */
N.onMsg=(from,m)=>{if(!m||!m.t)return;
 if(N.mode==='host'){
  if(m.t==='hello'){if(ST.phase!=='lobby'||Object.keys(ST.players).length>=MAXP){N.to(from,{t:'full'});return}ST.players[from]={name:String(m.name).slice(0,14),lg:okLg(m.lg),char:A.CHARS[m.char]?m.char:'marlon',alive:true,hide:-1,car:false,ping:0};N.broadcast({t:'lobby',players:ST.players});renderLobby();const n=ST.players[from].name;sysChat(T('joined',{n}));N.broadcast({t:'sys',k:'joined',n});VC.sync(Object.keys(ST.players),me.id)}
  else if(m.t==='pos'){const r=remoteFor(from);if(r){r.tpos.set(m.p[0],m.p[1],m.p[2]);r.try=m.ry;r.sp=m.sp;r.fl=m.fl;r.pitch=m.pi||0}const p=ST.players[from];if(p){p.spk=!!m.k;if(m.pg!=null)p.ping=m.pg}}
  else if(m.t==='pi'){const p=ST.players[from];if(p){p.ping=m.v|0;p.spk=!!m.k}}
  else if(m.t==='lg'){const p=ST.players[from];if(p){p.lg=okLg(m.v);if(ST.phase==='lobby'){N.broadcast({t:'lobby',players:ST.players});renderLobby()}}}
  else if(m.t==='chat')hostChat(from,m.m)
  else if(m.t==='act')hostAct(from,m.a,m.i)}
 else{
  if(m.t==='lobby'){ST.players=m.players;renderLobby();VC.sync(Object.keys(ST.players),me.id)}
  else if(m.t==='full'){toast(T('full'),4000);N.close();show('online')}
  else if(m.t==='start')startGame(m.s)
  else if(m.t==='chat')addChat(m.n,m.m,null,okLg(m.lg))
  else if(m.t==='sys')sysChat(T(m.k,{n:m.n}))
  else if(m.t==='snap'){for(const id in m.pl){if(id===me.id)continue;const r=remoteFor(id);if(!r)continue;const a=m.pl[id];r.tpos.set(a[0],a[1],a[2]);r.try=a[3];r.sp=a[4];r.fl=a[5];if(ST.players[id])ST.players[id].ping=a[6]}
   (m.m||[]).forEach((a,i)=>{const v=VIEWS[i];if(!v)return;v.tpos.set(a[0],a[1],a[2]);v.try=a[3];v.vis=!!a[5];if(a[4]!==v.anim||a[6]!==v.ts){v.anim=a[4];v.ts=a[6]||1;v.model.play(v.anim,.2,v.ts)}});ST.t=m.time}
  else if(m.t==='state')applyState(m.s)
  else if(m.t==='ev')onEvent(m)}};
/* lobby: everybody reports ping + talking every 2 s; the host shares it */
setInterval(()=>{if(ST.phase!=='lobby')return;if(N.mode==='client')N.send({t:'pi',v:N.ping,k:VC.speaking?1:0});else if(N.mode==='host'){N.broadcast({t:'lobby',players:ST.players})}renderLobby()},2000);

/* ---------- starting a match ---------- */
function hostInitState(){const kSpot=Math.floor(Math.random()*W.KEY.length);let pool=W.BAT.map((b,i)=>i);const outside=pool.filter(i=>W.BAT[i].out);const bSpot=Math.random()<.78?outside[Math.floor(Math.random()*outside.length)]:pool[Math.floor(Math.random()*pool.length)];
 let cSpot=kSpot;for(let k=0;k<30&&(cSpot===kSpot||(W.KEY[cSpot].c!=null&&W.KEY[cSpot].c===W.KEY[kSpot].c));k++)cSpot=Math.floor(Math.random()*W.KEY.length);
 const s={players:ST.players,cont:CONT.map(()=>0),doors:W.doors.map(()=>1),items:{key:{spot:kSpot,holder:null,inst:false,pos:null},bat:{spot:bSpot,holder:null,inst:false,pos:null},cross:{spot:cSpot,holder:null,inst:false,pos:null}},car:{key:false,bat:false},ended:null};
 Object.values(s.players).forEach(p=>{p.alive=true;p.hide=-1;p.car=false});return s}
let hostT=null;
function startGame(s){endShown=false;applyState(s);ST.phase='play';ST.t=0;show('hud');$('#pad').hidden=!TOUCH;
 const ids=Object.keys(ST.players);const idx=Math.max(0,ids.indexOf(me.id));P.pos.set(-2+idx*1,0,87);P.yaw=0;P.pitch=0;P.alive=true;P.hide=-1;P.inCar=false;P.fl=true;P.stamina=1;flash.intensity=2.6;
 ids.forEach(id=>{if(id!==me.id)remoteFor(id)});
 const online=N.mode!=='solo';$('#hudChat').hidden=!online;$('#micWrap').hidden=!online;$('#hudChat').classList.toggle('mini',TOUCH);renderMic();
 if(online){VC.sync(ids,me.id);if(!VC.on||VC.denied)setTimeout(()=>toast(T('mic_off_hint'),4000),2500)}
 if(N.mode!=='client'){hostT={next:'scare',at:FAST?8:60,huntAt:FAST?20:300};MSS.forEach(m=>{m.mode='away';m.dead=false;m.pos.set(0,-50,0)})}
 renderObjectives();renderPlayers();S.ambience(true);toast(N.mode==='solo'?T('start_solo'):T('start_mp'),4000);
 if(!TOUCH)setTimeout(()=>toast(T('controls'),6500),4200)}
function applyState(s){if(s.players)ST.players=s.players;ST.cont=s.cont||ST.cont;ST.doors=s.doors||ST.doors;ST.items=s.items||ST.items;ST.car=s.car||ST.car;
 ST.ended=s.ended||null;if(!ST.items.cross)ST.items.cross={spot:0,holder:null,inst:true,pos:null};
 const mp=ST.players[me.id];if(mp){if(!mp.alive&&P.alive&&ST.phase==='play'){P.alive=false}P.hide=mp.hide;P.inCar=mp.car}
 renderObjectives();renderPlayers();if(ST.ended&&!endShown){endShown=true;endGame(ST.ended)}}
function broadcastState(){const s={players:ST.players,cont:ST.cont,doors:ST.doors,items:ST.items,car:ST.car,ended:ST.ended};if(N.mode==='host')N.broadcast({t:'state',s});applyState(s)}
function remoteFor(id){if(id===me.id)return null;if(remotes[id])return remotes[id];const p=ST.players[id];if(!p)return null;const ch=A.makeCharacter(p.char);scene.add(ch.group);const tag=A.nameTag(p.name);tag.position.y=2.05;ch.group.add(tag);
 const sp=new THREE.SpotLight(0xfff1d6,0,18,.5,.5,1.3);sp.position.set(.2,1.5,.2);const tg=new THREE.Object3D();tg.position.set(0,1.2,3);ch.group.add(sp);ch.group.add(tg);sp.target=tg;
 return remotes[id]={ch,tag,sp,pos:V(0,0,87),tpos:V(0,0,87),ry:0,try:0,sp_:0,sp:0,fl:true,stepT:0}}

/* ---------- actions (host validates) ---------- */
function act(a,i){if(N.mode==='client')N.send({t:'act',a,i});else hostAct(me.id,a,i)}
function hostAct(pid,a,i){const pl=ST.players[pid];if(!pl||!pl.alive||ST.ended)return;let ch=false;const ev=[];
 if(a==='cont'){if(!CONT[i])return;ST.cont[i]=ST.cont[i]?0:1;ch=true;ev.push({e:'sfx',s:'slide',p:CONT[i].pos.toArray()})}
 else if(a==='door'){if(!W.doors[i])return;ST.doors[i]=ST.doors[i]?0:1;ch=true;ev.push({e:'sfx',s:'creak',p:W.doors[i].pos.toArray()})}
 else if(a==='take'){const it=ST.items[i];if(it&&!it.holder&&!it.inst){it.holder=pid;it.pos=null;ch=true;ev.push({e:'pick',who:pid,item:i})}}
 else if(a==='hide'){const occ=Object.values(ST.players).some(p=>p.hide===i);if(!occ&&pl.hide<0&&HIDE[i]){pl.hide=i;ch=true;MSS.forEach(m=>{m.sawHide[pid]=m.mode==='hunt'&&m.seen[pid]&&(ST.t-m.seen[pid])<1.2?ST.t:0});ev.push({e:'sfx',s:'creak',p:HIDE[i].pos.toArray()})}}
 else if(a==='unhide'){if(pl.hide>=0){ev.push({e:'sfx',s:'creak',p:HIDE[pl.hide].pos.toArray()});pl.hide=-1;ch=true}}
 else if(a==='bat'){const it=ST.items.bat;if(it.holder===pid&&!ST.car.bat){it.holder=null;it.inst=true;ST.car.bat=true;ch=true;ev.push({e:'msg',k:'m_bat',n:pl.name},{e:'sfx',s:'clunk'})}}
 else if(a==='key'){const it=ST.items.key;if(it.holder===pid&&!ST.car.key){it.holder=null;it.inst=true;ST.car.key=true;ch=true;ev.push({e:'msg',k:'m_key',n:pl.name},{e:'sfx',s:'clunk'})}}
 else if(a==='seat'){if(ST.car.key&&ST.car.bat&&!pl.car){pl.car=true;pl.hide=-1;ch=true;ev.push({e:'msg',k:'m_seat',n:pl.name})}}
 else if(a==='leave'){if(pl.car){pl.car=false;ch=true}}
 else if(a==='drive'){if(pl.car&&ST.car.key&&ST.car.bat){ST.ended='win';ST.endT=ST.t;ch=true;ev.push({e:'drive'})}}
 ev.forEach(e=>{if(N.mode==='host')N.broadcast(Object.assign({t:'ev'},e));onEvent(e)});if(ch)broadcastState()}
let carDrive=-1;
function onEvent(m){const e=m.e;const nm=id=>(ST.players[id]||{}).name||'?';
 if(e==='sfx'){const p=m.p||[P.pos.x,P.pos.y+1,P.pos.z];if(m.s==='slide')S.slide(...p);else if(m.s==='creak')S.creak(...p);else if(m.s==='clunk')S.clunk()}
 else if(e==='pick'){const k=m.item;if(m.who===me.id){S.pickup();toast(T('got_'+k),3800)}else toast(T('found_'+k,{n:nm(m.who)}),3500)}
 else if(e==='msg')toast(T(m.k,{n:m.n}),3200)
 else if(e==='scare'){W.flickerAll=1.6;roarFor(m.k,m.p[0],m.p[1]+1.5,m.p[2],1.1);if(m.target===me.id){shake=1;S.stinger()}}
 else if(e==='hunt'){W.flickerAll=2.2;(m.ps||[]).forEach((q,i)=>setTimeout(()=>roarFor(q[3],q[0],q[1]+1.5,q[2],1.3,.9),i*700));toast(T('hunt'),3500);sysChat(T('hunt'),'warn')}
 else if(e==='leave'){toast(T('gone'),3000);W.flickerAll=.8}
 else if(e==='heard'){if(m.who===me.id){toast(T('heard'),3000);shake=.4}}
 else if(e==='gaveup'){if(m.who===me.id)toast(T('gave_up'),3500)}
 else if(e==='caught'){if(m.who===me.id)jumpscare(m.k);else{toast(T('caught',{n:nm(m.who)}),3500);roarFor(m.k,m.p[0],m.p[1]+1.5,m.p[2],1.3,1.1)}}
 else if(e==='banish'){S.holy();roarFor(m.k,m.p[0],m.p[1]+1.5,m.p[2],1.4,1.35);W.flickerAll=1.2;if(m.who===me.id){toast(T('banish_me'),4000);const h=$('#holyFlash');h.hidden=true;void h.offsetWidth;h.hidden=false;setTimeout(()=>h.hidden=true,1300);shake=.8}else toast(T('banish',{n:nm(m.who)}),4000)}
 else if(e==='drive'){S.engine();carDrive=0}}

/* ---------- monster AI (host): three monsters hunt together ---------- */
const KINDS=['wolf','zombie','parasite'];const ROARS={wolf:[1,0],zombie:[1.25,0],parasite:[.85,1]};
function roarFor(k,x,y,z,vol,rm){const r=ROARS[k]||ROARS.wolf;S.roar(x,y,z,vol,r[0]*(rm||1),r[1])}
const MSS=KINDS.map((k,i)=>({i,kind:k,mode:'away',pos:V(0,-50,0),ry:0,path:null,repath:0,target:null,lastSeen:null,lostT:0,huntT:0,timer:0,anim:'idle',ts:1,seen:{},sawHide:{},wander:null,dead:false,sniff:0,noiseId:null,doorT:0}));
const MS=MSS[0];
const NOISE={};/* player id -> {pos,t}: where someone was last heard talking */
const heardMsg={};
function playerSpeaking(id){if(id===me.id)return N.mode!=='solo'&&VC.speaking;const p=ST.players[id];return !!(p&&p.spk)}
function alivePlayers(){const out=[];for(const id in ST.players){const p=ST.players[id];if(!p.alive||p.car||p.gone)continue;const pos=id===me.id?P.pos:(remotes[id]?remotes[id].tpos:null);if(!pos)continue;out.push({id,p,pos,ry:id===me.id?P.yaw:remotes[id].try,fl:id===me.id?P.fl:remotes[id].fl})}return out}
function mSees(m,pl){if(pl.p.hide>=0)return false;const d=pl.pos.distanceTo(m.pos);const range=pl.fl?28:18;if(d>range)return false;
 const f=fwdOf(m.ry);const dir=V(pl.pos.x-m.pos.x,0,pl.pos.z-m.pos.z).normalize();if(d>5&&f.dot(dir)<-.2)return false;
 return sight(V(m.pos.x,m.pos.y+1.5,m.pos.z),V(pl.pos.x,pl.pos.y+1.4,pl.pos.z))}
function spawnNear(target,minD,maxD,visible,avoid){const li=W.level(target.pos.y+.5);let best=null;
 for(let k=0;k<80;k++){const a=visible?(target.ry+PI+(Math.random()-.5)*1.2):Math.random()*PI*2;const d=minD+Math.random()*(maxD-minD);
  /* camera looks along -z of yaw; forward = (-sin yaw, -cos yaw) */const fx=visible?-Math.sin(target.ry):Math.cos(a),fz=visible?-Math.cos(target.ry):Math.sin(a);
  const ang=visible?(Math.random()-.5)*.9:0;const cx=Math.cos(ang),sx=Math.sin(ang);const x=target.pos.x+(fx*cx-fz*sx)*d,z=target.pos.z+(fx*sx+fz*cx)*d;
  const c=cellOf(x,z,li);if(!walkable(li,c))continue;const p=V(x,li?-H:0,z);if(li===0&&isStair(x,z))continue;
  if(avoid&&avoid.some(q=>q.distanceTo(p)<8))continue;
  const vis=sight(V(p.x,p.y+1.5,p.z),V(target.pos.x,target.pos.y+1.4,target.pos.z));if(visible&&vis)return p;if(!visible&&!vis)return p;if(!best)best=p}
 return best}
function anyActive(){return MSS.some(m=>!m.dead&&m.mode!=='away')}
function hostMonster(dt){const T=ST.t;const hs=hostT;if(!hs||ST.ended)return;const pls=alivePlayers();
 /* voices: the monsters can hear players who talk (hidden players are muffled) */
 pls.forEach(pl=>{if(pl.p.hide<0&&playerSpeaking(pl.id))NOISE[pl.id]={pos:pl.pos.clone(),t:T}});
 if(!anyActive()){
  const loud=pls.some(pl=>pl.p.hide<0&&playerSpeaking(pl.id));
  if(loud){/* talking while they are away brings them sooner */if(hs.next==='hunt')hs.huntAt=Math.max(T+8,hs.huntAt-dt*1.5);else hs.at=Math.max(T+6,hs.at-dt*1.5)}
  const alive=MSS.filter(m=>!m.dead);
  if(!alive.length)return;
  if(hs.next==='scare'&&T>=hs.at){const cand=pls.filter(p=>p.p.hide<0);if(cand.length){const tg=cand[Math.floor(Math.random()*cand.length)];const sp=spawnNear(tg,4.5,8,true);const m=alive[Math.floor(Math.random()*alive.length)];
    if(sp){m.pos.copy(sp);m.ry=Math.atan2(tg.pos.x-sp.x,tg.pos.z-sp.z);m.mode='scare';m.timer=2.9;mAnim(m,'scare');emit({e:'scare',target:tg.id,p:sp.toArray(),k:m.kind});hs.next='hunt'}else hs.at=T+5}else hs.at=T+5}
  else if(hs.next==='hunt'&&T>=hs.huntAt){if(pls.length){const used=[];const list=[];const off=Math.floor(Math.random()*pls.length);
    alive.forEach((m,j)=>{const tg=pls[(off+j)%pls.length];const sp=spawnNear(tg,16,30,false,used);if(!sp)return;used.push(sp);
     m.pos.copy(sp);m.mode='hunt';m.huntT=0;m.lostT=0;m.target=tg.id;m.lastSeen={pos:tg.pos.clone(),t:T};m.path=null;m.repath=j*.15;m.sniff=0;m.noiseId=null;mAnim(m,'walk');list.push([sp.x,sp.y,sp.z,m.kind])});
    if(list.length)emit({e:'hunt',ps:list});else hs.huntAt=T+4}else hs.huntAt=T+4}
  return}
 MSS.forEach(m=>{if(!m.dead&&m.mode!=='away')hostMonsterOne(m,dt,pls,T)})}
function hostMonsterOne(m,dt,pls,T){
 if(m.mode==='scare'){m.timer-=dt;if(m.timer<=0){m.mode='away';m.pos.set(0,-50,0);W.flickerAll=.6;if(!anyActive()){hostT.next='hunt'}}return}
 if(m.mode==='attack'){m.timer-=dt;if(m.timer<=0)mLeave(m,true);return}
 if(m.mode==='dying'){m.timer-=dt;if(m.timer<=0){m.dead=true;m.mode='away';m.pos.set(0,-50,0);afterLeave(true)}return}
 /* hunt */
 m.huntT+=dt;let seenAny=null,bestD=1e9;pls.forEach(pl=>{if(mSees(m,pl)){m.seen[pl.id]=T;const d=pl.pos.distanceTo(m.pos);if(d<bestD){bestD=d;seenAny=pl}}});
 /* someone hid while being watched: the monster comes to the hiding place, sniffs, and gives up */
 if(!seenAny)pls.forEach(pl=>{if(pl.p.hide>=0&&m.sawHide[pl.id]&&T-m.sawHide[pl.id]<25){const hp=HIDE[pl.p.hide].pos;const d=hp.distanceTo(m.pos);if(d<bestD){seenAny={id:pl.id,pos:V(hp.x,hp.y-1,hp.z),hidden:true,p:pl.p};bestD=d}}});
 let goal=null,speed=2.1;
 if(seenAny){m.target=seenAny.id;m.lastSeen={pos:seenAny.pos.clone(),t:T};m.lostT=0;goal=seenAny.pos;speed=seenAny.hidden?3.0:4.4}
 else{m.lostT+=dt;
  /* follow the freshest voice it can hear */
  let nz=null,nd=1e9,nid=null;for(const id in NOISE){const n=NOISE[id];if(T-n.t>5)continue;const p=ST.players[id];if(!p||!p.alive||p.hide>=0)continue;const d=n.pos.distanceTo(m.pos);if(d<42&&d<nd&&Math.abs(n.pos.y-m.pos.y)<3){nd=d;nz=n;nid=id}}
  if(nz){goal=nz.pos;speed=3.4;m.lostT=Math.min(m.lostT,4);if(m.noiseId!==nid){m.noiseId=nid;if(!heardMsg[nid]||T-heardMsg[nid]>15){heardMsg[nid]=T;emit({e:'heard',who:nid})}}if(nd<1.5)delete NOISE[nid]}
  else if(m.lastSeen&&m.pos.distanceTo(m.lastSeen.pos)>1.2){goal=m.lastSeen.pos;speed=3.2}
  else{m.noiseId=null;if(!m.wander||m.pos.distanceTo(m.wander)<1.2||Math.random()<.003){const pl=pls[Math.floor(Math.random()*pls.length)];const base=pl?pl.pos:m.pos;const li=W.level(base.y+.5);for(let k=0;k<20;k++){const x=base.x+(Math.random()-.5)*16,z=base.z+(Math.random()-.5)*16;if(walkable(li,cellOf(x,z,li))){m.wander=V(x,li?-H:0,z);break}}}goal=m.wander}}
 /* reached a hidden player's spot: sniff, then leave */
 if(seenAny&&seenAny.hidden&&bestD<1.7){m.sniff+=dt;mAnim(m,'idle');if(m.sniff>2.6){emit({e:'gaveup',who:seenAny.id});m.sawHide={};mLeave(m,true)}return}
 /* catch (never hidden players) */
 if(seenAny&&!seenAny.hidden&&bestD<1.25&&Math.abs(seenAny.pos.y-m.pos.y)<1.2){const it=ST.items.cross;if(it&&it.holder===seenAny.id&&!it.inst){banish(m,seenAny.id)}else catchPlayer(m,seenAny.id);return}
 if((m.lostT>22&&m.huntT>35)||m.huntT>140||!pls.length){mLeave(m,false);return}
 if(goal){m.repath-=dt;if(m.repath<=0||!m.path){m.path=astar(m.pos.x,m.pos.z,W.level(m.pos.y+.5),goal.x,goal.z,W.level(goal.y+.5));m.repath=seenAny?.35:1.0}
  let wp=m.path&&m.path[0];while(wp&&Math.hypot(wp.x-m.pos.x,wp.z-m.pos.z)<.45){m.path.shift();wp=m.path[0]}
  const tgt=wp||(seenAny?goal:null);if(tgt){const dx=tgt.x-m.pos.x,dz=tgt.z-m.pos.z,d=Math.hypot(dx,dz);if(d>.05){const st=Math.min(d,speed*dt);m.pos.x+=dx/d*st;m.pos.z+=dz/d*st;const ry=Math.atan2(dx,dz);let dr=ry-m.ry;while(dr>PI)dr-=2*PI;while(dr<-PI)dr+=2*PI;m.ry+=dr*Math.min(1,dt*8)}}
  m.pos.y+=(W.groundY(m.pos.x,m.pos.z,m.pos.y)-m.pos.y)*Math.min(1,dt*8);
  /* open doors on the way */
  W.doors.forEach((d,i)=>{if(ST.doors[i]===0&&d.pos.distanceTo(V(m.pos.x,1.1+m.pos.y,m.pos.z))<1.3){ST.doors[i]=1;broadcastState();emit({e:'sfx',s:'creak',p:d.pos.toArray()})}})}
 mAnim(m,'walk',speed>3?1.9:speed>2.5?1.4:1)}
function mAnim(m,a,ts){if(m.anim!==a||m.ts!==(ts||1)){m.anim=a;m.ts=ts||1}}
function emit(e){if(N.mode==='host')N.broadcast(Object.assign({t:'ev'},e));onEvent(e)}
function afterLeave(silent){if(anyActive())return;const T=ST.t;hostT.next='scare';hostT.at=T+(FAST?6:60);hostT.huntAt=T+(FAST?14:180);if(!silent&&MSS.some(m=>!m.dead))emit({e:'leave'})}
function mLeave(m,silent){m.mode='away';m.pos.set(0,-50,0);m.path=null;m.lastSeen=null;m.sawHide={};m.noiseId=null;m.sniff=0;afterLeave(silent)}
function dropItems(id,pos){['key','bat','cross'].forEach(k=>{const it=ST.items[k];if(it&&it.holder===id){it.holder=null;it.pos=[pos.x,pos.y,pos.z+.4]}})}
function catchPlayer(m,id){const pl=ST.players[id];if(!pl)return;pl.alive=false;pl.hide=-1;const pos=id===me.id?P.pos:(remotes[id]?remotes[id].tpos:m.pos);
 dropItems(id,pos);m.mode='attack';m.timer=2.2;mAnim(m,'attack');broadcastState();emit({e:'caught',who:id,p:m.pos.toArray(),k:m.kind});hostCheckEnd()}
function banish(m,id){const it=ST.items.cross;it.holder=null;it.inst=true;m.mode='dying';m.timer=1.6;mAnim(m,'scare');broadcastState();emit({e:'banish',who:id,p:m.pos.toArray(),k:m.kind})}
function hostCheckEnd(){if(ST.ended)return;const pls=Object.values(ST.players).filter(p=>!p.gone);if(pls.length&&pls.every(p=>!p.alive||p.car)&&pls.some(p=>!p.alive)&&!pls.some(p=>p.car)){ST.ended='lose';setTimeout(broadcastState,2600)}}

/* ---------- local player ---------- */
const keys={};let shake=0,spectate=0,jump=null;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=1;if(e.code==='KeyV'&&VC.ptt)VC.setPttHeld(true);if(ST.phase!=='play'||curScreen!=='hud')return;
 if(e.code==='KeyE'||e.code==='Space'){e.preventDefault();doInteract()}if(e.code==='KeyF')toggleFlash();if(e.code==='Escape'||e.code==='KeyP')openPause();
 if(e.code==='Enter'&&N.mode!=='solo'){e.preventDefault();if(document.pointerLockElement)document.exitPointerLock();Object.keys(keys).forEach(k=>keys[k]=0);$('#hudChat').classList.remove('mini');$('#hudForm input').focus()}});
addEventListener('keyup',e=>{keys[e.code]=0;if(e.code==='KeyV')VC.setPttHeld(false)});
$('#hudForm input').addEventListener('blur',()=>{if(TOUCH)setTimeout(()=>{if(document.activeElement!==$('#hudForm input'))$('#hudChat').classList.add('mini')},350)});
/* keep the keyboard/input focused while the send button is tapped, so the tap is not lost */
document.querySelectorAll('form[data-chat] button').forEach(b=>{b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('mousedown',e=>e.preventDefault())});
$('#hudChat').addEventListener('click',e=>{if(TOUCH&&$('#hudChat').classList.contains('mini')){$('#hudChat').classList.remove('mini');$('#hudForm input').focus()}});
function toggleFlash(){P.fl=!P.fl;flash.intensity=P.fl?2.6:0;$('#flBtn').setAttribute('aria-pressed',P.fl)}
$('#flBtn').onclick=toggleFlash;
let look={active:false,id:null,x:0,y:0},joy={active:false,id:null,x0:0,y0:0,dx:0,dy:0},runHeld=false;
$('#touchLayer').addEventListener('click',()=>{if(ST.phase==='play'&&!TOUCH&&document.pointerLockElement!==cv){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}});
addEventListener('mousemove',e=>{if(ST.phase!=='play')return;if(document.pointerLockElement===cv){P.yaw-=e.movementX*.0023;P.pitch=Math.max(-1.3,Math.min(1.3,P.pitch-e.movementY*.0023))}else if(mouseDrag){P.yaw-=(e.clientX-mdx)*.005;P.pitch=Math.max(-1.3,Math.min(1.3,P.pitch-(e.clientY-mdy)*.004));mdx=e.clientX;mdy=e.clientY}});
let mouseDrag=false,mdx=0,mdy=0;$('#touchLayer').addEventListener('mousedown',e=>{if(TOUCH)return;mouseDrag=true;mdx=e.clientX;mdy=e.clientY});addEventListener('mouseup',()=>mouseDrag=false);
const stage=$('#touchLayer');
stage.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.clientX<innerWidth*.42&&!joy.active){joy={active:true,id:t.identifier,x0:t.clientX,y0:t.clientY,dx:0,dy:0};const j=$('#joy');j.style.left=t.clientX+'px';j.style.top=t.clientY+'px';j.hidden=false}else if(!look.active){look={active:true,id:t.identifier,x:t.clientX,y:t.clientY}}}e.preventDefault()},{passive:false});
stage.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(joy.active&&t.identifier===joy.id){joy.dx=Math.max(-1,Math.min(1,(t.clientX-joy.x0)/55));joy.dy=Math.max(-1,Math.min(1,(t.clientY-joy.y0)/55));$('#joyKnob').style.transform='translate('+joy.dx*36+'px,'+joy.dy*36+'px)'}else if(look.active&&t.identifier===look.id){P.yaw-=(t.clientX-look.x)*.006;P.pitch=Math.max(-1.3,Math.min(1.3,P.pitch-(t.clientY-look.y)*.005));look.x=t.clientX;look.y=t.clientY}}e.preventDefault()},{passive:false});
const tend=e=>{for(const t of e.changedTouches){if(joy.active&&t.identifier===joy.id){joy.active=false;joy.dx=joy.dy=0;$('#joy').hidden=true;$('#joyKnob').style.transform=''}if(look.active&&t.identifier===look.id)look.active=false}};stage.addEventListener('touchend',tend);stage.addEventListener('touchcancel',tend);
$('#runBtn').addEventListener('touchstart',e=>{e.preventDefault();runHeld=true;$('#runBtn').setAttribute('aria-pressed','true')},{passive:false});$('#runBtn').addEventListener('touchend',()=>{runHeld=false;$('#runBtn').setAttribute('aria-pressed','false')});
$('#handBtn').onclick=()=>doInteract();
$('#driveBtn').onclick=()=>act('drive');$('#exitCarBtn').onclick=()=>act('leave');

/* interactables near the player */
let curInter=null;
function interactables(){const out=[];const it=ST.items;const mpl=ST.players[me.id]||{};
 if(P.hide>=0){out.push({label:T('i_unhide'),pos:P.pos,a:'unhide',force:1});return out}
 if(P.inCar)return out;
 CONT.forEach((c,i)=>out.push({label:ST.cont[i]?T('i_close'):T('i_open'),pos:c.pos,a:'cont',i,icon:'hand'}));
 W.doors.forEach((d,i)=>{if(i===0&&ST.doors[0])return;out.push({label:ST.doors[i]?T('i_door_close'):T('i_door_open'),pos:d.pos,a:'door',i,r:1.6})});
 ['key','bat','cross'].forEach(k=>{const s=it[k];if(!s||s.holder||s.inst)return;const p=itemWorldPos(k);if(!p)return;if(!itemAvailable(k))return;out.push({label:T('i_take_'+k),pos:p,a:'take',i:k,r:1.8,item:1})});
 HIDE.forEach((h,i)=>{if(Object.values(ST.players).some(p=>p.hide===i))return;out.push({label:T('i_hide'),pos:h.pos,a:'hide',i,r:1.5})});
 const car=W.car;const hood=W.CARP.hood.clone().applyMatrix4(car.matrixWorld),door=W.CARP.door.clone().applyMatrix4(car.matrixWorld);
 if(!ST.car.bat)out.push({label:it.bat.holder===me.id?T('i_put_bat'):T('i_need_bat'),pos:hood,a:it.bat.holder===me.id?'bat':null,r:1.8});
 if(!ST.car.key)out.push({label:it.key.holder===me.id?T('i_put_key'):T('i_need_key'),pos:door,a:it.key.holder===me.id?'key':null,r:1.8});
 if(ST.car.key&&ST.car.bat)out.push({label:T('i_seat'),pos:door,a:'seat',r:2});
 return out}
function keyLike(k){return k==='key'||k==='cross'}
function itemAvailable(k){const s=ST.items[k];if(s.pos)return true;const spot=keyLike(k)?W.KEY[s.spot]:W.BAT[s.spot];if(!spot)return false;if(keyLike(k)&&spot.c!=null)return !!ST.cont[spot.c];return true}
function itemWorldPos(k){const s=ST.items[k];if(!s)return null;if(s.pos)return V(...s.pos);const spot=keyLike(k)?W.KEY[s.spot]:W.BAT[s.spot];if(!spot)return null;
 if(keyLike(k)&&spot.t==='drawer'){const c=CONT[spot.c];return V(0,.04,0).applyMatrix4(c.g.matrixWorld)}if(keyLike(k)&&spot.itemPos)return spot.itemPos.clone();return V(spot.x,spot.y+.02,spot.z)}
function pickInteract(){const list=interactables();if(P.hide>=0)return list[0];const eye=cam.position;const fw=V(0,0,-1).applyQuaternion(cam.quaternion);let best=null,bs=-1;
 for(const o of list){const d=o.pos.distanceTo(eye);const r=(o.r||1.7)+(o.item?.2:0);if(d>r+.6)continue;const dir=o.pos.clone().sub(eye).normalize();const dot=dir.dot(fw);const hd=Math.hypot(o.pos.x-eye.x,o.pos.z-eye.z);if(hd>r)continue;if(dot<.55&&!(hd<.9&&dot>.2))continue;const sc=dot-d*.15;if(sc>bs){bs=sc;best=o}}return best}
function doInteract(){if(!curInter||!curInter.a||!P.alive)return;const o=curInter;
 if(o.a==='hide'){const h=W.HIDE[o.i];act('hide',o.i)}else if(o.a==='unhide'){act('unhide')}else act(o.a,o.i)}

function updatePlayer(dt){if(!P.alive)return;
 if(P.inCar){const seat=W.CARP.seat.clone().applyMatrix4(W.car.matrixWorld);P.pos.set(seat.x,0,seat.z);cam.position.copy(seat);setLook();return}
 if(P.hide>=0){const h=W.HIDE[P.hide];const f=fwdOf(h.ry);const y0=h.y||0;cam.position.set(h.x+(h.k==='under'?f.x*.3:0),y0+h.eye,h.z+(h.k==='under'?f.z*.3:0));P.pos.set(h.x,y0,h.z);
  /* limit look direction to the spot's facing */const base=Math.atan2(-f.x,-f.z);let dy=P.yaw-base;while(dy>PI)dy-=2*PI;while(dy<-PI)dy+=2*PI;dy=Math.max(-.9,Math.min(.9,dy));P.yaw=base+dy;P.pitch=Math.max(-.5,Math.min(.4,P.pitch));setLook();return}
 if(P.wasHidden!=null){const h=W.HIDE[P.wasHidden];P.pos.set(h.ex,h.y||0,h.ez);P.wasHidden=null}
 if(W.blocked(P.pos.x,P.pos.z,P.pos.y)){const f=freeNear(P.pos.x,P.pos.z,P.pos.y);if(f){P.pos.x=f[0];P.pos.z=f[1]}}
 let fx=0,fz=0;if(keys.KeyW||keys.ArrowUp)fz-=1;if(keys.KeyS||keys.ArrowDown)fz+=1;if(keys.KeyA||keys.ArrowLeft)fx-=1;if(keys.KeyD||keys.ArrowRight)fx+=1;if(joy.active){fx+=joy.dx;fz+=joy.dy}
 const mag=Math.min(1,Math.hypot(fx,fz));const wantRun=(keys.ShiftLeft||keys.ShiftRight||runHeld)&&mag>.3&&fz<.2;
 if(wantRun&&P.stamina>0&&!P.tired){P.run=true;P.stamina-=dt/6;if(P.stamina<=0){P.stamina=0;P.tired=true}}else{P.run=false;P.stamina=Math.min(1,P.stamina+dt/(mag?9:6));if(P.stamina>.35)P.tired=false}
 const sp=(P.run?5.1:2.6)*mag;let vx=0,vz=0;if(mag>.01){const l=Math.hypot(fx,fz);const lx=fx/l,lz=fz/l;const c=Math.cos(P.yaw),s=Math.sin(P.yaw);vx=(lx*c+lz*s)*sp;vz=(-lx*s+lz*c)*sp}
 const nx=P.pos.x+vx*dt,nz=P.pos.z+vz*dt;if(!W.blocked(nx,nz,P.pos.y)){P.pos.x=nx;P.pos.z=nz}else{let moved=false;if(!W.blocked(nx,P.pos.z,P.pos.y)){P.pos.x=nx;moved=true}if(!W.blocked(P.pos.x,nz,P.pos.y)){P.pos.z=nz;moved=true}if(!moved){const l=Math.hypot(vx,vz)||1;for(const s of [1,-1]){const px=P.pos.x+(-vz/l)*s*.6*sp*dt,pz=P.pos.z+(vx/l)*s*.6*sp*dt;if(!W.blocked(px,pz,P.pos.y)){P.pos.x=px;P.pos.z=pz;break}}}}
 P.pos.x=Math.max(-84.6,Math.min(84.6,P.pos.x));P.pos.z=Math.max(-79.6,Math.min(89.6,P.pos.z));
 const gy=W.groundY(P.pos.x,P.pos.z,P.pos.y);P.pos.y+=(gy-P.pos.y)*Math.min(1,dt*12);P.speed=Math.hypot(vx,vz);
 if(P.speed>.3){P.stepT-=dt*P.speed;if(P.stepT<=0){P.stepT=P.run?1.25:.95;const inside=Math.abs(P.pos.x)<14&&Math.abs(P.pos.z)<10;S.step(null,0,0,P.run?.55:.35,inside?'wood':'grass')}}
 const bob=P.speed>.3?Math.sin(performance.now()/1000*(P.run?14:9))*.035:0;cam.position.set(P.pos.x,P.pos.y+1.62+bob,P.pos.z);setLook()}
function freeNear(x,z,y){for(let r=.15;r<4;r+=.15){for(let a=0;a<16;a++){const t=a/16*PI*2;const nx=x+Math.cos(t)*r,nz=z+Math.sin(t)*r;if(!W.blocked(nx,nz,y)&&Math.abs(W.groundY(nx,nz,y)-y)<.4)return [nx,nz]}}return null}
function setLook(){const sx=shake>0?(Math.random()-.5)*shake*.06:0,sy=shake>0?(Math.random()-.5)*shake*.06:0;cam.rotation.set(0,0,0,'YXZ');cam.rotation.order='YXZ';cam.rotation.y=P.yaw+sx;cam.rotation.x=P.pitch+sy}

/* ---------- jumpscare / spectate / end ---------- */
function jumpscare(k){k=k||'wolf';P.alive=false;jump={t:0,k,vi:KINDS.indexOf(k)};roarFor(k,null,0,0,1.6);S.stinger();$('#redFlash').hidden=false;if(document.pointerLockElement)document.exitPointerLock()}
function updateJump(dt){jump.t+=dt;const mdl=monster.models[jump.k]||monster.model;const g=mdl.group;const f=V(0,0,-1).applyQuaternion(cam.quaternion);f.y=0;f.normalize();g.visible=true;g.position.set(cam.position.x+f.x*1.9,cam.position.y-1.85,cam.position.z+f.z*1.9);g.rotation.y=Math.atan2(-f.x,-f.z);
 if(jump.t<.05)mdl.play('attack',0);mdl.update(dt);shake=Math.max(0,1.4-jump.t);if(jump.t>2.3){g.visible=false;jump=null;$('#redFlash').hidden=true;$('#deadMsg').hidden=false;spectate=0}}
function endGame(res){ST.phase='end';if(document.pointerLockElement)document.exitPointerLock();const tEnd=ST.t;const win=res==='win';setTimeout(()=>{show('end');const mine=ST.players[me.id]||{};const esc_=!!mine.car;
 $('#endTitle').textContent=win?(esc_?T('win_t'):T('left_t')):T('lose_t');$('#endTitle').style.color=win&&esc_?'var(--ok)':'';
 $('#endText').textContent=win?(esc_?T('win_x'):T('left_x')):T('lose_x');$('#endTime').textContent=T('time_lbl',{t:fmtT(tEnd)});
 $('#endList').innerHTML=Object.values(ST.players).map(p=>'<li><b>'+esc(p.name)+'</b><em>'+(p.car?T('r_esc'):p.alive?T('r_stay'):T('r_caught'))+'</em></li>').join('');S.setFear(0,0);if(win&&esc_)S.pickup()},win?5200:600)}
$('#endBack').onclick=()=>quitToMenu();

/* ---------- HUD ---------- */
function renderObjectives(){const it=ST.items,c=ST.car;const row=(ok,t,cls)=>'<li class="'+(ok?'ok':'')+(cls?' '+cls:'')+'"><span></span>'+t+'</li>';const cr=it.cross||{};
 $('#obj').innerHTML=row(it.key.holder||it.key.inst,T('o_key'))+row(it.bat.holder||it.bat.inst,T('o_bat'))+row(c.key&&c.bat,T('o_fix'))+row(false,T('o_go'))+(cr.inst&&!cr.holder?'':row(!!cr.holder,T('o_cross'),'opt'));
 $('#hold').innerHTML=(it.key.holder===me.id?'<span class="chipI">'+T('chip_key')+'</span>':'')+(it.bat.holder===me.id?'<span class="chipI">'+T('chip_bat')+'</span>':'')+(cr.holder===me.id?'<span class="chipI">'+T('chip_cross')+'</span>':'')}
function MIC_ICON(off){return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'+(off?'<path d="M4 4l16 16"/>':'')+'</svg>'}
function toggleMyMic(){VC.setOn(!VC.on);toast(VC.on?T('mic_on'):T('mic_off'),1600);renderMic();renderLobbyMic();renderLobby()}
function toggleMute(name){VC.setMuted(name,!VC.isMuted(name));toast((VC.isMuted(name)?T('muted_s'):T('unmute_p'))+': '+name,1400);renderLobby();renderPlayers();if(curScreen==='settings')renderPV()}
function bindVoiceBtns(root){root.querySelectorAll('[data-mute]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleMute(b.dataset.mute)});root.querySelectorAll('[data-mymic]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleMyMic()})}
function renderLobbyMic(){const b=$('#lobbyMic');if(!b)return;const on=VC.on&&!VC.denied;b.className='micTog '+(on?'on':'off');b.innerHTML=MIC_ICON(!on)+'<span>'+esc(T('mic_tap'))+': '+esc(on?T('on_s'):T('off_s'))+'</span>'}
$('#lobbyMic').onclick=()=>toggleMyMic();
$('#plist').addEventListener('click',e=>{const li=e.target.closest('[data-mute]');if(li)toggleMute(li.dataset.mute)});
/* one delegated handler, so taps survive the list being redrawn */
$('#lobbyList').addEventListener('click',e=>{const m=e.target.closest('[data-mute]');if(m){toggleMute(m.dataset.mute);return}if(e.target.closest('[data-mymic]'))toggleMyMic()});
VC.onMic=()=>{renderMic();renderLobbyMic();if(curScreen==='lobby')renderLobby()};
const MIC_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" class="CL"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
function renderPlayers(){const ids=Object.keys(ST.players);$('#plCount').textContent=ids.length+'/'+MAXP;const online=N.mode!=='solo';
 const ph=ids.map(id=>{const p=ST.players[id];const talk=false;const mu=online&&id!==me.id&&VC.isMuted(p.name);return '<li data-id="'+esc(id)+'" class="'+(p.alive?'':'dead')+(mu?' muted':'')+'"'+(online&&id!==me.id?' data-mute="'+esc(p.name)+'" title="'+esc(T(mu?'unmute_p':'mute_p'))+'"':'')+'>'+(online?(mu?'<span class="mx">'+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/>'+(1?'<path d="M16 9l5 6M21 9l-5 6"/>':'<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>')+'</svg>'+'</span>':MIC_SVG.replace('CL',talk?'on':'')):'')+FLAG(p.lg)+esc(p.name)+(id===me.id?' ('+T('you')+')':'')+'<i>'+(mu?T('muted_s')+' ':'')+(p.car?T('in_car'):!p.alive?T('caught_s'):p.hide>=0?T('hidden_s'):'')+'</i></li>'}).join('');if(ph!==renderPlayers.last){renderPlayers.last=ph;$('#plist').innerHTML=ph}
 if(online)ids.forEach(id=>{const sv=$('#plist').querySelector('li[data-id="'+id+'"] > svg');if(sv)sv.classList.toggle('on',id===me.id?VC.speaking:VC.isTalking(id))})}
function renderMic(){const b=$('#micBtn');const on=VC.on&&!VC.denied;b.setAttribute('aria-pressed',VC.ptt?String(VC.pttHeld):String(on));b.classList.toggle('off',!on);$('#micLbl').textContent=!on?T('mic_off'):VC.ptt?T('talk_ptt'):(VC.speaking?T('talking'):T('mic'))}
/* mic button: toggles the mic, or push-to-talk while held */
$('#micBtn').addEventListener('pointerdown',e=>{if(VC.ptt){e.preventDefault();VC.setPttHeld(true);renderMic()}});
['pointerup','pointerleave','pointercancel'].forEach(ev=>$('#micBtn').addEventListener(ev,()=>{if(VC.ptt){VC.setPttHeld(false);renderMic()}}));
$('#micBtn').addEventListener('click',()=>{if(VC.ptt&&VC.on)return;toggleMyMic()});

/* ---------- pause / settings ---------- */
function openPause(){if(ST.phase!=='play')return;if(document.pointerLockElement)document.exitPointerLock();Object.keys(keys).forEach(k=>keys[k]=0);joy.active=false;$('#joy').hidden=true;
 paused=N.mode==='solo';$('#pauseT').textContent=paused?T('pause'):T('pause_t');$('#pauseX').textContent=paused?T('pause_solo'):T('pause_x');show('pause')}
function closePause(){paused=false;show('hud');if(!TOUCH){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}}
$('#pauseBtn').onclick=openPause;$('#pResume').onclick=closePause;$('#pSettings').onclick=()=>openSettings('pause');$('#pQuit').onclick=quitToMenu;
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&ST.phase==='play'&&curScreen==='hud'&&P.alive&&!TOUCH&&document.activeElement!==$('#hudForm input')&&!wantUnlock)openPause();wantUnlock=false});
let wantUnlock=false;
function quitToMenu(){try{VC.closeAll()}catch(e){}N.close();const u=new URL(location.href);u.searchParams.set('menu','1');['auto'].forEach(k=>u.searchParams.delete(k));location.href=u.toString()}
let setFrom='menu';
const VOLS={game:1,mon:1};try{const v=JSON.parse(localStorage.getItem('qu_vol')||'{}');if(v.game!=null)VOLS.game=v.game;if(v.mon!=null)VOLS.mon=v.mon}catch(e){}
function applyVolumes(){S.setVolumes(VOLS.game,VOLS.mon)}
function saveVolumes(){try{localStorage.setItem('qu_vol',JSON.stringify(VOLS))}catch(e){}}
function segSet(sel,v){document.querySelectorAll(sel+' button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)))}
function openSettings(from){setFrom=from;show('settings');segSet('#segLang',I18N.lang);segSet('#segGfx',GQ);segSet('#segTalk',VC.ptt?'ptt':'open');
 const sl=(id,v)=>{const e=$(id);e.value=Math.round(v*100);e.nextElementSibling.textContent=e.value+'%'};sl('#volGame',VOLS.game);sl('#volMon',VOLS.mon);sl('#volMic',VC.micGain);
 $('#micSwitch').setAttribute('aria-checked',String(VC.on));$('#gfxNote').textContent=T('gfx_hint');$('#pttNote').hidden=TOUCH;renderPV()}
function renderPV(){const ids=Object.keys(ST.players).filter(id=>id!==me.id);const box=$('#pvList');
 if(N.mode==='solo'||!ids.length){box.innerHTML='<span class="muted sm">'+T('players_vol_none')+'</span>';return}
 box.innerHTML=ids.map(id=>{const p=ST.players[id];const v=Math.round(VC.playerVol(p.name)*100);const m=VC.isMuted(p.name);return '<div class="pvRow"><button class="vbtn'+(m?' muted':'')+'" data-mute="'+esc(p.name)+'" title="'+esc(T(m?'unmute_p':'mute_p'))+'">'+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/>'+(m?'<path d="M16 9l5 6M21 9l-5 6"/>':'<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>')+'</svg>'+'</button><label class="sl"><span>'+FLAG(p.lg)+esc(p.name)+'</span><input type="range" min="0" max="150" value="'+v+'" data-pv="'+esc(p.name)+'"><output>'+v+'%</output></label></div>'}).join('');bindVoiceBtns(box);
 box.querySelectorAll('input[data-pv]').forEach(i=>i.oninput=()=>{VC.setPlayerVol(i.dataset.pv,i.value/100);i.nextElementSibling.textContent=i.value+'%'})}
document.querySelectorAll('#segLang button').forEach(b=>b.onclick=()=>{I18N.set(b.dataset.v);segSet('#segLang',b.dataset.v)});
let gfxPending=null;
document.querySelectorAll('#segGfx button').forEach(b=>b.onclick=()=>{gfxPending=b.dataset.v;try{localStorage.setItem('qu_gfx',b.dataset.v)}catch(e){}segSet('#segGfx',b.dataset.v);$('#gfxNote').textContent=b.dataset.v===GQ?T('gfx_hint'):T('gfx_reload')});
document.querySelectorAll('#segTalk button').forEach(b=>b.onclick=()=>{VC.setPtt(b.dataset.v==='ptt');segSet('#segTalk',b.dataset.v);renderMic()});
$('#volGame').oninput=e=>{VOLS.game=e.target.value/100;e.target.nextElementSibling.textContent=e.target.value+'%';applyVolumes();saveVolumes()};
$('#volMon').oninput=e=>{VOLS.mon=e.target.value/100;e.target.nextElementSibling.textContent=e.target.value+'%';applyVolumes();saveVolumes()};
$('#volMic').oninput=e=>{VC.setMicGain(e.target.value/100);e.target.nextElementSibling.textContent=e.target.value+'%'};
$('#micSwitch').onclick=()=>{VC.setOn(!VC.on);$('#micSwitch').setAttribute('aria-checked',String(VC.on));renderMic()};
function leaveSettings(){if(gfxPending&&gfxPending!==GQ&&ST.phase!=='play'&&ST.phase!=='lobby'&&N.mode==='solo'){const u=new URL(location.href);u.searchParams.set('menu','1');u.searchParams.delete('gfx');location.href=u.toString();return}show(setFrom)}
$('#setBack').onclick=leaveSettings;$('#setSave').onclick=leaveSettings;
I18N.onChange=()=>{const mp=ST.players[me.id];if(mp&&N.mode!=='solo'&&mp.lg!==I18N.lang){mp.lg=I18N.lang;if(N.mode==='host'&&ST.phase==='lobby')N.broadcast({t:'lobby',players:ST.players});else if(N.mode==='client')N.send({t:'lg',v:I18N.lang})}renderObjectives();renderPlayers();renderLobby();renderRooms();renderMic();if(curScreen==='settings')openSettings(setFrom);$('#heroName').textContent=charName(me.char);if(curScreen==='setup')$('#setupTitle').textContent=T({host:'t_create',join:'t_join',solo:'t_solo',open:'t_open'}[flow]);if(!$('#bootBtn').disabled)$('#bootBtn').textContent=T('boot_enter')};

/* ---------- performance: static batching + light pool ---------- */
function optimizeScene(){
 const G=W.G;if(!QS.sh){W.moon.castShadow=false}else{W.moon.shadow.mapSize.set(QS.map,QS.map)}
 const dyn=new Set();const mark=o=>{if(o)o.traverse(c=>dyn.add(c))};
 (W.doors||[]).forEach(d=>d&&d.hinges.forEach(mark));CONT.forEach(c=>mark(c.g));HIDE.forEach(h=>mark(h.doors));mark(G.items);mark(W.car);
 [W.porchBulb,W.bsmBulb,W.lampBulb,W.statueHead].concat(W.lampBulbs||[],W.curtains||[]).forEach(o=>o&&mark(o.isMesh&&o.parent!==G.ground&&o.parent!==G.yard?o.parent:o));
 const all=[];scene.traverse(o=>all.push(o));const snap=o=>[o.position.x,o.position.y,o.position.z,o.rotation.x,o.rotation.y,o.rotation.z,o.scale.x,o.scale.y,o.scale.z,o.visible].join();
 const s0=all.map(snap);W.anim.forEach(f=>{try{f(3.3,.016);f(7.9,.016)}catch(e){}});all.forEach((o,i)=>{if(snap(o)!==s0[i])mark(o)});
 scene.updateMatrixWorld(true);const CELL=48,groups={};
 Object.keys(G).forEach(gk=>{const top=G[gk];if(gk==='items')return;
  top.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||dyn.has(o)||Array.isArray(o.material)||o.material.transparent||!o.visible)return;
   let a=o.parent,ok=true;while(a&&a!==top){if(!a.visible){ok=false;break}a=a.parent}if(!ok)return;
   const ge=o.geometry;if(!ge||!ge.attributes.position||ge.morphAttributes&&Object.keys(ge.morphAttributes).length)return;
   const b=new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
   const k=gk+'|'+o.material.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0)+'|'+Math.floor(b.x/CELL)+','+Math.floor(b.z/CELL)+'|'+(ge.attributes.uv?1:0);
   (groups[k]=groups[k]||{top,mat:o.material,cs:o.castShadow,rs:o.receiveShadow,list:[]}).list.push(o)})});
 let removed=0;
 const mergeList=(list,root,mat,cs,rs)=>{const inv=new THREE.Matrix4();let nv=0,ni=0;const uv=!!list[0].geometry.attributes.uv;
  list.forEach(o=>{const g=o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count});
  const P=new Float32Array(nv*3),Nn=new Float32Array(nv*3),U=uv?new Float32Array(nv*2):null,I=nv>65535?new Uint32Array(ni):new Uint16Array(ni);
  let vo=0,io=0;root.updateMatrixWorld(true);inv.copy(root.matrixWorld).invert();const m=new THREE.Matrix4(),nm=new THREE.Matrix3(),v=new THREE.Vector3();
  list.forEach(o=>{const g=o.geometry;if(!g.attributes.normal)g.computeVertexNormals();m.multiplyMatrices(inv,o.matrixWorld);nm.getNormalMatrix(m);const flip=m.determinant()<0;
   const pa=g.attributes.position,na=g.attributes.normal,c=pa.count,ua=g.attributes.uv;
   for(let i=0;i<c;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);P[(vo+i)*3]=v.x;P[(vo+i)*3+1]=v.y;P[(vo+i)*3+2]=v.z;v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();Nn[(vo+i)*3]=v.x;Nn[(vo+i)*3+1]=v.y;Nn[(vo+i)*3+2]=v.z;if(U&&ua){U[(vo+i)*2]=ua.getX(i);U[(vo+i)*2+1]=ua.getY(i)}}
   const n=g.index?g.index.count:c,ix=j=>g.index?g.index.getX(j):j;
   for(let j=0;j<n;j+=3){I[io++]=vo+ix(j);if(flip){I[io++]=vo+ix(j+2);I[io++]=vo+ix(j+1)}else{I[io++]=vo+ix(j+1);I[io++]=vo+ix(j+2)}}
   vo+=c;o.parent.remove(o);removed++});
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(P,3));bg.setAttribute('normal',new THREE.BufferAttribute(Nn,3));if(U)bg.setAttribute('uv',new THREE.BufferAttribute(U,2));bg.setIndex(new THREE.BufferAttribute(I,1));bg.computeBoundingSphere();bg.computeBoundingBox();
  const mm=new THREE.Mesh(bg,mat);mm.castShadow=cs;mm.receiveShadow=rs;root.add(mm);return mm};
 Object.values(groups).forEach(gr=>{if(gr.list.length>1)mergeList(gr.list,gr.top,gr.mat,gr.cs,gr.rs)});
 /* rigid moving parts (doors, drawers, closet doors): merge inside each part, keep the part movable */
 const parts=[];(W.doors||[]).forEach(d=>d&&d.hinges.forEach(h=>parts.push(h)));CONT.forEach(c=>parts.push(c.g));HIDE.forEach(h=>h.doors&&parts.push(h.doors));
 parts.forEach(root=>{const by={};root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&!Array.isArray(o.material)&&!o.material.transparent&&!o.userData.glint){const k=o.material.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0)+(o.geometry.attributes.uv?1:0);(by[k]=by[k]||[]).push(o)}});
  Object.values(by).forEach(l=>{if(l.length>1)mergeList(l,root,l[0].material,l[0].castShadow,l[0].receiveShadow)})});
 /* empty groups left behind */
 const empty=[];Object.values(G).forEach(t=>t.traverse(o=>{if(o!==t&&o.type==='Group'&&!dyn.has(o)&&o.children.length===0)empty.push(o)}));empty.forEach(o=>o.parent&&o.parent.remove(o));
 /* low quality: cheaper Phong shading instead of PBR */
 if(GQ==='low'){const cache=new Map();const conv=mt=>{if(!mt||!mt.isMeshStandardMaterial)return mt;if(cache.has(mt))return cache.get(mt);
   const n=new THREE.MeshPhongMaterial({color:mt.color,map:mt.map,emissive:mt.emissive,emissiveMap:mt.emissiveMap,emissiveIntensity:mt.emissiveIntensity,side:mt.side,transparent:mt.transparent,opacity:mt.opacity,alphaTest:mt.alphaTest,flatShading:mt.flatShading,shininess:Math.max(2,(1-mt.roughness)*40),depthWrite:mt.depthWrite});
   n.specular.setScalar(.04+mt.metalness*.2);n.skinning=mt.skinning;n.morphTargets=mt.morphTargets;n.name=mt.name;n.userData=mt.userData;cache.set(mt,n);return n};
  scene.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(conv):conv(o.material)});A.convMat=conv}
 /* sky (moon + stars) follows the camera so a short view distance doesn't clip it */
 if(QS.far<300){const sk=new THREE.Group(),k=QS.far/320;scene.children.slice().forEach(o=>{if(o.isPoints||(o.isMesh&&o.material&&o.material.fog===false&&o.geometry.type==='SphereGeometry')){scene.remove(o);sk.add(o);if(o.isPoints)o.material.size*=k}});sk.scale.setScalar(k);scene.add(sk);SKY=sk}
 /* light pool: fixed number of real point lights follow the nearest virtual ones */
 const pts=[];scene.traverse(o=>{if(o.isPointLight)pts.push(o)});
 pts.forEach(l=>{const wp=new THREE.Vector3();l.getWorldPosition(wp);l.userData.wp=wp;l.parent.remove(l)});LP.virt=pts;
 for(let i=0;i<QS.lights;i++){const l=new THREE.PointLight(0xffffff,0,1,1.6);scene.add(l);LP.real.push(l)}
 window.__opt={removed,merged:Object.keys(groups).length,lights:pts.length}}
const LP={virt:[],real:[]};let SKY=null;
function updateLightPool(){if(!LP.real.length)return;const c=cam.position;
 const cand=LP.virt.filter(l=>l.intensity>0.01).map(l=>({l,d:l.userData.wp.distanceTo(c)-l.distance*.6})).sort((a,b)=>a.d-b.d);
 LP.real.forEach((r,i)=>{const o=cand[i];if(o&&o.d<45){const l=o.l;r.position.copy(l.userData.wp);r.color.copy(l.color);r.intensity=l.intensity;r.distance=l.distance;r.decay=l.decay}else r.intensity=0})}

/* ---------- main loop ---------- */
const clock=new THREE.Clock();let ambT=12,netT=0,snapT=0,uiT=0;const tmpV=V(0,0,0);
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 W.anim.forEach(f=>f(t,dt));if(W.flickerAll>0)W.flickerAll-=0;
 if(intro)updateIntro(dt);
 else if(ST.phase==='menu'||ST.phase==='lobby'){cam.position.set(Math.sin(t*.05)*3+4,1.9,19+Math.cos(t*.05)*1.5);cam.lookAt(0,2,9);if(ST.phase==='lobby'&&N.mode!=='solo'){VC.tick(dt);VC.update(null,id=>{const p=ST.players[id];return p?{name:p.name}:null})}}
 else if(ST.phase==='play'||ST.phase==='end'){
  if(N.mode!=='client'&&!paused){ST.t+=dt;hostMonster(dt)}
  if(jump)updateJump(dt);else if(paused){}else if(P.alive)updatePlayer(dt);else if(ST.phase!=='end')updateSpectate(dt);
  if(carDrive>=0){carDrive+=dt;const c=W.garage;W.carHeadM.color.set(0xfff2c0);W.car.position.z=.3+Math.max(0,carDrive-1.5)**2*.9;W.car.updateMatrixWorld(true);if(P.inCar){const seat=W.CARP.seat.clone().applyMatrix4(W.car.matrixWorld);cam.position.copy(seat)}}
  if(shake>0)shake=Math.max(0,shake-dt);
  /* interaction prompt */
  curInter=(P.alive&&ST.phase==='play')?pickInteract():null;const hb=$('#handBtn');if(curInter){hb.hidden=false;$('#handLbl').textContent=curInter.label;hb.classList.toggle('off',!curInter.a)}else hb.hidden=true;
  $('#carBar').hidden=!(P.inCar&&P.alive&&ST.phase==='play');$('#hideVeil').hidden=P.hide<0;if(P.hide>=0)$('#hideVeil').dataset.k=W.HIDE[P.hide].k;
  $('#stam i').style.width=(P.stamina*100)+'%';$('#stam').classList.toggle('low',P.tired);
  if(!P._lastCar&&P.inCar){P.yaw=PI+.08;P.pitch=-.05}if(P._lastCar&&!P.inCar&&P.alive){const ex=W.CARP.exit.clone().applyMatrix4(W.car.matrixWorld);P.pos.set(ex.x,0,ex.z)}P._lastCar=P.inCar;
  /* track hide transitions locally */if(P._lastHide!==P.hide){if(P._lastHide>=0&&P.hide<0)P.wasHidden=P._lastHide;P._lastHide=P.hide;renderPlayers()}
  /* network */
  netT-=dt;if(N.mode==='client'&&netT<=0){netT=1/12;N.send({t:'pos',p:[+P.pos.x.toFixed(2),+P.pos.y.toFixed(2),+P.pos.z.toFixed(2)],ry:+P.yaw.toFixed(2),pi:+P.pitch.toFixed(2),sp:+P.speed.toFixed(1),fl:P.fl,k:VC.speaking&&P.alive?1:0,pg:N.ping})}
  const r2=x=>Math.round(x*100)/100;
  snapT-=dt;if(N.mode==='host'&&snapT<=0){snapT=1/12;const pl={};pl[me.id]=[r2(P.pos.x),r2(P.pos.y),r2(P.pos.z),r2(P.yaw),r2(P.speed),P.fl,0];for(const id in remotes){const r=remotes[id];pl[id]=[r2(r.tpos.x),r2(r.tpos.y),r2(r.tpos.z),r2(r.try),r.sp,r.fl,(ST.players[id]||{}).ping||0]}
   N.broadcast({t:'snap',pl,m:MSS.map(m=>[r2(m.pos.x),r2(m.pos.y),r2(m.pos.z),r2(m.ry),m.anim,m.mode!=='away'&&!m.dead?1:0,m.ts||1]),time:ST.t})}
  if(N.mode!=='client'){MSS.forEach((m,i)=>{const v=VIEWS[i];v.tpos.copy(m.pos);v.try=m.ry;v.vis=m.mode!=='away'&&!m.dead;if(m.anim!==v.anim||m.ts!==v.ts){v.anim=m.anim;v.ts=m.ts;v.model.play(m.anim,.2,m.ts||1)}})}
  updateRemotes(dt,t);updateMonsterViews(dt);
  S.setListener(cam.position.x,cam.position.y,cam.position.z,P.yaw);
  let md=99,chasing=false,anyVis=false;VIEWS.forEach(v=>{if(!v.vis)return;anyVis=true;const d=v.pos.distanceTo(cam.position);if(d<md)md=d;if(v.anim==='walk'&&(v.ts||1)>1.5&&d<22)chasing=true});S.setFear(anyVis?Math.max(0,1-md/16):0,chasing?Math.max(.2,1-md/22):0);
  ambT-=dt;if(ambT<=0){ambT=(FAST?6:18)+Math.random()*30;const r=Math.random();if(!anyVis||r<.3){if(r<.6)S.distant();else if(r<.8)S.whisper();else S.knock()}}
  /* voice chat + ping */
  if(N.mode!=='solo'){VC.tick(dt);VC.update({x:cam.position.x,y:cam.position.y,z:cam.position.z,yaw:P.yaw},voiceInfo);uiT-=dt;if(uiT<=0){uiT=.4;hudNet()}}
  /* item visuals */
  ['key','bat','cross'].forEach(k=>{const o=IT[k],s=ST.items[k];if(!s||s.holder||s.inst){o.visible=false;return}
   const p=itemWorldPos(k);o.visible=!!p&&(s.pos||!keyLike(k)||W.KEY[s.spot].c==null||ST.cont[W.KEY[s.spot].c]>0);if(p)o.position.copy(p);o.children.forEach(c=>{if(c.userData.glint)c.material.opacity=.55+.45*Math.sin(t*4)})});
  /* containers & doors animate toward state */
  CONT.forEach((c,i)=>{const tg=ST.cont[i]?1:0;c.cur+=(tg-c.cur)*Math.min(1,dt*7);if(c.type==='drawer'){c.g.position.copy(c.base).addScaledVector(c.f,c.cur*.38)}else c.g.rotation.y=(W.KEY[c.spot].ry||0)-c.cur*1.7});
  W.doors.forEach((d,i)=>{if(!d)return;const tg=ST.doors[i]?1:0;d.cur+=(tg-d.cur)*Math.min(1,dt*5);d.hinges.forEach(h=>h.rotation.y=h.userData.closed+(h.userData.open-h.userData.closed)*d.cur);d.solid.off=d.cur>.5});
 }
 if(cam.position.distanceTo(moonAt)>4){moonAt.copy(cam.position);W.moon.position.set(moonAt.x-40,55,moonAt.z+45);W.moon.target.position.set(moonAt.x,0,moonAt.z);W.moon.target.updateMatrixWorld()}
 updateLightPool();if(SKY)SKY.position.copy(cam.position);R.render(scene,cam)}
const moonAt=V(0,0,0);scene.add(W.moon.target);
function updateRemotes(dt,t){for(const id in remotes){const r=remotes[id];const p=ST.players[id];if(!p){r.ch.group.visible=false;continue}
 r.pos.lerp(r.tpos,Math.min(1,dt*10));let dr=r.try-r.ry;while(dr>PI)dr-=2*PI;while(dr<-PI)dr+=2*PI;r.ry+=dr*Math.min(1,dt*10);
 const g=r.ch.group;const visible=p.alive&&p.hide<0&&!p.car&&!p.gone;g.visible=visible;g.position.copy(r.pos);g.rotation.y=r.ry+PI;
 r.ch.pose(dt,r.sp||0,0,t);r.ch.group.children.forEach(c=>{if(c.isSpotLight)c.intensity=visible&&r.fl?2.2:0});
 if(visible&&(r.sp||0)>.3){r.stepT-=dt*(r.sp||0);if(r.stepT<=0){r.stepT=(r.sp>3.6?1.25:.95);S.step(r.pos.x,r.pos.y,r.pos.z,.4,'wood')}}}}
function updateMonsterViews(dt){VIEWS.forEach((v,i)=>{const g=v.model.group;if(jump&&jump.vi===i)return;
 if(!v.vis){g.visible=false;v.pos.copy(v.tpos);return}
 if(!g.visible){g.visible=true;v.pos.copy(v.tpos)}v.pos.lerp(v.tpos,Math.min(1,dt*10));let dr=v.try-v.ry;while(dr>PI)dr-=2*PI;while(dr<-PI)dr+=2*PI;v.ry+=dr*Math.min(1,dt*10);
 g.position.copy(v.pos);g.rotation.y=v.ry;v.model.update(dt);
 if(v.anim==='walk'){v.stepT-=dt*(v.ts||1);if(v.stepT<=0){v.stepT=.42;S.monsterStep(v.pos.x,v.pos.y,v.pos.z)}}})}
function voiceInfo(id){const p=ST.players[id];if(!p)return null;const r=remotes[id];const meDead=!P.alive;
 /* the caught can only talk among themselves; players in the car are heard normally */
 return {name:p.name,pos:r&&ST.phase==='play'&&p.alive?r.pos:null,mute:ST.phase==='play'&&!p.alive&&!meDead}}
let lastTalk='';
function hudNet(){const host=N.mode==='host';const pg=host?null:N.ping;$('#hudPing').textContent=host?T('host_tag'):(pg+' '+T('ms'));$('#hudDot').className='pdot '+(host?'g':pingCls(pg));
 renderMic();$('#micBtn').classList.toggle('live',VC.speaking);
 let who=null,wd=0;for(const id in ST.players){if(id===me.id)continue;if(VC.isTalking(id)){const r=remotes[id];who=ST.players[id].name;wd=r?Math.round(r.pos.distanceTo(P.pos)):0;break}}
 const ti=$('#talkInd');if(who){ti.hidden=false;$('#talkTxt').textContent=T('is_talking',{n:who})+(wd?' · '+wd+' m':'')}else ti.hidden=true;
 const key=Object.keys(ST.players).map(id=>(id===me.id?VC.speaking:VC.isTalking(id))?1:0).join('');if(key!==lastTalk){lastTalk=key;renderPlayers()}}
let spectId=null;
function updateSpectate(dt){const ids=Object.keys(ST.players).filter(id=>id!==me.id&&ST.players[id].alive&&!ST.players[id].gone);if(!ids.length){cam.position.lerp(V(0,18,30),dt);cam.lookAt(0,0,0);return}
 if(!ids.includes(spectId))spectId=ids[0];const r=remotes[spectId];if(!r)return;const back=fwdOf(r.ry);const tp=V(r.pos.x-back.x*2.6,r.pos.y+2.2,r.pos.z-back.z*2.6);cam.position.lerp(tp,Math.min(1,dt*4));cam.lookAt(r.pos.x,r.pos.y+1.4,r.pos.z);$('#deadWho').textContent=ST.players[spectId].name}
$('#deadNext').onclick=()=>{const ids=Object.keys(ST.players).filter(id=>id!==me.id&&ST.players[id].alive);if(!ids.length)return;const k=(ids.indexOf(spectId)+1)%ids.length;spectId=ids[k]};
show('boot');loop();
window.__G={R,GQ,cam,scene,keys,updatePlayer,tick:(n,dt)=>{for(let i=0;i<n;i++){ST.t+=dt;hostMonster(dt);if(ST.ended)break}},ST,P,MS,MSS,VIEWS,NOISE,me,act,hostAct,W,NAV,astar,CONT,HIDE,IT,remotes,startIntro,endIntro,monster,openPause,openSettings,sendChat,chatLog,get curScreen(){return curScreen},introSeek:t=>{if(intro)intro.t=t},get hostT(){return hostT},itemWorldPos,interactables};
})();

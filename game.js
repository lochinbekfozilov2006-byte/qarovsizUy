/* Qarovsiz Uy — main game */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI,UP=V(0,1,0);
const Q=new URLSearchParams(location.search);const FAST=Q.get('fast')==='1';
const $=s=>document.querySelector(s);
const W=WORLD,A=ACTORS,S=SND,N=NET;
const TOUCH=('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches;
if(TOUCH)document.body.classList.add('touch');
const LOG=(...a)=>{if(Q.get('debug'))console.log('[game]',...a)};

/* ---------- renderer ---------- */
const cv=$('#cv');const R=new THREE.WebGLRenderer({canvas:cv,antialias:!TOUCH,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio,TOUCH?1:1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.35;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x05060b);scene.fog=new THREE.FogExp2(0x06070c,.03);
const cam=new THREE.PerspectiveCamera(70,1,.05,300);scene.add(cam);
const flash=new THREE.SpotLight(0xfff1d6,0,26,.52,.45,1.3);flash.position.set(.18,-.12,.05);flash.target.position.set(0,-.15,-1);cam.add(flash);cam.add(flash.target);
function size(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}addEventListener('resize',size);size();
W.build(scene);const G=W.G;const H=W.H;
const introL=new THREE.PointLight(0xff3a2a,0,7,1.6);introL.position.set(6.8,2.4,8.9);scene.add(introL);

/* ---------- game state (host authoritative, mirrored on clients) ---------- */
const ST={phase:'menu',players:{},cont:[],doors:[],items:{key:{spot:0,holder:null,inst:false,pos:null},bat:{spot:0,holder:null,inst:false,pos:null}},car:{key:false,bat:false},ended:null,t:0};
let me={id:'me',name:'',char:'marlon'};
const P={pos:V(0,0,87),yaw:0,pitch:0,vel:V(),stamina:1,run:false,fl:true,hide:-1,alive:true,inCar:false,speed:0,stepT:0};
const remotes={};/* id -> {ch,tag,spot,pos,tpos,ry,try,sp,fl,hide,alive} */
const monster={pos:V(0,-50,0),ry:0,vis:false,anim:'idle',model:null,tpos:V(0,-50,0),try:0,stepT:0};

/* ---------- loading ---------- */
const furnObjs=[];let FURN=null;
A.onProgress=p=>{$('#bootBar i').style.width=Math.round(p*100)+'%'};
let carSrc=null;A.progress.total=9;
const loadAll=Promise.all([A.loadFurniture().then(P=>{FURN=P}),A.loadChars(),A.loadMonster(),A.loadMonsters(),A.loadGLB('car').then(g=>{carSrc=g})]).then(buildFurniture).then(()=>{setupCar();buildInteractive();W.indexSolids();{const t0=performance.now();buildNav();window.__navMs=Math.round(performance.now()-t0)}makeThumbs();monster.models={wolf:A.makeMonster(),zombie:A.makeHumanMonster('zombie'),parasite:A.makeHumanMonster('parasite')};Object.values(monster.models).forEach(m=>{scene.add(m.group);m.group.visible=false});monster.model=monster.models.wolf;monster.kind='wolf';bootReady()}).catch(e=>{console.error(e);$('#bootMsg').textContent="Yuklashda xato: sahifani yangilang."});
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
 IT.key=makeKey();IT.bat=makeBattery();G.items.add(IT.key);G.items.add(IT.bat);
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
function show(id){document.querySelectorAll('.screen').forEach(e=>e.hidden=e.id!==id)}
let toastT=null;function toast(t,ms){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,ms||2600)}

/* ---------- boot / intro ---------- */
function bootReady(){$('#bootBtn').disabled=false;$('#bootBtn').textContent="O'yinga kirish";$('#bootMsg').textContent='Quloqchin bilan o\'ynash tavsiya etiladi.';if(Q.get('auto'))startIntro(true)}
$('#bootBtn').onclick=()=>{S.init();S.resume();startIntro(false)};
let intro=null;
const INTRO_LINES=[[1,6,"1997-yil, kuz. Shahar chetidagi bu uyda bir oila yashardi."],[7,13,"Bir kechada ular izsiz g'oyib bo'lishdi. Yerto'ladan faqat tirnoq izlari topildi."],[14,20,"O'shandan beri qo'shnilar har kecha shu uydan qichqiriq eshitishadi."],[21,27,"Siz yo'lda adashib, shu hovliga kirib qoldingiz. Telefonlar ishlamayapti."],[28,34,"Garajdagi eski mashina yagona najot. Unga kalit va akkumulyator kerak."],[35,40,"Shoshiling. U sizni allaqachon ko'rib turibdi."]];
const INTRO_CAM=[[0,[80,45,150],[0,2,20]],[6,[30,18,112],[0,1,50]],[12,[0,2.2,98],[0,1.6,60]],[19,[0,1.9,62],[-8,1.5,40]],[26,[-30,2.4,42],[-40,1,30]],[33,[3,1.75,19],[4,1.8,9]],[40,[6.4,1.75,13.2],[6.8,1.8,9]],[44,[6.7,1.75,12.0],[6.8,1.8,9]]];
function camAt(t){let k=0;while(k<INTRO_CAM.length-2&&t>INTRO_CAM[k+1][0])k++;const a=INTRO_CAM[k],b=INTRO_CAM[k+1];let u=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));u=u*u*(3-2*u);
 return [V(...a[1]).lerp(V(...b[1]),u),V(...a[2]).lerp(V(...b[2]),u)]}
function startIntro(quick){show('intro');S.ambience(true);intro={t:quick?40:0,roared:false};monster.model.group.visible=false;ST.phase='intro'}
$('#skipBtn').onclick=endIntro;
function endIntro(){if(!intro)return;intro=null;introL.intensity=0;$('#introTitle').hidden=true;monster.model.group.visible=false;W.flickerAll=0;show('menu');ST.phase='menu';menuScene(true)}
function updateIntro(dt){intro.t+=dt;const t=intro.t;const [p,l]=camAt(t);cam.position.copy(p);cam.lookAt(l);
 const line=INTRO_LINES.find(L=>t>=L[0]&&t<L[1]);$('#sub').textContent=line?line[2]:'';$('#introBar i').style.width=Math.min(100,t/46*100)+'%';
 if(t>34&&!intro.mon){intro.mon=1;const g=monster.model.group;g.visible=true;g.position.set(6.8,0,7.9);g.rotation.y=0;monster.model.play('idle2',0);introL.intensity=2.2}
 if(t>37.5&&!intro.roared){intro.roared=true;S.roar(6.8,1.8,8.7,1.2);W.flickerAll=1.6;monster.model.play('scare',.1)}
 if(t>41.5&&!intro.title){intro.title=1;monster.model.group.visible=false;introL.intensity=0;$('#introTitle').hidden=false}
 if(t>46)endIntro()}

/* ---------- menu & lobby ---------- */
let lobbyAvatars={};
function menuScene(on){/* camera slowly drifting on porch view */ST.phase='menu'}
$('#mCreate').onclick=()=>{flow='host';openSetup()};$('#mJoin').onclick=()=>{flow='join';openSetup()};$('#mSolo').onclick=()=>{flow='solo';openSetup()};
let flow='solo';
if(window.PREVIEW_SOLO){const msg=()=>toast("Bu sinov sahifasi: bu yerda faqat yolg'iz o'ynash ishlaydi. Do'stlar bilan Vercel'dagi saytda o'ynaladi.",5000);$('#mCreate').onclick=msg;$('#mJoin').onclick=msg}
function openSetup(){show('setup');$('#codeRow').hidden=flow!=='join';$('#setupTitle').textContent=flow==='host'?'Baza ochish':flow==='join'?'Bazaga qo\'shilish':'Yolg\'iz o\'ynash';
 try{const n=localStorage.getItem('qu_name');if(n&&!$('#nameIn').value)$('#nameIn').value=n}catch(e){}$('#setupErr').textContent='';selChar(me.char)}
document.querySelectorAll('.charCard').forEach(b=>b.onclick=()=>selChar(b.dataset.c));
function selChar(c){me.char=c;document.querySelectorAll('.charCard').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===c))}
$('#setupBack').onclick=()=>show('menu');
$('#codeIn').addEventListener('input',()=>{$('#codeIn').value=$('#codeIn').value.replace(/\D/g,'').slice(0,4);$('#setupErr').textContent=''});
$('#nameIn').addEventListener('input',()=>$('#setupErr').textContent='');
$('#setupGo').onclick=()=>{const name=$('#nameIn').value.trim().slice(0,14);if(!name){$('#setupErr').textContent='Ismingizni yozing.';return}
 if(flow==='join'&&!/^\d{4}$/.test($('#codeIn').value)){$('#setupErr').textContent='4 xonali baza kodini yozing.';return}
 me.name=name;try{localStorage.setItem('qu_name',name)}catch(e){}S.init();S.resume();
 if(flow==='solo'){N.solo();me.id='me';ST.players={me:{name,char:me.char,alive:true,hide:-1,car:false}};startGame(hostInitState())}
 else if(flow==='host'){$('#setupGo').disabled=true;$('#setupErr').textContent='Baza ochilmoqda…';N.host((err,code)=>{$('#setupGo').disabled=false;if(err){$('#setupErr').textContent="Baza ochilmadi. Internetni tekshirib, qayta urining.";return}
  me.id='h';ST.players={h:{name,char:me.char,alive:true,hide:-1,car:false}};ST.phase='lobby';showLobby()})}
 else{$('#setupGo').disabled=true;$('#setupErr').textContent='Ulanmoqda…';N.join($('#codeIn').value,err=>{$('#setupGo').disabled=false;if(err){$('#setupErr').textContent=err==='notfound'?"Bunday kodli baza topilmadi.":"Ulanib bo'lmadi. Kodni va internetni tekshiring.";N.close();return}
  me.id=N.myId;N.send({t:'hello',name,char:me.char});ST.phase='lobby';showLobby()})}};
function showLobby(){show('lobby');$('#lobbyCode').textContent=N.mode==='host'?N.code:($('#codeIn').value||'----');$('#lobbyStart').hidden=N.mode!=='host';$('#lobbyWait').hidden=N.mode==='host';renderLobby()}
function renderLobby(){const ids=Object.keys(ST.players);$('#lobbyList').innerHTML=ids.map(id=>{const p=ST.players[id];return '<li><span class="dot"></span><b>'+esc(p.name)+'</b><em>'+A.CHARS[p.char].name+'</em>'+(id==='h'?'<i>xost</i>':'')+'</li>'}).join('');
 const n=ids.length;$('#lobbyCount').textContent=n+' / 4 o\'yinchi';const st=$('#lobbyStart');st.disabled=n<2;$('#lobbyNeed').hidden=n>=2||N.mode!=='host'}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
$('#lobbyStart').onclick=()=>{if(Object.keys(ST.players).length<2)return;const s=hostInitState();N.broadcast({t:'start',s});startGame(s)};
$('#lobbyLeave').onclick=()=>{N.close();show('menu');ST.phase='menu'};
$('#copyCode').onclick=()=>{const c=$('#lobbyCode').textContent;try{navigator.clipboard.writeText(c).then(()=>toast('Kod nusxalandi')).catch(()=>toast('Kod: '+c))}catch(e){toast('Kod: '+c)}};
N.onLeave=id=>{if(ST.players[id]){const n=ST.players[id].name;if(ST.phase==='lobby'){delete ST.players[id];N.broadcast({t:'lobby',players:ST.players});renderLobby()}else{ST.players[id].alive=false;ST.players[id].gone=true;broadcastState();hostCheckEnd()}toast(n+' chiqib ketdi')}};
N.onStatus=(s)=>{if(s==='closed'&&N.mode==='client'){toast("Xost bilan aloqa uzildi",4000);setTimeout(()=>location.reload(),2500)}};

/* ---------- network message handling ---------- */
N.onMsg=(from,m)=>{if(!m||!m.t)return;
 if(N.mode==='host'){
  if(m.t==='hello'){if(ST.phase!=='lobby'||Object.keys(ST.players).length>=4){N.to(from,{t:'full'});return}ST.players[from]={name:String(m.name).slice(0,14),char:A.CHARS[m.char]?m.char:'marlon',alive:true,hide:-1,car:false};N.broadcast({t:'lobby',players:ST.players});renderLobby()}
  else if(m.t==='pos'){const r=remoteFor(from);if(r){r.tpos.set(m.p[0],m.p[1],m.p[2]);r.try=m.ry;r.sp=m.sp;r.fl=m.fl;r.pitch=m.pi||0}}
  else if(m.t==='act')hostAct(from,m.a,m.i)}
 else{
  if(m.t==='lobby'){ST.players=m.players;renderLobby()}
  else if(m.t==='full'){toast("Baza to'la yoki o'yin boshlangan",4000);N.close();show('menu')}
  else if(m.t==='start')startGame(m.s)
  else if(m.t==='snap'){for(const id in m.pl){if(id===me.id)continue;const r=remoteFor(id);if(!r)continue;const a=m.pl[id];r.tpos.set(a[0],a[1],a[2]);r.try=a[3];r.sp=a[4];r.fl=a[5]}
   const mm=m.m;if(mm[7]>=0)setKind(KINDS[mm[7]]);monster.tpos.set(mm[0],mm[1],mm[2]);monster.try=mm[3];if(mm[4]!==monster.anim){monster.anim=mm[4];monster.model.play(mm[4],.2,mm[6]||1)}monster.vis=!!mm[5];ST.t=m.time}
  else if(m.t==='state')applyState(m.s)
  else if(m.t==='ev')onEvent(m)}};

/* ---------- starting a match ---------- */
function hostInitState(){const kSpot=Math.floor(Math.random()*W.KEY.length);let pool=W.BAT.map((b,i)=>i);const outside=pool.filter(i=>W.BAT[i].out);const bSpot=Math.random()<.78?outside[Math.floor(Math.random()*outside.length)]:pool[Math.floor(Math.random()*pool.length)];
 const s={players:ST.players,cont:CONT.map(()=>0),doors:W.doors.map(()=>1),items:{key:{spot:kSpot,holder:null,inst:false,pos:null},bat:{spot:bSpot,holder:null,inst:false,pos:null}},car:{key:false,bat:false},ended:null};
 Object.values(s.players).forEach(p=>{p.alive=true;p.hide=-1;p.car=false});return s}
let hostT=null;
function startGame(s){applyState(s);ST.phase='play';ST.t=0;show('hud');$('#pad').hidden=!TOUCH;
 const ids=Object.keys(ST.players);const idx=Math.max(0,ids.indexOf(me.id));P.pos.set(-1.5+idx*1,0,87);P.yaw=0;P.pitch=0;P.alive=true;P.hide=-1;P.inCar=false;P.fl=true;P.stamina=1;flash.intensity=2.6;
 ids.forEach(id=>{if(id!==me.id)remoteFor(id)});
 if(N.mode!=='client'){hostT={next:'scare',at:FAST?8:60,huntAt:FAST?20:300};MS.mode='away'}
 renderObjectives();renderPlayers();S.ambience(true);toast(N.mode==='solo'?"Kalit va akkumulyatorni toping, mashinani tuzating.":"Hamma shu yerda. Kalit va akkumulyatorni toping.",4000);
 if(!TOUCH)setTimeout(()=>toast("WASD — yurish, Shift — yugurish, E — qo'l, F — fonar. Ekranni bosing: sichqoncha bilan qarash.",6000),4200)}
function applyState(s){if(s.players)ST.players=s.players;ST.cont=s.cont||ST.cont;ST.doors=s.doors||ST.doors;ST.items=s.items||ST.items;ST.car=s.car||ST.car;
 const prevEnd=ST.ended;ST.ended=s.ended||null;
 const mp=ST.players[me.id];if(mp){if(!mp.alive&&P.alive&&ST.phase==='play'){P.alive=false}P.hide=mp.hide;P.inCar=mp.car}
 renderObjectives();renderPlayers();if(ST.ended&&!prevEnd)endGame(ST.ended)}
function broadcastState(){const s={players:ST.players,cont:ST.cont,doors:ST.doors,items:ST.items,car:ST.car,ended:ST.ended};if(N.mode==='host')N.broadcast({t:'state',s});applyState(s)}
function remoteFor(id){if(id===me.id)return null;if(remotes[id])return remotes[id];const p=ST.players[id];if(!p)return null;const ch=A.makeCharacter(p.char);scene.add(ch.group);const tag=A.nameTag(p.name);tag.position.y=2.05;ch.group.add(tag);
 const sp=new THREE.SpotLight(0xfff1d6,0,18,.5,.5,1.3);sp.position.set(.2,1.5,.2);const tg=new THREE.Object3D();tg.position.set(0,1.2,3);ch.group.add(sp);ch.group.add(tg);sp.target=tg;
 return remotes[id]={ch,tag,sp,pos:V(0,0,41),tpos:V(0,0,41),ry:0,try:0,sp_:0,sp:0,fl:true,stepT:0}}

/* ---------- actions (host validates) ---------- */
function act(a,i){if(N.mode==='client')N.send({t:'act',a,i});else hostAct(me.id,a,i)}
function hostAct(pid,a,i){const pl=ST.players[pid];if(!pl||!pl.alive||ST.ended)return;let ch=false;const ev=[];
 if(a==='cont'){ST.cont[i]=ST.cont[i]?0:1;ch=true;ev.push({e:'sfx',s:'slide',p:CONT[i].pos.toArray()})}
 else if(a==='door'){ST.doors[i]=ST.doors[i]?0:1;ch=true;ev.push({e:'sfx',s:'creak',p:W.doors[i].pos.toArray()})}
 else if(a==='take'){const it=ST.items[i];if(it&&!it.holder&&!it.inst){it.holder=pid;it.pos=null;ch=true;ev.push({e:'pick',who:pid,item:i})}}
 else if(a==='hide'){const occ=Object.values(ST.players).some(p=>p.hide===i);if(!occ&&pl.hide<0){pl.hide=i;ch=true;MS.sawHide[pid]=MS.seen&&MS.seen[pid]&&(ST.t-MS.seen[pid])<1.2?ST.t:0;ev.push({e:'sfx',s:'creak',p:HIDE[i].pos.toArray()})}}
 else if(a==='unhide'){if(pl.hide>=0){ev.push({e:'sfx',s:'creak',p:HIDE[pl.hide].pos.toArray()});pl.hide=-1;ch=true}}
 else if(a==='bat'){const it=ST.items.bat;if(it.holder===pid&&!ST.car.bat){it.holder=null;it.inst=true;ST.car.bat=true;ch=true;ev.push({e:'msg',m:pl.name+' akkumulyatorni o\'rnatdi'},{e:'sfx',s:'clunk'})}}
 else if(a==='key'){const it=ST.items.key;if(it.holder===pid&&!ST.car.key){it.holder=null;it.inst=true;ST.car.key=true;ch=true;ev.push({e:'msg',m:pl.name+' kalitni soldi'},{e:'sfx',s:'clunk'})}}
 else if(a==='seat'){if(ST.car.key&&ST.car.bat&&!pl.car){pl.car=true;pl.hide=-1;ch=true;ev.push({e:'msg',m:pl.name+' mashinaga o\'tirdi'})}}
 else if(a==='leave'){if(pl.car){pl.car=false;ch=true}}
 else if(a==='drive'){if(pl.car&&ST.car.key&&ST.car.bat){ST.ended='win';ch=true;ev.push({e:'drive'})}}
 if(ch)broadcastState();ev.forEach(e=>{if(N.mode==='host')N.broadcast(Object.assign({t:'ev'},e));onEvent(e)})}
function onEvent(m){const e=m.e;
 if(e==='sfx'){const p=m.p||[P.pos.x,P.pos.y+1,P.pos.z];if(m.s==='slide')S.slide(...p);else if(m.s==='creak')S.creak(...p);else if(m.s==='clunk')S.clunk()}
 else if(e==='pick'){if(m.who===me.id){S.pickup();toast(m.item==='key'?'Kalitni oldingiz!':'Akkumulyatorni oldingiz! Uni garajdagi mashinaga olib boring.',3500)}else toast((ST.players[m.who]||{}).name+(m.item==='key'?' kalitni topdi!':' akkumulyatorni topdi!'),3500)}
 else if(e==='msg')toast(m.m,3200)
 else if(e==='scare'){setKind(m.k||'wolf');W.flickerAll=1.6;roarFor(m.k,m.p[0],m.p[1]+1.5,m.p[2],1.1);if(m.target===me.id){shake=1;S.stinger()}}
 else if(e==='hunt'){setKind(m.k||'wolf');W.flickerAll=2.2;roarFor(m.k,m.p[0],m.p[1]+1.5,m.p[2],1.4,.85);toast('U ovga chiqdi. Yashiriningiz!',3500)}
 else if(e==='leave'){toast("Mahluq g'oyib bo'ldi… hozircha.",3000);W.flickerAll=.8}
 else if(e==='caught'){if(m.who===me.id)jumpscare();else{toast((ST.players[m.who]||{}).name+' ushlandi!',3500);roarFor(m.k,m.p[0],m.p[1]+1.5,m.p[2],1.3,1.1)}}
 else if(e==='drive'){S.engine();carDrive=0}}

/* ---------- monster AI (host) ---------- */
const KINDS=['wolf','zombie','parasite'];const ROARS={wolf:[1,0],zombie:[1.25,0],parasite:[.85,1]};
function roarFor(k,x,y,z,vol,rm){const r=ROARS[k]||ROARS.wolf;S.roar(x,y,z,vol,r[0]*(rm||1),r[1])}
function setKind(k){if(!monster.models||!monster.models[k]||monster.kind===k)return;monster.model.group.visible=false;monster.kind=k;monster.model=monster.models[k];monster.anim='';}
const MS={mode:'away',kind:'wolf',pos:V(0,-50,0),ry:0,path:null,repath:0,target:null,lastSeen:null,lostT:0,huntT:0,timer:0,anim:'idle',seen:{},sawHide:{},speed:0,doorT:0};
function alivePlayers(){const out=[];for(const id in ST.players){const p=ST.players[id];if(!p.alive||p.car||p.gone)continue;const pos=id===me.id?P.pos:(remotes[id]?remotes[id].tpos:null);if(!pos)continue;out.push({id,p,pos,ry:id===me.id?P.yaw:remotes[id].try,fl:id===me.id?P.fl:remotes[id].fl})}return out}
function mSees(pl){if(pl.p.hide>=0)return false;const d=pl.pos.distanceTo(MS.pos);const range=pl.fl?28:18;if(d>range)return false;
 const f=fwdOf(MS.ry);const dir=V(pl.pos.x-MS.pos.x,0,pl.pos.z-MS.pos.z).normalize();if(d>5&&f.dot(dir)<-.2)return false;
 return sight(V(MS.pos.x,MS.pos.y+1.5,MS.pos.z),V(pl.pos.x,pl.pos.y+1.4,pl.pos.z))}
function spawnNear(target,minD,maxD,visible){const li=W.level(target.pos.y+.5);let best=null;
 for(let k=0;k<80;k++){const a=visible?(target.ry+PI+(Math.random()-.5)*1.2):Math.random()*PI*2;const d=minD+Math.random()*(maxD-minD);
  /* camera looks along -z of yaw; forward = (-sin yaw, -cos yaw) */const fx=visible?-Math.sin(target.ry):Math.cos(a),fz=visible?-Math.cos(target.ry):Math.sin(a);
  const ang=visible?(Math.random()-.5)*.9:0;const cx=Math.cos(ang),sx=Math.sin(ang);const x=target.pos.x+(fx*cx-fz*sx)*d,z=target.pos.z+(fx*sx+fz*cx)*d;
  const c=cellOf(x,z,li);if(!walkable(li,c))continue;const p=V(x,li?-H:0,z);if(li===0&&isStair(x,z))continue;
  const vis=sight(V(p.x,p.y+1.5,p.z),V(target.pos.x,target.pos.y+1.4,target.pos.z));if(visible&&vis)return p;if(!visible&&!vis)return p;if(!best)best=p}
 return best}
function hostMonster(dt){const T=ST.t;const hs=hostT;if(!hs||ST.ended)return;const pls=alivePlayers();
 if(MS.mode==='away'){MS.pos.set(0,-50,0);
  if(hs.next==='scare'&&T>=hs.at){const cand=pls.filter(p=>p.p.hide<0);if(cand.length){const tg=cand[Math.floor(Math.random()*cand.length)];const sp=spawnNear(tg,4.5,8,true);if(sp){MS.kind=KINDS[Math.floor(Math.random()*KINDS.length)];MS.pos.copy(sp);MS.ry=Math.atan2(tg.pos.x-sp.x,tg.pos.z-sp.z);MS.mode='scare';MS.timer=2.9;mAnim('scare');emit({e:'scare',target:tg.id,p:sp.toArray(),k:MS.kind})}else hs.at=T+5}else hs.at=T+5;if(MS.mode==='scare')hs.next='hunt'}
  else if(hs.next==='hunt'&&T>=hs.huntAt){if(pls.length){const tg=pls[Math.floor(Math.random()*pls.length)];const sp=spawnNear(tg,16,30,false);if(sp){MS.kind=KINDS[Math.floor(Math.random()*KINDS.length)];MS.pos.copy(sp);MS.mode='hunt';MS.huntT=0;MS.lostT=0;MS.target=tg.id;MS.lastSeen={pos:tg.pos.clone(),t:T};MS.path=null;MS.repath=0;mAnim('walk');emit({e:'hunt',p:sp.toArray(),k:MS.kind})}else hs.huntAt=T+4}else hs.huntAt=T+4}
  return}
 if(MS.mode==='scare'){MS.timer-=dt;if(MS.timer<=0){MS.mode='away';MS.pos.set(0,-50,0);W.flickerAll=.6}return}
 if(MS.mode==='attack'){MS.timer-=dt;if(MS.timer<=0)mLeave(60,180,true);return}
 /* hunt */
 MS.huntT+=dt;let seenAny=null,bestD=1e9;pls.forEach(pl=>{if(mSees(pl)){MS.seen[pl.id]=T;const d=pl.pos.distanceTo(MS.pos);if(d<bestD){bestD=d;seenAny=pl}}});
 /* someone hid while being watched: the monster knows */
 pls.forEach(pl=>{if(pl.p.hide>=0&&MS.sawHide[pl.id]&&T-MS.sawHide[pl.id]<25){const hp=HIDE[pl.p.hide].pos;if(!seenAny||hp.distanceTo(MS.pos)<bestD){seenAny={id:pl.id,pos:V(hp.x,hp.y-1,hp.z),hidden:true,p:pl.p};bestD=hp.distanceTo(MS.pos)}}});
 let goal=null,speed=2.1;
 if(seenAny){MS.target=seenAny.id;MS.lastSeen={pos:seenAny.pos.clone(),t:T};MS.lostT=0;goal=seenAny.pos;speed=4.4}
 else{MS.lostT+=dt;if(MS.lastSeen&&MS.pos.distanceTo(MS.lastSeen.pos)>1.2){goal=MS.lastSeen.pos;speed=3.2}else{if(!MS.wander||MS.pos.distanceTo(MS.wander)<1.2||Math.random()<.003){const pl=pls[Math.floor(Math.random()*pls.length)];const base=pl?pl.pos:MS.pos;const li=W.level(base.y+.5);for(let k=0;k<20;k++){const x=base.x+(Math.random()-.5)*16,z=base.z+(Math.random()-.5)*16;if(walkable(li,cellOf(x,z,li))){MS.wander=V(x,li?-H:0,z);break}}}goal=MS.wander}}
 /* catch */
 if(seenAny&&bestD<1.25&&Math.abs(seenAny.pos.y-MS.pos.y)<1.2){catchPlayer(seenAny.id);return}
 if((MS.lostT>22&&MS.huntT>35)||MS.huntT>140||!pls.length){mLeave(60,180,false);return}
 if(goal){MS.repath-=dt;if(MS.repath<=0||!MS.path){MS.path=astar(MS.pos.x,MS.pos.z,W.level(MS.pos.y+.5),goal.x,goal.z,W.level(goal.y+.5));MS.repath=seenAny?.35:1.0}
  let wp=MS.path&&MS.path[0];while(wp&&Math.hypot(wp.x-MS.pos.x,wp.z-MS.pos.z)<.45){MS.path.shift();wp=MS.path[0]}
  const tgt=wp||(seenAny?goal:null);if(tgt){const dx=tgt.x-MS.pos.x,dz=tgt.z-MS.pos.z,d=Math.hypot(dx,dz);if(d>.05){const st=Math.min(d,speed*dt);MS.pos.x+=dx/d*st;MS.pos.z+=dz/d*st;const ry=Math.atan2(dx,dz);let dr=ry-MS.ry;while(dr>PI)dr-=2*PI;while(dr<-PI)dr+=2*PI;MS.ry+=dr*Math.min(1,dt*8)}}
  MS.pos.y+=(W.groundY(MS.pos.x,MS.pos.z,MS.pos.y)-MS.pos.y)*Math.min(1,dt*8);
  /* open doors on the way */
  W.doors.forEach((d,i)=>{if(ST.doors[i]===0&&d.pos.distanceTo(V(MS.pos.x,1.1+MS.pos.y,MS.pos.z))<1.3){ST.doors[i]=1;broadcastState();emit({e:'sfx',s:'creak',p:d.pos.toArray()})}})}
 mAnim('walk',speed>3?1.9:speed>2.5?1.4:1)}
function mAnim(a,ts){if(MS.anim!==a||MS.ts!==ts){MS.anim=a;MS.ts=ts||1}}
function emit(e){if(N.mode==='host')N.broadcast(Object.assign({t:'ev'},e));onEvent(e)}
function mLeave(scareIn,huntIn,silent){const T=ST.t;MS.mode='away';MS.pos.set(0,-50,0);MS.path=null;MS.lastSeen=null;MS.sawHide={};hostT.next='scare';hostT.at=T+(FAST?6:scareIn);hostT.huntAt=T+(FAST?14:huntIn);if(!silent)emit({e:'leave'})}
function catchPlayer(id){const pl=ST.players[id];if(!pl)return;pl.alive=false;pl.hide=-1;const pos=id===me.id?P.pos:(remotes[id]?remotes[id].tpos:MS.pos);
 ['key','bat'].forEach(k=>{const it=ST.items[k];if(it.holder===id){it.holder=null;it.pos=[pos.x,pos.y,pos.z+.4]}});
 MS.mode='attack';MS.timer=2.2;mAnim('attack');broadcastState();emit({e:'caught',who:id,p:MS.pos.toArray(),k:MS.kind});hostCheckEnd()}
function hostCheckEnd(){if(ST.ended)return;const pls=Object.values(ST.players).filter(p=>!p.gone);if(pls.length&&pls.every(p=>!p.alive)){ST.ended='lose';setTimeout(broadcastState,2600)}}

/* ---------- local player ---------- */
const keys={};let shake=0,carDrive=-1,spectate=0,jump=null;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=1;if(ST.phase!=='play')return;if(e.code==='KeyE'||e.code==='Space'){e.preventDefault();doInteract()}if(e.code==='KeyF')toggleFlash()});
addEventListener('keyup',e=>{keys[e.code]=0});
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
 if(P.hide>=0){out.push({label:'Chiqish',pos:P.pos,a:'unhide',force:1});return out}
 if(P.inCar)return out;
 CONT.forEach((c,i)=>out.push({label:ST.cont[i]?'Yopish':'Ochish',pos:c.pos,a:'cont',i,icon:'hand'}));
 W.doors.forEach((d,i)=>{if(i===0&&ST.doors[0])return;out.push({label:ST.doors[i]?'Eshikni yopish':'Eshikni ochish',pos:d.pos,a:'door',i,r:1.6})});
 ['key','bat'].forEach(k=>{const s=it[k];if(s.holder||s.inst)return;const p=itemWorldPos(k);if(!p)return;if(!itemAvailable(k))return;out.push({label:k==='key'?'Kalitni olish':'Akkumulyatorni olish',pos:p,a:'take',i:k,r:1.8,item:1})});
 HIDE.forEach((h,i)=>{if(Object.values(ST.players).some(p=>p.hide===i))return;out.push({label:'Yashirinish',pos:h.pos,a:'hide',i,r:1.5})});
 const car=W.car;const hood=W.CARP.hood.clone().applyMatrix4(car.matrixWorld),door=W.CARP.door.clone().applyMatrix4(car.matrixWorld);
 if(!ST.car.bat)out.push({label:it.bat.holder===me.id?"Akkumulyatorni o'rnatish":'Akkumulyator kerak',pos:hood,a:it.bat.holder===me.id?'bat':null,r:1.8});
 if(!ST.car.key)out.push({label:it.key.holder===me.id?'Kalitni solish':'Kalit kerak',pos:door,a:it.key.holder===me.id?'key':null,r:1.8});
 if(ST.car.key&&ST.car.bat)out.push({label:"Mashinaga o'tirish",pos:door,a:'seat',r:2});
 return out}
function itemAvailable(k){const s=ST.items[k];if(s.pos)return true;const spot=k==='key'?W.KEY[s.spot]:W.BAT[s.spot];if(k==='key'&&spot.c!=null)return !!ST.cont[spot.c];return true}
function itemWorldPos(k){const s=ST.items[k];if(s.pos)return V(...s.pos);const spot=k==='key'?W.KEY[s.spot]:W.BAT[s.spot];if(!spot)return null;
 if(k==='key'&&spot.t==='drawer'){const c=CONT[spot.c];return V(0,.04,0).applyMatrix4(c.g.matrixWorld)}if(k==='key'&&spot.itemPos)return spot.itemPos.clone();return V(spot.x,spot.y+.02,spot.z)}
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
function jumpscare(){P.alive=false;jump={t:0};roarFor(monster.kind,null,0,0,1.6);S.stinger();$('#redFlash').hidden=false;if(document.pointerLockElement)document.exitPointerLock()}
function updateJump(dt){jump.t+=dt;const g=monster.model.group;const f=V(0,0,-1).applyQuaternion(cam.quaternion);f.y=0;f.normalize();g.visible=true;g.position.set(cam.position.x+f.x*1.9,cam.position.y-1.85,cam.position.z+f.z*1.9);g.rotation.y=Math.atan2(-f.x,-f.z);
 if(jump.t<.05)monster.model.play('attack',0);shake=Math.max(0,1.4-jump.t);if(jump.t>2.3){jump=null;$('#redFlash').hidden=true;$('#deadMsg').hidden=false;spectate=0}}
function endGame(res){ST.phase='end';if(document.pointerLockElement)document.exitPointerLock();setTimeout(()=>{show('end');const mine=ST.players[me.id]||{};const win=res==='win';const esc_=!!mine.car;
 $('#endTitle').textContent=win?(esc_?'Qochib qutuldingiz!':"Ular sizsiz ketishdi…"):'Hech kim qutulmadi';
 $('#endText').textContent=win?(esc_?"Eski mashina o't oldi va siz qorong'ilikdan chiqib ketdingiz.":"Do'stlaringiz mashinada qochib ketishdi. Siz esa shu uyda qoldingiz."):"Mahluq barchangizni tutib oldi. Uy yana jim bo'lib qoldi.";
 $('#endList').innerHTML=Object.values(ST.players).map(p=>'<li><b>'+esc(p.name)+'</b><em>'+(p.car?'Qochdi':p.alive?'Qoldi':'Ushlandi')+'</em></li>').join('');S.setFear(0,0)},win?5200:600)}
$('#endBack').onclick=()=>location.reload();

/* ---------- HUD ---------- */
function renderObjectives(){const it=ST.items,c=ST.car;const row=(ok,t)=>'<li class="'+(ok?'ok':'')+'"><span></span>'+t+'</li>';
 $('#obj').innerHTML=row(it.key.holder||it.key.inst,'Kalitni toping')+row(it.bat.holder||it.bat.inst,'Akkumulyatorni toping')+row(c.key&&c.bat,"Garajdagi mashinani tuzating")+row(false,"Mashinaga o'tirib qoching");
 $('#hold').innerHTML=(it.key.holder===me.id?'<span class="chipI">Kalit</span>':'')+(it.bat.holder===me.id?'<span class="chipI">Akkumulyator</span>':'')}
function renderPlayers(){$('#plist').innerHTML=Object.keys(ST.players).map(id=>{const p=ST.players[id];return '<li class="'+(p.alive?'':'dead')+'">'+esc(p.name)+(id===me.id?' (siz)':'')+'<i>'+(p.car?'mashinada':!p.alive?'ushlandi':p.hide>=0?'yashiringan':'')+'</i></li>'}).join('')}

/* ---------- main loop ---------- */
const clock=new THREE.Clock();let ambT=12,netT=0,snapT=0;const tmpV=V(0,0,0);
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 W.anim.forEach(f=>f(t,dt));if(W.flickerAll>0)W.flickerAll-=0;
 if(intro)updateIntro(dt);
 else if(ST.phase==='menu'||ST.phase==='lobby'){cam.position.set(Math.sin(t*.05)*3+4,1.9,19+Math.cos(t*.05)*1.5);cam.lookAt(0,2,9)}
 else if(ST.phase==='play'||ST.phase==='end'){
  if(N.mode!=='client'){ST.t+=dt;hostMonster(dt)}
  if(jump)updateJump(dt);else if(P.alive)updatePlayer(dt);else if(ST.phase!=='end')updateSpectate(dt);
  if(carDrive>=0){carDrive+=dt;const c=W.garage;W.carHeadM.color.set(0xfff2c0);W.car.position.z=.3+Math.max(0,carDrive-1.5)**2*.9;W.car.updateMatrixWorld(true);if(P.inCar){const seat=W.CARP.seat.clone().applyMatrix4(W.car.matrixWorld);cam.position.copy(seat)}}
  if(shake>0)shake=Math.max(0,shake-dt);
  /* interaction prompt */
  curInter=(P.alive&&ST.phase==='play')?pickInteract():null;const hb=$('#handBtn');if(curInter){hb.hidden=false;$('#handLbl').textContent=curInter.label;hb.classList.toggle('off',!curInter.a)}else hb.hidden=true;
  $('#carBar').hidden=!(P.inCar&&P.alive&&ST.phase==='play');$('#hideVeil').hidden=P.hide<0;if(P.hide>=0)$('#hideVeil').dataset.k=W.HIDE[P.hide].k;
  $('#stam i').style.width=(P.stamina*100)+'%';$('#stam').classList.toggle('low',P.tired);
  if(!P._lastCar&&P.inCar){P.yaw=PI+.08;P.pitch=-.05}if(P._lastCar&&!P.inCar&&P.alive){const ex=W.CARP.exit.clone().applyMatrix4(W.car.matrixWorld);P.pos.set(ex.x,0,ex.z)}P._lastCar=P.inCar;
  /* track hide transitions locally */if(P._lastHide!==P.hide){if(P._lastHide>=0&&P.hide<0)P.wasHidden=P._lastHide;P._lastHide=P.hide;renderPlayers()}
  /* network */
  netT-=dt;if(N.mode==='client'&&netT<=0){netT=1/12;N.send({t:'pos',p:[+P.pos.x.toFixed(2),+P.pos.y.toFixed(2),+P.pos.z.toFixed(2)],ry:+P.yaw.toFixed(2),pi:+P.pitch.toFixed(2),sp:+P.speed.toFixed(1),fl:P.fl})}
  snapT-=dt;if(N.mode==='host'&&snapT<=0){snapT=1/12;const pl={};pl[me.id]=[P.pos.x,P.pos.y,P.pos.z,P.yaw,P.speed,P.fl];for(const id in remotes){const r=remotes[id];pl[id]=[r.tpos.x,r.tpos.y,r.tpos.z,r.try,r.sp,r.fl]}
   N.broadcast({t:'snap',pl,m:[MS.pos.x,MS.pos.y,MS.pos.z,MS.ry,MS.anim,MS.mode!=='away',MS.ts||1,KINDS.indexOf(MS.kind)],time:ST.t})}
  if(N.mode!=='client'){setKind(MS.kind);monster.tpos.copy(MS.pos);monster.try=MS.ry;monster.vis=MS.mode!=='away';if(MS.anim!==monster.anim||MS.ts!==monster.ts){monster.anim=MS.anim;monster.ts=MS.ts;monster.model.play(MS.anim,.2,MS.ts||1)}}
  updateRemotes(dt,t);updateMonsterView(dt);
  S.setListener(cam.position.x,cam.position.y,cam.position.z,P.yaw);
  const md=monster.vis?monster.pos.distanceTo(cam.position):99;const chasing=monster.vis&&monster.anim==='walk'&&(monster.ts||1)>1.5&&md<22;S.setFear(monster.vis?Math.max(0,1-md/16):0,chasing?Math.max(.2,1-md/22):0);
  ambT-=dt;if(ambT<=0){ambT=(FAST?6:18)+Math.random()*30;const r=Math.random();if(!monster.vis||r<.3){if(r<.6)S.distant();else if(r<.8)S.whisper();else S.knock()}}
  /* item visuals */
  ['key','bat'].forEach(k=>{const o=IT[k],s=ST.items[k];if(s.holder||(s.inst&&k==='key')){o.visible=false;return}if(s.inst&&k==='bat'){o.visible=false;return}
   const p=itemWorldPos(k);o.visible=!!p&&(s.pos||k!=='key'||W.KEY[s.spot].c==null||ST.cont[W.KEY[s.spot].c]>0);if(p)o.position.copy(p);o.children.forEach(c=>{if(c.userData.glint)c.material.opacity=.55+.45*Math.sin(t*4)})});
  /* containers & doors animate toward state */
  CONT.forEach((c,i)=>{const tg=ST.cont[i]?1:0;c.cur+=(tg-c.cur)*Math.min(1,dt*7);if(c.type==='drawer'){c.g.position.copy(c.base).addScaledVector(c.f,c.cur*.38)}else c.g.rotation.y=(W.KEY[c.spot].ry||0)-c.cur*1.7});
  W.doors.forEach((d,i)=>{if(!d)return;const tg=ST.doors[i]?1:0;d.cur+=(tg-d.cur)*Math.min(1,dt*5);d.hinges.forEach(h=>h.rotation.y=h.userData.closed+(h.userData.open-h.userData.closed)*d.cur);d.solid.off=d.cur>.5});
 }
 if(cam.position.distanceTo(moonAt)>4){moonAt.copy(cam.position);W.moon.position.set(moonAt.x-40,55,moonAt.z+45);W.moon.target.position.set(moonAt.x,0,moonAt.z);W.moon.target.updateMatrixWorld()}
 R.render(scene,cam)}
const moonAt=V(0,0,0);scene.add(W.moon.target);
function updateRemotes(dt,t){for(const id in remotes){const r=remotes[id];const p=ST.players[id];if(!p){r.ch.group.visible=false;continue}
 r.pos.lerp(r.tpos,Math.min(1,dt*10));let dr=r.try-r.ry;while(dr>PI)dr-=2*PI;while(dr<-PI)dr+=2*PI;r.ry+=dr*Math.min(1,dt*10);
 const g=r.ch.group;const visible=p.alive&&p.hide<0&&!p.car&&!p.gone;g.visible=visible;g.position.copy(r.pos);g.rotation.y=r.ry+PI;
 r.ch.pose(dt,r.sp||0,0,t);r.ch.group.children.forEach(c=>{if(c.isSpotLight)c.intensity=visible&&r.fl?2.2:0});
 if(visible&&(r.sp||0)>.3){r.stepT-=dt*(r.sp||0);if(r.stepT<=0){r.stepT=(r.sp>3.6?1.25:.95);S.step(r.pos.x,r.pos.y,r.pos.z,.4,'wood')}}}}
function updateMonsterView(dt){const g=monster.model.group;if(jump)return monster.model.update(dt);
 if(!monster.vis){g.visible=false;monster.pos.copy(monster.tpos);return}
 if(!g.visible){g.visible=true;monster.pos.copy(monster.tpos)}monster.pos.lerp(monster.tpos,Math.min(1,dt*10));let dr=monster.try-monster.ry;while(dr>PI)dr-=2*PI;while(dr<-PI)dr+=2*PI;monster.ry+=dr*Math.min(1,dt*10);
 g.position.copy(monster.pos);g.rotation.y=monster.ry;monster.model.update(dt);
 if(monster.anim==='walk'){monster.stepT-=dt*(monster.ts||1);if(monster.stepT<=0){monster.stepT=.42;S.monsterStep(monster.pos.x,monster.pos.y,monster.pos.z)}}}
let spectId=null;
function updateSpectate(dt){const ids=Object.keys(ST.players).filter(id=>id!==me.id&&ST.players[id].alive&&!ST.players[id].gone);if(!ids.length){cam.position.lerp(V(0,18,30),dt);cam.lookAt(0,0,0);return}
 if(!ids.includes(spectId))spectId=ids[0];const r=remotes[spectId];if(!r)return;const back=fwdOf(r.ry);const tp=V(r.pos.x-back.x*2.6,r.pos.y+2.2,r.pos.z-back.z*2.6);cam.position.lerp(tp,Math.min(1,dt*4));cam.lookAt(r.pos.x,r.pos.y+1.4,r.pos.z);$('#deadWho').textContent=ST.players[spectId].name}
$('#deadNext').onclick=()=>{const ids=Object.keys(ST.players).filter(id=>id!==me.id&&ST.players[id].alive);if(!ids.length)return;const k=(ids.indexOf(spectId)+1)%ids.length;spectId=ids[k]};
show('boot');loop();
window.__G={cam,scene,keys,updatePlayer,tick:(n,dt)=>{for(let i=0;i<n;i++){ST.t+=dt;hostMonster(dt);if(ST.ended)break}},ST,P,MS,me,act,hostAct,W,NAV,astar,CONT,HIDE,IT,remotes,startIntro,endIntro,monster,introSeek:t=>{if(intro)intro.t=t},get hostT(){return hostT},itemWorldPos,interactables};
})();

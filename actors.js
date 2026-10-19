/* Qarovsiz Uy — asset loading, player characters (procedural animation), monster */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI;
const A=window.ACTORS={};
const loader=new THREE.GLTFLoader();if(window.MeshoptDecoder)loader.setMeshoptDecoder(MeshoptDecoder);
function b64buf(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer}
A.progress={done:0,total:5};
function bump(){A.progress.done++;if(A.onProgress)A.onProgress(A.progress.done/A.progress.total)}
/* window.ASSET_JSON=true makes the loader read base64 JSON wrappers (used where .glb files cannot be served) */
A.loadGLB=function(name){return new Promise((res,rej)=>{
 if(window.ASSET_JSON){fetch(''+name+'.json').then(r=>r.json()).then(j=>loader.parse(b64buf(j.b64),'',g=>{bump();res(g)},rej)).catch(rej)}
 else loader.load(''+name+'.glb',g=>{bump();res(g)},undefined,rej)})};
A.loadFurniture=function(){return fetch('furniture.json').then(r=>r.json()).then(P=>{bump();return P})};
A.parseFurn=function(b64){return new Promise(res=>loader.parse(b64buf(b64),'',g=>{const geos=[];g.scene.updateMatrixWorld(true);g.scene.traverse(m=>{if(m.isMesh){const ge=m.geometry.clone().applyMatrix4(m.matrixWorld);const ng=ge.index?ge.toNonIndexed():ge;ng.computeVertexNormals();geos.push(ng)}});res(geos)},()=>res([])))};

/* ---------- player characters ---------- */
A.CHARS={marlon:{name:'Marlon',file:'marlon',h:1.78},boy:{name:'Bola',file:'boy',h:1.62},kate:{name:'Kate',file:'kate',h:1.7}};
const src={};
A.loadChars=function(){return Promise.all(Object.keys(A.CHARS).map(k=>A.loadGLB(A.CHARS[k].file).then(g=>{src[k]=g})))};
const BN=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftArm','LeftForeArm','RightArm','RightForeArm','LeftUpLeg','LeftLeg','RightUpLeg','RightLeg','LeftShoulder','RightShoulder','LeftFoot','RightFoot'];
function findBones(root){const out={};root.traverse(o=>{if(!o.isBone)return;for(const n of BN){if(!out[n]&&o.name.endsWith(n)&&!o.name.endsWith('Fore'+n)){out[n]=o}}});
 /* LeftArm vs LeftForeArm: endsWith('LeftArm') never matches 'LeftForeArm' */return out}
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3();
A.makeCharacter=function(kind,opt){opt=opt||{};const def=opt.def||A.CHARS[kind]||A.CHARS.marlon;const g=opt.gltf||src[kind]||src.marlon;const style=opt.style||'human';
 const model=THREE.SkeletonUtils.clone(g.scene);const outer=new THREE.Group();const inner=new THREE.Group();outer.add(inner);inner.add(model);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;if(o.material){const ms=[].concat(o.material);ms.forEach(m=>{if(m.map)m.map.encoding=THREE.sRGBEncoding;m.roughness=.85;m.metalness=0;if(m.transparent||m.alphaTest){m.alphaTest=/hair/i.test(o.name+m.name)?.08:.4;m.transparent=false;m.depthWrite=true;m.side=THREE.DoubleSide}})}}});
 const bones=findBones(model);
 /* stop any baked animation: reset to bind pose */
 outer.updateMatrixWorld(true);
 const rootQinv=new THREE.Quaternion();outer.getWorldQuaternion(rootQinv);rootQinv.invert();
 const rest={};for(const k in bones){const b=bones[k];const wq=new THREE.Quaternion();b.getWorldQuaternion(wq);wq.premultiply(rootQinv);rest[k]={local:b.quaternion.clone(),model:wq,modelInv:wq.clone().invert(),pos:b.position.clone()}}
 /* height normalisation from head bone */
 const hp=V(0,0,0),fp=V(0,0,0);if(bones.Head)bones.Head.getWorldPosition(hp);if(bones.LeftFoot)bones.LeftFoot.getWorldPosition(fp);
 let h0=(hp.y-fp.y)+.22;if(!(h0>.3)){h0=1.7;fp.y=0}const sc=def.h/h0;inner.scale.setScalar(sc);const baseY=-(fp.y-.09)*sc;inner.position.y=baseY;
 /* arm alignment: rotate rest arm direction to hang down */
 const align={};['Left','Right'].forEach(side=>{const a=bones[side+'Arm'],f=bones[side+'ForeArm'];if(!a||!f)return;const pa=V(),pf=V();a.getWorldPosition(pa);f.getWorldPosition(pf);
  const d=pf.sub(pa).applyQuaternion(rootQinv).normalize();const s=Math.sign(d.x)||1;align[side]={q:new THREE.Quaternion().setFromUnitVectors(d,V(s*.18,-1,.06).normalize()),s}});
 function setRot(k,q){const b=bones[k],r=rest[k];if(!b)return;_q.copy(r.modelInv).multiply(q).multiply(r.model);b.quaternion.copy(r.local).multiply(_q)}
 const qx=a=>new THREE.Quaternion().setFromAxisAngle(V(1,0,0),a),qy=a=>new THREE.Quaternion().setFromAxisAngle(V(0,1,0),a),qz=a=>new THREE.Quaternion().setFromAxisAngle(V(0,0,1),a);
 let phase=0,crouchK=0;
 const ch={group:outer,kind,bones,
  /* state: speed m/s, crouch 0..1, flash bool */
  pose(dt,speed,crouch,t,act){const run=speed>3.6;const zb=style==='zombie';const tw=zb?Math.sin(t*23)*Math.max(0,Math.sin(t*1.7))*.12:0;phase+=dt*(speed>.05?(run?9.5:6.2)*Math.min(1,speed/2.2+.3):0);crouchK+=(crouch-crouchK)*Math.min(1,dt*8);
   const amp=speed>.05?(run?.75:.45)*Math.min(1,speed/1.5):0,sp=Math.sin(phase);
   const breathe=Math.sin(t*2)*.02;
   setRot('Hips',qx(crouchK*.2));
   const lean=zb?(act==='attack'?.6:act==='scare'?-.25:.32):0;setRot('Spine',qx(.05+crouchK*.35+(run?.15:0)+breathe+lean));setRot('Spine1',qx(crouchK*.15+(zb?.12:0)));setRot('Neck',qx(-crouchK*.3-(run?.1:0)-(zb?.25:0)+(act==='scare'?-.5:0)).multiply(qz(tw)));if(zb)setRot('Head',qz(tw*1.5).multiply(qx(act==='scare'?-.4:.1)));
   const knee=s=>.12+amp*1.1*Math.max(0,Math.sin(phase*1+(s>0?0:PI)+1.4));
   setRot('LeftUpLeg',qx(-sp*amp-crouchK*1.3));setRot('LeftLeg',qx(knee(1)+crouchK*2.0));
   setRot('RightUpLeg',qx(sp*amp-crouchK*1.3));setRot('RightLeg',qx(knee(-1)+crouchK*2.0));
   ['Left','Right'].forEach((side,i)=>{const al=align[side];if(!al)return;const sw=(i?-1:1)*sp*amp*.9;
    if(zb){const raise=act==='scare'?-2.7+Math.sin(t*30+i)*.15:act==='attack'?-1.7:-1.2+sw*.25+Math.sin(t*3+i)*.06;setRot(side+'Arm',qx(raise).multiply(qz((i?1:-1)*(act==='scare'?.5:.12))).multiply(al.q));setRot(side+'ForeArm',qy(-al.s*(act==='attack'?.1:.45)))}
    else{setRot(side+'Arm',qx(sw-crouchK*.4).multiply(al.q));setRot(side+'ForeArm',qy(-al.s*(.25+(run?.9:0)+crouchK*.6)))}});
   inner.position.y=baseY-crouchK*.55*def.h/1.75+(speed>.05?Math.abs(Math.cos(phase))*.035*amp:0);
  }};
 ch.pose(0,0,0,0);return ch};
/* floating name label */
A.nameTag=function(text,color){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='600 30px "Barlow Semi Condensed",sans-serif';x.textAlign='center';x.fillStyle='rgba(0,0,0,.55)';const w=Math.min(250,x.measureText(text).width+24);x.fillRect(128-w/2,10,w,44);x.fillStyle=color||'#ece3d4';x.fillText(text,128,43);
 const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(1,.25,1);s.renderOrder=10;return s};

/* ---------- humanoid monsters (Mixamo rigs, procedural animation) ---------- */
A.MONS={zombie:{file:'zombie',h:1.95,roar:0,rate:1.25},parasite:{file:'parasite',h:2.2,roar:1,rate:.9}};
const msrc={};
A.loadMonsters=function(){return Promise.all(Object.keys(A.MONS).map(k=>A.loadGLB(A.MONS[k].file).then(g=>{msrc[k]=g})))};
A.makeHumanMonster=function(kind){const def=A.MONS[kind];const ch=A.makeCharacter(kind,{gltf:msrc[kind],def:{h:def.h},style:'zombie'});let anim='idle',ts=1,t=0;
 const M={group:ch.group,kind,play(name,fade,tsc){anim=name;ts=tsc||1;M.anim=name},update(dt){t+=dt;const sp=anim==='walk'?2.0*ts:0;ch.pose(dt,sp,0,t,anim==='attack'?'attack':anim==='scare'?'scare':null)},anim:'idle'};return M};
/* ---------- monster ---------- */
let mSrc=null;
A.loadMonster=function(){return A.loadGLB('monster').then(g=>{mSrc=g})};
A.makeMonster=function(){const model=THREE.SkeletonUtils.clone(mSrc.scene);const outer=new THREE.Group();const inner=new THREE.Group();outer.add(inner);inner.add(model);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;[].concat(o.material).forEach(m=>{m.roughness=.7;m.metalness=0;if(m.map)m.map.encoding=THREE.sRGBEncoding})}});
 const box=new THREE.Box3().setFromObject(model);const sc=2.35/1.5;inner.scale.setScalar(sc);
 const mixer=new THREE.AnimationMixer(model);const clips={};
 mSrc.animations.forEach(c=>{const cc=c.clone();cc.tracks=cc.tracks.filter(t=>{if(/\.position$/.test(t.name)){const bn=t.name.split('.')[0];if(/^(root|rig)$/i.test(bn)){const v=t.values;for(let i=0;i<v.length;i+=3){v[i]=v[0];v[i+2]=v[2]}}}return true});clips[c.name.replace('rig|','')]=cc});
 const acts={};const map={idle:'IDDLE1',walk:'MOVE_Walk',attack:'ATK 1',scare:'STRIKE TEASE HIT',idle2:'IDDLE2'};
 for(const k in map){if(clips[map[k]]){acts[k]=mixer.clipAction(clips[map[k]]);if(k==='attack'||k==='scare'){acts[k].setLoop(THREE.LoopOnce);acts[k].clampWhenFinished=true}}}
 let cur=null;
 const M={group:outer,mixer,acts,
  play(name,fade,ts){const a=acts[name]||acts.idle;if(!a)return;if(cur===a&&!(name==='attack'||name==='scare')){a.timeScale=ts||1;return}a.reset();a.timeScale=ts||1;a.enabled=true;a.setEffectiveWeight(1);if(cur&&cur!==a)a.crossFadeFrom(cur,fade==null?.25:fade,false);a.play();cur=a;M.anim=name},
  update(dt){mixer.update(dt)},anim:''};
 M.play('idle',0);return M};
})();

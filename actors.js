/* Qarovsiz Uy — asset loading, player characters (procedural animation), monster */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI;
const A=window.ACTORS={};
const loader=new THREE.GLTFLoader();if(window.MeshoptDecoder)loader.setMeshoptDecoder(MeshoptDecoder);
function b64buf(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer}
A.progress={done:0,total:5};
function bump(){A.progress.done++;if(A.onProgress)A.onProgress(Math.min(1,A.progress.done/A.progress.total))}A.bump=bump;
/* window.ASSET_JSON=true makes the loader read base64 JSON wrappers (used where .glb files cannot be served) */
A.loadGLB=function(name){return new Promise((res,rej)=>{
 if(window.ASSET_JSON){fetch(''+name+'.json').then(r=>r.json()).then(j=>loader.parse(b64buf(j.b64),'',g=>{bump();res(g)},rej)).catch(rej)}
 else loader.load(''+name+'.glb',g=>{bump();res(g)},undefined,rej)})};
A.loadFurniture=function(){return fetch('furniture.json').then(r=>r.json()).then(P=>{bump();return P})};
A.parseFurn=function(b64){return new Promise(res=>loader.parse(b64buf(b64),'',g=>{const geos=[];g.scene.updateMatrixWorld(true);g.scene.traverse(m=>{if(m.isMesh){const ge=m.geometry.clone().applyMatrix4(m.matrixWorld);const ng=ge.index?ge.toNonIndexed():ge;ng.computeVertexNormals();geos.push(ng)}});res(geos)},()=>res([])))};

/* ---------- player characters ---------- */
A.CHARS={marlon:{name:'Marlon',file:'marlon',h:1.78},kate:{name:'Kate',file:'kate',h:1.7},boy:{name:'Bola',file:'boy',h:1.62},guard:{name:'Qorovul',file:'marlon',h:1.8,tint:[.5,.44,.38]}};
const src={};
A.loadChars=function(){const files={};Object.keys(A.CHARS).forEach(k=>{const f=A.CHARS[k].file;if(!files[f])files[f]=A.loadGLB(f)});/* a skin shares its base model */
 return Promise.all(Object.keys(A.CHARS).map(k=>files[A.CHARS[k].file].then(g=>{src[k]=g})))};
const BN=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftArm','LeftForeArm','RightArm','RightForeArm','LeftUpLeg','LeftLeg','RightUpLeg','RightLeg','LeftShoulder','RightShoulder','LeftFoot','RightFoot'];
function findBones(root){const out={};root.traverse(o=>{if(!o.isBone)return;for(const n of BN){if(!out[n]&&o.name.endsWith(n)&&!o.name.endsWith('Fore'+n)){out[n]=o}}});
 /* LeftArm vs LeftForeArm: endsWith('LeftArm') never matches 'LeftForeArm' */return out}
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3();
A.makeCharacter=function(kind,opt){opt=opt||{};const def=opt.def||A.CHARS[kind]||A.CHARS.marlon;const g=opt.gltf||src[kind]||src.marlon;const style=opt.style||'human';
 const model=THREE.SkeletonUtils.clone(g.scene);if(def.tint){const tc=new THREE.Color(def.tint[0],def.tint[1],def.tint[2]);const done=new Map();model.traverse(o=>{if(o.isMesh&&o.material){o.material=Array.isArray(o.material)?o.material.map(m=>{if(!done.has(m)){const c=m.clone();c.color&&c.color.multiply(tc);done.set(m,c)}return done.get(m)}):(()=>{const m=o.material;if(!done.has(m)){const c=m.clone();c.color&&c.color.multiply(tc);done.set(m,c)}return done.get(m)})()}})}const outer=new THREE.Group();const inner=new THREE.Group();outer.add(inner);inner.add(model);
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
  pose(dt,speed,crouch,t,act){const run=speed>3.6;const pt=style==='patient';const zb=style==='zombie'||pt;const tw=zb?Math.sin(t*23)*Math.max(0,Math.sin(t*1.7))*(pt?.2:.12):0;phase+=dt*(speed>.05?(run?9.5:6.2)*Math.min(1,speed/2.2+.3):0);crouchK+=(crouch-crouchK)*Math.min(1,dt*8);
   const amp=speed>.05?(run?.75:.45)*Math.min(1,speed/1.5):0,sp=Math.sin(phase);
   const breathe=Math.sin(t*2)*.02;
   setRot('Hips',qx(crouchK*.2));
   const lean=zb?(act==='attack'?.6:act==='scare'?-.25:.32):0;setRot('Spine',qx(.05+crouchK*.35+(run?.15:0)+breathe+lean));setRot('Spine1',qx(crouchK*.15+(zb?.12:0)));setRot('Neck',qx(-crouchK*.3-(run?.1:0)-(zb?.25:0)+(act==='scare'?-.5:0)).multiply(qz(tw)));if(zb)setRot('Head',qz(tw*1.5+(pt?.62+Math.sin(t*.7)*.08:0)).multiply(qx(act==='scare'?-.4:pt?.28:.1)));
   const knee=s=>.12+amp*1.1*Math.max(0,Math.sin(phase*1+(s>0?0:PI)+1.4));
   setRot('LeftUpLeg',qx(-sp*amp-crouchK*1.3));setRot('LeftLeg',qx(knee(1)+crouchK*2.0));
   setRot('RightUpLeg',qx(sp*amp*(pt?.45:1)-crouchK*1.3+(pt?.12:0)));setRot('RightLeg',qx(knee(-1)*(pt?.5:1)+crouchK*2.0+(pt?.18:0)));
   ['Left','Right'].forEach((side,i)=>{const al=align[side];if(!al)return;const sw=(i?-1:1)*sp*amp*.9;
    if(pt&&i===0&&!act){/* left arm hangs limp and swings */setRot(side+'Arm',qx(sw*.6+Math.sin(t*1.3)*.08).multiply(qz(-.08)).multiply(al.q));setRot(side+'ForeArm',qy(-al.s*.15));return}
    if(zb){const raise=act==='scare'?-2.7+Math.sin(t*30+i)*.15:act==='attack'?-1.7:(pt?-1.45:-1.2)+sw*.25+Math.sin(t*3+i)*.06;setRot(side+'Arm',qx(raise).multiply(qz((i?1:-1)*(act==='scare'?.5:.12))).multiply(al.q));setRot(side+'ForeArm',qy(-al.s*(act==='attack'?.1:.45)))}
    else{setRot(side+'Arm',qx(sw-crouchK*.4).multiply(al.q));setRot(side+'ForeArm',qy(-al.s*(.25+(run?.9:0)+crouchK*.6)))}});
   inner.position.y=baseY-crouchK*.55*def.h/1.75+(speed>.05?Math.abs(Math.cos(phase))*.035*amp:0);
  }};
 ch.pose(0,0,0,0);return ch};
/* floating name label */
A.nameTag=function(text,color,badge){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='600 30px "Barlow Semi Condensed",sans-serif';x.textAlign='center';x.fillStyle='rgba(0,0,0,.55)';const tw=x.measureText(text).width,bw=badge?30:0;const w=Math.min(250,tw+24+bw);x.fillRect(128-w/2,10,w,44);x.fillStyle=color||'#ece3d4';x.fillText(text,128-bw/2,43);
 if(badge){const cx=128-bw/2+tw/2+18,cy=32;x.fillStyle='#3b9cf2';x.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?10:12.5;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.fill();x.strokeStyle='#fff';x.lineWidth=3;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(cx-5,cy);x.lineTo(cx-1.5,cy+4);x.lineTo(cx+5.5,cy-4);x.stroke()}
 const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(1,.25,1);s.renderOrder=10;return s};

/* ---------- humanoid monsters (Mixamo rigs, procedural animation) ---------- */
A.MONS={zombie:{file:'zombie',h:1.95,roar:0,rate:1.25},parasite:{file:'parasite',h:2.2,roar:1,rate:.9},
 /* hospital patient: the zombie model in a washed-out, blood-stained look with its own gait */
 bemor:{file:'zombie',h:2.08,roar:2,rate:1,skin:'patient',style:'patient'},
 /* map 3: Alvasti — a pale woman in a white dress, long black hair over the face, feet turned backwards */
 alvasti:{file:'kate',h:1.9,roar:2,rate:1.45,skin:'ghost',style:'zombie',hair:1,gown:1,backFeet:1},
 /* map 4: Ko'r — a blind lab creature with a bandage over its eyes */
 kor:{file:'parasite',h:2.15,roar:1,rate:.75,skin:'blind',style:'zombie',band:1}};
const msrc={};
A.loadMonsters=function(kinds){const ks=kinds||['zombie','parasite'];const files={};ks.forEach(k=>{const f=A.MONS[k].file;if(!files[f])files[f]=A.loadGLB(f)});return Promise.all(ks.map(k=>files[A.MONS[k].file].then(g=>{msrc[k]=g})))};
/* repaint a texture: cold, sickly skin and greyed cloth, blood kept dark red */
const skinCache=new Map();function patientTex(t){if(!t||!t.image)return t;if(skinCache.has(t))return skinCache.get(t);const im=t.image;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 let d;try{d=x.getImageData(0,0,c.width,c.height)}catch(e){skinCache.set(t,t);return t}const a=d.data;for(let i=0;i<a.length;i+=4){const r=a[i],g=a[i+1],b=a[i+2];const l=.3*r+.59*g+.11*b;const blood=r>g*1.35&&r>b*1.3&&r>60;
  if(blood){a[i]=Math.min(255,r*.62);a[i+1]=g*.18;a[i+2]=b*.2}else{const k=Math.pow(l/255,.92)*255;a[i]=k*.78;a[i+1]=k*.9;a[i+2]=k*.94}}
 x.putImageData(d,0,0);/* a few fresh streaks */for(let k=0;k<60;k++){x.fillStyle='rgba('+(90+Math.random()*50|0)+',4,6,'+(.25+Math.random()*.4).toFixed(2)+')';const px=Math.random()*c.width,py=Math.random()*c.height;x.fillRect(px,py,2+Math.random()*6,10+Math.random()*60)}
 const nt=new THREE.CanvasTexture(c);nt.encoding=THREE.sRGBEncoding;nt.flipY=t.flipY;nt.wrapS=t.wrapS;nt.wrapT=t.wrapT;skinCache.set(t,nt);return nt}
const skinCache2=new Map();function recolor(t,key,fn){if(!t||!t.image)return t;const ck=key+'|'+t.uuid;if(skinCache2.has(ck))return skinCache2.get(ck);const im=t.image;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 let d;try{d=x.getImageData(0,0,c.width,c.height)}catch(e){skinCache2.set(ck,t);return t}const a=d.data;for(let i=0;i<a.length;i+=4){const o=fn(a[i],a[i+1],a[i+2]);a[i]=o[0];a[i+1]=o[1];a[i+2]=o[2]}x.putImageData(d,0,0);
 const nt=new THREE.CanvasTexture(c);nt.encoding=THREE.sRGBEncoding;nt.flipY=t.flipY;nt.wrapS=t.wrapS;nt.wrapT=t.wrapT;skinCache2.set(ck,nt);return nt}
const SKINF={ghost:(r,g,b)=>{const l=(.3*r+.59*g+.11*b)/255;const k=150+l*95;return [k*.93,k*.95,k]},blind:(r,g,b)=>{const l=(.3*r+.59*g+.11*b)/255;const k=70+l*150;return [k*1.0,k*.86,k*.84]}};
/* attach a mesh to a bone so that it keeps world size and starts aligned with the world axes */
function boneAttach(ch,bn,obj){const b=ch.bones[bn];if(!b)return false;ch.group.updateMatrixWorld(true);const ws=new THREE.Vector3(),wq=new THREE.Quaternion(),wp=new THREE.Vector3();b.matrixWorld.decompose(wp,wq,ws);const gq=new THREE.Quaternion();ch.group.getWorldQuaternion(gq);
 const holder=new THREE.Group();holder.scale.set(1/ws.x,1/ws.y,1/ws.z);holder.quaternion.copy(wq.clone().invert().multiply(gq));holder.add(obj);b.add(holder);return true}
function addHair(ch){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x080707,roughness:.9,side:THREE.DoubleSide});m.color.convertSRGBToLinear();
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.125,12,8,0,Math.PI*2,0,Math.PI*.6),m);cap.position.y=.1;g.add(cap);
 for(let i=0;i<26;i++){const a=i/26*Math.PI*2;const L=.75+Math.random()*.35;const st=new THREE.Mesh(new THREE.PlaneGeometry(.06,L),m);const r=.12+(Math.cos(a)>0?.02:0);st.position.set(Math.sin(a)*r,.16-L/2,Math.cos(a)*r);st.rotation.y=a;st.rotation.x=Math.cos(a)>.3?-.06:.04;g.add(st)}
 return boneAttach(ch,'Head',g)}
function addGown(ch){const m=new THREE.MeshStandardMaterial({color:0xb8b6ac,roughness:.95,side:THREE.DoubleSide});m.color.convertSRGBToLinear();const g=new THREE.Group();
 const sk=new THREE.Mesh(new THREE.CylinderGeometry(.19,.42,1.05,14,1,true),m);sk.position.y=-.5;g.add(sk);const top=new THREE.Mesh(new THREE.CylinderGeometry(.17,.2,.6,12,1,true),m);top.position.y=.28;g.add(top);
 for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.PlaneGeometry(.08,.25),new THREE.MeshBasicMaterial({color:0x3a0606}));const a=Math.random()*6.28;s.position.set(Math.sin(a)*.3,-.6-Math.random()*.3,Math.cos(a)*.3);s.rotation.y=a;g.add(s)}
 return boneAttach(ch,'Hips',g)}
function addBand(ch){const m=new THREE.MeshStandardMaterial({color:0x6a5a48,roughness:1});m.color.convertSRGBToLinear();const b=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.07,14,1,true),m);b.material.side=THREE.DoubleSide;b.position.y=.09;const g=new THREE.Group();g.add(b);
 const st=new THREE.Mesh(new THREE.PlaneGeometry(.05,.05),new THREE.MeshBasicMaterial({color:0x4a0505}));st.position.set(-.03,.09,.117);g.add(st);return boneAttach(ch,'Head',g)}
A.makeHumanMonster=function(kind){const def=A.MONS[kind];const ch=A.makeCharacter(kind,{gltf:msrc[kind],def:{h:def.h},style:def.style||'zombie'});
 if(SKINF[def.skin])ch.group.traverse(o=>{if(o.isMesh&&o.material){o.material=[].concat(o.material).map(m=>{const c=m.clone();c.map=recolor(m.map,def.skin,SKINF[def.skin]);c.color&&c.color.setRGB(1,1,1);c.roughness=.7;if(/hair/i.test(o.name+m.name)&&def.hair){c.color.setRGB(.02,.02,.02);c.map=null}return c});if(o.material.length===1)o.material=o.material[0]}});
 try{if(def.hair)addHair(ch);if(def.gown)addGown(ch);if(def.band)addBand(ch);if(def.backFeet)['LeftFoot','RightFoot'].forEach(n=>{const b=ch.bones[n];if(b)b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI))})}catch(e){console.warn('mon extra',e)}
 if(def.skin==='patient')ch.group.traverse(o=>{if(o.isMesh&&o.material){o.material=[].concat(o.material).map(m=>{const c=m.clone();c.map=patientTex(m.map);c.color&&c.color.setRGB(.95,.97,1);c.roughness=.6;return c});if(o.material.length===1)o.material=o.material[0]}});let anim='idle',ts=1,t=0;
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

/* Qarovsiz Uy — world: yard, house, basement, furniture, interactables data */
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z),UP=V(0,1,0),PI=Math.PI;
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const H=3.4;
const W={H,solids:[],doors:[],curtains:[],containers:[],hideSpots:[],keySpots:[],batSpots:[],furnBoxes:[],flick:[],anim:[]};
window.WORLD=W;

function ctex(sz,T,draw){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');draw(x,sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/T,1/T);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
function grime(x,s,n,a,light){for(let i=0;i<n;i++){x.fillStyle='rgba('+(light&&rnd()<.4?'230,220,200':'0,0,0')+','+(rnd()*a).toFixed(3)+')';const r=rnd()*s*.05+2;x.beginPath();x.arc(rnd()*s,rnd()*s,r,0,7);x.fill()}}
function streaks(x,s,n){for(let i=0;i<n;i++){x.fillStyle='rgba(25,15,8,'+(.08+rnd()*.22).toFixed(2)+')';x.fillRect(rnd()*s,rnd()*s*.4,1+rnd()*5,s*.2+rnd()*s*.6)}}
W.ctex=ctex;
const TX={
 paper:ctex(512,1.4,(x,s)=>{x.fillStyle='#352628';x.fillRect(0,0,s,s);x.strokeStyle='rgba(120,90,70,.16)';x.lineWidth=2;
   for(let i=0;i<4;i++)for(let j=0;j<4;j++){const cx=i*s/4+s/8,cy=j*s/4+(i%2?s/8:0);x.beginPath();x.ellipse(cx,cy,s/14,s/9,0,0,7);x.stroke();x.beginPath();x.moveTo(cx,cy-s/9);x.lineTo(cx,cy+s/9);x.stroke()}
   for(let i=0;i<s;i+=s/8){x.fillStyle='rgba(0,0,0,.12)';x.fillRect(i,0,2,s)}grime(x,s,500,.07);streaks(x,s,22);x.fillStyle='rgba(20,12,8,.45)';x.fillRect(0,s*.9,s,s*.1)}),
 siding:ctex(512,2.4,(x,s)=>{x.fillStyle='#4b4f48';x.fillRect(0,0,s,s);for(let i=0;i<8;i++){const y=i*s/8;x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,y,s,4);x.fillStyle='rgba(255,255,240,.05)';x.fillRect(0,y+4,s,6);
   for(let k=0;k<6;k++){x.fillStyle='rgba(110,80,55,'+(.25+rnd()*.4).toFixed(2)+')';x.fillRect(rnd()*s,y+6+rnd()*20,20+rnd()*90,4+rnd()*14)}}grime(x,s,700,.12);streaks(x,s,30)}),
 floor:ctex(512,2.4,(x,s)=>{x.fillStyle='#3a271a';x.fillRect(0,0,s,s);for(let i=0;i<8;i++){const y=i*s/8;x.fillStyle='hsl(25,'+(30+rnd()*15)+'%,'+(12+rnd()*7)+'%)';x.fillRect(0,y,s,s/8-3);x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,y+s/8-3,s,3);x.fillRect(((i*137)%8)*s/8,y,3,s/8);
   for(let k=0;k<30;k++){x.fillStyle='rgba(0,0,0,.08)';x.fillRect(rnd()*s,y+rnd()*s/8,30+rnd()*120,1)}}grime(x,s,300,.12)}),
 tile:ctex(256,.9,(x,s)=>{const n=4;for(let i=0;i<n;i++)for(let j=0;j<n;j++){x.fillStyle=(i+j)%2?'#1b1a19':'#b9b2a2';x.fillRect(i*s/n,j*s/n,s/n,s/n)}x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=2;for(let i=0;i<=n;i++){x.beginPath();x.moveTo(i*s/n,0);x.lineTo(i*s/n,s);x.stroke();x.beginPath();x.moveTo(0,i*s/n);x.lineTo(s,i*s/n);x.stroke()}grime(x,s,300,.16)}),
 concrete:ctex(512,3.5,(x,s)=>{x.fillStyle='#4a4945';x.fillRect(0,0,s,s);grime(x,s,1600,.08,1);streaks(x,s,26);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.5;for(let i=0;i<5;i++){x.beginPath();let px=rnd()*s,py=rnd()*s;x.moveTo(px,py);for(let k=0;k<8;k++){px+=(rnd()-.5)*50;py+=rnd()*40;x.lineTo(px,py)}x.stroke()}}),
 grass:ctex(512,5,(x,s)=>{x.fillStyle='#1d2416';x.fillRect(0,0,s,s);for(let i=0;i<5000;i++){x.strokeStyle='hsla('+(70+rnd()*30)+','+(20+rnd()*25)+'%,'+(8+rnd()*16)+'%,.6)';const px=rnd()*s,py=rnd()*s;x.beginPath();x.moveTo(px,py);x.lineTo(px+(rnd()-.5)*4,py-4-rnd()*8);x.stroke()}
   for(let i=0;i<40;i++){x.fillStyle='rgba(55,42,28,.35)';x.beginPath();x.ellipse(rnd()*s,rnd()*s,10+rnd()*40,6+rnd()*20,rnd()*3,0,7);x.fill()}}),
 dirt:ctex(512,3,(x,s)=>{x.fillStyle='#3a2e22';x.fillRect(0,0,s,s);grime(x,s,1600,.14,1);for(let i=0;i<120;i++){x.fillStyle='rgba(120,110,95,.35)';x.beginPath();x.arc(rnd()*s,rnd()*s,2+rnd()*6,0,7);x.fill()}}),
 roof:ctex(512,1.8,(x,s)=>{x.fillStyle='#211d1b';x.fillRect(0,0,s,s);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const ox=(r%2)*s/16;x.fillStyle='hsl(15,'+(8+rnd()*10)+'%,'+(9+rnd()*8)+'%)';x.fillRect(c*s/8+ox+1,r*s/8+1,s/8-3,s/8-3);if(rnd()<.06){x.fillStyle='#0a0908';x.fillRect(c*s/8+ox,r*s/8,s/8,s/8)}}grime(x,s,400,.1)}),
 brick:ctex(256,1.4,(x,s)=>{x.fillStyle='#2a1c17';x.fillRect(0,0,s,s);for(let r=0;r<8;r++)for(let c=0;c<5;c++){x.fillStyle='hsl(10,'+(30+rnd()*15)+'%,'+(17+rnd()*9)+'%)';x.fillRect(c*s/4+(r%2)*s/8-s/8+2,r*s/8+2,s/4-4,s/8-4)}grime(x,s,200,.15)}),
 stone:ctex(256,2,(x,s)=>{x.fillStyle='#55524c';x.fillRect(0,0,s,s);grime(x,s,900,.13,1)}),
 bust:ctex(256,.6,(x,s)=>{x.fillStyle='#77736c';x.fillRect(0,0,s,s);grime(x,s,900,.07);for(let i=0;i<14;i++){x.strokeStyle='rgba(60,55,50,.25)';x.beginPath();x.moveTo(rnd()*s,rnd()*s);x.bezierCurveTo(rnd()*s,rnd()*s,rnd()*s,rnd()*s,rnd()*s,rnd()*s);x.stroke()}}),
 curtain:ctex(256,1.2,(x,s)=>{x.fillStyle='#4a1518';x.fillRect(0,0,s,s);for(let i=0;i<s;i+=8){x.fillStyle='rgba(0,0,0,'+(.1+.15*Math.abs(Math.sin(i*.3))).toFixed(2)+')';x.fillRect(i,0,4,s)}grime(x,s,300,.12)})
};
const mats={};function MT(k,o){if(mats[k])return mats[k];return mats[k]=new THREE.MeshStandardMaterial(Object.assign({map:TX[k],roughness:.92},o||{}))}
const colMats={};function MC(c,r,metal,flat){const key=c+'_'+r+'_'+metal+'_'+flat;if(colMats[key])return colMats[key];const m=new THREE.MeshStandardMaterial({roughness:r==null?.85:r,metalness:metal||0,flatShading:!!flat});m.color.set(c).convertSRGBToLinear();return colMats[key]=m}
const glow=c=>new THREE.MeshBasicMaterial({color:c});
W.MC=MC;W.glow=glow;

W.build=function(scene){
const G={yard:new THREE.Group(),ground:new THREE.Group(),ceil:new THREE.Group(),roof:new THREE.Group(),base:new THREE.Group(),items:new THREE.Group()};
Object.values(G).forEach(g=>scene.add(g));W.G=G;const solids=W.solids;
function bx(w,h,d,x,y,z,mat,par,opt){opt=opt||{};const g=new THREE.BoxGeometry(w,h,d);
 if(!opt.rot)g.translate(x,y,z);const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));let u,v;if(nx>.5){u=p.getZ(i);v=p.getY(i)}else if(ny>.5){u=p.getX(i);v=p.getZ(i)}else{u=p.getX(i);v=p.getY(i)}uv.setXY(i,u,v)}
 const m=new THREE.Mesh(g,mat);if(opt.rot){m.position.set(x,y,z);m.rotation.set(opt.rot[0],opt.rot[1],opt.rot[2])}
 m.castShadow=opt.cast!==false;m.receiveShadow=true;(par||G.ground).add(m);
 if(opt.solid)solids.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,y1:y-h/2,y2:y+h/2});return m}
W.bx=bx;
function cy(rt,rb,h,x,y,z,mat,par,seg,open){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||14,1,!!open),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(par||G.ground).add(m);return m}
function rod(a,b,r,mat,par){const d=b.clone().sub(a);const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.72,r,d.length(),7),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,d.normalize());m.castShadow=true;(par||G.yard).add(m);return m}
const T=.24;
function wall(axis,k,a1,a2,ops,o){o=o||{};const y0=o.y0||0,h=o.h||H,par=o.par||G.ground;const inner=o.mat||MT('paper'),outer=o.outer?MT('siding'):inner;
 const ms=axis==='x'?(o.outer>0?[inner,inner,inner,inner,outer,inner]:o.outer<0?[inner,inner,inner,inner,inner,outer]:inner):(o.outer>0?[outer,inner,inner,inner,inner,inner]:o.outer<0?[inner,outer,inner,inner,inner,inner]:inner);
 const seg=(a,b,yb,yt)=>{if(b-a<.01||yt-yb<.01)return;const c=(a+b)/2,L=b-a,hh=yt-yb,cyy=y0+(yb+yt)/2;
   if(axis==='x')bx(L,hh,T,c,cyy,k,ms,par,{solid:1});else bx(T,hh,L,k,cyy,c,ms,par,{solid:1})};
 let c=a1;(ops||[]).slice().sort((p,q)=>p[0]-q[0]).forEach(([cx,w,top,bot])=>{bot=bot||0;seg(c,cx-w/2,0,h);seg(cx-w/2,cx+w/2,top,h);seg(cx-w/2,cx+w/2,0,bot);c=cx+w/2});seg(c,a2,0,h)}

/* floors */
[[-14,10.6,-10,10],[12.9,14,-10,10],[10.6,12.9,-3.6,10],[10.6,12.9,-10,-8.6]].forEach(([x1,x2,z1,z2])=>bx(x2-x1+(x2===14?.12:0)+(x1===-14?.12:0),.24,z2-z1+.24,(x1+x2)/2,-.12,(z1+z2)/2,[MT('concrete'),MT('concrete'),MT('floor'),MT('concrete'),MT('concrete'),MT('concrete')]));
bx(10,.02,6,9,.011,0,MT('tile'),G.ground,{cast:false});bx(2,.02,3,3,.011,-1.5,MT('tile'),G.ground,{cast:false});bx(4,.02,7,-12,.011,-6.5,MT('tile'),G.ground,{cast:false});
const ceilM=new THREE.MeshStandardMaterial({color:0x2c2622,roughness:1,side:THREE.DoubleSide});ceilM.color.convertSRGBToLinear();
const cp=new THREE.Mesh(new THREE.PlaneGeometry(28,20),ceilM);cp.rotation.x=PI/2;cp.position.set(0,H-.01,0);G.ceil.add(cp);
const win=(c,w)=>[c,w||1.3,2.35,.95];
wall('x',10,-14,14,[[0,1.7,2.6],win(-10.5),win(-6.8),win(6.8),win(10.5)],{outer:1});
wall('x',-10,-14,14,[[0,1.1,2.25],win(-12),win(-6),win(5.5),win(12)],{outer:-1});
wall('z',-14,-10,10,[win(7),win(0),win(-6.5)],{outer:-1});
wall('z',14,-10,10,[win(7),win(0),win(-6.5)],{outer:1});
wall('z',-4,0,10,[[6.5,1.9,2.6],[1.5,1.1,2.25]]);wall('z',4,0,10,[[6.5,1.9,2.6],[1.5,1.1,2.25]]);
wall('x',0,-4,-2,[]);wall('x',0,2,4,[]);
wall('x',3,-14,-4,[[-9,1.1,2.25]]);wall('x',3,4,14,[[9,2.8,2.7]]);
wall('z',-2,-10,0,[[-1.5,1.1,2.25],[-6.5,1.1,2.25]]);wall('z',2,-10,0,[[-1.5,1.1,2.25],[-6.5,1.1,2.25]]);
wall('x',-3,-14,-2,[]);wall('x',-3,2,14,[[11.6,1.1,2.25]]);
wall('z',-10,-10,-3,[[-8,1.0,2.25]]);wall('z',9,-10,-3,[]);
[[0,H+.06,10.06,28.6,.14,.36],[0,H+.06,-10.06,28.6,.14,.36]].forEach(a=>bx(a[3],a[4],a[5],a[0],a[1],a[2],MC(0x1c1815,.9),G.roof));
/* window sills block walking through windows */
(function(){const ov=.7,w=28+ov*2,d=20+ov*2,rh=4.2,half=d/2,len=Math.hypot(half,rh),ang=Math.atan2(rh,half);
 [-1,1].forEach(s=>bx(w,.16,len,0,H+rh/2,s*half/2,MT('roof'),G.roof,{rot:[s*ang,0,0]}));
 const sh=new THREE.Shape();sh.moveTo(-10,0);sh.lineTo(10,0);sh.lineTo(0,rh);sh.lineTo(-10,0);
 [-14.02,14.02].forEach(x=>{const g=new THREE.ShapeGeometry(sh);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i),p.getY(i));const m=new THREE.Mesh(g,MT('siding'));m.material.side=THREE.DoubleSide;m.rotation.y=PI/2;m.position.set(x,H,0);m.castShadow=true;G.roof.add(m)});
 bx(1,2.6,1,-7,H+3.4,-3,MT('brick'),G.roof);bx(1.2,.16,1.2,-7,H+4.7,-3,MC(0x1a1614),G.roof);
 const dg=new THREE.Group();dg.position.set(6,H+2.2,4.5);G.roof.add(dg);bx(2,1.6,1.6,0,0,0,MT('siding'),dg,{rot:[0,0,0]});
 const aw=new THREE.Mesh(new THREE.PlaneGeometry(.9,.8),new THREE.MeshBasicMaterial({color:0xff7744}));aw.position.set(0,-.05,.82);dg.add(aw);W.attic=aw;
 [-1,1].forEach(s=>bx(2.4,.1,1.3,0,.95,s*.42,MT('roof'),dg,{rot:[s*.75,0,0]}));
})();
/* porch */
bx(10,.3,2.8,0,.15,11.4,MT('floor'),G.yard);bx(3,.1,.4,0,.05,12.9,MT('floor'),G.yard);
[-4.6,-1.8,1.8,4.6].forEach(x=>{cy(.1,.12,2.9,x,1.75,12.6,MC(0x3d3a33),G.yard);solids.push({x1:x-.15,x2:x+.15,z1:12.45,z2:12.75,y1:0,y2:3})});
bx(10.6,.14,3.2,0,3.25,11.5,MT('roof'),G.yard,{rot:[.12,0,0]});
for(let x=-4.8;x<=4.8;x+=.35){if(Math.abs(x)<1.7)continue;if(rnd()<.18)continue;cy(.025,.025,.8,x,.7,12.7,MC(0x3d3a33),G.yard,5)}
[-3.2,3.2].forEach(x=>{bx(2.8,.06,.08,x,1.1,12.7,MC(0x3d3a33),G.yard);solids.push({x1:x-1.4,x2:x+1.4,z1:12.6,z2:12.8,y1:0,y2:1.2})});
const porchBulb=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),glow(0xffb060));porchBulb.position.set(1.2,2.55,10.3);G.yard.add(porchBulb);W.porchBulb=porchBulb;

/* lights */
scene.add(new THREE.HemisphereLight(0x52608c,0x0c0a08,.55));
const moon=new THREE.DirectionalLight(0xa8b8ff,1.05);moon.position.set(-40,55,45);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);
Object.assign(moon.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:170});moon.shadow.bias=-.0007;moon.shadow.normalBias=.02;scene.add(moon);W.moon=moon;
const moonS=new THREE.Mesh(new THREE.SphereGeometry(5,24,16),new THREE.MeshBasicMaterial({color:0xe6ebff,fog:false}));moonS.position.set(-110,90,-160);scene.add(moonS);
(function(){const n=900,p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=rnd()*PI*2,e=.15+rnd()*1.3,r=230;p[i*3]=Math.cos(a)*Math.cos(e)*r;p[i*3+1]=Math.sin(e)*r;p[i*3+2]=Math.sin(a)*Math.cos(e)*r}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xcfd6ff,size:.7,fog:false})))})();
const PL=(c,i,d,x,y,z)=>{const l=new THREE.PointLight(c,i,d,1.6);l.position.set(x,y,z);scene.add(l);l.userData.base=i;return l};
const L=W.L={porch:PL(0xffa850,2.2,9,1.2,2.4,10.8),lamp:PL(0xffc27a,1.8,12,-2.2,3.2,22),lamp2:PL(0xffc27a,1.6,12,2.2,3.2,61),guest:PL(0xffb877,1.4,12,45,2.8,35),barn:PL(0xd8a060,1.5,16,-45,4.2,-40),shop:PL(0xbfd8ff,1.3,12,48,2.8,-35),
 hall:PL(0xffd2a0,2,11,0,3,6.5),living:PL(0xff6a20,2.4,9,-12.6,.9,6.5),dining:PL(0xffcf9a,1.1,9,9,2.9,6.5),kitchen:PL(0xcfe0ff,1.4,9,9,3,0),
 study:PL(0xffb877,1.8,10,-9.5,2.2,0),master:PL(0xff4030,1.1,7,-6,1.2,-8),kids:PL(0x7a8cff,1,6,5,1,-6),laundry:PL(0xffe6b0,.9,7,11,2.8,-5.5),
 gen:PL(0x5dff9b,1.1,7,9,-1.8,-8),exitR:PL(0xff2a1a,1.6,8,-12.6,-1.4,0),bsm:PL(0xffc77a,1.8,13,0,-.8,2),garage:PL(0x8a9ac0,1.4,9,-23,2.6,16)};
const statueSpot=new THREE.SpotLight(0xfff4e0,2.6,9,.36,.5,1.4);statueSpot.position.set(0,H-.1,4.9);statueSpot.target.position.set(0,1.8,3);G.ground.add(statueSpot);G.ground.add(statueSpot.target);

/* yard */
[[-120,-14.2,-110,130],[14.2,120,-110,130],[-14.2,14.2,10.2,130],[-14.2,14.2,-110,-10.2]].forEach(([x1,x2,z1,z2])=>bx(x2-x1,.2,z2-z1,(x1+x2)/2,-.1,(z1+z2)/2,MT('grass'),G.yard,{cast:false}));
bx(2.4,.03,76.5,0,.015,51.2,MT('dirt'),G.yard,{cast:false});
for(let z=13.6;z<89;z+=.9)cy(.35+rnd()*.12,.4,.06,(rnd()-.5)*.6,.03,z,MT('stone'),G.yard,8);
function fence(axis,k,a1,a2,gap){for(let a=a1;a<=a2;a+=.55){if(gap&&Math.abs(a)<1.8)continue;if(rnd()<.12)continue;const h=1.35+rnd()*.4,lean=(rnd()-.5)*.3;
  axis==='x'?bx(.14,h,.05,a,h/2,k,MC(0x3a2b1f),G.yard,{rot:[0,0,lean]}):bx(.05,h,.14,k,h/2,a,MC(0x3a2b1f),G.yard,{rot:[lean,0,0]})}
 [.45,1.1].forEach(y=>{if(axis==='x'){if(gap){bx(-1.8-a1,.09,.06,(a1-1.8)/2,y,k,MC(0x34261b),G.yard);bx(a2-1.8,.09,.06,(a2+1.8)/2,y,k,MC(0x34261b),G.yard)}else bx(a2-a1,.09,.06,(a1+a2)/2,y,k,MC(0x34261b),G.yard)}else bx(.06,.09,a2-a1,k,y,(a1+a2)/2,MC(0x34261b),G.yard)});
 if(axis==='x'){solids.push({x1:a1,x2:gap?-1.8:a2,z1:k-.12,z2:k+.12,y1:-1,y2:3});if(gap)solids.push({x1:1.8,x2:a2,z1:k-.12,z2:k+.12,y1:-1,y2:3})}else solids.push({x1:k-.12,x2:k+.12,z1:a1,z2:a2,y1:-1,y2:3})}
fence('x',90,-85,85,true);fence('x',-80,-85,85);fence('z',-85,-80,90);fence('z',85,-80,90);
/* gate is chained shut: players came over the fence; it blocks */
const gate=new THREE.Group();gate.position.set(-1.8,0,90);G.yard.add(gate);for(let i=0;i<6;i++)bx(.14,1.6,.05,.15+i*.29,.8,0,MC(0x3a2b1f),gate);bx(1.75,.09,.06,.88,.4,0,MC(0x34261b),gate);bx(1.75,.09,.06,.88,1.25,0,MC(0x34261b),gate);
const gate2=gate.clone();gate2.position.set(1.8,0,90);gate2.rotation.y=PI;G.yard.add(gate2);
solids.push({x1:-1.8,x2:1.8,z1:89.85,z2:90.15,y1:-1,y2:3});
for(let i=0;i<8;i++){const l=new THREE.Mesh(new THREE.TorusGeometry(.05,.012,5,10),MC(0x777777,.35,.8));l.position.set(-.2+i*.06,1.0+Math.sin(i)*.05,90.08);l.rotation.y=i%2?PI/2:0;G.yard.add(l)}
bx(.14,.2,.08,0,.85,90.12,MC(0x8a6a20,.4,.8),G.yard);
[-1.95,1.95].forEach(x=>cy(.14,.16,2.4,x,1.2,90,MC(0x2b211a),G.yard,8));
W.lampBulbs=[];for(let z=22,k=0;z<88;z+=13,k++){const x=k%2?2.2:-2.2;cy(.06,.09,3.2,x,1.6,z,MC(0x1a1a1c,.5,.6),G.yard,8);bx(.3,.4,.3,x,3.3,z,MC(0x1a1a1c,.5,.6),G.yard);solids.push({x1:x-.15,x2:x+.15,z1:z-.15,z2:z+.15,y1:0,y2:3});const lb=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),glow(0xffc27a));lb.position.set(x,3.25,z);G.yard.add(lb);W.lampBulbs.push(lb)}W.lampBulb=W.lampBulbs[0];
const bark=MC(0x2a221a,1);
function tree(x,z,s,d){const br=(p,dir,len,r,dd)=>{const e=p.clone().addScaledVector(dir,len);rod(p,e,r,bark);if(dd>0){const k=dd>2?3:2;for(let i=0;i<k;i++){const nd=dir.clone().add(V((rnd()-.5)*1.6,rnd()*.5-.05,(rnd()-.5)*1.6)).normalize();br(e,nd,len*(.62+rnd()*.15),r*.6,dd-1)}}};
 br(V(x,0,z),V((rnd()-.5)*.2,1,(rnd()-.5)*.2).normalize(),3*s,.32*s,d||4);solids.push({x1:x-.4*s,x2:x+.4*s,z1:z-.4*s,z2:z+.4*s,y1:0,y2:3})}
[[-18,30,1.2],[22,36,1],[-27,4,1.1],[27,-4,1.3],[-12,-26,1],[16,-29,.9],[-28,-22,1.1],[26,22,.8],[-6,38,.7],[9,-20,.8]].forEach(a=>tree(a[0],a[1],a[2]));
tree(-12,24,1.25,3);rod(V(-11.9,3.6,24),V(-9.2,3.8,24),.11,bark);
const swing=new THREE.Group();swing.position.set(-9.8,3.75,24);G.yard.add(swing);[-.3,.3].forEach(z=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.7,4),MC(0x7a6a50));r.position.set(0,-1.35,z);swing.add(r)});bx(.45,.06,.75,0,-2.7,0,MC(0x3a2b1f),swing);
W.anim.push(t=>swing.rotation.x=Math.sin(t*1.1)*.3);
const bushM=MC(0x182214,1,0,true);
for(let i=0;i<34;i++){const side=i%4;let x,z;if(side==0){x=-14+rnd()*28;z=10.9+rnd()*.6;if(Math.abs(x)<5.4)continue}else if(side==1){x=-14+rnd()*28;z=-11-rnd()*.6}else if(side==2){x=-15-rnd()*.6;z=-10+rnd()*20}else{x=15+rnd()*.6;z=-10+rnd()*20}
 const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.5+rnd()*.5,1),bushM);b.position.set(x,.35,z);b.scale.y=.75;b.castShadow=b.receiveShadow=true;G.yard.add(b)}
/* well */
(function(){const g=new THREE.Group();g.position.set(14,0,27);G.yard.add(g);const w=new THREE.Mesh(new THREE.CylinderGeometry(1,1.05,.9,22,1,true),MT('stone'));w.material.side=THREE.DoubleSide;w.position.y=.45;w.castShadow=true;g.add(w);
 cy(.98,.98,.02,0,.3,0,glow(0x020202),g,22);cy(1.1,1.1,.12,0,.92,0,MT('stone'),g,22,true);bx(.14,2.4,.14,-1,1.2,0,MC(0x3a2b1f),g);bx(.14,2.4,.14,1,1.2,0,MC(0x3a2b1f),g);
 bx(2.5,.08,1.6,0,2.42,0,MT('roof'),g,{rot:[0,0,.1]});const ax=cy(.05,.05,2,0,1.9,0,MC(0x3a2b1f),g,6);ax.rotation.z=PI/2;cy(.15,.12,.25,.3,1.2,0,MC(0x55585c,.5,.6),g,8);solids.push({x1:12.9,x2:15.1,z1:25.9,z2:28.1,y1:0,y2:2})})();
/* garage + car (car model is loaded at runtime into W.car) */
(function(){const x0=-40,z0=30;const g=new THREE.Group();g.position.set(x0,0,z0);G.yard.add(g);const wm=MT('siding');
 bx(8,3.2,.2,0,1.6,-4.5,wm,g);bx(.2,3.2,9,-4,1.6,0,wm,g);bx(.2,3.2,9,4,1.6,0,wm,g);bx(8,.7,.2,0,2.85,4.5,wm,g);
 solids.push({x1:x0-4.1,x2:x0+4.1,z1:z0-4.6,z2:z0-4.4,y1:0,y2:3},{x1:x0-4.1,x2:x0-3.9,z1:z0-4.5,z2:z0+4.5,y1:0,y2:3},{x1:x0+3.9,x2:x0+4.1,z1:z0-4.5,z2:z0+4.5,y1:0,y2:3});
 bx(8.6,.15,9.6,0,3.3,0,MT('roof'),g,{rot:[.08,0,0]});bx(7.6,.6,.08,0,2.3,4.4,MC(0x5a5650,.6,.4),g,{rot:[-.3,0,0]});
 const car=new THREE.Group();car.position.set(-.4,0,.3);car.rotation.y=.08;g.add(car);W.car=car;W.garage=g;W.carBatSlot=new THREE.Group();car.add(W.carBatSlot);
 for(let i=0;i<5;i++)bx(.5,.5,.5,3.1,.25+(i>2?.5:0),-3.8+i*.55*(i>2?0:1),MC(0x4d4030),g,{rot:[0,rnd(),0]});
 solids.push({x1:x0+2.8,x2:x0+3.4,z1:z0-4.1,z2:z0-1.7,y1:0,y2:1});
 bx(2.4,.9,.6,-2.6,.45,-4.0,MC(0x3b2a1e),g,{solid:0});solids.push({x1:x0-3.8,x2:x0-1.4,z1:z0-4.3,z2:z0-3.7,y1:0,y2:1});
})();

/* shed */
(function(){const g=new THREE.Group();g.position.set(23,0,12);G.yard.add(g);const wm=MT('floor');
 bx(4,2.6,.15,0,1.3,-2,wm,g);bx(4,2.6,.15,0,1.3,2,wm,g);bx(.15,2.6,4,2,1.3,0,wm,g);bx(.15,2.6,1.4,-2,1.3,-1.3,wm,g);bx(.15,2.6,1.4,-2,1.3,1.3,wm,g);bx(.15,.5,1.2,-2,2.35,0,wm,g);
 bx(4.6,.12,4.6,0,2.75,0,MT('roof'),g,{rot:[0,0,.15]});const dr=new THREE.Group();dr.position.set(-2.02,0,-.6);dr.rotation.y=-1.2;g.add(dr);bx(.05,2.1,1.2,0,1.05,.6,MC(0x241a12),dr);
 solids.push({x1:21,x2:25,z1:9.9,z2:10.1,y1:0,y2:3},{x1:21,x2:25,z1:13.9,z2:14.1,y1:0,y2:3},{x1:24.9,x2:25.1,z1:10,z2:14,y1:0,y2:3},{x1:20.9,x2:21.1,z1:10,z2:11.4,y1:0,y2:3},{x1:20.9,x2:21.1,z1:12.6,z2:14,y1:0,y2:3});
 bx(1.6,.08,.5,1.1,.9,1.6,MC(0x3a2b1f),g);bx(1.6,.08,.5,1.1,1.5,1.6,MC(0x3a2b1f),g);for(let i=0;i<3;i++)bx(.5,.5,.5,1.3,.25,-1.4+i*.55,MC(0x4d4030),g,{rot:[0,rnd(),0]});
 const sl=new THREE.PointLight(0xffd090,.0,5,1.6);sl.position.set(23,2.2,12);scene.add(sl);})();
/* doghouse */
(function(){const g=new THREE.Group();g.position.set(8,0,19);g.rotation.y=-.5;G.yard.add(g);bx(1.2,.9,1.4,0,.45,0,MC(0x4a3524),g);bx(.5,.6,.05,0,.3,.71,glow(0x020202),g);
 [-1,1].forEach(s=>bx(1.5,.06,.9,s*.32,1.05,0,MT('roof'),g,{rot:[0,0,s*-.75]}));for(let i=0;i<14;i++){const l=new THREE.Mesh(new THREE.TorusGeometry(.04,.01,5,8),MC(0x666666,.4,.7));l.position.set(.2+i*.09,.03,.9+Math.sin(i*.7)*.15);l.rotation.y=i%2?PI/2:0;l.rotation.x=PI/2;g.add(l)}cy(.15,.12,.08,1.6,.04,1.1,MC(0x6a6c6e,.5,.6),g,12);solids.push({x1:7.3,x2:8.7,z1:18.2,z2:19.8,y1:0,y2:1})})();
/* graveyard */
(function(){const g=new THREE.Group();g.position.set(21,0,-23);G.yard.add(g);const sm=MT('stone');
 for(let i=0;i<9;i++){const x=(i%3)*2.4-2.4,z=Math.floor(i/3)*2.6-2.6;const t=new THREE.Group();t.position.set(x+(rnd()-.5)*.4,0,z);t.rotation.set((rnd()-.5)*.2,(rnd()-.5)*.4,(rnd()-.5)*.2);g.add(t);
  if(i%4==1){bx(.12,1.2,.12,0,.6,0,sm,t);bx(.6,.12,.12,0,.85,0,sm,t)}else{bx(.7,.8,.16,0,.4,0,sm,t);const top=cy(.35,.35,.16,0,.8,0,sm,t,16);top.rotation.x=PI/2}
  bx(.8,.06,1.8,0,.03,.9,MT('dirt'),t,{cast:false});solids.push({x1:21+x-.4,x2:21+x+.4,z1:-23+z-.15,z2:-23+z+.15,y1:0,y2:1})}
 for(let a=-4.4;a<=4.4;a+=.4){[-4.4,4.4].forEach(z=>{cy(.02,.02,1,a,.5,z,MC(0x161616,.5,.7),g,4)});cy(.02,.02,1,-4.4,.5,a,MC(0x161616,.5,.7),g,4);if(a<2.5||a>3.9)cy(.02,.02,1,4.4,.5,a,MC(0x161616,.5,.7),g,4)}
 [-4.4,4.4].forEach(z=>bx(8.8,.04,.04,0,.95,z,MC(0x161616,.5,.7),g));bx(.04,.04,8.8,-4.4,.95,0,MC(0x161616,.5,.7),g);
 solids.push({x1:16.5,x2:25.5,z1:-27.5,z2:-27.3,y1:0,y2:1.2},{x1:16.5,x2:25.5,z1:-18.7,z2:-18.5,y1:0,y2:1.2},{x1:16.5,x2:16.7,z1:-27.4,z2:-18.6,y1:0,y2:1.2},{x1:25.3,x2:25.5,z1:-27.4,z2:-20.5,y1:0,y2:1.2});})();
/* greenhouse */
(function(){const g=new THREE.Group();g.position.set(-21,0,-21);G.yard.add(g);const fm=MC(0x2a2c2a,.5,.6),gm=new THREE.MeshStandardMaterial({color:0x8aa0a0,transparent:true,opacity:.18,roughness:.1,side:THREE.DoubleSide});
 for(let i=0;i<=4;i++){const z=-3+i*1.5;bx(.08,2.2,.08,-2,1.1,z,fm,g);bx(.08,2.2,.08,2,1.1,z,fm,g);rod(V(-23,2.2,-21+z),V(-21,3.2,-21+z),.04,fm);rod(V(-19,2.2,-21+z),V(-21,3.2,-21+z),.04,fm)}
 bx(.06,.06,6,-2,2.2,0,fm,g);bx(.06,.06,6,2,2.2,0,fm,g);bx(.06,.06,6,0,3.2,0,fm,g);
 for(let i=0;i<4;i++){if(i==1)continue;const p=new THREE.Mesh(new THREE.PlaneGeometry(1.5,2.1),gm);p.position.set(-2.01,1.1,-2.25+i*1.5);p.rotation.y=PI/2;g.add(p)}
 for(let i=0;i<5;i++){bx(.9,.5,.4,-1.2+(i%2)*2.4,.25,-2.4+i*1.2,MC(0x3d2a1c),g);const pl=new THREE.Mesh(new THREE.IcosahedronGeometry(.25,0),MC(0x2a2216,1,0,true));pl.position.set(-1.2+(i%2)*2.4,.6,-2.4+i*1.2);g.add(pl)}
 for(let i=0;i<10;i++){const s=new THREE.Mesh(new THREE.PlaneGeometry(.2+rnd()*.3,.15+rnd()*.3),gm);s.rotation.x=-PI/2;s.position.set(-2.6+rnd()*.8,.02,-3+rnd()*6);g.add(s)}})();
/* clothesline */
(function(){const g=new THREE.Group();g.position.set(-8,0,-18);G.yard.add(g);[-3,3].forEach(x=>{cy(.05,.05,2.2,x,1.1,0,MC(0x55585c,.5,.6),g,6);bx(.8,.05,.05,x,2.15,0,MC(0x55585c,.5,.6),g)});bx(6,.01,.01,0,2.1,.35,MC(0x888888),g);bx(6,.01,.01,0,2.1,-.35,MC(0x888888),g);
 const sheets=[];[-1.8,.2,2].forEach((x,i)=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.5,1,6),new THREE.MeshStandardMaterial({color:i==1?0x9d9384:0xb8b0a0,side:THREE.DoubleSide,roughness:1}));s.geometry.translate(0,-.75,0);s.position.set(x,2.1,.35*(i%2?-1:1));s.castShadow=true;g.add(s);sheets.push(s)});
 W.anim.push(t=>sheets.forEach((s,i)=>{s.rotation.x=Math.sin(t*1.7+i)*.18;s.rotation.y=Math.sin(t*.9+i*2)*.08}))})();
for(let i=0;i<7;i++){const x=17+rnd()*4,z=4+rnd()*4;bx(.6,.6,.6,x,.3,z,MC(0x4d4030),G.yard,{rot:[0,rnd()*3,0]})}
(function(){const g=new THREE.Group();g.position.set(-6,0,18);g.rotation.y=.7;G.yard.add(g);bx(.9,.35,1.3,0,.55,0,MC(0x4a4c4a,.6,.5),g,{rot:[.15,0,0]});const w=cy(.25,.25,.08,0,.25,.75,MC(0x111111),g,12);w.rotation.z=PI/2})();
const fogTex=ctex(256,1,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(200,205,220,.5)');g.addColorStop(1,'rgba(200,205,220,0)');x.fillStyle=g;x.fillRect(0,0,s,s)});fogTex.repeat.set(1,1);fogTex.encoding=THREE.LinearEncoding;
const fogs=[];for(let i=0;i<34;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({map:fogTex,transparent:true,opacity:.13,depthWrite:false}));m.rotation.x=-PI/2;m.position.set(-32+rnd()*64,.25+rnd()*.4,-32+rnd()*74);if(Math.abs(m.position.x)<15&&Math.abs(m.position.z)<11)m.position.z+=24;G.yard.add(m);fogs.push(m)}
W.anim.push(t=>fogs.forEach((f,i)=>f.position.x+=Math.sin(t*.1+i)*.004));

/* interior details */
const frameM=MC(0x2a1c10,.6,.2);
const portrait=ctex(256,1,(x,s)=>{x.fillStyle='#14100d';x.fillRect(0,0,s,s);const g=x.createRadialGradient(s/2,s*.42,10,s/2,s*.45,s*.42);g.addColorStop(0,'#5d4a3a');g.addColorStop(1,'#14100d');x.fillStyle=g;x.beginPath();x.ellipse(s/2,s*.42,s*.18,s*.24,0,0,7);x.fill();
 x.fillStyle='#2a1e16';x.beginPath();x.ellipse(s/2,s*.95,s*.36,s*.3,0,0,7);x.fill();x.fillStyle='#000';x.beginPath();x.ellipse(s*.44,s*.4,s*.035,s*.025,0,0,7);x.fill();x.beginPath();x.ellipse(s*.56,s*.4,s*.035,s*.025,0,0,7);x.fill();
 x.fillStyle='rgba(150,20,10,.7)';x.fillRect(s*.43,s*.42,3,s*.12);x.fillRect(s*.56,s*.42,3,s*.1);grime(x,s,200,.15)});portrait.repeat.set(1,1);
const pMat=new THREE.MeshStandardMaterial({map:portrait,roughness:.7});
function painting(x,y,z,ry,w,h){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;G.ground.add(g);bx(w+.16,h+.16,.06,0,0,0,frameM,g,{rot:[0,0,(rnd()-.5)*.08]});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),pMat);p.position.z=.035;g.add(p)}
painting(-3.86,1.9,5,PI/2,.9,1.2);painting(3.86,1.9,5,-PI/2,.9,1.2);painting(-1.86,1.8,-4,PI/2,.7,.9);painting(1.86,1.8,-8.5,-PI/2,.7,.9);painting(-6,2,9.86,PI,1.1,.8);painting(-13.86,1.9,-1,PI/2,.8,1);painting(9,2,9.86,PI,1.2,.9);
const flames=[];for(let i=0;i<5;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.09,.38,6),glow(i%2?0xff6a1a:0xffb43a));f.position.set(-13.55,.28,6.15+i*.17);G.ground.add(f);flames.push(f)}
bx(.5,.08,.8,-13.55,.06,6.5,MC(0x1a0f08),G.ground);
bx(3.2,.015,5,0,.02,6,MC(0x4a1517,1),G.ground,{cast:false});bx(2.6,.015,3.6,-10.5,.02,6.5,MC(0x3a2a20,1),G.ground,{cast:false});bx(1.2,.015,9,0,.02,-5,MC(0x401416,1),G.ground,{cast:false});
(function(){const g=new THREE.Group();g.position.set(0,2.9,6.5);G.ground.add(g);const t=new THREE.Mesh(new THREE.TorusGeometry(.55,.03,6,28),MC(0x6a5a3a,.4,.7));t.rotation.x=PI/2;g.add(t);cy(.012,.012,.5,0,.25,0,MC(0x333333),g,4);
 const candles=[];for(let i=0;i<8;i++){const a=i/8*PI*2;cy(.03,.03,.14,Math.cos(a)*.55,.08,Math.sin(a)*.55,MC(0xd8d0c0),g,6);if(i%3){const f=new THREE.Mesh(new THREE.ConeGeometry(.02,.06,5),glow(0xffb050));f.position.set(Math.cos(a)*.55,.18,Math.sin(a)*.55);g.add(f);candles.push(f)}}
 W.anim.push(t=>{candles.forEach((c,i)=>c.scale.y=.8+Math.sin(t*9+i*2)*.3);flames.forEach((f,i)=>{f.scale.y=.7+Math.sin(t*11+i*1.7)*.35+Math.random()*.15})})})();
bx(1.7,.6,.8,-12.8,.3,-3.6,MC(0xcfc8b8,.4),G.ground,{solid:1});bx(1.5,.05,.6,-12.8,.58,-3.6,MC(0x2a2018,.3),G.ground);bx(.7,.9,.03,-12,1.6,-9.86,MC(0x8f9aa0,.08,.9));
bx(.6,.85,.6,13.6,.43,-9.4,MC(0xc8c3b6,.5),G.ground,{solid:1});
(function(){const g=new THREE.Group();g.position.set(7.8,.78,-9.2);g.rotation.y=.3;G.ground.add(g);const sk=MC(0xd9c7b4,.6);cy(.09,.12,.25,0,.12,0,MC(0x7a1d22),g,10);const h=new THREE.Mesh(new THREE.SphereGeometry(.08,14,10),sk);h.position.y=.32;g.add(h);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.015,6,4),glow(0x000000));e.position.set(s*.03,.34,.07);g.add(e)});W.anim.push(t=>g.rotation.y=Math.sin(t*.25)>.96?PI:.3)})();
const sheetM=MC(0xbab2a2,1,0,true);
function covered(x,z,w,h,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,4,3,4),sheetM);const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,p.getY(i)+(p.getY(i)>0?(rnd()-.5)*.06:0));p.setX(i,p.getX(i)*(1+(p.getY(i)<0?.08:0)))}m.geometry.computeVertexNormals();m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;G.ground.add(m);solids.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,y1:0,y2:h})}
covered(-6.2,4.2,1.6,1.1,.9);covered(12.6,8.6,1.2,1.6,.7);
/* stairs */
const stairM=MT('floor');for(let i=0;i<16;i++){const top=-(i+1)*(H/16),z2=-3.6-i*.3125,z1=z2-.3125;bx(2.3,top+H,.3125,11.75,(top-H)/2,(z1+z2)/2,stairM,G.ground)}
[10.6,12.9].forEach(x=>{bx(.06,1,4.4,x,.5,-6.4,MC(0x2a1c10),G.ground,{solid:1});for(let z=-4.3;z>-8.6;z-=.5)cy(.025,.025,1,x,.5,z,MC(0x2a1c10),G.ground,5)});
bx(2.3,1,.06,11.75,.5,-8.6,MC(0x2a1c10),G.ground,{solid:1});
/* stair walls for the basement level (under the steps) */
solids.push({x1:10.6,x2:12.9,z1:-8.0,z2:-3.6,y1:-3.4,y2:-2.6,stairUnder:1});
/* curtains (hide spots) */
function curtain(x,z,ry,w){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;G.ground.add(g);const geo=new THREE.PlaneGeometry(w,2.6,16,1);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*14)*.05);geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:TX.curtain,roughness:1,side:THREE.DoubleSide}));m.position.set(0,1.4,0);m.castShadow=true;g.add(m);bx(w+.3,.04,.04,0,2.75,0,MC(0x6a5a3a,.4,.7),g);W.curtains.push(m);W.anim.push(t=>m.rotation.x=Math.sin(t*.8+x)*.03);return g}
curtain(-13.55,7,PI/2,1.8);curtain(13.55,7,-PI/2,1.8);curtain(-6.8,9.55,PI,1.8);


/* ===== bigger estate: generic building helper ===== */
function gable(x1,x2,z1,z2,h0,rh,alongX,mat){const w=x2-x1,d=z2-z1,cx=(x1+x2)/2,cz=(z1+z2)/2,ov=.5;
 if(alongX){const half=d/2+ov,len=Math.hypot(half,rh),ang=Math.atan2(rh,half);[-1,1].forEach(s=>bx(w+ov*2,.14,len,cx,h0+rh/2,cz+s*half/2,mat||MT('roof'),G.roof,{rot:[s*ang,0,0]}));
  const sh=new THREE.Shape();sh.moveTo(-d/2,0);sh.lineTo(d/2,0);sh.lineTo(0,rh);sh.lineTo(-d/2,0);[x1-.02,x2+.02].forEach(x=>{const g=new THREE.ShapeGeometry(sh);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i),p.getY(i));const m=new THREE.Mesh(g,MT('siding'));m.rotation.y=PI/2;m.position.set(x,h0,cz);G.roof.add(m)})}
 else{const half=w/2+ov,len=Math.hypot(half,rh),ang=Math.atan2(rh,half);[-1,1].forEach(s=>bx(len,.14,d+ov*2,cx+s*half/2,h0+rh/2,cz,mat||MT('roof'),G.roof,{rot:[0,0,-s*ang]}));
  const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,rh);sh.lineTo(-w/2,0);[z1-.02,z2+.02].forEach(z=>{const g=new THREE.ShapeGeometry(sh);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i),p.getY(i));const m=new THREE.Mesh(g,MT('siding'));m.position.set(cx,h0,z);G.roof.add(m)})}}
function slab(x1,x2,z1,z2,mat,h){bx(x2-x1,.04,z2-z1,(x1+x2)/2,.02,(z1+z2)/2,mat||MT('floor'),G.ground,{cast:false});const c=new THREE.Mesh(new THREE.PlaneGeometry(x2-x1,z2-z1),ceilM);c.rotation.x=PI/2;c.position.set((x1+x2)/2,(h||H)-.01,(z1+z2)/2);G.ceil.add(c)}
W.BLD=[];
/* --- guest house: 20 x 14 m, 6 rooms around a corridor --- */
(function(){const x1=35,x2=55,z1=28,z2=42;slab(x1,x2,z1,z2);slab(x1,42,z1,34,MT('tile'));slab(42,48.5,z1,34,MT('tile'));
 const dW=a=>[a,1.1,2.25];
 wall('z',x1,z1,z2,[[35,1.4,2.4],win(39.2),win(30.8)],{outer:-1});wall('z',x2,z1,z2,[win(39),win(31)],{outer:1});
 wall('x',z2,x1,x2,[win(38.5),win(45.2),win(51.8)],{outer:1});wall('x',z1,x1,x2,[win(38.5),win(45.2),win(51.8)],{outer:-1});
 wall('x',36,x1,x2,[dW(38.5),dW(45.2),dW(51.8)]);wall('x',34,x1,x2,[dW(38.5),dW(45.2),dW(51.8)]);
 wall('z',42,36,z2,[]);wall('z',48.5,36,z2,[]);wall('z',42,z1,34,[]);wall('z',48.5,z1,34,[]);
 gable(x1,x2,z1,z2,H,3.4,true);bx(5,.3,2.4,x1-1.3,.15,35,MT('floor'),G.yard);
 W.BLD.push({n:'Mehmon uyi',x:45,z:35});})();
/* --- barn: 26 x 16 m, tall hall, 4 stalls, tool room --- */
(function(){const x1=-58,x2=-32,z1=-48,z2=-32,h=5.2;slab(x1,x2,z1,z2,MT('dirt'),h);
 const o={h};
 wall('x',z2,x1,x2,[[-45,4,3.6],win(-54,1.4),win(-36,1.4)],Object.assign({outer:1},o));wall('x',z1,x1,x2,[win(-51),win(-42)],Object.assign({outer:-1},o));
 wall('z',x1,z1,z2,[win(-40)],Object.assign({outer:-1},o));wall('z',x2,z1,z2,[[-35,1.2,2.3]],Object.assign({outer:1},o));
 [-53.5,-49,-44.5,-40].forEach(x=>wall('z',x,z1,-42,[],{h:1.9,mat:MT('floor')}));
 wall('x',-42,x1,-40,[[-55.75,1.4,2],[-51.25,1.4,2],[-46.75,1.4,2],[-42.25,1.4,2]],{h:1.05,mat:MT('floor')});
 wall('z',-36,z1,-37,[[-40,1.1,2.25]],{h:H});wall('x',-37,-36,x2,[],{h:H});
 gable(x1,x2,z1,z2,h,4.2,true);
 for(let i=0;i<14;i++){const x=i%2?-57+rnd()*7:-42+rnd()*4,z=-40+rnd()*6;const hb=bx(1.2,.7,.8,x,.35+(i%5==0?.7:0),z,MC(0x8a7a3a,1,0,true),G.ground,{rot:[0,rnd()*3,0]});solids.push({x1:x-.6,x2:x+.6,z1:z-.6,z2:z+.6,y1:0,y2:.7+(i%5==0?.7:0)})}
 for(let i=0;i<4;i++){const x=-55.75+i*4.5;bx(1.2,.5,.5,x,.25,-47.5,MC(0x3a2b1f),G.ground,{solid:1})}
 W.BLD.push({n:'Saroy',x:-45,z:-40});})();
/* --- workshop: 16 x 12 m, workshop + storage + office --- */
(function(){const x1=42,x2=58,z1=-41,z2=-29;slab(x1,x2,z1,z2,MT('concrete'));
 wall('z',x1,z1,z2,[[-35,1.4,2.4],win(-38.5),win(-31.5)],{outer:-1});wall('z',x2,z1,z2,[win(-38),win(-32)],{outer:1});
 wall('x',z2,x1,x2,[win(46),win(55)],{outer:1});wall('x',z1,x1,x2,[win(46),win(55)],{outer:-1});
 wall('z',52,z1,z2,[[-38,1.1,2.25],[-32,1.1,2.25]]);wall('x',-35,52,x2,[]);
 gable(x1,x2,z1,z2,H,3,false);bx(2.6,.9,.9,45,.45,-40.3,MC(0x3b2a1e),G.ground,{solid:1});bx(2.6,.06,1,45,.92,-40.3,MC(0x2a2018),G.ground);
 [[44,-30],[44.8,-30],[48,-40.4]].forEach(([x,z],i)=>{cy(.32,.32,.95,x,.48,z,MC(i%2?0x5c3420:0x3b4a3a,.75,.4),G.ground,14);solids.push({x1:x-.32,x2:x+.32,z1:z-.32,z2:z+.32,y1:0,y2:1})});
 W.BLD.push({n:'Ustaxona',x:50,z:-35});})();
/* --- pond, orchard, scarecrow, wrecked trailer --- */
(function(){const pm=new THREE.Mesh(new THREE.CircleGeometry(7,40),new THREE.MeshStandardMaterial({color:0x0a1216,roughness:.05,metalness:.6}));pm.rotation.x=-PI/2;pm.position.set(32,.03,66);G.yard.add(pm);solids.push({x1:26,x2:38,z1:60,z2:72,y1:0,y2:2});
 for(let i=0;i<40;i++){const a=rnd()*PI*2,r=6.8+rnd()*.8;cy(.01,.015,.6+rnd()*.6,32+Math.cos(a)*r,.4,66+Math.sin(a)*r,MC(0x2c3420,1),G.yard,4)}
 for(let i=0;i<16;i++){const x=-60+(i%4)*7+rnd()*2,z=52+Math.floor(i/4)*7+rnd()*2;tree(x,z,.7+rnd()*.3,3)}
 const sc=new THREE.Group();sc.position.set(-62,0,4);G.yard.add(sc);bx(.12,2.4,.12,0,1.2,0,MC(0x3a2b1f),sc);bx(1.6,.1,.1,0,1.8,0,MC(0x3a2b1f),sc);bx(.7,.8,.35,0,1.6,0,MC(0x5a4a30,1,0,true),sc);const hd=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),MC(0x9a8a60,1,0,true));hd.position.y=2.25;sc.add(hd);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),glow(0x000000));e.position.set(s*.08,2.3,.22);sc.add(e)});W.anim.push(t=>sc.rotation.y=Math.sin(t*.3)*.15);solids.push({x1:-62.3,x2:-61.7,z1:3.7,z2:4.3,y1:0,y2:3});
 const tr=new THREE.Group();tr.position.set(60,0,8);tr.rotation.y=.4;G.yard.add(tr);bx(2.4,2.2,6,0,1.4,0,MC(0x7a7a70,.7,.3),tr);bx(.9,1.9,.05,-1.21,1.3,1.2,glow(0x050505),tr);[-1.5,1.5].forEach(z=>{const w=cy(.4,.4,.3,1.2,.4,z,MC(0x111111),tr,12);w.rotation.z=PI/2});
 solids.push({x1:58.7,x2:61.8,z1:4.6,z2:11.4,y1:0,y2:3});
 [[-75,-70],[-78,30],[-70,80],[75,-72],[78,40],[70,82],[-30,-72],[30,-74],[-80,-20],[80,-10],[-50,75],[50,80],[-15,70],[18,48],[-30,48],[62,-60],[-62,-62],[40,-58],[-20,-50],[0,-40],[65,25],[-68,20]].forEach(([x,z])=>tree(x,z,.8+rnd()*.6));
 for(let i=0;i<60;i++){const x=-82+rnd()*164,z=-77+rnd()*164;if(Math.abs(x)<18&&z>-14&&z<16)continue;if(Math.abs(x)<3)continue;const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.5+rnd()*.6,1),bushM);b.position.set(x,.35,z);b.scale.y=.75;b.castShadow=true;G.yard.add(b)}
})();

/* basement */
(function(){const B=G.base,cm=MT('concrete'),o={y0:-H,h:H,mat:cm,par:B};
 bx(28.4,.2,20.4,0,-H-.1,0,cm,B,{cast:false});
 wall('x',10,-14,14,[],o);wall('x',-10,-14,14,[],o);wall('z',-14,-10,10,[[0,1.4,2.4]],o);wall('z',14,-10,10,[],o);
 wall('x',-2,-14,-4,[[-9,1.6,2.5]],o);wall('z',-4,-2,10,[[4,1.6,2.5]],o);wall('x',4,4,14,[[7,2,2.6]],o);
 solids.push({x1:-14.2,x2:-13.8,z1:-.8,z2:.8,y1:-3.4,y2:-1});
 [[-7,4],[0,4],[7,-1],[0,-4],[-7,-6],[5,-6]].forEach(([x,z])=>bx(.5,H,.5,x,-H/2,z,cm,B,{solid:1}));
 const gm=MC(0x2f5a3a,.6,.35);bx(1.8,1.1,1,9,-H+.55,-8.8,gm,B,{solid:1});bx(.4,.8,.4,9.6,-H+1.5,-8.8,MC(0x333333,.6,.5),B);cy(.08,.08,2.5,8.4,-H+2.1,-9.2,MC(0x333333,.6,.5),B,8);
 const gl=new THREE.Mesh(new THREE.BoxGeometry(.15,.15,.02),glow(0x5dff9b));gl.position.set(8.6,-H+.8,-8.28);B.add(gl);
 [[12.8,-1],[12.8,-2],[12.1,-1.4],[13,4],[-12.8,8.5],[-12,8.8]].forEach(([x,z],i)=>{const b=cy(.32,.32,.95,x,-H+.48,z,MC(i%2?0x5c3420:0x3b4a3a,.75,.4),B,14);if(i==2){b.rotation.z=PI/2;b.position.y=-H+.32}solids.push({x1:x-.32,x2:x+.32,z1:z-.32,z2:z+.32,y1:-H,y2:-H+1})});
 [-1,-.8].forEach((y,i)=>{const p=cy(.08,.08,28,0,y,-9.7+i*.25,MC(0x5c3420,.7,.5),B,8);p.rotation.z=PI/2});
 const dg=new THREE.Group();dg.position.set(-13.86,-H,0);B.add(dg);bx(.12,2.4,1.4,0,1.2,0,MC(0x46484a,.45,.7),dg);
 for(let i=0;i<10;i++){const l=new THREE.Mesh(new THREE.TorusGeometry(.06,.014,5,10),MC(0x777777,.35,.8));l.position.set(.12,.7+i*.15,-.6+i*.13);l.rotation.y=i%2?PI/2:0;dg.add(l);const l2=l.clone();l2.position.set(.12,.7+i*.15,.6-i*.13);dg.add(l2)}
 bx(.12,.22,.18,.16,1.35,0,MC(0x8a6a20,.4,.8),dg);
 const bulbs=[];[[0,2],[-8,-6],[8,4]].forEach(([x,z])=>{cy(.006,.006,.6,x,-.3,z,MC(0x222222),B,4);const b=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),glow(0xffc77a));b.position.set(x,-.65,z);B.add(b);bulbs.push(b)});W.bsmBulb=bulbs[0];
 for(let i=0;i<9;i++)bx(.7,.7,.7,-11+(i%3)*.75,-H+.35+(i>5?.7:0),-7.5+Math.floor(i/3)%2*.75,MC(0x4d4030),B,{rot:[0,(rnd()-.5)*.3,0]});
 solids.push({x1:-11.4,x2:-9.1,z1:-7.9,z2:-6.4,y1:-H,y2:-H+1.4});
 bx(2,.18,1.3,-9,-H+.09,7,MC(0x8a7d68,1),B);bx(2,.05,1.3,-9,-H+.2,7,MC(0x5a2020,1),B,{rot:[0,.2,0]});
 bx(2.4,.08,.9,5.5,-H+.9,7,MC(0x3b2a1e),B);[[-1.1,-.4],[1.1,-.4],[-1.1,.4],[1.1,.4]].forEach(([a,b])=>bx(.08,.9,.08,5.5+a,-H+.45,7+b,MC(0x3b2a1e),B));solids.push({x1:4.3,x2:6.7,z1:6.55,z2:7.45,y1:-H,y2:-H+1});
 const pd=new THREE.Mesh(new THREE.CircleGeometry(.9,24),MC(0x0d1012,.05,.2));pd.rotation.x=-PI/2;pd.position.set(2.5,-H+.005,-6.5);B.add(pd);
 const sc=ctex(256,1,(x,s)=>{x.clearRect(0,0,s,s);x.strokeStyle='rgba(10,5,5,.85)';x.lineWidth=3;for(let k=0;k<4;k++){for(let i=0;i<4;i++){x.beginPath();x.moveTo(30+k*55+i*10,30+k*8);x.quadraticCurveTo(40+k*55+i*8,130,25+k*55+i*12,230);x.stroke()}}});sc.repeat.set(1,1);
 const sp=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.MeshBasicMaterial({map:sc,transparent:true}));sp.position.set(0,-H+1.5,9.86);sp.rotation.y=PI;B.add(sp);
 const sp2=sp.clone();sp2.position.set(-13.85,-H+1.6,-4);sp2.rotation.y=PI/2;B.add(sp2);
})();
/* statue */
(function(){const S=new THREE.Group();S.position.set(0,0,3.2);G.ground.add(S);const sm=new THREE.MeshStandardMaterial({map:TX.bust,roughness:.82});
 const lath=(pts,y)=>{const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),40);const m=new THREE.Mesh(g,sm);m.position.y=y;m.castShadow=m.receiveShadow=true;S.add(m);return m};
 bx(1.3,.2,1.3,0,.1,0,sm,S);bx(1.05,1.2,1.05,0,.8,0,sm,S);bx(1.25,.14,1.25,0,1.47,0,sm,S);
 lath([[0,0],[.5,0],[.5,.05],[.44,.08],[.44,.14],[.36,.18],[.33,.24],[.3,.3],[.38,.34],[.38,.4],[0,.4]],1.54);
 const B=new THREE.Group();B.position.y=1.94;B.scale.setScalar(1.25);S.add(B);
 const tg=new THREE.SphereGeometry(.5,40,24,0,PI*2,0,PI/2);const tp=tg.attributes.position;for(let i=0;i<tp.count;i++){let x=tp.getX(i),y=tp.getY(i),z=tp.getZ(i);z*=.46;y*=.62;const sh=Math.max(0,1-Math.abs(x)/.5);y*=.75+.25*sh;x*=1.05;tp.setXYZ(i,x,y,z+Math.sin(x*22+y*9)*.006*(z>0?1:-1))}tg.computeVertexNormals();const tor=new THREE.Mesh(tg,sm);tor.castShadow=true;B.add(tor);
 const cut=new THREE.Mesh(new THREE.CylinderGeometry(.525,.525,.02,40),sm);cut.scale.z=.46;B.add(cut);
 const col=new THREE.Mesh(new THREE.TorusGeometry(.12,.018,8,24),sm);col.rotation.x=PI/2-.15;col.position.set(0,.3,.02);col.scale.set(1.1,1,.9);B.add(col);
 const nk=new THREE.Mesh(new THREE.CylinderGeometry(.085,.1,.26,18),sm);nk.position.set(0,.42,0);nk.rotation.x=.12;B.add(nk);
 const hd=new THREE.Group();hd.position.set(0,.68,.04);hd.rotation.set(-.05,.6,.06);B.add(hd);W.statueHead=hd;
 const hg=new THREE.SphereGeometry(.17,40,30),hp=hg.attributes.position;for(let i=0;i<hp.count;i++){let x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i);x*=.86;y*=1.12;if(y<0){x*=1-(-y)*.9;z*=1-(-y)*.35;z+=(-y)*.25}if(z>.08&&y>-.03&&y<.06)z-=.012;hp.setXYZ(i,x,y,z)}hg.computeVertexNormals();
 hd.add(new THREE.Mesh(hg,sm));const ns=new THREE.Mesh(new THREE.ConeGeometry(.026,.07,8),sm);ns.rotation.x=PI/2+.25;ns.position.set(0,-.02,.17);hd.add(ns);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),sm);e.scale.set(.4,1,.75);e.position.set(.145*s,0,-.01);hd.add(e)});
 for(let i=0;i<110;i++){const th=rnd()*PI*2,ph=Math.acos(1-rnd()*1.25);const d=V(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th));if(d.z>.45&&d.y<.55)continue;if(d.y<-.05)continue;
  const len=.09+rnd()*.08;const c=new THREE.Mesh(new THREE.ConeGeometry(.032,len,5),sm);c.position.copy(d).multiply(V(.86*.17,1.12*.17,.17)).multiplyScalar(1.02);const dir=d.clone().add(V((rnd()-.5)*.6,-.55,.25+(d.z>.2?.5:0))).normalize();c.quaternion.setFromUnitVectors(UP,dir);c.position.addScaledVector(dir,len*.4);hd.add(c)}
 solids.push({x1:-.7,x2:.7,z1:2.5,z2:3.9,y1:0,y2:2.5});})();

W.anim.push((t,dt)=>{const fl=(l,p,lo)=>{l.intensity=Math.random()<p?l.userData.base*lo:l.userData.base};
 fl(L.porch,.05,.05);porchBulb.visible=L.porch.intensity>.5;fl(L.lamp,.03,.1);W.lampBulb.visible=L.lamp.intensity>.5;fl(L.kitchen,.07,.02);fl(L.hall,.015,.2);fl(L.bsm,.05,.05);W.bsmBulb.visible=L.bsm.intensity>.5;
 L.living.intensity=2.1+Math.sin(t*13)*.25+Math.random()*.35;L.exitR.intensity=.8+.9*Math.abs(Math.sin(t*2.2));W.attic.material.color.setHSL(.05,1,.25+.15*Math.sin(t*1.3));
 if(W.flickerAll>0){W.flickerAll-=dt;Object.values(L).forEach(l=>{if(Math.random()<.5)l.intensity=0})}});
};

/* furniture placement table: [model,x,z,ry,color,scale,y,tag] */
const C={wood:0x4a3020,dark:0x2a1b12,red:0x5a1d1d,fabric:0x4b4542,green:0x2f3a2c,white:0xd2ccbe,metal:0x6a6c6e,rust:0x5c3a25,cream:0xa59a86,plant:0x2b3a22,brass:0x7a6430};
W.C=C;
W.F=[
 ['coat',3.45,8.1,0,C.dark],['bench',-3.42,3.4,PI/2,C.dark,1],['bench',3.42,3.4,-PI/2,C.dark,1],['plant2',-3.2,9.2,0,C.plant],['plant2',3.2,9.3,0,C.plant,.8],['sideT',-3.45,.6,0,C.brass],['vase',-3.45,1.32,0,C.white,1.4,.72,'nb'],['tableR2',3.5,.5,0,C.brass],
 ['fire',-13.58,6.5,PI/2,0x6e675d],['couchL',-8.6,6.5,-PI/2,C.red,.9],['couchM',-11,9.3,PI,C.fabric],['armchair',-11.3,3.85,0,C.red,1.3],['armchair',-5.4,7.3,-2.2,C.fabric,1.3],
 ['tableRL',-10.6,6.5,PI/2,C.wood,.6],['bookshelf',-4.35,8.3,-PI/2,C.wood],['shelfTall',-4.35,4.6,-PI/2,C.dark],['drawer4',-7.6,9.5,PI,C.wood],['vase',-7.9,9.5,0,C.white,1.6,1.07,'nb'],['plant',-13.4,9.4,0,C.plant,1.4],['plant',-13.4,3.6,0,C.plant,1.4],['fan',-9,H-.42,0,C.wood,1,3.0,'nb'],['tv',-13.6,9.4,PI/2,C.dark,.9],
 ['dining',9,6.4,0,C.wood,1.35],['chair1',6.7,6.4,PI/2,C.wood,1.2],['chair1',11.3,6.4,-PI/2,C.wood,1.2],['chair2',12.3,9.3,2.6,C.wood,1.2],['drawer3',7.6,9.5,PI,C.dark],['shelfL',13.7,4.6,-PI/2,C.dark],['fan',9,H-.42,0,C.wood,1,3.0,'nb'],['plant2',13.2,3.8,0,C.plant,.9],['vase',7.2,9.5,0,C.white,1.4,.815,'nb'],
 ['fridge',13.55,2.4,-PI/2,C.white,.85],['cnt',13.38,1.55,-PI/2,C.cream,1.2],['ksink',13.38,.75,-PI/2,C.cream,1.2],['cntO',13.38,-.05,-PI/2,C.cream,1.2],['cnt3',13.38,-.85,-PI/2,C.cream,1.2],['cnt4',13.38,-1.65,-PI/2,C.cream,1.2],
 ['oven',5.1,-2.48,0,C.metal,1.1],['cnt2',5.95,-2.42,0,C.cream,1.2],['cntS',6.75,-2.42,0,C.cream,1.2],['micro',6.0,-2.6,0,C.metal,1.6,.89,'nb'],
 ['table2',9,0,0,C.wood,1.2],['chair3',9,.8,PI,C.wood,1.2],['chair1',8.1,-.2,.9,C.wood,1.2,0,'tip'],['fridge2',2.48,-.6,PI/2,C.white],['barstool',10.5,-1.5,0,C.metal,.8],
 ['bookshelf',-13.75,-1.9,PI/2,C.dark],['bookshelf',-13.75,-.6,PI/2,C.dark],['bookshelf',-13.75,.7,PI/2,C.dark],['bookshelf',-13.75,2,PI/2,C.dark],['desk',-8,-.4,0,C.wood,1.6],['chair2',-8,-1.1,0,C.wood,1.2],['shelfL',-6,-2.75,0,C.dark],['shelf2',-9.4,-2.75,0,C.dark],
 ['armchair',-11.2,2.1,2.6,C.green,1.3],['rsmall',-10,2.2,0,C.wood,.6],['vase',-8.3,-.4,0,C.green,1,.73,'nb'],['closet',-12.3,-2.7,0,C.dark,1.45],
 ['bedK',-6,-8.7,0,C.red,1.2],['ns1',-7.4,-9.55,0,C.wood,1.2],['ns2',-4.6,-9.55,0,C.wood,1.2],['closet',-9.6,-5,PI/2,C.dark,1.45],['drawer3',-6,-3.45,PI,C.wood],['armchair',-3,-4.2,-2.5,C.red,1.3],['plant',-2.6,-9.4,0,C.plant,1.4],
 ['toilet',-13.65,-8.4,PI/2,C.white,1.15],['bsink',-12,-9.62,0,C.white,1.45],['shelf2',-10.4,-9.65,0,C.white,.9],
 ['bunk',4.0,-9.25,PI/2,C.wood,1.15],['bedS',7.8,-8.85,0,C.wood,1.05],['ns3',6.7,-9.6,0,C.wood,1.2],['desk',6.2,-3.45,PI,C.wood,1.4],['chair3',6.2,-4.1,0,C.wood,1.1],['drawer1',8.62,-5.6,-PI/2,C.wood],['closet',2.5,-4.0,PI/2,C.dark,1.45],
 ['iron',9.7,-6,0,C.metal,1.1],['basket',9.6,-9.5,0,C.cream],['shelf2',13.7,-4.5,-PI/2,C.dark],['stool',9.6,-3.6,0,C.wood,1.2],
 ['sideT',-1.6,-2.8,0,C.brass],['chair2',1.65,-4.3,-PI/2,C.wood,1.2],['plant',1.5,-9.4,0,C.plant,1.4],['drawer1',-1.68,-8.3,PI/2,C.dark,.9],
 ['grill',2,-15,0,C.metal,1,0,'yard'],['bench',-1,-16.5,0,C.dark,1,0,'yard'],['bench',-1,-13.6,PI,C.dark,1,0,'yard'],['table2',3.6,-16.2,0,C.rust,1,0,'yard'],['chair1',5,-13.2,2.3,C.rust,1.2,0,'yardtip'],['chair1',-1.2,12,.4,C.wood,1.2,.3,'yard'],
 ['couchM',38.2,41.3,PI,C.fabric],['tableRL',38.5,39,0,C.wood,.6],['shelfTall',35.4,38.4,PI/2,C.dark],['plant',41.4,41.3,0,C.plant,1.4],['armchair',40.8,37.2,-.6,C.red,1.3],
 ['bedS',44.2,40.6,PI/2,C.wood,1.05],['ns1',42.6,41.5,0,C.wood,1.2],['closet',47.8,38.3,-PI/2,C.dark,1.45],['drawer1',47.3,36.4,0,C.wood],
 ['bedframe',51.8,40.2,PI,C.rust,1.2],['closet',54.3,37.6,-PI/2,C.dark,1.45],['drawer1',49.4,41.5,PI,C.wood],['chair2',53.8,41.2,2.4,C.wood,1.2],
 ['cnt',35.5,29.2,PI/2,C.cream,1.2],['ksink',35.5,30.0,PI/2,C.cream,1.2],['cnt3',35.5,30.8,PI/2,C.cream,1.2],['fridge2',36,33.4,PI/2,C.white],['table2',39.2,31,0,C.wood,1.2],['chair1',39.2,32,PI,C.wood,1.2],['chair3',40.3,30.4,-PI/2,C.wood,1.2],
 ['toilet',47.9,29.4,-PI/2,C.white,1.15],['bsink',45.2,28.4,0,C.white,1.45],['shelf2',42.4,29,PI/2,C.white,.9],
 ['shelfL',51.7,28.4,0,C.dark],['drawer2',54.3,31,-PI/2,C.dark],['shelf2',49,33.6,PI,C.dark],
 ['shelfL',-33.4,-46,-PI/2,C.rust],['desk',-34,-38.8,PI,C.wood,1.6],['drawer1',-35.4,-44,PI/2,C.dark],['chair2',-34,-39.6,0,C.wood,1.2],['bench',-53,-33,PI,C.dark,1],
 ['shelfL',57.4,-39.5,-PI/2,C.rust],['shelfTall',53.6,-40.5,0,C.rust],['drawer2',57.4,-36.6,-PI/2,C.dark],['desk',55,-30,PI,C.wood,1.6],['chair1',55,-30.8,0,C.wood,1.2],['bookshelf',57.6,-32.5,-PI/2,C.dark],['closet',53,-30.2,PI,C.dark,1.45],['bench',47,-30,PI,C.dark,1],
 ['shelfL',12,9.75,PI,C.rust,1,-H,'base'],['shelfTall',8,9.75,PI,C.rust,1,-H,'base'],['bunk',-12.9,-3.5,PI/2,C.rust,1.15,-H,'base'],['drawer2',-6,9.6,PI,C.dark,1,-H,'base'],['chair2',5,6.1,0,C.wood,1.2,-H,'base'],['chair1',-3,-2,1.2,C.wood,1.2,-H,'basetip'],['bedframe',10,4,1.2,C.rust,1.2,-H,'base'],['ns2',-12.9,-1.6,PI/2,C.rust,1.2,-H,'base'],['fridge2',13.6,1,-PI/2,C.rust,1,-H,'base'],['closet',-13.5,6,PI/2,C.rust,1.45,-H,'base']
];
/* doors: [model, alongCoord, wallCoord, axis, width, openAngle, color, double] ids are their index */
W.D=[['door1',0,10,'x',1.7,-1.45,C.dark,1],['door2',-4,1.5,'z',1.1,-1.2,C.dark],['door3',4,1.5,'z',1.1,1.2,C.dark],['door4',-9,3,'x',1.1,1.1,C.dark],['door5',-2,-1.5,'z',1.1,1.3,C.dark],['door2',-2,-6.5,'z',1.1,-1.2,C.dark],
 ['door3',2,-1.5,'z',1.1,-1.3,C.dark],['door6',2,-6.5,'z',1.1,1.2,C.dark],['door4',-10,-8,'z',1,1.2,C.dark],['door7',11.6,-3,'x',1.1,-1.4,C.dark],['door5',0,-10,'x',1.1,1.3,C.dark],
 ['door1',35,35,'z',1.4,-1.3,C.dark],['door2',38.5,36,'x',1.1,1.2,C.dark],['door3',45.2,36,'x',1.1,1.2,C.dark],['door4',51.8,36,'x',1.1,1.2,C.dark],['door5',38.5,34,'x',1.1,-1.2,C.dark],['door6',45.2,34,'x',1.1,-1.2,C.dark],['door7',51.8,34,'x',1.1,-1.2,C.dark],
 ['door2',-32,-35,'z',1.2,1.2,C.dark],['door3',-36,-40,'z',1.1,-1.2,C.dark],
 ['door1',42,-35,'z',1.4,-1.3,C.dark],['door4',52,-38,'z',1.1,1.2,C.dark],['door6',52,-32,'z',1.1,-1.2,C.dark]];
W.WIN=[['x',10,-10.5,1],['x',10,-6.8,1],['x',10,6.8,1],['x',10,10.5,1],['x',-10,-12,-1],['x',-10,-6,-1],['x',-10,5.5,-1],['x',-10,12,-1],['z',-14,7,-1],['z',-14,0,-1],['z',-14,-6.5,-1],['z',14,7,1],['z',14,0,1],['z',14,-6.5,1]];

/* key spots: container type: drawer | cab | shelf | top | under | floor.  pos = item position; fwd = facing of furniture (ry) */
W.KEY=[
 {n:'Yotoqxona tortmasi',t:'drawer',x:-6,z:-3.45,ry:PI,y:.6,d:.35,w:.7},
 {n:'Yotoqxona karavoti tagi',t:'under',x:-6.6,z:-8.2,y:.05},
 {n:'Mehmonxona tortmasi',t:'drawer',x:-7.6,z:9.5,ry:PI,y:.75,d:.29,w:.6},
 {n:'Kitob javoni tepasi',t:'top',x:-4.35,z:8.3,y:2.31},
 {n:'Ovqat xonasi tortmasi',t:'drawer',x:7.6,z:9.5,ry:PI,y:.6,d:.35,w:.7},
 {n:'Yozuv stoli tortmasi',t:'drawer',x:-8,z:-.4,ry:0,y:.55,d:.33,w:.6},
 {n:'Kutubxona javoni',t:'shelf',x:-13.62,z:.7,y:1.25},
 {n:'Bolalar karavoti tagi',t:'under',x:4.0,z:-8.75,y:.05},
 {n:'Bolalar xonasi tortmasi',t:'drawer',x:8.62,z:-5.6,ry:-PI/2,y:.5,d:.29,w:.6},
 {n:'Oshxona javoni',t:'cab',x:13.38,z:-.05,ry:-PI/2,y:.45,d:.49,w:.75,h:.8},
 {n:"Yo'lak tortmasi",t:'drawer',x:-1.68,z:-8.3,ry:PI/2,y:.45,d:.26,w:.55},
 {n:"Yerto'la javoni",t:'shelf',x:12,z:9.6,y:-H+1.3},
 {n:"Yerto'la tortmasi",t:'drawer',x:-6,z:9.6,ry:PI,y:-H+.45,d:.29,w:.7},
 {n:'Hammom javoni',t:'shelf',x:-10.4,z:-9.55,y:1.1},
 {n:'Zal stolchasi',t:'top',x:3.5,z:.5,y:.62},
 {n:'Oshxona pastki shkafi',t:'cab',x:6.75,z:-2.42,ry:0,y:.4,d:.41,w:.7,h:.75},
 {n:'Mehmon uyi tortmasi',t:'drawer',x:47.3,z:36.4,ry:0,y:.5,d:.29,w:.6},
 {n:'Mehmon uyi yotoqxonasi',t:'drawer',x:49.4,z:41.5,ry:PI,y:.5,d:.29,w:.6},
 {n:'Mehmon uyi oshxonasi',t:'cab',x:35.5,z:30.8,ry:PI/2,y:.4,d:.41,w:.7,h:.75},
 {n:'Mehmon uyi omborxonasi',t:'drawer',x:54.3,z:31,ry:-PI/2,y:.45,d:.29,w:.7},
 {n:'Mehmon uyi javoni',t:'shelf',x:51.7,z:28.6,y:1.25},
 {n:'Saroy asboblar xonasi',t:'drawer',x:-35.4,z:-44,ry:PI/2,y:.5,d:.29,w:.6},
 {n:'Saroy javoni',t:'shelf',x:-33.6,z:-46,y:1.25},
 {n:'Ustaxona tortmasi',t:'drawer',x:57.4,z:-36.6,ry:-PI/2,y:.45,d:.29,w:.7},
 {n:'Ustaxona kabineti',t:'shelf',x:57.4,z:-32.5,y:1.2},
 {n:'Ustaxona stoli',t:'top',x:45.6,z:-40.3,y:.96}
];
W.BAT=[
 {n:'Omborxona',t:'floor',x:24,z:11,y:0,out:1},
 {n:'Garajdagi qutilar',t:'top',x:-36.9,z:26.75,y:.5,out:1},
 {n:'Saroy otxonasi',t:'floor',x:-51.2,z:-45.5,y:.02,out:1},
 {n:'Saroy pichanlari',t:'floor',x:-47,z:-37,y:.02,out:1},
 {n:'Ustaxona',t:'top',x:44.3,z:-40.3,y:.96,out:1},
 {n:'Hovuz bo\'yi',t:'floor',x:24.5,z:66,y:.02,out:1},
 {n:'Eski tirkama ichi',t:'floor',x:59.1,z:9.7,y:.3,out:1},
 {n:'Qo\'rqinchoq yonida',t:'floor',x:-61,z:5.2,y:.02,out:1},
 {n:'Bog\' ichida',t:'floor',x:-46,z:63,y:.02,out:1},
 {n:'Mehmon uyi omborxonasi',t:'floor',x:51,z:30,y:.02,out:1},
 {n:'Issiqxona',t:'floor',x:-21.6,z:-22.2,y:.5,out:1},
 {n:'Quduq yonida',t:'floor',x:15.4,z:25.6,y:0,out:1},
 {n:'It uyi ichida',t:'floor',x:8.1,z:19.1,y:.02,out:1},
 {n:'Qabriston',t:'floor',x:22.5,z:-21,y:0,out:1},
 {n:"Orqa hovli skameykasi tagi",t:'under',x:-1,z:-16.5,y:0,out:1},
 {n:'Kir ilgich yonida',t:'floor',x:-8.5,z:-17.4,y:0,out:1},
 {n:"Yerto'la ustaxonasi",t:'top',x:5.2,z:7,y:-H+.95},
 {n:'Kir yuvish xonasi',t:'floor',x:10,z:-8.8,y:0}
];
/* hide spots: inside closets, under tables/beds, behind curtains/sofa, in the shed */
W.HIDE=[
 {n:'Shkaf ichi',k:'closet',x:-9.6,z:-5,ry:PI/2,eye:1.45,ex:-8.8,ez:-5},
 {n:'Shkaf ichi',k:'closet',x:-12.3,z:-2.7,ry:0,eye:1.45,ex:-12.3,ez:-1.8},
 {n:'Shkaf ichi',k:'closet',x:2.5,z:-4.0,ry:PI/2,eye:1.45,ex:3.45,ez:-4.0},
 {n:'Shkaf ichi',k:'closet',x:-13.5,z:6,y:-H,ry:PI/2,eye:1.45,ex:-12.6,ez:6},
 {n:'Stol tagi',k:'under',x:9,z:6.4,ry:0,eye:.45,ex:9,ez:5},
 {n:'Stol tagi',k:'under',x:9,z:0,ry:0,eye:.4,ex:9,ez:-1},
 {n:'Stol tagi',k:'under',x:-8,z:-.25,ry:0,eye:.4,ex:-8,ez:.7},
 {n:'Karavot tagi',k:'under',x:-6,z:-8.2,ry:0,eye:.22,ex:-6,ez:-6.9},
 {n:'Parda orqasi',k:'curtain',x:-13.75,z:7,ry:PI/2,eye:1.6,ex:-13,ez:7},
 {n:'Parda orqasi',k:'curtain',x:13.75,z:7,ry:-PI/2,eye:1.6,ex:13,ez:7},
 {n:'Parda orqasi',k:'curtain',x:-6.8,z:9.75,ry:PI,eye:1.6,ex:-6.4,ez:8.85},
 {n:'Divan orqasi',k:'sofa',x:-7.75,z:6.5,ry:-PI/2,eye:.6,ex:-7.4,ez:5.2},
 {n:'Omborxona burchagi',k:'shed',x:24.3,z:13.2,ry:PI,eye:1.0,ex:22.8,ez:12},
 {n:'Mashina orqasi',k:'car',x:-40.3,z:26.2,ry:0,eye:.7,ex:-38.6,ez:26.4},
 {n:'Shkaf ichi',k:'closet',x:47.8,z:38.3,ry:-PI/2,eye:1.45,ex:46.9,ez:38.3},
 {n:'Shkaf ichi',k:'closet',x:54.3,z:37.6,ry:-PI/2,eye:1.45,ex:53.4,ez:37.6},
 {n:'Shkaf ichi',k:'closet',x:53,z:-30.2,ry:PI,eye:1.45,ex:53,ez:-31.1},
 {n:'Stol tagi',k:'under',x:39.2,z:31,ry:0,eye:.4,ex:38,ez:31},
 {n:'Stol tagi',k:'under',x:55,z:-30.1,ry:PI,eye:.4,ex:55,ez:-31.4},
 {n:'Stol tagi',k:'under',x:-34,z:-38.7,ry:PI,eye:.4,ex:-34,ez:-40.4},
 {n:'Otxona ichi',k:'sofa',x:-46.75,z:-46.8,ry:0,eye:.6,ex:-46.75,ez:-44.6},
 {n:'Otxona ichi',k:'sofa',x:-55.75,z:-46.8,ry:0,eye:.6,ex:-55.75,ez:-44.6},
 {n:'Eski tirkama ichi',k:'shed',x:59.5,z:9.0,ry:-1.17,eye:1.3,ex:57.6,ez:9.6}
];

/* ground height at a point given current height (stairs ramp, basement) */
W.groundY=function(x,z,y){if(x>10.6&&x<12.9&&z<-3.6&&z>-8.6)return Math.max(-H,Math.min(0,-H*((-3.6-z)/5)));if(Math.abs(x)<14&&Math.abs(z)<10)return y>-1.7?0:-H;return 0};
W.level=function(y){return y<-1.7?1:0};
/* spatial index of solids in 2 m buckets */
W.indexSolids=function(){const B=new Map();const cs=2;W.solids.forEach(s=>{for(let i=Math.floor((s.x1-.5)/cs);i<=Math.floor((s.x2+.5)/cs);i++)for(let j=Math.floor((s.z1-.5)/cs);j<=Math.floor((s.z2+.5)/cs);j++){const k=i*4096+j;let a=B.get(k);if(!a)B.set(k,a=[]);a.push(s)}});W.sIndex=B};
W.near=function(x,z){if(!W.sIndex)return W.solids;return W.sIndex.get(Math.floor(x/2)*4096+Math.floor(z/2))||[]};
W.blocked=function(x,z,y,r,ignoreDoors){r=r||.28;for(const s of W.near(x,z)){if(s.off)continue;if(ignoreDoors&&s.door!=null)continue;if(s.stairUnder&&y>-3.36)continue;if(y+1.6<s.y1||y+.35>s.y2)continue;if(x>s.x1-r&&x<s.x2+r&&z>s.z1-r&&z<s.z2+r)return true}return false};
})();

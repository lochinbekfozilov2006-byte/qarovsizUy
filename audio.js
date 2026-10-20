/* Qarovsiz Uy — sound: ambience, footsteps, roar, heartbeat, chase, effects (WebAudio, mostly synthesized) */
(function(){
const S=window.SND={ready:false};
const VOL={game:1,mon:1};
S.setVolumes=function(game,mon){VOL.game=game;VOL.mon=mon;if(ac){master.gain.setTargetAtTime(.9*game,ac.currentTime,.05);monBus.gain.setTargetAtTime(mon,ac.currentTime,.05)}};
S.ctx=function(){return ac};
let ac,master,monBus,amb,roarBuf=null,roarBuf2=null,roarBuf3=null,noiseBuf,heartG,chaseG,windG,listener={x:0,y:0,z:0,yaw:0};
S.init=function(){if(ac)return;ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.9*VOL.game;master.connect(ac.destination);monBus=ac.createGain();monBus.gain.value=VOL.mon;monBus.connect(master);
 const len=ac.sampleRate*2;noiseBuf=ac.createBuffer(1,len,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
 /* ambience: low drone + wind */
 amb=ac.createGain();amb.gain.value=0;amb.connect(master);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;lp.connect(amb);
 [55,58.4,82.4,41.2].forEach((f,i)=>{const o=ac.createOscillator();o.type=i==3?'sine':'sawtooth';o.frequency.value=f;const g=ac.createGain();g.gain.value=i==3?.12:.035;o.connect(g);g.connect(lp);o.start()});
 const n=ac.createBufferSource();n.buffer=noiseBuf;n.loop=true;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=420;bp.Q.value=.6;windG=ac.createGain();windG.gain.value=.05;n.connect(bp);bp.connect(windG);windG.connect(amb);n.start();
 const lfo=ac.createOscillator();lfo.frequency.value=.11;const lg=ac.createGain();lg.gain.value=.035;lfo.connect(lg);lg.connect(windG.gain);lfo.start();
 /* heartbeat bus */
 heartG=ac.createGain();heartG.gain.value=0;heartG.connect(master);
 /* chase drone */
 chaseG=ac.createGain();chaseG.gain.value=0;chaseG.connect(master);const cf=ac.createBiquadFilter();cf.type='lowpass';cf.frequency.value=900;cf.connect(chaseG);
 [110,116.5,164.8].forEach(f=>{const o=ac.createOscillator();o.type='square';o.frequency.value=f;const g=ac.createGain();g.gain.value=.03;o.connect(g);g.connect(cf);o.start()});
 const tr=ac.createOscillator();tr.frequency.value=6;const tg=ac.createGain();tg.gain.value=.5;tr.connect(tg);tg.connect(cf.frequency);tr.start();
 fetch('roar.mp3').then(r=>r.arrayBuffer()).then(b=>ac.decodeAudioData(b,buf=>{roarBuf=buf},()=>{})).catch(()=>{});
 if(window.WORLD&&WORLD.map==='hosp')fetch('bemor.mp3').then(r=>r.arrayBuffer()).then(b=>ac.decodeAudioData(b,buf=>{roarBuf3=buf},()=>{})).catch(()=>{});
 fetch('roar2.mp3').then(r=>r.arrayBuffer()).then(b=>ac.decodeAudioData(b,buf=>{roarBuf2=buf},()=>{})).catch(()=>{});
 S.ready=true;setInterval(beat,50)};
S.resume=function(){if(ac&&ac.state==='suspended')ac.resume()};
S.ambience=function(on){if(!ac)return;amb.gain.setTargetAtTime(on?1:0,ac.currentTime,1.2)};
S.setListener=function(x,y,z,yaw){listener={x,y,z,yaw}};
/* simple spatialisation: distance gain + stereo pan from listener yaw */
function spatial(x,y,z,maxD){const dx=x-listener.x,dz=z-listener.z,dy=y-listener.y;const d=Math.hypot(dx,dy,dz);const g=Math.max(0,1-d/(maxD||25));
 const fx=-Math.sin(listener.yaw),fz=-Math.cos(listener.yaw),rx=Math.cos(listener.yaw),rz=-Math.sin(listener.yaw);const pan=d>.01?(dx*rx+dz*rz)/d:0;
 const lev=Math.abs(dy)>2.2?.35:1;return {g:g*g*lev,pan:Math.max(-1,Math.min(1,pan))}}
function out(g,pan,bus){const dst=bus||master;const gg=ac.createGain();gg.gain.value=g;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan||0;gg.connect(p);p.connect(dst)}else gg.connect(dst);return gg}
function noiseHit(dest,dur,freq,q,vol,t0){const t=t0||ac.currentTime;const s=ac.createBufferSource();s.buffer=noiseBuf;s.playbackRate.value=.6+Math.random()*.6;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random());s.stop(t+dur+.05)}
S.step=function(x,y,z,vol,surface){if(!ac)return;const sp=x==null?{g:1,pan:0}:spatial(x,y,z,22);if(sp.g<.01)return;const o=out(sp.g*vol,sp.pan);
 noiseHit(o,.09,surface==='grass'?900:surface==='stone'?1800:520,surface==='grass'?.6:1.3,.5);const t=ac.currentTime;const k=ac.createOscillator();k.frequency.setValueAtTime(90,t);k.frequency.exponentialRampToValueAtTime(45,t+.08);const kg=ac.createGain();kg.gain.setValueAtTime(.25,t);kg.gain.exponentialRampToValueAtTime(.001,t+.1);k.connect(kg);kg.connect(o);k.start(t);k.stop(t+.12)};
S.monsterStep=function(x,y,z){if(!ac)return;const sp=spatial(x,y,z,30);if(sp.g<.01)return;const o=out(sp.g*.9,sp.pan,monBus);const t=ac.currentTime;const k=ac.createOscillator();k.type='sine';k.frequency.setValueAtTime(70,t);k.frequency.exponentialRampToValueAtTime(30,t+.2);const g=ac.createGain();g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);k.connect(g);g.connect(o);k.start(t);k.stop(t+.3);noiseHit(o,.12,300,1,.4)};
S.roar=function(x,y,z,vol,rate,which){if(!ac)return;const sp=x==null?{g:1,pan:0}:spatial(x,y,z,45);const o=out(Math.max(.25,sp.g)*(vol||1),sp.pan,monBus);const buf=which===2&&roarBuf3?roarBuf3:which===1&&roarBuf2?roarBuf2:roarBuf;
 if(buf){const s=ac.createBufferSource();s.buffer=buf;s.playbackRate.value=rate||1;s.connect(o);s.start()}else{const t=ac.currentTime;[1,1.07,1.5].forEach(m=>{const os=ac.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(700*m,t);os.frequency.exponentialRampToValueAtTime(180*m,t+1.4);const g=ac.createGain();g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+1.5);os.connect(g);g.connect(o);os.start(t);os.stop(t+1.6)})}};
/* far-away growl from a random direction: plays now and then even when the monster is not around */
S.distant=function(){if(!ac)return;const which=Math.random()<.5?1:0;const buf=roarBuf3&&Math.random()<.7?roarBuf3:which?roarBuf2:roarBuf;if(!buf)return;const pan=(Math.random()*2-1)*.9;const g=ac.createGain();g.gain.value=.18+Math.random()*.16;
 const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=500+Math.random()*700;const s=ac.createBufferSource();s.buffer=buf;s.playbackRate.value=.6+Math.random()*.45;
 if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(monBus)}else g.connect(monBus);s.connect(f);f.connect(g);s.start()};
S.knock=function(){if(!ac)return;const o=out(.45,(Math.random()*2-1)*.8);const t0=ac.currentTime;for(let i=0;i<3;i++){const t=t0+i*.28;const os=ac.createOscillator();os.frequency.setValueAtTime(120,t);os.frequency.exponentialRampToValueAtTime(55,t+.08);const g=ac.createGain();g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);os.connect(g);g.connect(o);os.start(t);os.stop(t+.15);noiseHit(o,.06,700,1.2,.4,t)}};
S.stinger=function(){if(!ac)return;const t=ac.currentTime;const o=out(1,0);noiseHit(o,1.2,2400,.5,.8);[233,247,262,370].forEach(f=>{const os=ac.createOscillator();os.type='sawtooth';os.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+1.6);os.connect(g);g.connect(o);os.start(t);os.stop(t+1.7)})};
S.creak=function(x,y,z){if(!ac)return;const sp=spatial(x,y,z,18);if(sp.g<.01)return;const o=out(sp.g*.6,sp.pan);const t=ac.currentTime;const os=ac.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(180+Math.random()*80,t);os.frequency.linearRampToValueAtTime(320+Math.random()*120,t+.6);const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=8;const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.25,t+.1);g.gain.exponentialRampToValueAtTime(.001,t+.75);os.connect(f);f.connect(g);g.connect(o);os.start(t);os.stop(t+.8)};
S.slide=function(x,y,z){if(!ac)return;const sp=spatial(x,y,z,14);const o=out(sp.g*.7,sp.pan);noiseHit(o,.35,1400,2,.4)};
S.pickup=function(){if(!ac)return;const t=ac.currentTime;const o=out(.5,0);[880,1320].forEach((f,i)=>{const os=ac.createOscillator();os.type='triangle';os.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(.0001,t+i*.08);g.gain.exponentialRampToValueAtTime(.3,t+i*.08+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.08+.4);os.connect(g);g.connect(o);os.start(t+i*.08);os.stop(t+i*.08+.45)})};
S.clunk=function(){if(!ac)return;const o=out(.8,0);noiseHit(o,.25,600,1.5,.8);const t=ac.currentTime;const os=ac.createOscillator();os.frequency.setValueAtTime(140,t);os.frequency.exponentialRampToValueAtTime(60,t+.2);const g=ac.createGain();g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);os.connect(g);g.connect(o);os.start(t);os.stop(t+.3)};
S.engine=function(){if(!ac)return;const t=ac.currentTime;const o=out(.7,0);const os=ac.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(30,t);os.frequency.linearRampToValueAtTime(55,t+1.2);os.frequency.linearRampToValueAtTime(48,t+2);os.frequency.linearRampToValueAtTime(90,t+5);
 const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=500;const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.5,t+.4);g.gain.setValueAtTime(.5,t+5);g.gain.linearRampToValueAtTime(.0001,t+7);os.connect(f);f.connect(g);g.connect(o);os.start(t);os.stop(t+7.2)};
S.holy=function(){if(!ac)return;const t=ac.currentTime;const o=out(.7,0);[523,659,784,1046].forEach((f,i)=>{const os=ac.createOscillator();os.type='sine';os.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(.0001,t+i*.05);g.gain.exponentialRampToValueAtTime(.22,t+i*.05+.08);g.gain.exponentialRampToValueAtTime(.001,t+2.4);os.connect(g);g.connect(o);os.start(t+i*.05);os.stop(t+2.5)});noiseHit(o,1.2,5000,.7,.35)};
/* hospital: a heart monitor beeping somewhere in the building, sometimes it flatlines */
function beepAt(o,t,f,d,v){const os=ac.createOscillator();os.type='sine';os.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.setValueAtTime(v,t+d-.02);g.gain.linearRampToValueAtTime(0,t+d);os.connect(g);g.connect(o);os.start(t);os.stop(t+d+.05)}
S.monitor=function(){if(!ac)return;const o=out(.16+Math.random()*.1,(Math.random()*2-1)*.8);const t=ac.currentTime;const n=4+(Math.random()*5|0),gap=.55+Math.random()*.35;for(let i=0;i<n;i++)beepAt(o,t+i*gap*(1+(i>n-3?Math.random()*.6:0)),980,.11,.5);if(Math.random()<.35)beepAt(o,t+n*gap+.5,980,2.4,.4)};
S.flatline=function(){if(!ac)return;const o=out(.35,0);const t=ac.currentTime;[0,.5,.9].forEach(d=>beepAt(o,t+d,980,.1,.5));beepAt(o,t+1.3,980,3.2,.45)};
S.clink=function(){if(!ac)return;const o=out(.5,0);const t=ac.currentTime;[2400,3100,4300].forEach((f,i)=>{const os=ac.createOscillator();os.type='sine';os.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(.25/(i+1),t+i*.03);g.gain.exponentialRampToValueAtTime(.001,t+i*.03+.5);os.connect(g);g.connect(o);os.start(t+i*.03);os.stop(t+.7)})};
S.whisper=function(){if(!ac)return;const o=out(.35,(Math.random()-.5)*1.6);noiseHit(o,1.6,3200,4,.5)};
/* heartbeat & chase intensities set every frame */
let heartK=0,lastBeat=0;S.setFear=function(heart,chase){heartK=heart;if(chaseG)chaseG.gain.setTargetAtTime(chase*.5,ac.currentTime,.4)};
function beat(){if(!ac||heartK<.05)return;const now=ac.currentTime;const iv=1.1-heartK*.6;if(now-lastBeat<iv)return;lastBeat=now;[0,.18].forEach((d,i)=>{const t=now+d;const os=ac.createOscillator();os.frequency.setValueAtTime(i?50:60,t);os.frequency.exponentialRampToValueAtTime(32,t+.15);const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.8*heartK,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.2);os.connect(g);g.connect(heartG);os.start(t);os.stop(t+.25)});heartG.gain.value=1}
})();

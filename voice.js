/* Qarovsiz Uy — proximity voice chat. Every pair of players gets one WebRTC audio call (through the same
   PeerJS peers as the game data, so the TURN relay works for voice too). Volume falls off with distance and
   pans left/right; each player's volume can be set separately. */
(function(){
const VC=window.VOICE={on:false,muted:{},ptt:false,pttHeld:false,micGain:1,speaking:false,denied:false,calls:{},remotes:{},vols:{},level:0};
let micBusy=null,ac=null,local=null,raw=null,micSrc=null,micG=null,dest=null,an=null,buf=null,started=false,speakT=0,quietT=0;
function ctx(){return (window.SND&&SND.ctx&&SND.ctx())||null}
try{const v=JSON.parse(localStorage.getItem('qu_voice')||'{}');if(v.on===true)VC.on=true;if(v.ptt)VC.ptt=true;if(v.mic!=null)VC.micGain=v.mic;if(v.vols)VC.vols=v.vols}catch(e){}
VC.save=function(){try{localStorage.setItem('qu_voice',JSON.stringify({on:VC.on,ptt:VC.ptt,mic:VC.micGain,vols:VC.vols}))}catch(e){}};
/* ask for the microphone (must run inside a click) */
VC.init=function(){if(started)return Promise.resolve(local);ac=ctx();if(!ac)return Promise.resolve(null);started=true;
 dest=ac.createMediaStreamDestination();micG=ac.createGain();micG.gain.value=VC.micGain;micG.connect(dest);
 an=ac.createAnalyser();an.fftSize=512;buf=new Float32Array(an.fftSize);
 local=dest.stream;applyMute();
 if(!VC.on)return Promise.resolve(local);/* the microphone is only asked for once the player turns it on */
 return askMic()};
function askMic(){if(raw||micBusy)return micBusy||Promise.resolve(local);
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){VC.denied=true;if(VC.onDenied)VC.onDenied();return Promise.resolve(local)}
 VC.denied=false;micBusy=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}).then(s=>{raw=s;micBusy=null;micSrc=ac.createMediaStreamSource(s);micSrc.connect(micG);micSrc.connect(an);applyMute();if(VC.onMic)VC.onMic();return local})
  .catch(()=>{micBusy=null;VC.denied=true;if(VC.onDenied)VC.onDenied();if(VC.onMic)VC.onMic();return local});return micBusy}
function transmitting(){return VC.on&&!VC.denied&&(!VC.ptt||VC.pttHeld)}
function applyMute(){if(local)local.getAudioTracks().forEach(t=>t.enabled=true);if(micG&&ac)micG.gain.setTargetAtTime(transmitting()?VC.micGain:0,ac.currentTime,.03)}
VC.setOn=function(v){VC.on=v;applyMute();VC.save();if(v&&started&&!raw)askMic()};
/* mute one player for me only */
VC.setMuted=function(name,v){if(v)VC.muted[name]=1;else delete VC.muted[name]};VC.isMuted=function(name){return !!VC.muted[name]};VC.setPtt=function(v){VC.ptt=v;applyMute();VC.save()};
VC.setPttHeld=function(v){if(VC.pttHeld===v)return;VC.pttHeld=v;applyMute()};
VC.setMicGain=function(v){VC.micGain=v;applyMute();VC.save()};
VC.setPlayerVol=function(name,v){VC.vols[name]=v;VC.save()};
VC.playerVol=function(name){return VC.vols[name]!=null?VC.vols[name]:1};
/* voice activity: the monster can hear it */
VC.tick=function(dt){if(!an||!raw){VC.speaking=false;return}an.getFloatTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++)s+=buf[i]*buf[i];const rms=Math.sqrt(s/buf.length);VC.level=rms;
 const tx=transmitting()&&rms>.035;if(tx){speakT+=dt;quietT=0}else{quietT+=dt;if(quietT>.35)speakT=0}VC.speaking=speakT>.12};
/* calls */
function keyOf(peerId){return peerId===NET.hostPeerId?'h':peerId}
function attach(id,call){VC.calls[id]=call;call.on('stream',st=>addRemote(id,st));call.on('close',()=>dropRemote(id));call.on('error',()=>dropRemote(id))}
VC.onIncoming=function(call){const id=keyOf(call.peer);if(VC.calls[id]&&VC.calls[id]!==call){try{VC.calls[id].close()}catch(e){}}
 const go=()=>{if(!local){call.close();return}call.answer(local);attach(id,call)};if(local)go();else VC.init().then(go)};
VC.sync=function(ids,myId){if(!NET.peer||NET.mode==='solo')return;const mine=NET.peerIdOf(myId);
 ids.forEach(id=>{if(id===myId||VC.calls[id])return;const pid=NET.peerIdOf(id);if(!pid||!(mine<pid))return;/* the smaller id places the call */
  const go=()=>{if(VC.calls[id]||!NET.peer||!local)return;try{const c=NET.peer.call(pid,local);if(c)attach(id,c)}catch(e){}};if(local)go();else VC.init().then(go)});
 Object.keys(VC.calls).forEach(id=>{if(!ids.includes(id)){try{VC.calls[id].close()}catch(e){}dropRemote(id)}})};
function addRemote(id,st){dropRemote(id,true);const r={st};
 /* Chrome only feeds WebAudio from a remote stream that is also attached to a media element */
 const el=new Audio();el.srcObject=st;el.muted=true;el.playsInline=true;el.play().catch(()=>{});r.el=el;
 if(ac){try{r.src=ac.createMediaStreamSource(st);r.g=ac.createGain();r.g.gain.value=0;r.src.connect(r.g);
  if(ac.createStereoPanner){r.p=ac.createStereoPanner();r.g.connect(r.p);r.p.connect(ac.destination)}else r.g.connect(ac.destination);
  r.an=ac.createAnalyser();r.an.fftSize=256;r.buf=new Float32Array(256);r.src.connect(r.an)}catch(e){r.src=null;el.muted=false}}else el.muted=false;
 VC.remotes[id]=r}
function dropRemote(id,keepCall){const r=VC.remotes[id];if(r){try{r.src&&r.src.disconnect();r.g&&r.g.disconnect();r.p&&r.p.disconnect()}catch(e){}try{r.el.srcObject=null}catch(e){}delete VC.remotes[id]}if(!keepCall)delete VC.calls[id]}
/* every frame: gain = player volume x distance falloff; pan from the listener's yaw */
VC.update=function(listener,getInfo){for(const id in VC.remotes){const r=VC.remotes[id];const inf=getInfo(id);let g=0,pan=0;
  if(inf){g=VC.muted[inf.name]?0:VC.playerVol(inf.name);if(inf.pos&&listener){const dx=inf.pos.x-listener.x,dz=inf.pos.z-listener.z,dy=(inf.pos.y||0)-listener.y;const d=Math.hypot(dx,dy,dz);
    const k=Math.max(0,1-Math.max(0,d-2)/30);g*=k*k;const rx=Math.cos(listener.yaw),rz=-Math.sin(listener.yaw);pan=d>.1?Math.max(-1,Math.min(1,(dx*rx+dz*rz)/d))*.8:0}
   if(inf.mute)g=0}
  if(r.g&&ac){r.g.gain.setTargetAtTime(g,ac.currentTime,.08);if(r.p)r.p.pan.setTargetAtTime(pan,ac.currentTime,.08)}else if(r.el){r.el.volume=Math.max(0,Math.min(1,g))}
  if(r.an){r.an.getFloatTimeDomainData(r.buf);let s=0;for(let i=0;i<r.buf.length;i++)s+=r.buf[i]*r.buf[i];r.level=Math.sqrt(s/r.buf.length)}}};
VC.isTalking=function(id){const r=VC.remotes[id];return !!(r&&r.level>.03)};
VC.closeAll=function(){Object.keys(VC.calls).forEach(id=>{try{VC.calls[id].close()}catch(e){}dropRemote(id)})};
})();

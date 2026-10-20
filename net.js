/* Qarovsiz Uy — networking over PeerJS (WebRTC). The room creator is the host and runs the game logic.
   Closed rooms use a random 4-digit code as their peer id. Open rooms take one of a fixed set of "slot"
   ids, so anyone can find them by probing those ids — no extra server needed. */
(function(){
const N=window.NET={mode:'solo',myId:'me',conns:{},onMsg:null,onLeave:null,onStatus:null,onCall:null,open:false,info:null};
const PREFIX='qarovsiz-uy-v1-',SLOTS=12;
N.PREFIX=PREFIX;
function opts(){const o={debug:0,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}].concat(window.TURN_SERVERS||[])}};
 if(window.PEER_OPTS)Object.assign(o,window.PEER_OPTS);const q=new URLSearchParams(location.search);if(q.get('peerhost')){o.host=q.get('peerhost');o.port=+(q.get('peerport')||9000);o.path='/';o.secure=false}return o}
N.solo=function(){N.mode='solo';N.myId='me'};
function wireHost(p){
 p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});
 p.on('call',call=>{if(N.onCall)N.onCall(call);else call.close()});
 p.on('connection',c=>{
  if(c.metadata&&c.metadata.probe){/* someone browsing open rooms: answer with room info, never count as a player */
   c.on('data',d=>{if(d&&d.t==='probe'){const info=N.info?N.info():{};try{c.send(Object.assign({t:'info',ts:d.ts},info))}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},1500)}});c.on('error',()=>{});return}
  c.on('open',()=>{N.conns[c.peer]=c});c.on('data',d=>{if(d&&d.t==='ping'){try{c.send({t:'pong',ts:d.ts})}catch(e){}return}if(N.onMsg)N.onMsg(c.peer,d)});
  c.on('close',()=>{delete N.conns[c.peer];if(N.onLeave)N.onLeave(c.peer)});c.on('error',()=>{})})}
/* closed room with a random code */
N.host=function(cb){N.mode='host';N.myId='h';N.open=false;let tries=0;
 const attempt=()=>{const code=String(1000+Math.floor(Math.random()*9000));const p=new Peer(PREFIX+code,opts());let ok=false;
  p.on('open',()=>{ok=true;N.peer=p;N.code=code;N.hostPeerId=p.id;cb(null,code)});
  p.on('error',e=>{if(e.type==='unavailable-id'&&tries++<6){p.destroy();attempt();return}if(!ok)cb(e.type||'xato');else if(N.onStatus)N.onStatus('error',e.type)});
  wireHost(p)};
 attempt()};
/* open room: take the first free slot id */
N.hostOpen=function(cb){N.mode='host';N.myId='h';N.open=true;let k=0;
 const attempt=()=>{if(k>=SLOTS){cb('full');return}const slot=k;const p=new Peer(PREFIX+'open-'+slot,opts());let ok=false;
  p.on('open',()=>{ok=true;N.peer=p;N.code='O'+(slot+1);N.slot=slot;N.hostPeerId=p.id;cb(null,N.code)});
  p.on('error',e=>{if(e.type==='unavailable-id'){p.destroy();k++;attempt();return}if(!ok)cb(e.type||'xato');else if(N.onStatus)N.onStatus('error',e.type)});
  wireHost(p)};
 attempt()};
/* look at every open slot: returns [{slot,players,max,phase,name,ping}] */
N.scan=function(cb,onUpdate){const p=new Peer(opts());const found=[];let done=false,pending=SLOTS;
 const finish=()=>{if(done)return;done=true;try{p.destroy()}catch(e){}cb(found)};
 const to=setTimeout(finish,6500);
 p.on('error',e=>{if(e.type==='peer-unavailable'){if(--pending<=0){clearTimeout(to);setTimeout(finish,300)}}else if(e.type!=='peer-unavailable'&&!p.open){clearTimeout(to);finish()}});
 p.on('open',()=>{for(let s=0;s<SLOTS;s++){const c=p.connect(PREFIX+'open-'+s,{metadata:{probe:1},reliable:true});
  c.on('open',()=>{c.send({t:'probe',ts:performance.now()})});
  c.on('data',d=>{if(d&&d.t==='info'){found.push({slot:s,players:d.players||1,max:d.max||5,phase:d.phase,name:d.name||'?',ping:Math.round(performance.now()-d.ts)});if(onUpdate)onUpdate(found.slice());try{c.close()}catch(e){}if(--pending<=0){clearTimeout(to);setTimeout(finish,200)}}});
  c.on('error',()=>{})}})};
N.join=function(code,cb){N.mode='client';const p=new Peer(opts());N.peer=p;let done=false;const to=setTimeout(()=>{if(!done){done=true;cb('timeout')}},16000);
 const target=/^O\d+$/.test(code)?PREFIX+'open-'+(+code.slice(1)-1):PREFIX+code;N.hostPeerId=target;N.code=code;N.open=/^O/.test(code);
 p.on('call',call=>{if(N.onCall)N.onCall(call);else call.close()});
 p.on('open',id=>{N.myId=id;const c=p.connect(target,{reliable:true});N.hostConn=c;
  c.on('open',()=>{if(!done){done=true;clearTimeout(to);cb(null);startPing()}});
  c.on('data',d=>{if(d&&d.t==='pong'){N.ping=Math.round(performance.now()-d.ts);return}if(N.onMsg)N.onMsg('h',d)});c.on('close',()=>{if(N.onStatus)N.onStatus('closed')});c.on('error',()=>{})});
 p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});
 p.on('error',e=>{if(!done){done=true;clearTimeout(to);cb(e.type==='peer-unavailable'?'notfound':(e.type||'xato'))}else if(e.type!=='peer-unavailable'&&N.onStatus)N.onStatus('error',e.type)})};
let pingT=null;function startPing(){clearInterval(pingT);pingT=setInterval(()=>{if(N.hostConn&&N.hostConn.open)N.hostConn.send({t:'ping',ts:performance.now()})},2000);if(N.hostConn&&N.hostConn.open)N.hostConn.send({t:'ping',ts:performance.now()})}
N.ping=0;
/* real peer id of a player key used in the game state ('h' = host) */
N.peerIdOf=function(id){return id==='h'?N.hostPeerId:id};
/* client -> host */
N.send=function(m){if(N.mode==='client'&&N.hostConn&&N.hostConn.open)N.hostConn.send(m)};
/* host -> every client (except one) */
N.broadcast=function(m,except){if(N.mode!=='host')return;for(const id in N.conns){if(id!==except){const c=N.conns[id];if(c.open)c.send(m)}}};
N.to=function(id,m){const c=N.conns[id];if(c&&c.open)c.send(m)};
N.close=function(){clearInterval(pingT);try{if(N.peer)N.peer.destroy()}catch(e){}N.conns={};N.hostConn=null;N.peer=null;N.mode='solo';N.open=false};
/* rough round trip to the signalling server, for the menu */
N.serverPing=function(cb){const t0=performance.now();const o=opts();const url=o.host?('http://'+o.host+':'+o.port+'/'):'https://0.peerjs.com/peerjs/id?ts='+Date.now();
 fetch(url,{cache:'no-store',mode:'no-cors'}).then(()=>cb(Math.round(performance.now()-t0))).catch(()=>cb(null))};
})();

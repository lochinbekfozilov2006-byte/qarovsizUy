/* Qarovsiz Uy — networking over PeerJS (WebRTC). The room creator is the host and runs the game logic. */
(function(){
const N=window.NET={mode:'solo',myId:'me',conns:{},onMsg:null,onLeave:null,onStatus:null};
const PREFIX='qarovsiz-uy-v1-';
function opts(){const o={debug:0,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}].concat(window.TURN_SERVERS||[])}};
 if(window.PEER_OPTS)Object.assign(o,window.PEER_OPTS);const q=new URLSearchParams(location.search);if(q.get('peerhost')){o.host=q.get('peerhost');o.port=+(q.get('peerport')||9000);o.path='/';o.secure=false}return o}
N.solo=function(){N.mode='solo';N.myId='me'};
N.host=function(cb){N.mode='host';N.myId='h';let tries=0;
 const attempt=()=>{const code=String(1000+Math.floor(Math.random()*9000));const p=new Peer(PREFIX+code,opts());let ok=false;
  p.on('open',()=>{ok=true;N.peer=p;N.code=code;cb(null,code)});
  p.on('error',e=>{if(e.type==='unavailable-id'&&tries++<6){p.destroy();attempt();return}if(!ok)cb(e.type||'xato');else if(N.onStatus)N.onStatus('error',e.type)});
  p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});
  p.on('connection',c=>{c.on('open',()=>{N.conns[c.peer]=c});c.on('data',d=>{if(N.onMsg)N.onMsg(c.peer,d)});c.on('close',()=>{delete N.conns[c.peer];if(N.onLeave)N.onLeave(c.peer)});c.on('error',()=>{})})};
 attempt()};
N.join=function(code,cb){N.mode='client';const p=new Peer(opts());N.peer=p;let done=false;const to=setTimeout(()=>{if(!done){done=true;cb('timeout')}},15000);
 p.on('open',id=>{N.myId=id;const c=p.connect(PREFIX+code,{reliable:true});N.hostConn=c;
  c.on('open',()=>{if(!done){done=true;clearTimeout(to);cb(null)}});c.on('data',d=>{if(N.onMsg)N.onMsg('h',d)});c.on('close',()=>{if(N.onStatus)N.onStatus('closed')});c.on('error',()=>{})});
 p.on('error',e=>{if(!done){done=true;clearTimeout(to);cb(e.type==='peer-unavailable'?'notfound':(e.type||'xato'))}else if(N.onStatus)N.onStatus('error',e.type)})};
/* client -> host */
N.send=function(m){if(N.mode==='client'&&N.hostConn&&N.hostConn.open)N.hostConn.send(m)};
/* host -> every client (except one) */
N.broadcast=function(m,except){if(N.mode!=='host')return;for(const id in N.conns){if(id!==except){const c=N.conns[id];if(c.open)c.send(m)}}};
N.to=function(id,m){const c=N.conns[id];if(c&&c.open)c.send(m)};
N.close=function(){try{if(N.peer)N.peer.destroy()}catch(e){}N.conns={};N.hostConn=null;N.peer=null;N.mode='solo'};
})();

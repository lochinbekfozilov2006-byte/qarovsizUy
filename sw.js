/* Qarovsiz Uy — offline cache: o'yin fayllari bir marta yuklangach telefonda saqlanadi */
const CACHE='qarovsiz-uy-v1';
const FILES=['./','./index.html','./three.min.js','./meshopt_decoder.js','./GLTFLoader.js','./SkeletonUtils.js','./peerjs.min.js','./world.js','./actors.js','./audio.js','./config.js','./net.js','./game.js',
 './furniture.json','./monster.glb','./zombie.glb','./parasite.glb','./marlon.glb','./boy.glb','./kate.glb','./car.glb','./roar.mp3','./roar2.mp3','./icon-192.png','./icon-512.png','./manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return res})))});

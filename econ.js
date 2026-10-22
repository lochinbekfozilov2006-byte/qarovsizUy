/* Qarovsiz Uy — coins, shop items, daily bonus, ads.
   Coins live on this device for now; once the Telegram bot / server exists the wallet and the
   admin flag move there (ECON.setAdmin is the hook the server will call). */
(function(){
const K='qu_econ';
const C={START:300,ENTRY:50,WIN:100,SOLO_WIN:30,AD_COINS:50,AD_DAILY:5,TG:150,TG_URL:'https://t.me/qoqonlikBoy'};
const PRICE={char:{marlon:0,kate:0,boy:800,guard:1500},light:{warm:0,white:300,red:500,green:500}};
const LIGHT_COLOR={warm:0xfff1d6,white:0xe8f2ff,red:0xff6a5a,green:0x9dff8a};
const DAILY=[50,75,100,150,200,250,'light:green'];
/* maps: 'house' is free, the others open after 20 rewarded videos each (or a purchase) */
const MAPS=[{id:'house',free:1},{id:'hosp',ads:20,price:'$1.99',sku:'map_hosp'},{id:'map3',ads:20,price:'$1.99',sku:'map_map3'},{id:'map4',ads:20,price:'$1.99',sku:'map_map4'}];
const PACKS=[{id:'coins_500',coins:500,price:'$0.99'},{id:'coins_1200',coins:1200,price:'$1.99',bonus:20},{id:'coins_3000',coins:3000,price:'$3.99',bonus:50,best:true}];

function today(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return today(d)}
let s=null;
function fresh(){return {coins:C.START,own:{char:['marlon','kate'],light:['warm']},light:'warm',daily:{n:0,last:''},ad:{day:'',n:0},tg:false,noads:false,admin:false,maps:{own:['house'],ads:{}},vip:false}}
try{s=JSON.parse(localStorage.getItem(K)||'null')}catch(e){s=null}
if(!s||typeof s.coins!=='number'){s=fresh()}else{const f=fresh();for(const k in f)if(s[k]==null)s[k]=f[k];s.own.char=s.own.char||f.own.char;s.own.light=s.own.light||f.own.light;s.maps.own=s.maps.own||['house'];s.maps.ads=s.maps.ads||{}}
const subs=[];
function save(){try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}subs.forEach(f=>{try{f()}catch(e){}})}

const E=window.ECON={C,PRICE,LIGHT_COLOR,DAILY,PACKS,MAPS,
 mapOwned(id){const m=MAPS.find(x=>x.id===id);if(!m)return false;if(m.free||s.admin)return true;if(m.vip)return !!s.vip;return s.maps.own.includes(id)},
 mapAds(id){return s.maps.ads[id]||0},
 /* one finished rewarded video counts toward the map; returns true when it just unlocked */
 mapAd(id){const m=MAPS.find(x=>x.id===id);if(!m||!m.ads||E.mapOwned(id))return false;s.maps.ads[id]=(s.maps.ads[id]||0)+1;let done=false;if(s.maps.ads[id]>=m.ads){s.maps.own.push(id);done=true}save();return done},
 unlockMap(id){if(!s.maps.own.includes(id)){s.maps.own.push(id);save()}},
 get coins(){return s.admin?Infinity:s.coins},
 get admin(){return !!s.admin},
 /* ads that interrupt (between games) are off for admins and for "Reklamasiz" buyers */
 noAds(){return !!(s.admin||s.noads)},
 onChange(f){subs.push(f)},
 fmt(n){n=n==null?E.coins:n;return n===Infinity?'∞':String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')},
 can(n){return s.admin||s.coins>=n},
 add(n){if(!(n>0))return;if(!s.admin)s.coins+=Math.floor(n);save()},
 /* takes up to n coins (never below zero); returns how many were taken */
 spend(n){if(s.admin)return n;const t=Math.min(s.coins,Math.max(0,n));s.coins-=t;save();return t},
 owns(kind,id){return s.admin||PRICE[kind][id]===0||(s.own[kind]||[]).includes(id)},
 price(kind,id){return PRICE[kind][id]},
 buy(kind,id){if(E.owns(kind,id))return 'owned';const p=PRICE[kind][id];if(!E.can(p))return 'nocoins';if(!s.admin)s.coins-=p;(s.own[kind]=s.own[kind]||[]).push(id);save();return 'ok'},
 get light(){return E.owns('light',s.light)?s.light:'warm'},
 setLight(id){if(!E.owns('light',id))return false;s.light=id;save();return true},
 /* daily bonus: 7-day ladder, a missed day starts again from day 1 */
 daily(){const d=s.daily,t=today();
  if(d.last===t)return {can:false,idx:Math.max(0,d.n-1),done:d.n};
  if(d.last===yesterday()&&d.n>0&&d.n<7)return {can:true,idx:d.n,done:d.n};
  return {can:true,idx:0,done:0}},
 claimDaily(mult){const st=E.daily();if(!st.can)return null;const i=st.idx,r=DAILY[i];let out;mult=mult||1;
  if(typeof r==='string'){const id=r.split(':')[1];if(E.owns('light',id)){out={coins:300*mult};if(!s.admin)s.coins+=out.coins}else{(s.own.light=s.own.light||[]).push(id);out={light:id}}}
  else{out={coins:r*mult};if(!s.admin)s.coins+=out.coins}
  s.daily={n:i+1,last:today()};save();return out},
 adsLeft(){if(s.ad.day!==today())return C.AD_DAILY;return Math.max(0,C.AD_DAILY-s.ad.n)},
 noteAdCoins(){if(s.ad.day!==today()){s.ad={day:today(),n:0}}s.ad.n++;save()},
 get tgDone(){return !!s.tg},
 claimTg(){if(s.tg)return false;s.tg=true;if(!s.admin)s.coins+=C.TG;save();return true},
 setAdmin(v){s.admin=!!v;save()},
 setNoAds(v){s.noads=!!v;save()},
 _state(){return s},_reset(){s=fresh();save()}
};

/* ---------- ads: Google AdMob inside the Android app, a short sample screen on the website ---------- */
const AD_IDS={/* Google's public TEST units — swap for your own AdMob ids before release */
 app:'ca-app-pub-3940256099942544~3347511713',reward:'ca-app-pub-3940256099942544/5224354917',inter:'ca-app-pub-3940256099942544/1033173712'};
function plugin(){try{return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.AdMob||null}catch(e){return null}}
let inited=null;
function init(){const AM=plugin();if(!AM)return Promise.resolve(false);if(!inited)inited=AM.initialize({initializeForTesting:true}).then(()=>true).catch(()=>false);return inited}
function demo(sec){return new Promise(res=>{const o=document.getElementById('adDemo');if(!o){res(true);return}
 const lbl=o.querySelector('[data-ad-left]'),bar=o.querySelector('[data-ad-bar]'),x=o.querySelector('[data-ad-close]');let t=sec;o.hidden=false;x.disabled=true;bar.style.width='0%';
 const tick=()=>{lbl.textContent='0:'+String(Math.max(0,Math.ceil(t))).padStart(2,'0');bar.style.width=Math.min(100,(sec-t)/sec*100)+'%'};tick();
 const iv=setInterval(()=>{t-=.25;tick();if(t<=0){clearInterval(iv);x.disabled=false}},250);
 x.onclick=()=>{if(x.disabled)return;o.hidden=true;try{window.SRV&&SRV.ev('ad')}catch(e){}res(true)}})}
const ADS=window.ADS={ids:AD_IDS,
 get native(){return !!plugin()},
 /* resolves true when the player earned the reward */
 rewarded(){if(s.admin)return Promise.resolve(true);const AM=plugin();if(!AM)return demo(5);
  return init().then(()=>new Promise(res=>{let got=false,done=false;const hs=[];const fin=v=>{if(done)return;done=true;hs.forEach(h=>{try{h&&h.remove&&h.remove()}catch(e){}});res(v)};
   const on=(ev,f)=>{try{const h=AM.addListener(ev,f);if(h&&h.then)h.then(x=>hs.push(x));else hs.push(h)}catch(e){}};
   on('onRewardedVideoAdReward',()=>{got=true;SRV.ev('ad')});on('onRewardedVideoAdDismissed',()=>setTimeout(()=>fin(got),300));
   on('onRewardedVideoAdFailedToLoad',()=>fin(false));on('onRewardedVideoAdFailedToShow',()=>fin(false));
   AM.prepareRewardVideoAd({adId:AD_IDS.reward,isTesting:true}).then(()=>AM.showRewardVideoAd()).then(r=>{if(r&&(r.amount!=null||r.type))got=true;setTimeout(()=>fin(got),1500)}).catch(()=>fin(false))}))},
 /* between games only; skipped for admins, "Reklamasiz" buyers and on the website */
 interstitial(){if(E.noAds())return Promise.resolve();const AM=plugin();if(!AM)return Promise.resolve();
  return init().then(()=>AM.prepareInterstitial({adId:AD_IDS.inter,isTesting:true})).then(()=>AM.showInterstitial()).then(()=>SRV.ev('ad')).catch(()=>{})},
 init};
/* In-app purchases go through Google Play Billing once the game is on Play Market */

/* ---------- link with the Telegram bot / server (admin flag, gifts, stats) ---------- */
const API=(()=>{try{if(location.protocol==='https:'&&/vercel\.app$/.test(location.hostname))return ''}catch(e){}return 'https://qarovsiz-uybot.vercel.app'})();
let DEV='';try{DEV=localStorage.getItem('qu_dev')||''}catch(e){}
if(!/^[a-f0-9]{32}$/.test(DEV)){const a=new Uint8Array(16);(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.random()*256|0);DEV=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');try{localStorage.setItem('qu_dev',DEV)}catch(e){}}
const SRV=window.SRV={dev:DEV,api:API,info:null,ok:false,onSync:null,
 sync(){return fetch(API+'/api/me?dev='+DEV,{cache:'no-store'}).then(r=>r.json()).then(j=>{if(!j||!j.ok)throw 0;SRV.ok=true;SRV.info=j;let got=0,tg=false;const wasAdmin=s.admin;s.admin=!!j.admin;
   (j.grants||[]).forEach(g=>{if(g&&g.coins>0){if(!s.admin)s.coins+=Math.floor(g.coins);got+=g.coins}if(g&&g.kind==='tg')tg=true});
   if(tg||j.tgDone)s.tg=true;save();if(SRV.onSync)SRV.onSync({got,tg,admin:s.admin,newAdmin:s.admin&&!wasAdmin});return j})
  .catch(()=>{SRV.ok=false;return null})},
 ev(t,on){try{fetch(API+'/api/ev',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dev:DEV,t,on:on?1:0}),keepalive:true}).catch(()=>{})}catch(e){}},
 redeem(code){return fetch(API+'/api/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dev:DEV,code})}).then(r=>r.json()).then(j=>{if(j&&j.ok&&j.coins>0){if(!s.admin)s.coins+=Math.floor(j.coins);save()}return j||{ok:false}}).catch(()=>({ok:false,error:'net'}))},
 botLink(){const b=SRV.info&&SRV.info.bot;return b?'https://t.me/'+b+'?start=l_'+DEV:null}};
setTimeout(()=>{SRV.sync();SRV.ev('open')},300);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')SRV.sync()});
window.IAP={ready:false,buy(id){return Promise.resolve({ok:false,reason:'soon'})}};
if(plugin())setTimeout(init,1500);
})();

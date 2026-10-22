/* Qarovsiz Uy — sozlamalar.
   Turli tarmoqdagi (mobil internet, boshqa Wi-Fi) o'yinchilar ulanishi uchun TURN server kerak.
   TURN ma'lumotlari kodda emas, Vercel → Settings → Environment Variables'da turadi (api/turn.js ga qarang):
     CF_TURN_KEY_ID + CF_TURN_API_TOKEN  — Cloudflare Realtime TURN (oyiga 1000 GB bepul)
     yoki METERED_DOMAIN + METERED_API_KEY  — Metered (oyiga 20 GB bepul)
   (yoki TURN_USER / TURN_PASS — Metered'dagi statik Username/Password) */
window.TURN_SERVERS = window.TURN_SERVERS || [];
(function(){
  var base = '';
  try { if (!(location.protocol === 'https:' && /vercel\.app$/.test(location.hostname))) base = 'https://qarovsiz-uybot.vercel.app'; } catch (e) {}
  window.TURN_READY = fetch(base + '/api/turn', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
    if (j && j.ok && j.iceServers && j.iceServers.length) window.TURN_SERVERS = j.iceServers;
    window.TURN_OK = !!(j && j.ok);
  }).catch(function () { window.TURN_OK = false; });
})();

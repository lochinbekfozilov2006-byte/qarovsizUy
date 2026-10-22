/* GET /api/turn — ICE servers (TURN relay) for players on different networks (mobile internet, other Wi-Fi).
   Set in Vercel → Settings → Environment Variables (one of these):
     CF_TURN_KEY_ID + CF_TURN_API_TOKEN   — Cloudflare Realtime TURN (1000 GB/month free, then $0.05/GB)
     METERED_DOMAIN + METERED_API_KEY     — Metered (20 GB/month free)
     TURN_USER + TURN_PASS [+ TURN_HOST]  — any TURN server with a static username/password
   Short-lived credentials are cached in Redis (when it is connected) so the provider API is not called for every player. */
const L = require('./_lib');

function norm(list) { return (Array.isArray(list) ? list : [list]).filter(s => s && s.urls); }
async function cloudflare(id, tok) {
  const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + encodeURIComponent(id) + '/credentials/generate-ice-servers', {
    method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }) });
  const j = await r.json();
  return norm(j && j.iceServers);
}
async function metered(dom, key) {
  const r = await fetch('https://' + dom + '/api/v1/turn/credentials?apiKey=' + encodeURIComponent(key));
  const j = await r.json();
  return norm(j);
}

module.exports = async (req, res) => {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const E = process.env;
  try {
    const canCache = L.configured();
    if (canCache) { const c = await L.redis('GET', 'turncred').catch(() => null); if (c) { res.setHeader('Cache-Control', 'public, max-age=300'); return res.status(200).json({ ok: true, iceServers: JSON.parse(c), cached: true }); } }
    let list = [];
    if (E.CF_TURN_KEY_ID && E.CF_TURN_API_TOKEN) list = await cloudflare(E.CF_TURN_KEY_ID, E.CF_TURN_API_TOKEN);
    if (!list.length && E.METERED_DOMAIN && E.METERED_API_KEY) list = await metered(E.METERED_DOMAIN.replace(/^https?:\/\//, '').replace(/\/.*$/, ''), E.METERED_API_KEY);
    if (!list.length && E.TURN_USER && E.TURN_PASS) {
      const h = E.TURN_HOST || 'global.relay.metered.ca', u = E.TURN_USER, p = E.TURN_PASS;
      list = [{ urls: ['turn:' + h + ':80', 'turn:' + h + ':80?transport=tcp', 'turn:' + h + ':443', 'turns:' + h + ':443?transport=tcp'], username: u, credential: p }];
    }
    if (!list.length) return res.status(200).json({ ok: false, error: 'not_configured' });
    if (canCache) await L.redis('SET', 'turncred', JSON.stringify(list), 'EX', 12 * 3600).catch(() => {});
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ ok: true, iceServers: list });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e.message || e) }); }
};

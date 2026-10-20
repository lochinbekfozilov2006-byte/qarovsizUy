/* GET /api/me?dev=<32 hex> — what the server knows about this device:
   admin flag, linked Telegram account, bot username, and any coins waiting for it (handed over once). */
const L = require('./_lib');

module.exports = async (req, res) => {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!L.configured()) return res.status(503).json({ ok: false, error: 'not_configured' });
  const dev = String((req.query && req.query.dev) || '');
  if (!L.okDev(dev)) return res.status(400).json({ ok: false, error: 'bad_dev' });
  try {
    let bot = await L.redis('GET', 'botname');
    if (!bot) { const me = await L.tg('getMe'); if (me.ok) { bot = me.result.username; await L.redis('SET', 'botname', bot); } }
    const [tgId, grants] = await L.pipe([['GET', 'link:' + dev], ['LRANGE', 'grants:' + dev, 0, -1]]);
    if (grants && grants.length) await L.redis('DEL', 'grants:' + dev);
    const admin = tgId ? await L.isAdmin(tgId) : false;
    const tgDone = tgId ? (await L.redis('GET', 'tgrew:' + tgId)) === '1' : false;
    res.status(200).json({ ok: true, bot, linked: !!tgId, admin, tgDone, grants: (grants || []).map(g => { try { return JSON.parse(g); } catch (e) { return null; } }).filter(Boolean) });
  } catch (e) { res.status(500).json({ ok: false, error: String(e.message || e) }); }
};

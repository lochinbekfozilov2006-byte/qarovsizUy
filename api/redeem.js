/* POST /api/redeem {dev, code} — gift codes created in the bot panel. One use per device. */
const L = require('./_lib');

module.exports = async (req, res) => {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!L.configured()) return res.status(503).json({ ok: false, error: 'not_configured' });
  const b = await L.body(req);
  const dev = String(b.dev || ''), code = String(b.code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!L.okDev(dev) || !code) return res.status(400).json({ ok: false, error: 'bad' });
  try {
    const c = await L.redis('HGETALL', 'code:' + code);
    if (!c || !c.length) return res.status(200).json({ ok: false, error: 'bad_code' });
    const h = {}; for (let i = 0; i < c.length; i += 2) h[c[i]] = c[i + 1];
    if (+h.left <= 0) return res.status(200).json({ ok: false, error: 'used_up' });
    const fresh = await L.redis('SADD', 'codeused:' + code, dev);
    if (fresh !== 1) return res.status(200).json({ ok: false, error: 'already' });
    const left = await L.redis('HINCRBY', 'code:' + code, 'left', -1);
    if (left < 0) { await L.redis('HINCRBY', 'code:' + code, 'left', 1); await L.redis('SREM', 'codeused:' + code, dev); return res.status(200).json({ ok: false, error: 'used_up' }); }
    res.status(200).json({ ok: true, coins: +h.coins || 0 });
  } catch (e) { res.status(500).json({ ok: false, error: String(e.message || e) }); }
};

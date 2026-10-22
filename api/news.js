/* In-game announcements from the game owner ("Xabarlar").
   GET  /api/news?dev=<id>                 — list (newest first), which gifts this device already took, owner flag
   GET  /api/news?sign=1&dev=&r=&n=        — owner only: signature for the verified badge in room r under name n
   GET  /api/news?verify=<tok>&r=&n=&ts=  — check such a signature
   POST /api/news {dev, text, coins}       — owner only: send a message to every player (optional coin gift)
   POST /api/news {dev, claim:id}          — take the coin gift attached to a message, once per device
   POST /api/news {dev, del:id}            — owner only: remove a message */
const L = require('./_lib');

async function list() { const raw = await L.redis('LRANGE', 'news', 0, 49); return (raw || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); }

module.exports = async (req, res) => {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!L.configured()) return res.status(503).json({ ok: false, error: 'not_configured' });
  try {
    if (req.method === 'GET') {
      const q = req.query || {}, dev = String(q.dev || '');
      /* verified badge: the owner's game asks for a signature of (room, name, time); anyone can check it */
      if (q.sign) { if (!(await L.isOwnerDev(dev))) return res.status(403).json({ ok: false }); const ts = Date.now(); return res.status(200).json({ ok: true, ts, tok: L.ownSign(q.r, q.n, ts) }); }
      if (q.verify) { const ts = +q.ts || 0; const fresh = Math.abs(Date.now() - ts) < 36 * 3600e3; return res.status(200).json({ ok: true, owner: fresh && String(q.verify) === L.ownSign(q.r, q.n, ts) }); }
      const items = await list();
      let claimed = [];
      if (L.okDev(dev)) { const withGift = items.filter(i => i.coins > 0); if (withGift.length) { const r = await L.pipe(withGift.map(i => ['SISMEMBER', 'newsclaim:' + i.id, dev])); claimed = withGift.filter((i, k) => r[k] === 1).map(i => i.id); } }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, items, claimed, owner: L.okDev(dev) ? await L.isOwnerDev(dev) : false });
    }
    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    const b = await L.body(req); const dev = String(b.dev || '');
    if (!L.okDev(dev)) return res.status(400).json({ ok: false, error: 'bad_dev' });
    if (b.claim) {
      const it = (await list()).find(i => i.id === String(b.claim));
      if (!it || !(it.coins > 0)) return res.status(200).json({ ok: false, error: 'no_gift' });
      const added = await L.redis('SADD', 'newsclaim:' + it.id, dev);
      return res.status(200).json(added === 1 ? { ok: true, coins: it.coins } : { ok: false, error: 'taken' });
    }
    if (!(await L.isOwnerDev(dev))) return res.status(403).json({ ok: false, error: 'not_owner' });
    if (b.del) { const raw = await L.redis('LRANGE', 'news', 0, 49); const hit = (raw || []).find(x => { try { return JSON.parse(x).id === String(b.del); } catch (e) { return false; } }); if (hit) await L.redis('LREM', 'news', 1, hit); return res.status(200).json({ ok: !!hit }); }
    const item = await L.addNews(b.text, b.coins);
    if (!item) return res.status(400).json({ ok: false, error: 'empty' });
    return res.status(200).json({ ok: true, item });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
};

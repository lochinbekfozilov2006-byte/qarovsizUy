/* POST /api/ev {dev, t:'open'|'game'|'ad', on?:1} — daily statistics for the admin panel */
const L = require('./_lib');
const TTL = 60 * 864e2; /* keep 60 days */

module.exports = async (req, res) => {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!L.configured()) return res.status(503).json({ ok: false });
  const b = await L.body(req);
  const dev = String(b.dev || ''), t = String(b.t || '');
  if (!L.okDev(dev) || !['open', 'game', 'ad'].includes(t)) return res.status(400).json({ ok: false });
  const d = L.day(0), k = 'st:' + d + ':';
  const cmds = [['SADD', k + 'players', dev], ['EXPIRE', k + 'players', TTL], ['SADD', 'alldevs', dev]];
  if (t === 'game') { cmds.push(['INCR', k + 'games'], ['EXPIRE', k + 'games', TTL]); if (b.on) cmds.push(['INCR', k + 'online'], ['EXPIRE', k + 'online', TTL]); }
  if (t === 'ad') cmds.push(['INCR', k + 'ads'], ['EXPIRE', k + 'ads', TTL]);
  try { await L.pipe(cmds); res.status(200).json({ ok: true }); } catch (e) { res.status(500).json({ ok: false }); }
};

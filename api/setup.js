/* GET /api/setup — points the Telegram webhook at /api/bot and registers the commands.
   Safe to open by anyone: it can only point the bot at this same site. Run it once after adding BOT_TOKEN. */
const L = require('./_lib');

module.exports = async (req, res) => {
  const checks = { BOT_TOKEN: !!L.BOT(), REDIS: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) };
  if (!checks.BOT_TOKEN || !checks.REDIS) return res.status(200).json({ ok: false, checks, help: 'Vercel → Settings → Environment Variables: BOT_TOKEN; Storage: Upstash Redis' });
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = 'https://' + host + '/api/bot';
  const hook = await L.tg('setWebhook', { url, secret_token: L.hookSecret(), allowed_updates: ['message', 'callback_query', 'my_chat_member'], drop_pending_updates: false });
  await L.tg('setMyCommands', { commands: [{ command: 'start', description: "O'yin va kanal" }, { command: 'panel', description: 'Admin paneli' }] });
  const me = await L.tg('getMe');
  if (me.ok) { try { await L.redis('SET', 'botname', me.result.username); } catch (e) {} }
  let redisOk = false; try { redisOk = (await L.redis('PING')) === 'PONG'; } catch (e) {}
  const ch = me.ok ? await L.tg('getChatMember', { chat_id: L.CHANNEL, user_id: me.result.id }) : null;
  res.status(200).json({ ok: !!hook.ok, webhook: url, hook: hook.description, bot: me.ok ? '@' + me.result.username : null, redis: redisOk,
    channel: ch && ch.ok ? ch.result.status : (ch ? 'xato: ' + ch.description : null),
    note: ch && ch.ok && ch.result.status === 'administrator' ? 'Kanal tekshiruvi ishlaydi' : "Botni kanalga ADMIN qilib qo'shing, aks holda obunani tekshirib bo'lmaydi" });
};

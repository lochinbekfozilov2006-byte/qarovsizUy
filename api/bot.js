/* POST /api/bot — Telegram webhook for the Qarovsiz Uy bot.
   /start           — welcome, game + channel buttons
   /start l_<dev>   — links the game on this device to the Telegram account, checks the channel, gives 150 coins once
   /panel           — admin panel: statistics, posts (owner only), admins, gift codes, give coins */
const L = require('./_lib');

const H = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const kb = rows => ({ inline_keyboard: rows });
const send = (chat, text, markup) => L.tg('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: markup });
const edit = (chat, mid, text, markup) => L.tg('editMessageText', { chat_id: chat, message_id: mid, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: markup });
const CH_URL = 'https://t.me/' + L.CHANNEL.replace(/^@/, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function setState(id, st) { if (st) await L.redis('SET', 'state:' + id, JSON.stringify(st), 'EX', 900); else await L.redis('DEL', 'state:' + id); }
async function getState(id) { const s = await L.redis('GET', 'state:' + id); try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
async function name(id) { const n = await L.redis('HGET', 'user:' + id, 'name'); return n || String(id); }

/* ---------- channel subscription + reward ---------- */
async function subscribed(id) {
  const r = await L.tg('getChatMember', { chat_id: L.CHANNEL, user_id: Number(id) });
  if (!r.ok) return null; /* the bot is not an admin of the channel yet */
  return ['member', 'administrator', 'creator'].includes(r.result.status) || (r.result.status === 'restricted' && r.result.is_member);
}
async function rewardIfSubscribed(chat, id) {
  const dev = await L.redis('GET', 'lastdev:' + id);
  const sub = await subscribed(id);
  if (sub === null) return send(chat, "⚠️ Hozircha obunani tekshirib bo'lmadi. Birozdan keyin «Tekshirish»ni bosing.", kb([[{ text: '✅ Tekshirish', callback_data: 'chk' }]]));
  if (!sub) return send(chat, "📢 Sovg'ani olish uchun avval kanalga obuna bo'ling, keyin «Tekshirish»ni bosing.", kb([[{ text: "📢 Obuna bo'lish", url: CH_URL }], [{ text: '✅ Tekshirish', callback_data: 'chk' }]]));
  const first = await L.redis('SET', 'tgrew:' + id, '1', 'NX');
  if (first === 'OK') {
    if (dev) await L.redis('RPUSH', 'grants:' + dev, JSON.stringify({ coins: L.TG_REWARD, kind: 'tg' }));
    return send(chat, '🎉 Rahmat! <b>+' + L.TG_REWARD + " tanga</b> o'yiningizga qo'shildi.\nO'yinga qayting — tanga o'zi tushadi.", kb([[{ text: "🎮 O'yinga qaytish", url: L.GAME_URL }]]));
  }
  if (dev) await L.redis('RPUSH', 'grants:' + dev, JSON.stringify({ coins: 0, kind: 'tg' }));
  return send(chat, "✅ Obuna tasdiqlandi. Bu sovg'a avval olingan.", kb([[{ text: "🎮 O'yinni ochish", url: L.GAME_URL }]]));
}

/* ---------- panel ---------- */
async function panelMarkup(id) {
  const owner = String(id) === L.OWNER_ID;
  const rows = [[{ text: '📊 Statistika', callback_data: 'p:stat' }, { text: "🎁 Sovg'a kodi", callback_data: 'p:code' }],
    [{ text: '💰 Tanga berish', callback_data: 'p:give' }, { text: '👮 Adminlar', callback_data: 'p:admins' }]];
  if (owner) rows.unshift([{ text: '📣 Post yuborish', callback_data: 'p:post' }]);
  rows.push([{ text: "🎮 O'yinni ochish", url: L.GAME_URL }]);
  return kb(rows);
}
const PANEL_TXT = "🛠 <b>Admin paneli</b>\nQarovsiz Uy boshqaruvi. Kerakli bo'limni tanlang:";
const back = [{ text: '⬅️ Panel', callback_data: 'p:home' }];

async function statsText() {
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => L.day(i));
  const cmds = [];
  days.forEach(d => { const k = 'st:' + d + ':'; cmds.push(['SCARD', k + 'players'], ['GET', k + 'games'], ['GET', k + 'online'], ['GET', k + 'ads']); });
  cmds.push(['SCARD', 'users'], ['SCARD', 'linked'], ['SCARD', 'alldevs'], ['SCARD', 'admins']);
  const r = await L.pipe(cmds);
  const D = days.map((d, i) => ({ d, pl: +r[i * 4] || 0, g: +r[i * 4 + 1] || 0, on: +r[i * 4 + 2] || 0, ad: +r[i * 4 + 3] || 0 }));
  const [users, linked, devs, admins] = r.slice(28).map(x => +x || 0);
  const w = D.reduce((a, x) => ({ pl: a.pl + x.pl, g: a.g + x.g, ad: a.ad + x.ad }), { pl: 0, g: 0, ad: 0 });
  const blk = (t, x) => '<b>' + t + '</b> (' + x.d + ')\n👥 O\'yinchilar: <b>' + x.pl + '</b>\n🎮 O\'yinlar: <b>' + x.g + '</b> (onlayn: ' + x.on + ')\n📺 Reklama ko\'rildi: <b>' + x.ad + '</b>';
  return '📊 <b>Statistika</b>\n\n' + blk('Bugun', D[0]) + '\n\n' + blk('Kecha', D[1]) +
    '\n\n<b>Oxirgi 7 kun</b>\n🎮 O\'yinlar: <b>' + w.g + '</b> · 📺 Reklama: <b>' + w.ad + '</b>\n👥 Kunlik o\'rtacha o\'yinchi: <b>' + Math.round(w.pl / 7) + '</b>' +
    '\n\n🤖 Bot foydalanuvchilari: <b>' + users + '</b>\n🔗 O\'yinni botga bog\'laganlar: <b>' + linked + '</b>\n📱 Jami qurilmalar: <b>' + devs + '</b>\n👮 Adminlar: <b>' + (admins + 1) + '</b>';
}

async function adminsView(chat, mid, id) {
  const ids = await L.redis('SMEMBERS', 'admins');
  const lines = ['👑 ' + H(await name(L.OWNER_ID)) + ' — <code>' + L.OWNER_ID + '</code> (egasi)'];
  for (const a of ids) lines.push('👮 ' + H(await name(a)) + ' — <code>' + a + '</code>');
  const owner = String(id) === L.OWNER_ID;
  const rows = owner ? [[{ text: "➕ Admin qo'shish", callback_data: 'a:add' }, { text: '➖ Olib tashlash', callback_data: 'a:del' }], back] : [back];
  const txt = '👮 <b>Adminlar</b>\n\n' + lines.join('\n') + "\n\nAdminlar o'yinda cheksiz tanga oladi, reklama ko'rmaydi va panelga kira oladi." + (owner ? '' : "\n\nAdmin qo'shish faqat egasiga ruxsat etilgan.");
  return mid ? edit(chat, mid, txt, kb(rows)) : send(chat, txt, kb(rows));
}

/* ---------- broadcast ---------- */
async function broadcast(chat, mid, src, target) {
  const lock = await L.redis('SET', 'postsent:' + src + ':' + target, '1', 'NX', 'EX', 86400);
  if (lock !== 'OK') return edit(chat, mid, '⚠️ Bu post allaqachon yuborilgan.', kb([back]));
  let ok = 0, fail = 0, chOk = null;
  if (target === 'ch' || target === 'all') { const r = await L.tg('copyMessage', { chat_id: L.CHANNEL, from_chat_id: chat, message_id: src }); chOk = !!r.ok; }
  if (target === 'users' || target === 'all') {
    await edit(chat, mid, '⏳ Yuborilmoqda…');
    const users = await L.redis('SMEMBERS', 'users');
    for (let i = 0; i < users.length; i += 25) {
      const part = users.slice(i, i + 25);
      const rs = await Promise.all(part.map(u => L.tg('copyMessage', { chat_id: Number(u), from_chat_id: chat, message_id: src }).catch(() => ({ ok: false }))));
      rs.forEach((r, j) => { if (r.ok) ok++; else { fail++; if (r.error_code === 403) L.redis('SREM', 'users', part[j]).catch(() => {}); } });
      if (i + 25 < users.length) await sleep(1100);
    }
  }
  const lines = ['✅ <b>Post yuborildi</b>'];
  if (target !== 'ch') lines.push('👥 Foydalanuvchilar: ' + ok + ' ta yetdi' + (fail ? ', ' + fail + ' ta yetmadi (botni bloklagan)' : ''));
  if (chOk !== null) lines.push(chOk ? '📢 Kanalga joylandi' : "📢 Kanalga joylab bo'lmadi — botni kanalga admin qilib, «Xabar joylash» huquqini bering");
  return edit(chat, mid, lines.join('\n'), kb([back]));
}

/* ---------- messages ---------- */
async function onMessage(m) {
  const chat = m.chat.id, id = String(m.from.id), text = (m.text || '').trim();
  if (m.chat.type !== 'private') return;
  await L.pipe([['SADD', 'users', id], ['HSET', 'user:' + id, 'name', [m.from.first_name, m.from.last_name].filter(Boolean).join(' ').slice(0, 60), 'un', m.from.username || '']]);

  if (text === '/bekor' || text === '/cancel') { await setState(id, null); return send(chat, '❌ Bekor qilindi.', kb([back])); }

  if (text.startsWith('/start')) {
    await setState(id, null);
    const arg = text.split(/\s+/)[1] || '';
    if (arg.startsWith('l_') && L.okDev(arg.slice(2))) {
      const dev = arg.slice(2);
      await L.pipe([['SET', 'link:' + dev, id], ['SET', 'lastdev:' + id, dev], ['SADD', 'tgdevs:' + id, dev], ['SADD', 'linked', id]]);
      if (await L.isAdmin(id)) await send(chat, "👑 O'yin bog'landi. Siz <b>adminsiz</b>: o'yinda cheksiz tanga va reklamasiz.");
      return rewardIfSubscribed(chat, id);
    }
    return send(chat, "👻 <b>Qarovsiz Uy</b> — do'stlar bilan onlayn horror o'yini.\n\nKalit va akkumulyatorni toping, eski mashinani tuzating va mahluqdan qoching!\n\n🎁 O'yinda <b>Telegram kanal</b> tugmasini bosing, kanalga obuna bo'ling va <b>" + L.TG_REWARD + ' tanga</b> oling.',
      kb([[{ text: "🎮 O'yinni ochish", url: L.GAME_URL }], [{ text: '📢 Kanal', url: CH_URL }]]));
  }

  if (text === '/panel') {
    if (!(await L.isAdmin(id))) return send(chat, '⛔ Bu buyruq faqat adminlar uchun.');
    await setState(id, null);
    return send(chat, PANEL_TXT, await panelMarkup(id));
  }

  const st = await getState(id);
  if (!st || !(await L.isAdmin(id))) return send(chat, "Buyruqlar: /start — o'yin va kanal" + ((await L.isAdmin(id)) ? '\n/panel — admin paneli' : ''));

  if (st.k === 'post' && id === L.OWNER_ID) {
    await setState(id, null);
    const users = await L.redis('SCARD', 'users');
    return send(chat, '📣 Yuqoridagi post qayerga yuborilsin?\n👥 Bot foydalanuvchilari: <b>' + users + '</b>', kb([
      [{ text: '👥 Foydalanuvchilarga', callback_data: 'b:users:' + m.message_id }, { text: '📢 Kanalga', callback_data: 'b:ch:' + m.message_id }],
      [{ text: '👥 + 📢 Ikkalasiga', callback_data: 'b:all:' + m.message_id }], [{ text: '❌ Bekor', callback_data: 'p:home' }]]));
  }
  if (st.k === 'code') {
    const n = text.match(/\d+/g) || [];
    const coins = +n[0], uses = +(n[1] || 1);
    if (!(coins > 0 && coins <= 100000 && uses > 0 && uses <= 100000)) return send(chat, '❗ Masalan: <code>500 100</code> (500 tanga, 100 kishi). Bekor: /bekor');
    await setState(id, null);
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = 'QU'; for (let i = 0; i < 6; i++) code += A[Math.floor(Math.random() * A.length)];
    await L.pipe([['HSET', 'code:' + code, 'coins', coins, 'left', uses, 'uses', uses, 'by', id, 'at', Date.now()], ['LPUSH', 'codes', code], ['LTRIM', 'codes', 0, 49]]);
    return send(chat, "🎁 <b>Sovg'a kodi tayyor</b>\n\n<code>" + code + '</code>\n' + coins + ' tanga · ' + uses + " kishi ishlata oladi\n\nO'yinda: Do'kon → Tanga va paketlar → Sovg'a kodi.\nKodni kanalga joylashingiz mumkin.", kb([back]));
  }
  if (st.k === 'give') {
    const n = text.match(/\d+/g) || [];
    const to = n[0], coins = +n[1];
    if (!(to && coins > 0 && coins <= 100000)) return send(chat, '❗ Masalan: <code>123456789 500</code> (Telegram ID va tanga). Bekor: /bekor');
    await setState(id, null);
    const dev = await L.redis('GET', 'lastdev:' + to);
    if (!dev) return send(chat, "⚠️ Bu foydalanuvchi o'yinni botga bog'lamagan (o'yinda «Telegram kanal» tugmasi orqali).", kb([back]));
    await L.redis('RPUSH', 'grants:' + dev, JSON.stringify({ coins, kind: 'gift' }));
    await send(Number(to), "🎁 Sizga <b>" + coins + " tanga</b> sovg'a qilindi! O'yinni oching — tanga o'zi tushadi.", kb([[{ text: "🎮 O'yinni ochish", url: L.GAME_URL }]])).catch(() => {});
    return send(chat, '✅ <code>' + to + '</code> ga ' + coins + ' tanga yuborildi.', kb([back]));
  }
  if ((st.k === 'addadm') && id === L.OWNER_ID) {
    const to = String((m.forward_from && m.forward_from.id) || (text.match(/\d{5,}/) || [])[0] || '');
    if (!to) return send(chat, "❗ Telegram ID raqamini yuboring yoki uning xabarini forward qiling. Bekor: /bekor");
    await setState(id, null);
    await L.redis('SADD', 'admins', to);
    await send(Number(to), "👮 Siz <b>Qarovsiz Uy</b> admini qilindingiz.\n/panel — admin paneli. O'yinda cheksiz tanga va reklamasiz (o'yinni botga bog'lang).").catch(() => {});
    return adminsView(chat, null, id);
  }
  await setState(id, null);
  return send(chat, PANEL_TXT, await panelMarkup(id));
}

/* ---------- buttons ---------- */
async function onCallback(q) {
  const id = String(q.from.id), chat = q.message.chat.id, mid = q.message.message_id, d = q.data || '';
  const ans = (text, alert) => L.tg('answerCallbackQuery', { callback_query_id: q.id, text, show_alert: !!alert });
  if (d === 'chk') { await ans('Tekshirilmoqda…'); return rewardIfSubscribed(chat, id); }
  if (!(await L.isAdmin(id))) return ans('⛔ Faqat adminlar uchun', true);
  const owner = id === L.OWNER_ID;
  if (d === 'p:home') { await setState(id, null); await ans(); return edit(chat, mid, PANEL_TXT, await panelMarkup(id)); }
  if (d === 'p:stat') { await ans(); return edit(chat, mid, await statsText(), kb([[{ text: '🔄 Yangilash', callback_data: 'p:stat' }], back])); }
  if (d === 'p:post') { if (!owner) return ans('⛔ Post yuborish faqat egasiga ruxsat etilgan', true); await setState(id, { k: 'post' }); await ans();
    return edit(chat, mid, '📣 <b>Post yuborish</b>\n\nYubormoqchi bo\'lgan postni shu yerga yuboring: matn, rasm, video yoki ovozli xabar — qanday bo\'lsa, shunday yetadi.\n\nBekor qilish: /bekor', kb([back])); }
  if (d.startsWith('b:')) { if (!owner) return ans('⛔', true); const [, target, src] = d.split(':'); await ans('Yuborilmoqda…'); return broadcast(chat, mid, Number(src), target); }
  if (d === 'p:code') { await setState(id, { k: 'code' }); await ans();
    const list = await L.redis('LRANGE', 'codes', 0, 4); const rows = [];
    for (const c of list) { const h = await L.redis('HMGET', 'code:' + c, 'coins', 'left', 'uses'); rows.push('<code>' + c + '</code> — ' + (h[0] || 0) + ' tanga, qoldi ' + (h[1] || 0) + '/' + (h[2] || 0)); }
    return edit(chat, mid, "🎁 <b>Sovg'a kodi</b>\n\nTanga miqdori va necha kishi ishlata olishini yuboring.\nMasalan: <code>500 100</code>" + (rows.length ? '\n\n<b>Oxirgi kodlar:</b>\n' + rows.join('\n') : '') + '\n\nBekor: /bekor', kb([back])); }
  if (d === 'p:give') { await setState(id, { k: 'give' }); await ans();
    return edit(chat, mid, "💰 <b>Tanga berish</b>\n\nTelegram ID va tanga miqdorini yuboring.\nMasalan: <code>123456789 500</code>\n\nFoydalanuvchi o'yinni botga bog'lagan bo'lishi kerak.\nBekor: /bekor", kb([back])); }
  if (d === 'p:admins') { await ans(); return adminsView(chat, mid, id); }
  if (d === 'a:add') { if (!owner) return ans('⛔ Faqat egasi', true); await setState(id, { k: 'addadm' }); await ans();
    return edit(chat, mid, "➕ <b>Admin qo'shish</b>\n\nYangi adminning Telegram ID raqamini yuboring yoki uning biror xabarini shu yerga forward qiling.\n\nBekor: /bekor", kb([back])); }
  if (d === 'a:del') { if (!owner) return ans('⛔ Faqat egasi', true); await ans();
    const ids = await L.redis('SMEMBERS', 'admins'); if (!ids.length) return edit(chat, mid, "Qo'shimcha admin yo'q.", kb([back]));
    const rows = []; for (const a of ids) rows.push([{ text: '❌ ' + (await name(a)) + ' (' + a + ')', callback_data: 'a:rm:' + a }]); rows.push(back);
    return edit(chat, mid, '➖ Qaysi adminni olib tashlaymiz?', kb(rows)); }
  if (d.startsWith('a:rm:')) { if (!owner) return ans('⛔', true); const a = d.slice(5); await L.redis('SREM', 'admins', a); await ans('Olib tashlandi'); return adminsView(chat, mid, id); }
  return ans();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('Qarovsiz Uy bot ishlayapti');
  if (req.headers['x-telegram-bot-api-secret-token'] !== L.hookSecret()) return res.status(401).end();
  const u = await L.body(req);
  try {
    if (u.message) await onMessage(u.message);
    else if (u.callback_query) await onCallback(u.callback_query);
  } catch (e) { console.error('bot error', e); }
  res.status(200).json({ ok: true });
};
module.exports.config = { maxDuration: 300 };

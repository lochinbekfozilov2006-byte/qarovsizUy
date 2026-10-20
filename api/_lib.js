/* Qarovsiz Uy — shared helpers for the bot + game API (Vercel serverless, Node 18+).
   Secrets come only from environment variables set in the Vercel dashboard:
     BOT_TOKEN                               — Telegram bot token (from @BotFather)
     KV_REST_API_URL / KV_REST_API_TOKEN     — Upstash Redis (added automatically when the database is connected)
     (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are accepted too) */
const crypto = require('crypto');

const OWNER_ID = String(process.env.OWNER_ID || '8135915671');   // the only account that may send posts
const CHANNEL = process.env.CHANNEL || '@qoqonlikBoy';
const GAME_URL = process.env.GAME_URL || 'https://qarovsiz-uybot.vercel.app';
const TG_REWARD = 150;

function env(...names) { for (const n of names) if (process.env[n]) return process.env[n]; return ''; }
const R_URL = () => env('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
const R_TOK = () => env('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');
const BOT = () => env('BOT_TOKEN', 'TELEGRAM_BOT_TOKEN');

/* ---------- Redis (Upstash REST) ---------- */
/* every key gets a 'qu:' prefix, so this game can share one database with other projects */
const PFX = process.env.KEY_PREFIX || 'qu:';
function pk(cmd) { const c = cmd.slice(); if (c.length > 1 && String(c[0]).toUpperCase() !== 'PING') c[1] = PFX + c[1]; return c; }
async function redis(...cmd) {
  cmd = pk(cmd);
  const r = await fetch(R_URL(), { method: 'POST', headers: { Authorization: 'Bearer ' + R_TOK(), 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error('redis: ' + j.error);
  return j.result;
}
async function pipe(cmds) {
  if (!cmds.length) return [];
  const r = await fetch(R_URL().replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + R_TOK(), 'Content-Type': 'application/json' }, body: JSON.stringify(cmds.map(pk)) });
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error('redis: ' + x.error); return x.result; });
}

/* ---------- Telegram ---------- */
async function tg(method, params) {
  const r = await fetch((process.env.TG_API || 'https://api.telegram.org') + '/bot' + BOT() + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}) });
  return r.json();
}
/* webhook secret derived from the token, so nothing extra has to be configured */
function hookSecret() { return crypto.createHash('sha256').update('qu-hook:' + BOT()).digest('hex').slice(0, 48); }

/* ---------- misc ---------- */
function day(offset) { const d = new Date(Date.now() + 5 * 3600e3 - (offset || 0) * 864e5); return d.toISOString().slice(0, 10); } /* Tashkent date */
function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); }
function okDev(d) { return typeof d === 'string' && /^[a-f0-9]{32}$/.test(d); }
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return await new Promise(res => { let s = ''; req.on('data', c => s += c); req.on('end', () => { try { res(JSON.parse(s || '{}')); } catch (e) { res({}); } }); });
}
async function isAdmin(id) { id = String(id); if (id === OWNER_ID) return true; return (await redis('SISMEMBER', 'admins', id)) === 1; }
function configured() { return !!(BOT() && R_URL() && R_TOK()); }

module.exports = { OWNER_ID, CHANNEL, GAME_URL, TG_REWARD, redis, pipe, tg, hookSecret, day, cors, okDev, body, isAdmin, configured, BOT };

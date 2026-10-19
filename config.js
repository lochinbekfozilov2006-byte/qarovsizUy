/* Qarovsiz Uy — sozlamalar.
   TURN server (Metered.ca) — boshqa shahardagi do'stlar bilan ulanish uchun.
   Faqat quyidagi ikki qatorni o'zgartiring: Metered'dagi Username va Password. */
var TURN_USER = '0ca5b8351b119449e85a0a40';
var TURN_PASS = 'Uh7XrLCj0Z2w+mIx';

window.TURN_SERVERS = window.TURN_SERVERS || [
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'turn:global.relay.metered.ca:80', username: TURN_USER, credential: TURN_PASS },
  { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: TURN_USER, credential: TURN_PASS },
  { urls: 'turn:global.relay.metered.ca:443', username: TURN_USER, credential: TURN_PASS },
  { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: TURN_USER, credential: TURN_PASS }
];

/* Qarovsiz Uy — sozlamalar.
   Agar do'stlaringiz bazaga ulana olmasa (ayniqsa mobil internetda), bepul TURN server qo'shing.
   Masalan https://www.metered.ca/stun-turn saytida bepul hisob ochib, berilgan ma'lumotlarni shu yerga yozing:

   window.TURN_SERVERS = [
     { urls: 'turn:global.relay.metered.ca:80', username: 'SIZNING_USERNAME', credential: 'SIZNING_PAROL' },
     { urls: 'turn:global.relay.metered.ca:443', username: 'SIZNING_USERNAME', credential: 'SIZNING_PAROL' }
   ];
*/
window.TURN_SERVERS = window.TURN_SERVERS || [];

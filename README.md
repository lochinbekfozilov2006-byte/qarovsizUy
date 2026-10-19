# Qarovsiz Uy — onlayn horror o'yini

2–4 kishilik brauzer o'yini. Kalit va akkumulyatorni topib, garajdagi eski mashinani tuzating va mahluqdan qoching.

## Vercel'ga joylash

**1-usul: GitHub orqali (tavsiya etiladi)**
1. GitHub'da yangi repozitoriy oching (masalan `qarovsiz-uy`).
2. Shu papkadagi hamma narsani (`index.html`, `js`, `assets`) repozitoriyga yuklang.
3. vercel.com → **Add New → Project** → repozitoriyni tanlang → **Deploy**.
   Framework: **Other**, build buyrug'i kerak emas.

**2-usul: Vercel CLI**
```
npm i -g vercel
cd qarovsiz-uy
vercel --prod
```

## Xarita
170 × 170 metrlik hovli: asosiy uy (11 xona + yerto'la), mehmon uyi (6 xona), saroy (otxonalar va asboblar xonasi), ustaxona (3 xona), garaj, omborxona, qabriston, issiqxona, hovuz, bog' va eski tirkama.

## O'yin qanday ishlaydi
- **Baza ochish** — 4 xonali kod chiqadi, uni do'stlaringizga yuborasiz. Kamida 2 kishi bo'lganda "Boshlash" yoqiladi.
- **Bazaga qo'shilish** — kodni yozib qo'shilasiz.
- **Yolg'iz o'ynash** — bir o'zingiz.
- 1-daqiqada mahluq ko'rinib qo'rqitadi, 5-daqiqada haqiqiy hujum qiladi. Undan qochib qolsangiz, 1 daqiqadan keyin yana qo'rqitadi, 3 daqiqadan keyin yana tashlanadi.
- Yashirinish: shkaf ichi, stol va karavot tagi, parda va divan orqasi, omborxona burchagi, mashina orqasi.

Boshqaruv: WASD — yurish, Shift — yugurish, E — qo'l (ochish/olish/yashirinish), F — fonar. Telefonda ekrandagi tugmalar.

## Ko'p o'yinchi haqida
O'yinchilar PeerJS orqali bir-biriga to'g'ridan-to'g'ri ulanadi, alohida server kerak emas. Baza egasining kompyuteri yoki telefoni o'yin "serveri" bo'ladi, shuning uchun u o'yindan chiqsa, o'yin tugaydi.
Ba'zi mobil internetlarda to'g'ridan-to'g'ri ulanish ishlamasligi mumkin. Unda `js/config.js` fayliga bepul TURN server qo'shing (ichida yo'riqnoma bor).

## Fayllar
- `assets/monster.glb` — Cry Wolf (mahluq), `assets/marlon.glb`, `assets/boy.glb` — personajlar
- `assets/car.glb` — eski mashina
- `assets/furniture.json` — mebellar, `assets/roar.mp3` — mahluq ovozi

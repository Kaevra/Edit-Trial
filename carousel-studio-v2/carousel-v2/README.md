# Carousel Studio (versi 1, tanpa Claude API)

Buka link utama -> otomatis masuk /admin.
Upload Word atau tempel teks -> slide dibuat dengan ATURAN (bukan AI) -> edit -> export PNG/ZIP.

## Jalankan
    npm install
    npm run dev      # http://localhost:3000

## Deploy ke Vercel
1. Push folder ini ke GitHub.
2. vercel.com > Add New > Project > pilih repo > Deploy. (Tidak perlu environment variable.)

## Yang perlu diketahui
- Data disimpan di localStorage browser (lib/storage.js). Tiap browser/orang punya data sendiri.
  Untuk dipakai tim, ganti isi lib/storage.js ke Firebase/Firestore.
- Belum ada login: siapa pun yang punya link bisa membuka /admin. Tambahkan pengaman sebelum dipakai sungguhan.
- Template: lib/template.js. Font: taruh di public/fonts lalu aktifkan @font-face di app/globals.css.
- Pembaca dokumen: lib/parse.js (nanti bisa diganti Claude API).
- Dipasang di website lain: salin app/admin, components, lib ke proyek Next.js itu.

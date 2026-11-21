# Cara memasang template paten
1. Font: taruh file di public/fonts/, lalu isi `fonts` di lib/template.js
   dan atur `fontHead` (judul) dan `fontBody` (isi).
2. Latar: taruh PNG 1080x1350 (tanpa teks) di public/template/, isi bgCover / bgBody / bgCta.
3. Logo: taruh PNG transparan di public/template/, isi `logo.src` dan atur posisinya.
4. Warna: ubah bg, fg, accent, line.
5. Ukuran huruf: size.body (34) dan size.emph (50).
Lalu jalankan ulang: semua slide langsung memakai template baru.

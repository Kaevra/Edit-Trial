// TEMPLATE PATEN: semua tampilan slide diatur dari file ini.
// Cukup taruh file di public/ lalu isi nama file-nya di sini.
export const T = {
  width: 1080,
  height: 1350,

  // Warna
  bg: '#0f1b3d', fg: '#f5f1e6', accent: '#f2b632', line: '#ffffff30',

  // Latar gambar per jenis slide (taruh di public/template/). null = pakai warna bg.
  bgCover: null,   // contoh: '/template/cover.png'
  bgBody: null,    // contoh: '/template/isi.png'  (slide teks, daftar, tabel)
  bgCta: null,     // contoh: '/template/penutup.png'

  // Font: taruh file di public/fonts/, isi daftar ini (woff2 / woff / ttf / otf)
  fonts: [
    // { family: 'BrandHead', file: '/fonts/Head-Bold.woff2', weight: 700 },
    // { family: 'BrandBody', file: '/fonts/Body-Regular.woff2', weight: 400 },
  ],
  fontHead: "'BrandHead', Georgia, serif",       // judul, cover, penutup
  fontBody: "'BrandBody', system-ui, sans-serif", // isi

  // Logo (taruh di public/template/). null = tanpa logo.
  logo: { src: null, width: 150, top: 70, right: 80 },

  // Teks tetap di kaki slide (mis. @namaakun). '' = kosong.
  footerText: '',
  showTitleTag: true,      // judul materi kecil di atas slide
  showPageNumber: true,

  // Area teks
  padding: '90px 80px',

  // Ukuran huruf
  size: { body: 34, emph: 50, cover: 84, cta: 50, tableTitle: 48 },
};
export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const FMT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
export const fontCss = () =>
  T.fonts.map((f) => `@font-face{font-family:'${f.family}';src:url('${f.file}') format('${FMT[f.file.split('.').pop().toLowerCase()] || 'woff2'}');font-weight:${f.weight || 400};font-style:${f.style || 'normal'};font-display:swap}`).join('\n');

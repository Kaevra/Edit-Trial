// TEMPLATE GLIMPSE.INC: logo, tombol, footer, dan warna gradien diatur dari file ini.
export const T = {
  width: 1080,
  height: 1350,

  // Font: taruh file di public/fonts/, isi daftar ini (woff2 / woff / ttf / otf).
  // Open Sauce: taruh file di public/fonts/, lalu hapus tanda // pada baris yang file-nya ada.
  // Nama file harus sama persis dengan yang kamu taruh.
  fonts: [
    // { family: 'Open Sauce', file: '/fonts/OpenSauceSans-Light.ttf',    weight: 300 },
    { family: 'Open Sauce', file: '/fonts/OpenSauceSans-Regular.ttf', weight: 400 },
    // { family: 'Open Sauce', file: '/fonts/OpenSauceSans-Medium.ttf',   weight: 500 },
    // { family: 'Open Sauce', file: '/fonts/OpenSauceSans-SemiBold.ttf', weight: 600 },
    // { family: 'Open Sauce', file: '/fonts/OpenSauceSans-Bold.ttf',     weight: 700 },
    // { family: 'Open Sauce', file: '/fonts/OpenSauceSans-Italic.ttf',     weight: 400, style: 'italic' },
    // { family: 'Open Sauce', file: '/fonts/OpenSauceSans-BoldItalic.ttf', weight: 700, style: 'italic' },
  ],
  fontHead: "'Open Sauce', 'Open Sauce Sans', 'Inter', system-ui, sans-serif",
  fontBody: "'Open Sauce', 'Open Sauce Sans', 'Inter', system-ui, sans-serif",

  colors: { title: '#000000', body: '#444444', line: '#00000022' },

  // Elemen tetap di semua slide (file hasil potongan dari template)
  logo: { src: '/template/logo.png', left: 106, top: 77, width: 166 },
  footer: { src: '/template/footer.png', height: 108 },
  // Tombol hanya di slide cover
  button: { text: 'Visit Us. Klik link di bio', left: 553, top: 70, width: 418, height: 76, from: '#8b5cf6', to: '#5eddea' },

  // Area isi (di bawah logo, di atas footer)
  area: { left: 125, right: 125, top: 310, bottom: 1170 },

  // Ukuran huruf standar (tiap slide bisa diubah bebas 1-500 di editor)
  size: { body: 34, emph: 50, cover: 106, cta: 50, tableTitle: 48 },
};

// Tiga warna cover. Slide isi selalu memakai gradien "body" (template ke-4).
export const COVER_THEMES = {
  orange: { label: 'Orange', align: 'center' },
  green: { label: 'Hijau', align: 'left' },
  pink: { label: 'Pink', align: 'left' },
};

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const FMT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
export const fontCss = () =>
  T.fonts.map((f) => `@font-face{font-family:'${f.family}';src:url('${f.file}') format('${FMT[f.file.split('.').pop().toLowerCase()] || 'woff2'}');font-weight:${f.weight || 400};font-style:${f.style || 'normal'};font-display:swap}`).join('\n');

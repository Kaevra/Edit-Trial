// Gradien latar: WARNA tetap per tema, POSISI diacak dari "seed" (tiap slide punya seed sendiri).
const W = 1080, H = 1350;

// [r,g,b], size = radius dasar (px), a = kepekatan
const BG = {
  green:  { base: '#ffffff', blobs: [{ c: [143, 199, 154], size: 520, a: 0.95 }, { c: [185, 175, 215], size: 480, a: 0.8 }] },
  orange: { base: '#fafafa', blobs: [{ c: [252, 160, 125], size: 520, a: 0.95 }, { c: [200, 198, 236], size: 460, a: 0.8 }] },
  pink:   { base: '#ffffff', blobs: [{ c: [253, 205, 210], size: 520, a: 0.95 }, { c: [195, 229, 248], size: 470, a: 0.9 }, { c: [209, 246, 254], size: 380, a: 0.9 }] },
  body:   { base: '#ffffff', blobs: [{ c: [243, 207, 227], size: 520, a: 0.9 }, { c: [207, 215, 242], size: 470, a: 0.9 }, { c: [217, 245, 251], size: 380, a: 0.9 }] },
};

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bgFor(theme, seed) {
  const t = BG[theme] || BG.body, r = rng(seed);
  const edges = ['top', 'left', 'right', 'bottom'];
  for (let i = edges.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [edges[i], edges[j]] = [edges[j], edges[i]]; }
  const layers = t.blobs.map((b, k) => {
    const edge = edges[k % 4], along = 0.12 + 0.76 * r(), out = r() * 70;
    let cx, cy;
    if (edge === 'top') { cx = along * W; cy = -out; }
    else if (edge === 'bottom') { cx = along * W; cy = H - 140 + out * 0.5; }
    else if (edge === 'left') { cx = -out; cy = 150 + along * (H - 450); }
    else { cx = W + out; cy = 150 + along * (H - 450); }
    const rx = Math.round(b.size * (0.8 + 0.5 * r())), ry = Math.round(rx * (0.7 + 0.5 * r()));
    const [R, G, B] = b.c;
    return `radial-gradient(${rx}px ${ry}px at ${Math.round(cx)}px ${Math.round(cy)}px, rgba(${R},${G},${B},${b.a}) 0%, rgba(${R},${G},${B},${(b.a * 0.5).toFixed(2)}) 35%, rgba(${R},${G},${B},0) 100%)`;
  });
  return `${layers.join(',')},${t.base}`;
}

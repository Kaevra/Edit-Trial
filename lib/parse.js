// Pembaca dokumen berbasis ATURAN (tanpa Claude API).
// Nanti bagian parseHtml() ini bisa diganti panggilan Claude API; bentuk keluarannya tetap sama.

export const hashOf = (o) => {
  const s = JSON.stringify(o); let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
};

const escH = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Teks hasil copas -> HTML sederhana (supaya memakai pembaca yang sama dengan .docx)
export function textToHtml(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  let out = '', ul = false, tb = false;
  const close = () => { if (ul) { out += '</ul>'; ul = false; } if (tb) { out += '</table>'; tb = false; } };
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    const num = l.match(/^\d+[.)]\s+(.*)/), bul = l.match(/^[-•*●▪]\s*(.*)/);
    if (num || bul) { if (tb) close(); if (!ul) { out += '<ul>'; ul = true; } out += `<li>${escH((num || bul)[1])}</li>`; continue; }
    if (l.startsWith('|') || raw.includes('\t')) {
      const cells = l.startsWith('|') ? l.replace(/^\||\|$/g, '').split('|') : raw.split('\t');
      if (ul) close();
      if (!tb) { out += '<table>'; tb = true; }
      out += '<tr>' + cells.map((c) => `<td>${escH(c.trim())}</td>`).join('') + '</tr>';
      continue;
    }
    close(); out += `<p>${escH(l)}</p>`;
  }
  close(); return out;
}

// Aturan: satu materi = satu blok yang diakhiri baris CAPTION.
// Judul materi = paragraf pertama. Paragraf biasa SETELAH judul dianggap isi (bukan materi baru).
// single=true (dipakai untuk "tempel teks"): seluruh teks selalu satu materi.
export function parseHtml(html, { single = false } = {}) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const out = []; let cur = null, cap = false, closed = false;
  const add = (s) => cur.slides.push({ fs: 0, ...s });

  // satu pembahasan (dari bullet ATAU paragraf biasa)
  const addItem = (x) => {
    const last = cur.slides[cur.slides.length - 1];
    const short = x.length < 70 && !/\?$/.test(x) && !/^#/.test(x) && !/:$/.test(x);
    if (/:$/.test(x)) add({ type: 'list', text: x, items: [] });
    else if (short && last && last.type === 'list') last.items.push(x);
    else if (short && last && last.type === 'text' && last.short) { last.type = 'list'; last.items = [last.text, x]; last.text = ''; delete last.short; }
    else add({ type: 'text', text: x, short });
  };

  for (const el of d.body.children) {
    const tag = el.tagName, t = el.textContent.trim();
    if (tag === 'P') {
      if (!t) continue;
      if (/^CAPTION/i.test(t)) {
        if (!cur) continue;
        const rest = t.replace(/^CAPTION:?\s*/i, '');
        if (rest) { cur.caption = rest; closed = true; } else cap = true;
        continue;
      }
      if (cap && cur) { cur.caption = t; cap = false; closed = true; continue; }
      if (!cur || (closed && !single)) {
        cur = { title: t, caption: '', slides: [] }; out.push(cur); closed = false; add({ type: 'cover', text: t });
      } else if (!closed) addItem(t);
    } else if ((tag === 'UL' || tag === 'OL') && cur && !closed) {
      for (const li of el.children) { const x = li.textContent.trim(); if (x) addItem(x); }
    } else if (tag === 'TABLE' && cur && !closed) {
      const rows = [...el.rows].map((r) => [...r.cells].map((c) => c.textContent.trim()));
      const last = cur.slides[cur.slides.length - 1];
      if (last && last.type === 'text') { last.type = 'table'; last.rows = rows; delete last.short; }
      else add({ type: 'table', text: '', rows });
    }
  }
  out.forEach((m) => {
    m.slides.forEach((s) => { if (s.type === 'list' && !s.items.length) s.type = 'text'; delete s.short; s.items = s.items || []; s.rows = s.rows || []; });
    const l = m.slides[m.slides.length - 1];
    if (l && l.type === 'text' && /\?$/.test(l.text)) l.type = 'cta';
  });
  return out;
}

// Hasil OCR memotong kalimat per baris layar. Gabungkan baris lanjutan; item bernomor/bullet tetap terpisah.
export function unwrapOcr(raw) {
  const out = [];
  for (const l of raw.replace(/\r/g, '').split('\n')) {
    const t = l.trim();
    if (!t) { out.push(''); continue; }
    const prev = out[out.length - 1];
    const newItem = /^(\d+[.)]|[-•*●▪])\s/.test(t);
    if (prev && !newItem && prev.length > 45 && !/[.?!:”"]$/.test(prev)) out[out.length - 1] = prev + ' ' + t;
    else out.push(t);
  }
  return out.filter(Boolean).join('\n');
}

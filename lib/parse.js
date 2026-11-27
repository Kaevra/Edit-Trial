// Pembaca dokumen berbasis ATURAN (tanpa Claude API).
// Nanti bagian parseHtml() ini bisa diganti panggilan Claude API; bentuk keluarannya tetap sama.

export const hashOf = (o) => {
  const s = JSON.stringify(o); let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
};

const escH = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Teks hasil copas -> HTML sederhana (supaya memakai pembaca yang sama dengan .docx)
// Baris berangka "1." = daftar bernomor (<ol>), baris "-" / bullet = <ul>.
export function textToHtml(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  let out = '', list = null, tb = false;
  const closeAll = () => { if (list) { out += `</${list}>`; list = null; } if (tb) { out += '</table>'; tb = false; } };
  const open = (t) => { if (tb) { out += '</table>'; tb = false; } if (list !== t) { if (list) out += `</${list}>`; out += `<${t}>`; list = t; } };
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    const num = l.match(/^\d+[.)]\s+(.*)/), bul = l.match(/^[-•*●▪]\s*(.*)/);
    if (num) { open('ol'); out += `<li>${escH(num[1])}</li>`; continue; }
    if (bul) { open('ul'); out += `<li>${escH(bul[1])}</li>`; continue; }
    if (l.startsWith('|') || raw.includes('\t')) {
      const cells = l.startsWith('|') ? l.replace(/^\||\|$/g, '').split('|') : raw.split('\t');
      if (list) { out += `</${list}>`; list = null; }
      if (!tb) { out += '<table>'; tb = true; }
      out += '<tr>' + cells.map((c) => `<td>${escH(c.trim())}</td>`).join('') + '</tr>';
      continue;
    }
    closeAll(); out += `<p>${escH(l)}</p>`;
  }
  closeAll(); return out;
}

// ATURAN: satu materi = satu blok yang diakhiri baris CAPTION (judul = paragraf pertama).
// Pembahasan BERNOMOR (1., 2., ...) = satu slide. Paragraf tanpa nomor setelah sebuah nomor
// (walau sudah di-enter) tetap di slide nomor itu, sampai muncul nomor berikutnya.
// single=true (tempel teks): seluruh teks selalu satu materi.
export function parseHtml(html, { single = false } = {}) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const out = []; let cur = null, cap = false, closed = false, cont = null;
  const add = (s) => { cur.slides.push({ fs: 0, ...s }); return cur.slides[cur.slides.length - 1]; };

  // pembahasan tanpa nomor (bullet / paragraf lepas)
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
        cont = null; continue;
      }
      if (cap && cur) { cur.caption = t; cap = false; closed = true; continue; }
      if (!cur || (closed && !single)) {
        cur = { title: t, caption: '', slides: [] }; out.push(cur); closed = false; cont = null; add({ type: 'cover', text: t });
      } else if (!closed) {
        if (cont) cont.blocks.push({ text: t });   // lanjutan dari nomor sebelumnya
        else addItem(t);
      }
    } else if ((tag === 'UL' || tag === 'OL') && cur && !closed) {
      for (const li of el.children) {
        const x = li.textContent.trim(); if (!x) continue;
        if (tag === 'OL') cont = add({ type: 'text', text: x, blocks: [{ text: x }] });
        else { cont = null; addItem(x); }
      }
    } else if (tag === 'TABLE' && cur && !closed) {
      const rows = [...el.rows].map((r) => [...r.cells].map((c) => c.textContent.trim()));
      const last = cur.slides[cur.slides.length - 1];
      cont = null;
      if (last && last.type === 'text') {
        if (last.blocks && last.blocks.length > 1) last.text = last.blocks.map((b) => b.text).join('\n');
        delete last.blocks; last.type = 'table'; last.rows = rows; delete last.short;
      } else if (last && last.type === 'list' && !last.text && last.items.length > 1) {
        const head = last.items.pop();
        if (last.items.length === 1) { last.type = 'text'; last.text = last.items[0]; last.items = []; }
        add({ type: 'table', text: head, rows });
      } else add({ type: 'table', text: '', rows });
    }
  }
  out.forEach((m) => {
    m.slides.forEach((s) => { if (s.type === 'list' && !s.items.length) s.type = 'text'; delete s.short; s.items = s.items || []; s.rows = s.rows || []; });
    const l = m.slides[m.slides.length - 1];
    const lt = l && l.blocks && l.blocks.length ? l.blocks[l.blocks.length - 1].text : l && l.text;
    if (l && l.type === 'text' && /\?$/.test(lt || '')) l.type = 'cta';
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

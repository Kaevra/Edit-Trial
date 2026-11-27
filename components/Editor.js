'use client';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import Slide, { baseSize } from './Slide';
import { T, COVER_THEMES } from '@/lib/template';
import { saveMaterial } from '@/lib/storage';
import { fileToDataUrl } from '@/lib/image';

// elemen editable -> teks dengan penanda **penekanan (ukuran 50)**
function md(el) {
  let o = '';
  el.childNodes.forEach((n) => {
    o += n.nodeType === 3 ? n.textContent : n.classList?.contains('sz') ? `[[${n.dataset.size || ''}${n.dataset.bold ? 'b' : ''}${n.dataset.ital ? 'i' : ''}:${n.textContent}]]` : n.classList?.contains('big') ? '**' + n.textContent + '**' : n.nodeName === 'BR' ? '\n' : n.textContent;
  });
  return o;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Editor({ initial }) {
  const [m, setM] = useState(initial);
  const [si, setSi] = useState(0);
  const [v, setV] = useState(0);
  const [msg, setMsg] = useState('');
  const [selSize, setSelSize] = useState('50');
  const [bi, setBi] = useState(0);   // blok teks yang sedang dipilih
  const lastRange = useRef(null);
  const [mode, setMode] = useState('view');   // 'view' = hasil jadi, 'edit' = mengedit
  const [scale, setScale] = useState(0.4);
  const stage = useRef(null), node = useRef(null), first = useRef(true);
  const s = m.slides[si];

  useEffect(() => {
    const f = () => stage.current && setScale(stage.current.clientWidth / T.width);
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, []);

  // buka dari dashboard: ?edit=1 langsung mode edit, ?dl=1 langsung download ZIP
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('edit')) setMode('edit');
    if (q.get('dl')) setTimeout(() => exportZip(), 1000);
  }, []);

  useEffect(() => {
    const h = () => {
      const sel = getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed && node.current?.contains(sel.anchorNode)) lastRange.current = sel.getRangeAt(0).cloneRange();
    };
    document.addEventListener('selectionchange', h); return () => document.removeEventListener('selectionchange', h);
  }, []);

  // simpan otomatis
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { saveMaterial(m).then(() => setMsg('Tersimpan otomatis.')).catch(() => setMsg('Penyimpanan penuh. Hapus materi lama atau kurangi gambar.')); }, 700);
    return () => clearTimeout(t);
  }, [m]);

  const edit = (fn) => setM((p) => { const n = structuredClone(p); fn(n); return n; });
  const upd = (fn) => { edit((n) => fn(n.slides[si], n)); setV((x) => x + 1); };

  function commit(ed) {
    const val = md(ed).trim();
    edit((n) => {
      const sl = n.slides[si];
      if (ed.dataset.b !== undefined) {
        sl.blocks = sl.blocks?.length ? sl.blocks : [{ text: sl.text }];
        sl.blocks[+ed.dataset.b].text = val; sl.text = sl.blocks[0].text;
      } else if (ed.dataset.f) sl.text = val;
      else if (ed.dataset.i !== undefined) sl.items[+ed.dataset.i] = val;
      else if (ed.dataset.r !== undefined) sl.rows[+ed.dataset.r][+ed.dataset.c] = val.replace(/^[▲▼]\s*/, '');
    });
  }

  const selTarget = () => {
    const sel = getSelection();
    const r = sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0) : lastRange.current;
    if (!r) { setMsg('Blok kata/kalimat di slide dulu.'); return null; }
    const a = r.commonAncestorContainer, el = a.nodeType === 3 ? a.parentElement : a;
    const ed = el.closest('[contenteditable]');
    if (!ed || !node.current?.contains(ed)) { setMsg('Blok teks di dalam slide.'); return null; }
    return { r, el, ed };
  };
  const finishSel = (ed, text) => { commit(ed); setV((x) => x + 1); lastRange.current = null; setMsg(text); };

  function toggleBig() {
    const t = selTarget(); if (!t) return;
    const { r, el, ed } = t, big = el.closest('.big');
    if (big) big.replaceWith(...big.childNodes);
    else {
      const sp = document.createElement('span'); sp.className = 'big';
      try { r.surroundContents(sp); } catch { return setMsg('Blok teks dalam satu paragraf saja.'); }
    }
    finishSel(ed, `Ukuran diubah (${T.size.emph} = penekanan, ${T.size.body} = standar).`);
  }

  // ukuran bebas 1-500 untuk blok teks
  function applySize() {
    const n = Math.min(500, Math.max(1, parseInt(selSize) || 0));
    if (!n) return setMsg('Isi ukuran 1 sampai 500.');
    const t = selTarget(); if (!t) return;
    const { r, el, ed } = t, ex = el.closest('.sz');
    if (ex) { ex.dataset.size = n; ex.style.fontSize = n + 'px'; }
    else {
      const sp = document.createElement('span'); sp.className = 'sz'; sp.dataset.size = n; sp.style.fontSize = n + 'px';
      try { r.surroundContents(sp); } catch { return setMsg('Blok teks dalam satu paragraf saja.'); }
    }
    finishSel(ed, `Blok teks diubah ke ukuran ${n}.`);
  }
  // bold / italic untuk blok teks (bisa digabung dengan ukuran)
  function toggleFmt(flag) {
    const t = selTarget(); if (!t) return;
    const { r, el, ed } = t, key = flag === 'b' ? 'bold' : 'ital';
    let sp = el.closest('.sz');
    if (!sp) {
      sp = document.createElement('span'); sp.className = 'sz';
      try { r.surroundContents(sp); } catch { return setMsg('Blok teks dalam satu paragraf saja.'); }
    }
    if (sp.dataset[key]) delete sp.dataset[key]; else sp.dataset[key] = '1';
    sp.style.fontWeight = sp.dataset.bold ? '700' : ''; sp.style.fontStyle = sp.dataset.ital ? 'italic' : '';
    if (!sp.dataset.size && !sp.dataset.bold && !sp.dataset.ital) sp.replaceWith(...sp.childNodes);
    finishSel(ed, flag === 'b' ? 'Bold diubah.' : 'Italic diubah.');
  }
  function clearSel() {
    const t = selTarget(); if (!t) return;
    const x = t.el.closest('.sz') || t.el.closest('.big');
    if (x) x.replaceWith(...x.childNodes);
    finishSel(t.ed, 'Blok kembali ke ukuran standar slide.');
  }
  const clampSize = (v) => Math.min(500, Math.max(1, parseInt(v) || 0));
  const isBlk = (sl) => sl.type === 'text' || sl.type === 'cta';
  const curSize = () => (isBlk(s) ? s.blocks?.[bi]?.fs || s.fs || baseSize(s) : s.fs || baseSize(s));
  const setSize = (v, key = 'fs') => {
    const n = clampSize(v); if (!n) return;
    upd((sl) => {
      if (key === 'fs' && isBlk(sl)) {
        const bl = sl.blocks?.length ? sl.blocks : [{ text: sl.text }];
        bl[Math.min(bi, bl.length - 1)].fs = n; sl.blocks = bl;
      } else sl[key] = n;
    });
  };
  const dupBlock = () => {
    upd((sl) => {
      const bl = sl.blocks?.length ? sl.blocks : [{ text: sl.text }];
      const k = Math.min(bi, bl.length - 1); bl.splice(k + 1, 0, { ...bl[k] }); sl.blocks = bl;
    });
    setBi(bi + 1); setMsg('Teks diduplikat. Hapus bagian yang tidak perlu di tiap blok, lalu atur ukurannya masing-masing.');
  };
  const delBlock = () => {
    upd((sl) => {
      if (!sl.blocks || sl.blocks.length < 2) return;
      sl.blocks.splice(Math.min(bi, sl.blocks.length - 1), 1); sl.text = sl.blocks[0].text;
    });
    setBi(Math.max(0, bi - 1));
  };

  const shot = () => { document.activeElement?.blur(); return toPng(node.current, { width: T.width, height: T.height, pixelRatio: 1, style: { transform: 'none' }, cacheBust: true }); };
  async function exportOne() {
    try { setMsg('Membuat PNG…'); const u = await shot(); const a = document.createElement('a'); a.href = u; a.download = `slide-${si + 1}.png`; a.click(); setMsg('Selesai.'); }
    catch (e) { setMsg('Export gagal: ' + e.message); }
  }
  async function exportZip() {
    const keep = si, zip = new JSZip();
    try {
      for (let i = 0; i < m.slides.length; i++) {
        setSi(i); setMsg(`Export ${i + 1}/${m.slides.length}…`); await wait(500);
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, (await shot()).split(',')[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${m.title}.zip`; a.click(); setMsg('Selesai.');
    } catch (e) { setMsg('Export gagal: ' + e.message); }
    setSi(keep);
  }

  async function addImage(e) {
    const f = e.target.files[0]; if (!f) return;
    try {
      const url = await fileToDataUrl(f);
      edit((n) => { n.slides.splice(si + 1, 0, { type: 'image', image: url, text: '', items: [], rows: [], fs: 0 }); });
      setSi(si + 1); setV((x) => x + 1); setMsg('Gambar ditambahkan sebagai slide baru.');
    } catch { setMsg('Gagal membaca gambar.'); }
    e.target.value = '';
  }

  const move = (d) => { const j = si + d; if (j < 0 || j >= m.slides.length) return; edit((n) => { [n.slides[si], n.slides[j]] = [n.slides[j], n.slides[si]]; }); setSi(j); setV((x) => x + 1); };
  const del = () => { if (m.slides.length > 1 && confirm('Hapus slide ini?')) { edit((n) => n.slides.splice(si, 1)); setSi(Math.max(0, si - 1)); setV((x) => x + 1); } };
  const fs = (d) => setSize(curSize() + d);

  const edit_ = mode === 'edit';
  return (
    <div className="wrap">
      <div className="row">
        <a href="/admin">← Semua materi</a><b style={{ flex: 1 }}>{m.title}</b>
        <button onClick={() => edit((n) => { n.posted = !n.posted; })}>{m.posted ? '✓ Sudah diposting' : 'Tandai sudah diposting'}</button>
      </div>

      <div className="row">
        {edit_
          ? <button className="pri" onClick={() => { document.activeElement?.blur(); setMode('view'); setMsg('Selesai mengedit. Hasil tersimpan.'); }}>✓ Selesai edit</button>
          : <button className="pri" onClick={() => setMode('edit')}>✎ Edit konten</button>}
        <button onClick={exportZip}>⬇ Download semua (ZIP)</button>
        <button onClick={exportOne}>⬇ PNG slide ini</button>
      </div>
      <div className="row">
        <label>Warna cover:&nbsp;
          <select value={m.theme || 'green'} onChange={(e) => { edit((n) => { n.theme = e.target.value; }); setV((x) => x + 1); }}>
            {Object.entries(COVER_THEMES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
        </label>
        {edit_ && <>
          <button onClick={() => upd((sl) => { sl.seed = Math.floor(Math.random() * 1e9); })}>🎲 Acak gradien slide ini</button>
          <button onClick={() => { edit((n) => n.slides.forEach((sl) => { sl.seed = Math.floor(Math.random() * 1e9); })); setV((x) => x + 1); }}>🎲 Acak semua slide</button>
        </>}
      </div>

      <div id="stage" ref={stage} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && ['b', 'i'].includes(e.key.toLowerCase())) { e.preventDefault(); toggleFmt(e.key.toLowerCase()); } }} onFocus={(e) => { const b = e.target?.dataset?.b; if (b !== undefined) setBi(+b); }} onBlur={(e) => edit_ && e.target.isContentEditable && commit(e.target)}>
        <Slide key={`${si}-${v}-${mode}`} s={s} i={si} n={m.slides.length} title={m.title} scale={scale} innerRef={node} editable={edit_} theme={m.theme || 'green'} />
      </div>
      <div id="strip">
        {m.slides.map((x, i) => (<div key={i} className={'th' + (i === si ? ' on' : '')} onClick={() => setSi(i)}>{(x.text || (x.type === 'image' ? 'gambar' : 'tabel')).slice(0, 50)}</div>))}
      </div>
      <div className="row">
        <button disabled={si === 0} onClick={() => setSi(si - 1)}>←</button>
        <button disabled={si === m.slides.length - 1} onClick={() => setSi(si + 1)}>→</button>
        {edit_ && <>
          <button onClick={() => fs(-2)}>A−</button><button onClick={() => fs(2)}>A+</button>
          <button className="pri" onPointerDown={(e) => e.preventDefault()} onClick={toggleBig}>Teks {T.size.emph} ⇄ {T.size.body}</button>
          <button onClick={() => move(-1)}>Geser ◂</button><button onClick={() => move(1)}>▸ Geser</button>
          {s.type === 'image' && <button onClick={() => upd((sl) => { sl.full = !sl.full; })}>{s.full ? 'Gambar: penuh' : 'Gambar: dalam template'} ⇄</button>}
          <label className="btn">＋ Gambar<input type="file" accept="image/*" hidden onChange={addImage} /></label>
          {isBlk(s) && <button onClick={dupBlock}>⧉ Duplikat teks</button>}
          {isBlk(s) && s.blocks?.length > 1 && <button onClick={delBlock}>Hapus blok teks</button>}
          <button onClick={del}>Hapus</button>
        </>}
      </div>
      {edit_ && (
        <div className="row">
          <label>Ukuran teks:&nbsp;
            <input key={`z${si}-${v}-${bi}`} type="number" min="1" max="500" defaultValue={curSize()} onBlur={(e) => setSize(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} style={{ width: 80, flex: 'none' }} />
          </label>
          {s.type === 'table' && (
            <label>Ukuran tabel:&nbsp;
              <input key={`t${si}-${v}`} type="number" min="1" max="500" defaultValue={s.tfs || (s.rows[0]?.length >= 5 ? 32 : 40)} onBlur={(e) => setSize(e.target.value, 'tfs')} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} style={{ width: 80, flex: 'none' }} />
            </label>
          )}
          <button onClick={() => upd((sl) => { delete sl.fs; delete sl.tfs; sl.blocks?.forEach((b) => { delete b.fs; }); })}>Reset ukuran</button>
          <label>Ukuran blok:&nbsp;
            <input type="number" min="1" max="500" value={selSize} onChange={(e) => setSelSize(e.target.value)} style={{ width: 80, flex: 'none' }} />
          </label>
          <button className="pri" onPointerDown={(e) => e.preventDefault()} onClick={applySize}>Terapkan ke blok</button>
          <button onPointerDown={(e) => e.preventDefault()} onClick={() => toggleFmt('b')} style={{ fontWeight: 700 }}>B</button>
          <button onPointerDown={(e) => e.preventDefault()} onClick={() => toggleFmt('i')} style={{ fontStyle: 'italic' }}>I</button>
          <button onPointerDown={(e) => e.preventDefault()} onClick={clearSel}>Normal</button>
        </div>
      )}
      <div className="hint">{msg || (edit_ ? 'Klik teks atau sel tabel untuk mengedit. Perubahan tersimpan otomatis.' : 'Hasil jadi. Tekan "Edit konten" kalau perlu mengubah sedikit.')}</div>
      <b>Caption</b>
      <textarea readOnly={!edit_} value={m.caption || ''} onChange={(e) => edit((n) => { n.caption = e.target.value; })} />
      <button onClick={() => navigator.clipboard.writeText(m.caption || '').then(() => setMsg('Caption disalin.'))}>Salin caption</button>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import Slide from './Slide';
import { T } from '@/lib/template';
import { saveMaterial } from '@/lib/storage';

// elemen editable -> teks dengan penanda **penekanan (ukuran 50)**
function md(el) {
  let o = '';
  el.childNodes.forEach((n) => {
    o += n.nodeType === 3 ? n.textContent : n.classList?.contains('big') ? '**' + n.textContent + '**' : n.nodeName === 'BR' ? '\n' : n.textContent;
  });
  return o;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Editor({ initial }) {
  const [m, setM] = useState(initial);
  const [si, setSi] = useState(0);
  const [v, setV] = useState(0);
  const [msg, setMsg] = useState('');
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

  // simpan otomatis
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { saveMaterial(m).then(() => setMsg('Tersimpan otomatis.')); }, 700);
    return () => clearTimeout(t);
  }, [m]);

  const edit = (fn) => setM((p) => { const n = structuredClone(p); fn(n); return n; });
  const upd = (fn) => { edit((n) => fn(n.slides[si], n)); setV((x) => x + 1); };

  function commit(ed) {
    const val = md(ed).trim();
    edit((n) => {
      const sl = n.slides[si];
      if (ed.dataset.f) sl.text = val;
      else if (ed.dataset.i !== undefined) sl.items[+ed.dataset.i] = val;
      else if (ed.dataset.r !== undefined) sl.rows[+ed.dataset.r][+ed.dataset.c] = val.replace(/^[▲▼]\s*/, '');
    });
  }

  function toggleBig() {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return setMsg('Blok kata/kalimat di slide dulu, lalu tekan tombol ini.');
    const r = sel.getRangeAt(0), a = r.commonAncestorContainer, el = a.nodeType === 3 ? a.parentElement : a;
    const ed = el.closest('[contenteditable]');
    if (!ed || !node.current?.contains(ed)) return;
    const big = el.closest('.big');
    if (big) big.replaceWith(...big.childNodes);
    else {
      const sp = document.createElement('span'); sp.className = 'big';
      try { r.surroundContents(sp); } catch { return setMsg('Blok teks dalam satu paragraf saja.'); }
    }
    commit(ed); setV((x) => x + 1); setMsg(`Ukuran diubah (${T.size.emph} = penekanan, ${T.size.body} = standar).`);
  }

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

  const move = (d) => { const j = si + d; if (j < 0 || j >= m.slides.length) return; edit((n) => { [n.slides[si], n.slides[j]] = [n.slides[j], n.slides[si]]; }); setSi(j); setV((x) => x + 1); };
  const del = () => { if (m.slides.length > 1 && confirm('Hapus slide ini?')) { edit((n) => n.slides.splice(si, 1)); setSi(Math.max(0, si - 1)); setV((x) => x + 1); } };
  const fs = (d) => upd((sl) => { sl.fs = (sl.fs || (sl.type === 'cover' ? T.size.cover : sl.type === 'cta' ? T.size.cta : T.size.body)) + d; });

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

      <div id="stage" ref={stage} onBlur={(e) => edit_ && e.target.isContentEditable && commit(e.target)}>
        <Slide key={`${si}-${v}-${mode}`} s={s} i={si} n={m.slides.length} title={m.title} scale={scale} innerRef={node} editable={edit_} />
      </div>
      <div id="strip">
        {m.slides.map((x, i) => (<div key={i} className={'th' + (i === si ? ' on' : '')} onClick={() => setSi(i)}>{(x.text || 'tabel').slice(0, 50)}</div>))}
      </div>
      <div className="row">
        <button disabled={si === 0} onClick={() => setSi(si - 1)}>←</button>
        <button disabled={si === m.slides.length - 1} onClick={() => setSi(si + 1)}>→</button>
        {edit_ && <>
          <button onClick={() => fs(-4)}>A−</button><button onClick={() => fs(4)}>A+</button>
          <button className="pri" onPointerDown={(e) => e.preventDefault()} onClick={toggleBig}>Teks {T.size.emph} ⇄ {T.size.body}</button>
          <button onClick={() => move(-1)}>Geser ◂</button><button onClick={() => move(1)}>▸ Geser</button>
          <button onClick={del}>Hapus</button>
        </>}
      </div>
      <div className="hint">{msg || (edit_ ? 'Klik teks atau sel tabel untuk mengedit. Perubahan tersimpan otomatis.' : 'Hasil jadi. Tekan "Edit konten" kalau perlu mengubah sedikit.')}</div>
      <b>Caption</b>
      <textarea readOnly={!edit_} value={m.caption || ''} onChange={(e) => edit((n) => { n.caption = e.target.value; })} />
      <button onClick={() => navigator.clipboard.writeText(m.caption || '').then(() => setMsg('Caption disalin.'))}>Salin caption</button>
    </div>
  );
}

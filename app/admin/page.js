'use client';
import { useEffect, useState } from 'react';
import { DAYS } from '@/lib/template';
import { listMaterials, saveMaterial, deleteMaterial } from '@/lib/storage';
import { parseHtml, textToHtml, hashOf } from '@/lib/parse';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const mondayOf = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Admin() {
  const [all, setAll] = useState([]);
  const [week, setWeek] = useState('');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => listMaterials().then(setAll);
  useEffect(() => { setWeek(iso(mondayOf(new Date()))); load(); }, []);

  // masukkan hasil baca dokumen: cek duplikat, lalu simpan
  async function importList(list) {
    if (!list.length) return setMsg('Tidak ada materi terbaca. Pastikan baris pertama tiap materi adalah judul.');
    let added = 0, skipped = 0, replaced = 0;
    const cur = await listMaterials();
    let slot = cur.filter((x) => x.week === week).length;
    for (const m of list) {
      const hash = hashOf(m.slides);
      const ex = cur.find((x) => x.title === m.title);
      if (ex && ex.hash === hash) { skipped++; continue; }
      if (ex) {
        if (!confirm(`Materi "${m.title}" sudah ada tetapi isinya berubah.\n\nOK = timpa dengan yang baru\nBatal = lewati`)) { skipped++; continue; }
        await saveMaterial({ ...ex, caption: m.caption, slides: m.slides, hash }); replaced++; continue;
      }
      await saveMaterial({ id: crypto.randomUUID(), title: m.title, caption: m.caption, slides: m.slides, hash, week, day: Math.min(slot + 1, 6), posted: false, createdAt: Date.now() });
      slot++; added++;
    }
    setMsg(`Selesai: ${added} baru, ${replaced} ditimpa, ${skipped} dilewati.`); load();
  }

  async function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    try {
      setMsg('Membaca dokumen…');
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
      await importList(parseHtml(r.value));
    } catch (err) { setMsg('Gagal: ' + err.message); }
    e.target.value = '';
  }
  async function onPaste() {
    if (!text.trim()) return;
    await importList(parseHtml(textToHtml(text))); setText('');
  }

  const upd = async (m, patch) => { await saveMaterial({ ...m, ...patch }); load(); };
  const del = async (m) => { if (confirm(`Hapus "${m.title}"?`)) { await deleteMaterial(m.id); load(); } };

  const weeks = [...new Set(all.map((m) => m.week))].sort().reverse();
  const thisMon = iso(mondayOf(new Date())), todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 20 }}>Carousel Studio · Admin</h1>
      <div className="card" style={{ cursor: 'default' }}>
        <div className="row">
          <label>Paket minggu mulai Senin:&nbsp;<input type="date" value={week} onChange={(e) => setWeek(e.target.value)} style={{ flex: 'none' }} /></label>
          <label className="btn pri">Upload .docx<input type="file" accept=".docx" hidden onChange={onFile} /></label>
        </div>
        <textarea placeholder={'Atau tempel teks materi di sini.\nBaris pertama = judul, "-" atau angka = pembahasan, "|a|b|" atau tab = tabel, lalu CAPTION:'} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row" style={{ marginTop: 8 }}><button onClick={onPaste}>Buat slide dari teks</button></div>
        <div className="hint">{msg}</div>
      </div>

      {weeks.map((w) => {
        const items = all.filter((m) => m.week === w).sort((a, b) => a.day - b.day);
        return (
          <div key={w}>
            <h3>Minggu {fmt(w)}</h3>
            {items.map((m) => (
              <div key={m.id} className={'card' + (w === thisMon && m.day - 1 === todayIdx ? ' today' : '')} style={{ cursor: 'default' }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <select value={m.day} onChange={(e) => upd(m, { day: +e.target.value })}>
                    {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                  </select>
                  <span className={'pill' + (m.posted ? ' ok' : '')}>{m.posted ? 'sudah diposting' : 'belum diposting'}</span>
                  {w === thisMon && m.day - 1 === todayIdx && <span className="pill">hari ini</span>}
                </div>
                <a href={`/admin/m/${m.id}`}><b>{m.title}</b></a> <span className="hint">{m.slides.length} slide</span>
                <div className="row" style={{ marginTop: 8, marginBottom: 0 }}>
                  <a className="btn pri" href={`/admin/m/${m.id}?edit=1`}>✎ Edit</a>
                  <a className="btn" href={`/admin/m/${m.id}?dl=1`}>⬇ Download</a>
                  <button onClick={() => upd(m, { posted: !m.posted })}>{m.posted ? 'Batalkan tanda' : 'Tandai diposting'}</button>
                  <button onClick={() => del(m)}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {!all.length && <div className="hint">Belum ada materi. Upload dokumen Word mingguan atau tempel teks.</div>}
    </div>
  );
}

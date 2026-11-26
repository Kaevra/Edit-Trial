'use client';
import { T, COVER_THEMES } from '@/lib/template';
import { bgFor } from '@/lib/bg';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const rich = (s) => esc(s)
  .replace(/\[\[(\d{1,3}):(.+?)\]\]/g, '<span class="sz" data-size="$1" style="font-size:$1px">$2</span>')
  .replace(/\*\*(.+?)\*\*/g, '<span class="big">$1</span>')
  .replace(/\n/g, '<br>');
const num = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, ''));
// ukuran standar tiap jenis slide (bisa ditimpa s.fs, rentang 1-500)
export const baseSize = (s) => (s.type === 'cover' ? T.size.cover : s.type === 'cta' ? T.size.cta : s.type === 'table' ? T.size.tableTitle : T.size.body);

export default function Slide({ s, i, n, title, scale, innerRef, editable = true, theme = 'green' }) {
  // Foto tampil penuh, apa adanya
  if (s.type === 'image' && s.full) {
    return (
      <div ref={innerRef} className="sl" style={{ width: T.width, height: T.height, background: '#fff', transform: `scale(${scale})` }}>
        <img src={s.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    );
  }

  const cover = s.type === 'cover';
  const th = COVER_THEMES[theme] || COVER_THEMES.green;
  const seed = s.seed ?? (i + 1) * 7919;
  const base = s.fs || (cover ? T.size.cover : s.type === 'cta' ? T.size.cta : T.size.body);
  const A = T.area;

  const E = (f, v, st = {}) => (
    <div className="t" contentEditable={editable} suppressContentEditableWarning data-f={f}
      style={{ fontSize: base, fontFamily: T.fontBody, color: T.colors.body, ...st }}
      dangerouslySetInnerHTML={{ __html: rich(v) }} />
  );

  return (
    <div ref={innerRef} className="sl" style={{
      width: T.width, height: T.height, background: bgFor(cover ? theme : 'body', seed),
      transform: `scale(${scale})`, fontFamily: T.fontBody, color: T.colors.body, overflow: 'hidden',
      '--hl': T.colors.title, '--emph': T.size.emph + 'px',
    }}>
      {/* bayangan lembut di atas footer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: T.footer.height, height: 100, background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.07))' }} />
      <img src={T.logo.src} alt="" style={{ position: 'absolute', left: T.logo.left, top: T.logo.top, width: T.logo.width }} />
      {cover && (
        <div style={{
          position: 'absolute', left: T.button.left, top: T.button.top, width: T.button.width, height: T.button.height,
          borderRadius: 999, background: `linear-gradient(90deg, ${T.button.from}, ${T.button.to})`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 31, fontWeight: 500, fontFamily: T.fontBody,
        }}>{T.button.text}</div>
      )}

      <div style={{ position: 'absolute', left: A.left, right: A.right, top: A.top, bottom: T.height - A.bottom, display: 'flex', flexDirection: 'column' }}>
        {s.type === 'image' ? (
          <>
            <img src={s.image} alt="" style={{ width: '100%', maxHeight: 760, objectFit: 'contain', borderRadius: 24 }} />
            {(s.text || editable) && E('text', s.text, { marginTop: 30, textAlign: 'center', minHeight: 50 })}
          </>
        ) : s.type === 'table' ? (
          <>
            {E('text', s.text, { fontSize: s.fs || T.size.tableTitle, textAlign: 'left', fontWeight: 500, color: T.colors.title })}
            <table style={{ fontSize: s.tfs || (s.rows[0]?.length >= 5 ? 32 : 40), color: T.colors.body }}>
              <tbody>
                {s.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => {
                      let cls = '', txt = c;
                      if (ri > 0 && ci === r.length - 1 && /%$/.test(c) && r.length === 4) {
                        const a = num(r[1]), b = num(r[2]);
                        cls = b < a ? 'dn' : 'up';
                        txt = (b < a ? '▼ ' : '▲ ') + c.replace(/^[^\d]*/, '');
                      }
                      const Tag = ri === 0 ? 'th' : 'td';
                      return (
                        <Tag key={ci} style={{ borderColor: T.colors.line, color: ri === 0 ? T.colors.title : undefined }}>
                          <span className={cls} contentEditable={editable} suppressContentEditableWarning data-r={ri} data-c={ci}>{txt}</span>
                        </Tag>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : s.type === 'list' ? (
          <>
            {s.text && E('text', s.text, { marginBottom: 34, textAlign: 'left' })}
            <ul>
              {s.items.map((x, k) => (
                <li key={k} className="t" contentEditable={editable} suppressContentEditableWarning data-i={k}
                  style={{ fontSize: base, fontFamily: T.fontBody, color: T.colors.body }} dangerouslySetInnerHTML={{ __html: rich(x) }} />
              ))}
            </ul>
          </>
        ) : cover ? (
          E('text', s.text, { color: T.colors.title, textAlign: th.align, lineHeight: 0.9, letterSpacing: '-0.04em', fontFamily: T.fontHead })
        ) : (
          E('text', s.text, { textAlign: 'center', ...(s.type === 'cta' ? { color: T.colors.title } : {}) })
        )}
      </div>

      <img src={T.footer.src} alt="" style={{ position: 'absolute', left: 0, bottom: 0, width: T.width, height: T.footer.height }} />
    </div>
  );
}

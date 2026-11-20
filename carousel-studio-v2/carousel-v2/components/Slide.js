'use client';
import { T } from '@/lib/template';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="big">$1</span>').replace(/\n/g, '<br>');
const num = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, ''));

export default function Slide({ s, i, n, title, scale, innerRef, editable = true }) {
  const base = s.fs || (s.type === 'cover' ? T.size.cover : s.type === 'cta' ? T.size.cta : T.size.body);
  const E = (f, v, st = {}) => (
    <div className="t" contentEditable={editable} suppressContentEditableWarning data-f={f}
      style={{ fontSize: base, fontFamily: s.type === 'cover' || s.type === 'cta' ? T.fontHead : T.fontBody, ...st }}
      dangerouslySetInnerHTML={{ __html: rich(v) }} />
  );
  const cover = s.type === 'cover';
  const bgSrc = cover ? T.bgCover : s.type === 'cta' ? T.bgCta : T.bgBody;
  const rootStyle = {
    width: T.width, height: T.height, padding: T.padding, background: T.bg, color: T.fg,
    fontFamily: T.fontBody, transform: `scale(${scale})`, '--hl': T.accent, '--emph': T.size.emph + 'px',
    ...(bgSrc ? { backgroundImage: `url(${bgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
  };
  return (
    <div ref={innerRef} className="sl" style={rootStyle}>
      {T.logo?.src && <img src={T.logo.src} alt="" style={{ position: 'absolute', top: T.logo.top, right: T.logo.right, width: T.logo.width }} />}
      {T.showTitleTag && <div className="tag" style={{ color: T.accent }}>{title}</div>}
      <div className="main">
        {cover && <div style={{ width: 120, height: 10, background: T.accent, marginBottom: 40 }} />}
        {s.type === 'table' ? (
          <>
            {E('text', s.text, { fontWeight: 700, fontSize: T.size.tableTitle })}
            <table>
              <tbody>
                {s.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => {
                      let cls = '', txt = c;
                      if (ri > 0 && ci === r.length - 1 && /%$/.test(c) && r.length >= 4) {
                        const a = num(r[1]), b = num(r[2]);
                        cls = b < a ? 'dn' : 'up';
                        txt = (b < a ? '▼ ' : '▲ ') + c.replace(/^[^\d]*/, '');
                      }
                      const Tag = ri === 0 ? 'th' : 'td';
                      return (
                        <Tag key={ci} style={{ borderColor: T.line, color: ri === 0 ? T.accent : undefined }}>
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
            {s.text && E('text', s.text, { marginBottom: 34 })}
            <ul>
              {s.items.map((x, k) => (
                <li key={k} className="t" contentEditable={editable} suppressContentEditableWarning data-i={k}
                  style={{ fontSize: base, fontFamily: T.fontBody }} dangerouslySetInnerHTML={{ __html: rich(x) }} />
              ))}
            </ul>
          </>
        ) : (
          E('text', s.text, cover ? { fontWeight: 700, lineHeight: 1.12 } : s.type === 'cta' ? { color: T.accent, fontWeight: 700, textAlign: 'center' } : {})
        )}
      </div>
      <div className="ft" style={{ fontFamily: T.fontBody }}><span>{T.footerText}</span><span>{T.showPageNumber ? `${i + 1} / ${n}` : ''}</span></div>
    </div>
  );
}

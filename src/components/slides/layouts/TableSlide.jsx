import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function TableSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const columns = content.columns ?? []
  const rows = content.rows ?? []
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const textColor = isDark ? '#ddd' : 'var(--ink)'
  const headerBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'var(--hairline)'
  const altBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading" style={{ color: headingColor, fontFamily: font.stack, fontStyle: font.style, fontWeight: font.weight }}>
          {content.title}
        </h2>
      )}
      <div className="slide-table-wrap">
        <table className="slide-table" style={{ borderCollapse: 'collapse', width: '100%', fontFamily: font.bodyStack }}>
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '0.6rem 0.8rem',
                    background: headerBg, borderBottom: `1px solid ${borderColor}`,
                    color: headingColor, fontWeight: 600, fontSize: '0.85em'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : altBg }}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '0.5rem 0.8rem', borderBottom: `1px solid ${borderColor}`,
                    color: textColor, fontSize: '0.85em'
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {content.caption && (
        <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--ink-muted)', fontSize: '0.75em', marginTop: '0.5rem', textAlign: 'center' }}>
          {content.caption}
        </p>
      )}
    </div>
  )
}

import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function KpiSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const textColor = isDark ? '#ddd' : 'var(--ink)'
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'var(--ink-muted)'
  const items = content.items ?? []
  const columns = content.columns ?? Math.min(items.length, 4)

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading" style={{ color: headingColor, fontFamily: font.stack, fontStyle: font.style, fontWeight: font.weight }}>
          {content.title}
        </h2>
      )}
      <div className="slide-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1.5rem',
        width: '100%',
      }}>
        {items.map((item, i) => (
          <div key={i} className="slide-kpi-item" style={{
            textAlign: 'center',
            padding: '1rem',
          }}>
            <div className="slide-kpi-value" style={{
              fontFamily: font.stack,
              fontStyle: font.style,
              fontWeight: 600,
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              color: headingColor,
              lineHeight: 1.1,
              marginBottom: '0.3rem',
            }}>
              {item.value}
            </div>
            <div className="slide-kpi-label" style={{
              fontFamily: font.bodyStack,
              fontSize: '0.85em',
              color: textColor,
              marginBottom: item.note ? '0.2rem' : 0,
            }}>
              {item.label}
            </div>
            {item.note && (
              <div className="slide-kpi-note" style={{
                fontFamily: font.bodyStack,
                fontSize: '0.75em',
                color: mutedColor,
              }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

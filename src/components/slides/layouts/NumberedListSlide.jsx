import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function NumberedListSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const textColor = isDark ? '#ddd' : 'var(--ink)'
  const numColor = isDark ? 'rgba(255,255,255,0.3)' : 'var(--ink-muted)'
  const items = content.items ?? []
  const columns = content.columns ?? 1

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading" style={{ color: headingColor, fontFamily: font.stack, fontStyle: font.style, fontWeight: font.weight, marginBottom: '1rem' }}>
          {content.title}
        </h2>
      )}
      <div className="slide-numbered-grid" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '0.8rem 2rem',
        counterReset: 'numbered-item',
        width: '100%'
      }}>
        {items.map((item, i) => (
          <div key={i} className="slide-numbered-item" style={{
            display: 'flex', gap: '0.7rem', alignItems: 'flex-start',
            counterIncrement: 'numbered-item'
          }}>
            <span className="slide-numbered-num" style={{
              fontFamily: font.stack, fontStyle: font.style, fontWeight: 700,
              fontSize: '1.3em', color: numColor, lineHeight: 1.3, minWidth: '1.5rem',
              textAlign: 'right', flexShrink: 0
            }}>
              {i + 1}.
            </span>
            <span style={{
              fontFamily: font.bodyStack, color: textColor, fontSize: '0.9em', lineHeight: 1.5
            }}>
              {typeof item === 'string' ? item : item.text}
              {typeof item === 'object' && item.note && (
                <span style={{ display: 'block', fontSize: '0.85em', opacity: 0.7, marginTop: '0.15rem' }}>
                  {item.note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

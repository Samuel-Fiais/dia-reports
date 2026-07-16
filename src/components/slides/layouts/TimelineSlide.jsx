import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function TimelineSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const textColor = isDark ? '#ddd' : 'var(--ink)'
  const lineColor = isDark ? 'rgba(255,255,255,0.2)' : 'var(--hairline-strong)'
  const dotColor = isDark ? '#fff' : 'var(--ink)'
  const dateColor = isDark ? 'rgba(255,255,255,0.55)' : 'var(--ink-secondary)'
  const items = content.items ?? []

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading" style={{ color: headingColor, fontFamily: font.stack, fontStyle: font.style, fontWeight: font.weight, marginBottom: '1.5rem' }}>
          {content.title}
        </h2>
      )}
      <div className="slide-timeline" style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div className="slide-timeline-line" style={{
          position: 'absolute', left: '0.5rem', top: 0, bottom: 0,
          width: '2px', background: lineColor, borderRadius: '1px'
        }} />
        {items.map((item, i) => (
          <div key={i} className="slide-timeline-item" style={{
            position: 'relative', marginBottom: i < items.length - 1 ? '1.2rem' : 0,
            paddingLeft: '1.2rem'
          }}>
            <div className="slide-timeline-dot" style={{
              position: 'absolute', left: '-1.65rem', top: '0.35rem',
              width: '10px', height: '10px', borderRadius: '50%',
              background: dotColor, border: `2px solid ${lineColor}`
            }} />
            <div className="slide-timeline-date" style={{
              fontFamily: font.bodyStack, fontSize: '0.78em',
              color: dateColor, fontWeight: 600, marginBottom: '0.15rem'
            }}>
              {item.date}
            </div>
            <div className="slide-timeline-title" style={{
              fontFamily: font.stack, fontStyle: font.style, fontWeight: font.weight,
              color: headingColor, fontSize: '1.05em', marginBottom: '0.15rem'
            }}>
              {item.title}
            </div>
            {item.text && (
              <div className="slide-timeline-text" style={{
                fontFamily: font.bodyStack, color: textColor, fontSize: '0.85em', lineHeight: 1.4
              }}>
                {item.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

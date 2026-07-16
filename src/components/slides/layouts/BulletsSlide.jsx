import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function BulletsSlide({ content, variant, settings }) {
  const cols = content.columns ?? 1
  const items = content.items ?? []
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading" style={{
          color: isDark ? '#fff' : 'var(--ink)',
          fontFamily: font.stack,
          fontStyle: font.style,
          fontWeight: font.weight,
        }}>
          {content.title}
        </h2>
      )}
      {items.length > 0 && (
        <div
          className="slide-bullets-grid"
          style={{ '--bullets-cols': cols, '--bullet-color': isDark ? '#888' : 'var(--ink-muted)' }}
        >
          {items.map((item, i) => (
            <p key={i} className="slide-bullet-item" style={{
              color: isDark ? '#ddd' : 'var(--ink)',
              fontFamily: font.bodyStack,
            }}>
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

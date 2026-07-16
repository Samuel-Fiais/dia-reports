import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function ContentSlide({ content, variant, settings }) {
  const align = content.align ?? 'left'
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]

  return (
    <div className="slide-layout" style={{ textAlign: align, fontSize: scale.size }}>
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
      {content.text && (
        <p className="slide-text" style={{
          color: isDark ? '#ddd' : 'var(--ink)',
          fontFamily: font.bodyStack,
        }}>
          {content.text}
        </p>
      )}
    </div>
  )
}

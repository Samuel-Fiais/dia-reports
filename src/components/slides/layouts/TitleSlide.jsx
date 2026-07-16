import { COLORS, COLORS_DARK, FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function TitleSlide({ content, theme, variant, settings }) {
  const isDark = variant !== 'detail'
  const idx = theme?.colorIndex ?? settings?.colorIndex ?? 0
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const bg = isDark ? (COLORS_DARK[idx] ?? '#1a1a1a') : (COLORS[idx] ?? '#f7f5e9')
  const textColor = isDark ? '#fff' : 'var(--ink)'
  const secColor = isDark ? 'rgba(255,255,255,0.7)' : 'var(--ink-secondary)'
  const dateColor = isDark ? 'rgba(255,255,255,0.5)' : 'var(--ink-muted)'

  return (
    <div className="slide-layout slide-title-layout" style={{ backgroundColor: bg }}>
      <div className="slide-title-content">
        <h1 className="slide-main-title" style={{
          color: textColor,
          fontFamily: font.stack,
          fontStyle: font.style,
          fontWeight: font.weight,
          fontSize: scale.size,
        }}>{content.title}</h1>
        {content.subtitle && <p className="slide-subtitle" style={{ color: secColor }}>{content.subtitle}</p>}
      </div>
      {content.date && <span className="slide-date" style={{ color: dateColor }}>{content.date}</span>}
    </div>
  )
}

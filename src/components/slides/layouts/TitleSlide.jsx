import { COLORS, COLORS_DARK } from '../../../lib/theme.js'

export default function TitleSlide({ content, theme, variant }) {
  const isDark = variant !== 'detail'
  const idx = theme?.colorIndex ?? 0
  const bg = isDark ? (COLORS_DARK[idx] ?? '#1a1a1a') : (COLORS[idx] ?? '#f7f5e9')
  const textColor = isDark ? '#fff' : 'var(--ink)'
  const secColor = isDark ? 'rgba(255,255,255,0.7)' : 'var(--ink-secondary)'
  const dateColor = isDark ? 'rgba(255,255,255,0.5)' : 'var(--ink-muted)'

  return (
    <div className="slide-layout slide-title-layout" style={{ backgroundColor: bg }}>
      <div className="slide-title-content">
        <h1 className="slide-main-title" style={{ color: textColor }}>{content.title}</h1>
        {content.subtitle && <p className="slide-subtitle" style={{ color: secColor }}>{content.subtitle}</p>}
      </div>
      {content.date && <span className="slide-date" style={{ color: dateColor }}>{content.date}</span>}
    </div>
  )
}

import { COLORS_DARK } from '../../../lib/theme.js'

export default function SectionSlide({ content, theme }) {
  const bg = COLORS_DARK[theme?.colorIndex ?? 0] ?? '#1a1a1a'

  return (
    <div className="slide-layout slide-section-layout" style={{ backgroundColor: bg }}>
      <div className="slide-section-content">
        <h1 className="slide-main-title" style={{ color: '#fff' }}>{content.title}</h1>
        {content.subtitle && <p className="slide-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>{content.subtitle}</p>}
      </div>
    </div>
  )
}

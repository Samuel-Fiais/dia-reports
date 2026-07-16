import { COLORS_DARK } from '../../../lib/theme.js'

export default function TitleSlide({ content, theme }) {
  const bg = COLORS_DARK[theme?.colorIndex ?? 0] ?? '#1a1a1a'

  return (
    <div className="slide-layout slide-title-layout" style={{ backgroundColor: bg }}>
      <div className="slide-title-content">
        <h1 className="slide-main-title">{content.title}</h1>
        {content.subtitle && <p className="slide-subtitle">{content.subtitle}</p>}
      </div>
      {content.date && <span className="slide-date">{content.date}</span>}
    </div>
  )
}

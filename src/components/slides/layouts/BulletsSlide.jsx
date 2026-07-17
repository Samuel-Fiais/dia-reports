import { toSlideText } from '../../../lib/slideText.js'

export default function BulletsSlide({ content, themeStyle }) {
  const cols = content.columns ?? 1
  const items = content.items ?? []

  return (
    <div className="slide-layout" style={themeStyle}>
      {content.title && <h2 className="slide-heading">{content.title}</h2>}
      {items.length > 0 && (
        <div className="slide-bullets-grid" style={{ '--bullets-cols': cols }}>
          {items.map((item, i) => (
            <p key={i} className="slide-bullet-item">{toSlideText(item)}</p>
          ))}
        </div>
      )}
    </div>
  )
}

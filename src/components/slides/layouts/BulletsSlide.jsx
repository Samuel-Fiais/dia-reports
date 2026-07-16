export default function BulletsSlide({ content }) {
  const cols = content.columns ?? 1
  const items = content.items ?? []

  return (
    <div className="slide-layout">
      {content.title && <h2 className="slide-heading">{content.title}</h2>}
      {items.length > 0 && (
        <div
          className="slide-bullets-grid"
          style={{ '--bullets-cols': cols }}
        >
          {items.map((item, i) => (
            <p key={i} className="slide-bullet-item">{item}</p>
          ))}
        </div>
      )}
    </div>
  )
}

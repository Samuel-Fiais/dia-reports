export default function BulletsSlide({ content, variant }) {
  const cols = content.columns ?? 1
  const items = content.items ?? []
  const isDark = variant !== 'detail'

  return (
    <div className="slide-layout">
      {content.title && (
        <h2 className="slide-heading" style={{ color: isDark ? '#fff' : 'var(--ink)' }}>
          {content.title}
        </h2>
      )}
      {items.length > 0 && (
        <div
          className="slide-bullets-grid"
          style={{ '--bullets-cols': cols, '--bullet-color': isDark ? '#888' : 'var(--ink-muted)' }}
        >
          {items.map((item, i) => (
            <p key={i} className="slide-bullet-item" style={{ color: isDark ? '#ddd' : 'var(--ink)' }}>
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

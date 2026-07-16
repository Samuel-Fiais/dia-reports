export default function ContentSlide({ content, variant }) {
  const align = content.align ?? 'left'
  const isDark = variant !== 'detail'

  return (
    <div className="slide-layout" style={{ textAlign: align }}>
      {content.title && (
        <h2 className="slide-heading" style={{ color: isDark ? '#fff' : 'var(--ink)' }}>
          {content.title}
        </h2>
      )}
      {content.text && (
        <p className="slide-text" style={{ color: isDark ? '#ddd' : 'var(--ink)' }}>
          {content.text}
        </p>
      )}
    </div>
  )
}

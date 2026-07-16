export default function ContentSlide({ content }) {
  const align = content.align ?? 'left'

  return (
    <div className="slide-layout" style={{ textAlign: align }}>
      {content.title && <h2 className="slide-heading">{content.title}</h2>}
      {content.text && <p className="slide-text">{content.text}</p>}
    </div>
  )
}

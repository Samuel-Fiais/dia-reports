export default function ImageSlide({ content }) {
  return (
    <div className="slide-layout slide-image-layout">
      <img
        className="slide-full-image"
        src={content.src}
        alt={content.alt ?? ''}
      />
      {content.caption && (
        <span className="slide-image-caption">{content.caption}</span>
      )}
    </div>
  )
}

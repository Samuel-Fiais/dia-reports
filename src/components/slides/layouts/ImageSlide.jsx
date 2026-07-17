export default function ImageSlide({ content, themeStyle }) {
  return (
    <div className="slide-layout slide-image-layout" style={themeStyle}>
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

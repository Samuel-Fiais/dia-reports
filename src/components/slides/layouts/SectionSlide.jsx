export default function SectionSlide({ content, themeStyle }) {
  return (
    <div className="slide-layout slide-section-layout" style={themeStyle}>
      <div className="slide-section-content">
        <h1 className="slide-main-title">{content.title}</h1>
        {content.subtitle && <p className="slide-subtitle">{content.subtitle}</p>}
      </div>
    </div>
  )
}

export default function TitleSlide({ content, themeStyle }) {
  return (
    <div className="slide-layout slide-title-layout" style={themeStyle}>
      <div className="slide-title-content">
        <h1 className="slide-main-title">{content.title}</h1>
        {content.subtitle && <p className="slide-subtitle">{content.subtitle}</p>}
      </div>
      {content.date && <span className="slide-date">{content.date}</span>}
    </div>
  )
}

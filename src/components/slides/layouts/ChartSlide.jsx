import ChartBlock from '../../ChartBlock.jsx'

export default function ChartSlide({ content, themeStyle, chartStyleIndex }) {
  return (
    <div className="slide-layout" style={themeStyle}>
      {content.title && <h2 className="slide-heading">{content.title}</h2>}
      <div className="slide-chart-wrap">
        <ChartBlock block={content.chart ?? {}} chartStyleIndex={chartStyleIndex} />
      </div>
    </div>
  )
}

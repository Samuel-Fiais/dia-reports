import TitleSlide from './layouts/TitleSlide.jsx'
import BulletsSlide from './layouts/BulletsSlide.jsx'
import ContentSlide from './layouts/ContentSlide.jsx'
import TwoColumnsSlide from './layouts/TwoColumnsSlide.jsx'
import SectionSlide from './layouts/SectionSlide.jsx'
import ChartSlide from './layouts/ChartSlide.jsx'
import ImageSlide from './layouts/ImageSlide.jsx'
import TableSlide from './layouts/TableSlide.jsx'
import QuoteSlide from './layouts/QuoteSlide.jsx'
import KpiSlide from './layouts/KpiSlide.jsx'
import TimelineSlide from './layouts/TimelineSlide.jsx'
import ImageTextSlide from './layouts/ImageTextSlide.jsx'
import NumberedListSlide from './layouts/NumberedListSlide.jsx'
import ReportBlockSlide from './layouts/ReportBlockSlide.jsx'

const LAYOUTS = {
  'title': TitleSlide,
  'bullets': BulletsSlide,
  'content': ContentSlide,
  'two-columns': TwoColumnsSlide,
  'section': SectionSlide,
  'chart': ChartSlide,
  'image-full': ImageSlide,
  'table': TableSlide,
  'quote': QuoteSlide,
  'kpi': KpiSlide,
  'timeline': TimelineSlide,
  'image-text': ImageTextSlide,
  'numbered-list': NumberedListSlide,
  'report-block': ReportBlockSlide,
}

export default function SlideRenderer({ slide, theme, variant = 'viewer', settings }) {
  const Component = LAYOUTS[slide.layout]
  if (!Component) {
    return (
      <div className="slide-layout">
        <p className="slide-text">Layout desconhecido: {slide.layout}</p>
      </div>
    )
  }
  return <Component content={slide.content} theme={theme} variant={variant} settings={settings} />
}

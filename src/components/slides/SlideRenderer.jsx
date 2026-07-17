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
import BlocksSlide from './layouts/BlocksSlide.jsx'
import { slideThemeOverride } from '../../lib/theme.js'
import { useAppTheme } from '../../context/ThemeContext.jsx'

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
  'blocks': BlocksSlide,
}

/* A aparência geral (claro/escuro, fonte, tamanho, cor padrão) vem do :root
   — aplicada uma vez por página via applyTheme, exatamente como um relatório
   — e chega aqui através de `theme` (deck + ajustes do leitor). Um slide só
   se destaca disso quando tem seu próprio `theme.colorIndex`/`fontIndex`,
   caso em que aplicamos um override local só com essas propriedades. */
export default function SlideRenderer({ slide, theme = {}, variant = 'viewer' }) {
  const { appTheme } = useAppTheme()
  const Component = LAYOUTS[slide.layout]
  const chartStyleIndex = slide.theme?.chartStyleIndex ?? theme.chartStyleIndex ?? 2
  const themeStyle = slideThemeOverride(slide.theme ?? {}, appTheme)

  if (!Component) {
    return (
      <div className="slide-layout" style={themeStyle}>
        <p className="slide-text">Layout desconhecido: {slide.layout}</p>
      </div>
    )
  }
  return (
    <Component
      content={slide.content}
      themeStyle={themeStyle}
      chartStyleIndex={chartStyleIndex}
      variant={variant}
    />
  )
}

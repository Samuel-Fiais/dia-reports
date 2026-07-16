import TitleSlide from './layouts/TitleSlide.jsx'
import BulletsSlide from './layouts/BulletsSlide.jsx'
import ContentSlide from './layouts/ContentSlide.jsx'
import TwoColumnsSlide from './layouts/TwoColumnsSlide.jsx'
import SectionSlide from './layouts/SectionSlide.jsx'
import ChartSlide from './layouts/ChartSlide.jsx'
import ImageSlide from './layouts/ImageSlide.jsx'

const LAYOUTS = {
  'title': TitleSlide,
  'bullets': BulletsSlide,
  'content': ContentSlide,
  'two-columns': TwoColumnsSlide,
  'section': SectionSlide,
  'chart': ChartSlide,
  'image-full': ImageSlide,
}

export default function SlideRenderer({ slide, theme }) {
  const Component = LAYOUTS[slide.layout]
  if (!Component) {
    return (
      <div className="slide-layout">
        <p className="slide-text">Layout desconhecido: {slide.layout}</p>
      </div>
    )
  }
  return <Component content={slide.content} theme={theme} />
}

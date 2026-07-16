import { Suspense } from 'react'
import { FONTS, FONT_SCALES } from '../../../lib/theme.js'
import { ItemBlock } from '../../blocks/index.jsx'

export default function ReportBlockSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const blocks = content.blocks ?? [content.block].filter(Boolean)
  const chartStyleIndex = settings?.chartStyleIndex ?? 2

  return (
    <div className="slide-layout" style={{
      fontSize: scale.size,
      overflow: 'auto',
      padding: content.compact ? '1rem 1.5rem' : undefined,
    }}>
      {content.title && (
        <h2 className="slide-heading" style={{
          color: headingColor,
          fontFamily: font.stack,
          fontStyle: font.style,
          fontWeight: font.weight,
          marginBottom: '0.75rem',
        }}>
          {content.title}
        </h2>
      )}
      <div className="slide-report-blocks" style={{ width: '100%' }}>
        <Suspense fallback={<p style={{ color: headingColor }}>Carregando...</p>}>
          {blocks.map((block, i) => (
            <ItemBlock
              key={i}
              block={block}
              chartStyleIndex={chartStyleIndex}
              blockKey={`slide:${i}`}
            />
          ))}
        </Suspense>
      </div>
    </div>
  )
}

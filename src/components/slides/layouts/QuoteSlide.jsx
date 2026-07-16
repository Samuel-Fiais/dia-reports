import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function QuoteSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const textColor = isDark ? '#eee' : 'var(--ink)'
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'var(--hairline-strong)'
  const citeColor = isDark ? 'rgba(255,255,255,0.55)' : 'var(--ink-secondary)'

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      <div className="slide-quote-wrap" style={{
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: '2rem',
        maxWidth: '85%',
      }}>
        <blockquote className="slide-quote-text" style={{
          fontFamily: font.stack,
          fontStyle: 'italic',
          fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
          color: textColor,
          margin: 0,
          lineHeight: 1.4,
        }}>
          {content.text}
        </blockquote>
        {content.cite && (
          <cite style={{
            display: 'block',
            marginTop: '1rem',
            fontFamily: font.bodyStack,
            fontStyle: 'normal',
            fontSize: '0.85em',
            color: citeColor,
          }}>
            {content.cite}
            {content.role && <span style={{ opacity: 0.7 }}> &middot; {content.role}</span>}
          </cite>
        )}
      </div>
    </div>
  )
}

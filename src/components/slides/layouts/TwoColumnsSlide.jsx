import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function TwoColumnsSlide({ content, variant, settings }) {
  const ratio = content.ratio ?? '50/50'
  const [leftPct, rightPct] = ratio.split('/').map(Number)
  const total = leftPct + rightPct
  const leftFlex = (leftPct / total) * 100
  const rightFlex = (rightPct / total) * 100
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const textColor = isDark ? '#ddd' : 'var(--ink)'
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const dividerBg = isDark ? 'rgba(255,255,255,0.15)' : 'var(--hairline)'

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading slide-heading--full" style={{
          color: headingColor,
          fontFamily: font.stack,
          fontStyle: font.style,
          fontWeight: font.weight,
        }}>{content.title}</h2>
      )}
      <div className="slide-two-cols">
        <div className="slide-col" style={{ flex: leftFlex }}>
          {content.left?.title && (
            <h3 className="slide-col-title" style={{
              color: headingColor,
              fontFamily: font.stack,
              fontStyle: font.style,
              fontWeight: font.weight,
            }}>{content.left.title}</h3>
          )}
          {content.left?.items?.map((item, i) => (
            <p key={i} className="slide-bullet-item" style={{ color: textColor, fontFamily: font.bodyStack }}>{item}</p>
          ))}
          {content.left?.text && <p className="slide-text" style={{ color: textColor, fontFamily: font.bodyStack }}>{content.left.text}</p>}
        </div>
        <div className="slide-col-divider" style={{ background: dividerBg }} />
        <div className="slide-col" style={{ flex: rightFlex }}>
          {content.right?.title && (
            <h3 className="slide-col-title" style={{
              color: headingColor,
              fontFamily: font.stack,
              fontStyle: font.style,
              fontWeight: font.weight,
            }}>{content.right.title}</h3>
          )}
          {content.right?.items?.map((item, i) => (
            <p key={i} className="slide-bullet-item" style={{ color: textColor, fontFamily: font.bodyStack }}>{item}</p>
          ))}
          {content.right?.text && <p className="slide-text" style={{ color: textColor, fontFamily: font.bodyStack }}>{content.right.text}</p>}
        </div>
      </div>
    </div>
  )
}

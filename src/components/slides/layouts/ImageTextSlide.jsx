import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

export default function ImageTextSlide({ content, variant, settings }) {
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const headingColor = isDark ? '#fff' : 'var(--ink)'
  const textColor = isDark ? '#ddd' : 'var(--ink)'
  const captionColor = isDark ? 'rgba(255,255,255,0.5)' : 'var(--ink-muted)'
  const side = content.side ?? 'right'
  const ratio = content.ratio ?? '40/60'

  return (
    <div className="slide-layout" style={{ fontSize: scale.size, padding: content.compact ? '1.5rem 2rem' : undefined }}>
      {content.title && (
        <h2 className="slide-heading" style={{ color: headingColor, fontFamily: font.stack, fontStyle: font.style, fontWeight: font.weight, marginBottom: '1rem' }}>
          {content.title}
        </h2>
      )}
      <div className="slide-imagetext" style={{
        display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1,
        flexDirection: side === 'left' ? 'row' : 'row-reverse'
      }}>
        <div className="slide-imagetext-img" style={{
          flex: side === 'left' ? ratio.split('/')[0] : ratio.split('/')[1],
          minWidth: 0
        }}>
          <img src={content.src} alt={content.alt ?? ''} style={{
            width: '100%', height: 'auto', borderRadius: '6px',
            maxHeight: content.compact ? '30vh' : '50vh', objectFit: 'cover'
          }} />
          {content.caption && (
            <p style={{ fontFamily: font.bodyStack, fontSize: '0.72em', color: captionColor, marginTop: '0.3rem', textAlign: 'center' }}>
              {content.caption}
            </p>
          )}
        </div>
        <div className="slide-imagetext-text" style={{
          flex: side === 'left' ? ratio.split('/')[1] : ratio.split('/')[0],
          fontFamily: font.bodyStack, color: textColor, fontSize: '0.92em', lineHeight: 1.6
        }}>
          {content.text}
        </div>
      </div>
    </div>
  )
}

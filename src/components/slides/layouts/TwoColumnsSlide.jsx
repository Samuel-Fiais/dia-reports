import { toSlideText } from '../../../lib/slideText.js'

export default function TwoColumnsSlide({ content, themeStyle }) {
  const ratio = content.ratio ?? '50/50'
  const [leftPct, rightPct] = ratio.split('/').map(Number)
  const total = leftPct + rightPct
  const leftFlex = (leftPct / total) * 100
  const rightFlex = (rightPct / total) * 100

  return (
    <div className="slide-layout" style={themeStyle}>
      {content.title && <h2 className="slide-heading slide-heading--full">{content.title}</h2>}
      <div className="slide-two-cols">
        <div className="slide-col" style={{ flex: leftFlex }}>
          {content.left?.title && <h3 className="slide-col-title">{content.left.title}</h3>}
          {content.left?.items?.map((item, i) => (
            <p key={i} className="slide-bullet-item">{toSlideText(item)}</p>
          ))}
          {content.left?.text && <p className="slide-text">{content.left.text}</p>}
        </div>
        <div className="slide-col-divider" />
        <div className="slide-col" style={{ flex: rightFlex }}>
          {content.right?.title && <h3 className="slide-col-title">{content.right.title}</h3>}
          {content.right?.items?.map((item, i) => (
            <p key={i} className="slide-bullet-item">{toSlideText(item)}</p>
          ))}
          {content.right?.text && <p className="slide-text">{content.right.text}</p>}
        </div>
      </div>
    </div>
  )
}

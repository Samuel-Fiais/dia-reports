import { renderInline } from '../lib/inline.jsx'
import { useModal } from './Modal.jsx'

export default function Board({ block }) {
  const { openModal } = useModal()
  const compact = block.presentation === 'compact'

  const open = (item) => {
    if (item.details) {
      openModal(item.details)
      return
    }
    if (item.text || item.fields?.length > 0) {
      openModal({
        eyebrow: block.detailLabel,
        title: item.title,
        text: item.text,
        fields: item.fields,
      })
    }
  }

  return (
    <div className={`board${compact ? ' board--compact' : ''}`}>
      {(block.columns ?? []).map((column, columnIndex) => (
        <div key={column.id ?? columnIndex} className="board-column">
          <div className="board-column-head">
            <span>{column.title}</span>
            <span className="board-count">{(column.items ?? []).length}</span>
          </div>
          <div className="board-items">
            {(column.items ?? []).map((item, itemIndex) => {
              const interactive = Boolean(item.details || item.text || item.fields?.length)
              return (
                <div
                  key={item.id ?? itemIndex}
                  className={`board-item${interactive ? ' clickable' : ''}`}
                  onClick={interactive ? () => open(item) : undefined}
                  onKeyDown={interactive ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      open(item)
                    }
                  } : undefined}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : undefined}
                >
                  <div className="board-item-title">{renderInline(item.title)}</div>
                  {!compact && item.text && (
                    <p className="board-item-text">{renderInline(item.text)}</p>
                  )}
                  {(item.badge || item.meta) && (
                    <div className="board-item-meta">
                      {item.badge && <span className="board-item-badge">{item.badge}</span>}
                      {!compact && item.meta && <span className="board-item-detail">{item.meta}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

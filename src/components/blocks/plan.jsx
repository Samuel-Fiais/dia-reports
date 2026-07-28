import { renderInline } from '../../lib/inline.jsx'
import { StatusBadge } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'

export function Timeline({ block }) {
  const { openModal } = useModal()
  return (
    <ol className={`timeline milestones${block.presentation === 'compact' ? ' milestones--compact' : ''}`}>
      {(block.items ?? []).map((item, index) => (
        <li
          key={item.id ?? index}
          className={`timeline-item${item.state ? ` milestone--${item.state}` : ''}${item.details ? ' clickable' : ''}`}
          onClick={item.details ? () => openModal(item.details) : undefined}
          onKeyDown={item.details ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal(item.details)
            }
          } : undefined}
          role={item.details ? 'button' : undefined}
          tabIndex={item.details ? 0 : undefined}
        >
          <div className="milestone-head">
            {item.date && <span className="timeline-date">{item.date}</span>}
            {item.state && <StatusBadge status={item.state} />}
          </div>
          {item.title && <div className="timeline-title">{renderInline(item.title)}</div>}
          {item.text && <p className="timeline-text">{renderInline(item.text)}</p>}
        </li>
      ))}
    </ol>
  )
}

export function ProgressSummary({ block }) {
  const percentage = Math.max(0, Math.min(100, Number(block.progress) || 0))
  return (
    <div className="progress-summary">
      <div className="progress-summary-value">
        <div className="progress-head">
          {block.label && <span className="progress-label">{block.label}</span>}
          <span className="progress-value">{percentage}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>
      {(block.groups ?? []).map((group, groupIndex) => group.items?.length > 0 && (
        <div key={group.id ?? group.label ?? groupIndex} className="progress-summary-group">
          {group.label && <div className="group-label">{group.label}</div>}
          <ul className="item-bullets">
            {group.items.map((item, itemIndex) => (
              <li key={item.id ?? itemIndex}>{renderInline(item.text ?? item)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function GroupedChangeList({ block }) {
  return (
    <div className="grouped-change-list">
      {(block.groups ?? []).map((group, groupIndex) => (
        <div key={group.id ?? group.label ?? groupIndex} className="change-group">
          <div className="change-group-head">
            {group.label && <span className="change-group-label">{group.label}</span>}
            {group.date && <span className="change-group-date">{group.date}</span>}
          </div>
          <ul className="change-group-items">
            {(group.items ?? []).map((item, itemIndex) => {
              const change = typeof item === 'string' ? { text: item } : item
              return (
                <li key={change.id ?? itemIndex}>
                  {change.label && (
                    <span className={`change-label${change.tone ? ` change-label--${change.tone}` : ''}`}>
                      {change.label}
                    </span>
                  )}
                  {renderInline(change.text)}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

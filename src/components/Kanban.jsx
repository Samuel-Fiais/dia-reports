import { renderInline } from '../lib/inline.jsx'
import { PriorityBadge } from './Badges.jsx'
import { useModal } from './Modal.jsx'

/* Kanban com cartões ricos: descrição, responsável, prazo, prioridade e tag.
   Cartões com `details` abrem um modal com os dados completos. */
export default function Kanban({ block }) {
  const { openModal } = useModal()
  const compact = block.variant === 'compact'

  const open = (card) => {
    if (card.details) return openModal(card.details)
    if (block.clickable === false) return
    const fields = [
      card.assignee && { label: 'Responsável', value: card.assignee },
      card.due && { label: 'Prazo', value: card.due },
      card.tag && { label: 'Tag', value: card.tag },
    ].filter(Boolean)
    if (card.description || fields.length > 0) {
      openModal({ eyebrow: 'Cartão', title: card.title, text: card.description, fields })
    }
  }

  return (
    <div className={`kanban${compact ? ' kanban--compact' : ''}`}>
      {(block.columns ?? []).map((col, i) => (
        <div key={i} className="kanban-column">
          <div className="kanban-column-head">
            <span>{col.title}</span>
            <span className="kanban-count">{(col.cards ?? []).length}</span>
          </div>
          <div className="kanban-cards">
            {(col.cards ?? []).map((card, j) => {
              const hasDetail = card.details || card.description || card.assignee || card.due
              return (
                <div
                  key={j}
                  className={`kanban-card${hasDetail && block.clickable !== false ? ' clickable' : ''}`}
                  onClick={() => open(card)}
                >
                  <div className="kanban-card-title">{renderInline(card.title)}</div>
                  {!compact && card.description && (
                    <p className="kanban-card-desc">{renderInline(card.description)}</p>
                  )}
                  {(card.tag || card.priority || card.assignee || card.due) && (
                    <div className="kanban-card-meta">
                      {card.tag && <span className="kanban-card-tag">{card.tag}</span>}
                      {card.priority && <PriorityBadge priority={card.priority} />}
                      {!compact && card.due && <span className="kanban-card-due">{card.due}</span>}
                      {!compact && card.assignee && (
                        <span className="kanban-card-assignee" title={card.assignee}>
                          {String(card.assignee)
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                      )}
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

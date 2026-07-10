import { renderInline } from '../lib/inline.jsx'
import { useModal } from './Modal.jsx'

/* Agenda do dia. Linhas com `details` (ou campos extras) abrem modal. */
export default function Agenda({ block }) {
  const { openModal } = useModal()

  const open = (item) => {
    if (item.details) return openModal(item.details)
    if (block.clickable === false) return
    const fields = [
      item.time && { label: 'Horário', value: item.time },
      item.location && { label: 'Local', value: item.location },
      item.participants && { label: 'Participantes', value: [].concat(item.participants).join(', ') },
    ].filter(Boolean)
    if (item.text || fields.length > 1) {
      openModal({ eyebrow: 'Evento', title: item.title, text: item.text, fields })
    }
  }

  return (
    <ul className="agenda-list">
      {(block.items ?? []).map((item, i) => {
        const hasDetail = block.clickable !== false && (item.details || item.text || item.location || item.participants)
        return (
          <li
            key={i}
            className={`agenda-row${item.active ? ' agenda-row--active' : ''}${hasDetail ? ' clickable' : ''}`}
            onClick={hasDetail ? () => open(item) : undefined}
          >
            <span className="agenda-time">{item.time}</span>
            <div className="agenda-body">
              <span className="agenda-title">{renderInline(item.title)}</span>
              {item.text && <p className="agenda-desc">{renderInline(item.text)}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

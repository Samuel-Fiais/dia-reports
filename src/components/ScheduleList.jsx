import { renderInline } from '../lib/inline.jsx'
import { useModal } from './Modal.jsx'

export default function ScheduleList({ block }) {
  const { openModal } = useModal()

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
    <ul className="schedule-list">
      {(block.items ?? []).map((item, index) => {
        const interactive = Boolean(item.details || item.text || item.fields?.length)
        return (
          <li
            key={item.id ?? index}
            className={`schedule-list-item${item.active ? ' schedule-list-item--active' : ''}${interactive ? ' clickable' : ''}`}
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
            {item.time && <span className="schedule-list-time">{item.time}</span>}
            <div className="schedule-list-body">
              <span className="schedule-list-title">{renderInline(item.title)}</span>
              {item.text && <p className="schedule-list-text">{renderInline(item.text)}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

import { renderInline } from '../lib/inline.jsx'
import { blockLabel } from '../lib/labels.js'
import { useModal } from './Modal.jsx'

export default function CalendarWeek({ block }) {
  const { openModal } = useModal()

  return (
    <div className="calendar-week">
      {(block.items ?? []).map((day, i) => (
        <div key={day.id ?? i} className={`calendar-week-day${day.active ? ' calendar-week-day--active' : ''}`}>
          <div className="calendar-week-day-label">{day.label}</div>
          <ul className="calendar-week-items">
            {(day.items ?? []).map((item, j) => {
              const clickable = block.clickable !== false && (item.details || item.text)
              return (
                <li
                  key={item.id ?? j}
                  className={clickable ? 'clickable' : undefined}
                  onClick={
                    clickable
                      ? () =>
                          openModal(
                            item.details ?? {
                              eyebrow: day.label,
                              title: item.title,
                              text: item.text,
                              fields: item.time
                                ? [{ label: blockLabel(block, 'time', 'Horário'), value: item.time }]
                                : undefined,
                            },
                          )
                      : undefined
                  }
                  onKeyDown={clickable ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      event.currentTarget.click()
                    }
                  } : undefined}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                >
                  {item.time && <span className="calendar-week-time">{item.time}</span>}
                  {renderInline(item.title)}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

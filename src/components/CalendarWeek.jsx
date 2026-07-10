import { renderInline } from '../lib/inline.jsx'
import { useModal } from './Modal.jsx'

/* Calendário semanal: 7 colunas (ou `days` customizado). Itens podem ser
   strings ou objetos { title, time?, details? } — objetos com detalhe abrem modal. */
export default function CalendarWeek({ block }) {
  const { openModal } = useModal()

  return (
    <div className="calendar-week">
      {(block.days ?? []).map((day, i) => (
        <div key={i} className={`calendar-week-day${day.active ? ' calendar-week-day--active' : ''}`}>
          <div className="calendar-week-day-label">{day.label}</div>
          <ul className="calendar-week-items">
            {(day.items ?? []).map((raw, j) => {
              const item = typeof raw === 'string' ? { title: raw } : raw
              const clickable = block.clickable !== false && (item.details || item.text)
              return (
                <li
                  key={j}
                  className={clickable ? 'clickable' : undefined}
                  onClick={
                    clickable
                      ? () =>
                          openModal(
                            item.details ?? {
                              eyebrow: day.label,
                              title: item.title,
                              text: item.text,
                              fields: item.time ? [{ label: 'Horário', value: item.time }] : undefined,
                            },
                          )
                      : undefined
                  }
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

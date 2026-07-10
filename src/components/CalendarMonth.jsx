import { buildMonthGrid, WEEKDAYS_PT, MONTHS_PT } from '../lib/calendar.js'
import { renderInline } from '../lib/inline.jsx'
import { useModal } from './Modal.jsx'

/* Calendário mensal em estilo clássico: grade com linhas finas, número do dia
   no canto e eventos dentro das células. Variantes:
   - "detailed" (padrão): células altas com eventos visíveis
   - "compact": grade pequena só com marcações (pontos)
   Eventos: [{ date: "YYYY-MM-DD", title, time?, details? }].
   Clicar em um dia com eventos abre um modal com a lista completa.
   (`marks` do formato antigo continua aceito como atalho.) */
export default function CalendarMonth({ block }) {
  const { openModal } = useModal()
  const cells = buildMonthGrid(block.month)
  const [y, m] = block.month.split('-').map(Number)
  const compact = block.variant === 'compact'

  const events = [
    ...(block.events ?? []),
    ...(block.marks ?? []).map((mark) =>
      typeof mark === 'string' ? { date: mark, title: '' } : { date: mark.date, title: mark.label ?? '' },
    ),
  ]
  const byDay = new Map()
  for (const ev of events) {
    if (!byDay.has(ev.date)) byDay.set(ev.date, [])
    byDay.get(ev.date).push(ev)
  }

  const title = block.title ?? `${MONTHS_PT[m - 1]} ${y}`
  const weekdays = compact ? WEEKDAYS_PT.map((w) => w[0]) : WEEKDAYS_PT

  const openDay = (cell) => {
    const dayEvents = byDay.get(cell.iso) ?? []
    if (dayEvents.length === 0 || block.clickable === false) return
    if (dayEvents.length === 1 && dayEvents[0].details) return openModal(dayEvents[0].details)
    openModal({
      eyebrow: title,
      title: `Dia ${cell.day}`,
      blocks: [
        {
          type: 'agenda',
          clickable: false,
          items: dayEvents.map((ev) => ({ time: ev.time ?? '—', title: ev.title || 'Evento', text: ev.text })),
        },
      ],
    })
  }

  return (
    <div className={`calendar-month${compact ? ' calendar-month--compact' : ''}`}>
      <div className="calendar-month-head">{title}</div>
      <div className="calendar-grid">
        {weekdays.map((w, i) => (
          <span key={i} className="calendar-weekday">{w}</span>
        ))}
        {cells.map((cell, i) => {
          const dayEvents = cell.iso ? byDay.get(cell.iso) ?? [] : []
          const has = dayEvents.length > 0
          const isToday = cell.iso === block.today
          return (
            <div
              key={i}
              className={[
                'calendar-cell',
                cell.inMonth ? '' : 'calendar-cell--muted',
                has ? 'calendar-cell--has-events' : '',
                isToday ? 'calendar-cell--today' : '',
                has && block.clickable !== false ? 'clickable' : '',
              ].filter(Boolean).join(' ')}
              onClick={has ? () => openDay(cell) : undefined}
            >
              <span className="calendar-cell-day">{cell.day}</span>
              {compact
                ? has && <span className="calendar-cell-dot" />
                : dayEvents.slice(0, block.maxPerDay ?? 2).map((ev, j) => (
                    <span key={j} className="calendar-event-chip" title={ev.title}>
                      {ev.time && <span className="calendar-event-time">{ev.time}</span>}
                      {renderInline(ev.title || '•')}
                    </span>
                  ))}
              {!compact && dayEvents.length > (block.maxPerDay ?? 2) && (
                <span className="calendar-event-more">+{dayEvents.length - (block.maxPerDay ?? 2)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

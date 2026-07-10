import { buildMonthGrid, MONTHS_PT_SHORT } from '../lib/calendar.js'
import { useModal } from './Modal.jsx'

/* Calendário anual. Variantes:
   - "dots" (padrão): 12 mini-meses com dias numerados e marcados em tinta
   - "heatmap": intensidade por dia via `values: { "YYYY-MM-DD": n }`
   `marks` pode ser ["YYYY-MM-DD"] ou [{ date, label }] — com label, o dia
   marcado abre modal (agregado por mês). */
export default function CalendarYear({ block }) {
  const { openModal } = useModal()
  const year = block.year
  const heatmap = block.variant === 'heatmap'
  const values = block.values ?? {}
  const maxValue = block.max ?? Math.max(...Object.values(values).map(Number), 1)

  const marks = new Map(
    (block.marks ?? []).map((m) => (typeof m === 'string' ? [m, null] : [m.date, m.label ?? null])),
  )

  const openMonth = (monthIndex, monthMarks) => {
    if (monthMarks.length === 0 || block.clickable === false) return
    openModal({
      eyebrow: String(year),
      title: `${MONTHS_PT_SHORT[monthIndex]} — ${monthMarks.length} marcação${monthMarks.length > 1 ? 'ões' : ''}`,
      fields: monthMarks.map(([date, label]) => ({
        label: date.slice(8, 10) + '/' + date.slice(5, 7),
        value: label ?? 'Dia marcado',
      })),
    })
  }

  return (
    <div className="calendar-year">
      {MONTHS_PT_SHORT.map((label, i) => {
        const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
        const cells = buildMonthGrid(monthStr)
        const monthMarks = [...marks.entries()].filter(([d]) => d.startsWith(monthStr))
        const hasLabeledMarks = monthMarks.some(([, l]) => l)
        return (
          <div
            key={label}
            className={`calendar-year-month${hasLabeledMarks && block.clickable !== false ? ' clickable' : ''}`}
            onClick={hasLabeledMarks ? () => openMonth(i, monthMarks) : undefined}
          >
            <div className="calendar-year-month-label">
              {label}
              {monthMarks.length > 0 && <span className="calendar-year-month-count">{monthMarks.length}</span>}
            </div>
            <div className="calendar-year-grid">
              {cells.map((c, j) => {
                if (!c.inMonth) return <span key={j} className="calendar-year-cell calendar-year-cell--empty" />
                const heat = heatmap ? Math.min(1, (Number(values[c.iso]) || 0) / maxValue) : 0
                const marked = marks.has(c.iso)
                return (
                  <span
                    key={j}
                    className={`calendar-year-cell${marked ? ' calendar-year-cell--marked' : ''}${heat >= 0.5 ? ' calendar-year-cell--inverted' : ''}`}
                    style={heatmap && heat > 0 ? { '--heat': Math.max(0.12, heat) } : undefined}
                    title={marked ? marks.get(c.iso) ?? c.iso : heatmap && values[c.iso] ? `${c.iso}: ${values[c.iso]}` : undefined}
                  >
                    {c.day}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

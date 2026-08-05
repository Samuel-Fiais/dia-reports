import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, GitBranch, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchForewordTimelines, parseForewordCalendarDate } from '../lib/forewordTimelines.js'
import { dateKey, flattenForewordEvents, impactLabel, monthCalendar, weekCalendar } from '../lib/forewordAnalytics.js'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Em acompanhamento' },
  { value: 'resolved', label: 'Encerrados' },
]

const VIEWS = [
  { value: 'narrative', label: 'Narrativa', icon: Newspaper },
  { value: 'calendar', label: 'Calendário', icon: CalendarDays },
  { value: 'trace', label: 'Mapa temporal', icon: GitBranch },
]

const EVENT_LABELS = { start: 'Começo', dramatic: 'Ponto dramático', update: 'Desdobramento', resolution: 'Desfecho' }
const MOMENTUM_LABELS = { rising: 'Em aceleração', stable: 'Estável', falling: 'Perdendo força' }
const SCOPE_LABELS = { local: 'Local', national: 'Nacional', global: 'Global' }
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function formatDate(value, short = false) {
  const date = parseForewordCalendarDate(value)
  if (!date) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', short
    ? { day: '2-digit', month: 'short' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatMonth(key) {
  const date = parseForewordCalendarDate(`${key}-01`)
  return date ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date) : ''
}

function statusLabel(status) { return status === 'resolved' ? 'Encerrado' : 'Em acompanhamento' }

function shiftMonth(key, direction) {
  const date = parseForewordCalendarDate(`${key}-01`)
  date.setMonth(date.getMonth() + direction)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function eventMarker(eventType) {
  return <span className={`foreword-event-marker foreword-event-marker-${eventType}`} aria-hidden="true" />
}

/* Tooltip flutuante compartilhado: acompanha o cursor e mostra manchete,
   assunto, resumo e métricas do marco. Usado no mapa temporal e no calendário. */
function ForewordTooltip({ tooltip }) {
  if (!tooltip) return null
  const { event, x, y } = tooltip
  const WIDTH = 320
  const viewport = 12
  const left = Math.min(x + 14, window.innerWidth - WIDTH - viewport)
  const top = Math.min(y + 14, window.innerHeight - 160)
  return (
    <div className="foreword-tooltip" style={{ left, top }} role="tooltip">
      <span className="foreword-tooltip-kicker">{event.timeline.title} · {formatDate(event.occurredOn)}</span>
      <strong>{event.title}</strong>
      {event.summary ? <p>{event.summary}</p> : null}
      <div className="foreword-tooltip-metrics" aria-label="Métricas editoriais">
        <span className={`impact impact-${impactLabel(event.impactScore).toLowerCase()}`}>Impacto {event.impactScore} · {impactLabel(event.impactScore)}</span>
        <span>{MOMENTUM_LABELS[event.momentum]}</span>
        <span>{SCOPE_LABELS[event.scope]}</span>
      </div>
    </div>
  )
}

/* Trunca títulos longos para não invadir a área do traço. */
function traceLabel(title) {
  return title.length > 40 ? `${title.slice(0, 39)}…` : title
}

function SourceLinks({ event }) {
  const sources = event.sources ?? []
  if (!sources.length && !event.sourceReportSlug) return null
  return (
    <div className="foreword-sources">
      <span>Fontes</span>
      {sources.map((source) => (
        <a key={source.id ?? source.url} href={source.url} target="_blank" rel="noreferrer" title={source.title ?? source.outlet}>
          {source.outlet} <ExternalLink size={11} aria-hidden="true" />
        </a>
      ))}
      {event.sourceReportSlug ? <Link to={`/report/${event.sourceReportSlug}`}>Edição <ExternalLink size={11} aria-hidden="true" /></Link> : null}
    </div>
  )
}

function NarrativeView({ timelines, openSlug, setOpenSlug }) {
  return (
    <section className="foreword-timeline-list" aria-label="Assuntos acompanhados">
      {timelines.map((timeline) => {
        const expanded = openSlug === timeline.slug
        const latest = timeline.events.at(-1)
        return (
          <article key={timeline.slug} className={expanded ? 'foreword-story is-open' : 'foreword-story'}>
            <button type="button" className="foreword-story-toggle" aria-expanded={expanded}
              aria-controls={`timeline-${timeline.slug}`} onClick={() => setOpenSlug(expanded ? null : timeline.slug)}>
              <span className={`foreword-status foreword-status-${timeline.status}`}>{statusLabel(timeline.status)}</span>
              <span className="foreword-story-heading">
                <span className="foreword-category">{timeline.category}</span>
                <span className="foreword-story-title">{timeline.title}</span>
                <span className="foreword-story-summary">{timeline.summary}</span>
              </span>
              <ChevronDown className="foreword-story-chevron" size={18} aria-hidden="true" />
              <span className="foreword-story-dates">
                <span>Começou {formatDate(timeline.startedOn, true)}</span>
                <span>Atualizado {formatDate(timeline.latestEventOn, true)}</span>
                {latest ? <span>Impacto {latest.impactScore}/100</span> : null}
              </span>
            </button>
            {expanded ? (
              <ol id={`timeline-${timeline.slug}`} className="foreword-events">
                {timeline.events.map((event) => (
                  <li key={event.id} className={`foreword-event foreword-event-${event.eventType}`}>
                    {eventMarker(event.eventType)}
                    <div className="foreword-event-content">
                      <div className="foreword-event-meta"><time dateTime={event.occurredOn}>{formatDate(event.occurredOn)}</time><span>{EVENT_LABELS[event.eventType] ?? 'Marco'}</span></div>
                      <h2>{event.title}</h2>
                      <p>{event.summary}</p>
                      <div className="foreword-event-metrics" aria-label="Métricas editoriais">
                        <span className={`impact impact-${impactLabel(event.impactScore).toLowerCase()}`}>Impacto {event.impactScore} · {impactLabel(event.impactScore)}</span>
                        <span>{MOMENTUM_LABELS[event.momentum]}</span>
                        <span>{SCOPE_LABELS[event.scope]}</span>
                      </div>
                      <SourceLinks event={event} />
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}

function CalendarView({ events, calendarMode, monthKey, setMonthKey, onOpen, tooltip, setTooltip }) {
  const days = calendarMode === 'month' ? monthCalendar(monthKey) : weekCalendar(`${monthKey}-01`)
  const eventsByDay = useMemo(() => events.reduce((map, event) => {
    const key = dateKey(event.occurredOn)
    map[key] = [...(map[key] ?? []), event]
    return map
  }, {}), [events])
  const showTooltip = (event, e) => setTooltip({ event, x: e.clientX, y: e.clientY })
  return (
    <section className="foreword-calendar" aria-label={`Calendário ${calendarMode === 'month' ? 'mensal' : 'semanal'}`}>
      <div className="foreword-calendar-toolbar">
        <div className="foreword-calendar-switch" aria-label="Escala do calendário">
          <span>{calendarMode === 'month' ? 'Mensal' : 'Semanal'}</span>
        </div>
        <div className="foreword-calendar-nav">
          <button type="button" aria-label="Período anterior" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft size={16} /></button>
          <strong>{formatMonth(monthKey)}</strong>
          <button type="button" aria-label="Próximo período" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="foreword-calendar-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className={calendarMode === 'month' ? 'foreword-calendar-grid' : 'foreword-calendar-grid is-week'}>
        {days.map((day) => (
          <div key={day.key} className={day.inMonth ? 'foreword-calendar-day' : 'foreword-calendar-day is-outside'}>
            <time dateTime={day.key}>{day.day}</time>
            <div className="foreword-calendar-events">
              {(eventsByDay[day.key] ?? []).map((event) => (
                <button key={event.id} type="button" className={`calendar-event impact-${impactLabel(event.impactScore).toLowerCase()}`}
                  onClick={() => onOpen(event)}
                  onMouseMove={(e) => showTooltip(event, e)}
                  onMouseEnter={(e) => showTooltip(event, e)}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={(e) => showTooltip(event, e)}
                  onBlur={() => setTooltip(null)}
                >
                  <span className="calendar-event-title">{event.title}</span>
                  <small>{event.timeline.title}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ForewordTooltip tooltip={tooltip} />
    </section>
  )
}

function TraceView({ events, timelines, focusedEvent, setFocusedEvent, tooltip, setTooltip }) {
  const dates = events.map((event) => parseForewordCalendarDate(event.occurredOn).getTime())
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const span = Math.max(max - min, 24 * 60 * 60 * 1000)
  const height = Math.max(260, timelines.length * 88 + 70)
  const position = (event) => 84 + ((parseForewordCalendarDate(event.occurredOn).getTime() - min) / span) * 840
  const lane = (timeline) => 56 + timelines.findIndex((item) => item.slug === timeline.slug) * 88
  const showTooltip = (event, e) => setTooltip({ event, x: e.clientX, y: e.clientY })
  const marker = (event, x, y) => {
    const props = { className: `trace-point trace-${event.eventType}`, key: event.id }
    const radius = 4 + Math.round((event.impactScore ?? 50) / 20)
    if (event.eventType === 'dramatic') return <rect {...props} x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} transform={`rotate(45 ${x} ${y})`} />
    if (event.eventType === 'update') return <rect {...props} x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} rx="1" />
    if (event.eventType === 'resolution') return <path {...props} d={`M${x - radius},${y} L${x},${y - radius} L${x + radius},${y} L${x},${y + radius}Z`} />
    return <circle {...props} cx={x} cy={y} r={radius} />
  }
  return (
    <section className="foreword-trace-wrap" aria-label="Mapa temporal dos assuntos">
      <p className="foreword-trace-legend">Tamanho = impacto · círculo = começo · losango = ponto dramático · quadrado = atualização · diamante = desfecho.</p>
      <svg className="foreword-trace" viewBox={`0 0 1000 ${height}`} role="img" aria-label="Eventos organizados por assunto e data">
        {timelines.map((timeline) => <g key={timeline.slug}><line className="trace-lane" x1="84" x2="924" y1={lane(timeline)} y2={lane(timeline)} /><text x="4" y={lane(timeline) - 12} className="trace-label">{traceLabel(timeline.title)}</text></g>)}
        {timelines.map((timeline) => {
          const storyEvents = events.filter((event) => event.timeline.slug === timeline.slug)
          const points = storyEvents.map((event) => `${position(event)},${lane(timeline)}`).join(' ')
          return <polyline key={`${timeline.slug}-line`} className="trace-line" points={points} />
        })}
        {events.map((event) => {
          const x = position(event); const y = lane(event.timeline)
          return <g key={`event-${event.id}`} tabIndex="0" role="button" className="trace-event" aria-label={`${event.title}, impacto ${event.impactScore}`}
            onMouseEnter={(e) => { setFocusedEvent(event); showTooltip(event, e) }}
            onMouseMove={(e) => showTooltip(event, e)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => setFocusedEvent(event)}
            onClick={() => setFocusedEvent(event)}>{marker(event, x, y)}</g>
        })}
      </svg>
      <ForewordTooltip tooltip={tooltip} />
      {focusedEvent ? <div className="foreword-trace-detail"><span>{focusedEvent.timeline.title} · {formatDate(focusedEvent.occurredOn)}</span><strong>{focusedEvent.title}</strong><p>{focusedEvent.summary}</p><div><span className="impact">Impacto {focusedEvent.impactScore} · {impactLabel(focusedEvent.impactScore)}</span><span>{MOMENTUM_LABELS[focusedEvent.momentum]}</span><span>{SCOPE_LABELS[focusedEvent.scope]}</span></div><SourceLinks event={focusedEvent} /></div> : <p className="foreword-state">Passe ou navegue pelos pontos para ler um marco.</p>}
    </section>
  )
}

export default function ForewordTimelinePage() {
  useAppChromeTheme('The Foreword · Linha do tempo')
  const [timelines, setTimelines] = useState([])
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('narrative')
  const [calendarMode, setCalendarMode] = useState('month')
  const [monthKey, setMonthKey] = useState(null)
  const [openSlug, setOpenSlug] = useState(null)
  const [focusedEvent, setFocusedEvent] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchForewordTimelines().then((data) => {
      if (cancelled) return
      setTimelines(data)
      const latest = flattenForewordEvents(data).at(-1)
      setMonthKey(dateKey(latest?.occurredOn) ?? new Date().toISOString().slice(0, 7))
      setOpenSlug(null)
    }).catch((nextError) => { if (!cancelled) setError(nextError) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const visibleTimelines = useMemo(() => timelines.filter((item) => filter === 'all' || item.status === filter), [filter, timelines])
  const events = useMemo(() => flattenForewordEvents(visibleTimelines), [visibleTimelines])
  const headlineMetrics = useMemo(() => ({ active: timelines.filter((item) => item.status === 'open').length, critical: events.filter((event) => event.impactScore >= 90).length, sources: events.reduce((total, event) => total + (event.sources?.length ?? 0), 0) }), [events, timelines])

  function openEvent(event) { setOpenSlug(event.timeline.slug); setFocusedEvent(event); setView('narrative') }

  return <div className="report ready foreword-timeline-page"><div className="report-wrap">
    <header className="report-header"><div className="report-header-left"><Newspaper size={15} aria-hidden="true" /><span className="report-from">Dia · The Foreword</span></div><span className="report-date">Acompanhamento editorial</span></header>
    <h1 className="report-headline">Assuntos em movimento</h1>
    <div className="report-intro"><p><strong>O que continua depois da manchete.</strong> Acompanhe começos, viradas, fontes e o desfecho — ou a permanência — de cada história.</p></div><hr className="report-rule" />
    <main className="report-body foreword-timeline-body">
      <div className="foreword-kpis"><span><strong>{headlineMetrics.active}</strong> em acompanhamento</span><span><strong>{headlineMetrics.critical}</strong> marcos críticos</span><span><strong>{headlineMetrics.sources}</strong> fontes vinculadas</span></div>
      <div className="foreword-controls"><div className="foreword-view-tabs" aria-label="Visualização">{VIEWS.map((item) => { const Icon = item.icon; return <button key={item.value} type="button" className={view === item.value ? 'is-active' : ''} onClick={() => setView(item.value)}><Icon size={14} aria-hidden="true" />{item.label}</button> })}</div><div className="foreword-filter" aria-label="Filtrar assuntos">{FILTERS.map((item) => <button key={item.value} type="button" className={filter === item.value ? 'foreword-filter-button is-active' : 'foreword-filter-button'} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div></div>
      {view === 'calendar' ? <div className="foreword-calendar-mode"><button type="button" className={calendarMode === 'month' ? 'is-active' : ''} onClick={() => setCalendarMode('month')}>Mês</button><button type="button" className={calendarMode === 'week' ? 'is-active' : ''} onClick={() => setCalendarMode('week')}>Semana</button></div> : null}
      {loading ? <p className="foreword-state">Carregando assuntos acompanhados…</p> : null}
      {!loading && error ? <p className="foreword-state foreword-state-error">Não foi possível carregar a linha do tempo. {error.message}</p> : null}
      {!loading && !error && visibleTimelines.length === 0 ? <p className="foreword-state">Nenhum assunto nesta seleção.</p> : null}
      {!loading && !error && visibleTimelines.length ? <>{view === 'narrative' ? <NarrativeView timelines={visibleTimelines} openSlug={openSlug} setOpenSlug={setOpenSlug} /> : null}{view === 'calendar' && monthKey ? <CalendarView events={events} calendarMode={calendarMode} monthKey={monthKey} setMonthKey={setMonthKey} onOpen={openEvent} tooltip={tooltip} setTooltip={setTooltip} /> : null}{view === 'trace' ? <TraceView events={events} timelines={visibleTimelines} focusedEvent={focusedEvent} setFocusedEvent={setFocusedEvent} tooltip={tooltip} setTooltip={setTooltip} /> : null}</> : null}
    </main>
  </div></div>
}

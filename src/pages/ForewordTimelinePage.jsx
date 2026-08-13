import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Map as MapIcon, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import ForewordMapView from '../components/ForewordMapView.jsx'
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
  { value: 'map', label: 'Mapa', icon: MapIcon },
]

const CANONICAL_CATEGORIES = [
  'Política e Economia',
  'Tecnologia',
  'Inteligência Artificial',
  'Robótica',
  'Inovação',
  'Esportes',
  'Empresas e Mercado',
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

function categorySortValue(category) {
  const index = CANONICAL_CATEGORIES.indexOf(category)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function shiftMonth(key, direction) {
  const date = parseForewordCalendarDate(`${key}-01`)
  date.setMonth(date.getMonth() + direction)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function eventMarker(eventType) {
  return <span className={`foreword-event-marker foreword-event-marker-${eventType}`} aria-hidden="true" />
}

/* Tooltip flutuante compartilhado: acompanha o cursor e mostra manchete,
   assunto, resumo e métricas do marco. Usado no mapa e no calendário. */
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
  const groups = useMemo(() => {
    const grouped = timelines.reduce((map, timeline) => {
      const category = timeline.category || 'Sem categoria'
      map.set(category, [...(map.get(category) ?? []), timeline])
      return map
    }, new Map())

    return Array.from(grouped.entries()).sort(([categoryA], [categoryB]) => {
      const sortA = categorySortValue(categoryA)
      const sortB = categorySortValue(categoryB)
      if (sortA !== sortB) return sortA - sortB
      return categoryA.localeCompare(categoryB, 'pt-BR')
    })
  }, [timelines])

  return (
    <section className="foreword-timeline-list" aria-label="Assuntos acompanhados">
      {groups.map(([category, categoryTimelines]) => {
        const openCount = categoryTimelines.filter((timeline) => timeline.status === 'open').length
        return (
          <div key={category} className="foreword-category-group">
            <header className="foreword-category-heading">
              <h2>{category}</h2>
              <span>{categoryTimelines.length} assuntos · {openCount} em acompanhamento</span>
            </header>
            {categoryTimelines.map((timeline) => {
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
          </div>
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

export default function ForewordTimelinePage() {
  useAppChromeTheme('The Foreword · Linha do tempo')
  const [timelines, setTimelines] = useState([])
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [view, setView] = useState('narrative')
  const [calendarMode, setCalendarMode] = useState('month')
  const [monthKey, setMonthKey] = useState(null)
  const [openSlug, setOpenSlug] = useState(null)
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

  const categories = useMemo(() => {
    const present = Array.from(new Set(timelines.map((item) => item.category).filter(Boolean)))
    return present.sort((categoryA, categoryB) => {
      const sortA = categorySortValue(categoryA)
      const sortB = categorySortValue(categoryB)
      if (sortA !== sortB) return sortA - sortB
      return categoryA.localeCompare(categoryB, 'pt-BR')
    })
  }, [timelines])
  const visibleTimelines = useMemo(() => timelines.filter((item) => (
    (filter === 'all' || item.status === filter) &&
    (categoryFilter === 'all' || item.category === categoryFilter)
  )), [categoryFilter, filter, timelines])
  const events = useMemo(() => flattenForewordEvents(visibleTimelines), [visibleTimelines])
  const headlineMetrics = useMemo(() => ({ active: timelines.filter((item) => item.status === 'open').length, critical: events.filter((event) => event.impactScore >= 90).length, sources: events.reduce((total, event) => total + (event.sources?.length ?? 0), 0) }), [events, timelines])

  function openEvent(event) { setOpenSlug(event.timeline.slug); setView('narrative') }

  return <div className="report ready foreword-timeline-page"><div className="report-wrap">
    <header className="report-header"><div className="report-header-left"><Newspaper size={15} aria-hidden="true" /><span className="report-from">Dia · The Foreword</span></div><span className="report-date">Acompanhamento editorial</span></header>
    <h1 className="report-headline">Assuntos em movimento</h1>
    <div className="report-intro"><p><strong>O que continua depois da manchete.</strong> Acompanhe começos, viradas, fontes e o desfecho — ou a permanência — de cada história.</p></div><hr className="report-rule" />
    <main className="report-body foreword-timeline-body">
      <div className="foreword-kpis"><span><strong>{headlineMetrics.active}</strong> em acompanhamento</span><span><strong>{headlineMetrics.critical}</strong> marcos críticos</span><span><strong>{headlineMetrics.sources}</strong> fontes vinculadas</span></div>
      <div className="foreword-controls"><div className="foreword-view-tabs" aria-label="Visualização">{VIEWS.map((item) => { const Icon = item.icon; return <button key={item.value} type="button" className={view === item.value ? 'is-active' : ''} onClick={() => setView(item.value)}><Icon size={14} aria-hidden="true" />{item.label}</button> })}</div><div className="foreword-filter" aria-label="Filtrar assuntos">{FILTERS.map((item) => <button key={item.value} type="button" className={filter === item.value ? 'foreword-filter-button is-active' : 'foreword-filter-button'} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><div className="foreword-filter" aria-label="Filtrar categorias"><button type="button" className={categoryFilter === 'all' ? 'foreword-filter-button is-active' : 'foreword-filter-button'} aria-pressed={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>Todas</button>{categories.map((category) => <button key={category} type="button" className={categoryFilter === category ? 'foreword-filter-button is-active' : 'foreword-filter-button'} aria-pressed={categoryFilter === category} onClick={() => setCategoryFilter(category)}>{category}</button>)}</div></div>
      {view === 'calendar' ? <div className="foreword-calendar-mode"><button type="button" className={calendarMode === 'month' ? 'is-active' : ''} onClick={() => setCalendarMode('month')}>Mês</button><button type="button" className={calendarMode === 'week' ? 'is-active' : ''} onClick={() => setCalendarMode('week')}>Semana</button></div> : null}
      {loading ? <p className="foreword-state">Carregando assuntos acompanhados…</p> : null}
      {!loading && error ? <p className="foreword-state foreword-state-error">Não foi possível carregar a linha do tempo. {error.message}</p> : null}
      {!loading && !error && visibleTimelines.length === 0 ? <p className="foreword-state">Nenhum assunto nesta seleção.</p> : null}
      {!loading && !error && visibleTimelines.length ? <>{view === 'narrative' ? <NarrativeView timelines={visibleTimelines} openSlug={openSlug} setOpenSlug={setOpenSlug} /> : null}{view === 'calendar' && monthKey ? <CalendarView events={events} calendarMode={calendarMode} monthKey={monthKey} setMonthKey={setMonthKey} onOpen={openEvent} tooltip={tooltip} setTooltip={setTooltip} /> : null}{view === 'map' ? <><ForewordMapView events={events} onOpen={openEvent} tooltip={tooltip} setTooltip={setTooltip} /><ForewordTooltip tooltip={tooltip} /></> : null}</> : null}
    </main>
  </div></div>
}

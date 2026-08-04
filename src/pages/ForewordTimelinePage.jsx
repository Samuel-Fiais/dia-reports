import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Newspaper, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchForewordTimelines, parseForewordCalendarDate } from '../lib/forewordTimelines.js'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Em acompanhamento' },
  { value: 'resolved', label: 'Encerrados' },
]

const EVENT_LABELS = {
  start: 'Começo',
  dramatic: 'Ponto dramático',
  update: 'Desdobramento',
  resolution: 'Desfecho',
}

function formatDate(value) {
  const date = parseForewordCalendarDate(value)
  if (!date) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function statusLabel(status) {
  return status === 'resolved' ? 'Encerrado' : 'Em acompanhamento'
}

export default function ForewordTimelinePage() {
  useAppChromeTheme('The Foreword · Linha do tempo')
  const [timelines, setTimelines] = useState([])
  const [filter, setFilter] = useState('all')
  const [openSlug, setOpenSlug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchForewordTimelines()
      .then((data) => {
        if (cancelled) return
        setTimelines(data)
        setOpenSlug(data[0]?.slug ?? null)
      })
      .catch((nextError) => {
        if (!cancelled) setError(nextError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const visibleTimelines = useMemo(
    () => timelines.filter((timeline) => filter === 'all' || timeline.status === filter),
    [filter, timelines],
  )

  function setActiveFilter(value) {
    setFilter(value)
    const next = timelines.find((timeline) => value === 'all' || timeline.status === value)
    setOpenSlug(next?.slug ?? null)
  }

  return (
    <div className="report ready foreword-timeline-page">
      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <Newspaper size={15} aria-hidden="true" />
            <span className="report-from">Dia · The Foreword</span>
          </div>
          <span className="report-date">Acompanhamento editorial</span>
        </header>

        <h1 className="report-headline">Assuntos em movimento</h1>
        <div className="report-intro">
          <p><strong>O que continua depois da manchete.</strong> Acompanhe quando cada assunto começou, suas viradas e o ponto em que a história se encerrou — ou permanece aberta.</p>
        </div>
        <hr className="report-rule" />

        <main className="report-body foreword-timeline-body">
          <div className="foreword-filter" aria-label="Filtrar assuntos">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={filter === item.value ? 'foreword-filter-button is-active' : 'foreword-filter-button'}
                aria-pressed={filter === item.value}
                onClick={() => setActiveFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? <p className="foreword-state">Carregando assuntos acompanhados…</p> : null}
          {!loading && error ? <p className="foreword-state foreword-state-error">Não foi possível carregar a linha do tempo. {error.message}</p> : null}
          {!loading && !error && visibleTimelines.length === 0 ? <p className="foreword-state">Nenhum assunto nesta seleção.</p> : null}

          {!loading && !error ? (
            <section className="foreword-timeline-list" aria-label="Assuntos acompanhados">
              {visibleTimelines.map((timeline) => {
                const expanded = openSlug === timeline.slug
                return (
                  <article key={timeline.slug} className={expanded ? 'foreword-story is-open' : 'foreword-story'}>
                    <button
                      type="button"
                      className="foreword-story-toggle"
                      aria-expanded={expanded}
                      aria-controls={`timeline-${timeline.slug}`}
                      onClick={() => setOpenSlug(expanded ? null : timeline.slug)}
                    >
                      <span className={`foreword-status foreword-status-${timeline.status}`}>{statusLabel(timeline.status)}</span>
                      <span className="foreword-story-heading">
                        <span className="foreword-category">{timeline.category}</span>
                        <span className="foreword-story-title">{timeline.title}</span>
                        <span className="foreword-story-summary">{timeline.summary}</span>
                      </span>
                      <span className="foreword-story-dates">
                        <span>Começou {formatDate(timeline.startedOn)}</span>
                        <span>Atualizado {formatDate(timeline.latestEventOn)}</span>
                      </span>
                      <ChevronDown className="foreword-story-chevron" size={18} aria-hidden="true" />
                    </button>

                    {expanded ? (
                      <ol id={`timeline-${timeline.slug}`} className="foreword-events">
                        {timeline.events.map((event) => (
                          <li key={event.id} className={`foreword-event foreword-event-${event.eventType}`}>
                            <span className="foreword-event-marker" aria-hidden="true"><Sparkles size={11} /></span>
                            <div className="foreword-event-content">
                              <div className="foreword-event-meta">
                                <time dateTime={event.occurredOn}>{formatDate(event.occurredOn)}</time>
                                <span>{EVENT_LABELS[event.eventType] ?? 'Marco'}</span>
                              </div>
                              <h2>{event.title}</h2>
                              <p>{event.summary}</p>
                              {event.sourceReportSlug ? (
                                <Link className="foreword-event-source" to={`/report/${event.sourceReportSlug}`}>
                                  Ver edição do The Foreword <ExternalLink size={13} aria-hidden="true" />
                                </Link>
                              ) : event.sourceUrl ? (
                                <a className="foreword-event-source" href={event.sourceUrl} target="_blank" rel="noreferrer">
                                  Ver fonte <ExternalLink size={13} aria-hidden="true" />
                                </a>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </article>
                )
              })}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import SelectControl from '../components/SelectControl.jsx'
import { fetchForewordEditions } from '../lib/registry.js'
import { ROUTES } from '../lib/routes.js'
import { formatShortDate, formatUpdatedAgo } from '../lib/theme.js'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'

function countSections(publication) {
  if (typeof publication.sections_length === 'number') return publication.sections_length
  return (publication.body ?? []).filter((block) => block.type === 'section').length
}

function publicationTitle(publication) {
  return Array.isArray(publication.headline)
    ? publication.headline.join(' ')
    : publication.headline ?? publication.title
}

function plainText(value) {
  return String(value ?? '')
    .replace(/\*\*|\*|`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

const SORT_OPTIONS = Object.freeze([
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'az', label: 'Título (A–Z)' },
])

export default function ForewordEditionsPage() {
  useAppChromeTheme('The Foreword · Edições')
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    let cancelled = false

    async function loadEditions() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchForewordEditions()
        if (!cancelled) setPublications(data)
      } catch (nextError) {
        if (!cancelled) {
          setPublications([])
          setError(nextError)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadEditions()
    return () => {
      cancelled = true
    }
  }, [])

  const visiblePublications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    const filtered = publications.filter((publication) => {
      if (!normalizedQuery) return true
      return [
        publicationTitle(publication),
        publication.intro?.[0],
        publication.from,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedQuery)
    })

    return filtered.toSorted((a, b) => {
      if (sort === 'az') {
        return publicationTitle(a).localeCompare(publicationTitle(b), 'pt-BR')
      }
      const difference = new Date(a.updatedAt ?? a.date) - new Date(b.updatedAt ?? b.date)
      return sort === 'oldest' ? difference : -difference
    })
  }, [publications, query, sort])

  return (
    <>
      <nav className="report-backnav">
        <Link to={ROUTES.theForeword}>
          <ArrowLeft size={12} aria-hidden="true" /> The Foreword
        </Link>
      </nav>
      <div className="report ready publication-list">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Dia · The Foreword</span>
            </div>
            <span className="report-date">Arquivo editorial</span>
          </header>

          <h1 className="report-headline">Edições</h1>

          <div className="report-intro">
            <p>
              <strong>
                {loading
                  ? 'Carregando edições diárias.'
                  : `${visiblePublications.length} de ${publications.length} edições.`}
              </strong>{' '}
              Cada edição reúne a manchete, o contexto e o desdobramento do dia — com links para
              os assuntos acompanhados na linha do tempo.
            </p>
          </div>

          {!loading && publications.length > 0 && (
            <div className="dashboard-controls">
              <div className="dashboard-search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Buscar por título ou assunto..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Buscar edições"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                    <X size={13} />
                  </button>
                ) : null}
              </div>

              <div className="dashboard-sort-wrap">
                <SelectControl
                  className="dashboard-sort"
                  value={sort}
                  onChange={setSort}
                  ariaLabel="Ordenar edições"
                  options={SORT_OPTIONS}
                />
              </div>
            </div>
          )}

          <hr className="report-rule" />

          <main className="report-body">
            <section className="report-section">
              <div className="section-header">
                <h2 className="section-heading">Todas as edições</h2>
              </div>
              <div className="section-items report-card-grid">
                {loading ? (
                  <p className="report-card-empty">Carregando edições...</p>
                ) : null}
                {!loading && error ? (
                  <p className="report-card-empty">
                    A listagem de edições não pôde ser atualizada agora.
                  </p>
                ) : null}
                {!loading && visiblePublications.map((publication) => (
                  <Link
                    key={publication.id}
                    to={ROUTES.report(publication.id)}
                    className="report-card"
                  >
                    <div className="report-card-meta">
                      <span className="report-card-from">
                        {formatUpdatedAgo(publication.updatedAt ?? publication.date)}
                      </span>
                      <span className="report-card-date">
                        {formatShortDate(publication.updatedAt ?? publication.date)}
                      </span>
                    </div>
                    <h3 className="report-card-title">{publicationTitle(publication)}</h3>
                    {publication.intro?.[0] ? (
                      <p className="report-card-desc">{plainText(publication.intro[0])}</p>
                    ) : null}
                    <div className="report-card-foot">
                      {countSections(publication) > 0 ? (
                        <span className="item-badge">
                          {countSections(publication)} seç
                          {countSections(publication) === 1 ? 'ão' : 'ões'}
                        </span>
                      ) : null}
                      {(publication.metrics?.length > 0 || publication.metrics_length > 0) ? (
                        <span className="item-badge">
                          {publication.metrics?.length ?? publication.metrics_length} métricas
                        </span>
                      ) : null}
                      <span className="report-card-open">
                        Abrir <ArrowRight size={13} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                ))}
                {!loading && publications.length > 0 && visiblePublications.length === 0 ? (
                  <p className="report-card-empty">
                    Nenhuma edição encontrada com esses filtros.
                  </p>
                ) : null}
                {!loading && !error && publications.length === 0 ? (
                  <p className="report-card-empty">Nenhuma edição disponível ainda.</p>
                ) : null}
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  )
}

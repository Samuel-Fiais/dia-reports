import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import SelectControl from '../components/SelectControl.jsx'
import {
  getPublicationKind,
  publicationHref,
  publicationMode,
  withSystemPublications,
} from '../lib/publicationKinds.js'
import { fetchReports } from '../lib/registry.js'
import { formatReportDate, formatShortDate, formatUpdatedAgo } from '../lib/theme.js'
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

export default function PublicationListPage({ kindKey }) {
  const kind = getPublicationKind(kindKey)
  useAppChromeTheme(kind.title)
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    let cancelled = false

    async function loadPublications() {
      try {
        setLoading(true)
        setError(null)
        const data = withSystemPublications(await fetchReports())
        if (!cancelled) {
          setPublications(data.filter((publication) => publicationMode(publication) === kind.key))
        }
      } catch (nextError) {
        if (!cancelled) {
          setPublications(
            withSystemPublications([])
              .filter((publication) => publicationMode(publication) === kind.key),
          )
          setError(nextError)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPublications()
    return () => {
      cancelled = true
    }
  }, [kind.key])

  const categories = useMemo(() => {
    const values = new Set(publications.map((publication) => publication.from).filter(Boolean))
    return ['all', ...values]
  }, [publications])

  const visiblePublications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    const filtered = publications.filter((publication) => {
      if (category !== 'all' && publication.from !== category) return false
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
  }, [publications, query, category, sort])

  return (
    <>
      <nav className="report-backnav">
        <Link to="/">
          <ArrowLeft size={12} aria-hidden="true" /> Início
        </Link>
      </nav>
      <div className="report ready publication-list">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Central · {kind.eyebrow}</span>
            </div>
            <span className="report-date">{formatReportDate(new Date().toISOString())}</span>
          </header>

          <h1 className="report-headline">{kind.title}</h1>

          <div className="report-intro">
            <p>
              <strong>
                {loading
                  ? `Carregando ${kind.title.toLocaleLowerCase('pt-BR')}.`
                  : `${visiblePublications.length} de ${publications.length} publicações.`}
              </strong>{' '}
              {kind.description}
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
                  aria-label={`Buscar em ${kind.title.toLocaleLowerCase('pt-BR')}`}
                />
                {query ? (
                  <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                    <X size={13} />
                  </button>
                ) : null}
              </div>

              {categories.length > 2 ? (
                <div className="dashboard-sort-wrap">
                  <SelectControl
                    className="dashboard-sort"
                    value={category}
                    onChange={setCategory}
                    ariaLabel="Filtrar por categoria"
                    options={categories.map((value) => ({
                      value,
                      label: value === 'all' ? 'Todas' : value,
                    }))}
                  />
                </div>
              ) : null}

              <div className="dashboard-sort-wrap">
                <SelectControl
                  className="dashboard-sort"
                  value={sort}
                  onChange={setSort}
                  ariaLabel="Ordenar publicações"
                  options={SORT_OPTIONS}
                />
              </div>
            </div>
          )}

          <hr className="report-rule" />

          <main className="report-body">
            <section className="report-section">
              <div className="section-header">
                <h2 className="section-heading">Todas as publicações</h2>
              </div>
              <div className="section-items report-card-grid">
                {loading ? (
                  <p className="report-card-empty">Carregando publicações...</p>
                ) : null}
                {!loading && error ? (
                  <p className="report-card-empty">
                    A listagem do banco não pôde ser atualizada agora.
                  </p>
                ) : null}
                {!loading && visiblePublications.map((publication) => (
                  <Link
                    key={publication.id}
                    to={publicationHref(publication)}
                    className="report-card"
                  >
                    <div className="report-card-meta">
                      <span className="report-card-from">
                        {publication.system
                          ? 'Exemplo do sistema'
                          : formatUpdatedAgo(publication.updatedAt ?? publication.date)}
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
                    Nenhuma publicação encontrada com esses filtros.
                  </p>
                ) : null}
                {!loading && !error && publications.length === 0 ? (
                  <p className="report-card-empty">{kind.empty}</p>
                ) : null}
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  )
}

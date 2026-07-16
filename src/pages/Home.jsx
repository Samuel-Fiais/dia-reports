import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, X } from 'lucide-react'
import { fetchReports } from '../lib/registry.js'
import { formatReportDate, formatShortDate, formatUpdatedAgo } from '../lib/theme.js'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'
import SelectControl from '../components/SelectControl.jsx'

function countSections(report) {
  if (typeof report.sections_length === 'number') return report.sections_length
  return (report.body ?? []).filter((b) => b.type === 'section').length
}

function reportTitle(report) {
  return Array.isArray(report.headline) ? report.headline.join(' ') : report.headline ?? report.title
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'az', label: 'Título (A–Z)' },
]

export default function Home() {
  useAppChromeTheme('Relatórios')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchReports()
        if (!cancelled) setReports(data)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReports()

    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set(reports.map((r) => r.from).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [reports])

  const visibleReports = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = reports.filter((report) => {
      if (category !== 'all' && report.from !== category) return false
      if (!q) return true
      const haystack = [reportTitle(report), report.intro?.[0], report.from]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    list = [...list].sort((a, b) => {
      if (sort === 'az') return reportTitle(a).localeCompare(reportTitle(b), 'pt-BR')
      const diff = new Date(a.updatedAt ?? a.date) - new Date(b.updatedAt ?? b.date)
      return sort === 'oldest' ? diff : -diff
    })
    return list
  }, [reports, query, category, sort])

  return (
    <div className="report ready">
      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <span className="report-from">Dashboard · Relatórios</span>
          </div>
          <span className="report-date">{formatReportDate(new Date().toISOString())}</span>
        </header>

        <h1 className="report-headline">Relatórios</h1>

        <div className="report-intro">
          <p>
            <strong>
              {loading
                ? 'Carregando seus relatórios.'
                : `${visibleReports.length} de ${reports.length} ${reports.length === 1 ? 'relatório' : 'relatórios'}.`}
            </strong>{' '}
            Tudo em um só lugar, sempre atualizado. Busque por assunto ou filtre por categoria
            para achar o que precisa rapidinho.
          </p>
        </div>

        {!loading && reports.length > 0 && (
          <div className="dashboard-controls">
            <div className="dashboard-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por título ou assunto..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar relatórios"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                  <X size={13} />
                </button>
              )}
            </div>

            {categories.length > 2 && (
              <div className="dashboard-sort-wrap">
                <SelectControl
                  className="dashboard-sort"
                  value={category}
                  onChange={setCategory}
                  ariaLabel="Filtrar por categoria"
                  options={categories.map((cat) => ({ value: cat, label: cat === 'all' ? 'Todas' : cat }))}
                />
              </div>
            )}

            <div className="dashboard-sort-wrap">
              <SelectControl
                className="dashboard-sort"
                value={sort}
                onChange={setSort}
                ariaLabel="Ordenar relatórios"
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        )}

        <hr className="report-rule" />

        <main className="report-body">
          <section className="report-section">
            <div className="section-header">
              <h2 className="section-heading">Todos os relatórios</h2>
            </div>
            <div className="section-items report-card-grid">
              {loading && (
                <p className="report-card-empty">
                  Carregando relatórios...
                </p>
              )}
              {!loading && error && (
                <p className="report-card-empty">
                  Não conseguimos carregar seus relatórios agora. Tente de novo em instantes.
                </p>
              )}
              {!loading && !error && visibleReports.map((report) => (
                <Link key={report.id} to={`/report/${report.id}`} className="report-card">
                  <div className="report-card-meta">
                    <span className="report-card-from">{formatUpdatedAgo(report.updatedAt ?? report.date)}</span>
                    <span className="report-card-date">{formatShortDate(report.updatedAt ?? report.date)}</span>
                  </div>
                  <h3 className="report-card-title">{reportTitle(report)}</h3>
                  {report.intro?.[0] && (
                    <p className="report-card-desc">
                      {String(report.intro[0]).replace(/\*\*|\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}
                    </p>
                  )}
                  <div className="report-card-foot">
                    <span className="item-badge">
                      {countSections(report)} seç{countSections(report) === 1 ? 'ão' : 'ões'}
                    </span>
                    {(report.metrics?.length > 0 || report.metrics_length > 0) && (
                      <span className="item-badge">{report.metrics?.length ?? report.metrics_length} métricas</span>
                    )}
                    <span className="report-card-open">
                      Abrir <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
              {!loading && !error && reports.length > 0 && visibleReports.length === 0 && (
                <p className="report-card-empty">
                  Nenhum relatório encontrado com esses filtros. Tente outro termo de busca.
                </p>
              )}
              {!loading && !error && reports.length === 0 && (
                <p className="report-card-empty">
                  Nenhum relatório disponível ainda.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

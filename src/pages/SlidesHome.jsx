import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Presentation, Printer, Search, X } from 'lucide-react'
import { fetchDecks } from '../lib/slidesClient.js'
import { formatShortDate, formatUpdatedAgo } from '../lib/theme.js'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'

export default function SlidesHome() {
  useAppChromeTheme('Apresentações')
  const navigate = useNavigate()
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchDecks()
        if (!cancelled) setDecks(data)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const visibleDecks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return decks
    return decks.filter((d) => {
      const haystack = [d.title, d.deckTitle].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [decks, query])

  return (
    <div className="report ready">
      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <span className="report-from">Apresentações</span>
          </div>
          <span className="report-date">{formatShortDate(new Date().toISOString())}</span>
        </header>

        <h1 className="report-headline">
          <Presentation size={24} style={{ marginRight: 10, verticalAlign: 'middle', opacity: 0.7 }} />
          Apresentações
        </h1>

        <div className="report-intro">
          <p>
            <strong>
              {loading
                ? 'Carregando seus decks.'
                : `${visibleDecks.length} ${visibleDecks.length === 1 ? 'deck' : 'decks'} disponíveis.`}
            </strong>{' '}
            Crie, edite e apresente slides diretamente do Dia.
          </p>
        </div>

        {!loading && decks.length > 0 && (
          <div className="dashboard-controls">
            <div className="dashboard-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar decks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar decks"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                  <X size={13} />
                </button>
              )}
            </div>
            <Link to="/admin/slides" className="admin-new-btn" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={14} aria-hidden="true" /> Novo deck
            </Link>
          </div>
        )}

        <hr className="report-rule" />

        <main className="report-body">
          <section className="report-section">
            <div className="section-header">
              <h2 className="section-heading">Todos os decks</h2>
            </div>
            <div className="section-items report-card-grid">
              {loading && (
                <p className="report-card-empty">Carregando decks...</p>
              )}
              {!loading && error && (
                <p className="report-card-empty">
                  Não foi possível carregar os decks agora. Tente de novo em instantes.
                </p>
              )}
              {!loading && !error && visibleDecks.map((deck) => (
                <Link key={deck.id} to={`/slides/${deck.id}`} className="report-card">
                  <div className="report-card-meta">
                    <span className="report-card-from">{formatUpdatedAgo(deck.updatedAt ?? deck.date)}</span>
                    <span className="report-card-date">{formatShortDate(deck.updatedAt ?? deck.date)}</span>
                  </div>
                  <h3 className="report-card-title">{deck.deckTitle ?? deck.title}</h3>
                  {deck.slidesCount > 0 && (
                    <p className="report-card-desc">{deck.slidesCount} {deck.slidesCount === 1 ? 'slide' : 'slides'}</p>
                  )}
                  <div className="report-card-foot">
                    <span className="report-card-open">
                      Apresentar <ArrowRight size={13} aria-hidden="true" />
                    </span>
                    <button
                      type="button"
                      className="report-card-pdf-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/slides/${deck.id}?export=1`)
                      }}
                      title="Exportar PDF"
                      aria-label="Exportar PDF"
                    >
                      <Printer size={13} />
                    </button>
                  </div>
                </Link>
              ))}
              {!loading && !error && decks.length > 0 && visibleDecks.length === 0 && (
                <p className="report-card-empty">
                  Nenhum deck encontrado com esse termo.
                </p>
              )}
              {!loading && !error && decks.length === 0 && (
                <p className="report-card-empty">
                  Nenhum deck ainda.{' '}
                  <Link to="/admin/slides">Crie o primeiro.</Link>
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Braces,
  FileText,
  LayoutGrid,
  Library,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  PUBLICATION_KINDS,
  publicationMode,
  withSystemPublications,
} from '../lib/publicationKinds.js'
import { fetchReports } from '../lib/registry.js'
import { formatReportDate } from '../lib/theme.js'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'

const KIND_ICONS = Object.freeze({
  report: FileText,
  document: BookOpen,
  dashboard: BarChart3,
  reference: Braces,
})

export default function Home() {
  useAppChromeTheme('Central')
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadPublications() {
      try {
        setLoading(true)
        setError(null)
        const data = withSystemPublications(await fetchReports())
        if (!cancelled) setPublications(data)
      } catch (nextError) {
        if (!cancelled) {
          setPublications(withSystemPublications([]))
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
  }, [])

  const counts = useMemo(() => publications.reduce((result, publication) => {
    const mode = publicationMode(publication)
    result[mode] = (result[mode] ?? 0) + 1
    return result
  }, {}), [publications])

  return (
    <div className="report ready publication-hub">
      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <Library size={15} aria-hidden="true" />
            <span className="report-from">Dia · Central de publicações</span>
          </div>
          <span className="report-date">{formatReportDate(new Date().toISOString())}</span>
        </header>

        <h1 className="report-headline">Início</h1>

        <div className="report-intro">
          <p>
            <strong>Todo o conhecimento publicado, organizado pelo modo como será usado.</strong>{' '}
            Entre em uma área para consultar análises, documentação, indicadores ou referências
            técnicas.
          </p>
        </div>

        <hr className="report-rule" />

        <main className="report-body">
          <section className="report-section">
            <div className="section-header">
              <h2 className="section-heading">Publicações</h2>
            </div>
            <div className="publication-kind-grid">
              {PUBLICATION_KINDS.map((kind, index) => {
                const Icon = KIND_ICONS[kind.key]
                const count = counts[kind.key] ?? 0
                return (
                  <Link
                    key={kind.key}
                    to={kind.path}
                    className="publication-kind-card"
                    style={{ '--kind-index': index }}
                  >
                    <div className="publication-kind-top">
                      <span className="publication-kind-icon">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="publication-kind-count">
                        {loading ? '—' : count}
                      </span>
                    </div>
                    <span className="publication-kind-eyebrow">{kind.eyebrow}</span>
                    <h2>{kind.title}</h2>
                    <p>{kind.description}</p>
                    <span className="publication-kind-open">
                      Ver listagem <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </Link>
                )
              })}
            </div>
            {!loading && error ? (
              <p className="publication-hub-error">
                As contagens não puderam ser atualizadas, mas as áreas continuam disponíveis.
              </p>
            ) : null}
          </section>

          <section className="report-section publication-system-section">
            <div className="section-header">
              <h2 className="section-heading">Sistema</h2>
            </div>
            <Link to="/componentes" className="publication-system-card">
              <LayoutGrid size={18} aria-hidden="true" />
              <span>
                <strong>Catálogo de componentes</strong>
                <small>Referência viva gerada diretamente pelo schema.</small>
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
        </main>
      </div>
    </div>
  )
}

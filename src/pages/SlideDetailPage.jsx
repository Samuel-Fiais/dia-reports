import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Printer } from 'lucide-react'
import { getDeck } from '../lib/slidesClient.js'
import { applyTheme, loadSettings, saveSettings } from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'
import SlideRenderer from '../components/slides/SlideRenderer.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'

export default function SlideDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { appTheme } = useAppTheme()
  const [deck, setDeck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [settings, setSettings] = useState(() => {
    return loadSettings(`slides:${id}`, {
      colorIndex: 0,
      fontIndex: 0,
      chartStyleIndex: 2,
      widthMode: 'standard',
      fontScale: 'default',
    })
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getDeck(id)
        if (cancelled) return
        setDeck(data)
        setSettings(
          loadSettings(`slides:${id}`, {
            colorIndex: data?.content?.theme?.colorIndex ?? 0,
            fontIndex: data?.content?.theme?.fontIndex ?? 0,
            chartStyleIndex: 2,
            widthMode: 'standard',
            fontScale: 'default',
          }),
        )
      } catch (err) {
        if (!cancelled) {
          setDeck(null)
          setError(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    if (deck?.content?.title) document.title = deck.content.title
  }, [deck])

  const slides = deck?.content?.slides ?? []
  const theme = { ...(deck?.content?.theme ?? {}), ...settings }

  if (loading) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Carregando apresentação</span>
            </div>
          </header>
          <h1 className="report-headline">Carregando...</h1>
          <div className="report-intro">
            <p>Buscando os dados do deck.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Erro ao carregar</span>
            </div>
          </header>
          <h1 className="report-headline">Não foi possível abrir</h1>
          <div className="report-intro">
            <p>
              A API não respondeu como esperado.{' '}
              <Link to="/slides">Voltar à lista</Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!deck || slides.length === 0) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Apresentação não encontrada</span>
            </div>
          </header>
          <h1 className="report-headline">404</h1>
          <div className="report-intro">
            <p>
              Nenhum deck com o id <code>{id}</code>.{' '}
              <Link to="/slides">Voltar à lista</Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <nav className="report-backnav">
        <Link to="/slides">
          <ArrowLeft size={12} aria-hidden="true" /> Apresentações
        </Link>
      </nav>

      <div className="report-topnav">
        <button
          type="button"
          className="slide-detail-btn slide-detail-btn--present"
          onClick={() => navigate(`/slides/${id}`)}
        >
          <Play size={14} aria-hidden="true" /> Apresentar
        </button>
        <button
          type="button"
          className="slide-detail-btn"
          onClick={() => window.print()}
          title="Exportar PDF"
        >
          <Printer size={14} aria-hidden="true" /> PDF
        </button>
      </div>

      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">{deck?.content?.title ?? deck.title}</span>
            </div>
          </header>

          <h1 className="report-headline">{deck?.content?.title ?? deck.title}</h1>

          {deck?.content?.slides?.[0]?.content?.subtitle && (
            <div className="report-intro">
              <p>{deck.content.slides[0].content.subtitle}</p>
            </div>
          )}

          <hr className="report-rule" />

          <main className="report-body">
            <section className="report-section">
              <div className="section-header">
                <h2 className="section-heading">
                  {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
                </h2>
              </div>
              <div className="slide-detail-stack">
                {slides.map((slide, i) => (
                  <div key={i} className="slide-detail-card">
                    <div className="slide-detail-card-header">
                      <span className="slide-detail-card-num">Slide {i + 1}</span>
                      <span className="item-badge">{slide.layout}</span>
                    </div>
                    <div className="slide-detail-card-preview">
                      <SlideRenderer slide={slide} theme={theme} variant="detail" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      <SettingsPanel settings={settings} onChange={(next) => {
        setSettings(next)
        saveSettings(`slides:${id}`, next)
      }} />
    </>
  )
}

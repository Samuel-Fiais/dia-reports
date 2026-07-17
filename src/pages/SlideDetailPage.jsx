import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Palette, Play, Printer, RotateCcw } from 'lucide-react'
import { getDeck } from '../lib/slidesClient.js'
import {
  applyTheme, loadSettings, saveSettings,
  loadSlideColorOverrides, saveSlideColorOverrides,
  COLORS, COLORS_DARK, COLOR_NAMES,
} from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'
import { useClickOutside } from '../lib/useClickOutside.js'
import SlideRenderer from '../components/slides/SlideRenderer.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'

/* Popover discreto no cabeçalho de cada slide para sobrescrever só a cor de
   fundo daquele slide específico, sem mexer no tema padrão da apresentação. */
function SlideColorPicker({ value, onChange, onReset }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const { appTheme } = useAppTheme()
  const colors = appTheme === 'dark' ? COLORS_DARK : COLORS

  useEffect(() => {
    if (!open) return undefined

    const closeIfOutside = (event) => {
      if (
        !wrapRef.current?.contains(event.target)
        && !panelRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOnViewportChange = () => setOpen(false)

    document.addEventListener('mousedown', closeIfOutside)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('scroll', closeOnViewportChange, true)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [open])

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    setOpen(true)
  }

  return (
    <div className="slide-color-picker" ref={wrapRef}>
      <button
        type="button"
        className={`slide-color-picker-btn${value != null ? ' active' : ''}`}
        title="Cor deste slide"
        aria-label="Cor deste slide"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggle()
        }}
      >
        <Palette size={14} aria-hidden="true" />
      </button>
      {open && position && createPortal(
        <div
          ref={panelRef}
          className="slide-color-picker-panel"
          role="dialog"
          aria-label="Escolher cor deste slide"
          style={position}
        >
          <div className="settings-swatches">
            {colors.map((color, i) => (
              <button
                key={color}
                type="button"
                className={`swatch${value === i ? ' active' : ''}`}
                style={{ background: color }}
                title={COLOR_NAMES[i] ?? `Cor ${i + 1}`}
                data-name={COLOR_NAMES[i] ?? `Cor ${i + 1}`}
                onClick={() => { onChange(i); setOpen(false) }}
              />
            ))}
          </div>
          {value != null && (
            <button
              type="button"
              className="slide-color-picker-reset"
              onClick={() => { onReset(); setOpen(false) }}
            >
              <RotateCcw size={11} /> Usar cor padrão
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}

function PresentMenu({ onPresent }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useClickOutside(wrapRef, open, () => setOpen(false))

  return (
    <div className="report-share" ref={wrapRef}>
      <button
        type="button"
        className="report-share-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="report-share-main-icon" size={16} aria-hidden="true" />
        Menu
      </button>
      {open && (
        <div className="report-share-menu" role="menu">
          <button type="button" className="report-share-option" role="menuitem" onClick={() => { setOpen(false); onPresent() }}>
            <span className="report-share-option-icon" aria-hidden="true"><Play size={16} /></span>
            <span><strong>Apresentar</strong><small>Abrir em modo de apresentação</small></span>
          </button>
          <button
            type="button"
            className="report-share-option"
            role="menuitem"
            onClick={() => { setOpen(false); window.setTimeout(() => window.print(), 0) }}
          >
            <span className="report-share-option-icon" aria-hidden="true"><Printer size={16} /></span>
            <span><strong>Imprimir ou salvar PDF</strong><small>Abrir as opções de impressão</small></span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function SlideDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { appTheme } = useAppTheme()
  const [deck, setDeck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [colorOverrides, setColorOverrides] = useState(() => loadSlideColorOverrides(id))

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
        setColorOverrides(loadSlideColorOverrides(id))
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

  // Mesmo mecanismo de um relatório: aplica claro/escuro, cor, fonte etc. no
  // documento inteiro, para a página se comportar de forma idêntica.
  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    if (deck?.content?.title) document.title = deck.content.title
  }, [deck])

  const slides = deck?.content?.slides ?? []
  const theme = { ...(deck?.content?.theme ?? {}), ...settings }

  const setSlideColor = (index, colorIndex) => {
    const next = { ...colorOverrides, [index]: colorIndex }
    setColorOverrides(next)
    saveSlideColorOverrides(id, next)
  }

  const resetSlideColor = (index) => {
    const next = { ...colorOverrides }
    delete next[index]
    setColorOverrides(next)
    saveSlideColorOverrides(id, next)
  }

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
        <PresentMenu onPresent={() => navigate(`/slides/${id}`)} />
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
                {slides.map((slide, i) => {
                  const colorOverride = colorOverrides[i]
                  const effectiveSlide = colorOverride == null
                    ? slide
                    : { ...slide, theme: { ...slide.theme, colorIndex: colorOverride } }
                  return (
                    <div key={i} className="slide-detail-card">
                      <div className="slide-detail-card-header">
                        <span className="slide-detail-card-num">Slide {i + 1}</span>
                        <span className="item-badge">{slide.layout}</span>
                        <SlideColorPicker
                          value={colorOverride ?? null}
                          onChange={(colorIndex) => setSlideColor(i, colorIndex)}
                          onReset={() => resetSlideColor(i)}
                        />
                      </div>
                      <div className="slide-detail-card-preview">
                        <SlideRenderer slide={effectiveSlide} theme={theme} variant="detail" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </main>
        </div>
      </div>

      <SettingsPanel
        settings={settings}
        title="Personalizar apresentação"
        onChange={(next) => {
          setSettings(next)
          saveSettings(`slides:${id}`, next)
        }}
      />
    </>
  )
}

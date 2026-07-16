import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Grid3X3, Maximize2, Minimize2, Printer, X } from 'lucide-react'
import { getDeck } from '../lib/slidesClient.js'
import { useAppTheme } from '../context/ThemeContext.jsx'
import SlideRenderer from '../components/slides/SlideRenderer.jsx'

function getSlidePreview(slide, index) {
  const content = slide?.content ?? {}
  const title = content.title ?? content.subtitle ?? `Slide ${index + 1}`
  const text = content.text ?? content.items?.[0] ?? content.left?.title ?? content.right?.title ?? ''
  return { title, text }
}

export default function SlideViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isExport = searchParams.get('export') === '1'
  const { appTheme } = useAppTheme()
  const variant = appTheme === 'dark' ? 'viewer' : 'detail'
  const [deck, setDeck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const wrapRef = useRef(null)
  const thumbnailStripRef = useRef(null)
  const touchRef = useRef({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 })
  const hasEnteredFullscreenRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await getDeck(id)
        if (!cancelled) setDeck(data)
      } catch {
        if (!cancelled) setDeck(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Auto-print quando ?export=1
  useEffect(() => {
    if (isExport && !loading && deck && slides.length > 0) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isExport, loading, deck])

  useEffect(() => {
    document.body.classList.add('slide-viewer-active')
    return () => document.body.classList.remove('slide-viewer-active')
  }, [])

  const slides = deck?.content?.slides ?? []
  const theme = deck?.content?.theme ?? {}
  const total = slides.length
  const hasPrev = currentSlide > 0
  const hasNext = currentSlide < total - 1

  const goPrev = useCallback(() => {
    setCurrentSlide((s) => Math.max(0, s - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentSlide((s) => Math.min(total - 1, s + 1))
  }, [total])

  const goTo = useCallback((idx) => {
    setCurrentSlide(Math.max(0, Math.min(total - 1, idx)))
  }, [total])

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      requestFullscreen()
    }
  }, [requestFullscreen])

  useEffect(() => {
    if (deck?.content?.title) {
      document.title = `${deck.content.title} — Apresentação`
    }
    return () => { document.title = 'Dia Reports' }
  }, [deck])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'Escape') navigate(`/slides/${id}/view`)
      else if (e.key === 'n' || e.key === 'N') setShowNotes((v) => !v)
      else if (e.key === 'g' || e.key === 'G') setShowThumbnails((v) => !v)
      else if (e.key === 'Home') goTo(0)
      else if (e.key === 'End') goTo(total - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, goTo, navigate, total])

  useEffect(() => {
    function handleFullscreenChange() {
      const active = Boolean(document.fullscreenElement)
      setIsFullscreen(active)
      if (!active && hasEnteredFullscreenRef.current) {
        // User pressed Esc — go back to viewer page instead of list
        hasEnteredFullscreenRef.current = false
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (document.fullscreenElement) document.exitFullscreen()
    }
  }, [navigate])

  useEffect(() => {
    const activeThumb = thumbnailStripRef.current?.querySelector(`[data-slide-thumb="${currentSlide}"]`)
    activeThumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentSlide, showThumbnails])

  // Focus trap
  useEffect(() => {
    wrapRef.current?.focus()
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    touchRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current.active || e.touches.length !== 1) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchRef.current.startX
    const dy = touch.clientY - touchRef.current.startY
    touchRef.current.currentX = touch.clientX
    touchRef.current.currentY = touch.clientY

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      e.preventDefault()
      setSwipeOffset(Math.max(-90, Math.min(90, dx)))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current.active) return
    const dx = touchRef.current.currentX - touchRef.current.startX
    const dy = touchRef.current.currentY - touchRef.current.startY
    touchRef.current.active = false
    setSwipeOffset(0)

    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) goNext()
    else goPrev()
  }, [goNext, goPrev])

  if (loading) {
    return (
      <div className="slide-viewer-shell">
        <div className="slide-loading">Carregando apresentação...</div>
      </div>
    )
  }

  if (!deck || slides.length === 0) {
    return (
      <div className="slide-viewer-shell">
        <div className="slide-loading">Apresentação não encontrada.</div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="slide-viewer-shell" ref={wrapRef} tabIndex={-1} style={{ background: variant === 'detail' ? '#faf9f5' : '#111' }}>
      <div
        className="slide-viewer"
        style={{ background: variant === 'detail' ? '#fff' : '#1a1a1a' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className="slide-viewer-inner"
          style={{ '--swipe-offset': `${swipeOffset}px` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`slide${i === currentSlide ? ' slide--active' : ''}`}
              data-transition={theme.transition ?? 'fade'}
              aria-hidden={i !== currentSlide}
            >
              <SlideRenderer slide={slide} theme={theme} variant={variant} />
            </div>
          ))}

          {/* Speaker notes */}
          {showNotes && currentSlideData?.notes && (
            <div className="slide-notes-panel">
              <div className="slide-notes-label">Notas do apresentador</div>
              {currentSlideData.notes}
            </div>
          )}

          {/* Navigation hotspots */}
          {hasPrev && (
            <button
              type="button"
              className="slide-nav-area slide-nav-area--left"
              onClick={goPrev}
              aria-label="Slide anterior"
            >
              <span className="slide-nav-arrow">
                <ArrowLeft size={20} />
              </span>
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              className="slide-nav-area slide-nav-area--right"
              onClick={goNext}
              aria-label="Próximo slide"
            >
              <span className="slide-nav-arrow">
                <ArrowRight size={20} />
              </span>
            </button>
          )}

          {/* Bottom bar */}
          <div className="slide-bottom-bar">
            <span className="slide-counter">
              {currentSlide + 1} / {total}
            </span>
            <div className="slide-bottom-actions">
              <button
                type="button"
                className="slide-control-btn"
                onClick={() => setShowThumbnails((v) => !v)}
                aria-pressed={showThumbnails}
              >
                <Grid3X3 size={13} />
                Miniaturas
              </button>
              <button
                type="button"
                className="slide-control-btn"
                onClick={toggleFullscreen}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                {isFullscreen ? 'Janela' : 'Tela cheia'}
              </button>
              <button
                type="button"
                className="slide-control-btn"
                onClick={() => window.print()}
                title="Exportar PDF"
              >
                <Printer size={13} />
                PDF
              </button>
              <button
                type="button"
                className="slide-exit-btn"
                onClick={() => navigate(`/slides/${id}/view`)}
              >
                <X size={13} />
                Voltar
              </button>
            </div>
          </div>

          {showThumbnails && (
            <div className="slide-thumbnail-strip" ref={thumbnailStripRef} aria-label="Miniaturas dos slides">
              {slides.map((slide, i) => {
                const preview = getSlidePreview(slide, i)
                return (
                  <button
                    key={i}
                    type="button"
                    data-slide-thumb={i}
                    className={`slide-thumbnail${i === currentSlide ? ' slide-thumbnail--active' : ''}`}
                    onClick={() => goTo(i)}
                    aria-current={i === currentSlide ? 'true' : undefined}
                    aria-label={`Ir para slide ${i + 1}`}
                  >
                    <span className="slide-thumbnail-number">{i + 1}</span>
                    <span className="slide-thumbnail-title">{preview.title}</span>
                    {preview.text && <span className="slide-thumbnail-text">{preview.text}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

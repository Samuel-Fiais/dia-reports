import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { getDeck } from '../lib/slidesClient.js'
import SlideRenderer from '../components/slides/SlideRenderer.jsx'

export default function SlideViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const wrapRef = useRef(null)

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
      else if (e.key === 'Escape') navigate('/slides')
      else if (e.key === 'n' || e.key === 'N') setShowNotes((v) => !v)
      else if (e.key === 'Home') goTo(0)
      else if (e.key === 'End') goTo(total - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, goTo, navigate, total])

  // Focus trap
  useEffect(() => {
    wrapRef.current?.focus()
  }, [])

  if (loading) {
    return (
      <div className="slide-viewer-overlay">
        <div className="slide-loading">Carregando apresentação...</div>
      </div>
    )
  }

  if (!deck || slides.length === 0) {
    return (
      <div className="slide-viewer-overlay">
        <div className="slide-loading">Apresentação não encontrada.</div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="slide-viewer-overlay" ref={wrapRef} tabIndex={-1}>
      <div className="slide-viewer">
        <div className="slide-viewer-inner">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`slide${i === currentSlide ? ' slide--active' : ''}`}
              data-transition={theme.transition ?? 'fade'}
              aria-hidden={i !== currentSlide}
            >
              <SlideRenderer slide={slide} theme={theme} />
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
            <button
              type="button"
              className="slide-exit-btn"
              onClick={() => navigate('/slides')}
            >
              <X size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

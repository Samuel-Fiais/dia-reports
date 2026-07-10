import { useEffect, useRef, useState } from 'react'

export default function ShareButton({ reportId }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const closeWithKeyboard = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeWithKeyboard)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeWithKeyboard)
    }
  }, [open])

  const link = `${window.location.origin}/report/${reportId}?shared=1`

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: link })
      } else {
        await navigator.clipboard.writeText(link)
        setCopied(true)
      }
      setOpen(false)
    } catch (error) {
      if (error?.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(link)
        setCopied(true)
      } catch {
        setOpen(true)
      }
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setOpen(false)
    } catch {
      setOpen(true)
    }
  }

  const print = () => {
    setOpen(false)
    window.setTimeout(() => window.print(), 0)
  }

  return (
    <div className="report-share" ref={wrapRef}>
      <button
        type="button"
        className="report-share-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg className="report-share-main-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
        {copied ? 'Copiado ✓' : 'Menu'}
      </button>
      {open && (
        <div className="report-share-menu" role="menu">
          <button type="button" className="report-share-option" role="menuitem" onClick={share}>
            <span className="report-share-option-icon" aria-hidden="true">↗</span>
            <span><strong>Compartilhar relatório</strong><small>Enviar o link desta página</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={copy}>
            <span className="report-share-option-icon" aria-hidden="true">⧉</span>
            <span><strong>Copiar link</strong><small>Copiar para a área de transferência</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={print}>
            <span className="report-share-option-icon" aria-hidden="true">↓</span>
            <span><strong>Imprimir ou salvar PDF</strong><small>Abrir as opções de impressão</small></span>
          </button>
          <p className="report-share-hint">O link compartilhado abre somente este relatório.</p>
        </div>
      )}
    </div>
  )
}

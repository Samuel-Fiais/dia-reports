import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Copy, MoreHorizontal, Printer } from 'lucide-react'
import { useClickOutside } from '../lib/useClickOutside.js'

export default function ShareButton({ reportId }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  useClickOutside(wrapRef, open, () => setOpen(false))

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
        <MoreHorizontal className="report-share-main-icon" size={16} aria-hidden="true" />
        {copied ? (
          <>
            Copiado <Check size={14} aria-hidden="true" />
          </>
        ) : (
          'Menu'
        )}
      </button>
      {open && (
        <div className="report-share-menu" role="menu">
          <button type="button" className="report-share-option" role="menuitem" onClick={share}>
            <span className="report-share-option-icon" aria-hidden="true"><ArrowUpRight size={16} /></span>
            <span><strong>Compartilhar relatório</strong><small>Enviar o link desta página</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={copy}>
            <span className="report-share-option-icon" aria-hidden="true"><Copy size={16} /></span>
            <span><strong>Copiar link</strong><small>Copiar para a área de transferência</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={print}>
            <span className="report-share-option-icon" aria-hidden="true"><Printer size={16} /></span>
            <span><strong>Imprimir ou salvar PDF</strong><small>Abrir as opções de impressão</small></span>
          </button>
          <p className="report-share-hint">O link compartilhado abre somente este relatório.</p>
        </div>
      )}
    </div>
  )
}

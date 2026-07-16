import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Copy, MoreHorizontal, Printer } from 'lucide-react'
import { useClickOutside } from '../lib/useClickOutside.js'

export default function ShareButton({ reportId }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  useClickOutside(wrapRef, open, () => setOpen(false))

  const generateAndCopy = async () => {
    setGenerating(true)
    try {
      // Gera token de compartilhamento via API
      const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao gerar link')
      const data = await res.json()
      const url = `${window.location.origin}/shared/${data.token}`
      setShareUrl(url)
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Fallback: copia link do proprio relatorio
      const url = `${window.location.origin}/report/${reportId}`
      setShareUrl(url)
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {}
    } finally {
      setGenerating(false)
      setOpen(false)
    }
  }

  const copyLink = async () => {
    if (!shareUrl) {
      try {
        const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setShareUrl(`${window.location.origin}/shared/${data.token}`)
      } catch {}
    }
    const url = shareUrl || `${window.location.origin}/report/${reportId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {}
    setOpen(false)
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
          <button type="button" className="report-share-option" role="menuitem" onClick={generateAndCopy} disabled={generating}>
            <span className="report-share-option-icon" aria-hidden="true"><ArrowUpRight size={16} /></span>
            <span><strong>Compartilhar relatório</strong><small>{generating ? 'Gerando link...' : 'Criar link seguro e copiar'}</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={copyLink}>
            <span className="report-share-option-icon" aria-hidden="true"><Copy size={16} /></span>
            <span><strong>Copiar link</strong><small>Copiar link compartilhável</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={print}>
            <span className="report-share-option-icon" aria-hidden="true"><Printer size={16} /></span>
            <span><strong>Imprimir ou salvar PDF</strong><small>Abrir as opções de impressão</small></span>
          </button>
          <p className="report-share-hint">O link compartilhado usa um token unico e seguro.</p>
        </div>
      )}
    </div>
  )
}

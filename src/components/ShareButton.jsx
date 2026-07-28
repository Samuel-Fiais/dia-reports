import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Copy, MoreHorizontal, Printer } from 'lucide-react'
import { useClickOutside } from '../lib/useClickOutside.js'

export default function ShareButton({
  reportId,
  directUrl,
  noun = 'relatório',
  secure = true,
  anonymous = false,
}) {
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

  const fallbackUrl = directUrl
    ? new URL(directUrl, window.location.origin).href
    : `${window.location.origin}/report/${reportId}`

  const resolveShareUrl = async () => {
    if (!secure) return fallbackUrl
    const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' })
    if (!res.ok) throw new Error('Falha ao gerar link')
    const data = await res.json()
    return `${window.location.origin}/shared/${data.token}`
  }

  const generateAndCopy = async () => {
    setGenerating(true)
    try {
      const url = await resolveShareUrl()
      setShareUrl(url)
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setShareUrl(fallbackUrl)
      try {
        await navigator.clipboard.writeText(fallbackUrl)
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
        const url = await resolveShareUrl()
        setShareUrl(url)
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setOpen(false)
        return
      } catch {}
    }
    const url = shareUrl || fallbackUrl
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
            <span>
              <strong>Compartilhar {noun}</strong>
              <small>
                {generating
                  ? 'Gerando link...'
                  : secure
                    ? 'Criar link seguro e copiar'
                    : anonymous
                      ? 'Criar link anônimo e copiar'
                      : 'Copiar link da publicação'}
              </small>
            </span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={copyLink}>
            <span className="report-share-option-icon" aria-hidden="true"><Copy size={16} /></span>
            <span><strong>Copiar link</strong><small>Copiar link compartilhável</small></span>
          </button>
          <button type="button" className="report-share-option" role="menuitem" onClick={print}>
            <span className="report-share-option-icon" aria-hidden="true"><Printer size={16} /></span>
            <span><strong>Imprimir ou salvar PDF</strong><small>Abrir as opções de impressão</small></span>
          </button>
          <p className="report-share-hint">
            {secure
              ? 'O link compartilhado usa um token único e seguro.'
              : anonymous
                ? `O link abre esta ${noun} sem exigir login.`
                : `O link abre esta ${noun} para usuários autenticados.`}
          </p>
        </div>
      )}
    </div>
  )
}

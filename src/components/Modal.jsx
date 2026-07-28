import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { renderInline } from '../lib/inline.jsx'

const ModalContext = createContext({ openModal: () => {} })
let bodyScrollLocks = 0

function lockBodyScroll() {
  const body = document.body
  bodyScrollLocks += 1
  if (bodyScrollLocks === 1) {
    // Remove bloqueios inline deixados por versões anteriores do modal. A
    // classe passa a ser a única fonte de verdade e sempre é reversível.
    if (body.style.overflow === 'hidden') body.style.removeProperty('overflow')
    body.classList.add('dia-modal-scroll-lock')
  }

  let released = false
  return () => {
    if (released) return
    released = true
    bodyScrollLocks = Math.max(0, bodyScrollLocks - 1)
    if (bodyScrollLocks === 0) body.classList.remove('dia-modal-scroll-lock')
  }
}

export function useModal() {
  return useContext(ModalContext)
}

/* Conteúdo de um modal de detalhes ("drilldown"):
   { title, subtitle, text, fields: [{label, value}], blocks: [...] }
   `blocks` é renderizado pelo mesmo motor dos itens (injetado via renderBlocks
   para evitar import circular com o switch de blocos). */
export function ModalProvider({ renderBlocks, children }) {
  const [modal, setModal] = useState(null)
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = useId()

  const openModal = useCallback((details) => {
    if (details) {
      returnFocusRef.current = document.activeElement
      setModal(details)
    }
  }, [])

  const close = useCallback(() => setModal(null), [])

  useEffect(() => {
    if (!modal) {
      // Também recupera o scroll após HMR/navegação caso uma versão antiga
      // tenha deixado overflow:hidden diretamente no body.
      if (bodyScrollLocks === 0) {
        document.body.classList.remove('dia-modal-scroll-lock')
        if (document.body.style.overflow === 'hidden') document.body.style.removeProperty('overflow')
      }
      return undefined
    }
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const unlockBodyScroll = lockBodyScroll()
    dialogRef.current?.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyScroll()
      returnFocusRef.current?.focus?.()
    }
  }, [modal, close])

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      {modal && (
        <div className="dia-modal-backdrop" onClick={close}>
          <div
            ref={dialogRef}
            className={`dia-modal dia-modal--${modal.size ?? 'medium'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modal.title ? titleId : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="dia-modal-close" onClick={close} aria-label="Fechar">
              <X size={18} />
            </button>
            {modal.eyebrow && <span className="dia-modal-eyebrow">{modal.eyebrow}</span>}
            {modal.title && <h3 id={titleId} className="dia-modal-title">{renderInline(modal.title)}</h3>}
            {modal.subtitle && <p className="dia-modal-subtitle">{renderInline(modal.subtitle)}</p>}
            {modal.fields?.length > 0 && (
              <dl className="dia-modal-fields">
                {modal.fields.map((f, i) => (
                  <div key={i} className="dia-modal-field">
                    <dt>{f.label}</dt>
                    <dd>{renderInline(String(f.value))}</dd>
                  </div>
                ))}
              </dl>
            )}
            {modal.text && <p className="dia-modal-text">{renderInline(modal.text)}</p>}
            {modal.blocks?.length > 0 && renderBlocks && (
              <div className="dia-modal-blocks">{renderBlocks(modal.blocks)}</div>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

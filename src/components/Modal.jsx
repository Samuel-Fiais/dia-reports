import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

  const openModal = useCallback((details) => {
    if (details) setModal(details)
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
    }
    document.addEventListener('keydown', onKey)
    const unlockBodyScroll = lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [modal, close])

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      {modal && (
        <div className="dia-modal-backdrop" onClick={close}>
          <div className={`dia-modal dia-modal--${modal.size ?? 'medium'}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="dia-modal-close" onClick={close} aria-label="Fechar">
              <X size={18} />
            </button>
            {modal.eyebrow && <span className="dia-modal-eyebrow">{modal.eyebrow}</span>}
            {modal.title && <h3 className="dia-modal-title">{renderInline(modal.title)}</h3>}
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

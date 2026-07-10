import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { renderInline } from '../lib/inline.jsx'

const ModalContext = createContext({ openModal: () => {} })

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
    if (!modal) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modal, close])

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      {modal && (
        <div className="dia-modal-backdrop" onClick={close}>
          <div className="dia-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="dia-modal-close" onClick={close} aria-label="Fechar">
              ×
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

import { X } from 'lucide-react'

// Chrome genérico de modal (backdrop + moldura + botão fechar + eyebrow/título),
// reaproveitando as classes .dia-modal-* já usadas pelo modal de conteúdo de
// relatório. Quem chama controla o corpo via children — formulário, texto, o que for.
export default function Dialog({ eyebrow, title, onClose, children, className = '' }) {
  return (
    <div className="dia-modal-backdrop" onClick={onClose}>
      <div
        className={`dia-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="dia-modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        {eyebrow && <span className="dia-modal-eyebrow">{eyebrow}</span>}
        {title && <h3 className="dia-modal-title">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

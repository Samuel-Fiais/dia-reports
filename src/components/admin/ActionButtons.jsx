import { Pencil, Trash2 } from 'lucide-react'

// Par de ícones editar/excluir usado em toda linha de tabela administrativa.
// `disableDelete` cobre casos como "não pode excluir a própria conta" — some
// silenciosamente em vez de deixar o usuário clicar e receber um erro do servidor.
export default function ActionButtons({ onEdit, onDelete, disableDelete }) {
  return (
    <>
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label="Editar" title="Editar">
          <Pencil size={14} />
        </button>
      )}
      {!disableDelete && (
        <button type="button" onClick={onDelete} aria-label="Excluir" title="Excluir">
          <Trash2 size={14} />
        </button>
      )}
    </>
  )
}

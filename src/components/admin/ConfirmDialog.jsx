import { AlertTriangle } from 'lucide-react'
import Dialog from './Dialog.jsx'
import FormActions from './FormActions.jsx'

// Modal de confirmação genérico — substitui window.confirm/window.alert em fluxos
// destrutivos (excluir grupo, perfil, usuário, relatório...) mantendo a imersão do
// app. `error`, se presente, mostra a mensagem sem fechar o modal (ex.: falha na
// exclusão), permitindo tentar de novo ou cancelar.
export default function ConfirmDialog({
  title = 'Confirmar ação',
  message,
  confirmLabel = 'Confirmar',
  confirmBusyLabel = 'Excluindo...',
  cancelLabel = 'Cancelar',
  error,
  busy,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog className="dia-modal--confirm" onClose={onCancel}>
      <div className="confirm-dialog-icon">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <h3 className="dia-modal-title confirm-dialog-title">{title}</h3>
      {message && <p className="dia-modal-text confirm-dialog-message">{message}</p>}
      {error && <p className="login-error">{error}</p>}
      <FormActions
        type="button"
        onCancel={onCancel}
        onSubmit={onConfirm}
        cancelLabel={cancelLabel}
        submitLabel={confirmLabel}
        submitBusyLabel={confirmBusyLabel}
        busy={busy}
        danger
      />
    </Dialog>
  )
}

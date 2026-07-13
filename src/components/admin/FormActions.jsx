// Par de botões cancelar/confirmar de largura igual, usado em todo formulário e
// confirmação administrativa (ver .admin-form-actions em dia.css).
export default function FormActions({
  onCancel,
  cancelLabel = 'Cancelar',
  submitLabel = 'Salvar',
  submitBusyLabel = 'Salvando...',
  busy = false,
  danger = false,
  type = 'submit',
  onSubmit,
}) {
  return (
    <div className="admin-form-actions">
      <button type="button" className="admin-btn-secondary" onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </button>
      <button
        type={type}
        className={danger ? 'confirm-dialog-danger-btn' : 'login-submit'}
        onClick={type === 'button' ? onSubmit : undefined}
        disabled={busy}
      >
        {busy ? submitBusyLabel : submitLabel}
      </button>
    </div>
  )
}

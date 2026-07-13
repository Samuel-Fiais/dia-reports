import { Check } from 'lucide-react'

// Checkbox customizado no mesmo padrão visual do to-do de relatório (caixa
// quadrada, preenche com --ink e mostra o check em --bg quando marcado) — usado
// em vez do checkbox nativo do navegador em todo formulário administrativo.
export default function Checkbox({ checked, onChange, disabled, emphasis, children }) {
  return (
    <label className={`sys-checkbox${emphasis ? ' sys-checkbox--emphasis' : ''}${disabled ? ' sys-checkbox--disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="sys-checkbox-box">
        <Check aria-hidden="true" />
      </span>
      {children}
    </label>
  )
}

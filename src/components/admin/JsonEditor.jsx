import { Check, WandSparkles, X } from 'lucide-react'

// Textarea de JSON com cabeçalho de status (válido/inválido) e um botão pra
// reformatar (pretty-print) o conteúdo atual.
export default function JsonEditor({ value, onChange, valid, rows = 14 }) {
  const lineCount = value ? value.split('\n').length : 0

  const format = () => {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2))
    } catch {
      /* JSON inválido — botão não faz nada, o erro já aparece abaixo do editor */
    }
  }

  return (
    <div className="json-editor">
      <div className="json-editor-bar">
        <span className={`json-editor-status${value ? (valid ? ' json-editor-status--ok' : ' json-editor-status--error') : ''}`}>
          {value ? (
            valid ? (
              <>
                <Check size={12} aria-hidden="true" /> JSON válido
              </>
            ) : (
              <>
                <X size={12} aria-hidden="true" /> JSON inválido
              </>
            )
          ) : (
            'Aguardando conteúdo'
          )}
        </span>
        <div className="json-editor-bar-right">
          <span className="json-editor-linecount">{lineCount} linhas</span>
          <button type="button" onClick={format} disabled={!valid} title="Formatar JSON">
            <WandSparkles size={13} aria-hidden="true" /> Formatar
          </button>
        </div>
      </div>
      <textarea
        className="json-editor-textarea"
        rows={rows}
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

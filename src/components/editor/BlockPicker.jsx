import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { BLOCK_TYPES, BLOCK_TYPES_HIDDEN } from '../../lib/blockRegistry.js'

export default function BlockPicker({ onPick, onClose, bodyOnly = false }) {
  const [query, setQuery] = useState('')
  const entries = useMemo(() => Object.entries(BLOCK_TYPES).filter(([type, definition]) => {
    if (BLOCK_TYPES_HIDDEN.has(type)) return false
    if (bodyOnly && !['quote-break', 'image-break', 'table-of-contents', 'related-reports'].includes(type)) return false
    if (!bodyOnly && ['quote-break', 'image-break', 'table-of-contents', 'related-reports'].includes(type)) return false
    const needle = query.toLocaleLowerCase('pt-BR')
    return !needle || `${type} ${definition.label} ${definition.category}`.toLocaleLowerCase('pt-BR').includes(needle)
  }), [bodyOnly, query])
  const categories = [...new Set(entries.map(([, definition]) => definition.category))]
  return (
    <div className="editor-picker-backdrop" onClick={onClose}>
      <div className="editor-picker" role="dialog" aria-modal="true" aria-label="Escolher bloco" onClick={(event) => event.stopPropagation()}>
        <div className="editor-picker-head"><div><span>Biblioteca</span><h2>Adicionar bloco</h2></div><button type="button" className="editor-icon-btn" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
        <label className="editor-picker-search"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar entre todos os tipos…" /></label>
        <div className="editor-picker-list">{categories.map((category) => <section key={category}><h3>{category}</h3><div className="editor-picker-grid">{entries.filter(([, definition]) => definition.category === category).map(([type, definition]) => <button type="button" key={type} onClick={() => onPick(type)}><strong>{definition.label}</strong><code>{type}</code></button>)}</div></section>)}</div>
      </div>
    </div>
  )
}

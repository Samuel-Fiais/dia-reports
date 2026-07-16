import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2, X } from 'lucide-react'
import Checkbox from '../admin/Checkbox.jsx'
import { renderBlocks } from '../blocks/index.jsx'
import { renderInline } from '../../lib/inline.jsx'
import { createBlock, getBlockDefinition } from '../../lib/blockRegistry.js'
import BlockPicker from './BlockPicker.jsx'
import { EditorFields } from './fields/EditorFields.jsx'

const MODAL_FIELDS = [
  { key: 'eyebrow', type: 'text', label: 'Eyebrow' },
  { key: 'title', type: 'text', label: 'Título' },
  { key: 'subtitle', type: 'text', label: 'Subtítulo' },
  { key: 'text', type: 'textarea', label: 'Texto' },
  { key: 'size', type: 'select', label: 'Tamanho', options: [
    { value: 'small', label: 'Pequena' }, { value: 'medium', label: 'Média' },
    { value: 'large', label: 'Grande' }, { value: 'full', label: 'Tela cheia' },
  ] },
]

function ModalPreview({ details }) {
  return (
    <div className={`editor-modal-preview-card editor-modal-preview-card--${details.size ?? 'medium'}`}>
      {details.eyebrow && <span className="dia-modal-eyebrow">{details.eyebrow}</span>}
      {details.title && <h3 className="dia-modal-title">{renderInline(details.title)}</h3>}
      {details.subtitle && <p className="dia-modal-subtitle">{renderInline(details.subtitle)}</p>}
      {details.text && <p className="dia-modal-text">{renderInline(details.text)}</p>}
      {(details.blocks ?? []).length > 0
        ? <div className="dia-modal-blocks">{renderBlocks(details.blocks, 2, 'modal-editor')}</div>
        : <div className="editor-modal-preview-empty">Adicione componentes pela coluna à esquerda.</div>}
    </div>
  )
}

function ModalWorkspace({ details, onChange, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const blocks = details.blocks ?? []
  const selected = selectedIndex == null ? null : blocks[selectedIndex]

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const setBlocks = (next) => onChange({ ...details, blocks: next })
  const addBlock = (type) => {
    const next = [...blocks, createBlock(type)]
    setBlocks(next)
    setSelectedIndex(next.length - 1)
    setLibraryOpen(false)
  }
  const removeBlock = (index) => {
    const next = blocks.filter((_, current) => current !== index)
    setBlocks(next)
    setSelectedIndex(next.length ? Math.min(index, next.length - 1) : null)
  }
  const moveBlock = (index, offset) => {
    const target = index + offset
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    const [entry] = next.splice(index, 1)
    next.splice(target, 0, entry)
    setBlocks(next)
    setSelectedIndex(target)
  }

  return (
    <div className="editor-modal-workspace-backdrop" role="presentation">
      <section className="editor-modal-workspace" role="dialog" aria-modal="true" aria-label="Editor da modal">
        <header className="editor-modal-workspace-head">
          <div><span>Editor de modal</span><strong>{details.title || 'Detalhes'}</strong></div>
          <button type="button" className="editor-icon-btn" onClick={onClose} aria-label="Fechar editor da modal"><X size={18} /></button>
        </header>

        <div className="editor-modal-workspace-grid">
          <aside className="editor-modal-workspace-outline">
            <div className="editor-modal-workspace-label">Componentes</div>
            <button type="button" className={`editor-modal-outline-row${selectedIndex == null ? ' active' : ''}`} onClick={() => setSelectedIndex(null)}>
              <Settings2 size={14} /> Configurações da modal
            </button>
            <div className="editor-modal-outline-list">
              {blocks.map((entry, index) => (
                <div key={`${entry.type}:${index}`} className={`editor-modal-outline-row${selectedIndex === index ? ' active' : ''}`}>
                  <button type="button" onClick={() => setSelectedIndex(index)}>{getBlockDefinition(entry.type).label}</button>
                  <div>
                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="Mover para cima"><ArrowUp size={12} /></button>
                    <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} aria-label="Mover para baixo"><ArrowDown size={12} /></button>
                    <button type="button" onClick={() => removeBlock(index)} aria-label="Remover componente"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="editor-modal-workspace-add">
              <button type="button" onClick={() => setLibraryOpen(true)}><Plus size={13} /> Adicionar componente</button>
            </div>
          </aside>

          <main className="editor-modal-workspace-preview"><ModalPreview details={details} /></main>

          <aside className="editor-modal-workspace-inspector">
            <div className="editor-modal-workspace-label">Inspector</div>
            {selected ? <>
              <h3>{getBlockDefinition(selected.type).label}</h3>
              <EditorFields
                fields={getBlockDefinition(selected.type).fields}
                value={selected}
                onChange={(next) => setBlocks(blocks.map((entry, index) => index === selectedIndex ? next : entry))}
              />
              <BlockDetailsEditor
                block={selected}
                onChange={(next) => setBlocks(blocks.map((entry, index) => index === selectedIndex ? next : entry))}
              />
            </> : <>
              <h3>Configurações da modal</h3>
              <EditorFields fields={MODAL_FIELDS} value={details} onChange={onChange} />
            </>}
          </aside>
        </div>
        {libraryOpen && <BlockPicker onPick={addBlock} onClose={() => setLibraryOpen(false)} />}
      </section>
    </div>
  )
}

export default function BlockDetailsEditor({ block, onChange }) {
  const [open, setOpen] = useState(false)
  const details = block.details
  const setDetails = (next) => onChange({ ...block, details: next })
  const disable = () => {
    const next = { ...block }
    delete next.details
    onChange(next)
    setOpen(false)
  }
  const enable = () => {
    setDetails({ title: 'Detalhes', size: 'medium', blocks: [] })
    setOpen(true)
  }

  return (
    <div className="editor-settings editor-modal-config">
      <h3>Modal ao clicar</h3>
      <div className="editor-modal-config-row">
        <Checkbox checked={Boolean(details)} onChange={details ? disable : enable}>Abrir modal ao clicar</Checkbox>
        {details && <button type="button" className="editor-secondary-btn" onClick={() => setOpen(true)}><Settings2 size={14} /> Editar modal</button>}
      </div>
      {details && <p className="editor-modal-config-summary">{(details.blocks ?? []).length} componente(s) · tamanho {details.size ?? 'medium'}</p>}
      {open && details && <ModalWorkspace details={details} onChange={setDetails} onClose={() => setOpen(false)} />}
    </div>
  )
}

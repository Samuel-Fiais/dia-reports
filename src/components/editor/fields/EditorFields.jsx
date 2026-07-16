import { Plus, Trash2, Upload, X } from 'lucide-react'
import Checkbox from '../../admin/Checkbox.jsx'
import SelectControl from '../../SelectControl.jsx'

const optionsFor = (options = []) => options.map((option) => typeof option === 'string' ? { value: option, label: option } : option)

function FieldShell({ label, hint, children }) {
  return (
    <div className="editor-field">
      <span className="editor-field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  )
}

function ArrayEditor({ value = [], onChange, field, numeric = false }) {
  const add = () => onChange([...value, numeric ? 0 : ''])
  const displayValue = (item) => item && typeof item === 'object'
    ? item.label ?? item.name ?? item.key ?? JSON.stringify(item)
    : item ?? ''
  return (
    <FieldShell label={field.label} hint={field.hint}>
      <div className="editor-array">
        {value.map((item, index) => (
          <div className="editor-array-row" key={index}>
            <input type={numeric ? 'number' : 'text'} value={displayValue(item)} onChange={(event) => onChange(value.map((entry, i) => i === index ? (numeric ? Number(event.target.value) : event.target.value) : entry))} />
            <button type="button" className="editor-icon-btn" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label={`Remover item ${index + 1}`}><Trash2 size={13} /></button>
          </div>
        ))}
        <button type="button" className="editor-add-row" onClick={add}><Plus size={13} /> Adicionar</button>
      </div>
    </FieldShell>
  )
}

function ObjectFields({ value = {}, fields = [], onChange }) {
  return <div className="editor-object-fields">{fields.map((field) => <EditorField key={field.key} field={field} value={value[field.key]} onChange={(next) => onChange({ ...value, [field.key]: next })} />)}</div>
}

function ArrayObjectEditor({ value = [], onChange, field }) {
  const add = () => onChange([...value, Object.fromEntries((field.itemFields ?? []).map((entry) => [entry.key, entry.type.startsWith('array') ? [] : entry.type === 'toggle' ? false : '']))])
  return (
    <FieldShell label={field.label} hint={field.hint}>
      <div className="editor-object-list">
        {value.map((item, index) => (
          <div className="editor-object-card" key={index}>
            <div className="editor-object-card-head"><span>Item {index + 1}</span><button type="button" className="editor-icon-btn" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label={`Remover item ${index + 1}`}><Trash2 size={13} /></button></div>
            <ObjectFields value={typeof item === 'object' && item ? item : { label: String(item ?? '') }} fields={field.itemFields} onChange={(next) => onChange(value.map((entry, i) => i === index ? next : entry))} />
          </div>
        ))}
        <button type="button" className="editor-add-row" onClick={add}><Plus size={13} /> Adicionar item</button>
      </div>
    </FieldShell>
  )
}

function TableEditor({ value = [], onChange, field }) {
  const rows = value.map((row) => Array.isArray(row) ? row : row && typeof row === 'object' ? Object.values(row) : [row ?? ''])
  const width = Math.max(1, ...rows.map((row) => row.length))
  const add = () => onChange([...rows, Array.from({ length: width }, () => '')])
  return (
    <FieldShell label={field.label}>
      <div className="editor-table-field">
        {rows.map((row, rowIndex) => (
          <div className="editor-array-row" key={rowIndex}>
            <div className="editor-table-cells">{row.map((cell, columnIndex) => <input key={columnIndex} value={cell ?? ''} onChange={(event) => onChange(rows.map((current, i) => i === rowIndex ? current.map((entry, j) => j === columnIndex ? event.target.value : entry) : current))} />)}</div>
            <button type="button" className="editor-icon-btn" onClick={() => onChange(rows.filter((_, i) => i !== rowIndex))} aria-label={`Remover linha ${rowIndex + 1}`}><Trash2 size={13} /></button>
          </div>
        ))}
        <button type="button" className="editor-add-row" onClick={add}><Plus size={13} /> Adicionar linha</button>
      </div>
    </FieldShell>
  )
}

function KeyValueEditor({ value = {}, onChange, field }) {
  const entries = Object.entries(value)
  const update = (index, key, nextValue) => {
    const next = entries.map(([currentKey, currentValue], i) => i === index ? [key, nextValue] : [currentKey, currentValue])
    onChange(Object.fromEntries(next.filter(([entryKey]) => entryKey)))
  }
  return <FieldShell label={field.label} hint={field.hint}><div className="editor-array">{entries.map(([key, entryValue], index) => <div className="editor-array-row" key={`${key}:${index}`}><input type={field.keyType === 'date' ? 'date' : 'text'} value={key} placeholder="Chave" onChange={(event) => update(index, event.target.value, entryValue)} /><input type={field.valueType === 'number' ? 'number' : 'text'} value={entryValue} placeholder="Valor" onChange={(event) => update(index, key, field.valueType === 'number' ? Number(event.target.value) : event.target.value)} /><button type="button" className="editor-icon-btn" onClick={() => onChange(Object.fromEntries(entries.filter((_, i) => i !== index)))} aria-label={`Remover valor ${index + 1}`}><Trash2 size={13} /></button></div>)}<button type="button" className="editor-add-row" onClick={() => onChange({ ...value, [`item-${entries.length + 1}`]: field.valueType === 'number' ? 0 : '' })}><Plus size={13} /> Adicionar valor</button></div></FieldShell>
}

function ImageField({ value = '', onChange, field }) {
  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }
  return (
    <FieldShell label={field.label}>
      <input type="text" value={value} placeholder="Cole uma URL ou envie um arquivo" onChange={(event) => onChange(event.target.value)} />
      <label className="editor-upload-btn"><Upload size={13} /> Enviar imagem<input type="file" accept="image/*" onChange={handleFile} /></label>
      {value && <button type="button" className="editor-remove-image" onClick={() => onChange('')}><X size={13} /> Remover imagem</button>}
      {value && <img className="editor-image-preview" src={value} alt="Prévia do campo" />}
    </FieldShell>
  )
}

export function EditorField({ field, value, onChange }) {
  if (field.type === 'array-string') return <ArrayEditor field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />
  if (field.type === 'array-number') return <ArrayEditor field={field} value={Array.isArray(value) ? value : []} onChange={onChange} numeric />
  if (field.type === 'array-object') return <ArrayObjectEditor field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />
  if (field.type === 'object') return <FieldShell label={field.label}><ObjectFields fields={field.itemFields} value={value ?? {}} onChange={onChange} /></FieldShell>
  if (field.type === 'table') return <TableEditor field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />
  if (field.type === 'key-value') return <KeyValueEditor field={field} value={value && typeof value === 'object' && !Array.isArray(value) ? value : {}} onChange={onChange} />
  if (field.type === 'image') return <ImageField field={field} value={value ?? ''} onChange={onChange} />
  if (field.type === 'toggle') {
    const checked = Boolean(value ?? field.defaultValue)
    return <div className="editor-toggle"><Checkbox checked={checked} onChange={() => onChange(!checked)}>{field.label}</Checkbox></div>
  }
  if (field.type === 'multi-toggle') {
    const selected = Array.isArray(value) ? value : []
    return <FieldShell label={field.label} hint={field.hint}><div className="editor-multi-toggle">{optionsFor(field.options).map((option) => <Checkbox key={option.value} checked={selected.includes(option.value)} onChange={() => onChange(selected.includes(option.value) ? selected.filter((entry) => entry !== option.value) : [...selected, option.value])}>{option.label}</Checkbox>)}</div></FieldShell>
  }
  if (field.type === 'textarea' || field.type === 'code') return <FieldShell label={field.label} hint={field.hint}><textarea rows={field.type === 'code' ? 8 : 4} className={field.type === 'code' ? 'editor-code-input' : ''} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></FieldShell>
  if (field.type === 'select') return <FieldShell label={field.label}><SelectControl value={value ?? ''} options={optionsFor(field.options)} onChange={onChange} ariaLabel={field.label} /></FieldShell>
  const dateLike = field.type === 'date' || field.type === 'month' || field.type === 'datetime-local'
  const displayValue = dateLike && value ? String(value).slice(0, field.type === 'month' ? 7 : field.type === 'date' ? 10 : 16) : value ?? ''
  return <FieldShell label={field.label} hint={field.hint}><input type={field.type === 'number' ? 'number' : dateLike ? field.type : 'text'} min={field.min} max={field.max} value={displayValue} onChange={(event) => onChange(field.type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value)} /></FieldShell>
}

export function EditorFields({ fields, value, onChange }) {
  return <>{fields.map((field) => <EditorField key={field.key} field={field} value={value?.[field.key]} onChange={(next) => onChange({ ...value, [field.key]: next })} />)}</>
}

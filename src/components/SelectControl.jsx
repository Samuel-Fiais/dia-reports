import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { createPortal } from 'react-dom'

const normalizeOptions = (options = []) => options.map((option) =>
  typeof option === 'string' ? { value: option, label: option } : option)

export default function SelectControl({ value, options, onChange, ariaLabel, className = '', searchable }) {
  const normalized = normalizeOptions(options)
  const selected = normalized.find((option) => String(option.value) === String(value)) ?? normalized[0]
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const hasSearch = searchable ?? normalized.length > 8
  const visible = normalized.filter((option) => !query || option.label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return undefined
    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect()
      const width = Math.max(rect.width, 220)
      const left = Math.min(rect.left, window.innerWidth - width - 12)
      const spaceBelow = window.innerHeight - rect.bottom
      const opensUp = spaceBelow < 280 && rect.top > spaceBelow
      setPosition({ left: Math.max(12, left), top: opensUp ? undefined : rect.bottom + 6, bottom: opensUp ? window.innerHeight - rect.top + 6 : undefined, width })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!buttonRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const choose = (option) => {
    onChange(option.value)
    setOpen(false)
    setQuery('')
    buttonRef.current?.focus()
  }

  return <>
    <button
      ref={buttonRef}
      type="button"
      className={`select-control${open ? ' open' : ''}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setOpen(true)
        }
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <span>{selected?.label ?? 'Selecionar'}</span><ChevronDown size={15} />
    </button>
    {open && position && createPortal(
      <div ref={menuRef} className="select-control-menu" role="listbox" aria-label={ariaLabel} style={position}>
        {hasSearch && <label className="select-control-search"><Search size={14} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar opção…" /></label>}
        <div className="select-control-options">
          {visible.map((option) => {
            const active = String(option.value) === String(value)
            return <button key={String(option.value)} type="button" role="option" aria-selected={active} className={active ? 'active' : ''} onClick={() => choose(option)}><span>{option.label}</span>{active && <Check size={14} />}</button>
          })}
          {!visible.length && <span className="select-control-empty">Nenhuma opção encontrada.</span>}
        </div>
      </div>,
      document.body,
    )}
  </>
}

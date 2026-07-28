import { useState } from 'react'
import { Check } from 'lucide-react'
import { renderInline } from '../lib/inline.jsx'
import { publicationNodeKey } from '../lib/publication.js'
import { blockLabel } from '../lib/labels.js'

const storageKey = (blockKey) => `dia-publication-checklist:${blockKey}`
const itemKey = (item) => publicationNodeKey(item, 'checklist-item')

function loadState(blockKey, items, persist) {
  if (!persist) {
    return Object.fromEntries(items.map((item) => [
      itemKey(item),
      Boolean(item.checked),
    ]))
  }

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(blockKey)))
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) return stored
  } catch {
    // Local persistence is optional.
  }

  return Object.fromEntries(items.map((item) => [
    itemKey(item),
    Boolean(item.checked),
  ]))
}

export default function Checklist({ block, blockKey }) {
  const items = block.items ?? []
  const persist = block.persist !== false
  const [checked, setChecked] = useState(() => loadState(blockKey, items, persist))

  const toggle = (item) => {
    const key = itemKey(item)
    setChecked((current) => {
      const next = { ...current, [key]: !current[key] }
      if (persist) {
        try {
          localStorage.setItem(storageKey(blockKey), JSON.stringify(next))
        } catch {
          // Local persistence is optional.
        }
      }
      return next
    })
  }

  return (
    <ul className="checklist">
      {items.map((item) => {
        const key = itemKey(item)
        const checkedState = Boolean(checked[key])
        const actionLabel = checkedState
          ? blockLabel(block, 'uncheck', 'Desmarcar')
          : blockLabel(block, 'check', 'Marcar')
        return (
          <li key={key} className={`checklist-item${checkedState ? ' checked' : ''}`}>
            <button
              type="button"
              className="checklist-control"
              aria-label={actionLabel}
              aria-pressed={checkedState}
              onClick={() => toggle(item)}
            >
              <Check strokeWidth={3} aria-hidden="true" />
            </button>
            <span>{renderInline(item.text)}</span>
          </li>
        )
      })}
    </ul>
  )
}

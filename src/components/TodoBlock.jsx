import { useState } from 'react'
import { Check } from 'lucide-react'
import { renderInline } from '../lib/inline.jsx'

const storageKey = (blockKey) => `dia-report-todo:${blockKey}`

function loadDone(blockKey, items) {
  try {
    const raw = localStorage.getItem(storageKey(blockKey))
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return items.map((it) => Boolean(it.done))
}

export default function TodoBlock({ block, blockKey }) {
  const items = block.items ?? []
  const [done, setDone] = useState(() => loadDone(blockKey, items))

  const toggle = (i) => {
    const next = done.map((v, idx) => (idx === i ? !v : v))
    setDone(next)
    try {
      localStorage.setItem(storageKey(blockKey), JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  return (
    <ul className="todo-list">
      {items.map((item, i) => (
        <li
          key={item.id ?? i}
          className={`todo-item${done[i] ? ' done' : ''}`}
          onClick={() => toggle(i)}
        >
          <span className="todo-checkbox">
            <Check strokeWidth={3} />
          </span>
          <span>{renderInline(item.text)}</span>
        </li>
      ))}
    </ul>
  )
}

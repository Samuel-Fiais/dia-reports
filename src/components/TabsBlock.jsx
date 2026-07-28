import { useId, useState } from 'react'
import { renderInline } from '../lib/inline.jsx'
import { ItemBlock } from './blocks/index.jsx'

/* Abas horizontais (padrão) ou verticais (`orientation: "vertical"`).
   Cada aba aceita `text`, `items` (lista) ou `blocks` (qualquer bloco). */
export default function TabsBlock({ block }) {
  const tabs = block.tabs ?? []
  const [active, setActive] = useState(0)
  const tab = tabs[active]
  const vertical = block.orientation === 'vertical'
  const baseId = useId()

  const move = (event, index) => {
    const previousKey = vertical ? 'ArrowUp' : 'ArrowLeft'
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight'
    if (![previousKey, nextKey, 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === nextKey ? 1 : -1) + tabs.length) % tabs.length
    setActive(next)
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
    <div className={`tabs${vertical ? ' tabs--vertical' : ''}`}>
      <div className="tabs-nav" role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'}>
        {tabs.map((t, i) => (
          <button
            id={`${baseId}-tab-${i}`}
            key={t.id ?? i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            className={`tabs-tab${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
            onKeyDown={(event) => move(event, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel-${active}`}
        className="tabs-panel"
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
      >
        {tab?.text && <p>{renderInline(tab.text)}</p>}
        {tab?.items && (
          <ul className="item-bullets">
            {tab.items.map((item, i) => (
              <li key={item.id ?? i}>{renderInline(item.text ?? item)}</li>
            ))}
          </ul>
        )}
        {tab?.blocks?.map((b, i) => (
          <ItemBlock key={b.id ?? `${active}:${i}`} block={b} blockKey={b.id ?? `tabs:${active}:${i}`} />
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { renderInline } from '../lib/inline.jsx'
import { ItemBlock } from './blocks/index.jsx'

/* Abas horizontais (padrão) ou verticais (`orientation: "vertical"`).
   Cada aba aceita `text`, `items` (lista) ou `blocks` (qualquer bloco). */
export default function TabsBlock({ block }) {
  const tabs = block.tabs ?? []
  const [active, setActive] = useState(0)
  const tab = tabs[active]
  const vertical = block.orientation === 'vertical'

  return (
    <div className={`tabs${vertical ? ' tabs--vertical' : ''}`}>
      <div className="tabs-nav" role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'}>
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`tabs-tab${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tabs-panel" role="tabpanel">
        {tab?.text && <p>{renderInline(tab.text)}</p>}
        {tab?.items && (
          <ul className="item-bullets">
            {tab.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        )}
        {tab?.blocks?.map((b, i) => (
          <ItemBlock key={`${active}:${i}`} block={b} blockKey={`tabs:${active}:${i}`} />
        ))}
      </div>
    </div>
  )
}

import { renderInline } from '../../lib/inline.jsx'
import { useModal } from '../Modal.jsx'

/* comparison-table: comparação com coluna em destaque e recomendação. */
export function ComparisonTable({ block }) {
  const highlight = block.highlightColumn
  return (
    <table className="data-table comparison-table">
      <thead>
        <tr>
          <th />
          {(block.options ?? []).map((opt, i) => (
            <th key={i} className={i === highlight ? 'highlight' : undefined}>
              {opt}
              {i === highlight && <span className="comparison-reco">Recomendado</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(block.rows ?? []).map((row, i) => (
          <tr key={i}>
            <td className="comparison-attr">{renderInline(row.label)}</td>
            {(row.values ?? []).map((v, j) => (
              <td key={j} className={j === highlight ? 'highlight' : undefined}>
                {renderInline(String(v))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* pros-cons: vantagens × desvantagens. "tradeoffs" é variante com 3 colunas. */
export function ProsCons({ block }) {
  const cols = block.columns ?? [
    { label: block.prosLabel ?? 'Prós', items: block.pros ?? [], tone: 'good' },
    { label: block.consLabel ?? 'Contras', items: block.cons ?? [], tone: 'bad' },
  ]
  return (
    <div className="pros-cons" style={{ '--pc-cols': cols.length }}>
      {cols.map((col, i) => (
        <div key={i} className={`pros-cons-col pros-cons-col--${col.tone ?? 'neutral'}`}>
          <div className="pros-cons-label">{col.label}</div>
          <ul>
            {(col.items ?? []).map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/* option-cards: alternativas comparáveis. "scenario-comparison" usa o mesmo formato. */
export function OptionCards({ block }) {
  const { openModal } = useModal()
  return (
    <div className="option-cards">
      {(block.options ?? []).map((opt, i) => (
        <div
          key={i}
          className={`option-card${opt.recommended ? ' recommended' : ''}${opt.details ? ' clickable' : ''}`}
          onClick={opt.details ? () => openModal(opt.details) : undefined}
        >
          {opt.recommended && <span className="option-card-reco">Recomendado</span>}
          <div className="option-card-title">{renderInline(opt.title)}</div>
          {opt.subtitle && <div className="option-card-subtitle">{renderInline(opt.subtitle)}</div>}
          {opt.attributes?.length > 0 && (
            <dl className="option-card-attrs">
              {opt.attributes.map((attr, j) => (
                <div key={j}>
                  <dt>{attr.label}</dt>
                  <dd>{renderInline(String(attr.value))}</dd>
                </div>
              ))}
            </dl>
          )}
          {opt.note && <p className="option-card-note">{renderInline(opt.note)}</p>}
        </div>
      ))}
    </div>
  )
}

/* swot: forças, fraquezas, oportunidades e ameaças. */
export function Swot({ block }) {
  const quadrants = [
    { key: 'strengths', label: 'Forças' },
    { key: 'weaknesses', label: 'Fraquezas' },
    { key: 'opportunities', label: 'Oportunidades' },
    { key: 'threats', label: 'Ameaças' },
  ]
  return (
    <div className="swot">
      {quadrants.map(({ key, label }) => (
        <div key={key} className={`swot-quadrant swot-quadrant--${key}`}>
          <div className="swot-label">{label}</div>
          <ul>
            {(block[key] ?? []).map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/* dependencies: dependências entre entregas/equipes. */
export function Dependencies({ block }) {
  return (
    <ul className="dependencies">
      {(block.items ?? []).map((dep, i) => (
        <li key={i} className="dependency">
          <span className="dependency-from">{renderInline(dep.from)}</span>
          <span className="dependency-arrow">depende de</span>
          <span className="dependency-on">{renderInline(dep.on)}</span>
          {dep.note && <span className="dependency-note">{renderInline(dep.note)}</span>}
        </li>
      ))}
    </ul>
  )
}

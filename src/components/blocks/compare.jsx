import { renderInline } from '../../lib/inline.jsx'

export function QuadrantGrid({ block }) {
  return (
    <div className="quadrant-grid">
      {block.yAxis && <div className="quadrant-grid-axis quadrant-grid-axis--y">{block.yAxis}</div>}
      <div className="quadrant-grid-cells">
        {(block.quadrants ?? []).map((quadrant, index) => (
          <div key={quadrant.id ?? index} className="quadrant-grid-cell">
            {quadrant.label && <div className="quadrant-grid-label">{quadrant.label}</div>}
            <ul>
              {(quadrant.items ?? []).map((item, itemIndex) => (
                <li key={item.id ?? itemIndex}>{renderInline(item.text ?? item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {block.xAxis && <div className="quadrant-grid-axis quadrant-grid-axis--x">{block.xAxis}</div>}
    </div>
  )
}

export function Relations({ block }) {
  return (
    <ul className="dependencies">
      {(block.items ?? []).map((relation, index) => (
        <li key={relation.id ?? index} className="dependency">
          <span className="dependency-from">{renderInline(relation.from)}</span>
          {block.relationLabel && <span className="dependency-arrow">{block.relationLabel}</span>}
          <span className="dependency-on">{renderInline(relation.to)}</span>
          {relation.note && <span className="dependency-note">{renderInline(relation.note)}</span>}
        </li>
      ))}
    </ul>
  )
}

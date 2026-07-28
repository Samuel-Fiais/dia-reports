import { renderInline } from '../../lib/inline.jsx'
import { blockLabel } from '../../lib/labels.js'
import { TrendIndicator, StatusBadge } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'

/* SVG compacto para séries embutidas em métricas. */
export function Sparkline({ data = [], width = 96, height = 28 }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx={points.at(-1).split(',')[0]} cy={points.at(-1).split(',')[1]} r="1.8" fill="currentColor" />
    </svg>
  )
}

export function MetricGrid({ block }) {
  const { openModal } = useModal()
  return (
    <div className="kpi-grid" style={{ '--kpi-cols': block.columns ?? 3 }}>
      {(block.items ?? []).map((metric, index) => (
        <div
          key={metric.id ?? index}
          className={`kpi${metric.details ? ' clickable' : ''}`}
          onClick={metric.details ? () => openModal(metric.details) : undefined}
          onKeyDown={metric.details ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal(metric.details)
            }
          } : undefined}
          role={metric.details ? 'button' : undefined}
          tabIndex={metric.details ? 0 : undefined}
        >
          <div className="kpi-label">{metric.label}</div>
          <div className="kpi-value-row">
            <span className="kpi-value">{metric.value}</span>
            {metric.spark && <Sparkline data={metric.spark} />}
          </div>
          <div className="kpi-meta">
            {metric.trend && <TrendIndicator trend={metric.trend} value={metric.change} />}
            {metric.reference && (
              <span className="kpi-target">
                {blockLabel(block, 'reference', 'Referência')}: {metric.reference}
              </span>
            )}
          </div>
          {metric.note && <div className="kpi-note">{renderInline(metric.note)}</div>}
        </div>
      ))}
    </div>
  )
}

export function Scorecard({ block }) {
  const { openModal } = useModal()
  return (
    <div className="scorecard">
      {(block.items ?? []).map((item, index) => (
        <div
          key={item.id ?? index}
          className={`scorecard-row${item.details ? ' clickable' : ''}`}
          onClick={item.details ? () => openModal(item.details) : undefined}
          onKeyDown={item.details ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal(item.details)
            }
          } : undefined}
          role={item.details ? 'button' : undefined}
          tabIndex={item.details ? 0 : undefined}
        >
          {item.state && <StatusBadge status={item.state} />}
          <span className="scorecard-label">{renderInline(item.label)}</span>
          <span className="scorecard-value">{item.value}</span>
          {item.note && <span className="scorecard-note">{renderInline(item.note)}</span>}
        </div>
      ))}
    </div>
  )
}

export function Funnel({ block }) {
  const items = block.steps ?? []
  const max = Math.max(...items.map((s) => Number(s.value) || 0), 1)
  return (
    <div className="funnel">
      {items.map((step, i) => {
        const pct = ((Number(step.value) || 0) / max) * 100
        const prev = i > 0 ? Number(items[i - 1].value) || 0 : null
        const conv = prev ? Math.round(((Number(step.value) || 0) / prev) * 100) : null
        return (
          <div key={step.id ?? i} className="funnel-step">
            <div className="funnel-labels">
              <span className="funnel-name">{step.label}</span>
              <span className="funnel-value">
                {step.display ?? step.value}
                {conv != null && <span className="funnel-conv"> · {conv}%</span>}
              </span>
            </div>
            <div className="funnel-bar-track">
              <div className="funnel-bar" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Gauge({ block }) {
  const pct = Math.max(0, Math.min(100, Number(block.value) || 0))
  const r = 54
  const circ = Math.PI * r
  return (
    <div className="gauge">
      <svg viewBox="0 0 128 76" className="gauge-svg">
        <path d="M 10 70 A 54 54 0 0 1 118 70" fill="none" className="gauge-track" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 70 A 54 54 0 0 1 118 70"
          fill="none"
          className="gauge-fill"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-value">{block.display ?? `${pct}%`}</span>
        {block.label && <span className="gauge-label">{block.label}</span>}
      </div>
      {block.reference && (
        <div className="gauge-target">
          {blockLabel(block, 'reference', 'Referência')}: {block.reference}
        </div>
      )}
    </div>
  )
}

/* heatmap: matriz de intensidade (linhas × colunas, valores 0..max). */
export function Heatmap({ block }) {
  const rows = block.rows ?? []
  const max = block.max ?? Math.max(...rows.flatMap((r) => r.values ?? []), 1)
  return (
    <div className="heatmap-wrap">
      <table className="heatmap">
        <thead>
          <tr>
            <th />
            {(block.columns ?? []).map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              <th>{row.label}</th>
              {(row.values ?? []).map((v, j) => {
                const heat = Math.max(0.04, (Number(v) || 0) / max)
                return (
                  <td key={j}>
                    <span
                      className={`heatmap-cell${heat >= 0.5 ? ' heatmap-cell--inverted' : ''}`}
                      style={{ '--heat': heat }}
                      title={`${row.label} × ${block.columns?.[j] ?? j}: ${v}`}
                    >
                      {block.showValues ? v : ''}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Ranking({ block }) {
  const { openModal } = useModal()
  return (
    <ol className="ranking">
      {(block.items ?? []).map((item, i) => (
        <li
          key={item.id ?? i}
          className={`ranking-row${item.details ? ' clickable' : ''}`}
          onClick={item.details ? () => openModal(item.details) : undefined}
          onKeyDown={item.details ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal(item.details)
            }
          } : undefined}
          role={item.details ? 'button' : undefined}
          tabIndex={item.details ? 0 : undefined}
        >
          <span className="ranking-pos">{item.position ?? i + 1}</span>
          <span className="ranking-label">{renderInline(item.label)}</span>
          {item.trend && <TrendIndicator trend={item.trend} value={item.change} />}
          <span className="ranking-value">{item.value}</span>
        </li>
      ))}
    </ol>
  )
}

export function Breakdown({ block }) {
  const total = Number(block.total) || (block.items ?? []).reduce((s, it) => s + (Number(it.value) || 0), 0) || 1
  return (
    <div className="breakdown">
      {block.totalDisplay && (
        <div className="breakdown-total">
          <span>{block.totalLabel ?? 'Total'}</span>
          <span>{block.totalDisplay}</span>
        </div>
      )}
      {(block.items ?? []).map((item, i) => {
        const pct = ((Number(item.value) || 0) / total) * 100
        return (
          <div key={item.id ?? i} className="breakdown-row">
            <div className="breakdown-labels">
              <span>{renderInline(item.label)}</span>
              <span className="breakdown-value">{item.display ?? item.value}</span>
            </div>
            <div className="breakdown-track">
              <div className="breakdown-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

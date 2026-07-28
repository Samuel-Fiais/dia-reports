import { statusInfo, priorityInfo, trendInfo, healthInfo } from '../lib/status.js'

/* Indicadores de estado compartilhados. Todos monocromáticos ("tinta"):
   o tom é comunicado por peso/preenchimento, não por cor nova. */

export function StatusBadge({ status }) {
  const info = statusInfo(status)
  return <span className={`state-badge state-badge--${info.tone}`}>{info.label}</span>
}

export function PriorityBadge({ priority }) {
  const info = priorityInfo(priority)
  return (
    <span className="priority-badge" title={`Prioridade ${info.label.toLowerCase()}`}>
      <span className="priority-badge-bars">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`priority-bar${n <= info.weight ? ' on' : ''}`} />
        ))}
      </span>
      {info.label}
    </span>
  )
}

export function TrendIndicator({ trend, value }) {
  const info = trendInfo(trend)
  const Icon = info.icon
  return (
    <span className={`trend-indicator trend-indicator--${trend ?? 'flat'}`}>
      <Icon size={14} aria-hidden="true" /> {value ?? info.label}
    </span>
  )
}

export function HealthDot({ health, label }) {
  const info = healthInfo(health)
  return (
    <span className={`health-dot health-dot--${info.tone}`}>
      <span className="health-dot-mark" />
      {label ?? info.label}
    </span>
  )
}

export function Confidence({ level, label }) {
  const pct = Math.max(0, Math.min(100, Number(level) || 0))
  return (
    <span className="confidence" title={`Confiança: ${pct}%`}>
      <span className="confidence-track">
        <span className="confidence-fill" style={{ width: `${pct}%` }} />
      </span>
      {label ?? `${pct}% de confiança`}
    </span>
  )
}

export function Freshness({ date, label }) {
  return (
    <span className="freshness">
      <span className="freshness-mark" />
      {label ?? `Dados de ${date}`}
    </span>
  )
}

export function Indicator({ block }) {
  switch (block.kind) {
    case 'priority':
      return <PriorityBadge priority={block.value} />
    case 'trend':
      return <TrendIndicator trend={block.value} value={block.label} />
    case 'health':
      return <HealthDot health={block.value} label={block.label} />
    case 'confidence':
      return <Confidence level={Number(block.value)} label={block.label} />
    case 'freshness':
      return <Freshness date={block.value} label={block.label} />
    case 'status':
    default:
      return <StatusBadge status={block.value} />
  }
}

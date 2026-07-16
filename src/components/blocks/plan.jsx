import { useEffect, useState } from 'react'
import { renderInline } from '../../lib/inline.jsx'
import { StatusBadge, HealthDot } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'

/* milestones: marcos com estado e data (estrutura temporal compartilhada). */
export function Milestones({ block }) {
  const { openModal } = useModal()
  return (
    <ol className={`timeline milestones${block.variant === 'compact' ? ' milestones--compact' : ''}`}>
      {(block.items ?? []).map((item, i) => (
        <li
          key={i}
          className={`timeline-item milestone--${item.status ?? 'not-started'}${item.details ? ' clickable' : ''}`}
          onClick={item.details ? () => openModal(item.details) : undefined}
        >
          <div className="milestone-head">
            {item.date && <span className="timeline-date">{item.date}</span>}
            {item.status && <StatusBadge status={item.status} />}
          </div>
          <div className="timeline-title">{renderInline(item.title)}</div>
          {item.text && <p className="timeline-text">{renderInline(item.text)}</p>}
        </li>
      ))}
    </ol>
  )
}

/* roadmap: iniciativas por horizonte (agora / próximo / futuro). */
export function Roadmap({ block }) {
  const { openModal } = useModal()
  const lanes = block.lanes ?? [
    { label: 'Agora', items: block.now ?? [] },
    { label: 'Próximo', items: block.next ?? [] },
    { label: 'Futuro', items: block.later ?? [] },
  ]
  return (
    <div className="roadmap" style={{ '--roadmap-cols': lanes.length }}>
      {lanes.map((lane, i) => (
        <div key={i} className="roadmap-lane">
          <div className="roadmap-lane-label">{lane.label}</div>
          <div className="roadmap-items">
            {(lane.items ?? []).map((item, j) => {
              const it = typeof item === 'string' ? { title: item } : item
              return (
                <div
                  key={j}
                  className={`roadmap-item${it.details ? ' clickable' : ''}`}
                  onClick={it.details ? () => openModal(it.details) : undefined}
                >
                  <span className="roadmap-item-title">{renderInline(it.title)}</span>
                  {it.tag && <span className="kanban-card-tag">{it.tag}</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* gantt: cronograma simples. Cada tarefa tem start/end (dias ou datas ISO). */
export function Gantt({ block }) {
  const { openModal } = useModal()
  const tasks = block.tasks ?? []
  const toNum = (v) => (typeof v === 'number' ? v : new Date(v).getTime())
  const min = Math.min(...tasks.map((t) => toNum(t.start)))
  const max = Math.max(...tasks.map((t) => toNum(t.end)))
  const span = max - min || 1
  return (
    <div className="gantt">
      {tasks.map((task, i) => {
        const left = ((toNum(task.start) - min) / span) * 100
        const width = Math.max(2, ((toNum(task.end) - toNum(task.start)) / span) * 100)
        return (
          <div
            key={i}
            className={`gantt-row${task.details ? ' clickable' : ''}`}
            onClick={task.details ? () => openModal(task.details) : undefined}
          >
            <span className="gantt-label">{renderInline(task.title)}</span>
            <span className="gantt-track">
              <span
                className={`gantt-bar gantt-bar--${task.status ?? 'in-progress'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${task.start} → ${task.end}`}
              />
            </span>
          </div>
        )
      })}
      {(block.startLabel || block.endLabel) && (
        <div className="gantt-axis">
          <span>{block.startLabel}</span>
          <span>{block.endLabel}</span>
        </div>
      )}
    </div>
  )
}

/* status-summary: percentual concluído, bloqueios e próximos passos. */
export function StatusSummary({ block }) {
  const pct = Math.max(0, Math.min(100, Number(block.progress) || 0))
  return (
    <div className="status-summary">
      <div className="status-summary-progress">
        <div className="progress-head">
          <span className="progress-label">{block.label ?? 'Progresso geral'}</span>
          <span className="progress-value">{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {block.blockers?.length > 0 && (
        <div className="status-summary-group">
          <div className="meeting-notes-label">Bloqueios</div>
          <ul className="item-bullets">
            {block.blockers.map((b, i) => (
              <li key={i}>{renderInline(b)}</li>
            ))}
          </ul>
        </div>
      )}
      {block.next?.length > 0 && (
        <div className="status-summary-group">
          <div className="meeting-notes-label">Próximos passos</div>
          <ul className="item-bullets">
            {block.next.map((n, i) => (
              <li key={i}>{renderInline(n)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* okr: objetivo com resultados-chave e progresso. */
export function Okr({ block }) {
  return (
    <div className="okr">
      <div className="okr-objective">
        <span className="meeting-notes-label">Objetivo</span>
        <p>{renderInline(block.objective)}</p>
      </div>
      <div className="okr-keyresults">
        {(block.keyResults ?? []).map((kr, i) => {
          const pct = Math.max(0, Math.min(100, Number(kr.progress) || 0))
          return (
            <div key={i} className="okr-kr">
              <div className="progress-head">
                <span className="progress-label">
                  <span className="okr-kr-num">KR{i + 1}</span> {renderInline(kr.title)}
                </span>
                <span className="progress-value">{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* project-health: saúde por dimensão (escopo, prazo, orçamento, qualidade). */
export function ProjectHealth({ block }) {
  return (
    <div className="project-health">
      {(block.dimensions ?? []).map((dim, i) => (
        <div key={i} className="project-health-item">
          <HealthDot health={dim.health} label={dim.label} />
          {dim.note && <p className="project-health-note">{renderInline(dim.note)}</p>}
        </div>
      ))}
    </div>
  )
}

/* release-notes / changelog: mudanças agrupadas por versão ou data. */
export function ReleaseNotes({ block }) {
  const tagLabel = { added: 'Novo', fixed: 'Correção', changed: 'Mudança', removed: 'Removido' }
  return (
    <div className="release-notes">
      {(block.releases ?? []).map((rel, i) => (
        <div key={i} className="release">
          <div className="release-head">
            <span className="release-version">{rel.version ?? rel.date}</span>
            {rel.version && rel.date && <span className="release-date">{rel.date}</span>}
          </div>
          <ul className="release-changes">
            {(rel.changes ?? []).map((change, j) => {
              const c = typeof change === 'string' ? { text: change } : change
              return (
                <li key={j}>
                  {c.kind && <span className={`release-tag release-tag--${c.kind}`}>{tagLabel[c.kind] ?? c.kind}</span>}
                  {renderInline(c.text)}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

/* countdown: tempo restante até uma data-alvo, com unidades selecionáveis. */
export function Countdown({ block }) {
  const target = new Date(block.target).getTime()
  const [now, setNow] = useState(Date.now())
  const units = block.units?.length ? block.units : ['days', 'hours']
  const refreshInterval = units.includes('seconds') ? 1_000 : 60_000
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), refreshInterval)
    return () => clearInterval(id)
  }, [refreshInterval])
  const diff = target - now
  const past = diff < 0
  const abs = Math.abs(diff)
  const definitions = [
    ['years', 'anos', 365 * 86_400_000], ['months', 'meses', 30 * 86_400_000],
    ['weeks', 'semanas', 7 * 86_400_000], ['days', 'dias', 86_400_000],
    ['hours', 'horas', 3_600_000], ['minutes', 'minutos', 60_000], ['seconds', 'segundos', 1_000],
  ]
  let remainder = abs
  const parts = definitions.flatMap(([key, label, duration]) => {
    if (!units.includes(key)) return []
    const value = Math.floor(remainder / duration)
    remainder %= duration
    return [{ value, label }]
  })
  return (
    <div className="countdown">
      <div className="countdown-parts">
        {parts.map((p, i) => (
          <div key={i} className="countdown-part">
            <span className="countdown-value">{p.value}</span>
            <span className="countdown-unit">{p.label}</span>
          </div>
        ))}
      </div>
      <span className="countdown-label">
        {past ? (block.pastLabel ?? 'desde') : (block.label ?? 'até')} {block.eventLabel ?? block.target}
      </span>
    </div>
  )
}

/* date-strip: sequência horizontal de datas relevantes. */
export function DateStrip({ block }) {
  const { openModal } = useModal()
  return (
    <div className="date-strip">
      {(block.items ?? []).map((item, i) => (
        <div
          key={i}
          className={`date-strip-item${item.active ? ' active' : ''}${item.details ? ' clickable' : ''}`}
          onClick={item.details ? () => openModal(item.details) : undefined}
        >
          <span className="date-strip-date">{item.date}</span>
          <span className="date-strip-label">{renderInline(item.label)}</span>
        </div>
      ))}
    </div>
  )
}

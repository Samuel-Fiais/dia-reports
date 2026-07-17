import { renderInline } from '../../lib/inline.jsx'
import { StatusBadge, PriorityBadge, Confidence } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'

/* executive-summary: contexto, conclusões, riscos e recomendações. */
export function ExecutiveSummary({ block }) {
  const groups = [
    { key: 'context', label: block.contextLabel ?? 'Contexto' },
    { key: 'findings', label: block.findingsLabel ?? 'Principais conclusões' },
    { key: 'risks', label: block.risksLabel ?? 'Riscos' },
    { key: 'recommendations', label: block.recommendationsLabel ?? 'Recomendações' },
  ]
  return (
    <div className="exec-summary">
      {groups.map(({ key, label }) => {
        const content = block[key]
        if (!content) return null
        const items = Array.isArray(content) ? content : [content]
        return (
          <div key={key} className="exec-summary-group">
            <div className="exec-summary-label">{label}</div>
            {items.length === 1 ? (
              <p>{renderInline(items[0])}</p>
            ) : (
              <ul className="item-bullets">
                {items.map((item, i) => (
                  <li key={i}>{renderInline(item)}</li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* key-takeaways: aprendizados numerados em destaque. Também usado por "assumptions". */
export function KeyTakeaways({ block }) {
  return (
    <ol className="takeaways">
      {(block.items ?? []).map((item, i) => (
        <li key={i} className="takeaway">
          <span className="takeaway-num">{String(i + 1).padStart(2, '0')}</span>
          <p>{renderInline(typeof item === 'string' ? item : item.text)}</p>
        </li>
      ))}
    </ol>
  )
}

/* decision: decisão registrada com justificativa, participantes e data. */
export function Decision({ block }) {
  return (
    <div className="decision">
      <div className="decision-head">
        <span className="decision-stamp">{block.stamp ?? 'Decisão'}</span>
        {block.date && <span className="decision-date">{block.date}</span>}
      </div>
      <p className="decision-title">{renderInline(block.title)}</p>
      {block.rationale && (
        <p className="decision-rationale">
          <strong>{block.rationaleLabel ?? 'Por quê'}: </strong>
          {renderInline(block.rationale)}
        </p>
      )}
      <div className="decision-meta">
        {block.owner && <span>{block.decidedByLabel ?? 'Decidido por'} {block.owner}</span>}
        {block.participants?.length > 0 && <span>{block.withLabel ?? 'Com'} {block.participants.join(', ')}</span>}
        {block.confidence != null && <Confidence level={block.confidence} />}
      </div>
    </div>
  )
}

/* task-table: base de action-items, recommendations, blockers e risk-register. */
export function TaskTable({ block, kind = 'action-items' }) {
  const { openModal } = useModal()
  const cols = {
    'action-items': { title: 'Ação', extra: null },
    recommendations: { title: 'Recomendação', extra: 'Impacto' },
    blockers: { title: 'Bloqueio', extra: 'Impacto' },
    'risk-register': { title: 'Risco', extra: 'Mitigação' },
  }[kind]

  return (
    <table className="data-table task-table">
      <thead>
        <tr>
          <th>{cols.title}</th>
          {cols.extra && <th>{block.extraLabel ?? cols.extra}</th>}
          <th>{block.ownerLabel ?? 'Responsável'}</th>
          <th>{block.dueLabel ?? 'Prazo'}</th>
          <th>{block.priorityLabel ?? 'Prioridade'}</th>
          <th>{block.statusLabel ?? 'Status'}</th>
        </tr>
      </thead>
      <tbody>
        {(block.items ?? []).map((item, i) => (
          <tr
            key={i}
            className={item.details ? 'clickable' : undefined}
            onClick={item.details ? () => openModal(item.details) : undefined}
          >
            <td>{renderInline(item.title)}</td>
            {cols.extra && <td>{renderInline(item.impact ?? item.mitigation ?? '')}</td>}
            <td>{item.owner ?? '—'}</td>
            <td>{item.due ?? '—'}</td>
            <td>{item.priority ? <PriorityBadge priority={item.priority} /> : '—'}</td>
            <td>{item.status ? <StatusBadge status={item.status} /> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* references: fontes e links utilizados. */
export function References({ block }) {
  return (
    <ol className="references">
      {(block.items ?? []).map((ref, i) => (
        <li key={i}>
          {ref.href ? (
            <a href={ref.href} target="_blank" rel="noopener noreferrer">
              {ref.title}
            </a>
          ) : (
            <span>{ref.title}</span>
          )}
          {ref.source && <span className="reference-source"> — {ref.source}</span>}
          {ref.note && <span className="reference-note"> ({ref.note})</span>}
        </li>
      ))}
    </ol>
  )
}

/* table-of-contents: sumário gerado a partir das seções do relatório. */
export function TableOfContents({ report }) {
  const sections = (report?.body ?? []).filter((b) => b.type === 'section')
  const slug = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-')
  return (
    <nav className="toc">
      <ol>
        {sections.map((s, i) => (
          <li key={i}>
            <a href={`#${slug(s.heading)}`}>{renderInline(s.heading)}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function sectionSlug(heading) {
  return String(heading).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-')
}

/* report-metadata: autor, versão, status, período analisado. */
export function ReportMetadata({ block }) {
  const entries = [
    ['Autor', block.author],
    ['Versão', block.version],
    ['Status', block.status],
    ['Atualizado em', block.updated],
    ['Período analisado', block.period],
    ...(block.extra ?? []).map((e) => [e.label, e.value]),
  ].filter(([, v]) => v)
  return (
    <dl className="report-metadata">
      {entries.map(([label, value], i) => (
        <div key={i} className="report-metadata-item">
          <dt>{label}</dt>
          <dd>{renderInline(String(value))}</dd>
        </div>
      ))}
    </dl>
  )
}

/* page-break: quebra explícita para impressão/PDF. */
export function PageBreak() {
  return <div className="page-break" aria-hidden="true" />
}

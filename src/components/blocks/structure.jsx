import { renderInline } from '../../lib/inline.jsx'
import { StatusBadge, PriorityBadge } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'

const humanize = (value) => String(value)
  .replaceAll('-', ' ')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (character) => character.toUpperCase())

export function GroupedSummary({ block }) {
  return (
    <div className="grouped-summary">
      {(block.groups ?? []).map((group, index) => (
        <div key={group.id ?? group.label ?? index} className="grouped-summary-group">
          {group.label && <div className="grouped-summary-label">{group.label}</div>}
          {group.content && <p>{renderInline(group.content)}</p>}
          {group.items?.length > 0 && (
            <ul className="item-bullets">
              {group.items.map((item, itemIndex) => (
                <li key={item.id ?? itemIndex}>{renderInline(item.text ?? item)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

export function RecordCard({ block }) {
  return (
    <div className="record-card">
      {(block.badge || block.date) && (
        <div className="record-card-head">
          {block.badge && <span className="record-card-badge">{block.badge}</span>}
          {block.date && <span className="record-card-date">{block.date}</span>}
        </div>
      )}
      {block.title && <p className="record-card-title">{renderInline(block.title)}</p>}
      {block.text && <p className="record-card-text">{renderInline(block.text)}</p>}
      {block.fields?.length > 0 && (
        <dl className="record-card-fields">
          {block.fields.map((field, index) => (
            <div key={field.id ?? field.label ?? index}>
              {field.label && <dt>{field.label}</dt>}
              <dd>{renderInline(String(field.value ?? ''))}</dd>
            </div>
          ))}
        </dl>
      )}
      {block.actions?.length > 0 && (
        <div className="record-card-actions">
          {block.actionsLabel && <div className="group-label">{block.actionsLabel}</div>}
          <ul className="item-bullets">
            {block.actions.map((action, index) => (
              <li key={action.id ?? index}>{renderInline(action.text ?? action)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function WorkItems({ block }) {
  const { openModal } = useModal()
  const sample = block.items?.[0] ?? {}
  const columns = block.columns?.length > 0
    ? block.columns
    : Object.keys(sample)
        .filter((key) => !['id', 'details'].includes(key))
        .map((key) => ({ key, label: humanize(key), kind: 'text' }))

  const renderCell = (item, column) => {
    const value = item[column.key]
    if (column.kind === 'priority') return value ? <PriorityBadge priority={value} /> : '—'
    if (column.kind === 'status') return value ? <StatusBadge status={value} /> : '—'
    return value == null || value === '' ? '—' : renderInline(String(value))
  }

  return (
    <table className="data-table task-table">
      <thead>
        <tr>
          {columns.map((column) => <th key={column.key}>{column.label ?? humanize(column.key)}</th>)}
        </tr>
      </thead>
      <tbody>
        {(block.items ?? []).map((item, index) => (
          <tr
            key={item.id ?? index}
            className={item.details ? 'clickable' : undefined}
            onClick={item.details ? () => openModal(item.details) : undefined}
            onKeyDown={item.details ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openModal(item.details)
              }
            } : undefined}
            tabIndex={item.details ? 0 : undefined}
          >
            {columns.map((column) => (
              <td key={column.key}>{renderCell(item, column)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function References({ block }) {
  return (
    <ol className="references">
      {(block.items ?? []).map((reference, index) => (
        <li key={reference.id ?? reference.href ?? index}>
          {reference.href ? (
            <a href={reference.href} target="_blank" rel="noopener noreferrer">
              {reference.title}
            </a>
          ) : (
            <span>{reference.title}</span>
          )}
          {reference.source && <span className="reference-source"> — {reference.source}</span>}
          {reference.note && <span className="reference-note"> ({reference.note})</span>}
        </li>
      ))}
    </ol>
  )
}

export function TableOfContents({ publication }) {
  const sections = (publication?.body ?? []).filter((block) => block.type === 'section')
  return (
    <nav className="toc">
      <ol>
        {sections.map((section, index) => (
          <li key={section._key ?? section.id ?? index}>
            <a href={`#${sectionAnchor(section)}`}>{renderInline(section.heading)}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function sectionSlug(heading) {
  return String(heading).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-')
}

export function sectionAnchor(section) {
  return section.id ?? sectionSlug(section.heading)
}

export function Metadata({ block }) {
  return (
    <dl className="report-metadata">
      {(block.entries ?? []).map((entry, index) => (
        <div key={entry.id ?? entry.label ?? index} className="report-metadata-item">
          {entry.label && <dt>{entry.label}</dt>}
          <dd>{renderInline(String(entry.value ?? ''))}</dd>
        </div>
      ))}
    </dl>
  )
}

export function PageBreak() {
  return <div className="page-break" aria-hidden="true" />
}

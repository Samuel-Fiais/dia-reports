import { useState } from 'react'
import { renderInline } from '../../lib/inline.jsx'
import { useModal } from '../Modal.jsx'

/* quote genérico: variantes editorial | slack | email | testimonial.
   Os types "blockquote" e "slack" antigos continuam funcionando como aliases. */
export function Quote({ block }) {
  const variant = block.variant ?? 'editorial'

  if (variant === 'slack') {
    const body = (
      <>
        {block.avatar && (
          <div className="slack-quote-avatar">
            <img src={block.avatar} alt="" />
          </div>
        )}
        <div className="slack-quote-body">
          <div className="slack-quote-header">
            <span className="slack-quote-name">{block.name ?? block.author}</span>
            {block.channel && <span className="slack-quote-channel">{block.channel}</span>}
            {(block.time ?? block.timestamp) && <span className="slack-quote-time">{block.time ?? block.timestamp}</span>}
          </div>
          <p className="slack-quote-text">{renderInline(block.text)}</p>
        </div>
      </>
    )
    return block.href ? (
      <a className="slack-quote" href={block.href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    ) : (
      <div className="slack-quote">{body}</div>
    )
  }

  if (variant === 'email') {
    return (
      <div className="email-quote">
        <div className="email-quote-head">
          <div className="email-quote-row"><span>De:</span> {block.fromAddr ?? block.author}</div>
          {block.to && <div className="email-quote-row"><span>Para:</span> {block.to}</div>}
          {block.subject && <div className="email-quote-row email-quote-subject"><span>Assunto:</span> {block.subject}</div>}
          {block.date && <div className="email-quote-row"><span>Data:</span> {block.date}</div>}
        </div>
        <p className="email-quote-body">{renderInline(block.text)}</p>
      </div>
    )
  }

  if (variant === 'testimonial') {
    return (
      <blockquote className="testimonial">
        <p>{renderInline(block.text)}</p>
        <cite>
          {block.author}
          {block.role && <span className="testimonial-role"> — {block.role}</span>}
        </cite>
      </blockquote>
    )
  }

  return (
    <blockquote>
      <p>{renderInline(block.text)}</p>
      {(block.cite ?? block.author) && <cite>{renderInline(block.cite ?? block.author)}</cite>}
    </blockquote>
  )
}

/* conversation: sequência de mensagens (chat). */
export function Conversation({ block }) {
  return (
    <div className="conversation">
      {(block.messages ?? []).map((msg, i) => (
        <div key={i} className="conversation-msg">
          <div className="conversation-meta">
            <span className="conversation-author">{msg.author}</span>
            {msg.time && <span className="conversation-time">{msg.time}</span>}
          </div>
          <p className="conversation-text">{renderInline(msg.text)}</p>
        </div>
      ))}
    </div>
  )
}

/* accordion: conteúdo recolhível. `faq`, `details` e `appendix` são variantes. */
export function Accordion({ block }) {
  const [open, setOpen] = useState(() => new Set((block.items ?? []).flatMap((it, i) => (it.open ? [i] : []))))
  const toggle = (i) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }
  return (
    <div className="accordion">
      {(block.items ?? []).map((item, i) => (
        <div key={i} className={`accordion-item${open.has(i) ? ' open' : ''}`}>
          <button type="button" className="accordion-head" onClick={() => toggle(i)}>
            <span>{renderInline(item.title ?? item.question)}</span>
            <span className="accordion-chevron">{open.has(i) ? '−' : '+'}</span>
          </button>
          {open.has(i) && (
            <div className="accordion-body">
              <p>{renderInline(item.text ?? item.answer)}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* definition: definição destacada de um termo. */
export function Definition({ block }) {
  return (
    <div className="definition">
      <span className="definition-term">{block.term}</span>
      <p className="definition-text">{renderInline(block.text)}</p>
    </div>
  )
}

/* glossary: lista de definições. */
export function Glossary({ block }) {
  return (
    <dl className="glossary">
      {(block.items ?? []).map((item, i) => (
        <div key={i} className="glossary-item">
          <dt>{item.term}</dt>
          <dd>{renderInline(item.text)}</dd>
        </div>
      ))}
    </dl>
  )
}

/* person-card / team-list: pessoas com cargo e contato. */
export function TeamList({ block }) {
  const { openModal } = useModal()
  const people = block.people ?? (block.person ? [block.person] : [])
  return (
    <div className="team-list">
      {people.map((p, i) => (
        <div
          key={i}
          className={`person-card${p.details ? ' clickable' : ''}`}
          onClick={p.details ? () => openModal(p.details) : undefined}
        >
          {p.avatar ? (
            <img className="person-avatar" src={p.avatar} alt="" />
          ) : (
            <span className="person-avatar person-avatar--initials">
              {String(p.name ?? '?')
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
          )}
          <div className="person-info">
            <span className="person-name">{p.name}</span>
            {(p.role || p.team) && (
              <span className="person-role">{[p.role, p.team].filter(Boolean).join(' · ')}</span>
            )}
            {p.contact && <span className="person-contact">{p.contact}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/* meeting-notes: participantes, pauta, decisões e próximos passos. */
export function MeetingNotes({ block }) {
  const groups = [
    ['Participantes', block.participants],
    ['Pauta', block.agenda],
    ['Decisões', block.decisions],
    ['Próximos passos', block.next],
  ]
  return (
    <div className="meeting-notes">
      {(block.date || block.title) && (
        <div className="meeting-notes-head">
          {block.title && <span className="meeting-notes-title">{block.title}</span>}
          {block.date && <span className="meeting-notes-date">{block.date}</span>}
        </div>
      )}
      {groups.map(([label, items], i) =>
        items?.length ? (
          <div key={i} className="meeting-notes-group">
            <div className="meeting-notes-label">{label}</div>
            <ul className="item-bullets">
              {items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  )
}

/* incident-summary: incidente com impacto, causa e ações. */
export function IncidentSummary({ block }) {
  const rows = [
    ['Impacto', block.impact],
    ['Duração', block.duration],
    ['Causa raiz', block.cause],
    ['Resolução', block.resolution],
  ].filter(([, v]) => v)
  return (
    <div className="incident">
      <div className="incident-head">
        <span className="incident-stamp">{block.severity ?? 'Incidente'}</span>
        <span className="incident-title">{renderInline(block.title)}</span>
        {block.date && <span className="incident-date">{block.date}</span>}
      </div>
      <dl className="incident-fields">
        {rows.map(([label, value], i) => (
          <div key={i}>
            <dt>{label}</dt>
            <dd>{renderInline(value)}</dd>
          </div>
        ))}
      </dl>
      {block.actions?.length > 0 && (
        <div className="incident-actions">
          <div className="meeting-notes-label">Ações preventivas</div>
          <ul className="item-bullets">
            {block.actions.map((a, i) => (
              <li key={i}>{renderInline(a)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* root-cause: análise de causa raiz (cinco porquês). */
export function RootCause({ block }) {
  return (
    <div className="root-cause">
      {block.problem && (
        <p className="root-cause-problem">
          <strong>Problema: </strong>
          {renderInline(block.problem)}
        </p>
      )}
      <ol className="root-cause-whys">
        {(block.whys ?? []).map((why, i) => (
          <li key={i}>
            <span className="root-cause-num">Por quê {i + 1}</span>
            <p>{renderInline(why)}</p>
          </li>
        ))}
      </ol>
      {block.rootCause && (
        <p className="root-cause-conclusion">
          <strong>Causa raiz: </strong>
          {renderInline(block.rootCause)}
        </p>
      )}
    </div>
  )
}

/* embed / video / file-attachment */
export function Embed({ block }) {
  return (
    <div className="embed-wrap" style={{ aspectRatio: block.ratio ?? '16 / 9' }}>
      <iframe
        src={block.src}
        title={block.title ?? 'Conteúdo incorporado'}
        loading="lazy"
        allowFullScreen
      />
    </div>
  )
}

export function Video({ block }) {
  return (
    <figure className="video-block">
      <video src={block.src} poster={block.poster} controls preload="metadata" />
      {block.caption && <figcaption className="fig-caption">{renderInline(block.caption)}</figcaption>}
    </figure>
  )
}

export function FileAttachment({ block }) {
  return (
    <a className="file-attachment" href={block.href} download={block.download ?? true} target="_blank" rel="noopener noreferrer">
      <span className="file-attachment-icon">⤓</span>
      <span className="file-attachment-info">
        <span className="file-attachment-name">{block.name}</span>
        {(block.size || block.format) && (
          <span className="file-attachment-meta">{[block.format, block.size].filter(Boolean).join(' · ')}</span>
        )}
      </span>
    </a>
  )
}

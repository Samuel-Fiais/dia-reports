import { useState } from 'react'
import { Download, Minus, Plus } from 'lucide-react'
import { renderInline } from '../../lib/inline.jsx'
import { blockLabel } from '../../lib/labels.js'
import { useModal } from '../Modal.jsx'

export function Quote({ block }) {
  const presentation = block.presentation ?? 'standard'

  if (presentation === 'message') {
    const body = (
      <>
        {block.avatar && (
          <div className="quote-message-avatar">
            <img src={block.avatar} alt="" />
          </div>
        )}
        <div className="quote-message-body">
          <div className="quote-message-header">
            <span className="quote-message-author">{block.author}</span>
            {block.source && <span className="quote-message-source">{block.source}</span>}
            {block.date && <span className="quote-message-date">{block.date}</span>}
          </div>
          <p className="quote-message-text">{renderInline(block.text)}</p>
        </div>
      </>
    )
    return block.href ? (
      <a className="quote-message" href={block.href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    ) : (
      <div className="quote-message">{body}</div>
    )
  }

  if (presentation === 'correspondence') {
    const labels = {
      author: blockLabel(block, 'author', 'Autor'),
      recipient: blockLabel(block, 'recipient', 'Destinatário'),
      subject: blockLabel(block, 'subject', 'Assunto'),
      date: blockLabel(block, 'date', 'Data'),
    }
    return (
      <div className="quote-correspondence">
        <div className="quote-correspondence-head">
          {block.author && <div className="quote-correspondence-row"><span>{labels.author}:</span> {block.author}</div>}
          {block.recipient && <div className="quote-correspondence-row"><span>{labels.recipient}:</span> {block.recipient}</div>}
          {block.subject && <div className="quote-correspondence-row quote-correspondence-subject"><span>{labels.subject}:</span> {block.subject}</div>}
          {block.date && <div className="quote-correspondence-row"><span>{labels.date}:</span> {block.date}</div>}
        </div>
        <p className="quote-correspondence-body">{renderInline(block.text)}</p>
      </div>
    )
  }

  return (
    <blockquote className={['featured', 'break'].includes(presentation) ? 'quote-featured' : undefined}>
      <p>{renderInline(block.text)}</p>
      {(block.author || block.source) && (
        <cite>
          {renderInline(block.author)}
          {block.source && <span className="quote-source"> — {renderInline(block.source)}</span>}
        </cite>
      )}
    </blockquote>
  )
}

export function MessageThread({ block }) {
  return (
    <div className="conversation">
      {(block.messages ?? []).map((message, index) => (
        <div key={message.id ?? index} className="conversation-msg">
          <div className="conversation-meta">
            <span className="conversation-author">{message.author}</span>
            {message.date && <span className="conversation-time">{message.date}</span>}
          </div>
          <p className="conversation-text">{renderInline(message.text)}</p>
        </div>
      ))}
    </div>
  )
}

export function Accordion({ block }) {
  const [open, setOpen] = useState(
    () => new Set((block.items ?? []).flatMap((item, index) => (item.open ? [item.id ?? index] : []))),
  )

  const toggle = (key) => {
    setOpen((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="accordion">
      {(block.items ?? []).map((item, index) => {
        const key = item.id ?? index
        const panelId = `accordion-panel-${key}`
        const buttonId = `accordion-button-${key}`
        return (
          <div key={key} className={`accordion-item${open.has(key) ? ' open' : ''}`}>
            <button
              id={buttonId}
              type="button"
              className="accordion-head"
              aria-expanded={open.has(key)}
              aria-controls={panelId}
              onClick={() => toggle(key)}
            >
              <span>{renderInline(item.title)}</span>
              <span className="accordion-chevron">
                {open.has(key) ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>
            {open.has(key) && (
              <div id={panelId} className="accordion-body" role="region" aria-labelledby={buttonId}>
                <p>{renderInline(item.text)}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function DefinitionList({ block }) {
  return (
    <dl className="glossary">
      {(block.items ?? []).map((item, index) => (
        <div key={item.id ?? item.term ?? index} className="glossary-item">
          <dt>{item.term}</dt>
          <dd>{renderInline(item.text)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function PeopleList({ block }) {
  const { openModal } = useModal()
  return (
    <div className="people-list">
      {(block.people ?? []).map((person, index) => (
        <div
          key={person.id ?? index}
          className={`profile-card${person.details ? ' clickable' : ''}`}
          onClick={person.details ? () => openModal(person.details) : undefined}
          onKeyDown={person.details ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal(person.details)
            }
          } : undefined}
          role={person.details ? 'button' : undefined}
          tabIndex={person.details ? 0 : undefined}
        >
          {person.avatar ? (
            <img className="person-avatar" src={person.avatar} alt="" />
          ) : (
            <span className="person-avatar person-avatar--initials">
              {String(person.name ?? '?')
                .split(' ')
                .map((word) => word[0])
                .slice(0, 2)
                .join('')}
            </span>
          )}
          <div className="person-info">
            <span className="person-name">{person.name}</span>
            {(person.subtitle || person.group) && (
              <span className="person-role">
                {[person.subtitle, person.group].filter(Boolean).join(' · ')}
              </span>
            )}
            {person.meta && <span className="person-contact">{person.meta}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function StepList({ block }) {
  return (
      <div className="step-list">
      {block.intro && (
        <p className="step-list-intro">
          {block.introLabel && <strong>{block.introLabel}: </strong>}
          {renderInline(block.intro)}
        </p>
      )}
      <ol className="step-list-items">
        {(block.steps ?? []).map((step, index) => (
          <li key={step.id ?? index}>
            {step.label && <span className="step-list-label">{step.label}</span>}
            <p>{renderInline(step.text)}</p>
          </li>
        ))}
      </ol>
      {block.conclusion && (
        <p className="step-list-conclusion">
          {block.conclusionLabel && <strong>{block.conclusionLabel}: </strong>}
          {renderInline(block.conclusion)}
        </p>
      )}
    </div>
  )
}

export function Embed({ block }) {
  return (
    <div className="embed-wrap" style={{ aspectRatio: block.ratio ?? '16 / 9' }}>
      <iframe
        src={block.src}
        title={block.title || 'Conteúdo incorporado'}
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

export function Attachment({ block }) {
  return (
    <a
      className="file-attachment"
      href={block.href}
      download={block.download ?? true}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="file-attachment-icon"><Download size={18} /></span>
      <span className="file-attachment-info">
        <span className="file-attachment-name">{block.name}</span>
        {(block.size || block.format) && (
          <span className="file-attachment-meta">
            {[block.format, block.size].filter(Boolean).join(' · ')}
          </span>
        )}
      </span>
    </a>
  )
}

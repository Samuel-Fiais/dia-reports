import { useDeferredValue, useEffect, useId, useMemo, useState } from 'react'
import { Check, Copy, Search } from 'lucide-react'
import { renderInline } from '../lib/inline.jsx'
import {
  fetchRemoteOpenApiDocument,
  normalizeOpenApiDocument,
  openApiDocumentFromPublication,
  openApiUrlFromPublication,
} from '../lib/openapi.js'
import { normalizeComponentStyle } from '../lib/theme.js'
import { ModalProvider } from './Modal.jsx'
import { renderBlocks } from './blocks/index.jsx'
import { PublicationBody } from './ReportView.jsx'

const METHOD_ORDER = Object.freeze({
  GET: 0,
  POST: 1,
  PUT: 2,
  PATCH: 3,
  DELETE: 4,
  OPTIONS: 5,
  HEAD: 6,
  TRACE: 7,
})

function CopyButton({ value, label = 'Copiar' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" className="reference-copy" onClick={copy}>
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copied ? 'Copiado' : label}
    </button>
  )
}

function CodeSamples({ samples }) {
  const [active, setActive] = useState(0)
  const baseId = useId()
  const sample = samples[active]

  if (!sample) return null

  const move = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? samples.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + samples.length) % samples.length
    setActive(next)
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
    <div className="reference-code">
      <div className="reference-code-tabs" role="tablist" aria-label="Exemplos de requisição">
        {samples.map((entry, index) => (
          <button
            key={entry.id}
            id={`${baseId}-tab-${entry.id}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`${baseId}-panel`}
            tabIndex={active === index ? 0 : -1}
            className={active === index ? 'active' : ''}
            onClick={() => setActive(index)}
            onKeyDown={(event) => move(event, index)}
          >
            {entry.label}
          </button>
        ))}
        <CopyButton value={sample.code} />
      </div>
      <pre
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${sample.id}`}
      >
        <code data-language={sample.language}>{sample.code}</code>
      </pre>
    </div>
  )
}

function JsonExample({ value, label }) {
  if (value == null) return null
  const code = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <div className="reference-json">
      <div className="reference-json-head">
        <span>{label}</span>
        <CopyButton value={code} />
      </div>
      <pre><code data-language="json">{code}</code></pre>
    </div>
  )
}

function ParametersTable({ parameters }) {
  if (!parameters.length) return null
  return (
    <div className="reference-operation-part">
      <h4>Parâmetros</h4>
      <div className="reference-table-wrap">
        <table className="data-table reference-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Local</th>
              <th>Tipo</th>
              <th>Obrigatório</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter) => (
              <tr key={`${parameter.in}-${parameter.name}`}>
                <td><code>{parameter.name}</code></td>
                <td>{parameter.in}</td>
                <td>{[parameter.type, parameter.format].filter(Boolean).join(' · ')}</td>
                <td>{parameter.required ? 'Sim' : 'Não'}</td>
                <td>{parameter.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SchemaTable({ schema }) {
  const properties = Object.entries(schema?.properties ?? {})
  if (!properties.length) return null
  const required = new Set(schema.required ?? [])
  return (
    <div className="reference-table-wrap">
      <table className="data-table reference-table">
        <thead>
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Obrigatório</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(([name, property]) => (
            <tr key={name}>
              <td><code>{name}</code></td>
              <td>{property.type ?? (property.$ref ? 'object' : 'any')}</td>
              <td>{required.has(name) ? 'Sim' : 'Não'}</td>
              <td>{property.description ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RequestBody({ requestBody }) {
  if (!requestBody) return null
  return (
    <div className="reference-operation-part">
      <div className="reference-part-title">
        <h4>Corpo da requisição</h4>
        <span>{requestBody.mediaType}{requestBody.required ? ' · obrigatório' : ''}</span>
      </div>
      {requestBody.description && <p>{renderInline(requestBody.description)}</p>}
      <SchemaTable schema={requestBody.schema} />
      <JsonExample value={requestBody.example} label="Exemplo" />
    </div>
  )
}

function Responses({ responses }) {
  if (!responses.length) return null
  return (
    <div className="reference-operation-part">
      <h4>Respostas</h4>
      <div className="reference-responses">
        {responses.map((response, index) => (
          <details key={response.status} open={index === 0}>
            <summary>
              <span className={`reference-status reference-status--${String(response.status)[0]}`}>
                {response.label}
              </span>
              <span>{response.description}</span>
              {response.mediaType && <small>{response.mediaType}</small>}
            </summary>
            <div className="reference-response-body">
              <SchemaTable schema={response.schema} />
              <JsonExample value={response.example} label="Resposta de exemplo" />
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function Operation({ operation }) {
  return (
    <section id={operation.anchor} className="reference-operation">
      <div className="reference-operation-head">
        <span className={`reference-method reference-method--${operation.method.toLowerCase()}`}>
          {operation.method}
        </span>
        <code>{operation.path}</code>
        {operation.deprecated && <span className="reference-deprecated">Descontinuado</span>}
      </div>
      <div className="reference-operation-body">
        <h3>{operation.summary}</h3>
        {operation.description && <p>{renderInline(operation.description)}</p>}
        <CodeSamples samples={operation.codeSamples} />
        <ParametersTable parameters={operation.parameters} />
        <RequestBody requestBody={operation.requestBody} />
        <Responses responses={operation.responses} />
      </div>
    </section>
  )
}

function SecurityOverview({ schemes }) {
  if (!schemes.length) return null
  return (
    <section id="reference-authentication" className="reference-overview-section">
      <span className="reference-section-index">02</span>
      <div>
        <h2>Autenticação</h2>
        <div className="reference-security-grid">
          {schemes.map((scheme) => (
            <article key={scheme.name}>
              <strong>{scheme.name}</strong>
              <span>{[scheme.type, scheme.scheme, scheme.in].filter(Boolean).join(' · ')}</span>
              {scheme.description && <p>{renderInline(scheme.description)}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReferenceDocumentView({ publication, settings = {}, reference }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('pt-BR'))
  const chartStyleIndex = settings.chartStyleIndex ?? publication.settings?.chartStyleIndex ?? 2
  const widthMode = settings.widthMode ?? publication.settings?.widthMode ?? 'standard'
  const componentStyle = normalizeComponentStyle(
    settings.componentStyle ?? publication.settings?.componentStyle,
  )

  const visibleOperations = useMemo(() => {
    if (!deferredQuery) return reference.operations
    return reference.operations.filter((operation) => (
      [
        operation.method,
        operation.path,
        operation.summary,
        operation.description,
        ...operation.tags,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(deferredQuery)
    ))
  }, [deferredQuery, reference.operations])

  const groupedOperations = useMemo(() => reference.tags
    .map((tag) => ({
      ...tag,
      operations: visibleOperations
        .filter((operation) => operation.primaryTag === tag.name)
        .toSorted((a, b) => (
          (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99)
          || a.path.localeCompare(b.path)
        )),
    }))
    .filter((tag) => tag.operations.length), [reference.tags, visibleOperations])

  const server = reference.servers[0]

  return (
    <ModalProvider renderBlocks={(blocks) => renderBlocks(blocks, chartStyleIndex)}>
      <div
        className={`publication publication--reference reference ready reference--${widthMode} report--components-${componentStyle}`}
        data-publication-mode="reference"
      >
        <div className="reference-shell">
          <aside className="reference-sidebar">
            <a className="reference-brand" href="#reference-top">
              <span className="reference-brand-mark" aria-hidden="true">R</span>
              <span>
                <strong>{reference.title}</strong>
                <small>Referência da API</small>
              </span>
            </a>

            <label className="reference-search">
              <Search size={14} aria-hidden="true" />
              <span className="sr-only">Buscar operações</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar operação..."
              />
            </label>

            <nav aria-label="Navegação da referência">
              <span className="reference-nav-label">Começando</span>
              <a href="#reference-overview">Visão geral</a>
              {reference.securitySchemes.length > 0 && (
                <a href="#reference-authentication">Autenticação</a>
              )}
              {groupedOperations.map((tag) => (
                <div key={tag.name} className="reference-nav-group">
                  <span className="reference-nav-label">{tag.name}</span>
                  {tag.operations.map((operation) => (
                    <a key={operation.id} href={`#${operation.anchor}`}>
                      <span className={`reference-nav-method reference-nav-method--${operation.method.toLowerCase()}`}>
                        {operation.method}
                      </span>
                      <span>{operation.summary}</span>
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          <main id="reference-top" className="reference-main">
            <header className="reference-hero">
              <div className="reference-eyebrow">
                <span>OPENAPI {reference.openapi}</span>
                <span>v{reference.version}</span>
              </div>
              <h1>{reference.title}</h1>
              {(publication.intro?.[0] || reference.description) && (
                <p>{renderInline(publication.intro?.[0] ?? reference.description)}</p>
              )}
              {server?.url && (
                <div className="reference-server">
                  <span>URL base</span>
                  <code>{server.url}</code>
                  <CopyButton value={server.url} />
                </div>
              )}
            </header>

            <section id="reference-overview" className="reference-overview-section">
              <span className="reference-section-index">01</span>
              <div>
                <h2>Visão geral</h2>
                <p>
                  {reference.operations.length} operaç
                  {reference.operations.length === 1 ? 'ão' : 'ões'} em{' '}
                  {reference.tags.length} grupo{reference.tags.length === 1 ? '' : 's'}.
                </p>
                {reference.servers.length > 1 && (
                  <div className="reference-server-list">
                    {reference.servers.map((entry) => (
                      <code key={entry.url}>{entry.url}</code>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <SecurityOverview schemes={reference.securitySchemes} />

            {publication.body?.length > 0 && (
              <PublicationBody
                publication={publication}
                chartStyleIndex={chartStyleIndex}
                className="reference-guides"
              />
            )}

            <div className="reference-operations-header">
              <span>Referência</span>
              <strong>
                {visibleOperations.length} de {reference.operations.length} operações
              </strong>
            </div>

            {groupedOperations.map((tag) => (
              <section key={tag.name} className="reference-tag-group">
                <div className="reference-tag-head">
                  <h2>{tag.name}</h2>
                  {tag.description && <p>{renderInline(tag.description)}</p>}
                </div>
                {tag.operations.map((operation) => (
                  <Operation key={operation.id} operation={operation} />
                ))}
              </section>
            ))}

            {visibleOperations.length === 0 && (
              <div className="reference-empty">
                Nenhuma operação encontrada para “{query}”.
              </div>
            )}
          </main>
        </div>
      </div>
    </ModalProvider>
  )
}

function ReferenceLoadState({ eyebrow, title, message }) {
  return (
    <div className="reference reference-load-state">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  )
}

export default function ReferenceView({ publication, settings = {} }) {
  const embeddedDocument = openApiDocumentFromPublication(publication)
  const sourceUrl = openApiUrlFromPublication(publication)
  const [document, setDocument] = useState(embeddedDocument)
  const [loading, setLoading] = useState(Boolean(sourceUrl && !embeddedDocument))
  const [error, setError] = useState(null)
  const normalizedResult = useMemo(() => {
    if (!document) return { reference: null, error: null }
    try {
      return {
        reference: normalizeOpenApiDocument(document, { sourceUrl }),
        error: null,
      }
    } catch (normalizationError) {
      return { reference: null, error: normalizationError }
    }
  }, [document, sourceUrl])

  useEffect(() => {
    if (embeddedDocument) {
      setDocument(embeddedDocument)
      setLoading(false)
      setError(null)
      return undefined
    }
    if (!sourceUrl) {
      setDocument(null)
      setLoading(false)
      setError(new Error('Informe source.document ou source.url para a referência OpenAPI'))
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchRemoteOpenApiDocument(sourceUrl, {
      signal: controller.signal,
      publicationId: publication.system ? undefined : publication.id,
      shareToken: publication._sourceAccessToken,
    })
      .then((nextDocument) => {
        setDocument(nextDocument)
        setLoading(false)
      })
      .catch((nextError) => {
        if (nextError.name === 'AbortError') return
        setDocument(null)
        setError(nextError)
        setLoading(false)
      })

    return () => controller.abort()
  }, [
    embeddedDocument,
    publication._sourceAccessToken,
    publication.id,
    publication.system,
    sourceUrl,
  ])

  if (loading) {
    return (
      <ReferenceLoadState
        eyebrow="Atualizando contrato"
        title="Carregando referência..."
        message="Buscando a versão mais recente do documento OpenAPI."
      />
    )
  }

  if (error || normalizedResult.error || !document) {
    return (
      <ReferenceLoadState
        eyebrow="Fonte indisponível"
        title="Não foi possível montar a referência"
        message={
          error?.message
          ?? normalizedResult.error?.message
          ?? 'O documento OpenAPI não foi encontrado.'
        }
      />
    )
  }

  return (
    <ReferenceDocumentView
      publication={publication}
      settings={settings}
      reference={normalizedResult.reference}
    />
  )
}

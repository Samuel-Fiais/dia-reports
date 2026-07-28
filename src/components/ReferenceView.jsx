import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  Play,
  Search,
  Share2,
  X,
} from 'lucide-react'
import { renderInline } from '../lib/inline.jsx'
import {
  fetchRemoteOpenApiDocument,
  normalizeOpenApiDocument,
  openApiDocumentFromPublication,
  openApiUrlFromPublication,
} from '../lib/openapi.js'
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

function navigationLabel(operation) {
  const summary = operation.summary?.trim()
  if (!summary) return operation.path
  const methodPrefix = `${operation.method} `
  return summary.toUpperCase().startsWith(methodPrefix)
    ? summary.slice(methodPrefix.length).trim() || operation.path
    : summary
}

function operationTitle(operation) {
  const label = navigationLabel(operation)
  return label === operation.path ? '' : label
}

function displayVersion(version) {
  const value = String(version ?? '').trim()
  if (!value) return ''
  return /^v/i.test(value) ? value : `v${value}`
}

function isEditableTarget(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function ReferenceNavOperation({ operation, active, onSelect }) {
  const label = navigationLabel(operation)

  return (
    <a
      href={`#${operation.anchor}`}
      className={active ? 'active' : ''}
      aria-current={active ? 'location' : undefined}
      onClick={() => onSelect(operation.anchor)}
    >
      <span className={`reference-nav-method reference-nav-method--${operation.method.toLowerCase()}`}>
        {operation.method}
      </span>
      <span title={label}>{label}</span>
    </a>
  )
}

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

function ShareReferenceButton({ title, publication }) {
  const [shared, setShared] = useState(false)

  const share = async () => {
    let url = window.location.href
    try {
      if (!publication.system && !publication._sourceAccessToken) {
        const response = await fetch(`/api/reports/${publication.id}/share`, { method: 'POST' })
        if (response.ok) {
          const data = await response.json()
          url = `${window.location.origin}/shared/${data.token}`
        }
      }
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
      setShared(true)
      window.setTimeout(() => setShared(false), 1600)
    } catch {
      setShared(false)
    }
  }

  return (
    <button type="button" className="reference-share" onClick={share}>
      {shared ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
      {shared ? 'Link copiado' : 'Compartilhar'}
    </button>
  )
}

function CodeSamples({ samples, children }) {
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
      {children}
    </div>
  )
}

function credentialHeaders(schemes, credentials) {
  const headers = {}
  const query = {}

  for (const scheme of schemes) {
    const value = credentials[scheme.name]?.trim()
    if (!value) continue
    if (scheme.type === 'apiKey') {
      if (scheme.in === 'query') query[scheme.parameterName] = value
      if (scheme.in === 'header') headers[scheme.parameterName] = value
      continue
    }
    if (scheme.type === 'http' && scheme.scheme === 'basic') {
      headers.Authorization = `Basic ${window.btoa(value)}`
      continue
    }
    const usesBearer = scheme.scheme === 'bearer'
      || scheme.type === 'oauth2'
      || scheme.type === 'openIdConnect'
    headers.Authorization = `${usesBearer ? 'Bearer ' : ''}${value}`
  }

  return { headers, query }
}

function RequestRunner({ operation, serverUrl, credentials, securitySchemes }) {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [parameterValues, setParameterValues] = useState(() => Object.fromEntries(
    operation.parameters.map((parameter) => [
      `${parameter.in}:${parameter.name}`,
      String(parameter.example ?? ''),
    ]),
  ))
  const [body, setBody] = useState(() => (
    operation.requestBody?.example == null
      ? ''
      : JSON.stringify(operation.requestBody.example, null, 2)
  ))

  const send = async () => {
    setRunning(true)
    setResult(null)
    try {
      const path = operation.path.replaceAll(/\{([^}]+)\}/g, (_, name) => (
        encodeURIComponent(parameterValues[`path:${name}`] || name)
      ))
      const url = new URL(path, `${String(serverUrl).replace(/\/$/, '')}/`)
      const headers = {}
      for (const parameter of operation.parameters) {
        const value = parameterValues[`${parameter.in}:${parameter.name}`]
        if (!value) continue
        if (parameter.in === 'query') url.searchParams.set(parameter.name, value)
        if (parameter.in === 'header') headers[parameter.name] = value
      }
      const activeSchemeNames = new Set(
        operation.security.flatMap((requirement) => Object.keys(requirement)),
      )
      const auth = credentialHeaders(
        securitySchemes.filter((scheme) => activeSchemeNames.has(scheme.name)),
        credentials,
      )
      Object.assign(headers, auth.headers)
      Object.entries(auth.query).forEach(([name, value]) => url.searchParams.set(name, value))
      if (body) headers['Content-Type'] = operation.requestBody?.mediaType || 'application/json'

      const startedAt = performance.now()
      const response = await fetch(url, {
        method: operation.method,
        headers,
        body: body && !['GET', 'HEAD'].includes(operation.method) ? body : undefined,
      })
      const responseBody = await response.text()
      setResult({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        duration: Math.round(performance.now() - startedAt),
        body: responseBody,
      })
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof TypeError
          ? 'A API bloqueou a chamada do navegador (CORS) ou está indisponível.'
          : error.message,
      })
    } finally {
      setRunning(false)
    }
  }

  if (!open) {
    return (
      <div className="reference-test-launch">
        <button type="button" onClick={() => setOpen(true)}>
          <Play size={12} fill="currentColor" aria-hidden="true" />
          Test Request
        </button>
      </div>
    )
  }

  return (
    <div className="reference-request-runner">
      <div className="reference-request-runner-head">
        <strong>Test Request</strong>
        <button type="button" aria-label="Fechar teste" onClick={() => setOpen(false)}>
          <X size={13} aria-hidden="true" />
        </button>
      </div>
      {operation.parameters.length > 0 && (
        <div className="reference-request-fields">
          {operation.parameters.map((parameter) => (
            <label key={`${parameter.in}:${parameter.name}`}>
              <span>{parameter.name}<small>{parameter.in}</small></span>
              <input
                value={parameterValues[`${parameter.in}:${parameter.name}`] ?? ''}
                required={parameter.required}
                onChange={(event) => setParameterValues((current) => ({
                  ...current,
                  [`${parameter.in}:${parameter.name}`]: event.target.value,
                }))}
              />
            </label>
          ))}
        </div>
      )}
      {operation.requestBody && (
        <label className="reference-request-body">
          <span>Body <small>{operation.requestBody.mediaType}</small></span>
          <textarea value={body} rows={7} onChange={(event) => setBody(event.target.value)} />
        </label>
      )}
      <button
        type="button"
        className="reference-send-request"
        disabled={running || !serverUrl}
        onClick={send}
      >
        {running
          ? <LoaderCircle className="reference-spinner" size={13} aria-hidden="true" />
          : <Play size={12} fill="currentColor" aria-hidden="true" />}
        {running ? 'Enviando...' : 'Enviar requisição'}
      </button>
      {result && (
        <div
          className={`reference-test-result${result.ok ? ' is-success' : ' is-error'}`}
          aria-live="polite"
        >
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <>
              <div>
                <strong>{result.status} {result.statusText}</strong>
                <span>{result.duration} ms</span>
              </div>
              {result.body && <pre><code>{result.body}</code></pre>}
            </>
          )}
        </div>
      )}
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

function Operation({ operation, serverUrl, credentials, securitySchemes }) {
  const title = operationTitle(operation)

  return (
    <section id={operation.anchor} className="reference-operation">
      <div className="reference-operation-body">
        <div className="reference-operation-docs">
          {title && <h3>{title}</h3>}
          {operation.description && <p>{renderInline(operation.description)}</p>}
          <ParametersTable parameters={operation.parameters} />
          <RequestBody requestBody={operation.requestBody} />
          <Responses responses={operation.responses} />
        </div>
        <aside className="reference-operation-console" aria-label="Console da requisição">
          <div className="reference-operation-head">
            <span className={`reference-method reference-method--${operation.method.toLowerCase()}`}>
              {operation.method}
            </span>
            <code>{operation.path}</code>
            {operation.deprecated && <span className="reference-deprecated">Descontinuado</span>}
          </div>
          <CodeSamples samples={operation.codeSamples}>
            <RequestRunner
              operation={operation}
              serverUrl={serverUrl}
              credentials={credentials}
              securitySchemes={securitySchemes}
            />
          </CodeSamples>
        </aside>
      </div>
    </section>
  )
}

function SecurityOverview({ schemes, credentials, onCredentialChange }) {
  if (!schemes.length) return null
  return (
    <section id="reference-authentication" className="reference-overview-section">
      <span className="reference-section-index">02</span>
      <div>
        <h2>Autenticação</h2>
        <p>
          As credenciais abaixo são usadas apenas nos testes desta página e não são salvas.
        </p>
        <div className="reference-security-grid">
          {schemes.map((scheme) => (
            <article key={scheme.name}>
              <div className="reference-security-title">
                <KeyRound size={15} aria-hidden="true" />
                <div>
                  <strong>{scheme.name}</strong>
                  <span>{[scheme.type, scheme.scheme, scheme.in].filter(Boolean).join(' · ')}</span>
                </div>
              </div>
              {scheme.description && <p>{renderInline(scheme.description)}</p>}
              <label>
                <span>
                  {scheme.type === 'apiKey'
                    ? scheme.parameterName || 'Chave da API'
                    : scheme.scheme === 'basic'
                      ? 'Usuário:senha'
                      : 'Token'}
                </span>
                <input
                  type="password"
                  value={credentials[scheme.name] ?? ''}
                  autoComplete="off"
                  placeholder="Inserir somente para testar"
                  onChange={(event) => onCredentialChange(scheme.name, event.target.value)}
                />
              </label>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReferenceDocumentView({ publication, settings = {}, reference }) {
  const [query, setQuery] = useState('')
  const [credentials, setCredentials] = useState({})
  const [activeAnchor, setActiveAnchor] = useState('reference-overview')
  const searchRef = useRef(null)
  const searchId = useId()
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('pt-BR'))
  const chartStyleIndex = settings.chartStyleIndex ?? publication.settings?.chartStyleIndex ?? 2
  const widthMode = settings.widthMode ?? publication.settings?.widthMode ?? 'standard'

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
  const version = displayVersion(reference.version)

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const handleCredentialChange = (name, value) => {
    setCredentials((current) => ({ ...current, [name]: value }))
  }

  return (
    <ModalProvider renderBlocks={(blocks) => renderBlocks(blocks, chartStyleIndex)}>
      <div
        className={`publication publication--reference reference ready reference--${widthMode}`}
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

            <div className="reference-search-wrap">
              <div className="reference-search">
                <Search size={14} aria-hidden="true" />
                <label className="sr-only" htmlFor={searchId}>Buscar operações</label>
                <input
                  id={searchId}
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar operações"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                      setQuery('')
                      searchRef.current?.focus()
                    }}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                ) : (
                  <kbd aria-hidden="true">/</kbd>
                )}
              </div>
              {query && (
                <span className="reference-search-result">
                  {visibleOperations.length} resultado{visibleOperations.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <nav aria-label="Navegação da referência">
              <span className="reference-nav-label">Começando</span>
              <a
                href="#reference-overview"
                className={activeAnchor === 'reference-overview' ? 'active' : ''}
                aria-current={activeAnchor === 'reference-overview' ? 'location' : undefined}
                onClick={() => setActiveAnchor('reference-overview')}
              >
                Visão geral
              </a>
              {reference.securitySchemes.length > 0 && (
                <a
                  href="#reference-authentication"
                  className={activeAnchor === 'reference-authentication' ? 'active' : ''}
                  aria-current={activeAnchor === 'reference-authentication' ? 'location' : undefined}
                  onClick={() => setActiveAnchor('reference-authentication')}
                >
                  Autenticação
                </a>
              )}
              {groupedOperations.map((tag) => (
                <details
                  key={`${tag.name}-${deferredQuery ? 'search' : 'browse'}`}
                  className="reference-nav-group"
                  defaultOpen={Boolean(deferredQuery) || groupedOperations.length <= 8}
                >
                  <summary>
                    <span>{tag.name}</span>
                    <small>{tag.operations.length}</small>
                  </summary>
                  <div>
                    {tag.operations.map((operation) => (
                      <ReferenceNavOperation
                        key={operation.id}
                        operation={operation}
                        active={activeAnchor === operation.anchor}
                        onSelect={setActiveAnchor}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </nav>
          </aside>

          <main id="reference-top" className="reference-main">
            <header className="reference-hero">
              <div className="reference-eyebrow">
                <div>
                  <span>OPENAPI {reference.openapi}</span>
                  {version && <span>{version}</span>}
                </div>
                <ShareReferenceButton title={reference.title} publication={publication} />
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

            <SecurityOverview
              schemes={reference.securitySchemes}
              credentials={credentials}
              onCredentialChange={handleCredentialChange}
            />

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
                  <Operation
                    key={operation.id}
                    operation={operation}
                    serverUrl={server?.url}
                    credentials={credentials}
                    securitySchemes={reference.securitySchemes}
                  />
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

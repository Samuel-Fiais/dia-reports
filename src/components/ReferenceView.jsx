import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { renderInline } from '../lib/inline.jsx'
import {
  fetchRemoteOpenApiDocument,
  formatOpenApiResponseBody,
  normalizeOpenApiDocument,
  openApiDocumentFromPublication,
  openApiUrlFromPublication,
  validateOpenApiParameter,
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

const JSON_TOKEN_PATTERN = /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g

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

function tokenizeJson(code) {
  const tokens = []
  let cursor = 0
  for (const match of code.matchAll(JSON_TOKEN_PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ type: 'plain', value: code.slice(cursor, index) })
    const value = match[0]
    const end = index + value.length
    const type = value.startsWith('"')
      ? (/^\s*:/.test(code.slice(end)) ? 'key' : 'string')
      : value === 'null'
        ? 'null'
        : ['true', 'false'].includes(value)
          ? 'boolean'
          : 'number'
    tokens.push({ type, value })
    cursor = end
  }
  if (cursor < code.length) tokens.push({ type: 'plain', value: code.slice(cursor) })
  return tokens
}

function JsonCode({ value }) {
  const code = String(value ?? '')
  const tokens = useMemo(() => tokenizeJson(code), [code])
  return (
    <code className="reference-json-syntax" data-language="json">
      {tokens.map((token, index) => (
        token.type === 'plain'
          ? <span key={`${index}-plain`}>{token.value}</span>
          : (
            <span key={`${index}-${token.type}`} className={`json-token json-token--${token.type}`}>
              {token.value}
            </span>
          )
      ))}
    </code>
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

function RequestRunner({
  operation,
  serverUrl,
  credentials,
  securitySchemes,
  onCredentialChange,
}) {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [activeResultTab, setActiveResultTab] = useState('response')
  const [requestDetails, setRequestDetails] = useState(null)
  const [customHeaders, setCustomHeaders] = useState([])
  const nextHeaderId = useRef(0)
  const titleId = useId()
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
  const activeSchemeNames = useMemo(() => new Set(
    operation.security.flatMap((requirement) => Object.keys(requirement)),
  ), [operation.security])
  const activeSecuritySchemes = useMemo(
    () => securitySchemes.filter((scheme) => activeSchemeNames.has(scheme.name)),
    [activeSchemeNames, securitySchemes],
  )
  const formattedResponse = useMemo(
    () => formatOpenApiResponseBody(result?.body),
    [result?.body],
  )
  const formattedRequest = useMemo(
    () => requestDetails ? JSON.stringify(requestDetails, null, 2) : '',
    [requestDetails],
  )

  useEffect(() => {
    if (!open) return undefined
    document.body.classList.add('dia-modal-scroll-lock')
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('dia-modal-scroll-lock')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const send = async () => {
    setRunning(true)
    setResult(null)
    try {
      for (const parameter of operation.parameters) {
        const value = parameterValues[`${parameter.in}:${parameter.name}`] ?? ''
        const message = validateOpenApiParameter(parameter, value)
        if (message) throw new Error(message)
      }
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
      const auth = credentialHeaders(
        activeSecuritySchemes,
        credentials,
      )
      Object.assign(headers, auth.headers)
      Object.entries(auth.query).forEach(([name, value]) => url.searchParams.set(name, value))
      for (const header of customHeaders) {
        if (header.name.trim()) headers[header.name.trim()] = header.value
      }
      if (body) headers['Content-Type'] = operation.requestBody?.mediaType || 'application/json'

      setRequestDetails({
        method: operation.method,
        url: url.toString(),
        headers: Object.fromEntries(
          Object.entries(headers).map(([name, value]) => [
            name,
            /authorization|api[-_]?key/i.test(name) ? '••••••••' : value,
          ]),
        ),
        body: body || undefined,
      })
      setActiveResultTab('response')
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
        contentType: response.headers.get('content-type') ?? '',
        headers: Object.fromEntries(response.headers.entries()),
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

  return (
    <>
      <div className="reference-test-launch">
        <button type="button" onClick={() => setOpen(true)}>
          <Play size={12} fill="currentColor" aria-hidden="true" />
          Test Request
        </button>
      </div>
      {open && createPortal(
        <div
          className="reference-request-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            className="reference-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="reference-request-modal-head">
              <div>
                <span className={`reference-nav-method reference-nav-method--${operation.method.toLowerCase()}`}>
                  {operation.method}
                </span>
                <code>{serverUrl}{operation.path}</code>
              </div>
              <div>
                <button
                  type="button"
                  className="reference-send-request"
                  autoFocus
                  disabled={running || !serverUrl}
                  onClick={send}
                >
                  {running
                    ? <LoaderCircle className="reference-spinner" size={13} aria-hidden="true" />
                    : <Play size={12} fill="currentColor" aria-hidden="true" />}
                  {running ? 'Enviando...' : 'Enviar'}
                </button>
                <button
                  type="button"
                  className="reference-request-modal-close"
                  aria-label="Fechar teste"
                  onClick={() => setOpen(false)}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="reference-request-modal-grid">
              <section className="reference-request-config">
                <div className="reference-request-column-head">
                  <h2 id={titleId}>Test Request</h2>
                  <span>Configuração</span>
                </div>

                {operation.parameters.length > 0 && (
                  <div className="reference-request-section">
                    <h3>Parâmetros</h3>
                    <div className="reference-request-fields">
                      {operation.parameters.map((parameter) => (
                        <label key={`${parameter.in}:${parameter.name}`}>
                          <span>
                            {parameter.name}
                            <small>
                              {parameter.in}{parameter.required ? ' · obrigatório' : ''}
                            </small>
                          </span>
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
                  </div>
                )}

                {activeSecuritySchemes.length > 0 && (
                  <div className="reference-request-section">
                    <h3>Autenticação</h3>
                    <div className="reference-request-fields">
                      {activeSecuritySchemes.map((scheme) => (
                        <label key={scheme.name}>
                          <span>
                            {scheme.name}
                            <small>{[scheme.type, scheme.scheme].filter(Boolean).join(' · ')}</small>
                          </span>
                          <input
                            type="password"
                            value={credentials[scheme.name] ?? ''}
                            autoComplete="off"
                            placeholder={scheme.type === 'apiKey' ? 'Chave da API' : 'Token'}
                            onChange={(event) => onCredentialChange(scheme.name, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="reference-request-section">
                  <div className="reference-request-section-head">
                    <h3>Headers</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const id = `header-${nextHeaderId.current}`
                        nextHeaderId.current += 1
                        setCustomHeaders((current) => [...current, { id, name: '', value: '' }])
                      }}
                    >
                      <Plus size={12} aria-hidden="true" /> Adicionar
                    </button>
                  </div>
                  {customHeaders.length === 0 ? (
                    <p className="reference-request-section-empty">Nenhum header personalizado.</p>
                  ) : (
                    <div className="reference-custom-headers">
                      {customHeaders.map((header) => (
                        <div key={header.id}>
                          <input
                            aria-label="Nome do header"
                            placeholder="Header"
                            value={header.name}
                            onChange={(event) => setCustomHeaders((current) => current.map((entry) => (
                              entry.id === header.id ? { ...entry, name: event.target.value } : entry
                            )))}
                          />
                          <input
                            aria-label={`Valor de ${header.name || 'header'}`}
                            placeholder="Valor"
                            value={header.value}
                            onChange={(event) => setCustomHeaders((current) => current.map((entry) => (
                              entry.id === header.id ? { ...entry, value: event.target.value } : entry
                            )))}
                          />
                          <button
                            type="button"
                            aria-label="Remover header"
                            onClick={() => setCustomHeaders((current) => (
                              current.filter((entry) => entry.id !== header.id)
                            ))}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {operation.requestBody && (
                  <div className="reference-request-section">
                    <h3>Body</h3>
                    <label className="reference-request-body">
                      <span>
                        Conteúdo
                        <small>{operation.requestBody.mediaType}</small>
                      </span>
                      <textarea
                        value={body}
                        rows={12}
                        spellCheck="false"
                        onChange={(event) => setBody(event.target.value)}
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="reference-response-view" aria-live="polite">
                <div className="reference-result-tabs">
                  <div role="tablist" aria-label="Dados da execução">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeResultTab === 'response'}
                      className={activeResultTab === 'response' ? 'active' : ''}
                      onClick={() => setActiveResultTab('response')}
                    >
                      Resposta
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeResultTab === 'request'}
                      className={activeResultTab === 'request' ? 'active' : ''}
                      onClick={() => setActiveResultTab('request')}
                    >
                      Request
                    </button>
                  </div>
                  {activeResultTab === 'response' && formattedResponse && (
                    <CopyButton value={formattedResponse} />
                  )}
                  {activeResultTab === 'request' && formattedRequest && (
                    <CopyButton value={formattedRequest} />
                  )}
                </div>
                {activeResultTab === 'request' ? (
                  requestDetails ? (
                    <div className="reference-request-details">
                      <pre><JsonCode value={formattedRequest} /></pre>
                    </div>
                  ) : (
                    <div className="reference-response-empty">
                      Envie a requisição para visualizar URL, headers e body enviados.
                    </div>
                  )
                ) : (
                  <>
                    {!result && (
                      <div className="reference-response-empty">
                        Envie a requisição para visualizar status, duração e conteúdo da resposta.
                      </div>
                    )}
                    {result?.error && (
                      <div className="reference-response-error">{result.error}</div>
                    )}
                    {result && !result.error && (
                      <div className={`reference-response-result${result.ok ? ' is-success' : ' is-error'}`}>
                        <div className="reference-response-meta">
                          <strong>{result.status} {result.statusText}</strong>
                          <span>{result.duration} ms</span>
                          {result.contentType && <small>{result.contentType}</small>}
                        </div>
                        {formattedResponse
                          ? <pre><JsonCode value={formattedResponse} /></pre>
                          : <div className="reference-response-empty">Resposta sem conteúdo.</div>}
                        {Object.keys(result.headers ?? {}).length > 0 && (
                          <details className="reference-response-headers">
                            <summary>Headers da resposta</summary>
                            <pre><JsonCode value={JSON.stringify(result.headers, null, 2)} /></pre>
                          </details>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
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
      <pre><JsonCode value={code} /></pre>
    </div>
  )
}

function ParametersTable({ parameters }) {
  if (!parameters.length) return null
  return (
    <div className="reference-operation-part">
      <h4>Parâmetros</h4>
      <div className="reference-parameter-list">
        {parameters.map((parameter) => (
          <div key={`${parameter.in}-${parameter.name}`} className="reference-parameter-row">
            <div>
              <code>{parameter.name}</code>
              <span>{[parameter.type, parameter.format].filter(Boolean).join(' · ')}</span>
              {parameter.required && <em>obrigatório</em>}
            </div>
            <small>{parameter.in}</small>
            {parameter.description && <p>{renderInline(parameter.description)}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function schemaLabel(schema) {
  if (!schema) return 'any'
  const base = schema.refName || schema.type || 'any'
  const format = schema.format ? ` · ${schema.format}` : ''
  const nullable = schema.nullable ? ' | null' : ''
  return `${base}${format}${nullable}`
}

function SchemaProperty({ name, schema, required = false, depth = 0 }) {
  const properties = Object.entries(schema?.properties ?? {})
  const itemProperties = Object.entries(schema?.items?.properties ?? {})
  const children = properties.length ? properties : itemProperties
  const requiredChildren = new Set(
    properties.length ? schema?.required ?? [] : schema?.items?.required ?? [],
  )
  const expandable = children.length > 0

  return (
    <details className="reference-schema-property" open={depth === 0 && expandable}>
      <summary>
        <span className="reference-schema-caret" aria-hidden="true">{expandable ? '›' : ''}</span>
        <code>{name}</code>
        <span>{schemaLabel(schema)}</span>
        {required && <em>obrigatório</em>}
        {schema?.default !== undefined && <small>padrão: {String(schema.default)}</small>}
      </summary>
      {schema?.description && <p>{renderInline(schema.description)}</p>}
      {schema?.enum?.length > 0 && (
        <div className="reference-schema-enum">
          {schema.enum.map((value) => <code key={String(value)}>{String(value)}</code>)}
        </div>
      )}
      {expandable && (
        <div className="reference-schema-children">
          {children.map(([childName, childSchema]) => (
            <SchemaProperty
              key={childName}
              name={childName}
              schema={childSchema}
              required={requiredChildren.has(childName)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </details>
  )
}

function SchemaTable({ schema, rootLabel }) {
  if (!schema) return null
  const directProperties = Object.entries(schema.properties ?? {})
  const itemProperties = Object.entries(schema.items?.properties ?? {})
  const properties = directProperties.length ? directProperties : itemProperties
  const required = new Set(
    directProperties.length ? schema.required ?? [] : schema.items?.required ?? [],
  )
  if (!properties.length) {
    return (
      <div className="reference-schema-empty">
        <code>{schemaLabel(schema)}</code>
        {schema.description && <p>{renderInline(schema.description)}</p>}
      </div>
    )
  }
  return (
    <div className="reference-schema">
      {rootLabel && (
        <div className="reference-schema-root">
          <code>{rootLabel}</code>
          <span>{schemaLabel(schema)}</span>
        </div>
      )}
      {properties.map(([name, property]) => (
        <SchemaProperty
          key={name}
          name={name}
          schema={property}
          required={required.has(name)}
        />
      ))}
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
              {response.schema
                ? <SchemaTable schema={response.schema} />
                : (
                  <p className="reference-contract-empty">
                    Nenhum schema de resposta foi declarado neste contrato.
                  </p>
                )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function OperationFacts({ operation }) {
  const authentication = [...new Set(
    operation.security.flatMap((requirement) => Object.keys(requirement)),
  )]
  const mediaTypes = [...new Set(
    operation.responses.map((response) => response.mediaType).filter(Boolean),
  )]
  const facts = [
    {
      label: 'Parâmetros',
      value: operation.parameters.length ? String(operation.parameters.length) : 'Nenhum',
    },
    {
      label: 'Corpo',
      value: operation.requestBody?.mediaType ?? 'Nenhum',
    },
    {
      label: 'Autenticação',
      value: authentication.length ? authentication.join(', ') : 'Não exigida',
    },
    {
      label: 'Retornos',
      value: operation.responses.map((response) => response.status).join(', ') || 'Não declarados',
    },
    {
      label: 'Formato',
      value: mediaTypes.join(', ') || 'Não declarado',
    },
  ]

  return (
    <dl className="reference-operation-facts">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd title={fact.value}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ResponseExamples({ responses }) {
  const examples = responses.filter((response) => response.example != null)
  const [active, setActive] = useState(0)
  if (!examples.length) return null
  const response = examples[Math.min(active, examples.length - 1)]
  const code = typeof response.example === 'string'
    ? response.example
    : JSON.stringify(response.example, null, 2)

  return (
    <div className="reference-example-response">
      <div className="reference-example-response-head">
        <div role="tablist" aria-label="Respostas de exemplo">
          {examples.map((entry, index) => (
            <button
              key={entry.status}
              type="button"
              role="tab"
              aria-selected={active === index}
              className={active === index ? 'active' : ''}
              onClick={() => setActive(index)}
            >
              {entry.status}
            </button>
          ))}
        </div>
        <CopyButton value={code} />
      </div>
      <pre><JsonCode value={code} /></pre>
      <footer>{response.description || 'Resposta de exemplo'}</footer>
    </div>
  )
}

function Operation({
  operation,
  serverUrl,
  credentials,
  securitySchemes,
  onCredentialChange,
}) {
  const title = operationTitle(operation)

  return (
    <section id={operation.anchor} className="reference-operation">
      <div className="reference-operation-body">
        <div className="reference-operation-docs">
          {title && <h3>{title}</h3>}
          {operation.description && <p>{renderInline(operation.description)}</p>}
          {!title && !operation.description && (
            <p className="reference-contract-notice">
              Esta operação não possui resumo ou descrição no contrato OpenAPI publicado.
            </p>
          )}
          <OperationFacts operation={operation} />
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
              onCredentialChange={onCredentialChange}
            />
          </CodeSamples>
          <ResponseExamples responses={operation.responses} />
        </aside>
      </div>
    </section>
  )
}

function OperationList({ operations, title = 'Operações' }) {
  return (
    <div className="reference-operation-list">
      <strong>{title}</strong>
      <div>
        {operations.map((operation) => (
          <a key={operation.id} href={`#${operation.anchor}`}>
            <span className={`reference-nav-method reference-nav-method--${operation.method.toLowerCase()}`}>
              {operation.method}
            </span>
            <code>{operation.path}</code>
          </a>
        ))}
      </div>
    </div>
  )
}

function Models({ models }) {
  if (!models.length) return null
  return (
    <section id="reference-models" className="reference-models">
      <header>
        <span>Contratos</span>
        <h2>Modelos</h2>
        <p>Estruturas reutilizadas por parâmetros, corpos e respostas da API.</p>
      </header>
      <div className="reference-model-list">
        {models.map((model) => (
          <details key={model.name} id={model.anchor}>
            <summary>
              <code>{model.name}</code>
              <span>{schemaLabel(model.schema)}</span>
            </summary>
            <div>
              <SchemaTable schema={model.schema} />
              <JsonExample value={model.example} label="Exemplo" />
            </div>
          </details>
        ))}
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
          As credenciais abaixo são usadas nos testes desta página e não são salvas.
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
                  placeholder="Inserir credencial para testar"
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
              {reference.models.length > 0 && (
                <details className="reference-nav-group reference-nav-models">
                  <summary>
                    <span>Modelos</span>
                    <small>{reference.models.length}</small>
                  </summary>
                  <div>
                    {reference.models.map((model) => (
                      <a
                        key={model.name}
                        href={`#${model.anchor}`}
                        className={activeAnchor === model.anchor ? 'active' : ''}
                        onClick={() => setActiveAnchor(model.anchor)}
                      >
                        <span title={model.name}>{model.name}</span>
                      </a>
                    ))}
                  </div>
                </details>
              )}
            </nav>
          </aside>

          <main id="reference-top" className="reference-main">
            <header className="reference-hero">
              <div className="reference-hero-intro">
                <div className="reference-eyebrow">
                  {version && <span>{version}</span>}
                  <span>OAS {reference.openapi}</span>
                </div>
                <h1>{reference.title}</h1>
                {(publication.intro?.[0] || reference.description) && (
                  <p>{renderInline(publication.intro?.[0] ?? reference.description)}</p>
                )}
              </div>
              <div className="reference-hero-panels">
                {server?.url && (
                  <section className="reference-overview-panel">
                    <strong>Servidor</strong>
                    <div className="reference-server">
                      <code>{server.url}</code>
                      <CopyButton value={server.url} />
                    </div>
                  </section>
                )}
                <section className="reference-overview-panel">
                  <strong>Autenticação</strong>
                  <span>
                    {reference.securitySchemes.length
                      ? `${reference.securitySchemes.length} método${reference.securitySchemes.length === 1 ? '' : 's'} disponível${reference.securitySchemes.length === 1 ? '' : 'is'}`
                      : 'Sem autenticação declarada'}
                  </span>
                </section>
                <section className="reference-overview-panel">
                  <strong>Bibliotecas cliente</strong>
                  <div className="reference-client-libraries">
                    {(reference.operations[0]?.codeSamples ?? []).map((sample) => (
                      <span key={sample.id}>{sample.label}</span>
                    ))}
                  </div>
                </section>
              </div>
            </header>

            <section id="reference-overview" className="reference-overview-section">
              <div>
                <h2>Visão geral</h2>
                <p>
                  {reference.operations.length} operaç
                  {reference.operations.length === 1 ? 'ão' : 'ões'} em{' '}
                  {reference.tags.length} grupo{reference.tags.length === 1 ? '' : 's'}.
                </p>
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

            {groupedOperations.map((tag) => (
              <section key={tag.name} className="reference-tag-group">
                <div className="reference-tag-overview reference-tag-overview--mixed">
                  <div>
                    <h2>{tag.name}</h2>
                    {tag.description && <p>{renderInline(tag.description)}</p>}
                  </div>
                  <OperationList operations={tag.operations} />
                </div>
                <div className="reference-tag-details">
                  {tag.operations.map((operation) => (
                    <Operation
                      key={operation.id}
                      operation={operation}
                      serverUrl={server?.url}
                      credentials={credentials}
                      securitySchemes={reference.securitySchemes}
                      onCredentialChange={handleCredentialChange}
                    />
                  ))}
                </div>
              </section>
            ))}

            {visibleOperations.length === 0 && (
              <div className="reference-empty">
                Nenhuma operação encontrada para “{query}”.
              </div>
            )}

            <Models models={reference.models} />
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
      systemReference: publication.system ? publication.id : undefined,
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

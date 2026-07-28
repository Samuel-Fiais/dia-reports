const HTTP_METHODS = Object.freeze([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
])

const STATUS_LABELS = Object.freeze({
  default: 'Padrão',
})

export function formatOpenApiResponseBody(value) {
  if (!value) return ''
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export function validateOpenApiParameter(parameter, value) {
  const text = String(value ?? '')
  if (parameter.required && !text) return `${parameter.name} é obrigatório.`
  if (!text) return ''
  if (parameter.minLength != null && text.length < parameter.minLength) {
    return `${parameter.name} deve ter ao menos ${parameter.minLength} caracteres.`
  }
  if (parameter.maxLength != null && text.length > parameter.maxLength) {
    return `${parameter.name} deve ter no máximo ${parameter.maxLength} caracteres.`
  }
  if (parameter.pattern) {
    try {
      if (!new RegExp(parameter.pattern).test(text)) {
        return `${parameter.name} não está no formato esperado (${parameter.pattern}).`
      }
    } catch {
      // Contratos com expressão inválida não devem impedir a requisição.
    }
  }
  if (parameter.enum?.length > 0 && !parameter.enum.map(String).includes(text)) {
    return `${parameter.name} deve ser um dos valores: ${parameter.enum.join(', ')}.`
  }
  return ''
}

function decodePointerSegment(segment) {
  return segment.replaceAll('~1', '/').replaceAll('~0', '~')
}

export function resolveOpenApiRef(document, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null
  return ref
    .slice(2)
    .split('/')
    .map(decodePointerSegment)
    .reduce((value, key) => value?.[key], document) ?? null
}

function resolveNode(document, node, seen = new Set()) {
  if (!node?.$ref) return node ?? {}
  if (seen.has(node.$ref)) return {}
  const resolved = resolveOpenApiRef(document, node.$ref)
  if (!resolved) return node
  return resolveNode(document, resolved, new Set([...seen, node.$ref]))
}

function schemaType(schema) {
  if (schema.type) return schema.type
  if (schema.properties) return 'object'
  if (schema.items) return 'array'
  if (schema.oneOf || schema.anyOf || schema.allOf) return 'object'
  return 'any'
}

export function openApiSchemaExample(document, rawSchema, depth = 0, seen = new Set()) {
  if (depth > 8 || !rawSchema) return null
  if (rawSchema.example !== undefined) return rawSchema.example
  if (rawSchema.default !== undefined) return rawSchema.default
  if (rawSchema.enum?.length) return rawSchema.enum[0]

  if (rawSchema.$ref) {
    if (seen.has(rawSchema.$ref)) return null
    const resolved = resolveOpenApiRef(document, rawSchema.$ref)
    return openApiSchemaExample(
      document,
      resolved,
      depth + 1,
      new Set([...seen, rawSchema.$ref]),
    )
  }

  if (rawSchema.allOf?.length) {
    return rawSchema.allOf.reduce((result, part) => {
      const value = openApiSchemaExample(document, part, depth + 1, seen)
      return value && typeof value === 'object' && !Array.isArray(value)
        ? { ...result, ...value }
        : result
    }, {})
  }

  const alternative = rawSchema.oneOf?.[0] ?? rawSchema.anyOf?.[0]
  if (alternative) return openApiSchemaExample(document, alternative, depth + 1, seen)

  switch (schemaType(rawSchema)) {
    case 'object':
      return Object.fromEntries(
        Object.entries(rawSchema.properties ?? {}).map(([key, property]) => [
          key,
          openApiSchemaExample(document, property, depth + 1, seen),
        ]),
      )
    case 'array':
      return [openApiSchemaExample(document, rawSchema.items, depth + 1, seen)]
    case 'integer':
    case 'number':
      return rawSchema.minimum ?? 0
    case 'boolean':
      return true
    case 'string':
      if (rawSchema.format === 'date') return '2026-07-28'
      if (rawSchema.format === 'date-time') return '2026-07-28T12:00:00Z'
      if (rawSchema.format === 'email') return 'nome@exemplo.com'
      if (rawSchema.format === 'uri') return 'https://exemplo.com'
      return rawSchema.pattern ? 'valor' : 'string'
    default:
      return null
  }
}

function firstContentEntry(content) {
  const entries = Object.entries(content ?? {})
  if (!entries.length) return null
  const preferred = entries.find(([mediaType]) => mediaType.includes('json')) ?? entries[0]
  return { mediaType: preferred[0], value: preferred[1] ?? {} }
}

function mediaExample(document, media) {
  if (!media) return null
  if (media.example !== undefined) return media.example
  const namedExample = Object.values(media.examples ?? {})[0]
  if (namedExample?.value !== undefined) return namedExample.value
  return openApiSchemaExample(document, media.schema)
}

function normalizeParameter(document, rawParameter) {
  const parameter = resolveNode(document, rawParameter)
  const schema = resolveNode(document, parameter.schema)
  return {
    name: parameter.name ?? '',
    in: parameter.in ?? '',
    description: parameter.description ?? '',
    required: parameter.required === true || parameter.in === 'path',
    type: schemaType(schema),
    format: schema.format ?? '',
    example: parameter.example ?? schema.example ?? schema.default,
    pattern: schema.pattern ?? '',
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    minimum: schema.minimum,
    maximum: schema.maximum,
    enum: schema.enum ?? [],
  }
}

function operationAnchor(method, path, operationId) {
  const source = `${method}-${operationId || path}`
  return `operation-${source}`
    .toLowerCase()
    .replaceAll(/[{}]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}

function interpolatePath(path, parameters) {
  return path.replaceAll(/\{([^}]+)\}/g, (_, name) => {
    const parameter = parameters.find((entry) => entry.name === name)
    return encodeURIComponent(parameter?.example ?? name)
  })
}

function buildRequestUrl(baseUrl, path, parameters) {
  const resolvedPath = interpolatePath(path, parameters)
  const query = parameters
    .filter((parameter) => parameter.in === 'query' && parameter.required)
    .map((parameter) => (
      `${encodeURIComponent(parameter.name)}=${encodeURIComponent(parameter.example ?? parameter.name)}`
    ))
    .join('&')
  return `${String(baseUrl ?? '').replace(/\/$/, '')}${resolvedPath}${query ? `?${query}` : ''}`
}

export function buildCodeSamples(method, url, requestExample) {
  const upperMethod = method.toUpperCase()
  const body = requestExample == null ? '' : JSON.stringify(requestExample, null, 2)
  const httpieParts = [`http ${upperMethod} '${url}'`]
  const curlParts = [`curl -X ${upperMethod} '${url}'`]
  if (body) {
    httpieParts.push("'Content-Type:application/json'")
    httpieParts.push(`<<< '${body}'`)
    curlParts.push("  -H 'Content-Type: application/json'")
    curlParts.push(`  -d '${body}'`)
  }

  const fetchOptions = [
    `  method: '${upperMethod}',`,
    ...(body
      ? [
          "  headers: { 'Content-Type': 'application/json' },",
          `  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),`,
        ]
      : []),
  ]

  return [
    {
      id: 'httpie',
      label: 'HTTPie',
      language: 'bash',
      code: httpieParts.join(' \\\n  '),
    },
    { id: 'curl', label: 'curl', language: 'bash', code: curlParts.join(' \\\n') },
    {
      id: 'javascript',
      label: 'JavaScript',
      language: 'javascript',
      code: `const response = await fetch('${url}', {\n${fetchOptions.join('\n')}\n})\nconst data = await response.json()`,
    },
    {
      id: 'csharp',
      label: 'C#',
      language: 'csharp',
      code: [
        ...(body ? ['using System.Text;', ''] : []),
        'using var client = new HttpClient();',
        `using var request = new HttpRequestMessage(HttpMethod.${upperMethod[0]}${upperMethod.slice(1).toLowerCase()}, "${url}");`,
        ...(body
          ? [`request.Content = new StringContent(${JSON.stringify(body)}, Encoding.UTF8, "application/json");`]
          : []),
        'using var response = await client.SendAsync(request);',
        'response.EnsureSuccessStatusCode();',
        'var data = await response.Content.ReadAsStringAsync();',
      ].join('\n'),
    },
  ]
}

function normalizeRequestBody(document, rawRequestBody) {
  if (!rawRequestBody) return null
  const requestBody = resolveNode(document, rawRequestBody)
  const content = firstContentEntry(requestBody.content)
  if (!content) return null
  const schema = resolveNode(document, content.value.schema)
  return {
    description: requestBody.description ?? '',
    required: requestBody.required === true,
    mediaType: content.mediaType,
    schema,
    example: mediaExample(document, content.value),
  }
}

function normalizeResponses(document, responses) {
  return Object.entries(responses ?? {}).map(([status, rawResponse]) => {
    const response = resolveNode(document, rawResponse)
    const content = firstContentEntry(response.content)
    const schema = resolveNode(document, content?.value?.schema)
    return {
      status,
      label: STATUS_LABELS[status] ?? status,
      description: response.description ?? '',
      mediaType: content?.mediaType ?? '',
      schema,
      example: mediaExample(document, content?.value),
    }
  })
}

function normalizeSecuritySchemes(document) {
  return Object.entries(document.components?.securitySchemes ?? {}).map(([name, rawScheme]) => {
    const scheme = resolveNode(document, rawScheme)
    return {
      name,
      type: scheme.type ?? '',
      scheme: scheme.scheme ?? '',
      in: scheme.in ?? '',
      parameterName: scheme.name ?? '',
      description: scheme.description ?? '',
    }
  })
}

export function normalizeOpenApiDocument(document, options = {}) {
  if (!document || typeof document !== 'object') {
    throw new Error('Documento OpenAPI ausente')
  }
  if (!String(document.openapi ?? '').startsWith('3.')) {
    throw new Error(`Versão OpenAPI não suportada: ${document.openapi ?? '(ausente)'}`)
  }

  const declaredTags = new Map(
    (document.tags ?? []).map((tag) => [tag.name, tag.description ?? '']),
  )
  const operations = []
  let fallbackServer = null
  if (!document.servers?.length && options.sourceUrl) {
    try {
      fallbackServer = {
        url: new URL(options.sourceUrl).origin,
        description: 'Origem do contrato OpenAPI',
      }
    } catch {
      fallbackServer = null
    }
  }
  const servers = document.servers?.length
    ? document.servers
    : fallbackServer
      ? [fallbackServer]
      : []
  const baseUrl = servers[0]?.url ?? ''

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    const sharedParameters = pathItem.parameters ?? []
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation) continue
      const parameters = [
        ...sharedParameters,
        ...(operation.parameters ?? []),
      ].map((parameter) => normalizeParameter(document, parameter))
      const requestBody = normalizeRequestBody(document, operation.requestBody)
      const tags = operation.tags?.length ? operation.tags : ['Geral']
      for (const tag of tags) {
        if (!declaredTags.has(tag)) declaredTags.set(tag, '')
      }
      const url = buildRequestUrl(baseUrl, path, parameters)
      operations.push({
        id: operation.operationId ?? `${method}-${path}`,
        anchor: operationAnchor(method, path, operation.operationId),
        method: method.toUpperCase(),
        path,
        requestUrl: url,
        summary: operation.summary ?? `${method.toUpperCase()} ${path}`,
        description: operation.description ?? '',
        deprecated: operation.deprecated === true,
        tags,
        primaryTag: tags[0],
        parameters,
        requestBody,
        responses: normalizeResponses(document, operation.responses),
        security: operation.security ?? document.security ?? [],
        codeSamples: buildCodeSamples(method, url, requestBody?.example),
      })
    }
  }

  return {
    openapi: document.openapi,
    title: document.info?.title ?? 'Referência da API',
    version: document.info?.version ?? '',
    description: document.info?.description ?? '',
    termsOfService: document.info?.termsOfService ?? '',
    servers,
    tags: [...declaredTags].map(([name, description]) => ({ name, description })),
    securitySchemes: normalizeSecuritySchemes(document),
    operations,
  }
}

export function openApiDocumentFromPublication(publication) {
  const source = publication?.source
  if (source?.type !== 'openapi') return null
  return source.document ?? null
}

export function openApiUrlFromPublication(publication) {
  const source = publication?.source
  if (source?.type !== 'openapi') return ''
  return typeof source.url === 'string' ? source.url.trim() : ''
}

export async function fetchRemoteOpenApiDocument(url, options = {}) {
  const params = new URLSearchParams({ url })
  if (options.publicationId) params.set('publication', options.publicationId)
  if (options.shareToken) params.set('token', options.shareToken)
  if (options.systemReference) params.set('system', options.systemReference)
  const response = await fetch(`/api/openapi?${params}`, { signal: options.signal })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error ?? 'Não foi possível carregar o contrato OpenAPI')
    if (response.status === 401) error.code = 'UNAUTHENTICATED'
    throw error
  }
  return body.document
}

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatOpenApiResponseBody,
  normalizeOpenApiDocument,
  openApiDocumentFromPublication,
  openApiSchemaExample,
  openApiUrlFromPublication,
  resolveOpenApiRef,
  validateOpenApiParameter,
} from './openapi.js'

const document = {
  openapi: '3.1.0',
  info: { title: 'API de exemplo', version: '1.0.0' },
  servers: [{ url: 'https://api.exemplo.com' }],
  tags: [{ name: 'Itens' }],
  paths: {
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        tags: ['Itens'],
        summary: 'Consulta um item',
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          example: 'item-1',
          schema: { type: 'string', pattern: '^item-\\d+$', minLength: 6 },
        }],
        responses: {
          200: {
            description: 'Item encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Item' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Item: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'item-1' },
          active: { type: 'boolean' },
        },
      },
    },
  },
}

test('resolves local OpenAPI references', () => {
  assert.equal(resolveOpenApiRef(document, '#/components/schemas/Item'), document.components.schemas.Item)
})

test('generates examples from schemas and references', () => {
  assert.deepEqual(
    openApiSchemaExample(document, { $ref: '#/components/schemas/Item' }),
    { id: 'item-1', active: true },
  )
})

test('formats JSON responses and preserves non-JSON bodies', () => {
  assert.equal(
    formatOpenApiResponseBody('{"ok":true,"items":[1,2]}'),
    '{\n  "ok": true,\n  "items": [\n    1,\n    2\n  ]\n}',
  )
  assert.equal(formatOpenApiResponseBody('plain text'), 'plain text')
})

test('validates parameter constraints before issuing a browser request', () => {
  const cep = {
    name: 'cep',
    required: true,
    pattern: '^\\d{8}$',
    minLength: 8,
    maxLength: 8,
    enum: [],
  }
  assert.equal(validateOpenApiParameter(cep, '01001000'), '')
  assert.match(validateOpenApiParameter(cep, '01001-000'), /máximo 8/)
  assert.match(validateOpenApiParameter(cep, ''), /obrigatório/)
})

test('normalizes operations, navigation and code samples', () => {
  const normalized = normalizeOpenApiDocument(document)
  const operation = normalized.operations[0]

  assert.equal(normalized.title, 'API de exemplo')
  assert.equal(operation.anchor, 'operation-get-getitem')
  assert.equal(operation.parameters[0].required, true)
  assert.equal(operation.parameters[0].pattern, '^item-\\d+$')
  assert.equal(operation.parameters[0].minLength, 6)
  assert.deepEqual(operation.responses[0].example, { id: 'item-1', active: true })
  assert.match(operation.codeSamples[0].code, /item-1/)
  assert.deepEqual(
    operation.codeSamples.map((sample) => sample.id),
    ['httpie', 'curl', 'javascript', 'csharp'],
  )
  assert.equal(operation.requestUrl, 'https://api.exemplo.com/items/item-1')
})

test('rejects missing and unsupported OpenAPI versions', () => {
  assert.throws(() => normalizeOpenApiDocument({}), /Versão OpenAPI não suportada/)
  assert.throws(
    () => normalizeOpenApiDocument({ openapi: '2.0', info: {}, paths: {} }),
    /Versão OpenAPI não suportada/,
  )
})

test('reads embedded and remote publication sources without mixing them', () => {
  assert.equal(
    openApiDocumentFromPublication({ source: { type: 'openapi', document } }),
    document,
  )
  assert.equal(
    openApiUrlFromPublication({
      source: { type: 'openapi', url: ' https://api.exemplo.com/openapi.json ' },
    }),
    'https://api.exemplo.com/openapi.json',
  )
  assert.equal(
    openApiDocumentFromPublication({
      source: { type: 'openapi', url: 'https://api.exemplo.com/openapi.json' },
    }),
    null,
  )
})

test('uses the remote contract origin when OpenAPI omits servers', () => {
  const normalized = normalizeOpenApiDocument(
    {
      ...document,
      servers: undefined,
    },
    {
      sourceUrl: 'https://api-dev.exemplo.com/swagger/v1/swagger.json',
    },
  )

  assert.equal(normalized.servers[0].url, 'https://api-dev.exemplo.com')
  assert.match(normalized.operations[0].codeSamples[0].code, /https:\/\/api-dev\.exemplo\.com/)
})

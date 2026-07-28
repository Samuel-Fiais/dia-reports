import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CURRENT_SCHEMA_VERSION,
  normalizePublication,
  publicationNodeKey,
} from './publication.js'

test('normalization establishes the publication contract', () => {
  const publication = normalizePublication({
    id: 'example',
    body: [{ type: 'paragraph', text: 'Conteúdo' }],
  })

  assert.equal(publication.schemaVersion, CURRENT_SCHEMA_VERSION)
  assert.equal(publication.renderMode, 'report')
  assert.match(publication.body[0]._key, /^publication-example-/)
})

test('stable keys depend on content instead of array position', () => {
  const node = { type: 'paragraph', text: 'Mesmo conteúdo' }
  assert.equal(publicationNodeKey(node, 'body', 0), publicationNodeKey(node, 'body'))
  assert.notEqual(publicationNodeKey(node, 'body', 0), publicationNodeKey(node, 'body', 1))
})

test('reordering unique section items preserves their keys', () => {
  const first = { title: 'Primeiro', blocks: [{ type: 'paragraph', text: 'A' }] }
  const second = { title: 'Segundo', blocks: [{ type: 'paragraph', text: 'B' }] }
  const original = normalizePublication({
    id: 'ordered',
    body: [{ type: 'section', heading: 'Itens', items: [first, second] }],
  })
  const reordered = normalizePublication({
    id: 'ordered',
    body: [{ type: 'section', heading: 'Itens', items: [second, first] }],
  })

  assert.equal(original.body[0].items[0]._key, reordered.body[0].items[1]._key)
  assert.equal(original.body[0].items[1]._key, reordered.body[0].items[0]._key)
})

test('unknown and removed block types fail explicitly', () => {
  assert.throws(
    () => normalizePublication({ id: 'invalid', body: [{ type: 'decision' }] }),
    /Tipo de bloco não suportado/,
  )
})

test('body-only blocks fail inside section items', () => {
  assert.throws(
    () => normalizePublication({
      id: 'invalid-placement',
      body: [{
        type: 'section',
        heading: 'Seção',
        items: [{ blocks: [{ type: 'table-of-contents' }] }],
      }],
    }),
    /não pode ser usado em item/,
  )
})

test('unsupported modes and schema versions fail instead of falling back', () => {
  assert.throws(
    () => normalizePublication({ schemaVersion: 1, body: [] }),
    /Versão de schema não suportada/,
  )
  assert.throws(
    () => normalizePublication({ schemaVersion: 2, renderMode: 'unsupported', body: [] }),
    /Modo de renderização não suportado/,
  )
})

test('reference mode preserves its OpenAPI source', () => {
  const source = {
    type: 'openapi',
    document: {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
    },
  }
  const publication = normalizePublication({
    id: 'api-reference',
    renderMode: 'reference',
    source,
    body: [],
  })

  assert.equal(publication.renderMode, 'reference')
  assert.equal(publication.source, source)
})

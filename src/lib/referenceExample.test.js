import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOpenApiDocument } from './openapi.js'
import { normalizePublication } from './publication.js'
import { buildReferenceExamplePublication } from './referenceExample.js'

test('the OpenAPI system example is a valid reference publication', () => {
  const publication = normalizePublication(buildReferenceExamplePublication())
  const reference = normalizeOpenApiDocument(publication.source.document)

  assert.equal(publication.renderMode, 'reference')
  assert.equal(reference.title, 'ViaCEP')
  assert.equal(reference.operations.length, 2)
  assert.ok(reference.operations.every((operation) => operation.codeSamples.length >= 2))
})


import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOpenApiDocument } from './openapi.js'
import { normalizePublication } from './publication.js'
import {
  buildReferenceExamplePublication,
  SCHOOL360_REFERENCE_EXAMPLE_ID,
  VIACEP_REFERENCE_EXAMPLE_ID,
} from './referenceExample.js'

test('the OpenAPI system example is a valid reference publication', () => {
  const publication = normalizePublication(
    buildReferenceExamplePublication(VIACEP_REFERENCE_EXAMPLE_ID),
  )
  const reference = normalizeOpenApiDocument(publication.source.document)

  assert.equal(publication.renderMode, 'reference')
  assert.equal(reference.title, 'ViaCEP')
  assert.equal(reference.operations.length, 2)
  assert.ok(reference.operations.every((operation) => operation.codeSamples.length >= 2))
})

test('the School360 example keeps its OpenAPI contract remote', () => {
  const publication = normalizePublication(
    buildReferenceExamplePublication(SCHOOL360_REFERENCE_EXAMPLE_ID),
  )

  assert.equal(publication.renderMode, 'reference')
  assert.equal(publication.system, true)
  assert.equal(publication.source.document, undefined)
  assert.equal(
    publication.source.url,
    'https://api-dev.school360.festpay.com.br/swagger/v1/swagger.json',
  )
})

test('unknown reference examples do not fall back to another document', () => {
  assert.equal(buildReferenceExamplePublication('unknown'), null)
})

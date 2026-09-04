import test from 'node:test'
import assert from 'node:assert/strict'
import { LEGACY_ROUTE_REDIRECTS, ROUTES } from './routes.js'

test('publication routes use English paths', () => {
  assert.equal(ROUTES.reports, '/reports')
  assert.equal(ROUTES.documents, '/documents')
  assert.equal(ROUTES.references, '/references')
  assert.equal(ROUTES.components, '/components')
  assert.equal(ROUTES.forewordEditions, '/the-foreword/editions')
  assert.equal(ROUTES.referenceExample('viacep-api'), '/references/viacep-api')
})

test('legacy Portuguese routes redirect to English equivalents', () => {
  const byFrom = Object.fromEntries(LEGACY_ROUTE_REDIRECTS.map(({ from, to }) => [from, to]))

  assert.equal(byFrom['/relatorios'], '/reports')
  assert.equal(byFrom['/documentos'], '/documents')
  assert.equal(byFrom['/referencias'], '/references')
  assert.equal(byFrom['/referencias/:exampleId'], '/references/:exampleId')
  assert.equal(byFrom['/componentes'], '/components')
})

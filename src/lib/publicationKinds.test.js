import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPublicationKind,
  publicationHref,
  publicationListPath,
  publicationMode,
  SYSTEM_PUBLICATION_SUMMARIES,
  withSystemPublications,
} from './publicationKinds.js'

test('existing publications default to the report area', () => {
  assert.equal(publicationMode({ id: 'legacy' }), 'report')
  assert.equal(publicationListPath(), '/relatorios')
  assert.equal(getPublicationKind('report').title, 'Relatórios')
})

test('system publications are merged once and keep their own route', () => {
  const system = SYSTEM_PUBLICATION_SUMMARIES[0]
  const merged = withSystemPublications([])
  const deduplicated = withSystemPublications(
    SYSTEM_PUBLICATION_SUMMARIES.map((publication) => ({ ...publication })),
  )

  assert.equal(merged.length, 2)
  assert.equal(deduplicated.length, 2)
  assert.equal(publicationHref(system), '/referencias/viacep-api')
})

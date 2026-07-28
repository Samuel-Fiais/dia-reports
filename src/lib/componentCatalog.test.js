import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BLOCK_MANIFEST,
  CANONICAL_BLOCK_TYPES,
} from './blockManifest.js'
import {
  buildComponentCatalogPublication,
  collectCatalogBlockTypes,
  createComponentExample,
} from './componentCatalog.js'
import { normalizePublication } from './publication.js'

test('the component catalog is a valid publication', () => {
  const catalog = buildComponentCatalogPublication('2026-07-28')
  const normalized = normalizePublication(catalog)

  assert.equal(normalized.schemaVersion, 2)
  assert.equal(normalized.renderMode, 'report')
  assert.ok(normalized.body.length > 0)
})

test('the generated document includes every manifest type', () => {
  const catalogTypes = new Set(
    collectCatalogBlockTypes(buildComponentCatalogPublication('2026-07-28')),
  )

  assert.deepEqual(
    [...catalogTypes].toSorted(),
    [...CANONICAL_BLOCK_TYPES].toSorted(),
  )
})

test('every non-structural type receives a schema-driven example', () => {
  for (const [type, definition] of Object.entries(BLOCK_MANIFEST)) {
    if (definition.placements.length === 1 && definition.placements[0] === 'body') continue
    const example = createComponentExample(type)
    assert.equal(example.type, type)
    assert.equal(example.id, `catalog-${type}`)
  }
})

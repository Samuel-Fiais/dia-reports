import test from 'node:test'
import assert from 'node:assert/strict'
import {
  blockPlacements,
  BLOCK_FAMILIES,
  CANONICAL_BLOCK_TYPES,
  PUBLICATION_MODES,
} from './blockContract.js'
import {
  BLOCK_TYPES,
  createBlock,
  describeBlockCatalog,
  getBlockDefinition,
} from './blockRegistry.js'

test('the editor registry exactly matches the canonical generic catalog', () => {
  assert.deepEqual(
    Object.keys(BLOCK_TYPES).toSorted(),
    [...CANONICAL_BLOCK_TYPES].toSorted(),
  )
})

test('every registry entry creates only its own canonical type', () => {
  for (const type of CANONICAL_BLOCK_TYPES) {
    assert.equal(createBlock(type).type, type)
  }
})

test('removed case-specific names are not compatibility aliases', () => {
  for (const removed of [
    'slack',
    'email',
    'meeting-notes',
    'incident-summary',
    'decision',
    'executive-summary',
    'todo',
    'agenda',
    'kanban',
    'quote-break',
    'image-break',
  ]) {
    assert.equal(getBlockDefinition(removed), null)
  }
})

test('all modes expose the same reusable vocabulary', () => {
  for (const mode of PUBLICATION_MODES) {
    assert.deepEqual(
      describeBlockCatalog(mode).map(({ type }) => type).toSorted(),
      [...CANONICAL_BLOCK_TYPES].toSorted(),
    )
  }
})

test('families do not repeat a block type', () => {
  const flattened = Object.values(BLOCK_FAMILIES).flat()
  assert.equal(new Set(flattened).size, flattened.length)
})

test('structural body blocks declare their placement restriction', () => {
  assert.deepEqual(blockPlacements('section'), ['body'])
  assert.deepEqual(blockPlacements('paragraph'), ['body', 'item', 'detail'])
})

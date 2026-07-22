import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canReadReport, normalizeReportVisibility, REPORT_VISIBILITY } from './auth.js'

const user = { permissions: {}, allowedGroupIds: ['g1'] }

describe('normalizeReportVisibility', () => {
  it('defaults unknown to private', () => {
    assert.equal(normalizeReportVisibility('nope'), REPORT_VISIBILITY.PRIVATE)
    assert.equal(normalizeReportVisibility(null), REPORT_VISIBILITY.PRIVATE)
  })
})

describe('canReadReport', () => {
  it('allows public without session', () => {
    assert.equal(canReadReport({ user: null, visibility: 'public', groupIds: ['g9'], isAdmin: false }), true)
  })

  it('denies private without session', () => {
    assert.equal(canReadReport({ user: null, visibility: 'private', groupIds: [], isAdmin: false }), false)
  })

  it('allows private with group access', () => {
    assert.equal(canReadReport({ user, visibility: 'private', groupIds: ['g1'], isAdmin: false }), true)
  })

  it('admin bypasses visibility and groups', () => {
    assert.equal(canReadReport({ user: null, visibility: 'private', groupIds: ['x'], isAdmin: true }), true)
  })
})

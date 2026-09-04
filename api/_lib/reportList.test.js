import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mapReportListRow,
  reportSlugFilterClause,
} from './reportList.js'

test('report list slug filters separate foreword editions from the hub', () => {
  assert.equal(reportSlugFilterClause('exclude-foreword'), "NOT LIKE 'the-foreword-%'")
  assert.equal(reportSlugFilterClause('foreword-only'), "LIKE 'the-foreword-%'")
  assert.throws(() => reportSlugFilterClause('unknown'))
})

test('mapReportListRow normalizes list summaries', () => {
  const row = mapReportListRow({
    slug: 'the-foreword-03-set-2026',
    title: 'The Foreword · 3 set 2026',
    date: '2026-09-03T00:00:00.000Z',
    updated_at: '2026-09-03T12:00:00.000Z',
    from: 'The Foreword',
    render_mode: 'report',
    headline: ['Linha do tempo', '3 set 2026'],
    intro_first: '**Resumo do dia.**',
    metrics_length: '2',
    sections_length: '4',
  })

  assert.equal(row.id, 'the-foreword-03-set-2026')
  assert.equal(row.renderMode, 'report')
  assert.deepEqual(row.headline, ['Linha do tempo', '3 set 2026'])
  assert.deepEqual(row.intro, ['**Resumo do dia.**'])
  assert.equal(row.metrics_length, 2)
  assert.equal(row.sections_length, 4)
})

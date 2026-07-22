import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractReportDescription, buildReportSocialMeta, stripMarkdown } from './reportSocialMeta.js'
import { escapeHtml, renderSpaShell, defaultOgImageUrl } from './spaShell.js'

describe('extractReportDescription', () => {
  it('prefers headline string', () => {
    assert.equal(extractReportDescription({ headline: 'Manchete' }), 'Manchete')
  })

  it('uses intro when headline missing', () => {
    assert.equal(extractReportDescription({ intro: ['Primeiro parágrafo.'] }), 'Primeiro parágrafo.')
  })

  it('strips markdown from intro', () => {
    assert.equal(
      extractReportDescription({ intro: ['**Destaque** do dia'] }),
      'Destaque do dia',
    )
  })
})

describe('stripMarkdown', () => {
  it('removes bold markers', () => {
    assert.equal(stripMarkdown('**negrito**'), 'negrito')
  })
})

describe('buildReportSocialMeta', () => {
  it('falls back title to Relatórios', () => {
    const meta = buildReportSocialMeta({
      title: '',
      content: {},
      canonicalUrl: 'https://dia.example/report/x',
      imageUrl: 'https://dia.example/favicon.ico',
    })
    assert.equal(meta.title, 'Relatórios')
  })
})

describe('renderSpaShell', () => {
  it('escapes HTML in meta tags', () => {
    const html = renderSpaShell({
      title: 'A & B',
      description: 'Desc <script>',
      canonicalUrl: 'https://dia.example/report/x',
      imageUrl: defaultOgImageUrl('https://dia.example'),
    })
    assert.match(html, /og:title" content="A &amp; B"/)
    assert.doesNotMatch(html, /<script>/)
  })

  it('escapeHtml handles quotes', () => {
    assert.equal(escapeHtml('"x"'), '&quot;x&quot;')
  })
})

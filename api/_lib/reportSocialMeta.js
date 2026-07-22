/** Texto plano para meta description / og:description (máx. ~300 chars). */
export function extractReportDescription(content) {
  if (!content || typeof content !== 'object') return ''

  const headline = content.headline
  if (typeof headline === 'string' && headline.trim()) return truncate(headline.trim())
  if (headline && typeof headline === 'object') {
    const text = headline.text ?? headline.title ?? headline.label
    if (typeof text === 'string' && text.trim()) return truncate(text.trim())
  }

  const intro = content.intro
  if (Array.isArray(intro) && intro[0]) {
    const line = String(intro[0]).trim()
    if (line) return truncate(line)
  }

  if (typeof content.summary === 'string' && content.summary.trim()) {
    return truncate(content.summary.trim())
  }

  return ''
}

export function buildReportSocialMeta({ title, content, canonicalUrl, imageUrl }) {
  const pageTitle = String(title ?? '').trim() || 'Relatórios'
  const description = extractReportDescription(content) || pageTitle

  return {
    title: pageTitle,
    description,
    canonicalUrl,
    imageUrl,
  }
}

function truncate(text, max = 300) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

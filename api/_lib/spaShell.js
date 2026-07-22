import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cachedTemplate = null

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

function loadIndexTemplate() {
  if (cachedTemplate) return cachedTemplate
  const root = path.join(__dirname, '..', '..')
  const distIndex = path.join(root, 'dist', 'index.html')
  const devIndex = path.join(root, 'index.html')

  if (isProductionRuntime()) {
    if (!fs.existsSync(distIndex)) {
      throw new Error('dist/index.html is required in production for api/document')
    }
    cachedTemplate = fs.readFileSync(distIndex, 'utf8')
    return cachedTemplate
  }

  const file = fs.existsSync(distIndex) ? distIndex : devIndex
  cachedTemplate = fs.readFileSync(file, 'utf8')
  return cachedTemplate
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderSpaShell({ title, description, canonicalUrl, imageUrl, robots }) {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeCanonical = escapeHtml(canonicalUrl)
  const safeImage = escapeHtml(imageUrl)
  const robotsTag = robots ? `<meta name="robots" content="${escapeHtml(robots)}" />` : ''

  const metaBlock = [
    robotsTag,
    `<meta name="description" content="${safeDescription}" />`,
    `<link rel="canonical" href="${safeCanonical}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:url" content="${safeCanonical}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
  ]
    .filter(Boolean)
    .join('\n    ')

  let html = loadIndexTemplate()
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
  html = html.replace('</head>', `    ${metaBlock}\n  </head>`)
  return html
}

export function renderFallbackShell(origin, { imageUrl } = {}) {
  return renderSpaShell({
    title: 'Relatórios',
    description: 'Relatórios',
    canonicalUrl: origin,
    imageUrl: imageUrl ?? defaultOgImageUrl(origin),
    robots: 'noindex, nofollow',
  })
}

export function defaultOgImageUrl(origin) {
  return `${origin}/og-default.svg`
}

export function requestOrigin(req) {
  const fromEnv = process.env.PUBLIC_ORIGIN?.replace(/\/+$/, '')
  if (fromEnv) return fromEnv
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export const CACHE = {
  PUBLIC_SHORT: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  PRIVATE: 'private, no-store',
}

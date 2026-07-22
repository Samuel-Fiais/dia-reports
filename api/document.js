import { getPool } from './_lib/db.js'
import { handleOptions } from './_lib/http.js'
import { getSessionUser, canReadReport, normalizeReportVisibility, REPORT_VISIBILITY } from './_lib/auth.js'
import { buildReportSocialMeta } from './_lib/reportSocialMeta.js'
import {
  CACHE,
  defaultOgImageUrl,
  renderFallbackShell,
  renderSpaShell,
  requestOrigin,
} from './_lib/spaShell.js'

export const config = {
  runtime: 'nodejs',
}

function sendHtml(res, status, html, cacheControl) {
  res.status(status)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl)
  res.end(html)
}

function parseQuery(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  return {
    kind: url.searchParams.get('kind'),
    slug: url.searchParams.get('slug'),
    token: url.searchParams.get('token'),
  }
}

function cacheForPublicReport({ visibility, user }) {
  const isPublic = normalizeReportVisibility(visibility) === REPORT_VISIBILITY.PUBLIC
  if (isPublic && !user) return CACHE.PUBLIC_SHORT
  return CACHE.PRIVATE
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed')
    return
  }

  const origin = requestOrigin(req)
  const ogImage = defaultOgImageUrl(origin)
  const { kind, slug, token } = parseQuery(req)

  try {
    const db = getPool()

    if (kind === 'report' && slug) {
      const user = await getSessionUser(req)
      const { rows } = await db.query(
        `SELECT r.slug, r.title, r.content, COALESCE(r.visibility, 'private') AS visibility,
          COALESCE(
            (SELECT array_agg(rgm.group_id) FROM dia_reports.report_group_members rgm WHERE rgm.report_slug = r.slug),
            ARRAY[]::uuid[]
          ) AS group_ids
         FROM reports r WHERE r.slug = $1`,
        [slug],
      )
      const report = rows[0]
      const allowed =
        report &&
        canReadReport({
          user,
          visibility: report.visibility,
          groupIds: report.group_ids,
          isAdmin: false,
        })

      if (!allowed) {
        sendHtml(res, 404, renderFallbackShell(origin, { imageUrl: ogImage }), CACHE.PRIVATE)
        return
      }

      const canonicalUrl = `${origin}/report/${encodeURIComponent(slug)}`
      const meta = buildReportSocialMeta({
        title: report.title,
        content: report.content,
        canonicalUrl,
        imageUrl: ogImage,
      })
      const cacheControl = cacheForPublicReport({ visibility: report.visibility, user })
      sendHtml(res, 200, renderSpaShell(meta), cacheControl)
      return
    }

    if (kind === 'shared' && token) {
      const { rows } = await db.query(
        `SELECT r.slug, r.title, r.content
         FROM share_tokens st
         JOIN reports r ON r.slug = st.report_slug
         WHERE st.token = $1`,
        [token],
      )

      if (rows.length === 0) {
        sendHtml(res, 404, renderFallbackShell(origin, { imageUrl: ogImage }), CACHE.PRIVATE)
        return
      }

      const report = rows[0]
      const canonicalUrl = `${origin}/shared/${encodeURIComponent(token)}`
      const meta = buildReportSocialMeta({
        title: report.title,
        content: report.content,
        canonicalUrl,
        imageUrl: ogImage,
      })
      sendHtml(
        res,
        200,
        renderSpaShell({ ...meta, robots: 'noindex, nofollow' }),
        CACHE.PRIVATE,
      )
      return
    }

    sendHtml(res, 404, renderFallbackShell(origin, { imageUrl: ogImage }), CACHE.PRIVATE)
  } catch (error) {
    console.error('document handler', error)
    sendHtml(res, 500, renderFallbackShell(origin, { imageUrl: ogImage }), CACHE.PRIVATE)
  }
}

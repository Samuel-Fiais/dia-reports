import { getPool } from './_lib/db.js'
import { handleOptions } from './_lib/http.js'
import { getSessionUser, canReadReport } from './_lib/auth.js'
import { buildReportSocialMeta } from './_lib/reportSocialMeta.js'
import { renderFallbackShell, renderSpaShell, requestOrigin } from './_lib/spaShell.js'

export const config = {
  runtime: 'nodejs',
}

function sendHtml(res, status, html) {
  res.status(status)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
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

function defaultOgImage(origin) {
  return `${origin}/favicon.ico`
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed')
    return
  }

  const origin = requestOrigin(req)
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
        sendHtml(res, 404, renderFallbackShell(origin))
        return
      }

      const canonicalUrl = `${origin}/report/${encodeURIComponent(slug)}`
      const meta = buildReportSocialMeta({
        title: report.title,
        content: report.content,
        canonicalUrl,
        imageUrl: defaultOgImage(origin),
      })
      sendHtml(res, 200, renderSpaShell(meta))
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
        sendHtml(res, 404, renderFallbackShell(origin))
        return
      }

      const report = rows[0]
      const canonicalUrl = `${origin}/shared/${encodeURIComponent(token)}`
      const meta = buildReportSocialMeta({
        title: report.title,
        content: report.content,
        canonicalUrl,
        imageUrl: defaultOgImage(origin),
      })
      sendHtml(res, 200, renderSpaShell(meta))
      return
    }

    sendHtml(res, 404, renderFallbackShell(origin))
  } catch (error) {
    console.error('document handler', error)
    sendHtml(res, 500, renderFallbackShell(origin))
  }
}

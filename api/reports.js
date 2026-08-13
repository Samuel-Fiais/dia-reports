import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, normalizeDate } from './_lib/http.js'
import {
  getSessionUser,
  requirePermission,
  canReadReport,
  normalizeReportVisibility,
} from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

function parseRoute(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const slugMatch = path.match(/^\/api\/reports(?:\/([^/]+))?$/)
  const shareMatch = path.match(/^\/api\/reports\/([^/]+)\/share$/)
  return {
    slug: slugMatch?.[1] ? decodeURIComponent(slugMatch[1]) : null,
    share: shareMatch?.[1] ? decodeURIComponent(shareMatch[1]) : null,
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const db = getPool()
    const { slug, share } = parseRoute(req)

    const user = await getSessionUser(req)
    const isPublicSlugGet = req.method === 'GET' && Boolean(slug)
    if (!user && !isPublicSlugGet) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }

    if (req.method === 'GET' && !slug) {
      // Lista de dashboard: filtra por visibilidade e grupos.
      const { rows } = await db.query(`
        SELECT
          r.slug,
          r.title,
          r.date,
          r.updated_at,
          COALESCE(r.visibility, 'private') AS visibility,
          r.content ->> 'from' AS from,
          COALESCE(NULLIF(r.content ->> 'renderMode', ''), 'report') AS render_mode,
          r.content -> 'headline' AS headline,
          r.content -> 'intro' ->> 0 AS intro_first,
          COALESCE(jsonb_array_length(r.content -> 'metrics'), 0) AS metrics_length,
          (
            SELECT count(*)
            FROM jsonb_array_elements(COALESCE(r.content -> 'body', '[]'::jsonb)) AS block
            WHERE block ->> 'type' = 'section'
          ) AS sections_length,
          COALESCE(
            (SELECT array_agg(rgm.group_id) FROM dia_reports.report_group_members rgm WHERE rgm.report_slug = r.slug),
            ARRAY[]::uuid[]
          ) AS group_ids
        FROM reports r
        WHERE r.slug NOT LIKE 'the-foreword-%'
        ORDER BY r.updated_at DESC
      `)

      const visible = rows.filter((row) =>
        canReadReport({
          user,
          visibility: row.visibility,
          groupIds: row.group_ids,
          isAdmin: false,
        }),
      )

      sendJson(
        res,
        200,
        visible.map((row) => ({
          id: row.slug,
          slug: row.slug,
          title: row.title,
          date: normalizeDate(row.date),
          updatedAt: normalizeDate(row.updated_at),
          from: row.from,
          renderMode: row.render_mode,
          headline: row.headline,
          intro: row.intro_first ? [row.intro_first] : [],
          metrics_length: Number(row.metrics_length) || 0,
          sections_length: Number(row.sections_length) || 0,
        })),
      )
      return
    }

    if (req.method === 'GET' && slug) {
      const { rows } = await db.query(
        `
        SELECT
          r.slug, r.title, r.date, r.updated_at, r.content, COALESCE(r.visibility, 'private') AS visibility,
          COALESCE(
            (SELECT array_agg(rgm.group_id) FROM dia_reports.report_group_members rgm WHERE rgm.report_slug = r.slug),
            ARRAY[]::uuid[]
          ) AS group_ids
        FROM reports r
        WHERE r.slug = $1
        `,
        [slug],
      )

      const report = rows[0]

      // 404 (não 403) para inexistente ou sem permissão.
      if (
        !report ||
        !canReadReport({
          user,
          visibility: report.visibility,
          groupIds: report.group_ids,
          isAdmin: false,
        })
      ) {
        sendJson(res, 404, { error: 'Report not found' })
        return
      }

      sendJson(res, 200, {
        slug: report.slug,
        title: report.title,
        date: normalizeDate(report.date),
        updatedAt: normalizeDate(report.updated_at),
        visibility: normalizeReportVisibility(report.visibility),
        content: report.content,
        groupIds: report.group_ids ?? [],
      })
      return
    }

    // POST /api/reports/:slug/share -> gera token de compartilhamento
    if (req.method === 'POST' && share) {
      if (!requirePermission(user, 'reports.manage')) {
        sendJson(res, 403, { error: 'Sem permissão' })
        return
      }
      const { rows } = await db.query(
        'INSERT INTO share_tokens (report_slug) VALUES ($1) RETURNING token',
        [share],
      )
      sendJson(res, 201, { token: rows[0].token })
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

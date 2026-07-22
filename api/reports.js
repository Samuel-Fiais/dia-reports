import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, normalizeDate, readJsonBody } from './_lib/http.js'
import { getSessionUser, requirePermission, canReadReport, normalizeReportVisibility } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function parseRoute(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const slugMatch = path.match(/^\/api\/reports(?:\/([^/]+))?$/)
  const shareMatch = path.match(/^\/api\/reports\/([^/]+)\/share$/)
  return {
    slug: slugMatch?.[1] ? decodeURIComponent(slugMatch[1]) : null,
    share: shareMatch?.[1] ? decodeURIComponent(shareMatch[1]) : null,
    admin: url.searchParams.get('admin') === '1',
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const db = getPool()
    const { slug, admin, share } = parseRoute(req)

    const user = await getSessionUser(req)
    const isPublicSlugGet = req.method === 'GET' && Boolean(slug)
    if (!user && !isPublicSlugGet) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }

    const isAdminRequest = admin && user && requirePermission(user, 'reports.manage')

    if (req.method === 'GET' && !slug) {
      // Lista: modo admin (reports.manage + ?admin=1) devolve tudo, sem filtro de
      // grupo, com groupIds pra tela de edição pré-marcar os checkboxes. Modo
      // normal filtra por visibilidade (regra em api/_lib/auth.js).
      const { rows } = await db.query(`
        SELECT
          r.slug,
          r.title,
          r.date,
          r.updated_at,
          COALESCE(r.visibility, 'private') AS visibility,
          r.content ->> 'from' AS from,
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
        ORDER BY r.updated_at DESC
      `)

      const visible = isAdminRequest
        ? rows
        : rows.filter((row) =>
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
          headline: row.headline,
          intro: row.intro_first ? [row.intro_first] : [],
          metrics_length: Number(row.metrics_length) || 0,
          sections_length: Number(row.sections_length) || 0,
          ...(isAdminRequest ? { groupIds: row.group_ids ?? [] } : {}),
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
          isAdmin: isAdminRequest,
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

    // Escrita: sempre exige reports.manage.
    if (!requirePermission(user, 'reports.manage')) {
      sendJson(res, 403, { error: 'Sem permissão' })
      return
    }

    // POST /api/reports/:slug/share -> gera token de compartilhamento
    if (req.method === 'POST' && share) {
      const { rows } = await db.query(
        'INSERT INTO share_tokens (report_slug) VALUES ($1) RETURNING token',
        [share],
      )
      sendJson(res, 201, { token: rows[0].token })
      return
    }

    if (req.method === 'POST' && !slug) {
      const body = await readJsonBody(req)
      const newSlug = String(body.slug ?? body.content?.id ?? '').trim()
      const title = String(body.title ?? '').trim()
      const content = body.content

      if (!SLUG_PATTERN.test(newSlug)) {
        sendJson(res, 400, { error: 'Slug inválido — use letras minúsculas, números e hífen' })
        return
      }
      if (!title) {
        sendJson(res, 400, { error: 'Título é obrigatório' })
        return
      }
      if (!content || typeof content !== 'object') {
        sendJson(res, 400, { error: 'Conteúdo (JSON) é obrigatório' })
        return
      }
      const date = body.date || content.date || new Date().toISOString()
      const visibility = normalizeReportVisibility(body.visibility)

      try {
        const { rows } = await db.query(
          'INSERT INTO reports (slug, title, date, content, visibility) VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING slug, title, date, updated_at, visibility',
          [newSlug, title, date, JSON.stringify(content), visibility],
        )
        sendJson(res, 201, {
          slug: rows[0].slug,
          title: rows[0].title,
          date: normalizeDate(rows[0].date),
          updatedAt: normalizeDate(rows[0].updated_at),
          visibility: normalizeReportVisibility(rows[0].visibility),
        })
      } catch (err) {
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um relatório com esse slug' })
          return
        }
        throw err
      }
      return
    }

    if (req.method === 'PUT' && slug) {
      const body = await readJsonBody(req)
      const title = String(body.title ?? '').trim()
      const content = body.content

      if (!title) {
        sendJson(res, 400, { error: 'Título é obrigatório' })
        return
      }
      if (!content || typeof content !== 'object') {
        sendJson(res, 400, { error: 'Conteúdo (JSON) é obrigatório' })
        return
      }
      const date = body.date || content.date || new Date().toISOString()
      const visibility =
        body.visibility === undefined ? null : normalizeReportVisibility(body.visibility)

      const { rows } = await db.query(
        visibility === null
          ? 'UPDATE reports SET title = $1, date = $2, content = $3::jsonb WHERE slug = $4 RETURNING slug, title, date, updated_at, visibility'
          : 'UPDATE reports SET title = $1, date = $2, content = $3::jsonb, visibility = $5 WHERE slug = $4 RETURNING slug, title, date, updated_at, visibility',
        visibility === null
          ? [title, date, JSON.stringify(content), slug]
          : [title, date, JSON.stringify(content), slug, visibility],
      )
      if (rows.length === 0) {
        sendJson(res, 404, { error: 'Relatório não encontrado' })
        return
      }
      sendJson(res, 200, {
        slug: rows[0].slug,
        title: rows[0].title,
        date: normalizeDate(rows[0].date),
        updatedAt: normalizeDate(rows[0].updated_at),
        visibility: normalizeReportVisibility(rows[0].visibility),
      })
      return
    }

    if (req.method === 'DELETE' && slug) {
      const { rowCount } = await db.query('DELETE FROM reports WHERE slug = $1', [slug])
      if (rowCount === 0) {
        sendJson(res, 404, { error: 'Relatório não encontrado' })
        return
      }
      res.status(204).end()
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

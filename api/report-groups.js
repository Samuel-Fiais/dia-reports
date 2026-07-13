import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, readJsonBody } from './_lib/http.js'
import { getSessionUser, requirePermission } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

function parsePath(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const byReport = path.match(/^\/api\/report-groups\/by-report\/([^/]+)$/)
  if (byReport) return { kind: 'by-report', slug: decodeURIComponent(byReport[1]) }
  const byId = path.match(/^\/api\/report-groups\/([^/]+)$/)
  if (byId) return { kind: 'by-id', id: decodeURIComponent(byId[1]) }
  return { kind: 'collection' }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const user = await getSessionUser(req)
    if (!user) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }

    const db = getPool()
    const route = parsePath(req)

    if (route.kind === 'by-report') {
      if (req.method === 'GET') {
        const { rows } = await db.query(
          'SELECT group_id FROM dia_reports.report_group_members WHERE report_slug = $1',
          [route.slug],
        )
        sendJson(res, 200, rows.map((r) => r.group_id))
        return
      }

      if (req.method === 'PUT') {
        if (!requirePermission(user, 'reports.manage')) {
          sendJson(res, 403, { error: 'Sem permissão' })
          return
        }
        const body = await readJsonBody(req)
        const groupIds = Array.isArray(body.groupIds) ? body.groupIds : []

        const client = await db.connect()
        try {
          await client.query('BEGIN')
          await client.query('DELETE FROM dia_reports.report_group_members WHERE report_slug = $1', [route.slug])
          for (const groupId of groupIds) {
            await client.query(
              'INSERT INTO dia_reports.report_group_members (report_slug, group_id) VALUES ($1, $2)',
              [route.slug, groupId],
            )
          }
          await client.query('COMMIT')
        } catch (err) {
          await client.query('ROLLBACK')
          throw err
        } finally {
          client.release()
        }

        sendJson(res, 200, { groupIds })
        return
      }

      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    // Leitura (lista/detalhe) exige só sessão válida; escrita exige permissão.
    if (req.method === 'GET' && route.kind === 'collection') {
      const { rows } = await db.query(`
        SELECT
          g.id, g.name, g.description,
          COALESCE((SELECT count(*) FROM dia_reports.report_group_members m WHERE m.group_id = g.id), 0) AS report_count
        FROM dia_reports.report_groups g
        ORDER BY g.name
      `)
      sendJson(
        res,
        200,
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          reportCount: Number(r.report_count) || 0,
        })),
      )
      return
    }

    if (!requirePermission(user, 'report_groups.manage')) {
      sendJson(res, 403, { error: 'Sem permissão' })
      return
    }

    if (req.method === 'POST' && route.kind === 'collection') {
      const body = await readJsonBody(req)
      const name = String(body.name ?? '').trim()
      if (!name) {
        sendJson(res, 400, { error: 'Nome é obrigatório' })
        return
      }
      try {
        const { rows } = await db.query(
          'INSERT INTO dia_reports.report_groups (name, description) VALUES ($1, $2) RETURNING id, name, description',
          [name, body.description ?? null],
        )
        sendJson(res, 201, { ...rows[0], reportCount: 0 })
      } catch (err) {
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um grupo com esse nome' })
          return
        }
        throw err
      }
      return
    }

    if (req.method === 'PUT' && route.kind === 'by-id') {
      const body = await readJsonBody(req)
      const name = String(body.name ?? '').trim()
      if (!name) {
        sendJson(res, 400, { error: 'Nome é obrigatório' })
        return
      }
      try {
        const { rows } = await db.query(
          'UPDATE dia_reports.report_groups SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description',
          [name, body.description ?? null, route.id],
        )
        if (rows.length === 0) {
          sendJson(res, 404, { error: 'Grupo não encontrado' })
          return
        }
        sendJson(res, 200, rows[0])
      } catch (err) {
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um grupo com esse nome' })
          return
        }
        throw err
      }
      return
    }

    if (req.method === 'DELETE' && route.kind === 'by-id') {
      await db.query('DELETE FROM dia_reports.report_groups WHERE id = $1', [route.id])
      res.status(204).end()
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, readJsonBody } from './_lib/http.js'
import { getSessionUser, requirePermission } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

// Chaves de módulo reconhecidas (ver plans/00-overview.md). Qualquer outra chave
// enviada pelo client é ignorada — nunca gravamos permissão arbitrária no banco.
const KNOWN_MODULES = ['report_groups.manage', 'profiles.manage', 'users.manage', 'reports.manage']

function sanitizePermissions(input) {
  if (input && input['*'] === true) return { '*': true }
  const out = {}
  for (const key of KNOWN_MODULES) {
    if (input?.[key] === true) out[key] = true
  }
  return out
}

function parseRoute(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const usersMatch = path.match(/^\/api\/profiles\/([^/]+)\/users$/)
  if (usersMatch) return { kind: 'users', id: decodeURIComponent(usersMatch[1]) }
  const idMatch = path.match(/^\/api\/profiles(?:\/([^/]+))?$/)
  return { kind: 'profile', id: idMatch?.[1] ? decodeURIComponent(idMatch[1]) : null }
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
    const route = parseRoute(req)
    const id = route.id

    if (route.kind === 'users') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' })
        return
      }
      if (!requirePermission(user, 'profiles.manage')) {
        sendJson(res, 403, { error: 'Sem permissão' })
        return
      }
      const { rows } = await db.query(
        'SELECT id, email, active FROM dia_reports.users WHERE profile_id = $1 ORDER BY email',
        [id],
      )
      sendJson(res, 200, rows)
      return
    }

    if (req.method === 'GET' && !id) {
      const { rows } = await db.query(`
        SELECT
          p.id, p.name, p.permissions,
          COALESCE((SELECT array_agg(prg.group_id) FROM dia_reports.profile_report_groups prg WHERE prg.profile_id = p.id), ARRAY[]::uuid[]) AS group_ids,
          COALESCE((SELECT count(*) FROM dia_reports.users u WHERE u.profile_id = p.id), 0) AS user_count
        FROM dia_reports.profiles p
        ORDER BY p.name
      `)
      sendJson(
        res,
        200,
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          permissions: r.permissions ?? {},
          groupIds: r.group_ids ?? [],
          userCount: Number(r.user_count) || 0,
        })),
      )
      return
    }

    // Leitura exige só sessão (necessário pro select de perfil no CRUD de usuários);
    // escrita exige profiles.manage.
    if (!requirePermission(user, 'profiles.manage')) {
      sendJson(res, 403, { error: 'Sem permissão' })
      return
    }

    if (req.method === 'POST' && !id) {
      const body = await readJsonBody(req)
      const name = String(body.name ?? '').trim()
      if (!name) {
        sendJson(res, 400, { error: 'Nome é obrigatório' })
        return
      }
      const permissions = sanitizePermissions(body.permissions)
      const groupIds = Array.isArray(body.groupIds) ? body.groupIds : []

      const client = await db.connect()
      try {
        await client.query('BEGIN')
        const { rows } = await client.query(
          'INSERT INTO dia_reports.profiles (name, permissions) VALUES ($1, $2::jsonb) RETURNING id, name, permissions',
          [name, JSON.stringify(permissions)],
        )
        const profile = rows[0]
        for (const groupId of groupIds) {
          await client.query(
            'INSERT INTO dia_reports.profile_report_groups (profile_id, group_id) VALUES ($1, $2)',
            [profile.id, groupId],
          )
        }
        await client.query('COMMIT')
        sendJson(res, 201, { ...profile, groupIds, userCount: 0 })
      } catch (err) {
        await client.query('ROLLBACK')
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um perfil com esse nome' })
          return
        }
        throw err
      } finally {
        client.release()
      }
      return
    }

    if (req.method === 'PUT' && id) {
      const body = await readJsonBody(req)
      const name = String(body.name ?? '').trim()
      if (!name) {
        sendJson(res, 400, { error: 'Nome é obrigatório' })
        return
      }
      const permissions = sanitizePermissions(body.permissions)
      const groupIds = Array.isArray(body.groupIds) ? body.groupIds : []

      const client = await db.connect()
      try {
        await client.query('BEGIN')
        const { rows } = await client.query(
          'UPDATE dia_reports.profiles SET name = $1, permissions = $2::jsonb WHERE id = $3 RETURNING id, name, permissions',
          [name, JSON.stringify(permissions), id],
        )
        if (rows.length === 0) {
          await client.query('ROLLBACK')
          sendJson(res, 404, { error: 'Perfil não encontrado' })
          return
        }
        await client.query('DELETE FROM dia_reports.profile_report_groups WHERE profile_id = $1', [id])
        for (const groupId of groupIds) {
          await client.query(
            'INSERT INTO dia_reports.profile_report_groups (profile_id, group_id) VALUES ($1, $2)',
            [id, groupId],
          )
        }
        await client.query('COMMIT')
        sendJson(res, 200, { ...rows[0], groupIds })
      } catch (err) {
        await client.query('ROLLBACK')
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um perfil com esse nome' })
          return
        }
        throw err
      } finally {
        client.release()
      }
      return
    }

    if (req.method === 'DELETE' && id) {
      // ON DELETE SET NULL em users.profile_id — usuários daquele perfil ficam
      // sem perfil, não são apagados.
      await db.query('DELETE FROM dia_reports.profiles WHERE id = $1', [id])
      res.status(204).end()
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

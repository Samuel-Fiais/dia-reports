import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, readJsonBody } from './_lib/http.js'
import { getSessionUser, requirePermission, hashPassword } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

function parseId(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const match = path.match(/^\/api\/users(?:\/([^/]+))?$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const user = await getSessionUser(req)
    if (!user) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }
    if (!requirePermission(user, 'users.manage')) {
      sendJson(res, 403, { error: 'Sem permissão' })
      return
    }

    const db = getPool()
    const id = parseId(req)

    if (req.method === 'GET' && !id) {
      const { rows } = await db.query(`
        SELECT u.id, u.email, u.active, u.created_at, p.id AS profile_id, p.name AS profile_name
        FROM dia_reports.users u
        LEFT JOIN dia_reports.profiles p ON p.id = u.profile_id
        ORDER BY u.email
      `)
      sendJson(
        res,
        200,
        rows.map((r) => ({
          id: r.id,
          email: r.email,
          active: r.active,
          createdAt: r.created_at,
          profileId: r.profile_id,
          profileName: r.profile_name,
        })),
      )
      return
    }

    if (req.method === 'POST' && !id) {
      const body = await readJsonBody(req)
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const profileId = body.profileId || null
      const active = body.active !== false

      if (!email) {
        sendJson(res, 400, { error: 'E-mail é obrigatório' })
        return
      }
      if (password.length < 8) {
        sendJson(res, 400, { error: 'Senha precisa ter pelo menos 8 caracteres' })
        return
      }

      try {
        const passwordHash = await hashPassword(password)
        const { rows } = await db.query(
          `INSERT INTO dia_reports.users (email, password_hash, profile_id, active)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, active, created_at, profile_id`,
          [email, passwordHash, profileId, active],
        )
        sendJson(res, 201, {
          id: rows[0].id,
          email: rows[0].email,
          active: rows[0].active,
          createdAt: rows[0].created_at,
          profileId: rows[0].profile_id,
        })
      } catch (err) {
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um usuário com esse e-mail' })
          return
        }
        throw err
      }
      return
    }

    if (req.method === 'PUT' && id) {
      const body = await readJsonBody(req)
      const email = String(body.email ?? '').trim().toLowerCase()
      const profileId = body.profileId || null
      const active = body.active !== false
      const password = body.password ? String(body.password) : null

      if (!email) {
        sendJson(res, 400, { error: 'E-mail é obrigatório' })
        return
      }
      if (password && password.length < 8) {
        sendJson(res, 400, { error: 'Senha precisa ter pelo menos 8 caracteres' })
        return
      }

      try {
        const { rows } = password
          ? await db.query(
              `UPDATE dia_reports.users SET email = $1, profile_id = $2, active = $3, password_hash = $4
               WHERE id = $5 RETURNING id, email, active, created_at, profile_id`,
              [email, profileId, active, await hashPassword(password), id],
            )
          : await db.query(
              `UPDATE dia_reports.users SET email = $1, profile_id = $2, active = $3
               WHERE id = $4 RETURNING id, email, active, created_at, profile_id`,
              [email, profileId, active, id],
            )
        if (rows.length === 0) {
          sendJson(res, 404, { error: 'Usuário não encontrado' })
          return
        }
        sendJson(res, 200, {
          id: rows[0].id,
          email: rows[0].email,
          active: rows[0].active,
          createdAt: rows[0].created_at,
          profileId: rows[0].profile_id,
        })
      } catch (err) {
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um usuário com esse e-mail' })
          return
        }
        throw err
      }
      return
    }

    if (req.method === 'DELETE' && id) {
      if (id === user.id) {
        sendJson(res, 400, { error: 'Você não pode excluir sua própria conta' })
        return
      }
      await db.query('DELETE FROM dia_reports.users WHERE id = $1', [id])
      res.status(204).end()
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

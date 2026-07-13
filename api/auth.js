import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, readJsonBody } from './_lib/http.js'
import { getSessionUser, getUserById, verifyPassword, createSessionCookie, clearSessionCookie } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    if (req.method === 'GET') {
      const user = await getSessionUser(req)
      if (!user) {
        sendJson(res, 401, { error: 'Not authenticated' })
        return
      }
      sendJson(res, 200, user)
      return
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req)
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      if (!email || !password) {
        sendJson(res, 400, { error: 'E-mail e senha são obrigatórios' })
        return
      }

      const db = getPool()
      const { rows } = await db.query(
        'SELECT id, password_hash, active FROM dia_reports.users WHERE email = $1',
        [email],
      )
      const row = rows[0]

      // Mesma mensagem genérica para usuário inexistente, senha errada ou inativo —
      // não vazar qual dessas situações ocorreu.
      if (!row || !row.active || !(await verifyPassword(password, row.password_hash))) {
        sendJson(res, 401, { error: 'E-mail ou senha inválidos' })
        return
      }

      res.setHeader('Set-Cookie', createSessionCookie(row.id))
      const user = await getUserById(row.id)
      sendJson(res, 200, user)
      return
    }

    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', clearSessionCookie())
      res.status(204).end()
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

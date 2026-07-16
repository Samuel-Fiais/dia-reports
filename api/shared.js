import { getPool } from './_lib/db.js'
import { sendJson, handleOptions } from './_lib/http.js'
import { getSessionUser, requirePermission } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

function parseRoute(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const match = path.match(/^\/api\/shared(?:\/([^/]+))?$/)
  return { token: match?.[1] ? decodeURIComponent(match[1]) : null }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const db = getPool()
    const { token } = parseRoute(req)

    // POST /api/reports/:slug/share -> gera token (precisa de auth)
    // Esta rota lida com GET /api/shared/:token (acesso publico)
    // Tokens sao gerados via POST em reports.js (/api/reports/:slug/share)

    if (req.method === 'GET' && token) {
      // Busca o token e retorna o relatorio
      const { rows } = await db.query(
        `SELECT r.slug, r.title, r.date, r.updated_at, r.content
         FROM share_tokens st
         JOIN reports r ON r.slug = st.report_slug
         WHERE st.token = $1`,
        [token],
      )

      if (rows.length === 0) {
        sendJson(res, 404, { error: 'Link nao encontrado ou expirado' })
        return
      }

      const report = rows[0]
      sendJson(res, 200, {
        slug: report.slug,
        title: report.title,
        date: report.date?.toISOString?.() ?? report.date,
        updatedAt: report.updated_at?.toISOString?.() ?? report.updated_at,
        content: report.content,
      })
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

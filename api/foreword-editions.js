import { getPool } from './_lib/db.js'
import { sendJson, handleOptions } from './_lib/http.js'
import { getSessionUser } from './_lib/auth.js'
import { fetchVisibleReportList } from './_lib/reportList.js'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const user = await getSessionUser(req)
    if (!user) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }

    const editions = await fetchVisibleReportList(getPool(), {
      user,
      slugFilterMode: 'foreword-only',
    })

    sendJson(res, 200, editions)
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

import { getPool } from './_lib/db.js'
import { canReadReport, getSessionUser } from './_lib/auth.js'
import { handleOptions, sendJson } from './_lib/http.js'
import { fetchOpenApiSource } from './_lib/openapiSource.js'

export const config = {
  runtime: 'nodejs',
}

const PUBLIC_SYSTEM_REFERENCES = Object.freeze({
  'school360-api': 'https://api-dev.school360.festpay.com.br/swagger/v1/swagger.json',
})

async function resolveAuthorizedSource(
  req,
  requestedUrl,
  publicationId,
  shareToken,
  systemReference,
) {
  if (
    systemReference
    && PUBLIC_SYSTEM_REFERENCES[systemReference] === requestedUrl
  ) {
    return requestedUrl
  }

  const db = getPool()
  if (shareToken) {
    const { rows } = await db.query(
      `
      SELECT r.slug, r.content -> 'source' ->> 'url' AS source_url
      FROM share_tokens st
      JOIN reports r ON r.slug = st.report_slug
      WHERE st.token = $1 AND r.slug = $2
      `,
      [shareToken, publicationId],
    )
    const report = rows[0]
    if (!report || report.source_url !== requestedUrl) {
      throw Object.assign(new Error('Fonte OpenAPI não autorizada'), { statusCode: 404 })
    }
    return report.source_url
  }

  const user = await getSessionUser(req)
  if (publicationId) {
    const { rows } = await db.query(
      `
      SELECT
        r.slug,
        COALESCE(r.visibility, 'private') AS visibility,
        r.content -> 'source' ->> 'url' AS source_url,
        COALESCE(
          (
            SELECT array_agg(rgm.group_id)
            FROM dia_reports.report_group_members rgm
            WHERE rgm.report_slug = r.slug
          ),
          ARRAY[]::uuid[]
        ) AS group_ids
      FROM reports r
      WHERE r.slug = $1
      `,
      [publicationId],
    )
    const report = rows[0]
    if (
      !report
      || report.source_url !== requestedUrl
      || !canReadReport({
        user,
        visibility: report.visibility,
        groupIds: report.group_ids,
        isAdmin: false,
      })
    ) {
      throw Object.assign(new Error('Fonte OpenAPI não autorizada'), { statusCode: 404 })
    }
    return report.source_url
  }

  if (!user) {
    throw Object.assign(new Error('Not authenticated'), { statusCode: 401 })
  }
  return requestedUrl
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    const requestedUrl = requestUrl.searchParams.get('url')
    const publicationId = requestUrl.searchParams.get('publication')
    const shareToken = requestUrl.searchParams.get('token')
    const systemReference = requestUrl.searchParams.get('system')
    const authorizedUrl = await resolveAuthorizedSource(
      req,
      requestedUrl,
      publicationId,
      shareToken,
      systemReference,
    )
    const document = await fetchOpenApiSource(authorizedUrl)
    res.setHeader('Cache-Control', 'private, no-store')
    sendJson(res, 200, { document })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, {
      error: error.message ?? 'Internal server error',
    })
  }
}

import { Pool } from '@neondatabase/serverless'

export const config = {
  runtime: 'nodejs',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

let pool

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}

function sendJson(res, status, body) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
  res.setHeader('Content-Type', 'application/json')
  res.status(status).json(body)
}

function getSlug(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const match = path.match(/^\/api\/reports(?:\/([^/]+))?$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function normalizeDate(value) {
  if (!value) return value
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const db = getPool()
    const slug = getSlug(req)

    if (!slug) {
      // List all reports
      const { rows } = await db.query(`
        SELECT
          slug,
          title,
          date,
          content ->> 'from' AS from,
          content -> 'headline' AS headline,
          content -> 'intro' ->> 0 AS intro_first,
          COALESCE(jsonb_array_length(content -> 'metrics'), 0) AS metrics_length,
          (
            SELECT count(*)
            FROM jsonb_array_elements(COALESCE(content -> 'body', '[]'::jsonb)) AS block
            WHERE block ->> 'type' = 'section'
          ) AS sections_length
        FROM reports
        ORDER BY date DESC
      `)

      sendJson(
        res,
        200,
        rows.map((row) => ({
          id: row.slug,
          slug: row.slug,
          title: row.title,
          date: normalizeDate(row.date),
          from: row.from,
          headline: row.headline,
          intro: row.intro_first ? [row.intro_first] : [],
          metrics_length: Number(row.metrics_length) || 0,
          sections_length: Number(row.sections_length) || 0,
        })),
      )
      return
    }

    // Single report
    const { rows } = await db.query(
      'SELECT slug, title, date, content FROM reports WHERE slug = $1',
      [slug],
    )

    if (rows.length === 0) {
      sendJson(res, 404, { error: 'Report not found' })
      return
    }

    const report = rows[0]
    sendJson(res, 200, {
      slug: report.slug,
      title: report.title,
      date: normalizeDate(report.date),
      content: report.content,
    })
  } catch (error) {
    sendJson(res, 500, { error: error.message ?? 'Internal server error' })
  }
}
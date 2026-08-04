import { getPool } from './_lib/db.js'
import { handleOptions, normalizeDate, sendJson } from './_lib/http.js'
import { getSessionUser } from './_lib/auth.js'

export const config = { runtime: 'nodejs' }

function normalizeSource(source) {
  return {
    ...source,
    createdAt: normalizeDate(source.createdAt),
  }
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

    const { rows } = await getPool().query(`
      SELECT
        t.slug, t.title, t.summary, t.category, t.status,
        t.started_on, t.ended_on, t.latest_event_on,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'occurredOn', e.occurred_on,
              'eventType', e.event_type,
              'title', e.title,
              'summary', e.summary,
              'sourceReportSlug', e.source_report_slug,
              'sourceUrl', e.source_url,
              'impactScore', e.impact_score,
              'momentum', e.momentum,
              'scope', e.scope,
              'sources', COALESCE((
                SELECT json_agg(json_build_object(
                  'id', s.id,
                  'outlet', s.outlet,
                  'title', s.title,
                  'url', s.url,
                  'sourceKind', s.source_kind,
                  'createdAt', s.created_at
                ) ORDER BY CASE s.source_kind WHEN 'primary' THEN 0 WHEN 'corroboration' THEN 1 ELSE 2 END, s.outlet)
                FROM public.foreword_event_sources s
                WHERE s.event_id = e.id
              ), '[]'::json)
            ) ORDER BY e.occurred_on ASC, e.id ASC
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'::json
        ) AS events
      FROM public.foreword_timelines t
      LEFT JOIN public.foreword_timeline_events e ON e.timeline_slug = t.slug
      GROUP BY t.slug, t.title, t.summary, t.category, t.status,
        t.started_on, t.ended_on, t.latest_event_on
      ORDER BY t.latest_event_on DESC, t.title ASC
    `)

    sendJson(res, 200, rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      category: row.category,
      status: row.status,
      startedOn: normalizeDate(row.started_on),
      endedOn: normalizeDate(row.ended_on),
      latestEventOn: normalizeDate(row.latest_event_on),
      events: row.events.map((event) => ({
        ...event,
        occurredOn: normalizeDate(event.occurredOn),
        sources: (event.sources ?? []).map(normalizeSource),
      })),
    })))
  } catch (error) {
    sendJson(res, 500, { error: error.message ?? 'Internal server error' })
  }
}

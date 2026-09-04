import { normalizeDate } from './http.js'
import { canReadReport } from './auth.js'

const REPORT_LIST_SELECT = `
  SELECT
    r.slug,
    r.title,
    r.date,
    r.updated_at,
    COALESCE(r.visibility, 'private') AS visibility,
    r.content ->> 'from' AS from,
    COALESCE(NULLIF(r.content ->> 'renderMode', ''), 'report') AS render_mode,
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
  WHERE r.slug {SLUG_FILTER}
  ORDER BY r.updated_at DESC
`

export function reportSlugFilterClause(mode) {
  if (mode === 'foreword-only') return "LIKE 'the-foreword-%'"
  if (mode === 'exclude-foreword') return "NOT LIKE 'the-foreword-%'"
  throw new Error(`Unknown report list slug filter mode: ${mode}`)
}

export function mapReportListRow(row) {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    date: normalizeDate(row.date),
    updatedAt: normalizeDate(row.updated_at),
    from: row.from,
    renderMode: row.render_mode,
    headline: row.headline,
    intro: row.intro_first ? [row.intro_first] : [],
    metrics_length: Number(row.metrics_length) || 0,
    sections_length: Number(row.sections_length) || 0,
  }
}

export async function fetchVisibleReportList(db, { user, slugFilterMode }) {
  const sql = REPORT_LIST_SELECT.replace('{SLUG_FILTER}', reportSlugFilterClause(slugFilterMode))
  const { rows } = await db.query(sql)

  return rows
    .filter((row) =>
      canReadReport({
        user,
        visibility: row.visibility,
        groupIds: row.group_ids,
        isAdmin: false,
      }),
    )
    .map(mapReportListRow)
}

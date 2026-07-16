import { getPool } from './_lib/db.js'
import { sendJson, handleOptions, normalizeDate, readJsonBody } from './_lib/http.js'
import { getSessionUser, requirePermission } from './_lib/auth.js'

export const config = {
  runtime: 'nodejs',
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const VALID_LAYOUTS = [
  'title', 'bullets', 'content', 'two-columns',
  'section', 'chart', 'image-full',
  'table', 'quote', 'kpi',
]

function validateSlideDeck(content) {
  if (!content || typeof content !== 'object') {
    return 'Conteúdo (JSON) é obrigatório'
  }
  if (!content.slides || !Array.isArray(content.slides)) {
    return 'content.slides deve ser um array'
  }
  if (content.slides.length === 0) {
    return 'content.slides não pode estar vazio'
  }
  for (let i = 0; i < content.slides.length; i++) {
    const slide = content.slides[i]
    if (!slide.layout || typeof slide.layout !== 'string') {
      return `Slide ${i + 1}: layout é obrigatório`
    }
    if (!VALID_LAYOUTS.includes(slide.layout)) {
      return `Slide ${i + 1}: layout "${slide.layout}" inválido. Válidos: ${VALID_LAYOUTS.join(', ')}`
    }
    if (!slide.content || typeof slide.content !== 'object') {
      return `Slide ${i + 1}: content é obrigatório`
    }
  }
  return null
}

function parseRoute(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')
  const slugMatch = path.match(/^\/api\/slides(?:\/([^/]+))?$/)
  return {
    slug: slugMatch?.[1] ? decodeURIComponent(slugMatch[1]) : null,
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const db = getPool()
    const { slug } = parseRoute(req)
    const user = await getSessionUser(req)

    if (!user) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }

    // GET /api/slides — lista
    if (req.method === 'GET' && !slug) {
      const { rows } = await db.query(`
        SELECT
          slug, title, date, updated_at,
          content ->> 'title' AS deck_title,
          jsonb_array_length(content -> 'slides') AS slides_count
        FROM slide_decks
        ORDER BY updated_at DESC
      `)
      sendJson(res, 200, rows.map((row) => ({
        id: row.slug,
        slug: row.slug,
        title: row.title,
        deckTitle: row.deck_title,
        date: normalizeDate(row.date),
        updatedAt: normalizeDate(row.updated_at),
        slidesCount: Number(row.slides_count) || 0,
      })))
      return
    }

    // GET /api/slides/:slug — deck completo
    if (req.method === 'GET' && slug) {
      const { rows } = await db.query(
        'SELECT slug, title, date, updated_at, content FROM slide_decks WHERE slug = $1',
        [slug],
      )
      if (rows.length === 0) {
        sendJson(res, 404, { error: 'Deck not found' })
        return
      }
      const row = rows[0]
      sendJson(res, 200, {
        slug: row.slug,
        title: row.title,
        date: normalizeDate(row.date),
        updatedAt: normalizeDate(row.updated_at),
        content: row.content,
      })
      return
    }

    // Escrita: exige reports.manage
    if (!requirePermission(user, 'reports.manage')) {
      sendJson(res, 403, { error: 'Sem permissão' })
      return
    }

    // POST /api/slides — criar
    if (req.method === 'POST' && !slug) {
      const body = await readJsonBody(req)
      const newSlug = String(body.slug ?? body.content?.id ?? '').trim()
      const title = String(body.title ?? body.content?.title ?? '').trim()
      const content = body.content

      if (!SLUG_PATTERN.test(newSlug)) {
        sendJson(res, 400, { error: 'Slug inválido — use letras minúsculas, números e hífen' })
        return
      }
      if (!title) {
        sendJson(res, 400, { error: 'Título é obrigatório' })
        return
      }
      if (!content || typeof content !== 'object') {
        sendJson(res, 400, { error: 'Conteúdo (JSON) é obrigatório' })
        return
      }

      const validationError = validateSlideDeck(content)
      if (validationError) {
        sendJson(res, 400, { error: validationError })
        return
      }

      try {
        const { rows } = await db.query(
          'INSERT INTO slide_decks (slug, title, content) VALUES ($1, $2, $3::jsonb) RETURNING slug, title',
          [newSlug, title, JSON.stringify(content)],
        )
        sendJson(res, 201, { slug: rows[0].slug, title: rows[0].title })
      } catch (err) {
        if (err.code === '23505') {
          sendJson(res, 409, { error: 'Já existe um deck com esse slug' })
          return
        }
        throw err
      }
      return
    }

    // PUT /api/slides/:slug — atualizar
    if (req.method === 'PUT' && slug) {
      const body = await readJsonBody(req)
      const title = String(body.title ?? body.content?.title ?? '').trim()
      const content = body.content

      if (!title) {
        sendJson(res, 400, { error: 'Título é obrigatório' })
        return
      }
      if (!content || typeof content !== 'object') {
        sendJson(res, 400, { error: 'Conteúdo (JSON) é obrigatório' })
        return
      }

      const validationError = validateSlideDeck(content)
      if (validationError) {
        sendJson(res, 400, { error: validationError })
        return
      }

      const { rows } = await db.query(
        'UPDATE slide_decks SET title = $1, content = $2::jsonb, updated_at = NOW() WHERE slug = $3 RETURNING slug, title',
        [title, JSON.stringify(content), slug],
      )
      if (rows.length === 0) {
        sendJson(res, 404, { error: 'Deck não encontrado' })
        return
      }
      sendJson(res, 200, { slug: rows[0].slug, title: rows[0].title })
      return
    }

    // DELETE /api/slides/:slug
    if (req.method === 'DELETE' && slug) {
      const { rowCount } = await db.query('DELETE FROM slide_decks WHERE slug = $1', [slug])
      if (rowCount === 0) {
        sendJson(res, 404, { error: 'Deck não encontrado' })
        return
      }
      res.status(204).end()
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

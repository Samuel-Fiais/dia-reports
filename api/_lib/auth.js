import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getPool } from './db.js'

const COOKIE_NAME = 'dia_session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 dias

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not configured')
  return secret
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export function createSessionCookie(userId) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString(
    'base64url',
  )
  const signature = sign(payload)
  const value = `${payload}.${signature}`
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }
  return out
}

function readUserIdFromCookie(req) {
  const cookies = parseCookies(req.headers.cookie)
  const raw = cookies[COOKIE_NAME]
  if (!raw) return null
  const [payload, signature] = raw.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!data.uid || !data.exp || data.exp < Date.now()) return null
  return data.uid
}

/**
 * Lê o cookie de sessão, valida e busca usuário + perfil + grupos permitidos.
 * Retorna null se não houver sessão válida, o usuário estiver inativo, ou o
 * perfil tiver sido removido.
 */
export async function getUserById(userId) {
  if (!userId) return null

  const db = getPool()
  const { rows } = await db.query(
    `
    SELECT
      u.id, u.email, u.active,
      p.id AS profile_id, p.name AS profile_name, p.permissions,
      COALESCE(
        (SELECT array_agg(prg.group_id) FROM dia_reports.profile_report_groups prg WHERE prg.profile_id = p.id),
        ARRAY[]::uuid[]
      ) AS allowed_group_ids
    FROM dia_reports.users u
    LEFT JOIN dia_reports.profiles p ON p.id = u.profile_id
    WHERE u.id = $1
    `,
    [userId],
  )

  const row = rows[0]
  if (!row || !row.active) return null

  return {
    id: row.id,
    email: row.email,
    profileId: row.profile_id,
    profileName: row.profile_name,
    permissions: row.permissions ?? {},
    allowedGroupIds: row.allowed_group_ids ?? [],
  }
}

export async function getSessionUser(req) {
  const userId = readUserIdFromCookie(req)
  return getUserById(userId)
}

export function requirePermission(user, key) {
  return Boolean(user?.permissions?.['*'] === true || user?.permissions?.[key] === true)
}

/**
 * reportGroupIds: array de group_id (uuid) associados ao relatório (vazio = público
 * para qualquer logado).
 */
export function canViewReport(user, reportGroupIds) {
  if (!user) return false
  if (user.permissions?.['*'] === true) return true
  if (!reportGroupIds || reportGroupIds.length === 0) return true
  return reportGroupIds.some((id) => user.allowedGroupIds.includes(id))
}

export const REPORT_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
}

export function normalizeReportVisibility(value) {
  return value === REPORT_VISIBILITY.PUBLIC ? REPORT_VISIBILITY.PUBLIC : REPORT_VISIBILITY.PRIVATE
}

/** POST/PUT: reject invalid values; create defaults missing to private; update leaves missing unchanged. */
export function parseReportVisibilityForWrite(value, mode) {
  if (value === undefined) {
    return mode === 'create' ? REPORT_VISIBILITY.PRIVATE : null
  }
  if (value !== REPORT_VISIBILITY.PUBLIC && value !== REPORT_VISIBILITY.PRIVATE) {
    const err = new Error('visibility inválida — use "public" ou "private"')
    err.statusCode = 400
    throw err
  }
  return value
}

/** Leitura via GET /api/reports/:slug (não inclui token /api/shared). */
export function canReadReport({ user, visibility, groupIds, isAdmin }) {
  if (isAdmin) return true
  if (normalizeReportVisibility(visibility) === REPORT_VISIBILITY.PUBLIC) return true
  if (!user) return false
  return canViewReport(user, groupIds)
}

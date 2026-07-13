export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
}

export function sendJson(res, status, body) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
  res.setHeader('Content-Type', 'application/json')
  res.status(status).json(body)
}

export function handleOptions(req, res) {
  if (req.method !== 'OPTIONS') return false
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
  res.status(204).end()
  return true
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  let raw = ''
  for await (const chunk of req) raw += chunk
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }
}

export function normalizeDate(value) {
  if (!value) return value
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

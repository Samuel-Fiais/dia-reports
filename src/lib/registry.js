import { fetchJson, jsonBody } from './api.js'

// Pasta comum de relatórios agora é carregada em tempo de execução pela API.
const API_BASE = '/api'

export let reports = []

export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`)
  if (!res.ok) throw new Error('Failed to fetch reports')
  const data = await res.json()
  reports = data
  return data
}

export async function getReport(slug) {
  const res = await fetch(`${API_BASE}/reports/${slug}`)
  if (res.status === 404) return null
  if (res.status === 401) {
    const err = new Error('Not authenticated')
    err.code = 'UNAUTHENTICATED'
    throw err
  }
  if (!res.ok) throw new Error('Failed to fetch report')
  const data = await res.json()
  return data.content ? { ...data.content, id: data.slug, updatedAt: data.updatedAt, visibility: data.visibility } : null
}

export async function getAdminReport(slug) {
  return fetchJson(`${API_BASE}/reports/${slug}?admin=1`)
}

export async function createReport(payload) {
  return fetchJson(`${API_BASE}/reports`, { method: 'POST', ...jsonBody(payload) })
}

export async function updateReport(slug, payload) {
  return fetchJson(`${API_BASE}/reports/${slug}`, { method: 'PUT', ...jsonBody(payload) })
}

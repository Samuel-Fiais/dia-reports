import { fetchJson } from './api.js'

export function fetchForewordTimelines() {
  return fetchJson('/api/foreword-timelines')
}

// O driver do Neon pode serializar DATE como YYYY-MM-DD ou ISO completo.
// A timeline é editorial e usa a data de calendário, nunca o fuso do browser.
export function parseForewordCalendarDate(value) {
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  const date = new Date(`${match[1]}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

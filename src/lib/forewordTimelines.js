import { fetchJson } from './api.js'

export function fetchForewordTimelines() {
  return fetchJson('/api/foreword-timelines')
}

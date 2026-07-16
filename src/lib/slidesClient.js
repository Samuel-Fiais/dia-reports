import { fetchJson, jsonBody } from './api.js'

export async function fetchDecks() {
  return fetchJson('/api/slides')
}

export async function getDeck(slug) {
  return fetchJson(`/api/slides/${slug}`)
}

export async function createDeck(payload) {
  return fetchJson('/api/slides', { method: 'POST', ...jsonBody(payload) })
}

export async function updateDeck(slug, payload) {
  return fetchJson(`/api/slides/${slug}`, { method: 'PUT', ...jsonBody(payload) })
}

export async function deleteDeck(slug) {
  return fetchJson(`/api/slides/${slug}`, { method: 'DELETE' })
}

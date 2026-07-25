// Wrapper fino sobre fetch pras rotas /api/* internas: já assume JSON, já
// extrai a mensagem de erro do corpo `{ error }` que toda rota admin devolve.
export async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Falha na requisição')
  }
  if (res.status === 204) return null
  return res.json()
}

export function jsonBody(data) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}

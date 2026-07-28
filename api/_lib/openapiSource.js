import dns from 'node:dns/promises'
import net from 'node:net'

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 3
const FETCH_TIMEOUT_MS = 10_000

function normalizedHostname(hostname) {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase()
}

export function isPrivateNetworkAddress(address) {
  const value = normalizedHostname(address)
  const version = net.isIP(value)
  if (version === 4) {
    const [a, b] = value.split('.').map(Number)
    return (
      a === 0
      || a === 10
      || a === 127
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && [0, 168].includes(b))
      || (a === 198 && [18, 19, 51].includes(b))
      || (a === 203 && b === 0)
      || a >= 224
    )
  }
  if (version === 6) {
    return (
      !/^[23][0-9a-f]{3}:/.test(value)
      || value.startsWith('2001:db8:')
    )
  }
  return false
}

export function parseOpenApiSourceUrl(rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl ?? ''))
  } catch {
    throw Object.assign(new Error('URL OpenAPI inválida'), { statusCode: 400 })
  }

  if (url.protocol !== 'https:') {
    throw Object.assign(new Error('A URL OpenAPI deve usar HTTPS'), { statusCode: 400 })
  }
  if (url.username || url.password) {
    throw Object.assign(new Error('A URL OpenAPI não pode conter credenciais'), { statusCode: 400 })
  }
  const hostname = normalizedHostname(url.hostname)
  if (
    !hostname
    || hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || isPrivateNetworkAddress(hostname)
  ) {
    throw Object.assign(new Error('A URL OpenAPI deve apontar para um endereço público'), {
      statusCode: 400,
    })
  }
  return url
}

async function assertPublicResolution(url) {
  const hostname = normalizedHostname(url.hostname)
  if (net.isIP(hostname)) return
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateNetworkAddress(address))) {
    throw Object.assign(new Error('A URL OpenAPI resolveu para uma rede não permitida'), {
      statusCode: 400,
    })
  }
}

async function readBoundedBody(response) {
  const declaredLength = Number(response.headers.get('content-length'))
  if (declaredLength > MAX_RESPONSE_BYTES) {
    throw Object.assign(new Error('O documento OpenAPI excede 2 MB'), { statusCode: 413 })
  }

  const reader = response.body?.getReader()
  if (!reader) return response.text()
  const decoder = new TextDecoder()
  let bytes = 0
  let text = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw Object.assign(new Error('O documento OpenAPI excede 2 MB'), { statusCode: 413 })
    }
    text += decoder.decode(value, { stream: true })
  }

  return text + decoder.decode()
}

export async function fetchOpenApiSource(rawUrl) {
  let url = parseOpenApiSourceUrl(rawUrl)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicResolution(url)
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'application/json, application/vnd.oai.openapi+json',
        'User-Agent': 'Dia-Reports-OpenAPI/1.0',
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirect === MAX_REDIRECTS) {
        throw Object.assign(new Error('Redirecionamento OpenAPI inválido'), { statusCode: 502 })
      }
      url = parseOpenApiSourceUrl(new URL(location, url).toString())
      continue
    }

    if (!response.ok) {
      throw Object.assign(
        new Error(`A origem OpenAPI respondeu com HTTP ${response.status}`),
        { statusCode: 502 },
      )
    }

    const raw = await readBoundedBody(response)
    try {
      return JSON.parse(raw)
    } catch {
      throw Object.assign(new Error('A origem não retornou um JSON válido'), { statusCode: 502 })
    }
  }

  throw Object.assign(new Error('Não foi possível carregar o documento OpenAPI'), {
    statusCode: 502,
  })
}

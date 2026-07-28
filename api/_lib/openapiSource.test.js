import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isPrivateNetworkAddress,
  parseOpenApiSourceUrl,
} from './openapiSource.js'

test('accepts public HTTPS OpenAPI URLs', () => {
  const url = parseOpenApiSourceUrl('https://api.exemplo.com/openapi.json')
  assert.equal(url.hostname, 'api.exemplo.com')
})

test('rejects credentials and non-HTTPS URLs', () => {
  assert.throws(() => parseOpenApiSourceUrl('http://api.exemplo.com/openapi.json'), /HTTPS/)
  assert.throws(
    () => parseOpenApiSourceUrl('https://user:secret@api.exemplo.com/openapi.json'),
    /credenciais/,
  )
})

test('rejects local and private network targets', () => {
  for (const url of [
    'https://localhost/openapi.json',
    'https://127.0.0.1/openapi.json',
    'https://10.0.0.1/openapi.json',
    'https://192.168.1.1/openapi.json',
    'https://[::1]/openapi.json',
  ]) {
    assert.throws(() => parseOpenApiSourceUrl(url), /endereço público/)
  }
  assert.equal(isPrivateNetworkAddress('8.8.8.8'), false)
})


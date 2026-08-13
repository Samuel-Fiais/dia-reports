import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveLocation } from './geoLocations.js'

test('aliases de EUA resolvem para o mesmo ponto', () => {
  assert.deepEqual(resolveLocation('EUA'), resolveLocation('Estados Unidos'))
})

test('São Paulo resolve para a capital', () => {
  assert.equal(resolveLocation('São Paulo')?.label, 'São Paulo')
})

test('são paulo em minúsculo resolve', () => {
  assert.equal(resolveLocation('são paulo')?.label, 'São Paulo')
})

test('string desconhecida retorna null', () => {
  assert.equal(resolveLocation('Lugar Inexistente'), null)
})

test('Coreia do Norte e Coreia do Sul são pontos distintos', () => {
  assert.notDeepEqual(resolveLocation('Coreia do Norte'), resolveLocation('Coreia do Sul'))
})

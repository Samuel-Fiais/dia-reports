import assert from 'node:assert/strict'
import test from 'node:test'
import { parseForewordCalendarDate } from './forewordTimelines.js'

test('aceita DATE do banco sem horário', () => {
  const date = parseForewordCalendarDate('2026-08-03')
  assert.equal(date?.getFullYear(), 2026)
  assert.equal(date?.getMonth(), 7)
  assert.equal(date?.getDate(), 3)
})

test('aceita DATE serializado pelo driver do Neon como ISO', () => {
  const date = parseForewordCalendarDate('2026-08-03T00:00:00.000Z')
  assert.equal(date?.getFullYear(), 2026)
  assert.equal(date?.getMonth(), 7)
  assert.equal(date?.getDate(), 3)
})

test('rejeita valores que não representam uma data de calendário', () => {
  assert.equal(parseForewordCalendarDate('not-a-date'), null)
})

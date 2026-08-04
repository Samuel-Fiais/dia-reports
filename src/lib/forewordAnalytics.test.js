import assert from 'node:assert/strict'
import test from 'node:test'
import { impactLabel, monthCalendar, weekCalendar } from './forewordAnalytics.js'

test('classifica impacto por faixas editoriais', () => {
  assert.equal(impactLabel(97), 'Crítico')
  assert.equal(impactLabel(82), 'Alto')
  assert.equal(impactLabel(50), 'Moderado')
  assert.equal(impactLabel(12), 'Baixo')
})

test('calendário mensal começa na segunda e contém seis semanas', () => {
  const days = monthCalendar('2026-08')
  assert.equal(days.length, 42)
  assert.equal(days[0].key, '2026-07-27')
  assert.equal(days.find((day) => day.key === '2026-08-01')?.inMonth, true)
})

test('calendário semanal retorna a semana do marco', () => {
  assert.deepEqual(weekCalendar('2026-08-03').map((day) => day.key), [
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06',
    '2026-08-07', '2026-08-08', '2026-08-09',
  ])
})

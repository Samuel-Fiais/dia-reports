import { parseForewordCalendarDate } from './forewordTimelines.js'

export function dateKey(value) {
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? null
}

export function flattenForewordEvents(timelines) {
  return timelines.flatMap((timeline) => timeline.events.map((event) => ({ ...event, timeline })))
    .sort((a, b) => dateKey(a.occurredOn).localeCompare(dateKey(b.occurredOn)))
}

export function impactLabel(score) {
  if (score >= 90) return 'Crítico'
  if (score >= 75) return 'Alto'
  if (score >= 50) return 'Moderado'
  return 'Baixo'
}

export function monthCalendar(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const first = new Date(year, month - 1, 1, 12)
  const firstMondayIndex = (first.getDay() + 6) % 7
  const start = new Date(year, month - 1, 1 - firstMondayIndex, 12)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = date.toISOString().slice(0, 10)
    return { key, day: date.getDate(), inMonth: date.getMonth() === month - 1 }
  })
}

export function weekCalendar(anchorKey) {
  const date = parseForewordCalendarDate(anchorKey)
  if (!date) return []
  const mondayIndex = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - mondayIndex)
  return Array.from({ length: 7 }, (_, index) => {
    const item = new Date(date)
    item.setDate(date.getDate() + index)
    return { key: item.toISOString().slice(0, 10), day: item.getDate(), inMonth: true }
  })
}

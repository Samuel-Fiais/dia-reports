export const WEEKDAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const MONTHS_PT_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Monta uma grade de 6 semanas (42 células) para "YYYY-MM", com dias do mês
// anterior/seguinte preenchendo as pontas. Usa UTC para não sofrer com fuso.
export function buildMonthGrid(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const startWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const prevMonthDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate()

  const cells = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, inMonth: false, iso: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, inMonth: true, iso })
  }
  let trailing = 1
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ day: trailing++, inMonth: false, iso: null })
  }
  return cells
}

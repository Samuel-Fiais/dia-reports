// Parser de CSV minimalista (sem dependência nova) — suporta campos entre
// aspas com vírgula/quebra de linha escapadas ("" -> "). Suficiente pro caso
// de uso (planilhas exportadas simples), não é RFC 4180 completo.
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1 } else { inQuotes = false }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') { inQuotes = true; continue }
    if (char === ',') { row.push(field); field = ''; continue }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      field = ''
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      continue
    }
    field += char
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  if (!rows.length) return { headers: [], rows: [] }

  const [headers, ...dataRows] = rows
  return { headers, rows: dataRows }
}

function inferColumnType(rows, columnIndex) {
  const values = rows
    .map((row) => row[columnIndex])
    .filter((value) => value !== undefined && value !== null && value !== '')

  if (!values.length) return 'text'
  if (values.every((value) => value instanceof Date)) return 'date'
  if (values.every((value) => typeof value === 'boolean')) return 'boolean'
  if (values.every((value) => (
    typeof value === 'number'
    || (typeof value === 'string' && !Number.isNaN(Number(value.replace(',', '.'))))
  ))) return 'number'
  return 'text'
}

function serializeCell(value) {
  if (value instanceof Date) return value.toISOString()
  return value ?? ''
}

function normalizeHeaders(headers, rows) {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), headers.length)
  const occurrences = new Map()
  return Array.from({ length: columnCount }, (_, index) => {
    const base = String(headers[index] ?? '').trim() || `Coluna ${index + 1}`
    const count = (occurrences.get(base) ?? 0) + 1
    occurrences.set(base, count)
    return count === 1 ? base : `${base} (${count})`
  })
}

// Serializa a tabela inteira para o contexto da IA. As linhas permanecem como
// matrizes alinhadas a `columns`, evitando repetir o nome de cada coluna em
// todos os registros e reduzindo o tamanho do JSON sem descartar dados.
export function summarizeCsv({ headers, rows }) {
  const normalizedHeaders = normalizeHeaders(headers, rows)
  const columns = normalizedHeaders.map((header, index) => ({ name: header, type: inferColumnType(rows, index) }))
  return {
    columns,
    rowCount: rows.length,
    rows: rows.map((row) => normalizedHeaders.map((_, index) => serializeCell(row[index]))),
  }
}

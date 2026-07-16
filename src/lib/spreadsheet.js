import * as XLSX from '@e965/xlsx'
import { parseCsv, summarizeCsv } from './csv.js'

const XLSX_EXTENSION = /\.xlsx$/i

function cellText(value) {
  if (value instanceof Date) return value.toISOString()
  return value == null ? '' : String(value)
}

function uniqueHeaders(row, columnCount) {
  const occurrences = new Map()
  return Array.from({ length: columnCount }, (_, index) => {
    const base = cellText(row[index]).trim() || `Coluna ${index + 1}`
    const count = (occurrences.get(base) ?? 0) + 1
    occurrences.set(base, count)
    return count === 1 ? base : `${base} (${count})`
  })
}

export function rowsToTable(data) {
  const rows = Array.isArray(data) ? data.filter((row) => Array.isArray(row)) : []
  if (!rows.length) return { headers: [], rows: [] }

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (!columnCount) return { headers: [], rows: [] }

  return {
    headers: uniqueHeaders(rows[0], columnCount),
    rows: rows.slice(1),
  }
}

export async function readDataFile(file) {
  if (XLSX_EXTENSION.test(file.name)) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    return {
      format: 'xlsx',
      sheets: workbook.SheetNames.map((name) => ({
        name,
        summary: summarizeCsv(rowsToTable(XLSX.utils.sheet_to_json(workbook.Sheets[name], {
          header: 1,
          defval: null,
          blankrows: false,
          raw: true,
        }))),
      })),
    }
  }

  return {
    format: 'csv',
    sheets: [{ name: null, summary: summarizeCsv(parseCsv(await file.text())) }],
  }
}

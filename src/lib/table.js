const columnDefinition = (column, index) => {
  if (column && typeof column === 'object' && !Array.isArray(column)) {
    const key = String(column.key ?? column.name ?? column.label ?? index)
    return { key, label: String(column.label ?? column.name ?? column.key ?? `Coluna ${index + 1}`) }
  }
  const label = String(column ?? `Coluna ${index + 1}`)
  return { key: label, label }
}

export function normalizeTableData(columns, rows) {
  const sourceRows = Array.isArray(rows) ? rows : []
  let definitions = (Array.isArray(columns) ? columns : []).map(columnDefinition)

  if (!definitions.length) {
    const objectRow = sourceRows.find((row) => row && typeof row === 'object' && !Array.isArray(row))
    if (objectRow) definitions = Object.keys(objectRow).map(columnDefinition)
    else {
      const width = sourceRows.reduce((largest, row) => Math.max(largest, Array.isArray(row) ? row.length : 1), 0)
      definitions = Array.from({ length: width }, (_, index) => columnDefinition(null, index))
    }
  }

  let normalizedRows = sourceRows.map((row) => {
    if (Array.isArray(row)) return definitions.map((_, index) => row[index] ?? '')
    if (row && typeof row === 'object') {
      const entries = Object.entries(row)
      return definitions.map((column, index) => {
        if (Object.hasOwn(row, column.key)) return row[column.key]
        if (Object.hasOwn(row, column.label)) return row[column.label]
        const insensitiveMatch = entries.find(([key]) => key.toLocaleLowerCase('pt-BR') === column.key.toLocaleLowerCase('pt-BR'))
        return insensitiveMatch?.[1] ?? entries[index]?.[1] ?? ''
      })
    }
    return definitions.map((_, index) => index === 0 ? row ?? '' : '')
  })

  // A IA às vezes cria uma coluna sem dados e preenche tudo com travessões.
  // Ela não agrega informação e parece uma falha de renderização, então é
  // eliminada automaticamente sem afetar zeros ou valores booleanos válidos.
  if (normalizedRows.length && definitions.length) {
    const missing = new Set(['', '-', '–', '—', 'n/a', 'na', 'null', 'undefined', 'não informado'])
    const populatedIndexes = definitions
      .map((_, index) => index)
      .filter((index) => normalizedRows.some((row) => !missing.has(String(row[index] ?? '').trim().toLocaleLowerCase('pt-BR'))))
    if (populatedIndexes.length && populatedIndexes.length < definitions.length) {
      definitions = populatedIndexes.map((index) => definitions[index])
      normalizedRows = normalizedRows.map((row) => populatedIndexes.map((index) => row[index]))
    }
  }

  return { columns: definitions.map((column) => column.label), rows: normalizedRows }
}

export function normalizeTableBlock(block) {
  if (!block || block.type !== 'table') return block
  return { ...block, ...normalizeTableData(block.columns, block.rows) }
}

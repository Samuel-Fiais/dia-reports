const numericValue = (value) => {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const approximatelyEqual = (left, right) => Math.abs(left - right) <= Math.max(1e-9, Math.abs(right) * 1e-9)

export function buildWaterfallBars(items = []) {
  const values = items.map((item) => numericValue(item?.value) ?? 0)
  let anchorIndex = -1
  let anchorValue = 0

  // Entre dois totais explícitos, valores positivos podem representar
  // magnitudes de saída. Ex.: 568 - 520 = 48. Só inferimos o sinal quando a
  // conta fecha exatamente; deltas positivos/negativos explícitos são mantidos.
  items.forEach((item, index) => {
    const explicitTotal = item?.isTotal ? numericValue(item.value) : null
    if (explicitTotal == null) return
    const intermediateIndexes = items
      .map((entry, entryIndex) => ({ entry, entryIndex }))
      .filter(({ entry, entryIndex }) => entryIndex > anchorIndex && entryIndex < index && !entry?.isTotal)
      .map(({ entryIndex }) => entryIndex)
    const magnitudes = intermediateIndexes.map((entryIndex) => values[entryIndex])
    if (magnitudes.length && magnitudes.every((value) => value >= 0)) {
      const sum = magnitudes.reduce((total, value) => total + value, 0)
      if (approximatelyEqual(anchorValue - sum, explicitTotal) && !approximatelyEqual(anchorValue + sum, explicitTotal)) {
        intermediateIndexes.forEach((entryIndex) => { values[entryIndex] = -Math.abs(values[entryIndex]) })
      }
    }
    anchorIndex = index
    anchorValue = explicitTotal
  })

  let running = 0
  return items.map((item, index) => {
    if (item?.isTotal) {
      const explicitTotal = numericValue(item.value)
      if (explicitTotal != null) running = explicitTotal
      return { range: [0, running], total: true, value: running }
    }
    const start = running
    running += values[index]
    return { range: [start, running], total: false, value: values[index] }
  })
}

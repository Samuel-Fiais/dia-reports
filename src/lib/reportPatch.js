const metricKey = (metric) => String(metric?.label ?? '').trim().toLocaleLowerCase('pt-BR')

export function mergeMetricsPreservingOmissions(currentMetrics, incomingMetrics) {
  if (!Array.isArray(incomingMetrics) || !Array.isArray(currentMetrics) || incomingMetrics.length >= currentMetrics.length) {
    return incomingMetrics
  }

  const incomingByLabel = new Map(incomingMetrics.map((metric) => [metricKey(metric), metric]).filter(([key]) => key))
  const matches = currentMetrics.filter((metric) => incomingByLabel.has(metricKey(metric))).length

  // Uma lista menor sem qualquer label conhecida indica que a IA reconstruiu
  // as métricas sem contexto. Preservar é mais seguro que apagar dados reais.
  if (!matches) return currentMetrics

  return currentMetrics.map((metric) => {
    const incoming = incomingByLabel.get(metricKey(metric))
    return incoming ? { ...metric, ...incoming } : metric
  })
}

export function mergeReportPatch(report, patch) {
  if (!Array.isArray(patch?.metrics)) return { ...report, ...patch }
  return {
    ...report,
    ...patch,
    metrics: mergeMetricsPreservingOmissions(report?.metrics, patch.metrics),
  }
}

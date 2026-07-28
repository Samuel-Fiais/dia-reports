export function blockLabel(block, key, fallback = '') {
  if (!block || typeof block !== 'object') return fallback
  return block.labels?.[key] ?? fallback
}

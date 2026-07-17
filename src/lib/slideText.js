// Conteúdo de slides normalmente é texto, mas alguns decks usam itens
// estruturados (por exemplo { label, value, note }). React não aceita esses
// objetos diretamente como children, então convertemos a forma estruturada
// em uma linha legível antes de renderizar previews e bullets.
export function toSlideText(value) {
  if (value == null || value === false) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(toSlideText).filter(Boolean).join(' · ')
  if (typeof value !== 'object') return String(value)

  const parts = [value.label, value.value, value.note]
    .map(toSlideText)
    .filter(Boolean)
  if (parts.length > 0) return parts.join(' — ')

  for (const key of ['title', 'text', 'name', 'description']) {
    const text = toSlideText(value[key])
    if (text) return text
  }
  return ''
}

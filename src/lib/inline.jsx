// Mini-parser de marcação inline usada nos textos do JSON:
// **negrito**, *itálico*, `código`, ``texto com `backtick` literal`` e [texto](url)
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|``(?:[^`]|`(?!`))+``|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

export function renderInline(text) {
  if (text == null) return null
  const parts = String(text).split(TOKEN)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    // `` `código` ``: sintaxe padrão de Markdown para código literal contendo backticks
    if (part.startsWith('``') && part.endsWith('``') && part.length > 4) {
      let inner = part.slice(2, -2)
      if (inner.startsWith(' ') && inner.endsWith(' ') && inner.trim() !== '') {
        inner = inner.slice(1, -1)
      }
      return <code key={i}>{inner}</code>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]}
        </a>
      )
    }
    return part
  })
}

import {
  BLOCK_MANIFEST,
  createBlock,
} from './blockManifest.js'

export const COMPONENT_CATALOG_ID = 'componentes'

const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#e4e1d5"/>
    <path d="M0 360 210 170l150 135 110-90 330 235H0Z" fill="#b8b3a3"/>
    <circle cx="640" cy="120" r="48" fill="#f7f5e9"/>
    <text x="40" y="70" font-family="sans-serif" font-size="26" fill="#34332f">
      Imagem de exemplo
    </text>
  </svg>
`)}`.replaceAll('\n', '')

const optionValue = (option) => (
  typeof option === 'string' ? option : option?.value
)

function sampleText(field, context) {
  const { key, label } = field
  const { blockType, index } = context

  if (key === 'id') return `${blockType}-${index + 1}`
  if (key === 'href') return 'data:text/plain,Arquivo de exemplo'
  if (key === 'src' && blockType === 'video') return 'data:video/mp4;base64,'
  if (key === 'src' && blockType === 'embed') return 'about:blank'
  if (key === 'src') return SAMPLE_IMAGE
  if (key === 'ratio') return '16 / 9'
  if (key === 'language') return 'javascript'
  if (key === 'date') return '28 jul. 2026'
  if (key === 'time') return index === 0 ? '09:30' : '14:00'
  if (key === 'value') return index === 0 ? '68%' : '42'
  if (key === 'display') return index === 0 ? '680' : '420'
  if (key === 'change') return '+12%'
  if (key === 'state') return index === 0 ? 'active' : 'done'
  if (key === 'format') return 'TXT'
  if (key === 'size') return '2 KB'
  if (key === 'source') return 'Fonte de exemplo'
  if (key === 'author') return index === 0 ? 'Ana Lima' : 'Bruno Costa'
  if (key === 'recipient') return 'Equipe de produto'
  if (key === 'subject') return 'Assunto de exemplo'
  if (key === 'term') return index === 0 ? 'Componente' : 'Variante'
  if (key === 'from') return index === 0 ? 'Origem A' : 'Origem B'
  if (key === 'to') return index === 0 ? 'Destino A' : 'Destino B'
  if (key === 'name') return index === 0 ? 'Marina Alves' : 'Rafael Souza'
  if (key === 'subtitle') return index === 0 ? 'Produto' : 'Engenharia'
  if (key === 'group') return 'Equipe principal'
  if (key === 'meta') return 'Informação complementar'
  if (key === 'reference') return 'Meta 75%'
  if (key === 'badge') return 'Exemplo'
  if (key === 'label') return index === 0 ? label : `${label} 2`
  if (key === 'title') return index === 0 ? `Exemplo de ${label}` : `${label} complementar`
  if (key === 'text' || key === 'content') {
    return index === 0
      ? `**Exemplo de ${label.toLocaleLowerCase('pt-BR')}** gerado a partir do schema.`
      : `Segundo conteúdo para demonstrar listas e agrupamentos.`
  }
  if (key === 'code') return `const exemplo = 'gerado pelo schema'`
  return index === 0 ? `Exemplo de ${label}` : `${label} complementar`
}

function sampleNumber(field, context) {
  if (field.key === 'columns') return 2
  if (field.key === 'position') return context.index + 1
  if (field.key === 'width') return 180
  if (field.key === 'height') return 220
  if (field.key === 'total' || field.key === 'max') return 100
  if (field.key === 'progress') return 68
  return context.index === 0 ? 68 : 42
}

function sampleObject(itemFields, context) {
  return Object.fromEntries(
    (itemFields ?? []).map((itemField) => [
      itemField.key,
      sampleField(itemField, context),
    ]),
  )
}

function sampleField(field, context) {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'code':
      return sampleText(field, context)
    case 'date':
      return '2026-07-28'
    case 'image':
      return SAMPLE_IMAGE
    case 'number':
      return sampleNumber(field, context)
    case 'toggle':
      return context.index === 0
    case 'select':
      return optionValue(field.options?.[0]) ?? ''
    case 'array-string':
      return ['Primeiro item de exemplo', 'Segundo item de exemplo']
    case 'array-number':
      return [18, 42, 35, 68]
    case 'key-value':
      return { reference: 'Referência', status: 'Estado' }
    case 'table':
      return [
        ['Linha A', '68'],
        ['Linha B', '42'],
      ]
    case 'object':
      return field.itemFields?.length
        ? sampleObject(field.itemFields, context)
        : {}
    case 'array-object':
      return field.itemFields?.length
        ? [0, 1].map((index) => sampleObject(field.itemFields, { ...context, index }))
        : [{ id: `${context.blockType}-row-1`, label: 'Linha A', value: '68' }]
    default:
      throw new Error(
        `Tipo de campo sem gerador de exemplo: ${field.type} (${context.blockType}.${field.key})`,
      )
  }
}

function schemaExample(type) {
  const definition = BLOCK_MANIFEST[type]
  const block = createBlock(type)

  for (const field of definition.fields) {
    if (['id', 'detailsLabel', 'details', 'span'].includes(field.key)) continue
    block[field.key] = sampleField(field, { blockType: type, index: 0 })
  }

  return block
}

const EXAMPLE_REFINEMENTS = Object.freeze({
  paragraph: {
    text: '**Este parágrafo foi criado automaticamente** para demonstrar texto e formatação inline.',
  },
  list: {
    style: 'unordered',
    items: ['Primeiro item reutilizável', 'Segundo item reutilizável', 'Terceiro item reutilizável'],
  },
  diagram: {
    code: 'flowchart LR\n  A[Schema] --> B[Exemplo]\n  B --> C[Renderizador]',
    caption: 'Fluxo gerado com uma definição Mermaid válida.',
  },
  table: {
    columns: ['Item', 'Estado', 'Valor'],
    rows: [
      ['Exemplo A', 'Ativo', '68'],
      ['Exemplo B', 'Planejado', '42'],
    ],
  },
  chart: {
    variant: 'bar',
    labels: ['Jan', 'Fev', 'Mar', 'Abr'],
    datasets: [{ label: 'Série de exemplo', data: [18, 42, 35, 68] }],
    height: 220,
  },
  'value-comparison': {
    variant: 'pair',
    before: { label: 'Antes', value: '42' },
    after: { label: 'Depois', value: '68' },
    note: 'Comparação genérica entre dois estados.',
  },
  'task-table': {
    columns: [
      { key: 'item', label: 'Item', kind: 'text' },
      { key: 'status', label: 'Estado', kind: 'status' },
      { key: 'priority', label: 'Prioridade', kind: 'priority' },
    ],
    items: [
      { id: 'task-1', item: 'Primeiro item', status: 'active', priority: 'high' },
      { id: 'task-2', item: 'Segundo item', status: 'done', priority: 'medium' },
    ],
  },
  trigger: {
    label: 'Abrir detalhamento',
    details: {
      title: 'Detalhamento genérico',
      blocks: [{ type: 'paragraph', text: 'Conteúdo aberto pelo componente de ação.' }],
    },
  },
  image: {
    src: SAMPLE_IMAGE,
    alt: 'Ilustração abstrata usada como exemplo',
    caption: 'Imagem embutida no próprio catálogo.',
  },
  video: {
    src: 'data:video/mp4;base64,',
    caption: 'Controles de vídeo com uma origem de demonstração vazia.',
  },
  embed: {
    src: 'about:blank',
    title: 'Área incorporada de exemplo',
    caption: 'Área segura e vazia para demonstrar a incorporação.',
  },
  attachment: {
    href: 'data:text/plain,Arquivo de exemplo',
    name: 'arquivo-exemplo.txt',
    format: 'TXT',
    size: '19 bytes',
    download: true,
  },
  'table-of-contents': {
    heading: 'Navegação',
    description: 'Categorias derivadas automaticamente do manifesto.',
  },
  'related-content': {
    heading: 'Conteúdo relacionado',
    description: 'Exemplo de navegação para outro conteúdo.',
    items: [
      {
        id: 'catalog-self-reference',
        title: 'Catálogo de componentes',
        href: '/componentes',
        meta: 'Documento virtual gerado pelo schema',
      },
    ],
  },
})

export function createComponentExample(type) {
  if (!BLOCK_MANIFEST[type]) {
    throw new Error(`Tipo de bloco não suportado: ${type}`)
  }
  return {
    ...schemaExample(type),
    ...(EXAMPLE_REFINEMENTS[type] ?? {}),
    id: `catalog-${type}`,
  }
}

function variantsDescription(definition) {
  const entries = Object.entries(definition.variants)
  if (!entries.length) return 'Sem variantes próprias; o exemplo usa somente os campos do schema.'
  return entries
    .map(([fieldKey, variants]) => `${fieldKey}: ${variants.join(', ')}`)
    .join(' · ')
}

function catalogSections() {
  const categories = new Map()

  for (const [type, definition] of Object.entries(BLOCK_MANIFEST)) {
    if (definition.placements.length === 1 && definition.placements[0] === 'body') continue
    if (!categories.has(definition.category)) categories.set(definition.category, [])
    categories.get(definition.category).push({
      id: `component-${type}`,
      title: definition.label,
      badge: type,
      description: variantsDescription(definition),
      blocks: [createComponentExample(type)],
    })
  }

  return [...categories.entries()].map(([category, items], index) => ({
    type: 'section',
    id: `catalog-section-${index + 1}`,
    heading: `${index + 1}. ${category}`,
    items,
  }))
}

function structuralExamples() {
  return Object.entries(BLOCK_MANIFEST)
    .filter(([type, definition]) => (
      definition.placements.length === 1
      && definition.placements[0] === 'body'
      && !['section', 'table-of-contents'].includes(type)
    ))
    .map(([type]) => createComponentExample(type))
}

export function buildComponentCatalogPublication(date = new Date().toISOString().slice(0, 10)) {
  const total = Object.keys(BLOCK_MANIFEST).length
  const sections = catalogSections()

  return {
    schemaVersion: 2,
    renderMode: 'report',
    id: COMPONENT_CATALOG_ID,
    title: 'Catálogo de componentes',
    from: 'Sistema · Referência viva',
    date,
    headline: ['Todos os componentes', 'em um documento'],
    intro: [
      `**Este documento é gerado diretamente pelo manifesto com ${total} componentes.** `
      + 'Novos tipos entram automaticamente no catálogo e são preenchidos de acordo com o schema.',
    ],
    settings: {
      colorIndex: 0,
      fontIndex: 0,
      chartStyleIndex: 2,
      widthMode: 'standard',
      fontScale: 'default',
      componentStyle: 'editorial',
    },
    body: [
      createComponentExample('table-of-contents'),
      ...sections,
      ...structuralExamples(),
    ],
  }
}

export function collectCatalogBlockTypes(publication) {
  const types = []
  const visit = (value) => {
    if (!value || typeof value !== 'object') return
    if (!Array.isArray(value) && typeof value.type === 'string') types.push(value.type)
    for (const child of Object.values(value)) visit(child)
  }
  visit(publication)
  return types
}

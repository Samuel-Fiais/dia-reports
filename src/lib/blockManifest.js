export const PUBLICATION_MODES = ['report', 'reference']

const DEFAULT_PLACEMENTS = ['body', 'item', 'detail']
const CATEGORY_FAMILIES = Object.freeze({
  Conteúdo: 'content',
  Mídia: 'media',
  Dados: 'data',
  Organização: 'organization',
  Planejamento: 'planning',
  Registros: 'records',
  Indicadores: 'indicators',
})

const field = (key, type, label, extra = {}) => ({ key, type, label, ...extra })
const arrayObject = (key, label, itemFields) => field(key, 'array-object', label, { itemFields })
const option = (value, label = value) => ({ value, label })
const VARIANT_FIELD_KEYS = new Set([
  'variant',
  'presentation',
  'style',
  'kind',
  'view',
  'orientation',
  'tone',
])

const commonFields = [
  field('id', 'text', 'ID estável'),
  field('detailsLabel', 'text', 'Rótulo do detalhamento'),
  field('details', 'object', 'Detalhamento'),
  field('span', 'select', 'Largura', {
    options: [
      option('', 'Automática'),
      option('1', '1 coluna'),
      option('2', '2 colunas'),
      option('3', '3 colunas'),
      option('full', 'Largura total'),
    ],
  }),
]

const define = (label, category, fields, defaults, extra = {}) => {
  const variants = Object.fromEntries(
    fields
      .filter((entry) => entry.type === 'select' && VARIANT_FIELD_KEYS.has(entry.key))
      .map((entry) => [
        entry.key,
        (entry.options ?? []).map((entryOption) => (
          typeof entryOption === 'string' ? entryOption : entryOption.value
        )),
      ]),
  )

  return Object.freeze({
    label,
    category,
    family: CATEGORY_FAMILIES[category],
    fields: [...fields, ...commonFields],
    variants,
    supportedModes: extra.supportedModes ?? PUBLICATION_MODES,
    placements: extra.placements ?? DEFAULT_PLACEMENTS,
    renderer: extra.renderer ?? defaults.type,
    defaultValue: () => ({ ...defaults }),
  })
}

export const BLOCK_MANIFEST = Object.freeze({
  paragraph: define('Parágrafo', 'Conteúdo', [
    field('text', 'textarea', 'Texto'),
  ], { type: 'paragraph', text: '' }),

  list: define('Lista', 'Conteúdo', [
    field('style', 'select', 'Estilo', {
      options: [option('unordered', 'Marcadores'), option('ordered', 'Numerada')],
    }),
    field('items', 'array-string', 'Itens'),
  ], { type: 'list', style: 'unordered', items: [] }),

  quote: define('Conteúdo atribuído', 'Conteúdo', [
    field('presentation', 'select', 'Apresentação', {
      options: [
        option('standard', 'Padrão'),
        option('featured', 'Destaque'),
        option('break', 'Quebra visual'),
        option('message', 'Mensagem'),
        option('correspondence', 'Correspondência'),
      ],
    }),
    field('text', 'textarea', 'Conteúdo'),
    field('author', 'text', 'Autor'),
    field('recipient', 'text', 'Destinatário'),
    field('source', 'text', 'Fonte'),
    field('date', 'text', 'Data'),
    field('subject', 'text', 'Assunto'),
    field('avatar', 'image', 'Avatar'),
    field('href', 'text', 'Link'),
    field('labels', 'key-value', 'Labels'),
  ], { type: 'quote', presentation: 'standard', text: '' }),

  'message-thread': define('Sequência de mensagens', 'Conteúdo', [
    arrayObject('messages', 'Mensagens', [
      field('id', 'text', 'ID estável'),
      field('author', 'text', 'Autor'),
      field('date', 'text', 'Data'),
      field('text', 'textarea', 'Conteúdo'),
    ]),
  ], { type: 'message-thread', messages: [] }),

  callout: define('Destaque', 'Conteúdo', [
    field('tone', 'select', 'Tom', {
      options: ['neutral', 'info', 'warning', 'positive', 'negative'],
    }),
    field('label', 'text', 'Rótulo'),
    field('text', 'textarea', 'Texto'),
  ], { type: 'callout', tone: 'neutral', text: '' }),

  'definition-list': define('Lista de definições', 'Conteúdo', [
    arrayObject('items', 'Definições', [
      field('id', 'text', 'ID estável'),
      field('term', 'text', 'Termo'),
      field('text', 'textarea', 'Descrição'),
    ]),
  ], { type: 'definition-list', items: [] }),

  accordion: define('Conteúdo recolhível', 'Conteúdo', [
    arrayObject('items', 'Painéis', [
      field('id', 'text', 'ID estável'),
      field('title', 'text', 'Título'),
      field('text', 'textarea', 'Conteúdo'),
      field('open', 'toggle', 'Aberto inicialmente'),
    ]),
  ], { type: 'accordion', items: [] }),

  tabs: define('Abas', 'Conteúdo', [
    field('orientation', 'select', 'Orientação', {
      options: [option('horizontal', 'Horizontal'), option('vertical', 'Vertical')],
    }),
    arrayObject('tabs', 'Abas', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('text', 'textarea', 'Conteúdo'),
      field('items', 'array-string', 'Lista'),
    ]),
  ], { type: 'tabs', orientation: 'horizontal', tabs: [] }),

  code: define('Código', 'Conteúdo', [
    field('language', 'text', 'Linguagem'),
    field('title', 'text', 'Título'),
    field('code', 'code', 'Código'),
  ], { type: 'code', language: '', code: '' }),

  image: define('Imagem', 'Mídia', [
    field('presentation', 'select', 'Apresentação', {
      options: [option('standard', 'Padrão'), option('break', 'Quebra visual')],
    }),
    field('src', 'image', 'Imagem/URL'),
    field('alt', 'text', 'Texto alternativo'),
    field('caption', 'textarea', 'Legenda'),
    field('credit', 'text', 'Crédito'),
  ], { type: 'image', presentation: 'standard', src: '', alt: '' }),

  gallery: define('Galeria', 'Mídia', [
    arrayObject('items', 'Imagens', [
      field('id', 'text', 'ID estável'),
      field('src', 'image', 'Imagem/URL'),
      field('alt', 'text', 'Texto alternativo'),
      field('caption', 'text', 'Legenda'),
    ]),
  ], { type: 'gallery', items: [] }),

  'image-comparison': define('Comparação de imagens', 'Mídia', [
    arrayObject('items', 'Imagens', [
      field('id', 'text', 'ID estável'),
      field('src', 'image', 'Imagem/URL'),
      field('label', 'text', 'Rótulo'),
      field('alt', 'text', 'Texto alternativo'),
    ]),
    field('caption', 'textarea', 'Legenda'),
  ], { type: 'image-comparison', items: [] }),

  video: define('Vídeo', 'Mídia', [
    field('src', 'text', 'URL'),
    field('poster', 'image', 'Capa'),
    field('caption', 'textarea', 'Legenda'),
  ], { type: 'video', src: '' }),

  embed: define('Conteúdo incorporado', 'Mídia', [
    field('src', 'text', 'URL'),
    field('title', 'text', 'Título acessível'),
    field('ratio', 'text', 'Proporção'),
    field('caption', 'textarea', 'Legenda'),
  ], { type: 'embed', src: '', title: '', ratio: '16 / 9' }),

  attachment: define('Arquivo', 'Mídia', [
    field('href', 'text', 'URL'),
    field('name', 'text', 'Nome'),
    field('format', 'text', 'Formato'),
    field('size', 'text', 'Tamanho'),
    field('download', 'toggle', 'Baixar ao clicar'),
  ], { type: 'attachment', href: '', name: '', download: true }),

  diagram: define('Diagrama', 'Mídia', [
    field('code', 'code', 'Definição'),
    field('align', 'select', 'Alinhamento', { options: ['left', 'center', 'right'] }),
    field('caption', 'textarea', 'Legenda'),
  ], { type: 'diagram', engine: 'mermaid', code: '', align: 'center' }),

  table: define('Tabela', 'Dados', [
    field('columns', 'array-string', 'Colunas'),
    field('rows', 'table', 'Linhas'),
  ], { type: 'table', columns: [], rows: [] }),

  chart: define('Gráfico', 'Dados', [
    field('variant', 'select', 'Visual', {
      options: ['line', 'bar', 'doughnut', 'pie', 'waterfall', 'sparkline'],
    }),
    field('labels', 'array-string', 'Rótulos'),
    arrayObject('datasets', 'Séries', [
      field('label', 'text', 'Nome'),
      field('data', 'array-number', 'Valores'),
      field('fill', 'toggle', 'Preencher área'),
    ]),
    arrayObject('items', 'Etapas do waterfall', [
      field('label', 'text', 'Rótulo'),
      field('value', 'number', 'Valor'),
      field('isTotal', 'toggle', 'É total'),
    ]),
    field('totalLabel', 'text', 'Rótulo do total'),
    field('data', 'array-number', 'Série compacta'),
    field('width', 'number', 'Largura compacta'),
    field('height', 'number', 'Altura'),
    field('caption', 'textarea', 'Legenda'),
  ], { type: 'chart', variant: 'bar', labels: [], datasets: [], height: 240 }),

  'metric-grid': define('Grade de métricas', 'Dados', [
    field('columns', 'number', 'Colunas'),
    arrayObject('items', 'Métricas', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('value', 'text', 'Valor'),
      field('change', 'text', 'Variação'),
      field('trend', 'select', 'Tendência', { options: ['up', 'flat', 'down'] }),
      field('reference', 'text', 'Referência'),
      field('note', 'text', 'Nota'),
      field('spark', 'array-number', 'Série'),
      field('details', 'object', 'Detalhamento'),
    ]),
    field('labels', 'key-value', 'Labels'),
  ], { type: 'metric-grid', columns: 3, items: [] }),

  scorecard: define('Lista de indicadores', 'Dados', [
    arrayObject('items', 'Indicadores', [
      field('id', 'text', 'ID estável'),
      field('state', 'text', 'Estado'),
      field('label', 'text', 'Rótulo'),
      field('value', 'text', 'Valor'),
      field('note', 'text', 'Nota'),
      field('details', 'object', 'Detalhamento'),
    ]),
  ], { type: 'scorecard', items: [] }),

  progress: define('Progresso', 'Dados', [
    field('label', 'text', 'Rótulo'),
    field('value', 'number', 'Percentual', { min: 0, max: 100 }),
    field('note', 'text', 'Nota'),
  ], { type: 'progress', label: '', value: 0 }),

  gauge: define('Medidor', 'Dados', [
    field('label', 'text', 'Rótulo'),
    field('value', 'number', 'Valor'),
    field('display', 'text', 'Valor exibido'),
    field('reference', 'text', 'Referência'),
    field('labels', 'key-value', 'Labels'),
  ], { type: 'gauge', label: '', value: 0 }),

  funnel: define('Funil de etapas', 'Dados', [
    arrayObject('steps', 'Etapas', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('value', 'number', 'Valor'),
      field('display', 'text', 'Valor exibido'),
    ]),
  ], { type: 'funnel', steps: [] }),

  breakdown: define('Composição', 'Dados', [
    field('total', 'number', 'Total'),
    field('totalDisplay', 'text', 'Total exibido'),
    field('totalLabel', 'text', 'Rótulo do total'),
    arrayObject('items', 'Itens', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('value', 'number', 'Valor'),
      field('display', 'text', 'Valor exibido'),
    ]),
  ], { type: 'breakdown', items: [] }),

  heatmap: define('Mapa de intensidade', 'Dados', [
    field('columns', 'array-string', 'Colunas'),
    field('showValues', 'toggle', 'Exibir valores'),
    field('max', 'number', 'Valor máximo'),
    arrayObject('rows', 'Linhas', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('values', 'array-number', 'Valores'),
    ]),
  ], { type: 'heatmap', columns: [], rows: [], showValues: true }),

  'quadrant-grid': define('Grade de quadrantes', 'Dados', [
    field('xAxis', 'text', 'Eixo horizontal'),
    field('yAxis', 'text', 'Eixo vertical'),
    arrayObject('quadrants', 'Quadrantes', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('items', 'array-string', 'Itens'),
    ]),
  ], { type: 'quadrant-grid', quadrants: [] }),

  ranking: define('Ranking', 'Dados', [
    arrayObject('items', 'Itens', [
      field('id', 'text', 'ID estável'),
      field('position', 'number', 'Posição'),
      field('label', 'text', 'Rótulo'),
      field('value', 'text', 'Valor'),
      field('change', 'text', 'Variação'),
      field('trend', 'select', 'Tendência', { options: ['up', 'flat', 'down'] }),
      field('details', 'object', 'Detalhamento'),
    ]),
  ], { type: 'ranking', items: [] }),

  'value-comparison': define('Comparação de valores', 'Dados', [
    field('variant', 'select', 'Visual', {
      options: [option('pair', 'Par'), option('table', 'Tabela')],
    }),
    field('before', 'object', 'Valor A', {
      itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor')],
    }),
    field('after', 'object', 'Valor B', {
      itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor')],
    }),
    arrayObject('columns', 'Colunas', [
      field('key', 'text', 'Chave'),
      field('label', 'text', 'Rótulo'),
    ]),
    field('rows', 'array-object', 'Linhas por chave'),
    field('note', 'textarea', 'Nota'),
  ], { type: 'value-comparison', variant: 'pair', before: {}, after: {}, rows: [] }),

  section: define('Seção', 'Organização', [
    field('heading', 'text', 'Título'),
    arrayObject('items', 'Itens', [
      field('id', 'text', 'ID estável'),
      field('title', 'text', 'Título'),
      field('badge', 'text', 'Rótulo'),
      field('description', 'textarea', 'Descrição'),
      field('showLabel', 'toggle', 'Exibir rótulo'),
      field('columns', 'number', 'Colunas'),
      field('blocks', 'array-object', 'Blocos'),
    ]),
  ], { type: 'section', heading: '', items: [] }, {
    placements: ['body'],
    renderer: 'body-section',
  }),

  divider: define('Divisor', 'Organização', [
    field('label', 'text', 'Rótulo'),
  ], { type: 'divider', label: '' }),

  'page-break': define('Quebra de página', 'Organização', [], { type: 'page-break' }, {
    placements: ['body'],
  }),

  'table-of-contents': define('Sumário automático', 'Organização', [
    field('heading', 'text', 'Título'),
    field('description', 'textarea', 'Descrição'),
  ], { type: 'table-of-contents', heading: 'Sumário' }, {
    placements: ['body'],
    renderer: 'body-table-of-contents',
  }),

  metadata: define('Metadados', 'Organização', [
    arrayObject('entries', 'Campos', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('value', 'text', 'Valor'),
    ]),
  ], { type: 'metadata', entries: [] }),

  references: define('Referências', 'Organização', [
    arrayObject('items', 'Referências', [
      field('id', 'text', 'ID estável'),
      field('title', 'text', 'Título'),
      field('href', 'text', 'Link'),
      field('source', 'text', 'Fonte'),
      field('note', 'text', 'Nota'),
    ]),
  ], { type: 'references', items: [] }),

  'related-content': define('Conteúdo relacionado', 'Organização', [
    field('heading', 'text', 'Título'),
    field('description', 'textarea', 'Descrição'),
    arrayObject('items', 'Conteúdos', [
      field('id', 'text', 'ID'),
      field('title', 'text', 'Título'),
      field('href', 'text', 'Link'),
      field('meta', 'text', 'Informação adicional'),
      field('newTab', 'toggle', 'Abrir em nova aba'),
    ]),
  ], { type: 'related-content', heading: 'Conteúdo relacionado', items: [] }, {
    placements: ['body'],
    renderer: 'body-related-content',
  }),

  trigger: define('Ação de detalhamento', 'Organização', [
    field('label', 'text', 'Rótulo'),
    field('details', 'object', 'Conteúdo'),
  ], { type: 'trigger', label: 'Ver detalhes', details: {} }),

  timeline: define('Linha do tempo', 'Planejamento', [
    field('presentation', 'select', 'Apresentação', {
      options: [option('standard', 'Padrão'), option('compact', 'Compacta')],
    }),
    arrayObject('items', 'Eventos', [
      field('id', 'text', 'ID estável'),
      field('date', 'text', 'Data'),
      field('state', 'text', 'Estado'),
      field('title', 'text', 'Título'),
      field('text', 'textarea', 'Descrição'),
    ]),
  ], { type: 'timeline', presentation: 'standard', items: [] }),

  'schedule-list': define('Lista de horários', 'Planejamento', [
    arrayObject('items', 'Entradas', [
      field('id', 'text', 'ID estável'),
      field('time', 'text', 'Horário'),
      field('title', 'text', 'Título'),
      field('text', 'textarea', 'Descrição'),
      field('active', 'toggle', 'Destacar'),
      field('fields', 'array-object', 'Campos extras'),
      field('details', 'object', 'Detalhamento'),
    ]),
    field('detailLabel', 'text', 'Rótulo do detalhamento'),
  ], { type: 'schedule-list', items: [] }),

  calendar: define('Calendário', 'Planejamento', [
    field('view', 'select', 'Visualização', { options: ['month', 'week', 'year'] }),
    field('date', 'date', 'Data de referência'),
    arrayObject('items', 'Entradas', [
      field('id', 'text', 'ID estável'),
      field('date', 'date', 'Data'),
      field('label', 'text', 'Rótulo'),
      field('title', 'text', 'Título'),
      field('time', 'text', 'Horário'),
      field('text', 'textarea', 'Descrição'),
      field('value', 'number', 'Valor'),
      field('items', 'array-object', 'Itens aninhados'),
    ]),
    field('labels', 'key-value', 'Rótulos'),
  ], { type: 'calendar', view: 'month', items: [] }),

  board: define('Quadro', 'Planejamento', [
    field('presentation', 'select', 'Apresentação', {
      options: [option('standard', 'Padrão'), option('compact', 'Compacta')],
    }),
    field('detailLabel', 'text', 'Rótulo do detalhamento'),
    arrayObject('columns', 'Colunas', [
      field('id', 'text', 'ID estável'),
      field('title', 'text', 'Título'),
      arrayObject('items', 'Itens', [
        field('id', 'text', 'ID estável'),
        field('title', 'text', 'Título'),
        field('text', 'textarea', 'Descrição'),
        field('badge', 'text', 'Rótulo'),
        field('meta', 'text', 'Informação adicional'),
        field('fields', 'array-object', 'Campos'),
        field('details', 'object', 'Detalhamento'),
      ]),
    ]),
  ], { type: 'board', presentation: 'standard', columns: [] }),

  checklist: define('Checklist', 'Planejamento', [
    field('persist', 'toggle', 'Persistir marcações'),
    field('labels', 'key-value', 'Rótulos'),
    arrayObject('items', 'Itens', [
      field('id', 'text', 'ID estável'),
      field('text', 'text', 'Texto'),
      field('checked', 'toggle', 'Marcado'),
    ]),
  ], { type: 'checklist', persist: true, items: [] }),

  'task-table': define('Tabela de itens', 'Planejamento', [
    arrayObject('columns', 'Colunas', [
      field('key', 'text', 'Chave'),
      field('label', 'text', 'Rótulo'),
      field('kind', 'select', 'Visual', { options: ['text', 'status', 'priority'] }),
    ]),
    field('items', 'array-object', 'Itens'),
  ], { type: 'task-table', columns: [], items: [] }),

  relations: define('Relações', 'Planejamento', [
    field('relationLabel', 'text', 'Rótulo da relação'),
    arrayObject('items', 'Relações', [
      field('id', 'text', 'ID estável'),
      field('from', 'text', 'Origem'),
      field('to', 'text', 'Destino'),
      field('note', 'text', 'Nota'),
    ]),
  ], { type: 'relations', relationLabel: 'relaciona-se com', items: [] }),

  'progress-summary': define('Resumo de progresso', 'Planejamento', [
    field('label', 'text', 'Rótulo'),
    field('progress', 'number', 'Progresso', { min: 0, max: 100 }),
    arrayObject('groups', 'Grupos', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('items', 'array-string', 'Itens'),
    ]),
  ], { type: 'progress-summary', label: '', progress: 0, groups: [] }),

  'grouped-change-list': define('Lista de mudanças', 'Planejamento', [
    arrayObject('groups', 'Grupos', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('date', 'text', 'Data'),
      arrayObject('items', 'Mudanças', [
        field('id', 'text', 'ID estável'),
        field('label', 'text', 'Rótulo'),
        field('tone', 'select', 'Tom', { options: ['neutral', 'positive', 'warning', 'negative'] }),
        field('text', 'textarea', 'Texto'),
      ]),
    ]),
  ], { type: 'grouped-change-list', groups: [] }),

  'people-list': define('Lista de perfis', 'Registros', [
    arrayObject('people', 'Perfis', [
      field('id', 'text', 'ID estável'),
      field('avatar', 'image', 'Avatar'),
      field('name', 'text', 'Nome'),
      field('subtitle', 'text', 'Subtítulo'),
      field('group', 'text', 'Grupo'),
      field('meta', 'text', 'Informação adicional'),
      field('details', 'object', 'Detalhamento'),
    ]),
  ], { type: 'people-list', people: [] }),

  'grouped-summary': define('Resumo agrupado', 'Registros', [
    arrayObject('groups', 'Grupos', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('content', 'textarea', 'Texto'),
      field('items', 'array-string', 'Itens'),
    ]),
  ], { type: 'grouped-summary', groups: [] }),

  'record-card': define('Cartão de registro', 'Registros', [
    field('badge', 'text', 'Rótulo curto'),
    field('title', 'text', 'Título'),
    field('date', 'text', 'Data'),
    field('text', 'textarea', 'Descrição'),
    arrayObject('fields', 'Campos', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('value', 'text', 'Valor'),
    ]),
    field('actionsLabel', 'text', 'Rótulo das ações'),
    field('actions', 'array-string', 'Ações'),
  ], { type: 'record-card', title: '', fields: [], actions: [] }),

  'step-list': define('Sequência de etapas', 'Registros', [
    field('introLabel', 'text', 'Rótulo da introdução'),
    field('intro', 'textarea', 'Introdução'),
    arrayObject('steps', 'Etapas', [
      field('id', 'text', 'ID estável'),
      field('label', 'text', 'Rótulo'),
      field('text', 'textarea', 'Texto'),
    ]),
    field('conclusionLabel', 'text', 'Rótulo da conclusão'),
    field('conclusion', 'textarea', 'Conclusão'),
  ], { type: 'step-list', steps: [] }),

  indicator: define('Indicador', 'Indicadores', [
    field('kind', 'select', 'Visual', {
      options: ['status', 'priority', 'trend', 'health', 'confidence', 'freshness'],
    }),
    field('value', 'text', 'Valor'),
    field('label', 'text', 'Rótulo'),
  ], { type: 'indicator', kind: 'status', value: '' }),
})

export const BLOCK_CATEGORIES = [...new Set(Object.values(BLOCK_MANIFEST).map((entry) => entry.category))]

export const BLOCK_FAMILIES = Object.freeze(
  Object.entries(BLOCK_MANIFEST).reduce((families, [type, definition]) => {
    const family = definition.family
    if (!families[family]) families[family] = []
    families[family].push(type)
    return families
  }, {}),
)

export const CANONICAL_BLOCK_TYPES = new Set(Object.keys(BLOCK_MANIFEST))

export function getBlockDefinition(type) {
  return BLOCK_MANIFEST[type] ?? null
}

export function createBlock(type) {
  const definition = getBlockDefinition(type)
  if (!definition) throw new Error(`Tipo de bloco não suportado: ${type}`)
  return definition.defaultValue()
}

export function isKnownBlockType(type) {
  return Boolean(type) && CANONICAL_BLOCK_TYPES.has(type)
}

export function isCanonicalBlockType(type) {
  return CANONICAL_BLOCK_TYPES.has(type)
}

export function supportsPublicationMode(definition, mode) {
  return definition?.supportedModes?.includes(mode) ?? false
}

export function blockPlacements(type) {
  return getBlockDefinition(type)?.placements ?? []
}

export function getBlockRenderer(type) {
  return getBlockDefinition(type)?.renderer ?? null
}

export function assertRendererCoverage(rendererKeys, placement) {
  const available = new Set(rendererKeys)
  const missing = Object.entries(BLOCK_MANIFEST)
    .filter(([, definition]) => definition.placements.includes(placement))
    .filter(([, definition]) => !available.has(definition.renderer))
    .map(([type, definition]) => `${type} → ${definition.renderer}`)

  if (missing.length) {
    throw new Error(`Renderizadores ausentes para ${placement}: ${missing.join(', ')}`)
  }
}

export function describeBlockCatalog(mode = 'report') {
  const describeField = ({ key, type, label, options, itemFields, min, max, hint }) => ({
    key,
    type,
    label,
    ...(options ? { options } : {}),
    ...(itemFields ? { itemFields: itemFields.map(describeField) } : {}),
    ...(min != null ? { min } : {}),
    ...(max != null ? { max } : {}),
    ...(hint ? { hint } : {}),
  })

  return Object.entries(BLOCK_MANIFEST)
    .filter(([, definition]) => supportsPublicationMode(definition, mode))
    .map(([type, definition]) => ({
      type,
      label: definition.label,
      category: definition.category,
      family: definition.family,
      supportedModes: definition.supportedModes,
      placements: definition.placements,
      renderer: definition.renderer,
      variants: definition.variants,
      fields: definition.fields.map(describeField),
    }))
}

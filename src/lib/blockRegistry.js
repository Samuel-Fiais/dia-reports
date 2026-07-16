const field = (key, type, label, extra = {}) => ({ key, type, label, ...extra })

const commonFields = [
  field('span', 'select', 'Largura no item', { options: [
    { value: '', label: 'Automática' }, { value: '1', label: '1 coluna' },
    { value: '2', label: '2 colunas' }, { value: '3', label: '3 colunas' },
    { value: 'full', label: 'Largura total' },
  ] }),
]

const simple = (label, category, fields, defaults = {}) => ({
  label,
  category,
  fields: [...fields, ...commonFields],
  defaultValue: () => ({ type: defaults.type, ...defaults }),
})

const textItem = [field('text', 'textarea', 'Texto')]
const titledItems = (itemFields = [field('title', 'text', 'Título'), field('text', 'textarea', 'Texto')]) =>
  field('items', 'array-object', 'Itens', { itemFields })

const CORE_TYPES = {
  'quote-break': simple('Quebra com citação', 'Estrutura', [field('text', 'textarea', 'Citação'), field('cite', 'text', 'Fonte')], { type: 'quote-break', text: '' }),
  'image-break': simple('Quebra com imagem', 'Estrutura', [field('src', 'image', 'Imagem/URL'), field('alt', 'text', 'Texto alternativo'), field('caption', 'textarea', 'Legenda')], { type: 'image-break', src: '', alt: '' }),
  'table-of-contents': simple('Sumário automático', 'Estrutura', [field('heading', 'text', 'Título'), field('description', 'textarea', 'Descrição')], { type: 'table-of-contents', heading: 'Sumário' }),
  'related-reports': simple('Relatórios relacionados', 'Estrutura', [field('heading', 'text', 'Título'), field('description', 'textarea', 'Descrição'), field('ids', 'array-string', 'IDs dos relatórios')], { type: 'related-reports', ids: [] }),
  paragraph: simple('Parágrafo', 'Conteúdo', textItem, { type: 'paragraph', text: '' }),
  bullets: simple('Lista', 'Conteúdo', [
    field('style', 'select', 'Estilo', { options: [{ value: '', label: 'Marcadores' }, { value: 'number', label: 'Numerada' }] }),
    field('items', 'array-string', 'Itens'),
  ], { type: 'bullets', items: [] }),
  table: simple('Tabela', 'Análise', [field('columns', 'array-string', 'Colunas'), field('rows', 'table', 'Linhas')], { type: 'table', columns: [], rows: [] }),
  chart: simple('Gráfico', 'Análise', [
    field('variant', 'select', 'Tipo', { options: ['line', 'bar', 'doughnut', 'pie'] }),
    field('labels', 'array-string', 'Rótulos'),
    field('datasets', 'array-object', 'Séries', { itemFields: [field('label', 'text', 'Nome'), field('data', 'array-number', 'Valores'), field('fill', 'toggle', 'Preencher área')] }),
    field('height', 'number', 'Altura'), field('figure', 'text', 'Referência'), field('caption', 'textarea', 'Legenda'),
  ], { type: 'chart', variant: 'bar', labels: [], datasets: [], height: 240 }),
  image: simple('Imagem', 'Mídia', [field('src', 'image', 'Imagem/URL'), field('alt', 'text', 'Texto alternativo'), field('figure', 'text', 'Referência'), field('caption', 'textarea', 'Legenda')], { type: 'image', src: '', alt: '' }),
  gallery: simple('Galeria', 'Mídia', [field('items', 'array-object', 'Imagens', { itemFields: [field('src', 'image', 'Imagem/URL'), field('alt', 'text', 'Texto alternativo'), field('caption', 'text', 'Legenda')] })], { type: 'gallery', items: [] }),
  'before-after-image': simple('Antes e depois', 'Mídia', [field('before', 'image', 'Antes'), field('after', 'image', 'Depois'), field('beforeLabel', 'text', 'Rótulo antes'), field('afterLabel', 'text', 'Rótulo depois'), field('caption', 'textarea', 'Legenda')], { type: 'before-after-image', before: '', after: '', beforeLabel: 'Antes', afterLabel: 'Depois' }),
  blockquote: simple('Citação editorial', 'Conteúdo', [field('text', 'textarea', 'Citação'), field('author', 'text', 'Autor'), field('cite', 'text', 'Fonte')], { type: 'blockquote', text: '' }),
  quote: simple('Citação', 'Conteúdo', [field('text', 'textarea', 'Citação'), field('cite', 'text', 'Fonte')], { type: 'quote', text: '' }),
  code: simple('Código', 'Conteúdo', [field('code', 'code', 'Código')], { type: 'code', code: '' }),
  callout: simple('Destaque', 'Conteúdo', [field('kind', 'select', 'Tipo', { options: ['note', 'info', 'warning', 'success', 'danger'] }), field('label', 'text', 'Rótulo'), field('text', 'textarea', 'Texto')], { type: 'callout', kind: 'note', label: 'Nota', text: '' }),
  divider: simple('Divisor', 'Estrutura', [field('label', 'text', 'Rótulo')], { type: 'divider', label: '' }),
  progress: simple('Progresso', 'Plano', [field('label', 'text', 'Rótulo'), field('value', 'number', 'Percentual', { min: 0, max: 100 }), field('note', 'text', 'Nota')], { type: 'progress', label: 'Progresso', value: 0 }),
  timeline: simple('Linha do tempo', 'Plano', [field('variant', 'select', 'Visual', { options: [{ value: '', label: 'Completo' }, { value: 'compact', label: 'Compacto' }] }), titledItems([field('date', 'text', 'Data', { hint: 'Use um padrão editorial, como 08 jul.' }), field('status', 'select', 'Status', { options: [{ value: '', label: 'Sem status' }, 'not-started', 'in-progress', 'done', 'blocked'] }), field('title', 'text', 'Título'), field('text', 'textarea', 'Descrição')])], { type: 'timeline', items: [] }),
  todo: simple('Lista de tarefas', 'Plano', [field('items', 'array-object', 'Tarefas', { itemFields: [field('text', 'text', 'Tarefa'), field('done', 'toggle', 'Concluída')] })], { type: 'todo', items: [] }),
  'kpi-grid': simple('Grade de KPIs', 'Análise', [field('columns', 'number', 'Colunas'), field('items', 'array-object', 'Indicadores', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor'), field('change', 'text', 'Variação'), field('target', 'text', 'Meta'), field('note', 'text', 'Nota')] })], { type: 'kpi-grid', columns: 3, items: [] }),
  'stat-comparison': simple('Antes e depois', 'Comparação', [field('before', 'object', 'Antes', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor')] }), field('after', 'object', 'Depois', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor')] }), field('note', 'textarea', 'Nota')], { type: 'stat-comparison', before: { label: 'Antes', value: '' }, after: { label: 'Depois', value: '' } }),
  slack: simple('Mensagem do Slack', 'Conteúdo', [field('name', 'text', 'Nome'), field('author', 'text', 'Autor alternativo'), field('channel', 'text', 'Canal'), field('time', 'text', 'Data/hora'), field('timestamp', 'text', 'Horário alternativo'), field('text', 'textarea', 'Mensagem'), field('avatar', 'image', 'Avatar'), field('href', 'text', 'Link')], { type: 'slack', name: '', channel: '', text: '' }),
  definition: simple('Definição', 'Conteúdo', [field('term', 'text', 'Termo'), field('text', 'textarea', 'Definição')], { type: 'definition', term: '', text: '' }),
  glossary: simple('Glossário', 'Conteúdo', [field('items', 'array-object', 'Termos', { itemFields: [field('term', 'text', 'Termo'), field('text', 'textarea', 'Definição')] })], { type: 'glossary', items: [] }),
  accordion: simple('Sanfona', 'Estrutura', [titledItems()], { type: 'accordion', items: [] }),
  tabs: simple('Abas', 'Estrutura', [field('tabs', 'array-object', 'Abas', { itemFields: [field('label', 'text', 'Rótulo'), field('text', 'textarea', 'Conteúdo')] })], { type: 'tabs', tabs: [] }),
  'executive-summary': simple('Resumo executivo', 'Estrutura', [field('title', 'text', 'Título'), field('text', 'textarea', 'Resumo'), field('items', 'array-string', 'Destaques')], { type: 'executive-summary', title: 'Resumo executivo', text: '' }),
  decision: simple('Decisão', 'Estrutura', [field('title', 'text', 'Decisão'), field('text', 'textarea', 'Contexto'), field('owner', 'text', 'Responsável'), field('date', 'date', 'Data'), field('status', 'text', 'Status')], { type: 'decision', title: '', text: '' }),
  'comparison-table': simple('Tabela comparativa', 'Comparação', [field('columns', 'array-string', 'Opções'), field('rows', 'table', 'Critérios e valores')], { type: 'comparison-table', columns: [], rows: [] }),
  'pros-cons': simple('Prós e contras', 'Comparação', [field('pros', 'array-string', 'Prós'), field('cons', 'array-string', 'Contras')], { type: 'pros-cons', pros: [], cons: [] }),
  swot: simple('Matriz SWOT', 'Comparação', [field('strengths', 'array-string', 'Forças'), field('weaknesses', 'array-string', 'Fraquezas'), field('opportunities', 'array-string', 'Oportunidades'), field('threats', 'array-string', 'Ameaças')], { type: 'swot', strengths: [], weaknesses: [], opportunities: [], threats: [] }),
  milestones: simple('Marcos', 'Plano', [field('items', 'array-object', 'Marcos', { itemFields: [field('date', 'date', 'Data'), field('title', 'text', 'Título'), field('text', 'textarea', 'Descrição'), field('status', 'text', 'Status')] })], { type: 'milestones', items: [] }),
  roadmap: simple('Roadmap', 'Plano', [field('lanes', 'array-object', 'Horizontes', { itemFields: [field('label', 'text', 'Nome'), field('items', 'array-string', 'Iniciativas')] }), field('now', 'array-object', 'Agora (formato clássico)', { itemFields: [field('title', 'text', 'Título'), field('tag', 'text', 'Tag')] }), field('next', 'array-object', 'Próximo (formato clássico)', { itemFields: [field('title', 'text', 'Título'), field('tag', 'text', 'Tag')] }), field('later', 'array-object', 'Futuro (formato clássico)', { itemFields: [field('title', 'text', 'Título'), field('tag', 'text', 'Tag')] })], { type: 'roadmap', lanes: [] }),
  okr: simple('OKR', 'Plano', [field('objective', 'textarea', 'Objetivo'), field('keyResults', 'array-object', 'Resultados-chave', { itemFields: [field('title', 'text', 'Resultado'), field('progress', 'number', 'Progresso')] })], { type: 'okr', objective: '', keyResults: [] }),
  gauge: simple('Medidor', 'Análise', [field('label', 'text', 'Rótulo'), field('value', 'number', 'Valor'), field('display', 'text', 'Valor exibido'), field('target', 'text', 'Meta')], { type: 'gauge', label: '', value: 0 }),
  funnel: simple('Funil', 'Análise', [field('steps', 'array-object', 'Etapas', { itemFields: [field('label', 'text', 'Etapa'), field('value', 'number', 'Valor'), field('display', 'text', 'Valor exibido')] })], { type: 'funnel', steps: [] }),
}

const GENERIC_CORE = {
  'distribution': 'Análise', 'waterfall-chart': 'Análise', 'embed': 'Mídia', video: 'Mídia', 'file-attachment': 'Mídia',
  email: 'Conteúdo', testimonial: 'Conteúdo', conversation: 'Conteúdo', faq: 'Estrutura', details: 'Estrutura', appendix: 'Estrutura',
  'metric-detail': 'Análise', scorecard: 'Análise', heatmap: 'Análise', cohort: 'Análise', matrix: 'Análise', ranking: 'Análise', variance: 'Análise', benchmark: 'Análise', breakdown: 'Análise', sparkline: 'Análise',
  'key-takeaways': 'Estrutura', assumptions: 'Estrutura', 'action-items': 'Plano', recommendations: 'Plano', blockers: 'Plano', 'risk-register': 'Plano', references: 'Estrutura', 'report-metadata': 'Estrutura', 'page-break': 'Estrutura',
  tradeoffs: 'Comparação', 'option-cards': 'Comparação', 'scenario-comparison': 'Comparação', dependencies: 'Plano', 'status-summary': 'Plano', 'project-health': 'Plano', 'release-notes': 'Plano', changelog: 'Plano',
  'person-card': 'Pessoas', 'team-list': 'Pessoas', 'meeting-notes': 'Conteúdo', 'incident-summary': 'Operações', 'root-cause': 'Operações', kanban: 'Plano', agenda: 'Plano', gantt: 'Plano', countdown: 'Plano', 'date-strip': 'Plano',
  'calendar-month': 'Calendário', 'calendar-week': 'Calendário', 'calendar-year': 'Calendário', 'status-badge': 'Indicadores', 'priority-badge': 'Indicadores', 'trend-indicator': 'Indicadores', 'health-indicator': 'Indicadores', confidence: 'Indicadores', freshness: 'Indicadores', drilldown: 'Estrutura',
}

const labelFor = (type) => type.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
const genericFields = [field('title', 'text', 'Título'), field('label', 'text', 'Rótulo'), field('summary', 'textarea', 'Resumo'), field('text', 'textarea', 'Texto'), field('status', 'text', 'Status'), field('items', 'array-object', 'Itens', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor'), field('text', 'textarea', 'Texto'), field('status', 'text', 'Status')] }), ...commonFields]

const taskItems = (extra) => field('items', 'array-object', 'Itens', { itemFields: [
  field('title', 'text', 'Título'), ...(extra ? [field(extra, 'text', extra === 'mitigation' ? 'Mitigação' : 'Impacto')] : []),
  field('owner', 'text', 'Responsável'), field('due', 'text', 'Prazo'),
  field('priority', 'select', 'Prioridade', { options: ['low', 'medium', 'high', 'critical'] }),
  field('status', 'text', 'Status'),
] })

const RICH_CORE_TYPES = {
  accordion: simple('Sanfona', 'Estrutura', [field('items', 'array-object', 'Painéis', { itemFields: [field('title', 'text', 'Título'), field('text', 'textarea', 'Conteúdo'), field('open', 'toggle', 'Aberto inicialmente')] })], { type: 'accordion', items: [] }),
  tabs: simple('Abas', 'Estrutura', [field('orientation', 'select', 'Orientação', { options: [{ value: '', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] }), field('tabs', 'array-object', 'Abas', { itemFields: [field('label', 'text', 'Rótulo'), field('text', 'textarea', 'Texto'), field('items', 'array-string', 'Lista')] })], { type: 'tabs', tabs: [] }),
  'waterfall-chart': simple('Gráfico waterfall', 'Análise', [field('items', 'array-object', 'Etapas', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'number', 'Valor ou variação', { hint: 'Use valor negativo para reduções. Em totais, informe o valor absoluto.' }), field('isTotal', 'toggle', 'É um total')] }), field('height', 'number', 'Altura'), field('caption', 'textarea', 'Legenda')], { type: 'waterfall-chart', items: [], height: 240 }),
  mermaid: simple('Diagrama Mermaid', 'Análise', [field('code', 'code', 'Definição Mermaid'), field('align', 'select', 'Alinhamento', { options: ['left', 'center', 'right'] }), field('caption', 'textarea', 'Legenda')], { type: 'mermaid', code: 'flowchart LR\n  A[Início] --> B[Fim]', align: 'center' }),
  embed: simple('Conteúdo incorporado', 'Mídia', [field('src', 'text', 'URL'), field('title', 'text', 'Título acessível'), field('ratio', 'text', 'Proporção'), field('caption', 'textarea', 'Legenda')], { type: 'embed', src: '', title: '', ratio: '16 / 9' }),
  video: simple('Vídeo', 'Mídia', [field('src', 'text', 'URL do vídeo'), field('poster', 'image', 'Capa'), field('caption', 'textarea', 'Legenda')], { type: 'video', src: '' }),
  'file-attachment': simple('Arquivo anexo', 'Mídia', [field('href', 'text', 'URL do arquivo'), field('name', 'text', 'Nome'), field('format', 'text', 'Formato'), field('size', 'text', 'Tamanho'), field('download', 'toggle', 'Baixar ao clicar', { defaultValue: true })], { type: 'file-attachment', href: '', name: 'arquivo.pdf', download: true }),
  email: simple('Trecho de e-mail', 'Conteúdo', [field('fromAddr', 'text', 'De'), field('to', 'text', 'Para'), field('subject', 'text', 'Assunto'), field('date', 'text', 'Data'), field('text', 'textarea', 'Mensagem')], { type: 'email', fromAddr: '', subject: '', text: '' }),
  testimonial: simple('Depoimento', 'Conteúdo', [field('text', 'textarea', 'Depoimento'), field('author', 'text', 'Autor'), field('role', 'text', 'Cargo')], { type: 'testimonial', text: '', author: '' }),
  conversation: simple('Conversa', 'Conteúdo', [field('messages', 'array-object', 'Mensagens', { itemFields: [field('author', 'text', 'Autor'), field('time', 'text', 'Horário'), field('text', 'textarea', 'Mensagem')] })], { type: 'conversation', messages: [] }),
  agenda: simple('Agenda', 'Plano', [field('clickable', 'toggle', 'Abrir detalhes ao clicar', { defaultValue: true }), field('items', 'array-object', 'Compromissos', { itemFields: [field('time', 'text', 'Horário'), field('title', 'text', 'Título'), field('text', 'textarea', 'Descrição'), field('location', 'text', 'Local'), field('participants', 'array-string', 'Participantes'), field('active', 'toggle', 'Em destaque')] })], { type: 'agenda', clickable: true, items: [] }),
  kanban: simple('Kanban', 'Plano', [field('variant', 'select', 'Visual', { options: [{ value: '', label: 'Completo' }, { value: 'compact', label: 'Compacto' }] }), field('clickable', 'toggle', 'Abrir detalhes ao clicar', { defaultValue: true }), field('columns', 'array-object', 'Colunas', { itemFields: [field('title', 'text', 'Título'), field('cards', 'array-object', 'Cartões', { itemFields: [field('title', 'text', 'Título'), field('description', 'textarea', 'Descrição'), field('tag', 'text', 'Tag'), field('priority', 'select', 'Prioridade', { options: ['low', 'medium', 'high', 'critical'] }), field('assignee', 'text', 'Responsável'), field('due', 'text', 'Prazo')] })] })], { type: 'kanban', clickable: true, columns: [] }),
  gantt: simple('Gantt', 'Plano', [field('startLabel', 'text', 'Início exibido'), field('endLabel', 'text', 'Fim exibido'), field('tasks', 'array-object', 'Tarefas', { itemFields: [field('title', 'text', 'Título'), field('start', 'date', 'Início'), field('end', 'date', 'Fim'), field('status', 'select', 'Status', { options: ['not-started', 'in-progress', 'done', 'blocked'] })] })], { type: 'gantt', tasks: [] }),
  countdown: simple('Contagem regressiva', 'Plano', [field('target', 'datetime-local', 'Data-alvo'), field('units', 'multi-toggle', 'Unidades', { options: [{ value: 'years', label: 'Anos' }, { value: 'months', label: 'Meses' }, { value: 'weeks', label: 'Semanas' }, { value: 'days', label: 'Dias' }, { value: 'hours', label: 'Horas' }, { value: 'minutes', label: 'Minutos' }, { value: 'seconds', label: 'Segundos' }] }), field('label', 'text', 'Conector'), field('eventLabel', 'text', 'Evento'), field('pastLabel', 'text', 'Texto após a data')], { type: 'countdown', target: new Date(Date.now() + 86400000).toISOString(), units: ['days', 'hours'], label: 'até', eventLabel: 'o evento' }),
  'date-strip': simple('Faixa de datas', 'Plano', [field('items', 'array-object', 'Datas', { itemFields: [field('date', 'text', 'Data'), field('label', 'text', 'Rótulo'), field('active', 'toggle', 'Ativa')] })], { type: 'date-strip', items: [] }),
  'calendar-month': simple('Calendário mensal', 'Calendário', [field('month', 'month', 'Mês'), field('variant', 'select', 'Visual', { options: ['detailed', 'compact'] }), field('title', 'text', 'Título opcional'), field('today', 'date', 'Dia destacado'), field('maxPerDay', 'number', 'Eventos por dia'), field('clickable', 'toggle', 'Abrir eventos ao clicar', { defaultValue: true }), field('events', 'array-object', 'Eventos', { itemFields: [field('date', 'date', 'Data'), field('time', 'text', 'Horário'), field('title', 'text', 'Título'), field('text', 'textarea', 'Descrição')] }), field('marks', 'array-object', 'Marcações compactas', { itemFields: [field('date', 'date', 'Data'), field('label', 'text', 'Rótulo')] })], { type: 'calendar-month', month: new Date().toISOString().slice(0, 7), variant: 'detailed', maxPerDay: 2, clickable: true, events: [] }),
  'calendar-week': simple('Calendário semanal', 'Calendário', [field('clickable', 'toggle', 'Abrir eventos ao clicar', { defaultValue: true }), field('days', 'array-object', 'Dias', { itemFields: [field('label', 'text', 'Dia'), field('active', 'toggle', 'Dia atual'), field('items', 'array-object', 'Eventos', { itemFields: [field('time', 'text', 'Horário'), field('title', 'text', 'Título'), field('text', 'textarea', 'Descrição')] })] })], { type: 'calendar-week', clickable: true, days: [] }),
  'calendar-year': simple('Calendário anual', 'Calendário', [field('year', 'number', 'Ano'), field('variant', 'select', 'Visual', { options: [{ value: 'dots', label: 'Marcações' }, { value: 'heatmap', label: 'Mapa de calor' }] }), field('max', 'number', 'Intensidade máxima'), field('clickable', 'toggle', 'Abrir marcações ao clicar', { defaultValue: true }), field('marks', 'array-object', 'Marcações', { itemFields: [field('date', 'date', 'Data'), field('label', 'text', 'Rótulo')] }), field('values', 'key-value', 'Valores do heatmap', { keyType: 'date', valueType: 'number' })], { type: 'calendar-year', year: new Date().getFullYear(), variant: 'dots', clickable: true, marks: [], values: {} }),
  'metric-detail': simple('Métrica detalhada', 'Análise', [field('metric', 'object', 'Métrica', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor'), field('target', 'text', 'Meta'), field('trend', 'select', 'Tendência', { options: ['up', 'down', 'flat'] }), field('change', 'text', 'Variação'), field('note', 'textarea', 'Nota'), field('spark', 'array-number', 'Série')] })], { type: 'metric-detail', metric: { label: '', value: '' } }),
  'kpi-grid': simple('Grade de KPIs', 'Análise', [field('columns', 'number', 'Colunas'), field('items', 'array-object', 'Indicadores', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor'), field('spark', 'array-number', 'Série'), field('trend', 'select', 'Tendência', { options: ['up', 'down', 'flat'] }), field('change', 'text', 'Variação'), field('target', 'text', 'Meta'), field('note', 'text', 'Nota')] })], { type: 'kpi-grid', columns: 3, items: [] }),
  scorecard: simple('Scorecard', 'Análise', [field('items', 'array-object', 'Indicadores', { itemFields: [field('health', 'select', 'Saúde', { options: ['healthy', 'attention', 'critical'] }), field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor'), field('note', 'text', 'Nota')] })], { type: 'scorecard', items: [] }),
  heatmap: simple('Mapa de calor', 'Análise', [field('columns', 'array-string', 'Colunas'), field('showValues', 'toggle', 'Exibir valores'), field('max', 'number', 'Valor máximo'), field('rows', 'array-object', 'Linhas', { itemFields: [field('label', 'text', 'Rótulo'), field('values', 'array-number', 'Valores')] })], { type: 'heatmap', columns: [], rows: [], showValues: true }),
  matrix: simple('Matriz', 'Análise', [field('xAxis', 'text', 'Eixo horizontal'), field('yAxis', 'text', 'Eixo vertical'), field('quadrants', 'array-object', 'Quadrantes', { itemFields: [field('label', 'text', 'Rótulo'), field('items', 'array-string', 'Itens')] })], { type: 'matrix', xAxis: 'Esforço', yAxis: 'Impacto', quadrants: [] }),
  ranking: simple('Ranking', 'Análise', [field('items', 'array-object', 'Posições', { itemFields: [field('position', 'number', 'Posição'), field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor'), field('trend', 'select', 'Tendência', { options: ['up', 'down', 'flat'] }), field('change', 'text', 'Variação')] })], { type: 'ranking', items: [] }),
  variance: simple('Realizado versus esperado', 'Análise', [field('dimension', 'text', 'Dimensão'), field('actualLabel', 'text', 'Rótulo realizado'), field('expectedLabel', 'text', 'Rótulo esperado'), field('deltaLabel', 'text', 'Rótulo diferença'), field('rows', 'array-object', 'Linhas', { itemFields: [field('label', 'text', 'Rótulo'), field('actual', 'text', 'Realizado'), field('expected', 'text', 'Esperado'), field('delta', 'text', 'Diferença')] })], { type: 'variance', rows: [] }),
  breakdown: simple('Detalhamento', 'Análise', [field('total', 'number', 'Total numérico'), field('totalDisplay', 'text', 'Total exibido'), field('totalLabel', 'text', 'Rótulo do total'), field('items', 'array-object', 'Partes', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'number', 'Valor'), field('display', 'text', 'Valor exibido')] })], { type: 'breakdown', items: [] }),
  sparkline: simple('Minigráfico', 'Análise', [field('data', 'array-number', 'Valores'), field('width', 'number', 'Largura'), field('height', 'number', 'Altura')], { type: 'sparkline', data: [], width: 180, height: 40 }),
  'executive-summary': simple('Resumo executivo', 'Estrutura', [field('context', 'array-string', 'Contexto'), field('findings', 'array-string', 'Conclusões'), field('risks', 'array-string', 'Riscos'), field('recommendations', 'array-string', 'Recomendações')], { type: 'executive-summary', context: [], findings: [], risks: [], recommendations: [] }),
  'key-takeaways': simple('Principais aprendizados', 'Estrutura', [field('items', 'array-string', 'Aprendizados')], { type: 'key-takeaways', items: [] }),
  decision: simple('Decisão', 'Estrutura', [field('title', 'text', 'Decisão'), field('rationale', 'textarea', 'Justificativa'), field('date', 'text', 'Data'), field('owner', 'text', 'Responsável'), field('participants', 'array-string', 'Participantes'), field('confidence', 'number', 'Confiança', { min: 0, max: 100 })], { type: 'decision', title: '', rationale: '', participants: [] }),
  'action-items': simple('Plano de ação', 'Plano', [taskItems()], { type: 'action-items', items: [] }),
  recommendations: simple('Recomendações', 'Plano', [taskItems('impact')], { type: 'recommendations', items: [] }),
  blockers: simple('Bloqueios', 'Plano', [taskItems('impact')], { type: 'blockers', items: [] }),
  'risk-register': simple('Registro de riscos', 'Plano', [taskItems('mitigation')], { type: 'risk-register', items: [] }),
  references: simple('Referências', 'Estrutura', [field('items', 'array-object', 'Fontes', { itemFields: [field('title', 'text', 'Título'), field('href', 'text', 'Link'), field('source', 'text', 'Fonte'), field('note', 'text', 'Nota')] })], { type: 'references', items: [] }),
  'report-metadata': simple('Ficha do relatório', 'Estrutura', [field('author', 'text', 'Autor'), field('version', 'text', 'Versão'), field('status', 'text', 'Status'), field('updated', 'text', 'Atualizado em'), field('period', 'text', 'Período'), field('extra', 'array-object', 'Campos extras', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor')] })], { type: 'report-metadata', extra: [] }),
  'page-break': simple('Quebra de página', 'Estrutura', [], { type: 'page-break' }),
  'comparison-table': simple('Tabela comparativa', 'Comparação', [field('options', 'array-string', 'Opções'), field('highlightColumn', 'number', 'Coluna recomendada (começa em 0)'), field('rows', 'array-object', 'Critérios', { itemFields: [field('label', 'text', 'Critério'), field('values', 'array-string', 'Valores')] })], { type: 'comparison-table', options: [], rows: [] }),
  'option-cards': simple('Cartões de opções', 'Comparação', [field('options', 'array-object', 'Opções', { itemFields: [field('title', 'text', 'Título'), field('subtitle', 'text', 'Subtítulo'), field('recommended', 'toggle', 'Recomendada'), field('attributes', 'array-object', 'Atributos', { itemFields: [field('label', 'text', 'Rótulo'), field('value', 'text', 'Valor')] }), field('note', 'textarea', 'Nota')] })], { type: 'option-cards', options: [] }),
  dependencies: simple('Dependências', 'Plano', [field('items', 'array-object', 'Dependências', { itemFields: [field('from', 'text', 'Origem'), field('on', 'text', 'Depende de'), field('note', 'text', 'Nota')] })], { type: 'dependencies', items: [] }),
  'status-summary': simple('Resumo de status', 'Plano', [field('label', 'text', 'Rótulo'), field('progress', 'number', 'Progresso', { min: 0, max: 100 }), field('blockers', 'array-string', 'Bloqueios'), field('next', 'array-string', 'Próximos passos')], { type: 'status-summary', label: 'Progresso geral', progress: 0, blockers: [], next: [] }),
  'project-health': simple('Saúde do projeto', 'Plano', [field('dimensions', 'array-object', 'Dimensões', { itemFields: [field('label', 'text', 'Dimensão'), field('health', 'select', 'Saúde', { options: ['healthy', 'attention', 'critical'] }), field('note', 'text', 'Nota')] })], { type: 'project-health', dimensions: [] }),
  'release-notes': simple('Notas de versão', 'Plano', [field('releases', 'array-object', 'Versões', { itemFields: [field('version', 'text', 'Versão'), field('date', 'text', 'Data'), field('changes', 'array-object', 'Mudanças', { itemFields: [field('kind', 'select', 'Tipo', { options: ['added', 'fixed', 'changed', 'removed'] }), field('text', 'text', 'Descrição')] })] })], { type: 'release-notes', releases: [] }),
  'team-list': simple('Equipe', 'Pessoas', [field('people', 'array-object', 'Pessoas', { itemFields: [field('avatar', 'image', 'Avatar'), field('name', 'text', 'Nome'), field('role', 'text', 'Cargo'), field('team', 'text', 'Equipe'), field('contact', 'text', 'Contato')] })], { type: 'team-list', people: [] }),
  'meeting-notes': simple('Notas de reunião', 'Conteúdo', [field('title', 'text', 'Título'), field('date', 'text', 'Data'), field('participants', 'array-string', 'Participantes'), field('agenda', 'array-string', 'Pauta'), field('decisions', 'array-string', 'Decisões'), field('next', 'array-string', 'Próximos passos')], { type: 'meeting-notes', participants: [], agenda: [], decisions: [], next: [] }),
  'incident-summary': simple('Resumo de incidente', 'Operações', [field('severity', 'text', 'Severidade'), field('title', 'text', 'Título'), field('date', 'text', 'Data'), field('impact', 'textarea', 'Impacto'), field('duration', 'text', 'Duração'), field('cause', 'textarea', 'Causa'), field('resolution', 'textarea', 'Resolução'), field('actions', 'array-string', 'Ações preventivas')], { type: 'incident-summary', title: '', actions: [] }),
  'root-cause': simple('Causa raiz', 'Operações', [field('problem', 'textarea', 'Problema'), field('whys', 'array-string', 'Porquês'), field('rootCause', 'textarea', 'Causa raiz')], { type: 'root-cause', problem: '', whys: [] }),
  'status-badge': simple('Badge de status', 'Indicadores', [field('status', 'select', 'Status', { options: ['not-started', 'in-progress', 'done', 'blocked', 'approved'] })], { type: 'status-badge', status: 'in-progress' }),
  'priority-badge': simple('Badge de prioridade', 'Indicadores', [field('priority', 'select', 'Prioridade', { options: ['low', 'medium', 'high', 'critical'] })], { type: 'priority-badge', priority: 'medium' }),
  'trend-indicator': simple('Indicador de tendência', 'Indicadores', [field('trend', 'select', 'Tendência', { options: ['up', 'down', 'flat'] }), field('value', 'text', 'Valor')], { type: 'trend-indicator', trend: 'flat', value: '' }),
  'health-indicator': simple('Indicador de saúde', 'Indicadores', [field('health', 'select', 'Saúde', { options: ['healthy', 'attention', 'critical'] }), field('label', 'text', 'Rótulo')], { type: 'health-indicator', health: 'healthy', label: '' }),
  confidence: simple('Confiança', 'Indicadores', [field('level', 'number', 'Nível', { min: 0, max: 100 }), field('label', 'text', 'Rótulo')], { type: 'confidence', level: 50 }),
  freshness: simple('Atualização dos dados', 'Indicadores', [field('date', 'text', 'Data'), field('label', 'text', 'Rótulo')], { type: 'freshness', date: '' }),
  drilldown: simple('Detalhamento clicável', 'Estrutura', [field('label', 'text', 'Rótulo do botão'), field('details', 'object', 'Conteúdo', { itemFields: [field('eyebrow', 'text', 'Eyebrow'), field('title', 'text', 'Título'), field('text', 'textarea', 'Texto')] })], { type: 'drilldown', label: 'Abrir detalhes', details: { title: '', text: '' } }),
}

const genericCoreEntries = Object.fromEntries(Object.entries(GENERIC_CORE).map(([type, category]) => [type, { label: labelFor(type), category, fields: genericFields, defaultValue: () => ({ type, title: '', summary: '', items: [] }) }]))

export const BLOCK_TYPES = { ...genericCoreEntries, ...CORE_TYPES, ...RICH_CORE_TYPES }

// Aliases continuam sendo lidos e editados em relatórios existentes, mas não
// aparecem como opções duplicadas ao criar um bloco novo.
export const BLOCK_TYPE_ALIASES = new Set([
  'distribution', 'quote', 'faq', 'details', 'appendix', 'cohort', 'benchmark',
  'tradeoffs', 'scenario-comparison', 'changelog', 'person-card', 'assumptions',
  'milestones',
])

export const BLOCK_TYPES_HIDDEN = BLOCK_TYPE_ALIASES

const CANONICAL_TYPES = {
  distribution: 'chart', quote: 'blockquote', faq: 'accordion', details: 'accordion', appendix: 'accordion',
  cohort: 'heatmap', benchmark: 'variance', tradeoffs: 'pros-cons', 'scenario-comparison': 'option-cards',
  changelog: 'release-notes', 'person-card': 'team-list', assumptions: 'key-takeaways', milestones: 'timeline',
}

export const BLOCK_CATEGORIES = [...new Set(Object.values(BLOCK_TYPES).map((entry) => entry.category))]

export function getBlockDefinition(type) {
  const canonical = CANONICAL_TYPES[type] ?? type
  return BLOCK_TYPES[canonical] ?? { label: labelFor(type || 'bloco'), category: 'Outros', fields: genericFields, defaultValue: () => ({ type: type || 'paragraph' }) }
}

export function createBlock(type) {
  return getBlockDefinition(type).defaultValue()
}

export function isKnownBlockType(type) {
  return Boolean(type) && (type in BLOCK_TYPES || BLOCK_TYPE_ALIASES.has(type))
}

// Catálogo compacto e serializável do registry — usado pra descrever pra uma
// IA (ou qualquer outro consumidor externo) quais tipos de bloco existem, sem
// mandar `defaultValue` (é uma função, não serializa em JSON).
export function describeBlockCatalog() {
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
  return Object.entries(BLOCK_TYPES)
    .filter(([type]) => !BLOCK_TYPES_HIDDEN.has(type))
    .map(([type, definition]) => ({
      type,
      label: definition.label,
      category: definition.category,
      fields: definition.fields.map(describeField),
    }))
}

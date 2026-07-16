import { getSessionUser, requirePermission } from './_lib/auth.js'
import { sendJson, handleOptions, readJsonBody } from './_lib/http.js'
import { runAiChat } from './_lib/ai/index.js'
import { describeBlockCatalog, isKnownBlockType } from '../src/lib/blockRegistry.js'
import { normalizeTableBlock } from '../src/lib/table.js'
import { mergeMetricsPreservingOmissions } from '../src/lib/reportPatch.js'

export const config = {
  runtime: 'nodejs',
}

const CONTENT_RULES = `Regras de conteúdo (siga sempre):
- Escreva em português do Brasil, tom editorial e direto (nada de "genérico corporativo").
- "headline": chamada muito curta, com 1-2 linhas de 3-6 palavras cada e no máximo 12 palavras no total. Não escreva uma frase longa. "intro": 1 parágrafo que já entrega a conclusão principal.
- Use **negrito** na frase-conclusão de parágrafos/itens importantes.
- "badge" em itens é curto (1-3 palavras): "Resolvido", "Em Risco", "Ponto forte".
- Nunca invente números. Só preencha "metrics", "chart.datasets" ou tabelas com valores reais
  fornecidos pelo usuário ou pelo CSV anexado. Se não houver dados reais suficientes, prefira
  blocos de texto/estrutura (paragraph, bullets, callout, executive-summary) em vez de inventar
  números em metrics/chart/table.
- Use apenas os "type" de bloco listados no catálogo abaixo — nunca invente um "type" novo.`

function buildCatalogText() {
  const catalog = describeBlockCatalog()
  const byCategory = new Map()
  for (const entry of catalog) {
    if (!byCategory.has(entry.category)) byCategory.set(entry.category, [])
    byCategory.get(entry.category).push(entry)
  }
  const lines = []
  for (const [category, entries] of byCategory) {
    lines.push(`## ${category}`)
    for (const entry of entries) {
      lines.push(`- ${entry.type} ("${entry.label}"): ${JSON.stringify(entry.fields)}`)
    }
  }
  return lines.join('\n')
}

const REPORT_SHAPE = `Shape de um relatório (objeto JSON):
{
  "title": string,
  "headline": string[],
  "intro": string[],
  "metrics": [{ "value": string, "label": string, "note"?: string }],
  "body": [
    { "type": "section", "heading": string, "items": [
      { "title": string, "badge"?: string, "description"?: string, "blocks": [ { "type": "<tipo do catálogo>", ...campos do tipo } ] }
    ] }
  ]
}`

const BLOCK_FORMAT_RULES = `Formatos obrigatórios dos blocos:
- table: "columns" deve ser string[] e "rows" deve ser uma matriz (any[][]) na mesma ordem das colunas. Nunca use objetos em columns ou rows.
- table: só crie colunas para as quais existam valores reais. Nunca crie coluna preenchida com "-", "–", "—", vazio, null, N/A ou estimativas não calculáveis a partir dos dados fornecidos.
- chart: "labels" deve ser string[] e cada entrada de "datasets" deve usar { "label": string, "data": number[] }.
- waterfall-chart: itens comuns são variações assinadas (positivo adiciona, negativo reduz). Use isTotal:true para checkpoints; com value, ele é o total absoluto, e sem value usa o acumulado. Exemplo correto: total 568, resolvidos -520, total pendente 48.`

const GLOBAL_EDITOR_FEATURES = `Funcionalidades globais do editor (podem ser usadas em qualquer bloco):
- Largura: todo bloco aceita "span": "" (automática), "1", "2", "3" ou "full".
- Modal ao clicar: todo bloco e toda métrica podem receber "details". Shape: { "eyebrow"?: string, "title": string, "subtitle"?: string, "text"?: string, "size"?: "small" | "medium" | "large" | "full", "blocks"?: [blocos de qualquer tipo do catálogo] }.
- Use "details" somente quando houver um aprofundamento realmente útil para a decisão. Não esconda dados essenciais na modal e não coloque nela linhas brutas que podem ser resumidas com uma métrica, distribuição, tendência ou conclusão.
- Os blocos dentro de details são editáveis pelo mesmo editor visual e também podem usar span e details.
- Item de seção com label: use "title", "badge" e/ou "description" para mostrar explicação lateral. Item sem label: omita esses três campos ou use title vazio; os blocos ocupam toda a largura.
- Interações próprias como clickable, variantes, unidades e opções devem seguir exatamente os campos e options descritos no catálogo. Não invente valores fora das options.`

const DATA_REPORT_RULES = `Profundidade obrigatória para relatórios gerados a partir de planilhas:
- Produza um relatório executivo completo e profissional, não um resumo superficial de 4 ou 5 blocos.
- Cubra explicitamente TODAS as abas/conjuntos fornecidos. Nenhuma aba pode desaparecer, mesmo que pareça secundária.
- Crie uma seção analítica dedicada para cada tema ou aba e use quantos itens e blocos forem necessários. Não existe limite de 5 blocos; 10, 20, 30 ou 50 blocos são aceitáveis conforme a riqueza dos dados.
- Para cada conjunto não vazio, extraia conclusões, métricas, tendências, distribuições, comparações e exceções sustentadas pelos dados. Combine métricas, gráficos, tabelas analíticas, callouts e texto editorial; não use somente parágrafos genéricos.
- Cruze abas relacionadas quando houver chaves, datas, categorias ou entidades compatíveis.
- Antes de responder, faça uma verificação de cobertura: cada nome de aba recebido deve corresponder a pelo menos uma análise identificável no body.
- Cobertura completa significa analisar todos os registros, não reproduzi-los um por um. Prefira sumarizações, agregações, tendências, rankings e exceções; só inclua uma tabela de registros brutos quando o usuário pedir explicitamente ou quando cada linha for indispensável para a decisão.
- O sistema acrescentará automaticamente um resumo técnico de cobertura por aba. Concentre sua resposta na análise, hierarquia editorial e visualizações.`

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

function isFilled(value) {
  return value !== '' && value !== null && value !== undefined
}

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function compactValue(value) {
  const text = String(value)
  return text.length > 28 ? `${text.slice(0, 27)}…` : text
}

function summarizeColumn(column, rows, index) {
  const values = rows.map((row) => row[index]).filter(isFilled)
  const frequencies = new Map()
  values.forEach((value) => {
    const key = String(value)
    frequencies.set(key, (frequencies.get(key) ?? 0) + 1)
  })
  const distinct = frequencies.size
  let summary = 'Sem valores preenchidos'

  if (values.length && column.type === 'number') {
    const numbers = values.map(numericValue).filter((value) => value !== null)
    if (numbers.length) {
      const stats = numbers.reduce((acc, value) => ({
        total: acc.total + value,
        min: Math.min(acc.min, value),
        max: Math.max(acc.max, value),
      }), { total: 0, min: Infinity, max: -Infinity })
      summary = `Mín. ${numberFormatter.format(stats.min)} · média ${numberFormatter.format(stats.total / numbers.length)} · máx. ${numberFormatter.format(stats.max)}`
    }
  } else if (values.length && column.type === 'date') {
    const range = values.map(String).reduce((acc, value) => ({
      min: acc.min === null || value < acc.min ? value : acc.min,
      max: acc.max === null || value > acc.max ? value : acc.max,
    }), { min: null, max: null })
    summary = `${range.min.slice(0, 10)} até ${range.max.slice(0, 10)}`
  } else if (values.length) {
    const topValues = Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([value, count]) => `${compactValue(value)} (${count})`)
    summary = `Mais frequentes: ${topValues.join(' · ')}`
  }

  return [column.name, column.type, values.length, rows.length - values.length, distinct, summary]
}

export function buildSourceSections(dataSummaries) {
  const byFile = new Map()
  for (const entry of dataSummaries ?? []) {
    const columns = Array.isArray(entry?.summary?.columns)
      ? entry.summary.columns.map((column, index) => ({
        name: String(column?.name || `Coluna ${index + 1}`),
        type: String(column?.type || 'text'),
      }))
      : []
    const rows = Array.isArray(entry?.summary?.rows) ? entry.summary.rows : []
    if (!columns.length) continue

    const filename = entry.filename || 'Dados enviados'
    if (!byFile.has(filename)) byFile.set(filename, [])
    const sheetName = entry.sheet || filename
    byFile.get(filename).push({
      title: sheetName,
      badge: `${rows.length} linha${rows.length === 1 ? '' : 's'}`,
      description: `${columns.length} colunas analisadas em todos os registros da aba.`,
      blocks: [{
        type: 'table',
        columns: ['Coluna', 'Tipo', 'Preenchidos', 'Vazios', 'Distintos', 'Síntese'],
        rows: columns.map((column, index) => summarizeColumn(column, rows, index)),
        span: 'full',
      }],
    })
  }

  return Array.from(byFile, ([filename, items]) => ({
    type: 'section',
    heading: `Cobertura dos dados · ${filename}`,
    generatedFromSpreadsheet: true,
    items,
  }))
}

function compactHeadline(headline) {
  const lines = (Array.isArray(headline) ? headline : [headline])
    .map((line) => String(line ?? '').trim())
    .filter(Boolean)
    .slice(0, 2)
  let remainingWords = 12
  return lines.map((line) => {
    const words = line.split(/\s+/)
    const limit = Math.min(6, remainingWords)
    remainingWords -= Math.min(words.length, limit)
    return words.length > limit ? `${words.slice(0, limit).join(' ')}…` : line
  }).filter(Boolean)
}

function serializeReportContext(report) {
  return JSON.stringify(report, (key, value) => {
    if (typeof value === 'string' && value.startsWith('data:')) return `[mídia local preservada em ${key}]`
    return value
  })
}

function buildSystemPrompt({ action, dataSummaries, currentReport }) {
  const parts = [
    'Você é o assistente de IA embutido no editor visual de relatórios do Dia Reports.',
    'Sua função é ajudar o usuário a montar/editar a estrutura de um relatório usando os tipos de bloco existentes.',
    CONTENT_RULES,
    'Catálogo completo de tipos de bloco disponíveis (não existe nenhum tipo fora desta lista):',
    buildCatalogText(),
    REPORT_SHAPE,
    BLOCK_FORMAT_RULES,
    GLOBAL_EDITOR_FEATURES,
  ]

  if (dataSummaries?.length) {
    parts.push(
      DATA_REPORT_RULES,
      `Dados reais completos fornecidos pelo usuário via CSV ou planilha (${dataSummaries.length} conjunto(s) de dados). Em cada conjunto, "columns" define a ordem e o tipo das colunas, e "rows" contém TODAS as linhas nessa mesma ordem. Analise o conjunto inteiro, use esses valores em table/chart/metrics quando fizer sentido, cruze arquivos e abas quando necessário e não invente outros dados:`,
      dataSummaries.map(({ filename, format, sheet, summary }) => (
        `Arquivo "${filename}"${sheet ? `, aba "${sheet}"` : ''} (${format || 'csv'}): ${JSON.stringify(summary)}`
      )).join('\n'),
    )
  }

  if (action === 'chat' && currentReport) {
    parts.push(
      'RELATÓRIO ATUAL — esta é a fonte de verdade para qualquer edição:',
      serializeReportContext(currentReport),
      `Regras para editar o relatório atual:
- Altere somente o que o usuário pediu. Preserve literalmente todos os demais valores, componentes e configurações.
- reportPatch é parcial nos campos do objeto, mas qualquer array incluído (metrics, body, items, blocks) deve conter a lista COMPLETA após a alteração, preservando entradas existentes e sua ordem.
- Nunca remova métricas, seções, itens ou blocos sem um pedido explícito de remoção.
- Ao adicionar details/modal, copie o objeto original sem alterar value, label, note ou conteúdo e acrescente apenas details.
- Não substitua dados reais por exemplos, aproximações ou valores inventados.`,
    )
  }

  if (action === 'suggest') {
    parts.push(
      'Responda APENAS com um JSON no formato { "candidates": [A, B, C] } com EXATAMENTE 3 candidatos.',
      'Cada candidato é { "id": string curto kebab-case, "title": string (o título do relatório), "summary": string (1 frase explicando a diferença desse candidato pros outros 2), "headline": string[], "intro": string[], "metrics": [...], "body": [...] }.',
      'Os 3 candidatos devem ser estruturas genuinamente diferentes (ex.: ênfases diferentes, conjuntos de blocos diferentes), não variações triviais de texto.',
    )
  } else {
    parts.push(
      'Responda APENAS com um JSON no formato { "reply": string, "reportPatch": {...} | null }.',
      '"reply" é uma resposta curta em português explicando o que você fez (ou por que não fez nada).',
      '"reportPatch" traz os campos do relatório a atualizar (mesmo shape acima, só os campos que mudaram; para adicionar/alterar seções, inclua o "body" completo atualizado). Use null se o pedido do usuário for só uma pergunta, sem mudança de estrutura.',
    )
  }

  return parts.join('\n\n')
}

function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return []
  return blocks
    .filter((block) => isKnownBlockType(block?.type))
    .map((block) => {
      const clean = normalizeTableBlock(block)
      if (!clean?.details || !Array.isArray(clean.details.blocks)) return clean
      return { ...clean, details: { ...clean.details, blocks: sanitizeBlocks(clean.details.blocks) } }
    })
}

function sanitizeItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({ ...item, blocks: sanitizeBlocks(item?.blocks) }))
}

function sanitizeBody(body) {
  if (!Array.isArray(body)) return []
  return body
    .map((node) => {
      if (node?.type === 'section') return { ...node, items: sanitizeItems(node.items) }
      return isKnownBlockType(node?.type) ? sanitizeBlocks([node])[0] : null
    })
    .filter(Boolean)
}

function sanitizeReportFragment(fragment) {
  if (!fragment || typeof fragment !== 'object') return fragment
  const clean = { ...fragment }
  if ('body' in clean) clean.body = sanitizeBody(clean.body)
  if ('headline' in clean) clean.headline = compactHeadline(clean.headline)
  if ('intro' in clean && !Array.isArray(clean.intro)) clean.intro = [String(clean.intro)]
  if ('metrics' in clean && !Array.isArray(clean.metrics)) clean.metrics = []
  return clean
}

function protectMetrics(currentReport, patch) {
  if (!Array.isArray(currentReport?.metrics) || !Array.isArray(patch?.metrics)) return patch
  return { ...patch, metrics: mergeMetricsPreservingOmissions(currentReport.metrics, patch.metrics) }
}

function parseAiJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('A IA retornou um JSON inválido — tente reformular o pedido.'), { statusCode: 502 })
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return

  try {
    const user = await getSessionUser(req)
    if (!user) {
      sendJson(res, 401, { error: 'Not authenticated' })
      return
    }
    if (!requirePermission(user, 'reports.manage')) {
      sendJson(res, 403, { error: 'Sem permissão' })
      return
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    const body = await readJsonBody(req)
    const action = body.action === 'suggest' ? 'suggest' : 'chat'
    const conversation = Array.isArray(body.conversation) ? body.conversation : []
    const rawDataSummaries = Array.isArray(body.dataSummaries) ? body.dataSummaries : body.csvSummaries
    const dataSummaries = Array.isArray(rawDataSummaries)
      ? rawDataSummaries.filter((entry) => entry && typeof entry === 'object' && typeof entry.filename === 'string')
      : []
    const currentReport = action === 'chat' && body.currentReport && typeof body.currentReport === 'object' && !Array.isArray(body.currentReport)
      ? sanitizeReportFragment(body.currentReport)
      : null

    if (!conversation.length) {
      sendJson(res, 400, { error: 'Mensagem vazia' })
      return
    }

    const messages = [
      { role: 'system', content: buildSystemPrompt({ action, dataSummaries, currentReport }) },
      ...conversation
        .filter((entry) => entry && typeof entry.content === 'string' && (entry.role === 'user' || entry.role === 'assistant'))
        .map((entry) => ({ role: entry.role, content: entry.content })),
    ]

    const raw = await runAiChat({ messages, jsonMode: true })
    const parsed = parseAiJson(raw)

    if (action === 'suggest') {
      const candidates = Array.isArray(parsed.candidates) ? parsed.candidates.slice(0, 3) : []
      sendJson(res, 200, {
        candidates: candidates.map(sanitizeReportFragment),
        sourceSections: buildSourceSections(dataSummaries),
      })
      return
    }

    const reportPatch = parsed.reportPatch ? sanitizeReportFragment(parsed.reportPatch) : null
    sendJson(res, 200, {
      reply: typeof parsed.reply === 'string' ? parsed.reply : '',
      reportPatch: reportPatch ? protectMetrics(currentReport, reportPatch) : null,
      sourceSections: reportPatch ? buildSourceSections(dataSummaries) : [],
    })
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' })
  }
}

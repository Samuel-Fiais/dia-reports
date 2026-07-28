import {
  blockPlacements,
  isCanonicalBlockType,
  PUBLICATION_MODES,
} from './blockManifest.js'
import {
  loadSettings,
  normalizeComponentStyle,
  normalizeFontIndex,
  saveSettings,
} from './theme.js'

export const CURRENT_SCHEMA_VERSION = 2
export const DEFAULT_RENDER_MODE = 'report'

export const DEFAULT_VIEWER_SETTINGS = Object.freeze({
  colorIndex: 0,
  fontIndex: 0,
  chartStyleIndex: 2,
  widthMode: 'standard',
  fontScale: 'default',
  componentStyle: 'editorial',
})

export function normalizeRenderMode(value) {
  if (value == null || value === '') return DEFAULT_RENDER_MODE
  if (!PUBLICATION_MODES.includes(value)) {
    throw new Error(`Modo de renderização não suportado: ${value}`)
  }
  return value
}

export function normalizeViewerSettings(...sources) {
  const merged = Object.assign({}, DEFAULT_VIEWER_SETTINGS, ...sources.filter(Boolean))
  return {
    colorIndex: Math.max(0, Math.min(16, Number(merged.colorIndex) || 0)),
    fontIndex: normalizeFontIndex(merged.fontIndex),
    chartStyleIndex: Math.max(0, Math.min(2, Number(merged.chartStyleIndex) || 0)),
    widthMode: merged.widthMode === 'full' ? 'full' : 'standard',
    fontScale: ['small', 'default', 'large'].includes(merged.fontScale) ? merged.fontScale : 'default',
    componentStyle: normalizeComponentStyle(merged.componentStyle),
  }
}

export function resolveViewerSettings(publicationId, contentSettings, persist = false) {
  const defaults = normalizeViewerSettings(contentSettings)
  if (!persist || !publicationId) return defaults
  return normalizeViewerSettings(defaults, loadSettings(publicationId, defaults))
}

export function persistViewerSettings(publicationId, settings, persist = false) {
  const normalized = normalizeViewerSettings(settings)
  if (persist && publicationId) saveSettings(publicationId, normalized)
  return normalized
}

function hashText(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function identityPayload(node) {
  if (!node || typeof node !== 'object') return String(node ?? '')
  const {
    id,
    details,
    _key,
    ...stable
  } = node
  if (node.type === 'section') {
    const { items, ...sectionIdentity } = stable
    return JSON.stringify(sectionIdentity)
  }
  return JSON.stringify(stable)
}

export function publicationNodeKey(node, scope = 'node', occurrence = 0) {
  if (node?.id) return String(node.id)
  const base = `${scope}-${hashText(identityPayload(node))}`
  return occurrence > 0 ? `${base}-${occurrence}` : base
}

function normalizeDetails(details, scope) {
  if (!details || typeof details !== 'object') return details
  return {
    ...details,
    blocks: normalizeBlocks(details.blocks, `${scope}-details`, 'detail'),
  }
}

function normalizeItem(item, scope, occurrence) {
  const key = publicationNodeKey(item, scope, occurrence)
  return {
    ...item,
    _key: key,
    blocks: normalizeBlocks(item.blocks, `${scope}-${key}`, 'item'),
    details: normalizeDetails(item.details, `${scope}-${key}`),
  }
}

function normalizeItems(items, scope) {
  const occurrences = new Map()
  return (items ?? []).map((item) => {
    const signature = publicationNodeKey(item, scope)
    const occurrence = occurrences.get(signature) ?? 0
    occurrences.set(signature, occurrence + 1)
    return normalizeItem(item, scope, occurrence)
  })
}

export function normalizeBlocks(blocks, scope = 'body', placement = 'body') {
  const occurrences = new Map()
  return (blocks ?? []).map((rawBlock) => {
    const block = rawBlock && typeof rawBlock === 'object' ? { ...rawBlock } : rawBlock
    if (!isCanonicalBlockType(block?.type)) {
      throw new Error(`Tipo de bloco não suportado: ${block?.type ?? '(ausente)'}`)
    }
    if (!blockPlacements(block.type).includes(placement)) {
      throw new Error(`Bloco ${block.type} não pode ser usado em ${placement}`)
    }
    const signature = publicationNodeKey(block, scope, 0)
    const occurrence = occurrences.get(signature) ?? 0
    occurrences.set(signature, occurrence + 1)
    const key = publicationNodeKey(block, scope, occurrence)
    return {
      ...block,
      _key: key,
      items: block.type === 'section'
        ? normalizeItems(block.items, `${scope}-${key}-item`)
        : block.items,
      details: normalizeDetails(block.details, `${scope}-${key}`),
    }
  })
}

export function normalizePublication(raw, envelope = {}) {
  const publication = raw && typeof raw === 'object' ? raw : {}
  if (publication.schemaVersion != null && Number(publication.schemaVersion) !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Versão de schema não suportada: ${publication.schemaVersion}`)
  }
  const id = envelope.id ?? publication.id ?? publication.slug
  return {
    ...publication,
    ...envelope,
    id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    renderMode: normalizeRenderMode(publication.renderMode),
    settings: normalizeViewerSettings(publication.settings),
    body: normalizeBlocks(publication.body, `publication-${id ?? 'anonymous'}`),
    metrics: normalizeItems(publication.metrics, `publication-${id ?? 'anonymous'}-metric`),
  }
}

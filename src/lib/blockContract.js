export const PUBLICATION_MODES = ['report']

export const BLOCK_FAMILIES = Object.freeze({
  content: [
    'paragraph',
    'list',
    'quote',
    'message-thread',
    'callout',
    'definition-list',
    'accordion',
    'tabs',
    'code',
  ],
  media: [
    'image',
    'gallery',
    'image-comparison',
    'video',
    'embed',
    'attachment',
    'diagram',
  ],
  data: [
    'table',
    'chart',
    'metric-grid',
    'scorecard',
    'progress',
    'gauge',
    'funnel',
    'breakdown',
    'heatmap',
    'quadrant-grid',
    'ranking',
    'value-comparison',
  ],
  organization: [
    'section',
    'divider',
    'page-break',
    'table-of-contents',
    'metadata',
    'references',
    'related-content',
    'trigger',
  ],
  planning: [
    'timeline',
    'schedule-list',
    'calendar',
    'board',
    'checklist',
    'task-table',
    'relations',
    'progress-summary',
    'grouped-change-list',
  ],
  records: [
    'people-list',
    'grouped-summary',
    'record-card',
    'step-list',
  ],
  indicators: ['indicator'],
})

export const CANONICAL_BLOCK_TYPES = new Set(Object.values(BLOCK_FAMILIES).flat())
export const BODY_ONLY_BLOCK_TYPES = new Set([
  'section',
  'page-break',
  'table-of-contents',
  'related-content',
])

export function isCanonicalBlockType(type) {
  return CANONICAL_BLOCK_TYPES.has(type)
}

export function supportsPublicationMode(definition, mode) {
  const supported = definition?.supportedModes ?? PUBLICATION_MODES
  return supported.includes(mode)
}

export function blockPlacements(type) {
  return BODY_ONLY_BLOCK_TYPES.has(type) ? ['body'] : ['body', 'item', 'detail']
}

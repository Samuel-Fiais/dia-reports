export const PUBLICATION_KINDS = Object.freeze([
  Object.freeze({
    key: 'report',
    path: '/relatorios',
    title: 'Relatórios',
    eyebrow: 'Análises e decisões',
    description: 'Narrativas, resultados, comparações e recomendações.',
    empty: 'Nenhum relatório disponível ainda.',
  }),
  Object.freeze({
    key: 'document',
    path: '/documentos',
    title: 'Documentos',
    eyebrow: 'Conhecimento estruturado',
    description: 'Guias, especificações e documentos técnicos de longa duração.',
    empty: 'Nenhum documento disponível ainda.',
  }),
  Object.freeze({
    key: 'dashboard',
    path: '/dashboards',
    title: 'Dashboards',
    eyebrow: 'Acompanhamento contínuo',
    description: 'Indicadores, operações e visões atualizadas de desempenho.',
    empty: 'Nenhum dashboard disponível ainda.',
  }),
  Object.freeze({
    key: 'reference',
    path: '/referencias',
    title: 'Referências',
    eyebrow: 'Consulta técnica',
    description: 'APIs, contratos, schemas e exemplos de integração.',
    empty: 'Nenhuma referência disponível ainda.',
  }),
])

const KIND_BY_KEY = new Map(PUBLICATION_KINDS.map((kind) => [kind.key, kind]))

export const SYSTEM_PUBLICATION_SUMMARIES = Object.freeze([
  Object.freeze({
    id: 'openapi-exemplo',
    slug: 'openapi-exemplo',
    title: 'ViaCEP — Referência da API',
    date: '2026-07-28',
    updatedAt: '2026-07-28',
    from: 'Sistema · Exemplo OpenAPI',
    headline: ['ViaCEP', 'Referência da API'],
    intro: ['Exemplo vivo do modo de referência orientado por OpenAPI.'],
    metrics_length: 0,
    sections_length: 2,
    renderMode: 'reference',
    href: '/referencias/openapi-exemplo',
    system: true,
  }),
])

export function getPublicationKind(key) {
  return KIND_BY_KEY.get(key) ?? KIND_BY_KEY.get('report')
}

export function publicationMode(summary) {
  return summary?.renderMode || 'report'
}

export function publicationListPath(mode) {
  return getPublicationKind(mode).path
}

export function publicationHref(summary) {
  return summary?.href ?? `/report/${summary.id}`
}

export function withSystemPublications(publications) {
  const ids = new Set((publications ?? []).map((publication) => publication.id))
  return [
    ...(publications ?? []),
    ...SYSTEM_PUBLICATION_SUMMARIES.filter((publication) => !ids.has(publication.id)),
  ]
}


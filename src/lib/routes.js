export const ROUTES = Object.freeze({
  home: '/',
  reports: '/reports',
  documents: '/documents',
  dashboards: '/dashboards',
  references: '/references',
  components: '/components',
  theForeword: '/the-foreword',
  forewordEditions: '/the-foreword/editions',
  report: (id) => `/report/${id}`,
  referenceExample: (exampleId) => `/references/${exampleId}`,
})

/** Portuguese paths kept as redirects for bookmarks. */
export const LEGACY_ROUTE_REDIRECTS = Object.freeze([
  { from: '/relatorios', to: ROUTES.reports },
  { from: '/documentos', to: ROUTES.documents },
  { from: '/referencias', to: ROUTES.references },
  { from: '/referencias/:exampleId', to: '/references/:exampleId' },
  { from: '/componentes', to: ROUTES.components },
])

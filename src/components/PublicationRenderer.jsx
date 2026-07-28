import { lazy, Suspense } from 'react'
import { normalizePublication, normalizeViewerSettings } from '../lib/publication.js'
import ReportView from './ReportView.jsx'

const ReferenceView = lazy(() => import('./ReferenceView.jsx'))

export default function PublicationRenderer({
  publication,
  settings,
}) {
  const normalized = normalizePublication(publication)
  const resolvedSettings = normalizeViewerSettings(normalized.settings, settings)

  if (normalized.renderMode === 'report') {
    return <ReportView report={normalized} settings={resolvedSettings} />
  }

  return (
    <Suspense
      fallback={(
        <div className="reference reference-load-state">
          <span>Preparando publicação</span>
          <h1>Carregando referência...</h1>
        </div>
      )}
    >
      <ReferenceView publication={normalized} settings={resolvedSettings} />
    </Suspense>
  )
}

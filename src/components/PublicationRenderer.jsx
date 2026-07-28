import { normalizePublication, normalizeViewerSettings } from '../lib/publication.js'
import ReportView from './ReportView.jsx'

const LAYOUTS = {
  report: ReportView,
}

export default function PublicationRenderer({
  publication,
  settings,
}) {
  const normalized = normalizePublication(publication)
  const Layout = LAYOUTS[normalized.renderMode] ?? LAYOUTS.report
  const resolvedSettings = normalizeViewerSettings(normalized.settings, settings)

  return <Layout report={normalized} settings={resolvedSettings} />
}

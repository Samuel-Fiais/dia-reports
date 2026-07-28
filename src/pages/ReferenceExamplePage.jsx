import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicationRenderer from '../components/PublicationRenderer.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import { useAppTheme } from '../context/ThemeContext.jsx'
import {
  persistViewerSettings,
  resolveViewerSettings,
} from '../lib/publication.js'
import {
  buildReferenceExamplePublication,
  OPENAPI_EXAMPLE_ID,
} from '../lib/referenceExample.js'
import { applyTheme } from '../lib/theme.js'

export default function ReferenceExamplePage() {
  const publication = useMemo(() => buildReferenceExamplePublication(), [])
  const { appTheme } = useAppTheme()
  const [settings, setSettings] = useState(
    () => resolveViewerSettings(OPENAPI_EXAMPLE_ID, publication.settings, true),
  )

  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    document.title = publication.title
  }, [publication.title])

  const handleChange = (next) => {
    setSettings(persistViewerSettings(OPENAPI_EXAMPLE_ID, next, true))
  }

  return (
    <>
      <nav className="report-backnav">
        <Link to="/referencias">
          <ArrowLeft size={12} aria-hidden="true" /> Referências
        </Link>
      </nav>
      <PublicationRenderer publication={publication} settings={settings} />
      <SettingsPanel
        settings={settings}
        onChange={handleChange}
        title="Personalizar referência"
      />
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PublicationRenderer from '../components/PublicationRenderer.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import { useAppTheme } from '../context/ThemeContext.jsx'
import {
  buildComponentCatalogPublication,
  COMPONENT_CATALOG_ID,
} from '../lib/componentCatalog.js'
import {
  persistViewerSettings,
  resolveViewerSettings,
} from '../lib/publication.js'
import { applyTheme } from '../lib/theme.js'

export default function ComponentCatalogPage() {
  const publication = useMemo(() => buildComponentCatalogPublication(), [])
  const { appTheme } = useAppTheme()
  const [settings, setSettings] = useState(
    () => resolveViewerSettings(COMPONENT_CATALOG_ID, publication.settings, true),
  )

  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    document.title = publication.title
  }, [publication.title])

  const handleChange = (next) => {
    setSettings(persistViewerSettings(COMPONENT_CATALOG_ID, next, true))
  }

  return (
    <>
      <nav className="report-backnav">
        <Link to="/">
          <ArrowLeft size={12} aria-hidden="true" /> Relatórios
        </Link>
      </nav>
      <PublicationRenderer publication={publication} settings={settings} />
      <SettingsPanel
        settings={settings}
        onChange={handleChange}
        title="Personalizar catálogo"
      />
    </>
  )
}

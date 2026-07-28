import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PublicationRenderer from '../components/PublicationRenderer.jsx'
import PublicationState from '../components/PublicationState.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import { useAppTheme } from '../context/ThemeContext.jsx'
import {
  persistViewerSettings,
  resolveViewerSettings,
} from '../lib/publication.js'
import {
  buildReferenceExamplePublication,
} from '../lib/referenceExample.js'
import { applyTheme } from '../lib/theme.js'

function ReferenceExampleContent({ publication }) {
  const { appTheme } = useAppTheme()
  const [settings, setSettings] = useState(
    () => resolveViewerSettings(publication.id, publication.settings, true),
  )

  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    document.title = publication.title
  }, [publication.title])

  const handleChange = (next) => {
    setSettings(persistViewerSettings(publication.id, next, true))
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

export default function ReferenceExamplePage() {
  const { exampleId } = useParams()
  const publication = useMemo(
    () => buildReferenceExamplePublication(exampleId),
    [exampleId],
  )

  if (!publication) {
    return (
      <PublicationState
        eyebrow="Referência não encontrada"
        title="404"
        message="Este exemplo não existe."
        backTo="/referencias"
        backLabel="Voltar às referências"
      />
    )
  }

  return <ReferenceExampleContent key={publication.id} publication={publication} />
}

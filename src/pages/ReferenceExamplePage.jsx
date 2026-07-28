import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PublicationRenderer from '../components/PublicationRenderer.jsx'
import PublicationState from '../components/PublicationState.jsx'
import ShareButton from '../components/ShareButton.jsx'
import SettingsPanel, {
  REFERENCE_SETTINGS_FEATURES,
} from '../components/SettingsPanel.jsx'
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
      <nav className="report-backnav report-backnav--reference">
        <Link to="/referencias">
          <ArrowLeft size={12} aria-hidden="true" /> Referências
        </Link>
      </nav>
      <div className="report-topnav">
        <ShareButton
          reportId={publication.id}
          directUrl={`/shared/reference/${publication.id}`}
          noun="referência"
          secure={false}
          anonymous
        />
      </div>
      <PublicationRenderer publication={publication} settings={settings} />
      <SettingsPanel
        settings={settings}
        onChange={handleChange}
        title="Personalizar referência"
        features={REFERENCE_SETTINGS_FEATURES}
        variant="reference"
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

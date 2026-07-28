import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import PublicationRenderer from '../components/PublicationRenderer.jsx'
import PublicationState from '../components/PublicationState.jsx'
import { useAppTheme } from '../context/ThemeContext.jsx'
import { buildReferenceExamplePublication } from '../lib/referenceExample.js'
import { resolveViewerSettings } from '../lib/publication.js'
import { applyTheme } from '../lib/theme.js'

export default function SharedReferenceExamplePage() {
  const { exampleId } = useParams()
  const { appTheme } = useAppTheme()
  const publication = useMemo(
    () => buildReferenceExamplePublication(exampleId),
    [exampleId],
  )
  const settings = useMemo(
    () => resolveViewerSettings(null, publication?.settings),
    [publication],
  )

  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    if (publication?.title) document.title = publication.title
  }, [publication?.title])

  if (!publication) {
    return (
      <PublicationState
        eyebrow="Referência não encontrada"
        title="404"
        message="Este link compartilhado não existe."
      />
    )
  }

  return <PublicationRenderer publication={publication} settings={settings} />
}

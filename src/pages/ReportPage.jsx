import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getReport } from '../lib/registry.js'
import { applyTheme, loadSettings, saveSettings } from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'
import ReportView from '../components/ReportView.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import ShareButton from '../components/ShareButton.jsx'

export default function ReportPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const shared = searchParams.get('shared') === '1'
  const report = getReport(id)
  const { appTheme } = useAppTheme()

  const [settings, setSettings] = useState(() => {
    const reportSettings = {
      colorIndex: report?.settings?.colorIndex ?? 0,
      fontIndex: report?.settings?.fontIndex ?? 0,
      chartStyleIndex: report?.settings?.chartStyleIndex ?? 2,
      widthMode: report?.settings?.widthMode ?? 'standard',
      fontScale: report?.settings?.fontScale ?? 'default',
    }
    return shared ? reportSettings : loadSettings(id, reportSettings)
  })

  useEffect(() => {
    applyTheme(settings, appTheme)
  }, [settings, appTheme])

  useEffect(() => {
    if (report?.title) document.title = report.title
  }, [report])

  if (!report) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Relatório não encontrado</span>
            </div>
          </header>
          <h1 className="report-headline">404</h1>
          <div className="report-intro">
            <p>
              Nenhum relatório com o id <code>{id}</code>. <Link to="/">Voltar ao dashboard</Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (next) => {
    setSettings(next)
    saveSettings(id, next)
  }

  return (
    <>
      {!shared && (
        <nav className="report-backnav">
          <Link to="/">← Relatórios</Link>
        </nav>
      )}
      <div className="report-topnav">
        <ShareButton reportId={report.id} />
      </div>
      <ReportView report={report} settings={settings} />
      {!shared && <SettingsPanel settings={settings} onChange={handleChange} />}
    </>
  )
}

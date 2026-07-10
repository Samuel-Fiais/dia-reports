import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reports } from '../lib/registry.js'
import { applyTheme, formatReportDate, formatShortDate } from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'

function countSections(report) {
  return (report.body ?? []).filter((b) => b.type === 'section').length
}

export default function Home() {
  const { appTheme, toggleAppTheme } = useAppTheme()

  useEffect(() => {
    applyTheme({ colorIndex: 0, fontIndex: 0 }, appTheme)
    document.title = 'Relatórios'
  }, [appTheme])

  return (
    <div className="report ready">
      <div className="report-topnav">
        <button
          type="button"
          className="theme-toggle-btn ready"
          title={appTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          onClick={toggleAppTheme}
        >
          {appTheme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <span className="report-from">Dashboard · Relatórios</span>
          </div>
          <span className="report-date">{formatReportDate(new Date().toISOString())}</span>
        </header>

        <h1 className="report-headline">Relatórios</h1>

        <div className="report-intro">
          <p>
            <strong>{reports.length} relatório{reports.length === 1 ? '' : 's'} na pasta comum.</strong>{' '}
            Cada arquivo <code>.json</code> salvo em <code>src/reports/</code> aparece aqui
            automaticamente. Clique em um relatório para abri-lo.
          </p>
        </div>

        <hr className="report-rule" />

        <main className="report-body">
          <section className="report-section">
            <div className="section-header">
              <h2 className="section-heading">Todos os relatórios</h2>
            </div>
            <div className="section-items report-card-grid">
              {reports.map((report) => (
                <Link key={report.id} to={`/report/${report.id}`} className="report-card">
                  <div className="report-card-meta">
                    <span className="report-card-from">{report.from ?? 'Relatório'}</span>
                    <span className="report-card-date">{formatShortDate(report.date)}</span>
                  </div>
                  <h3 className="report-card-title">
                    {Array.isArray(report.headline) ? report.headline.join(' ') : report.headline ?? report.title}
                  </h3>
                  {report.intro?.[0] && (
                    <p className="report-card-desc">
                      {String(report.intro[0]).replace(/\*\*|\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}
                    </p>
                  )}
                  <div className="report-card-foot">
                    <span className="item-badge">
                      {countSections(report)} seç{countSections(report) === 1 ? 'ão' : 'ões'}
                    </span>
                    {report.metrics?.length > 0 && (
                      <span className="item-badge">{report.metrics.length} métricas</span>
                    )}
                    <span className="report-card-open">Abrir →</span>
                  </div>
                </Link>
              ))}
              {reports.length === 0 && (
                <p className="report-card-empty">
                  Nenhum relatório encontrado. Adicione um arquivo <code>.json</code> em{' '}
                  <code>src/reports/</code> seguindo o padrão documentado em{' '}
                  <code>REPORT-SCHEMA.md</code>.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { formatReportDate } from '../../lib/theme.js'

// Casca de página compartilhada por todas as telas administrativas (grupos,
// perfis, usuários, editor de relatórios): mesmo header/headline/intro do resto
// do app, mais o cabeçalho de seção com o botão "+ Novo X".
export default function AdminPage({ title, description, sectionHeading, newLabel, onNew, children }) {
  return (
    <div className="report ready">
      <nav className="report-backnav">
        <Link to="/">
          <ArrowLeft size={12} aria-hidden="true" /> Relatórios
        </Link>
      </nav>

      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <span className="report-from">Administração</span>
          </div>
          <span className="report-date">{formatReportDate(new Date().toISOString())}</span>
        </header>

        <h1 className="report-headline">{title}</h1>

        <div className="report-intro">
          <p>{description}</p>
        </div>

        <hr className="report-rule" />

        <main className="report-body">
          <section className="report-section">
            <div className="section-header admin-section-header">
              <h2 className="section-heading">{sectionHeading}</h2>
              {onNew && (
                <button type="button" className="admin-new-btn" onClick={onNew}>
                  <Plus size={14} aria-hidden="true" /> {newLabel}
                </button>
              )}
            </div>

            {children}
          </section>
        </main>
      </div>
    </div>
  )
}

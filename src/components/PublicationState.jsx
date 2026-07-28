import { Link } from 'react-router-dom'

export default function PublicationState({
  eyebrow,
  title,
  message,
  backTo,
  backLabel,
}) {
  return (
    <div className="report publication-state ready">
      <div className="report-wrap">
        <header className="report-header">
          <div className="report-header-left">
            <span className="report-from">{eyebrow}</span>
          </div>
        </header>
        <h1 className="report-headline">{title}</h1>
        {message && (
          <div className="report-intro">
            <p>
              {message}{' '}
              {backTo && backLabel ? <Link to={backTo}>{backLabel}</Link> : null}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

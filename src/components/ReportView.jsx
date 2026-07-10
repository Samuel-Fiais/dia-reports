import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { renderInline } from '../lib/inline.jsx'
import { formatReportDate, formatShortDate } from '../lib/theme.js'
import { reports } from '../lib/registry.js'
import { ModalProvider } from './Modal.jsx'
import { ItemBlock, renderBlocks } from './blocks/index.jsx'
import { TableOfContents, sectionSlug } from './blocks/structure.jsx'

/* ── Item (label à esquerda, corpo à direita) ───────────────── */

function ReportItem({ item, chartStyleIndex, itemKey }) {
  const hasChart = (item.blocks ?? []).some((b) => b.type === 'chart')
  const hasImage = (item.blocks ?? []).some((b) => b.type === 'image')
  const modifier = hasChart ? ' report-item--chart-right' : hasImage ? ' report-item--image-right' : ''

  const columns = Math.max(1, Math.min(6, Number(item.columns) || 1))

  return (
    <article className={`report-item${modifier}`}>
      <div className="item-label">
        <h3 className="item-title">{renderInline(item.title)}</h3>
        {item.badge && <span className="item-badge">{item.badge}</span>}
        {item.description && <p>{renderInline(item.description)}</p>}
      </div>
      <div className="item-body" style={{ '--item-columns': columns }}>
        {(item.blocks ?? []).map((block, i) => {
          const full = block.span === 'full'
          const span = full ? columns : Math.max(1, Math.min(columns, Number(block.span) || 1))
          return (
            <div
              key={i}
              className={`item-block-cell${full ? ' item-block-cell--full' : ''}`}
              style={{ '--block-span': span }}
            >
              <ItemBlock block={block} chartStyleIndex={chartStyleIndex} blockKey={`${itemKey}:${i}`} />
            </div>
          )
        })}
      </div>
    </article>
  )
}

/* ── Moldura para blocos avulsos no corpo (fora de seções) ──── */

function BodyBlockFrame({ block, children }) {
  return (
    <div className={`body-block body-block--${block.type}`}>
      {(block.heading || block.description) && (
        <div className="body-block-head">
          {block.heading && <h2 className="body-block-heading">{renderInline(block.heading)}</h2>}
          {block.description && <p className="body-block-desc">{renderInline(block.description)}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── Blocos do corpo ────────────────────────────────────────── */

function BodyBlock({ block, chartStyleIndex, bodyKey, report }) {
  switch (block.type) {
    case 'section':
      return (
        <section className="report-section" id={sectionSlug(block.heading)}>
          <div className="section-header">
            <h2 className="section-heading">{renderInline(block.heading)}</h2>
          </div>
          <div className="section-items">
            {(block.items ?? []).map((item, i) => (
              <ReportItem key={i} item={item} chartStyleIndex={chartStyleIndex} itemKey={`${bodyKey}:${i}`} />
            ))}
          </div>
        </section>
      )

    case 'quote-break':
      return (
        <div className="report-quote-break">
          <hr className="report-image-break__rule" aria-hidden="true" />
          <blockquote className="report-blockquote-break">
            <p>{renderInline(block.text)}</p>
            {block.cite && <cite>{renderInline(block.cite)}</cite>}
          </blockquote>
          <hr className="report-image-break__rule" aria-hidden="true" />
        </div>
      )

    case 'image-break':
      return (
        <div className="report-image-break">
          <hr className="report-image-break__rule" aria-hidden="true" />
          <div className="report-image-break__body">
            <img className="report-image-break__img" src={block.src} alt={block.alt ?? ''} />
            {block.caption && <p className="fig-caption">{renderInline(block.caption)}</p>}
          </div>
          <hr className="report-image-break__rule" aria-hidden="true" />
        </div>
      )

    case 'table-of-contents':
      return (
        <BodyBlockFrame block={{ ...block, heading: block.heading ?? 'Sumário' }}>
          <TableOfContents report={report} />
        </BodyBlockFrame>
      )

    case 'related-reports': {
      const ids = block.ids ?? []
      const related = ids.length > 0 ? ids.map((id) => reports.find((r) => r.id === id)).filter(Boolean) : []
      return (
        <BodyBlockFrame block={{ ...block, heading: block.heading ?? 'Relatórios relacionados' }}>
          <div className="related-reports">
            {related.map((r) => (
              <Link key={r.id} to={`/report/${r.id}`} className="related-report">
                <span className="related-report-title">
                  {Array.isArray(r.headline) ? r.headline.join(' ') : r.headline ?? r.title}
                </span>
                <span className="related-report-date">{formatShortDate(r.date)}</span>
              </Link>
            ))}
          </div>
        </BodyBlockFrame>
      )
    }

    /* Qualquer outro bloco pode viver no corpo: ganha moldura full-width
       com heading/description opcionais. */
    default:
      return (
        <BodyBlockFrame block={block}>
          <ItemBlock block={block} chartStyleIndex={chartStyleIndex} blockKey={bodyKey} />
        </BodyBlockFrame>
      )
  }
}

/* ── Capa integrada ao título (hero) ────────────────────────── */

function ReportHero({ report }) {
  const cover = report.cover
  const headline = Array.isArray(report.headline) ? report.headline : [report.headline]
  return (
    <div className="report-hero">
      <span className="report-hero-side report-hero-side--left">{cover.sideLeft ?? formatShortDate(report.date)}</span>
      <span className="report-hero-side report-hero-side--right">{cover.sideRight ?? (report.from ?? '')}</span>
      <div className="report-hero-frame">
        <img className="report-hero-img" src={cover.src} alt={cover.alt ?? ''} />
        <div className="report-hero-overlay" style={cover.accent ? { '--hero-accent': cover.accent } : undefined}>
          {cover.eyebrow && <span className="report-hero-eyebrow">{cover.eyebrow}</span>}
          <h1 className="report-hero-headline">
            {headline.map((line, i, arr) => (
              <Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </Fragment>
            ))}
          </h1>
        </div>
      </div>
      {(cover.caption || cover.credit) && (
        <div className="report-hero-foot">
          {cover.caption && <p className="report-hero-caption">{renderInline(cover.caption)}</p>}
          {cover.credit && <span className="report-hero-credit">{cover.credit}</span>}
        </div>
      )}
    </div>
  )
}

/* ── Relatório completo ─────────────────────────────────────── */

export default function ReportView({ report, settings = {} }) {
  const resolvedChartStyleIndex = settings.chartStyleIndex ?? report.settings?.chartStyleIndex ?? 2
  const widthMode = settings.widthMode ?? report.settings?.widthMode ?? 'standard'
  const hasCover = Boolean(report.cover?.src)

  return (
    <ModalProvider renderBlocks={(blocks) => renderBlocks(blocks, resolvedChartStyleIndex)}>
      <div className={`report ready report--${widthMode}`}>
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">{report.title ?? report.from ?? 'Relatório'}</span>
            </div>
            <span className="report-date">{formatReportDate(report.date)}</span>
          </header>

          {hasCover ? (
            <ReportHero report={report} />
          ) : (
            <h1 className="report-headline">
              {(Array.isArray(report.headline) ? report.headline : [report.headline]).map((line, i, arr) => (
                <Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </Fragment>
              ))}
            </h1>
          )}

          {report.intro?.length > 0 && (
            <div className="report-intro">
              {report.intro.map((p, i) => (
                <p key={i}>{renderInline(p)}</p>
              ))}
            </div>
          )}

          {report.metrics?.length > 0 && (
            <div className="metrics-strip">
              <div className="metrics-strip-border" />
              {report.metrics.map((metric, i) => (
                <div
                  key={i}
                  className="metric"
                  style={{ gridColumn: `span ${metric.span ?? Math.floor(12 / report.metrics.length)}` }}
                >
                  <div className="metric-value">{metric.value}</div>
                  <div className="metric-label">{metric.label}</div>
                  {metric.note && <div className="metric-note">{metric.note}</div>}
                </div>
              ))}
            </div>
          )}

          <hr className="report-rule" />

          <main className="report-body">
            {(report.body ?? []).map((block, i) => (
              <BodyBlock
                key={i}
                block={block}
                chartStyleIndex={resolvedChartStyleIndex}
                bodyKey={`${report.id}:${i}`}
                report={report}
              />
            ))}
          </main>
        </div>
      </div>
    </ModalProvider>
  )
}

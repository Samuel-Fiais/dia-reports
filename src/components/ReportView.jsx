import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { renderInline } from '../lib/inline.jsx'
import { formatReportDate, formatShortDate, formatUpdatedAgo, normalizeComponentStyle } from '../lib/theme.js'
import { blockLabel } from '../lib/labels.js'
import { ModalProvider, useModal } from './Modal.jsx'
import { ItemBlock, renderBlocks } from './blocks/index.jsx'
import { sectionAnchor, TableOfContents } from './blocks/structure.jsx'

/* ── Item (label à esquerda, corpo à direita) ───────────────── */

function ReportItem({ item, chartStyleIndex, itemKey }) {
  const showLabel = item.showLabel !== false
  const hasChart = (item.blocks ?? []).some((b) => b.type === 'chart')
  const hasImage = (item.blocks ?? []).some((b) => b.type === 'image')
  const modifier = `${hasChart ? ' report-item--chart-right' : hasImage ? ' report-item--image-right' : ''}${showLabel ? '' : ' report-item--unlabeled'}`

  const columns = Math.max(1, Math.min(6, Number(item.columns) || 1))

  return (
    <article className={`report-item${modifier}`}>
      {showLabel && (
        <div className="item-label">
          <h3 className="item-title">{renderInline(item.title)}</h3>
          {item.badge && <span className="item-badge">{item.badge}</span>}
          {item.description && <p>{renderInline(item.description)}</p>}
        </div>
      )}
      <div className="item-body" style={{ '--item-columns': columns }}>
        {(item.blocks ?? []).map((block, i) => {
          const full = block.span === 'full'
          const span = full ? columns : Math.max(1, Math.min(columns, Number(block.span) || 1))
          return (
            <div
              key={block._key ?? block.id ?? i}
              className={`item-block-cell${full ? ' item-block-cell--full' : ''}`}
              style={{ '--block-span': span }}
            >
              <ItemBlock
                block={block}
                chartStyleIndex={chartStyleIndex}
                blockKey={block._key ?? block.id ?? `${itemKey}:${i}`}
              />
            </div>
          )
        })}
      </div>
    </article>
  )
}

/* ── Moldura para blocos avulsos no corpo (fora de seções) ──── */

function BodyBlockFrame({ block, children }) {
  if (block.presentation === 'break') {
    return (
      <div className={`body-block-break body-block-break--${block.type}`}>
        <hr className="body-block-break-rule" aria-hidden="true" />
        {children}
        <hr className="body-block-break-rule" aria-hidden="true" />
      </div>
    )
  }

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

function BodyBlockContent({
  block,
  chartStyleIndex,
  bodyKey,
  report,
}) {
  switch (block.type) {
    case 'section':
      return (
        <section className="report-section" id={sectionAnchor(block)}>
          <div className="section-header">
            <h2 className="section-heading">{renderInline(block.heading)}</h2>
          </div>
          <div className="section-items">
            {(block.items ?? []).map((item, i) => (
              <ReportItem
                key={item._key ?? item.id ?? i}
                item={item}
                chartStyleIndex={chartStyleIndex}
                itemKey={item._key ?? item.id ?? `${bodyKey}:${i}`}
              />
            ))}
          </div>
        </section>
      )

    case 'table-of-contents':
      return (
        <BodyBlockFrame block={{ ...block, heading: block.heading ?? 'Sumário' }}>
          <TableOfContents publication={report} />
        </BodyBlockFrame>
      )

    case 'related-content': {
      const related = block.items ?? []
      return (
        <BodyBlockFrame
          block={{
            ...block,
            heading: block.heading ?? blockLabel(block, 'heading', 'Conteúdo relacionado'),
          }}
        >
          <div className="related-reports">
            {related.map((item, index) => {
              const content = (
                <>
                  <span className="related-report-title">{item.title}</span>
                  {item.meta && <span className="related-report-date">{item.meta}</span>}
                </>
              )
              return item.href?.startsWith('/') ? (
                <Link key={item.id ?? item.href ?? index} to={item.href} className="related-report">
                  {content}
                </Link>
              ) : (
                <a
                  key={item.id ?? item.href ?? index}
                  href={item.href}
                  className="related-report"
                  target={item.newTab ? '_blank' : undefined}
                  rel={item.newTab ? 'noreferrer' : undefined}
                >
                  {content}
                </a>
              )
            })}
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

function BodyBlock(props) {
  const { block } = props
  const { openModal } = useModal()
  const content = <BodyBlockContent {...props} />
  if (!block.details) return content

  return (
    <div className="body-block-details-shell">
      {content}
      <button
        type="button"
        className="drilldown"
        onClick={() => openModal(block.details)}
      >
        {block.detailsLabel ?? 'Ver detalhes'}
      </button>
    </div>
  )
}

function MetricCard({ metric, span }) {
  const { openModal } = useModal()
  const interactive = Boolean(metric.details)
  return (
    <div
      className={`metric${interactive ? ' clickable' : ''}`}
      style={{ gridColumn: `span ${span}` }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => openModal(metric.details) : undefined}
      onKeyDown={interactive ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openModal(metric.details)
        }
      } : undefined}
    >
      <div className="metric-value">{metric.value}</div>
      <div className="metric-label">{metric.label}</div>
      {metric.note && <div className="metric-note">{metric.note}</div>}
    </div>
  )
}

/* ── Capa integrada ao título (hero) ────────────────────────── */

function ReportHero({ report }) {
  const cover = report.cover ?? {}
  const hasImage = Boolean(cover.src)
  const headline = Array.isArray(report.headline) ? report.headline : [report.headline]
  const sideLeft = cover.sideLeft ?? formatShortDate(report.updatedAt ?? report.date)
  const sideRight = cover.sideRight ?? formatUpdatedAgo(report.updatedAt ?? report.date)
  return (
    <div className={`report-hero${hasImage ? '' : ' report-hero--plain'}`}>
      {hasImage ? <>
        <span className="report-hero-side report-hero-side--left">{sideLeft}</span>
        <span className="report-hero-side report-hero-side--right">{sideRight}</span>
      </> : (
        <div className="report-hero-plain-meta">
          <span>{sideLeft}</span>
          <span>{sideRight}</span>
        </div>
      )}
      <div className="report-hero-frame">
        {hasImage && <img className="report-hero-img" src={cover.src} alt={cover.alt ?? ''} />}
        <div className="report-hero-overlay" style={{ '--hero-accent': hasImage ? (cover.accent ?? '#fff') : 'var(--ink-secondary)', '--hero-text': hasImage ? (cover.textColor ?? '#fff') : 'var(--ink)' }}>
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

export default function ReportView({
  report,
  settings = {},
}) {
  const resolvedChartStyleIndex = settings.chartStyleIndex ?? report.settings?.chartStyleIndex ?? 2
  const widthMode = settings.widthMode ?? report.settings?.widthMode ?? 'standard'
  const componentStyle = normalizeComponentStyle(settings.componentStyle ?? report.settings?.componentStyle)

  return (
    <ModalProvider renderBlocks={(blocks) => renderBlocks(blocks, resolvedChartStyleIndex)}>
      <div
        className={`publication publication--report report ready report--${widthMode} report--components-${componentStyle}`}
        data-publication-mode={report.renderMode ?? 'report'}
      >
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">{report.from ?? report.title ?? 'Publicação'}</span>
            </div>
            <span className="report-date">{formatReportDate(report.updatedAt ?? report.date)}</span>
          </header>

          <ReportHero report={report} />

          {report.intro?.length > 0 && (
            <div className="report-intro">
              {report.intro.map((p, i) => (
                <p key={`${String(p).slice(0, 24)}-${i}`}>{renderInline(p)}</p>
              ))}
            </div>
          )}

          {report.metrics?.length > 0 && (
            <div className="metrics-strip">
              <div className="metrics-strip-border" />
              {report.metrics.map((metric, i) => (
                <MetricCard
                  key={metric._key ?? metric.id ?? i}
                  metric={metric}
                  span={metric.span ?? Math.floor(12 / report.metrics.length)}
                />
              ))}
            </div>
          )}

          <hr className="report-rule" />

          <main className="report-body">
            {(report.body ?? []).map((block, i) => (
              <BodyBlock
                key={block._key ?? block.id ?? i}
                block={block}
                chartStyleIndex={resolvedChartStyleIndex}
                bodyKey={block._key ?? block.id ?? `${report.id}:${i}`}
                report={report}
              />
            ))}
          </main>
        </div>
      </div>
    </ModalProvider>
  )
}

import { lazy, Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { renderInline } from '../../lib/inline.jsx'
import ChartBlock from '../ChartBlock.jsx'
import TodoBlock from '../TodoBlock.jsx'
import Agenda from '../Agenda.jsx'
import Kanban from '../Kanban.jsx'
import TabsBlock from '../TabsBlock.jsx'
import CalendarMonth from '../CalendarMonth.jsx'
import CalendarWeek from '../CalendarWeek.jsx'
import CalendarYear from '../CalendarYear.jsx'
import { StatusBadge, PriorityBadge, TrendIndicator, HealthDot, Confidence, Freshness } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'
import { normalizeTableBlock } from '../../lib/table.js'
import {
  Sparkline, KpiGrid, Scorecard, Funnel, Gauge, Heatmap, Matrix, Ranking, Variance, Breakdown,
} from './analytics.jsx'
import {
  ExecutiveSummary, KeyTakeaways, Decision, TaskTable, References, ReportMetadata, PageBreak,
} from './structure.jsx'
import {
  Quote, Conversation, Accordion, Definition, Glossary, TeamList, MeetingNotes,
  IncidentSummary, RootCause, Embed, Video, FileAttachment,
} from './content.jsx'
import { ComparisonTable, ProsCons, OptionCards, Swot, Dependencies } from './compare.jsx'
import {
  Milestones, Roadmap, Gantt, StatusSummary, Okr, ProjectHealth, ReleaseNotes, Countdown, DateStrip,
} from './plan.jsx'

const MermaidBlock = lazy(() => import('../MermaidBlock.jsx'))

function Figure({ block, children }) {
  return (
    <>
      {children}
      {block.caption && (
        <p className="fig-caption">
          {block.figure && <span className="fig-ref">{block.figure}</span>}
          {block.figure ? ' — ' : ''}
          {renderInline(block.caption)}
        </p>
      )}
    </>
  )
}

/* Switch central de blocos de conteúdo. Usado dentro de itens, em blocos de
   nível de corpo (via moldura full-width) e dentro de modais de detalhe. */
function ItemBlockContent({ block, chartStyleIndex, blockKey }) {
  switch (block.type) {
    /* ── Texto e listas ── */
    case 'paragraph':
      return <p>{renderInline(block.text)}</p>

    case 'bullets': {
      const List = block.style === 'number' ? 'ol' : 'ul'
      return (
        <List className="item-bullets">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </List>
      )
    }

    case 'table': {
      const table = normalizeTableBlock(block)
      return (
        <table className="data-table">
          <thead>
            <tr>
              {table.columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{renderInline(String(cell ?? ''))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'code':
      return (
        <pre>
          <code>{block.code}</code>
        </pre>
      )

    case 'mermaid':
      return <Suspense fallback={<div className="mermaid-loading">Renderizando diagrama…</div>}><MermaidBlock block={block} /></Suspense>

    /* ── Mídia ── */
    case 'chart':
      return (
        <Figure block={block}>
          <ChartBlock block={block} chartStyleIndex={chartStyleIndex} />
        </Figure>
      )

    case 'distribution':
      return (
        <Figure block={block}>
          <ChartBlock block={{ ...block, variant: block.variant ?? 'bar' }} chartStyleIndex={chartStyleIndex} />
        </Figure>
      )

    case 'waterfall-chart':
      return (
        <Figure block={block}>
          <ChartBlock block={{ ...block, variant: 'waterfall' }} chartStyleIndex={chartStyleIndex} />
        </Figure>
      )

    case 'image':
      return (
        <Figure block={block}>
          <div className="image-wrap">
            <img src={block.src} alt={block.alt ?? ''} />
          </div>
        </Figure>
      )

    case 'gallery':
      return (
        <div className="gallery">
          {(block.items ?? []).map((item, i) => (
            <figure key={i} className="gallery-item">
              <img src={item.src} alt={item.alt ?? ''} />
              {item.caption && <figcaption className="gallery-caption">{renderInline(item.caption)}</figcaption>}
            </figure>
          ))}
        </div>
      )

    case 'before-after-image':
      return (
        <Figure block={block}>
          <div className="before-after">
            {[{ img: block.before, label: block.beforeLabel ?? 'Antes' }, { img: block.after, label: block.afterLabel ?? 'Depois' }].map(
              (side, i) => (
                <figure key={i} className="before-after-side">
                  <img src={side.img} alt={side.label} />
                  <figcaption>{side.label}</figcaption>
                </figure>
              ),
            )}
          </div>
        </Figure>
      )

    case 'embed':
      return <Figure block={block}><Embed block={block} /></Figure>

    case 'video':
      return <Video block={block} />

    case 'file-attachment':
      return <FileAttachment block={block} />

    /* ── Citações e conversa ── */
    case 'quote':
      return <Quote block={block} />
    case 'blockquote':
      return <Quote block={{ ...block, variant: 'editorial' }} />
    case 'slack':
      return <Quote block={{ ...block, variant: 'slack' }} />
    case 'email':
      return <Quote block={{ ...block, variant: 'email' }} />
    case 'testimonial':
      return <Quote block={{ ...block, variant: 'testimonial' }} />
    case 'conversation':
      return <Conversation block={block} />

    /* ── Interativos ── */
    case 'todo':
      return <TodoBlock block={block} blockKey={blockKey} />
    case 'accordion':
    case 'faq':
    case 'details':
    case 'appendix':
      return <Accordion block={block} />
    case 'tabs':
      return <TabsBlock block={block} />

    /* ── Avisos e destaques ── */
    case 'callout':
      return (
        <div className={`callout callout--${block.kind ?? 'note'}`}>
          <span className="callout-label">{block.label ?? block.kind ?? 'Nota'}</span>
          <p>{renderInline(block.text)}</p>
        </div>
      )

    case 'definition':
      return <Definition block={block} />
    case 'glossary':
      return <Glossary block={block} />

    /* ── Progresso e tempo ── */
    case 'progress': {
      const value = Math.max(0, Math.min(100, Number(block.value) || 0))
      return (
        <div className="progress-block">
          <div className="progress-head">
            <span className="progress-label">{renderInline(block.label)}</span>
            <span className="progress-value">{value}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${value}%` }} />
          </div>
          {block.note && <span className="progress-note">{renderInline(block.note)}</span>}
        </div>
      )
    }

    case 'timeline':
    case 'milestones':
      return <Milestones block={block} />
    case 'roadmap':
      return <Roadmap block={block} />
    case 'gantt':
      return <Gantt block={block} />
    case 'countdown':
      return <Countdown block={block} />
    case 'date-strip':
      return <DateStrip block={block} />

    case 'agenda':
      return <Agenda block={block} />
    case 'calendar-month':
      return <CalendarMonth block={block} />
    case 'calendar-week':
      return <CalendarWeek block={block} />
    case 'calendar-year':
      return <CalendarYear block={block} />

    /* ── Analíticos ── */
    case 'kpi-grid':
      return <KpiGrid block={block} />
    case 'metric-detail':
      return <KpiGrid block={{ ...block, variant: 'detail', columns: 1, items: [block.metric ?? block] }} />
    case 'scorecard':
      return <Scorecard block={block} />
    case 'funnel':
      return <Funnel block={block} />
    case 'gauge':
      return <Gauge block={block} />
    case 'heatmap':
    case 'cohort':
      return <Heatmap block={block} />
    case 'matrix':
      return <Matrix block={block} />
    case 'ranking':
      return <Ranking block={block} />
    case 'variance':
    case 'benchmark':
      return <Variance block={block} />
    case 'breakdown':
      return <Breakdown block={block} />
    case 'sparkline':
      return <Sparkline data={block.data} width={block.width ?? 180} height={block.height ?? 40} />

    case 'stat-comparison':
      return (
        <div>
          <div className="stat-comparison">
            <div className="stat-comparison-side stat-comparison-side--before">
              <span className="stat-comparison-label">{block.before?.label ?? 'Antes'}</span>
              <span className="stat-comparison-value">{block.before?.value}</span>
            </div>
            <span className="stat-comparison-arrow"><ArrowRight size={18} /></span>
            <div className="stat-comparison-side stat-comparison-side--after">
              <span className="stat-comparison-label">{block.after?.label ?? 'Depois'}</span>
              <span className="stat-comparison-value">{block.after?.value}</span>
            </div>
          </div>
          {block.note && <p className="stat-comparison-note">{renderInline(block.note)}</p>}
        </div>
      )

    /* ── Estrutura e governança ── */
    case 'executive-summary':
      return <ExecutiveSummary block={block} />
    case 'key-takeaways':
    case 'assumptions':
      return <KeyTakeaways block={block} />
    case 'decision':
      return <Decision block={block} />
    case 'action-items':
      return <TaskTable block={block} kind="action-items" />
    case 'recommendations':
      return <TaskTable block={block} kind="recommendations" />
    case 'blockers':
      return <TaskTable block={block} kind="blockers" />
    case 'risk-register':
      return <TaskTable block={block} kind="risk-register" />
    case 'references':
      return <References block={block} />
    case 'report-metadata':
      return <ReportMetadata block={block} />
    case 'page-break':
      return <PageBreak />

    /* ── Comparação e decisão ── */
    case 'comparison-table':
      return <ComparisonTable block={block} />
    case 'pros-cons':
    case 'tradeoffs':
      return <ProsCons block={block} />
    case 'option-cards':
    case 'scenario-comparison':
      return <OptionCards block={block} />
    case 'swot':
      return <Swot block={block} />
    case 'dependencies':
      return <Dependencies block={block} />

    /* ── Planejamento ── */
    case 'status-summary':
      return <StatusSummary block={block} />
    case 'okr':
      return <Okr block={block} />
    case 'project-health':
      return <ProjectHealth block={block} />
    case 'release-notes':
    case 'changelog':
      return <ReleaseNotes block={block} />

    /* ── Pessoas e comunicação ── */
    case 'person-card':
    case 'team-list':
      return <TeamList block={block} />
    case 'meeting-notes':
      return <MeetingNotes block={block} />
    case 'incident-summary':
      return <IncidentSummary block={block} />
    case 'root-cause':
      return <RootCause block={block} />

    /* ── Kanban ── */
    case 'kanban':
      return <Kanban block={block} />

    /* ── Indicadores de estado ── */
    case 'status-badge':
      return <StatusBadge status={block.status} />
    case 'priority-badge':
      return <PriorityBadge priority={block.priority} />
    case 'trend-indicator':
      return <TrendIndicator trend={block.trend} value={block.value} />
    case 'health-indicator':
      return <HealthDot health={block.health} label={block.label} />
    case 'confidence':
      return <Confidence level={block.level} label={block.label} />
    case 'freshness':
      return <Freshness date={block.date} label={block.label} />

    case 'drilldown':
      return <Drilldown block={block} />

    case 'divider':
      return (
        <div className="block-divider">
          {block.label && <span className="block-divider-label">{block.label}</span>}
        </div>
      )

    default:
      return null
  }
}

export function ItemBlock({ block, chartStyleIndex, blockKey }) {
  const { openModal } = useModal()
  const content = <ItemBlockContent block={block} chartStyleIndex={chartStyleIndex} blockKey={blockKey} />
  if (!block.details) return content
  return <div className="block-with-details clickable" role="button" tabIndex={0} onClick={() => openModal(block.details)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openModal(block.details) } }}>{content}</div>
}

/* Renderiza uma lista de blocos — usado pelo modal de detalhes e pelo layout
   "blocks" das apresentações. */
export function renderBlocks(blocks, chartStyleIndex = 2, keyPrefix = 'modal') {
  return (blocks ?? []).map((block, i) => (
    <ItemBlock key={i} block={block} chartStyleIndex={chartStyleIndex} blockKey={`${keyPrefix}:${i}`} />
  ))
}

/* Rótulo clicável genérico: bloco `drilldown` — um link que abre um modal. */
export function Drilldown({ block }) {
  const { openModal } = useModal()
  return (
    <button type="button" className="drilldown" onClick={() => openModal(block.details)}>
      {renderInline(block.label ?? 'Ver detalhes')} <ArrowRight size={14} aria-hidden="true" />
    </button>
  )
}

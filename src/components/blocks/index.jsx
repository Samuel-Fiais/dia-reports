import { lazy, Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { renderInline } from '../../lib/inline.jsx'
import ChartBlock from '../ChartBlock.jsx'
import Checklist from '../Checklist.jsx'
import ScheduleList from '../ScheduleList.jsx'
import Board from '../Board.jsx'
import TabsBlock from '../TabsBlock.jsx'
import CalendarMonth from '../CalendarMonth.jsx'
import CalendarWeek from '../CalendarWeek.jsx'
import CalendarYear from '../CalendarYear.jsx'
import { Indicator } from '../Badges.jsx'
import { useModal } from '../Modal.jsx'
import { normalizeTableBlock } from '../../lib/table.js'
import {
  Sparkline, MetricGrid, Scorecard, Funnel, Gauge, Heatmap, Ranking, Breakdown,
} from './analytics.jsx'
import {
  GroupedSummary, RecordCard, WorkItems, References, Metadata, PageBreak,
} from './structure.jsx'
import {
  Quote, MessageThread, Accordion, DefinitionList, PeopleList,
  StepList, Embed, Video, Attachment,
} from './content.jsx'
import { QuadrantGrid, Relations } from './compare.jsx'
import {
  Timeline, ProgressSummary, GroupedChangeList,
} from './plan.jsx'

const MermaidBlock = lazy(() => import('../MermaidBlock.jsx'))

function Figure({ block, children }) {
  return (
    <>
      {children}
      {(block.caption || block.credit) && (
        <p className="fig-caption">
          {block.figure && <span className="fig-ref">{block.figure}</span>}
          {block.figure ? ' — ' : ''}
          {block.caption && renderInline(block.caption)}
          {block.caption && block.credit ? ' — ' : ''}
          {block.credit && <span>{renderInline(block.credit)}</span>}
        </p>
      )}
    </>
  )
}

/* Switch central de blocos de conteúdo. Usado dentro de itens, em blocos de
   nível de corpo (via moldura full-width) e dentro de modais de detalhe. */
function ItemBlockContent({ block: rawBlock, chartStyleIndex, blockKey }) {
  const block = rawBlock
  switch (block.type) {
    /* ── Texto e listas ── */
    case 'paragraph':
      return <p>{renderInline(block.text)}</p>

    case 'list': {
      const List = block.style === 'ordered' ? 'ol' : 'ul'
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
        <div className="code-block">
          {(block.title || block.language) && (
            <div className="code-block-head">
              <span>{block.title}</span>
              <span>{block.language}</span>
            </div>
          )}
          <pre>
            <code data-language={block.language || undefined}>{block.code}</code>
          </pre>
        </div>
      )

    case 'diagram':
      return (
        <Figure block={block}>
          <Suspense fallback={<div className="mermaid-loading">Renderizando diagrama…</div>}>
            <MermaidBlock block={block} />
          </Suspense>
        </Figure>
      )

    /* ── Mídia ── */
    case 'chart':
      if (block.variant === 'sparkline') {
        return <Sparkline data={block.data ?? block.datasets?.[0]?.data ?? []} width={block.width ?? 180} height={block.height ?? 40} />
      }
      return (
        <Figure block={block}>
          <ChartBlock block={block} chartStyleIndex={chartStyleIndex} />
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

    case 'image-comparison':
      return (
        <Figure block={block}>
          <div className="before-after">
            {(block.items ?? []).map(
              (side, i) => (
                <figure key={i} className="before-after-side">
                  <img src={side.src} alt={side.alt ?? side.label ?? ''} />
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

    case 'attachment':
      return <Attachment block={block} />

    /* ── Citações e conversa ── */
    case 'quote':
      return <Quote block={block} />
    case 'message-thread':
      return <MessageThread block={block} />

    /* ── Interativos ── */
    case 'checklist':
      return <Checklist block={block} blockKey={blockKey} />
    case 'accordion':
      return <Accordion block={block} />
    case 'tabs':
      return <TabsBlock block={block} />

    /* ── Avisos e destaques ── */
    case 'callout':
      return (
        <div className={`callout callout--${block.tone ?? 'neutral'}`}>
          {block.label && <span className="callout-label">{block.label}</span>}
          <p>{renderInline(block.text)}</p>
        </div>
      )

    case 'definition-list':
      return <DefinitionList block={block} />

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
      return <Timeline block={block} />
    case 'schedule-list':
      return <ScheduleList block={block} />
    case 'calendar':
      if (block.view === 'week') return <CalendarWeek block={block} />
      if (block.view === 'year') return <CalendarYear block={block} />
      return <CalendarMonth block={{ ...block, month: block.date?.slice(0, 7) }} />

    /* ── Analíticos ── */
    case 'metric-grid':
      return <MetricGrid block={block} />
    case 'scorecard':
      return <Scorecard block={block} />
    case 'funnel':
      return <Funnel block={block} />
    case 'gauge':
      return <Gauge block={block} />
    case 'heatmap':
      return <Heatmap block={block} />
    case 'ranking':
      return <Ranking block={block} />
    case 'breakdown':
      return <Breakdown block={block} />
    case 'value-comparison':
      if (block.variant === 'table') {
        const columns = block.columns ?? []
        return (
          <table className="data-table value-comparison-table">
            <thead>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {(block.rows ?? []).map((row, index) => (
                <tr key={row.id ?? index}>
                  {columns.map((column) => (
                    <td key={column.key}>{renderInline(String(row[column.key] ?? ''))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
      return (
        <div>
          <div className="stat-comparison">
            <div className="stat-comparison-side stat-comparison-side--before">
              <span className="stat-comparison-label">{block.before?.label}</span>
              <span className="stat-comparison-value">{block.before?.value}</span>
            </div>
            <span className="stat-comparison-arrow"><ArrowRight size={18} /></span>
            <div className="stat-comparison-side stat-comparison-side--after">
              <span className="stat-comparison-label">{block.after?.label}</span>
              <span className="stat-comparison-value">{block.after?.value}</span>
            </div>
          </div>
          {block.note && <p className="stat-comparison-note">{renderInline(block.note)}</p>}
        </div>
      )

    /* ── Estrutura e governança ── */
    case 'grouped-summary':
      return <GroupedSummary block={block} />
    case 'record-card':
      return <RecordCard block={block} />
    case 'task-table':
      return <WorkItems block={block} />
    case 'references':
      return <References block={block} />
    case 'metadata':
      return <Metadata block={block} />
    case 'page-break':
      return <PageBreak />

    /* ── Comparação e decisão ── */
    case 'quadrant-grid':
      return <QuadrantGrid block={block} />
    case 'relations':
      return <Relations block={block} />

    /* ── Planejamento ── */
    case 'progress-summary':
      return <ProgressSummary block={block} />
    case 'grouped-change-list':
      return <GroupedChangeList block={block} />

    /* ── Pessoas e comunicação ── */
    case 'people-list':
      return <PeopleList block={block} />
    case 'step-list':
      return <StepList block={block} />

    case 'board':
      return <Board block={block} />

    /* ── Indicadores de estado ── */
    case 'indicator':
      return <Indicator block={block} />

    case 'trigger':
      return <Trigger block={block} />

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
  if (!block.details || block.type === 'trigger') return content
  return (
    <div className="block-with-details">
      {content}
      <button type="button" className="drilldown" onClick={() => openModal(block.details)}>
        {renderInline(block.detailsLabel ?? 'Ver detalhes')} <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

/* Renderiza uma lista de blocos usada pelo modal de detalhes. */
export function renderBlocks(blocks, chartStyleIndex = 2, keyPrefix = 'modal') {
  return (blocks ?? []).map((block, i) => (
    <ItemBlock
      key={block._key ?? block.id ?? `${keyPrefix}:${i}`}
      block={block}
      chartStyleIndex={chartStyleIndex}
      blockKey={block._key ?? block.id ?? `${keyPrefix}:${i}`}
    />
  ))
}

export function Trigger({ block }) {
  const { openModal } = useModal()
  return (
    <button type="button" className="drilldown" onClick={() => openModal(block.details)}>
      {renderInline(block.label)} <ArrowRight size={14} aria-hidden="true" />
    </button>
  )
}

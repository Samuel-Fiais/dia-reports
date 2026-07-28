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
  assertRendererCoverage,
  getBlockRenderer,
} from '../../lib/blockManifest.js'
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

function ParagraphRenderer({ block }) {
  return <p>{renderInline(block.text)}</p>
}

function ListRenderer({ block }) {
  const List = block.style === 'ordered' ? 'ol' : 'ul'
  return (
    <List className="item-bullets">
      {(block.items ?? []).map((item, index) => <li key={index}>{renderInline(item)}</li>)}
    </List>
  )
}

function TableRenderer({ block }) {
  const table = normalizeTableBlock(block)
  return (
    <table className="data-table">
      <thead><tr>{table.columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{renderInline(String(cell ?? ''))}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CodeRenderer({ block }) {
  return (
    <div className="code-block">
      {(block.title || block.language) && (
        <div className="code-block-head"><span>{block.title}</span><span>{block.language}</span></div>
      )}
      <pre><code data-language={block.language || undefined}>{block.code}</code></pre>
    </div>
  )
}

function DiagramRenderer({ block }) {
  return (
    <Figure block={block}>
      <Suspense fallback={<div className="mermaid-loading">Renderizando diagrama…</div>}>
        <MermaidBlock block={block} />
      </Suspense>
    </Figure>
  )
}

function ChartRenderer({ block, chartStyleIndex }) {
  if (block.variant === 'sparkline') {
    return <Sparkline data={block.data ?? block.datasets?.[0]?.data ?? []} width={block.width ?? 180} height={block.height ?? 40} />
  }
  return <Figure block={block}><ChartBlock block={block} chartStyleIndex={chartStyleIndex} /></Figure>
}

function ImageRenderer({ block }) {
  return <Figure block={block}><div className="image-wrap"><img src={block.src} alt={block.alt ?? ''} /></div></Figure>
}

function GalleryRenderer({ block }) {
  return (
    <div className="gallery">
      {(block.items ?? []).map((item, index) => (
        <figure key={item.id ?? index} className="gallery-item">
          <img src={item.src} alt={item.alt ?? ''} />
          {item.caption && <figcaption className="gallery-caption">{renderInline(item.caption)}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

function ImageComparisonRenderer({ block }) {
  return (
    <Figure block={block}>
      <div className="before-after">
        {(block.items ?? []).map((side, index) => (
          <figure key={side.id ?? index} className="before-after-side">
            <img src={side.src} alt={side.alt ?? side.label ?? ''} />
            <figcaption>{side.label}</figcaption>
          </figure>
        ))}
      </div>
    </Figure>
  )
}

function CalloutRenderer({ block }) {
  return (
    <div className={`callout callout--${block.tone ?? 'neutral'}`}>
      {block.label && <span className="callout-label">{block.label}</span>}
      <p>{renderInline(block.text)}</p>
    </div>
  )
}

function ProgressRenderer({ block }) {
  const value = Math.max(0, Math.min(100, Number(block.value) || 0))
  return (
    <div className="progress-block">
      <div className="progress-head">
        <span className="progress-label">{renderInline(block.label)}</span>
        <span className="progress-value">{value}%</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${value}%` }} /></div>
      {block.note && <span className="progress-note">{renderInline(block.note)}</span>}
    </div>
  )
}

function CalendarRenderer({ block }) {
  if (block.view === 'week') return <CalendarWeek block={block} />
  if (block.view === 'year') return <CalendarYear block={block} />
  return <CalendarMonth block={{ ...block, month: block.date?.slice(0, 7) }} />
}

function ValueComparisonRenderer({ block }) {
  if (block.variant === 'table') {
    const columns = block.columns ?? []
    return (
      <table className="data-table value-comparison-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {(block.rows ?? []).map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((column) => <td key={column.key}>{renderInline(String(row[column.key] ?? ''))}</td>)}
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
}

function DividerRenderer({ block }) {
  return <div className="block-divider">{block.label && <span className="block-divider-label">{block.label}</span>}</div>
}

const withBlock = (Component) => function BlockRenderer({ block }) {
  return <Component block={block} />
}

const EmbedRenderer = ({ block }) => <Figure block={block}><Embed block={block} /></Figure>
const ChecklistRenderer = ({ block, blockKey }) => <Checklist block={block} blockKey={blockKey} />
const PageBreakRenderer = () => <PageBreak />

export const BLOCK_RENDERERS = Object.freeze({
  paragraph: ParagraphRenderer,
  list: ListRenderer,
  quote: withBlock(Quote),
  'message-thread': withBlock(MessageThread),
  callout: CalloutRenderer,
  'definition-list': withBlock(DefinitionList),
  accordion: withBlock(Accordion),
  tabs: withBlock(TabsBlock),
  code: CodeRenderer,
  image: ImageRenderer,
  gallery: GalleryRenderer,
  'image-comparison': ImageComparisonRenderer,
  video: withBlock(Video),
  embed: EmbedRenderer,
  attachment: withBlock(Attachment),
  diagram: DiagramRenderer,
  table: TableRenderer,
  chart: ChartRenderer,
  'metric-grid': withBlock(MetricGrid),
  scorecard: withBlock(Scorecard),
  progress: ProgressRenderer,
  gauge: withBlock(Gauge),
  funnel: withBlock(Funnel),
  breakdown: withBlock(Breakdown),
  heatmap: withBlock(Heatmap),
  'quadrant-grid': withBlock(QuadrantGrid),
  ranking: withBlock(Ranking),
  'value-comparison': ValueComparisonRenderer,
  divider: DividerRenderer,
  'page-break': PageBreakRenderer,
  metadata: withBlock(Metadata),
  references: withBlock(References),
  trigger: ({ block }) => <Trigger block={block} />,
  timeline: withBlock(Timeline),
  'schedule-list': withBlock(ScheduleList),
  calendar: CalendarRenderer,
  board: withBlock(Board),
  checklist: ChecklistRenderer,
  'task-table': withBlock(WorkItems),
  relations: withBlock(Relations),
  'progress-summary': withBlock(ProgressSummary),
  'grouped-change-list': withBlock(GroupedChangeList),
  'people-list': withBlock(PeopleList),
  'grouped-summary': withBlock(GroupedSummary),
  'record-card': withBlock(RecordCard),
  'step-list': withBlock(StepList),
  indicator: withBlock(Indicator),
})

assertRendererCoverage(Object.keys(BLOCK_RENDERERS), 'item')

function ItemBlockContent({ block, chartStyleIndex, blockKey }) {
  const renderer = getBlockRenderer(block.type)
  const Renderer = BLOCK_RENDERERS[renderer]
  if (!Renderer) throw new Error(`Renderizador não disponível para o bloco "${block.type}"`)
  return <Renderer block={block} chartStyleIndex={chartStyleIndex} blockKey={blockKey} />
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

import { renderInline } from '../../lib/inline.jsx'

/* Catálogo de famílias: os tipos são variantes declarativas do mesmo padrão
   visual. Isso evita componentes quase idênticos e mantém a especificação
   extensível por JSON. */
export const ADVANCED_GROUPS = {
  'Investigação e análise': [
    'anomaly', 'correlation', 'causal-chain', 'five-whys', 'fishbone', 'decision-tree', 'sensitivity-analysis', 'scenario-simulator', 'confidence-interval', 'outlier-list', 'segmentation', 'pareto', 'control-chart', 'boxplot', 'scatter-plot', 'bubble-chart', 'sankey', 'sunburst', 'treemap', 'radar-chart', 'network-map',
  ],
  'Inteligência e explicação': [
    'insight', 'hypothesis', 'interpretation', 'why-it-matters', 'implication', 'counterpoint', 'uncertainty', 'evidence', 'claim', 'fact-check', 'assumption-impact', 'confidence-score', 'ai-summary', 'ai-analysis', 'ai-question', 'suggested-questions',
  ],
  Financeiro: [
    'income-statement', 'balance-sheet', 'cash-flow', 'budget-vs-actual', 'unit-economics', 'runway', 'burn-rate', 'revenue-bridge', 'margin-analysis', 'cost-breakdown', 'profitability-map', 'invoice-status', 'aging-table', 'subscription-metrics', 'financial-ratios',
  ],
  'Produto e tecnologia': [
    'feature-status', 'release-train', 'deployment-history', 'incident-timeline', 'service-health', 'uptime', 'latency-chart', 'error-rate', 'sla-status', 'dependency-map', 'api-endpoint', 'database-table', 'entity-relationship', 'log-viewer', 'trace-viewer', 'test-results', 'code-coverage', 'security-findings', 'technical-debt', 'architecture-decision-record',
  ],
  'Pessoas e organização': [
    'headcount', 'capacity', 'allocation', 'skills-matrix', 'performance-review', 'engagement-score', 'org-changes', 'hiring-pipeline', 'onboarding-progress', 'responsibility-matrix', 'stakeholder-map', 'team-health', 'workload', 'availability-map',
  ],
  'Comercial e marketing': [
    'sales-funnel', 'pipeline-forecast', 'deal-card', 'account-health', 'customer-journey', 'retention-curve', 'churn-analysis', 'campaign-performance', 'attribution', 'channel-mix', 'lead-source', 'persona-card', 'customer-voice', 'nps-breakdown', 'competitor-card', 'market-map',
  ],
  Operações: [
    'process-map', 'bottleneck', 'queue-status', 'throughput', 'cycle-time', 'lead-time', 'capacity-utilization', 'inventory-level', 'quality-score', 'defect-rate', 'sla-breaches', 'operations-board', 'handoff-map', 'process-compliance',
  ],
  'Jurídico, risco e conformidade': [
    'compliance-checklist', 'control-matrix', 'audit-finding', 'policy-reference', 'legal-clause', 'obligation-tracker', 'regulatory-change', 'privacy-impact', 'data-retention', 'consent-record', 'access-review', 'risk-heatmap', 'risk-treatment', 'audit-trail',
  ],
  'Pesquisa e ciência': [
    'methodology', 'research-question', 'experiment-design', 'sample-profile', 'statistical-test', 'p-value', 'effect-size', 'literature-review', 'citation-card', 'dataset-card', 'reproducibility', 'limitations', 'experiment-result', 'a-b-test',
  ],
  Geografia: [
    'choropleth-map', 'point-map', 'route-map', 'geo-heatmap', 'region-comparison', 'location-card', 'coverage-map', 'territory-map',
  ],
  'Interatividade avançada': [
    'parameter', 'what-if-control', 'cross-filter', 'drill-through', 'saved-view', 'bookmark', 'annotation', 'selection-summary', 'compare-mode', 'presentation-mode', 'reader-mode', 'focus-mode', 'export-control', 'share-control', 'refresh-control', 'live-indicator',
  ],
  Colaboração: [
    'comment-thread', 'mention', 'reaction', 'review-request', 'approval-flow', 'sign-off', 'suggestion', 'change-request', 'discussion-summary', 'unresolved-items', 'ownership', 'watchers', 'read-receipt',
  ],
  'Governança e versionamento': [
    'version-banner', 'draft-warning', 'staleness-warning', 'data-lineage', 'source-status', 'refresh-history', 'change-log-block', 'content-diff', 'schema-version', 'deprecation-notice', 'retention-policy', 'access-policy', 'classification', 'watermark',
  ],
  Automação: [
    'trigger', 'automation-status', 'workflow-run', 'job-history', 'scheduled-refresh', 'alert-rule', 'alert-history', 'notification-settings', 'subscription', 'data-refresh', 'sync-status', 'webhook-event', 'integration-card',
  ],
  'Conteúdo editorial': [
    'chapter-cover', 'pull-quote', 'sidebar', 'marginalia', 'captioned-figure', 'figure-reference', 'equation', 'footnote-reference', 'endnotes', 'bibliography', 'glossary-term', 'author-note', 'editor-note', 'abstract', 'preface', 'conclusion',
  ],
  'Relatórios compostos': [
    'board-report', 'incident-report', 'project-status-report', 'financial-report', 'research-report', 'product-review', 'weekly-review', 'customer-health-report', 'security-report', 'operational-review',
  ],
}

export const ADVANCED_TYPES = new Set(Object.values(ADVANCED_GROUPS).flat())

export const advancedType = (type) => String(type).toLowerCase().replaceAll('/', '-')

const labelFor = (type) => String(type).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const groupFor = (type) => Object.entries(ADVANCED_GROUPS).find(([, types]) => types.includes(type))?.[0] ?? 'Especializado'

const valuesFor = (block) => {
  const entries = block.rows ?? block.items ?? block.evidence ?? block.details ?? []
  if (Array.isArray(entries)) return entries
  if (typeof entries === 'object' && entries) return Object.entries(entries).map(([label, value]) => ({ label, value }))
  return []
}

export function AdvancedBlock({ block }) {
  const type = advancedType(block.type)
  const group = groupFor(type)
  const entries = valuesFor(block)
  const title = block.title ?? block.label ?? labelFor(type)
  const summary = block.summary ?? block.text ?? block.description

  return (
    <section className={`advanced-block advanced-block--${type}`} aria-label={title}>
      <header className="advanced-block-head">
        <span className="advanced-block-family">{group}</span>
        {block.status && <span className="advanced-block-status">{block.status}</span>}
      </header>
      <h3 className="advanced-block-title">{renderInline(title)}</h3>
      {summary && <p className="advanced-block-summary">{renderInline(summary)}</p>}
      {entries.length > 0 && (
        <dl className="advanced-block-list">
          {entries.slice(0, 8).map((entry, index) => {
            const item = typeof entry === 'string' ? { label: entry } : entry
            return (
              <div key={item.id ?? item.label ?? item.name ?? index}>
                <dt>{renderInline(item.label ?? item.name ?? item.title ?? `Item ${index + 1}`)}</dt>
                {(item.value ?? item.text ?? item.note ?? item.status) && <dd>{renderInline(String(item.value ?? item.text ?? item.note ?? item.status))}</dd>}
              </div>
            )
          })}
        </dl>
      )}
      {(block.confidence ?? block.severity ?? block.owner) && (
        <footer className="advanced-block-meta">
          {block.confidence != null && <span>Confiança: {block.confidence}</span>}
          {block.severity && <span>Severidade: {block.severity}</span>}
          {block.owner && <span>Responsável: {block.owner}</span>}
        </footer>
      )}
    </section>
  )
}

/* Catálogo compacto para o relatório de exemplo; cada cartão representa uma
   variante pronta para receber a estrutura de dados específica no JSON. */
export function AdvancedCatalog({ block }) {
  const groups = block.groups?.length ? block.groups : Object.keys(ADVANCED_GROUPS)
  return (
    <div className="advanced-catalog">
      {groups.map((group) => {
        const variants = ADVANCED_GROUPS[group] ?? []
        return (
          <section key={group} className="advanced-catalog-group">
            <h3>{group}</h3>
            <div className="advanced-catalog-variants">
              {variants.map((variant) => <code key={variant}>{variant}</code>)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

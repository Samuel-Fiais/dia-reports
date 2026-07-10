// Vocabulário compartilhado de estados — usado por status-badge, kanban,
// action-items, milestones, scorecard, project-health, etc.
export const STATUS = {
  'not-started': { label: 'Não iniciado', tone: 'muted' },
  'in-progress': { label: 'Em andamento', tone: 'active' },
  blocked: { label: 'Bloqueado', tone: 'bad' },
  'at-risk': { label: 'Em risco', tone: 'warn' },
  completed: { label: 'Concluído', tone: 'good' },
  cancelled: { label: 'Cancelado', tone: 'muted' },
}

export const PRIORITY = {
  low: { label: 'Baixa', weight: 1 },
  medium: { label: 'Média', weight: 2 },
  high: { label: 'Alta', weight: 3 },
  critical: { label: 'Crítica', weight: 4 },
}

export const TREND = {
  up: { label: 'Subindo', glyph: '↑' },
  flat: { label: 'Estável', glyph: '→' },
  down: { label: 'Caindo', glyph: '↓' },
}

export const HEALTH = {
  healthy: { label: 'Saudável', tone: 'good' },
  attention: { label: 'Atenção', tone: 'warn' },
  critical: { label: 'Crítico', tone: 'bad' },
}

export function statusInfo(key) {
  return STATUS[key] ?? { label: key, tone: 'muted' }
}

export function priorityInfo(key) {
  return PRIORITY[key] ?? { label: key, weight: 0 }
}

export function trendInfo(key) {
  return TREND[key] ?? TREND.flat
}

export function healthInfo(key) {
  return HEALTH[key] ?? { label: key, tone: 'muted' }
}

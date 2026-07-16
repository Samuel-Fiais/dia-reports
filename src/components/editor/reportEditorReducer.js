import { createBlock } from '../../lib/blockRegistry.js'

export const emptyReport = (slug = '') => ({
  id: slug,
  title: '',
  from: 'Dia Reports',
  date: new Date().toISOString(),
  settings: { colorIndex: 0, fontIndex: 0, chartStyleIndex: 2, widthMode: 'standard', fontScale: 'default' },
  headline: [''],
  intro: [''],
  metrics: [],
  body: [],
})

export const initialEditorState = (report) => ({
  report: structuredClone(report),
  selection: { kind: 'metadata' },
  past: [],
  future: [],
  dirty: false,
})

const withChange = (state, report, selection = state.selection) => ({
  ...state,
  report,
  selection,
  past: [...state.past.slice(-39), state.report],
  future: [],
  dirty: true,
})

const clone = (value) => structuredClone(value)

function selectedNode(report, selection) {
  if (selection.kind === 'metrics') return report.metrics ?? []
  if (selection.kind === 'body') return report.body[selection.bodyIndex]
  if (selection.kind === 'section') return report.body[selection.bodyIndex]
  if (selection.kind === 'item') return report.body[selection.bodyIndex]?.items?.[selection.itemIndex]
  if (selection.kind === 'block') return report.body[selection.bodyIndex]?.items?.[selection.itemIndex]?.blocks?.[selection.blockIndex]
  return report
}

function replaceSelected(report, selection, value) {
  if (selection.kind === 'metadata') return value
  if (selection.kind === 'metrics') report.metrics = value
  if (selection.kind === 'body' || selection.kind === 'section') report.body[selection.bodyIndex] = value
  if (selection.kind === 'item') report.body[selection.bodyIndex].items[selection.itemIndex] = value
  if (selection.kind === 'block') report.body[selection.bodyIndex].items[selection.itemIndex].blocks[selection.blockIndex] = value
  return report
}

const move = (items, from, to) => {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function reportEditorReducer(state, action) {
  switch (action.type) {
    case 'select': return { ...state, selection: action.selection }
    case 'reset': return initialEditorState(action.report)
    case 'mark-saved': return { ...state, dirty: false, past: [], future: [] }
    case 'undo': {
      if (!state.past.length) return state
      const report = state.past.at(-1)
      return { ...state, report, past: state.past.slice(0, -1), future: [state.report, ...state.future], dirty: true, selection: { kind: 'metadata' } }
    }
    case 'redo': {
      if (!state.future.length) return state
      const [report, ...future] = state.future
      return { ...state, report, past: [...state.past, state.report], future, dirty: true, selection: { kind: 'metadata' } }
    }
    case 'update-selected': {
      const report = clone(state.report)
      const current = clone(selectedNode(report, state.selection))
      const next = typeof action.value === 'function' ? action.value(current) : action.value
      return withChange(state, replaceSelected(report, state.selection, next))
    }
    case 'update-report': return withChange(state, { ...state.report, ...action.patch })
    case 'add-section': {
      const report = clone(state.report)
      const section = { type: 'section', heading: `Nova seção`, items: [] }
      report.body.push(section)
      return withChange(state, report, { kind: 'section', bodyIndex: report.body.length - 1 })
    }
    case 'add-body-block': {
      const report = clone(state.report)
      const block = action.block
      report.body.push(block)
      return withChange(state, report, { kind: 'body', bodyIndex: report.body.length - 1 })
    }
    case 'add-item': {
      const report = clone(state.report)
      const items = report.body[action.bodyIndex].items ??= []
      const showLabel = action.showLabel !== false
      items.push({ title: showLabel ? 'Novo item' : '', badge: '', description: '', showLabel, columns: 1, blocks: [] })
      return withChange(state, report, { kind: 'item', bodyIndex: action.bodyIndex, itemIndex: items.length - 1 })
    }
    case 'add-block': {
      const report = clone(state.report)
      const blocks = report.body[action.bodyIndex].items[action.itemIndex].blocks ??= []
      blocks.push(createBlock(action.blockType))
      return withChange(state, report, { kind: 'block', bodyIndex: action.bodyIndex, itemIndex: action.itemIndex, blockIndex: blocks.length - 1 })
    }
    case 'duplicate': {
      const report = clone(state.report)
      const selection = state.selection
      if (selection.kind === 'section' || selection.kind === 'body') report.body.splice(selection.bodyIndex + 1, 0, clone(report.body[selection.bodyIndex]))
      if (selection.kind === 'item') report.body[selection.bodyIndex].items.splice(selection.itemIndex + 1, 0, clone(report.body[selection.bodyIndex].items[selection.itemIndex]))
      if (selection.kind === 'block') report.body[selection.bodyIndex].items[selection.itemIndex].blocks.splice(selection.blockIndex + 1, 0, clone(report.body[selection.bodyIndex].items[selection.itemIndex].blocks[selection.blockIndex]))
      return withChange(state, report)
    }
    case 'remove': {
      const report = clone(state.report)
      const selection = state.selection
      let nextSelection = { kind: 'metadata' }
      if (selection.kind === 'section' || selection.kind === 'body') {
        report.body.splice(selection.bodyIndex, 1)
        if (report.body.length) {
          const bodyIndex = Math.min(selection.bodyIndex, report.body.length - 1)
          nextSelection = { kind: report.body[bodyIndex].type === 'section' ? 'section' : 'body', bodyIndex }
        }
      }
      if (selection.kind === 'item') {
        const items = report.body[selection.bodyIndex].items
        items.splice(selection.itemIndex, 1)
        nextSelection = items.length
          ? { kind: 'item', bodyIndex: selection.bodyIndex, itemIndex: Math.min(selection.itemIndex, items.length - 1) }
          : { kind: 'section', bodyIndex: selection.bodyIndex }
      }
      if (selection.kind === 'block') {
        const blocks = report.body[selection.bodyIndex].items[selection.itemIndex].blocks
        blocks.splice(selection.blockIndex, 1)
        nextSelection = blocks.length
          ? { kind: 'block', bodyIndex: selection.bodyIndex, itemIndex: selection.itemIndex, blockIndex: Math.min(selection.blockIndex, blocks.length - 1) }
          : { kind: 'item', bodyIndex: selection.bodyIndex, itemIndex: selection.itemIndex }
      }
      return withChange(state, report, nextSelection)
    }
    case 'move': {
      const report = clone(state.report)
      const { level, bodyIndex, itemIndex, from, to } = action
      if (level === 'body') report.body = move(report.body, from, to)
      if (level === 'item') report.body[bodyIndex].items = move(report.body[bodyIndex].items, from, to)
      if (level === 'block') report.body[bodyIndex].items[itemIndex].blocks = move(report.body[bodyIndex].items[itemIndex].blocks, from, to)
      return withChange(state, report, { kind: 'metadata' })
    }
    case 'replace-report': return withChange(state, action.report, { kind: 'metadata' })
    default: return state
  }
}

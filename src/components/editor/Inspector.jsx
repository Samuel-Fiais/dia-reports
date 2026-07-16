import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Braces, Copy, Trash2 } from 'lucide-react'
import { BLOCK_TYPES, getBlockDefinition } from '../../lib/blockRegistry.js'
import { useAppTheme } from '../../context/ThemeContext.jsx'
import { COLORS, COLORS_DARK, COLOR_NAMES, FONTS, FONT_SCALES, CHART_STYLES } from '../../lib/theme.js'
import JsonEditor from '../admin/JsonEditor.jsx'
import Checkbox from '../admin/Checkbox.jsx'
import { EditorField, EditorFields } from './fields/EditorFields.jsx'
import BlockDetailsEditor from './BlockDetailsEditor.jsx'

const parseObject = (text) => {
  try {
    const result = JSON.parse(text)
    return result && typeof result === 'object' && !Array.isArray(result) ? result : null
  } catch {
    return null
  }
}

const metadataFields = [
  { key: 'title', type: 'text', label: 'Título do documento' },
  { key: 'from', type: 'text', label: 'Origem / contexto' },
  { key: 'date', type: 'date', label: 'Data' },
  { key: 'headline', type: 'array-string', label: 'Headline' },
  { key: 'intro', type: 'array-string', label: 'Introdução' },
]

const metricsField = { key: 'items', type: 'array-object', label: 'Métricas', itemFields: [
  { key: 'value', type: 'text', label: 'Valor' }, { key: 'label', type: 'text', label: 'Rótulo' },
  { key: 'note', type: 'text', label: 'Nota' }, { key: 'span', type: 'number', label: 'Colunas (1–12)' },
] }

const itemFields = [
  { key: 'showLabel', type: 'toggle', label: 'Exibir label lateral', defaultValue: true },
  { key: 'title', type: 'text', label: 'Título' }, { key: 'badge', type: 'text', label: 'Badge' },
  { key: 'description', type: 'textarea', label: 'Descrição' }, { key: 'columns', type: 'number', label: 'Colunas (1–6)', min: 1, max: 6 },
]

const bodyFrameFields = [
  { key: 'heading', type: 'text', label: 'Título do bloco no corpo' },
  { key: 'description', type: 'textarea', label: 'Descrição do bloco no corpo' },
]

function JsonFallback({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const parsed = useMemo(() => parseObject(text), [text])
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value])
  return (
    <div className="editor-json-fallback">
      <button type="button" className="editor-secondary-btn" onClick={() => setOpen((current) => !current)}><Braces size={14} /> {open ? 'Ocultar JSON' : 'Editar como JSON'}</button>
      {open && <><JsonEditor value={text} onChange={setText} valid={Boolean(parsed)} rows={12} />{parsed && <button type="button" className="editor-primary-btn" onClick={() => onChange(parsed)}>Aplicar JSON</button>}</>}
    </div>
  )
}

function AppearanceEditor({ settings = {}, onChange }) {
  const { appTheme } = useAppTheme()
  const palette = appTheme === 'dark' ? COLORS_DARK : COLORS
  return (
    <div className="editor-settings">
      <h3>Aparência inicial</h3>
      <span className="editor-field-label">Fundo</span>
      <div className="editor-color-grid">{palette.map((color, index) => <button key={color} type="button" className={settings.colorIndex === index ? 'active' : ''} style={{ background: color }} title={COLOR_NAMES[index]} aria-label={COLOR_NAMES[index]} onClick={() => onChange({ ...settings, colorIndex: index })} />)}</div>
      <EditorField field={{ key: 'fontIndex', type: 'select', label: 'Tipografia', options: FONTS.map((font, index) => ({ value: index, label: font.label })) }} value={settings.fontIndex ?? 0} onChange={(value) => onChange({ ...settings, fontIndex: Number(value) })} />
      <EditorField field={{ key: 'chartStyleIndex', type: 'select', label: 'Estilo dos gráficos', options: CHART_STYLES.map((style, index) => ({ value: index, label: style.label })) }} value={settings.chartStyleIndex ?? 2} onChange={(value) => onChange({ ...settings, chartStyleIndex: Number(value) })} />
      <EditorField field={{ key: 'widthMode', type: 'select', label: 'Largura', options: [{ value: 'standard', label: 'Padrão' }, { value: 'full', label: 'Largura total' }] }} value={settings.widthMode ?? 'standard'} onChange={(value) => onChange({ ...settings, widthMode: value })} />
      <EditorField field={{ key: 'fontScale', type: 'select', label: 'Tamanho do texto', options: FONT_SCALES }} value={settings.fontScale ?? 'default'} onChange={(value) => onChange({ ...settings, fontScale: value })} />
    </div>
  )
}

function CoverEditor({ cover = {}, onChange }) {
  return <div className="editor-settings"><h3>Capa</h3><EditorFields fields={[
    { key: 'src', type: 'image', label: 'Imagem' }, { key: 'alt', type: 'text', label: 'Texto alternativo' },
    { key: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { key: 'caption', type: 'textarea', label: 'Legenda' }, { key: 'credit', type: 'text', label: 'Crédito' },
    { key: 'sideLeft', type: 'text', label: 'Lateral esquerda' }, { key: 'sideRight', type: 'text', label: 'Lateral direita' },
  ]} value={cover} onChange={onChange} /></div>
}

function GroupsEditor({ groups, groupIds, onChange }) {
  if (!groups) return null
  return <div className="editor-settings"><h3>Visibilidade</h3><p className="editor-help">Sem grupo selecionado, o relatório fica disponível para qualquer pessoa logada.</p><div className="editor-group-list">{groups.map((group) => <Checkbox key={group.id} checked={groupIds.includes(group.id)} onChange={() => onChange(groupIds.includes(group.id) ? groupIds.filter((id) => id !== group.id) : [...groupIds, group.id])}>{group.name}</Checkbox>)}</div></div>
}

function InspectorActions({ selection, dispatch }) {
  if (selection.kind === 'metadata' || selection.kind === 'metrics') return null
  return <div className="editor-inspector-actions"><button type="button" className="editor-secondary-btn" onClick={() => dispatch({ type: 'duplicate' })}><Copy size={13} /> Duplicar</button><button type="button" className="editor-danger-btn" onClick={() => dispatch({ type: 'remove' })}><Trash2 size={13} /> Remover</button></div>
}

export default function Inspector({ state, dispatch, groups, groupIds, onGroupIdsChange }) {
  const scrollRef = useRef(null)
  const pendingScrollTop = useRef(null)
  const { report, selection } = state

  useLayoutEffect(() => {
    if (pendingScrollTop.current == null || !scrollRef.current) return
    const scroller = scrollRef.current
    const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
    scroller.scrollTop = Math.min(pendingScrollTop.current, maxTop)
    pendingScrollTop.current = null
  }, [report, groupIds])
  let value = report
  let title = 'Dados do relatório'
  let fields = metadataFields

  if (selection.kind === 'section') { value = report.body[selection.bodyIndex]; title = 'Seção'; fields = [{ key: 'heading', type: 'text', label: 'Título da seção' }] }
  if (selection.kind === 'metrics') { value = { items: report.metrics ?? [] }; title = 'Métricas'; fields = [metricsField] }
  if (selection.kind === 'body') { value = report.body[selection.bodyIndex]; title = getBlockDefinition(value?.type).label; fields = [...bodyFrameFields, ...getBlockDefinition(value?.type).fields.filter((field) => !bodyFrameFields.some((bodyField) => bodyField.key === field.key))] }
  if (selection.kind === 'item') {
    value = report.body[selection.bodyIndex]?.items?.[selection.itemIndex]
    title = value?.showLabel === false ? 'Item sem label' : 'Item com label'
    fields = value?.showLabel === false ? [itemFields[0], itemFields[4]] : itemFields
  }
  if (selection.kind === 'block') { value = report.body[selection.bodyIndex]?.items?.[selection.itemIndex]?.blocks?.[selection.blockIndex]; title = getBlockDefinition(value?.type).label; fields = getBlockDefinition(value?.type).fields }

  const update = (next) => {
    pendingScrollTop.current = scrollRef.current?.scrollTop ?? 0
    if (selection.kind === 'metadata') dispatch({ type: 'replace-report', report: next })
    else if (selection.kind === 'metrics') dispatch({ type: 'update-selected', value: next.items })
    else dispatch({ type: 'update-selected', value: next })
  }
  const updateGroups = (next) => {
    pendingScrollTop.current = scrollRef.current?.scrollTop ?? 0
    onGroupIdsChange(next)
  }
  if (!value) return <aside className="editor-inspector"><p>Selecione um elemento.</p></aside>

  return (
    <aside className="editor-inspector">
      <div className="editor-panel-heading"><span>Inspector</span><strong>{title}</strong></div>
      <div ref={scrollRef} className="editor-inspector-scroll">
        <EditorFields fields={fields} value={value} onChange={update} />
        {selection.kind === 'metrics' && (value.items ?? []).map((metric, index) => (
          <details key={index} className="editor-nested-block editor-metric-details">
            <summary>Modal da métrica {index + 1}</summary>
            <BlockDetailsEditor block={metric} onChange={(next) => update({ items: value.items.map((entry, i) => i === index ? next : entry) })} />
          </details>
        ))}
        {(selection.kind === 'block' || selection.kind === 'body' || selection.kind === 'section') && <>
          <BlockDetailsEditor block={value} onChange={update} />
        </>}
        {selection.kind === 'metadata' && <>
          <CoverEditor cover={report.cover ?? {}} onChange={(cover) => dispatch({ type: 'update-report', patch: { cover } })} />
          <AppearanceEditor settings={report.settings} onChange={(settings) => dispatch({ type: 'update-report', patch: { settings } })} />
          <GroupsEditor groups={groups} groupIds={groupIds} onChange={updateGroups} />
        </>}
        {(selection.kind === 'block' || selection.kind === 'body' || selection.kind === 'section') && <JsonFallback value={value} onChange={update} />}
        {selection.kind === 'block' && !BLOCK_TYPES[value.type] && <p className="editor-help">Tipo legado: use o fallback JSON para propriedades não reconhecidas.</p>}
      </div>
      <InspectorActions selection={selection} dispatch={dispatch} />
    </aside>
  )
}

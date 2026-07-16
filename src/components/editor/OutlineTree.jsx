import { useEffect, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BarChart3, ChevronDown, ChevronRight, FileText, GripVertical, Layers3, Plus, Rows3 } from 'lucide-react'
import { getBlockDefinition } from '../../lib/blockRegistry.js'
import BlockPicker from './BlockPicker.jsx'

const selected = (current, candidate) => Object.keys(candidate).every((key) => current[key] === candidate[key])

function SortableRow({ id, depth = 0, active, icon, label, secondary, onClick, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return <div ref={setNodeRef} data-outline-id={id} style={{ transform: CSS.Transform.toString(transform), transition, '--outline-depth': depth }} className={`editor-outline-row${active ? ' active' : ''}${isDragging ? ' dragging' : ''}`} onClick={onClick}><button type="button" className="editor-drag-handle" {...attributes} {...listeners} aria-label="Arrastar para reordenar"><GripVertical size={13} /></button>{icon}<span className="editor-outline-label">{label || 'Sem título'}{secondary && <small>{secondary}</small>}</span>{children}</div>
}

function BlockRows({ report, bodyIndex, itemIndex, selection, dispatch }) {
  const blocks = report.body[bodyIndex].items[itemIndex].blocks ?? []
  return <SortableContext items={blocks.map((_, blockIndex) => `k:${bodyIndex}:${itemIndex}:${blockIndex}`)} strategy={verticalListSortingStrategy}>{blocks.map((block, blockIndex) => <SortableRow key={`k:${bodyIndex}:${itemIndex}:${blockIndex}`} id={`k:${bodyIndex}:${itemIndex}:${blockIndex}`} depth={2} icon={<Layers3 size={13} />} label={getBlockDefinition(block.type).label} secondary={block.type} active={selected(selection, { kind: 'block', bodyIndex, itemIndex, blockIndex })} onClick={(event) => { event.stopPropagation(); dispatch({ type: 'select', selection: { kind: 'block', bodyIndex, itemIndex, blockIndex } }) }} />)}</SortableContext>
}

function ItemRows({ report, bodyIndex, selection, dispatch, onAddBlock }) {
  const items = report.body[bodyIndex].items ?? []
  return <SortableContext items={items.map((_, itemIndex) => `i:${bodyIndex}:${itemIndex}`)} strategy={verticalListSortingStrategy}>{items.map((item, itemIndex) => <div key={`i:${bodyIndex}:${itemIndex}`}><SortableRow id={`i:${bodyIndex}:${itemIndex}`} depth={1} icon={<Rows3 size={13} />} label={item.showLabel === false ? 'Blocos em largura total' : item.title} secondary={`${item.blocks?.length ?? 0} blocos`} active={selected(selection, { kind: 'item', bodyIndex, itemIndex })} onClick={() => dispatch({ type: 'select', selection: { kind: 'item', bodyIndex, itemIndex } })}><button type="button" className="editor-inline-add" title="Adicionar bloco" onClick={(event) => { event.stopPropagation(); onAddBlock(bodyIndex, itemIndex) }}><Plus size={13} /></button></SortableRow><BlockRows report={report} bodyIndex={bodyIndex} itemIndex={itemIndex} selection={selection} dispatch={dispatch} /></div>)}</SortableContext>
}

export default function OutlineTree({ state, dispatch }) {
  const [picker, setPicker] = useState(null)
  const [itemPicker, setItemPicker] = useState(null)
  const [collapsed, setCollapsed] = useState(new Set())
  const scrollRef = useRef(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const { report, selection } = state
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    if ((selection.kind === 'item' || selection.kind === 'block') && collapsed.has(selection.bodyIndex)) {
      setCollapsed((current) => {
        const next = new Set(current)
        next.delete(selection.bodyIndex)
        return next
      })
      return
    }
    const id = selection.kind === 'metadata' ? 'metadata'
      : selection.kind === 'metrics' ? 'metrics'
        : selection.kind === 'block' ? `k:${selection.bodyIndex}:${selection.itemIndex}:${selection.blockIndex}`
          : selection.kind === 'item' ? `i:${selection.bodyIndex}:${selection.itemIndex}`
            : `b:${selection.bodyIndex}`
    const target = scroller.querySelector(`[data-outline-id="${id}"]`)
    if (!target) return
    const scrollerRect = scroller.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = scroller.scrollTop + targetRect.top - scrollerRect.top - scroller.clientHeight / 2 + target.clientHeight / 2
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [collapsed, selection])
  const toggle = (index) => setCollapsed((current) => { const next = new Set(current); next.has(index) ? next.delete(index) : next.add(index); return next })
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = String(active.id).split(':')
    const to = String(over.id).split(':')
    if (from[0] !== to[0]) return
    if (from[0] === 'b') dispatch({ type: 'move', level: 'body', from: Number(from[1]), to: Number(to[1]) })
    if (from[0] === 'i' && from[1] === to[1]) dispatch({ type: 'move', level: 'item', bodyIndex: Number(from[1]), from: Number(from[2]), to: Number(to[2]) })
    if (from[0] === 'k' && from[1] === to[1] && from[2] === to[2]) dispatch({ type: 'move', level: 'block', bodyIndex: Number(from[1]), itemIndex: Number(from[2]), from: Number(from[3]), to: Number(to[3]) })
  }
  return (
    <aside className="editor-outline">
      <div className="editor-panel-heading"><span>Estrutura</span><strong>Outline</strong></div>
      <div className="editor-outline-rootnodes"><button type="button" data-outline-id="metadata" className={`editor-outline-meta${selection.kind === 'metadata' ? ' active' : ''}`} onClick={() => dispatch({ type: 'select', selection: { kind: 'metadata' } })}><FileText size={14} /> Dados, capa e tema</button><button type="button" data-outline-id="metrics" className={`editor-outline-meta${selection.kind === 'metrics' ? ' active' : ''}`} onClick={() => dispatch({ type: 'select', selection: { kind: 'metrics' } })}><BarChart3 size={14} /> Métricas <small>{report.metrics?.length ?? 0}</small></button></div>
      <div className="editor-outline-scroll" ref={scrollRef}><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={report.body.map((_, bodyIndex) => `b:${bodyIndex}`)} strategy={verticalListSortingStrategy}>{report.body.map((body, bodyIndex) => {
        const isSection = body.type === 'section'
        const isCollapsed = collapsed.has(bodyIndex)
        return <div key={`b:${bodyIndex}`}><SortableRow id={`b:${bodyIndex}`} icon={isSection ? <button type="button" className="editor-collapse" onClick={(event) => { event.stopPropagation(); toggle(bodyIndex) }}>{isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}</button> : <Layers3 size={13} />} label={isSection ? body.heading : getBlockDefinition(body.type).label} secondary={isSection ? `${body.items?.length ?? 0} itens` : body.type} active={selected(selection, { kind: isSection ? 'section' : 'body', bodyIndex })} onClick={() => dispatch({ type: 'select', selection: { kind: isSection ? 'section' : 'body', bodyIndex } })}>{isSection && <button type="button" className="editor-inline-add" title="Adicionar item" onClick={(event) => { event.stopPropagation(); setItemPicker(bodyIndex) }}><Plus size={13} /></button>}</SortableRow>{isSection && !isCollapsed && <ItemRows report={report} bodyIndex={bodyIndex} selection={selection} dispatch={dispatch} onAddBlock={(sectionIndex, itemIndex) => setPicker({ bodyIndex: sectionIndex, itemIndex })} />}</div>
      })}</SortableContext></DndContext></div>
      <div className="editor-outline-footer"><button type="button" onClick={() => dispatch({ type: 'add-section' })}><Plus size={13} /> Seção</button><button type="button" onClick={() => setPicker({ bodyOnly: true })}><Plus size={13} /> Bloco avulso</button></div>
      {itemPicker !== null && <div className="editor-picker-backdrop" onClick={() => setItemPicker(null)}><div className="editor-item-picker" role="dialog" aria-modal="true" aria-label="Escolher formato do item" onClick={(event) => event.stopPropagation()}><span>Novo item</span><h2>Como este item deve aparecer?</h2><div><button type="button" onClick={() => { dispatch({ type: 'add-item', bodyIndex: itemPicker, showLabel: true }); setItemPicker(null) }}><strong>Com label</strong><small>Título, badge e explicação ficam na coluna esquerda.</small></button><button type="button" onClick={() => { dispatch({ type: 'add-item', bodyIndex: itemPicker, showLabel: false }); setItemPicker(null) }}><strong>Sem label</strong><small>Os blocos ocupam toda a largura disponível.</small></button></div></div></div>}
      {picker && <BlockPicker bodyOnly={picker.bodyOnly} onClose={() => setPicker(null)} onPick={(blockType) => { picker.bodyOnly ? dispatch({ type: 'add-body-block', block: BLOCK_BODY_VALUE(blockType) }) : dispatch({ type: 'add-block', bodyIndex: picker.bodyIndex, itemIndex: picker.itemIndex, blockType }); setPicker(null) }} />}
    </aside>
  )
}

function BLOCK_BODY_VALUE(type) {
  if (type === 'quote-break') return { type, text: '' }
  if (type === 'image-break') return { type, src: '', alt: '' }
  if (type === 'table-of-contents') return { type, heading: 'Sumário' }
  return { type, ids: [] }
}

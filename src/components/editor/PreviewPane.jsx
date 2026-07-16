import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Expand, Minimize2, Monitor, Smartphone } from 'lucide-react'
import ReportView from '../ReportView.jsx'
import { useAppTheme } from '../../context/ThemeContext.jsx'
import { COLORS, COLORS_DARK, FONTS, FONT_SCALES } from '../../lib/theme.js'

export default function PreviewPane({ report, selection, onSelect }) {
  const { appTheme } = useAppTheme()
  const [compact, setCompact] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const documentRef = useRef(null)
  const stageRef = useRef(null)
  const selectionFromPreview = useRef(false)
  const settings = report.settings ?? {}
  const palette = appTheme === 'dark' ? COLORS_DARK : COLORS
  const font = FONTS[settings.fontIndex ?? 0] ?? FONTS[0]
  const scale = FONT_SCALES.find((entry) => entry.value === settings.fontScale) ?? FONT_SCALES[1]
  const style = {
    '--bg': palette[settings.colorIndex ?? 0] ?? palette[0], '--font-title': font.stack, '--font-body': font.bodyStack,
    '--title-style': font.style, '--title-weight': font.weight, '--title-weight-sub': font.weightSub ?? font.weight,
    '--report-font-size': scale.size,
  }

  useEffect(() => {
    const root = documentRef.current
    const stage = stageRef.current
    if (!root || !stage) return undefined

    root.querySelectorAll('.editor-preview-selected').forEach((element) => element.classList.remove('editor-preview-selected'))
    if (expanded || !selection) return undefined

    let target = root
    if (selection.kind === 'metrics') {
      target = root.querySelector('.metrics-strip')
    } else if (selection.kind !== 'metadata') {
      const bodyNode = root.querySelectorAll('.report-body > *')[selection.bodyIndex]
      target = bodyNode
      if (selection.kind === 'item' || selection.kind === 'block') {
        target = bodyNode?.querySelectorAll('.section-items > .report-item')[selection.itemIndex]
      }
      if (selection.kind === 'block') {
        target = target?.querySelectorAll('.item-block-cell')[selection.blockIndex]
      }
    }

    if (!target) return undefined
    target.classList.add('editor-preview-selected')
    if (selectionFromPreview.current) {
      selectionFromPreview.current = false
    } else {
      const stageRect = stage.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const rawTop = selection.kind === 'metadata'
        ? 0
        : stage.scrollTop + targetRect.top - stageRect.top - (stage.clientHeight - targetRect.height) / 2
      const top = Math.max(0, Math.min(rawTop, stage.scrollHeight - stage.clientHeight))
      stage.scrollTo({ top, behavior: 'smooth' })
    }
    const timer = window.setTimeout(() => target.classList.remove('editor-preview-selected'), 1400)
    return () => {
      window.clearTimeout(timer)
      target.classList.remove('editor-preview-selected')
    }
  }, [expanded, report.metrics?.length, selection])

  useEffect(() => {
    if (!expanded) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [expanded])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const maxTop = Math.max(0, stage.scrollHeight - stage.clientHeight)
    if (stage.scrollTop > maxTop) stage.scrollTop = maxTop
  }, [report.body])

  const handlePreviewClick = (event) => {
    const root = documentRef.current
    if (expanded || !root || !onSelect) return
    const metrics = event.target.closest('.metrics-strip')
    const select = (nextSelection) => {
      selectionFromPreview.current = true
      onSelect(nextSelection)
    }
    if (metrics) { select({ kind: 'metrics' }); return }

    const blockNode = event.target.closest('.item-block-cell')
    const itemNode = event.target.closest('.report-item')
    const sectionNode = event.target.closest('.report-section')
    const bodyNodes = [...root.querySelectorAll('.report-body > *')]
    const bodyNode = sectionNode ?? bodyNodes.find((node) => node.contains(event.target))
    const bodyIndex = bodyNodes.indexOf(bodyNode)
    if (bodyIndex < 0) { select({ kind: 'metadata' }); return }

    if (blockNode && itemNode && sectionNode) {
      const itemNodes = [...sectionNode.querySelectorAll('.section-items > .report-item')]
      const itemIndex = itemNodes.indexOf(itemNode)
      const blockIndex = [...itemNode.querySelectorAll('.item-block-cell')].indexOf(blockNode)
      select({ kind: 'block', bodyIndex, itemIndex, blockIndex })
      return
    }
    if (itemNode && sectionNode) {
      const itemIndex = [...sectionNode.querySelectorAll('.section-items > .report-item')].indexOf(itemNode)
      select({ kind: 'item', bodyIndex, itemIndex })
      return
    }
    select({ kind: sectionNode ? 'section' : 'body', bodyIndex })
  }

  const enterPresentation = () => {
    setCompact(false)
    setExpanded(true)
  }

  return (
    <main className={`editor-preview${expanded ? ' expanded' : ''}`}>
      {expanded ? (
        <div className="editor-preview-toolbar editor-preview-toolbar--presentation">
          <button type="button" className="editor-preview-exit" onClick={() => setExpanded(false)} title="Sair da tela cheia" aria-label="Sair da tela cheia">
            <Minimize2 size={14} /><span>Sair</span>
          </button>
        </div>
      ) : (
        <div className="editor-preview-toolbar">
          <span>Prévia ao vivo</span>
          <div>
            <button type="button" className={!compact ? 'active' : ''} onClick={() => setCompact(false)} title="Desktop" aria-label="Visualização desktop"><Monitor size={14} /></button>
            <button type="button" className={compact ? 'active' : ''} onClick={() => setCompact(true)} title="Celular" aria-label="Visualização celular"><Smartphone size={14} /></button>
            <button type="button" onClick={enterPresentation} title="Apresentar relatório" aria-label="Apresentar relatório"><Expand size={14} /></button>
          </div>
        </div>
      )}
      <div ref={stageRef} className="editor-preview-stage">
        <div ref={documentRef} onClick={handlePreviewClick} className={`editor-preview-document${compact ? ' compact' : ''}`} style={style}>
          <ReportView report={report} settings={settings} />
        </div>
      </div>
    </main>
  )
}

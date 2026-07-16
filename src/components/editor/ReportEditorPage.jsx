import { useEffect, useMemo, useReducer, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Braces, Check, ExternalLink, Redo2, Save, Undo2 } from 'lucide-react'
import { useAppChromeTheme } from '../../lib/useAppChromeTheme.js'
import { createReport, getAdminReport, updateReport } from '../../lib/registry.js'
import { fetchJson, jsonBody } from '../../lib/api.js'
import Dialog from '../admin/Dialog.jsx'
import JsonEditor from '../admin/JsonEditor.jsx'
import EditorLayout from './EditorLayout.jsx'
import ChatPanel from './ChatPanel.jsx'
import { emptyReport, initialEditorState, reportEditorReducer } from './reportEditorReducer.js'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const draftKey = (slug) => `dia-report-editor-draft:${slug || 'new'}`
const parseObject = (text) => {
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

function validate(slug, report) {
  if (!slugPattern.test(slug)) return 'Use apenas letras minúsculas, números e hífens no slug.'
  if (!String(report.title ?? '').trim()) return 'Preencha o título do documento.'
  if (!report.date || Number.isNaN(new Date(report.date).getTime())) return 'Informe uma data válida.'
  if (!Array.isArray(report.headline) || !report.headline.some((line) => String(line).trim())) return 'Adicione ao menos uma linha à headline.'
  if (!Array.isArray(report.body)) return 'O corpo do relatório precisa ser uma lista.'
  return null
}

export default function ReportEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const isNew = params.slug === 'new'
  useAppChromeTheme(isNew ? 'Novo relatório' : 'Editar relatório')
  const [state, dispatch] = useReducer(reportEditorReducer, emptyReport(''), initialEditorState)
  const [slug, setSlug] = useState(isNew ? '' : params.slug)
  const [groups, setGroups] = useState([])
  const [groupIds, setGroupIds] = useState([])
  const [groupsDirty, setGroupsDirty] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [draft, setDraft] = useState(null)
  const parsedJson = useMemo(() => parseObject(jsonText), [jsonText])

  useEffect(() => {
    document.documentElement.classList.add('visual-editor-active')
    return () => document.documentElement.classList.remove('visual-editor-active')
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const groupDataPromise = fetchJson('/api/report-groups')
        if (isNew) {
          const groupData = await groupDataPromise
          if (!cancelled) setGroups(groupData)
        } else {
          const [full, groupData] = await Promise.all([getAdminReport(params.slug), groupDataPromise])
          if (!cancelled) {
            dispatch({ type: 'reset', report: { ...full.content, id: full.slug } })
            setGroupIds(full.groupIds ?? [])
            setGroups(groupData)
          }
        }
        const stored = localStorage.getItem(draftKey(isNew ? '' : params.slug))
        if (stored && !cancelled) setDraft(JSON.parse(stored))
      } catch (error) {
        if (!cancelled) setLoadError(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isNew, params.slug])

  useEffect(() => {
    if (!state.dirty && !groupsDirty) return undefined
    const timer = setTimeout(() => localStorage.setItem(draftKey(isNew ? '' : params.slug), JSON.stringify({ slug, report: state.report, groupIds, savedAt: new Date().toISOString() })), 500)
    return () => clearTimeout(timer)
  }, [groupIds, groupsDirty, isNew, params.slug, slug, state.dirty, state.report])

  useEffect(() => {
    const beforeUnload = (event) => { if (state.dirty || groupsDirty) event.preventDefault() }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [groupsDirty, state.dirty])

  const save = async () => {
    const normalizedSlug = slug.trim()
    const error = validate(normalizedSlug, state.report)
    if (error) { setSaveError(error); return }
    setSaving(true); setSaveError(null); setSaved(false)
    const content = { ...state.report, id: normalizedSlug }
    const payload = { slug: normalizedSlug, title: content.title, date: content.date, content }
    try {
      if (isNew) await createReport(payload)
      else await updateReport(params.slug, payload)
      await fetchJson(`/api/report-groups/by-report/${normalizedSlug}`, { method: 'PUT', ...jsonBody({ groupIds }) })
      localStorage.removeItem(draftKey(isNew ? '' : params.slug))
      dispatch({ type: 'mark-saved' })
      setGroupsDirty(false)
      setSaved(true)
      if (isNew) navigate(`/admin/reports/${normalizedSlug}/edit`, { replace: true })
      setTimeout(() => setSaved(false), 2500)
    } catch (error) { setSaveError(error.message) } finally { setSaving(false) }
  }

  useEffect(() => {
    const keydown = (event) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 's') { event.preventDefault(); save() }
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); dispatch({ type: event.shiftKey ? 'redo' : 'undo' }) }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  })

  const openJson = () => { setJsonText(JSON.stringify(state.report, null, 2)); setJsonOpen(true) }
  if (loading) return <div className="editor-loading">Carregando editor…</div>
  if (loadError) return <div className="editor-loading"><p>{loadError}</p><Link to="/admin/reports">Voltar para relatórios</Link></div>

  return <div className="visual-editor-page">
    <header className="visual-editor-topbar"><div className="visual-editor-title"><Link to="/admin/reports" aria-label="Voltar"><ArrowLeft size={16} /></Link><div><span>Editor visual</span><strong>{state.report.title || 'Relatório sem título'}</strong></div></div><div className="visual-editor-slug"><label>Slug</label><input disabled={!isNew} value={slug} placeholder="meu-relatorio" onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} /></div><div className="visual-editor-actions"><button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={!state.past.length} title="Desfazer"><Undo2 size={15} /></button><button type="button" onClick={() => dispatch({ type: 'redo' })} disabled={!state.future.length} title="Refazer"><Redo2 size={15} /></button><button type="button" onClick={openJson}><Braces size={15} /> JSON</button>{!isNew && <Link to={`/report/${params.slug}`} target="_blank"><ExternalLink size={15} /> Abrir</Link>}<button type="button" className="editor-save-btn" onClick={save} disabled={saving}><Save size={15} /> {saving ? 'Salvando…' : saved ? 'Salvo' : 'Salvar'}{saved && <Check size={13} />}</button></div></header>
    {draft && <div className="editor-draft-banner"><span>Há um rascunho local de {new Date(draft.savedAt).toLocaleString('pt-BR')}.</span><button type="button" onClick={() => { dispatch({ type: 'replace-report', report: draft.report }); setSlug(draft.slug ?? slug); setGroupIds(draft.groupIds ?? []); setDraft(null) }}>Restaurar</button><button type="button" onClick={() => { localStorage.removeItem(draftKey(isNew ? '' : params.slug)); setDraft(null) }}>Descartar</button></div>}
    {saveError && <div className="editor-error-banner">{saveError}</div>}
    <EditorLayout state={state} dispatch={dispatch} groups={groups} groupIds={groupIds} onGroupIdsChange={(ids) => { setGroupIds(ids); setGroupsDirty(true) }} />
    {jsonOpen && <Dialog eyebrow="Importar / exportar" title="JSON completo do relatório" className="dia-modal--report-editor" onClose={() => setJsonOpen(false)}><div className="editor-full-json"><p>Alterações aplicadas aqui substituem o documento visual. Chaves desconhecidas são mantidas.</p><JsonEditor value={jsonText} onChange={setJsonText} valid={Boolean(parsedJson)} rows={22} /><div className="admin-form-actions"><button type="button" className="admin-btn-secondary" onClick={() => setJsonOpen(false)}>Cancelar</button><button type="button" className="login-submit" disabled={!parsedJson} onClick={() => { dispatch({ type: 'replace-report', report: parsedJson }); setJsonOpen(false) }}>Aplicar JSON</button></div></div></Dialog>}
    <ChatPanel state={state} dispatch={dispatch} slug={isNew ? '' : params.slug} />
  </div>
}

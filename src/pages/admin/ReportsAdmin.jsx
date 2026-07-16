import { useEffect, useState } from 'react'
import { Braces, Download } from 'lucide-react'
import { useAppChromeTheme } from '../../lib/useAppChromeTheme.js'
import { fetchJson, jsonBody } from '../../lib/api.js'
import { formatShortDate } from '../../lib/theme.js'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatus from '../../components/admin/AdminStatus.jsx'
import ActionButtons from '../../components/admin/ActionButtons.jsx'
import Dialog from '../../components/admin/Dialog.jsx'
import FormField from '../../components/admin/FormField.jsx'
import FormActions from '../../components/admin/FormActions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import Checkbox from '../../components/admin/Checkbox.jsx'
import FileDropzone from '../../components/admin/FileDropzone.jsx'
import JsonEditor from '../../components/admin/JsonEditor.jsx'

function reportTitle(report) {
  return Array.isArray(report.headline) ? report.headline.join(' ') : report.headline ?? report.title
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsAdmin() {
  useAppChromeTheme('Relatórios (admin)')

  const [reports, setReports] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState(null)
  const [slug, setSlug] = useState('')
  const [fileName, setFileName] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [groupIds, setGroupIds] = useState([])
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [reportsData, groupsData] = await Promise.all([
        fetchJson('/api/reports?admin=1'),
        fetchJson('/api/report-groups'),
      ])
      setReports(reportsData)
      setGroups(groupsData)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!jsonText.trim()) {
      setParsed(null)
      setParseError(null)
      return
    }
    try {
      const obj = JSON.parse(jsonText)
      setParsed(obj)
      setParseError(null)
      if (!editingSlug && obj.id) setSlug(obj.id)
    } catch (err) {
      setParsed(null)
      setParseError(`JSON inválido: ${err.message}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonText])

  const resetForm = () => {
    setEditingSlug(null)
    setSlug('')
    setFileName(null)
    setJsonText('')
    setParsed(null)
    setParseError(null)
    setGroupIds([])
    setFormError(null)
  }

  /* Editor visual removido — criar/editar relatórios via JSON direto */
  // const openCreate = () => {
  //   navigate('/admin/reports/new/edit')
  // }

  const openJsonEdit = async (report) => {
    resetForm()
    setModalOpen(true)
    setEditingSlug(report.slug)
    setSlug(report.slug)
    setFileName(`${report.slug}.json`)
    try {
      const full = await fetchJson(`/api/reports/${report.slug}?admin=1`)
      setJsonText(JSON.stringify(full.content, null, 2))
      setGroupIds(full.groupIds ?? [])
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleFile = async (file) => {
    setFileName(file.name)
    setJsonText(await file.text())
  }

  const handleDownload = async (report) => {
    const full = await fetchJson(`/api/reports/${report.slug}?admin=1`)
    downloadJson(`${report.slug}.json`, full.content)
  }

  const allGroupsSelected = groups.length > 0 && groups.every((g) => groupIds.includes(g.id))
  const toggleAllGroups = () => setGroupIds(allGroupsSelected ? [] : groups.map((g) => g.id))
  const toggleGroup = (id) =>
    setGroupIds((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!parsed) {
      setFormError('Envie ou cole um JSON válido antes de salvar')
      return
    }
    if (!slug.trim()) {
      setFormError('Slug é obrigatório')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload = { slug: slug.trim(), title: parsed.title, date: parsed.date, content: parsed }
    try {
      if (editingSlug) {
        await fetchJson(`/api/reports/${editingSlug}`, { method: 'PUT', ...jsonBody(payload) })
      } else {
        await fetchJson('/api/reports', { method: 'POST', ...jsonBody(payload) })
      }
      await fetchJson(`/api/report-groups/by-report/${slug.trim()}`, {
        method: 'PUT',
        ...jsonBody({ groupIds }),
      })
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await fetchJson(`/api/reports/${deleteTarget.slug}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminPage
      title="Relatórios"
      description="Gerencie relatórios via JSON — importação, exportação, grupos e ajustes avançados."
      sectionHeading="Todos os relatórios"
      // newLabel="Novo relatório"
      // onNew={openCreate}
    >
      <AdminStatus
        loading={loading}
        error={error}
        empty={!loading && !error && reports.length === 0}
        loadingText="Carregando relatórios..."
        errorText="Não foi possível carregar os relatórios agora."
        emptyText="Nenhum relatório criado ainda."
      />

      {!loading && !error && reports.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Atualizado</th>
              <th>Grupos</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.slug}>
                <td>{reportTitle(report)}</td>
                <td>{formatShortDate(report.updatedAt ?? report.date)}</td>
                <td>{report.groupIds?.length > 0 ? report.groupIds.length : 'Público'}</td>
                <td className="admin-table-actions">
                  <button type="button" onClick={() => handleDownload(report)} aria-label="Baixar JSON" title="Baixar JSON">
                    <Download size={14} />
                  </button>
                  <button type="button" onClick={() => openJsonEdit(report)} aria-label="Editar JSON" title="Editar JSON">
                    <Braces size={14} />
                  </button>
                  <ActionButtons
                    onDelete={() => {
                      setDeleteError(null)
                      setDeleteTarget(report)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Dialog
          eyebrow="Relatórios"
          title={editingSlug ? 'Editar relatório' : 'Novo relatório'}
          className="dia-modal--report-editor"
          onClose={() => setModalOpen(false)}
        >
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="report-editor-grid">
              <div className="report-editor-col report-editor-col--left">
                <FormField label="Slug (URL do relatório)">
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingSlug)}
                    placeholder="meu-relatorio"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </FormField>

                <FormField label="Grupos de relatório">
                  {groups.length === 0 ? (
                    <p className="settings-modal-hint">Nenhum grupo criado ainda — relatório fica público para qualquer logado.</p>
                  ) : (
                    <div className="admin-field-checkboxes">
                      <Checkbox emphasis checked={allGroupsSelected} onChange={toggleAllGroups}>
                        Todos os grupos
                      </Checkbox>
                      {groups.map((group) => (
                        <Checkbox key={group.id} checked={groupIds.includes(group.id)} onChange={() => toggleGroup(group.id)}>
                          {group.name}
                        </Checkbox>
                      ))}
                    </div>
                  )}
                </FormField>

                <FormField label="Arquivo JSON">
                  <FileDropzone filename={fileName} onFile={handleFile} />
                </FormField>
              </div>

              <div className="report-editor-col report-editor-col--right">
                <FormField label="JSON">
                  <JsonEditor value={jsonText} onChange={setJsonText} valid={Boolean(parsed)} />
                </FormField>
                {parseError && <p className="login-error">{parseError}</p>}
              </div>
            </div>

            {formError && <p className="login-error">{formError}</p>}
            <FormActions onCancel={() => setModalOpen(false)} busy={saving} />
          </form>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir relatório"
          message={`Excluir "${reportTitle(deleteTarget)}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          error={deleteError}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminPage>
  )
}

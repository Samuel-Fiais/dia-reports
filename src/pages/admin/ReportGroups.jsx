import { useEffect, useState } from 'react'
import { useAppChromeTheme } from '../../lib/useAppChromeTheme.js'
import { fetchJson, jsonBody } from '../../lib/api.js'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatus from '../../components/admin/AdminStatus.jsx'
import ActionButtons from '../../components/admin/ActionButtons.jsx'
import Dialog from '../../components/admin/Dialog.jsx'
import FormField from '../../components/admin/FormField.jsx'
import FormActions from '../../components/admin/FormActions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'

const EMPTY_FORM = { name: '', description: '' }

export default function ReportGroups() {
  useAppChromeTheme('Grupos de relatórios')

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setGroups(await fetchJson('/api/report-groups'))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (group) => {
    setEditingId(group.id)
    setForm({ name: group.name, description: group.description ?? '' })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
        await fetchJson(`/api/report-groups/${editingId}`, { method: 'PUT', ...jsonBody(form) })
      } else {
        await fetchJson('/api/report-groups', { method: 'POST', ...jsonBody(form) })
      }
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
      await fetchJson(`/api/report-groups/${deleteTarget.id}`, { method: 'DELETE' })
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
      title="Grupos de relatórios"
      description="Organize relatórios em grupos e controle quais perfis enxergam cada um. Um relatório sem nenhum grupo fica visível para qualquer pessoa logada."
      sectionHeading="Todos os grupos"
      newLabel="Novo grupo"
      onNew={openCreate}
    >
      <AdminStatus
        loading={loading}
        error={error}
        empty={!loading && !error && groups.length === 0}
        loadingText="Carregando grupos..."
        errorText="Não foi possível carregar os grupos agora."
        emptyText="Nenhum grupo criado ainda."
      />

      {!loading && !error && groups.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Relatórios</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td>{group.name}</td>
                <td>{group.description || '—'}</td>
                <td>{group.reportCount}</td>
                <td className="admin-table-actions">
                  <ActionButtons
                    onEdit={() => openEdit(group)}
                    onDelete={() => {
                      setDeleteError(null)
                      setDeleteTarget(group)
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
          eyebrow="Grupos de relatórios"
          title={editingId ? 'Editar grupo' : 'Novo grupo'}
          onClose={() => setModalOpen(false)}
        >
          <form className="admin-form" onSubmit={handleSubmit}>
            <FormField label="Nome">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="Descrição">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
            {formError && <p className="login-error">{formError}</p>}
            <FormActions onCancel={() => setModalOpen(false)} busy={saving} />
          </form>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir grupo"
          message={
            deleteTarget.reportCount > 0
              ? `Excluir "${deleteTarget.name}"? ${deleteTarget.reportCount} relatório(s) perdem esse grupo.`
              : `Excluir "${deleteTarget.name}"? Essa ação não pode ser desfeita.`
          }
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

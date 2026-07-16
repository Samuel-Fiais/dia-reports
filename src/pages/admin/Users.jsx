import { useEffect, useState } from 'react'
import { useAppChromeTheme } from '../../lib/useAppChromeTheme.js'
import { fetchJson, jsonBody } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatus from '../../components/admin/AdminStatus.jsx'
import ActionButtons from '../../components/admin/ActionButtons.jsx'
import Dialog from '../../components/admin/Dialog.jsx'
import FormField from '../../components/admin/FormField.jsx'
import FormActions from '../../components/admin/FormActions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import Checkbox from '../../components/admin/Checkbox.jsx'
import SelectControl from '../../components/SelectControl.jsx'

function emptyForm() {
  return { email: '', password: '', profileId: '', active: true }
}

function formFromUser(u) {
  return { email: u.email, password: '', profileId: u.profileId ?? '', active: u.active }
}

export default function Users() {
  useAppChromeTheme('Usuários')
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [usersData, profilesData] = await Promise.all([
        fetchJson('/api/users'),
        fetchJson('/api/profiles'),
      ])
      setUsers(usersData)
      setProfiles(profilesData)
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
    setForm(emptyForm())
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditingId(u.id)
    setForm(formFromUser(u))
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = {
      email: form.email,
      profileId: form.profileId || null,
      active: form.active,
      ...(form.password ? { password: form.password } : {}),
    }
    try {
      if (editingId) {
        await fetchJson(`/api/users/${editingId}`, { method: 'PUT', ...jsonBody(payload) })
      } else {
        await fetchJson('/api/users', { method: 'POST', ...jsonBody({ ...payload, password: form.password }) })
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
      await fetchJson(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
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
      title="Usuários"
      description="Quem pode entrar no app, com qual perfil e se o acesso está ativo."
      sectionHeading="Todos os usuários"
      newLabel="Novo usuário"
      onNew={openCreate}
    >
      <AdminStatus
        loading={loading}
        error={error}
        empty={!loading && !error && users.length === 0}
        loadingText="Carregando usuários..."
        errorText="Não foi possível carregar os usuários agora."
        emptyText="Nenhum usuário criado ainda."
      />

      {!loading && !error && users.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.profileName || '—'}</td>
                <td>
                  <span className={`state-badge state-badge--${u.active ? 'good' : 'muted'}`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="admin-table-actions">
                  <ActionButtons
                    onEdit={() => openEdit(u)}
                    onDelete={() => {
                      setDeleteError(null)
                      setDeleteTarget(u)
                    }}
                    disableDelete={u.id === currentUser?.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Dialog eyebrow="Usuários" title={editingId ? 'Editar usuário' : 'Novo usuário'} onClose={() => setModalOpen(false)}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <FormField label="E-mail">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>

            <FormField label="Senha">
              <input
                type="password"
                required={!editingId}
                placeholder={editingId ? 'Deixe em branco para manter a senha atual' : ''}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </FormField>

            <FormField label="Perfil">
              <SelectControl
                value={form.profileId}
                onChange={(profileId) => setForm({ ...form, profileId })}
                ariaLabel="Perfil"
                options={[{ value: '', label: 'Sem perfil' }, ...profiles.map((profile) => ({ value: profile.id, label: profile.name }))]}
              />
            </FormField>

            <Checkbox checked={form.active} onChange={() => setForm({ ...form, active: !form.active })}>
              Usuário ativo (pode entrar no app)
            </Checkbox>

            {formError && <p className="login-error">{formError}</p>}
            <FormActions onCancel={() => setModalOpen(false)} busy={saving} />
          </form>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir usuário"
          message={`Excluir "${deleteTarget.email}"? Essa ação não pode ser desfeita.`}
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

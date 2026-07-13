import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { useAppChromeTheme } from '../../lib/useAppChromeTheme.js'
import { fetchJson, jsonBody } from '../../lib/api.js'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatus from '../../components/admin/AdminStatus.jsx'
import ActionButtons from '../../components/admin/ActionButtons.jsx'
import Dialog from '../../components/admin/Dialog.jsx'
import FormField from '../../components/admin/FormField.jsx'
import FormActions from '../../components/admin/FormActions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import Checkbox from '../../components/admin/Checkbox.jsx'
import ProfileUsersDialog from '../../components/admin/ProfileUsersDialog.jsx'

const MODULES = [
  { key: 'report_groups.manage', label: 'Gerenciar grupos de relatórios' },
  { key: 'profiles.manage', label: 'Gerenciar perfis' },
  { key: 'users.manage', label: 'Gerenciar usuários' },
  { key: 'reports.manage', label: 'Gerenciar relatórios (editor)' },
]

function emptyForm() {
  return { name: '', supreme: false, modules: {}, groupIds: [] }
}

function formFromProfile(profile) {
  const supreme = profile.permissions?.['*'] === true
  const modules = {}
  for (const m of MODULES) modules[m.key] = profile.permissions?.[m.key] === true
  return { name: profile.name, supreme, modules, groupIds: profile.groupIds ?? [] }
}

function permissionsSummary(profile) {
  if (profile.permissions?.['*'] === true) return 'Acesso total'
  const count = MODULES.filter((m) => profile.permissions?.[m.key] === true).length
  return `${count} de ${MODULES.length} módulos`
}

export default function Profiles() {
  useAppChromeTheme('Perfis')

  const [profiles, setProfiles] = useState([])
  const [groups, setGroups] = useState([])
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
  const [usersTarget, setUsersTarget] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [profilesData, groupsData] = await Promise.all([
        fetchJson('/api/profiles'),
        fetchJson('/api/report-groups'),
      ])
      setProfiles(profilesData)
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

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (profile) => {
    setEditingId(profile.id)
    setForm(formFromProfile(profile))
    setFormError(null)
    setModalOpen(true)
  }

  const toggleModule = (key) => {
    setForm((f) => ({ ...f, modules: { ...f.modules, [key]: !f.modules[key] } }))
  }

  const allGroupsSelected = groups.length > 0 && groups.every((g) => form.groupIds.includes(g.id))

  const toggleAllGroups = () => {
    setForm((f) => ({ ...f, groupIds: allGroupsSelected ? [] : groups.map((g) => g.id) }))
  }

  const toggleGroup = (groupId) => {
    setForm((f) => ({
      ...f,
      groupIds: f.groupIds.includes(groupId)
        ? f.groupIds.filter((id) => id !== groupId)
        : [...f.groupIds, groupId],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const permissions = form.supreme ? { '*': true } : form.modules
    const payload = { name: form.name, permissions, groupIds: form.groupIds }
    try {
      if (editingId) {
        await fetchJson(`/api/profiles/${editingId}`, { method: 'PUT', ...jsonBody(payload) })
      } else {
        await fetchJson('/api/profiles', { method: 'POST', ...jsonBody(payload) })
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
      await fetchJson(`/api/profiles/${deleteTarget.id}`, { method: 'DELETE' })
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
      title="Perfis"
      description="Cada perfil define o que os usuários daquele perfil podem fazer no app e quais grupos de relatório eles enxergam."
      sectionHeading="Todos os perfis"
      newLabel="Novo perfil"
      onNew={openCreate}
    >
      <AdminStatus
        loading={loading}
        error={error}
        empty={!loading && !error && profiles.length === 0}
        loadingText="Carregando perfis..."
        errorText="Não foi possível carregar os perfis agora."
        emptyText="Nenhum perfil criado ainda."
      />

      {!loading && !error && profiles.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Permissões</th>
              <th>Grupos</th>
              <th>Usuários</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.name}</td>
                <td>{permissionsSummary(profile)}</td>
                <td>
                  {profile.permissions?.['*'] === true
                    ? 'Todos'
                    : `${profile.groupIds.length} de ${groups.length}`}
                </td>
                <td>{profile.userCount}</td>
                <td className="admin-table-actions">
                  <button type="button" onClick={() => setUsersTarget(profile)} aria-label="Ver usuários" title="Ver usuários">
                    <Users size={14} />
                  </button>
                  <ActionButtons
                    onEdit={() => openEdit(profile)}
                    onDelete={() => {
                      setDeleteError(null)
                      setDeleteTarget(profile)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Dialog eyebrow="Perfis" title={editingId ? 'Editar perfil' : 'Novo perfil'} onClose={() => setModalOpen(false)}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <FormField label="Nome">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <FormField label="Permissões">
              <div className="admin-field-checkboxes">
                <Checkbox
                  emphasis
                  checked={form.supreme}
                  onChange={() => setForm((f) => ({ ...f, supreme: !f.supreme }))}
                >
                  Acesso total (todas as permissões e todos os grupos)
                </Checkbox>
                {MODULES.map((m) => (
                  <Checkbox
                    key={m.key}
                    checked={form.supreme || Boolean(form.modules[m.key])}
                    disabled={form.supreme}
                    onChange={() => toggleModule(m.key)}
                  >
                    {m.label}
                  </Checkbox>
                ))}
              </div>
            </FormField>

            <FormField label="Grupos de relatório visíveis">
              {groups.length === 0 ? (
                <p className="settings-modal-hint">Nenhum grupo criado ainda.</p>
              ) : (
                <div className="admin-field-checkboxes">
                  <Checkbox emphasis checked={allGroupsSelected} disabled={form.supreme} onChange={toggleAllGroups}>
                    Todos os grupos
                  </Checkbox>
                  {groups.map((group) => (
                    <Checkbox
                      key={group.id}
                      checked={form.supreme || form.groupIds.includes(group.id)}
                      disabled={form.supreme}
                      onChange={() => toggleGroup(group.id)}
                    >
                      {group.name}
                    </Checkbox>
                  ))}
                </div>
              )}
              {form.supreme && (
                <p className="settings-modal-hint">Acesso total ignora a seleção de grupos — vê tudo sempre.</p>
              )}
            </FormField>

            {formError && <p className="login-error">{formError}</p>}
            <FormActions onCancel={() => setModalOpen(false)} busy={saving} />
          </form>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir perfil"
          message={
            deleteTarget.userCount > 0
              ? `Excluir "${deleteTarget.name}"? ${deleteTarget.userCount} usuário(s) ficam sem perfil (não são excluídos).`
              : `Excluir "${deleteTarget.name}"? Essa ação não pode ser desfeita.`
          }
          confirmLabel="Excluir"
          error={deleteError}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {usersTarget && <ProfileUsersDialog profile={usersTarget} onClose={() => setUsersTarget(null)} />}
    </AdminPage>
  )
}

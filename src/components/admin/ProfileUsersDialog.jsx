import { useEffect, useState } from 'react'
import { fetchJson } from '../../lib/api.js'
import Dialog from './Dialog.jsx'
import AdminStatus from './AdminStatus.jsx'

export default function ProfileUsersDialog({ profile, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchJson(`/api/profiles/${profile.id}/users`)
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profile.id])

  return (
    <Dialog eyebrow="Perfis" title={`Usuários com o perfil "${profile.name}"`} onClose={onClose}>
      <AdminStatus
        loading={loading}
        error={error}
        empty={!loading && !error && users.length === 0}
        loadingText="Carregando usuários..."
        errorText="Não foi possível carregar os usuários agora."
        emptyText="Nenhum usuário com este perfil ainda."
      />
      {!loading && !error && users.length > 0 && (
        <ul className="profile-users-list">
          {users.map((u) => (
            <li key={u.id} className="profile-users-item">
              <span>{u.email}</span>
              <span className={`state-badge state-badge--${u.active ? 'good' : 'muted'}`}>
                {u.active ? 'Ativo' : 'Inativo'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}

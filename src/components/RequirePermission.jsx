import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Usar sempre dentro de <RequireAuth> — assume que, quando renderiza, já existe
// sessão (loading concluído, user presente). Só checa a permissão do módulo.
export default function RequirePermission({ module, children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  const permissions = user?.permissions ?? {}
  const allowed = permissions['*'] === true || permissions[module] === true
  if (!allowed) return <Navigate to="/" replace />
  return children
}

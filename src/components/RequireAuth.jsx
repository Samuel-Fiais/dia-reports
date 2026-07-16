import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  // Links compartilhados (?shared=1) nao exigem autenticacao
  if (params.get('shared') === '1') return children

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

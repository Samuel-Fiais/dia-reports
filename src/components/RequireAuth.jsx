import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  // ?shared=1 deixa a pagina renderizar pra API decidir acesso
  // A API valida visibility=public; privado sem sessao retorna 404
  if (params.get('shared') === '1') return children

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

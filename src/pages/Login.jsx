import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useAppChromeTheme } from '../lib/useAppChromeTheme.js'

export default function Login() {
  useAppChromeTheme('Entrar')
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Falha no login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="report ready">
      <div className="login-wrap">
        <div className="login-card">
          <span className="login-eyebrow">Dia Reports</span>
          <h1 className="login-title">Entrar</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>E-mail</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="login-field">
              <span>Senha</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

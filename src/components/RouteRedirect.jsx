import { Navigate, useLocation, useParams } from 'react-router-dom'

function resolveRedirectTarget(template, params) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value)),
    template,
  )
}

export default function RouteRedirect({ to }) {
  const params = useParams()
  const location = useLocation()
  const target = resolveRedirectTarget(to, params)

  return (
    <Navigate
      to={{ pathname: target, search: location.search, hash: location.hash }}
      replace
    />
  )
}

// Estados padrão de lista (carregando/erro/vazio), mesmo texto/classe em todo CRUD.
export default function AdminStatus({ loading, error, empty, loadingText, errorText, emptyText }) {
  if (loading) return <p className="report-card-empty">{loadingText}</p>
  if (error) return <p className="report-card-empty">{errorText}</p>
  if (empty) return <p className="report-card-empty">{emptyText}</p>
  return null
}

// Label + controle de formulário, no mesmo estilo (.admin-field) em todo CRUD.
// O input/select/textarea é passado como children pra manter FormField livre de
// opinião sobre qual tipo de controle é.
export default function FormField({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

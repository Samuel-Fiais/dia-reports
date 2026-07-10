// Pasta comum de relatórios: basta salvar um .json em src/reports/
// que ele aparece automaticamente no dashboard (import.meta.glob).
const modules = import.meta.glob('../reports/*.json', { eager: true })

export const reports = Object.entries(modules)
  .map(([path, mod]) => {
    const data = mod.default ?? mod
    const file = path.split('/').pop().replace(/\.json$/, '')
    return { ...data, id: data.id ?? file }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export function getReport(id) {
  return reports.find((r) => r.id === id)
}

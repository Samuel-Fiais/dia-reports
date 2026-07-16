import { useEffect, useState } from 'react'
import { Braces, Download } from 'lucide-react'
import { useAppChromeTheme } from '../../lib/useAppChromeTheme.js'
import { fetchJson, jsonBody } from '../../lib/api.js'
import { fetchDecks, deleteDeck } from '../../lib/slidesClient.js'
import { formatShortDate } from '../../lib/theme.js'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatus from '../../components/admin/AdminStatus.jsx'
import ActionButtons from '../../components/admin/ActionButtons.jsx'
import Dialog from '../../components/admin/Dialog.jsx'
import FormField from '../../components/admin/FormField.jsx'
import FormActions from '../../components/admin/FormActions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import FileDropzone from '../../components/admin/FileDropzone.jsx'
import JsonEditor from '../../components/admin/JsonEditor.jsx'

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SlidesAdmin() {
  useAppChromeTheme('Apresentações (admin)')

  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState(null)
  const [slug, setSlug] = useState('')
  const [fileName, setFileName] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDecks()
      setDecks(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  /* JSON parse */ // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!jsonText.trim()) {
      setParsed(null)
      setParseError(null)
      return
    }
    try {
      const obj = JSON.parse(jsonText)
      setParsed(obj)
      setParseError(null)
      if (!editingSlug && obj.id) setSlug(obj.id)
    } catch (err) {
      setParsed(null)
      setParseError(`JSON inválido: ${err.message}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonText])

  const resetForm = () => {
    setEditingSlug(null)
    setSlug('')
    setFileName(null)
    setJsonText('')
    setParsed(null)
    setParseError(null)
    setFormError(null)
  }

  const openJsonEdit = async (deck) => {
    resetForm()
    setModalOpen(true)
    setEditingSlug(deck.slug)
    setSlug(deck.slug)
    setFileName(`${deck.slug}.json`)
    try {
      const full = await fetchJson(`/api/slides/${deck.slug}`)
      setJsonText(JSON.stringify(full.content, null, 2))
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleFile = async (file) => {
    setFileName(file.name)
    setJsonText(await file.text())
  }

  const handleDownload = async (deck) => {
    const full = await fetchJson(`/api/slides/${deck.slug}`)
    downloadJson(`${deck.slug}.json`, full.content)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!parsed) {
      setFormError('Envie ou cole um JSON válido antes de salvar')
      return
    }
    if (!slug.trim()) {
      setFormError('Slug é obrigatório')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload = {
      slug: slug.trim(),
      title: parsed.title ?? slug.trim(),
      content: parsed,
    }
    try {
      if (editingSlug) {
        await fetchJson(`/api/slides/${editingSlug}`, { method: 'PUT', ...jsonBody(payload) })
      } else {
        await fetchJson('/api/slides', { method: 'POST', ...jsonBody(payload) })
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
      await deleteDeck(deleteTarget.slug)
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
      title="Apresentações"
      description="Gerencie decks de slides via JSON — criação, edição, exportação."
      sectionHeading="Todos os decks"
    >
      <AdminStatus
        loading={loading}
        error={error}
        empty={!loading && !error && decks.length === 0}
        loadingText="Carregando decks..."
        errorText="Não foi possível carregar os decks agora."
        emptyText="Nenhum deck criado ainda."
      />

      {!loading && !error && decks.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Slides</th>
              <th>Atualizado</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {decks.map((deck) => (
              <tr key={deck.slug}>
                <td>{deck.deckTitle ?? deck.title}</td>
                <td>{deck.slidesCount}</td>
                <td>{formatShortDate(deck.updatedAt ?? deck.date)}</td>
                <td className="admin-table-actions">
                  <button type="button" onClick={() => handleDownload(deck)} aria-label="Baixar JSON" title="Baixar JSON">
                    <Download size={14} />
                  </button>
                  <button type="button" onClick={() => openJsonEdit(deck)} aria-label="Editar JSON" title="Editar JSON">
                    <Braces size={14} />
                  </button>
                  <ActionButtons
                    onDelete={() => {
                      setDeleteError(null)
                      setDeleteTarget(deck)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Dialog
          eyebrow="Apresentações"
          title={editingSlug ? 'Editar deck' : 'Novo deck'}
          className="dia-modal--report-editor"
          onClose={() => setModalOpen(false)}
        >
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="report-editor-grid">
              <div className="report-editor-col report-editor-col--left">
                <FormField label="Slug (URL do deck)">
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingSlug)}
                    placeholder="meu-deck"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </FormField>

                <FormField label="Arquivo JSON">
                  <FileDropzone filename={fileName} onFile={handleFile} />
                </FormField>
              </div>

              <div className="report-editor-col report-editor-col--right">
                <FormField label="JSON">
                  <JsonEditor value={jsonText} onChange={setJsonText} valid={Boolean(parsed)} />
                </FormField>
                {parseError && <p className="login-error">{parseError}</p>}
              </div>
            </div>

            {formError && <p className="login-error">{formError}</p>}
            <FormActions onCancel={() => setModalOpen(false)} busy={saving} />
          </form>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir deck"
          message={`Excluir "${deleteTarget.deckTitle ?? deleteTarget.title}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          error={deleteError}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminPage>
  )
}

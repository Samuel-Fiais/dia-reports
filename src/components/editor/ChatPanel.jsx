import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, X, Paperclip, Send, FileSpreadsheet, Check, Loader2, Trash2 } from 'lucide-react'
import { askAi } from '../../lib/api.js'
import { readDataFile } from '../../lib/spreadsheet.js'
import { useClickOutside } from '../../lib/useClickOutside.js'
import { mergeReportPatch } from '../../lib/reportPatch.js'

const chatKey = (slug) => `dia-report-editor-chat:${slug || 'new'}`

function loadHistory(slug) {
  try {
    const raw = localStorage.getItem(chatKey(slug))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function replaceGeneratedSourceSections(body, sourceSections) {
  const editorialBody = (Array.isArray(body) ? body : []).filter((node) => !node?.generatedFromSpreadsheet)
  return sourceSections?.length ? [...editorialBody, ...sourceSections] : editorialBody
}

function mergeCandidateIntoReport(report, candidate, sourceSections) {
  return {
    ...report,
    title: candidate.title || report.title,
    headline: Array.isArray(candidate.headline) && candidate.headline.length ? candidate.headline : report.headline,
    intro: Array.isArray(candidate.intro) && candidate.intro.length ? candidate.intro : report.intro,
    metrics: Array.isArray(candidate.metrics) ? candidate.metrics : report.metrics,
    body: replaceGeneratedSourceSections(Array.isArray(candidate.body) ? candidate.body : report.body, sourceSections),
  }
}

function mergePatchIntoReport(report, patch, sourceSections) {
  const merged = mergeReportPatch(report, patch)
  return sourceSections?.length
    ? { ...merged, body: replaceGeneratedSourceSections(merged.body, sourceSections) }
    : merged
}

// Painel flutuante (FAB + card), no mesmo padrão visual de SettingsPanel.jsx
// (botão circular fixo no canto + card que abre por cima dele) — em vez de um
// drawer/modal que ocupa a tela inteira.
export default function ChatPanel({ state, dispatch, slug }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => loadHistory(slug))
  const [input, setInput] = useState('')
  const [dataFiles, setDataFiles] = useState([]) // [{ id, filename, format, sheets }]
  const [readingFiles, setReadingFiles] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const wrapRef = useRef(null)
  const listRef = useRef(null)
  const textareaRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const hasStructure = useMemo(() => (state.report.body?.length ?? 0) > 0, [state.report.body])

  useClickOutside(wrapRef, open, () => setOpen(false))

  useEffect(() => {
    localStorage.setItem(chatKey(slug), JSON.stringify(messages))
  }, [messages, slug])

  // Só acompanha o fundo automaticamente se o usuário já estava perto dele —
  // rolar pra cima pra reler algo não pode ser desfeito por uma resposta nova
  // chegando (senão o scroll parece "travado"/forçado de volta).
  const handleMessagesScroll = () => {
    const el = listRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    if (open && stickToBottomRef.current) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    }
  }, [messages, sending, open])

  // Cresce com o texto (até um teto) em vez de reservar 2 linhas fixas sempre —
  // mantém a caixa do mesmo tamanho dos botões quando vazia.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input, open])

  const handleDataFiles = async (fileList) => {
    const files = Array.from(fileList)
    if (!files.length) return

    setReadingFiles(true)
    setError(null)

    try {
      const attachments = await Promise.all(files.map(async (file) => {
        const parsed = await readDataFile(file)
        return {
          id: `${file.name}:${file.size}:${file.lastModified}`,
          filename: file.name,
          ...parsed,
        }
      }))

      setDataFiles((current) => {
        const next = new Map(current.map((file) => [file.id, file]))
        attachments.forEach((file) => next.set(file.id, file))
        return Array.from(next.values())
      })
    } catch (err) {
      setError(`Não foi possível ler os arquivos selecionados: ${err.message}`)
    } finally {
      setReadingFiles(false)
    }
  }

  const removeDataFile = (id) => {
    setDataFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const clearSession = () => {
    localStorage.removeItem(chatKey(slug))
    setMessages([])
    setInput('')
    setDataFiles([])
    setError(null)
    stickToBottomRef.current = true
  }

  const applyCandidate = (messageIndex, candidate) => {
    const sourceSections = messages[messageIndex]?.sourceSections ?? []
    dispatch({ type: 'replace-report', report: mergeCandidateIntoReport(state.report, candidate, sourceSections) })
    setMessages((prev) => prev.map((m, i) => (i === messageIndex ? { ...m, appliedId: candidate.id } : m)))
  }

  const send = async () => {
    const text = input.trim()
    if (readingFiles || (!text && !dataFiles.length)) return
    setError(null)

    const filenames = dataFiles.map((f) => f.filename)
    const userContent = text || `Monta a estrutura do relatório usando os dados dos arquivos ${filenames.map((n) => `"${n}"`).join(', ')} anexados.`
    const nextMessages = [...messages, {
      role: 'user',
      content: userContent,
      attachments: dataFiles.map((file) => ({
        filename: file.filename,
        format: file.format,
        sheetNames: file.sheets.map((sheet) => sheet.name).filter(Boolean),
      })),
    }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    const action = hasStructure || messages.some((m) => m.role === 'assistant' && !m.candidates) ? 'chat' : 'suggest'

    try {
      const response = await askAi({
        action,
        conversation: nextMessages.map(({ role, content }) => ({ role, content })),
        dataSummaries: dataFiles.flatMap((file) => file.sheets.map((sheet) => ({
          filename: file.filename,
          format: file.format,
          sheet: sheet.name,
          summary: sheet.summary,
        }))),
        currentReport: state.report,
      })

      if (action === 'suggest') {
        setMessages((prev) => [
          ...prev,
          response.candidates?.length
            ? { role: 'assistant', content: 'Aqui estão 3 estruturas completas — escolha uma pra aplicar no editor:', candidates: response.candidates, sourceSections: response.sourceSections ?? [] }
            : { role: 'assistant', content: 'Não consegui montar sugestões a partir disso — tente descrever melhor o relatório.' },
        ])
      } else {
        if (response.reportPatch) {
          dispatch({ type: 'replace-report', report: mergePatchIntoReport(state.report, response.reportPatch, response.sourceSections) })
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: response.reply || 'Feito.' }])
      }
    } catch (err) {
      setError(err.message)
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${err.message}`, isError: true }])
    } finally {
      setSending(false)
      setDataFiles([])
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="ai-chat-wrap" ref={wrapRef}>
      <div className={`ai-chat-panel${open ? ' open' : ''}`}>
        <div className="ai-chat-header">
          <span className="ai-chat-header-title"><Sparkles size={14} /> Chat IA</span>
          <div className="ai-chat-header-actions">
            <button
              type="button"
              className="ai-chat-clear"
              onClick={clearSession}
              disabled={sending || readingFiles || (!messages.length && !input && !dataFiles.length && !error)}
              title="Apagar mensagens e anexos desta sessão"
            >
              <Trash2 size={13} /> Limpar sessão
            </button>
            <button type="button" className="editor-icon-btn" onClick={() => setOpen(false)} aria-label="Fechar"><X size={16} /></button>
          </div>
        </div>

        <div className="ai-chat-messages" ref={listRef} onScroll={handleMessagesScroll}>
          {!messages.length && (
            <div className="ai-chat-empty">
              <Sparkles size={20} />
              <p>Descreva o relatório que você quer montar. Você também pode anexar CSVs ou planilhas XLSX com várias abas — a IA vai usar os dados reais para sugerir 3 estruturas.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <Fragment key={index}>
              <div className={`ai-chat-message ai-chat-message--${message.role}${message.isError ? ' ai-chat-message--error' : ''}`}>
                <p>{message.content}</p>
                {(message.attachments?.length > 0 || message.csvFilenames?.length > 0) && (
                  <div className="ai-chat-attachments" aria-label="Arquivos anexados">
                    <span className="ai-chat-attachments-label">Arquivos anexados</span>
                    {(message.attachments ?? message.csvFilenames.map((filename) => ({ filename, format: 'csv', sheetNames: [] }))).map((file, fileIndex) => (
                      <AttachmentCard key={`${file.filename}:${fileIndex}`} file={file} />
                    ))}
                  </div>
                )}
              </div>
              {message.candidates && (
                <div className="ai-chat-candidates">
                  {message.candidates.map((candidate) => {
                    const applied = message.appliedId === candidate.id
                    const completeBody = [...(candidate.body ?? []), ...(message.sourceSections ?? [])]
                    const sectionCount = completeBody.filter((n) => n.type === 'section').length
                    const blockCount = completeBody.reduce((sum, n) => sum + (n.items?.reduce((s, it) => s + (it.blocks?.length ?? 0), 0) ?? (n.type ? 1 : 0)), 0)
                    return (
                      <div key={candidate.id} className={`ai-chat-candidate-card${applied ? ' ai-chat-candidate-card--applied' : ''}`}>
                        <strong>{candidate.title}</strong>
                        <p>{candidate.summary}</p>
                        <span className="ai-chat-candidate-meta">{sectionCount} seções · {blockCount} blocos</span>
                        <button type="button" onClick={() => applyCandidate(index, candidate)} disabled={applied}>
                          {applied ? <><Check size={13} /> Aplicado</> : 'Usar esta estrutura'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Fragment>
          ))}
          {sending && <div className="ai-chat-message ai-chat-message--assistant ai-chat-message--pending"><Loader2 size={14} className="ai-chat-spin" /> Pensando…</div>}
        </div>

        {error && <div className="ai-chat-error-banner">{error}</div>}

        <div className="ai-chat-composer">
          {dataFiles.length > 0 && (
            <div className="ai-chat-attachments">
              {dataFiles.map((file) => (
                <AttachmentCard
                  key={file.id}
                  file={{ ...file, sheetNames: file.sheets.map((sheet) => sheet.name).filter(Boolean) }}
                  onRemove={() => removeDataFile(file.id)}
                />
              ))}
            </div>
          )}
          {readingFiles && <span className="ai-chat-files-loading" role="status"><Loader2 size={13} className="ai-chat-spin" /> Lendo arquivos…</span>}
          <div className="ai-chat-composer-row">
            <label className={`ai-chat-attach${readingFiles ? ' is-disabled' : ''}`} title="Anexar arquivos CSV ou XLSX">
              <Paperclip size={14} />
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                multiple
                disabled={readingFiles || sending}
                onChange={(event) => {
                  if (event.target.files?.length) handleDataFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Peça um relatório ou um ajuste…"
              rows={1}
            />
            <button type="button" className="ai-chat-send" onClick={send} disabled={sending || readingFiles || (!input.trim() && !dataFiles.length)}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <button type="button" className={`ai-chat-fab${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)} title="Chat IA">
        <Sparkles size={18} />
      </button>
    </div>
  )
}

function AttachmentCard({ file, onRemove }) {
  const sheetNames = file.sheetNames ?? []
  const isWorkbook = file.format === 'xlsx'

  return (
    <div className={`ai-chat-file-card${onRemove ? ' ai-chat-file-card--pending' : ''}`}>
      <div className="ai-chat-file-card-header">
        <FileSpreadsheet size={13} />
        <span className="ai-chat-csv-name">{file.filename}</span>
        <span className="ai-chat-file-format">{isWorkbook ? 'XLSX' : 'CSV'}</span>
        {onRemove && <button type="button" onClick={onRemove} aria-label={`Remover ${file.filename}`}><X size={12} /></button>}
      </div>
      {isWorkbook && (
        <details className="ai-chat-sheet-list" open={sheetNames.length <= 4}>
          <summary>{sheetNames.length} aba{sheetNames.length === 1 ? '' : 's'}</summary>
          <div>{sheetNames.map((name, index) => <span key={`${name}:${index}`}>{name}</span>)}</div>
        </details>
      )}
    </div>
  )
}

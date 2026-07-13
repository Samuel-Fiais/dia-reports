import { useRef, useState } from 'react'
import { FileJson, UploadCloud } from 'lucide-react'

// Área de arrastar-e-soltar (ou clicar) pra carregar um arquivo — usada hoje só
// pra JSON de relatório, mas genérica o bastante (accept/onFile) pra reuso futuro.
export default function FileDropzone({ accept = '.json,application/json', filename, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files) => {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`file-dropzone${dragging ? ' file-dropzone--dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="file-dropzone-input"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {filename ? (
        <>
          <FileJson size={22} aria-hidden="true" />
          <span className="file-dropzone-filename">{filename}</span>
          <span className="file-dropzone-hint">Clique ou arraste outro arquivo para substituir</span>
        </>
      ) : (
        <>
          <UploadCloud size={22} aria-hidden="true" />
          <span>Arraste um arquivo .json aqui</span>
          <span className="file-dropzone-hint">ou clique para escolher</span>
        </>
      )}
    </div>
  )
}

import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'
import { useAppTheme } from '../context/ThemeContext.jsx'

export default function MermaidBlock({ block }) {
  const id = useId().replaceAll(':', '')
  const { appTheme } = useAppTheme()
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      try {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: appTheme === 'dark' ? 'dark' : 'neutral' })
        const result = await mermaid.render(`mermaid-${id}`, block.code ?? 'flowchart LR\n  A[Início] --> B[Fim]')
        if (!cancelled) { setSvg(result.svg); setError(null) }
      } catch (err) {
        if (!cancelled) { setSvg(''); setError(err.message) }
      }
    }
    render()
    return () => { cancelled = true }
  }, [appTheme, block.code, id])

  if (error) return <div className="mermaid-error"><strong>Diagrama inválido</strong><span>{error}</span></div>
  return <div className={`mermaid-block mermaid-block--${block.align ?? 'center'}`} dangerouslySetInnerHTML={{ __html: svg }} />
}

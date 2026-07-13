import { useEffect } from 'react'

// Fecha um painel/menu flutuante ao clicar fora dele ou pressionar Escape.
export function useClickOutside(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, isOpen, onClose])
}

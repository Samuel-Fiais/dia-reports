import { Moon, Sun } from 'lucide-react'
import { useAppTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggleButton() {
  const { appTheme, toggleAppTheme } = useAppTheme()
  return (
    <button
      type="button"
      className="theme-toggle-btn ready"
      title={appTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      onClick={toggleAppTheme}
    >
      {appTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

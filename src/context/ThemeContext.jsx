import { createContext, useContext, useEffect, useState } from 'react'
import { COLORS } from '../lib/theme'

const KEY = 'dia-app-theme'
const COLOR_KEY = 'dia-app-color-index'

function loadAppTheme() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function loadAppColorIndex() {
  try {
    const v = Number(localStorage.getItem(COLOR_KEY))
    return Number.isInteger(v) && v >= 0 && v < COLORS.length ? v : 0
  } catch {
    return 0
  }
}

const ThemeContext = createContext({
  appTheme: 'light',
  toggleAppTheme: () => {},
  appColorIndex: 0,
  setAppColorIndex: () => {},
})

export function ThemeProvider({ children }) {
  const [appTheme, setAppTheme] = useState(loadAppTheme)
  const [appColorIndex, setAppColorIndex] = useState(loadAppColorIndex)

  useEffect(() => {
    document.documentElement.dataset.theme = appTheme
    try {
      localStorage.setItem(KEY, appTheme)
    } catch {
      /* ignore */
    }
  }, [appTheme])

  useEffect(() => {
    try {
      localStorage.setItem(COLOR_KEY, String(appColorIndex))
    } catch {
      /* ignore */
    }
  }, [appColorIndex])

  const toggleAppTheme = () => setAppTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ appTheme, toggleAppTheme, appColorIndex, setAppColorIndex }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppTheme() {
  return useContext(ThemeContext)
}

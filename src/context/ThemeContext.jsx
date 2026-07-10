import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'dia-app-theme'

function loadAppTheme() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const ThemeContext = createContext({ appTheme: 'light', toggleAppTheme: () => {} })

export function ThemeProvider({ children }) {
  const [appTheme, setAppTheme] = useState(loadAppTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = appTheme
    try {
      localStorage.setItem(KEY, appTheme)
    } catch {
      /* ignore */
    }
  }, [appTheme])

  const toggleAppTheme = () => setAppTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ appTheme, toggleAppTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useAppTheme() {
  return useContext(ThemeContext)
}

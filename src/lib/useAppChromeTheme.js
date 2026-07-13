import { useEffect } from 'react'
import { applyTheme } from './theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'

// Toda tela que NÃO é um relatório (dashboard, admin, login) usa este hook em vez
// de chamar applyTheme manualmente com colorIndex hardcoded — assim a cor de fundo
// escolhida em Configurações vale pro app inteiro, fora do que cada relatório define
// pra si mesmo.
export function useAppChromeTheme(title) {
  const { appTheme, appColorIndex } = useAppTheme()
  useEffect(() => {
    applyTheme({ colorIndex: appColorIndex, fontIndex: 0 }, appTheme)
    if (title) document.title = title
  }, [appTheme, appColorIndex, title])
}

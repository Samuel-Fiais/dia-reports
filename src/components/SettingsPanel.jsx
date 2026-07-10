import { useEffect, useRef, useState } from 'react'
import { COLORS, COLORS_DARK, COLOR_NAMES, FONTS, FONT_SCALES } from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'

function ThemeToggleButton() {
  const { appTheme, toggleAppTheme } = useAppTheme()
  return (
    <button
      type="button"
      className="theme-toggle-btn ready"
      title={appTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      onClick={toggleAppTheme}
    >
      {appTheme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default function SettingsPanel({ settings, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const { appTheme } = useAppTheme()
  const colors = appTheme === 'dark' ? COLORS_DARK : COLORS

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const closeWithKeyboard = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeWithKeyboard)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeWithKeyboard)
    }
  }, [open])

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <div className={`settings-panel${open ? ' open' : ''}`}>
        <div className="settings-header">Personalizar relatório</div>
        <div className="settings-section-label">Fundo</div>
        <div className="settings-swatches">
          {colors.map((color, i) => (
            <button
              key={color}
              type="button"
              className={`swatch${settings.colorIndex === i ? ' active' : ''}`}
              style={{ background: color }}
              title={COLOR_NAMES[i] ?? `Cor ${i + 1}`}
              data-name={COLOR_NAMES[i] ?? `Cor ${i + 1}`}
              aria-label={`Fundo ${COLOR_NAMES[i] ?? `cor ${i + 1}`}`}
              onClick={() => onChange({ ...settings, colorIndex: i })}
            />
          ))}
        </div>

        <div className="settings-section-label">Gráficos</div>
        <div className="settings-chart-styles">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              className={`chart-style-btn${settings.chartStyleIndex === i ? ' active' : ''}`}
              title={['Sólido', 'Hachurado', 'Pontilhado'][i]}
              onClick={() => onChange({ ...settings, chartStyleIndex: i })}
            >
              <span className={`chart-style-icon chart-style-icon--${i}`} />
            </button>
          ))}
        </div>

        <div className="settings-fonts">
          {FONTS.map((font, i) => (
            <button
              key={font.label}
              type="button"
              className={`font-option${settings.fontIndex === i ? ' active' : ''}`}
              onClick={() => onChange({ ...settings, fontIndex: i })}
            >
              <span className="font-option-preview">
                <span className="font-option-sample" style={font.sampleStyle}>Aa</span>
                <span className="font-option-body-sample" style={font.bodySampleStyle}>Ag</span>
              </span>
              <span className="font-option-label">{font.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-section-label">Largura</div>
        <div className="settings-segmented">
          {[
            { value: 'standard', label: 'Padrão' },
            { value: 'full', label: 'Full width' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={settings.widthMode === option.value ? 'active' : ''}
              onClick={() => onChange({ ...settings, widthMode: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="settings-section-label">Tamanho do texto</div>
        <div className="settings-segmented settings-segmented--three">
          {FONT_SCALES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={settings.fontScale === option.value ? 'active' : ''}
              onClick={() => onChange({ ...settings, fontScale: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

      </div>

      <div className="settings-btn-row">
        <ThemeToggleButton />
        <button
          type="button"
          className="settings-btn ready"
          title="Customize"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { COLORS, COLORS_DARK, COLOR_NAMES, FONTS, FONT_SCALES } from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'
import { useClickOutside } from '../lib/useClickOutside.js'
import ThemeToggleButton from './ThemeToggleButton.jsx'

export default function SettingsPanel({ settings, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const { appTheme } = useAppTheme()
  const colors = appTheme === 'dark' ? COLORS_DARK : COLORS

  useClickOutside(wrapRef, open, () => setOpen(false))

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

        <div className="settings-section-label">Fontes</div>
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
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}

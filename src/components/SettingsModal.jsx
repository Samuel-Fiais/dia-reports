import { COLORS, COLORS_DARK, COLOR_NAMES } from '../lib/theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'
import Dialog from './admin/Dialog.jsx'
import ThemeToggleButton from './ThemeToggleButton.jsx'

export default function SettingsModal({ onClose }) {
  const { appTheme, appColorIndex, setAppColorIndex } = useAppTheme()
  const colors = appTheme === 'dark' ? COLORS_DARK : COLORS

  return (
    <Dialog eyebrow="Dia Reports" title="Configurações" onClose={onClose}>
      <div className="settings-modal-section">
        <div className="settings-section-label">Tema</div>
        <ThemeToggleButton />
      </div>

      <div className="settings-modal-section">
        <div className="settings-section-label">Cor de fundo do app</div>
        <div className="settings-swatches">
          {colors.map((color, i) => (
            <button
              key={color}
              type="button"
              className={`swatch${appColorIndex === i ? ' active' : ''}`}
              style={{ background: color }}
              title={COLOR_NAMES[i] ?? `Cor ${i + 1}`}
              data-name={COLOR_NAMES[i] ?? `Cor ${i + 1}`}
              aria-label={`Fundo ${COLOR_NAMES[i] ?? `cor ${i + 1}`}`}
              onClick={() => setAppColorIndex(i)}
            />
          ))}
        </div>
        <p className="settings-modal-hint">
          Vale só para o dashboard e telas do app — cada relatório mantém sua própria cor.
        </p>
      </div>
    </Dialog>
  )
}

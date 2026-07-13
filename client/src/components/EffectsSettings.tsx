import type { EffectSettings, EffectOption } from '../types'

const EFFECTS: EffectOption[] = [
  { id: 'blur', label: 'Blur', description: 'Gaussian blur' },
  { id: 'sharpen', label: 'Sharpen', description: 'Sharpen details' },
  { id: 'grayscale', label: 'Grayscale', description: 'Black & white' },
  { id: 'sepia', label: 'Sepia', description: 'Warm vintage tone' },
  { id: 'negate', label: 'Negate', description: 'Invert colors' },
  { id: 'noise', label: 'Noise', description: 'Add grain' },
  { id: 'edge', label: 'Edge Detect', description: 'Detect edges' },
  { id: 'oil-paint', label: 'Oil Paint', description: 'Oil painting effect' },
  { id: 'charcoal', label: 'Charcoal', description: 'Charcoal sketch' },
  { id: 'implode', label: 'Implode', description: 'Pinch toward center' },
  { id: 'swirl', label: 'Swirl', description: 'Twirl effect' },
  { id: 'pixelate', label: 'Pixelate', description: 'Mosaic / pixelation' },
]

interface Props {
  settings: EffectSettings
  onChange: (s: EffectSettings) => void
}

export default function EffectsSettingsBar({ settings, onChange }: Props) {
  const update = (p: Partial<EffectSettings>) => onChange({ ...settings, ...p })
  const sel = EFFECTS.find((e) => e.id === settings.effect)
  const hasRadius = ['blur', 'sharpen', 'edge', 'oil-paint', 'charcoal'].includes(settings.effect)
  const hasAmount = ['noise', 'implode', 'swirl', 'pixelate'].includes(settings.effect)

  return (
    <div className="settings-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {EFFECTS.map((ef) => (
          <button
            key={ef.id}
            className={`btn ${settings.effect === ef.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => update({ effect: ef.id })}
            title={ef.description}
          >
            {ef.label}
          </button>
        ))}
      </div>

      {sel && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {sel.description}
          {sel.id === 'grayscale' || sel.id === 'negate' ? ' (no additional settings)' : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        {hasRadius && (
          <div className="settings-group">
            <span className="settings-label">Radius:</span>
            <input
              type="range" className="settings-range" min={1} max={20} value={settings.radius}
              onChange={(e) => update({ radius: Number(e.target.value) })}
            />
            <span className="settings-value">{settings.radius}</span>
          </div>
        )}
        {settings.effect === 'blur' || settings.effect === 'sharpen' ? (
          <div className="settings-group">
            <span className="settings-label">Sigma:</span>
            <input
              type="range" className="settings-range" min={1} max={20} value={settings.sigma}
              onChange={(e) => update({ sigma: Number(e.target.value) })}
            />
            <span className="settings-value">{settings.sigma}</span>
          </div>
        ) : null}
        {hasAmount && (
          <div className="settings-group">
            <span className="settings-label">Amount:</span>
            <input
              type="range" className="settings-range" min={1} max={100} value={settings.amount}
              onChange={(e) => update({ amount: Number(e.target.value) })}
            />
            <span className="settings-value">{settings.amount}</span>
          </div>
        )}
      </div>
    </div>
  )
}

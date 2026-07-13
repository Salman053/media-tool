import type { ResizeSettings } from '../types'

const FIT_OPTIONS = [
  { value: 'cover', label: 'Cover (crop to fill)' },
  { value: 'contain', label: 'Contain (fit inside)' },
  { value: 'fill', label: 'Fill (stretch)' },
  { value: 'inside', label: 'Inside (shrink only)' },
  { value: 'outside', label: 'Outside (expand to fit)' },
]

const FORMATS = [
  { value: '', label: 'Same as source' },
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'avif', label: 'AVIF' },
]

interface ResizeSettingsProps {
  settings: ResizeSettings
  onChange: (settings: ResizeSettings) => void
}

export default function ResizeSettingsBar({ settings, onChange }: ResizeSettingsProps) {
  const update = (partial: Partial<ResizeSettings>) => {
    onChange({ ...settings, ...partial })
  }

  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">Width:</span>
        <input
          type="number"
          className="settings-select"
          style={{ width: 90 }}
          min={1}
          placeholder="auto"
          value={settings.width}
          onChange={(e) => update({ width: e.target.value })}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>px</span>
      </div>

      <div className="settings-group">
        <span className="settings-label">Height:</span>
        <input
          type="number"
          className="settings-select"
          style={{ width: 90 }}
          min={1}
          placeholder="auto"
          value={settings.height}
          onChange={(e) => update({ height: e.target.value })}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>px</span>
      </div>

      <div className="settings-group">
        <span className="settings-label">Fit:</span>
        <select
          className="settings-select"
          value={settings.fit}
          onChange={(e) => update({ fit: e.target.value as ResizeSettings['fit'] })}
        >
          {FIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="settings-group">
        <span className="settings-label">Format:</span>
        <select
          className="settings-select"
          value={settings.format}
          onChange={(e) => update({ format: e.target.value })}
        >
          {FORMATS.map((f) => (
            <option selected key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="settings-group">
        <span className="settings-label">Quality:</span>
        <input
          type="range"
          className="settings-range"
          min={1}
          max={100}
          value={settings.quality}
          onChange={(e) => update({ quality: Number(e.target.value) })}
        />
        <span className="settings-value">{settings.quality}</span>
      </div>
    </div>
  )
}

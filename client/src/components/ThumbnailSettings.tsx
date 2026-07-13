import type { ThumbnailSettings } from '../types'

interface Props {
  settings: ThumbnailSettings
  onChange: (s: ThumbnailSettings) => void
}

export default function ThumbnailSettingsBar({ settings, onChange }: Props) {
  const update = (p: Partial<ThumbnailSettings>) => onChange({ ...settings, ...p })

  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">Size:</span>
        <input
          type="number"
          className="settings-select"
          style={{ width: 90 }}
          min={16}
          max={1024}
          value={settings.size}
          onChange={(e) => update({ size: Number(e.target.value) })}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>px square</span>
      </div>

      <div className="settings-group">
        <span className="settings-label">Quality:</span>
        <input
          type="range"
          className="settings-range"
          min={1} max={100}
          value={settings.quality}
          onChange={(e) => update({ quality: Number(e.target.value) })}
        />
        <span className="settings-value">{settings.quality}</span>
      </div>
    </div>
  )
}

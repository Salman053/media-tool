import type { FrameSettings } from '../types'

interface Props {
  settings: FrameSettings
  onChange: (s: FrameSettings) => void
}

export default function VideoFrameSettingsBar({ settings, onChange }: Props) {
  const update = (p: Partial<FrameSettings>) => onChange({ ...settings, ...p })

  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">FPS:</span>
        <input type="number" className="settings-select" style={{ width: 70 }} min={0.1} max={120} step={0.1} placeholder="auto" value={settings.fps} onChange={(e) => update({ fps: e.target.value })} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
      </div>
      <div className="settings-group">
        <span className="settings-label">Count:</span>
        <input type="number" className="settings-select" style={{ width: 70 }} min={1} max={1000} placeholder="total" value={settings.count} onChange={(e) => update({ count: e.target.value })} />
      </div>
      <div className="settings-group">
        <span className="settings-label">Quality:</span>
        <input type="range" className="settings-range" min={1} max={31} value={settings.quality} onChange={(e) => update({ quality: Number(e.target.value) })} />
        <span className="settings-value">{settings.quality}</span>
      </div>
    </div>
  )
}

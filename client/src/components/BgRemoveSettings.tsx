interface BgRemoveSettingsProps {
  format: string
  onFormatChange: (v: string) => void
}

export default function BgRemoveSettings({ format, onFormatChange }: BgRemoveSettingsProps) {
  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">Format:</span>
        <select className="settings-select" value={format} onChange={(e) => onFormatChange(e.target.value)}>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="webp">WebP</option>
        </select>
      </div>
    </div>
  )
}

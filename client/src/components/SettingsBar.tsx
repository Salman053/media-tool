interface SettingsBarProps {
  format: string
  quality: number
  onFormatChange: (format: string) => void
  onQualityChange: (quality: number) => void
}

const FORMATS = [
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'avif', label: 'AVIF' },
  { value: 'tiff', label: 'TIFF' },
]

export default function SettingsBar({
  format,
  quality,
  onFormatChange,
  onQualityChange,
}: SettingsBarProps) {
  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">Format:</span>
        <select
          className="settings-select"
          value={format}
          onChange={(e) => onFormatChange(e.target.value)}
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
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
          value={quality}
          onChange={(e) => onQualityChange(Number(e.target.value))}
        />
        <span className="settings-value">{quality}</span>
      </div>
    </div>
  )
}

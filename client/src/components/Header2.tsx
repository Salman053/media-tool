import type { ToolMode } from '../types'

interface Header2Props {
  mode: ToolMode
  onModeChange: (m: ToolMode) => void
  fileCount: number
  onClear?: () => void
}

const MODES: { id: ToolMode; icon: string; label: string }[] = [
  { id: 'convert', icon: '↔', label: 'Convert' },
  { id: 'resize', icon: '⊞', label: 'Resize' },
  { id: 'effects', icon: '✦', label: 'Effects' },
  { id: 'thumbnail', icon: '▦', label: 'Thumbnail' },
  { id: 'video-convert', icon: '▶', label: 'Video' },
  { id: 'video-frames', icon: '▣', label: 'Frames' },
  { id: 'document', icon: '📄', label: 'Document' },
  { id: 'launcher', icon: '🔗', label: 'Launcher' },
  { id: 'rename', icon: '✎', label: 'Rename' },
  { id: 'qr', icon: '▩', label: 'QR Code' },
  { id: 'regex', icon: '.*', label: 'Regex' },
  { id: 'jwt', icon: '🔐', label: 'JWT' },
  { id: 'timestamp', icon: '⏱', label: 'Timestamp' },
  { id: 'favicon', icon: '◎', label: 'Favicon' },
  { id: 'mockup', icon: '🖼', label: 'Mockup' },
  { id: 'pdf-to-image', icon: '📄', label: 'PDF→Img' },
  { id: 'blur-focus', icon: '◎', label: 'Blur/Focus' },
  { id: 'emoji-mosaic', icon: '😊', label: 'Emoji Mosaic' },
  { id: 'waveform', icon: '〰', label: 'Waveform' },
  { id: 'calligraphy', icon: '🖊', label: 'Calligraphy' },
  { id: 'bg-remove', icon: '🎯', label: 'Bg Remove' },
]

export default function Header2({ mode, onModeChange, fileCount, onClear }: Header2Props) {
  return (
    <header className="header2">
      <div className="header2-left">
        <div className="header2-brand">M</div>
        <div className="header2-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`header2-tab ${mode === m.id ? 'active' : ''}`}
              onClick={() => onModeChange(m.id)}
              title={m.label}
            >
              <span className="header2-tab-icon">{m.icon}</span>
              <span className="header2-tab-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      {fileCount > 0 && (
        <button className="btn btn-secondary btn-sm" onClick={onClear} style={{ fontSize: 11, padding: '3px 10px' }}>
          Clear ({fileCount})
        </button>
      )}
    </header>
  )
}

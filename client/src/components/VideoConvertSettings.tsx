import type { VideoConvertSettings } from '../types'

interface Props {
  settings: VideoConvertSettings
  onChange: (s: VideoConvertSettings) => void
}

const FORMATS = [
  { value: '', label: 'Same as source' },
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV' },
  { value: 'mkv', label: 'MKV' },
  { value: 'gif', label: 'GIF' },
  { value: 'mp3', label: 'MP3' },
  { value: 'aac', label: 'AAC' },
  { value: 'ogg', label: 'OGG' },
]

const VIDEO_CODECS = [
  { value: '', label: 'Auto' },
  { value: 'libx264', label: 'H.264' },
  { value: 'libx265', label: 'H.265/HEVC' },
  { value: 'libvpx', label: 'VP8' },
  { value: 'libvpx-vp9', label: 'VP9' },
  { value: 'libaom-av1', label: 'AV1' },
]

const AUDIO_CODECS = [
  { value: '', label: 'Auto' },
  { value: 'aac', label: 'AAC' },
  { value: 'mp3', label: 'MP3' },
  { value: 'libopus', label: 'Opus' },
  { value: 'flac', label: 'FLAC' },
]

export default function VideoConvertSettingsBar({ settings, onChange }: Props) {
  const update = (p: Partial<VideoConvertSettings>) => onChange({ ...settings, ...p })

  return (
    <div className="settings-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="settings-group">
          <span className="settings-label">Format:</span>
          <select className="settings-select" value={settings.format} onChange={(e) => update({ format: e.target.value })}>
            {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="settings-group">
          <span className="settings-label">Video:</span>
          <select className="settings-select" value={settings.videoCodec} onChange={(e) => update({ videoCodec: e.target.value })}>
            {VIDEO_CODECS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="settings-group">
          <span className="settings-label">Audio:</span>
          <select className="settings-select" value={settings.audioCodec} onChange={(e) => update({ audioCodec: e.target.value })}>
            {AUDIO_CODECS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <div className="settings-group">
          <span className="settings-label">Bitrate:</span>
          <input type="text" className="settings-select" style={{ width: 90 }} placeholder="e.g. 1M" value={settings.bitrate} onChange={(e) => update({ bitrate: e.target.value })} />
        </div>
        <div className="settings-group">
          <span className="settings-label">FPS:</span>
          <input type="number" className="settings-select" style={{ width: 70 }} min={1} max={120} placeholder="auto" value={settings.fps} onChange={(e) => update({ fps: e.target.value })} />
        </div>
        <div className="settings-group">
          <span className="settings-label">Resolution:</span>
          <input type="text" className="settings-select" style={{ width: 100 }} placeholder="e.g. 1920:1080" value={settings.resolution} onChange={(e) => update({ resolution: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

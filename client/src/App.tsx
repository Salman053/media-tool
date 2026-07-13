import { useState, useCallback, useRef } from 'react'
import type { UploadedFile, ToolMode, ResizeSettings, EffectSettings, ThumbnailSettings, VideoConvertSettings, FrameSettings, DocConvertSettings, ProcessResponse } from './types'
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, DOCUMENT_EXTENSIONS } from './types'
import { uploadFiles, convertFiles, resizeFiles, effectsFiles, thumbnailFiles, videoConvertFiles, videoFrameFiles, docConvertFiles, getDownloadAllUrl } from './api'
import Header2 from './components/Header2'
import UploadArea from './components/UploadArea'
import FileGrid from './components/FileGrid'
import SettingsBar from './components/SettingsBar'
import ResizeSettingsBar from './components/ResizeSettings'
import EffectsSettingsBar from './components/EffectsSettings'
import ThumbnailSettingsBar from './components/ThumbnailSettings'
import VideoConvertSettingsBar from './components/VideoConvertSettings'
import VideoFrameSettingsBar from './components/VideoFrameSettings'
import DocSettingsBar from './components/DocSettings'
import ResultPanel from './components/ResultPanel'

const MODE_LABELS: Record<ToolMode, { label: string; past: string }> = {
  convert: { label: 'Convert', past: 'converted' },
  resize: { label: 'Resize', past: 'resized' },
  effects: { label: 'Effects', past: 'processed' },
  thumbnail: { label: 'Thumbnail', past: 'generated' },
  'video-convert': { label: 'Video Convert', past: 'converted' },
  'video-frames': { label: 'Frames', past: 'extracted' },
  document: { label: 'Document', past: 'converted' },
}

function getAccept(mode: ToolMode): string {
  if (mode === 'video-convert' || mode === 'video-frames') return 'video/*'
  if (mode === 'document') return '.pdf,.docx,.doc,.odt,.txt,.html,.htm,.rtf,.epub,.xlsx,.xls,.ods,.pptx,.ppt,.odp,.csv'
  return 'image/*'
}

function filterFilesByMode(files: UploadedFile[], mode: ToolMode): UploadedFile[] {
  if (mode === 'video-convert' || mode === 'video-frames') {
    return files.filter((f) => VIDEO_EXTENSIONS.includes(f.originalName.split('.').pop()?.toLowerCase() || ''))
  }
  if (mode === 'document') {
    return files.filter((f) => DOCUMENT_EXTENSIONS.includes(f.originalName.split('.').pop()?.toLowerCase() || ''))
  }
  return files.filter((f) => IMAGE_EXTENSIONS.includes(f.originalName.split('.').pop()?.toLowerCase() || ''))
}

export default function App() {
  const [mode, setMode] = useState<ToolMode>('convert')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [format, setFormat] = useState('webp')
  const [quality, setQuality] = useState(80)
  const [resize, setResize] = useState<ResizeSettings>({ width: '', height: '', fit: 'cover', format: '', quality: 85 })
  const [effect, setEffect] = useState<EffectSettings>({ effect: 'grayscale', radius: 5, sigma: 3, amount: 50 })
  const [thumb, setThumb] = useState<ThumbnailSettings>({ size: 150, quality: 80 })
  const [videoConv, setVideoConv] = useState<VideoConvertSettings>({ format: '', videoCodec: '', audioCodec: '', bitrate: '', fps: '', resolution: '' })
  const [frames, setFrames] = useState<FrameSettings>({ fps: '', count: '', quality: 3 })
  const [docConv, setDocConv] = useState<DocConvertSettings>({ format: 'pdf' })
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const notifTimeout = useRef<ReturnType<typeof setTimeout>>()

  const showNotif = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    clearTimeout(notifTimeout.current)
    notifTimeout.current = setTimeout(() => setNotification(null), 3500)
  }, [])

  const handleModeChange = useCallback((next: ToolMode) => {
    setMode(next)
    if (sessionId) {
      setFiles((prev: UploadedFile[]) => filterFilesByMode(prev, next))
    }
  }, [sessionId])

  const handleUpload = useCallback(async (fileList: FileList | File[]) => {
    try {
      const arr = fileList instanceof FileList ? Array.from(fileList) : fileList
      const resp = await uploadFiles(arr)
      setSessionId(resp.sessionId)
      const allFiles: UploadedFile[] = resp.files.map((f, i) => ({ ...f, previewUrl: URL.createObjectURL(arr[i]), status: 'pending' as const }))
      const filtered = filterFilesByMode(allFiles, mode)
      setFiles(filtered)
      showNotif('success', `${filtered.length} file(s) uploaded`)
    } catch (err) {
      showNotif('error', (err as Error).message)
    }
  }, [showNotif, mode])

  const processFiles = useCallback(async (fn: () => Promise<ProcessResponse>, okLabel: string) => {
    if (!sessionId || files.length === 0) return
    setProcessing(true)
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'converting' as const })))
    try {
      const resp = await fn()
      setFiles((prev) =>
        prev.map((f) => {
          const r = resp.results.find((x) => x.originalName === f.originalName)
          if (!r) return { ...f, status: 'error' as const }
          return { ...f, status: r.success ? 'done' as const : 'error' as const, result: r }
        }),
      )
      const ok = resp.results.filter((r) => r.success).length
      showNotif('success', `${okLabel} ${ok} of ${resp.results.length} file(s)`)
    } catch (err) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const })))
      showNotif('error', (err as Error).message)
    } finally { setProcessing(false) }
  }, [sessionId, files.length, showNotif])

  const handleConvert = useCallback(() => processFiles(() => convertFiles(sessionId!, format, quality), 'Converted'), [sessionId, format, quality, processFiles])
  const handleResizeAct = useCallback(() => {
    if (!resize.width && !resize.height) { showNotif('error', 'Enter width or height'); return }
    processFiles(() => resizeFiles(sessionId!, resize), 'Resized')
  }, [sessionId, resize, processFiles, showNotif])
  const handleEffects = useCallback(() => processFiles(() => effectsFiles(sessionId!, effect), 'Processed'), [sessionId, effect, processFiles])
  const handleThumbnail = useCallback(() => processFiles(() => thumbnailFiles(sessionId!, thumb), 'Generated'), [sessionId, thumb, processFiles])
  const handleVideoConvert = useCallback(() => processFiles(() => videoConvertFiles(sessionId!, videoConv), 'Converted'), [sessionId, videoConv, processFiles])
  const handleVideoFrames = useCallback(() => processFiles(() => videoFrameFiles(sessionId!, frames), 'Extracted'), [sessionId, frames, processFiles])
  const handleDocConvert = useCallback(() => processFiles(() => docConvertFiles(sessionId!, docConv), 'Converted'), [sessionId, docConv, processFiles])

  const handleClear = useCallback(() => { setFiles([]); setSessionId(null) }, [])

  const canProcess = files.length > 0 && !processing
  const hasResults = files.some((f) => f.status === 'done')
  const okCount = files.filter((f) => f.status === 'done').length
  const act = MODE_LABELS[mode]

  const handleAction =
    mode === 'convert' ? handleConvert :
    mode === 'resize' ? handleResizeAct :
    mode === 'effects' ? handleEffects :
    mode === 'thumbnail' ? handleThumbnail :
    mode === 'video-convert' ? handleVideoConvert :
    mode === 'video-frames' ? handleVideoFrames :
    handleDocConvert

  const uploadToolName =
    mode === 'effects' ? 'apply effects' :
    mode === 'thumbnail' ? 'generate thumbnails' :
    mode === 'video-convert' ? 'convert video/audio' :
    mode === 'video-frames' ? 'extract frames' :
    mode === 'document' ? 'convert documents' :
    act.label.toLowerCase()

  return (
    <div className="app-layout">
      <Header2
        mode={mode}
        onModeChange={handleModeChange}
        fileCount={files.length}
        onClear={files.length > 0 ? handleClear : undefined}
      />

      <div className="container">
        {files.length === 0 && (
          <UploadArea onUpload={handleUpload} toolName={uploadToolName} accept={getAccept(mode)} />
        )}

        {files.length > 0 && (
          <>
            <div className="section">
              <div className="section-header">
                <span className="section-title">Files <span className="section-badge">{files.length}</span></span>
              </div>
              <FileGrid files={files} />
            </div>

            {!hasResults && (
              <>
                <div className="section">
                  <div className="section-header"><span className="section-title">{act.label} Settings</span></div>
                  {mode === 'convert' && <SettingsBar format={format} quality={quality} onFormatChange={setFormat} onQualityChange={setQuality} />}
                  {mode === 'resize' && <ResizeSettingsBar settings={resize} onChange={setResize} />}
                  {mode === 'effects' && <EffectsSettingsBar settings={effect} onChange={setEffect} />}
                  {mode === 'thumbnail' && <ThumbnailSettingsBar settings={thumb} onChange={setThumb} />}
                  {mode === 'video-convert' && <VideoConvertSettingsBar settings={videoConv} onChange={setVideoConv} />}
                  {mode === 'video-frames' && <VideoFrameSettingsBar settings={frames} onChange={setFrames} />}
                  {mode === 'document' && <DocSettingsBar settings={docConv} onChange={setDocConv} />}
                </div>
                <button className="btn btn-primary btn-action" disabled={!canProcess} onClick={handleAction}>
                  {processing ? <><span className="spinner" /> Processing...</> : <>{act.label} {files.length > 1 ? `All ${files.length}` : ''}</>}
                </button>
              </>
            )}

            {hasResults && (
              <div className="section">
                <div className="section-header">
                  <span className="section-title">Results <span className="section-badge">{okCount} {act.past}</span></span>
                  <div className="btn-group">
                    {sessionId && <a className="btn btn-success btn-sm" href={getDownloadAllUrl(sessionId)} download>Download ZIP</a>}
                    <button className="btn btn-secondary btn-sm" onClick={handleClear}>Start Over</button>
                  </div>
                </div>
                <ResultPanel files={files} sessionId={sessionId} />
              </div>
            )}
          </>
        )}
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.message}</div>}
    </div>
  )
}

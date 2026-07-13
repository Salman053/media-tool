import { useState, useCallback, useRef } from 'react'
import type { UploadedFile } from './types'
import { uploadFiles, convertFiles, getDownloadAllUrl } from './api'
import Header from './components/Header'
import UploadArea from './components/UploadArea'
import FileGrid from './components/FileGrid'
import SettingsBar from './components/SettingsBar'
import ResultPanel from './components/ResultPanel'

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [format, setFormat] = useState('webp')
  const [quality, setQuality] = useState(80)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const notifTimeout = useRef<ReturnType<typeof setTimeout>>()

  const showNotif = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    clearTimeout(notifTimeout.current)
    notifTimeout.current = setTimeout(() => setNotification(null), 3500)
  }, [])

  const handleUpload = useCallback(async (fileList: FileList | File[]) => {
    try {
      const resp = await uploadFiles(fileList)
      setSessionId(resp.sessionId)

      const mapped: UploadedFile[] = resp.files.map((f) => ({
        ...f,
        previewUrl: URL.createObjectURL(
          fileList instanceof FileList
            ? Array.from(fileList).find((x) => x.name === f.originalName)!
            : fileList.find((x) => x.name === f.originalName)!,
        ),
        status: 'pending' as const,
      }))

      setFiles(mapped)
      showNotif('success', `${mapped.length} file(s) uploaded`)
    } catch (err) {
      showNotif('error', (err as Error).message)
    }
  }, [showNotif])

  const handleConvert = useCallback(async () => {
    if (!sessionId || files.length === 0) return

    setConverting(true)
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'converting' as const })))

    try {
      const resp = await convertFiles(sessionId, format, quality)

      setFiles((prev) =>
        prev.map((f) => {
          const result = resp.results.find((r) => r.originalName === f.originalName)
          if (!result) return { ...f, status: 'error' as const }
          return {
            ...f,
            status: result.success ? 'done' as const : 'error' as const,
            result,
          }
        }),
      )

      const successCount = resp.results.filter((r) => r.success).length
      showNotif('success', `Converted ${successCount} of ${resp.results.length} file(s)`)
    } catch (err) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const })))
      showNotif('error', (err as Error).message)
    } finally {
      setConverting(false)
    }
  }, [sessionId, files.length, format, quality, showNotif])

  const handleClear = useCallback(() => {
    setFiles([])
    setSessionId(null)
  }, [])

  const canConvert = files.length > 0 && !converting
  const hasResults = files.some((f) => f.status === 'done')

  return (
    <>
      <Header fileCount={files.length} onClear={files.length > 0 ? handleClear : undefined} />

      <div className="container">
        {files.length === 0 && (
          <UploadArea onUpload={handleUpload} />
        )}

        {files.length > 0 && (
          <>
            <div className="section">
              <div className="section-header">
                <span className="section-title">
                  Uploaded Files
                  <span className="section-badge">{files.length} file(s)</span>
                </span>
              </div>
              <FileGrid files={files} />
            </div>

            {!hasResults && (
              <>
                <div className="section">
                  <div className="section-header">
                    <span className="section-title">Conversion Settings</span>
                  </div>
                  <SettingsBar
                    format={format}
                    quality={quality}
                    onFormatChange={setFormat}
                    onQualityChange={setQuality}
                  />
                </div>

                <div className="convert-row">
                  <button
                    className="btn btn-primary"
                    disabled={!canConvert}
                    onClick={handleConvert}
                  >
                    {converting ? (
                      <><span className="spinner" /> Converting...</>
                    ) : (
                      <>Convert {files.length > 1 ? `All ${files.length} Files` : 'File'}</>
                    )}
                  </button>
                </div>
              </>
            )}

            {hasResults && (
              <div className="section">
                <div className="section-header">
                  <span className="section-title">
                    Results
                    <span className="section-badge">
                      {files.filter((f) => f.status === 'done').length} converted
                    </span>
                  </span>
                  <div className="btn-group">
                    {sessionId && (
                      <a
                        className="btn btn-success btn-sm"
                        href={getDownloadAllUrl(sessionId)}
                        download
                      >
                        Download All as ZIP
                      </a>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={handleClear}>
                      Start Over
                    </button>
                  </div>
                </div>
                <ResultPanel files={files} sessionId={sessionId} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="footer">
        Media Tool &middot; Built with sharp &middot; v0.1.0
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </>
  )
}

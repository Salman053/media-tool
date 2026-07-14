import type { UploadedFile } from '../types'
import { getDownloadUrl } from '../api'
import { useEffect, useState } from 'react'

const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'tif', 'gif', 'bmp', 'svg']
const VID_EXTS = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'm4v', 'mpg', 'mpeg', '3gp', 'ogv']

function hasExt(name: string, exts: string[]): boolean {
  const e = name.split('.').pop()?.toLowerCase() || ''
  return exts.includes(e)
}

interface ResultPanelProps {
  files: UploadedFile[]
  sessionId: string | null
}

function formatSize(bytes: number | undefined): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResultPanel({ files, sessionId }: ResultPanelProps) {
  const results = files.filter((f) => f.status === 'done' || f.status === 'error')
  const [bigUrl, setBigUrl] = useState<string | null>(null)
  const [isVidBig, setIsVidBig] = useState(false)

  const closeBig = () => setBigUrl(null)


  useEffect(() => {
    if (bigUrl || isVidBig) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    }
  }, [isVidBig, bigUrl])
  return (
    <>
      <div className="results-grid">
        {results.map((file) => {
          if (!file.result) return null

          const savings = file.result.inputSize && file.result.outputSize
            ? ((1 - file.result.outputSize / file.result.inputSize) * 100).toFixed(1)
            : null
          const url = sessionId ? getDownloadUrl(sessionId, file.result.outputName) : ''
          const hasGlob = file.result.outputName.includes('*')
          const isImg = hasExt(file.result.outputName, IMG_EXTS) && !hasGlob
          const isVid = hasExt(file.result.outputName, VID_EXTS) && !hasGlob

          return (
            <div
              key={file.id}
              className={`result-card ${file.result.success ? 'success' : 'error'}`}
            >
              {file.result.success && url && (isImg || isVid) && (
                <div onClick={() => { setBigUrl(url); setIsVidBig(isVid) }} style={{ marginBottom: 6, cursor: 'pointer' }}>
                  {isImg ? (
                    <img src={url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }} />
                  ) : (
                    <video src={url} muted style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }} />
                  )}
                </div>
              )}
              <div className="result-name" title={file.result.outputName || file.originalName}>
                {file.result.outputName || file.originalName}
              </div>

              {file.result.success ? (
                <>
                  <div className="result-meta">
                    {formatSize(file.result.inputSize)} &rarr; {formatSize(file.result.outputSize)}
                  </div>
                  {savings && (
                    <div className="result-meta" style={{ color: '#16a34a' }}>
                      {savings}% smaller &middot; {file.result.duration}ms
                    </div>
                  )}
                  <div className="result-actions">
                    {sessionId && (
                      <a className="btn btn-primary btn-sm" href={url} download style={{ flex: 1, textAlign: 'center' }}>
                        Download
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="result-meta" style={{ color: '#dc2626' }}>
                  {file.result.error || 'Conversion failed'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {bigUrl && (
        <div
          onClick={closeBig}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out',
          }}
        >
          {isVidBig ? (
            <video src={bigUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, cursor: 'default' }}
              onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={bigUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, cursor: 'default' }}
              onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  )
}

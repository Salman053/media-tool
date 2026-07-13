import type { UploadedFile } from '../types'
import { getDownloadUrl } from '../api'

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

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
        <div className="empty-state-text">No results yet</div>
      </div>
    )
  }

  return (
    <div className="results-grid">
      {results.map((file) => {
        if (!file.result) return null

        const savings = file.result.inputSize && file.result.outputSize
          ? ((1 - file.result.outputSize / file.result.inputSize) * 100).toFixed(1)
          : null

        return (
          <div
            key={file.id}
            className={`result-card ${file.result.success ? 'success' : 'error'}`}
          >
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
                    <a
                      className="btn btn-primary btn-sm"
                      href={getDownloadUrl(sessionId, file.result.outputName)}
                      download
                      style={{ flex: 1, textAlign: 'center' }}
                    >
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
  )
}

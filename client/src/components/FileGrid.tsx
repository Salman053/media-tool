import type { UploadedFile } from '../types'

interface FileGridProps {
  files: UploadedFile[]
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusLabel(status: UploadedFile['status']): { text: string; className: string } {
  switch (status) {
    case 'pending':
      return { text: 'Pending', className: '' }
    case 'converting':
      return { text: 'Converting...', className: 'converting' }
    case 'done':
      return { text: 'Done', className: 'done' }
    case 'error':
      return { text: 'Error', className: 'error' }
  }
}

export default function FileGrid({ files }: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
        <div className="empty-state-text">No files uploaded yet</div>
      </div>
    )
  }

  return (
    <div className="file-grid">
      {files.map((file) => {
        const status = statusLabel(file.status)
        return (
          <div key={file.id} className="file-card">
            {file.previewUrl ? (
              <img
                className="file-preview"
                src={file.previewUrl}
                alt={file.originalName}
              />
            ) : (
              <div className="file-preview-placeholder">
                {file.originalName.split('.').pop()?.toUpperCase()}
              </div>
            )}
            <div className="file-info">
              <div className="file-name" title={file.originalName}>
                {file.originalName}
              </div>
              <div className="file-size">{formatSize(file.size)}</div>
              <div className={`file-status ${status.className}`}>
                {file.status === 'converting' && <span className="spinner" />}
                {status.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

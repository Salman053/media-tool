import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface UploadAreaProps {
  onUpload: (files: FileList | File[]) => void
}

export default function UploadArea({ onUpload }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleClick = () => inputRef.current?.click()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onUpload(e.target.files)
      e.target.value = ''
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) {
      onUpload(e.dataTransfer.files)
    }
  }

  return (
    <div
      className={`upload-area ${dragging ? 'drag-over' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="upload-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </span>
      <div className="upload-title">Drop files here or click to browse</div>
      <div className="upload-hint">
        Supports JPG, PNG, GIF, WEBP, TIFF, AVIF, BMP, SVG &nbsp;&middot;&nbsp; Up to 100 MB each
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

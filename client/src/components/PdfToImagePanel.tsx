import { useState, useCallback, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export default function PdfToImagePanel() {
  const [numPages, setNumPages] = useState(0)
  const [pageRange, setPageRange] = useState('')
  const [scale, setScale] = useState(2)
  const [quality, setQuality] = useState(92)
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<{ page: number; dataUrl: string; size: number }[]>([])
  const [error, setError] = useState('')
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImages([])
    setError('')
    pdfRef.current = null

    try {
      const buf = await f.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: buf }).promise
      pdfRef.current = doc
      setNumPages(doc.numPages)
      setPageRange(`1-${doc.numPages}`)
    } catch (err) {
      setError('Failed to load PDF: ' + (err as Error).message)
    }
  }, [])

  const convert = useCallback(async () => {
    const doc = pdfRef.current
    if (!doc) return
    setGenerating(true)
    setError('')
    setImages([])

    const range = parseRange(pageRange, doc.numPages)
    if (range.length === 0) { setError('Invalid page range'); setGenerating(false); return }

    const results: { page: number; dataUrl: string; size: number }[] = []

    try {
      for (const pageNum of range) {
        const page = await doc.getPage(pageNum)
        const vp = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width; canvas.height = vp.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise

        const dataUrl = canvas.toDataURL('image/jpeg', quality / 100)
        const size = Math.round(dataUrl.length * 0.75)
        results.push({ page: pageNum, dataUrl, size })
      }
      setImages(results)
    } catch (err) {
      setError('Render error: ' + (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [pageRange, scale, quality])

  const downloadAll = useCallback(() => {
    if (images.length === 0) return
    for (const img of images) {
      const a = document.createElement('a')
      a.href = img.dataUrl
      a.download = `page-${img.page}.jpg`
      a.click()
    }
  }, [images])

  const downloadPage = useCallback((dataUrl: string, page: number) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `page-${page}.jpg`
    a.click()
  }, [])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        Convert PDF pages to high-quality JPEG images. Perfect for creating thumbnails, sharing slides on social media, or extracting visuals.
      </div>

      <div style={{ marginBottom: 12 }}>
        <input type="file" accept=".pdf" onChange={handleFile} style={{ fontSize: 12 }} />
      </div>

      {numPages > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
              Pages ({numPages} total)
            </div>
            <input
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder={`1-${numPages}`}
              style={{
                width: 120, padding: '5px 8px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'monospace',
                background: 'var(--surface)', color: 'var(--text)', outline: 'none',
              }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>e.g. 1-5, 3, 7-10</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Scale</div>
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{
                padding: '5px 8px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 12,
                background: 'var(--surface)', color: 'var(--text)', outline: 'none',
              }}
            >
              <option value={1}>1× (72 DPI)</option>
              <option value={2}>2× (144 DPI)</option>
              <option value={3}>3× (216 DPI)</option>
              <option value={4}>4× (288 DPI)</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Quality</div>
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{
                padding: '5px 8px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 12,
                background: 'var(--surface)', color: 'var(--text)', outline: 'none',
              }}
            >
              <option value={60}>Low (small file)</option>
              <option value={80}>Medium</option>
              <option value={92}>High</option>
              <option value={100}>Max (large file)</option>
            </select>
          </div>
        </div>
      )}

      {numPages > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button className="btn btn-primary btn-action" disabled={generating} onClick={convert}>
            {generating ? <><span className="spinner" /> Rendering...</> : `Convert ${pageRange ? parseRange(pageRange, numPages).length : 0} Page(s) to JPEG`}
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: 8, background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{error}</div>
      )}

      {images.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{images.length} Page(s) Rendered</span>
            {images.length > 1 && (
              <button className="btn btn-success btn-sm" onClick={downloadAll}>Download All ({images.length} files)</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {images.map(img => (
              <div key={img.page} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Page {img.page}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(img.size / 1024).toFixed(1)} KB</span>
                    <button className="btn btn-primary btn-sm" onClick={() => downloadPage(img.dataUrl, img.page)}>Download</button>
                  </div>
                </div>
                <img src={img.dataUrl} alt={`Page ${img.page}`} style={{ width: '100%', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function parseRange(input: string, max: number): number[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const pages = new Set<number>()
  for (const part of trimmed.split(',')) {
    const p = part.trim()
    const m = p.match(/^(\d+)$/)
    if (m) {
      const n = Number.parseInt(m[1])
      if (n >= 1 && n <= max) pages.add(n)
      continue
    }
    const r = p.match(/^(\d+)-(\d+)$/)
    if (r) {
      const s = Number.parseInt(r[1]); const e = Number.parseInt(r[2])
      for (let i = Math.max(1, s); i <= Math.min(max, e); i++) pages.add(i)
    }
  }
  return [...pages].sort((a, b) => a - b)
}

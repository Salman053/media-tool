import { useState, useCallback } from 'react'

interface FaviconFile {
  name: string
  size: number
  downloadUrl: string
}

const FAVICON_SIZES = [
  { size: 16, label: '16×16', desc: 'Favicon (small)' },
  { size: 32, label: '32×32', desc: 'Favicon (standard)' },
  { size: 48, label: '48×48', desc: 'Favicon (large)' },
  { size: 64, label: '64×64', desc: 'Favicon (extra)' },
  { size: 96, label: '96×96', desc: 'Google TV' },
  { size: 128, label: '128×128', desc: 'Chrome Web Store' },
  { size: 180, label: '180×180', desc: 'Apple Touch Icon' },
  { size: 192, label: '192×192', desc: 'Android Chrome' },
  { size: 256, label: '256×256', desc: 'Large icon' },
  { size: 512, label: '512×512', desc: 'Android Chrome' },
]

export default function FaviconPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [generating, setGenerating] = useState(false)
  const [faviconFiles, setFaviconFiles] = useState<FaviconFile[]>([])
  const [manifestJson, setManifestJson] = useState('')
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
    setFaviconFiles([])
  }, [])

  const generate = useCallback(async () => {
    if (!file) return
    setGenerating(true)
    setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('sessionId', crypto.randomUUID())
      const res = await fetch('/api/favicon', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Generation failed')
      }
      const data = await res.json()
      setFaviconFiles(data.files)
      setManifestJson(data.manifest)
      setSessionId(data.sessionId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [file])

  const downloadAll = useCallback(() => {
    if (!sessionId) return
    const a = document.createElement('a')
    a.href = `/api/download-all/${sessionId}`
    a.download = `favicon-${sessionId.slice(0, 8)}.zip`
    a.click()
  }, [sessionId])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        Upload a square image (PNG, JPG, SVG) to generate all favicon sizes,<br />
        Apple Touch Icon, <code>favicon.ico</code>, and <code>manifest.json</code>.
      </div>

      <div style={{ marginBottom: 12 }}>
        <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 12 }} />
      </div>

      {preview && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={preview} alt="Preview" style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{file?.name}</span>
        </div>
      )}

      <button className="btn btn-primary btn-action" disabled={!file || generating} onClick={generate}>
        {generating ? <><span className="spinner" /> Generating...</> : 'Generate Favicons'}
      </button>

      {error && (
        <div style={{ marginTop: 10, padding: 8, background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--error)' }}>{error}</div>
      )}

      {faviconFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Generated Files</span>
            <button className="btn btn-success btn-sm" onClick={downloadAll}>Download All</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {faviconFiles.map((f) => {
              const sizeMatch = f.name.match(/(\d+)x\d+/)
              const size = sizeMatch ? Number.parseInt(sizeMatch[1]) : 0
              const info = FAVICON_SIZES.find(s => s.size === size)
              return (
                <a
                  key={f.name}
                  href={f.downloadUrl}
                  download={f.name}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: 8, background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)',
                    cursor: 'pointer', minWidth: 80,
                  }}
                >
                  {f.name.endsWith('.ico') ? (
                    <div style={{
                      width: Math.min(size || 32, 48), height: Math.min(size || 32, 48),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--primary-light)', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    }}>
                      .ICO
                    </div>
                  ) : f.name.endsWith('.json') ? (
                    <div style={{
                      width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--primary-light)', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    }}>
                      {`{ }`}
                    </div>
                  ) : (
                    <img
                      src={f.downloadUrl}
                      alt={f.name}
                      style={{
                        width: Math.min(size, 48), height: Math.min(size, 48),
                        imageRendering: 'pixelated', borderRadius: 4,
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{info?.label || f.name.replace(/\.\w+$/, '')}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{info?.desc || ''}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</div>
                </a>
              )
            })}
          </div>

          {manifestJson && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>manifest.json</div>
              <pre style={{
                padding: 10, background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                fontSize: 10, fontFamily: 'monospace', overflow: 'auto', maxHeight: 200,
                border: '1px solid var(--border)', lineHeight: 1.5,
              }}>{manifestJson}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

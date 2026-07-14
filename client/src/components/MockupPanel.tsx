import { useState, useCallback, useEffect, useRef } from 'react'
import { DEVICES, drawMockup, renderToCanvas } from './mockupDevices'

const BG_OPTIONS = [
  { label: 'None', val: 'none' },
  { label: 'Dark', val: '#1a1a2e' },
  { label: 'Light', val: '#f0f0f5' },
  { label: 'Gradient', val: 'gradient' },
]

export default function MockupPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState('')
  const [selected, setSelected] = useState('iphone')
  const [background, setBackground] = useState('none')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const device = DEVICES.find(d => d.id === selected)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setImgSrc(URL.createObjectURL(f))
    setError('')
  }, [])

  const renderPreview = useCallback(() => {
    if (!imageRef.current || !device || !canvasRef.current) return
    const img = imageRef.current
    const canvas = canvasRef.current
    const s = device.w > 600 ? 1 : 2
    const pad = background !== 'none' ? Math.round(device.w * 0.06 * s) : 0
    canvas.width = device.w * s + pad * 2
    canvas.height = device.h * s + pad * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawMockup(ctx, device, img, background, pad, s)
  }, [selected, background, device])

  useEffect(() => {
    if (!imgSrc || !device) return
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      renderPreview()
    }
    img.src = imgSrc
  }, [imgSrc, device, renderPreview])

  const download = useCallback(async () => {
    if (!file || !device) return
    setGenerating(true)
    setError('')
    try {
      const img = await loadImage(URL.createObjectURL(file))
      const blob = await renderToCanvas(device, img, background)
      if (!blob) throw new Error('Failed to generate mockup')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `mockup-${selected}.png`
      a.click()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [file, selected, background, device])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        Upload a screenshot and wrap it in a realistic device frame for portfolios, READMEs, and presentations. All rendering is done client-side — nothing leaves your machine.
      </div>

      <div style={{ marginBottom: 12 }}>
        <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 12 }} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Device</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {DEVICES.map(d => (
              <button
                key={d.id}
                className={`btn btn-sm ${selected === d.id ? 'btn-primary' : ''}`}
                onClick={() => setSelected(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Background</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {BG_OPTIONS.map(b => (
              <button
                key={b.val}
                className={`btn btn-sm ${background === b.val ? 'btn-primary' : ''}`}
                onClick={() => setBackground(b.val)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary btn-action" disabled={!file || generating} onClick={download}>
          {generating ? <><span className="spinner" /> Generating...</> : 'Download Mockup'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 8, background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{error}</div>
      )}

      {imgSrc && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Preview</div>
          <div style={{
            display: 'flex', justifyContent: 'center',
            background: background === 'none' ? 'var(--surface)' : background === 'gradient' ? undefined : background,
            borderRadius: 'var(--radius-sm)', padding: background !== 'none' ? 16 : 0,
            position: 'relative',
          }}>
            {background === 'gradient' && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
            )}
            <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: 'inherit', position: 'relative', zIndex: 1 }} />
          </div>
        </div>
      )}
    </div>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

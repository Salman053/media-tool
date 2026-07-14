import { useState, useRef, useCallback, useEffect } from 'react'

interface EmojiEntry {
  e: string; r: number; g: number; b: number
}

const EMOJIS: EmojiEntry[] = [
  { e: '❤️', r: 229, g: 55, b: 55 }, { e: '🧡', r: 255, g: 150, b: 30 }, { e: '💛', r: 255, g: 215, b: 0 },
  { e: '💚', r: 50, g: 200, b: 80 }, { e: '💙', r: 0, g: 120, b: 255 }, { e: '💜', r: 150, g: 60, b: 220 },
  { e: '🖤', r: 20, g: 20, b: 20 }, { e: '🤍', r: 235, g: 235, b: 235 }, { e: '🤎', r: 140, g: 80, b: 40 },
  { e: '🩷', r: 255, g: 130, b: 180 }, { e: '🩵', r: 120, g: 200, b: 255 }, { e: '🩶', r: 160, g: 160, b: 160 },
  { e: '🍎', r: 220, g: 40, b: 30 }, { e: '🍊', r: 255, g: 140, b: 20 }, { e: '🍋', r: 255, g: 230, b: 50 },
  { e: '🍀', r: 40, g: 180, b: 60 }, { e: '🫐', r: 60, g: 80, b: 200 }, { e: '🍇', r: 120, g: 40, b: 140 },
  { e: '🌶️', r: 200, g: 30, b: 20 }, { e: '🥕', r: 240, g: 120, b: 20 }, { e: '🌽', r: 250, g: 210, b: 60 },
  { e: '🥦', r: 50, g: 160, b: 70 }, { e: '🧊', r: 180, g: 220, b: 255 }, { e: '🔥', r: 255, g: 100, b: 10 },
  { e: '🌈', r: 200, g: 100, b: 255 }, { e: '☀️', r: 255, g: 220, b: 50 }, { e: '🌙', r: 200, g: 200, b: 180 },
  { e: '🌊', r: 30, g: 140, b: 220 }, { e: '🌲', r: 30, g: 120, b: 40 }, { e: '🌵', r: 60, g: 180, b: 60 },
  { e: '🌸', r: 255, g: 160, b: 200 }, { e: '🌻', r: 255, g: 200, b: 30 }, { e: '🌹', r: 200, g: 40, b: 60 },
  { e: '🍄', r: 200, g: 80, b: 60 }, { e: '🐝', r: 240, g: 190, b: 20 }, { e: '🐞', r: 220, g: 30, b: 30 },
  { e: '🐟', r: 40, g: 150, b: 220 }, { e: '🦋', r: 80, g: 140, b: 230 }, { e: '🐸', r: 60, g: 180, b: 60 },
  { e: '🦊', r: 230, g: 120, b: 30 }, { e: '🐼', r: 200, g: 200, b: 200 }, { e: '🐧', r: 40, g: 40, b: 60 },
  { e: '🐨', r: 130, g: 130, b: 150 }, { e: '🦁', r: 200, g: 160, b: 60 }, { e: '🐘', r: 140, g: 130, b: 120 },
  { e: '🦩', r: 255, g: 130, b: 170 }, { e: '🦜', r: 30, g: 200, b: 100 }, { e: '🦚', r: 20, g: 160, b: 140 },
  { e: '🐊', r: 50, g: 140, b: 50 }, { e: '🦎', r: 60, g: 180, b: 60 }, { e: '🐢', r: 40, g: 140, b: 50 },
  { e: '🍕', r: 210, g: 150, b: 40 }, { e: '🍔', r: 180, g: 120, b: 50 }, { e: '🌮', r: 220, g: 170, b: 80 },
  { e: '🍦', r: 255, g: 200, b: 220 }, { e: '☕', r: 140, g: 80, b: 40 }, { e: '🍺', r: 230, g: 180, b: 60 },
  { e: '💎', r: 100, g: 200, b: 255 }, { e: '🔮', r: 160, g: 80, b: 220 }, { e: '💡', r: 255, g: 240, b: 120 },
  { e: '🪙', r: 220, g: 190, b: 60 }, { e: '🧲', r: 180, g: 120, b: 100 }, { e: '🧸', r: 180, g: 140, b: 100 },
]

function closestEmoji(r: number, g: number, b: number, list: EmojiEntry[]): string {
  let best = list[0]; let bestD = Infinity
  for (const em of list) {
    const d = (em.r - r) ** 2 + (em.g - g) ** 2 + (em.b - b) ** 2
    if (d < bestD) { bestD = d; best = em }
  }
  return best.e
}

export default function EmojiMosaicPanel() {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [gridSize, setGridSize] = useState(40)
  const [cellPx, setCellPx] = useState(14)
  const [processing, setProcessing] = useState(false)
  const [fmt, setFmt] = useState<'png' | 'jpeg' | 'webp'>('png')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const process = useCallback(() => {
    const img = imgRef.current; const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cols = gridSize; const rows = Math.round(cols * (img.naturalHeight / img.naturalWidth))
    const cw = cols * cellPx; const ch = rows * cellPx
    canvas.width = cw; canvas.height = ch

    const sc = document.createElement('canvas')
    sc.width = cols; sc.height = rows
    const sctx = sc.getContext('2d')!
    sctx.drawImage(img, 0, 0, cols, rows)
    const id = sctx.getImageData(0, 0, cols, rows)
    const d = id.data

    ctx.font = `${cellPx}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const off = cellPx / 2

    requestAnimationFrame(() => {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          const rr = d[i]; const gg = d[i + 1]; const bb = d[i + 2]
          const em = closestEmoji(rr, gg, bb, EMOJIS)
          ctx.fillStyle = `rgb(${rr},${gg},${bb})`
          ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx)
          ctx.fillText(em, x * cellPx + off, y * cellPx + off)
        }
      }
    })
  }, [gridSize, cellPx])

  useEffect(() => {
    if (imgSrc) { process() }
  }, [imgSrc, process])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setProcessing(true)
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgSrc(url)
      setProcessing(false)
    }
    img.src = url
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }
    const ext = { png: 'png', jpeg: 'jpg', webp: 'webp' }
    const a = document.createElement('a')
    a.download = `emoji-mosaic.${ext[fmt]}`
    a.href = canvas.toDataURL(mime[fmt])
    a.click()
  }

  return (
    <div style={{ padding: 12 }}>
      <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: 12, fontSize: 13 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          Grid:
          <input type="range" min={10} max={80} value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} style={{ width: 120 }} />
          <span style={{ minWidth: 30, fontVariantNumeric: 'tabular-nums' }}>{gridSize}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          Cell:
          <input type="range" min={6} max={40} value={cellPx} onChange={(e) => setCellPx(Number(e.target.value))} style={{ width: 120 }} />
          <span style={{ minWidth: 30, fontVariantNumeric: 'tabular-nums' }}>{cellPx}px</span>
        </label>
        {imgSrc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select className="settings-select" value={fmt} onChange={(e) => setFmt(e.target.value as any)} style={{ fontSize: 11, padding: '3px 6px' }}>
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download as {fmt.toUpperCase()}</button>
          </div>
        )}
      </div>
      {processing && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Loading image…</div>}
      {!imgSrc && !processing && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upload an image to generate an emoji mosaic.</div>
      )}
      <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', display: 'block' }} />
    </div>
  )
}

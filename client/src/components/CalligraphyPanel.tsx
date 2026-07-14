import { useState, useRef, useCallback, useEffect } from 'react'

interface Point { x: number; y: number }

interface Stroke {
  pts: Point[]
  nibW: number
  nibAngle: number
  color: string
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke | null) {
  if (!s) return
  const { pts, nibW, nibAngle, color } = s
  if (!pts || pts.length < 2) return
  const rad = (nibAngle * Math.PI) / 180
  const cosA = Math.cos(rad) * nibW / 2
  const sinA = Math.sin(rad) * nibW / 2

  ctx.beginPath()
  ctx.moveTo(pts[0].x + cosA, pts[0].y + sinA)
  for (let i = 0; i < pts.length; i++) {
    ctx.lineTo(pts[i].x + cosA, pts[i].y + sinA)
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    ctx.lineTo(pts[i].x - cosA, pts[i].y - sinA)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bg: string, guide: string) {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  if (guide === 'ruled') {
    ctx.strokeStyle = '#d0d0d0'
    ctx.lineWidth = 0.5
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    ctx.strokeStyle = '#ffb0b0'
    ctx.lineWidth = 1
    for (let y = 40; y < h; y += 160) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
  } else if (guide === 'grid') {
    ctx.strokeStyle = '#d0d0d0'
    ctx.lineWidth = 0.5
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
  }
}

export default function CalligraphyPanel() {
  const [color, setColor] = useState('#1a1a2e')
  const [nibW, setNibW] = useState(6)
  const [nibAngle, setNibAngle] = useState(-45)
  const [bg, setBg] = useState('#fef9ef')
  const [guide, setGuide] = useState<string>('ruled')
  const [drawn, setDrawn] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [fmt, setFmt] = useState<'png' | 'jpeg' | 'webp'>('png')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const current = useRef<Stroke | null>(null)

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Use fixed logical canvas
    const cw = 1000; const ch = 1400
    canvas.width = cw; canvas.height = ch
    drawBackground(ctx, cw, ch, bg, guide)
    for (const s of strokes) drawStroke(ctx, s)
    if (current.current) drawStroke(ctx, current.current)
  }, [strokes, bg, guide])

  useEffect(() => { drawAll() }, [drawAll])

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0] || (e as React.TouchEvent).changedTouches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    const me = e as React.MouseEvent
    return { x: (me.clientX - rect.left) * scaleX, y: (me.clientY - rect.top) * scaleY }
  }

  const startStroke = (pos: Point) => {
    drawing.current = true
    current.current = { pts: [pos], nibW, nibAngle, color }
    setDrawn(true)
  }

  const moveStroke = (pos: Point) => {
    if (!drawing.current || !current.current) return
    current.current = { ...current.current, pts: [...current.current.pts, pos] }
    drawAll()
  }

  const endStroke = () => {
    if (!drawing.current || !current.current) return
    setStrokes(s => [...s, current.current!])
    current.current = null
    drawing.current = false
  }

  const handleMouseDown = (e: React.MouseEvent) => { startStroke(getPos(e)) }
  const handleMouseMove = (e: React.MouseEvent) => { moveStroke(getPos(e)) }
  const handleMouseUp = () => { endStroke() }
  const handleTouchStart = (e: React.TouchEvent) => { e.preventDefault(); startStroke(getPos(e)) }
  const handleTouchMove = (e: React.TouchEvent) => { e.preventDefault(); moveStroke(getPos(e)) }
  const handleTouchEnd = (e: React.TouchEvent) => { e.preventDefault(); endStroke() }

  const handleUndo = () => {
    setStrokes(s => s.slice(0, -1))
  }

  const handleClear = () => {
    setStrokes([])
    current.current = null
    setDrawn(false)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }
    const ext = { png: 'png', jpeg: 'jpg', webp: 'webp' }
    const a = document.createElement('a')
    a.download = `calligraphy.${ext[fmt]}`
    a.href = canvas.toDataURL(mime[fmt])
    a.click()
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Ink:
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Nib:
          <input type="range" min={1} max={30} value={nibW} onChange={(e) => setNibW(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ minWidth: 24, fontVariantNumeric: 'tabular-nums' }}>{nibW}px</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Angle:
          <input type="range" min={-90} max={90} value={nibAngle} onChange={(e) => setNibAngle(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ minWidth: 24, fontVariantNumeric: 'tabular-nums' }}>{nibAngle}°</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          BG:
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Guide:
          <select className="settings-select" value={guide} onChange={(e) => setGuide(e.target.value)} style={{ fontSize: 11 }}>
            <option value="none">None</option>
            <option value="ruled">Ruled</option>
            <option value="grid">Grid</option>
          </select>
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleUndo} disabled={strokes.length === 0}>↩ Undo</button>
          <button className="btn btn-secondary btn-sm" onClick={handleClear} disabled={!drawn}>✕ Clear</button>
          {drawn && (
            <>
              <select className="settings-select" value={fmt} onChange={(e) => setFmt(e.target.value as any)} style={{ fontSize: 11, padding: '3px 6px' }}>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download as {fmt.toUpperCase()}</button>
            </>
          )}
        </div>
      </div>

      {!drawn && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Draw with your mouse or stylus to create calligraphy.</div>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxHeight: '80vh', borderRadius: 'var(--radius-sm)', cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  )
}

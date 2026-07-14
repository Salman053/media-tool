import { useState, useCallback, useEffect, useRef } from 'react'

type Effect = 'blur' | 'radial' | 'tilt' | 'pixelate' | 'multi'
type Tab = 'preview' | 'result'

interface FocusPt {
  id: number; x: number; y: number; radius: number
}

const EFFECTS: { id: Effect; label: string; desc: string }[] = [
  { id: 'blur', label: 'Blur', desc: 'Gaussian blur entire image' },
  { id: 'radial', label: 'Radial', desc: 'Single circular focus, drag to position' },
  { id: 'tilt', label: 'Tilt', desc: 'Horizontal focus band, drag to move' },
  { id: 'multi', label: 'Multi Focus', desc: 'Add multiple focus spots by clicking' },
  { id: 'pixelate', label: 'Pixelate', desc: 'Mosaic block effect' },
]

let nextPt = 1

export default function BlurFocusPanel() {
  const [imgSrc, setImgSrc] = useState('')
  const [effect, setEffect] = useState<Effect>('radial')
  const [tab, setTab] = useState<Tab>('preview')
  const [blurRadius, setBlurRadius] = useState(15)
  const [focusRadius, setFocusRadius] = useState(30)
  const [feather, setFeather] = useState(20)
  const [bandHeight, setBandHeight] = useState(30)
  const [bandPos, setBandPos] = useState(50)
  const [blockSize, setBlockSize] = useState(8)
  const [resultUrl, setResultUrl] = useState('')
  const [focusX, setFocusX] = useState(50)
  const [focusY, setFocusY] = useState(50)
  const [pts, setPts] = useState<FocusPt[]>([])
  const [selPt, setSelPt] = useState<number | null>(null)
  const [dragging, setDragging] = useState<'move' | 'add' | null>(null)
  const [invertMulti, setInvertMulti] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const draw = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const maxW = 800; const maxH = 600
    let w = img.naturalWidth; let h = img.naturalHeight
    if (w > maxW || h > maxH) {
      const r = Math.min(maxW / w, maxH / h)
      w = Math.round(w * r); h = Math.round(h * r)
    }
    canvas.width = w; canvas.height = h
    const s = Math.min(w, h)

    ctx.clearRect(0, 0, w, h)

    switch (effect) {
      case 'blur':
        ctx.filter = `blur(${blurRadius}px)`
        ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none'
        break

      case 'radial': {
        ctx.filter = `blur(${blurRadius}px)`
        ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none'
        const tc = document.createElement('canvas'); tc.width = w; tc.height = h
        const tctx = tc.getContext('2d')!
        tctx.drawImage(img, 0, 0, w, h)
        const cx = (focusX / 100) * w; const cy = (focusY / 100) * h
        const innerR = (focusRadius / 100) * s / 2
        const outerR = innerR + (feather / 100) * s / 2
        const g = tctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR)
        g.addColorStop(0, 'white'); g.addColorStop(1, 'transparent')
        tctx.fillStyle = g; tctx.globalCompositeOperation = 'destination-in'; tctx.fillRect(0, 0, w, h)
        ctx.drawImage(tc, 0, 0)
        ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([])
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill()
        break
      }

      case 'tilt': {
        ctx.filter = `blur(${blurRadius}px)`
        ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none'
        const tc = document.createElement('canvas'); tc.width = w; tc.height = h
        const tctx = tc.getContext('2d')!
        tctx.drawImage(img, 0, 0, w, h)
        const bandH = (bandHeight / 100) * h; const bandY = (bandPos / 100) * h - bandH / 2
        const f = (feather / 100) * h
        const denom = bandH + 2 * f || 1
        const lg = tctx.createLinearGradient(0, bandY - f, 0, bandY + bandH + f)
        lg.addColorStop(0, 'transparent'); lg.addColorStop(f / denom, 'white')
        lg.addColorStop((bandH + f) / denom, 'white'); lg.addColorStop(1, 'transparent')
        tctx.fillStyle = lg; tctx.globalCompositeOperation = 'destination-in'; tctx.fillRect(0, 0, w, h)
        ctx.drawImage(tc, 0, 0)
        ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(0, bandY); ctx.lineTo(w, bandY); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, bandY + bandH); ctx.lineTo(w, bandY + bandH); ctx.stroke(); ctx.setLineDash([])
        break
      }

      case 'multi': {
        if (invertMulti) {
          ctx.drawImage(img, 0, 0, w, h)
          if (pts.length > 0) {
            const blurC = document.createElement('canvas'); blurC.width = w; blurC.height = h
            const bctx = blurC.getContext('2d')!
            bctx.filter = `blur(${blurRadius}px)`
            bctx.drawImage(img, 0, 0, w, h); bctx.filter = 'none'
            const maskC = document.createElement('canvas'); maskC.width = w; maskC.height = h
            const mctx = maskC.getContext('2d')!
            for (const pt of pts) {
              const px = (pt.x / 100) * w; const py = (pt.y / 100) * h
              const r = (pt.radius / 100) * s / 2; const fe = r * 0.3
              const g = mctx.createRadialGradient(px, py, 0, px, py, r + fe)
              g.addColorStop(0, 'white'); g.addColorStop(0.7, 'white'); g.addColorStop(1, 'transparent')
              mctx.fillStyle = g; mctx.fillRect(0, 0, w, h)
            }
            bctx.globalCompositeOperation = 'destination-in'; bctx.drawImage(maskC, 0, 0)
            ctx.drawImage(blurC, 0, 0)
          }
        } else {
          ctx.filter = `blur(${blurRadius}px)`
          ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none'
          if (pts.length > 0) {
            const maskC = document.createElement('canvas'); maskC.width = w; maskC.height = h
            const mctx = maskC.getContext('2d')!
            for (const pt of pts) {
              const px = (pt.x / 100) * w; const py = (pt.y / 100) * h
              const r = (pt.radius / 100) * s / 2; const fe = r * 0.3
              const g = mctx.createRadialGradient(px, py, 0, px, py, r + fe)
              g.addColorStop(0, 'white'); g.addColorStop(0.7, 'white'); g.addColorStop(1, 'transparent')
              mctx.fillStyle = g; mctx.fillRect(0, 0, w, h)
            }
            const sharpC = document.createElement('canvas'); sharpC.width = w; sharpC.height = h
            const sctx = sharpC.getContext('2d')!
            sctx.drawImage(img, 0, 0, w, h)
            sctx.globalCompositeOperation = 'destination-in'; sctx.drawImage(maskC, 0, 0)
            ctx.drawImage(sharpC, 0, 0)
          }
        }
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]; const px = (pt.x / 100) * w; const py = (pt.y / 100) * h
          const r = (pt.radius / 100) * s / 2; const isSel = pt.id === selPt
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2)
          ctx.strokeStyle = isSel ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.5)'
          ctx.lineWidth = isSel ? 3 : 2; ctx.setLineDash(isSel ? [] : [4, 3]); ctx.stroke(); ctx.setLineDash([])
          ctx.beginPath(); ctx.arc(px, py, r * 0.1, 0, Math.PI * 2)
          ctx.fillStyle = isSel ? '#6366f1' : 'rgba(255,255,255,0.7)'; ctx.fill()
          ctx.fillStyle = isSel ? '#fff' : 'rgba(255,255,255,0.9)'
          ctx.font = `bold ${Math.max(10, r * 0.35)}px sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(String(i + 1), px, py)
        }
        break
      }

      case 'pixelate': {
        const bs = Math.max(2, blockSize)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0, Math.max(1, Math.round(w / bs)), Math.max(1, Math.round(h / bs)))
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(canvas, 0, 0, Math.round(w / bs), Math.round(h / bs), 0, 0, w, h)
        break
      }
    }
  }, [effect, blurRadius, focusRadius, feather, bandHeight, bandPos, blockSize, focusX, focusY, pts, selPt, invertMulti])

  // load image once
  useEffect(() => {
    if (!imgSrc) return
    setLoaded(false)
    const img = new Image()
    img.onload = () => { imgRef.current = img; setLoaded(true) }
    img.src = imgSrc
  }, [imgSrc])

  // redraw when params or loaded state changes
  useEffect(() => {
    if (loaded) draw()
  }, [loaded, draw])

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }, [])

  // inline handler to avoid ordering issues
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (effect === 'blur' || effect === 'pixelate') return
    const pos = getCanvasPos(e)
    const { w, h } = canvasSize()

    if (effect === 'multi') {
      // check hit against existing points
      const s = Math.min(w, h)
      for (let i = pts.length - 1; i >= 0; i--) {
        const pt = pts[i]
        const cx = (pt.x / 100) * w; const cy = (pt.y / 100) * h
        const r = (pt.radius / 100) * s / 2
        if (Math.hypot(pos.x - cx, pos.y - cy) <= r) {
          setSelPt(pt.id); setDragging('move'); return
        }
      }
      // add new point
      const id = nextPt++
      setPts(p => [...p, { id, x: Math.round((pos.x / w) * 100), y: Math.round((pos.y / h) * 100), radius: 25 }])
      setSelPt(id); setDragging('add')
    } else {
      setDragging('move')
      if (effect === 'radial') {
        setFocusX(Math.round((pos.x / w) * 100)); setFocusY(Math.round((pos.y / h) * 100))
      } else if (effect === 'tilt') {
        setBandPos(Math.round((pos.y / h) * 100))
      }
    }
  }, [effect, getCanvasPos, pts])

  const canvasSize = useCallback(() => {
    const c = canvasRef.current
    return c ? { w: c.width, h: c.height } : { w: 1, h: 1 }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging && e.buttons !== 1) return
    if (effect === 'blur' || effect === 'pixelate') return
    const pos = getCanvasPos(e)
    const { w, h } = canvasSize()
    if (effect === 'radial') {
      setFocusX(Math.round((pos.x / w) * 100)); setFocusY(Math.round((pos.y / h) * 100))
    } else if (effect === 'tilt') {
      setBandPos(Math.round((pos.y / h) * 100))
    } else if (effect === 'multi' && dragging === 'move' && selPt !== null) {
      setPts(p => p.map(pt => pt.id === selPt ? { ...pt, x: Math.round((pos.x / w) * 100), y: Math.round((pos.y / h) * 100) } : pt))
    }
  }, [dragging, effect, getCanvasPos, canvasSize, selPt])

  const onMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      if (effect !== 'multi' || selPt === null) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setPts(p => p.filter(pt => pt.id !== selPt)); setSelPt(null)
      }
    }
    window.addEventListener('keydown', cb)
    return () => window.removeEventListener('keydown', cb)
  }, [effect, selPt])

  const apply = useCallback(() => {
    if (!canvasRef.current) return
    setTab('result'); setResultUrl(canvasRef.current.toDataURL('image/png'))
  }, [])

  const reset = useCallback(() => {
    setImgSrc(''); setResultUrl(''); setTab('preview')
    setFocusX(50); setFocusY(50); setBandPos(50)
    setPts([]); setSelPt(null); imgRef.current = null; setLoaded(false)
  }, [])

  const selPoint = pts.find(p => p.id === selPt)

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        Apply blur, focus, tilt-shift, or pixelate. In <strong>Multi</strong> mode, toggle between adding sharp focus spots or blur spots.
      </div>

      {!imgSrc ? (
        <div style={{ marginBottom: 12 }}>
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setImgSrc(URL.createObjectURL(f))
          }} style={{ fontSize: 12 }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={reset}>Choose Different Image</button>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
            {EFFECTS.map(ef => (
              <button key={ef.id} className={`btn btn-sm ${effect === ef.id ? 'btn-primary' : ''}`}
                onClick={() => { setEffect(ef.id); setTab('preview') }} title={ef.desc}>{ef.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10, alignItems: 'start' }}>
            <Slider label="Blur" value={blurRadius} min={1} max={50} onChange={setBlurRadius} />
            {effect === 'radial' && (
              <><Slider label="Size" value={focusRadius} min={5} max={95} onChange={setFocusRadius} /><Slider label="Feather" value={feather} min={0} max={50} onChange={setFeather} /></>
            )}
            {effect === 'tilt' && (
              <><Slider label="Height" value={bandHeight} min={5} max={80} onChange={setBandHeight} /><Slider label="Feather" value={feather} min={1} max={40} onChange={setFeather} /></>
            )}
            {effect === 'multi' && selPoint && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Slider label={`#${pts.indexOf(selPoint) + 1} Size`} value={selPoint.radius} min={5} max={80} onChange={(v) => setPts(p => p.map(pt => pt.id === selPt ? { ...pt, radius: v } : pt))} />
                <button className="btn btn-danger btn-sm" onClick={() => { setPts(p => p.filter(pt => pt.id !== selPt)); setSelPt(null) }}>✕</button>
              </div>
            )}
            {effect === 'multi' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mode:</span>
                <button className={`btn btn-sm ${invertMulti ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setInvertMulti(false)}>Focus</button>
                <button className={`btn btn-sm ${invertMulti ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInvertMulti(true)}>Blur</button>
              </div>
            )}
            {effect === 'pixelate' && <Slider label="Blocks" value={blockSize} min={2} max={40} onChange={setBlockSize} />}
          </div>

          {effect === 'multi' && pts.length > 0 && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              {pts.length} point{pts.length > 1 ? 's' : ''} · Click to {invertMulti ? 'blur' : 'focus'} · Click to select · Drag to move · <kbd>Delete</kbd> to remove
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {tab === 'preview' ? (
              <button className="btn btn-primary btn-sm" onClick={apply}>Apply & View Result</button>
            ) : (
              <><button className="btn btn-sm" style={{ background: 'var(--primary)', color: '#fff' }} onClick={() => { setTab('preview') }}>Back to Adjust</button>
                <a className="btn btn-success btn-sm" href={resultUrl} download={`${effect}.png`}>Download PNG</a></>
            )}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', padding: tab === 'result' && resultUrl ? 0 : 12,
            background: tab === 'preview' ? 'var(--surface)' : undefined, borderRadius: 'var(--radius-sm)',
          }}>
            {tab === 'preview' ? (
              <canvas ref={canvasRef}
                style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', cursor: effect === 'radial' || effect === 'tilt' || effect === 'multi' ? 'crosshair' : 'default' }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              />
            ) : (resultUrl && <img src={resultUrl} alt="Result" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)' }} />)}
          </div>
        </>
      )}
    </div>
  )
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="settings-group">
      <span className="settings-label">{label}:</span>
      <input type="range" className="settings-range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <span className="settings-value">{value}</span>
    </div>
  )
}

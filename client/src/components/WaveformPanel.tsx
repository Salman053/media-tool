import { useState, useRef, useCallback, useEffect } from 'react'

function downsample(data: Float32Array, n: number): number[] {
  const block = Math.floor(data.length / n)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    let max = 0
    for (let j = 0; j < block; j++) {
      const abs = Math.abs(data[i * block + j])
      if (abs > max) max = abs
    }
    out.push(max)
  }
  return out
}

export default function WaveformPanel() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [waveform, setWaveform] = useState<number[] | null>(null)
  const [err, setErr] = useState('')
  const [samples, setSamples] = useState(120)
  const [barWidth, setBarWidth] = useState(3)
  const [barGap, setBarGap] = useState(1)
  const [height, setHeight] = useState(250)
  const [waveColor, setWaveColor] = useState('#6366f1')
  const [bgColor, setBgColor] = useState('#1a1a2e')
  const [style, setStyle] = useState<'bars' | 'mirrored' | 'filled'>('bars')
  const [fmt, setFmt] = useState<'png' | 'jpeg' | 'webp'>('png')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveform || waveform.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const totalW = waveform.length * (barWidth + barGap) - barGap
    canvas.width = totalW
    canvas.height = height

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, totalW, height)

    const mid = height / 2
    ctx.fillStyle = waveColor

    if (style === 'filled') {
      ctx.beginPath()
      ctx.moveTo(0, mid)
      for (let i = 0; i < waveform.length; i++) {
        const x = i * (barWidth + barGap) + barWidth / 2
        const val = waveform[i] * mid * 0.95
        ctx.lineTo(x, mid - val)
      }
      ctx.lineTo((waveform.length - 1) * (barWidth + barGap) + barWidth / 2, mid)
      ctx.closePath()
      ctx.fill()
    } else {
      for (let i = 0; i < waveform.length; i++) {
        const x = i * (barWidth + barGap)
        const val = Math.max(1, waveform[i] * mid * 0.95)
        if (style === 'mirrored') {
          ctx.fillRect(x, mid - val, barWidth, val * 2)
        } else {
          ctx.fillRect(x, height - val, barWidth, val)
        }
      }
    }
  }, [waveform, samples, barWidth, barGap, height, waveColor, bgColor, style])

  useEffect(() => {
    render()
  }, [render])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setErr('')
    setWaveform(null)
    if (audioSrc) URL.revokeObjectURL(audioSrc)
    setAudioSrc(URL.createObjectURL(f))
  }

  useEffect(() => {
    if (!audioSrc) return
    let cancelled = false
    ;(async () => {
      try {
        const ac = new AudioContext()
        const resp = await fetch(audioSrc)
        const ab = await resp.arrayBuffer()
        const buf = await ac.decodeAudioData(ab)
        if (cancelled) return
        const ch = buf.getChannelData(0)
        setWaveform(downsample(ch, samples))
      } catch (ex: any) {
        if (!cancelled) setErr(ex.message || 'Failed to decode audio')
      }
    })()
    return () => { cancelled = true }
  }, [audioSrc, samples])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }
    const ext = { png: 'png', jpeg: 'jpg', webp: 'webp' }
    const a = document.createElement('a')
    a.download = `waveform.${ext[fmt]}`
    a.href = canvas.toDataURL(mime[fmt])
    a.click()
  }

  return (
    <div style={{ padding: 12 }}>
      <input type="file" accept="audio/*" onChange={handleFile} style={{ marginBottom: 12, fontSize: 13 }} />
      {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Samples:
          <input type="range" min={20} max={400} value={samples} onChange={(e) => setSamples(Number(e.target.value))} style={{ width: 100 }} />
          <span style={{ minWidth: 30, fontVariantNumeric: 'tabular-nums' }}>{samples}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Width:
          <input type="range" min={1} max={12} value={barWidth} onChange={(e) => setBarWidth(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ minWidth: 20 }}>{barWidth}px</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Gap:
          <input type="range" min={0} max={8} value={barGap} onChange={(e) => setBarGap(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ minWidth: 16 }}>{barGap}px</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Height:
          <input type="range" min={80} max={500} value={height} onChange={(e) => setHeight(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ minWidth: 30 }}>{height}px</span>
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Style:
          <select className="settings-select" value={style} onChange={(e) => setStyle(e.target.value as any)} style={{ fontSize: 11 }}>
            <option value="bars">Bars</option>
            <option value="mirrored">Mirrored</option>
            <option value="filled">Filled</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          Wave:
          <input type="color" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          BG:
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }} />
        </label>
        {waveform && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <select className="settings-select" value={fmt} onChange={(e) => setFmt(e.target.value as any)} style={{ fontSize: 11, padding: '3px 6px' }}>
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download as {fmt.toUpperCase()}</button>
          </div>
        )}
      </div>

      {!audioSrc && !err && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upload an audio file to generate a waveform.</div>
      )}
      <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', display: 'block' }} />
    </div>
  )
}

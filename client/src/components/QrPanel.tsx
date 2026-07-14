import { useState, useRef, useCallback, useEffect } from 'react'
import QRCodeLib from 'qrcode'
import { decodeQrImage, generateQrWithLogo } from '../api'

export default function QrPanel() {
  const [tab, setTab] = useState<'generate' | 'decode'>('generate')
  const [text, setText] = useState('')
  const [label, setLabel] = useState('')
  const [dataUrl, setDataUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [generating, setGenerating] = useState(false)
  const [decodeResult, setDecodeResult] = useState('')
  const [decodeError, setDecodeError] = useState('')
  const [decoding, setDecoding] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!dataUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = dataUrl
  }, [dataUrl])

  const generate = useCallback(async () => {
    if (!text.trim()) return
    setGenerating(true)
    setDataUrl('')
    try {
      const url = logoFile
        ? URL.createObjectURL(await generateQrWithLogo(text.trim(), logoFile))
        : await QRCodeLib.toDataURL(text.trim(), { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      setDataUrl(url)
    } catch {
      setDataUrl('')
    } finally {
      setGenerating(false)
    }
  }, [text, logoFile])

  const handleDecode = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDecoding(true)
    setDecodeError('')
    setDecodeResult('')
    try {
      const resp = await decodeQrImage(file)
      setDecodeResult(resp.text)
    } catch (err) {
      setDecodeError((err as Error).message)
    } finally {
      setDecoding(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [])

  const download = useCallback(() => {
    const c = canvasRef.current
    if (c) {
      const a = document.createElement('a')
      a.download = 'qr-code.png'
      a.href = c.toDataURL('image/png')
      a.click()
    }
  }, [])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn ${tab === 'generate' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab('generate')}>Generate</button>
        <button className={`btn ${tab === 'decode' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab('decode')}>Decode</button>
      </div>

      {tab === 'generate' ? (
        <>
          <textarea
            placeholder="Enter text or URL to encode..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{
              width: '100%', padding: 10, border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'monospace',
              resize: 'vertical', background: 'var(--surface)', color: 'var(--text)',
              outline: 'none', lineHeight: 1.6,
            }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => logoRef.current?.click()}>
              {logoFile ? 'Change Logo' : 'Add Logo'}
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
            {logoFile && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{logoFile.name}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => { setLogoFile(null); if (logoRef.current) logoRef.current.value = '' }}>
                  Remove Logo
                </button>
              </>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              placeholder="Label text (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 12, background: 'var(--surface)',
                color: 'var(--text)', outline: 'none',
              }}
            />
          </div>
          <button className="btn btn-primary btn-action" style={{ marginTop: 10 }} disabled={!text.trim() || generating} onClick={generate}>
            {generating ? <><span className="spinner" /> Generating...</> : 'Generate QR Code'}
          </button>
          {dataUrl && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <img src={dataUrl} alt="QR Code" style={{ maxWidth: 240, borderRadius: 'var(--radius-sm)' }} />
              {label && (
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
              )}
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={download}>Download PNG</button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            Upload an image containing a QR code to decode it.
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleDecode}
            style={{ fontSize: 12 }}
            disabled={decoding}
          />
          {decoding && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--primary)' }}>Decoding...</div>}
          {decodeResult && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Decoded Text:</div>
              <div style={{
                padding: 10, background: 'var(--primary-light)',
                borderRadius: 'var(--radius-sm)', fontSize: 12,
                fontFamily: 'monospace', wordBreak: 'break-all',
              }}>
                {decodeResult}
              </div>
            </div>
          )}
          {decodeError && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--error)' }}>{decodeError}</div>
          )}
        </>
      )}
    </div>
  )
}

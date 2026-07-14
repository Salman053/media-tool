export interface DeviceDef {
  id: string; label: string
  w: number; h: number
  sx: number; sy: number; sw: number; sh: number
  sr: number; br: number
  color: 'dark' | 'silver'
  drawDetails(ctx: CanvasRenderingContext2D, w: number, h: number, sx: number, sy: number, sw: number, sh: number, s: number): void
}

const COLORS: Record<string, { body: string[]; edge: string; shadow: string; bezel: string; screenEdge: string; btn: string }> = {
  dark: {
    body: ['#2c2c3e', '#16161f', '#222236', '#2a2a3a'],
    edge: 'rgba(255,255,255,0.07)',
    shadow: 'rgba(0,0,0,0.35)',
    bezel: '#0c0c14',
    screenEdge: 'rgba(255,255,255,0.06)',
    btn: '#2e2e40',
  },
  silver: {
    body: ['#d8d8e0', '#b0b0bc', '#c8c8d4', '#e0e0e8'],
    edge: 'rgba(255,255,255,0.25)',
    shadow: 'rgba(0,0,0,0.2)',
    bezel: '#0e0e0e',
    screenEdge: 'rgba(255,255,255,0.02)',
    btn: '#a0a0aa',
  },
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export function drawMockup(
  ctx: CanvasRenderingContext2D,
  dev: DeviceDef,
  image: HTMLImageElement,
  background: string,
  pad: number,
  s: number,
) {
  const w = dev.w * s; const h = dev.h * s
  const sx = dev.sx * s; const sy = dev.sy * s
  const sw = dev.sw * s; const sh = dev.sh * s
  const sr = dev.sr * s; const br = dev.br * s
  const c = COLORS[dev.color]
  const cw = w + pad * 2; const ch = h + pad * 2
  const ox = pad; const oy = pad

  ctx.clearRect(0, 0, cw, ch)

  // background
  if (background !== 'none') {
    if (background === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, cw, ch)
      g.addColorStop(0, '#6366f1'); g.addColorStop(1, '#8b5cf6')
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = background
    }
    ctx.fillRect(0, 0, cw, ch)
  }

  // multi-layer drop shadow
  ctx.save()
  ctx.shadowColor = c.shadow
  ctx.shadowBlur = h * 0.06; ctx.shadowOffsetY = h * 0.02
  rr(ctx, ox, oy, w, h, br); ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill()
  ctx.shadowBlur = h * 0.1; ctx.shadowOffsetY = h * 0.04
  rr(ctx, ox, oy, w, h, br); ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill()
  ctx.restore()

  // body gradient
  const gBody = ctx.createLinearGradient(ox, oy, ox + w, oy + h)
  gBody.addColorStop(0, c.body[0]); gBody.addColorStop(0.25, c.body[1])
  gBody.addColorStop(0.6, c.body[2]); gBody.addColorStop(1, c.body[3])
  rr(ctx, ox, oy, w, h, br); ctx.fillStyle = gBody; ctx.fill()

  // inner dark bevel
  rr(ctx, ox + 0.5, oy + 0.5, w - 1, h - 1, br - 0.5)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke()

  // edge highlight
  ctx.save()
  rr(ctx, ox + 1.5, oy + 1.5, w - 3, h - 3, br - 1.5)
  ctx.strokeStyle = c.edge; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()

  // screen bezel
  rr(ctx, ox + sx - 2, oy + sy - 2, sw + 4, sh + 4, sr + 2)
  ctx.fillStyle = c.bezel; ctx.fill()

  // screen border highlight
  rr(ctx, ox + sx, oy + sy, sw, sh, sr)
  ctx.strokeStyle = c.screenEdge; ctx.lineWidth = 1; ctx.stroke()

  // screenshot clipped to screen area
  ctx.save()
  rr(ctx, ox + sx, oy + sy, sw, sh, sr)
  ctx.clip()
  ctx.drawImage(image, ox + sx, oy + sy, sw, sh)
  ctx.restore()

  // screen glare
  const gGlare = ctx.createLinearGradient(ox + sx, oy + sy, ox + sx + sw, oy + sy + sh)
  gGlare.addColorStop(0, 'rgba(255,255,255,0.08)')
  gGlare.addColorStop(0.3, 'rgba(255,255,255,0)')
  gGlare.addColorStop(0.7, 'rgba(255,255,255,0)')
  gGlare.addColorStop(1, 'rgba(255,255,255,0.03)')
  rr(ctx, ox + sx, oy + sy, sw, sh, sr)
  ctx.fillStyle = gGlare; ctx.fill()

  // device details (notch, buttons, etc.)
  dev.drawDetails(ctx, w, h, sx, sy, sw, sh, s)
}

export function renderToCanvas(dev: DeviceDef, image: HTMLImageElement, background: string): Promise<Blob | null> {
  const s = dev.w > 600 ? 1 : 2
  const pad = background !== 'none' ? Math.round(dev.w * 0.06 * s) : 0
  const cw = dev.w * s + pad * 2; const ch = dev.h * s + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d')!
  drawMockup(ctx, dev, image, background, pad, s)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

export const DEVICES: DeviceDef[] = [
  {
    id: 'iphone', label: 'iPhone 15 Pro', w: 393, h: 852,
    sx: 28, sy: 100, sw: 337, sh: 678, sr: 42, br: 56, color: 'dark',
    drawDetails(ctx, w, h, _sx, sy, _sw, _sh, s) {
      const diw = 108 * s; const dih = 26 * s
      ctx.fillStyle = '#08080e'
      rr(ctx, (w - diw) / 2, sy + 6 * s, diw, dih, dih / 2); ctx.fill()
      ctx.fillStyle = '#2e2e40'
      ctx.fillRect(0, 0.24 * h, 3 * s, 30 * s)
      ctx.fillRect(0, 0.24 * h + 40 * s, 3 * s, 45 * s)
      ctx.fillRect(w - 3 * s, 0.27 * h, 3 * s, 50 * s)
    },
  },
  {
    id: 'iphone-max', label: 'iPhone 15 Pro Max', w: 430, h: 932,
    sx: 30, sy: 110, sw: 370, sh: 742, sr: 46, br: 61, color: 'dark',
    drawDetails(ctx, w, h, _sx, sy, _sw, _sh, s) {
      const diw = 116 * s; const dih = 26 * s
      ctx.fillStyle = '#08080e'
      rr(ctx, (w - diw) / 2, sy + 6 * s, diw, dih, dih / 2); ctx.fill()
      ctx.fillStyle = '#2e2e40'
      ctx.fillRect(0, 0.24 * h, 3 * s, 30 * s)
      ctx.fillRect(0, 0.24 * h + 40 * s, 3 * s, 45 * s)
      ctx.fillRect(w - 3 * s, 0.27 * h, 3 * s, 50 * s)
      ctx.beginPath(); ctx.arc(w - 38 * s, 42 * s, 7 * s, 0, Math.PI * 2)
      ctx.fillStyle = '#1a1a2e'; ctx.fill()
      ctx.strokeStyle = '#2e2e40'; ctx.lineWidth = 0.5 * s; ctx.stroke()
    },
  },
  {
    id: 'galaxy', label: 'Galaxy S24', w: 393, h: 846,
    sx: 24, sy: 95, sw: 345, sh: 685, sr: 38, br: 52, color: 'dark',
    drawDetails(ctx, w, h, _sx, sy, _sw, _sh, s) {
      ctx.beginPath(); ctx.arc(w / 2, sy + 16 * s, 5 * s, 0, Math.PI * 2)
      ctx.fillStyle = '#08080e'; ctx.fill()
      ctx.fillStyle = '#2e2e40'
      ctx.fillRect(0, 0.24 * h, 3 * s, 28 * s)
      ctx.fillRect(0, 0.24 * h + 38 * s, 3 * s, 42 * s)
      ctx.fillRect(w - 3 * s, 0.26 * h, 3 * s, 48 * s)
      ctx.fillRect(w - 3 * s, 0.26 * h + 58 * s, 3 * s, 20 * s)
    },
  },
  {
    id: 'ipad', label: 'iPad Pro 13″', w: 620, h: 860,
    sx: 38, sy: 58, sw: 544, sh: 726, sr: 22, br: 28, color: 'silver',
    drawDetails(ctx, w, h, _sx, _sy, _sw, _sh, s) {
      ctx.fillStyle = '#a0a0aa'
      ctx.beginPath(); ctx.arc(w / 2, h - 20 * s, 3 * s, 0, Math.PI * 2); ctx.fill()
      ctx.fillRect(w - 2 * s, 0.25 * h, 2 * s, 40 * s)
      ctx.fillRect(0, 0.25 * h, 2 * s, 40 * s)
    },
  },
  {
    id: 'macbook', label: 'MacBook Pro 16″', w: 920, h: 600,
    sx: 44, sy: 36, sw: 832, sh: 520, sr: 5, br: 10, color: 'silver',
    drawDetails(ctx, w, h, _sx, _sy, _sw, _sh, s) {
      ctx.fillStyle = '#b0b0ba'
      rr(ctx, 0, h - 10 * s, w, 10 * s, 4 * s); ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      rr(ctx, (w - 220 * s) / 2, h - 10 * s, 220 * s, 10 * s, 4 * s); ctx.fill()
      ctx.fillStyle = '#3a3a4a'
      rr(ctx, (w - 80 * s) / 2, h - 13 * s, 80 * s, 6 * s, 3 * s); ctx.fill()
    },
  },
]

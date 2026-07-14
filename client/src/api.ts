import type { UploadResponse, ProcessResponse, ResizeSettings, EffectSettings, ThumbnailSettings, VideoConvertSettings, FrameSettings, DocConvertSettings, RenameRequest } from './types'

const API = '/api'

export async function uploadFiles(files: FileList | File[]): Promise<UploadResponse> {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

export async function convertFiles(sessionId: string, format: string, quality: number): Promise<ProcessResponse> {
  const res = await fetch(`${API}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, format, quality }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Conversion failed')
  }
  return res.json()
}

export async function resizeFiles(sessionId: string, settings: ResizeSettings): Promise<ProcessResponse> {
  const res = await fetch(`${API}/resize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      width: settings.width ? Number(settings.width) : undefined,
      height: settings.height ? Number(settings.height) : undefined,
      fit: settings.fit,
      format: settings.format,
      quality: settings.quality,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Resize failed')
  }
  return res.json()
}

export async function effectsFiles(sessionId: string, settings: EffectSettings): Promise<ProcessResponse> {
  const res = await fetch(`${API}/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...settings }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Effect failed')
  }
  return res.json()
}

export async function thumbnailFiles(sessionId: string, settings: ThumbnailSettings): Promise<ProcessResponse> {
  const res = await fetch(`${API}/thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...settings }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Thumbnail failed')
  }
  return res.json()
}

export function getDownloadUrl(sessionId: string, filename: string): string {
  return `${API}/download/${sessionId}/${encodeURIComponent(filename)}`
}

export function getDownloadAllUrl(sessionId: string): string {
  return `${API}/download-all/${sessionId}`
}

export async function videoConvertFiles(sessionId: string, settings: VideoConvertSettings): Promise<ProcessResponse> {
  const res = await fetch(`${API}/video/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      format: settings.format || undefined,
      videoCodec: settings.videoCodec || undefined,
      audioCodec: settings.audioCodec || undefined,
      bitrate: settings.bitrate || undefined,
      fps: settings.fps ? Number(settings.fps) : undefined,
      resolution: settings.resolution || undefined,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Video conversion failed')
  }
  return res.json()
}

export async function renameFiles(req: RenameRequest): Promise<ProcessResponse> {
  const res = await fetch(`${API}/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Rename failed')
  }
  return res.json()
}

export async function docConvertFiles(sessionId: string, settings: DocConvertSettings): Promise<ProcessResponse> {
  const res = await fetch(`${API}/document/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, format: settings.format }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Document conversion failed')
  }
  return res.json()
}

export async function videoFrameFiles(sessionId: string, settings: FrameSettings): Promise<ProcessResponse> {
  const res = await fetch(`${API}/video/frames`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      fps: settings.fps ? Number(settings.fps) : undefined,
      count: settings.count ? Number(settings.count) : undefined,
      quality: settings.quality,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Frame extraction failed')
  }
  return res.json()
}

export async function decodeQrImage(file: File): Promise<{ text: string }> {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API}/qr/decode`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Decode failed')
  }
  return res.json()
}

export async function generateQrWithLogo(text: string, logo?: File): Promise<Blob> {
  const form = new FormData()
  form.append('text', text)
  if (logo) form.append('logo', logo)
  const res = await fetch(`${API}/qr/generate`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Generation failed')
  }
  return res.blob()
}

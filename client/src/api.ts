import type { UploadResponse, ConvertResponse } from './types'

const API = '/api'

export async function uploadFiles(files: FileList | File[]): Promise<UploadResponse> {
  const form = new FormData()
  for (const file of files) {
    form.append('files', file)
  }

  const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

export async function convertFiles(
  sessionId: string,
  format: string,
  quality: number,
): Promise<ConvertResponse> {
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

export function getDownloadUrl(sessionId: string, filename: string): string {
  return `${API}/download/${sessionId}/${encodeURIComponent(filename)}`
}

export function getDownloadAllUrl(sessionId: string): string {
  return `${API}/download-all/${sessionId}`
}

export type ToolMode = 'convert' | 'resize' | 'effects' | 'thumbnail' | 'video-convert' | 'video-frames' | 'document' | 'launcher' | 'rename' | 'qr' | 'regex'

export interface RenameEntry {
  originalName: string
  newName: string
}

export interface RenameRequest {
  sessionId: string
  files: RenameEntry[]
}

export interface LauncherEntry {
  id: string
  name: string
  url: string
}

export interface UploadedFile {
  id: string
  originalName: string
  size: number
  previewUrl: string
  status: 'pending' | 'converting' | 'done' | 'error'
  result?: ProcessResult
}

export interface ProcessResult {
  success: boolean
  inputPath: string
  outputPath: string
  inputSize?: number
  outputSize?: number
  duration?: number
  error?: string
  originalName: string
  outputName: string
  downloadUrl: string
}

export interface UploadResponse {
  sessionId: string
  files: Array<{ id: string; originalName: string; size: number }>
}

export interface ProcessResponse {
  sessionId: string
  results: ProcessResult[]
}

export interface ResizeSettings {
  width: string
  height: string
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  format: string
  quality: number
}

export interface EffectSettings {
  effect: string
  radius: number
  sigma: number
  amount: number
}

export interface ThumbnailSettings {
  size: number
  quality: number
}

export interface EffectOption {
  id: string
  label: string
  description: string
}

export interface DocConvertSettings {
  format: string
}

export interface LauncherSettings {
  entries: LauncherEntry[]
  presetName: string
}

export const DEFAULT_LAUNCHER_PRESETS: Record<string, LauncherEntry[]> = {
  'Dev Setup': [
    { id: '1', name: 'Dev Server', url: 'http://localhost:5173' },
    { id: '2', name: 'API Server', url: 'http://localhost:3099' },
    { id: '3', name: 'GitHub', url: 'https://github.com' },
  ],
}

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'avif', 'svg']
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'm4v', 'mpg', 'mpeg', '3gp', 'ogv']
export const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'doc', 'odt', 'txt', 'html', 'htm', 'rtf', 'epub', 'xlsx', 'xls', 'ods', 'pptx', 'ppt', 'odp', 'csv']

export interface VideoConvertSettings {
  format: string
  videoCodec: string
  audioCodec: string
  bitrate: string
  fps: string
  resolution: string
}

export interface FrameSettings {
  fps: string
  count: string
  quality: number
}

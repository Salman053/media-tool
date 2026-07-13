export interface UploadedFile {
  id: string
  originalName: string
  size: number
  previewUrl: string
  status: 'pending' | 'converting' | 'done' | 'error'
  result?: ConvertResult
}

export interface ConvertResult {
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

export interface ConvertResponse {
  sessionId: string
  results: ConvertResult[]
}

export interface StatusResponse {
  sessionId: string
  totalFiles: number
  convertedFiles: number
  completed: boolean
}

export type MediaType = 'image' | 'video' | 'audio' | 'document'

export type ConvertOptions = Record<string, unknown>

export interface FormatConverter<T extends ConvertOptions = ConvertOptions> {
  name: string
  from: string[]
  to: string
  convert(input: string, output: string, options?: T): Promise<ConvertResult>
}

export interface ConvertResult {
  success: boolean
  inputPath: string
  outputPath: string
  inputSize?: number
  outputSize?: number
  duration?: number
  error?: string
}

export interface Processor {
  type: MediaType
  registerFormat(converter: FormatConverter): void
  convert(input: string, targetFormat: string, output?: string, options?: ConvertOptions): Promise<ConvertResult>
}

export interface ImageOperation<T = Record<string, unknown>> {
  name: string
  type: MediaType
  execute(input: string, output: string, options: T): Promise<ConvertResult>
}

export interface ResizeOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  position?: string
  withoutEnlargement?: boolean
  format?: string
  quality?: number
}

export interface Command {
  name: string
  description: string
  run(args: string[]): Promise<void>
}

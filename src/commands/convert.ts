import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'
import { processorRegistry } from '../processors/registry'
import type { MediaType } from '../types'

interface ConvertArgs {
  input: string
  output?: string
  format?: string
  quality?: number
}

export function parseArgs(args: string[]): ConvertArgs {
  const parsed: ConvertArgs = { input: '' }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        parsed.output = args[++i]
        break
      case '-f':
      case '--format':
        parsed.format = args[++i]
        break
      case '-q':
      case '--quality':
        parsed.quality = Number.parseInt(args[++i], 10)
        break
      default:
        if (!parsed.input) {
          parsed.input = args[i]
        }
    }
  }

  return parsed
}

commandRegistry.register({
  name: 'convert',
  description: 'Convert media files between formats',
  async run(args: string[]) {
    const { input, output, format, quality } = parseArgs(args)

    if (!input) {
      console.error('error: input file is required')
      process.exit(1)
    }

    if (!fs.existsSync(input)) {
      console.error(`error: input file not found: ${input}`)
      process.exit(1)
    }

    const ext = path.extname(input).toLowerCase().replace('.', '')
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'avif', 'svg']

    let mediaType: MediaType = 'image'
    if (!imageExts.includes(ext)) {
      console.error(`error: unsupported file type: .${ext}`)
      process.exit(1)
    }

    const processor = processorRegistry.get(mediaType)
    if (!processor) {
      console.error('error: no processor found for the given media type')
      process.exit(1)
    }

    const targetFormat = format ?? 'webp'
    const result = await processor.convert(input, targetFormat, output, quality ? { quality } : undefined)

    if (result.success) {
      console.log(`converted: ${result.inputPath} -> ${result.outputPath}`)
      if (result.inputSize && result.outputSize) {
        const ratio = ((1 - result.outputSize / result.inputSize) * 100).toFixed(1)
        console.log(`  size: ${formatSize(result.inputSize)} -> ${formatSize(result.outputSize)} (${ratio}% smaller)`)
      }
      if (result.duration !== undefined) {
        console.log(`  time: ${result.duration}ms`)
      }
    } else {
      console.error(`error: ${result.error}`)
      process.exit(1)
    }
  },
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

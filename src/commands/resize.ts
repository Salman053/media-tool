import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'
import { ResizeOperation } from '../operations/image/resize'
import type { ResizeOptions } from '../types'

interface ResizeCliArgs {
  input: string
  output?: string
  width?: number
  height?: number
  fit?: string
  format?: string
  quality?: number
  noEnlarge?: boolean
}

export function parseResizeArgs(args: string[]): ResizeCliArgs {
  const parsed: ResizeCliArgs = { input: '' }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        parsed.output = args[++i]
        break
      case '-w':
      case '--width':
        parsed.width = Number.parseInt(args[++i], 10)
        break
      case '-h':
      case '--height':
        parsed.height = Number.parseInt(args[++i], 10)
        break
      case '--fit':
        parsed.fit = args[++i]
        break
      case '-f':
      case '--format':
        parsed.format = args[++i]
        break
      case '-q':
      case '--quality':
        parsed.quality = Number.parseInt(args[++i], 10)
        break
      case '--no-enlarge':
        parsed.noEnlarge = true
        break
      default:
        if (!parsed.input) {
          parsed.input = args[i]
        }
    }
  }

  return parsed
}

const VALID_FITS = ['cover', 'contain', 'fill', 'inside', 'outside']

commandRegistry.register({
  name: 'resize',
  description: 'Resize images to specific dimensions',
  async run(args: string[]) {
    const cli = parseResizeArgs(args)

    if (!cli.input) {
      console.error('error: input file is required')
      process.exit(1)
    }

    if (!fs.existsSync(cli.input)) {
      console.error(`error: input file not found: ${cli.input}`)
      process.exit(1)
    }

    if (!cli.width && !cli.height) {
      console.error('error: at least one of --width or --height is required')
      process.exit(1)
    }

    if (cli.fit && !VALID_FITS.includes(cli.fit)) {
      console.error(`error: invalid fit "${cli.fit}". Valid values: ${VALID_FITS.join(', ')}`)
      process.exit(1)
    }

    const output = cli.output ?? defaultResizeOutput(cli.input, cli.format)
    const operation = new ResizeOperation()

    const options: ResizeOptions = {
      width: cli.width,
      height: cli.height,
      fit: cli.fit as ResizeOptions['fit'],
      withoutEnlargement: cli.noEnlarge,
      format: cli.format,
      quality: cli.quality,
    }

    const result = await operation.execute(cli.input, output, options)

    if (result.success) {
      console.log(`resized: ${result.inputPath} -> ${result.outputPath}`)
      if (result.inputSize && result.outputSize) {
        console.log(`  size: ${formatSize(result.inputSize)} -> ${formatSize(result.outputSize)}`)
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

function defaultResizeOutput(input: string, targetFormat?: string): string {
  const parsed = path.parse(input)
  const ext = targetFormat ?? parsed.ext.replace('.', '')
  return path.join(parsed.dir, `${parsed.name}-resized.${ext}`)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

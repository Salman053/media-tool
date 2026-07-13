import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'
import { ThumbnailOperation } from '../operations/image/thumbnail'
import { isAvailable } from '../engines/imagemagick'

interface ThumbnailCliArgs {
  input: string
  output?: string
  size: number
  quality?: number
}

export function parseThumbnailArgs(args: string[]): ThumbnailCliArgs {
  const parsed: ThumbnailCliArgs = { input: '', size: 150 }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        parsed.output = args[++i]
        break
      case '-s':
      case '--size':
        parsed.size = Number.parseInt(args[++i], 10)
        break
      case '-q':
      case '--quality':
        parsed.quality = Number.parseInt(args[++i], 10)
        break
      default:
        if (!parsed.input) parsed.input = args[i]
    }
  }

  return parsed
}

commandRegistry.register({
  name: 'thumbnail',
  description: 'Generate square thumbnails from images (requires ImageMagick)',
  async run(args: string[]) {
    const cli = parseThumbnailArgs(args)

    if (!cli.input) {
      console.error('error: input file is required')
      process.exit(1)
    }

    if (!fs.existsSync(cli.input)) {
      console.error(`error: input file not found: ${cli.input}`)
      process.exit(1)
    }

    if (!(await isAvailable())) {
      console.error('error: ImageMagick is not installed. Install from https://imagemagick.org')
      process.exit(1)
    }

    const output = cli.output ?? path.join(path.dirname(cli.input), `${path.parse(cli.input).name}-thumb${path.extname(cli.input)}`)
    const operation = new ThumbnailOperation()

    const result = await operation.execute(cli.input, output, { size: cli.size, quality: cli.quality })

    if (result.success) {
      console.log(`thumbnail: ${result.inputPath} -> ${result.outputPath}`)
      console.log(`  size: ${cli.size}x${cli.size}`)
      if (result.duration !== undefined) {
        console.log(`  time: ${result.duration}ms`)
      }
    } else {
      console.error(`error: ${result.error}`)
      process.exit(1)
    }
  },
})

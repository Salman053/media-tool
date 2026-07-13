import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { ImageOperation, ConvertResult, ResizeOptions, MediaType } from '../../types'

export class ResizeOperation implements ImageOperation<ResizeOptions> {
  readonly name = 'resize'
  readonly type: MediaType = 'image'

  async execute(input: string, output: string, options: ResizeOptions): Promise<ConvertResult> {
    const start = Date.now()

    try {
      const inputStat = await fs.stat(input)

      const pipeline = sharp(input)

      pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit,
        position: options.position,
        withoutEnlargement: options.withoutEnlargement,
      })

      const format = options.format || path.extname(input).toLowerCase().replace('.', '')

      switch (format) {
        case 'jpeg':
        case 'jpg':
          pipeline.jpeg({ quality: options.quality ?? 85 })
          break
        case 'png':
          pipeline.png()
          break
        case 'webp':
          pipeline.webp({ quality: options.quality ?? 85 })
          break
        case 'avif':
          pipeline.avif({ quality: options.quality ?? 85 })
          break
        case 'tiff':
          pipeline.tiff()
          break
        default:
          pipeline.jpeg({ quality: options.quality ?? 85 })
      }

      pipeline.on('info', (info) => {
        // info.format, info.width, info.height available
      })

      await pipeline.toFile(output)

      const outputStat = await fs.stat(output).catch(() => null)

      return {
        success: true,
        inputPath: input,
        outputPath: output,
        inputSize: inputStat.size,
        outputSize: outputStat?.size ?? 0,
        duration: Date.now() - start,
      }
    } catch (error) {
      return {
        success: false,
        inputPath: input,
        outputPath: output,
        error: (error as Error).message,
        duration: Date.now() - start,
      }
    }
  }
}

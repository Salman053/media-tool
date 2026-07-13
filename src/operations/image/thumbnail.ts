import path from 'node:path'
import fs from 'node:fs/promises'
import type { ImageOperation, ConvertResult, MediaType } from '../../types'
import { createThumbnail, isAvailable } from '../../engines/imagemagick'

export interface ThumbnailOpts {
  size: number
  quality?: number
}

export class ThumbnailOperation implements ImageOperation<ThumbnailOpts> {
  readonly name = 'thumbnail'
  readonly type: MediaType = 'image'

  async execute(input: string, output: string, options: ThumbnailOpts): Promise<ConvertResult> {
    const start = Date.now()

    try {
      if (!(await isAvailable())) {
        return {
          success: false,
          inputPath: input,
          outputPath: output,
          error: 'ImageMagick is not installed. Install from https://imagemagick.org',
          duration: Date.now() - start,
        }
      }

      const inputStat = await fs.stat(input)
      await createThumbnail(input, output, { size: options.size, quality: options.quality })
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

import sharp from 'sharp'
import fs from 'node:fs/promises'
import type { FormatConverter, ConvertResult } from '../../../types'

const SUPPORTED_INPUTS = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif', 'gif', 'svg', 'bmp']

export class PngConverter implements FormatConverter {
  readonly name = 'png'
  readonly from = SUPPORTED_INPUTS
  readonly to = 'png'

  async convert(input: string, output: string, options?: Record<string, any>): Promise<ConvertResult> {
    const start = Date.now()
    try {
      const inputStat = await fs.stat(input)
      const p = sharp(input).png({ quality: options?.quality })
      if (options?.width || options?.height) p.resize(options.width, options.height)
      await p.toFile(output)
      const outputStat = await fs.stat(output).catch(() => null)
      return { success: true, inputPath: input, outputPath: output, inputSize: inputStat.size, outputSize: outputStat?.size ?? 0, duration: Date.now() - start }
    } catch (error) {
      return { success: false, inputPath: input, outputPath: output, error: (error as Error).message, duration: Date.now() - start }
    }
  }
}

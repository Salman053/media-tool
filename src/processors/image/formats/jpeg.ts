import sharp from 'sharp'
import fs from 'node:fs/promises'
import type { FormatConverter, ConvertResult } from '../../../types'

const SUPPORTED_INPUTS = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif', 'gif', 'svg', 'bmp']

export class JpegConverter implements FormatConverter {
  readonly name = 'jpeg'
  readonly from = SUPPORTED_INPUTS
  readonly to = 'jpeg'

  async convert(input: string, output: string, options?: Record<string, any>): Promise<ConvertResult> {
    const start = Date.now()
    try {
      const inputStat = await fs.stat(input)
      await sharp(input).jpeg({ quality: options?.quality ?? 85 }).toFile(output)
      const outputStat = await fs.stat(output).catch(() => null)
      return { success: true, inputPath: input, outputPath: output, inputSize: inputStat.size, outputSize: outputStat?.size ?? 0, duration: Date.now() - start }
    } catch (error) {
      return { success: false, inputPath: input, outputPath: output, error: (error as Error).message, duration: Date.now() - start }
    }
  }
}

import sharp from 'sharp'
import fs from 'node:fs/promises'
import type { FormatConverter, ConvertResult } from '../../../types'

const SUPPORTED_INPUTS = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif', 'gif', 'svg', 'bmp']

export interface WebpOptions {
  [key: string]: any
  quality?: number
  lossless?: boolean
  nearLossless?: boolean
  alphaQuality?: number
}

export class WebpConverter implements FormatConverter<WebpOptions> {
  readonly name = 'webp'
  readonly from = SUPPORTED_INPUTS
  readonly to = 'webp'

  async convert(input: string, output: string, options?: WebpOptions): Promise<ConvertResult> {
    const start = Date.now()

    try {
      const inputStat = await fs.stat(input)

      await sharp(input)
        .webp({
          quality: options?.quality ?? 80,
          lossless: options?.lossless,
          nearLossless: options?.nearLossless,
          alphaQuality: options?.alphaQuality,
        })
        .toFile(output)

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

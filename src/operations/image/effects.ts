import path from 'node:path'
import fs from 'node:fs/promises'
import type { ImageOperation, ConvertResult, MediaType } from '../../types'
import { applyEffect, isAvailable } from '../../engines/imagemagick'
import type { EffectOpts } from '../../engines/imagemagick'

export const EFFECT_LIST = [
  { id: 'blur', label: 'Blur', description: 'Gaussian blur' },
  { id: 'sharpen', label: 'Sharpen', description: 'Sharpen details' },
  { id: 'grayscale', label: 'Grayscale', description: 'Convert to black & white' },
  { id: 'sepia', label: 'Sepia', description: 'Warm vintage tone' },
  { id: 'negate', label: 'Negate', description: 'Invert colors' },
  { id: 'noise', label: 'Noise', description: 'Add grain' },
  { id: 'edge', label: 'Edge Detect', description: 'Detect edges' },
  { id: 'oil-paint', label: 'Oil Paint', description: 'Oil painting effect' },
  { id: 'charcoal', label: 'Charcoal', description: 'Charcoal sketch' },
  { id: 'implode', label: 'Implode', description: 'Pinch toward center' },
  { id: 'swirl', label: 'Swirl', description: 'Twirl effect' },
  { id: 'pixelate', label: 'Pixelate', description: 'Mosaic / pixelation' },
] as const

export class EffectsOperation implements ImageOperation<EffectOpts> {
  readonly name = 'effects'
  readonly type: MediaType = 'image'

  async execute(input: string, output: string, options: EffectOpts): Promise<ConvertResult> {
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
      await applyEffect(input, output, options)
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

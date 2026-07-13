import type { ImageOperation } from '../../types'
import { isAvailable, extractFrames } from '../../engines/ffmpeg'
import type { FrameExtractOpts } from '../../engines/ffmpeg'
import fs from 'node:fs'

export class FrameExtractOperation implements ImageOperation<FrameExtractOpts> {
  name = 'video-frames'
  type = 'video' as const

  async execute(input: string, outputPattern: string, opts: FrameExtractOpts) {
    const start = Date.now()
    try {
      if (!(await isAvailable())) {
        return { success: false, inputPath: input, outputPath: outputPattern, error: 'FFmpeg not installed. See https://ffmpeg.org' }
      }
      if (!fs.existsSync(input)) {
        return { success: false, inputPath: input, outputPath: outputPattern, error: 'Input file not found' }
      }
      await extractFrames(input, outputPattern, opts)
      return {
        success: true,
        inputPath: input,
        outputPath: outputPattern,
        duration: Date.now() - start,
      }
    } catch (err) {
      return { success: false, inputPath: input, outputPath: outputPattern, error: (err as Error).message, duration: Date.now() - start }
    }
  }
}

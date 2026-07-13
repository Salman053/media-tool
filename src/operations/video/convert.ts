import type { ImageOperation } from '../../types'
import { isAvailable, convertVideo } from '../../engines/ffmpeg'
import type { VideoConvertOpts } from '../../engines/ffmpeg'
import fs from 'node:fs'

export class VideoConvertOperation implements ImageOperation<VideoConvertOpts> {
  name = 'video-convert'
  type = 'video' as const

  async execute(input: string, output: string, opts: VideoConvertOpts) {
    const start = Date.now()
    try {
      if (!(await isAvailable())) {
        return { success: false, inputPath: input, outputPath: output, error: 'FFmpeg not installed. See https://ffmpeg.org' }
      }
      if (!fs.existsSync(input)) {
        return { success: false, inputPath: input, outputPath: output, error: 'Input file not found' }
      }
      await convertVideo(input, output, opts)
      const outStat = fs.existsSync(output) ? fs.statSync(output) : null
      const inStat = fs.statSync(input)
      return {
        success: true,
        inputPath: input,
        outputPath: output,
        inputSize: inStat.size,
        outputSize: outStat?.size,
        duration: Date.now() - start,
      }
    } catch (err) {
      return { success: false, inputPath: input, outputPath: output, error: (err as Error).message, duration: Date.now() - start }
    }
  }
}

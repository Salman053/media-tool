import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'
import { VideoConvertOperation } from '../operations/video/convert'
import { FrameExtractOperation } from '../operations/video/frames'
import { isAvailable } from '../engines/ffmpeg'
import type { VideoConvertOpts, FrameExtractOpts } from '../engines/ffmpeg'

function showHelp(): void {
  console.log(`
media-tool video - Video/audio processing

usage:
  media-tool video <subcommand> [options]

subcommands:
  convert     Convert video/audio between formats
  frames      Extract frames from video

options:
  -h, --help            Show this help

use "media-tool video <subcommand> --help" for subcommand help
  `)
}

commandRegistry.register({
  name: 'video',
  description: 'Process video/audio files (requires FFmpeg)',
  async run(args: string[]) {
    const sub = args[0]
    if (!sub || sub === '--help' || sub === '-h') {
      showHelp()
      return
    }

    const subArgs = args.slice(1)
    switch (sub) {
      case 'convert': {
        const input = subArgs.find((a, i) => !a.startsWith('-') && (!subArgs[i - 1] || !subArgs[i - 1].startsWith('-'))) || ''
        let output = ''
        let format = ''
        let videoCodec = ''
        let audioCodec = ''
        let bitrate = ''
        let fps = ''
        let resolution = ''
        for (let i = 0; i < subArgs.length; i++) {
          switch (subArgs[i]) {
            case '-o': case '--output': output = subArgs[++i]; break
            case '-f': case '--format': format = subArgs[++i]; break
            case '-vc': case '--vcodec': videoCodec = subArgs[++i]; break
            case '-ac': case '--acodec': audioCodec = subArgs[++i]; break
            case '-b': case '--bitrate': bitrate = subArgs[++i]; break
            case '-r': case '--fps': fps = subArgs[++i]; break
            case '-s': case '--resolution': resolution = subArgs[++i]; break
          }
        }
        if (!input) { console.error('error: input file required'); process.exit(1) }
        if (!fs.existsSync(input)) { console.error(`error: file not found: ${input}`); process.exit(1) }
        if (!(await isAvailable())) {
          console.error('error: FFmpeg not installed. Install from https://ffmpeg.org')
          process.exit(1)
        }
        const ext = format ? `.${format}` : path.extname(input)
        output = output || path.join(path.dirname(input), `${path.parse(input).name}-converted${ext}`)
        const opts: VideoConvertOpts = { format, videoCodec, audioCodec, bitrate, fps: fps ? Number(fps) : undefined, resolution }
        const op = new VideoConvertOperation()
        const result = await op.execute(input, output, opts)
        if (result.success) {
          console.log(`converted: ${input} -> ${output}`)
          if (result.duration) console.log(`  time: ${result.duration}ms`)
        } else {
          console.error(`error: ${result.error}`)
          process.exit(1)
        }
        break
      }

      case 'frames': {
        const input = subArgs.find((a, i) => !a.startsWith('-') && (!subArgs[i - 1] || !subArgs[i - 1].startsWith('-'))) || ''
        let output = ''
        let fps = ''
        let count = ''
        let quality = 3
        for (let i = 0; i < subArgs.length; i++) {
          switch (subArgs[i]) {
            case '-o': case '--output': output = subArgs[++i]; break
            case '-r': case '--fps': fps = subArgs[++i]; break
            case '-n': case '--count': count = subArgs[++i]; break
            case '-q': case '--quality': quality = Number(subArgs[++i]); break
          }
        }
        if (!input) { console.error('error: input file required'); process.exit(1) }
        if (!fs.existsSync(input)) { console.error(`error: file not found: ${input}`); process.exit(1) }
        if (!(await isAvailable())) {
          console.error('error: FFmpeg not installed. Install from https://ffmpeg.org')
          process.exit(1)
        }
        output = output || path.join(path.dirname(input), `${path.parse(input).name}-frame-%04d.jpg`)
        const opts: FrameExtractOpts = { fps: fps ? Number(fps) : undefined, count: count ? Number(count) : undefined, quality }
        const op = new FrameExtractOperation()
        const result = await op.execute(input, output, opts)
        if (result.success) {
          console.log(`frames extracted: ${input} -> ${output}`)
          if (result.duration) console.log(`  time: ${result.duration}ms`)
        } else {
          console.error(`error: ${result.error}`)
          process.exit(1)
        }
        break
      }

      default:
        console.error(`error: unknown subcommand "${sub}"`)
        showHelp()
        process.exit(1)
    }
  },
})

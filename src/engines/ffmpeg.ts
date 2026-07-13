import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'

const exec = promisify(execFile)

let _available: boolean | null = null
let _detectedFfmpeg: string | null = null
let _detectedFfprobe: string | null = null

const COMMON_DIRS_WIN = [
  'C:\\ffmpeg\\bin',
  'C:\\FFmpeg\\bin',
]
const COMMON_DIRS_MAC = [
  '/usr/local/bin',
  '/opt/homebrew/bin',
  '/opt/local/bin',
]
const COMMON_DIRS_LINUX = [
  '/usr/bin',
  '/usr/local/bin',
]

function getCommonDirs(): string[] {
  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files'
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    const la = process.env['LocalAppData'] || ''
    const dirs = [...COMMON_DIRS_WIN]
    for (const base of [pf, pf86, la]) {
      if (!base) continue
      try {
        const entries = fs.readdirSync(base)
        for (const e of entries) {
          if (e.toLowerCase().startsWith('ffmpeg')) {
            const bin = path.join(base, e, 'bin')
            if (fs.existsSync(bin)) dirs.push(bin)
            const ff = path.join(base, e, 'ffmpeg.exe')
            if (fs.existsSync(ff)) dirs.push(path.join(base, e))
          }
        }
      } catch { /* skip */ }
    }
    return dirs
  }
  if (process.platform === 'darwin') return COMMON_DIRS_MAC
  return COMMON_DIRS_LINUX
}

function findBinary(name: string): string | null {
  for (const dir of getCommonDirs()) {
    const full = path.join(dir, process.platform === 'win32' ? `${name}.exe` : name)
    if (fs.existsSync(full)) return full
  }
  return null
}

export async function isAvailable(): Promise<boolean> {
  if (_available !== null) return _available
  try { await detectFfmpeg(); _available = true; return true }
  catch { _available = false; return false }
}

export async function detectFfmpeg(): Promise<string> {
  if (_detectedFfmpeg) return _detectedFfmpeg
  try {
    await exec('ffmpeg', ['-version'])
    _detectedFfmpeg = 'ffmpeg'
    return 'ffmpeg'
  } catch { /* not in PATH */ }
  const found = findBinary('ffmpeg')
  if (found) { _detectedFfmpeg = found; return found }
  throw new Error('FFmpeg not found. Install from https://ffmpeg.org')
}

export async function detectFfprobe(): Promise<string> {
  if (_detectedFfprobe) return _detectedFfprobe
  try {
    await exec('ffprobe', ['-version'])
    _detectedFfprobe = 'ffprobe'
    return 'ffprobe'
  } catch { /* not in PATH */ }
  const found = findBinary('ffprobe')
  if (found) { _detectedFfprobe = found; return found }
  throw new Error('ffprobe not found. Install from https://ffmpeg.org')
}

export interface VideoConvertOpts {
  format?: string
  codec?: string
  videoCodec?: string
  audioCodec?: string
  bitrate?: string
  fps?: number
  resolution?: string
  quality?: number
}

export async function convertVideo(input: string, output: string, opts: VideoConvertOpts = {}): Promise<void> {
  const cmd = await detectFfmpeg()
  const args: string[] = ['-i', input, '-y']
  if (opts.videoCodec) args.push('-c:v', opts.videoCodec)
  if (opts.audioCodec) args.push('-c:a', opts.audioCodec)
  if (!opts.videoCodec && !opts.audioCodec) args.push('-c', opts.codec || 'copy')
  if (opts.bitrate) args.push('-b:v', opts.bitrate)
  if (opts.fps) args.push('-r', String(opts.fps))
  if (opts.resolution) args.push('-vf', `scale=${opts.resolution}`)
  if (opts.quality) {
    if (opts.format === 'mp3' || opts.format === 'aac' || opts.format === 'ogg') {
      args.push('-q:a', String(opts.quality))
    } else {
      args.push('-crf', String(Math.round((1 - opts.quality / 100) * 51)))
    }
  }
  if (opts.format === 'gif') {
    args.push('-vf', 'fps=10,scale=320:-1:flags=lanczos', '-loop', '0')
  }
  args.push(output)
  await exec(cmd, args)
}

export interface FrameExtractOpts {
  fps?: number
  count?: number
  quality?: number
}

export async function extractFrames(input: string, outputPattern: string, opts: FrameExtractOpts = {}): Promise<void> {
  const cmd = await detectFfmpeg()
  let fps = opts.fps
  if (!fps && opts.count) {
    const info = await getVideoInfo(input)
    if (info.duration > 0) {
      fps = Math.round(opts.count / info.duration)
      if (fps < 0.01) fps = 0.01
    }
  }
  const args: string[] = ['-i', input, '-y']
  if (fps) {
    args.push('-vf', `fps=${fps}`)
  }
  if (opts.quality) args.push('-q:v', String(opts.quality))
  args.push(outputPattern)
  await exec(cmd, args)
}

export interface VideoInfo {
  width: number
  height: number
  duration: number
  codec: string
  bitrate: string
  fps: number
  size: number
}

export async function getVideoInfo(input: string): Promise<VideoInfo> {
  const cmd = await detectFfprobe()
  const args = [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    input,
  ]
  const { stdout } = await exec(cmd, args)
  const data = JSON.parse(stdout)
  const stream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video')
  return {
    width: stream?.width || 0,
    height: stream?.height || 0,
    duration: Number.parseFloat(data.format?.duration || '0'),
    codec: stream?.codec_name || 'unknown',
    bitrate: data.format?.bit_rate || '0',
    fps: evalFps(stream?.r_frame_rate),
    size: Number.parseInt(data.format?.size || '0', 10),
  }
}

export function evalFps(rFrameRate: string | undefined): number {
  if (!rFrameRate) return 0
  const parts = rFrameRate.split('/')
  if (parts.length === 2) {
    const num = Number.parseInt(parts[0], 10)
    const den = Number.parseInt(parts[1], 10)
    if (den === 0 || Number.isNaN(num) || Number.isNaN(den)) return 0
    return Math.round(num / den)
  }
  const val = Number.parseInt(rFrameRate, 10)
  return Number.isNaN(val) ? 0 : val
}

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fsAsync from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'

const exec = promisify(execFile)

const CMDS = ['magick', 'convert', 'gm']

function getCommonPaths(): string[] {
  if (process.platform !== 'win32') return []
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  const localAppData = process.env['LocalAppData'] || ''
  const paths: string[] = []
  for (const base of [programFiles, programFilesX86, localAppData]) {
    if (!base) continue
    try {
      const dirs = fs.readdirSync(base)
      for (const d of dirs) {
        if (d.toLowerCase().startsWith('imagemagick') || d.toLowerCase().startsWith('graphicsmagick')) {
          const full = path.join(base, d, 'magick.exe')
          if (fs.existsSync(full)) paths.push(full)
          const conv = path.join(base, d, 'convert.exe')
          if (fs.existsSync(conv)) paths.push(conv)
          const gmPath = path.join(base, d, 'gm.exe')
          if (fs.existsSync(gmPath)) paths.push(gmPath)
        }
      }
    } catch { /* skip unreadable dirs */ }
  }
  return paths
}

let _available: boolean | null = null
let _detected: string | null = null

export async function isAvailable(): Promise<boolean> {
  if (_available !== null) return _available
  try {
    await detectCommand()
    _available = true
    return true
  } catch {
    _available = false
    return false
  }
}

export async function detectCommand(): Promise<string> {
  if (_detected) return _detected
  for (const cmd of CMDS) {
    try {
      await exec(cmd, ['--version'])
      _detected = cmd
      return cmd
    } catch { continue }
  }
  for (const fullPath of getCommonPaths()) {
    try {
      await exec(fullPath, ['--version'])
      _detected = fullPath
      return fullPath
    } catch { continue }
  }
  throw new Error('ImageMagick / GraphicsMagick not found. Install it from https://imagemagick.org')
}

export interface ConvertOptions {
  quality?: number
  format?: string
}

export async function convertImage(input: string, output: string, opts: ConvertOptions = {}): Promise<void> {
  const cmd = await detectCommand()
  const args: string[] = [input]

  if (opts.format) {
    args.push('-format', opts.format)
  }
  if (opts.quality) {
    args.push('-quality', String(opts.quality))
  }
  args.push(output)
  await exec(cmd, args)
}

export interface ResizeOpts {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  quality?: number
}

export async function resizeImage(input: string, output: string, opts: ResizeOpts): Promise<void> {
  const cmd = await detectCommand()
  const args: string[] = [input]

  if (opts.width && opts.height) {
    switch (opts.fit) {
      case 'cover':
        args.push('-resize', `${opts.width}x${opts.height}^`, '-gravity', 'center', '-extent', `${opts.width}x${opts.height}`)
        break
      case 'contain':
        args.push('-resize', `${opts.width}x${opts.height}`, '-background', 'none', '-gravity', 'center', '-extent', `${opts.width}x${opts.height}`)
        break
      case 'fill':
        args.push('-resize', `${opts.width}x${opts.height}!`)
        break
      case 'inside':
        args.push('-resize', `${opts.width}x${opts.height}`)
        break
      case 'outside':
        args.push('-resize', `${opts.width}x${opts.height}^`)
        break
      default:
        args.push('-resize', `${opts.width}x${opts.height}`)
    }
  } else if (opts.width) {
    args.push('-resize', `${opts.width}`)
  } else if (opts.height) {
    args.push('-resize', `x${opts.height}`)
  }

  if (opts.quality) args.push('-quality', String(opts.quality))
  args.push(output)
  await exec(cmd, args)
}

export type ImEffect =
  | 'blur'
  | 'sharpen'
  | 'grayscale'
  | 'sepia'
  | 'negate'
  | 'noise'
  | 'edge'
  | 'oil-paint'
  | 'charcoal'
  | 'implode'
  | 'swirl'
  | 'pixelate'

export interface EffectOpts {
  effect: ImEffect
  radius?: number
  sigma?: number
  amount?: number
  threshold?: number
}

export async function applyEffect(input: string, output: string, opts: EffectOpts): Promise<void> {
  const cmd = await detectCommand()
  const args: string[] = [input]

  switch (opts.effect) {
    case 'blur':
      args.push('-blur', `${opts.radius ?? 5}x${opts.sigma ?? 3}`)
      break
    case 'sharpen':
      args.push('-sharpen', `${opts.radius ?? 3}x${opts.sigma ?? 2}`)
      break
    case 'grayscale':
      args.push('-colorspace', 'Gray')
      break
    case 'sepia':
      args.push('-sepia-tone', `${opts.threshold ?? 80}%`)
      break
    case 'negate':
      args.push('-negate')
      break
    case 'noise':
      args.push('-noise', String(opts.amount ?? 3))
      break
    case 'edge':
      args.push('-edge', String(opts.radius ?? 2))
      break
    case 'oil-paint':
      args.push('-paint', String(opts.radius ?? 3))
      break
    case 'charcoal':
      args.push('-charcoal', String(opts.radius ?? 2))
      break
    case 'implode':
      args.push('-implode', String(opts.amount ?? 0.5))
      break
    case 'swirl':
      args.push('-swirl', String(opts.amount ?? 90))
      break
    case 'pixelate':
      args.push('-scale', `${opts.amount ?? 10}%`, '-scale', `${100 / ((opts.amount ?? 10) / 100)}%`)
      break
  }

  if (opts.effect !== 'grayscale' && opts.effect !== 'negate') {
    // quality only matters for non-trivial transformations
  }

  args.push(output)
  await exec(cmd, args)
}

export interface ThumbnailOpts {
  size?: number
  quality?: number
}

export async function createThumbnail(input: string, output: string, opts: ThumbnailOpts = {}): Promise<void> {
  const cmd = await detectCommand()
  const size = opts.size ?? 150
  const args: string[] = [
    input,
    '-thumbnail', `${size}x${size}^`,
    '-gravity', 'center',
    '-extent', `${size}x${size}`,
  ]
  if (opts.quality) args.push('-quality', String(opts.quality))
  args.push(output)
  await exec(cmd, args)
}

export async function getInfo(input: string): Promise<{ width: number; height: number; format: string }> {
  const cmd = await detectCommand()
  const { stdout } = await exec(cmd, [input, '-format', '%w %h %m', 'info:'])
  const parts = stdout.trim().split(/\s+/)
  return {
    width: Number(parts[0]),
    height: Number(parts[1]),
    format: parts[2],
  }
}

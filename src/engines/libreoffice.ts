import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'

const exec = promisify(execFile)

let _available: boolean | null = null
let _detected: string | null = null

const COMMON_DIRS_WIN = [
  'C:\\Program Files\\LibreOffice\\program',
  'C:\\Program Files (x86)\\LibreOffice\\program',
  'C:\\Program Files\\LibreOffice 7\\program',
  'C:\\Program Files (x86)\\LibreOffice 7\\program',
]
const COMMON_DIRS_MAC = [
  '/Applications/LibreOffice.app/Contents/MacOS',
  '/Applications/LibreOffice 7.app/Contents/MacOS',
]
const COMMON_DIRS_LINUX = [
  '/usr/bin',
  '/usr/local/bin',
  '/usr/lib/libreoffice/program',
]

function scanCommonPaths(): string[] {
  const dirs: string[] = []
  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files'
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    for (const base of [pf, pf86]) {
      if (!base) continue
      try {
        const entries = fs.readdirSync(base)
        for (const e of entries) {
          if (e.toLowerCase().startsWith('libreoffice')) {
            const p = path.join(base, e, 'program')
            if (fs.existsSync(p)) dirs.push(p)
          }
        }
      } catch { /* skip */ }
    }
    dirs.push(...COMMON_DIRS_WIN)
  } else if (process.platform === 'darwin') {
    dirs.push(...COMMON_DIRS_MAC)
  } else {
    dirs.push(...COMMON_DIRS_LINUX)
  }
  return dirs
}

const BIN_NAME = process.platform === 'win32' ? 'soffice.exe' : 'soffice'

export async function isAvailable(): Promise<boolean> {
  if (_available !== null) return _available
  try { await detectCommand(); _available = true; return true }
  catch { _available = false; return false }
}

export async function detectCommand(): Promise<string> {
  if (_detected) return _detected
  try {
    await exec('soffice', ['--headless', '--version'])
    _detected = 'soffice'
    return 'soffice'
  } catch { /* not in PATH */ }
  const dirs = scanCommonPaths()
  for (const dir of dirs) {
    const full = path.join(dir, BIN_NAME)
    if (fs.existsSync(full)) {
      _detected = full
      return full
    }
  }
  throw new Error('LibreOffice not found. Install from https://libreoffice.org')
}

const FORMAT_MAP: Record<string, string> = {
  pdf: 'pdf',
  docx: 'docx',
  doc: 'doc',
  odt: 'odt',
  txt: 'txt',
  html: 'html',
  htm: 'html',
  rtf: 'rtf',
  epub: 'epub',
  xlsx: 'xlsx',
  xls: 'xls',
  ods: 'ods',
  pptx: 'pptx',
  ppt: 'ppt',
  odp: 'odp',
  csv: 'csv',
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  svg: 'svg',
  xml: 'xml',
  bmp: 'bmp',
  tiff: 'tiff',
  tif: 'tiff',
  gif: 'gif',
}

export interface DocConvertOpts {
  format: string
  filterName?: string
}

export async function convertDocument(input: string, output: string, opts: DocConvertOpts): Promise<void> {
  const cmd = await detectCommand()
  const outDir = path.dirname(output)
  const ext = opts.format.replace('.', '').toLowerCase()
  const targetFormat = FORMAT_MAP[ext] || ext
  const args = [
    '--headless',
    '--convert-to', targetFormat,
    '--outdir', outDir,
    input,
  ]
  if (opts.filterName && targetFormat === 'pdf') {
    args.splice(2, 0, '--infilter=' + opts.filterName)
  }
  await exec(cmd, args)
  const expected = path.join(outDir, path.parse(input).name + '.' + targetFormat)
  if (expected !== output && fs.existsSync(expected)) {
    fs.renameSync(expected, output)
  }
}

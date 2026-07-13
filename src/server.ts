import express from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync, mkdirSync, createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'
import archiver from 'archiver'
import { fileURLToPath } from 'node:url'

import { ImageProcessor } from './processors/image/processor'
import { WebpConverter } from './processors/image/formats/webp'
import { ResizeOperation } from './operations/image/resize'
import { EffectsOperation, EFFECT_LIST } from './operations/image/effects'
import { ThumbnailOperation } from './operations/image/thumbnail'
import { isAvailable as imAvailable } from './engines/imagemagick'
import { isAvailable as ffAvailable, convertVideo, extractFrames, getVideoInfo } from './engines/ffmpeg'
import { VideoConvertOperation } from './operations/video/convert'
import { FrameExtractOperation } from './operations/video/frames'
import { isAvailable as loAvailable } from './engines/libreoffice'
import { DocConvertOperation } from './operations/document/convert'
import type { ResizeOptions } from './types'
import type { EffectOpts } from './engines/imagemagick'
import type { VideoConvertOpts, FrameExtractOpts } from './engines/ffmpeg'
import type { DocConvertOpts } from './engines/libreoffice'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = Number.parseInt(process.env.PORT || '3099', 10)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

mkdirSync(UPLOAD_DIR, { recursive: true })
mkdirSync(path.join(UPLOAD_DIR, 'tmp'), { recursive: true })

app.use(cors())

const clientDir = path.resolve(__dirname, '../client/dist')
if (existsSync(clientDir)) {
  app.use(express.static(clientDir))
}

app.use(express.json())

const upload = multer({
  dest: path.join(UPLOAD_DIR, 'tmp'),
  limits: { fileSize: 100 * 1024 * 1024 },
})

function processResults(
  results: Array<{ success: boolean; inputPath: string; outputPath: string; inputSize?: number; outputSize?: number; duration?: number; error?: string }>,
  inputNames: string[],
  sessionId: string,
) {
  return results.map((r, i) => ({
    ...r,
    originalName: inputNames[i],
    outputName: path.basename(r.outputPath),
    downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(path.basename(r.outputPath))}`,
  }))
}

app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files?.length) {
      res.status(400).json({ error: 'No files uploaded' })
      return
    }

    const sessionId = randomUUID()
    const sessionDir = path.join(UPLOAD_DIR, sessionId)
    await fs.mkdir(path.join(sessionDir, 'input'), { recursive: true })

    const uploaded: Array<{ id: string; originalName: string; size: number }> = []
    for (const file of files) {
      const destPath = path.join(sessionDir, 'input', file.originalname)
      await fs.rename(file.path, destPath)
      uploaded.push({
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
      })
    }

    res.json({ sessionId, files: uploaded })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/convert', async (req, res) => {
  try {
    const { sessionId, format = 'webp', quality = 80 } = req.body as {
      sessionId: string
      format?: string
      quality?: number
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const processor = new ImageProcessor()
    processor.registerFormat(new WebpConverter())

    const inputFiles = await fs.readdir(inputDir)

    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to convert' })
      return
    }

    const results = []
    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const outputName = filename.replace(/\.[^.]+$/, `.${format}`)
      const outputPath = path.join(outputDir, outputName)

      const result = await processor.convert(inputPath, format, outputPath, { quality })

      results.push({
        ...result,
        originalName: filename,
        outputName,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/resize', async (req, res) => {
  try {
    const body = req.body as {
      sessionId: string
      width?: number
      height?: number
      fit?: string
      withoutEnlargement?: boolean
      format?: string
      quality?: number
    }

    const { sessionId, width, height, fit, withoutEnlargement, format } = body
    const quality = body.quality ?? 85

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    if (!width && !height) {
      res.status(400).json({ error: 'At least one of width or height is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const operation = new ResizeOperation()
    const inputFiles = await fs.readdir(inputDir)

    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to resize' })
      return
    }

    const names: string[] = []
    const results = []

    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const outputName = filename.replace(/\.[^.]+$/, `.${format || path.extname(filename).slice(1)}`)
      const outputPath = path.join(outputDir, outputName)
      names.push(filename)

      const options: ResizeOptions = {
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fit: fit as ResizeOptions['fit'],
        withoutEnlargement,
        format,
        quality,
      }

      const result = await operation.execute(inputPath, outputPath, options)
      results.push({
        ...result,
        originalName: filename,
        outputName,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/effects', async (req, res) => {
  try {
    const { sessionId, effect, radius, sigma, amount, threshold } = req.body as {
      sessionId: string
      effect: string
      radius?: number
      sigma?: number
      amount?: number
      threshold?: number
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }
    if (!effect) {
      res.status(400).json({ error: 'effect is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (!(await imAvailable())) {
      res.status(400).json({ error: 'ImageMagick not installed. See https://imagemagick.org' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const operation = new EffectsOperation()
    const inputFiles = await fs.readdir(inputDir)
    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to process' })
      return
    }

    const results = []
    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const ext = path.extname(filename)
      const outputName = `${path.parse(filename).name}-${effect}${ext}`
      const outputPath = path.join(outputDir, outputName)

      const opts: EffectOpts = { effect: effect as EffectOpts['effect'], radius, sigma, amount, threshold }
      const result = await operation.execute(inputPath, outputPath, opts)
      results.push({
        ...result,
        originalName: filename,
        outputName,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/thumbnail', async (req, res) => {
  try {
    const { sessionId, size = 150, quality } = req.body as {
      sessionId: string
      size?: number
      quality?: number
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (!(await imAvailable())) {
      res.status(400).json({ error: 'ImageMagick not installed. See https://imagemagick.org' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const operation = new ThumbnailOperation()
    const inputFiles = await fs.readdir(inputDir)
    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to process' })
      return
    }

    const results = []
    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const ext = path.extname(filename)
      const outputName = `${path.parse(filename).name}-thumb${ext}`
      const outputPath = path.join(outputDir, outputName)

      const result = await operation.execute(inputPath, outputPath, { size, quality })
      results.push({
        ...result,
        originalName: filename,
        outputName,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/video/convert', async (req, res) => {
  try {
    const { sessionId, format, videoCodec, audioCodec, bitrate, fps, resolution } = req.body as {
      sessionId: string
    } & VideoConvertOpts

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (!(await ffAvailable())) {
      res.status(400).json({ error: 'FFmpeg not installed. See https://ffmpeg.org' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const operation = new VideoConvertOperation()
    const inputFiles = await fs.readdir(inputDir)
    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to process' })
      return
    }

    const results = []
    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const ext = format ? `.${format}` : path.extname(filename)
      const outputName = `${path.parse(filename).name}-converted${ext}`
      const outputPath = path.join(outputDir, outputName)

      const opts: VideoConvertOpts = { format, videoCodec, audioCodec, bitrate, fps, resolution }
      const result = await operation.execute(inputPath, outputPath, opts)
      results.push({
        ...result,
        originalName: filename,
        outputName,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/video/frames', async (req, res) => {
  try {
    const { sessionId, fps, count, quality } = req.body as {
      sessionId: string
    } & FrameExtractOpts

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (!(await ffAvailable())) {
      res.status(400).json({ error: 'FFmpeg not installed. See https://ffmpeg.org' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const operation = new FrameExtractOperation()
    const inputFiles = await fs.readdir(inputDir)
    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to process' })
      return
    }

    const results = []
    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const base = path.parse(filename).name
      const outputPattern = path.join(outputDir, `${base}-frame-%04d.jpg`)

      const opts: FrameExtractOpts = { fps, count, quality }
      const result = await operation.execute(inputPath, outputPattern, opts)
      results.push({
        ...result,
        originalName: filename,
        outputName: `${base}-frame-*.jpg`,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(`${base}-frame-*.jpg`)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/rename', async (req, res) => {
  try {
    const { sessionId, files } = req.body as {
      sessionId: string
      files: Array<{ originalName: string; newName: string }>
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }
    if (!files?.length) {
      res.status(400).json({ error: 'No files to rename' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const results = []
    for (const f of files) {
      const src = path.join(inputDir, f.originalName)
      if (!existsSync(src)) {
        results.push({
          success: false,
          originalName: f.originalName,
          outputName: f.newName,
          error: `Source file not found: ${f.originalName}`,
        })
        continue
      }
      const dest = path.join(outputDir, f.newName)
      try {
        await fs.copyFile(src, dest)
        const srcStat = await fs.stat(src)
        const dstStat = await fs.stat(dest)
        results.push({
          success: true,
          originalName: f.originalName,
          outputName: f.newName,
          inputSize: srcStat.size,
          outputSize: dstStat.size,
          downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(f.newName)}`,
        })
      } catch (err) {
        results.push({
          success: false,
          originalName: f.originalName,
          outputName: f.newName,
          error: (err as Error).message,
        })
      }
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/document/convert', async (req, res) => {
  try {
    const { sessionId, format, filterName } = req.body as {
      sessionId: string
    } & DocConvertOpts

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }
    if (!format) {
      res.status(400).json({ error: 'format is required' })
      return
    }

    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (!(await loAvailable())) {
      res.status(400).json({ error: 'LibreOffice not installed. See https://libreoffice.org' })
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    const operation = new DocConvertOperation()
    const inputFiles = await fs.readdir(inputDir)
    if (inputFiles.length === 0) {
      res.status(400).json({ error: 'No files to process' })
      return
    }

    const results = []
    for (const filename of inputFiles) {
      const inputPath = path.join(inputDir, filename)
      const stat = await fs.stat(inputPath)
      if (!stat.isFile()) continue

      const base = path.parse(filename).name
      const outputName = `${base}.${format}`
      const outputPath = path.join(outputDir, outputName)

      const opts: DocConvertOpts = { format, filterName }
      const result = await operation.execute(inputPath, outputPath, opts)
      results.push({
        ...result,
        originalName: filename,
        outputName,
        downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}`,
      })
    }

    res.json({ sessionId, results })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.get('/api/download/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params
    const decoded = decodeURIComponent(filename)
    const filePath = path.join(UPLOAD_DIR, sessionId, 'output', decoded)

    if (!existsSync(filePath)) {
      res.status(404).type('text').send('File not found')
      return
    }

    res.download(filePath, decoded)
  } catch {
    res.status(500).type('text').send('Download failed')
  }
})

app.get('/api/download-all/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(outputDir)) {
      res.status(404).type('text').send('No files found')
      return
    }

    const files = await fs.readdir(outputDir)
    if (files.length === 0) {
      res.status(404).type('text').send('No files found')
      return
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="files-${sessionId.slice(0, 8)}.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)
    archive.directory(outputDir, false)
    archive.on('error', () => { res.end() })
    await archive.finalize()
  } catch {
    res.status(500).type('text').send('Download failed')
  }
})

app.get('/api/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const inputDir = path.join(UPLOAD_DIR, sessionId, 'input')
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(inputDir)) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const inputs = await fs.readdir(inputDir)
    const outputs = existsSync(outputDir) ? await fs.readdir(outputDir) : []

    res.json({
      sessionId,
      totalFiles: inputs.length,
      doneFiles: outputs.length,
      completed: inputs.length === outputs.length,
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

setInterval(async () => {
  try {
    const entries = await fs.readdir(UPLOAD_DIR)
    const now = Date.now()
    for (const entry of entries) {
      if (entry === 'tmp') continue
      const entryPath = path.join(UPLOAD_DIR, entry)
      const stat = await fs.stat(entryPath)
      if (stat.isDirectory() && now - stat.mtimeMs > 3_600_000) {
        await fs.rm(entryPath, { recursive: true, force: true })
      }
    }
  } catch {
    // cleanup errors are non-fatal
  }
}, 3_600_000)

app.get('*', (_req, res) => {
  const indexPath = path.join(clientDir, 'index.html')
  if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).json({ error: 'Frontend not built. Run npm run build:client first.' })
  }
})

app.listen(PORT, () => {
  console.log(`media-tool server running at http://localhost:${PORT}`)
})

export default app

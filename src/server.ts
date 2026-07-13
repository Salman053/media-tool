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

app.get('/api/download/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params
    const filePath = path.join(UPLOAD_DIR, sessionId, 'output', filename)

    if (!existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const decoded = decodeURIComponent(filename)
    res.setHeader('Content-Disposition', `attachment; filename="${decoded}"`)
    createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.get('/api/download-all/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const outputDir = path.join(UPLOAD_DIR, sessionId, 'output')

    if (!existsSync(outputDir)) {
      res.status(404).json({ error: 'No converted files found' })
      return
    }

    const files = await fs.readdir(outputDir)
    if (files.length === 0) {
      res.status(404).json({ error: 'No converted files found' })
      return
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="converted-${sessionId.slice(0, 8)}.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)
    archive.directory(outputDir, false)
    await archive.finalize()
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
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
      convertedFiles: outputs.length,
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

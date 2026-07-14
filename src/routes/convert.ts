import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { ImageProcessor } from '../processors/image/processor'
import { WebpConverter } from '../processors/image/formats/webp'
import { PngConverter } from '../processors/image/formats/png'
import { JpegConverter } from '../processors/image/formats/jpeg'
import { AvifConverter } from '../processors/image/formats/avif'
import { TiffConverter } from '../processors/image/formats/tiff'
import { GifConverter } from '../processors/image/formats/gif'

export function registerConvertRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const processor = new ImageProcessor()
  processor.registerFormat(new WebpConverter())
  processor.registerFormat(new PngConverter())
  processor.registerFormat(new JpegConverter())
  processor.registerFormat(new AvifConverter())
  processor.registerFormat(new TiffConverter())
  processor.registerFormat(new GifConverter())

  app.post('/api/convert', async (req, res) => {
    try {
      const { sessionId, format = 'webp', quality = 80 } = req.body as { sessionId: string; format?: string; quality?: number }
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to convert' }); return }

      const fmt = format === 'jpg' ? 'jpeg' : format
      const results = []

      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const outputExt = fmt === 'jpeg' ? 'jpg' : fmt
        const outputName = filename.replace(/\.[^.]+$/, `.${outputExt}`)
        const outputPath = path.join(outputDir, outputName)

        const result = await processor.convert(inputPath, fmt, outputPath, { quality })
        results.push({ ...result, originalName: filename, outputName, downloadUrl: result.success ? `/api/download/${sessionId}/${encodeURIComponent(outputName)}` : '' })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

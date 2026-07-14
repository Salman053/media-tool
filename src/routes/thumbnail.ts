import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { ThumbnailOperation } from '../operations/image/thumbnail'
import { isAvailable as imAvailable } from '../engines/imagemagick'

export function registerThumbnailRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const operation = new ThumbnailOperation()

  app.post('/api/thumbnail', async (req, res) => {
    try {
      const { sessionId, size = 150, quality } = req.body as { sessionId: string; size?: number; quality?: number }
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }
      if (!(await imAvailable())) { res.status(400).json({ error: 'ImageMagick not installed. See https://imagemagick.org' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to process' }); return }

      const results = []
      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const ext = path.extname(filename)
        const outputName = `${path.parse(filename).name}-thumb${ext}`
        const outputPath = path.join(outputDir, outputName)

        const result = await operation.execute(inputPath, outputPath, { size, quality })
        results.push({ ...result, originalName: filename, outputName, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

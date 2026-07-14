import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { ResizeOperation } from '../operations/image/resize'
import type { ResizeOptions } from '../types'

export function registerResizeRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const operation = new ResizeOperation()

  app.post('/api/resize', async (req, res) => {

    
    try {
      const body = req.body as { sessionId: string; width?: number; height?: number; fit?: string; withoutEnlargement?: boolean; format?: string; quality?: number }
      const { sessionId, width, height, fit, withoutEnlargement, format } = body
      const quality = body.quality ?? 85

      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }
      if (!width && !height) { res.status(400).json({ error: 'At least one of width or height is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to resize' }); return }

      const results = []
      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const outputName = filename.replace(/\.[^.]+$/, `.${format || path.extname(filename).slice(1)}`)
        const outputPath = path.join(outputDir, outputName)

        const options: ResizeOptions = { width: width ? Number(width) : undefined, height: height ? Number(height) : undefined, fit: fit as ResizeOptions['fit'], withoutEnlargement, format, quality }
        const result = await operation.execute(inputPath, outputPath, options)
        results.push({ ...result, originalName: filename, outputName, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

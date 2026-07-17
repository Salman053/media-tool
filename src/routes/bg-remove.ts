import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { BgRemoveOperation } from '../operations/image/bg-remove'

export function registerBgRemoveRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const operation = new BgRemoveOperation()

  app.post('/api/bg-remove', async (req, res) => {
    try {
      const { sessionId, format = 'png' } = req.body as { sessionId: string; format?: string }
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to process' }); return }

      const results = []
      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const fmt = format === 'jpg' ? 'jpeg' : format
        const outputExt = fmt === 'jpeg' ? 'jpg' : fmt
        const outputName = filename.replace(/\.[^.]+$/, `.${outputExt}`)
        const outputPath = path.join(outputDir, outputName)

        const result = await operation.execute(inputPath, outputPath)
        results.push({ ...result, originalName: filename, outputName, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { EffectsOperation } from '../operations/image/effects'
import { isAvailable as imAvailable } from '../engines/imagemagick'
import type { EffectOpts } from '../engines/imagemagick'

export function registerEffectsRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const operation = new EffectsOperation()

  app.post('/api/effects', async (req, res) => {
    try {
      const { sessionId, effect, radius, sigma, amount, threshold } = req.body as { sessionId: string; effect: string; radius?: number; sigma?: number; amount?: number; threshold?: number }
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }
      if (!effect) { res.status(400).json({ error: 'effect is required' }); return }

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
        const outputName = `${path.parse(filename).name}-${effect}${ext}`
        const outputPath = path.join(outputDir, outputName)

        const opts: EffectOpts = { effect: effect as EffectOpts['effect'], radius, sigma, amount, threshold }
        const result = await operation.execute(inputPath, outputPath, opts)
        results.push({ ...result, originalName: filename, outputName, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

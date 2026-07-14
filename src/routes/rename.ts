import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'

export function registerRenameRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  app.post('/api/rename', async (req, res) => {
    try {
      const { sessionId, files } = req.body as { sessionId: string; files: Array<{ originalName: string; newName: string }> }
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }
      if (!files?.length) { res.status(400).json({ error: 'No files to rename' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const results = []
      for (const f of files) {
        const src = path.join(inputDir, f.originalName)
        if (!existsSync(src)) {
          results.push({ success: false, originalName: f.originalName, outputName: f.newName, error: `Source file not found: ${f.originalName}` })
          continue
        }
        const dest = path.join(outputDir, f.newName)
        try {
          await fs.copyFile(src, dest)
          const srcStat = await fs.stat(src)
          const dstStat = await fs.stat(dest)
          results.push({ success: true, originalName: f.originalName, outputName: f.newName, inputSize: srcStat.size, outputSize: dstStat.size, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(f.newName)}` })
        } catch (err) {
          results.push({ success: false, originalName: f.originalName, outputName: f.newName, error: (err as Error).message })
        }
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

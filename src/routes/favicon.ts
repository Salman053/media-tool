import type { Express } from 'express'
import type multer from 'multer'
import path from 'node:path'
import fs from 'node:fs/promises'
import { generateFavicon } from '../operations/favicon'

export function registerFaviconRoutes(app: Express, upload: ReturnType<typeof multer>, uploadDir: string) {
  app.post('/api/favicon', upload.single('image'), async (req, res) => {
    try {
      const file = req.file as Express.Multer.File
      if (!file) { res.status(400).json({ error: 'No image uploaded' }); return }

      const sessionId = req.body.sessionId as string
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }

      const sessionDir = path.join(uploadDir, sessionId)
      const result = await generateFavicon(file.path, sessionDir)

      await fs.unlink(file.path).catch(() => {})

      res.json({
        sessionId,
        files: result.files.map((f) => ({
          name: f.name,
          size: f.size,
          downloadUrl: `/api/download/${sessionId}/favicon/${f.name}`,
        })),
        manifest: result.manifestJson,
        downloadAllUrl: `/api/download-all/${sessionId}`,
      })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'

function safeName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'unnamed'
}

export function registerUploadRoutes(app: Express, upload: ReturnType<typeof multer>, uploadDir: string) {
  app.post('/api/upload', upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[]
      if (!files?.length) { res.status(400).json({ error: 'No files uploaded' }); return }

      const sessionId = randomUUID()
      const sessionDir = path.join(uploadDir, sessionId)
      await fs.mkdir(path.join(sessionDir, 'input'), { recursive: true })

      const uploaded: Array<{ id: string; originalName: string; size: number }> = []
      for (const file of files) {
        const name = safeName(file.originalname)
        const destPath = path.join(sessionDir, 'input', name)
        await fs.copyFile(file.path, destPath)
        await fs.unlink(file.path).catch(() => {})
        uploaded.push({ id: randomUUID(), originalName: name, size: file.size })
      }

      res.json({ sessionId, files: uploaded })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

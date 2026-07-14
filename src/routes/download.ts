import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import archiver from 'archiver'

export function registerDownloadRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  app.get('/api/download/:sessionId/favicon/:filename', async (req, res) => {
    try {
      const { sessionId, filename } = req.params
      const decoded = decodeURIComponent(filename)
      const filePath = path.join(uploadDir, sessionId, 'output', 'favicon', decoded)

      if (!existsSync(filePath)) { res.status(404).type('text').send('File not found'); return }
      res.download(filePath, decoded)
    } catch {
      res.status(500).type('text').send('Download failed')
    }
  })

  app.get('/api/download/:sessionId/:filename', async (req, res) => {
    try {
      const { sessionId, filename } = req.params
      const decoded = decodeURIComponent(filename)
      const filePath = path.join(uploadDir, sessionId, 'output', decoded)

      if (!existsSync(filePath)) { res.status(404).type('text').send('File not found'); return }
      res.download(filePath, decoded)
    } catch {
      res.status(500).type('text').send('Download failed')
    }
  })

  app.get('/api/download-all/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(outputDir)) { res.status(404).type('text').send('No files found'); return }

      const files = await fs.readdir(outputDir)
      if (files.length === 0) { res.status(404).type('text').send('No files found'); return }

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="files-${sessionId.slice(0, 8)}.zip"`)

      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.pipe(res)
      archive.directory(outputDir, false)
      archive.on('error', () => {
        res.end()
        fs.rm(path.join(uploadDir, sessionId), { recursive: true, force: true }).catch(() => {})
      })
      archive.on('close', async () => {
        await fs.rm(path.join(uploadDir, sessionId), { recursive: true, force: true }).catch(() => {})
      })
      await archive.finalize()
    } catch {
      res.status(500).type('text').send('Download failed')
    }
  })

  app.delete('/api/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params
      const sessionDir = path.join(uploadDir, sessionId)
      if (existsSync(sessionDir)) await fs.rm(sessionDir, { recursive: true, force: true })
      res.json({ ok: true })
    } catch {
      res.status(500).json({ error: 'Failed to remove session' })
    }
  })

  app.get('/api/status/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params
      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }

      const inputs = await fs.readdir(inputDir)
      const outputs = existsSync(outputDir) ? await fs.readdir(outputDir) : []

      res.json({ sessionId, totalFiles: inputs.length, doneFiles: outputs.length, completed: inputs.length === outputs.length })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

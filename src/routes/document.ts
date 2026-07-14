import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { isAvailable as loAvailable } from '../engines/libreoffice'
import { DocConvertOperation } from '../operations/document/convert'
import type { DocConvertOpts } from '../engines/libreoffice'

export function registerDocumentRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const operation = new DocConvertOperation()

  app.post('/api/document/convert', async (req, res) => {
    try {
      const { sessionId, format, filterName } = req.body as { sessionId: string } & DocConvertOpts
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }
      if (!format) { res.status(400).json({ error: 'format is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }
      if (!(await loAvailable())) { res.status(400).json({ error: 'LibreOffice not installed. See https://libreoffice.org' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to process' }); return }

      const results = []
      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const base = path.parse(filename).name
        const outputName = `${base}.${format}`
        const outputPath = path.join(outputDir, outputName)

        const opts: DocConvertOpts = { format, filterName }
        const result = await operation.execute(inputPath, outputPath, opts)
        results.push({ ...result, originalName: filename, outputName, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

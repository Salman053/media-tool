import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { isAvailable as ffAvailable } from '../engines/ffmpeg'
import { VideoConvertOperation } from '../operations/video/convert'
import { FrameExtractOperation } from '../operations/video/frames'
import type { VideoConvertOpts, FrameExtractOpts } from '../engines/ffmpeg'

export function registerVideoRoutes(app: Express, _upload: ReturnType<typeof multer>, uploadDir: string) {
  const convertOp = new VideoConvertOperation()
  const frameOp = new FrameExtractOperation()

  app.post('/api/video/convert', async (req, res) => {
    try {
      const { sessionId, format, videoCodec, audioCodec, bitrate, fps, resolution } = req.body as { sessionId: string } & VideoConvertOpts
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }
      if (!(await ffAvailable())) { res.status(400).json({ error: 'FFmpeg not installed. See https://ffmpeg.org' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to process' }); return }

      const results = []
      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const ext = format ? `.${format}` : path.extname(filename)
        const outputName = `${path.parse(filename).name}-converted${ext}`
        const outputPath = path.join(outputDir, outputName)

        const opts: VideoConvertOpts = { format, videoCodec, audioCodec, bitrate, fps, resolution }
        const result = await convertOp.execute(inputPath, outputPath, opts)
        results.push({ ...result, originalName: filename, outputName, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(outputName)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  app.post('/api/video/frames', async (req, res) => {
    try {
      const { sessionId, fps, count, quality } = req.body as { sessionId: string } & FrameExtractOpts
      if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return }

      const inputDir = path.join(uploadDir, sessionId, 'input')
      const outputDir = path.join(uploadDir, sessionId, 'output')

      if (!existsSync(inputDir)) { res.status(404).json({ error: 'Session not found' }); return }
      if (!(await ffAvailable())) { res.status(400).json({ error: 'FFmpeg not installed. See https://ffmpeg.org' }); return }

      await fs.mkdir(outputDir, { recursive: true })

      const inputFiles = await fs.readdir(inputDir)
      if (inputFiles.length === 0) { res.status(400).json({ error: 'No files to process' }); return }

      const results = []
      for (const filename of inputFiles) {
        const inputPath = path.join(inputDir, filename)
        const stat = await fs.stat(inputPath)
        if (!stat.isFile()) continue

        const base = path.parse(filename).name
        const outputPattern = path.join(outputDir, `${base}-frame-%04d.jpg`)

        const opts: FrameExtractOpts = { fps, count, quality }
        const result = await frameOp.execute(inputPath, outputPattern, opts)
        results.push({ ...result, originalName: filename, outputName: `${base}-frame-*.jpg`, downloadUrl: `/api/download/${sessionId}/${encodeURIComponent(`${base}-frame-*.jpg`)}` })
      }

      res.json({ sessionId, results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

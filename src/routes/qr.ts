import type { Express } from 'express'
import type multer from 'multer'
import fs from 'node:fs/promises'
import { generateQr, decodeQr } from '../operations/image/qr'

export function registerQrRoutes(app: Express, upload: ReturnType<typeof multer>, _uploadDir: string) {
  app.post('/api/qr/generate', upload.fields([{ name: 'logo', maxCount: 1 }]), async (req, res) => {
    try {
      const text = req.body.text as string
      if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
      const logoPath = files?.logo?.[0]?.path

      const { data } = await generateQr({ text: text.trim(), logoPath })
      if (logoPath) await fs.unlink(logoPath).catch(() => {})

      res.setHeader('Content-Type', 'image/png')
      res.send(data)
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  app.post('/api/qr/decode', upload.single('image'), async (req, res) => {
    try {
      const file = req.file as Express.Multer.File
      if (!file) { res.status(400).json({ error: 'No image uploaded' }); return }

      const text = await decodeQr(file.path)
      await fs.unlink(file.path).catch(() => {})
      res.json({ text })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })
}

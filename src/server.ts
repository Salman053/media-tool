import express from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { registerUploadRoutes } from './routes/upload'
import { registerConvertRoutes } from './routes/convert'
import { registerResizeRoutes } from './routes/resize'
import { registerEffectsRoutes } from './routes/effects'
import { registerThumbnailRoutes } from './routes/thumbnail'
import { registerVideoRoutes } from './routes/video'
import { registerDocumentRoutes } from './routes/document'
import { registerQrRoutes } from './routes/qr'
import { registerRenameRoutes } from './routes/rename'
import { registerDownloadRoutes } from './routes/download'
import { registerFaviconRoutes } from './routes/favicon'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = Number.parseInt(process.env.PORT || '3099', 10)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

mkdirSync(UPLOAD_DIR, { recursive: true })
mkdirSync(path.join(UPLOAD_DIR, 'tmp'), { recursive: true })

app.use(cors())

const clientDir = path.resolve(__dirname, '../client/dist')
if (existsSync(clientDir)) app.use(express.static(clientDir))

app.use(express.json())

const upload = multer({ dest: path.join(UPLOAD_DIR, 'tmp'), limits: { fileSize: 100 * 1024 * 1024 } })

// ── Routes ──
registerUploadRoutes(app, upload, UPLOAD_DIR)
registerConvertRoutes(app, upload, UPLOAD_DIR)
registerResizeRoutes(app, upload, UPLOAD_DIR)
registerEffectsRoutes(app, upload, UPLOAD_DIR)
registerThumbnailRoutes(app, upload, UPLOAD_DIR)
registerVideoRoutes(app, upload, UPLOAD_DIR)
registerDocumentRoutes(app, upload, UPLOAD_DIR)
registerQrRoutes(app, upload, UPLOAD_DIR)
registerRenameRoutes(app, upload, UPLOAD_DIR)
registerDownloadRoutes(app, upload, UPLOAD_DIR)
registerFaviconRoutes(app, upload, UPLOAD_DIR)

// ── Session cleanup every hour ──
setInterval(async () => {
  try {
    const entries = await fs.readdir(UPLOAD_DIR)
    const now = Date.now()
    for (const entry of entries) {
      if (entry === 'tmp') continue
      const entryPath = path.join(UPLOAD_DIR, entry)
      const stat = await fs.stat(entryPath)
      if (stat.isDirectory() && now - stat.mtimeMs > 3_600_000) {
        await fs.rm(entryPath, { recursive: true, force: true })
      }
    }
  } catch { /* cleanup errors are non-fatal */ }
}, 3_600_000)

// ── SPA fallback ──
app.get('*', (_req, res) => {
  const indexPath = path.join(clientDir, 'index.html')
  if (existsSync(indexPath)) res.sendFile(indexPath)
  else res.status(404).json({ error: 'Frontend not built. Run npm run build:client first.' })
})

app.listen(PORT, () => console.log(`media-tool server running at http://localhost:${PORT}`))

export default app

import sharp from 'sharp'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import fs from 'node:fs'
import type { ConvertResult } from '../../types'

export interface QrGenOpts {
  text: string
  logoPath?: string
}

export interface QrDecodeOpts {
  imagePath: string
}

export async function generateQr(opts: QrGenOpts): Promise<{ data: Buffer; size: number }> {
  const qrBuf = await QRCode.toBuffer(opts.text.trim(), {
    width: 600, margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    type: 'png',
  })

  if (opts.logoPath && fs.existsSync(opts.logoPath)) {
    const logo = await sharp(opts.logoPath)
      .resize(140, 140, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer()

    const composited = await sharp(qrBuf)
      .composite([{ input: logo, gravity: 'centre' }])
      .png()
      .toBuffer()

    return { data: composited, size: composited.length }
  }

  return { data: qrBuf, size: qrBuf.length }
}

export async function decodeQr(imagePath: string): Promise<string> {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  if (!code) throw new Error('No QR code found in image')
  return code.data
}

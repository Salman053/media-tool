import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { removeBackground } from '@imgly/background-removal-node'
import type { ConvertResult, MediaType } from '../../types'

export class BgRemoveOperation {
  readonly name = 'bg-remove'
  readonly type: MediaType = 'image'

  async execute(input: string, output: string): Promise<ConvertResult> {
    const start = Date.now()
    try {
      const inputStat = await fs.stat(input)
      const inputUrl = pathToFileURL(path.resolve(input)).href
      const result = await removeBackground(inputUrl)
      let buf = Buffer.from(await result.arrayBuffer())

      const ext = output.toLowerCase().slice(output.lastIndexOf('.'))
      if (ext === '.jpg' || ext === '.jpeg') {
        buf = await sharp(buf).jpeg({ quality: 95 }).toBuffer()
      } else if (ext === '.webp') {
        buf = await sharp(buf).webp({ quality: 95 }).toBuffer()
      }

      await fs.writeFile(output, buf)
      const outputStat = await fs.stat(output).catch(() => null)
      return {
        success: true, inputPath: input, outputPath: output,
        inputSize: inputStat.size, outputSize: outputStat?.size ?? 0,
        duration: Date.now() - start,
      }
    } catch (error) {
      return {
        success: false, inputPath: input, outputPath: output,
        error: (error as Error).message, duration: Date.now() - start,
      }
    }
  }
}

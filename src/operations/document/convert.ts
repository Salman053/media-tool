import type { ImageOperation } from '../../types'
import { isAvailable, convertDocument } from '../../engines/libreoffice'
import type { DocConvertOpts } from '../../engines/libreoffice'
import fs from 'node:fs'

export class DocConvertOperation implements ImageOperation<DocConvertOpts> {
  name = 'convert'
  type = 'document' as const

  async execute(input: string, output: string, opts: DocConvertOpts) {
    const start = Date.now()
    try {
      if (!(await isAvailable())) {
        return { success: false, inputPath: input, outputPath: output, error: 'LibreOffice not installed. See https://libreoffice.org' }
      }
      if (!fs.existsSync(input)) {
        return { success: false, inputPath: input, outputPath: output, error: 'Input file not found' }
      }
      await convertDocument(input, output, opts)
      const outStat = fs.existsSync(output) ? fs.statSync(output) : null
      const inStat = fs.statSync(input)
      return {
        success: true,
        inputPath: input,
        outputPath: output,
        inputSize: inStat.size,
        outputSize: outStat?.size,
        duration: Date.now() - start,
      }
    } catch (err) {
      return { success: false, inputPath: input, outputPath: output, error: (err as Error).message, duration: Date.now() - start }
    }
  }
}

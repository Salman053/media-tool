import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'
import { DocConvertOperation } from '../operations/document/convert'
import { isAvailable } from '../engines/libreoffice'
import type { DocConvertOpts } from '../engines/libreoffice'

commandRegistry.register({
  name: 'document',
  description: 'Convert documents between formats (requires LibreOffice)',
  async run(args: string[]) {
    const input = args.find((a, i) => !a.startsWith('-') && (!args[i - 1] || !args[i - 1].startsWith('-'))) || ''
    let output = ''
    let format = ''
    let filterName = ''

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '-o': case '--output': output = args[++i]; break
        case '-f': case '--format': format = args[++i]; break
        case '--filter': filterName = args[++i]; break
      }
    }

    if (!input) { console.error('error: input file required'); process.exit(1) }
    if (!fs.existsSync(input)) { console.error(`error: file not found: ${input}`); process.exit(1) }
    if (!format) { console.error('error: --format is required (e.g. pdf, docx, txt, html)'); process.exit(1) }
    if (!(await isAvailable())) {
      console.error('error: LibreOffice not installed. Install from https://libreoffice.org')
      process.exit(1)
    }
    output = output || path.join(path.dirname(input), `${path.parse(input).name}.${format}`)
    const opts: DocConvertOpts = { format, filterName: filterName || undefined }
    const op = new DocConvertOperation()
    const result = await op.execute(input, output, opts)
    if (result.success) {
      console.log(`converted: ${input} -> ${output}`)
      if (result.inputSize && result.outputSize) {
        const ratio = ((1 - result.outputSize / result.inputSize) * 100).toFixed(1)
        console.log(`  size: ${formatSize(result.inputSize)} -> ${formatSize(result.outputSize)} (${ratio}% change)`)
      }
      if (result.duration) console.log(`  time: ${result.duration}ms`)
    } else {
      console.error(`error: ${result.error}`)
      process.exit(1)
    }
  },
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'

export interface RenameRule {
  pattern: string
  start?: number
  padding?: number
}

export function applyPattern(original: string, pattern: string, index: number, opts: RenameRule): string {
  const ext = path.extname(original)
  const base = path.parse(original).name
  const num = String((opts.start || 1) + index).padStart(opts.padding || 1, '0')
  return pattern
    .replace('{n}', num)
    .replace('{i}', String((opts.start || 1) + index))
    .replace('{original}', base)
    .replace('{ext}', ext)
}

commandRegistry.register({
  name: 'rename',
  description: 'Rename files in a directory using patterns',
  async run(args: string[]) {
    let dir = '.'
    let pattern = '{n}{ext}'
    let start = 1
    let padding = 0
    let dryRun = false
    let filter = ''

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '-d': case '--dir': dir = args[++i]; break
        case '-p': case '--pattern': pattern = args[++i]; break
        case '--start': start = Number.parseInt(args[++i], 10); break
        case '--padding': padding = Number.parseInt(args[++i], 10); break
        case '--dry-run': dryRun = true; break
        case '--filter': filter = args[++i]; break
        default:
          if (!args[i].startsWith('-')) { dir = args[i] }
      }
    }

    if (!fs.existsSync(dir)) {
      console.error(`error: directory not found: ${dir}`)
      process.exit(1)
    }

    let files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile())
    if (filter) {
      const re = new RegExp(filter, 'i')
      files = files.filter((f) => re.test(f))
    }

    if (files.length === 0) {
      console.error('error: no files found')
      process.exit(1)
    }

    files.sort()

    console.log(`Renaming ${files.length} file(s) in "${dir}"`)
    console.log(`Pattern: ${pattern}`)
    if (dryRun) console.log('DRY RUN - no files will be renamed')
    console.log('')

    const results: Array<{ from: string; to: string; ok: boolean }> = []

    for (let i = 0; i < files.length; i++) {
      const newName = applyPattern(files[i], pattern, i, { start, padding })
      const src = path.join(dir, files[i])
      const dst = path.join(dir, newName)
      if (src === dst) {
        console.log(`  SKIP ${files[i]} (same name)`)
        continue
      }
      if (fs.existsSync(dst)) {
        console.log(`  SKIP ${files[i]} -> ${newName} (target exists)`)
        continue
      }
      if (!dryRun) {
        fs.renameSync(src, dst)
      }
      console.log(`  ${dryRun ? 'WOULD RENAME' : 'RENAMED'} ${files[i]} -> ${newName}`)
      results.push({ from: files[i], to: newName, ok: true })
    }

    if (!dryRun) {
      console.log(`\nDone. Renamed ${results.length} file(s).`)
    }
  },
})

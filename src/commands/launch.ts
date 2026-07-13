import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { commandRegistry } from './registry'

const execAsync = promisify(exec)

const OPEN_CMD = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open'

export async function openUrl(url: string): Promise<void> {
  await execAsync(`${OPEN_CMD} "${url}"`)
}

interface LaunchEntry {
  name: string
  url: string
}

const PRESETS: Record<string, LaunchEntry[]> = {
  'dev': [
    { name: 'Dev Server', url: 'http://localhost:5173' },
    { name: 'API Server', url: 'http://localhost:3099' },
    { name: 'GitHub', url: 'https://github.com' },
  ],
}

commandRegistry.register({
  name: 'launch',
  description: 'Open multiple URLs in the default browser',
  async run(args: string[]) {
    let preset = ''
    const urls: string[] = []

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '-p': case '--preset': preset = args[++i]; break
        default: urls.push(args[i]); break
      }
    }

    const entries: LaunchEntry[] = []

    if (preset) {
      const p = PRESETS[preset]
      if (!p) { console.error(`error: unknown preset "${preset}". Available: ${Object.keys(PRESETS).join(', ')}`); process.exit(1) }
      entries.push(...p)
    }

    for (const url of urls) {
      const u = url.startsWith('http') ? url : `https://${url}`
      entries.push({ name: u, url: u })
    }

    if (entries.length === 0) {
      console.error('error: provide URLs or --preset')
      console.error('usage: media-tool launch <url1> <url2> ... [--preset dev]')
      process.exit(1)
    }

    console.log(`Opening ${entries.length} URL(s):`)
    for (const e of entries) {
      console.log(`  ${e.name} -> ${e.url}`)
      try {
        await openUrl(e.url)
      } catch (err) {
        console.error(`  failed: ${(err as Error).message}`)
      }
    }
  },
})

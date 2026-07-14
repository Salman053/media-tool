import path from 'node:path'
import fs from 'node:fs'
import { commandRegistry } from './registry'
import { EffectsOperation, EFFECT_LIST } from '../operations/image/effects'
import { isAvailable } from '../engines/imagemagick'
import type { EffectOpts } from '../engines/imagemagick'

interface EffectsCliArgs {
  input: string
  output?: string
  effect: string
  radius?: number
  sigma?: number
  amount?: number
  threshold?: number
}

export function parseEffectsArgs(args: string[]): EffectsCliArgs {
  const parsed: EffectsCliArgs = { input: '', effect: '' }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        parsed.output = args[++i]
        break
      case '-e':
      case '--effect':
        parsed.effect = args[++i]
        break
      case '--radius':
        parsed.radius = Number.parseFloat(args[++i])
        break
      case '--sigma':
        parsed.sigma = Number.parseFloat(args[++i])
        break
      case '--amount':
        parsed.amount = Number.parseFloat(args[++i])
        break
      case '--threshold':
        parsed.threshold = Number.parseFloat(args[++i])
        break
      default:
        if (!parsed.input) parsed.input = args[i]
    }
  }

  return parsed
}

commandRegistry.register({
  name: 'effects',
  description: 'Apply artistic effects to images (requires ImageMagick)',
  async run(args: string[]) {
    const cli : any = parseEffectsArgs(args)

    if (!cli.input) {
      console.error('error: input file is required')
      process.exit(1)
    }

    if (!fs.existsSync(cli.input)) {
      console.error(`error: input file not found: ${cli.input}`)
      process.exit(1)
    }

    if (!cli.effect) {
      console.error('error: --effect is required')
      console.error('available effects:')
      for (const ef of EFFECT_LIST) {
        console.error(`  ${ef.id}  - ${ef.description}`)
      }
      process.exit(1)
    }

    const effectNames = EFFECT_LIST.map((e) => e.id)
    if (!effectNames.includes(cli.effect)) {
      console.error(`error: unknown effect "${cli.effect}"`)
      console.error('available effects:', effectNames.join(', '))
      process.exit(1)
    }

    if (!(await isAvailable())) {
      console.error('error: ImageMagick is not installed. Install from https://imagemagick.org')
      process.exit(1)
    }

    const output = cli.output ?? path.join(path.dirname(cli.input), `${path.parse(cli.input).name}-${cli.effect}${path.extname(cli.input)}`)
    const operation = new EffectsOperation()

    const options: EffectOpts = {
      effect: cli.effect as EffectOpts['effect'],
      radius: cli.radius,
      sigma: cli.sigma,
      amount: cli.amount,
      threshold: cli.threshold,
    }

    const result = await operation.execute(cli.input, output, options)

    if (result.success) {
      console.log(`effect applied: ${result.inputPath} -> ${result.outputPath}`)
      if (result.duration !== undefined) {
        console.log(`  time: ${result.duration}ms`)
      }
    } else {
      console.error(`error: ${result.error}`)
      process.exit(1)
    }
  },
})

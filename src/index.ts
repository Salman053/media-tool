import { commandRegistry } from './commands/registry'
import { processorRegistry } from './processors/registry'
import { ImageProcessor } from './processors/image/processor'
import { WebpConverter } from './processors/image/formats/webp'

import './commands/convert'

function showHelp(): void {
  console.log(`
media-tool - Convert and process media files

usage:
  media-tool <command> [options]

commands:
  convert   Convert media files between formats

options:
  -o, --output <path>   Output file path
  -f, --format <fmt>    Target format (default: webp)
  -q, --quality <num>   Quality 1-100 (default: 80)
  -h, --help            Show this help

examples:
  media-tool convert image.jpg
  media-tool convert image.png -o output.webp -q 90
  media-tool convert photo.tiff -f webp
  `)
}

const imageProcessor = new ImageProcessor()
imageProcessor.registerFormat(new WebpConverter())
processorRegistry.register(imageProcessor)

const commandName = process.argv[2]
const commandArgs = process.argv.slice(3)

if (!commandName || commandName === '--help' || commandName === '-h') {
  showHelp()
  process.exit(0)
}

const command = commandRegistry.get(commandName)
if (!command) {
  console.error(`error: unknown command "${commandName}"`)
  showHelp()
  process.exit(1)
}

command.run(commandArgs).catch((err: unknown) => {
  console.error('unexpected error:', err)
  process.exit(1)
})

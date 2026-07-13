import { commandRegistry } from './commands/registry'
import { processorRegistry } from './processors/registry'
import { ImageProcessor } from './processors/image/processor'
import { WebpConverter } from './processors/image/formats/webp'

import './commands/convert'
import './commands/resize'
import './commands/effects'
import './commands/thumbnail'
import './commands/video'
import './commands/document'

function showHelp(): void {
  console.log(`
media-tool - Convert and process media files

usage:
  media-tool <command> [options]

commands:
  convert     Convert media files between formats
  resize      Resize images to specific dimensions
  effects     Apply artistic effects (requires ImageMagick)
  thumbnail   Generate square thumbnails (requires ImageMagick)
  video       Process video/audio files (requires FFmpeg)
  document    Convert documents via LibreOffice

options:
  -h, --help            Show this help

use "media-tool <command> --help" for command-specific help
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
